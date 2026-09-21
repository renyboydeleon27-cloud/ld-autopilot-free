/* Shared calculations and paginated reads. No credentials or channel data stored here. */
(function(root){
'use strict';
const scopes=['https://www.googleapis.com/auth/youtube.readonly','https://www.googleapis.com/auth/yt-analytics.readonly'];
const number=value=>value===undefined||value===null||value===''?null:(Number.isFinite(Number(value))?Number(value):null);
const sum=(rows,key)=>rows.reduce((n,r)=>n+(number(r[key])||0),0);
function rows(report){return (report.rows||[]).map(row=>Object.fromEntries((report.columnHeaders||[]).map((h,i)=>[h.name,row[i]])));}
function period(days,now=new Date()){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const p=Object.fromEntries(today.map(x=>[x.type,x.value]));
 const end=new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`);end.setUTCDate(end.getUTCDate()-1);
 const start=new Date(end);start.setUTCDate(start.getUTCDate()-days+1);
 return {startDate:start.toISOString().slice(0,10),endDate:end.toISOString().slice(0,10)};
}
async function uploads(request,playlist){
 let token='',items=[],seen=new Set();
 do{
  const page=await request('playlistItems',{part:'contentDetails',playlistId:playlist,maxResults:50,...(token?{pageToken:token}:{})});
  items.push(...(page.items||[]).map(x=>x.contentDetails?.videoId).filter(Boolean));
  token=page.nextPageToken||'';
  if(token&&seen.has(token))throw new Error('YouTube repeated a page. Please retry sync.');
  seen.add(token);
  if(items.length>10000)throw new Error('This channel exceeds the 10,000-upload limit for this version.');
 }while(token);
 const ids=[...new Set(items)],videos=[];
 for(let i=0;i<ids.length;i+=50){
  const page=await request('videos',{part:'snippet,statistics,contentDetails,status',id:ids.slice(i,i+50).join(',')});
  videos.push(...(page.items||[]));
 }
 return videos.map(v=>({id:v.id,title:v.snippet?.title||'Untitled',publishedAt:v.snippet?.publishedAt||'',visibility:v.status?.privacyStatus||'',views:number(v.statistics?.viewCount),likes:number(v.statistics?.likeCount),comments:number(v.statistics?.commentCount)}));
}
async function videoReport(request,params){
 const result=[];
 for(let startIndex=1;startIndex<=10001;startIndex+=200){
  const page=rows(await request({...params,dimensions:'video',sort:'-views',maxResults:200,startIndex}));
  result.push(...page);
  if(page.length<200)return result;
 }
 throw new Error('Analytics report is too large for this version.');
}
function weekdays(daily){
 const groups=Array.from({length:7},(_,day)=>({day,total:0,count:0}));
 for(const row of daily){const d=new Date(`${row.day}T12:00:00Z`).getUTCDay();if(!Number.isInteger(d))continue;groups[d].total+=number(row.views)||0;groups[d].count++;}
 return groups.filter(g=>g.count).map(g=>({...g,average:g.total/g.count})).sort((a,b)=>b.average-a.average);
}
function titlePatterns(videos,reports){
 const lookup=new Map(videos.map(v=>[v.id,v]));
 const groups=[{name:'Question titles',test:t=>t.includes('?')},{name:'Ellipsis / suspense titles',test:t=>/…|\.{3}/.test(t)},{name:'Year in title',test:t=>/\b(?:18|19|20)\d{2}\b/.test(t)}];
 return groups.map(g=>{const matches=reports.filter(r=>lookup.has(r.video)&&g.test(lookup.get(r.video).title));return {name:g.name,count:matches.length,views:sum(matches,'views'),average:matches.length?sum(matches,'views')/matches.length:null};});
}
const api={scopes,number,sum,rows,period,uploads,videoReport,weekdays,titlePatterns};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LDYouTubeCore=api;
})(typeof window!=='undefined'?window:this);
