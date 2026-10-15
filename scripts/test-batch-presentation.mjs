import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
const source=fs.readFileSync('app/upload/page.tsx','utf8');
const chunk=source.match(/const handleGenerate = async \(\) => \{[\s\S]*?\n  \};/)[0];
const js=ts.transpileModule(chunk,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
let release;const gate=new Promise(r=>{release=r;});const changes=[];let observedFirst=false;
const result=i=>({jobId:'job-'+i,videoUrl:'https://storage.test/'+i,actionLabel:'Action '+i});
const env={tier:'plus',generationBusy:{current:false},batchProgressRef:{current:null},checked:Array.from({length:5},(_,a)=>Array.from({length:5},(_,p)=>a===p)),MAX_ACTIONS:5,videoUrls:[],videoLabels:[],processedUrls:Array.from({length:5},(_,i)=>'https://storage.test/p'+i),petType:'dog',actionRequest:(_,i)=>({actionId:'action-'+i}),
 setIsGenerating:()=>{},setError:()=>{},setVideoUrls:v=>changes.push(v),setVideoLabels:()=>{},setKeepFlags:()=>{},setStage:()=>{},setProcessedUrls:()=>{},setBatchProgress:()=>{},updateBatchProgress:()=>{},loadSavedSelection:async()=>null,
 runVideoBatch:async(_bodies,onComplete)=>{await onComplete(result(1));observedFirst=true;await gate;for(let i=2;i<=5;i++)await onComplete(result(i));},syncToDB:async()=>{},acknowledgeGeneration:async()=>{},refreshSub:async()=>{},finishBatchPresentation:()=>{},
};
const handle=new Function(...Object.keys(env),js+'; return handleGenerate;')(...Object.values(env));
const running=handle();for(let i=0;i<20&&!observedFirst;i++)await Promise.resolve();assert(observedFirst);
try{assert.equal(changes.length,0,'One completed video must not replace the batch progress with partial results');}
finally{release();await running;}
assert.equal(changes.at(-1)?.length,5,'Completed batch must present all five results together');
console.log(JSON.stringify({batch_presentation_passed:true,no_partial_results:true,all_five_shown_together:true,paid_calls:0}));

const appendChunk=source.match(/const handleAppendGenerate = async \(\) => \{[\s\S]*?\n  \};/)[0];
const appendJs=ts.transpileModule(appendChunk,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const appendChanges=[];let next;const appendGate=new Promise(r=>{next=r;});let first=false;
const appendEnv={...env,generationBusy:{current:false},videoUrls:['https://storage.test/old1','https://storage.test/old2'],videoLabels:['Old 1','Old 2'],processedUrls:['photo1','photo2','photo3'],gensLeft:6,MAX_TOTAL:8,totalVideos:2,FINAL:5,appendActions:[1,2,3],
 setVideoUrls:v=>appendChanges.push(v),setFiles:()=>{},setPreviewUrls:()=>{},runVideoBatch:async(_bodies,onComplete)=>{await onComplete(result(3));first=true;await appendGate;await onComplete(result(4));await onComplete(result(5));},
};
const append=new Function(...Object.keys(appendEnv),appendJs+'; return handleAppendGenerate;')(...Object.values(appendEnv));const appending=append();
for(let i=0;i<20&&!first;i++)await Promise.resolve();assert(first);try{assert.equal(appendChanges.length,0,'Appending must not reveal a partially finished batch');}finally{next();await appending;}
assert.equal(appendChanges.at(-1).length,5);assert.equal(appendChanges.at(-1)[0],'https://storage.test/old1');
let basicSync=false;const basicChanges=[];const basicEnv={...env,tier:'basic',generationBusy:{current:false},setVideoUrls:v=>basicChanges.push(v),runVideoBatch:async(bodies,onComplete)=>{assert.equal(bodies.length,1);await onComplete(result(1));},syncToDB:async(_urls,_labels,finalize)=>{assert.equal(finalize,true);basicSync=true;}};
await new Function(...Object.keys(basicEnv),js+'; return handleGenerate;')(...Object.values(basicEnv))();assert(basicSync);assert.equal(basicChanges.at(-1).length,1);
console.log(JSON.stringify({append_batch_together:true,prior_outputs_retained:true,basic_one_video_still_finalized:true,paid_calls:0}));
