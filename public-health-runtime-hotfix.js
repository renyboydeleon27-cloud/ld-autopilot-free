/* NER Studio runtime hotfix — public-health continuing-care repair guard. */
(function(){
  'use strict';
  const VERSION='1.0.1';
  const PUBLIC_HEALTH=/xylazine|zombie drug|tranq|opioid|fentanyl|drug crisis|overdose crisis/i;
  const CONTINUING_CARE=/\bonly the beginning\b|\bwound care\b|\baccess to treatment\b|\bsupport(?:\s+that)?\s+continues\b|\bsupport[^\n.]{0,80}\bafterward\b|\bongoing support\b|\bcontinued support\b/i;
  // Positive procedure cues only. Do NOT match words that appear only inside a negative safety list.
  const UNSAFE_SCENE=/\bwound-care clinic treating a patient\b|\bcommunity health clinic during non-graphic wound assessment\b|\bsleeve\s+(?:rolled|raised)\b|\brolled\s+(?:up\s+)?sleeve\b|\braised\s+sleeve\b|\bexposed\s+wound\b|\bvisible\s+wound\b|\bwound\s+(?:assessment|examination|exam)\b|\bnon-graphic\s+wound\s+assessment\b|\bexamines?\s+(?:the\s+)?(?:patient|visitor|wound|forearm|arm)\b|\btreats?\s+(?:the\s+)?wound\b|\bclinician[^.]{0,100}\b(?:touches?|examines?|treats?|bandages?|wraps?)\s+(?:the\s+)?(?:patient|visitor)\b|\b(?:period-appropriate|historically appropriate)\b[^.\n]{0,100}\b(?:clothing|wardrobe|attire|uniform|dress)\b/i;

  function topic(){
    return String(document.getElementById('topic')?.value||document.getElementById('projectTitle')?.textContent||'').trim();
  }
  function targetCard(){
    const labels=[...document.querySelectorAll('.ld-smart-target')].map(el=>String(el.textContent||''));
    const match=labels.join(' ').match(/CURRENT TARGET:\s*(P(?:[1-9]|1[0-4]))/i);
    if(match)return document.querySelector('.stage-card[data-stage="'+match[1].toUpperCase()+'"]');
    return [...document.querySelectorAll('.stage-card[data-stage^="P"]')].find(card=>!card.querySelector('.done-toggle')?.checked)||null;
  }
  function yearFromPage(){
    const c=window.ldVideoContinuity||{};
    const y=String(c.year||'').trim();
    if(/^20\d{2}$/.test(y))return y;
    const m=topic().match(/\b(20\d{2})\b/);
    return m?m[1]:'2020';
  }
  function locationFromPage(){
    const c=window.ldVideoContinuity||{};
    const loc=String(c.location||'').trim();
    return loc||'Philadelphia, Pennsylvania, USA';
  }
  function safeScene(year,location){
    return 'Exactly 10 seconds, portrait 9:16, one continuous restrained human-height gentle lateral move inside a modest community health and support setting in '+location+', '+year+', rendered in the project’s locked visual style. In the foreground, one anchored adult support worker wearing unmistakably contemporary '+year+' clinic/work clothing and hairstyle stands beside a stable counter. Within the first half-second, the worker lifts ONE CLOSED UNMARKED RESOURCE FOLDER from the counter and transfers that same folder to a nearby clean tray, completing this as the ONLY purposeful action by about 6 seconds. In the midground, one fully clothed adult visitor in contemporary '+year+' everyday clothing sits quietly with both hands and forearms still. The worker has no physical contact with the visitor. The visitor remains fully covered and passive throughout. From 6–10 seconds, the folder remains stable on the tray while the worker’s hand settles and all adults show only calm breathing or a slight gaze shift. Use contemporary '+year+' furnishings, fixtures and hairstyles appropriate to '+location+'. Historical anime refers to rendering style only, not old-period wardrobe or interiors. Show support access only; do not depict any clinical procedure, medication use, treatment result, emergency action, readable text, logos, walking, second purposeful task, duplication, teleportation, morphing or object respawn.';
  }
  function isSafeScene(scene){
    const s=String(scene||'');
    return /CLOSED UNMARKED RESOURCE FOLDER/i.test(s)
      && /fully clothed adult visitor/i.test(s)
      && /no physical contact with the visitor/i.test(s)
      && /contemporary\s+20\d{2}/i.test(s)
      && !UNSAFE_SCENE.test(s);
  }
  function repairIfNeeded(){
    const card=targetCard();
    if(!card||card.querySelector('.done-toggle')?.checked||!PUBLIC_HEALTH.test(topic()))return false;
    const narration=String(card.querySelector('.narration')?.value||'').trim();
    if(!CONTINUING_CARE.test(narration))return false;
    const sceneField=card.querySelector('.video-scene');
    if(!sceneField)return false;
    const scene=String(sceneField.value||card.dataset.videoScene||'');
    if(isSafeScene(scene))return false;

    const promptField=card.querySelector('.text-video-prompt');
    const prompt=String(promptField?.value||card.dataset.textVideoPrompt||'');
    const policyIssues=window.LDPublicHealthPolicy?.issues?.(topic(),prompt)||[];
    const needsRepair=UNSAFE_SCENE.test(scene)||policyIssues.some(x=>/continuing-care|Modern-era wardrobe|old-period styling/i.test(String(x||'')));
    if(!needsRepair)return false;

    const repaired=safeScene(yearFromPage(),locationFromPage());
    card.dataset.sceneChoice='';
    card.dataset.videoScene='KEEP CURRENT SCENE — '+repaired;
    sceneField.value=card.dataset.videoScene;
    card.dataset.textVideoPrompt='';
    card.dataset.textVideoSignature='';
    delete card.dataset.smartReady;
    delete card.dataset.smartReadySignature;
    if(promptField)promptField.value='';
    const picker=card.querySelector('.scene-choice');
    if(picker)picker.value='';
    const status=card.querySelector('.scene-choice-status');
    if(status)status.textContent='🛡️ AUTO SAFE CONTINUING-CARE SCENE · support-folder scene locked before Smart Continue.';
    try{
      const rebuilt=window.LDVideoModes?.prompt?.(card);
      if(rebuilt&&promptField)promptField.value=rebuilt;
    }catch(e){console.warn('Public-health hotfix prompt rebuild:',e);}
    return true;
  }

  document.addEventListener('click',function(e){
    if(!e.target.closest?.('#ldSmartContinueBtn,#ldSmartStickyBtn'))return;
    repairIfNeeded();
  },true);

  document.addEventListener('change',function(e){
    if(!e.target.matches?.('.scene-choice'))return;
    setTimeout(repairIfNeeded,0);
  });

  window.LDPublicHealthRuntimeHotfix={version:VERSION,repairIfNeeded};
})();
