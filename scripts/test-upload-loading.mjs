import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const source=fs.readFileSync('components/custom/CustomPetWorkspace.tsx','utf8');
const noop=()=>{};
const overrides={
 '@/components/custom/PhotoPreviewEditor':{__esModule:true,default:()=>null},
 '@/lib/custom-draft':{clearCustomDraft:async()=>{}},
 'next/navigation':{useRouter:()=>({push:noop})},
 '@vercel/analytics':{track:noop},
 '@/lib/supabase/client':{createClient:()=>{throw Error('No storage during loading render');}},
 '@/components/upload/DropZone':{__esModule:true,default:()=>React.createElement('div',null,'Upload controls')},
 '@/components/upload/GenerationProgress':{__esModule:true,default:()=>React.createElement('div',null,'Batch progress')},
 '@/lib/generation/progress':{progressCounts:()=>({unfinished:0})},
 '@/lib/generation/actions':{petActions:{},actionRequest:noop},
 '@/lib/generation/client':{runGeneration:noop,runVideoBatch:noop,resumePendingGenerations:noop,acknowledgeGeneration:noop},
};
const module={exports:{}};
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
vm.runInThisContext(`(function(require,module,exports){${js}\n})`)(id=>overrides[id]||require(id),module,module.exports);
const html=renderToStaticMarkup(React.createElement(module.exports.default));
assert.match(html,/role="status"/,'First server render must expose a visible loading state');
assert.match(html,/Loading your account and saved pets/);
assert.doesNotMatch(html,/Choose a custom pet option to generate animations|Upload your photo first|Upload controls/,'Unknown account must not be shown as Free or accept uploads');
console.log(JSON.stringify({upload_initial_render_passed:true,loading_visible_before_hydration:true,no_false_free_state:true,no_upload_before_account:true,live_api_calls:0}));
