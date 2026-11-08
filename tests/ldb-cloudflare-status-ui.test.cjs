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
  reportedNeuronsUsed:0,billingReadStatus:'BILLING_READ_PERMISSION_REQUIRED',
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
