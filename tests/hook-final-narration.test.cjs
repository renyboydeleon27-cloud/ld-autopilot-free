const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('narration-smart-continue.js','utf8');
const body=source.slice(source.indexOf('  function hookIsSilent('),source.indexOf('  function detectSeconds('));
const hookIsSilent=new Function(body+';return hookIsSilent;')();
const {parse}=require('../narration-import.js');
const panels=Array.from({length:14},(_,i)=>'P'+(i+1)+': Panel '+(i+1)+'.').join('\n');
for(const prompt of ['NO VO','NO VOICE-OVER','SILENT HOOK'])test(prompt+' affects clip audio only',()=>{
 const card={dataset:{textVideoPrompt:prompt},querySelector:()=>({value:prompt,textContent:prompt})};
 assert.equal(hookIsSilent(card),false);
 assert.equal(parse('HOOK: Narrated reveal.\n'+panels,{silentHook:hookIsSilent(card)}).HOOK,'Narrated reveal.');
});
test('final narration requires a HOOK even with silent clip directions',()=>{
 assert.throws(()=>parse(panels,{silentHook:hookIsSilent()}),/requires HOOK narration/);
});
