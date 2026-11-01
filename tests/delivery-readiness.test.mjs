import test from 'node:test';
import assert from 'node:assert/strict';
import {deliveryReadiness} from '../lib/ldb/delivery-readiness.mjs';
test('unready runner remains fail-closed',()=>{assert.deepEqual(deliveryReadiness().next,'AWAIT_17_IMAGES');assert.equal(deliveryReadiness().autoProductionReady,false);});
test('complete image job still requires trusted audit',()=>{const job={status:'IMAGES_READY',index:17,outputs:Array(17).fill({})};const r=deliveryReadiness({job});assert.equal(r.imagesReady,true);assert.equal(r.approvedDeliveryPlanPresent,false);assert.equal(r.next,'AWAIT_TRUSTED_VISUAL_REVIEW');});
test('approval metadata does not silently enable uploads',()=>{const job={status:'IMAGES_READY',index:17,outputs:Array(17).fill({})},delivery={status:'QUEUED',plan:{approvalVerified:true,visualAudit:'PASS'}};const r=deliveryReadiness({job,delivery});assert.equal(r.deliveryConnected,false);assert.equal(r.autoProductionReady,false);assert.equal(r.next,'AWAIT_DELIVERY_CONNECTOR');});
