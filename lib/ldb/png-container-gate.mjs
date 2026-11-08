// Container-level PNG verification for staged corrected reference images.
// Does not decode pixel data or claim a grayscale/visual PASS.
import {Buffer} from 'node:buffer';
const SIG=Buffer.from([137,80,78,71,13,10,26,10]);
const fail=()=>{throw Error('INVALID_STAGED_PNG');};
const TABLE=Uint32Array.from({length:256},(_,i)=>{
 let c=i;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
 return c>>>0;
});
export function pngChunkCrc32(bytes){
 let c=0xffffffff;
 for(const b of bytes)c=TABLE[(c^b)&255]^(c>>>8);
 return (c^0xffffffff)>>>0;
}
export function assertPngContainer(bytes,{width=576,height=1024}={}){
 if(!(bytes instanceof Uint8Array)||bytes.length<57||bytes.length>8_000_000)fail();
 const b=Buffer.from(bytes);
 if(!b.subarray(0,8).equals(SIG))fail();
 let pos=8,count=0,hasIdat=false,hasIend=false,seenIhdr=false,seenIdat=false;
 while(pos<b.length){
  if(++count>4096||pos+12>b.length)fail();
  const size=b.readUInt32BE(pos),type=b.toString('ascii',pos+4,pos+8);
  if(!/^[A-Za-z]{4}$/.test(type)||size>b.length-pos-12)fail();
  const dataEnd=pos+12+size;
  const claimed=b.readUInt32BE(dataEnd-4);
  if(pngChunkCrc32(b.subarray(pos+4,dataEnd-4))!==claimed)fail();
  if(!seenIhdr){
   if(type!=='IHDR'||size!==13)fail();
   const w=b.readUInt32BE(pos+8),h=b.readUInt32BE(pos+12);
   const depth=b[pos+16],color=b[pos+17];
   if(w!==width||h!==height||depth!==8||
      ![0,2,4,6].includes(color)||b[pos+18]!==0||b[pos+19]!==0||
      b[pos+20]!==0)fail();
   seenIhdr=true;
  }else if(type==='IHDR')fail();
  if(type==='IDAT'){
   if(hasIend||size===0)fail();
   hasIdat=true;seenIdat=true;
  }else if(seenIdat&&type==='PLTE')fail();
  if(type==='IEND'){
   if(size!==0||!hasIdat||dataEnd!==b.length)fail();
   hasIend=true;
  }
  pos=dataEnd;
  if(hasIend)break;
 }
 if(!hasIend||pos!==b.length)fail();
 return Object.freeze({width,height,format:'PNG'});
}
