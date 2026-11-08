// Operator-initiated only; no OAuth, uploads, Gmail, or AI inference.
(()=>{'use strict';
 const btn=document.getElementById('deliveryCheck');
 const status=document.getElementById('deliveryStatus');
 const details=document.getElementById('deliveryDetails');
 if(!btn||!status||!details)return;
 const show=lines=>{
  details.replaceChildren();
  for(const line of lines){
   const li=document.createElement('li');
   li.textContent=line;
   details.appendChild(li);
  }
 };
 btn.addEventListener('click',async()=>{
  if(btn.disabled)return;
  btn.disabled=true;
  status.textContent='Checking only this preview branch configuration…';
  show([]);
  try{
   const response=await fetch('/api/ldb-delivery-readiness',{
    method:'GET',credentials:'same-origin',redirect:'error',cache:'no-store',
    headers:{Accept:'application/json'}
   });
   if(!response.ok){
    status.textContent='Read-only delivery diagnostic unavailable. Production remains NO-GO.';
    return;
   }
   const data=await response.json();
   if(!data||
      !['PREVIEW_DELIVERY_CONFIG_INCOMPLETE','PREVIEW_CONFIG_PRESENT_UNVERIFIED'].includes(data.status)||
      data.productionReady!==false||data.googleApiCalled!==false||
      data.gmailApiCalled!==false||data.deliveryBridgeEnabled!==false||
      data.driveConnectionVerified!==false||data.gmailConnectionVerified!==false||
      data.driveFilesVerified!==0||data.driveFilesExpected!==69||
      data.gmailMilestonesVerified!==0||data.gmailMilestonesExpected!==4||
      !Number.isInteger(data.configuredEntries)||
      !Number.isInteger(data.expectedConfigurationEntries)||
      !Array.isArray(data.missingKeys)||
      data.missingKeys.some(k=>typeof k!=='string'||!/^LDB_GOOGLE_[A-Z_]+$/.test(k)))
    throw Error('INVALID_DIAGNOSTIC');
   status.textContent=data.status==='PREVIEW_DELIVERY_CONFIG_INCOMPLETE'?
    'Google delivery configuration is incomplete on this preview. NO-GO.':
    'Configuration exists; real Google Drive/Gmail connection NOT verified. NO-GO.';
   show([
    'Vercel settings found: '+data.configuredEntries+'/'+data.expectedConfigurationEntries+'.',
    ...(()=>{
     const c=data.cloudflareDiagnosticCoverage;
     if(!c||!['ALL_RETURNED','PARTIAL','UNAVAILABLE','NOT_CONFIGURED'].includes(c.status)||
        !Number.isInteger(c.returned)||c.returned<0||c.returned>3||
        c.expected!==3)return [];
     const status=c.status==='ALL_RETURNED'?'All three returned':
      c.status==='PARTIAL'?'PARTIAL — inspect unavailable checks':
      c.status==='NOT_CONFIGURED'?'Cloudflare account token not configured':
      'All Cloudflare checks unavailable';
     const values=['RETURNED','UNAVAILABLE','NOT_CONFIGURED'];
     const checks=c.checks||{};
     const safe=x=>values.includes(x)?x:'UNVERIFIED';
     return ['Cloudflare diagnostic coverage: '+status+' ('+c.returned+'/3), not production readiness.',
      'Quality Vault '+safe(checks.quality)+
      '; isolated probe '+safe(checks.isolated)+
      '; Runner hostname '+safe(checks.host)+'.'];
    })(),
    ...(data.missingKeys.length?['Missing variable names: '+data.missingKeys.join(', ')+'.']:[]),
    'Actual Drive receipts: 0/69. No file was uploaded.',
    'Verified Gmail milestones: 0/4. No email was sent.',
    ...(()=>{
     const cf=data.cloudflareVault;
     if(!cf||!['CLOUDFLARE_WIRING_NOT_VERIFIED','CLOUDFLARE_WIRING_METADATA_MATCHES_OFF'].includes(cf.status)||
        cf.productionReady!==false||cf.googleApiCalled!==false||cf.gmailApiCalled!==false)
      return ['Cloudflare Vault settings: unverified. No real service-binding probe performed.'];
     if(cf.status==='CLOUDFLARE_WIRING_METADATA_MATCHES_OFF')
      return ['Cloudflare Worker settings: expected Vault service binding found; both delivery gates OFF. Metadata only, NOT a working Google connection.'];
     const runner=cf.runnerSettingsHttpStatus;
     const vault=cf.vaultSettingsHttpStatus;
     const states=['METADATA_UNAVAILABLE','MISSING','DUPLICATE','WRONG_TYPE',
      'WRONG_TARGET','ENVIRONMENT_SCOPED','TARGET_MATCH','EXPLICIT_FALSE',
      'EXPLICIT_TRUE','UNEXPECTED_VALUE'];
     const state=x=>typeof x==='string'&&states.includes(x)?x:'NOT_VERIFIED';
     const notes=[];
     if(cf.serviceBindingState!==undefined)
      notes.push('Runner → Vault service binding: '+state(cf.serviceBindingState)+'.');
     if(cf.runnerDeliveryState!==undefined)
      notes.push('Runner delivery flag: '+state(cf.runnerDeliveryState)+'.');
     if(cf.vaultDeliveryState!==undefined)
      notes.push('Vault delivery flag: '+state(cf.vaultDeliveryState)+'.');
     if(cf.vaultOAuthState!==undefined)
      notes.push('Vault OAuth flag: '+state(cf.vaultOAuthState)+'.');
     if(cf.vaultUpdateSafetyStatus==='ACTIVE_VAULT_REQUIRES_OWNER_REVIEW')
      notes.push('Vault code update BLOCKED: active OAuth Vault requires owner review. Never overwrite, disable or rotate keys automatically.');
     if(cf.vaultOAuthState==='EXPLICIT_TRUE'||cf.runnerDeliveryState==='EXPLICIT_TRUE'||cf.vaultDeliveryState==='EXPLICIT_TRUE')
      notes.push('WARNING: At least one safety gate is explicitly ON; no production or Google operations permitted.');
     return ['Cloudflare Vault wiring: not verified (runner HTTP '+
       (Number.isInteger(runner)?runner:'unavailable')+', Vault HTTP '+
       (Number.isInteger(vault)?vault:'unavailable')+').',...notes,
       'No changes made. Keep delivery disabled.'];
    })(),
    ...(()=>{
     const p=data.isolatedProbe;
     if(!p||!['ISOLATED_PROBE_METADATA_MATCHES_SAFE',
       'ISOLATED_PROBE_METADATA_NOT_VERIFIED'].includes(p.status)||
       p.productionReady!==false||p.authenticationVerified!==false||
       p.authenticationProbeCalled!==false||p.workerModified!==false)
      return ['Isolated probe: deployed settings not checked; authentication unverified.'];
     if(p.status==='ISOLATED_PROBE_METADATA_MATCHES_SAFE')
      return ['Isolated Runner and Vault settings match the safety template'+
       (p.serviceEnvironmentState==='PRODUCTION'?
       ' (Cloudflare production target environment)':'')+
       '. This is metadata only; authenticated binding NOT tested.'];
     const names=['RUNNER_ENABLED','FREE_PLAN_CONFIRMED',
      'DELIVERY_BRIDGE_ENABLED','BRIDGE_PROBE_ENABLED'];
     const states=['EXPLICIT_FALSE','EXPLICIT_TRUE','MISSING','DUPLICATE',
      'WRONG_TYPE','UNEXPECTED_VALUE','METADATA_UNAVAILABLE'];
     const allowed=x=>typeof x==='string'&&states.includes(x)?x:'NOT_VERIFIED';
     const service=['TARGET_MATCH','WRONG_TARGET','MISSING','DUPLICATE',
      'WRONG_TYPE','ENVIRONMENT_SCOPED','METADATA_UNAVAILABLE'];
     const reason=service.includes(p.serviceBindingState)?p.serviceBindingState:'NOT_VERIFIED';
     const lines=['Isolated probe settings: NOT VERIFIED (Runner HTTP '+
      (Number.isInteger(p.runnerSettingsHttpStatus)?p.runnerSettingsHttpStatus:'unavailable')+
      ', Vault HTTP '+
      (Number.isInteger(p.vaultSettingsHttpStatus)?p.vaultSettingsHttpStatus:'unavailable')+
      ').', 'Isolated Runner → Vault service: '+reason+'.'];
     for(const name of names)
      if(p.runnerChecks&&name in p.runnerChecks)
       lines.push('Probe Runner '+name+': '+allowed(p.runnerChecks[name])+'.');
     for(const name of ['VAULT_ENABLED','DELIVERY_BRIDGE_ENABLED','BRIDGE_PROBE_ENABLED'])
      if(p.vaultChecks&&name in p.vaultChecks)
       lines.push('Probe Vault '+name+': '+allowed(p.vaultChecks[name])+'.');
     if(p.unexpectedRunnerBindings===true||p.unexpectedVaultBindings===true)
      lines.push('WARNING: Unreviewed Worker binding detected. No redeployment permitted.');
     lines.push('Authenticated Worker-to-Worker probe NOT run. Existing Workers remain untouched.');
     return lines;
    })(),
    ...(()=>{
     const p=data.isolatedProbe;
     if(!p||p.productionReady!==false||p.authenticationVerified!==false||
        p.authenticationProbeCalled!==false)return [];
     const good=['SECRET_BINDINGS_LISTED_UNVERIFIED',
      'SECRET_BINDINGS_NOT_LISTED_IN_SETTINGS',
      'SECRET_BINDING_METADATA_UNAVAILABLE','INVALID_PROBE_SECRET_BINDINGS'];
     if(!good.includes(p.authSetupStatus))return [];
     if(p.authSetupStatus==='SECRET_BINDINGS_LISTED_UNVERIFIED')
      return ['Probe authentication bindings: required binding names visible in Worker metadata. Their secret values, permissions and matching credentials are NOT verified. No live authentication test.'];
     if(p.authSetupStatus==='INVALID_PROBE_SECRET_BINDINGS')
      return ['Probe authentication bindings: wrong type or duplicate detected. Health test BLOCKED. Do not paste secrets or redeploy the existing Workers.'];
     if(p.authSetupStatus==='SECRET_BINDING_METADATA_UNAVAILABLE')
      return ['Probe authentication bindings: metadata unavailable. Cannot determine whether probe secrets are configured.'];
     return ['Probe authentication bindings: one or more required bindings NOT LISTED in Worker settings. They might be absent or omitted by this API; do not assume credentials exist.'];
    })(),
    ...(()=>{
     const host=data.probeHost;
     if(!host||host.productionReady!==false||
        host.workerModified!==false||host.ownerSecretSent!==false||
        host.authenticatedProbeCalled!==false)
      return ['Isolated Runner domain ownership: metadata not verified.'];
     if(host.status==='PROBE_HOST_METADATA_READY'&&
        host.accountSubdomainValid===true&&host.runnerWorkersDevEnabled===true&&
        host.accountHostMetadataVerified===true)
      return ['Isolated Runner workers.dev hostname: correct account subdomain and Worker publishing confirmed in Cloudflare metadata. Owner-authenticated health request NOT made.'];
     if(host.status!=='PROBE_HOST_METADATA_NOT_VERIFIED')
      return ['Isolated Runner hostname: unexpected diagnostic; no authentication permission.'];
     const account=host.accountReadHttpStatus;
     const script=host.scriptReadHttpStatus;
     return ['Isolated Runner domain metadata NOT VERIFIED (account HTTP '+
      (Number.isInteger(account)?account:'unavailable')+', Worker HTTP '+
      (Number.isInteger(script)?script:'unavailable')+').',
      host.runnerWorkersDevEnabled===false?
       'Isolated Runner workers.dev endpoint is disabled; do not send owner credentials.':
       'Hostname metadata incomplete; do not send owner credentials.'];
    })(),
    'Cloudflare Vault live binding probe, Google OAuth and delivery receipts need separate authenticated checks.',
    'Never paste any secret token, OAuth key or password into GitHub or ChatGPT.'
   ]);
  }catch{
   status.textContent='Delivery diagnostic invalid or unavailable. Production remains NO-GO.';
   show([]);
  }finally{btn.disabled=false;}
 });
})();
