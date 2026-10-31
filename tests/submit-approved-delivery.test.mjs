import test from 'node:test';
import assert from 'node:assert/strict';
import {submitApprovedDelivery} from '../lib/ldb/submit-approved-delivery.mjs';
test('rejects absent trusted storage before any upload',async()=>{
 let called=false;
 await assert.rejects(submitApprovedDelivery({drive:{put:async()=>{called=true;}},capacity:async()=>({unlimited:true})}),/TRUSTED_DELIVERY_BACKEND_REQUIRED/);
 assert.equal(called,false);
});
test('rejects browser-style approval without a trusted runner job',async()=>{
 let called=false;
 const storage={transaction:async()=>{called=true;}};
 await assert.rejects(submitApprovedDelivery({storage,drive:{put:async()=>{}},capacity:async()=>({unlimited:true}),approvedAudit:{status:'PASS',reviewerVerified:true}}),/IMAGES_NOT_READY/);
 assert.equal(called,false);
});
test('rejects missing capacity checker',async()=>{
 await assert.rejects(submitApprovedDelivery({storage:{transaction:async()=>{}},drive:{put:async()=>{}}}),/TRUSTED_DELIVERY_BACKEND_REQUIRED/);
});
