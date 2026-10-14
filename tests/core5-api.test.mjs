import test from 'node:test';
import assert from 'node:assert/strict';
import Core5 from '../ner-core-5.js';
import handler from '../api/ai-t2v-audit.js';
const payload=()=>Core5.payload(Core5.plan({stage:'P14',topic:'Aberfan 1966',eventYear:1966,location:'Wales',narration:'Decades later, remembrance remained.'}));
function response(){return {code:200,body:null,setHeader(){},status(c){this.code=c;return this;},json(x){this.body=x;return this;},end(){}};}
test('server rejects mutated Core 5 prompt before provider fetch',async()=>{
 const old=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('Live requests prohibited');};
 try{const p=JSON.parse(JSON.stringify(payload()));p.currentPrompt+=' changed';const res=response();await handler({method:'POST',body:p},res);assert.equal(res.code,400);assert.match(res.body.error,/preflight/);assert.equal(calls,0);}finally{globalThis.fetch=old;}
});
test('server sends exact canonical prompt and scene chronology; no retry on incomplete audit',async()=>{
 const old=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='mock-test-key';const calls=[];
 globalThis.fetch=async(url,args)=>{assert.equal(url,'https://api.openai.com/v1/responses');calls.push(JSON.parse(args.body));return {ok:true,json:async()=>({status:'incomplete',output_text:'',usage:{}})};};
 try{const p=payload(),res=response();await handler({method:'POST',body:p},res);assert.equal(res.code,502);assert.equal(calls.length,1);const user=calls[0].input[1].content[0].text;assert(user.endsWith(p.currentPrompt));assert.match(user,/unspecified later period/);assert.match(res.body.error,/no automatic paid retry/);}finally{globalThis.fetch=old;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});

test('Core 5 provider policy audits semantic safeguards without demanding legacy boilerplate',async()=>{
 const old=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='mock-test-key';const calls=[];
 globalThis.fetch=async(url,args)=>{calls.push(JSON.parse(args.body));return {ok:true,json:async()=>({status:'incomplete',output_text:'',usage:{}})};};
 try{
  for(const stage of ['P1','ENDING']){
   const p=Core5.payload(Core5.plan({stage,topic:'Great Smog — London — 1952',eventYear:1952,location:'London',narration:'Families fed their coal fires.'}));
   await handler({method:'POST',body:p},response());
   const system=calls.at(-1).input[0].content[0].text;
   assert.match(system,/CORE 5 SEMANTIC AUDIT/);assert.match(system,/Still report concrete contradictions/);
   assert.doesNotMatch(system,/CINEMATIC REFINEMENT AUDIT:|AUDIO QUALITY CHECK:|Do not PASS a prompt that is missing the MASTER/);
   assert(calls.at(-1).input[1].content[0].text.endsWith(p.currentPrompt));
  }
  assert.equal(calls.length,2,'Core 5 never automatically retries');
  const legacy={...payload(),core5:false};await handler({method:'POST',body:legacy},response());
  assert.match(calls.at(-1).input[0].content[0].text,/CINEMATIC REFINEMENT AUDIT:/);
  assert.equal(calls.length,4,'legacy incomplete-response retry remains unchanged');
 }finally{globalThis.fetch=old;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});
