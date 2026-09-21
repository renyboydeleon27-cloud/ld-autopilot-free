const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=require('../youtube-analytics-core.js');
class Element{
 constructor(){this.value='';this.textContent='';this.innerHTML='';this.dataset={};this.disabled=false;this.hidden=false;this.events={};this.children=[];}
 addEventListener(k,f){this.events[k]=f;} append(...x){this.children.push(...x);} replaceChildren(...x){this.children=x;if(x[0]?.value!==undefined)this.value=x[0].value;this.innerHTML='';} remove(){}
}
(async()=>{
 const ids=[...fs.readFileSync('youtube-analytics.html','utf8').matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
 const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));elements.ytRange.value='28';elements.ytSort.value='views';
 let config,stored=[],calls=[],denyDaily=false,revoke=false,grant=true;
 const context={window:{LDYouTubeCore:C},document:{getElementById:id=>elements[id],createElement:()=>new Element(),head:new Element()},location:{origin:'https://example.test'},localStorage:{getItem:()=>null,setItem:(...x)=>stored.push(x)},Option:function(t,v){this.text=t;this.value=v;},AbortController,URL,Date,Intl,setTimeout,clearTimeout,console};
 context.google={accounts:{oauth2:{initTokenClient:c=>(config=c,{requestAccessToken:()=>{}}),hasGrantedAllScopes:()=>grant,revoke:(_,cb)=>{revoke=true;cb({});}}}};context.window.google=context.google;
 context.fetch=async(url,options)=>{calls.push({url,options});const u=new URL(url);const resource=u.pathname.split('/').at(-1);let body;
  if(resource==='channels')body={items:[{id:'UC-test',snippet:{title:'Test channel'},statistics:{viewCount:'100',subscriberCount:'28'},contentDetails:{relatedPlaylists:{uploads:'UU-test'}}}]};
  else if(resource==='playlistItems')body={items:[{contentDetails:{videoId:'abcdefghijk'}}]};
  else if(resource==='videos')body={items:[{id:'abcdefghijk',snippet:{title:'<script>bad</script> Sea…',publishedAt:'2026-09-01T00:00:00Z'},statistics:{viewCount:'100',likeCount:'5'},status:{privacyStatus:'public'}}]};
  else if(u.searchParams.get('dimensions')==='day'){
   if(denyDaily)return {ok:false,status:403,json:async()=>({error:{message:'denied'}})};
   body={columnHeaders:[{name:'day'},{name:'views'}],rows:[['2026-09-19',100]]};
  }else body={columnHeaders:[{name:'video'},{name:'views'},{name:'likes'}],rows:[['abcdefghijk',80,4]]};
  return {ok:true,status:200,json:async()=>body};
 };
 vm.createContext(context);vm.runInContext(fs.readFileSync('youtube-analytics.js','utf8'),context);
 await elements.ytSave.events.click();assert.match(elements.ytStatus.textContent,/Client ID/);assert.equal(stored.length,0);
 elements.ytClientId.value='123-test.apps.googleusercontent.com';await elements.ytSave.events.click();assert.equal(stored.length,1);assert.equal(config.scope,C.scopes.join(' '));
 grant=false;await config.callback({access_token:'fixture-token',expires_in:3600});assert.match(elements.ytStatus.textContent,/Both read-only/);assert.equal(calls.length,0);
 grant=true;await config.callback({access_token:'fixture-token',expires_in:3600});assert.equal(elements.ytChannel.value,'UC-test');
 await elements.ytSync.events.click();assert.equal(elements.ytResults.hidden,false);assert.match(elements.ytStatus.textContent,/Sync complete/);assert.match(elements.ytVideos.innerHTML,/&lt;script&gt;/);assert(!elements.ytVideos.innerHTML.includes('<script>'));
 assert(calls.every(c=>c.options.headers.Authorization==='Bearer fixture-token'));assert(stored.every(x=>!JSON.stringify(x).includes('fixture-token')));
 denyDaily=true;await elements.ytSync.events.click();assert.match(elements.ytStatus.textContent,/Some analytics reports/);assert.match(elements.ytWeekdays.children[0].textContent,/Daily report unavailable/);
 elements.ytDisconnect.events.click();assert.equal(revoke,true);assert.equal(elements.ytResults.hidden,true);assert.equal(elements.ytVideos.innerHTML,'');assert.equal(elements.ytSync.disabled,true);
 console.log('PASS: missing setup, read-only scopes, partial consent, full mocked sync, escaped titles, token not persisted, partial report failure, disconnect and revocation');
})().catch(e=>{console.error(e);process.exit(1)});
