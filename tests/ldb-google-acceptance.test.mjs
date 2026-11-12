import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {acceptance} from '../cloudflare/ldb-google-vault/acceptance.mjs';
class Storage{data=new Map();queue=Promise.resolve();async get(k){return structuredClone(this.data.get(k));}async put(k,v){this.data.set(k,structuredClone(v));}transaction(fn){const p=this.queue.then(()=>fn(this));this.queue=p.catch(()=>{});return p;}}
function server(uncertain=false){const files=new Map();let ids=0,sends=0;return {get sends(){return sends;},fetcher:async(url,o={})=>{
 assert.equal(o.redirect,'manual');
 if(url.includes('gmail.googleapis.com')){sends++;assert.equal(files.size,2);const raw=Buffer.from(JSON.parse(o.body).raw,'base64url').toString();assert.match(raw,/Google connection test/);if(uncertain)throw Error('timeout');return {ok:true,json:async()=>({id:'message1'})};}
 if(url.includes('generateIds'))return {ok:true,json:async()=>({ids:['id'+(++ids)]})};
 if(o.method==='POST'){let m,b;if(Buffer.isBuffer(o.body)){const text=o.body.toString();m=JSON.parse(text.match(/\r\n\r\n(\{.*?\})\r\n--/s)[1]);b=Buffer.from(text.split('\r\n\r\n')[2].split('\r\n--')[0]);}else m=JSON.parse(o.body);files.set(m.id,{...m,trashed:false,...(b?{size:String(b.length),md5Checksum:createHash('md5').update(b).digest('hex'),sha256Checksum:createHash('sha256').update(b).digest('hex')}:{})});return {ok:true};}
 const value=files.get(new URL(url).pathname.split('/').at(-1));return {ok:!!value,status:value?200:404,json:async()=>value};
}};}
for(const uncertain of [false,true])test('acceptance verifies Drive before email and never resends '+uncertain,async()=>{const s=new Storage(),api=server(uncertain),vault={accessToken:async()=>'private'};const first=await acceptance(s,vault,api.fetcher);assert.equal(first.driveVerified,true);assert.equal(first.gmailStatus,uncertain?'UNCERTAIN':'SENT');assert.equal(first.productionComplete,false);await acceptance(s,vault,api.fetcher);assert.equal(api.sends,1);});

test('malformed acceptance receipts block all provider and token access',async()=>{
 for(const bad of [false,0,'SENT',[],{}, {status:'SENT'}, {status:'SENT',id:'x'}, {status:'SENT',id:'message1',privateToken:'secret'}, {status:'UNKNOWN'}]){
  const s=new Storage();await s.put('acceptance:google-mail-v1',bad);
  await assert.rejects(acceptance(s,{accessToken:async()=>assert.fail('OAuth')},async()=>assert.fail('network')),/^Error: ACCEPTANCE_RECEIPT_INTEGRITY_FAILED$/);
  assert.deepEqual(await s.get('acceptance:google-mail-v1'),bad);
 }
});
test('acceptance stores only a digest and retains valid legacy sent receipts',async()=>{
 const s=new Storage(),api=server(),vault={accessToken:async()=>'private'};
 assert.equal((await acceptance(s,vault,api.fetcher)).gmailStatus,'SENT');
 const record=await s.get('acceptance:google-mail-v1');
 assert.match(record.messageIdSha256,/^[a-f0-9]{64}$/);assert.equal(record.id,undefined);
 await s.put('acceptance:google-mail-v1',{status:'SENT',id:'message1'});
 assert.equal((await acceptance(s,vault,api.fetcher)).gmailStatus,'SENT');assert.equal(api.sends,1);
});
test('ambiguous or malformed Gmail responses never claim success or automatically resend',async()=>{
 for(const response of [{ok:false,json:async()=>({id:'message1'})},{ok:true,json:async()=>({id:'x'})},{ok:true,json:async()=>({id:'secret\nvalue'})},{ok:true,json:async()=>{throw Error('private detail')}}]){
  const s=new Storage(),api=server();let sends=0;
  const fetcher=async(url,o)=>{if(url.includes('gmail.googleapis.com')){sends++;return response;}return api.fetcher(url,o);};
  const vault={accessToken:async()=>'private'};
  assert.equal((await acceptance(s,vault,fetcher)).gmailStatus,'UNCERTAIN');
  await acceptance(s,vault,fetcher);assert.equal(sends,1);
 }
});
test('deleted acceptance claim becomes a no-resend tombstone after provider success',async()=>{
 const s=new Storage(),api=server(),vault={accessToken:async()=>'private'};let sends=0;
 const fetcher=async(url,o)=>{if(url.includes('gmail.googleapis.com')){sends++;s.data.delete('acceptance:google-mail-v1');return {ok:true,json:async()=>({id:'message1'})};}return api.fetcher(url,o);};
 assert.equal((await acceptance(s,vault,fetcher)).gmailStatus,'UNCERTAIN');
 assert.deepEqual(await s.get('acceptance:google-mail-v1'),{status:'UNCERTAIN'});
 await acceptance(s,vault,fetcher);assert.equal(sends,1);
});
test('late response cannot overwrite replaced or corrupt acceptance claims',async()=>{
 for(const replacement of [{status:'CLAIMED',claimId:'a'.repeat(32)},{status:'UNCERTAIN'},{status:'SENT',id:'message2'},{status:'CORRUPT'}]){
  const s=new Storage(),api=server(),vault={accessToken:async()=>'private'};
  const fetcher=async(url,o)=>{if(url.includes('gmail.googleapis.com')){await s.put('acceptance:google-mail-v1',replacement);return {ok:true,json:async()=>({id:'message1'})};}return api.fetcher(url,o);};
  if(replacement.status==='CORRUPT')await assert.rejects(acceptance(s,vault,fetcher),/ACCEPTANCE_RECEIPT_INTEGRITY_FAILED/);
  else assert.equal((await acceptance(s,vault,fetcher)).gmailStatus,'UNCERTAIN');
  assert.deepEqual(await s.get('acceptance:google-mail-v1'),replacement);
 }
});
test('OAuth failure before mail claim can recover without duplicate send',async()=>{
 const s=new Storage(),api=server(),fetcher=api.fetcher;
 // First establish the persisted Drive verification, then remove only this simulated mail receipt.
 await acceptance(s,{accessToken:async()=>'private'},fetcher);s.data.delete('acceptance:google-mail-v1');
 const baseline=api.sends;
 const denied={accessToken:async()=>{throw Error('GOOGLE_RECONNECT_REQUIRED')}};
 await assert.rejects(acceptance(s,denied,fetcher),/GOOGLE_RECONNECT_REQUIRED/);
 assert.equal(await s.get('acceptance:google-mail-v1'),undefined);
 assert.equal(api.sends,baseline);
 assert.equal((await acceptance(s,{accessToken:async()=>'private'},fetcher)).gmailStatus,'SENT');
 assert.equal(api.sends,baseline+1);
});

test('concurrent acceptance requests share one durable mail claim',async()=>{
 const s=new Storage(),api=server(),vault={accessToken:async()=>'private'};
 await acceptance(s,vault,api.fetcher);s.data.delete('acceptance:google-mail-v1');
 const baseline=api.sends;
 const results=await Promise.all([acceptance(s,vault,api.fetcher),acceptance(s,vault,api.fetcher)]);
 assert.equal(api.sends,baseline+1);
 assert.ok(results.every(r=>['SENT','CLAIMED'].includes(r.gmailStatus)));
 assert.equal((await s.get('acceptance:google-mail-v1')).status,'SENT');
});
