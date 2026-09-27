/* LD AUTO — Google Drive one-click backup
   Browser-only OAuth via Google Identity Services.
   Uses least-privilege drive.file scope and stores no client secret or access token. */
(()=>{
'use strict';

const STORE_KEY='ld-autopilot-free-v1';
const CLIENT_KEY='ld-google-drive-client-id-v1';
const FOLDER_KEY='ld-google-drive-backup-folder-id-v1';
const FOLDER_NAME='LD AUTO Backups';
const SCOPE='https://www.googleapis.com/auth/drive.file';
const GIS_SRC='https://accounts.google.com/gsi/client';

let accessToken='';
let tokenExpiresAt=0;
let tokenClient=null;
let pendingAction=null;
let gisPromise=null;

function safeName(value){
 return (value||'living-disaster')
  .replace(/[^a-z0-9]+/gi,'-')
  .replace(/^-|-$/g,'')
  .toLowerCase()||'living-disaster';
}
function currentState(){
 const raw=localStorage.getItem(STORE_KEY);
 if(!raw)return null;
 try{return JSON.parse(raw);}catch{return null;}
}
function toast(text,ms=2600){
 const el=document.getElementById('toast');
 if(!el)return;
 el.textContent=text;el.classList.add('show');
 clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),ms);
}
function clientId(){return String(localStorage.getItem(CLIENT_KEY)||'').trim();}
function tokenValid(){return !!accessToken && Date.now()<tokenExpiresAt-60000;}

function ensureUi(){
 const audit=document.getElementById('auditCard');
 const actions=audit?.querySelector('.audit-actions');
 if(!audit||!actions)return null;

 let button=document.getElementById('driveBackupBtn');
 if(!button){
   button=document.createElement('button');
   button.id='driveBackupBtn';
   button.type='button';
   button.className='primary small';
   button.textContent='☁ Save backup to Drive';
   actions.appendChild(button);
 }

 let setup=document.getElementById('driveBackupSetup');
 if(!setup){
   setup=document.createElement('details');
   setup.id='driveBackupSetup';
   setup.className='drive-backup-setup';
   setup.innerHTML=`
     <summary>Google Drive backup setup</summary>
     <p class="drive-backup-help">One-time setup. Paste your Google OAuth Web Client ID. Never paste a client secret. Authorized JavaScript origin must include <code class="drive-origin"></code>.</p>
     <label>Google OAuth Client ID
       <input class="drive-client-id" type="text" inputmode="text" autocomplete="off" placeholder="1234567890-...apps.googleusercontent.com">
     </label>
     <div class="drive-backup-actions">
       <button type="button" class="ghost small drive-save-client">Save Client ID</button>
       <button type="button" class="ghost small drive-connect">Connect Google Drive</button>
       <button type="button" class="ghost small drive-clear">Clear Drive setup</button>
     </div>
     <p class="drive-backup-status">Not connected.</p>
   `;
   audit.appendChild(setup);
 }
 setup.querySelector('.drive-origin').textContent=location.origin;
 const clientInput=setup.querySelector('.drive-client-id');
 if(clientInput && !clientInput.matches(':focus') && !clientInput.value.trim()){
   clientInput.value=clientId();
 }

 if(!document.getElementById('driveBackupStyles')){
   const style=document.createElement('style');
   style.id='driveBackupStyles';
   style.textContent=`
    #driveBackupBtn{font-weight:800}
    .drive-backup-setup{margin-top:10px;border:1px solid rgba(90,134,173,.55);border-radius:10px;padding:9px 10px;background:rgba(24,57,88,.18)}
    .drive-backup-setup summary{cursor:pointer;font-weight:800}
    .drive-backup-help{font-size:11px;opacity:.78;line-height:1.45}
    .drive-backup-setup label{display:block;font-size:11px;font-weight:700}
    .drive-client-id{display:block;width:100%;box-sizing:border-box;margin-top:5px}
    .drive-backup-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
    .drive-backup-status{font-size:11px;margin:8px 0 0;opacity:.8}
   `;
   document.head.appendChild(style);
 }
 return {button,setup};
}

function status(text){
 const el=document.querySelector('#driveBackupSetup .drive-backup-status');
 if(el)el.textContent=text;
}

function loadGis(){
 if(window.google?.accounts?.oauth2)return Promise.resolve();
 if(gisPromise)return gisPromise;
 gisPromise=new Promise((resolve,reject)=>{
   const existing=[...document.scripts].find(s=>s.src===GIS_SRC);
   const script=existing||document.createElement('script');
   if(!existing){
     script.src=GIS_SRC;
     script.async=true;
     script.defer=true;
     document.head.appendChild(script);
   }
   const done=()=>{
     if(window.google?.accounts?.oauth2)resolve();
     else reject(new Error('Google Identity Services did not load.'));
   };
   script.addEventListener('load',done,{once:true});
   script.addEventListener('error',()=>reject(new Error('Could not load Google sign-in. Check your connection.')),{once:true});
   if(existing&&window.google?.accounts?.oauth2)resolve();
 });
 return gisPromise;
}

async function initTokenClient(){
 const id=clientId();
 if(!id)throw new Error('Google OAuth Client ID is not set.');
 await loadGis();
 tokenClient=google.accounts.oauth2.initTokenClient({
   client_id:id,
   scope:SCOPE,
   callback:(response)=>{
     if(response?.error){
       status('Google Drive connection failed: '+response.error);
       toast('Google Drive connection failed');
       pendingAction=null;
       return;
     }
     accessToken=String(response?.access_token||'');
     const expires=Number(response?.expires_in||3600);
     tokenExpiresAt=Date.now()+Math.max(60,expires)*1000;
     status('Connected for this session.');
     toast('Google Drive connected');
     const action=pendingAction;pendingAction=null;
     if(action)action().catch(handleError);
   }
 });
}

async function ensureToken(next){
 if(tokenValid())return next();
 pendingAction=next;
 if(!tokenClient)await initTokenClient();
 status('Opening Google sign-in…');
 tokenClient.requestAccessToken({prompt:accessToken?'':'consent'});
}

async function driveFetch(url,options={}){
 const res=await fetch(url,{
   ...options,
   headers:{
     ...(options.headers||{}),
     Authorization:'Bearer '+accessToken
   }
 });
 if(res.status===401){
   accessToken='';tokenExpiresAt=0;
   throw new Error('Google session expired. Tap Save backup to Drive again.');
 }
 if(!res.ok){
   let message='Google Drive request failed ('+res.status+').';
   try{
     const data=await res.json();
     message=data?.error?.message||message;
   }catch{}
   throw new Error(message);
 }
 if(res.status===204)return null;
 return res.json();
}

async function folderExists(id){
 if(!id)return false;
 try{
   const file=await driveFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?fields=id,name,mimeType,trashed');
   return !!file && !file.trashed && file.mimeType==='application/vnd.google-apps.folder';
 }catch(err){
   if(/404|not found/i.test(String(err?.message||'')))return false;
   throw err;
 }
}

async function ensureFolder(){
 const saved=String(localStorage.getItem(FOLDER_KEY)||'').trim();
 if(saved && await folderExists(saved))return saved;

 const params=new URLSearchParams({
   q:"name='"+FOLDER_NAME.replace(/'/g,"\\'")+"' and mimeType='application/vnd.google-apps.folder' and trashed=false",
   spaces:'drive',
   fields:'files(id,name)',
   pageSize:'10'
 });
 const found=await driveFetch('https://www.googleapis.com/drive/v3/files?'+params.toString());
 const existing=found?.files?.[0]?.id;
 if(existing){
   localStorage.setItem(FOLDER_KEY,existing);
   return existing;
 }

 const created=await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id,name',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({
     name:FOLDER_NAME,
     mimeType:'application/vnd.google-apps.folder'
   })
 });
 localStorage.setItem(FOLDER_KEY,created.id);
 return created.id;
}

function timestamp(){
 const d=new Date();
 const p=n=>String(n).padStart(2,'0');
 return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'_'+p(d.getHours())+'-'+p(d.getMinutes())+'-'+p(d.getSeconds());
}

async function uploadBackup(){
 const state=currentState();
 if(!state||!state.stages||!Object.keys(state.stages).length)throw new Error('No production yet.');
 status('Preparing backup…');
 const folderId=await ensureFolder();
 const filename=safeName(state.topic)+'-backup-'+timestamp()+'.json';
 const json=JSON.stringify(state,null,2);
 const boundary='ld_auto_'+Date.now().toString(36);
 const metadata={
   name:filename,
   parents:[folderId],
   mimeType:'application/json',
   appProperties:{ldAutoBackup:'1',topic:String(state.topic||'').slice(0,120)}
 };
 const body=new Blob([
   '--'+boundary+'\r\n',
   'Content-Type: application/json; charset=UTF-8\r\n\r\n',
   JSON.stringify(metadata)+'\r\n',
   '--'+boundary+'\r\n',
   'Content-Type: application/json; charset=UTF-8\r\n\r\n',
   json+'\r\n',
   '--'+boundary+'--'
 ],{type:'multipart/related; boundary='+boundary});

 status('Saving to Google Drive…');
 const uploaded=await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',{
   method:'POST',
   headers:{'Content-Type':'multipart/related; boundary='+boundary},
   body
 });
 localStorage.setItem('ld-google-drive-last-backup-v1',JSON.stringify({
   id:uploaded?.id||'',
   name:uploaded?.name||filename,
   at:new Date().toISOString()
 }));
 status('Saved: '+(uploaded?.name||filename));
 toast('Backup saved to Google Drive ✓',3200);
 return uploaded;
}

function handleError(err){
 const message=String(err?.message||err||'Google Drive backup failed.');
 status(message);
 toast(message,3600);
}

function saveClientId(){
 const setup=document.getElementById('driveBackupSetup');
 if(!setup)return;
 const input=setup.querySelector('.drive-client-id');
 const value=String(input?.value||'').trim();
 if(!value){
   localStorage.removeItem(CLIENT_KEY);
   status('Client ID cleared.');
   return;
 }
 if(!/\.apps\.googleusercontent\.com$/.test(value)){
   status('That does not look like a Google OAuth Web Client ID.');
   return;
 }
 localStorage.setItem(CLIENT_KEY,value);
 tokenClient=null;accessToken='';tokenExpiresAt=0;
 if(input)input.value=value;
 status('Client ID saved. Tap Connect Google Drive or Save backup to Drive.');
 toast('Google Drive setup saved');
}

async function connect(){
 try{
   if(!clientId()){
     const ui=ensureUi();ui.setup.open=true;ui.setup.querySelector('.drive-client-id')?.focus();
     status('Add your Google OAuth Web Client ID first.');
     return;
   }
   await ensureToken(async()=>{status('Connected for this session.');});
 }catch(err){handleError(err);}
}

async function saveToDrive(){
 try{
   const ui=ensureUi();
   if(!clientId()){
     ui.setup.open=true;
     ui.setup.querySelector('.drive-client-id')?.focus();
     status('One-time setup required: add your Google OAuth Web Client ID.');
     toast('Set up Google Drive once, then this becomes one-tap backup.',3600);
     return;
   }
   await ensureToken(uploadBackup);
 }catch(err){handleError(err);}
}

function clearSetup(){
 localStorage.removeItem(CLIENT_KEY);
 localStorage.removeItem(FOLDER_KEY);
 localStorage.removeItem('ld-google-drive-last-backup-v1');
 accessToken='';tokenExpiresAt=0;tokenClient=null;pendingAction=null;
 const ui=ensureUi();
 if(ui)ui.setup.querySelector('.drive-client-id').value='';
 status('Drive setup cleared from this browser.');
 toast('Google Drive setup cleared');
}

function mount(){
 const ui=ensureUi();if(!ui)return;
 ui.button.onclick=saveToDrive;
 ui.setup.querySelector('.drive-save-client').onclick=saveClientId;
 ui.setup.querySelector('.drive-connect').onclick=connect;
 ui.setup.querySelector('.drive-clear').onclick=clearSetup;
 if(clientId())status(tokenValid()?'Connected for this session.':'Ready. Tap Save backup to Drive.');
}

window.LDGoogleDriveBackup=Object.freeze({saveToDrive,connect,uploadBackup,mount});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
window.addEventListener('ld:production-built',()=>setTimeout(mount,80));
})();
