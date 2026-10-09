/* LD AUTO — RECOMMENDED topic-specific HOOK: Aberfan Disaster 1966 — Coal-Slurry Survivor Reveal */
(function(){
'use strict';

function prompt(){
return `VIDEO PROMPT — EXACTLY 10 SECONDS
Aberfan Disaster — Wales — 1966 · HOOK

ABSOLUTE RENDERING MODE — HIGHEST PRIORITY: 2D HISTORICAL ANIME ONLY. Render every frame as hand-drawn 2D historical anime / graphic-novel animation in strict true black-and-white grayscale. NEVER render live-action footage, photorealistic humans, 3D CGI humans, documentary-newsreel live action, chibi, or horror-monster imagery. If any other instruction conflicts, THIS 2D HISTORICAL ANIME LOCK WINS.

UNIVERSAL MONOCHROME ANIME VISUAL DNA:
STRICT true black-and-white grayscale from frame 1 through frame 10.
No color.
No sepia.
No tint.
No selective color.
Serious historical tone.
Detailed hand-drawn linework.
Grayscale tonal shading.
Grounded adult anatomy.
Cinematic realism in anime form.
No gore.
No embedded text.
No subtitles.

FORMAT LOCK:
Portrait 9:16.
Exactly 10 seconds.
One continuous shot.
No narration.
No on-screen text.

SCENE:
Start in an extreme close-up of thick black coal slurry and mud filling almost the entire frame. At first it should not be obvious that a person is underneath. After a brief still moment, subtle movement begins beneath the heavy mud. A mud-covered ADULT survivor slowly rises upward from the black coal slurry. As the head lifts, thick black mud slides slowly down the face. The very first clear reveal should be the survivor’s eyes emerging through the mud. Then more of the face gradually becomes visible — forehead, nose, mouth, and cheeks — while the person struggles to breathe and regain awareness. The expression must feel shocked, disoriented, and traumatized, but never zombie-like, supernatural, or horror-staged.

The motion should remain slow, heavy, and believable, as if the coal slurry is weighing the body down. Keep the survivor chest-up or head-and-shoulders only. In the background, softly reveal a devastated Aberfan environment: black waste slurry, blurred debris, mist, and hints of a damaged village or school area, all historically grounded to Wales in 1966. The mood is tragic, cinematic, and human-focused. End with the survivor more fully visible, eyes open, breathing, and coated in black mud while the destruction remains behind them.

STATUS: RECOMMENDED — LOCKED. Creator selected the FIRST RENDER as the preferred Aberfan hook. Do not replace with the stricter retry version unless explicitly requested.`;
}

var hook=window.LDAberfanDisasterHook={
  version:'1.0',
  topic:'Aberfan Disaster — Wales — 1966',
  status:'RECOMMENDED — LOCKED',
  recommended:true,
  title:'Coal-Slurry Survivor Reveal',
  renderSelection:'FIRST RENDER',
  prompt:prompt
};

function install(){
  var lib=window.LDHookFamilyLibrary;
  if(!lib||typeof lib.choices!=='function'||lib.__aberfanHookPatched)return false;
  var baseChoices=lib.choices.bind(lib);
  lib.choices=function(ctx){
    var list=baseChoices(ctx);
    var topic=String(ctx&&ctx.topic||'');
    var isAberfan=/\baberfan\b/i.test(topic)&&/\b1966\b/.test(topic);
    var isTargetMode=ctx&&ctx.format!=='longform'&&ctx.mode==='anime'&&ctx.colorMode==='bw';
    if(!isAberfan||!isTargetMode||!Array.isArray(list)||!list.length)return list;
    var first=Object.assign({},list[0],{
      id:'aberfan-coal-slurry-survivor-v1',
      prompt:hook.prompt(),
      status:hook.status,
      source:'Topic-specific',
      rec:true,
      title:hook.title,
      concept:'Black coal slurry fills the frame → subtle movement → an adult survivor rises through the slurry → mud slides from the face → eyes and face emerge → Aberfan devastation resolves behind the survivor.',
      why:'Creator-selected first render. Strong stop-scroll mystery, organic survivor motion, black coal-slurry identity, and a human-centered reveal specific to Aberfan 1966.'
    });
    return [first].concat(list.slice(1));
  };
  lib.__aberfanHookPatched=true;
  return true;
}

if(!install())window.addEventListener('load',install,{once:true});
})();
