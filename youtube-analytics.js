(()=>{
'use strict';
const C=window.LDYouTubeCore,$=id=>document.getElementById(id),KEY='ld-youtube-client-id-v1',DEFAULT_CLIENT_ID='620109796783-83bhta7t76ls1eepm55enrt99vjhild0.apps.googleusercontent.com';
let token='',expires=0,client=null,channels=[],data=null,busy=false,generation=0,controller=null,libraryPromise=null;
const fmt=n=>n===null||n===undefined?'—':Number(n).toLocaleString(undefined,{maximumFractionDigits:1});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validId=s=>/^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(s);
function status(message,error=false){$('ytStatus').textContent=message;$('ytStatus').dataset.error=String(error);}
function controls(){const active=!!token&&Date.now()<expires;$('ytSync').disabled=busy||!active||!$('ytChannel').value;$('ytConnect').disabled=busy;$('ytSave').disabled=busy;$('ytChannel').disabled=busy||!channels.length;$('ytRange').disabled=busy;$('ytDisconnect').disabled=!token&&!data;}
function loadLibrary(){
 if(window.google?.accounts?.oauth2)return Promise.resolve();
 if(libraryPromise)return libraryPromise;
 libraryPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
  const timer=setTimeout(()=>{script.remove();libraryPromise=null;reject(new Error('Google sign-in did not load. Check your connection and try again.'));},15000);
  script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();libraryPromise=null;reject(new Error('Could not load Google sign-in. Check your connection.'));};document.head.append(script);
 });return libraryPromise;
}
async function prepare(){
 const id=$('ytClientId').value.trim();if(!validId(id))throw new Error('Enter a Web application Client ID ending in .apps.googleusercontent.com. Do not enter a secret or API key.');
 await loadLibrary();
 client=google.accounts.oauth2.initTokenClient({client_id:id,scope:C.scopes.join(' '),include_granted_scopes:false,
  callback:async response=>{
   if(response.error){status('Google connection was not approved. Try Connect YouTube again.',true);controls();return;}
   if(!google.accounts.oauth2.hasGrantedAllScopes(response,...C.scopes)){status('Both read-only permissions are needed. Connect again and allow videos and analytics access.',true);controls();return;}
   token=response.access_token;expires=Date.now()+Number(response.expires_in||3600)*1000-30000;
   await discoverChannels();
  },error_callback:e=>{status(e.type==='popup_closed'?'Google sign-in was closed. You can connect again.':'Google sign-in could not open. Allow popups and try in your browser.',true);controls();}});
 $('ytSetupStatus').textContent='Setup saved. Press Connect YouTube to choose your Google account.';
}
async function request(url,params){
 if(!token||Date.now()>=expires){token='';controls();throw new Error('Google access expired. Press Connect YouTube, then Sync Now.');}
 const link=new URL(url);Object.entries(params).forEach(([k,v])=>link.searchParams.set(k,String(v)));
 const response=await fetch(link,{headers:{Authorization:`Bearer ${token}`},signal:controller?.signal,cache:'no-store'});
 let body;try{body=await response.json();}catch{throw new Error('YouTube returned an unreadable response. Retry when online.');}
 if(!response.ok){
  if(response.status===401){token='';controls();throw new Error('Google access expired or was revoked. Reconnect your channel.');}
  const reason=body.error?.errors?.[0]?.reason||'';
  if(/quota/i.test(reason))throw new Error('YouTube API quota reached. Try again later.');
  if(/accessNotConfigured|serviceDisabled/i.test(reason))throw new Error('Enable YouTube Data API v3 and YouTube Analytics API in your Google Cloud project.');
  if(response.status===403)throw new Error('YouTube access was denied. Check API enablement, permissions and channel ownership, then reconnect.');
  throw new Error(`YouTube request failed (${response.status}). ${body.error?.message||'Try again later.'}`);
 }
 return body;
}
const yt=(endpoint,params)=>request(`https://www.googleapis.com/youtube/v3/${endpoint}`,params);
const report=params=>request('https://youtubeanalytics.googleapis.com/v2/reports',params);
function clearResults(){
 data=null;$('ytResults').hidden=true;
 for(const id of ['ytTotals','ytVideos','ytPeriodVideos','ytDaily','ytWeekdays','ytPatterns'])$(id).replaceChildren();
 if($('ytEvidence'))$('ytEvidence').value='';
 if($('ytCopyEvidence'))$('ytCopyEvidence').disabled=true;
 if($('ytEvidenceStatus'))$('ytEvidenceStatus').textContent='Sync your channel to build evidence.';
}
async function discoverChannels(){
 const job=++generation;controller?.abort();controller=new AbortController();busy=true;clearResults();channels=[];controls();status('Reading your YouTube channels…');
 try{
  let next='';do{const page=await yt('channels',{part:'snippet,contentDetails,statistics',mine:true,maxResults:50,...(next?{pageToken:next}:{})});channels.push(...(page.items||[]));next=page.nextPageToken||'';}while(next);
  if(job!==generation)return;
  $('ytChannel').replaceChildren(...channels.map(ch=>new Option(ch.snippet.title,ch.id)));
  if(!channels.length)throw new Error('No YouTube channel found for this account. Connect with the channel owner account.');
  status('Connected. Confirm the channel below, then press Sync Now.');
 }catch(e){if(job===generation)status(e.message,true);}finally{if(job===generation){busy=false;controls();}}
}
function table(id,head,records){
 $(id).innerHTML=records.length?`<table><thead><tr>${head.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${records.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'<p>No data available for this report.</p>';
}
function videoLink(v){return /^[\w-]{11}$/.test(v.id)?`<a href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}" target="_blank" rel="noopener noreferrer">${escape(v.title)}</a>`:escape(v.title);}
function renderTotals(){
 if(!data)return;const key=$('ytSort').value;
 table('ytVideos',['Video / current title','Published','Visibility','Views','Likes','Comments','Likes / 100 views'],[...data.videos].sort((a,b)=>(b[key]??-1)-(a[key]??-1)).map(v=>[videoLink(v),escape(v.publishedAt.slice(0,10)),escape(v.visibility),fmt(v.views),fmt(v.likes),fmt(v.comments),v.views>0&&v.likes!==null?fmt(v.likes/v.views*100):'—']));
}
function plain(n,digits=1){
 if(n===null||n===undefined||Number.isNaN(Number(n)))return 'N/A';
 return Number(n).toLocaleString('en-US',{maximumFractionDigits:digits});
}
function evidenceSummary(){
 if(!data)return '';
 const names=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
 const stats=data.channel.statistics||{};
 const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'device-local';
 const weekday=C.weekdays(data.daily);
 const uploads=C.uploadWeekdays(data.videos,data.periodVideos,timezone);
 const title=C.titlePatterns(data.videos,data.periodVideos);
 const topDates=[...data.daily].sort((a,b)=>(C.number(b.views)||0)-(C.number(a.views)||0)).slice(0,10);
 const lifetime=[...data.videos].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,20);
 const lookup=new Map(data.videos.map(v=>[v.id,v]));
 const periodTop=[...data.periodVideos].sort((a,b)=>(C.number(b.views)||0)-(C.number(a.views)||0)).slice(0,20);
 const totalPeriodViews=C.sum(data.daily,'views');
 const totalPeriodLikes=C.sum(data.daily,'likes');
 const totalPeriodComments=C.sum(data.daily,'comments');
 const gained=C.sum(data.daily,'subscribersGained'),lost=C.sum(data.daily,'subscribersLost');
 const lines=[
  'LD AUTO — YOUTUBE ANALYTICS EVIDENCE SUMMARY',
  'Generated: '+new Date(data.syncedAt).toISOString(),
  'Channel: '+(data.channel.snippet?.title||'Unknown'),
  'Channel ID: '+(data.channel.id||'Unknown'),
  'Selected analytics window: '+data.startDate+' to '+data.endDate+' (YouTube reporting dates use Pacific Time)',
  'Device timezone used for upload-weekday grouping: '+timezone,
  '',
  'CHANNEL SNAPSHOT',
  'Subscribers: '+(stats.hiddenSubscriberCount?'Hidden':plain(C.number(stats.subscriberCount),0)),
  'Lifetime channel views: '+plain(C.number(stats.viewCount),0),
  'Uploads loaded: '+plain(data.videos.length,0),
  '',
  'SELECTED-PERIOD TOTALS FROM DAILY REPORT',
  'Views: '+plain(totalPeriodViews,0),
  'Likes: '+plain(totalPeriodLikes,0),
  'Comments: '+plain(totalPeriodComments,0),
  'Subscribers gained: '+plain(gained,0),
  'Subscribers lost: '+plain(lost,0),
  'Net subscribers: '+plain(gained-lost,0),
  '',
  'AUDIENCE ACTIVE TIME',
  'Exact hour-of-day / "When your viewers are on YouTube" heatmap: NOT AVAILABLE through the YouTube Analytics API used by LD AUTO.',
  'Evidence available here is day/date activity only; do not infer exact audience-active hours from daily totals.',
  '',
  'VIEWER ACTIVITY BY WEEKDAY (activity date, not upload day)'
 ];
 if(data.dailyError)lines.push('Daily report error: '+data.dailyError);
 else if(!weekday.length)lines.push('No daily rows returned.');
 else weekday.forEach(w=>lines.push(names[w.day]+': avg '+plain(w.average,1)+' views per returned day; total '+plain(w.total,0)+' across '+w.count+' returned '+(w.count===1?'day':'days')));
 lines.push('','STRONGEST ACTIVITY DATES');
 if(!topDates.length)lines.push('No daily rows returned.');
 else topDates.forEach((r,i)=>lines.push((i+1)+'. '+r.day+' — views '+plain(r.views,0)+', likes '+plain(r.likes,0)+', comments '+plain(r.comments,0)+', subs +'+plain(r.subscribersGained,0)+' / -'+plain(r.subscribersLost,0)));
 lines.push('','UPLOAD-DAY PATTERN (publication weekday)');
 if(!uploads.length)lines.push('No upload timestamps available.');
 else [...uploads].sort((a,b)=>(b.periodAverage??-1)-(a.periodAverage??-1)).forEach(g=>lines.push(
  g.name+': '+g.count+' uploads; lifetime views '+plain(g.lifetimeViews,0)+' total / '+plain(g.lifetimeAverage,1)+' avg per upload; selected-period views '+plain(g.periodViews,0)+' across '+g.periodVideos+' videos with returned period data / '+plain(g.periodAverage,1)+' avg'
 ));
 lines.push(
  'Note: upload-day patterns are descriptive only. Topic, title, video age, release time and distribution can change the result.',
  '',
  'TOP VIDEOS — CURRENT LIFETIME TOTALS'
 );
 lifetime.forEach((v,i)=>lines.push((i+1)+'. '+v.title+' | published '+(v.publishedAt||'').slice(0,10)+' | views '+plain(v.views,0)+' | likes '+plain(v.likes,0)+' | comments '+plain(v.comments,0)+(v.views>0&&v.likes!==null?' | likes/100 views '+plain(v.likes/v.views*100,2):'')));
 lines.push('','TOP VIDEOS — SELECTED PERIOD');
 if(data.periodError)lines.push('Period report error: '+data.periodError);
 else if(!periodTop.length)lines.push('No per-video period rows returned.');
 else periodTop.forEach((r,i)=>{
  const v=lookup.get(r.video);
  lines.push((i+1)+'. '+(v?.title||r.video)+' | period views '+plain(r.views,0)+' | engaged views '+plain(r.engagedViews,0)+' | likes '+plain(r.likes,0)+' | comments '+plain(r.comments,0)+' | avg viewed '+plain(r.averageViewPercentage,1)+'% | avg duration '+plain(r.averageViewDuration,1)+'s');
 });
 lines.push('','TITLE PATTERNS');
 title.forEach(r=>lines.push(r.name+': '+r.count+' videos with returned period data; '+plain(r.views,0)+' period views; '+plain(r.average,1)+' avg views/video'));
 lines.push('','DAILY EVIDENCE ROWS (Pacific Time)');
 if(data.dailyError)lines.push('Unavailable: '+data.dailyError);
 else [...data.daily].sort((a,b)=>String(a.day).localeCompare(String(b.day))).forEach(r=>lines.push(r.day+' | views '+plain(r.views,0)+' | likes '+plain(r.likes,0)+' | comments '+plain(r.comments,0)+' | subs +'+plain(r.subscribersGained,0)+' / -'+plain(r.subscribersLost,0)));
 lines.push(
  '',
  'EVIDENCE NOTES',
  '- Daily dates are viewer activity dates, not upload dates.',
  '- Upload weekday is calculated from each video publication timestamp in the device timezone shown above.',
  '- Missing API rows are not assumed to be zero.',
  '- Recent uploads have less time to accumulate views than older uploads.',
  '- Patterns are descriptive evidence, not proof that a day, title style or topic caused performance.'
 );
 return lines.join('\n');
}
function renderEvidence(){
 if(!$('ytEvidence'))return;
 $('ytEvidence').value=evidenceSummary();
 $('ytCopyEvidence').disabled=!$('ytEvidence').value;
 $('ytEvidenceStatus').textContent='Ready to copy. Paste this summary into ChatGPT when you want an evidence-based YTS analysis.';
}
async function copyEvidence(){
 const text=$('ytEvidence')?.value||'';if(!text)return;
 try{await navigator.clipboard.writeText(text);$('ytEvidenceStatus').textContent='Copied. Paste it into ChatGPT for analysis.';}
 catch{
  $('ytEvidence').focus();$('ytEvidence').select();
  const ok=document.execCommand&&document.execCommand('copy');
  $('ytEvidenceStatus').textContent=ok?'Copied. Paste it into ChatGPT for analysis.':'Copy failed. Long-press the box and copy the text manually.';
 }
}
function render(){
 $('ytResults').hidden=false;$('ytChannelTitle').textContent=data.channel.snippet.title;
 $('ytFreshness').textContent=`Last synced: ${new Date(data.syncedAt).toLocaleString()}. Requested analytics: ${data.startDate} to ${data.endDate} (Pacific Time).`;
 const stats=data.channel.statistics||{};
 $('ytTotals').innerHTML=[['Subscribers',stats.hiddenSubscriberCount?'Hidden':fmt(C.number(stats.subscriberCount))],['Channel lifetime views',fmt(C.number(stats.viewCount))],['Uploads loaded',fmt(data.videos.length)]].map(([label,value])=>`<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join('');
 renderTotals();
 const lookup=new Map(data.videos.map(v=>[v.id,v]));
 $('ytReportNote').textContent=data.periodError?`Period report unavailable: ${data.periodError} Current totals above are still available.`:'Ranked by views received in this period, including views on older uploads. Recent uploads have fewer days of exposure. Missing videos are not assumed to have zero views.';
 table('ytPeriodVideos',['Video / current title','Period views','Engaged views','Likes','Comments','Avg viewed %','Avg seconds'],data.periodVideos.map(r=>{const v=lookup.get(r.video);return [v?videoLink(v):escape(r.video),fmt(r.views),fmt(r.engagedViews),fmt(r.likes),fmt(r.comments),fmt(r.averageViewPercentage),fmt(r.averageViewDuration)];}));
 const weekday=C.weekdays(data.daily),names=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
 $('ytWeekdays').replaceChildren();
 const note=document.createElement('p');note.textContent=data.dailyError?`Daily report unavailable: ${data.dailyError}`:data.daily.length?`Latest date returned: ${data.daily.map(r=>r.day).sort().at(-1)}. Dates not returned by YouTube are omitted; do not treat unavailable dates as zero.`:'No daily analytics returned yet. New channels and uploads can take time to appear.';$('ytWeekdays').append(note);
 for(const w of weekday){const p=document.createElement('p');p.textContent=`${names[w.day]}: ${fmt(w.average)} average views per returned day (${w.count} days).`;$('ytWeekdays').append(p);}
 table('ytDaily',['Date (Pacific)','Views','Likes','Comments','Subscribers gained','Subscribers lost'],[...data.daily].sort((a,b)=>Number(b.views)-Number(a.views)).map(r=>[escape(r.day),fmt(r.views),fmt(r.likes),fmt(r.comments),fmt(r.subscribersGained),fmt(r.subscribersLost)]));
 table('ytPatterns',['Pattern','Videos with period data','Period views','Average per video'],C.titlePatterns(data.videos,data.periodVideos).map(r=>[escape(r.name),fmt(r.count),fmt(r.views),fmt(r.average)]));
 renderEvidence();
}
async function sync(){
 if(busy)return;const channel=channels.find(ch=>ch.id===$('ytChannel').value);if(!channel)return;
 const job=++generation;controller?.abort();controller=new AbortController();busy=true;controls();status('Syncing videos and analytics…');
 const span=C.period(Number($('ytRange').value));
 try{
  const playlist=channel.contentDetails?.relatedPlaylists?.uploads;if(!playlist)throw new Error('This channel has no uploads playlist available.');
  const fresh=await yt('channels',{part:'snippet,statistics,contentDetails',id:channel.id});
  const videos=await C.uploads(yt,playlist);
  const params={ids:`channel==${channel.id}`,...span};
  const reports=await Promise.allSettled([
   C.videoReport(report,{...params,metrics:'views,engagedViews,likes,comments,averageViewDuration,averageViewPercentage'}),
   report({...params,dimensions:'day',metrics:'views,likes,comments,subscribersGained,subscribersLost',sort:'day'})
  ]);
  if(job!==generation)return;
  data={channel:fresh.items?.[0]||channel,videos,...span,syncedAt:Date.now(),periodVideos:reports[0].status==='fulfilled'?reports[0].value:[],periodError:reports[0].status==='rejected'?reports[0].reason.message:'',daily:reports[1].status==='fulfilled'?C.rows(reports[1].value):[],dailyError:reports[1].status==='rejected'?reports[1].reason.message:''};
  render();status(data.periodError||data.dailyError?'Video totals synced. Some analytics reports are unavailable; see the details below.':'Sync complete. Reports are ready.');
 }catch(e){if(job===generation)status(`${e.message}${data?' Previous results remain displayed with their original sync time.':''}`,true);}finally{if(job===generation){busy=false;controls();}}
}
$('ytSave').addEventListener('click',async()=>{
 if(token||data){status('Disconnect before changing the Google setup.',true);return;}
 client=null;try{await prepare();try{localStorage.setItem(KEY,$('ytClientId').value.trim());}catch{$('ytSetupStatus').textContent='Setup ready for this visit. Browser storage is unavailable.';}status('Ready. Press Connect YouTube.');}catch(e){status(e.message,true);}controls();
});
$('ytClientId').addEventListener('input',()=>{client=null;});
$('ytConnect').addEventListener('click',()=>{
 if(!client){$('ytSetup').open=true;status('Save the Google setup first. Then press Connect YouTube to open sign-in.',true);return;}
 try{client.requestAccessToken({prompt:'select_account'});}catch{status('Could not open Google sign-in. Allow popups and retry.',true);}
});
$('ytSync').addEventListener('click',sync);
$('ytDisconnect').addEventListener('click',()=>{
 const old=token;generation++;controller?.abort();token='';expires=0;channels=[];busy=false;clearResults();$('ytChannel').replaceChildren(new Option('Connect to choose your channel',''));status('Disconnected. Channel data cleared from this page.');controls();
 if(old&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(old,result=>{if(result.error)status('Local data cleared. Remove access in Google account connections if revocation did not complete.');});
});
$('ytChannel').addEventListener('change',()=>{clearResults();status('Channel changed. Press Sync Now.');controls();});
$('ytRange').addEventListener('change',()=>{clearResults();status('Period changed. Press Sync Now to load this period.');});
$('ytSort').addEventListener('change',renderTotals);
$('ytCopyEvidence')?.addEventListener('click',copyEvidence);
$('ytOrigin').textContent=location.origin;
let savedClientId='';try{savedClientId=localStorage.getItem(KEY)||'';}catch{}
$('ytClientId').value=savedClientId||DEFAULT_CLIENT_ID;
$('ytSetup').open=!validId($('ytClientId').value);
if(validId($('ytClientId').value))prepare().then(()=>status(savedClientId?'Setup loaded. Connect YouTube to continue.':'LD AUTO OAuth client ready. Press Connect YouTube to choose your channel.')).catch(e=>status(e.message,true));
controls();
})();
