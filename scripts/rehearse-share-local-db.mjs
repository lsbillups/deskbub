// Route + local PostgreSQL rehearsal; auth identities are fixtures, not real user sessions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {loader} from './generation-test-loader.mjs';
const root='D:/ChatGPT/DeskBub',moved=root+'/.private-upgrade/custom-local-supabase-2026-10-22.private.json';
const local=JSON.parse(fs.readFileSync(fs.existsSync(moved)?moved:root+'/.private-upgrade/local-supabase/status.json','utf8'));
assert.ok(['http://127.0.0.1:54321','http://127.0.0.1:15421'].includes(local.API_URL));
const db=createClient(local.API_URL,local.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const uid='share-route-fixture-'+randomUUID();let code;
for(let i=0;i<100;i++){const c=String(Math.floor(Math.random()*1e6)).padStart(6,'0');const r=await db.from('deskbub_accounts').select('user_id').eq('pairing_code',c).maybeSingle();assert.equal(r.error,null);if(!r.data){code=c;break;}}
assert.ok(code);
let identity={userId:uid,clerkUserId:'fixture-user',email:'route-fixture@example.test',pairingCode:code,admin:false};
process.env.DESKBUB_SHARE_CAMPAIGN_ENABLED='1';
const load=loader({'@/lib/share-auth':{shareIdentity:async()=>identity,shareWriteCheck:()=>null},'@/lib/supabase/admin':{createAdminClient:()=>db}});
const customer=load('app/api/share-claims/route.ts'),admin=load('app/api/admin/share-claims/route.ts');
const request=body=>new Request('http://localhost:3043/api/share-claims',{method:'POST',headers:{Origin:'http://localhost:3043','Content-Type':'application/json'},body:JSON.stringify(body)});
const proof={at:new Date().toISOString(),scope:'Route handlers with fixture auth + real isolated PostgreSQL. Does not certify owner browser login.',paidCalls:0};
try{
let r=await db.from('deskbub_accounts').insert({user_id:uid,pairing_code:code});assert.equal(r.error,null);
r=await db.from('subscriptions').insert({user_id:uid,tier:'free',generations_used:0,max_generations:0});assert.equal(r.error,null);
let response=await customer.GET();assert.equal(response.status,200);assert.equal((await response.json()).eligible,true);
const body={platform:'instagram',url:'https://www.instagram.com/reel/Fixture_'+Date.now()+'/',handle:'@fixture',confirmed:true};
response=await customer.POST(request(body));assert.equal(response.status,200,await response.text());
response=await customer.GET();let c=(await response.json()).claim;assert.equal(c.status,'pending');
assert.equal((await admin.GET(new Request('http://localhost:3043/api/admin/share-claims'))).status,403);
const owner={...identity,clerkUserId:'fixture-owner',admin:true};
identity=owner;
response=await admin.GET(new Request('http://localhost:3043/api/admin/share-claims'));assert.equal(response.status,200);assert.ok((await response.json()).claims.some(row=>row.id===c.id));
response=await admin.POST(request({id:c.id,revision:1,decision:'changes_requested',note:'Please include your disclosure.'}));assert.equal(response.status,200);
identity={...owner,admin:false,clerkUserId:'fixture-user'};
response=await customer.GET();assert.equal((await response.json()).claim.review_note,'Please include your disclosure.');
r=await db.from('deskbub_share_claims').update({updated_at:new Date(Date.now()-31000).toISOString()}).eq('id',c.id);assert.equal(r.error,null);
response=await customer.POST(request(body));assert.equal(response.status,200,await response.text());
identity=owner;
const approval={id:c.id,revision:2,decision:'approved',note:'Synthetic local review only.'};
const approvals=await Promise.all([admin.POST(request(approval)),admin.POST(request(approval))]);
for(const response of approvals)assert.equal(response.status,200,await response.text());
identity={...owner,admin:false};
response=await customer.GET();c=(await response.json()).claim;assert.equal(c.status,'approved');
const sub=await db.from('subscriptions').select('tier,generations_used,max_generations').eq('user_id',uid).single();assert.deepEqual(sub.data,{tier:'basic',generations_used:0,max_generations:1});
const rewards=await db.from('deskbub_share_rewards').select('claim_id').eq('user_id',uid);assert.equal(rewards.data.length,1);
proof.submitReturnResubmitApprove=true;proof.concurrentApprovalOneCredit=true;proof.subscription=sub.data;proof.ownerSessionAcceptance='pending';
}finally{
const claims=await db.from('deskbub_share_claims').select('id').eq('user_id',uid);
for(const c of claims.data||[])for(const table of ['deskbub_share_review_log','deskbub_share_rewards']){const r=await db.from(table).delete().eq('claim_id',c.id);assert.equal(r.error,null);}
for(const table of ['deskbub_share_claims','subscriptions','deskbub_accounts']){const r=await db.from(table).delete().eq('user_id',uid);assert.equal(r.error,null);}
proof.fixturesRemoved=true;
}
fs.writeFileSync(root+'/.private-upgrade/share-route-db-rehearsal-2026-10-21.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
