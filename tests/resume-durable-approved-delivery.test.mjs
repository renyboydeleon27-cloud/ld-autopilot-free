import test from 'node:test';
import assert from 'node:assert/strict';
import {resumeDurableApprovedDelivery} from '../lib/ldb/resume-durable-approved-delivery.mjs';
import {ProductionDelivery} from '../lib/ldb/production-delivery.mjs';
test('reconstructs coordinator without uploading or accessing secrets',()=>{
 let uploads=0;
 const storage={transaction:async fn=>fn({})},imageStorage={get:async()=>null},textStorage={get:async()=>null,transaction:async fn=>fn({})};
 const coordinator=resumeDurableApprovedDelivery({deliveryStorage:storage,imageStorage,textStorage,jobId:'a'.repeat(64),drive:{put:async()=>{uploads++;}},capacity:async()=>({unlimited:true})});
 assert.ok(coordinator instanceof ProductionDelivery);
 assert.equal(uploads,0);
});
test('fails closed without trusted backend and storage',()=>{
 assert.throws(()=>resumeDurableApprovedDelivery(),/TRUSTED_DELIVERY_BACKEND_REQUIRED/);
 assert.throws(()=>resumeDurableApprovedDelivery({deliveryStorage:{transaction(){}},drive:{put(){}},capacity(){},jobId:'bad'}),/TRUSTED_IMAGE_STORAGE_REQUIRED/);
});
