const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),base=require('../ner-core-5.js');

(async()=>{
 const listeners=new Map();
 function eventTarget(){return {addEventListener(type,fn){const a=listeners.get(type)||[];a.push(fn);listeners.set(type,a);},removeEventListener(){}};}
 const windowObj=Object.assign(eventTarget(),{
  NERProjectStorage:{initialize:async()=>{},mount(){}},
  LDCore:{saveCurrent(){return true;}}
 });
 const original={
  src:'ner-core-5.js?v=5.1.9',attributes:[{name:'src',value:'ner-core-5.js?v=5.1.9'}],
  getAttribute(name){return name==='src'?'ner-core-5.js?v=5.1.9':null;},
  replaceWith(script){windowObj.NERCore5=base;queueMicrotask(()=>script.onload?.());}
 };
 const documentObj=Object.assign(eventTarget(),{
  querySelector(sel){if(sel==='main')return null;return null;},
  querySelectorAll(sel){return sel==='script[type="application/x-ner-module"]'?[original]:[];},
  createElement(){return {attributes:[],setAttribute(name,value){this[name]=value;}};},
  getElementById(){return null;},body:{prepend(){}}
 });
 const context={window:windowObj,document:documentObj,console,queueMicrotask,setTimeout,clearTimeout,Event:class{constructor(type){this.type=type;}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'ner-app-bootstrap.js'),'utf8'),context,{filename:'ner-app-bootstrap.js'});
 await new Promise(r=>setTimeout(r,10));
 const C=windowObj.NERCore5;assert.equal(C.crossTopicGuardVersion,'1.0.0');
 const topic='Great Kantō Earthquake — Tokyo and Yokohama, Japan — 1923';
 const narration='On September 1, 1923, a magnitude 7.9 earthquake struck southern Kantō, violently shaking Japan’s capital and the nearby port city of Yokohama.';
 const stale=base.plan({topic:'Xylazine Crisis — Philadelphia — 2020',stage:'P1',narration:'An outbreak changed daily life.',eventYear:2020,location:'Philadelphia, USA',facts:[]});
 const spec=C.plan({topic,stage:'P1',narration,eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:stale});
 assert.equal(spec.topic,topic);assert.equal(spec.family,'earthquake');assert.equal(spec.eventYear,1923);assert.equal(spec.location.region,'Tokyo and Yokohama, Japan');
 assert.match(spec.location.setting,/1923 urban interior/i);assert.match(spec.action.description,/braces one hand against the low table/i);
 assert(!/supported (?:warning|hazard|contextual feature)|narrated (?:cause|onset|warning|non-graphic impact)/i.test(spec.location.setting+' '+spec.action.description));
 assert.deepEqual(base.validate(spec),{ok:true,issues:[]});
 const meta=C.metadata(topic,{year:'1952',location:'London, England'});assert.equal(meta.year,'1923');assert.equal(meta.location,'Tokyo and Yokohama, Japan');
 const p7=C.plan({topic,stage:'P7',narration:'The disaster reached beyond the burning cities. Tsunami waves struck parts of the Sagami Bay coast, adding destruction along the shoreline.',eventYear:1923,location:'Tokyo and Yokohama, Japan',facts:[],spec:null});
 assert.equal(p7.family,'earthquake');assert.match(p7.location.setting,/coastal road/i);assert.equal(base.validate(p7).ok,true);
 console.log('PASS: stale public-health StageSpec cannot override current earthquake identity; Great Kanto scenes are concrete and local-only; zero network/API calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});