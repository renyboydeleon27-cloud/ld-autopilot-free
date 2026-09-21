const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const {recommend}=require('../title-recommendations');
for(const topic of ['Tsunami 2004','Cyclone Mahina — Queensland, Australia, 1899','Earthquake 1923','Tornado 1989','Flood 1931','Banqiao Dam Failure 1975','Landslide 1970','Avalanche 1970','Volcano 1883','Peshtigo Fire 1871','Locust Crisis 2020','Black Death 1347','Bhopal Gas Disaster 1984','Unknown Event 1500']){
 const options=recommend(topic);assert.equal(options.length,3,topic);
 assert.equal(options[0].label,'Recommended');for(const o of options){assert.ok(o.title.includes(topic));assert.ok(o.title.length<=100);assert.ok(!/deadliest|million|100-foot|how many died/i.test(o.title));}
}
assert.equal(recommend('').length,0);
assert.ok(recommend('Cyclone Mahina 1899')[0].title.includes('Sea Surged In'));
assert.ok(!recommend('Cyclone Unknown 1899')[0].title.includes('Sea Surged In'));
assert.equal(recommend('Locust Plague 1874')[0].family,'insect');
// Exercise actual app hydration/collection functions with two projects and a legacy backup.
const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
const build=app.match(/function buildProduction\(seed\)\{[^\n]+/)[0];
const collect=app.match(/function collectState\(\)\{[^\n]+/)[0];
const context={window:{dispatchEvent(){}},CustomEvent:function(){},topicEl:{value:''},formatEl:{value:'shorts'},stagesEl:{innerHTML:'',querySelectorAll(){return[]}},projectTitle:{textContent:''},modeText:{},stageCount:{},shortsStages:()=>[],longformStages:()=>[],updateJumpMenu(){},updateStats(){},saveCurrent(){},Date};
vm.createContext(context);vm.runInContext(build+'\n'+collect,context);
for(const [topic,title] of [['A','Custom title A'],['B','Custom title B'],['A','Custom title A']]){context.seed={topic,youtubeTitle:title,stages:{}};vm.runInContext('buildProduction(seed)',context);assert.equal(vm.runInContext('collectState().youtubeTitle',context),title);}
context.seed={topic:'Legacy',stages:{}};vm.runInContext('buildProduction(seed)',context);assert.equal(vm.runInContext('collectState().youtubeTitle',context),null);
console.log('PASS: families, claim guards, Mahina specificity, project switching and legacy hydration');
