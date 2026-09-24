/* LD AUTO v3.31.4 — T2V Audit visual-mode false-positive fix */
(()=>{
'use strict';
function getTopic(){
  return document.getElementById('topic')?.value?.trim()||
    document.getElementById('projectTitle')?.textContent?.trim()||'';
}
function invalidTopic(topic){
  const t=String(topic||'').trim().toLowerCase();
  return !t || t==='no production yet' || t==='untitled disaster';
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
function currentPanelCard(){
  const cards=[...document.querySelectorAll('.stage-card')].filter(card=>/^P(?:[1-9]|1[0-4])$/.test(card.dataset.stage||''));
  const open=cards.filter(card=>!card.querySelector('.stage-body')?.classList.contains('hidden'));
  if(!open.length) return null;
  if(open.length===1) return open[0];
  const center=(window.innerHeight||800)/2;
  return open.slice().sort((x,y)=>{
    const xr=x.getBoundingClientRect(), yr=y.getBoundingClientRect();
    return Math.abs((xr.top+xr.height/2)-center)-Math.abs((yr.top+yr.height/2)-center);
  })[0];
}
function visualMode(){
  const selected=document.getElementById('visualMode')?.value;
  if(selected==='real'||selected==='anime') return selected;
  return localStorage.getItem('ld-auto-visual-mode-v1')==='real'?'real':'anime';
}
function panelPayload(card){
  const continuity=window.ldVideoContinuity||{};
  const sceneField=card.querySelector('.video-scene');
  const promptField=card.querySelector('.text-video-prompt');
  return {
    topic:getTopic(),
    stage:card.dataset.stage||'',
    format:document.getElementById('format')?.value||'shorts',
    visualMode:visualMode(),
    year:String(continuity.year||'').trim(),
    location:String(continuity.location||'').trim(),
    sharedDetails:String(continuity.details||'').trim(),
    narration:String(card.querySelector('.narration')?.value||'').trim(),
    currentScene:String(sceneField?.value||card.dataset.videoScene||'').trim(),
    currentPrompt:String(promptField?.value||card.dataset.textVideoPrompt||'').trim().slice(0,14000)
  };
}
function applyFixedPanel(card, scene){
  const field=card.querySelector('.video-scene');
  if(!field) throw new Error('Open Text-to-Video for this panel first.');
  field.value=String(scene||'').trim();
  field.dispatchEvent(new Event('input',{bubbles:true}));
  field.dispatchEvent(new Event('change',{bubbles:true}));
  if(window.LDVideoModes?.state?.(card)?.mode==='text'){
    window.LDVideoModes.prompt(card);
  }
}
function mount(){
  if(document.getElementById('ldAiTestBox')) return;
  const anchor=document.querySelector('.hero')||document.querySelector('main')||document.body;
  const box=document.createElement('section');
  box.id='ldAiTestBox';
  box.style.cssText='margin:12px 0;padding:12px;border:2px solid #7c5cff;border-radius:12px;background:rgba(124,92,255,.08)';
  box.innerHTML='<strong>✨ LD AI Assist</strong><p style="font-size:12px;opacity:.8">Secure OpenAI assistance through the Vercel backend. Your API key stays on the server.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="ldAiNarrationBtn" class="primary small">✨ AI Generate Narration</button><button type="button" id="ldAiFixPanelBtn" class="primary small">✨ Fix Current Panel</button><button type="button" id="ldAiT2vAuditBtn" class="ghost small">✨ AI T2V Audit</button><button type="button" id="ldPreflightBtn" class="ghost small">🛡️ Narration Preflight (FREE)</button><button type="button" id="ldAiTestBtn" class="ghost small">Test AI Connection</button><button type="button" id="ldResearchBtn" class="ghost small">Research Diagnostics</button></div><div id="ldAiTestResult" style="margin-top:8px;font-size:12px;white-space:pre-wrap"></div>';
  anchor.insertAdjacentElement('afterend',box);
  polishSavedSanrikuNarration();

  document.getElementById('ldAiFixPanelBtn').onclick=async()=>{
    const btn=document.getElementById('ldAiFixPanelBtn'),out=document.getElementById('ldAiTestResult');
    const topic=getTopic(),card=currentPanelCard();
    if(invalidTopic(topic)){out.textContent='❌ Set a real disaster topic and build/open that production first.';return;}
    if(!card){out.textContent='❌ Open the P1–P14 panel you want AI Assist to fix first.';return;}
    const payload=panelPayload(card);
    if(!payload.currentScene){out.textContent='❌ '+payload.stage+' has no panel scene description yet.';return;}
    btn.disabled=true;
    out.textContent='✨ Fixing '+payload.stage+' scene while preserving the current production DNA…';
    try{
      const r=await fetch('/api/ai-panel-fix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const raw=await r.text();
      let d;
      try{d=JSON.parse(raw);}catch{throw new Error('Panel-fix endpoint returned non-JSON (HTTP '+r.status+'): '+raw.slice(0,180));}
      if(!r.ok||!d.ok) throw new Error(d.error||('HTTP '+r.status));
      applyFixedPanel(card,d.scene);
      const note=d.note?('\n'+d.note):'';
      out.textContent='✅ '+payload.stage+' fixed. Full Text-to-Video prompt rebuilt automatically.'+note;
    }catch(e){out.textContent='❌ Panel fix: '+String(e.message||e);}
    finally{btn.disabled=false;}
  };

  document.getElementById('ldAiT2vAuditBtn').onclick=async()=>{
    const btn=document.getElementById('ldAiT2vAuditBtn'),out=document.getElementById('ldAiTestResult');
    const topic=getTopic(),card=currentPanelCard();
    if(invalidTopic(topic)){out.textContent='❌ Set a real disaster topic and build/open that production first.';return;}
    if(!card){out.textContent='❌ Open the P1–P14 panel you want to audit first.';return;}
    const payload=panelPayload(card);
    if(!payload.currentPrompt){out.textContent='❌ Build/refresh the Text-to-Video prompt for '+payload.stage+' first.';return;}
    btn.disabled=true;
    out.textContent='✨ Auditing '+payload.stage+' Text-to-Video prompt…';
    try{
      const r=await fetch('/api/ai-t2v-audit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const raw=await r.text();
      let d;
      try{d=JSON.parse(raw);}catch{throw new Error('T2V audit returned non-JSON (HTTP '+r.status+'): '+raw.slice(0,180));}
      if(!r.ok||!d.ok) throw new Error(d.error||('HTTP '+r.status));
      const issues=Array.isArray(d.issues)?d.issues.filter(Boolean):[];
      const lines=[
        (d.result==='PASS'?'✅ ':'⚠️ ')+(d.result||'AUDIT COMPLETE')+' — '+(d.summary||''),
        'MODE: '+(payload.visualMode==='real'?'Real Human':'Historical Anime')+' · STAGE: '+payload.stage
      ];
      if(issues.length){
        lines.push('ISSUES');
        issues.slice(0,10).forEach((x,i)=>lines.push((i+1)+'. '+x));
      }
      if(d.recommendedAction) lines.push('NEXT: '+d.recommendedAction);
      lines.push('Audit only — prompt was not changed.');
      out.textContent=lines.join('\n');
    }catch(e){out.textContent='❌ T2V Audit: '+String(e.message||e);}
    finally{btn.disabled=false;}
  };

  document.getElementById('ldResearchBtn').onclick=async()=>{
    const btn=document.getElementById('ldResearchBtn'),out=document.getElementById('ldAiTestResult');
    const topic=getTopic();
    if(invalidTopic(topic)){out.textContent='❌ Set a real disaster topic and build/open that production first.';return;}
    btn.disabled=true;out.textContent='🔎 Checking verified research sources…';
    try{
      const r=await fetch('/api/ai-research',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic})});
      const raw=await r.text();
      let d;
      try{d=JSON.parse(raw);}catch{
        throw new Error('Research endpoint returned non-JSON (HTTP '+r.status+'): '+raw.slice(0,180));
      }
      if(!r.ok||!d.ok) throw new Error((d.error||('HTTP '+r.status))+(d.detail?' — '+d.detail:''));
      const n=d.retrieval?.noaa||{},u=d.retrieval?.usgs||{},v=d.validation||{};
      const sourceNames=(d.sources||[]).map(s=>(s.authority||'Source')+': '+(s.name||s.id||'')).slice(0,8);
      const claimCount=Array.isArray(d.verifiedClaims)?d.verifiedClaims.length:0;
      const lines=[
        'RESEARCH DIAGNOSTICS',
        'Topic: '+topic,
        'Hazard: '+(d.hazardType||'general'),
        'Gate: '+(v.status||'unknown'),
        'Reason: '+(v.reason||'—'),
        'Verified claims: '+claimCount
      ];
      if(sourceNames.length){
        lines.push('Sources:');
        sourceNames.forEach(x=>lines.push('• '+x));
      }
      if(n.status) lines.push('NOAA/NCEI: '+n.status+(n.reason?' — '+n.reason:'')+(n.event?.location?' — '+n.event.location:'')+(Number.isFinite(n.candidates)?' — candidates: '+n.candidates:''));
      if(u.status) lines.push('USGS: '+u.status+(u.reason?' — '+u.reason:'')+(u.event?.place?' — '+u.event.place:''));
      out.textContent=lines.join('\n');
    }catch(e){out.textContent='❌ Research diagnostics: '+String(e.message||e);}
    finally{btn.disabled=false;}
  };

  document.getElementById('ldPreflightBtn').onclick=async()=>{
    const btn=document.getElementById('ldPreflightBtn'),out=document.getElementById('ldAiTestResult');
    const topic=getTopic();
    if(invalidTopic(topic)){out.textContent='❌ Set a real disaster topic and build/open that production first.';return;}
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
    if(invalidTopic(topic)){out.textContent='❌ Set a real disaster topic and build/open that production first.';return;}
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