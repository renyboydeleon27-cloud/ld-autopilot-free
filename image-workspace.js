(()=>{
  const stages=document.getElementById('stages');
  const topic=document.getElementById('topic');
  const format=document.getElementById('format');
  const toast=document.getElementById('toast');
  if(!stages||!topic)return;

  const DB_NAME='ld-autopilot-images';
  const STORE='stage-images';
  let dbPromise=null;

  function showToast(msg){
    if(!toast)return;
    toast.textContent=msg;toast.classList.add('show');
    clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1800);
  }

  function openDb(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    return dbPromise;
  }

  function keyFor(stage){
    return `${(topic.value||'').trim()}::${format?.value||'shorts'}::${stage}`;
  }

  async function putImage(stage,file){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(file,keyFor(stage));
      tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error);
    });
  }

  async function getImage(stage){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly');
      const req=tx.objectStore(STORE).get(keyFor(stage));
      req.onsuccess=()=>resolve(req.result||null); req.onerror=()=>reject(req.error);
    });
  }

  async function removeImage(stage){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(keyFor(stage));
      tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error);
    });
  }

  function injectCss(){
    if(document.getElementById('image-workspace-style'))return;
    const style=document.createElement('style');
    style.id='image-workspace-style';
    style.textContent=`
      .image-workspace{margin-top:12px;padding:12px;border:1px dashed rgba(127,127,127,.45);border-radius:12px;background:rgba(127,127,127,.06)}
      .image-workspace-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
      .image-workspace-head strong{font-size:.95rem}.image-workspace-status{font-size:.8rem;opacity:.72}
      .image-preview-wrap{display:none;margin:10px 0}.image-preview-wrap.has-image{display:block}
      .image-preview{display:block;max-width:100%;max-height:520px;margin:0 auto;border-radius:10px;object-fit:contain;background:#111}
      .image-workspace-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
      .image-file-input{display:none}
    `;
    document.head.appendChild(style);
  }

  async function copyPrompt(card){
    const text=card.querySelector('.image-prompt')?.value?.trim();
    if(!text){showToast('No image prompt yet');return false;}
    try{await navigator.clipboard.writeText(text);showToast('Image prompt copied');return true;}
    catch{showToast('Could not copy prompt');return false;}
  }

  function setPreview(card,file){
    const wrap=card.querySelector('.image-preview-wrap');
    const img=card.querySelector('.image-preview');
    const status=card.querySelector('.image-workspace-status');
    const download=card.querySelector('.download-stage-image');
    const remove=card.querySelector('.remove-stage-image');
    if(!wrap||!img||!status)return;
    if(card.dataset.imageObjectUrl){URL.revokeObjectURL(card.dataset.imageObjectUrl);delete card.dataset.imageObjectUrl;}
    if(!file){wrap.classList.remove('has-image');img.removeAttribute('src');status.textContent='No image attached';if(download)download.disabled=true;if(remove)remove.disabled=true;return;}
    const url=URL.createObjectURL(file);card.dataset.imageObjectUrl=url;img.src=url;wrap.classList.add('has-image');
    const mb=(file.size/1024/1024).toFixed(1);status.textContent=`Image attached · ${mb} MB`;
    if(download)download.disabled=false;if(remove)remove.disabled=false;
  }

  async function restoreCard(card){
    try{setPreview(card,await getImage(card.dataset.stage));}catch{}
  }

  function decorateCard(card){
    if(card.querySelector('.image-workspace'))return;
    const stage=card.dataset.stage;
    const body=card.querySelector('.stage-body');
    const imageField=card.querySelector('.image-prompt')?.closest('.field-block');
    if(!body||!imageField)return;

    const box=document.createElement('div');
    box.className='image-workspace';
    box.innerHTML=`
      <div class="image-workspace-head"><strong>Stage Image</strong><span class="image-workspace-status">No image attached</span></div>
      <div class="image-preview-wrap"><img class="image-preview" alt="${stage} attached image preview"></div>
      <div class="image-workspace-actions">
        <button type="button" class="ghost small generate-stage-image">Copy + Open ChatGPT</button>
        <button type="button" class="ghost small upload-stage-image">Attach image</button>
        <button type="button" class="ghost small download-stage-image" disabled>Download image</button>
        <button type="button" class="ghost small remove-stage-image" disabled>Remove</button>
        <input class="image-file-input" type="file" accept="image/png,image/jpeg,image/webp">
      </div>`;
    imageField.insertAdjacentElement('afterend',box);

    box.querySelector('.generate-stage-image').addEventListener('click',async()=>{
      if(await copyPrompt(card)) window.open('https://chatgpt.com/','_blank','noopener,noreferrer');
    });
    const input=box.querySelector('.image-file-input');
    box.querySelector('.upload-stage-image').addEventListener('click',()=>input.click());
    input.addEventListener('change',async()=>{
      const file=input.files?.[0];if(!file)return;
      if(!/^image\/(png|jpeg|webp)$/.test(file.type)){showToast('Use PNG, JPG, or WEBP');input.value='';return;}
      try{await putImage(stage,file);setPreview(card,file);showToast(`${stage} image attached`);}catch{showToast('Could not save image');}
      input.value='';
    });
    box.querySelector('.download-stage-image').addEventListener('click',async()=>{
      const file=await getImage(stage);if(!file){showToast('No image attached');return;}
      const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
      const safe=(topic.value||'project').trim().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();
      const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=`${safe}-${stage.toLowerCase()}.${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
    });
    box.querySelector('.remove-stage-image').addEventListener('click',async()=>{
      await removeImage(stage);setPreview(card,null);showToast(`${stage} image removed`);
    });
    restoreCard(card);
  }

  function decorateAll(){[...stages.querySelectorAll('.stage-card')].forEach(decorateCard);}
  injectCss();decorateAll();
  new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'))setTimeout(decorateAll,0);}).observe(stages,{childList:true,subtree:false});
  document.addEventListener('click',e=>{if(e.target.closest('#buildBtn,.project-open-btn,.project-card'))setTimeout(decorateAll,80);},true);
  window.addEventListener('load',()=>setTimeout(decorateAll,150));
})();
