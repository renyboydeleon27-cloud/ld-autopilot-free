import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assessVaultUpdateSafety,assertVaultUpdateSafety,assertVaultPostUpdate} from '../lib/ldb/vault-update-safety.mjs';
const flags=['VAULT_ENABLED','DELIVERY_BRIDGE_ENABLED','BRIDGE_PROBE_ENABLED','GMAIL_MILESTONES_ENABLED'];
const secrets=['VAULT_KEY','VAULT_SECRET','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'];
const namespace='b'.repeat(32);
const base=()=>[
 ...flags.map(name=>({name,type:'plain_text',text:'false'})),
 {name:'GOOGLE_VAULT',type:'durable_object_namespace',class_name:'LdbGoogleVault',namespace_id:namespace},
 ...secrets.map(name=>({name,type:'secret_text',text:'DO_NOT_PRINT_SECRET'}))
];
test('fully disabled verified bindings permit only a reviewed update, never production readiness',()=>{
 const state=assessVaultUpdateSafety(base());
 assert.equal(state.status,'REVIEWED_VAULT_UPDATE_PRECHECK_PASSED');
 assert.equal(state.eligibleForReviewedUpdate,true);
 assert.equal(state.productionReady,false);
 assert.equal(state.vaultModified,false);
 assert.ok(!JSON.stringify(state).includes('DO_NOT_PRINT_SECRET'));
});
test('LIVE finding VAULT_ENABLED=true blocks an overwrite before any mutations',()=>{
 const live=base().map(b=>b.name==='VAULT_ENABLED'?{...b,text:'true'}:b);
 assert.equal(assessVaultUpdateSafety(live).status,'ACTIVE_VAULT_REQUIRES_OWNER_REVIEW');
 assert.throws(()=>assertVaultUpdateSafety(live),/ACTIVE_VAULT_REQUIRES_OWNER_REVIEW/);
});
test('missing, duplicate, oddly typed or enabled flags all block',()=>{
 for(const name of flags){
  const empty=base().filter(b=>b.name!==name);
  assert.equal(assessVaultUpdateSafety(empty).eligibleForReviewedUpdate,false);
  const duplicate=[...base(),{name,type:'plain_text',text:'false'}];
  assert.equal(assessVaultUpdateSafety(duplicate).status,'VAULT_FLAGS_NOT_SAFELY_DISABLED');
  const on=base().map(b=>b.name===name?{...b,text:'true'}:b);
  assert.equal(assessVaultUpdateSafety(on).eligibleForReviewedUpdate,false);
 }
 assert.equal(assessVaultUpdateSafety(undefined).status,'VAULT_METADATA_NOT_VERIFIED');
});
test('missing or duplicated preexisting namespace and secrets never permit PUT',()=>{
 for(const name of ['GOOGLE_VAULT',...secrets]){
  assert.equal(assessVaultUpdateSafety(base().filter(b=>b.name!==name)).eligibleForReviewedUpdate,false);
  assert.equal(assessVaultUpdateSafety([...base(),base().find(b=>b.name===name)]).eligibleForReviewedUpdate,false);
 }
 const malformed=base().map(b=>b.name==='GOOGLE_VAULT'?{...b,namespace_id:'wrong'}:b);
 assert.equal(assessVaultUpdateSafety(malformed).status,'VAULT_DURABLE_NAMESPACE_UNVERIFIED');
});
test('post-deployment check must preserve durable namespace and disabled flags',()=>{
 const before=base();
 assert.equal(assertVaultPostUpdate(before,structuredClone(before)).status,'VAULT_BINDINGS_PRESERVED');
 const wrongNamespace=base().map(b=>b.name==='GOOGLE_VAULT'?{...b,namespace_id:'c'.repeat(32)}:b);
 assert.throws(()=>assertVaultPostUpdate(before,wrongNamespace),/VAULT_DURABLE_NAMESPACE_CHANGED/);
 const changedFlags=base().map(b=>b.name==='DELIVERY_BRIDGE_ENABLED'?{...b,text:'true'}:b);
 assert.throws(()=>assertVaultPostUpdate(before,changedFlags),/VAULT_FLAGS_NOT_SAFELY_DISABLED/);
});
test('real Google Vault update script invokes safety gate BEFORE any Cloudflare Worker PUT',async()=>{
 const source=await readFile(new URL('../scripts/ldb-update-google-vault.mjs',import.meta.url),'utf8');
 const precheck=source.indexOf('assertVaultUpdateSafety(before.bindings)');
 const put=source.indexOf("await api('/scripts/'+name,{method:'PUT'");
 const post=source.indexOf('assertVaultPostUpdate(before.bindings,after.bindings)');
 assert.ok(precheck>0&&put>precheck&&post>put,'guard must be on the real mutation path');
 assert.ok(source.includes("process.env.VERCEL_GIT_COMMIT_REF!=='feature/ldb-image-acceptance'"));
});
