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

  const section=document.createElement('section');section.className='card yt-publishing';section.id='titleRecommendations';
  section.innerHTML='<div class="yt-head"><div><h2>Top 3 titles + YT description</h2><span class="yt-sub">Ready to edit and copy</span></div><button type="button" class="yt-red" id="toggleYoutubeDetails" aria-expanded="false" aria-controls="youtubeDetails">Maximize</button></div><div id="youtubeDetails" hidden><p class="yt-note">Topic-based suggestions. Check against your final video.</p><div id="titleOptions"></div><label for="selectedYoutubeTitle">Selected title</label><textarea id="selectedYoutubeTitle" rows="2" maxlength="100"></textarea><div class="yt-row"><span id="titleLength"></span><button type="button" class="yt-red" id="copyYoutubeTitle">Copy title</button></div><label for="youtubeDescription">YouTube description</label><textarea id="youtubeDescription" rows="4"></textarea><div class="yt-row yt-end"><button type="button" class="yt-red" id="copyYoutubeDescription">Copy description</button></div><p id="titleMessage" role="status" aria-live="polite"></p></div>';
  document.querySelector('.setup').after(section);
  const style=document.createElement('style');style.textContent=`
    #titleRecommendations{padding:12px;margin:12px 0;min-width:0}
    #titleRecommendations .yt-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
    #titleRecommendations h2{font-size:1rem;line-height:1.3;margin:0}
    #titleRecommendations .yt-sub,#titleRecommendations .yt-note,#titleLength{font-size:.8125rem;color:#bac5d3}
    #titleRecommendations .yt-sub{display:block;margin-top:3px}
    #titleRecommendations button{font-size:.875rem;min-height:40px;padding:8px 12px}
    #titleRecommendations .yt-red{background:#b91c1c;color:#fff;border:1px solid #ef4444;border-radius:8px;flex-shrink:0;font-weight:700}
    #titleRecommendations .yt-red:hover{background:#991b1b}
    #titleRecommendations button:focus-visible{outline:3px solid #ffb4b4;outline-offset:2px}
    #titleRecommendations [hidden]{display:none!important}
    #youtubeDetails{margin-top:10px;max-height:60vh;overflow-y:auto;overscroll-behavior:contain}
    #titleRecommendations .yt-note{margin:0 0 8px}
    #titleRecommendations .yt-option{padding:10px 0;border-bottom:1px solid #394554}
    #titleRecommendations .yt-option strong{font-size:.8125rem;color:#c3cddd}
    #titleRecommendations .yt-option p{font-size:.9375rem;line-height:1.4;margin:4px 0 8px;overflow-wrap:anywhere}
    #titleRecommendations .yt-actions,#titleRecommendations .yt-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    #titleRecommendations .yt-row{justify-content:space-between;margin:6px 0 12px}
    #titleRecommendations .yt-end{justify-content:flex-end;margin-bottom:0}
    #titleRecommendations label{display:block;font-size:.875rem;font-weight:700;margin-top:12px}
    #titleRecommendations textarea{width:100%;box-sizing:border-box;min-height:64px;font-size:1rem;line-height:1.4;margin-top:5px;resize:vertical}
    #titleMessage{font-size:.875rem;margin:8px 0 0}
    #titleMessage:empty{display:none}
  `;document.head.appendChild(style);
  const field=section.querySelector('#selectedYoutubeTitle'),description=section.querySelector('#youtubeDescription'),options=section.querySelector('#titleOptions'),message=section.querySelector('#titleMessage'),details=section.querySelector('#youtubeDetails'),toggle=section.querySelector('#toggleYoutubeDetails');
  toggle.onclick=()=>{const open=details.hidden;details.hidden=!open;toggle.textContent=open?'Minimize':'Maximize';toggle.setAttribute('aria-expanded',String(open));};
  function count(){section.querySelector('#titleLength').textContent=field.value.length+'/100 characters'+(field.value.length>100?' — shorten before publishing':'');}
  function persist(){window.ldYoutubeTitle=field.value;count();if(typeof saveCurrent==='function')saveCurrent();}
  function defaultDescription(topic){
    if(root.LDStoryModes?.enabled())return 'A '+root.LDStoryModes.label()+' story titled '+topic+'.\n\nCreated with NER Studio.';
    return 'A Living Disaster Book historical disaster '+(document.getElementById('format')?.value==='longform'?'documentary':'short')+' about '+topic+'.\n\nThank you for watching. Like, share, and subscribe for more stories from the Living Disaster Book.';
  }
  function currentDescription(topic){return root.ldFinalPackageMeta?.description||defaultDescription(topic);}
  function persistDescription(){
    if(!root.ldFinalPackageMeta||typeof root.ldFinalPackageMeta!=='object'||Array.isArray(root.ldFinalPackageMeta))root.ldFinalPackageMeta={description:'',musicCredit:'',uploadNotes:''};
    root.ldFinalPackageMeta.description=description.value;
    const other=document.querySelector('#ldFinalPackage .final-description');if(other)other.value=description.value;
    if(typeof saveCurrent==='function')saveCurrent();
  }
  async function copy(value,label,fallback){
    try{await navigator.clipboard.writeText(value);message.textContent=label+' copied.';}
    catch(e){if(fallback){fallback.focus();fallback.select();}message.textContent='Copy unavailable. Select and copy the text manually.';}
  }
  function render(){
    const state=root.LDCore?.collectState();const topic=state?.topic||'';
    section.hidden=!topic;options.replaceChildren();if(!topic)return;
    const choices=recommend(topic);
    field.value=typeof window.ldYoutubeTitle==='string'?window.ldYoutubeTitle:choices[0].title;
    if(window.ldYoutubeTitle===null||window.ldYoutubeTitle===undefined){window.ldYoutubeTitle=field.value;if(typeof saveCurrent==='function')saveCurrent();field.dispatchEvent(new Event('change',{bubbles:true}));}
    description.value=currentDescription(topic);
    for(const [index,choice] of choices.entries()){
      const card=document.createElement('article');card.className='yt-option';
      const label=document.createElement('strong');label.textContent=(index+1)+'. '+choice.label;
      const title=document.createElement('p');title.textContent=choice.title;
      const actions=document.createElement('div');actions.className='yt-actions';
      const use=document.createElement('button');use.type='button';use.className='ghost small';use.textContent='Use title';use.setAttribute('aria-label','Use title '+(index+1));use.onclick=()=>{field.value=choice.title;persist();field.dispatchEvent(new Event('change',{bubbles:true}));message.textContent='Title saved for this production.';};
      const copyButton=document.createElement('button');copyButton.type='button';copyButton.className='yt-red';copyButton.textContent='Copy';copyButton.setAttribute('aria-label','Copy title '+(index+1));copyButton.onclick=()=>copy(choice.title,'Title '+(index+1));
      actions.append(use,copyButton);card.append(label,title,actions);options.append(card);
    }
    message.textContent='';count();
  }
  field.addEventListener('input',persist);
  description.addEventListener('input',persistDescription);
  document.addEventListener('input',event=>{if(event.target.matches('#ldFinalPackage .final-description'))description.value=event.target.value;});
  section.querySelector('#copyYoutubeTitle').onclick=()=>copy(field.value,'Title',field);
  section.querySelector('#copyYoutubeDescription').onclick=()=>copy(description.value,'Description',description);
  root.addEventListener('ld:production-built',render);
  new MutationObserver(()=>{if(document.getElementById('projectTitle').textContent==='No production yet')section.hidden=true;}).observe(document.getElementById('projectTitle'),{childList:true});
  render();
})(typeof window!=='undefined'?window:globalThis);
