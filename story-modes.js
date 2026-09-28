/* LD AUTO story categories — self-contained fiction story beats and prompt DNA. */
(()=>{
'use strict';
const ROLES={
 drama:[
  'Ordinary life · introduce the lead and the relationship',
  'Private goal · show what the lead wants',
  'Inciting encounter · a believable change enters their life',
  'First choice · the lead commits to a course of action',
  'Early friction · a small emotional cost becomes visible',
  'New connection · trust or conflict deepens',
  'Misunderstanding · information is incomplete',
  'Pressure rises · choices affect the relationship',
  'Revelation · the lead learns something meaningful',
  'Hard decision · show the emotional consequence',
  'Confrontation · the leads face the central conflict',
  'Honest response · an action changes their dynamic',
  'Resolution · show a concrete consequence',
  'Final emotional image · close the current story arc'
 ],
 fantasy:[
  'Ordinary world · introduce the hero and the world rules',
  'Invitation · an unfamiliar possibility appears',
  'Call to adventure · a specific objective emerges',
  'Threshold · the hero chooses to leave the familiar place',
  'First challenge · demonstrate one established world rule',
  'Ally or rival · introduce a distinct supporting character',
  'Exploration · reveal a new place with a clear purpose',
  'Obstacle · the first plan fails for a visible reason',
  'Discovery · learn an actionable clue without changing world rules',
  'Cost · the hero makes a meaningful sacrifice',
  'Preparation · use established abilities and objects',
  'Confrontation · pursue the goal with grounded cause and effect',
  'Outcome · show what the choice changed',
  'New horizon · complete this arc and hint at the next'
 ]
};
const LABEL={disaster:'Living Disaster Book',drama:'AI Drama',fantasy:'Anime Adventure Fantasy'};
function category(){return window.ldProductionCategory||document.getElementById('productionCategory')?.value||'disaster';}
function enabled(){return category()==='drama'||category()==='fantasy';}
function role(stage){if(window.ldStoryEpisode&&/^P\d+$/.test(stage))return 'Continue this episode with one purposeful scene; follow the edited scene and previous episode continuity';if(stage==='HOOK')return category()==='drama'?'Immediate emotional question · one readable interaction':'Immediate adventure mystery · one readable discovery';if(stage==='ENDING')return 'Closing image · emotional payoff';if(stage==='THUMBNAIL')return 'Clickable character and story thumbnail';let n=parseInt(String(stage).slice(1),10);let index=String(stage).startsWith('S')?Math.ceil(n*14/30):n;return ROLES[category()]?.[Math.min(Math.max(index,1),14)-1]||'Character-driven story beat';}
function look(){return category()==='fantasy'?'hand-drawn 2D anime fantasy, deliberate character silhouettes, coherent world design and richly layered backgrounds':'cinematic character-focused animation with grounded adult anatomy, expressive but restrained acting and consistent environments';}
function identity(){const premise=String(document.getElementById('storyPremise')?.value||'').trim();const bible=String(document.getElementById('storyBible')?.value||'').trim();return (window.ldStoryEpisode?'SERIES: '+window.ldStoryEpisode.seriesTitle+'. '+window.ldStoryEpisode.unit+' '+window.ldStoryEpisode.number+'. PREVIOUS EPISODE CONTINUITY: '+(window.ldStoryEpisode.previousContinuity||'Not established; do not invent prior events')+'. ':'')+'STORY PREMISE: '+(premise||'Use the supplied title and edited stage scenes; do not invent a specific plot twist.')+'. CHARACTER DETAILS AND WORLD RULES: '+(bible||'Only details explicitly established in the current story prompts are canonical.')+'. CHARACTER + WORLD BIBLE: Preserve the same protagonist face, hairstyle, body proportions, outfit and distinguishing details across this project. A new outfit or location needs an explicit story reason and must be introduced as a new stage. Within each 10-second clip, no replacement faces, costume changes, extra limbs, teleportation, duplicate people or suddenly altered props. The title establishes the premise; editable panel prompts establish the specific people, place and action. Do not invent named relationships, magic powers, historical facts or plot twists as if the user already approved them.';}
function image(stage,format,title){let ratio=format==='longform'?'landscape 16:9':'portrait 9:16';if(stage==='THUMBNAIL')return 'Create a FULL-COLOR '+LABEL[category()]+' thumbnail for "'+title+'", '+ratio+'. One distinct adult protagonist with a readable expression, one strong story clue, dramatic depth and a crop-safe title area. '+look()+'. Keep consistent character and world details from the approved stages. No disaster-history badges or invented historical claims.';if(stage==='ENDING')return 'Create the '+LABEL[category()]+' ending image for "'+title+'", '+ratio+'. Illustrate the resolution established by the previous approved panel with the same recurring adults, wardrobe and environment logic. Leave space for an optional closing caption without embedding text. '+look()+'.';
 return 'Create the '+LABEL[category()]+' '+stage+' illustration for "'+title+'", '+ratio+'. STORY BEAT: '+role(stage)+'. Show one distinct place and one focal interaction or action suitable for this beat. '+look()+'. '+identity()+' No embedded text, captions, logos, cloned people, photorealistic humans or 3D CGI people.';
}
function flow(stage,format,title){let ratio=format==='longform'?'landscape 16:9':'portrait 9:16';return 'Exactly 10 seconds, '+ratio+'. Animate the supplied '+LABEL[category()]+' '+stage+' illustration for "'+title+'" as one continuous hand-drawn 2D shot. STORY BEAT: '+role(stage)+'. Preserve the exact faces, outfits, scene layout and all existing objects from the supplied image. Begin one small natural action within the first second, develop it physically and finish on a readable emotional or adventurous consequence. Restrained camera motion; no cuts, transitions, morphs, duplicate cast, sudden wardrobe change, narration, music, text or logos. '+identity();
}
function narration(stage,title){return 'In "'+title+'", '+role(stage).toLowerCase()+'.';}
function video(card,title,format,visual,color){
 let stage=card.dataset.stage,scene=String(card.querySelector('.video-scene')?.value||card.dataset.videoScene||'').trim();
 if(!scene||/disaster|earthquake|tsunami|historical documentary/i.test(scene)&&!/\bdrama\b|\bfantasy\b/i.test(scene))scene='In "'+title+'", show '+role(stage).toLowerCase()+' with one clear action and a distinct setting.';
 let palette=color==='bw'?'STRICT true black-and-white grayscale only, no tint or selective color':'full color with a coherent palette';
 let rendering=visual==='real'?'cinematic realistic human drama with consistent believable adult anatomy':'hand-drawn 2D anime, no live action or photorealism';
 if(category()==='fantasy')rendering='hand-drawn 2D anime adventure fantasy, no live action or photorealism';
 return 'VIDEO PROMPT — EXACTLY 10 SECONDS\n'+LABEL[category()]+' — '+title+' · '+stage+'\n\nTEXT-TO-VIDEO. '+(format==='longform'?'Landscape 16:9':'Portrait 9:16')+'. One continuous shot. '+rendering+'; '+palette+'.\n\nSTORY ROLE: '+role(stage)+'.\n'+identity()+'\n\nPANEL SCENE:\n'+scene+' Use only characters and world details established in this project. One primary action. Keep the cast, costume, props and geography persistent in every frame.\n\nTIMING:\n0.0–2.0s: Show the established character, place and focal action immediately.\n2.0–7.0s: Continue the same action with visible cause and effect and natural reactions.\n7.0–10.0s: End the same shot on one clear consequence that advances this beat; do not jump to the next panel.\n\nCAMERA:\nOne motivated gentle camera movement with consistent lens and perspective. No cuts, wipes or new angle.\n\nPHYSICS AND TIME:\nStable hands, faces, clothes and objects. Change occurs only by visible movement. No magical effect unless the world rules in the panel explicitly establish it.\n\nAUDIO:\nQuiet scene-specific SFX only; no narration, dialogue, music or invented sound.\n\nNEGATIVE:\nNo disaster-history framing, invented facts, cloned people, sudden characters, outfit changes, morphs, 3D CGI people, caption or logo.\n\nSTATUS: FOR TESTING — review the generated scene before approval.';
}
window.LDStoryModes=Object.freeze({category,enabled,role,image,flow,narration,video,identity,label:()=>LABEL[category()]});
})();
/* Serialized fiction: episodes contain an editable number of scenes. */
(()=>{
'use strict';
const LIB='ld-autopilot-free-project-library-v1', COUNTERS='ner-series-counters-v1';
const el=id=>document.getElementById(id);
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
const fiction=()=>['fantasy','drama'].includes(el('productionCategory')?.value);
const clone=x=>JSON.parse(JSON.stringify(x));
function nextNumber(id){
 const saved=read(LIB,{projects:[]}).projects||[];
 return 1+Math.max(0,Number(read(COUNTERS,{})[id])||0,...saved.filter(p=>p.state?.storyEpisode?.seriesId===id).map(p=>Number(p.state.storyEpisode.number)||0));
}
function remember(meta){
 const counters=read(COUNTERS,{});
 counters[meta.seriesId]=Math.max(Number(counters[meta.seriesId])||0,Number(meta.number)||0);
 localStorage.setItem(COUNTERS,JSON.stringify(counters));
}
function prepare(seed){
 if(seed){window.ldStoryEpisode=seed.category!=='disaster'&&seed.storyEpisode?clone(seed.storyEpisode):null;if(window.ldStoryEpisode)remember(window.ldStoryEpisode);return seed;}
 if(!fiction()){window.ldStoryEpisode=null;return seed;}
 const title=el('seriesTitle')?.value.trim()||el('topic').value.trim()||'Untitled series';
 const key=el('productionCategory').value+':'+title.toLocaleLowerCase();
 const unit=el('storyUnit')?.value==='Chapter'?'Chapter':'Episode';
 const meta={seriesId:key,seriesTitle:title,unit,number:nextNumber(key),previousContinuity:'',continuity:''};
 const previous=(read(LIB,{projects:[]}).projects||[]).filter(p=>p.state?.storyEpisode?.seriesId===key).sort((a,b)=>b.state.storyEpisode.number-a.state.storyEpisode.number)[0]?.state;
 if(previous){meta.previousContinuity=previous.storyEpisode.continuity||Object.values(previous.stages||{}).at(-1)?.videoScene||'';}
 remember(meta);window.ldStoryEpisode=meta;
 return {category:el('productionCategory').value,topic:title+' — '+unit+' '+meta.number,format:el('format').value,storyEpisode:meta,storyPremise:el('storyPremise').value||previous?.storyPremise||'',storyBible:el('storyBible').value||previous?.storyBible||(el('productionCategory').value==='fantasy'?'Faceless adult traveler; face and hair always concealed by a dark navy hood, knee-length cloak, brown boots, small shoulder bag. Consistent silhouette and clothing. No image reference; generate from text only.':''),projectLocks:{locked:true,videoMode:'text',visualStyle:'anime',colorMode:'color'},stages:{P1:{videoMode:'text'}}};
}
function repaint(){
 const meta=window.ldStoryEpisode;
 const controls=el('episodeControls');if(controls)controls.hidden=!meta;
 if(el('seriesSetup'))el('seriesSetup').hidden=!fiction();
 if(!meta)return;
 el('seriesTitle').value=meta.seriesTitle;
 el('storyUnit').value=meta.unit;
 el('episodeHeading').textContent=meta.seriesTitle+' · '+meta.unit+' '+meta.number;
 el('episodeContinuity').value=meta.continuity||'';
 el('nextEpisodeBtn').textContent='New '+meta.unit+' '+nextNumber(meta.seriesId);
 document.querySelectorAll('#stages .stage-card').forEach((card,index)=>{
  card.querySelector('.stage-title').textContent='Scene '+(index+1);
  card.querySelector('.stage-name').textContent='Scene '+(index+1);
 });
 el('jumpStage')?.querySelectorAll('option').forEach((option,index)=>option.textContent='Scene '+(index+1));
}
function editScenes(remove){
 const state=window.LDCore.collectState();if(!state.storyEpisode)return;
 const keys=Object.keys(state.stages);
 if(remove){if(keys.length<=1)return;const last=state.stages[keys.at(-1)];if((last.done||last.videoScene||last.narration)&&!confirm('Remove the last scene and its saved content?'))return;delete state.stages[keys.at(-1)];}
 else{const n=1+Math.max(0,...keys.map(k=>Number(k.slice(1))||0));state.stages['P'+n]={videoMode:'text'};}
 window.LDCore.loadProductionState(state);
}
window.NERSerial={prepare,nextNumber};
document.addEventListener('DOMContentLoaded',()=>{
 const setup=document.createElement('div');setup.id='seriesSetup';
 setup.innerHTML='<label for="seriesTitle">Series title</label><input id="seriesTitle" placeholder="Name of your ongoing series"><label for="storyUnit">Create as</label><select id="storyUnit"><option>Episode</option><option>Chapter</option></select><p>Automatic numbering within this series. Start with one scene and add more as the story needs.</p>';
 el('storySetup').prepend(setup);
 const bar=document.createElement('section');bar.id='episodeControls';bar.className='card';bar.hidden=true;
 bar.innerHTML='<strong id="episodeHeading"></strong><p>No fixed scene count. Add scenes as needed.</p><button type="button" class="ghost small" id="addStoryScene">Add Scene</button> <button type="button" class="ghost small" id="removeStoryScene">Remove Last Scene</button><label for="episodeContinuity">Episode ending / continuity for the next episode</label><textarea id="episodeContinuity" rows="3" placeholder="Where did it end? What changed? What remains unresolved?"></textarea><button type="button" class="primary" id="nextEpisodeBtn">New Episode</button>';
 el('stages').before(bar);
 el('addStoryScene').onclick=()=>editScenes(false);
 el('removeStoryScene').onclick=()=>editScenes(true);
 el('episodeContinuity').addEventListener('input',()=>{
  if(!window.ldStoryEpisode)return;
  window.ldStoryEpisode.continuity=el('episodeContinuity').value;
  window.dispatchEvent(new Event('ld:api-usage-updated'));
 });
 el('nextEpisodeBtn').onclick=()=>{
  const current=window.LDCore.collectState();
  // Flush current continuity into the normal save/library path before creating the next entry.
  window.dispatchEvent(new Event('ld:api-usage-updated'));
  window.dispatchEvent(new CustomEvent('ld:production-built',{detail:{state:current,fresh:false}}));
  el('seriesTitle').value=current.storyEpisode.seriesTitle;
  el('storyUnit').value=current.storyEpisode.unit;
  window.LDCore.buildProduction();
 };
 el('productionCategory').addEventListener('change',()=>{setup.hidden=!fiction();});
 el('newProjectBtn').addEventListener('click',()=>{window.ldStoryEpisode=null;el('seriesTitle').value='';repaint();});
 repaint();
});
window.addEventListener('ld:production-built',()=>{if(el('episodeControls'))repaint();});
})();
