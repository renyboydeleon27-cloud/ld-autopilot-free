import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';
import {readPersistedRunnerImages} from '../lib/ldb/persisted-runner-images.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
 const id='d'.repeat(64),map=new Map();
 const outputs=ALL_SCENES.map((scene,i)=>{
  const bytes=Buffer.from('durable-image-'+i);
  map.set('image:'+i+':0,new Uint8Array(bytes));
  return {scene,chunks:1,bytes:bytes.length,sha256:sha(bytes),mimeType:'image/jpeg'};
 });
 map.set('job',{id,index:17,status:'IMAGES_READY',outputs});
 return {storage:{get:async k=>map.get(k)},map,id};
}
test('reads all 17 persisted image chunks',async()=>{const f=fixture();const r=await readPersistedRunnerImages(f.storage,{expectedJobId:f.id});assert.equal(r.assets.length,17);assert.equal(r.assets[16].scene,'THUMBNAIL');});
test('rejects missing chunks',async()=>{const f=fixture();f.map.delete('image:1:0');await assert.rejects(readPersistedRunnerImages(f.storage,{expectedJobId:f.id}),/RUNNER_IMAGE_CHUNK_MISSING/);});
test('rejects changed image bytes',async()=>{const f=fixture();f.map.set('image:0:0',new Uint8Array(Buffer.from('tampered')));await assert.rejects(readPersistedRunnerImages(f.storage,{expectedJobId:f.id}),/RUNNER_IMAGE_CHECKSUM_MISMATCH/);});
test('rejects incomplete or paused runner',async()=>{const f=fixture();f.map.get('job').status='TEST_PAUSED';await assert.rejects(readPersistedRunnerImages(f.storage,{expectedJobId:f.id}),/RUNNER_IMAGES_NOT_READY/);});
test('rejects mismatched job identity',async()=>{const f=fixture();await assert.rejects(readPersistedRunnerImages(f.storage,{expectedJobId:'e'.repeat(64)}),/RUNNER_IMAGES_NOT_READY/);});
