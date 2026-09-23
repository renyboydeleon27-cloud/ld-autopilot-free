/* LD AUTO v3.27.0 — Real OpenAI backend smoke test */
(()=>{
'use strict';
function mount(){
  if(document.getElementById('ldAiTestBox')) return;
  const anchor=document.querySelector('.hero')||document.querySelector('main')||document.body;
  const box=document.createElement('section');
  box.id='ldAiTestBox';
  box.style.cssText='margin:12px 0;padding:12px;border:2px solid #7c5cff;border-radius:12px;background:rgba(124,92,255,.08)';
  box.innerHTML='<strong>✨ LD AI Assist · Connection Test</strong><p style="font-size:12px;opacity:.8">Real OpenAI API test through the secure Vercel backend. Your API key stays on the server.</p><button type="button" id="ldAiTestBtn" class="ghost small">✨ Test AI</button><div id="ldAiTestResult" style="margin-top:8px;font-size:12px;white-space:pre-wrap"></div>';
  anchor.insertAdjacentElement('afterend',box);
  document.getElementById('ldAiTestBtn').onclick=async()=>{
    const btn=document.getElementById('ldAiTestBtn'),out=document.getElementById('ldAiTestResult');
    const topic=document.getElementById('topic')?.value?.trim()||document.getElementById('projectTitle')?.textContent?.trim()||'Cyclone Nargis — Myanmar — 2008';
    btn.disabled=true;out.textContent='Connecting to OpenAI…';
    try{
      const r=await fetch('/api/ai-test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic})});
      const d=await r.json();
      if(!r.ok||!d.ok) throw new Error(d.error||('HTTP '+r.status));
      out.textContent='✅ '+d.status+'\n\n'+d.hook;
    }catch(e){out.textContent='❌ '+String(e.message||e);}
    finally{btn.disabled=false;}
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();