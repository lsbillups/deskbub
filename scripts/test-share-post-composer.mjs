import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {loader} from './generation-test-loader.mjs';
const require=createRequire(import.meta.url),ts=require('typescript');
const compose=loader()('lib/share-compose.ts');
const pricing=loader()('lib/pricing.ts');
const source=fs.readFileSync('components/share/SharePostComposer.tsx','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
function harness(mobile,{shareOutcome='cancel',videoFailure=false,copyFailure=false}={}){
 const slots=[],effects=[],copies=[],downloads=[],native=[];let cursor=0,collect=true;
 const hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useEffect(fn){if(collect)effects.push(fn);}};
 const module={exports:{}};
 const context=vm.createContext({module,exports:module.exports,AbortController,File,Blob,console,
  navigator:{userAgent:mobile?'iPhone':'Windows',maxTouchPoints:mobile?5:0,canShare:()=>true,clipboard:{writeText:async text=>{if(copyFailure)throw new Error('Permission denied');copies.push(text);}},share:async data=>{native.push(data);if(shareOutcome==='cancel')throw Object.assign(new Error('Canceled'),{name:'AbortError'});if(shareOutcome==='error')throw new Error('Unavailable');}},
  document:{body:{appendChild(){}},createElement(){return {click(){downloads.push({href:this.href,download:this.download});},remove(){}};}},
  fetch:async url=>{assert.equal(url,compose.SHARE_VIDEO);return {ok:!videoFailure,blob:async()=>new Blob(['fixture'],{type:'video/mp4'})};},
  require(id){if(id==='react')return {...require('react'),...hooks};if(id==='@/lib/share-compose')return compose;if(id==='@/lib/pricing')return pricing;if(id.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>key})};return require(id);}
 });
 vm.runInContext(js,context);
 return {render(enabled=true){cursor=0;const tree=module.exports.default({enabled});collect=false;return tree;},start(){collect=true;this.render();effects.forEach(fn=>fn());},copies,downloads,native};
}
function nodes(n){return Array.isArray(n)?n.flatMap(nodes):n?.props?[n,...nodes(n.props.children)]:[];}
function text(n){return Array.isArray(n)?n.map(text).join(''):n?.props?text(n.props.children):typeof n==='string'?n:'';}
const button=(tree,name)=>nodes(tree).find(n=>n.type==='button'&&text(n).trim()===name);
const flush=async()=>{for(let i=0;i<14;i++)await Promise.resolve();};
const link=(tree,name)=>nodes(tree).find(n=>n.type==='a'&&(n.props['aria-label']===name||text(n).trim()===name));
const navigationEvent={preventDefault(){throw Error('Enabled platform link must navigate immediately');}};
const desktop=harness(false);desktop.start();let tree=desktop.render();
assert.equal(link(tree,'Open TikTok').props.href,'https://www.tiktok.com/upload','Desktop keeps the web upload page');
for(const name of ['Share on X','Open TikTok','Open Instagram'])assert(link(tree,name),'Platform links exist before video loading finishes');
await flush();tree=desktop.render();
assert(nodes(tree).some(n=>n.type==='video'&&n.props.controls));
assert(nodes(tree).some(n=>n.type==='textarea'&&n.props.value===compose.SHARE_CAPTION));
for(const name of ['Open TikTok','Open Instagram'])link(tree,name).props.onClick(navigationEvent);
assert.equal(desktop.native.length,0,'Direct platform links never open generic OS sharing');
assert.equal(desktop.downloads.length,0,'Opening a platform never forces a download');
assert.equal(desktop.copies.length,0,'TikTok/Instagram opening does not require a copied sample');
nodes(tree).find(n=>n.type==='textarea').props.onChange({target:{value:'My own words & a link. #ad'}});
tree=desktop.render();
const x=link(tree,'Share on X');
assert.equal(new URL(x.props.href).searchParams.get('text'),'My own words & a link. #ad');
assert.equal(new URL(x.props.href).searchParams.get('url'),compose.SHARE_PAGE);
x.props.onClick(navigationEvent);await flush();
assert.equal(desktop.copies.at(-1),'My own words & a link. #ad\n'+compose.SHARE_PAGE);
assert.match(text(desktop.render()),/If X opens an empty draft/);
button(desktop.render(),'Copy caption').props.onClick();await flush();
assert.equal(desktop.copies.at(-1),'My own words & a link. #ad\n'+compose.SHARE_PAGE);
assert(link(desktop.render(),'Save demo video').props.download==='DeskBub-Kaka.mp4');
const unavailable=harness(false,{videoFailure:true,copyFailure:true});unavailable.start();await flush();tree=unavailable.render();
assert.match(text(tree),/demo couldn’t load/);
for(const name of ['Share on X','Open TikTok','Open Instagram'])assert(link(tree,name).props.href,'A broken demo cannot block a platform');
link(tree,'Share on X').props.onClick(navigationEvent);await flush();
assert.match(text(unavailable.render()),/If X opens an empty draft/);
const phone=harness(true);phone.start();await flush();tree=phone.render();
assert.equal(link(tree,'Open TikTok').props.href,'https://www.tiktok.com/','Phone uses a TikTok-registered iOS app link rather than the web-only upload route');
assert.equal(link(tree,'Open TikTok').props.target,undefined,'Phone follows the app link in the current browsing context');
button(tree,'Share demo video').props.onClick();await flush();tree=phone.render();
assert.equal(phone.native.length,1);assert.equal(phone.native[0].files[0].type,'video/mp4');
assert.equal(phone.native[0].text,undefined,'Caption is copied separately because apps may ignore share text');
assert.equal(phone.copies.length,1);assert.match(text(tree),/Sharing canceled/);
assert(button(tree,'Share demo video'),'Cancel retains native retry');
assert(link(tree,'Save demo video'),'Cancel retains optional download');
const failed=harness(true,{shareOutcome:'error'});failed.start();await flush();tree=failed.render();
button(tree,'Share demo video').props.onClick();await flush();tree=failed.render();
assert.match(text(tree),/File sharing is unavailable/);
assert(!button(tree,'Share demo video'));assert(link(tree,'Save demo video'));
for(const name of ['Share on X','Open TikTok','Open Instagram'])assert(link(tree,name).props.href);
const disabled=desktop.render(false);
for(const name of ['Share on X','Open TikTok','Open Instagram','Save demo video']){
 const a=link(disabled,name);assert.equal(a.props.href,undefined);let blocked=false;a.props.onClick({preventDefault(){blocked=true;}});assert(blocked);
}
console.log(JSON.stringify({passed:true,platformsImmediatelyAvailable:true,noRequiredDownloadOrClipboard:true,editedXPrefillAndCopy:true,optionalCaptionAndVideo:true,brokenDemoDoesNotBlockPlatforms:true,clipboardFailureDoesNotBlockX:true,mobileFileOnlyCancelAndFailureFallback:true,disabledLinksGuarded:true,externalPosts:0,paidCalls:0}));

