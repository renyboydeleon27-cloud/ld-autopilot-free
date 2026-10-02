/* NER Studio — unified Smart Narration progress bridge v1.0.0 */
(()=>{'use strict';
  let timer=null;
  let startedAt=0;

  function narrationButton(){return document.getElementById('ldNarrationSmartBtn');}
  function narrationStatus(){return document.getElementById('ldNarrationSmartStatus');}
  function mainButtons(){
    return [document.getElementById('ldSmartContinueBtn'),document.getElementById('ldSmartStickyBtn')].filter(Boolean);
  }
  function mainStatuses(){
    return [document.getElementById('ldSmartContinueStatus'),document.getElementById('ldSmartStickyStatus')].filter(Boolean);
  }
  function narrationIsCurrentTarget(){
    return [...document.querySelectorAll('.ld-smart-target')].some(el=>/CURRENT TARGET:\s*NARRATION/i.test(el.textContent||''));
  }
  function setMainLabel(text){mainButtons().forEach(btn=>{btn.textContent=text;});}
  function setMainStatus(text,state=''){
    mainStatuses().forEach(el=>{el.textContent=text;el.dataset.state=state;});
  }
  function tick(){
    const seconds=Math.max(0,Math.floor((Date.now()-startedAt)/1000));
    setMainLabel('🎙️ BUILDING SMART NARRATION · '+seconds+'s');
    setMainStatus('SMART CONTINUE · Smart Narration is working… '+seconds+'s','working');
  }
  function start(){
    if(timer)return;
    startedAt=Date.now();
    tick();
    timer=setInterval(tick,1000);
  }
  function stop(){
    if(timer){clearInterval(timer);timer=null;}
    if(!narrationIsCurrentTarget())return;

    const btn=narrationButton();
    const status=narrationStatus();
    const message=String(status?.textContent||'').trim();
    const state=String(status?.dataset?.state||'');

    if(btn?.dataset?.mode==='approve'){
      setMainLabel('✅ REVIEW / APPROVE NARRATION');
      setMainStatus('Smart Narration is ready. Review it, then approve Narration before HOOK.','pass');
      return;
    }
    if(state==='error'||/stopped safely|blocked by research gate|NEEDS_REVIEW/i.test(message)){
      setMainLabel('⚠️ NARRATION NEEDS REVIEW · TAP RETRY');
      setMainStatus(message||'Narration needs review before production can continue.','error');
      return;
    }
    setMainLabel('🚀 SMART CONTINUE');
  }
  function sync(){
    const running=narrationIsCurrentTarget()&&!!narrationButton()?.disabled;
    if(running&&!timer)start();
    else if(!running&&timer)stop();
  }

  document.addEventListener('click',event=>{
    if(!event.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))return;
    if(!narrationIsCurrentTarget())return;
    setTimeout(sync,0);
  },true);

  const observer=new MutationObserver(sync);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','data-mode','data-state']});
  window.addEventListener('ld:narration-smart-complete',()=>setTimeout(sync,0));
  window.addEventListener('ld:narration-approval-changed',()=>setTimeout(sync,0));
  setInterval(sync,500);
})();
