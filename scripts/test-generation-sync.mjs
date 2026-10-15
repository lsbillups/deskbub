import assert from 'node:assert/strict';
import { loader } from './generation-test-loader.mjs';
let signedIn=true, fail=false, calls=[];
const load=loader({
 '@/lib/accounts/identity':{resolveDeskBubAccount:async()=>signedIn?{userId:'account-1',pairingCode:'123456'}:null},
 '@/lib/supabase/admin':{createAdminClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return {error:fail?{message:'Offline'}:null};}})},
});
const {POST}=load('app/api/sync-pet-data/route.ts');
const request=body=>new Request('http://local/api/sync-pet-data',{method:'POST',body:JSON.stringify(body)});
const videos=[{url:'https://example.test/video.webm',label:'Walking'}];
let result=await POST(request({videos,pairingCode:'654321',finalize:false}));assert.equal(result.status,200);
assert.equal(calls[0].args.p_pairing_code,'123456');assert.equal(calls[0].args.p_user_id,'account-1');
assert.equal(calls[0].args.p_finalize,false);
fail=true;result=await POST(request({videos,finalize:true}));assert.equal(result.status,503);
result=await POST(request({videos:[{url:'javascript:alert(1)'}],finalize:true}));assert.equal(result.status,400);assert.equal(calls.length,2);
result=await POST(request({videos}));assert.equal(result.status,409);assert.equal(calls.length,2);
signedIn=false;result=await POST(request({videos}));assert.equal(result.status,401);assert.equal(calls.length,2);
let pairingError=null,pairingData=[];
const pairingLoad=loader({'@/lib/supabase/server':{createClient:async()=>({from:()=>({select:()=>({eq:()=>({order:async()=>({data:pairingData,error:pairingError})})})})})}});
const {GET}=pairingLoad('app/api/pairing/[code]/route.ts');
const get=()=>GET(new Request('http://local/api/pairing/123456'),{params:Promise.resolve({code:'123456'})});
assert.equal((await get()).status,404);pairingError={message:'Offline'};assert.equal((await get()).status,503);
pairingError=null;pairingData=[{video_url:videos[0].url,action_label:'Walking',processed_url:''}];
assert.equal((await (await get()).json()).videoUrl,videos[0].url);
console.log(JSON.stringify({sync_passed:true,account_pairing_trusted:true,write_errors_propagated:true,pairing_outage_distinct_from_empty:true,live_api_calls:0}));
