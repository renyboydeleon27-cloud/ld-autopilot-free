const assert=require('node:assert/strict');
const C=require('../youtube-analytics-core.js');
(async()=>{
 assert.deepEqual(C.period(7,new Date('2026-09-21T01:00:00Z')),{startDate:'2026-09-13',endDate:'2026-09-19'});
 assert.deepEqual(C.period(7,new Date('2026-03-10T10:00:00Z')),{startDate:'2026-03-03',endDate:'2026-03-09'});
 const ids=Array.from({length:51},(_,i)=>String(i).padStart(11,'0'));let pages=0,batches=[];
 const videos=await C.uploads(async(endpoint,p)=>{
  if(endpoint==='playlistItems'){pages++;return {items:(p.pageToken?ids.slice(50):ids.slice(0,50)).map(videoId=>({contentDetails:{videoId}})),...(p.pageToken?{}:{nextPageToken:'page2'})};}
  batches.push(p.id.split(',').length);return {items:p.id.split(',').map(id=>({id,snippet:{title:'<img src=x onerror=alert(1)>',publishedAt:'2026-09-01T00:00:00Z'},statistics:{viewCount:'0'},status:{privacyStatus:'public'}}))};
 },'uploads');
 assert.equal(pages,2);assert.deepEqual(batches,[50,1]);assert.equal(videos.length,51);assert.equal(videos[0].views,0);assert.equal(videos[0].likes,null);
 await assert.rejects(C.uploads(async()=>({items:[],nextPageToken:'same'}),'uploads'),/repeated/);
 let indices=[];const report=await C.videoReport(async p=>{indices.push(p.startIndex);return {columnHeaders:[{name:'video'},{name:'views'}],rows:Array.from({length:p.startIndex===1?200:1},(_,i)=>['v'+(p.startIndex+i),20])};},{});
 assert.equal(report.length,201);assert.deepEqual(indices,[1,201]);
 const days=C.weekdays([{day:'2026-09-14',views:10},{day:'2026-09-21',views:30},{day:'2026-09-15',views:30}]);
 assert.equal(days[0].day,2);assert.equal(days[1].average,20);assert.equal(days[1].count,2);
 assert.deepEqual(C.rows({}),[]);
 const patterns=C.titlePatterns([{id:'a',title:'Sea… 1899?'},{id:'b',title:'Wind'}],[{video:'a',views:100},{video:'b',views:500},{video:'missing',views:1000}]);
 assert.equal(patterns[0].average,100);assert.equal(patterns[0].count,1);assert.equal(patterns[2].views,100);
 console.log('PASS: Pacific date windows and DST, upload pagination and batching, missing vs zero metrics, repeated-page errors, analytics pagination, weekday averages, title grouping');
})().catch(e=>{console.error(e);process.exit(1)});
