/* Durable project storage with explicit migration. Original localStorage is retained. */
(function(){'use strict';
const native=window.localStorage,DB='ner-project-storage-v1',STORE='snapshots',KEY='workspace';
const managed=k=>/^(ld-|ner-)/.test(k)&&!k.startsWith('ner-core5-audit-v1:');
let db,record,values={},enabled=false,pending=false,owned=false,revision=0,failure=null,tail=Promise.resolve();
const copy=x=>JSON.parse(JSON.stringify(x));
function legacy(){const out={};for(let i=0;i<native.length;i++){const k=native.key(i);if(managed(k))out[k]=native.getItem(k);}return out;}
function equal(a,b){return JSON.stringify(Object.entries(a).sort())===JSON.stringify(Object.entries(b).sort());}
function open(){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>q.result.createObjectStore(STORE);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);q.onblocked=()=>reject(Error('Project database is blocked by another tab.'));});}
function transact(mode,value){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),s=tx.objectStore(STORE),q=mode==='readonly'?s.get(KEY):s.put(value,KEY);let result;q.onsuccess=()=>result=q.result;tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(tx.error||Error('Project transaction aborted'));tx.onerror=()=>reject(tx.error||Error('Project storage failed'));});}
function status(text){for(const id of ['saveStatus','projectStorageStatus']){const e=document.getElementById(id);if(e)e.textContent=text;}}
function schedule(){
 revision++;if(pending)return;pending=true;status('Saving to device database…');
 let saved;tail=Promise.resolve().then(async()=>{do{if(failure)throw failure;saved=revision;const snapshot={...record,values:copy(values)};await transact('readwrite',snapshot);record=snapshot;}while(saved!==revision);}).catch(e=>{failure=e;status('Save failed · export a backup before closing');}).finally(()=>{pending=false;if(!failure){if(saved!==revision)schedule();else status('Saved to device database');}});
}
async function flush(){let observed;do{observed=tail;await observed;}while(observed!==tail);if(failure)throw failure;}
function facade(){
 const methods={getItem:k=>managed(String(k))?(values[String(k)]??null):native.getItem(k),setItem:(k,v)=>{k=String(k);v=String(v);if(!managed(k))return native.setItem(k,v);if(failure)throw failure;if(values[k]===v)return;values[k]=v;schedule();},removeItem:k=>{k=String(k);if(!managed(k))return native.removeItem(k);if(failure)throw failure;if(!(k in values))return;delete values[k];schedule();},clear:()=>{throw Error('Clearing project storage is disabled. Use explicit project controls.');},key:i=>keys()[i]??null};
 function keys(){const list=Object.keys(values);for(let i=0;i<native.length;i++){const k=native.key(i);if(!managed(k))list.push(k);}return list;}
 return new Proxy({}, {get:(_,k)=>k==='length'?keys().length:k in methods?methods[k]:typeof k==='string'?methods.getItem(k):undefined,set:(_,k,v)=>{methods.setItem(k,v);return true;},deleteProperty:(_,k)=>{methods.removeItem(k);return true;},ownKeys:keys,getOwnPropertyDescriptor:(_,k)=>keys().includes(k)?{configurable:true,enumerable:true,value:methods.getItem(k)}:undefined});
}
async function lock(){if(owned)return;if(!navigator.locks?.request)throw Error('Safe project storage requires Web Locks.');return new Promise((resolve,reject)=>{navigator.locks.request('ner-project-workspace-v1',{ifAvailable:true},async token=>{if(!token){reject(Error('Another NER Studio tab owns this workspace. Close it, then reopen this app.'));return;}owned=true;resolve();await new Promise(()=>{});}).catch(reject);});}
async function initialize(){
 db=await open();record=await transact('readonly');
 if(!record)return;
 await lock();
 if(record.schema!==1||!equal(legacy(),record.legacy))throw Error('Legacy project data changed in another app version. Both copies are preserved. Export backups before reconciling.');
 activate(record);
}
function activate(snapshot){
 record=snapshot;values=copy(record.values);enabled=true;Object.defineProperty(window,'localStorage',{configurable:true,value:facade()});
 window.addEventListener('storage',e=>{if(e.key===null||managed(e.key)){failure=Error('Another app version changed legacy project storage. Save blocked to preserve both copies.');status(failure.message);}});
 window.addEventListener('beforeunload',e=>{if(pending||failure){e.preventDefault();e.returnValue='Project save is incomplete.';}});
}
async function migrate(){
 if(enabled){await flush();return;}
 await lock();const baseline=legacy(),next=copy(baseline),state=window.LDCore?.collectState?.();
 if(!state?.topic||!Object.keys(state.stages||{}).length)throw Error('Open the production to preserve before enabling larger storage.');
 next['ld-autopilot-free-v1']=JSON.stringify(state);
 const lib=JSON.parse(next['ld-autopilot-free-project-library-v1']||'{"projects":[]}'),active=next['ld-autopilot-free-active-project'];
 const project=lib.projects.find(p=>p.id===active);if(project)project.state=state;
 next['ld-autopilot-free-project-library-v1']=JSON.stringify(lib);
 const snapshot={schema:1,legacy:baseline,values:next,migratedAt:new Date().toISOString()};
 await transact('readwrite',snapshot);const verified=await transact('readonly');
 if(JSON.stringify(verified)!==JSON.stringify(snapshot))throw Error('Project copy verification failed. Original storage retained.');
 if(!equal(legacy(),baseline))throw Error('Project data changed during migration. Original retained; do not reload until reviewed.');
 activate(verified);
 await ensureSaved();
}
async function ensureSaved(){
 if(!window.LDCore?.saveCurrent||window.LDCore.saveCurrent()!==true)throw Error('Project save failed. Enable larger project storage before a paid audit. No audit sent.');
 window.LDProjectLibrary?.flushCurrent?.();
 if(enabled)await flush();
}
function mount(){
 const b=document.createElement('button');b.id='enableProjectStorage';b.type='button';b.className='ghost';b.textContent=enabled?'Project storage: device database':'Enable larger project storage · FREE';b.disabled=enabled;
 b.addEventListener('click',async()=>{b.disabled=true;try{await migrate();b.textContent='Project storage: device database';}catch(e){status(e.message);b.disabled=enabled;}});
 const note=document.createElement('p');note.id='projectStorageStatus';note.setAttribute('role','status');note.textContent='Keeps the original saved projects and copies this workspace to larger device storage. No AI credits used.';
 document.querySelector('.project-library')?.prepend(b,note);if(enabled)status('Saved to device database');
}
window.NERProjectStorage=Object.freeze({initialize,mount,migrate,flush,ensureSaved,get enabled(){return enabled;},get pending(){return pending;}});
})();
