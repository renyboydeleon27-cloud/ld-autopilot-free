import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DriveDelivery,GmailMilestones,eligibleMilestones} from '../lib/ldb/google-delivery.mjs';
class Storage {data=new Map();queue=Promise.resolve();async get(k){return structuredClone(this.data.get(k));}async put(k,v){this.data.set(k,structuredClone(v));}transaction(fn){const next=this.queue.then(()=>fn(this));this.queue=next.catch(()=>{});return next;}}
const hash=(b,a='sha256')=>createHash(a).update(b).digest('hex');
const bytes=Buffer.from('actual deliverable bytes');
const asset={key:'a'.repeat(64),name:'HOOK.txt',parentId:'folder1',mimeType:'text/plain',bytes};
function driveServer({ambiguous=false,missing=false,corrupt=false,omitSha=false,mediaBytes=bytes,mediaUnavailable=false}={}){
 const files=new Map(),calls=[];let generated=0;
 const fetcher=async(url,options={})=>{calls.push({url,method:options.method||'GET'});
  if(url.includes('/generateIds?'))return {ok:true,json:async()=>({ids:['generated'+(++generated)]})};
  if(url.includes('?alt=media')){
   if(mediaUnavailable)return {ok:false,status:503};
   return {ok:true,status:200,arrayBuffer:async()=>Uint8Array.from(mediaBytes).buffer};
  }
  if(options.method==='POST'){
   const body=options.body.toString(),metadata=JSON.parse(body.match(/\r\n\r\n(\{.*?\})\r\n--/s)?.[1]||body);
   if(!missing)files.set(metadata.id,{...metadata,trashed:false,size:String(bytes.length),md5Checksum:hash(bytes,'md5'),...(!omitSha?{sha256Checksum:corrupt?'0'.repeat(64):hash(bytes)}:{})});
   if(ambiguous)throw Error('timeout SECRET');return {ok:true,status:200};
  }
  const id=new URL(url).pathname.split('/').at(-1),value=files.get(id);
  return {ok:!!value,status:value?200:404,json:async()=>value};
 };return {files,calls,fetcher};
}
const makeDrive=(s,server)=>new DriveDelivery(s,{tokenProvider:async()=>'private-token',fetcher:server.fetcher});
test('Drive uploads once, verifies both checksums, restart reuses saved ID',async()=>{
 const s=new Storage(),server=driveServer();const first=await makeDrive(s,server).put(asset),second=await makeDrive(s,server).put(asset);
 assert.deepEqual(first,second);assert.equal(server.files.size,1);assert.equal(server.calls.filter(x=>x.method==='POST').length,1);assert.equal(server.calls.filter(x=>x.url.includes('generateIds')).length,1);assert.doesNotMatch(JSON.stringify([...s.data]),/private-token/);
});
test('missing SHA-256 metadata triggers actual-byte verification and reuses the file ID',async()=>{
 const s=new Storage(),server=driveServer({omitSha:true});
 const first=await makeDrive(s,server).put(asset);
 assert.equal(first.status,'VERIFIED');
 assert.equal(server.calls.filter(x=>x.url.includes('?alt=media')).length,1);
 const second=await makeDrive(s,server).put(asset);
 assert.equal(second.id,first.id);
 assert.equal(server.files.size,1);
 assert.equal(server.calls.filter(x=>x.method==='POST').length,1);
 assert.equal(server.calls.filter(x=>x.url.includes('?alt=media')).length,2);
});
test('missing SHA-256 and wrong downloaded bytes block verification',async()=>{
 const bad=Buffer.from(bytes);bad[0]^=1;
 const s=new Storage(),server=driveServer({omitSha:true,mediaBytes:bad});
 await assert.rejects(makeDrive(s,server).put(asset),/DRIVE_CONTENT_MISMATCH/);
 assert.notEqual((await s.get('drive:'+asset.key)).status,'VERIFIED');
});
test('missing SHA-256 and unavailable media block verification',async()=>{
 const s=new Storage(),server=driveServer({omitSha:true,mediaUnavailable:true});
 await assert.rejects(makeDrive(s,server).put(asset),/DRIVE_VERIFY_UNAVAILABLE/);
 assert.notEqual((await s.get('drive:'+asset.key)).status,'VERIFIED');
});
test('missing SHA-256 and oversized media block verification',async()=>{
 const s=new Storage(),server=driveServer({omitSha:true,mediaBytes:Buffer.concat([bytes,Buffer.from('extra')])});
 await assert.rejects(makeDrive(s,server).put(asset),/DRIVE_CONTENT_MISMATCH/);
 assert.notEqual((await s.get('drive:'+asset.key)).status,'VERIFIED');
});
test('ambiguous successful upload is reconciled without duplicate creation',async()=>{
 const s=new Storage(),server=driveServer({ambiguous:true});const result=await makeDrive(s,server).put(asset);assert.equal(result.status,'VERIFIED');assert.equal(server.files.size,1);
});
test('missing uploads exhaust three attempts using one ID, no overwrite or delete',async()=>{
 const s=new Storage(),server=driveServer({missing:true});for(let i=0;i<3;i++)await assert.rejects(makeDrive(s,server).put(asset),/UPLOAD_UNCONFIRMED/);await assert.rejects(makeDrive(s,server).put(asset),/RETRY_LIMIT/);
 assert.equal(server.calls.filter(x=>x.method==='POST').length,3);assert.equal(server.calls.filter(x=>x.url.includes('generateIds')).length,1);assert.ok(server.calls.every(x=>['GET','POST'].includes(x.method)));
});
test('wrong checksum never completes, changed asset cannot reuse reservation',async()=>{
 const s=new Storage(),server=driveServer({corrupt:true});await assert.rejects(makeDrive(s,server).put(asset),/CONTENT_MISMATCH/);await assert.rejects(makeDrive(s,server).put({...asset,bytes:Buffer.from('different')}),/ASSET_CHANGED/);assert.notEqual((await s.get('drive:'+asset.key)).status,'VERIFIED');
});
test('concurrent reservations persist one file ID',async()=>{
 const s=new Storage(),server=driveServer();const result=await Promise.all([makeDrive(s,server).put(asset),makeDrive(s,server).put(asset)]);assert.equal(result[0].id,result[1].id);assert.equal(server.files.size,1);
});
test('folders are created with stable IDs and verified metadata',async()=>{
 const s=new Storage(),server=driveServer();const result=await makeDrive(s,server).put({key:'b'.repeat(64),name:'Living Disaster Book',mimeType:'application/vnd.google-apps.folder'});assert.equal(result.status,'VERIFIED');assert.equal(server.files.get(result.id).mimeType,'application/vnd.google-apps.folder');
});
const scenes=['HOOK',...Array.from({length:14},(_,i)=>`P${i+1}`),'ENDING','THUMBNAIL'];
function state(count=17){return {jobId:'f'.repeat(64),approvalVerified:true,images:scenes.slice(0,count).map(scene=>({scene,bytes:900,sha256:'c'.repeat(64),visualAudit:'PASS'})),imagePromptCount:17,flowCount:16,narrationCount:16,expectedDeliverables:Array.from({length:69},(_,i)=>({key:hash(String(i)),sha256:'d'.repeat(64)})),driveVerified:Array.from({length:69},(_,i)=>({key:hash(String(i)),sha256:'d'.repeat(64),id:'drive'+i,status:'VERIFIED'}))};}
test('milestones require actual image counts, complete QA, texts and every verified file',()=>{
 assert.deepEqual(eligibleMilestones(state(5)),[]);assert.deepEqual(eligibleMilestones(state(6)),[30]);assert.deepEqual(eligibleMilestones(state(12)),[30,50]);assert.deepEqual(eligibleMilestones(state()),[30,50,70,100]);
 const partial=state();partial.driveVerified.pop();assert.deepEqual(eligibleMilestones(partial),[30,50,70]);
 const rejected=state();rejected.images[0].visualAudit='PENDING';assert.deepEqual(eligibleMilestones(rejected),[30,50]);
 const duplicate=state();duplicate.images.push({...duplicate.images[0],visualAudit:'PENDING'});assert.ok(!eligibleMilestones(duplicate).includes(70));
 const stopped=state();stopped.stopped=true;assert.deepEqual(eligibleMilestones(stopped),[]);
 const hashMismatch=state();hashMismatch.driveVerified[0].sha256='e'.repeat(64);assert.ok(!eligibleMilestones(hashMismatch).includes(100));
});
test('Gmail sends fixed sender/recipient and durable claim prevents repeated sends',async()=>{
 const s=new Storage();let calls=0;const opts={tokenProvider:async()=>'secret',loadState:async()=>state(),fetcher:async(url,options)=>{calls++;const raw=Buffer.from(JSON.parse(options.body).raw,'base64url').toString();assert.match(raw,/From: renyboydeleon27@gmail.com/);assert.match(raw,/To: dkael1250@gmail.com/);return {ok:true,json:async()=>({id:'gmail123'})};}};
 assert.equal((await new GmailMilestones(s,opts).send(100)).status,'SENT');assert.equal((await new GmailMilestones(s,opts).send(100)).status,'SENT');assert.equal(calls,1);
});
test('ambiguous Gmail result and interrupted claims never auto-resend',async()=>{
 const s=new Storage();let calls=0;const opts={tokenProvider:async()=>'secret',loadState:async()=>state(),fetcher:async()=>{calls++;throw Error('SECRET');}};
 assert.equal((await new GmailMilestones(s,opts).send(70)).status,'UNCERTAIN');await new GmailMilestones(s,opts).send(70);assert.equal(calls,1);
 await s.put('gmail:'+'f'.repeat(64)+':100',{status:'CLAIMED'});assert.equal((await new GmailMilestones(s,opts).send(100)).status,'CLAIMED');assert.equal(calls,1);
});
test('unearned milestones do not access tokens or send',async()=>{const s=new Storage();const g=new GmailMilestones(s,{loadState:async()=>state(0),tokenProvider:async()=>assert.fail('token must not be requested')});await assert.rejects(g.send(100),/NOT_REACHED/);assert.equal(s.data.size,0);});


test('100 percent rejects 68 files, extra records, duplicate IDs and invalid identities',()=>{
 const mutations=[
  s=>{s.expectedDeliverables.pop();s.driveVerified.pop();},
  s=>s.driveVerified.push({...s.driveVerified[0]}),
  s=>{s.driveVerified[1].id=s.driveVerified[0].id;},
  s=>{s.driveVerified[1]={...s.driveVerified[0]};},
  s=>{s.expectedDeliverables[1]={...s.expectedDeliverables[0]};},
  s=>{s.expectedDeliverables[0].key='invalid';s.driveVerified[0].key='invalid';},
  s=>{delete s.driveVerified[0].id;},
  s=>{s.driveVerified[0].status='UPLOADING';},
  s=>{s.driveVerified[0]=null;},
  s=>{s.expectedDeliverables[0]=null;},
  s=>{s.driveVerified={};}
 ];
 for(const mutate of mutations){const snapshot=state();mutate(snapshot);assert.deepEqual(eligibleMilestones(snapshot),[30,50,70]);}
 const reordered=state();reordered.driveVerified.reverse();assert.ok(eligibleMilestones(reordered).includes(100));
});
test('68-file package never requests Gmail token or submits completion email',async()=>{
 const snapshot=state();snapshot.expectedDeliverables.pop();snapshot.driveVerified.pop();
 const g=new GmailMilestones(new Storage(),{loadState:async()=>snapshot,tokenProvider:async()=>assert.fail('no token'),fetcher:async()=>assert.fail('no send')});
 await assert.rejects(g.send(100),/MILESTONE_NOT_REACHED/);
});


test('corrupt Drive reservation never requests OAuth token or accesses provider',async()=>{
 const cases=[
  r=>{r.id='../other-file';},
  r=>{r.id='';},
  r=>{r.attempts=-1;},
  r=>{r.attempts=4;},
  r=>{r.attempts='2';},
  r=>{r.status='DELETED';},
  r=>{r.name='P1.txt';},
  r=>{r.parentId='wrong-folder';},
  r=>{r.sha256='0'.repeat(64);},
  r=>{r.md5='0'.repeat(32);},
  r=>{r.bytes=999;},
  r=>{r.mimeType='application/json';},
  r=>{delete r.key;},
  r=>{r.unreviewedPrivateToken='NEVER_EXPORT';}
 ];
 for(const mutate of cases){
  const store=new Storage(),provider=driveServer();
  await makeDrive(store,provider).put(asset);
  mutate(store.data.get('drive:'+asset.key));
  let tokenCalls=0,remoteCalls=0;
  const drive=new DriveDelivery(store,{
   tokenProvider:async()=>{tokenCalls++;return 'must-not-be-requested'},
   fetcher:async()=>{remoteCalls++;throw Error('PROVIDER_MUST_NOT_BE_CALLED')}
  });
  await assert.rejects(drive.put(asset),/DRIVE_RESERVATION_INTEGRITY_FAILED/);
  assert.equal(tokenCalls,0,'invalid reservation must be rejected before token');
  assert.equal(remoteCalls,0,'invalid reservation must be rejected before provider');
 }
});
test('changed asset cannot reuse reserved file ID or request OAuth token',async()=>{
 const store=new Storage(),provider=driveServer();
 await makeDrive(store,provider).put(asset);
 let tokens=0,calls=0;
 const drive=new DriveDelivery(store,{
  tokenProvider:async()=>{tokens++;return 'must-not-use'},
  fetcher:async()=>{calls++;throw Error('NO_NETWORK')}
 });
 await assert.rejects(drive.put({...asset,bytes:Buffer.from('altered')}),
  /DELIVERY_ASSET_CHANGED/);
 assert.equal(tokens,0);
 assert.equal(calls,0);
});
test('third-attempt upload already present on Drive can reconcile after restart without recreating',async()=>{
 const store=new Storage(),provider=driveServer();
 const first=await makeDrive(store,provider).put(asset);
 const record=store.data.get('drive:'+asset.key);
 record.status='UPLOADING';
 record.attempts=3;
 const created=provider.calls.filter(c=>c.method==='POST').length;
 const reconciled=await makeDrive(store,provider).put(asset);
 assert.equal(reconciled.id,first.id);
 assert.equal(store.data.get('drive:'+asset.key).status,'VERIFIED');
 assert.equal(provider.calls.filter(c=>c.method==='POST').length,created);
});
