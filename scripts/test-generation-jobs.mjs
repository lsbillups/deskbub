import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { loader } from './generation-test-loader.mjs';
const require=createRequire(import.meta.url),{PGlite}=require('@electric-sql/pglite'),sharp=require('sharp');
const load=loader(),{advanceJob}=load('lib/generation/jobs.ts'),{MODELS}=load('lib/generation/replicate.ts');
const {getAction}=load('lib/generation/actions.ts');
// Frozen approval hashes, copied from the review registry rather than generated
// from application prompts, keep this check independent and runnable in CI.
const promptHashes=JSON.parse(fs.readFileSync('scripts/generation-prompt-hashes.json','utf8').replace(/^\uFEFF/,''));
assert.equal(promptHashes.length,15);
for(const r of promptHashes)assert.equal(crypto.createHash('sha256').update(getAction(r.pet,r.index).prompt).digest('hex'),r.sha256);
const db=new PGlite();
await db.exec('create role anon; create role authenticated; create role service_role; create table subscriptions(user_id text primary key,tier text,generations_used integer,max_generations integer); create table generated_pets(user_id text,original_url text,processed_url text);');
await db.exec("create table pet_data(user_id text,pairing_code text,video_url text,action_label text check(action_label<>'simulate-insert-error'),processed_url text);");
await db.exec(fs.readFileSync('supabase/migrations/202610140001_generation_jobs.sql','utf8'));
await db.query("insert into subscriptions values ('last-credit','plus',0,1),('batch','plus',0,8),('basic','basic',0,1)");
const rpc=async(name,args)=> (await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as value`,args)).rows[0].value;
const payload={imageUrl:'https://project.supabase.co/storage/v1/object/public/pet-photos/processed/batch/photo.png',prompt:getAction('dog',2).prompt,action_index:2,action_id:'dog-walk',action_label:'Walking in place'};
const start=(user,id=crypto.randomUUID(),kind='video',body=payload)=>rpc('deskbub_start_generation',[user,id,kind,'a'.repeat(64),JSON.stringify(body)]);
const read=async(user,id)=>(await db.query('select * from deskbub_animation_jobs where user_id=$1 and id=$2',[user,id])).rows[0]||null;
let uploadFailure=false,uploads=0;const files=new Map();
const store={read,lease:(u,id,t)=>rpc('deskbub_lease_generation',[u,id,t]),save:(j,t,release)=>rpc('deskbub_save_generation',[j.user_id,j.id,t,JSON.stringify(j.state),j.status,j.result&&JSON.stringify(j.result),release]),upload:async(j,bytes,type)=>{
 if(uploadFailure){uploadFailure=false;throw Error('Simulated storage interruption');}
 uploads++;files.set(j.id,bytes);return 'https://project.supabase.co/storage/v1/object/public/pet-photos/'+(type==='image/png'?'processed/':'videos/')+j.user_id+'/'+j.id;
}};
const webm=Buffer.from([0x1a,0x45,0xdf,0xa3,0]);
const greenImage=Buffer.from('green fixture');
const fixturePhoto=await sharp({create:{width:4,height:4,channels:3,background:'red'}}).png().toBuffer();
const images={download:async()=>fixturePhoto,green:async()=>greenImage,cutout:async b=>b,photo:async b=>b};
let creates=[],unknown=false,modelFailure=false,slow=false;
const provider={create:async(version,input)=>{creates.push({version,input});if(unknown)throw Error('Unknown paid submission');return {id:version===MODELS.video?'video-id':version===MODELS.matting?'image-id':'key-id',status:'starting'};},get:async id=>({id,status:modelFailure?'failed':slow?'processing':'succeeded',output:'https://replicate.delivery/'+(id==='key-id'?'final.webm':'source.mp4')}),file:async()=>webm};
async function finish(job){for(let i=0;i<12;i++){const result=await advanceJob(store,provider,job.user_id,job.id,images);if(result.status!==202)return result;}throw Error('Did not finish');}
const last=await Promise.allSettled([start('last-credit'),start('last-credit')]);
assert.equal(last.filter(r=>r.status==='fulfilled').length,1);
const reserved=last.find(r=>r.status==='fulfilled').value;
const again=await start('last-credit',reserved.id);assert.equal(again.id,reserved.id);
await assert.rejects(rpc('deskbub_start_generation',['last-credit',reserved.id,'video','b'.repeat(64),JSON.stringify(payload)]),/changed/);
await assert.rejects(start('basic'),/Basic/);
await assert.rejects(start('free-account',crypto.randomUUID(),'image',{imageUrl:payload.imageUrl}),/allowance/);
await assert.rejects(start('another-user',reserved.id),/another account/);
const terminal=await finish(reserved);assert.equal(terminal.status,200);assert.equal(creates.length,2);
assert.equal((await db.query("select generations_used from subscriptions where user_id='last-credit'")).rows[0].generations_used,1);
assert.equal((await advanceJob(store,provider,'last-credit',reserved.id,images)).status,200);assert.equal(creates.length,2);
assert.equal(creates[0].input.prompt,payload.prompt);assert.equal(creates[0].input.generate_audio,false);
assert.equal(creates[0].input.negative_prompt,undefined);
// Parallel continuations use an exclusive DB lease and only one paid submission.
creates=[];const duplicate=await start('batch');
await Promise.all([advanceJob(store,provider,'batch',duplicate.id,images),advanceJob(store,provider,'batch',duplicate.id,images)]);
assert.equal(creates.length,1);await finish(duplicate);assert.equal(creates.length,2);
// A killed process between journal and response is held, never recreated.
creates=[];const uncertain=await start('batch');unknown=true;
assert.equal((await advanceJob(store,provider,'batch',uncertain.id,images)).status,409);
unknown=false;assert.equal((await advanceJob(store,provider,'batch',uncertain.id,images)).status,409);assert.equal(creates.length,1);
assert.equal((await read('batch',uncertain.id)).reserved_credit,true);
// Resume GET of an existing prediction after a simulated worker restart.
creates=[];const resumable=await start('batch');await advanceJob(store,provider,'batch',resumable.id,images);slow=true;
await advanceJob(store,provider,'batch',resumable.id,images);slow=false;await finish(resumable);assert.equal(creates.length,2);
// Storage failure resumes the existing output; successful completion charges once.
creates=[];const storageJob=await start('batch');uploadFailure=true;await finish(storageJob);assert.equal(creates.length,2);
const charges=(await db.query("select generations_used from subscriptions where user_id='batch'")).rows[0].generations_used;
assert.equal(charges,3);
// Definitive failure releases capacity and does not increment successful credits.
creates=[];const failing=await start('batch');await advanceJob(store,provider,'batch',failing.id,images);modelFailure=true;
assert.equal((await advanceJob(store,provider,'batch',failing.id,images)).status,409);modelFailure=false;
assert.equal((await read('batch',failing.id)).reserved_credit,false);
assert.equal((await db.query("select generations_used from subscriptions where user_id='batch'")).rows[0].generations_used,charges);
const imageJob=await start('batch',crypto.randomUUID(),'image',{imageUrl:payload.imageUrl});
await finish(imageJob);await advanceJob(store,provider,'batch',imageJob.id,images);
assert.equal((await db.query('select count(*)::int as n from generated_pets')).rows[0].n,1);
assert.equal((await db.query("select generations_used from subscriptions where user_id='batch'")).rows[0].generations_used,charges);
assert.equal((await read('batch',imageJob.id)).acknowledged_at,null);
const photoVideo=await start('batch',crypto.randomUUID(),'video',{...payload,imageUrl:(await read('batch',imageJob.id)).result.processedUrl});
await finish(photoVideo);
assert.ok((await read('batch',imageJob.id)).acknowledged_at,'Photo remains recoverable until its video is saved');
// Lease fencing prevents a dead worker from overwriting the next worker's state.
const fence=await start('batch');const token1=crypto.randomUUID(),token2=crypto.randomUUID();
const leased=await store.lease('batch',fence.id,token1);
await db.query("update deskbub_animation_jobs set lease_until=now()-interval '1 second' where id=$1",[fence.id]);
await store.lease('batch',fence.id,token2);await assert.rejects(store.save(leased,token1,true),/lease/);
// Unprivileged clients cannot read payloads or call service-only RPCs.
await rpc('deskbub_sync_pet_videos',['batch','123456',JSON.stringify([{url:'https://example.test/old.webm',label:'Old'}])]);
await assert.rejects(rpc('deskbub_sync_pet_videos',['batch','123456',JSON.stringify([{url:'https://example.test/new.webm',label:'simulate-insert-error'}])]),/constraint/);
assert.equal((await db.query("select video_url from pet_data where user_id='batch'")).rows[0].video_url,'https://example.test/old.webm');
await rpc('deskbub_sync_pet_videos',['batch','123456',JSON.stringify([{url:'https://example.test/new.webm',label:'New'}])]);
assert.equal((await db.query("select video_url from pet_data where user_id='batch'")).rows[0].video_url,'https://example.test/new.webm');
await db.exec('set role authenticated');
await assert.rejects(db.query('select * from deskbub_animation_jobs'),/permission/);
await assert.rejects(db.query("select deskbub_lease_generation('batch',$1,$2)",[fence.id,crypto.randomUUID()]),/permission/);
await assert.rejects(db.query("select deskbub_sync_pet_videos('batch','123456','[]'::jsonb)"),/permission/);
await db.exec('reset role');
// Real alpha compositing, including empty/opaque matting rejection.
const {prepareGreenInput,normalizeCutout,replicateMediaUrl}=load('lib/generation/media.ts');
const image=await sharp({create:{width:40,height:40,channels:4,background:{r:255,g:0,b:0,alpha:0}}}).composite([{input:await sharp({create:{width:20,height:20,channels:4,background:'red'}}).png().toBuffer(),left:10,top:10}]).png().toBuffer();
const green=await prepareGreenInput(image),{data,info}=await sharp(green).removeAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(info.width,720);assert.deepEqual([...data.subarray(0,3)],[18,253,16]);assert.ok((await normalizeCutout(image)).length);
await assert.rejects(normalizeCutout(await sharp({create:{width:5,height:5,channels:3,background:'white'}}).png().toBuffer()),/transparent/);
assert.throws(()=>replicateMediaUrl('https://replicate.delivery/$(whoami)'));
await db.close();
console.log(JSON.stringify({passed:true,sql_migration_tested:true,prompt_matches:15,last_credit_race:true,duplicate_step_race:true,unknown_post_no_retry:true,known_prediction_resume:true,storage_resume_no_regeneration:true,exactly_once_credit:true,failed_job_no_credit:true,lease_fencing:true,rls_service_only:true,real_compositing:true,live_api_calls:0}));
