(()=>{
'use strict';
const $=id=>document.getElementById(id),cat=document.body.dataset.category;
window.ldProductionCategory=cat;
const KEY='ner-independent-'+cat+'-v1';
const read=(k,d)=>{const x=localStorage.getItem(k);return x?JSON.parse(x):d;};
let db;try{db=read(KEY,{projects:[],imported:[],counters:{}});}catch{ $('status').textContent='Saved data could not be read. Export or recover it before continuing.';return;}
db.imported||=[];db.counters||={};
const original=read('ld-autopilot-free-project-library-v1',{projects:[]}).projects||[];
const core=read('ld-autopilot-free-v1',null);
const sources=[...original];
if(core?.category===cat&&!sources.some(p=>p.state?.topic===core.topic&&p.state?.category===cat))sources.push({id:'legacy-core-'+cat,state:core,name:core.topic});
for(const p of sources){if(p.state?.category!==cat||db.imported.includes(p.id))continue;
 db.projects.push(JSON.parse(JSON.stringify(p)));db.imported.push(p.id);}
function persist(){localStorage.setItem(KEY,JSON.stringify(db));}
persist();
let current=db.projects.find(p=>p.id===db.active)||db.projects.at(-1)||null,busy=false;
const status=t=>$('status').textContent=t;
const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function state(){return current?.state;}
function fields(){return {storyPremise:$('storyPremise').value,storyBible:$('storyBible').value};}
function sync(){
 if(!current)return;
 Object.assign(state(),fields());state().topic=$('episodeTitle').value||state().topic;
 state().format=$('ratio').value;state().projectLocks={locked:true,videoMode:'text',visualStyle:'anime',colorMode:$('palette').value};
 state().storyEpisode||={seriesId:cat+':'+state().topic,seriesTitle:state().topic,number:1,unit:'Episode'};
 Object.assign(state().storyEpisode,{previousContinuity:$('previous').value,continuity:$('ending').value});
 state().updatedAt=new Date().toISOString();current.name=state().topic;
 document.querySelectorAll('.stage-card').forEach(c=>{
 const d=state().stages[c.dataset.stage];Object.assign(d,{narration:c.querySelector('.narration').value,videoScene:c.querySelector('.video-scene').value,
 textVideoPrompt:c.dataset.textVideoPrompt||'',storyVoice:c.dataset.storyVoice||'none',storyFocus:c.dataset.storyFocus||'auto',
 storyPolishKey:c.dataset.storyPolishKey||'',readyKey:c.dataset.readyKey||'',done:c.querySelector('.done-toggle').checked});
 });
 window.ldStoryEpisode=state().storyEpisode;window.ldProjectLocks=state().projectLocks;
 $('projectTitle').textContent=state().topic;$('format').value=state().format;
 persist();
}
function list(){
 $('saved').replaceChildren();for(const p of db.projects){const o=document.createElement('option');o.value=p.id;o.textContent=p.name||p.state.topic;$('saved').append(o);}
 $('saved').value=current?.id||'';
}
function signature(c){return JSON.stringify([window.LDStoryModes.polishKey(c),c.dataset.textVideoPrompt,c.querySelector('.video-scene').value]);}
function render(){
 list();$('stages').replaceChildren();$('create').hidden=!!current;
 $('add').disabled=!current;$('nextEpisode').disabled=!current;$('backup').disabled=!current;
 if(!current){$('projectTitle').textContent='No episode selected';return;}
 const s=state(),ep=s.storyEpisode||{};db.active=current.id;
 for(const [id,value] of Object.entries({seriesTitle:ep.seriesTitle||s.topic,unit:ep.unit||'Episode',episodeTitle:s.topic,ratio:s.format||'shorts',format:s.format||'shorts',palette:s.projectLocks?.colorMode||'color',storyPremise:s.storyPremise||'',storyBible:s.storyBible||'',previous:ep.previousContinuity||'',ending:ep.continuity||''}))$(id).value=value;
 $('projectTitle').textContent=s.topic;window.ldStoryEpisode=s.storyEpisode||null;
 window.ldProjectLocks=s.projectLocks||{locked:true,videoMode:'text',visualStyle:'anime',colorMode:'color'};
 $('cost').textContent='Tracked API calls: '+(s.apiUsage?.calls||0);
 for(const [key,d] of Object.entries(s.stages||{})){
 const c=document.createElement('article');c.className='stage-card';c.dataset.stage=key;
 Object.assign(c.dataset,{videoMode:'text',videoScene:d.videoScene||'',textVideoPrompt:d.textVideoPrompt||'',storyVoice:d.storyVoice||'none',storyFocus:d.storyFocus||'auto',storyPolishKey:d.storyPolishKey||'',readyKey:d.readyKey||''});
 c.innerHTML='<h3></h3><label><input type="checkbox" class="done-toggle"> Approved</label><div class="narration-wrap"><label>Narration / exact spoken line</label><textarea class="narration"></textarea></div><label>Scene direction / generated scene</label><textarea class="video-scene"></textarea><button class="smart">Smart Continue</button><button class="copy">Copy full prompt</button><details><summary>View full prompt</summary><textarea class="text-video-prompt" readonly></textarea></details>';
 c.querySelector('h3').textContent=/^P\d+$/.test(key)?'Scene '+key.slice(1):key;
 c.querySelector('.narration').value=d.narration||'';c.querySelector('.video-scene').value=d.videoScene||'';
 c.querySelector('.text-video-prompt').value=d.textVideoPrompt||d.flowPrompt||d.imagePrompt||'';
 c.querySelector('.done-toggle').checked=!!d.done;
 c.querySelector('.smart').onclick=()=>prepare(c);
 c.querySelector('.copy').onclick=async()=>{try{await navigator.clipboard.writeText(c.querySelector('.text-video-prompt').value);status('Prompt copied.');}catch{status('Select the prompt under View full prompt and copy manually.');}};
 c.querySelector('.done-toggle').onchange=e=>{if(e.target.checked&&(!c.dataset.readyKey||c.dataset.readyKey!==signature(c))){e.target.checked=false;status('Prepare the current prompt and review the generated clip before approving.');}sync();};
 c.addEventListener('input',()=>{c.dataset.videoScene=c.querySelector('.video-scene').value;sync();});
 $('stages').append(c);
 }
 window.dispatchEvent(new CustomEvent('ld:production-built',{detail:{state:s,fresh:false}}));persist();
}
async function prepare(c){
 if(busy)return;sync();busy=true;
 document.querySelectorAll('button,select,input,textarea').forEach(e=>e.disabled=true);
 try{
 status('Polishing this scene…');
 await window.LDStoryModes.polish(c);
 const prompt=window.LDStoryModes.video(c,state().topic,state().format,'anime',state().projectLocks.colorMode);
 c.dataset.textVideoPrompt=prompt;c.querySelector('.text-video-prompt').value=prompt;
 c.dataset.readyKey=signature(c);sync();
 try{await navigator.clipboard.writeText(prompt);status('Prompt ready and copied. Generate the clip, review it, then check Approved.');}catch{status('Prompt ready. Use Copy full prompt, then generate and review the clip.');}
 }catch(e){status(e.message);}
 finally{busy=false;document.querySelectorAll('button,select,input,textarea').forEach(e=>e.disabled=false);}
}
window.LDSmartContinue={recordApiUsage(u){if(!u||!current)return;state().apiUsage||={};for(const key of ['calls','inputTokens','outputTokens','totalTokens','estimatedCostUsd'])state().apiUsage[key]=(Number(state().apiUsage[key])||0)+(Number(u[key])||0);persist();$('cost').textContent='Tracked API calls: '+state().apiUsage.calls;},
 getApprovedMemory:()=>null};
function create(next){
 sync();const old=state(),title=next?(old.storyEpisode?.seriesTitle||old.topic):$('seriesTitle').value.trim();
 if(!title)return status('Enter a series title.');
 const id=next?(old.storyEpisode?.seriesId||cat+':'+title):cat+':'+title.toLowerCase();
 const num=1+Math.max(Number(db.counters[id])||0,...db.projects.filter(p=>p.state.storyEpisode?.seriesId===id).map(p=>Number(p.state.storyEpisode.number)||0));
 const unit=next?(old.storyEpisode?.unit||'Episode'):$('unit').value;
 const p={id:uid(),state:{category:cat,topic:title+' — '+unit+' '+num,format:$('ratio').value,...fields(),projectLocks:{locked:true,videoMode:'text',visualStyle:'anime',colorMode:$('palette').value},
 storyEpisode:{seriesId:id,seriesTitle:title,number:num,unit,previousContinuity:next?(old.storyEpisode?.continuity||Object.values(old.stages||{}).at(-1)?.videoScene||''):'',continuity:''},
 stages:{P1:{videoMode:'text',done:false}},apiUsage:{calls:0}}};
 db.counters[id]=num;db.projects.push(p);current=p;render();status(unit+' '+num+' created.');
}
$('create').onclick=()=>create(false);$('nextEpisode').onclick=()=>create(true);
$('newSeries').onclick=()=>{sync();current=null;delete db.active;for(const id of ['seriesTitle','episodeTitle','storyPremise','storyBible','previous','ending'])$(id).value='';render();};
$('saved').onchange=()=>{sync();current=db.projects.find(p=>p.id===$('saved').value);render();};
$('add').onclick=()=>{sync();const n=1+Math.max(0,...Object.keys(state().stages).map(k=>Number(k.slice(1))||0));state().stages['P'+n]={videoMode:'text',done:false};render();};
for(const id of ['storyPremise','storyBible','previous','ending','episodeTitle','ratio','palette'])$(id).addEventListener('input',sync);
$('backup').onclick=()=>{sync();const url=URL.createObjectURL(new Blob([JSON.stringify(state(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=cat+'-episode-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onclick=()=>$('file').click();
$('file').onchange=async()=>{try{const f=$('file').files[0];if(!f)return;const s=JSON.parse(await f.text());if(s.category!==cat||!s.topic||!s.stages||typeof s.stages!=='object')throw Error('Choose a backup for this studio.');sync();current={id:uid(),name:s.topic,state:s};db.projects.push(current);render();status('Backup imported.');}catch(e){status(e.message);}finally{$('file').value='';}};
render();
})();