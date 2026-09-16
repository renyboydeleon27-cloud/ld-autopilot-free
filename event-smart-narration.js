(()=>{
  const stagesEl=document.getElementById('stages');
  const topicEl=document.getElementById('topic');
  if(!stagesEl||!topicEl)return;

  function normalizeTopicKey(text){
    return (text||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
  }

  const EVENT_PACKS={
    '1991 bangladesh cyclone':{
      HOOK:'The storm kept strengthening over warm water until destructive wind, rain, and surge reached the coast. This was the 1991 Bangladesh Cyclone.',
      P1:'In 1991, millions of people lived across the low-lying coast of Bangladesh, where villages and farmland sat dangerously close to the sea.',
      P2:'Over the Bay of Bengal, a tropical storm gathered strength above very warm water and began moving toward the densely populated coast.',
      P3:'As the cyclone intensified, warnings spread, but many vulnerable coastal communities had limited shelter and little time to prepare.',
      P4:'Outer rain bands reached land first, bringing dark skies, rising wind, and worsening weather across the coast.',
      P5:'As the storm drew closer, powerful winds and a massive storm surge began pushing seawater into low-lying areas.',
      P6:'When the cyclone struck, violent wind, torrential rain, and floodwater overwhelmed villages, roads, and coastal defenses.',
      P7:'A deadly storm surge swept inland, drowning settlements and carrying debris across fields and waterways.',
      P8:'Homes collapsed, trees snapped, and entire communities were left trapped by water, wreckage, and blocked escape routes.',
      P9:'When the storm finally weakened, survivors emerged into a devastated landscape of broken homes, mud, and scattered debris.',
      P10:'The human toll was catastrophic, with enormous loss of life across the coastal region.',
      P11:'Millions were affected as survivors searched for food, clean water, shelter, and missing relatives.',
      P12:'Relief efforts brought aid to damaged communities, but destroyed roads, flooding, and isolation made rescue difficult.',
      P13:'In the aftermath, Bangladesh strengthened cyclone preparedness through shelters, warning systems, and evacuation planning.',
      P14:'The 1991 Bangladesh Cyclone remains a powerful lesson in coastal vulnerability, storm surge danger, and disaster readiness.'
    },
    '1970 bhola cyclone':{
      HOOK:'In November 1970, a powerful cyclone drove a deadly wall of seawater toward the low-lying coast of East Pakistan. This was the Bhola Cyclone.',
      P1:'Millions of people lived across the flat, river-filled delta of East Pakistan, where villages sat only a few meters above sea level.',
      P2:'Over the Bay of Bengal, a tropical system strengthened as it moved north toward the densely populated coast.',
      P3:'Warnings were limited and difficult to communicate, leaving many coastal communities with little time to prepare or evacuate.',
      P4:'As the cyclone approached, winds intensified, rain spread inland, and coastal water levels began rising dangerously.',
      P5:'A massive storm surge pushed seawater across islands, river mouths, and low-lying farmland before the storm fully passed.',
      P6:'The surge swept through coastal settlements with devastating force, destroying homes and carrying people, boats, and debris inland.',
      P7:'Entire villages disappeared beneath floodwater as strong winds and waves continued battering the delta.',
      P8:'Across the affected islands and coast, transport, communications, crops, and local infrastructure were overwhelmed.',
      P9:'When the water receded, survivors faced a vast landscape of wreckage, mud, damaged fields, and destroyed communities.',
      P10:'The human toll was catastrophic, with hundreds of thousands of people losing their lives in one of history’s deadliest tropical cyclones.',
      P11:'Survivors urgently needed food, clean water, shelter, medicine, and help reaching isolated communities.',
      P12:'Relief efforts began, but damaged roads, waterways, communications, and the enormous scale of the disaster slowed the response.',
      P13:'The tragedy exposed the deadly risks faced by low-lying coastal communities when warnings, shelters, and evacuation systems are limited.',
      P14:'The Bhola Cyclone became a lasting lesson in storm-surge danger, cyclone preparedness, early warning, and coastal resilience.'
    },
    '1976 tangshan earthquake':{
      HOOK:'At 3:42 in the morning, Tangshan was sleeping. Seconds later, one of history’s deadliest earthquakes tore the city apart.',
      P1:'Before dawn on July 28, 1976, Tangshan was a major industrial city in northern China, filled with factories, rail lines, apartment blocks, and working families.',
      P2:'Beneath the region, powerful tectonic stress had been building silently along active faults near the city.',
      P3:'At 3:42 a.m., the fault suddenly ruptured, releasing violent seismic energy through Tangshan and the surrounding area.',
      P4:'The first violent shaking threw people awake as walls cracked, lights swung, and rooms began collapsing around them.',
      P5:'Brick apartment blocks, factories, and public buildings suffered catastrophic damage as the earthquake intensified.',
      P6:'Roads split open, railways buckled, and utilities failed, turning the sleeping city into chaos within moments.',
      P7:'Across Tangshan, survivors struggled through dust, darkness, and falling debris as entire neighborhoods collapsed.',
      P8:'The destruction spread across homes, industrial districts, transport routes, and public infrastructure throughout the city.',
      P9:'When daylight came, Tangshan lay in ruins, with shattered streets, collapsed buildings, and survivors searching desperately through the wreckage.',
      P10:'The human toll was catastrophic, with more than 240,000 deaths officially reported and many more people seriously injured.',
      P11:'Countless survivors were left without shelter, electricity, water, or medical care as emergency conditions overwhelmed the city.',
      P12:'Rescue efforts began as civilians, workers, soldiers, and response teams searched unstable ruins for survivors and delivered aid.',
      P13:'In the aftermath, Tangshan slowly rebuilt, becoming a symbol of resilience after one of the deadliest earthquakes in modern history.',
      P14:'The 1976 Tangshan Earthquake remains a lasting lesson in seismic risk, urban vulnerability, emergency response, and the need for stronger preparedness.'
    }
  };

  function fireInput(el){
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function applyEventNarration(){
    const pack=EVENT_PACKS[normalizeTopicKey(topicEl.value)];
    if(!pack)return false;
    let changed=false;
    [...stagesEl.querySelectorAll('.stage-card')].forEach(card=>{
      const stage=card.dataset.stage;
      const narration=card.querySelector('.narration');
      if(!narration||!pack[stage])return;
      if(!narration.value.trim()){
        narration.value=pack[stage];
        narration.dataset.eventSmart='true';
        fireInput(narration);
        changed=true;
      }
    });
    return changed;
  }

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.type==='childList'&&m.target===stagesEl)){
      applyEventNarration();
    }
  });
  observer.observe(stagesEl,{childList:true});

  document.addEventListener('click',event=>{
    if(event.target.closest('#buildBtn')) setTimeout(applyEventNarration,0);
  },true);

  window.addEventListener('load',()=>{
    applyEventNarration();
    setTimeout(applyEventNarration,50);
  });
})();
