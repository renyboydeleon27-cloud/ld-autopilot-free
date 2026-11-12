import {createHash,randomBytes} from 'node:crypto';
import {SENDER,RECIPIENT} from '../../lib/ldb/google-delivery.mjs';
import {createVaultLocalDriveBackend} from './delivery-backend.mjs';
const key=s=>createHash('sha256').update('ldb-google-acceptance-v1:'+s).digest('hex');
const mailKey='acceptance:google-mail-v1';
const messageId=/^[A-Za-z0-9_-]{8,200}$/;
function receipt(record){
 if(record==null)return null;
 const invalid=()=>{throw Error('ACCEPTANCE_RECEIPT_INTEGRITY_FAILED')};
 if(typeof record!=='object'||Array.isArray(record)||
    !['CLAIMED','UNCERTAIN','SENT'].includes(record.status))invalid();
 const keys=Object.keys(record).sort().join(',');
 const legacySent=record.status==='SENT'&&keys==='id,status'&&
  typeof record.id==='string'&&messageId.test(record.id);
 const sent=record.status==='SENT'&&keys==='messageIdSha256,status'&&
  typeof record.messageIdSha256==='string'&&/^[a-f0-9]{64}$/.test(record.messageIdSha256);
 const claim=record.status==='CLAIMED'&&keys==='claimId,status'&&
  typeof record.claimId==='string'&&/^[a-f0-9]{32}$/.test(record.claimId);
 if(!legacySent&&!sent&&!claim&&!(keys==='status'&&record.status!=='SENT'))invalid();
 return {status:record.status};
}
export async function acceptance(storage,vault,fetcher=(...args)=>globalThis.fetch(...args)){
 // Validate before any OAuth or Drive request; corruption is not a fresh send.
 let mail=receipt(await storage.get(mailKey));
 const {drive}=createVaultLocalDriveBackend({storage,vault,enabled:true,fetcher});
 const folder=await drive.put({key:key('folder'),name:'NER STUDIO - Connection Test',mimeType:'application/vnd.google-apps.folder'});
 const bytes=Buffer.from('NER STUDIO Google integration acceptance test.\nThis test file verifies cloud delivery only. Lake Nyos production is not complete.\n');
 const file=await drive.put({key:key('file'),name:'connection-test.txt',parentId:folder.id,mimeType:'text/plain',bytes});
 if(!mail){
  const token=await vault.accessToken();
  const claimId=randomBytes(16).toString('hex');
  const claimed=await storage.transaction(async tx=>{if(receipt(await tx.get(mailKey)))return false;await tx.put(mailKey,{status:'CLAIMED',claimId});return true;});
  if(claimed){
   const content='NER STUDIO connection test\n\nGoogle refresh succeeded. A test file was uploaded and its checksums verified.\nDrive test folder: https://drive.google.com/drive/folders/'+folder.id+'\n\nThis is a connection test, not a production milestone. Lake Nyos production is not complete.\n';
   const mime=[`From: ${SENDER}`,`To: ${RECIPIENT}`,'Subject: NER STUDIO - Google connection test','Message-ID: <ldb-google-acceptance-v1@ld-autopilot-free.vercel.app>','MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',Buffer.from(content).toString('base64')].join('\r\n');
   mail={status:'UNCERTAIN'};
   try{const r=await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',redirect:'manual',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({raw:Buffer.from(mime).toString('base64url')}),signal:AbortSignal.timeout(20000)});if(r.ok===true){const d=await r.json();if(typeof d?.id==='string'&&messageId.test(d.id))mail={status:'SENT',messageIdSha256:createHash('sha256').update(d.id).digest('hex')};}}catch{}
   mail=await storage.transaction(async tx=>{
    const current=await tx.get(mailKey);
    if(current==null){
     await tx.put(mailKey,{status:'UNCERTAIN'});return {status:'UNCERTAIN'};
    }
    receipt(current);
    if(current.status!=='CLAIMED'||current.claimId!==claimId)return {status:'UNCERTAIN'};
    await tx.put(mailKey,mail);return receipt(mail);
   });
  }else mail=receipt(await storage.get(mailKey))||{status:'CLAIMED'};
 }
 return {driveVerified:file.status==='VERIFIED',fileId:file.id,folderId:folder.id,sha256:file.sha256,gmailStatus:mail.status,productionComplete:false};
}
