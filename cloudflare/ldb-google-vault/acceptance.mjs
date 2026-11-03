import {createHash} from 'node:crypto';
import {SENDER,RECIPIENT} from '../../lib/ldb/google-delivery.mjs';
import {createVaultLocalDriveBackend} from './delivery-backend.mjs';
const key=s=>createHash('sha256').update('ldb-google-acceptance-v1:'+s).digest('hex');
export async function acceptance(storage,vault,fetcher=(...args)=>globalThis.fetch(...args)){
 const {drive}=createVaultLocalDriveBackend({storage,vault,enabled:true,fetcher});
 const folder=await drive.put({key:key('folder'),name:'NER STUDIO - Connection Test',mimeType:'application/vnd.google-apps.folder'});
 const bytes=Buffer.from('NER STUDIO Google integration acceptance test.\nThis test file verifies cloud delivery only. Lake Nyos production is not complete.\n');
 const file=await drive.put({key:key('file'),name:'connection-test.txt',parentId:folder.id,mimeType:'text/plain',bytes});
 const mailKey='acceptance:google-mail-v1';
 let mail=await storage.get(mailKey);
 if(!mail){
  const token=await vault.accessToken();
  const claimed=await storage.transaction(async tx=>{if(await tx.get(mailKey))return false;await tx.put(mailKey,{status:'CLAIMED'});return true;});
  if(claimed){
   const content='NER STUDIO connection test\n\nGoogle refresh succeeded. A test file was uploaded and its checksums verified.\nDrive test folder: https://drive.google.com/drive/folders/'+folder.id+'\n\nThis is a connection test, not a production milestone. Lake Nyos production is not complete.\n';
   const mime=[`From: ${SENDER}`,`To: ${RECIPIENT}`,'Subject: NER STUDIO - Google connection test','Message-ID: <ldb-google-acceptance-v1@ld-autopilot-free.vercel.app>','MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',Buffer.from(content).toString('base64')].join('\r\n');
   mail={status:'UNCERTAIN'};
   try{const r=await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',redirect:'manual',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({raw:Buffer.from(mime).toString('base64url')}),signal:AbortSignal.timeout(20000)});if(r.ok){const d=await r.json();if(typeof d.id==='string'&&d.id)mail={status:'SENT',id:d.id};}}catch{}
   await storage.put(mailKey,mail);
  }else mail=await storage.get(mailKey);
 }
 return {driveVerified:file.status==='VERIFIED',fileId:file.id,folderId:folder.id,sha256:file.sha256,gmailStatus:mail.status,productionComplete:false};
}
