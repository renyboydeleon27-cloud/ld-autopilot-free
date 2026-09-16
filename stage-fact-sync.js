(()=>{
  const topicEl=document.getElementById('topic');
  const stagesEl=document.getElementById('stages');
  const generateAllBtn=document.getElementById('generateAllBtn');
  const toast=document.getElementById('toast');
  if(!topicEl||!stagesEl)return;

  const PACKS=[
    {
      test:/1976\s+tangshan\s+earthquake/i,
      stages:{
        HOOK:{fact:'At about 3:42 a.m. on July 28, 1976, Tangshan was asleep. Seconds later, a devastating earthquake tore through the industrial city.',visual:'Pre-dawn Tangshan moments before the quake: dark industrial skyline, low apartment blocks, factory chimneys, rail lines, dim street lamps, quiet roads and adult residents indoors or barely visible; tense calm before sudden destruction.'},
        P1:{fact:'Before dawn on July 28, 1976, Tangshan was an industrial city of factories, railways, apartment blocks, homes and sleeping residents.',visual:'Ordinary pre-dawn Tangshan in 1976 with brick apartment blocks, factory buildings, rail infrastructure, bicycles and period-correct streets; peaceful daily-life composition before the earthquake, adults only.'},
        P2:{fact:'Beneath Tangshan, tectonic stress had built along the fault system until the crust could no longer hold the strain.',visual:'Scientific underground cutaway beneath Tangshan showing compressed rock layers and a stressed fault zone below the city, with the surface city visible above for geographic context; no labels or text.'},
        P3:{fact:'At about 3:42 a.m. on July 28, 1976, a powerful earthquake of about magnitude 7.5 ruptured beneath the Tangshan region.',visual:'The rupture begins beneath Tangshan: fractured rock layers shifting along the fault while the city surface above starts to shake; show strong geological force without fantasy shockwaves.'},
        P4:{fact:'Violent shaking struck with almost no warning, throwing residents awake as walls cracked and buildings began to fail.',visual:'Interior and street-level view of Tangshan at the first seconds of violent shaking: lamps swinging, furniture shifting, plaster cracking, brick walls flexing and adult residents waking or bracing.'},
        P5:{fact:'Across Tangshan, apartment blocks, homes, factories and public buildings collapsed under the intense shaking.',visual:'Dense Tangshan neighborhood during peak structural failure: brick apartment blocks, homes and factory structures collapsing into dust and rubble, adult figures at safe readable scale, no gore.'},
        P6:{fact:'Railways buckled, roads cracked, utilities failed and industrial facilities were heavily damaged across the city.',visual:'Industrial Tangshan infrastructure damage: buckled rail tracks, cracked roads, fallen utility poles, damaged factory structures, dust haze and broken transport links.'},
        P7:{fact:'When daylight arrived, survivors found entire neighborhoods buried beneath brick, concrete, steel and dust.',visual:'Early morning aftermath across Tangshan: broad field of collapsed brick housing and apartment blocks, dust-filled light, twisted steel and adult survivors surveying ruined neighborhoods.'},
        P8:{fact:'Strong aftershocks and widespread infrastructure failure deepened the crisis beyond the first collapsed districts.',visual:'Wider city crisis after the main shock: damaged districts stretching into the distance, unstable buildings, cracked roads, failed utilities, dust plumes and adults moving carefully through debris.'},
        P9:{fact:'Using bare hands and simple tools, civilians, workers and soldiers searched unstable ruins for trapped survivors.',visual:'Rescue scene in Tangshan rubble: adult civilians, workers and soldiers using bare hands, shovels and simple tools to search collapsed brick and concrete structures; respectful documentary framing.'},
        P10:{fact:'The official death toll exceeded 242,000, while more than 160,000 people were seriously injured in the disaster.',visual:'Solemn large-scale aftermath showing overwhelmed rescue and relief activity among collapsed neighborhoods, temporary treatment areas and adult survivors; communicate human scale without bodies or gore.'},
        P11:{fact:'Survivors gathered in temporary shelters as food, water, medical care and emergency supplies became urgent needs.',visual:'Temporary relief area in 1976 Tangshan with canvas shelters, water containers, medical stations, supply stacks and adult survivors waiting or receiving aid, ruined city visible in the background.'},
        P12:{fact:'Factories, railways, housing, roads and public services lay heavily damaged, disrupting Tangshan’s industrial life.',visual:'Wide infrastructure aftermath: damaged factories, broken rail lines, ruined housing, blocked roads and disabled public utilities shown in one layered industrial-city composition.'},
        P13:{fact:'Reconstruction began as debris was cleared and Tangshan rebuilt homes, roads, factories and essential services.',visual:'Reconstruction phase with adult workers clearing brick rubble, rebuilding roads and housing, repairing industrial facilities and moving materials with period-correct tools and machinery.'},
        P14:{fact:'The Tangshan earthquake left lasting lessons for earthquake-resistant construction, emergency planning, rescue and seismic preparedness.',visual:'Reflective legacy scene: rebuilt Tangshan with stronger modern-for-era structures, organized emergency-preparedness elements and adult residents in a calm city environment, visually connecting recovery with seismic preparedness.'}
      }
    },
    {
      test:/2004\s+indian\s+ocean\s+tsunami/i,
      stages:{
        HOOK:{fact:'At first, the ocean looked calm. Then the sea suddenly pulled away from the shore.',visual:'Calm tropical shoreline suddenly exposing an unusually wide wet seabed as the sea retreats, stranded boats and adult beachgoers or residents noticing the unnatural change.'},
        P1:{fact:'Before the disaster, coastal communities across the Indian Ocean were beginning an ordinary morning near calm tropical waters.',visual:'Peaceful coastal community on the morning of December 26, 2004: fishing boats, simple shoreline homes, market activity, palms and calm tropical water, adults only.'},
        P2:{fact:'Far beneath the Indian Ocean, immense tectonic plates were locked together, storing enormous pressure beneath the seafloor.',visual:'Deep-ocean geological cutaway showing the subduction zone beneath the Indian Ocean with locked tectonic plates, compressed rock and dark water above; no labels or text.'},
        P3:{fact:'On December 26, 2004, a magnitude 9.1 earthquake ruptured the seafloor off northern Sumatra.',visual:'Undersea rupture off northern Sumatra with sudden vertical seabed displacement, suspended sediment and powerful but scientifically grounded tectonic motion.'},
        P4:{fact:'The sudden movement of the seafloor displaced an enormous volume of water, creating tsunami waves that raced across the Indian Ocean.',visual:'Open-ocean tsunami formation with broad displaced water column and long low wave fronts radiating outward across deep water, emphasizing huge scale without a fantasy wall of water.'},
        P5:{fact:'Along many coastlines, there was little or no warning. In some places, the sea suddenly pulled far away from shore.',visual:'Coastline with dramatically receded sea, exposed seabed, stranded small boats, wet sand and adult residents watching from shore with concern.'},
        P6:{fact:'The first waves struck with terrifying speed, rushing inland through homes, roads and coastal communities.',visual:'First major tsunami surge entering a coastal settlement, water rushing through streets around homes, stalls and fishing structures; adults fleeing or bracing at safe readable scale.'},
        P7:{fact:'The tsunami carried boats, vehicles, timber and debris deep inland with enormous force.',visual:'Powerful inland flood carrying existing boats, vehicles, timber and household debris through a coastal town, with clear directional water flow and layered depth.'},
        P8:{fact:'Within hours, the tsunami struck coastlines in more than a dozen countries around the Indian Ocean.',visual:'Large-scale regional visual showing tsunami wave energy crossing open ocean toward multiple distant coastlines, with layered horizon depth and no map labels.'},
        P9:{fact:'When the water began to withdraw, entire communities were left beneath mud, wreckage and shattered buildings.',visual:'Immediate coastal aftermath with mud-covered streets, broken boats, shattered homes, standing water, torn vegetation and adult survivors surveying destruction.'},
        P10:{fact:'More than 227,000 people were killed or reported missing across the affected region.',visual:'Respectful humanitarian aftermath with adult survivors, rescue workers, ruined neighborhoods and emergency activity communicating immense loss without visible bodies or gore.'},
        P11:{fact:'About 1.7 million people were displaced, leaving survivors without homes, clean water or basic supplies.',visual:'Temporary relief camp with tents, water containers, supply distribution and adult displaced survivors, damaged coastal community visible in the distance.'},
        P12:{fact:'Homes, ports, roads, businesses and fishing communities suffered enormous material and economic damage.',visual:'Wide coastal infrastructure destruction showing damaged port facilities, roads, homes, market areas and fishing boats in one readable layered composition.'},
        P13:{fact:'In the months and years that followed, survivors rebuilt homes, roads, schools, ports and entire communities.',visual:'Rebuilding phase with adults clearing debris, repairing homes and roads, restoring ports and community structures under hopeful restrained daylight.'},
        P14:{fact:'The 2004 Indian Ocean tsunami changed disaster preparedness, strengthening warning systems, evacuation planning and regional cooperation.',visual:'Reflective recovered coastline with rebuilt community, tsunami-warning or evacuation-preparedness elements where historically appropriate, calm ocean and adult residents looking toward the shore.'}
      }
    }
  ];

  function showToast(text){
    if(!toast)return;
    toast.textContent=text;
    toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t=setTimeout(()=>toast.classList.remove('show'),1800);
  }

  function fireInput(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
  function pack(){const t=topicEl.value.trim();return PACKS.find(p=>p.test.test(t));}

  function syncCard(card,p){
    const stage=card.dataset.stage;
    const item=p?.stages?.[stage];
    if(!item||stage==='ENDING'||stage==='THUMBNAIL')return false;
    const narration=card.querySelector('.narration');
    const image=card.querySelector('.image-prompt');
    let changed=false;

    if(narration&&narration.value.trim()!==item.fact){
      narration.value=item.fact;
      fireInput(narration);
      changed=true;
    }

    if(image){
      let next=image.value;
      const beatPattern=/Visual beat:[\s\S]*?(?=\s+Show one historically)/i;
      if(beatPattern.test(next)) next=next.replace(beatPattern,`Visual beat: ${item.fact}`);
      else if(!/Visual beat:/i.test(next)){
        const role=/Scene role:[^.]+\./i;
        if(role.test(next)) next=next.replace(role,m=>`${m} Visual beat: ${item.fact}`);
      }

      const visualMarker='STAGE VISUAL DIRECTION:';
      const visualText=`${visualMarker} ${item.visual}`;
      if(next.includes(visualMarker)) next=next.replace(/STAGE VISUAL DIRECTION:[\s\S]*?(?=\s+HISTORICAL CONTEXT LOCK:|\s+Adult characters only\.|$)/i,visualText);
      else {
        const lockIndex=next.indexOf('HISTORICAL CONTEXT LOCK:');
        if(lockIndex>=0) next=`${next.slice(0,lockIndex).trim()} ${visualText} ${next.slice(lockIndex)}`;
        else next=`${next.trim()} ${visualText}`;
      }

      if(next!==image.value){image.value=next;fireInput(image);changed=true;}
    }
    return changed;
  }

  function syncAll(message=false){
    const p=pack();
    if(!p)return;
    let n=0;
    stagesEl.querySelectorAll('.stage-card').forEach(card=>{if(syncCard(card,p))n++;});
    if(message)showToast(n?`Fact + visual synced ${n} stage${n===1?'':'s'}`:'Fact pack already synced');
  }

  generateAllBtn?.addEventListener('click',()=>setTimeout(()=>syncAll(true),180));
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.generate-template-btn');
    if(!btn)return;
    const card=btn.closest('.stage-card');
    setTimeout(()=>{const p=pack();if(p&&syncCard(card,p))showToast('Stage fact + visual synced');},180);
  });
  setTimeout(()=>syncAll(false),700);
})();
