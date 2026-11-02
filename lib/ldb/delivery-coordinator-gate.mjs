// Development-only durable delivery gate. No HTTP, credentials or production wiring.
export function validateDeliverySnapshot(plan, snapshot) {
  if (!plan || !snapshot || typeof plan.jobId !== 'string' || snapshot.jobId !== plan.jobId) throw Error('JOB_MISMATCH');
  if (snapshot.status !== 'RUNNING') throw Error('JOB_BLOCKED');
  if (plan.approved !== true || plan.visualApproved !== true) throw Error('APPROVAL_REQUIRED');
  if (!Array.isArray(plan.assets) || plan.assets.length !== 69 || new Set(plan.assets.map(a => a.id)).size !== 69) throw Error('INVALID_PLAN');
  if (!Array.isArray(snapshot.verified)) throw Error('INVALID_CHECKPOINT');
  const ids = new Set(plan.assets.map(a => a.id));
  if (new Set(snapshot.verified).size !== snapshot.verified.length || snapshot.verified.some(id => !ids.has(id))) throw Error('INVALID_CHECKPOINT');
  return Object.freeze({jobId: plan.jobId, verifiedCount: snapshot.verified.length, complete: snapshot.verified.length === 69});
}

export function deliveryNextAction(plan, snapshot) {
  const gate = validateDeliverySnapshot(plan, snapshot);
  if (gate.complete) return Object.freeze({type:'READY_FOR_FINAL_VERIFICATION', jobId:gate.jobId});
  const done = new Set(snapshot.verified);
  const asset = plan.assets.find(item => !done.has(item.id));
  if (!asset || !/^[a-f0-9]{64}$/i.test(asset.sha256 || '') || !Number.isSafeInteger(asset.bytes) || asset.bytes < 0) throw Error('INVALID_ASSET');
  return Object.freeze({type:'VERIFY_OR_UPLOAD', jobId:gate.jobId, assetId:asset.id});
}
