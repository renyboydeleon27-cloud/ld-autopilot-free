/* Offline preservation checks against main. Run after git fetch origin main. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
const vm = require('node:vm');
const current = require('../ner-core-5.js');
const baselineSource = cp.execFileSync('git', ['show', 'origin/main:ner-core-5.js'], {encoding:'utf8'});
const context = {module:{exports:{}},exports:{}};
vm.runInNewContext(baselineSource, context, {filename:'baseline-core5.js'});
const baseline = context.module.exports;
assert.equal(current.VERSION, baseline.VERSION, 'compiler version unchanged');
const examples = [
 {topic:'Aberfan Disaster — Wales — 1966',eventYear:1966,location:'Aberfan, Wales',stage:'P2',narration:'Coal waste lay above the village while residents went about their day.'},
 {topic:'Halabja Chemical Attack — Iraq — 1988',eventYear:1988,location:'Halabja, Iraq',stage:'P10',narration:'Survivors sought help after the chemical attack.'},
 {topic:'Wellington Avalanche — Washington — 1910',eventYear:1910,location:'Wellington, Washington, USA',stage:'P4',narration:'Snow gathered high above the mountain rail line.'}
];
for(const input of examples){
 const args={...input,facts:[]};
 const old=baseline.plan(args),next=current.plan(args);
 assert.equal(current.stable(next), baseline.stable(old), input.topic+' StageSpec unchanged');
 assert.equal(current.compile(next), baseline.compile(old), input.topic+' compiled prompt unchanged');
 assert.equal(current.validate(next).ok, true, input.topic+' preflight');
 assert.equal(current.validatePayload(current.payload(next)).ok,true,input.topic+' payload integrity');
}
const p2={topic:'The Great Smog of London — 1952',eventYear:1952,location:'London, England',stage:'P2',facts:[],narration:'Across the city, household chimneys, factories, and power stations poured smoke into the air. Heating London came with a dangerous cost.'};
const oldP2=baseline.plan(p2),newP2=current.plan(p2);
assert.notEqual(current.compile(newP2),baseline.compile(oldP2),'P2 must improve');
assert.equal(current.validate(newP2).ok,true,'P2 valid');
console.log('Core 5 cross-family baseline preservation passed (generated specs/prompts; not user saved projects)');
