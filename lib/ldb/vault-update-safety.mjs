// Fail-closed pre-deployment guard for the existing quality Google Vault.
// Never logs bindings or credentials; does not modify remote resources.
const SECRETS=Object.freeze(['VAULT_KEY','VAULT_SECRET','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET']);
const FLAGS=Object.freeze(['VAULT_ENABLED','DELIVERY_BRIDGE_ENABLED','BRIDGE_PROBE_ENABLED','GMAIL_MILESTONES_ENABLED']);
const result=(status,allowed=false)=>Object.freeze({
 status,eligibleForReviewedUpdate:allowed,productionReady:false,
 googleApiCalled:false,gmailApiCalled:false,vaultModified:false
});
export function assessVaultUpdateSafety(bindings){
 if(!Array.isArray(bindings))return result('VAULT_METADATA_NOT_VERIFIED');
 const matching=name=>bindings.filter(b=>b?.name===name);
 const vaultEnabled=matching('VAULT_ENABLED');
 if(vaultEnabled.length===1&&vaultEnabled[0].type==='plain_text'&&vaultEnabled[0].text==='true')
  return result('ACTIVE_VAULT_REQUIRES_OWNER_REVIEW');
 for(const name of FLAGS){
  const rows=matching(name);
  if(rows.length!==1||rows[0].type!=='plain_text'||rows[0].text!=='false')
   return result('VAULT_FLAGS_NOT_SAFELY_DISABLED');
 }
 const durable=matching('GOOGLE_VAULT');
 if(durable.length!==1||durable[0].type!=='durable_object_namespace'||
    durable[0].class_name!=='LdbGoogleVault'||
    typeof durable[0].namespace_id!=='string'||
    !/^[a-f0-9]{32}$/i.test(durable[0].namespace_id))
  return result('VAULT_DURABLE_NAMESPACE_UNVERIFIED');
 for(const name of SECRETS){
  const rows=matching(name);
  if(rows.length!==1||rows[0].type!=='secret_text')
   return result('VAULT_EXISTING_SECRETS_UNVERIFIED');
 }
 return result('REVIEWED_VAULT_UPDATE_PRECHECK_PASSED',true);
}
export function assertVaultUpdateSafety(bindings){
 const state=assessVaultUpdateSafety(bindings);
 if(!state.eligibleForReviewedUpdate)throw Error(state.status);
 return state;
}
export function assertVaultPostUpdate(before,after){
 assertVaultUpdateSafety(before);
 assertVaultUpdateSafety(after);
 const previous=before.find(x=>x.name==='GOOGLE_VAULT');
 const next=after.find(x=>x.name==='GOOGLE_VAULT');
 if(next?.namespace_id!==previous?.namespace_id)
  throw Error('VAULT_DURABLE_NAMESPACE_CHANGED');
 return Object.freeze({status:'VAULT_BINDINGS_PRESERVED',productionReady:false});
}
