// Runs in ephemeral PGlite; no production APIs, customer media downloads or external payments.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHmac } from 'node:crypto';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

const runtime = resolve('.private-upgrade/historical-test-runtime');
for (const name of ['lib/pricing','lib/runtime-safety','lib/creem/payments','lib/creem/webhook']) {
  const source = await readFile(name + '.ts', 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
    .replace(/from '(\.[^']+)'/g, "from '$1.mjs'");
  const dest = resolve(runtime, name + '.mjs');
  await mkdir(resolve(dest, '..'), {recursive:true}); await writeFile(dest, compiled);
}
const {handleCreemWebhook} = await import(pathToFileURL(resolve(runtime,'lib/creem/webhook.mjs')));
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;`);
await db.exec(await readFile('scripts/fixtures/local-supabase-bootstrap.sql','utf8'));
await db.exec(await readFile('scripts/fixtures/weekend-upgrade-local-only.sql','utf8'));
await db.exec(await readFile('supabase/migrations/202610100001_historical_payment_review.sql','utf8'));
const one = async (sql, args=[]) => (await db.query(sql,args)).rows[0];
const review = (event,order,user='synthetic_paid',product='prod_3plVm23uj3TPfXW0XpdaMo') =>
  one('select deskbub_quarantine_purchase($1,$2,$3,$4) as result',[event,order,user,product]);
const grant = (event,order,user='synthetic_paid',tier='plus',credits=8) =>
  one('select deskbub_grant_purchase($1,$2,$3,$4,$5) as result',[event,order,user,tier,credits]);
const env = {DESKBUB_DATA_ENVIRONMENT:'sandbox',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',
  DESKBUB_SANDBOX_SUPABASE_URL:'http://127.0.0.1:54321', DESKBUB_PRODUCTION_SUPABASE_URL:'https://production.invalid',
  CREEM_API_KEY:'creem_test_synthetic', CREEM_WEBHOOK_SECRET:'synthetic-historical-test-secret',
  CREEM_BASIC_PRODUCT_ID:'prod_synthetic_new_basic', CREEM_PLUS_PRODUCT_ID:'prod_synthetic_new_plus'};
let calls=0;
const rpc = async(name,args) => {
  calls++;
  try {
    const result = name === 'deskbub_quarantine_purchase'
      ? await review(args.p_event_id,args.p_order_id,args.p_user_id,args.p_product_id)
      : await grant(args.p_event_id,args.p_order_id,args.p_user_id,args.p_tier,args.p_credits);
    return {data:result.result,error:null};
  } catch {return {data:null,error:{message:'Synthetic RPC failure'}};}
};
const event = (id,order,user='synthetic_paid',product='prod_3plVm23uj3TPfXW0XpdaMo') =>
  ({id,eventType:'checkout.completed',object:{status:'completed',mode:'test',order:{id:order,status:'paid',product,mode:'test'},product:{id:product},metadata:user ? {userId:user} : {}}});
const post = async(body,options={}) => {
  const raw=JSON.stringify(body);
  const signature=createHmac('sha256',env.CREEM_WEBHOOK_SECRET).update(raw).digest('hex');
  return handleCreemWebhook(raw, options.unsigned ? null : signature, options.rpc || rpc, options.env || env);
};
let passed=0; const checks=[];
async function check(name,fn) {await fn();passed++;checks.push(name);console.log('PASS '+name);}
await db.exec("insert into subscriptions(user_id,tier,generations_used,max_generations) values('synthetic_paid','plus',5,8)");
await check('Signed old SKU delivery is stored during maintenance without granting',async()=>{
  const result=await post(event('historical_evt','historical_order'));
  assert.equal(result.status,200); assert.equal(result.body.pendingReview,true);
  assert.deepEqual(await one("select generations_used,max_generations from subscriptions where user_id='synthetic_paid'"),{generations_used:5,max_generations:8});
  assert.equal((await one('select count(*)::int as n from deskbub_purchase_receipts')).n,0);
});
await check('Repeated and changed event IDs preserve credits and record unique deliveries',async()=>{
  await post(event('historical_evt','historical_order')); await post(event('historical_retry','historical_order'));
  assert.equal((await one('select count(*)::int as n from deskbub_historical_deliveries')).n,2);
  assert.equal((await one("select max_generations from subscriptions where user_id='synthetic_paid'")).max_generations,8);
});
await check('Missing old account metadata is retained without creating an account or a receipt',async()=>{
  assert.equal((await post(event('missing_owner_evt','missing_owner_order',null))).status,200);
  assert.equal((await one("select user_id from deskbub_historical_orders where order_id='missing_owner_order'")).user_id,null);
  assert.equal((await one('select count(*)::int as n from subscriptions')).n,1);
});
await check('Unknown in-flight old checkout is retained for review rather than lost or credited',async()=>{
  assert.equal((await post(event('inflight_evt','inflight_order','unmapped_old_account'))).status,200);
  assert.equal((await one("select source from deskbub_historical_orders where order_id='inflight_order'")).source,'verified_webhook');
});
await check('Invalid signatures cannot write historical records',async()=>{
  const before=calls; assert.equal((await post(event('unsigned','unsigned'),{unsigned:true})).status,401); assert.equal(calls,before);
});
await check('Wrong mode and inconsistent product cannot reach database',async()=>{
  const before=calls, body=event('bad_mode','bad_mode'); body.object.order.mode='prod';
  assert.equal((await post(body)).status,503);
  const mismatch=event('bad_product','bad_product'); mismatch.object.order.product='other';
  assert.equal((await post(mismatch)).status,503); assert.equal(calls,before);
});
await check('Failed or unconfirmed persistence is not acknowledged',async()=>{
  const body=event('db_failure','db_failure');
  for (const result of [{data:null,error:{message:'failure'}},{data:null,error:null},{data:{duplicate:false},error:null}]) {
    assert.equal((await post(body,{rpc:async()=>result})).status,503);
  }
});
await db.exec('update deskbub_migration_state set ready=true');
await check('New SKU purchases still grant once and never reset usage',async()=>{
  const body=event('new_evt','new_order','synthetic_paid','prod_synthetic_new_plus');
  assert.equal((await post(body)).status,200); assert.equal((await post({...body,id:'new_retry'})).status,200);
  assert.deepEqual(await one("select generations_used,max_generations from subscriptions where user_id='synthetic_paid'"),{generations_used:5,max_generations:16});
});
await check('Database guard prevents historical orders being sent through the grant RPC',()=>
  assert.rejects(grant('bypass','historical_order'),/requires review/));
await check('Owner and event identity conflicts roll back without overwriting records',async()=>{
  await assert.rejects(review('conflict','historical_order','someone_else'),/identity conflict/);
  await assert.rejects(review('historical_evt','another_order'),/event identity conflict/);
  assert.equal((await one("select count(*)::int as n from deskbub_historical_orders where order_id='another_order'")).n,0);
  assert.equal((await one("select user_id from deskbub_historical_orders where order_id='historical_order'")).user_id,'synthetic_paid');
});
await check('Anonymous clients cannot read review data or call the review RPC',async()=>{
  await db.exec('set role anon');
  try {
    await assert.rejects(db.query('select * from deskbub_historical_orders'),/permission denied/);
    await assert.rejects(db.query('select * from deskbub_historical_deliveries'),/permission denied/);
    await assert.rejects(review('anon_evt','anon_order'),/permission denied/);
  } finally {await db.exec('reset role');}
});

// Real customer metadata stays in process memory and ignored private evidence files.
if(process.argv.includes('--webhook-only')){
  await db.close();
  await writeFile('.private-upgrade/webhook-only-verification.json',JSON.stringify({at:new Date().toISOString(),passed,checks,productionWritesPerformed:false,modelSpend:0,customerSnapshotReplay:'not included'},null,2));
  console.log(passed+' webhook checks passed. Customer snapshot replay excluded; no production writes or provider calls.');
  process.exit(0);
}
const audit=JSON.parse(await readFile('.private-upgrade/customer-entitlement-review.json','utf8'));
assert.equal(audit.inventoryFilename,audit.inventoryFilename.split(/[\\/]/).at(-1));
const inventory=JSON.parse(await readFile(resolve('.private-upgrade',audit.inventoryFilename),'utf8'));
await check('All eight inventoried orders are guarded without modifying balances or approving receipts',async()=>{
  for (const row of audit.historical_order_guards) {
    await db.query('insert into deskbub_historical_orders(order_id,product_id,user_id,classification,source) values($1,$2,$3,$4,$5)',
      [row.order_id,row.product_id,row.user_id,row.classification,row.source]);
  }
  for (const customer of audit.customers) {
    const sub=customer.subscription;
    await db.query('insert into subscriptions(user_id,tier,generations_used,max_generations) values($1,$2,$3,$4)',[sub.user_id,sub.tier,sub.generations_used,sub.max_generations]);
    for (const key of customer.email_keys) await db.query('insert into deskbub_legacy_claims(email_key,user_id) values($1,$2)',[key,sub.user_id]);
    for (const work of inventory.tables.pet_data.filter(row=>row.user_id===sub.user_id)) {
      await db.query('insert into pet_data(id,user_id,pairing_code,video_url,processed_url,action_label) values($1,$2,$3,$4,$5,$6)',[work.id,work.user_id,work.pairing_code,work.video_url,work.processed_url,work.action_label]);
    }
  }
});
await check('Six customer identity restorations and old callback replays preserve balances, works and pairing',async()=>{
  for (let i=0;i<audit.customers.length;i++) {
    const c=audit.customers[i];
    const beforeSub=await one('select * from subscriptions where user_id=$1',[c.user_id]);
    const beforeWorks=(await db.query('select * from pet_data where user_id=$1 order by id',[c.user_id])).rows;
    const claim=()=>one('select deskbub_resolve_identity($1,$2,$3,false) as result',['historical-rehearsal','synthetic_new_identity_'+i,c.email_keys]);
    const first=(await claim()).result; assert.equal(first.userId,c.user_id);
    if(c.saved_pairing_code) assert.equal(first.pairingCode,c.saved_pairing_code);
    else assert.equal(first.pairingCode,(await one('select deskbub_old_pairing_code($1) as code',[c.user_id])).code);
    assert.deepEqual((await claim()).result,first);
    const guard=audit.historical_order_guards.find(row=>row.order_id===c.order_id);
    for (const suffix of ['initial','initial','retry']) {
      const result=await post(event('synthetic_replay_'+i+'_'+suffix,c.order_id,c.user_id,guard.product_id));
      assert.equal(result.status,200);assert.equal(result.body.pendingReview,true);
    }
    assert.deepEqual(await one('select * from subscriptions where user_id=$1',[c.user_id]),beforeSub);
    assert.deepEqual((await db.query('select * from pet_data where user_id=$1 order by id',[c.user_id])).rows,beforeWorks);
    await assert.rejects(grant('synthetic_bypass_'+i,c.order_id,c.user_id,c.subscription.tier,c.subscription.max_generations),/requires review/);
  }
});
await db.close();
await writeFile('.private-upgrade/historical-payment-verification.json',JSON.stringify({at:new Date().toISOString(),passed,checks,
  customerRehearsal:{count:audit.customers.length,snapshotAt:audit.inventoryCapturedAt,preserved:true},
  productionWritesPerformed:false,modelSpend:0,limitations:['In-memory PostgreSQL rehearsal; real concurrent connections and HTTP route verification are separate checks.']},null,2));
console.log(passed+' historical payment checks passed. No production writes or provider calls.');
