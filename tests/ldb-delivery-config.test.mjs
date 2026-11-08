import test from 'node:test';
import assert from 'node:assert/strict';
import {GOOGLE_DELIVERY_KEYS,assessLdbDeliveryConfig} from '../lib/ldb/delivery-configuration-check.mjs';
const complete=Object.fromEntries(GOOGLE_DELIVERY_KEYS.map(x=>[x,'not-a-real-secret']));
test('missing scoped preview variables block Drive and Gmail',()=>{
 const out=assessLdbDeliveryConfig();
 assert.equal(out.status,'PREVIEW_DELIVERY_CONFIG_INCOMPLETE');
 assert.deepEqual(out.missingKeys,GOOGLE_DELIVERY_KEYS);
 assert.equal(out.configuredEntries,0);
 assert.equal(out.driveFilesVerified,0);
 assert.equal(out.gmailMilestonesVerified,0);
 assert.equal(out.productionReady,false);
 assert.equal(out.googleApiCalled,false);
});
test('six present variables never imply real OAuth or Drive/Gmail delivery',()=>{
 const out=assessLdbDeliveryConfig({env:complete});
 assert.equal(out.status,'PREVIEW_CONFIG_PRESENT_UNVERIFIED');
 assert.equal(out.configuredEntries,6);
 assert.deepEqual(out.missingKeys,[]);
 assert.equal(out.driveConnectionVerified,false);
 assert.equal(out.gmailConnectionVerified,false);
 assert.equal(out.deliveryBridgeEnabled,false);
 assert.equal(out.productionReady,false);
 assert.ok(!JSON.stringify(out).includes('not-a-real-secret'));
});
test('empty and nonstring variables cannot pass readiness',()=>{
 const out=assessLdbDeliveryConfig({env:{...complete,LDB_GOOGLE_VAULT_KEY:' ',LDB_GOOGLE_COOKIE_KEY:42}});
 assert.deepEqual(out.missingKeys,['LDB_GOOGLE_VAULT_KEY','LDB_GOOGLE_COOKIE_KEY']);
 assert.equal(out.configuredEntries,4);
});
