import assert from 'node:assert/strict';
import {loader} from './generation-test-loader.mjs';
const prior={fetch:globalThis.fetch,setTimeout:globalThis.setTimeout,sessionStorage:globalThis.sessionStorage};
const storage=new Map();globalThis.sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
globalThis.setTimeout=fn=>{queueMicrotask(fn);return 0;};
const {progressCounts}=loader()('lib/generation/progress.ts');
let jobs=new Map(),singleStarts=0,newCredits=0,failOnce='',terminal='',imageRecovered=0;
const video=(id,label,status='pending')=>({id,label,status,acked:status==='succeeded',imageUrl:'https://storage.test/cutout-'+id});
const body=j=>({imageUrl:j.imageUrl,actionId:j.id,actionLabel:j.label});
globalThis.fetch=async(url,options={})=>{
 if(url==='/api/generate-video/batch'){
  for(const r of JSON.parse(options.body).requests)jobs.set(r.requestId,{...video(r.requestId,r.actionLabel),imageUrl:r.imageUrl});
  return Response.json({success:true});
 }
 if(url==='/api/generation-jobs')return Response.json({
  jobs:[{id:'cutout',kind:'image',status:'succeeded',requestBody:{imageUrl:'https://storage.test/original'}},... [...jobs.values()].filter(j=>!j.acked&&j.status!=='failed').map(j=>({id:j.id,kind:'video',status:j.status,phase:'new',requestBody:body(j)}))],
  videoJobs:[...jobs.values()].map(j=>({id:j.id,status:j.status,phase:'new',actionLabel:j.label,imageUrl:j.imageUrl})),
  usedImageUrls:[...jobs.values()].map(j=>j.imageUrl),
 });
 if(String(url).endsWith('?ack=1')){jobs.get(String(url).split('/').pop().split('?')[0]).acked=true;return Response.json({success:true});}
 if(url==='/api/generate-video'){singleStarts++;throw Error('Must not start a second task');}
 const id=String(url).split('/').pop();
 if(id==='cutout')return Response.json({success:true,jobId:id,processedUrl:[...jobs.values()][0].imageUrl});
 const j=jobs.get(id);assert(j);
 if(j.label===failOnce){failOnce='';throw Error('Connection interrupted');}
 if(j.label===terminal){j.status='failed';return Response.json({status:'failed',error:'Processing failed'},{status:409});}
 if(j.status!=='succeeded'){j.status='succeeded';newCredits++;}
 return Response.json({success:true,jobId:id,videoUrl:'https://storage.test/video-'+id,actionLabel:j.label});
};
try{
 // Actual five-task failure pattern: 3 delivered videos, 2 remaining, and an
 // unacknowledged photo whose chosen action is already stored on a video task.
 for(let i=0;i<5;i++)jobs.set('v'+i,video('v'+i,['Pant','Tilt','Walk','Tail','Lie'][i],i<3?'succeeded':'pending'));
 let client=loader()('lib/generation/client.ts'),events=[],recovered=[];
 await client.resumePendingGenerations(async x=>{if(x.endpoint.includes('generate-pet'))imageRecovered++;else{recovered.push(x.result);await client.acknowledgeGeneration(x.result.jobId);}},p=>events.push(p));
 assert.equal(progressCounts(events[0]).total,5);assert.equal(progressCounts(events[0]).completed,3);
 assert.equal(recovered.length,2);assert.equal(imageRecovered,0,'Assigned cutouts must not reopen default action selectors');assert.equal(singleStarts,0);assert.equal(newCredits,2);
 assert.equal(progressCounts(events.at(-1)).completed,5);
 // Network loss after a reserved batch: process other saved tasks and recover
 // the paused one by its original ID, preserving labels and existing outputs.
 storage.clear();jobs=new Map();newCredits=0;events=[];recovered=[];failOnce='Walk';
 client=loader()('lib/generation/client.ts');
 const requests=['Pant','Tilt','Walk','Tail','Lie'].map((label,i)=>({imageUrl:'https://storage.test/new-'+i,actionId:'action-'+i,actionLabel:label}));
 await assert.rejects(client.runVideoBatch(requests,async r=>{recovered.push(r);await client.acknowledgeGeneration(r.jobId);},p=>events.push(p)),/interrupted/);
 assert.equal(jobs.size,5);assert.equal(newCredits,4);assert.equal(progressCounts(events.at(-1)).unfinished,1);
 const ids=[...jobs.keys()];storage.clear();client=loader()('lib/generation/client.ts');events=[];
 await client.resumePendingGenerations(async x=>client.acknowledgeGeneration(x.result.jobId),p=>events.push(p));
 assert.deepEqual([...jobs.keys()],ids);assert.equal(newCredits,5);assert.equal(singleStarts,0);assert.equal(progressCounts(events.at(-1)).completed,5);
 // Terminal model failure is shown as a failed item; remaining actions continue.
 storage.clear();jobs=new Map();events=[];newCredits=0;terminal='Tail';client=loader()('lib/generation/client.ts');
 await assert.rejects(client.runVideoBatch(requests,async r=>client.acknowledgeGeneration(r.jobId),p=>events.push(p)),/failed/);
 assert.equal(progressCounts(events.at(-1)).completed,4);assert.equal(progressCounts(events.at(-1)).failed,1);assert.equal(progressCounts(events.at(-1)).unfinished,0);assert.equal(newCredits,4);
 console.log(JSON.stringify({progress_recovery_passed:true,cold_refresh_starts_at_three_of_five:true,original_actions_preserved:true,assigned_photos_not_reselected:true,paused_job_reuses_original_id:true,failed_job_no_charge:true,paid_calls:0}));
}finally{globalThis.fetch=prior.fetch;globalThis.setTimeout=prior.setTimeout;if(prior.sessionStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=prior.sessionStorage;}
