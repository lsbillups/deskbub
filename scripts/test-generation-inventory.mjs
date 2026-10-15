import assert from 'node:assert/strict';
import {loader} from './generation-test-loader.mjs';
let signedIn=true,scope='',projection='',sort='',take=0;
const date='2026-10-15T01:00:00Z';
const records=[{id:'image',kind:'image',payload:{imageUrl:'https://test/original'},status:'succeeded',state:{phase:'saving'},created_at:'2026-10-15T00:00:00Z',acknowledged_at:null},
 ...Array.from({length:5},(_,i)=>({id:'v'+i,kind:'video',payload:{imageUrl:'https://test/processed'+i,action_label:'Action '+i,prompt:'Private model instructions'},status:i<3?'succeeded':'pending',state:{phase:i<3?'saving':i===3?'video_running':'new'},created_at:date,acknowledged_at:i<3?date:null})),
 {id:'other-batch',kind:'video',payload:{imageUrl:'https://test/prior',action_label:'Old'},status:'succeeded',state:{phase:'saving'},created_at:'2026-10-14T00:00:00Z',acknowledged_at:date}];
const chain={select(value){projection=value;return this;},eq(key,value){assert.equal(key,'user_id');scope=value;return this;},order(key,options){sort=key;assert.equal(options.ascending,false);return this;},limit(n){take=n;return Promise.resolve({data:records,error:null});}};
const {listGenerations}=loader({'@/lib/accounts/identity':{resolveDeskBubAccount:async()=>signedIn?{userId:'owner'}:null},'@/lib/supabase/admin':{createAdminClient:()=>({from(table){assert.equal(table,'deskbub_animation_jobs');return chain;}})}})('lib/generation/job-handlers.ts');
let response=await listGenerations();assert.equal(response.status,200);const data=await response.json();
assert.equal(scope,'owner');assert.equal(sort,'created_at');assert.equal(take,100);assert(!projection.includes('result'));
assert.equal(data.jobs.length,3);assert.equal(data.videoJobs.length,5);assert.equal(data.videoJobs.filter(j=>j.status==='succeeded').length,3);assert.equal(data.usedImageUrls.length,6);assert(!JSON.stringify(data).includes('Private model instructions'));
signedIn=false;response=await listGenerations();assert.equal(response.status,401);
console.log(JSON.stringify({inventory_passed:true,account_scoped:true,completed_siblings_counted:true,no_private_prompt_disclosure:true,paid_calls:0}));
