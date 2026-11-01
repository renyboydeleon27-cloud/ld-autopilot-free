import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {durableTextAssetStore} from '../lib/ldb/durable-text-assets.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function setup(){
 const m=new Map(),storage={get:async k=>m.get(k),transaction:async fn=>fn({get:async k=>m.get(k),put:async(k,v)=>m.set(k,v)})},bytes=Buffer.from('verified narration'),a={key:'b'.repeat(64),sha256:sha(bytes),bytes:bytes.length,mimeType:'text/plain',category:'Narration'};
 return {m,bytes,a,store:durableTextAssetStore(storage,{jobId:'a'.repeat(64)})};
}
test('text bytes survive new reads and repeated idempotent writes',async()=>{const f=setup();await f.store.put(f.a,f.bytes);await f.store.put(f.a,f.bytes);assert.equal((await f.store.read(f.a)).toString(),'verified narration');});
test('rejects corrupted durable chunk',async()=>{const f=setup();await f.store.put(f.a,f.bytes);const k=[...f.m.keys()].find(k=>k.endsWith(':0'));f.m.set(k,new Uint8Array(Buffer.from('tampered')));await assert.rejects(f.store.read(f.a),/ASSET_INTEGRITY_FAILED/);});
test('rejects missing chunk',async()=>{const f=setup();await f.store.put(f.a,f.bytes);f.m.delete([...f.m.keys()].find(k=>k.endsWith(':0')));await assert.rejects(f.store.read(f.a),/TEXT_ASSET_CHUNK_MISSING/);});
test('rejects changed metadata on same asset key',async()=>{const f=setup();await f.store.put(f.a,f.bytes);const changed=Buffer.from('different narration');await assert.rejects(f.store.put({...f.a,sha256:sha(changed),bytes:changed.length},changed),/DELIVERY_ASSET_CHANGED/);});
test('rejects image category and invalid job id',async()=>{const f=setup();await assert.rejects(f.store.put({...f.a,category:'Thumbnail'},f.bytes),/INVALID_TEXT_ASSET/);assert.throws(()=>durableTextAssetStore({get(){},transaction(){}},{jobId:'bad'}),/TRUSTED_TEXT_STORAGE_REQUIRED/);});

test('idempotent writes reject corrupted stored bytes instead of silently accepting',async()=>{const f=setup();await f.store.put(f.a,f.bytes);const k=[...f.m.keys()].find(k=>k.endsWith(':0'));f.m.set(k,Buffer.from('tampered'));await assert.rejects(f.store.put(f.a,f.bytes),/ASSET_INTEGRITY_FAILED/);});
test('text storage rejects unknown delivery categories',async()=>{const f=setup();await assert.rejects(f.store.put({...f.a,category:'Unexpected'},f.bytes),/INVALID_TEXT_ASSET/);});
