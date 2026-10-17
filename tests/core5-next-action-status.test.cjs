const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const editor=fs.readFileSync(path.join(__dirname,'../ner-core-5-editor.js'),'utf8');
test('Core 5 review shows one-glance next action labels',()=>{
 for(const text of [
  '✅ READY FOR SMART CONTINUE',
  '⚠️ ARCHIVE OLD ',
  '♻️ RECOVER SAVED AUDIT · FREE FIRST',
  '⏳ AUDIT IN PROGRESS — DO NOT TAP SMART CONTINUE',
  '⛔ STORAGE CONFLICT — DO NOT SMART CONTINUE',
  '⛔ STATUS CHECK FAILED — DO NOT SMART CONTINUE',
  '⛔ FIX / REVIEW FIRST — DO NOT SMART CONTINUE'
 ])assert(editor.includes(text),text);
 assert(editor.includes("showNextAction(nextActionFor(d,j),j?.stage||d.panel)"));
 assert(editor.includes("if(j?.recoverable)return 'recover'"));
 assert(editor.includes("j.identityMatch===false"));
});
