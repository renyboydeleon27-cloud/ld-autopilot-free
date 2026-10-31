import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {durableImageAssetReader} from '../lib/ldb/durable-image-asset-reader.mjs';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(){
 const id='a'.repeat(64),bytes=Buffer.from('persisted-image'),meta={scene:'HOOK',sha256:sha(bytes),bytes:bytes.length,mimeType:'image/jpeg',chunks:1};
 const map=new Map([['job',{id,status:'IMAGES_READY',index:17,outputs:[meta,...ALL_SCENES.slice(1).map(scene=>({scene}))]}],['image:0:0',new Uint8Array(bytes)]]);
 return {id,asset:{...meta,category:'Approved reference images'},map,storage:{get:async key=>map.get(key)}};
}
test('rehydrates verified bytes from durable storage per invocation',async()=>{const f=fixture(),reader=durableImageAssetReader(f.storage,{expectedJobId:f.id});assert.equal((await reader(f.asset)).toString(),'persisted-image');assert.equal((await reader(f.asset)).toString(),'persisted-image');});
test('detects mutation after reader creation',async()=>{const f=fixture(),reader=durableImageAssetReader(f.storage,{expectedJobId:f.id});f.map.set('image:0:0',new Uint8Array(Buffer.from('bad')));await assert.rejects(reader(f.asset),/ASSET_INTEGRITY_FAILED/);});
test('rejects mismatched job and metadata',async()=>{const f=fixture(),reader=durableImageAssetReader(f.storage,{expectedJobId:f.id});f.map.get('job').id='b'.repeat(64);await assert.rejects(reader(f.asset),/RUNNER_IMAGES_NOT_READY/);});
test('rejects missing chunk',async()=>{const f=fixture(),reader=durableImageAssetReader(f.storage,{expectedJobId:f.id});f.map.delete('image:0:0');await assert.rejects(reader(f.asset),/RUNNER_IMAGE_CHUNK_MISSING/);});
test('rejects non-image category',async()=>{const f=fixture(),reader=durableImageAssetReader(f.storage,{expectedJobId:f.id});await assert.rejects(reader({...f.asset,category:'Narration'}),/NOT_RUNNER_IMAGE/);});
