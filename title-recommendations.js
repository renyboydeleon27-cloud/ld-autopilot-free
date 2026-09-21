(function(root){
  'use strict';
  const families = [
    ['tsunami', /tsunami|tidal wave/i, ['The Sea Became the Danger', 'When the Waves Reached the Shore', 'The Story Behind the Tsunami']],
    ['cyclone', /cyclone|hurricane|typhoon|mahina|bhola|galveston/i, ['When the Storm Took Over', 'Inside the Storm', 'The Story Behind the Cyclone']],
    ['tornado', /tornado|daulatpur|saturia/i, ['When the Wind Turned Violent', 'In the Path of the Tornado', 'The Story Behind the Tornado']],
    ['earthquake', /earthquake|quake|kantō|kanto|tangshan/i, ['When the Ground Turned Violent', 'The Moment the Ground Shook', 'The Story Behind the Earthquake']],
    ['dam', /dam (?:failure|collapse)|banqiao/i, ['When the Dam Gave Way', 'Beyond the Broken Dam', 'The Story Behind the Dam Failure']],
    ['flood', /flood|surge/i, ['When the Water Kept Rising', 'In the Path of the Flood', 'The Story Behind the Flood']],
    ['avalanche', /avalanche|huascarán|huascaran/i, ['When the Mountainside Gave Way', 'In the Path of the Avalanche', 'The Story Behind the Avalanche']],
    ['landslide', /landslide|mudslide|lahar/i, ['When the Ground Gave Way', 'The Landscape Became the Danger', 'The Story Behind the Landslide']],
    ['volcano', /volcano|volcanic|eruption|krakatoa|ruiz|vesuvius/i, ['When the Volcano Erupted', 'The Danger Beneath the Mountain', 'The Story Behind the Eruption']],
    ['fire', /fire|wildfire|peshtigo/i, ['When the Flames Took Over', 'In the Path of the Fire', 'The Story Behind the Fire']],
    ['insect', /locust|insect|swarm/i, ['That Wasn’t a Storm Cloud… It Was a Swarm', 'When the Swarm Arrived', 'The Story Behind the Swarm']],
    ['epidemic', /plague|pandemic|epidemic|black death|virus|cholera/i, ['When Disease Changed Daily Life', 'Behind the Spread of Disease', 'The Story Behind the Outbreak']],
    ['industrial', /nuclear|chernobyl|fukushima|chemical|gas|bhopal|explosion/i, ['How the Disaster Unfolded', 'Behind the Disaster', 'The Event and Its Lasting Lessons']],
  ];
  function recommend(topic){
    topic=String(topic||'').trim(); if(!topic)return [];
    const match=families.find(f=>f[1].test(topic));
    let leads=match?match[2]:['How the Disaster Unfolded','The Story Behind the Disaster','The Event and Its Lasting Lessons'];
    let reason=match&&['tsunami','cyclone'].includes(match[0])?'Ocean and storm stories led channel views in the September 21, 2026 review. This is a topic-fit suggestion, not a tested title winner.':'Uses a clear visual hook or story question. This wording has not been performance-tested.';
    if(/\bmahina\b/i.test(topic)){
      leads=['The Wind Was Only the Beginning… Then the Sea Surged In','When the Storm Reached the Coast','The Story Behind the Storm'];
      reason='Matches Mahina’s storm-surge story and the escalation pattern seen in channel winners.';
    }
    return leads.map((lead,i)=>{
      // Preserve the supplied event label; fall back rather than invent or truncate a date/place.
      const full=lead+' | '+topic;
      const title=full.length<=100?full:topic;
      return {title,lead,label:i===0?'Recommended':'Alternative '+(i+1),reason:i===0?reason:i===1?'A simpler visual hook for this topic.':'A direct documentary option with the supplied event identity.',family:match?match[0]:'general'};
    }).filter((x,i,a)=>a.findIndex(y=>y.title===x.title)===i);
  }
  const api={recommend};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.LDTitleRecommendations=api;
  if(typeof document==='undefined')return;
  const section=document.createElement('section'); section.className='card';section.id='titleRecommendations';
  section.innerHTML='<h2>Recommended YouTube titles</h2><p>Based on the September 21, 2026 channel review. Suggestions are generated locally; they do not update from future syncs. Match the title to your final footage and verified facts.</p><div id="titleOptions"></div><label for="selectedYoutubeTitle">Selected title — editable</label><textarea id="selectedYoutubeTitle" rows="3" maxlength="100"></textarea><p id="titleLength" role="status"></p><button type="button" class="ghost" id="copyYoutubeTitle">Copy selected title</button><p id="titleMessage" role="status"></p>';
  document.querySelector('.setup').after(section);
  const field=section.querySelector('textarea'),options=section.querySelector('#titleOptions'),message=section.querySelector('#titleMessage');
  function count(){section.querySelector('#titleLength').textContent=field.value.length+'/100 characters'+(field.value.length>100?' — shorten before publishing':'');}
  function persist(){window.ldYoutubeTitle=field.value;count();if(typeof saveCurrent==='function')saveCurrent();}
  function render(){
    const state=root.LDCore?.collectState();const topic=state?.topic||'';
    section.hidden=!topic;options.replaceChildren();if(!topic)return;
    const choices=recommend(topic);
    field.value=typeof window.ldYoutubeTitle==='string'?window.ldYoutubeTitle:choices[0].title;
    if(window.ldYoutubeTitle===null||window.ldYoutubeTitle===undefined){window.ldYoutubeTitle=field.value;if(typeof saveCurrent==='function')saveCurrent();field.dispatchEvent(new Event('change',{bubbles:true}));}
    for(const choice of choices){
      const card=document.createElement('article');card.style.cssText='padding:14px 0;border-bottom:1px solid #394554;margin-bottom:14px';
      const label=document.createElement('strong');label.textContent=choice.label;
      const title=document.createElement('p');title.textContent=choice.title;
      const reason=document.createElement('p');reason.textContent=choice.reason;
      const use=document.createElement('button');use.type='button';use.className='ghost small';use.textContent='Use this title';use.onclick=()=>{field.value=choice.title;persist();field.dispatchEvent(new Event('change',{bubbles:true}));message.textContent='Title saved for this production.';};
      card.append(label,title,reason,use);options.append(card);
    }
    message.textContent='';count();
  }
  field.addEventListener('input',persist);
  section.querySelector('#copyYoutubeTitle').onclick=async()=>{try{await navigator.clipboard.writeText(field.value);message.textContent='Title copied.';}catch(e){field.focus();field.select();message.textContent='Select and copy the title manually.';}};
  root.addEventListener('ld:production-built',render);
  new MutationObserver(()=>{if(document.getElementById('projectTitle').textContent==='No production yet')section.hidden=true;}).observe(document.getElementById('projectTitle'),{childList:true});
  render();
})(typeof window!=='undefined'?window:globalThis);
