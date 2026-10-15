import assert from 'node:assert/strict';
import {loader} from './generation-test-loader.mjs';
const prior={fetch:globalThis.fetch,setTimeout:globalThis.setTimeout,sessionStorage:globalThis.sessionStorage};
const storage=new Map(),jobs=new Map();let loseResponse=true,rejectBatch=false,initialSingles=0;
globalThis.sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
globalThis.setTimeout=fn=>{queueMicrotask(fn);return 0;};
globalThis.fetch=async(url,options={})=>{
 if(url==='/api/generate-video/batch'){
  if(rejectBatch)return Response.json({error:'Insufficient allowance'},{status:409});
  for(const body of JSON.parse(options.body).requests)if(!jobs.has(body.requestId))jobs.set(body.requestId,{body});
  if(loseResponse){loseResponse=false;throw Error('Batch response lost');}
  return Response.json({success:true});
 }
 if(url==='/api/generation-jobs')return Response.json({jobs:[...jobs].filter(([,j])=>!j.acked).map(([id,j])=>({id,kind:'video',requestBody:j.body}))});
 if(String(url).endsWith('?ack=1')){jobs.get(String(url).split('/').pop().split('?')[0]).acked=true;return Response.json({success:true});}
 if(url==='/api/generate-video'){initialSingles++;throw Error('Batch requests must not fall back to individual starts');}
 const id=String(url).split('/').pop();assert.ok(jobs.has(id));return Response.json({success:true,jobId:id,videoUrl:'https://storage.test/'+id});
};
try{
 let client=loader()('lib/generation/client.ts');
 const requests=Array.from({length:5},(_,i)=>({imageUrl:'https://storage.test/photo',actionId:'dog-'+i}));
 await assert.rejects(client.runVideoBatch(requests,async()=>{}),/lost/);assert.equal(jobs.size,5);
 storage.clear();client=loader()('lib/generation/client.ts');let recovered=0;
 await client.resumePendingGenerations(async({result})=>{recovered++;await client.acknowledgeGeneration(result.jobId);});assert.equal(recovered,5);assert.equal(initialSingles,0);
 rejectBatch=true;const invalid=[{imageUrl:'https://storage.test/new',actionId:'dog-walk'}];
 await assert.rejects(client.runVideoBatch(invalid,async()=>{}),/allowance/);
 await client.resumePendingGenerations();assert.equal(jobs.size,5);assert.equal(initialSingles,0);
 console.log(JSON.stringify({batch_client_passed:true,lost_batch_response_and_closed_tab_all_five_recovered:true,rejected_batch_never_falls_back_to_single_starts:true,paid_calls:0}));
}finally{globalThis.fetch=prior.fetch;globalThis.setTimeout=prior.setTimeout;if(prior.sessionStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=prior.sessionStorage;}
