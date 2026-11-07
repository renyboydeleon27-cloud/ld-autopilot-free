import test from 'node:test';
import assert from 'node:assert/strict';
import {notifyProductionMilestones} from '../lib/ldb/production-milestones.mjs';
function fixture(){
 const map=new Map([['job',{id:'a'.repeat(64),status:'QUEUED',index:12,
 approvedSource:{sha256:'b'.repeat(64)},outputs:Array.from({length:12},(_,i)=>({scene:i===0?'HOOK':'P'+i,sha256:'c'.repeat(64),bytes:100}))}]]);
 const storage={get:async k=>structuredClone(map.get(k)),put:async(k,v)=>map.set(k,structuredClone(v)),setAlarm:async()=>{}};
 return {map,storage};
}
test('STOP during one milestone suppresses the next until resumed',async()=>{
 const {map,storage}=fixture(),sent=[];
 await notifyProductionMilestones({storage,notify:async(_s,p)=>{
 sent.push(p);map.get('job').stop=true;return {status:'SENT'};
 }});
 assert.deepEqual(sent,[30]);
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
