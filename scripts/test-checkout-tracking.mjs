// Provider calls are simulated; --local uses only the loopback Supabase database.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
import { createClient } from '@supabase/supabase-js';

const local = process.argv.includes('--local');
const runtime = resolve('.private-upgrade/checkout-test-runtime');
for (const name of ['lib/pricing','lib/runtime-safety','lib/creem/payments','lib/creem/checkout']) {
  const compiled = ts.transpileModule(await readFile(name+'.ts','utf8'), {
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},
  }).outputText.replace(/from '(\.[^']+)'/g, "from '$1.mjs'");
  const destination=resolve(runtime,name+'.mjs');
  await mkdir(resolve(destination,'..'),{recursive:true});await writeFile(destination,compiled);
}
const {createTrackedCheckout}=await import(pathToFileURL(resolve(runtime,'lib/creem/checkout.mjs')));
const user='sandbox_checkout_'+randomUUID();
const before={user_id:user,tier:'plus',generations_used:5,max_generations:8};
let sql, client, anonymous;
if (local) {
  const credentials=JSON.parse(await readFile('.private-upgrade/local-supabase/status.json','utf8'));
  const url=new URL(credentials.API_URL);assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'54321');
  const options={auth:{persistSession:false,autoRefreshToken:false}};
  client=createClient(url.href,credentials.SERVICE_ROLE_KEY,options);
  anonymous=createClient(url.href,credentials.ANON_KEY,options);
  assert.equal((await client.from('subscriptions').insert(before)).error,null);
} else {
  sql=new PGlite();await sql.exec('create role anon; create role authenticated; create role service_role;');
  for (const file of ['scripts/fixtures/local-supabase-bootstrap.sql',
    'scripts/fixtures/weekend-upgrade-local-only.sql',
    'supabase/migrations/202610100001_historical_payment_review.sql',
    'supabase/migrations/202610100002_checkout_tracking.sql']) await sql.exec(await readFile(file,'utf8'));
  await sql.exec('update deskbub_migration_state set ready=true');
  await sql.query('insert into subscriptions(user_id,tier,generations_used,max_generations) values($1,$2,$3,$4)',Object.values(before));
}
const rpc=async(name,args)=>{
  if (local) return client.rpc(name,args);
  const parameters=name==='deskbub_begin_checkout'
    ? ['p_request_id','p_user_id','p_product_id','p_plan','p_mode','p_amount']
    : ['p_request_id','p_user_id','p_checkout_id','p_checkout_url'];
  assert(['deskbub_begin_checkout','deskbub_complete_checkout'].includes(name));
  try {return {data:(await sql.query(`select ${name}(${parameters.map((_,i)=>'$'+(i+1)).join(',')}) as result`,
    parameters.map(key=>args[key]))).rows[0].result,error:null};}
  catch (error) {return {data:null,error:{message:error.message}};}
};
const row=async id=>{
  if (local) {const r=await client.from('deskbub_checkouts').select('*').eq('request_id',id).maybeSingle();assert.equal(r.error,null);return r.data;}
  return (await sql.query('select * from deskbub_checkouts where request_id=$1',[id])).rows[0]||null;
};
const env={DESKBUB_DATA_ENVIRONMENT:'sandbox',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',
  DESKBUB_SANDBOX_SUPABASE_URL:'http://127.0.0.1:54321',DESKBUB_PRODUCTION_SUPABASE_URL:'https://production.invalid',
  CREEM_API_KEY:'creem_test_synthetic',CREEM_WEBHOOK_SECRET:'synthetic_secret',
  CREEM_BASIC_PRODUCT_ID:'prod_synthetic_basic',CREEM_PLUS_PRODUCT_ID:'prod_synthetic_plus',NEXT_PUBLIC_APP_URL:'https://local.deskbub.com'};
const product={id:env.CREEM_PLUS_PRODUCT_ID,price:999,currency:'USD',billing_type:'onetime',status:'active',mode:'test'};
const beginArgs=id=>({p_request_id:id,p_user_id:user,p_product_id:product.id,p_plan:'plus',p_mode:'test',p_amount:999});
const completeArgs=(id,checkout)=>({p_request_id:id,p_user_id:user,p_checkout_id:checkout,p_checkout_url:'https://creem.io/test/'+checkout});
function provider(options={}) {
  let posts=0;
  const request=async(url,init={})=>{
    assert(url.startsWith('https://test-api.creem.io/v1/'));
    if (init.method!=='POST') return Response.json({...product,...options.product});
    posts++;
    const body=JSON.parse(init.body), stored=await row(body.request_id);
    assert.equal(stored.status,'pending');assert.equal(stored.user_id,user);
    assert.equal(body.metadata.userId,user);
    if (options.fail) throw new Error('Simulated uncertain provider timeout');
    return Response.json({id:'ch_synthetic_'+body.request_id,mode:'test',product:product.id,
      request_id:body.request_id,checkout_url:'https://creem.io/test/'+body.request_id,...options.response},
      {status:options.status||200});
  };
  return {request,posts:()=>posts};
}
let passed=0;const checks=[];
async function check(name,fn){await fn();passed++;checks.push(name);console.log('PASS '+name);}
await check('Ownership is stored before provider POST and checkout ID before returning URL',async()=>{
  const id=randomUUID(),p=provider();const result=await createTrackedCheckout(user,'plus',rpc,env,p.request,id);
  const stored=await row(id);assert.equal(stored.status,'created');assert.equal(stored.checkout_url,result.checkoutUrl);
  assert.equal(stored.checkout_id,'ch_synthetic_'+id);assert.equal(stored.amount,999);assert.equal(p.posts(),1);
});
await check('Database failure before provider POST creates no checkout',async()=>{
  const id=randomUUID(),p=provider();await assert.rejects(createTrackedCheckout(user,'plus',async()=>({data:null,error:{}}),env,p.request,id));
  assert.equal(p.posts(),0);assert.equal(await row(id),null);
});
await check('Provider timeout retains pending correlation and cannot replay the same request',async()=>{
  const id=randomUUID(),p=provider({fail:true});await assert.rejects(createTrackedCheckout(user,'plus',rpc,env,p.request,id));
  assert.equal((await row(id)).status,'pending');await assert.rejects(createTrackedCheckout(user,'plus',rpc,env,p.request,id));
  assert.equal(p.posts(),1);
});
await check('Concurrent attempts with one request ID create only one provider checkout',async()=>{
  const id=randomUUID(),p=provider();
  const results=await Promise.allSettled([1,2].map(()=>createTrackedCheckout(user,'plus',rpc,env,p.request,id)));
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1);assert.equal(p.posts(),1);
  assert.equal((await row(id)).status,'created');
});
await check('Checkout persistence failure withholds URL and retains pending intent',async()=>{
  const id=randomUUID(),p=provider();const broken=async(name,args)=>name==='deskbub_complete_checkout'?{data:null,error:{}}:rpc(name,args);
  await assert.rejects(createTrackedCheckout(user,'plus',broken,env,p.request,id));assert.equal((await row(id)).status,'pending');
});
await check('Wrong product, amount, mode or inactive SKU never creates a checkout',async()=>{
  for (const invalid of [{id:'wrong'},{price:499},{currency:'EUR'},{mode:'prod'},{status:'archived'},{billing_type:'recurring'}]) {
    const id=randomUUID(),p=provider({product:invalid});await assert.rejects(createTrackedCheckout(user,'plus',rpc,env,p.request,id));
    assert.equal(p.posts(),0);assert.equal(await row(id),null);
  }
});
await check('Wrong response ownership context and insecure checkout URLs are not returned',async()=>{
  for (const invalid of [{id:''},{mode:'prod'},{product:'wrong'},{request_id:randomUUID()},
    {request_id:undefined},{request_id:undefined,metadata:{userId:'wrong'}},{metadata:{userId:'wrong'}},
    {checkout_url:'http://creem.io/test'},{checkout_url:'https://user:password@creem.io/test'}]) {
    const id=randomUUID(),p=provider({response:invalid});await assert.rejects(createTrackedCheckout(user,'plus',rpc,env,p.request,id));
    assert.equal((await row(id)).status,'pending');
  }
});
await check('Successful response also accepts expanded product object',async()=>{
  const id=randomUUID(),p=provider({response:{product:{id:product.id}}});await createTrackedCheckout(user,'plus',rpc,env,p.request,id);
  assert.equal((await row(id)).status,'created');
});
await check('Real Creem response may omit request_id while echoing matching account metadata',async()=>{
  const id=randomUUID(),p=provider({response:{request_id:undefined,metadata:{userId:user}}});
  await createTrackedCheckout(user,'plus',rpc,env,p.request,id);
  assert.equal((await row(id)).status,'created');
});
await check('Legacy products and live key in sandbox are rejected before provider access',async()=>{
  let external=0;const request=async()=>{external++;throw new Error('Must not call provider');};
  for (const changed of [{CREEM_PLUS_PRODUCT_ID:'prod_3plVm23uj3TPfXW0XpdaMo'},{CREEM_API_KEY:'creem_live_synthetic'}]) {
    await assert.rejects(createTrackedCheckout(user,'plus',rpc,{...env,...changed},request));
  }
  assert.equal(external,0);
});
await check('Request ownership conflict and duplicate checkout IDs cannot overwrite original links',async()=>{
  const id=randomUUID(),checkout='ch_unique_'+id;assert.equal((await rpc('deskbub_begin_checkout',beginArgs(id))).error,null);
  assert((await rpc('deskbub_begin_checkout',{...beginArgs(id),p_plan:'basic',p_amount:299})).error);
  assert((await rpc('deskbub_begin_checkout',{...beginArgs(randomUUID()),p_product_id:'prod_3plVm23uj3TPfXW0XpdaMo'})).error);
  assert((await rpc('deskbub_complete_checkout',{...completeArgs(id,checkout),p_user_id:'someone_else'})).error);
  assert.equal((await rpc('deskbub_complete_checkout',completeArgs(id,checkout))).error,null);
  assert.equal((await rpc('deskbub_complete_checkout',completeArgs(id,checkout))).error,null);
  assert((await rpc('deskbub_complete_checkout',completeArgs(id,'different_checkout'))).error);
  const second=randomUUID();await rpc('deskbub_begin_checkout',beginArgs(second));
  assert((await rpc('deskbub_complete_checkout',completeArgs(second,checkout))).error);
  assert.equal((await row(second)).status,'pending');assert.equal((await row(id)).checkout_id,checkout);
});
await check('Anonymous clients cannot inspect checkout ownership or call recording RPCs',async()=>{
  if (local) {
    assert((await anonymous.from('deskbub_checkouts').select('request_id')).error);
    assert((await anonymous.rpc('deskbub_begin_checkout',beginArgs(randomUUID()))).error);
    assert((await anonymous.rpc('deskbub_complete_checkout',completeArgs(randomUUID(),'anon'))).error);
  } else {
    await sql.exec('set role anon');
    try {
      await assert.rejects(sql.query('select * from deskbub_checkouts'),/permission denied/);
      assert((await rpc('deskbub_begin_checkout',beginArgs(randomUUID()))).error);
      assert((await rpc('deskbub_complete_checkout',completeArgs(randomUUID(),'anon'))).error);
    } finally {await sql.exec('reset role');}
  }
});
await check('All checkout attempts preserve subscription usage and total credits',async()=>{
  let actual;
  if (local) {const r=await client.from('subscriptions').select('user_id,tier,generations_used,max_generations').eq('user_id',user).single();assert.equal(r.error,null);actual=r.data;}
  else actual=(await sql.query('select user_id,tier,generations_used,max_generations from subscriptions where user_id=$1',[user])).rows[0];
  assert.deepEqual(actual,before);
});
await writeFile(resolve('.private-upgrade',local?'local-supabase/checkout-tracking-verification.json':'checkout-tracking-verification.json'),
  JSON.stringify({verifiedAt:new Date().toISOString(),passed,checks,localPostgres:local,providerSimulated:true,productionWrites:false},null,2)+'\n');
if(sql)await sql.close();
console.log(`Verified ${passed} checkout tracking checks; external payments and production writes: zero.`);
