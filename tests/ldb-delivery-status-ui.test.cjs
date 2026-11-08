const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('scripts/ldb-delivery-status-ui.js','utf8');
const html=fs.readFileSync('ldb-auto-studio.html','utf8');
function setup(response){
 const events={},calls=[],elements={
  deliveryCheck:{disabled:false,addEventListener:(t,fn)=>events[t]=fn},
  deliveryStatus:{textContent:''},
  deliveryDetails:{children:[],replaceChildren(){this.children=[];},appendChild(el){this.children.push(el);}}
 };
 const document={getElementById:id=>elements[id],createElement:tag=>({tag,textContent:''})};
 new vm.Script(code).runInNewContext({document,fetch:async(url,opts)=>{calls.push({url,opts});return response;}});
 return {calls,elements,click:async()=>events.click(),lines:()=>elements.deliveryDetails.children.map(el=>el.textContent)};
}
function result(extra={}){
 return {status:'PREVIEW_DELIVERY_CONFIG_INCOMPLETE',configuredEntries:0,
  expectedConfigurationEntries:6,missingKeys:['LDB_GOOGLE_VAULT_URL'],
  productionReady:false,googleApiCalled:false,gmailApiCalled:false,
  deliveryBridgeEnabled:false,driveConnectionVerified:false,
  gmailConnectionVerified:false,driveFilesVerified:0,driveFilesExpected:69,
  gmailMilestonesVerified:0,gmailMilestonesExpected:4,...extra};
}
test('only a manual click triggers the new delivery check',()=>{
 const h=setup({ok:true,json:async()=>result()});
 assert.match(html,/id="deliveryCheck"/);
 assert.match(html,/ldb-delivery-status-ui\.js/);
 assert.equal(h.calls.length,0);
 assert.doesNotMatch(code,/\bPOST\b|innerHTML|\/jobs|\/upload|\/send/);
});
test('explicit click sends exactly one same-origin GET and shows missing keys',async()=>{
 const h=setup({ok:true,json:async()=>result()});
 await h.click();
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].url,'/api/ldb-delivery-readiness');
 assert.equal(h.calls[0].opts.method,'GET');
 assert.equal(h.calls[0].opts.redirect,'error');
 assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
 assert.ok(h.lines().some(s=>s.includes('LDB_GOOGLE_VAULT_URL')));
 assert.ok(h.lines().some(s=>s.includes('0/69')));
 assert.ok(h.lines().some(s=>s.includes('0/4')));
 assert.equal(h.elements.deliveryCheck.disabled,false);
});
test('Cloudflare wiring match is correctly distinguished from real Google connection',async()=>{
 const h=setup({ok:true,json:async()=>result({
  cloudflareVault:{status:'CLOUDFLARE_WIRING_METADATA_MATCHES_OFF',
   productionReady:false,googleApiCalled:false,gmailApiCalled:false}
 })});
 await h.click();
 assert.ok(h.lines().some(x=>/expected Vault service binding found/.test(x)));
 assert.ok(h.lines().some(x=>/NOT a working Google connection/.test(x)));
 assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
});
test('Cloudflare metadata permission failures still give no release permission',async()=>{
 const h=setup({ok:true,json:async()=>result({
  cloudflareVault:{status:'CLOUDFLARE_WIRING_NOT_VERIFIED',
   productionReady:false,googleApiCalled:false,gmailApiCalled:false,
   runnerSettingsHttpStatus:403,vaultSettingsHttpStatus:404}
 })});
 await h.click();
 assert.ok(h.lines().some(x=>/runner HTTP 403, Vault HTTP 404/.test(x)));
 assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
});
test('all configuration present still does not imply delivery complete',async()=>{
 const h=setup({ok:true,json:async()=>result({
  status:'PREVIEW_CONFIG_PRESENT_UNVERIFIED',configuredEntries:6,missingKeys:[]
 })});
 await h.click();
 assert.match(h.elements.deliveryStatus.textContent,/NOT verified.*NO-GO/);
});
test('invalid or unauthorized responses fail closed without showing sensitive data',async()=>{
 for(const response of [
  {ok:false,status:404},
  {ok:true,json:async()=>result({productionReady:true})},
  {ok:true,json:async()=>{throw Error('very secret')}}
 ]){
  const h=setup(response);
  await h.click();
  assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
  assert.equal(h.lines().length,0);
  assert.equal(h.elements.deliveryCheck.disabled,false);
  assert.ok(!h.elements.deliveryStatus.textContent.includes('very secret'));
 }
});

test('reasons describe missing or unsafe bindings without revealing Cloudflare response values',async()=>{
 const h=setup({ok:true,json:async()=>result({cloudflareVault:{
  status:'CLOUDFLARE_WIRING_NOT_VERIFIED',
  productionReady:false,googleApiCalled:false,gmailApiCalled:false,
  serviceBindingState:'WRONG_TARGET',runnerDeliveryState:'MISSING',
  vaultDeliveryState:'UNEXPECTED_VALUE',vaultOAuthState:'EXPLICIT_TRUE',
  vaultUpdateSafetyStatus:'ACTIVE_VAULT_REQUIRES_OWNER_REVIEW',
  runnerSettingsHttpStatus:200,vaultSettingsHttpStatus:200
 }})});
 await h.click();
 const lines=h.lines().join('\n');
 assert.match(lines,/service binding: WRONG_TARGET/);
 assert.match(lines,/Runner delivery flag: MISSING/);
 assert.match(lines,/Vault delivery flag: UNEXPECTED_VALUE/);
 assert.match(lines,/Vault OAuth flag: EXPLICIT_TRUE/);
 assert.match(lines,/safety gate is explicitly ON/);
 assert.match(lines,/Vault code update BLOCKED/);
 assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
});

test('separate isolated Workers metadata matches safe defaults but never claims authentication',async()=>{
 const h=setup({ok:true,json:async()=>result({
  isolatedProbe:{status:'ISOLATED_PROBE_METADATA_MATCHES_SAFE',
   authenticationProbeCalled:false,authenticationVerified:false,
   workerModified:false,productionReady:false}
 })});
 await h.click();
 assert.ok(h.lines().some(s=>/match the safety template/.test(s)));
 assert.ok(h.lines().some(s=>/authenticated binding NOT tested/.test(s)));
 assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].opts.method,'GET');
});
test('isolated probe flag mismatch and unreviewed bindings remain blocked',async()=>{
 const h=setup({ok:true,json:async()=>result({
  isolatedProbe:{status:'ISOLATED_PROBE_METADATA_NOT_VERIFIED',
   runnerSettingsHttpStatus:200,vaultSettingsHttpStatus:200,
   serviceBindingState:'WRONG_TARGET',
   runnerChecks:{RUNNER_ENABLED:'EXPLICIT_FALSE',FREE_PLAN_CONFIRMED:'EXPLICIT_FALSE',
    DELIVERY_BRIDGE_ENABLED:'EXPLICIT_FALSE',BRIDGE_PROBE_ENABLED:'MISSING'},
   vaultChecks:{VAULT_ENABLED:'EXPLICIT_TRUE',DELIVERY_BRIDGE_ENABLED:'MISSING',
    BRIDGE_PROBE_ENABLED:'EXPLICIT_TRUE'},
   unexpectedRunnerBindings:true,unexpectedVaultBindings:false,
   authenticationProbeCalled:false,authenticationVerified:false,
   workerModified:false,productionReady:false}
 })});
 await h.click();
 const lines=h.lines().join('\n');
 assert.match(lines,/Isolated Runner → Vault service: WRONG_TARGET/);
 assert.match(lines,/Probe Vault VAULT_ENABLED: EXPLICIT_TRUE/);
 assert.match(lines,/Unreviewed Worker binding detected/);
 assert.match(lines,/Authenticated Worker-to-Worker probe NOT run/);
 assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
});

test('secret-binding names visible in metadata never become claimed authentication',async()=>{
 const h=setup({ok:true,json:async()=>result({isolatedProbe:{
  status:'ISOLATED_PROBE_METADATA_MATCHES_SAFE',
  authSetupStatus:'SECRET_BINDINGS_LISTED_UNVERIFIED',
  authenticationProbeCalled:false,authenticationVerified:false,
  workerModified:false,productionReady:false
 }})});
 await h.click();
 assert.ok(h.lines().some(s=>/required binding names visible/.test(s)));
 assert.ok(h.lines().some(s=>/NOT verified/.test(s)));
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].opts.method,'GET');
 assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
});
test('missing and malformed probe bindings show fail-closed guidance',async()=>{
 for(const setupStatus of [
  'SECRET_BINDINGS_NOT_LISTED_IN_SETTINGS','INVALID_PROBE_SECRET_BINDINGS',
  'SECRET_BINDING_METADATA_UNAVAILABLE'
 ]){
  const h=setup({ok:true,json:async()=>result({isolatedProbe:{
   status:'ISOLATED_PROBE_METADATA_NOT_VERIFIED',
   authSetupStatus:setupStatus,
   authenticationProbeCalled:false,authenticationVerified:false,
   workerModified:false,productionReady:false
  }})});
  await h.click();
  assert.ok(h.lines().some(s=>/Probe authentication bindings:/.test(s)));
  assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
 }
});

test('Cloudflare account probe host metadata appears without triggering an authenticated request',async()=>{
 const h=setup({ok:true,json:async()=>result({
  probeHost:{status:'PROBE_HOST_METADATA_READY',accountSubdomainValid:true,
   runnerWorkersDevEnabled:true,accountHostMetadataVerified:true,
   authenticatedProbeCalled:false,ownerSecretSent:false,
   workerModified:false,productionReady:false}
 })});
 await h.click();
 assert.ok(h.lines().some(s=>/correct account subdomain/.test(s)));
 assert.ok(h.lines().some(s=>/Owner-authenticated health request NOT made/.test(s)));
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].opts.method,'GET');
 assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
});
test('unpublished or inaccessible Runner domain never claims the owner secret may be sent',async()=>{
 for(const probeHost of [
  {status:'PROBE_HOST_METADATA_NOT_VERIFIED',runnerWorkersDevEnabled:false,
   accountReadHttpStatus:200,scriptReadHttpStatus:200},
  {status:'PROBE_HOST_METADATA_NOT_VERIFIED',runnerWorkersDevEnabled:null,
   accountReadHttpStatus:403,scriptReadHttpStatus:404}
 ]){
  const h=setup({ok:true,json:async()=>result({probeHost:{
   ...probeHost,accountHostMetadataVerified:false,
   authenticatedProbeCalled:false,ownerSecretSent:false,
   productionReady:false,workerModified:false
  }})});
  await h.click();
  assert.ok(h.lines().some(s=>/domain metadata NOT VERIFIED/.test(s)));
  assert.ok(h.lines().some(s=>/do not send owner credentials/.test(s)));
  assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
 }
});

test('partial Cloudflare diagnostics show per-check status without falsely passing delivery',async()=>{
 const h=setup({ok:true,json:async()=>result({
  cloudflareDiagnosticCoverage:{
   status:'PARTIAL',returned:2,expected:3,
   checks:{quality:'RETURNED',isolated:'UNAVAILABLE',host:'RETURNED'}
  }
 })});
 await h.click();
 const lines=h.lines().join('\n');
 assert.match(lines,/diagnostic coverage: PARTIAL.*2\/3/);
 assert.match(lines,/Quality Vault RETURNED; isolated probe UNAVAILABLE; Runner hostname RETURNED/);
 assert.match(h.elements.deliveryStatus.textContent,/NO-GO/);
 assert.equal(h.calls.length,1);
});
