'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const focusSource=fs.readFileSync(path.join(root,'ner-auto-focus.js'),'utf8');
const smartSource=fs.readFileSync(path.join(root,'smart-continue.js'),'utf8');

function focusHarness(initial='off'){
  const stored=new Map([['ner-studio-auto-focus-v1',initial]]);
  const events=[];
  const context={
    module:{exports:{}},
    localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},
    document:{getElementById:()=>null},
    CustomEvent:class CustomEvent{constructor(type,options){this.type=type;this.detail=options.detail;}},
    dispatchEvent:event=>events.push(event),
  };
  vm.runInNewContext(focusSource,context,{filename:'ner-auto-focus.js'});
  return {api:context.module.exports,stored,events};
}
test('OFF blocks all requests through the NER auto-focus scroll API',()=>{
  const {api}=focusHarness();
  let moves=0;
  const target={scrollIntoView:()=>moves++};
  assert.equal(api.enabled(),false);
  assert.equal(api.scrollTo(target,{behavior:'smooth'}),false);
  assert.equal(moves,0);
});
test('switching ON then OFF persists OFF and cancels stale restore listeners',()=>{
  const {api,stored,events}=focusHarness();
  let moves=0;
  const target={scrollIntoView:()=>moves++};
  api.setEnabled(true);
  assert.equal(api.scrollTo(target,{}),true);
  api.setEnabled(false);
  assert.equal(api.scrollTo(target,{}),false);
  assert.equal(moves,1);
  assert.equal(stored.get(api.KEY),'off');
  assert.equal(events.at(-1).type,'ner:auto-focus-changed');
  assert.equal(events.at(-1).detail.enabled,false);
});
test('passive session restoration does not change open panels while OFF',()=>{
  const begin=smartSource.indexOf('function restoreSmartSession(){');
  const end=smartSource.indexOf('let lastHiddenAt=0;',begin);
  assert.ok(begin>=0&&end>begin);
  const body=smartSource.slice(begin,end);
  assert.doesNotMatch(body,/\bsetOpen\(/);
  assert.match(body,/restoreOpenIfMagneticEnabled\(card\)/);
  assert.match(body,/restoreOpenIfMagneticEnabled\(persistedReady\)/);
  assert.match(body,/restoreOpenIfMagneticEnabled\(target\)/);
  assert.match(smartSource,/if\(!active&&!magneticEnabled\)return;/);
});
test('queued focus restore re-checks OFF before re-layout',()=>{
  assert.match(smartSource,/viewportRestoreTimer=setTimeout\(\(\)=>\{\s*viewportRestoreTimer=null;\s*if\(!window.NERAutoFocus\?\.enabled\(\)\)return;/);
  assert.match(smartSource,/addEventListener\('ner:auto-focus-changed'/);
});
