import test from 'node:test';
import assert from 'node:assert/strict';
import {assertPngContainer} from '../lib/ldb/png-container-gate.mjs';
import {makeTestPng} from './helpers/make-test-png.mjs';

test('accepts actual CRC-correct portrait grayscale and color containers',()=>{
 for(const style of ['gray','color'])
  assert.deepEqual(assertPngContainer(makeTestPng(style)),{width:576,height:1024,format:'PNG'});
});
test('rejects bogus text, fake header, truncation, wrong dimensions and appended data',()=>{
 const good=makeTestPng(),bad=[Buffer.from('not png'),Buffer.alloc(128),
  good.subarray(0,good.length-1),Buffer.concat([good,Buffer.from('tail')])];
 const changed=Buffer.from(good);changed.writeUInt32BE(1024,16);bad.push(changed);
 for(const bytes of bad)assert.throws(()=>assertPngContainer(bytes),/INVALID_STAGED_PNG/);
});
test('CRC tampering at IDAT or IHDR is rejected',()=>{
 const bad=makeTestPng();bad[37]^=1;assert.throws(()=>assertPngContainer(bad),/INVALID_STAGED_PNG/);
 const again=makeTestPng();again[20]^=1;assert.throws(()=>assertPngContainer(again),/INVALID_STAGED_PNG/);
});
