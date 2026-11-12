import test from 'node:test';
import assert from 'node:assert/strict';
import {workerModules} from '../scripts/ldb-worker-module-graph.mjs';

test('current runner graph contains delivery, control and image dependencies',async()=>{
 const modules=await workerModules('cloudflare/ldb-runner/worker.mjs');
 for(const path of ['cloudflare/ldb-runner/delivery-alarm.mjs','cloudflare/ldb-runner/bridge-probe.mjs','lib/ldb/production-controls.mjs','lib/ldb/cloudflare-image.mjs','lib/ldb/production-delivery.mjs'])assert.ok(modules.has(path),path);
});
test('cycle resolves once and node builtins are not uploaded',async()=>{
 const sources={'cloudflare/a.mjs':"import './b.mjs'; import {Buffer} from 'node:buffer';",'cloudflare/b.mjs':"export {x} from './a.mjs';"};
 let reads=0;const modules=await workerModules('cloudflare/a.mjs',{read:async p=>{reads++;return sources[p];}});
 assert.equal(reads,2);assert.equal(modules.size,2);
});
test('missing, external and escaped dependencies fail before deployment',async()=>{
 await assert.rejects(workerModules('cloudflare/a.mjs',{read:async()=>"import 'third-party-package';"}),/UNSUPPORTED_MODULE_IMPORT/);
 await assert.rejects(workerModules('cloudflare/a.mjs',{read:async()=>"import '../../outside.mjs';"}),/UNSAFE_MODULE_PATH/);
 await assert.rejects(workerModules('cloudflare/not-present.mjs'),/ENOENT/);
});
