// Read-only, allowlisted Cloudflare custom-domain diagnostic for the
// *isolated* Vault Worker. This NEVER returns domain names, provider payloads,
// bearer secrets, or any binding values. One GET; no Worker execution.
const ACCOUNT='a437dda5f38ba6b10991684b8388760b';
const VAULT='ner-ldb-vault-binding-probe';
const URL='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+
 '/workers/domains?service='+VAULT;
const MAX_RESPONSE_BYTES=65536;
const output=(status,httpStatus,details={})=>Object.freeze({
 status,httpStatus,secretRead:false,runnerInvoked:false,workerModified:false,
 ...details
});
export async function inspectIsolatedVaultDomainDiagnostic({
 accountId,token,fetcher=globalThis.fetch
}={}){
 if(accountId!==ACCOUNT||typeof token!=='string'||token.length<20||
    /\s/.test(token)||typeof fetcher!=='function')
  return output('NOT_CONFIGURED',null);
 let response;
 try{
  response=await fetcher(URL,{method:'GET',redirect:'error',
   headers:{Authorization:'Bearer '+token,Accept:'application/json'},
   signal:AbortSignal.timeout(12000)});
 }catch{return output('REQUEST_UNAVAILABLE',null);}
 const httpStatus=Number.isInteger(response?.status)?response.status:null;
 if(httpStatus===401||httpStatus===403)
  return output('DOMAIN_READ_PERMISSION_DENIED',httpStatus);
 if(httpStatus!==200)return output('DOMAIN_API_UNAVAILABLE',httpStatus);
 let doc;
 try{
  if(typeof response.body?.getReader!=='function')
   return output('RESPONSE_UNVERIFIED',200);
  const reader=response.body.getReader(),bufs=[];let bytes=0;
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   bytes+=value.byteLength;
   if(bytes>MAX_RESPONSE_BYTES){
    await reader.cancel().catch(()=>{});
    return output('RESPONSE_UNVERIFIED',200);
   }
   bufs.push(Buffer.from(value));
  }
  doc=JSON.parse(Buffer.concat(bufs).toString('utf8'));
 }catch{return output('RESPONSE_UNVERIFIED',200);}
 if(doc?.success!==true||!Array.isArray(doc.result))
  return output('RESPONSE_UNVERIFIED',200);
 if(doc.result.length!==0)
  return output('CUSTOM_DOMAIN_ROW_RETURNED',200);
 const meta=doc.result_info;
 // The live authenticated probe requires these exact properties. Surface
 // ONLY whether each safety condition holds, never the underlying values.
 const check={
  paginationComplete:meta?.total_pages===1||meta?.total_pages===0,
  firstPage:meta?.page===undefined||meta?.page===1,
  totalCountValid:Number.isInteger(meta?.total_count)&&meta.total_count>=0,
  countZero:meta?.count===undefined||meta?.count===0
 };
 return output(Object.values(check).every(Boolean)?
  'ISOLATED_VAULT_CUSTOM_DOMAIN_CHECK_PASSED':
  'EMPTY_RESULT_PAGINATION_NOT_VERIFIED',200,check);
}
