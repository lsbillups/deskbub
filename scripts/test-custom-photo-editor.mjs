import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const originalFetch=globalThis.fetch;
let tier='plus',saved=[],failSave=false,uploads=0;
const photo=name=>new File(['fixture'],name+'.png',{type:'image/png'});
globalThis.fetch=async path=>{
 if(path==='/api/check-subscription')return Response.json({tier,used:0,max:tier==='plus'?8:1,pairingCode:'123456'});
 if(path==='/api/animation-selection')return Response.json({status:'draft',videos:[]});
 uploads++;throw Error('No processing allowed during photo editing: '+path);
};
let slots,effectStates,callbackStates,index,effects,dirty,tree,html,editorProps,initialFiles,dropZoneProps;
function reset(files){slots=[];effectStates=[];callbackStates=[];effects=[];dirty=true;initialFiles=files;html='';}
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
const fakeReact={...React,
 useState(initial){const n=index++;if(!(n in slots))slots[n]=typeof initial==='function'?initial():initial;return[slots[n],v=>{const next=typeof v==='function'?v(slots[n]):v;if(!Object.is(next,slots[n])){slots[n]=next;dirty=true;}}];},
 useRef(initial){const n=index++;if(!(n in slots))slots[n]={current:initial};return slots[n];},
 useCallback(fn,deps){const n=index++;if(!same(callbackStates[n]?.deps,deps))callbackStates[n]={deps,fn};return callbackStates[n].fn;},
 useEffect(fn,deps){const n=index++;if(!same(effectStates[n]?.deps,deps))effects.push(()=>{effectStates[n]?.cleanup?.();effectStates[n]={deps,cleanup:fn()};});},
};
function load(file,overrides={}){const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInThisContext(`(function(require,module,exports){${js}\n})`)(id=>overrides[id]||require(id),m,m.exports);return m.exports.default;}
const Editor=fs.existsSync('components/custom/PhotoPreviewEditor.tsx')?load('components/custom/PhotoPreviewEditor.tsx',{'./PhotoPreviewEditor.module.css':{}}):()=>null;
const motion=new Proxy({},{get:(_,tag)=>({children,...props})=>React.createElement(tag,Object.fromEntries(Object.entries(props).filter(([k])=>!['initial','animate','exit','transition','layout'].includes(k))),children)});
const productionAudit=process.argv.includes('--production-readonly');
const Page=load(productionAudit?'../animation-production-2026-10-15/app/upload/page.tsx':'components/custom/CustomPetWorkspace.tsx',{
 react:fakeReact,'next/navigation':{useRouter:()=>({push(){}})},'@vercel/analytics':{track(){}},'framer-motion':{motion,AnimatePresence:({children})=>children},
 '@/lib/supabase/client':{createClient(){throw Error('No uploads allowed');}},'@/components/upload/DropZone':{__esModule:true,default:props=>{dropZoneProps=props;return React.createElement('div',null,'Choose photos');}},
 '@/components/custom/PhotoPreviewEditor':{__esModule:true,default:props=>{editorProps=props;return React.createElement(Editor,props);}},
 '@/components/upload/GenerationProgress':{__esModule:true,default:()=>null},'@/lib/generation/actions':{petActions:{dog:{actions:[]}},actionRequest(){}},
 '@/lib/generation/client':{resumePendingGenerations:async()=>{},runGeneration(){throw Error('No generation');},runVideoBatch(){throw Error('No generation');},acknowledgeGeneration:async()=>{}},
 '@/lib/generation/progress':{progressCounts:()=>({unfinished:0})},'@/lib/custom-draft':{clearCustomDraft:async()=>{}},
});
const save=async(files,plan)=>{if(failSave)throw Error('Fixture storage failure');saved=[...files];assert.equal(plan,tier);};
function render(){index=0;dirty=false;editorProps=null;tree=React.createElement(Page,{embedded:true,initialFiles,onDraftFilesChange:save});html=renderToStaticMarkup(tree);const run=effects;effects=[];for(const effect of run)effect();}
async function settle(check){for(let i=0;i<150;i++){if(dirty||!html)render();if(check())return;await Promise.resolve();}throw Error('UI state did not settle');}
try{
 if(productionAudit){
  tier='plus';reset([]);render();await settle(()=>html.includes('Choose photos'));
  assert.equal(dropZoneProps.maxFiles,5,'Production initial Plus picker accepts five photos');
  dropZoneProps.onFilesSelected([photo('first')]);await settle(()=>html.includes('Remove Background'));
  assert.doesNotMatch(html,/Add photos/);assert.match(html,/>Cancel</);
  reset([]);render();await settle(()=>html.includes('Choose photos'));
  dropZoneProps.onFilesSelected(['one','two','three','four','five'].map(photo));await settle(()=>html.includes('Remove Background'));
  assert.equal((html.match(/<img\b/g)||[]).length,5);
  assert.equal(uploads,0);
  console.log(JSON.stringify({productionSource:'badb56f3',plusInitialPickerMax:5,fivePhotoBatchAccepted:true,previewHasNoAddControl:true,cancelNeededToReselect:true,networkCallsToProduction:0}));
  process.exit(0);
 }
 tier='plus';reset([photo('first')]);render();await settle(()=>html.includes('Remove Background'));
 assert.match(html,/Add photos/,'Plus returning with one photo must expose an Add photos control');
 assert.ok(editorProps,'The active preview must have editable photo controls');
 assert.match(html,/<input[^>]+multiple=""/);
 await editorProps.onAddPhotos([photo('second')]);await settle(()=>editorProps?.files.length===2);assert.equal(saved.length,2);
 await editorProps.onAddPhotos([photo('third'),photo('fourth'),photo('fifth')]);await settle(()=>editorProps?.files.length===5);assert.equal(saved.length,5);
 await editorProps.onAddPhotos([photo('sixth')]);await settle(()=>html.includes('up to 5'));assert.equal(editorProps.files.length,5);assert.equal(saved.length,5);
 await editorProps.onRemovePhoto(0);await settle(()=>editorProps?.files.length===4);assert.equal(saved.length,4);assert.equal(saved[0].name,'second.png');
 const latest=[...saved];reset(latest);render();await settle(()=>editorProps?.files.length===4);assert.match(html,/Remove photo 4/);
 failSave=true;await editorProps.onAddPhotos([photo('unsaved')]);await settle(()=>html.includes('Fixture storage failure'));assert.equal(editorProps.files.length,4);assert.equal(saved.length,4);failSave=false;
 tier='basic';reset([photo('basic-first')]);render();await settle(()=>html.includes('Remove Background'));assert.match(html,/Replace photo/);assert.doesNotMatch(html,/<input[^>]+multiple/);
 await editorProps.onAddPhotos([photo('replacement')]);await settle(()=>editorProps?.files[0]?.name==='replacement.png');assert.equal(editorProps.files.length,1);
 await editorProps.onRemovePhoto(0);await settle(()=>html.includes('Choose photos'));assert.equal(saved.length,0,'Removing the last photo must clear the persisted draft');
 assert.equal(uploads,0);
 console.log(JSON.stringify({paidPlusCanAppend:true,fivePhotoLimit:true,removeAndRefreshPreserved:true,storageFailureKeepsSelection:true,basicStillOnePhoto:true,uploadsAndGenerations:0}));
}finally{globalThis.fetch=originalFetch;}
