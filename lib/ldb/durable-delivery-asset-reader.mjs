// Backend-only resolver. The delivery coordinator can reconstruct this after
// every restart; neither image nor text bytes are held in a long-lived closure.
import {durableImageAssetReader} from './durable-image-asset-reader.mjs';
import {durableTextAssetStore} from './durable-text-assets.mjs';
const fail=code=>{throw Error(code);};
export function durableDeliveryAssetReader({imageStorage,textStorage,jobId}={}){
 const image=durableImageAssetReader(imageStorage,{expectedJobId:jobId});
 const text=durableTextAssetStore(textStorage,{jobId});
 return async asset=>{
  if(!asset||typeof asset.category!=='string')fail('INVALID_DELIVERY_ASSET');
  if(asset.category==='Approved reference images'||asset.category==='Thumbnail')return image(asset);
  return text.read(asset);
 };
}
