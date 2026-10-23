import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {loader} from './generation-test-loader.mjs';
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const prior={fetch:globalThis.fetch,setTimeout:globalThis.setTimeout,sessionStorage:globalThis.sessionStorage};
const store=new Map();globalThis.sessionStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const immediate=fn=>{queueMicrotask(fn);return 0;};globalThis.setTimeout=immediate;
const slots=[],effectStates=[],callbackStates=[];let index=0,effects=[],dirty=false,pending=0,used=3,blocked=false,gateRelease;
const gate=new Promise(r=>{gateRelease=r;});
const labels=['Panting & tongue out','Curious head tilt','Walking in place','Gentle tail wag','Lying down relaxed'];
const jobs=labels.map((label,i)=>({id:'v'+i,label,done:i<3,acked:i<3}));
const url=j=>'https://fixture.test/video-'+j.id+'.webm';
globalThis.fetch=async(path)=>{
 if(path==='/api/check-subscription')return Response.json({tier:'plus',used,max:8,pairingCode:'123456'});
 if(path==='/api/animation-selection')return Response.json({status:'draft',videos:jobs.filter(j=>j.done).map(j=>({url:url(j),label:j.label}))});
 if(path==='/api/generation-jobs')return Response.json({
  jobs:[{id:'photo',kind:'image',requestBody:{imageUrl:'https://fixture.test/original'}},...jobs.filter(j=>!j.acked).map(j=>({id:j.id,kind:'video',status:j.done?'succeeded':'pending',phase:'new',requestBody:{imageUrl:'https://fixture.test/cutout-'+j.id,actionLabel:j.label,actionId:j.id}}))],
  videoJobs:jobs.map(j=>({id:j.id,status:j.done?'succeeded':'pending',phase:'new',actionLabel:j.label})),usedImageUrls:jobs.map(j=>'https://fixture.test/cutout-'+j.id),
 });
 if(String(path).endsWith('?ack=1')){jobs.find(j=>j.id===String(path).split('/').pop().split('?')[0]).acked=true;return Response.json({success:true});}
 const id=String(path).split('/').pop();
 if(id==='photo')return Response.json({success:true,jobId:id,processedUrl:'https://fixture.test/cutout-v3'});
 const j=jobs.find(j=>j.id===id);assert(j,'Unexpected request '+path);
 if(id==='v3'&&!j.done){blocked=true;await gate;}
 if(!j.done){j.done=true;used++;}
 return Response.json({success:true,jobId:id,videoUrl:url(j),actionLabel:j.label});
};
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
const fakeReact={...React,useState(initial){const n=index++;if(!(n in slots))slots[n]=typeof initial==='function'?initial():initial;return [slots[n],v=>{const next=typeof v==='function'?v(slots[n]):v;if(!Object.is(next,slots[n])){slots[n]=next;dirty=true;}}];},
 useRef(initial){const n=index++;if(!(n in slots))slots[n]={current:initial};return slots[n];},
 useCallback(fn,deps){const n=index++;if(!same(callbackStates[n]?.deps,deps))callbackStates[n]={deps,fn};return callbackStates[n].fn;},
 useEffect(fn,deps){const n=index++;if(!same(effectStates[n]?.deps,deps)){effects.push(()=>{effectStates[n]?.cleanup?.();effectStates[n]={deps,cleanup:fn()};});}},
};
const motion=new Proxy({}, {get:(_,tag)=>({children,...props})=>React.createElement(tag,Object.fromEntries(Object.entries(props).filter(([k])=>!['initial','animate','exit','transition','layout','whileHover','whileTap'].includes(k))),children)});
const client=loader()('lib/generation/client.ts');
function loadJsx(file,overrides){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInThisContext(`(function(require,module,exports){${js}\n})`)(id=>overrides[id]||require(id),m,m.exports);return m.exports.default;}
const helpers=loader()('lib/generation/progress.ts');
const Progress=loadJsx('components/upload/GenerationProgress.tsx',{'@/lib/generation/progress':helpers});
const Page=loadJsx('components/custom/CustomPetWorkspace.tsx',{
 '@/components/custom/PhotoPreviewEditor':{__esModule:true,default:()=>null},
 '@/lib/custom-draft':{clearCustomDraft:async()=>{}},react:fakeReact,'next/navigation':{useRouter:()=>({push(){}})},'@vercel/analytics':{track(){}},'framer-motion':{motion,AnimatePresence:({children})=>children},
 '@/lib/supabase/client':{createClient(){throw Error('No uploads in recovery test');}},'@/components/upload/DropZone':{__esModule:true,default:()=>React.createElement('div',null,'Photo upload controls')},
 '@/components/upload/GenerationProgress':{__esModule:true,default:Progress},'@/lib/generation/actions':loader()('lib/generation/actions.ts'),'@/lib/generation/client':client,'@/lib/generation/progress':helpers,
});
let html='';
function render(){index=0;dirty=false;html=renderToStaticMarkup(React.createElement(Page));const run=effects;effects=[];for(const fn of run)fn();return html;}
async function settle(check){for(let i=0;i<150;i++){if(dirty||!html)render();if(check())return;await Promise.resolve();}throw Error('State did not settle: '+html.slice(0,200));}
try{
 render();await settle(()=>blocked&&html.includes('3 of 5 completed'));
 assert.match(html,/Creating your 5 videos/);assert.match(html,/role="progressbar"/);assert.match(html,/aria-valuenow="3"/);assert.match(html,/5 generations left/);
 assert.doesNotMatch(html,/<video|<select|Confirm &amp; Lock|Add More Videos|New video 1/);
 assert.match(html,/Gentle tail wag/);assert.match(html,/Lying down relaxed/);
 const progressHtml=html;
 gateRelease();await settle(()=>jobs.every(j=>j.done)&&html.includes('5 Videos Generated')&&!html.includes('Creating your'));
 assert.equal((html.match(/<video /g)||[]).length,5);assert.match(html,/3 generations left/);assert.doesNotMatch(html,/<select/);
 if(process.env.DESKBUB_REVIEW_OUTPUT){fs.mkdirSync(process.env.DESKBUB_REVIEW_OUTPUT,{recursive:true});fs.writeFileSync(process.env.DESKBUB_REVIEW_OUTPUT+'/progress-fragment.html',progressHtml);fs.writeFileSync(process.env.DESKBUB_REVIEW_OUTPUT+'/results-fragment.html',html);}
 assert.equal(pending,0);
 console.log(JSON.stringify({upload_recovery_page_passed:true,cold_refresh_three_of_five:true,no_partial_gallery_or_default_selectors:true,original_action_labels:true,all_five_results_together:true,balance_updated_to_three:true,paid_calls:0}));
}finally{gateRelease();globalThis.fetch=prior.fetch;globalThis.setTimeout=prior.setTimeout;if(prior.sessionStorage===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=prior.sessionStorage;}
