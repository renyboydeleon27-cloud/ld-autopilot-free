import test from 'node:test';
import assert from 'node:assert/strict';
import { generateImage, MODEL } from '../lib/ldb/cloudflare-image.mjs';
const env = {CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_API_TOKEN:'secret-test',OPENAI_API_KEY:'must-never-be-used'};
const opts = {env,prompt:'peaceful historical anime',freePlanConfirmed:true};
const bytes = Buffer.alloc(124); Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes); bytes.write('IHDR',12); bytes.writeUInt32BE(576,16); bytes.writeUInt32BE(1024,20);
const response = data => new Response(JSON.stringify(data),{status:200});
test('one fixed model request, four steps, validated bytes and checksum',async()=>{
 let calls=0;
 const result = await generateImage({...opts,fetcher:async(url,config)=>{
 calls++; assert.ok(url.endsWith(MODEL)); assert.equal(config.redirect,'error'); assert.equal(config.body.get('prompt'),opts.prompt); assert.equal(config.body.get('width'),'576'); assert.equal(config.body.get('height'),'1024'); assert.equal(config.headers['Content-Type'],undefined);
 return response({success:true,result:{image:bytes.toString('base64')}});
 }}); assert.equal(calls,1); assert.deepEqual(result.bytes,bytes); assert.match(result.sha256,/^[a-f0-9]{64}$/);
});
test('configuration, free plan and input gates prevent all calls',async()=>{
 for (const override of [{freePlanConfirmed:false},{env:{}},{prompt:''},{prompt:'x'.repeat(2049)}])
 await assert.rejects(generateImage({...opts,...override,fetcher:()=>assert.fail('network')}));
});
test('provider failure, exhaustion and ambiguous timeout never retry or fallback',async()=>{
 for (const status of [401,403,429,500]) {let n=0;await assert.rejects(generateImage({...opts,fetcher:async()=>{n++;return new Response('secret-test',{status});}}),e=>!e.message.includes('secret-test'));assert.equal(n,1);}
 let n=0; await assert.rejects(generateImage({...opts,fetcher:async()=>{n++;throw Error('secret-test');}}),/PROVIDER_UNAVAILABLE/);assert.equal(n,1);
});
test('invalid success, base64 and non-image outputs rejected',async()=>{
 for(const data of [{success:false},{success:true,result:{image:'bad'}},{success:true,result:{image:Buffer.from('not a jpeg').toString('base64')}}])
 await assert.rejects(generateImage({...opts,fetcher:async()=>response(data)}));
});

test('square output rejected before delivery',async()=>{const square=Buffer.from(bytes);square.writeUInt32BE(1024,16);await assert.rejects(generateImage({...opts,fetcher:async()=>response({success:true,result:{image:square.toString('base64')}})}),/INVALID_PORTRAIT_DIMENSIONS/);});
