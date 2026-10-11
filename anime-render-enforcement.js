/* NER Studio — Global 2D Anime Render Enforcement v1.0.0
   Applies to Text-to-Video prompts when project Visual Style is Anime.
   Prevents live-action / photoreal human drift without changing event semantics. */
(()=>{'use strict';
if(window.__ldAnimeRenderEnforcementV100)return;
window.__ldAnimeRenderEnforcementV100=true;
const VERSION='1.0.0';
const TOP_MARK='ABSOLUTE ANIME ENFORCEMENT LOCK — GLOBAL V1.0';
const CHECK_MARK='2D ANIME STYLE CHECKSUM — GLOBAL V1.0';
const FINAL_MARK='FINAL 2D ANIME STYLE VERIFICATION — GLOBAL V1.0';

function visualStyle(){
 const locked=window.LDProjectLocks?.visualStyle?.()||window.ldProjectLocks?.visualStyle;
 if(locked==='anime'||locked==='real')return locked;
 const selected=document.getElementById('visualMode')?.value;
 if(selected==='anime'||selected==='real')return selected;
 return localStorage.getItem('ld-auto-visual-mode-v1')==='real'?'real':'anime';
}
function colorMode(){
 const locked=window.LDProjectLocks?.colorMode?.()||window.ldProjectLocks?.colorMode;
 if(locked==='bw'||locked==='color')return locked;
 return visualStyle()==='anime'?(localStorage.getItem('ld-auto-color-mode-v1')==='color'?'color':'bw'):'bw';
}
function eligible(card){
 if(!card||visualStyle()!=='anime')return false;
 const stage=String(card.dataset.stage||'').toUpperCase();
 if(stage==='THUMBNAIL'||stage==='ENDING')return false;
 if(window.NERCore4?.frozen?.(card)||card.querySelector('.done-toggle')?.checked)return false;
 return true;
}
function topLock(){
 const mono=colorMode()==='bw'?'STRICT TRUE BLACK-AND-WHITE GRAYSCALE ONLY for the complete shot. No color, sepia, tint, selective color or muted color accents.':'Preserve the project\'s configured color treatment while keeping the rendering unmistakably hand-drawn 2D anime.';
 return `${TOP_MARK} — HIGHEST PRIORITY:\nHAND-DRAWN 2D HISTORICAL ANIME / GRAPHIC-NOVEL ANIMATION ONLY. Every visible frame must unmistakably remain illustrated and hand-drawn. Every visible person must remain a clearly illustrated 2D anime character with inked contours, drawn facial features, illustrated hair and clothing folds, and non-photographic shading. ${mono}\nHistorical accuracy, believable anatomy, physics, camera language and documentary seriousness describe facts, movement and staging ONLY; they never authorize photographic rendering. NEVER render live-action people, real-human faces, photographic skin, camera-captured humans, news/documentary footage, film-still realism, semi-photoreal faces, glossy realism or 3D CGI humans. If any inherited wording conflicts, THIS GLOBAL ANIME LOCK WINS.\nNO EMBEDDED TEXT: do not render titles, captions, labels, prompt text, logos or watermarks inside the video; do not invent readable signs.`;
}
function checksum(){
 return `${CHECK_MARK} — NON-NEGOTIABLE:\nFrame 1, the midpoint and frame 10 must all unmistakably remain hand-drawn 2D anime. Every visible face, hand, garment, building, debris field and environment must use illustrated linework and drawn shading rather than photographic texture. Human skin must never become photographic. No live-action or photoreal drift at any point. No generated captions, title cards, labels, logos or watermarks.`;
}
function finalLock(){
 return `${FINAL_MARK}: First frame, middle frame and final frame must all visibly be hand-drawn 2D anime. Any live-action, photorealistic, semi-photorealistic, documentary-footage or camera-captured human appearance is an incorrect render. All visible humans must keep illustrated faces, hands, hair, clothing and non-photographic skin shading from start to finish. No embedded text, captions, labels, logos or watermark.`;
}
function rewriteLeakage(text){
 let s=String(text||'');
 s=s.replace(/Documentary-style cinematic staging/gi,'Historical-anime cinematic staging');
 s=s.replace(/Cinematic historical-documentary composition/gi,'Cinematic illustrated historical-anime composition');
 s=s.replace(/Grounded realistic adult anatomy/gi,'Grounded proportional 2D anime adult anatomy');
 s=s.replace(/subtle realistic blinking/gi,'subtle natural blinking');
 return s;
}
function insertAfterHeader(text,block){
 const s=String(text||'');
 const i=s.indexOf('\n\n');
 if(i>0&&i<400)return s.slice(0,i)+'\n\n'+block+'\n\n'+s.slice(i+2);
 return block+'\n\n'+s;
}
function enforce(card,text){
 let s=String(text||'');
 if(!s||!eligible(card))return s;
 s=rewriteLeakage(s);
 if(!s.includes(TOP_MARK))s=insertAfterHeader(s,topLock());
 if(!s.includes(CHECK_MARK)){
  const marker='\n\nPANEL SCENE:';
  if(s.includes(marker))s=s.replace(marker,'\n\n'+checksum()+marker);
  else s+='\n\n'+checksum();
 }
 if(!s.includes(FINAL_MARK))s=s.trim()+'\n\n'+finalLock();
 return s;
}
function sync(card,out){
 if(!card||!out)return out;
 card.dataset.textVideoPrompt=out;
 const f=card.querySelector('.text-video-prompt');if(f&&f.value!==out)f.value=out;
 return out;
}
function patchVideoModes(){
 const vm=window.LDVideoModes;
 if(!vm||vm.__globalAnimeEnforcementV100)return false;
 const nativePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 const nativeBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
 if(!nativePrompt||!nativeBuild)return false;
 vm.prompt=function(card){return sync(card,enforce(card,nativePrompt(card)));};
 vm.build=function(card){return sync(card,enforce(card,nativeBuild(card)));};
 vm.__globalAnimeEnforcementV100=true;
 return true;
}
function applyCurrent(){
 patchVideoModes();
 document.querySelectorAll('.stage-card').forEach(card=>{
  if(!eligible(card)||card.dataset.videoMode!=='text')return;
  const current=String(card.querySelector('.text-video-prompt')?.value||card.dataset.textVideoPrompt||'');
  if(!current)return;
  const next=enforce(card,current);
  if(next!==current)sync(card,next);
 });
}

document.addEventListener('DOMContentLoaded',()=>queueMicrotask(applyCurrent),{once:true});
window.addEventListener('load',()=>queueMicrotask(applyCurrent),{once:true});
window.addEventListener('ld:production-built',()=>queueMicrotask(applyCurrent));
window.addEventListener('ld:project-opened',()=>queueMicrotask(applyCurrent));
document.addEventListener('click',e=>{if(e.target.closest('#ldSmartContinueBtn,#ldSmartStickyBtn,.generate-template-btn,#generateAllBtn'))queueMicrotask(applyCurrent);},true);
patchVideoModes();
window.LDAnimeRenderEnforcement=Object.freeze({version:VERSION,enforce,apply:applyCurrent,visualStyle,colorMode});
})();