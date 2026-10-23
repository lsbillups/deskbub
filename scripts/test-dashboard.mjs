import assert from 'node:assert/strict';
import {loader} from './generation-test-loader.mjs';
const load=loader(),{buildPetDashboard}=load('lib/dashboard.ts');
const origin='http://127.0.0.1:54321',url=name=>origin+'/storage/v1/object/public/pet-photos/'+name;
const photo=url('original/user/photo.png'),cut=url('processed/user/cut.png'),video=url('videos/user/one.webm'),old=url('videos/user/old.webm');
const imageJob={kind:'image',status:'succeeded',created_at:'2026-10-21T10:00:00Z',payload:{imageUrl:photo},result:{processedUrl:cut}};
const videoJob={kind:'video',status:'succeeded',created_at:'2026-10-21T10:02:00Z',payload:{imageUrl:cut,action_label:'Walking'},result:{videoUrl:video,actionLabel:'Walking'}};
const base={subscription:{tier:'plus',generations_used:2,max_generations:8},collection:{status:'draft',videos:[]},jobs:[videoJob,imageJob],legacy:[],pairingCode:'123456',storageOrigin:origin,staging:true,truncated:false};
let data=buildPetDashboard(base);assert.equal(data.videos.length,1);assert.equal(data.videos[0].status,'draft');assert.equal(data.videos[0].photoUrl,photo);assert.match(data.videos[0].downloadUrl,/download=deskbub-pet.webm/);assert.equal(data.finalized,false);
data=buildPetDashboard({...base,collection:{status:'finalized',videos:[{url:video,label:'Chosen action'}]},jobs:[videoJob,{...videoJob,result:{videoUrl:old,actionLabel:'Unselected'}},imageJob]});
assert.equal(data.finalized,true);assert.equal(data.videos.length,2);assert.equal(data.videos[0].label,'Chosen action');assert.equal(data.videos[0].status,'confirmed');assert.equal(data.videos[1].status,'unselected');assert.equal(data.max-data.used,6);
data=buildPetDashboard({...base,collection:null,jobs:[],legacy:[{video_url:video,action_label:'Legacy pet'}]});assert.equal(data.finalized,true);assert.equal(data.videos[0].status,'confirmed');
data=buildPetDashboard({...base,jobs:[{...videoJob,status:'pending'},{...imageJob,status:'uncertain'},{...videoJob,status:'failed'}]});assert.equal(data.activeTasks,1);assert.equal(data.reviewTasks,1);assert.equal(data.failedTasks,1);assert.equal(data.videos.length,0);
data=buildPetDashboard({...base,jobs:[{...videoJob,result:{videoUrl:'https://foreign.example/pet.webm'}}]});assert.equal(data.videos.length,0);
data=buildPetDashboard({...base,staging:false});assert.equal(data.videos.length,0,'HTTP storage is test-only');
assert.throws(()=>buildPetDashboard({...base,subscription:{tier:'free',generations_used:1,max_generations:0}}));
// Route verifies the account before any query and scopes every table to that user.
let signedIn=false,queries=[],dbError=false;
const route=loader({
 '@/lib/accounts/identity':{resolveDeskBubAccount:async()=>signedIn?{userId:'account-one',pairingCode:'123456'}:null},
 '@/lib/dashboard':{buildPetDashboard},
 '@/lib/supabase/admin':{createAdminClient:()=>({from(table){const row={table,scoped:false};queries.push(row);const q={select(){return q;},eq(key,value){assert.equal(key,'user_id');assert.equal(value,'account-one');row.scoped=true;return q;},order(){return q;},limit(){return q;},single(){return q;},maybeSingle(){return q;},then(resolve,reject){assert.equal(row.scoped,true);return Promise.resolve({error:dbError?{message:'Fixture error'}:null,data:table==='subscriptions'?base.subscription:table==='deskbub_animation_collections'?base.collection:table==='deskbub_animation_jobs'?base.jobs:[]}).then(resolve,reject);}};return q;}})},
})('app/api/dashboard/route.ts');
process.env.NEXT_PUBLIC_SUPABASE_URL=origin;process.env.DESKBUB_CUSTOM_STAGING='1';
let response=await route.GET();assert.equal(response.status,401);assert.equal(queries.length,0);
signedIn=true;response=await route.GET();assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private, no-store/);assert.equal((await response.json()).videos.length,1);assert.equal(queries.length,4);
dbError=true;response=await route.GET();assert.equal(response.status,503);assert.match((await response.json()).error,/preserved/);
console.log(JSON.stringify({passed:true,draftAndFinalized:true,remainingCreditsSeparateFromLock:true,originalPhotoMapping:true,legacyFallback:true,taskStates:true,storageAllowlist:true,authenticationAndAccountIsolation:true,dbFailureNotEmpty:true,paidCalls:0}));
