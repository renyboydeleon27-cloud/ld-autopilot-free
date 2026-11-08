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
