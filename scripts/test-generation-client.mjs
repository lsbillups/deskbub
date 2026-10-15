import assert from 'node:assert/strict';
import { loader } from './generation-test-loader.mjs';
const previous={fetch:globalThis.fetch,setTimeout:globalThis.setTimeout,sessionStorage:globalThis.sessionStorage};
const values=new Map();let calls=[],lostInitial=false,lostResume=false,posts=0;
const jobs=new Map();
globalThis.sessionStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
globalThis.setTimeout=(fn)=>{queueMicrotask(fn);return 0;};
globalThis.fetch=async(url,options={})=>{
 if(url==='/api/generation-jobs')return new Response(JSON.stringify({jobs:[...jobs].filter(([,j])=>!j.acked).map(([id,j])=>({id,kind:'video',requestBody:j.body}))}),{headers:{'Content-Type':'application/json'}});
 if(String(url).endsWith('?ack=1')){const id=String(url).split('/').pop().split('?')[0];jobs.get(id).acked=true;return new Response('{"success":true}');}
 const body=JSON.parse(options.body),initial=!String(url).includes('/generation-jobs/'),id=initial?body.requestId:String(url).split('/').pop();
 calls.push({initial,id});
 if(initial){
  if(!jobs.has(id)){jobs.set(id,{steps:0,body});posts++;}
  if(lostInitial){lostInitial=false;throw Error('Response lost after job save');}
 }else if(lostResume){lostResume=false;throw Error('Connection lost while querying saved prediction');}
 const job=jobs.get(id);if(!job)return new Response('{}',{status:404});
 const ready=job.steps++>=2;
 return new Response(JSON.stringify(ready?{success:true,jobId:id,videoUrl:'https://storage.invalid/'+id,actionLabel:'Walking in place'}:{jobId:id,status:'processing'}),{status:ready?200:202,headers:{'Content-Type':'application/json'}});
};
try {
 let client=loader()('lib/generation/client.ts');
 const body={imageUrl:'https://storage.invalid/image-1',actionId:'dog-walk'};
 const [a,b]=await Promise.all([client.runGeneration('/api/generate-video',body),client.runGeneration('/api/generate-video',body)]);
 assert.equal(a.videoUrl,b.videoUrl);assert.equal(posts,1);assert.equal(calls.filter(c=>c.initial).length,1);
 await client.acknowledgeGeneration(a.jobId);
 lostInitial=true;const second={...body,imageUrl:'https://storage.invalid/image-2'};
 await assert.rejects(client.runGeneration('/api/generate-video',second),/lost/);
 const created=posts;client=loader()('lib/generation/client.ts');
 await client.resumePendingGenerations(async({result})=>client.acknowledgeGeneration(result.jobId));assert.equal(posts,created);
 lostResume=true;const third={...body,imageUrl:'https://storage.invalid/image-3'};
 await assert.rejects(client.runGeneration('/api/generate-video',third),/lost/);
 const afterInterrupt=posts;client=loader()('lib/generation/client.ts');
 let recovered=0;await client.resumePendingGenerations(async({result})=>{recovered++;await client.acknowledgeGeneration(result.jobId);});assert.equal(recovered,1);assert.equal(posts,afterInterrupt);
 // Closing the entire tab loses sessionStorage; the account's unacknowledged
 // result still resumes without a second paid task.
 const fourth={...body,imageUrl:'https://storage.invalid/image-4'};
 await client.runGeneration('/api/generate-video',fourth);const beforeClose=posts;values.clear();
 client=loader()('lib/generation/client.ts');recovered=0;
 await client.resumePendingGenerations(async({result})=>{recovered++;await client.acknowledgeGeneration(result.jobId);});
 assert.equal(recovered,1);assert.equal(posts,beforeClose);
 // Even a repeated click after success revalidates the existing ID, not a new job.
 await client.runGeneration('/api/generate-video',fourth);assert.equal(posts,beforeClose);
 console.log(JSON.stringify({client_passed:true,concurrent_click_deduplication:true,lost_initial_response_same_request:true,refresh_resume_same_request:true,completed_result_same_job:true,live_api_calls:0}));
} finally {
 globalThis.fetch=previous.fetch;globalThis.setTimeout=previous.setTimeout;
 if(previous.sessionStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=previous.sessionStorage;
}
