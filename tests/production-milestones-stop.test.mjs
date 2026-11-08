import test from 'node:test';
import assert from 'node:assert/strict';
import {notifyProductionMilestones} from '../lib/ldb/production-milestones.mjs';
const ID='a'.repeat(64);
function fixture(){
 const map=new Map([['job',{id:ID,status:'QUEUED',index:12,
 approvedSource:{sha256:'b'.repeat(64)},outputs:Array.from({length:12},(_,i)=>({scene:i===0?'HOOK':'P'+i,sha256:'c'.repeat(64),bytes:100}))}]]);
 let queue=Promise.resolve();
 const alarms=[];
 const tx={
  get:async k=>structuredClone(map.get(k)),
  put:async(k,v)=>map.set(k,structuredClone(v)),
  setAlarm:async n=>{alarms.push(n);}
 };
 const storage={...tx,transaction:fn=>{
  const result=queue.then(()=>fn(tx));
  queue=result.catch(()=>{});
  return result;
 }};
 return {map,storage,alarms};
}
const receipt=(map,p)=>map.get('milestone-result:'+ID+':'+p);
test('STOP during one milestone suppresses the next until resumed',async()=>{
 const {map,storage}=fixture(),sent=[];
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{
  sent.push(p);map.get('job').stop=true;return {status:'SENT'};
 }});
 assert.deepEqual(sent,[30]);
 assert.equal(receipt(map,30).status,'SENT');
 map.get('job').stop=false;
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{sent.push(p);return {status:'SENT'};}});
 assert.deepEqual(sent,[30,50]);
});
test('review failure during one milestone blocks later notifications',async()=>{
 const {map,storage}=fixture(),sent=[];
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{
  sent.push(p);map.get('job').status='NEEDS_REVIEW';return {status:'SENT'};
 }});
 assert.deepEqual(sent,[30]);
});
test('two overlapping alarms reserve one attempt for each milestone',async()=>{
 const {map,storage}=fixture(),sent=[];
 let releaseFirst,firstStarted;
 const firstStartedPromise=new Promise(resolve=>{firstStarted=resolve;});
 const firstHeld=new Promise(resolve=>{releaseFirst=resolve;});
 const notify=async(_s,p)=>{
  sent.push(p);
  if(p===30){firstStarted();await firstHeld;}
  return {status:'SENT'};
 };
 const first=notifyProductionMilestones({storage,notify});
 await firstStartedPromise;
 await notifyProductionMilestones({storage,notify});
 assert.deepEqual(sent,[30],'second runner cannot start a duplicate or send 50 out of order');
 assert.equal(receipt(map,30).status,'CLAIMED');
 releaseFirst();
 await first;
 assert.deepEqual(sent,[30,50]);
 assert.equal(receipt(map,30).status,'SENT');
 assert.equal(receipt(map,50).status,'SENT');
 await notifyProductionMilestones({storage,notify});
 assert.deepEqual(sent,[30,50],'restart cannot resend claimed milestones');
});
test('interrupted CLAIMED record fails closed and blocks following milestones',async()=>{
 const {map,storage}=fixture(),sent=[];
 map.set('milestone-result:'+ID+':30',{status:'CLAIMED',attempts:1});
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{sent.push(p);return {status:'SENT'};}});
 assert.deepEqual(sent,[]);
 assert.equal(receipt(map,30).status,'CLAIMED');
});
test('STOP between reservation and network call releases unsent claim safely',async()=>{
 const {map,storage}=fixture(),sent=[];
 const transaction=storage.transaction;
 let stopInjected=false;
 storage.transaction=async fn=>{
  const result=await transaction(fn);
  if(result?.status==='SEND'&&!stopInjected){
   stopInjected=true;
   map.get('job').stop=true;
  }
  return result;
 };
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{sent.push(p);return {status:'SENT'};}});
 assert.deepEqual(sent,[]);
 assert.deepEqual(receipt(map,30),{status:'RETRY_WAIT',attempts:0});
 map.get('job').stop=false;
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{sent.push(p);return {status:'SENT'};}});
 assert.deepEqual(sent,[30,50]);
});
test('ambiguous Runner-to-Vault transport fails closed without an automatic resend',async()=>{
 const {map,storage,alarms}=fixture(),sent=[];
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{
  sent.push(p);throw Error('network lost after Gmail accepted message');
 },now:()=>123});
 assert.deepEqual(sent,[30]);
 assert.deepEqual(receipt(map,30),{status:'UNCERTAIN',attempts:1});
 assert.deepEqual(alarms,[],'no retry alarm after ambiguous provider call');
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{sent.push(p);return {status:'SENT'};}});
 assert.deepEqual(sent,[30,50],'30 cannot be sent twice; later milestone can proceed');
 assert.equal(receipt(map,30).status,'UNCERTAIN','not falsely SENT');
});
test('uncertain Vault send is not retried and is not reported as sent',async()=>{
 const {map,storage}=fixture(),sent=[];
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{sent.push(p);return {status:p===30?'UNCERTAIN':'SENT'};}});
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{sent.push(p);return {status:'SENT'};}});
 assert.deepEqual(sent,[30,50]);
 assert.equal(receipt(map,30).status,'UNCERTAIN');
});
test('no transactional storage refuses to send',async()=>{
 const {storage}=fixture();
 delete storage.transaction;
 await assert.rejects(notifyProductionMilestones({storage,notify:async()=>assert.fail('must not send')}),/DURABLE_MILESTONE_STORAGE_REQUIRED/);
});

test('legacy RETRY_WAIT with prior network attempt is quarantined without notification',async()=>{
 for(const attempts of [1,2,3]){
  const {map,storage,alarms}=fixture(),sent=[];
  map.set('milestone-result:'+ID+':30',{status:'RETRY_WAIT',attempts});
  await notifyProductionMilestones({storage,notify:async(_state,p)=>{
   sent.push(p);return {status:'SENT'};
  }});
  assert.deepEqual(sent,[],'ambiguous legacy attempt must not be repeated');
  assert.deepEqual(receipt(map,30),{status:'UNCERTAIN',attempts});
  assert.deepEqual(alarms,[]);
  await notifyProductionMilestones({storage,notify:async(_s,p)=>{
   sent.push(p);return {status:'SENT'};
  }});
  assert.deepEqual(sent,[50],'only a distinct later milestone may send');
 }
});
test('legacy STOP-before-network attempt zero can safely resume a single send',async()=>{
 const {map,storage}=fixture(),calls=[];
 map.set('milestone-result:'+ID+':30',{status:'RETRY_WAIT',attempts:0});
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{
  calls.push(p);return {status:'SENT'};
 }});
 assert.deepEqual(calls,[30,50]);
 assert.deepEqual(receipt(map,30),{status:'SENT',attempts:1});
});
test('invalid bridge reply never creates false SENT or a resend alarm',async()=>{
 const {map,storage,alarms}=fixture();let attempts=0;
 await notifyProductionMilestones({storage,notify:async()=>{
  attempts++;return {status:'NO_ACK'};
 }});
 assert.equal(attempts,1);
 assert.deepEqual(receipt(map,30),{status:'UNCERTAIN',attempts:1});
 assert.deepEqual(alarms,[]);
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{
  if(p===30)assert.fail('unsafe automatic retry');
  return {status:'SENT'};
 }});
 assert.equal(attempts,1);
});
