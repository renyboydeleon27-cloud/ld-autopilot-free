/* NER Studio — Global 2D Anime Render Enforcement v1.1.0
   Full master replacement for Anime Text-to-Video.
   Locks illustrated 2D rendering, prevents photoreal/live-action drift,
   and blocks generated on-screen text for HOOK + story panels.
   Thumbnail and Ending are intentionally excluded because they may require designed text. */
(()=>{'use strict';
if(window.__ldAnimeRenderEnforcementV110)return;
window.__ldAnimeRenderEnforcementV110=true;

const VERSION='1.1.0';
const TOP_MARK='ABSOLUTE ANIME ENFORCEMENT LOCK — GLOBAL V1.1';
const TEXT_MARK='ZERO ON-SCREEN TEXT LOCK — GLOBAL V1.1';
const CHECK_MARK='2D ANIME STYLE CHECKSUM — GLOBAL V1.1';
const FINAL_MARK='FINAL 2D ANIME STYLE VERIFICATION — GLOBAL V1.1';

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
 const mono=colorMode()==='bw'
  ? 'STRICT TRUE BLACK-AND-WHITE GRAYSCALE ONLY for the complete shot. No color, sepia, tint, selective color or muted color accents.'
  : 'Preserve the project configured color treatment while keeping the rendering unmistakably hand-drawn 2D anime.';
 return `${TOP_MARK} — HIGHEST PRIORITY:\nHAND-DRAWN 2D HISTORICAL ANIME / GRAPHIC-NOVEL ANIMATION ONLY.\nEvery visible frame must unmistakably remain illustrated and hand-drawn. Every visible person must remain a clearly illustrated 2D anime character with drawn eyes, nose and mouth, inked facial edges, illustrated hair clumps, drawn clothing folds, grounded proportional anime anatomy and non-photographic cel/ink shading. Faces, hands, skin, hair, clothing, buildings, debris and environment must all visibly belong to the same illustrated 2D world.\n${mono}\nHistorical accuracy, believable anatomy, physics, camera language, human-height framing and documentary seriousness describe FACTS, MOVEMENT and STAGING ONLY; they never authorize photographic rendering.\nNEVER render live-action people, real-human faces, photographic skin, camera-captured humans, documentary/news footage, film-still realism, semi-photoreal faces, glossy realism or 3D CGI humans.\nIf any inherited wording conflicts, THIS GLOBAL ANIME LOCK WINS.`;
}
function textLock(){
 return `${TEXT_MARK} — HIGHEST PRIORITY:\nGenerate PURE CINEMATIC ANIMATION with ZERO readable on-screen text.\nDo NOT render any letters, words, numbers, dates, event names, place names, school/facility names, stage numbers, captions, subtitles, title cards, corner identifiers, lower-thirds, documentary slates, labels, UI graphics, logos, credits or watermarks.\nNEVER copy words from this prompt into the video — including the disaster name, location, year or panel number.\nPhysical signboards, plaques, posters, papers, books, noticeboards, storefronts, vehicle markings and clothing patches may exist only as blank, obscured or non-readable shapes with NO legible characters.\nNo opening title. No closing title. No text overlay at any moment.\nIf any other instruction suggests readable text, THIS ZERO-TEXT LOCK WINS.`;
}
function checksum(){
 return `${CHECK_MARK} — NON-NEGOTIABLE:\nFrame 1, the midpoint and frame 10 must all unmistakably remain hand-drawn 2D anime. Every visible face, hand, garment, building, debris field and environment must use illustrated linework and drawn shading rather than photographic texture. Human skin must never become photographic. No live-action, photoreal or semi-photoreal drift at any point.\nAll three checkpoints must also contain ZERO readable letters, words, numbers, dates, labels, captions, titles, logos or watermarks.`;
}
function finalLock(){
 return `${FINAL_MARK} — NON-NEGOTIABLE:\nThe first frame, middle frame and final frame must all visibly be the same hand-drawn 2D anime world. Any live-action, photorealistic, semi-photorealistic, documentary-footage or camera-captured human appearance is an incorrect render. All visible humans must keep illustrated faces, hands, hair, clothing and non-photographic skin shading from start to finish.\nZERO readable on-screen text for the full shot: no title, date, location, event name, school/facility name, caption, subtitle, label, sign text, lower-third, logo, UI or watermark.`;
}
function rewriteLeakage(text){
 let s=String(text||'');
 const replacements=[
  [/Documentary-style cinematic staging/gi,'Historical-anime cinematic staging'],
  [/Cinematic historical-documentary composition/gi,'Cinematic illustrated historical-anime composition'],
  [/Cinematic documentary composition/gi,'Cinematic illustrated historical-anime composition'],
  [/documentary-style composition/gi,'historical-anime cinematic composition'],
  [/Grounded realistic adult anatomy/gi,'Grounded proportional 2D anime adult anatomy'],
  [/realistic adult anatomy/gi,'proportional 2D anime adult anatomy'],
  [/realistic human anatomy/gi,'proportional 2D anime human anatomy'],
  [/subtle realistic blinking/gi,'subtle natural blinking'],
  [/photographic facial detail/gi,'hand-drawn facial detail'],
  [/realistic facial detail/gi,'hand-drawn facial detail']
 ];
 for(const [re,to] of replacements)s=s.replace(re,to);
 return s;
}
function removeLegacyBlocks(text){
 let s=String(text||'');
 s=s.replace(/\n\nABSOLUTE ANIME ENFORCEMENT LOCK — GLOBAL V1\.0[\s\S]*?(?=\n\n(?:ABSOLUTE RENDERING MODE|UNIVERSAL MONOCHROME|CHAPTER CONTINUITY LOCK|TEXT-TO-VIDEO|2D ANIME STYLE CHECKSUM|PANEL SCENE:))/i,'');
 s=s.replace(/\n\n2D ANIME STYLE CHECKSUM — GLOBAL V1\.0[\s\S]*?(?=\n\nPANEL SCENE:)/i,'');
 s=s.replace(/\n\nFINAL 2D ANIME STYLE VERIFICATION — GLOBAL V1\.0[\s\S]*$/i,'');
 return s;
}
function insertAfterHeader(text,block){
 const s=String(text||'');
 const i=s.indexOf('\n\n');
 if(i>0&&i<500)return s.slice(0,i)+'\n\n'+block+'\n\n'+s.slice(i+2);
 return block+'\n\n'+s;
}
function insertBeforePanelScene(text,block){
 const s=String(text||'');
 const marker='\n\nPANEL SCENE:';
 if(s.includes(marker))return s.replace(marker,'\n\n'+block+marker);
 return s.trim()+'\n\n'+block;
}
function enforce(card,text){
 let s=String(text||'');
 if(!s||!eligible(card))return s;
 s=removeLegacyBlocks(s);
 s=rewriteLeakage(s);
 if(!s.includes(TOP_MARK))s=insertAfterHeader(s,topLock());
 if(!s.includes(TEXT_MARK))s=insertBeforePanelScene(s,textLock());
 if(!s.includes(CHECK_MARK))s=insertBeforePanelScene(s,checksum());
 if(!s.includes(FINAL_MARK))s=s.trim()+'\n\n'+finalLock();
 return s;
}
function audit(text){
 const s=String(text||'');
 const issues=[];
 if(!s.includes(TOP_MARK))issues.push('missing-global-anime-lock');
 if(!s.includes(TEXT_MARK))issues.push('missing-zero-text-lock');
 if(!s.includes(CHECK_MARK))issues.push('missing-style-checksum');
 if(!s.includes(FINAL_MARK))issues.push('missing-final-style-verification');
 if(/Documentary-style cinematic staging|Grounded realistic adult anatomy|Cinematic historical-documentary composition/i.test(s))issues.push('positive-realism-leakage');
 return {ok:issues.length===0,version:VERSION,issues};
}
function sync(card,out){
 if(!card||!out)return out;
 card.dataset.textVideoPrompt=out;
 const f=card.querySelector('.text-video-prompt');
 if(f&&f.value!==out)f.value=out;
 return out;
}
function patchVideoModes(){
 const vm=window.LDVideoModes;
 if(!vm||vm.__globalAnimeEnforcementV110)return false;
 const nativePrompt=typeof vm.prompt==='function'?vm.prompt.bind(vm):null;
 const nativeBuild=typeof vm.build==='function'?vm.build.bind(vm):null;
 if(!nativePrompt||!nativeBuild)return false;
 vm.prompt=function(card){return sync(card,enforce(card,nativePrompt(card)));};
 vm.build=function(card){return sync(card,enforce(card,nativeBuild(card)));};
 vm.__globalAnimeEnforcementV110=true;
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
window.addEventListener('ld:smart-ready-changed',()=>queueMicrotask(applyCurrent));
document.addEventListener('click',e=>{
 if(e.target.closest('#ldSmartContinueBtn,#ldSmartStickyBtn,.generate-template-btn,#generateAllBtn,.copy-btn[data-copy="textVideoPrompt"]'))queueMicrotask(applyCurrent);
},true);

patchVideoModes();
window.LDAnimeRenderEnforcement=Object.freeze({version:VERSION,enforce,audit,apply:applyCurrent,visualStyle,colorMode});
})();