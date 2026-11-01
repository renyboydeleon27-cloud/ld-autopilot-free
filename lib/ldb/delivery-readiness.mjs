// Read-only operational gate. This never creates approvals, starts image jobs,
// schedules uploads or exposes saved asset bytes.
export function deliveryReadiness({job,delivery}={}){
 const imagesReady=job?.status==='IMAGES_READY'&&job.index===17&&Array.isArray(job.outputs)&&job.outputs.length===17;
 const verified=delivery?.plan?.approvalVerified===true&&delivery?.plan?.visualAudit==='PASS';
 const queued=!!delivery&&['QUEUED','UPLOADING','RETRY_WAIT','WAITING_STORAGE','STOPPED','NEEDS_REVIEW','COMPLETE'].includes(delivery.status);
 return Object.freeze({
  imagesReady,
  approvedDeliveryPlanPresent:verified,
  deliveryCheckpointPresent:queued,
  deliveryConnected:false,
  autoProductionReady:false,
  next:!imagesReady?'AWAIT_17_IMAGES':!verified?'AWAIT_TRUSTED_VISUAL_REVIEW':!queued?'AWAIT_DURABLE_DELIVERY_INTEGRATION':'AWAIT_DELIVERY_CONNECTOR'
 });
}
