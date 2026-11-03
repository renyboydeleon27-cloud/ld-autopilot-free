import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {durableDeliveryAssetReader} from '../lib/ldb/durable-delivery-asset-reader.mjs';
import {durableTextAssetStore} from '../lib/ldb/durable-text-assets.mjs';
import {ALL_SCENES} from '../lib/ldb/verified-image-handoff.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
test('combined reader recovers image and text from persisted storage',async()=>{
 const id='a'.repeat(64),image=Buffer.from('image bytes'),words=Buffer.from('narration bytes'),images=new Map();
 const img={scene:'HOOK',category:'Approved reference images',key:'b'.repeat(64),sha256:sha(image),bytes:image.length,mimeType:'image/jpeg'};
 images.set('job',{id,index:17,status:'IMAGES_READY',outputs:[{...img,chunks:1},...ALL_SCENES.slice(1).map(scene=>({scene}))]});
 images.set('image:0:0',new Uint8Array(image));
 const imageStorage={get:async k=>images.get(k)},records=new Map();
 const textStorage={get:async k=>records.get(k),transaction:async fn=>fn({get:async k=>records.get(k),put:async(k,v)=>records.set(k,v)})};
 const narration={category:'Narration',key:'c'.repeat(64),sha256:sha(words),bytes:words.length,mimeType:'text/plain'};
 await durableTextAssetStore(textStorage,{jobId:id}).put(narration,words);
 const reader=durableDeliveryAssetReader({imageStorage,textStorage,jobId:id});
 assert.deepEqual(await reader(img),image);assert.deepEqual(await reader(narration),words);
 images.delete('image:0:0');
 await assert.rejects(reader(img),/RUNNER_IMAGE_CHUNK_MISSING/);
 assert.deepEqual(await reader(narration),words);
});

test('rejects thumbnail/category swaps before reading image storage',async()=>{
 const id='a'.repeat(64),imageStorage={get:async()=>{throw Error('STORAGE_SHOULD_NOT_BE_READ');}};
 const records=new Map(),textStorage={get:async k=>records.get(k),transaction:async fn=>fn({get:async k=>records.get(k),put:async(k,v)=>records.set(k,v)})};
 const reader=durableDeliveryAssetReader({imageStorage,textStorage,jobId:id});
 const base={key:'b'.repeat(64),sha256:'c'.repeat(64),bytes:10,mimeType:'image/png'};
 await assert.rejects(reader({...base,scene:'THUMBNAIL',category:'Approved reference images'}),/RUNNER_IMAGE_CATEGORY_MISMATCH/);
 await assert.rejects(reader({...base,scene:'HOOK',category:'Thumbnail'}),/RUNNER_IMAGE_CATEGORY_MISMATCH/);
});
