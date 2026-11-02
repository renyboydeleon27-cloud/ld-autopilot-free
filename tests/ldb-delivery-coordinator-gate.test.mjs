import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDeliverySnapshot, deliveryNextAction} from '../lib/ldb/delivery-coordinator-gate.mjs';

const assets = Array.from({length:69},(_,i)=>({id:'asset-'+i,sha256:'a'.repeat(64),bytes:100}));
const plan = () => ({jobId:'lake-nyos',approved:true,visualApproved:true,assets:structuredClone(assets)});
const state = () => ({jobId:'lake-nyos',status:'RUNNING',verified:[]});

test('first missing asset is selected',()=>assert.equal(deliveryNextAction(plan(),state()).assetId,'asset-0'));
test('completed checkpoint requires final verification',()=>{const s=state();s.verified=assets.map(a=>a.id);assert.equal(deliveryNextAction(plan(),s).type,'READY_FOR_FINAL_VERIFICATION')});
test('STOP prevents delivery',()=>{const s=state();s.status='STOPPED';assert.throws(()=>deliveryNextAction(plan(),s),/JOB_BLOCKED/)});
test('unapproved plan prevents delivery',()=>{const p=plan();p.approved=false;assert.throws(()=>deliveryNextAction(p,state()),/APPROVAL_REQUIRED/)});
test('visual review required',()=>{const p=plan();p.visualApproved=false;assert.throws(()=>deliveryNextAction(p,state()),/APPROVAL_REQUIRED/)});
test('foreign job rejected',()=>{const s=state();s.jobId='other';assert.throws(()=>deliveryNextAction(plan(),s),/JOB_MISMATCH/)});
test('duplicate checkpoint rejected',()=>{const s=state();s.verified=['asset-0','asset-0'];assert.throws(()=>validateDeliverySnapshot(plan(),s),/INVALID_CHECKPOINT/)});
test('unknown asset rejected',()=>{const s=state();s.verified=['foreign'];assert.throws(()=>validateDeliverySnapshot(plan(),s),/INVALID_CHECKPOINT/)});
test('wrong asset count rejected',()=>{const p=plan();p.assets.pop();assert.throws(()=>deliveryNextAction(p,state()),/INVALID_PLAN/)});
test('invalid checksum rejected',()=>{const p=plan();p.assets[0].sha256='bad';assert.throws(()=>deliveryNextAction(p,state()),/INVALID_ASSET/)});
