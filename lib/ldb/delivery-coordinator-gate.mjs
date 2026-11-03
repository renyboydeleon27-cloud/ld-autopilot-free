// Development-only, read-only Cloudflare delivery gate.
// Inspect only the trusted ProductionDelivery snapshot; never initiate uploads.
import {validateDeliveryPlan} from './production-delivery.mjs';

const fail=code=>{throw Error(code);};
export function validateDeliverySnapshot(plan, snapshot) {
  // Full production validation enforces all 69 assets, including the exact
  // HOOK/P1-P14/ENDING/THUMBNAIL scene identities and visual approval.
  const fingerprint=validateDeliveryPlan(plan);
  if (!snapshot || snapshot.plan?.jobId!==plan.jobId || snapshot.fingerprint!==fingerprint) fail('JOB_MISMATCH');
  if (snapshot.stopped===true || !['QUEUED','COMPLETE'].includes(snapshot.status)) fail('JOB_BLOCKED');
  if (!Number.isSafeInteger(snapshot.index) || snapshot.index<0 || snapshot.index>plan.assets.length || !Array.isArray(snapshot.verified) || snapshot.verified.length!==snapshot.index) fail('INVALID_CHECKPOINT');
  for (let i=0;i<snapshot.verified.length;i++) {
    const record=snapshot.verified[i],expected=plan.assets[i];
    if (record?.key!==expected.key || record.sha256!==expected.sha256 || record.status!=='VERIFIED' || typeof record.id!=='string' || !record.id.trim()) fail('INVALID_CHECKPOINT');
  }
  if (snapshot.status==='COMPLETE' && snapshot.index!==plan.assets.length) fail('INVALID_CHECKPOINT');
  if (snapshot.status==='QUEUED' && snapshot.index===plan.assets.length) fail('INVALID_CHECKPOINT');
  return Object.freeze({jobId:plan.jobId,verifiedCount:snapshot.index,complete:snapshot.index===plan.assets.length});
}

export function deliveryNextAction(plan, snapshot) {
  const gate=validateDeliverySnapshot(plan,snapshot);
  if (gate.complete) return Object.freeze({type:'READY_FOR_FINAL_VERIFICATION',jobId:gate.jobId});
  const asset=plan.assets[snapshot.index];
  return Object.freeze({type:'VERIFY_OR_UPLOAD',jobId:gate.jobId,assetKey:asset.key});
}
