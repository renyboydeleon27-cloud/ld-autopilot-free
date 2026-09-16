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
        HOOK:'At about 3:42 a.m. on July 28, 1976, Tangshan was asleep. Seconds later, a devastating earthquake tore through the industrial city.',
        P1:'Before dawn on July 28, 1976, Tangshan was an industrial city of factories, railways, apartment blocks, homes and sleeping residents.',
        P2:'Beneath Tangshan, tectonic stress had built along the fault system until the crust could no longer hold the strain.',
        P3:'At about 3:42 a.m. on July 28, 1976, a powerful earthquake of about magnitude 7.5 ruptured beneath the Tangshan region.',
        P4:'Violent shaking struck with almost no warning, throwing residents awake as walls cracked and buildings began to fail.',
        P5:'Across Tangshan, apartment blocks, homes, factories and public buildings collapsed under the intense shaking.',
        P6:'Railways buckled, roads cracked, utilities failed and industrial facilities were heavily damaged across the city.',
        P7:'When daylight arrived, survivors found entire neighborhoods buried beneath brick, concrete, steel and dust.',
        P8:'Strong aftershocks and widespread infrastructure failure deepened the crisis beyond the first collapsed districts.',
        P9:'Using bare hands and simple tools, civilians, workers and soldiers searched unstable ruins for trapped survivors.',
        P10:'The official death toll exceeded 242,000, while more than 160,000 people were seriously injured in the disaster.',
        P11:'Survivors gathered in temporary shelters as food, water, medical care and emergency supplies became urgent needs.',
        P12:'Factories, railways, housing, roads and public services lay heavily damaged, disrupting Tangshan’s industrial life.',
        P13:'Reconstruction began as debris was cleared and Tangshan rebuilt homes, roads, factories and essential services.',
        P14:'The Tangshan earthquake left lasting lessons for earthquake-resistant construction, emergency planning, rescue and seismic preparedness.'
      }
    },
    {
      test:/2004\s+indian\s+ocean\s+tsunami/i,
      stages:{
        HOOK:'At first, the ocean looked calm. Then the sea suddenly pulled away from the shore.',
        P1:'Before the disaster, coastal communities across the Indian Ocean were beginning an ordinary morning near calm tropical waters.',
        P2:'Far beneath the Indian Ocean, immense tectonic plates were locked together, storing enormous pressure beneath the seafloor.',
        P3:'On December 26, 2004, a magnitude 9.1 earthquake ruptured the seafloor off northern Sumatra.',
        P4:'The sudden movement of the seafloor displaced an enormous volume of water, creating tsunami waves that raced across the Indian Ocean.',
        P5:'Along many coastlines, there was little or no warning. In some places, the sea suddenly pulled far away from shore.',
        P6:'The first waves struck with terrifying speed, rushing inland through homes, roads and coastal communities.',
        P7:'The tsunami carried boats, vehicles, timber and debris deep inland with enormous force.',
        P8:'Within hours, the tsunami struck coastlines in more than a dozen countries around the Indian Ocean.',
        P9:'When the water began to withdraw, entire communities were left beneath mud, wreckage and shattered buildings.',
        P10:'More than 227,000 people were killed or reported missing across the affected region.',
        P11:'About 1.7 million people were displaced, leaving survivors without homes, clean water or basic supplies.',
        P12:'Homes, ports, roads, businesses and fishing communities suffered enormous material and economic damage.',
        P13:'In the months and years that followed, survivors rebuilt homes, roads, schools, ports and entire communities.',
        P14:'The 2004 Indian Ocean tsunami changed disaster preparedness, strengthening warning systems, evacuation planning and regional cooperation.'
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
    const fact=p?.stages?.[stage];
    if(!fact||stage==='ENDING'||stage==='THUMBNAIL')return false;
    const narration=card.querySelector('.narration');
    const image=card.querySelector('.image-prompt');
    let changed=false;

    if(narration&&narration.value.trim()!==fact){
      narration.value=fact;
      fireInput(narration);
      changed=true;
    }

    if(image){
      let next=image.value;
      const beatPattern=/Visual beat:[\s\S]*?(?=\s+Show one historically)/i;
      if(beatPattern.test(next)) next=next.replace(beatPattern,`Visual beat: ${fact}`);
      else if(!/Visual beat:/i.test(next)){
        const role=/Scene role:[^.]+\./i;
        if(role.test(next)) next=next.replace(role,m=>`${m} Visual beat: ${fact}`);
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
    if(message)showToast(n?`Fact-synced ${n} stage${n===1?'':'s'}`:'Fact pack already synced');
  }

  generateAllBtn?.addEventListener('click',()=>setTimeout(()=>syncAll(true),180));
  document.addEventListener('click',e=>{
    const btn=e.target.closest('.generate-template-btn');
    if(!btn)return;
    const card=btn.closest('.stage-card');
    setTimeout(()=>{const p=pack();if(p&&syncCard(card,p))showToast('Stage fact-synced');},180);
  });
  setTimeout(()=>syncAll(false),700);
})();
