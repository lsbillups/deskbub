import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {loader} from './generation-test-loader.mjs';
const {normalizeSharePost,shareCampaignEnabled}=loader()('lib/share-claims.ts');
assert.equal(normalizeSharePost('x','https://twitter.com/owner/status/123456?utm_source=a').postId,'123456');
assert.equal(normalizeSharePost('x','https://x.com/i/web/status/123456').url,'https://x.com/i/web/status/123456');
assert.equal(normalizeSharePost('instagram','https://www.instagram.com/reel/Abc_12-/?igsh=x').postId,'Abc_12-');
assert.equal(normalizeSharePost('tiktok','https://www.tiktok.com/@owner/video/123456').platform,'tiktok');
for(const [platform,url] of [['x','https://x.com.attacker.test/owner/status/123456'],['x','http://x.com/owner/status/123456'],['x','https://user:pass@x.com/owner/status/123456'],['x','https://x.com:999/owner/status/123456'],['tiktok','https://vm.tiktok.com/abc123'],['instagram','https://www.instagram.com/stories/owner/123456/'],['instagram','https://www.instagram.com/owner/']])assert.throws(()=>normalizeSharePost(platform,url));
assert.equal(shareCampaignEnabled({}),false);
let user=null,account=null;
const {shareIdentity,shareWriteCheck}=loader({
 '@clerk/nextjs/server':{currentUser:async()=>user},
 '@/lib/accounts/identity':{resolveDeskBubAccount:async()=>account}
})('lib/share-auth.ts');
process.env.DESKBUB_SHARE_ADMIN_EMAILS='lsbillups@gmail.com';process.env.DESKBUB_SHARE_CAMPAIGN_ENABLED='1';process.env.NEXT_PUBLIC_APP_URL='http://localhost:3043';
assert.equal(await shareIdentity(),null);
account={userId:'a',clerkUserId:'clerk-a',pairingCode:'123456'};
user={id:'clerk-a',emailAddresses:[{id:'email',emailAddress:'lsbillups@gmail.com',verification:{status:'unverified'}}]};
await assert.rejects(()=>shareIdentity(),/Verify/);
user.emailAddresses[0].verification.status='verified';assert.equal((await shareIdentity()).admin,true);
user.emailAddresses[0].emailAddress='other@example.com';assert.equal((await shareIdentity()).admin,false);
assert.equal(shareWriteCheck(new Request('http://localhost:3043/api/share-claims',{headers:{origin:'http://evil.test'}})),'Please submit from DeskBub.');
assert.equal(shareWriteCheck(new Request('http://localhost:3043/api/share-claims',{headers:{origin:'http://localhost:3043'}})),null);
process.env.DESKBUB_SHARE_CAMPAIGN_ENABLED='0';assert.match(shareWriteCheck(new Request('http://localhost:3043/api/share-claims')),/not open/);
let touches=0;
for(const identity of [null,{admin:false}]){
const route=loader({'@/lib/share-auth':{shareIdentity:async()=>identity,shareWriteCheck:()=>null},'@/lib/supabase/admin':{createAdminClient:()=>{touches++;throw Error('Database must not be reached');}}})('app/api/admin/share-claims/route.ts');
assert.equal((await route.GET(new Request('http://localhost:3043/api/admin/share-claims'))).status,identity?403:401);
assert.equal((await route.POST(new Request('http://localhost:3043/api/admin/share-claims',{method:'POST'}))).status,identity?403:401);
}assert.equal(touches,0);
const db=new PGlite();
await db.exec("create role anon;create role authenticated;create role service_role;create table deskbub_accounts(user_id text primary key);create table subscriptions(user_id text primary key,tier text,generations_used integer,max_generations integer);create table deskbub_purchase_receipts(user_id text);create table generated_pets(user_id text);create table pet_data(user_id text);create table deskbub_animation_jobs(user_id text);create table daily_unlocks(user_id text);");
await db.exec(fs.readFileSync('supabase/migrations/202610210001_share_claims.sql','utf8'));
const query=async(sql,args=[])=>db.query(sql,args);
const scalar=async(sql,args=[])=>Object.values((await query(sql,args)).rows[0])[0];
async function add(id){await query('insert into deskbub_accounts values($1)',[id]);await query("insert into subscriptions values($1,'free',0,0)",[id]);}
async function submit(id,post){return scalar("select deskbub_submit_share($1,$2,'x',$3,$4,'@tester')",[id,id+'@example.test',post,'https://x.com/i/web/status/'+post]);}
async function review(c,decision='approved',note=''){return scalar('select deskbub_review_share($1,$2,$3,$4,$5)',[c.id,'owner',decision,note,c.revision]);}
await add('fresh');let c=await submit('fresh','123456');assert.equal(c.status,'pending');
await assert.rejects(()=>submit('fresh','654321'),/waiting/);
await add('duplicate');await assert.rejects(()=>submit('duplicate','123456'),/unique/);
await assert.rejects(()=>review(c,'changes_requested',''),/reason/);
let returned=await review(c,'changes_requested','Please show the demo and disclosure.');
assert.equal(returned.status,'changes_requested');assert.equal(await scalar('select count(*)::integer from deskbub_share_rewards'),0);
await query("update deskbub_share_claims set updated_at=now()-interval '31 seconds' where id=$1",[c.id]);
c=await submit('fresh','654321');assert.equal(c.revision,2);assert.equal(c.review_note,null);
await assert.rejects(()=>review({...c,revision:1}),/changed/);
const results=await Promise.all([review(c),review(c)]);assert.equal(results[0].status,'approved');assert.equal(results[1].status,'approved');
assert.equal(await scalar('select count(*)::integer from deskbub_share_rewards'),1);
assert.deepEqual((await query("select tier,generations_used,max_generations from subscriptions where user_id='fresh'")).rows[0],{tier:'basic',generations_used:0,max_generations:1});
await assert.rejects(()=>submit('fresh','999999'),/pilot/);
await add('became-paid');const race=await submit('became-paid','987654');
await query("update subscriptions set tier='plus',generations_used=2,max_generations=8 where user_id='became-paid'");
await query("insert into pet_data values('became-paid')");
await assert.rejects(()=>review(race),/Account now has a plan/);
assert.deepEqual((await query("select tier,generations_used,max_generations from subscriptions where user_id='became-paid'")).rows[0],{tier:'plus',generations_used:2,max_generations:8});
assert.equal(await scalar("select status from deskbub_share_claims where id=$1",[race.id]),'pending');
assert.equal(await scalar("select count(*)::integer from pet_data where user_id='became-paid'"),1);
await add('rollback');const rollback=await submit('rollback','888888');
await db.exec("alter table deskbub_share_review_log add constraint simulate_failure check(not(actor='fail-log' and action='approved'));");
await assert.rejects(()=>scalar('select deskbub_review_share($1,$2,$3,$4,$5)',[rollback.id,'fail-log','approved','',1]),/simulate_failure/);
assert.equal(await scalar("select tier from subscriptions where user_id='rollback'"),'free');
assert.equal(await scalar('select count(*)::integer from deskbub_share_rewards'),1);
assert.equal(await scalar('select status from deskbub_share_claims where id=$1',[rollback.id]),'pending');
for(const role of ['anon','authenticated']){
await db.exec('set role '+role);
await assert.rejects(()=>query('select * from deskbub_share_claims'),/permission denied/);
await assert.rejects(()=>query("select deskbub_share_eligible('fresh')"),/permission denied/);
await db.exec('reset role');
}
await db.close();
console.log(JSON.stringify({passed:true,publicURLAllowlist:true,verifiedAdminOnly:true,CSRF:true,adminRoutesFailClosed:true,manualReview:true,returnAndResubmit:true,staleReviewBlocked:true,idempotentGrant:true,transactionRollback:true,paidCreditsAndPetsPreserved:true,RLS:true,paidCalls:0}));
