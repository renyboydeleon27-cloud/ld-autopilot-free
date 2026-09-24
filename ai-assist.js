/* LD AUTO v3.28.0 — OpenAI narration assist */
(()=>{
'use strict';
function getTopic(){
  return document.getElementById('topic')?.value?.trim()||
    document.getElementById('projectTitle')?.textContent?.trim()||'';
}
function polishSavedSanrikuNarration(){
  const topic=getTopic();
  if(!/sanriku/i.test(topic)||!/\b1896\b/.test(topic)) return 0;
  const replacements={
    HOOK:[
      ["On June 15, 1896, the disaster began.","On June 15, 1896, the ground shook only weakly—but this was a tsunami earthquake."]
    ],
    P1:[
      ["The event occurred in Sanriku, Japan.","The disaster unfolded in Sanriku, Japan."]
    ],
    P5:[
      ["At Miyako the water then began to rise at about 20:00.","At Miyako, the water began to rise around 8:00 p.m."]
    ],
    P6:[
      ["The largest wave at Miyako arrived at 20:07, was about 4.5 metres high, and was described as making a booming sound.","At 20:07, Miyako’s largest observed wave arrived about 4.5 metres high, with a booming sound."]
    ],
    P8:[
      ["Six subsequent waves were observed at Miyako until noon the following day.","Six more waves were observed at Miyako through noon the next day."]
    ],
    P9:[
      ["The tsunami was instrumentally recorded at three tide-gauge stations in Japan.","Three tide-gauge stations in Japan recorded the tsunami."]
    ],
    P11:[
      ["An 1896 survey by Iki reported a maximum tsunami height of 24 metres at Yoshihama.","An 1896 survey reported a maximum tsunami height of 24 metres at Yoshihama."]
    ],
    P12:[
      ["A later survey by Matsuo reported an often-quoted 38-metre height at Shirahama.","A later survey reported an often-cited tsunami height of 38 metres at Shirahama."]
    ],
    P14:[
      ["This was the Sanriku tsunami of 1896-06-15 in Japan.","This was the Sanriku tsunami of June 15, 1896, in Japan."]
    ]
  };
  let changed=0;
  document.querySelectorAll('.stage-card').forEach(card=>{
    const stage=card.dataset.stage, narration=card.querySelector('.narration');
    if(!narration||!replacements[stage]) return;
    const current=String(narration.value||"").trim();
    for(const [from,to] of replacements[stage]){
      if(current===from){
        narration.value=to;
        narration.dispatchEvent(new Event('input',{bubbles:true}));
        narration.dispatchEvent(new Event('change',{bubbles:true}));
        changed++;
        break;
      }
    }
  });
  return changed;
}
function mount(){
  if(document.getElementById('ldAiTestBox')) return;
  const anchor=document.querySelector('.hero')||document.querySelector('main')||document.body;
  const box=document.createElement('section');
  box.id='ldAiTestBox';
  box.style.cssText='margin:12px 0;padding:12px;border:2px solid #7c5cff;border-radius:12px;background:rgba(124,92,255,.08)';
  box.innerHTML='<strong>✨ LD AI Assist</strong><p style="font-size:12px;opacity:.8">Secure OpenAI assistance through the Vercel backend. Your API key stays on the server.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="ldAiNarrationBtn" class="primary small">✨ AI Generate Narration</button><button type="button" id="ldPreflightBtn" class="ghost small">🛡️ Narration Preflight (FREE)</button><button type="button" id="ldAiTestBtn" class="ghost small">Test AI Connection</button><button type="button" id="ldResearchBtn" class="ghost small">Research Diagnostics</button></div><div id="ldAiTestResult" style="margin-top:8px;font-size:12px;white-space:pre-wrap"></div>';
  anchor.insertAdjacentElement('afterend',box);
  polishSavedSanrikuNarration();

  document.getElementById('ldResearchBtn').onclick=async()=>{
    const btn=document.getElementById('ldResearchBtn'),out=document.getElementById('ldAiTestResult');
    const topic=getTopic();
    if(!topic){out.textContent='❌ No topic selected.';return;}
    btn.disabled=true;out.textContent='🔎 Checking NOAA/NCEI + USGS research sources…';
    try{
      const r=await fetch('/api/ai-research',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic})});
      const raw=await r.text();
      let d;
      try{d=JSON.parse(raw);}catch{
        throw new Error('Research endpoint returned non-JSON (HTTP '+r.status+'): '+raw.slice(0,180));
      }
      if(!r.ok||!d.ok) throw new Error((d.error||('HTTP '+r.status))+(d.detail?' — '+d.detail:''));
      const n=d.retrieval?.noaa||{},u=d.retrieval?.usgs||{},v=d.validation||{};
      out.textContent=[
        'RESEARCH DIAGNOSTICS',
        'Topic: '+topic,
        'Gate: '+(v.status||'unknown'),
        'Reason: '+(v.reason||'—'),
        'NOAA/NCEI: '+(n.status||'not run')+(n.reason?' — '+n.reason:'')+(n.event?.location?' — '+n.event.location:'')+(Number.isFinite(n.candidates)?' — candidates: '+n.candidates:''),
        ...(Array.isArray(n.sample)&&n.sample.length ? ['NOAA sample: '+JSON.stringify(n.sample).slice(0,1200)] : []),
        'USGS: '+(u.status||'not run')+(u.reason?' — '+u.reason:'')+(u.event?.place?' — '+u.event.place:'')
      ].join('\n');
    }catch(e){out.textContent='❌ Research diagnostics: '+String(e.message||e);}
    finally{btn.disabled=false;}
  };

  document.getElementById('ldPreflightBtn').onclick=async()=>{
    const btn=document.getElementById('ldPreflightBtn'),out=document.getElementById('ldAiTestResult');
    const topic=getTopic();
    if(!topic||topic==='No production yet'){out.textContent='❌ Create or open a production first.';return;}
    const format=document.getElementById('format')?.value||'shorts';
    btn.disabled=true;out.textContent='🛡️ Checking narration evidence without calling OpenAI…';
    try{
      const r=await fetch('/api/ai-narration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic,format,preflightOnly:true})});
      const raw=await r.text();
      let d;
      try{d=JSON.parse(raw);}catch{throw new Error('Preflight endpoint returned non-JSON (HTTP '+r.status+'): '+raw.slice(0,180));}
      if(!r.ok||!d.ok){
        if(Array.isArray(d.missingStageEvidence)&&d.missingStageEvidence.length){
          out.textContent='❌ FREE preflight blocked. No OpenAI generation used.\nMissing stage evidence: '+d.missingStageEvidence.join(', ');
          return;
        }
        throw new Error(d.error||('HTTP '+r.status));
      }
      const summary=d.stageEvidenceSummary||{};
      const stageCount=Object.keys(summary).length;
      out.textContent='✅ FREE preflight passed — '+stageCount+' narration stages have verified stage evidence.\nNo OpenAI generation credit used.';
    }catch(e){out.textContent='❌ FREE preflight: '+String(e.message||e);}
    finally{btn.disabled=false;}
  };

  document.getElementById('ldAiTestBtn').onclick=async()=>{
    const btn=document.getElementById('ldAiTestBtn'),out=document.getElementById('ldAiTestResult');
    const topic=getTopic()||'Cyclone Nargis — Myanmar — 2008';
    btn.disabled=true;out.textContent='Connecting to OpenAI…';
    try{
      const r=await fetch('/api/ai-test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic})});
      const d=await r.json();
      if(!r.ok||!d.ok) throw new Error(d.error||('HTTP '+r.status));
      out.textContent='✅ '+d.status;
    }catch(e){out.textContent='❌ '+String(e.message||e);}
    finally{btn.disabled=false;}
  };

  document.getElementById('ldAiNarrationBtn').onclick=async()=>{
    const btn=document.getElementById('ldAiNarrationBtn'),out=document.getElementById('ldAiTestResult');
    const topic=getTopic();
    const cards=[...document.querySelectorAll('.stage-card')];
    if(!topic || topic==='No production yet'){out.textContent='❌ Create or open a production first.';return;}
    if(!cards.length){out.textContent='❌ No production stages found. Create or open a production first.';return;}
    const format=document.getElementById('format')?.value||'shorts';
    btn.disabled=true;out.textContent='✨ Generating historically grounded narration…';
    try{
      const r=await fetch('/api/ai-narration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic,format})});
      const d=await r.json();
      if(!r.ok||!d.ok){
        if(Array.isArray(d.unsupportedClaims)&&d.unsupportedClaims.length){
          const details=d.unsupportedClaims.slice(0,12).map((x,i)=>
            (i+1)+'. '+(x.stage||'Stage')+' ❌ '+(x.claim?'"'+x.claim+'"':'Unsupported claim')+
            (x.reason?'\n   Reason: '+x.reason:'')
          );
          out.textContent='❌ '+(d.error||'Narration rejected.')+'\n\nUNSUPPORTED CLAIMS\n'+details.join('\n');
          return;
        }
        if(Array.isArray(d.missingEvidence)&&d.missingEvidence.length){
          out.textContent='❌ '+(d.error||'Insufficient research evidence.')+'\nMissing evidence: '+d.missingEvidence.join(', ');
          return;
        }
        if(Array.isArray(d.missingStageEvidence)&&d.missingStageEvidence.length){
          out.textContent='❌ '+(d.error||'Narration preflight blocked.')+'\nMissing stage evidence: '+d.missingStageEvidence.join(', ')+'\nNo OpenAI generation credit was used after this preflight block.';
          return;
        }
        throw new Error(d.error||('HTTP '+r.status));
      }
      let filled=0;
      cards.forEach(card=>{
        const stage=card.dataset.stage;
        const narration=card.querySelector('.narration');
        if(narration && d.stages?.[stage]){
          narration.value=d.stages[stage];
          narration.dispatchEvent(new Event('input',{bubbles:true}));
          narration.dispatchEvent(new Event('change',{bubbles:true}));
          filled++;
        }
      });
      out.textContent='✅ AI narration generated for '+filled+' stages. Review facts and wording before marking stages Done.';
    }catch(e){out.textContent='❌ '+String(e.message||e);}
    finally{btn.disabled=false;}
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();