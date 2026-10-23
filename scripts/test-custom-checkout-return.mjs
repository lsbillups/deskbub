import assert from 'node:assert/strict';
import {loader} from './generation-test-loader.mjs';
const {createTrackedCheckout}=loader()('lib/creem/checkout.ts');
const env={VERCEL_ENV:'preview',DESKBUB_DATA_ENVIRONMENT:'sandbox',DESKBUB_SANDBOX_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',DESKBUB_PRODUCTION_SUPABASE_URL:'https://production.invalid',CREEM_API_KEY:'creem_test_fixture',CREEM_WEBHOOK_SECRET:'fixture',CREEM_BASIC_PRODUCT_ID:'basic-fixture',CREEM_PLUS_PRODUCT_ID:'plus-fixture',NEXT_PUBLIC_APP_URL:'https://staging.invalid'};
let successUrl,requests=0;
const rpc=async name=>({data:name==='deskbub_begin_checkout'?{created:true}:{recorded:true},error:null});
const request=async(url,options={})=>{
 requests++;
 if(options.method!=='POST')return Response.json({id:'basic-fixture',price:299,currency:'USD',billing_type:'onetime',status:'active',mode:'test'});
 const body=JSON.parse(options.body);successUrl=body.success_url;
 return Response.json({id:'checkout-fixture',product:'basic-fixture',request_id:body.request_id,mode:'test',metadata:body.metadata,checkout_url:'https://test.creem.io/fixture'});
};
await createTrackedCheckout('fixture-user','basic',rpc,env,request,'request-default');
assert.equal(successUrl,'https://staging.invalid/dashboard?upgraded=true');
await createTrackedCheckout('fixture-user','basic',rpc,env,request,'request-custom','/custom-desktop-pet?upgraded=true#custom-create');
assert.equal(successUrl,'https://staging.invalid/custom-desktop-pet?upgraded=true#custom-create');
const before=requests;
await assert.rejects(createTrackedCheckout('fixture-user','basic',rpc,env,request,'request-bad','https://attacker.invalid/'),/Invalid checkout return path/);
assert.equal(requests,before);
await assert.rejects(createTrackedCheckout('fixture-user','basic',rpc,{...env,CREEM_API_KEY:'live-fixture'},request),/Preview checkout requires Creem test mode/);
console.log(JSON.stringify({checkoutReturnTestsPassed:true,defaultDestinationPreserved:true,customDestination:true,externalRedirectRejectedBeforeRequest:true,liveKeyRejectedInPreview:true,realApiCalls:0}));

const beforeHttp=requests;
await assert.rejects(createTrackedCheckout('fixture-user','basic',rpc,{...env,NEXT_PUBLIC_APP_URL:'http://localhost:3043'},request),/Invalid app URL/);
assert.equal(requests,beforeHttp);
console.log(JSON.stringify({productionCandidateRejectsLocalHttp:true,realApiCalls:0}));
