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
    'Cloudflare Vault live binding probe, Google OAuth and delivery receipts need separate authenticated checks.',
    'Never paste any secret token, OAuth key or password into GitHub or ChatGPT.'
   ]);
  }catch{
   status.textContent='Delivery diagnostic invalid or unavailable. Production remains NO-GO.';
   show([]);
  }finally{btn.disabled=false;}
 });
})();
