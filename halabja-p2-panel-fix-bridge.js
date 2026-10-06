/* NER Studio — Halabja P2 local panel-fix bridge v1.0
   Prevents paid AI panel-fix from replacing the locked Halabja P2 scene with
   an unusable generic scene. Only intercepts /api/ai-panel-fix for Halabja P2. */
(function(){'use strict';
if(window.__halabjaP2PanelFixBridgeV10)return;

var TOPIC_RE=/^halabja chemical attack\s*[—–-]\s*iraq\s*[—–-]\s*1988$/i;
var nativeFetch=window.fetch.bind(window);

function topic(){
  var typed=document.getElementById('topic')?.value?.trim();
  if(typed)return typed;
  var title=document.getElementById('projectTitle')?.textContent?.trim();
  return title&&title!=='No production yet'?title:'';
}
function currentScene(){
  return String(window.LDHalabjaP2Hotfix?.scene||'').trim();
}
function shouldIntercept(input,init){
  var url='';
  try{url=typeof input==='string'?input:(input&&input.url)||'';}catch(e){}
  if(!/\/api\/ai-panel-fix(?:\?|$)/.test(url))return false;
  if(!TOPIC_RE.test(topic()))return false;
  var payload=null;
  try{payload=JSON.parse(String(init?.body||''));}catch(e){return false;}
  return payload?.stage==='P2'&&TOPIC_RE.test(String(payload?.topic||topic()));
}
function localResponse(){
  try{window.LDHalabjaP2Hotfix?.repair?.(false);}catch(e){}
  var scene=currentScene();
  if(!scene)return null;
  var body={
    ok:true,
    scene:scene,
    source:'halabja-p2-local-lock',
    apiUsage:{calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0,byModel:{}}
  };
  return new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}

window.fetch=function(input,init){
  if(shouldIntercept(input,init)){
    var response=localResponse();
    if(response)return Promise.resolve(response);
  }
  return nativeFetch(input,init);
};
window.__halabjaP2PanelFixBridgeV10=true;
})();
