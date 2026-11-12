// Real, low-entropy 576x1024 test fixtures, never synthetic text posing as PNG.
import {Buffer} from 'node:buffer';
import {deflateSync} from 'node:zlib';
import {pngChunkCrc32} from '../../lib/ldb/png-container-gate.mjs';
const cache=new Map();
function chunk(type,bytes){
 const name=Buffer.from(type,'ascii'),data=Buffer.from(bytes);
 const len=Buffer.alloc(4);len.writeUInt32BE(data.length);
 const crc=Buffer.alloc(4);crc.writeUInt32BE(pngChunkCrc32(Buffer.concat([name,data])));
 return Buffer.concat([len,name,data,crc]);
}
export function makeTestPng(style='gray'){
 if(cache.has(style))return Buffer.from(cache.get(style));
 const channels=style==='color'?3:1;
 if(!['gray','color'].includes(style))throw Error('INVALID_TEST_STYLE');
 const header=Buffer.alloc(13);header.writeUInt32BE(576,0);header.writeUInt32BE(1024,4);
 header[8]=8;header[9]=channels===3?2:0;
 const data=Buffer.alloc(1024*(1+576*channels));
 for(let y=0;y<1024;y++){
  const row=y*(1+576*channels);
  if(channels===1)data.fill(64,row+1,row+577);
  else for(let x=0;x<576;x++){
   const a=row+1+x*3;data[a]=126;data[a+1]=58;data[a+2]=99;
  }
 }
 const image=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',header),chunk('IDAT',deflateSync(data)),chunk('IEND',Buffer.alloc(0))]);
 cache.set(style,image);return Buffer.from(image);
}
