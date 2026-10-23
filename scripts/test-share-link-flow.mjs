import assert from 'node:assert/strict';
import {loader} from './generation-test-loader.mjs';
const {sharePostFromLink}=loader()('lib/share-claims.ts');
assert.equal(sharePostFromLink('https://twitter.com/owner/status/123456?utm_source=share').handle,'@owner');
assert.equal(sharePostFromLink('https://x.com/i/web/status/123456').handle,'See post author');
assert.equal(sharePostFromLink('https://www.tiktok.com/@owner/video/123456').platform,'tiktok');
assert.equal(sharePostFromLink('https://www.instagram.com/reel/Abc_12-/').platform,'instagram');
for(const url of ['https://x.com.attacker.test/a/status/123456','https://user:pass@x.com/a/status/123456','http://x.com/a/status/123456','https://x.com:999/a/status/123456','https://www.instagram.com/stories/owner/123456/','https://vm.tiktok.com/abc123'])assert.throws(()=>sharePostFromLink(url));
const {X_SHARE_URL,SHARE_CAPTION,SHARE_PAGE}=loader()('lib/share-compose.ts');
const intent=new URL(X_SHARE_URL);
assert.equal(intent.origin,'https://x.com');assert.equal(intent.pathname,'/intent/tweet');
assert.equal(intent.searchParams.get('text'),SHARE_CAPTION);assert.match(SHARE_CAPTION,/Sharing to earn a free custom-pet creation from DeskBub/);
assert.equal(intent.searchParams.get('url'),SHARE_PAGE);
let calls=[];
const route=loader({
 '@/lib/share-auth':{shareIdentity:async()=>({userId:'local-test',email:'test@example.test'}),shareWriteCheck:()=>null},
 '@/lib/supabase/admin':{createAdminClient:()=>({rpc:async(name,params)=>{calls.push({name,params});return {error:null};}})}
})('app/api/share-claims/route.ts');
const send=body=>route.POST(new Request('http://localhost:3043/api/share-claims',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
assert.equal((await send({url:'https://www.instagram.com/reel/Abc_12-/',confirmed:true})).status,200);
assert.equal(calls[0].params.p_platform,'instagram');assert.equal(calls[0].params.p_handle,'See post author');
assert.equal((await send({url:'https://x.com/real_author/status/123456',confirmed:true,platform:'instagram',handle:'@fake'})).status,200);
assert.equal(calls[1].params.p_platform,'x');assert.equal(calls[1].params.p_handle,'@real_author');
assert.equal((await send({url:'https://x.com/a/status/123456',confirmed:false})).status,400);
assert.equal((await send({url:'https://evil.test/a',confirmed:true})).status,400);
assert.equal(calls.length,2);
console.log(JSON.stringify({passed:true,urlOnlySubmission:true,metadataInferredServerSide:true,spoofedFieldsIgnored:true,urlAllowlist:true,disclosureInPrefilledComposer:true,externalPosts:0,paidCalls:0}));
