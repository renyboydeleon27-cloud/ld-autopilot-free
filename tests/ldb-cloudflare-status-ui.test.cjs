const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('scripts/ldb-cloudflare-status-ui.js','utf8');
const page=fs.readFileSync('ldb-auto-studio.html','utf8');
function harness(response){
 const calls=[],events={},els={
  cfCheck:{disabled:false,addEventListener:(type,cb)=>{events[type]=cb;}},
  cfStatus:{textContent:''},
  cfDetails:{children:[],replaceChildren(){this.children=[];},appendChild(x){this.children.push(x);}}
 };
 const document={getElementById:key=>els[key],createElement:name=>({name,textContent:''})};
 const context={document,fetch:async(url,opts)=>{calls.push({url,opts});return response;}};
 new vm.Script(src,{filename:'ldb-cloudflare-status-ui.js'}).runInNewContext(context);
 return {events,els,calls,click:async()=>events.click(),lines:()=>els.cfDetails.children.map(x=>x.textContent)};
}
test('mobile-first control exists but performs zero network requests before click',()=>{
 const h=harness({ok:true,json:async()=>({})});
 assert.match(page,/id="cfCheck"/);
 assert.match(page,/id="cfStatus" role="status"/);
 assert.match(page,/scripts\/ldb-cloudflare-status-ui\.js/);
 assert.equal(h.calls.length,0);
 assert.match(src,/\/api\/ldb-cloudflare-readiness/);
 assert.doesNotMatch(src,/\bPOST\b|\/jobs|\/resume|\/render\b|innerHTML/);
});
test('one click performs exactly one same-origin GET and shows billing 403 without claiming Free',async()=>{
 const h=harness({ok:true,json:async()=>({
  status:'READ_ONLY_TELEMETRY_CHECKED',
  inferenceCalled:false,inferenceAuthorized:false,productionAccepted:false,
  reportedNeuronsUsed:0,isolatedRunnerProbePresent:false,
  isolatedVaultProbePresent:false,hookV5EstimatedNeurons:104.2,
  hookV5ReservedNeurons:400,hookV5BudgetStatus:'BUDGET_SPACE_ESTIMATED',
  billingReadStatus:'BILLING_READ_PERMISSION_REQUIRED',
  existingV5Worker:false
 })});
 await h.click();
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].url,'/api/ldb-cloudflare-readiness');
 assert.equal(h.calls[0].opts.method,'GET');
 assert.equal(h.calls[0].opts.credentials,'same-origin');
 assert.equal(h.calls[0].opts.redirect,'error');
 assert.equal(h.els.cfCheck.disabled,false);
 assert.match(h.els.cfStatus.textContent,/NO-GO/);
 assert.ok(h.lines().some(s=>/0.*NOT billing approval/.test(s)));
 assert.ok(h.lines().some(s=>/UNVERIFIED.*403/.test(s)));
 assert.ok(h.lines().some(s=>/Isolated binding-probe Workers.*Runner NOT LISTED.*Vault NOT LISTED/.test(s)));
 assert.ok(h.lines().some(s=>/104\.2.*400.*NOT permission/.test(s)));
 assert.ok(h.lines().every(s=>!s.includes('READY_FOR_INFERENCE')));
});
test('unauthorized or production route never shows a success status',async()=>{
 const h=harness({ok:false,status:404});
 await h.click();
 assert.match(h.els.cfStatus.textContent,/NO-GO/);
 assert.deepEqual(h.lines(),[]);
});
test('invalid or unsupported status cannot authorize image rendering',async()=>{
 const h=harness({ok:true,json:async()=>({
  status:'READ_ONLY_TELEMETRY_CHECKED',inferenceCalled:false,
  inferenceAuthorized:true,productionAccepted:false
 })});
 await h.click();
 assert.match(h.els.cfStatus.textContent,/invalid.*NO-GO/);
 assert.deepEqual(h.lines(),[]);
});
test('unexpected service errors fail closed and reset button',async()=>{
 const h=harness({ok:true,json:async()=>{throw Error('private Cloudflare message')}});
 await h.click();
 assert.match(h.els.cfStatus.textContent,/NO-GO/);
 assert.equal(h.els.cfCheck.disabled,false);
 assert.ok(!h.els.cfStatus.textContent.includes('private Cloudflare message'));
});

test('insufficient one-HOOK buffer is clearly blocked on mobile even when telemetry succeeds',async()=>{
 const h=harness({ok:true,json:async()=>({
  status:'READ_ONLY_TELEMETRY_CHECKED',inferenceCalled:false,
  inferenceAuthorized:false,productionAccepted:false,
  reportedNeuronsUsed:8990,hookV5EstimatedNeurons:104.2,
  hookV5ReservedNeurons:400,hookV5BudgetStatus:'INSUFFICIENT_LOCAL_BUFFER',
  billingReadStatus:'BILLING_READ_PERMISSION_REQUIRED',existingV5Worker:false
 })});
 await h.click();
 assert.ok(h.lines().some(x=>/buffer insufficient.*BLOCKED/.test(x)));
 assert.match(h.els.cfStatus.textContent,/NO-GO/);
});

test('present isolated probes require owner review and never trigger modifications',async()=>{
 const h=harness({ok:true,json:async()=>({
  status:'READ_ONLY_TELEMETRY_CHECKED',
  inferenceCalled:false,inferenceAuthorized:false,productionAccepted:false,
  reportedNeuronsUsed:0,billingReadStatus:'BILLING_READ_PERMISSION_REQUIRED',
  existingV5Worker:false,isolatedRunnerProbePresent:true,isolatedVaultProbePresent:true
 })});
 await h.click();
 assert.ok(h.lines().some(s=>/Runner PRESENT.*Vault PRESENT/.test(s)));
 assert.match(h.els.cfStatus.textContent,/NO-GO/);
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].opts.method,'GET');
});


test('one-tap HOOK V5 preflight reports candidate without POST, inference or billing approval',async()=>{
 const h=harness({ok:true,json:async()=>({
  status:'READ_ONLY_TELEMETRY_CHECKED',inferenceCalled:false,
  inferenceAuthorized:false,productionAccepted:false,
  workersListHttpStatus:200,graphqlSchemaHttpStatus:200,usageHttpStatus:200,
  reportedNeuronsUsed:0,hookV5EstimatedNeurons:104.2,
  hookV5ReservedNeurons:400,hookV5BudgetStatus:'BUDGET_SPACE_ESTIMATED',
  existingV5Worker:false,billingReadStatus:'BILLING_READ_PERMISSION_REQUIRED',
  isolatedRunnerProbePresent:true,isolatedVaultProbePresent:true
 })});
 assert.match(page,/Prepare HOOK V5 test · READ ONLY/);
 assert.equal(h.calls.length,0,'do not make a request on page load');
 await h.click();
 assert.equal(h.calls.length,1,'exactly one GET only');
 assert.equal(h.calls[0].url,'/api/ldb-cloudflare-readiness');
 assert.equal(h.calls[0].opts.method,'GET');
 assert.match(h.els.cfStatus.textContent,/Image NOT generated.*Production NO-GO/);
 assert.ok(h.lines().some(x=>/candidate.*does NOT confirm Workers Free/.test(x)));
 assert.ok(h.lines().some(x=>/fresh same-day attestation.*trusted cloud executor/.test(x)));
});

test('preflight blocks unsafe usage evidence, insufficient buffer and existing Worker',async()=>{
 const baseline={status:'READ_ONLY_TELEMETRY_CHECKED',
  inferenceCalled:false,inferenceAuthorized:false,productionAccepted:false,
  workersListHttpStatus:200,graphqlSchemaHttpStatus:200,usageHttpStatus:200,
  reportedNeuronsUsed:0,hookV5EstimatedNeurons:104.2,
  hookV5ReservedNeurons:400,hookV5BudgetStatus:'BUDGET_SPACE_ESTIMATED',
  existingV5Worker:false,billingReadStatus:'BILLING_READ_PERMISSION_REQUIRED'};
 for(const variation of [
  {workersListHttpStatus:401},
  {usageHttpStatus:403},
  {reportedNeuronsUsed:undefined},
  {hookV5BudgetStatus:'INSUFFICIENT_LOCAL_BUFFER'},
  {existingV5Worker:true},
  {existingV5Worker:null},
  {billingReadStatus:'PAID_WORKERS_SUBSCRIPTION_DETECTED'}
 ]){
  const h=harness({ok:true,json:async()=>({...baseline,...variation})});
  await h.click();
  assert.match(h.els.cfStatus.textContent,/incomplete or blocked.*NO-GO/,
   'variation '+JSON.stringify(variation)+' must fail closed');
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0].opts.method,'GET');
 }
});
