import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {loader} from './generation-test-loader.mjs';
let signedIn=true,starts=0,moderation=true;
process.env.REPLICATE_API_TOKEN='test-only';process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.supabase.co';
const load=loader({
 '@/lib/accounts/identity':{resolveDeskBubAccount:async()=>signedIn?{userId:'account-1'}:null},
 '@/lib/supabase/admin':{createAdminClient:()=>({})},
 '@/lib/creem/moderation':{screenPrompt:async()=>({passed:moderation})},
 './job-store':{SupabaseJobStore:class{async start(user,id,kind,fingerprint,payload){starts++;return {id,user_id:user,kind,state:{phase:'new'},status:'pending',payload};}async startBatch(user,requests){starts+=requests.length;return requests.map(r=>({id:r.id,user_id:user,status:'pending',payload:r.payload}));}}},
});
const {startGeneration,startVideoBatch}=load('lib/generation/job-handlers.ts'),{actionRequest}=load('lib/generation/actions.ts');
const request=body=>new Request('http://local/api/generate-video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const body={requestId:crypto.randomUUID(),imageUrl:'https://project.supabase.co/storage/v1/object/public/pet-photos/processed/account-1/photo.png',...actionRequest('dog',2)};
let result=await startGeneration(request(body),'video');assert.equal(result.status,202);assert.equal(starts,1);
result=await startGeneration(request({...body,actionId:'dog-tail'}),'video');assert.equal(result.status,409);assert.equal(starts,1);
result=await startGeneration(request({...body,actionCatalogVersion:'old'}),'video');assert.equal(result.status,409);assert.equal(starts,1);
result=await startGeneration(request({...body,requestId:'not-a-uuid'}),'video');assert.equal(result.status,400);assert.equal(starts,1);
result=await startGeneration(request({...body,imageUrl:body.imageUrl.replace('account-1','account-2')}),'video');assert.equal(result.status,400);assert.equal(starts,1);
signedIn=false;result=await startGeneration(request(body),'video');assert.equal(result.status,401);assert.equal(starts,1);
signedIn=true;moderation=false;result=await startGeneration(request(body),'video');assert.equal(result.status,400);assert.equal(starts,1);
moderation=true;result=await startGeneration(request({...body,imageUrl:'http://localhost/secret'}),'image');assert.equal(result.status,400);assert.equal(starts,1);
const batchRequests=[body,{...body,requestId:crypto.randomUUID(),...actionRequest('dog',3)}];
result=await startVideoBatch(request({requests:batchRequests}));assert.equal(result.status,200);assert.equal(starts,3);
result=await startVideoBatch(request({requests:[body,body]}));assert.equal(result.status,400);assert.equal(starts,3);
console.log(JSON.stringify({handlers_passed:true,auth_before_start:true,stable_action_and_version_validation:true,account_cutout_validation:true,moderation_before_reservation:true,initial_response_before_paid_step:true,live_api_calls:0}));
