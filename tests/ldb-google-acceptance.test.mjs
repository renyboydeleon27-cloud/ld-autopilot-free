import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {acceptance} from '../cloudflare/ldb-google-vault/acceptance.mjs';
class Storage{data=new Map();async get(k){return this.data.get(k);}async put(k,v){this.data.set(k,v);}async transaction(fn){return fn(this);}}
function server(uncertain=false){const files=new Map();let ids=0,sends=0;return {get sends(){return sends;},fetcher:async(url,o={})=>{
 assert.equal(o.redirect,'manual');
 if(url.includes('gmail.googleapis.com')){sends++;assert.equal(files.size,2);const raw=Buffer.from(JSON.parse(o.body).raw,'base64url').toString();assert.match(raw,/Google connection test/);if(uncertain)throw Error('timeout');return {ok:true,json:async()=>({id:'message1'})};}
 if(url.includes('generateIds'))return {ok:true,json:async()=>({ids:['id'+(++ids)]})};
 if(o.method==='POST'){let m,b;if(Buffer.isBuffer(o.body)){const text=o.body.toString();m=JSON.parse(text.match(/\r\n\r\n(\{.*?\})\r\n--/s)[1]);b=Buffer.from(text.split('\r\n\r\n')[2].split('\r\n--')[0]);}else m=JSON.parse(o.body);files.set(m.id,{...m,trashed:false,...(b?{size:String(b.length),md5Checksum:createHash('md5').update(b).digest('hex'),sha256Checksum:createHash('sha256').update(b).digest('hex')}:{})});return {ok:true};}
 const value=files.get(new URL(url).pathname.split('/').at(-1));return {ok:!!value,status:value?200:404,json:async()=>value};
}};}
for(const uncertain of [false,true])test('acceptance verifies Drive before email and never resends '+uncertain,async()=>{const s=new Storage(),api=server(uncertain),vault={accessToken:async()=>'private'};const first=await acceptance(s,vault,api.fetcher);assert.equal(first.driveVerified,true);assert.equal(first.gmailStatus,uncertain?'UNCERTAIN':'SENT');assert.equal(first.productionComplete,false);await acceptance(s,vault,api.fetcher);assert.equal(api.sends,1);});
