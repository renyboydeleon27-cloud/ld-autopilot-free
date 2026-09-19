(()=>{'use strict';
const EARTHQUAKE=/\b(?:earthquake|quake|seismic)\b/i;
const MODE_KEY='ld-auto-visual-mode-v1';

function topic(){
  return (document.getElementById('topic')?.value||document.getElementById('projectTitle')?.textContent||'').trim();
}
function detectYear(text){
  const m=String(text||'').match(/\b(18\d{2}|19\d{2}|20\d{2}|2100)\b/);
  return m?Number(m[1]):null;
}
function eraForYear(year){
  if(!year)return {label:'historically appropriate documentary capture',look:'Use a documentary capture style historically appropriate to the event date. Keep that exact capture treatment consistent from the first frame to the final frame; never reset style after the glass impact.'};
  if(year<=1929)return {label:'early-film/newsreel monochrome',look:'Use true black-and-white early-20th-century restored-film/newsreel character with organic grain, soft optical resolution, restrained contrast, limited tonal latitude, slight natural exposure imperfection and subtle lens softness. The ENTIRE 10-second video must remain black-and-white from frame 1 to the final frame.'};
  if(year<=1959)return {label:'mid-century newsreel film',look:'Use a mid-century documentary/newsreel film character with black-and-white or historically plausible limited color appropriate to the event, organic film grain, optical softness and restrained contrast. Keep the same capture treatment throughout the entire shot.'};
  if(year<=1979)return {label:'period film / early broadcast',look:'Use a historically plausible 1960s-1970s documentary/news-film capture with muted saturation or monochrome when appropriate, organic film grain, modest lens softness and restrained broadcast transfer texture. Keep the same capture treatment throughout the entire shot.'};
  if(year<=1999)return {label:'analog broadcast documentary',look:'Use a late-20th-century analog news/documentary look with slightly faded natural color, mild broadcast softness and restrained tape/broadcast texture. Do not exaggerate VHS damage. Keep the same capture treatment throughout the entire shot.'};
  if(year<=2009)return {label:'early digital news documentary',look:'Use an early-2000s digital news/camcorder documentary look with natural color, modest sensor sharpness, mild broadcast softness and restrained compression texture. Keep the same capture treatment throughout the entire shot.'};
  if(year<=2019)return {label:'HD broadcast documentary',look:'Use a 2010s HD broadcast/documentary look with natural color, realistic digital detail, practical lighting and restrained broadcast compression. Keep the same capture treatment throughout the entire shot.'};
  return {label:'modern documentary',look:'Use a contemporary documentary/news-camera look with natural color, realistic digital sharpness, practical lighting and believable motion. Keep the same capture treatment throughout the entire shot.'};
}
function isTarget(){
  return localStorage.getItem(MODE_KEY)==='real' && EARTHQUAKE.test(topic());
}
function hook(){
  return [...document.querySelectorAll('.stage-card')].find(c=>(c.dataset.stage||c.querySelector('.stage-name')?.textContent||'').trim().toUpperCase()==='HOOK');
}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}

function prompt(){
  const t=topic()||'historical earthquake';
  const year=detectYear(t);
  const era=eraForYear(year);
  const yearText=year?String(year):'the documented event year';
return `VIDEO PROMPT — EXACTLY 10 SECONDS

EARTHQUAKE TWIST HOOK — ${t}

CREATE A CINEMATIC TEXT-TO-VIDEO HOOK FOR THIS EARTHQUAKE PRODUCTION.

FORMAT:
Portrait 9:16 for Shorts.
Exactly 10 seconds.
Text-to-video only — NO supplied starting image is required.
One continuous live-action historical disaster sequence.
Photorealistic REAL HUMAN mode.

TOPIC & HISTORY LOCK:
The HOOK must depict ${t}.
The event year is ${yearText}.
Use the historically correct location, people, architecture, clothing, household objects, streets, transport, utilities, construction materials and infrastructure for THIS exact earthquake.
Do not substitute Tokyo, Japan, 1923 unless the selected topic actually is the Great Kantō Earthquake.
Do not invent a different country, city, era or disaster.

P1–P14 CONTINUITY LOCK:
The HOOK must belong to the SAME historical world as the following P1–P14 production: same earthquake, same year, same location, same era-appropriate environment, same documentary tone and same visual language.
It must feel like the opening of the SAME chapter, not a separate film.

ERA CAPTURE LOCK — ${era.label.toUpperCase()}:
${era.look}
The capture treatment affects only the recording appearance; the physical world must remain accurate to the selected earthquake's real era and location.

ABSOLUTE STYLE-CONTINUITY LOCK:
Do NOT reset the video into a different-looking scene after the glass impact.
Do NOT change era, camera technology, film texture, color treatment, lighting language or documentary style.
Do NOT make the exterior feel like a newly generated movie.
The interior and exterior must remain inside ONE continuous visual world from frame 1 through frame 10.

CORE RHYTHM:
1 SECOND CALM NORMAL LIFE
→ FIRST TREMOR
→ ONE VISIBLE GLASS FALLS
→ GLASS IMPACT BY ABOUT 4 SECONDS
→ SIX FULL SECONDS OF MAJOR EARTHQUAKE IMPACT.

0.0–1.0s — CALM:
Inside a modest, historically appropriate washroom or wash area belonging naturally to the selected earthquake's place and year.
ONE adult resident briefly brushes their teeth at a period-appropriate washbasin.
EXACTLY ONE transparent drinking glass stands clearly near the edge.
Quiet ordinary life. No visible danger yet.
Keep this setup to approximately ONE SECOND only.

1.0–2.0s — FIRST TREMOR:
A subtle earthquake begins.
Mirror or reflective surface vibrates where historically appropriate.
Water ripples.
Small objects rattle.
A hanging object or light sways slightly if present.
The SAME visible glass vibrates and physically slides toward the edge.

2.0–4.0s — GLASS FALL CHAIN:
The SAME glass reaches the edge, progressively loses support, tips outward, falls and hits the floor.
Keep the complete action visually readable:
VISIBLE GLASS → VIBRATES → SLIDES → REACHES EDGE → TIPS → FALLS → HITS FLOOR.
Use brief dramatic slow motion ONLY during the actual falling-glass moment if useful, but do not overextend it.
The camera follows the SAME falling glass clearly enough to understand the motion.
The glass must hit the floor by approximately 4.0 seconds.
ONE sharp glass crash.
No teleportation.
No duplicate glass.
No second glass.
No missing impact.

4.0–10.0s — SIX SECONDS OF MAJOR EARTHQUAKE:
Immediately after the glass impact, the earthquake becomes fully violent.

CONTINUOUS REVEAL:
Do NOT use a hard style reset or unrelated new scene.
The camera continues seamlessly into a wider reveal of the SAME earthquake world.
If movement goes from interior toward exterior, the exterior must already belong to the same location, era and visual reality.
Preserve identical capture treatment across the reveal.

CRITICAL CAMERA LOCK:
THE CAMERA MUST KEEP MOVING FORWARD THROUGH THE DISASTER FOR THE FULL FINAL SIX SECONDS.
Do not stop.
Do not become a static observer shot.
The viewer must feel pulled directly into the earthquake.

4.0–5.5s:
Camera surges into a violently shaking environment appropriate to ${t}.
Adults react and struggle for balance.
Loose materials, signs, fixtures, roof elements or facade details begin failing only where physically and historically plausible.

5.5–7.0s:
KEEP MOVING FORWARD.
Existing structures show progressively stronger earthquake damage.
Debris enters the path.
Utilities, poles, hanging elements or street fixtures sway where historically appropriate.

7.0–8.5s:
KEEP PUSHING DEEPER.
Another already-damaged structure suffers a believable partial failure appropriate to its construction type.
Adults move away from danger while struggling to remain upright.
Dust or debris density increases where plausible.

8.5–10.0s:
CAMERA STILL MOVES FORWARD THROUGH PEAK CHAOS.
Show multiple depth layers of physically believable earthquake destruction based on the selected location's real architecture and infrastructure.
Finish while the camera is STILL MOVING FORWARD.
Cut during peak escalation.

DESTRUCTION LOGIC:
The earthquake causes all destruction.
The moving camera does NOT magically cause buildings to collapse.
Every failure must come from already-existing structures and materials visible or naturally connected to the environment.
No random explosions.
No spontaneous buildings.
No synchronized identical collapses.
Do not invent destruction modes inconsistent with the selected earthquake setting.

HUMAN LOCK:
Adults only.
Realistic adult human anatomy.
No duplicated people.
No floating or flying people.
No children.
No gore.

PHYSICS LOCK:
Glass motion must remain readable:
VISIBLE GLASS → VIBRATES → SLIDES → REACHES EDGE → TIPS → FALLS → HITS FLOOR.
Earthquake damage must progress through believable shaking, loosening materials, falling debris and partial structural failure.

CAMERA FEEL:
Professional cinematic documentary energy.
Strong foreground-midground-background depth.
Foreground objects pass the camera.
Midground damage becomes foreground as the camera advances.
Restrained earthquake vibration layered over forward motion.
No orbit.
No whip pan.
No crash zoom.
No flashy transition effects.

AUDIO:
0–1s quiet room ambience.
1–2s subtle rattling and low earthquake rumble.
2–4s rising rumble, glass sliding, then ONE sharp glass impact.
4–10s powerful earthquake roar, structure-specific cracking and debris impacts, utilities or fixtures shaking, adult reactions and disaster ambience appropriate to the selected event.
NO MUSIC.
NO VOICEOVER.

NEGATIVE LOCK:
No wrong country or city.
No wrong historical era.
No modern objects in historical events.
No unsupported modern architecture or vehicles.
No style reset after glass impact.
No unrelated exterior.
No missing glass fall.
No second falling glass.
No glass teleportation.
No static final earthquake shot.
No camera stopping during the final 6 seconds.
No random explosions.
No spontaneous building appearance.
No synchronized identical collapses.
No flying humans.
No children.
No gore.
No morphing.
No text.
No captions.
No logos.
No watermark.

ABSOLUTE PRIORITY:
If the model cannot fully execute every secondary environmental action, simplify the background.
DO NOT simplify or omit the main hook chain:
1 SECOND CALM
→ TREMOR
→ GLASS SLIDES
→ GLASS TIPS
→ GLASS FALLS
→ GLASS IMPACT BY ABOUT 4 SECONDS
→ 6 FULL SECONDS OF MAJOR EARTHQUAKE
→ CAMERA STILL MOVING FORWARD
→ CUT AT PEAK CHAOS.

FINAL REQUIREMENT:
The finished HOOK must unmistakably belong to ${t}, preserve the correct era and location, maintain one continuous capture style across interior and exterior, and remain visually compatible with the same P1–P14 chapter.`;
}

function apply(){
  if(window.LD_HOOK_CHOICES_ENABLED)return false;
  if(!isTarget())return false;
  const card=hook(); if(!card)return false;
  const t=topic()||'selected earthquake';
  const year=detectYear(t);
  const era=eraForYear(year);
  const img=card.querySelector('.image-prompt');
  const flow=card.querySelector('.flow-prompt');

  if(img){
    img.value=`TEXT-TO-VIDEO EARTHQUAKE HOOK — NO STARTING IMAGE REQUIRED. Use the Flow prompt directly. Topic lock: ${t}. Historical world continuity must match the same earthquake and P1–P14.`;
    fire(img);
    const block=img.closest('.field-block');
    if(block){
      block.dataset.hookT2v='1';
      const label=block.querySelector('label');
      if(label)label.textContent='HOOK setup — text-to-video';
    }
  }
  if(flow){
    flow.value=prompt();
    fire(flow);
  }
  const role=card.querySelector('.scene-role');
  if(role)role.textContent='EARTHQUAKE TEXT-TO-VIDEO TWIST HOOK · 1s calm → glass trigger → 6s major impact';
  const note=card.querySelector('.stage-note');
  if(note)note.textContent=`HOOK: earthquake-specific text-to-video · no starting image · ${era.label} · same-world continuity`;
  return true;
}

function schedule(){requestAnimationFrame(()=>setTimeout(apply,180));}
window.addEventListener('load',()=>{schedule();setTimeout(apply,800)});
document.addEventListener('click',e=>{if(e.target.closest('#buildBtn,.project-list button,.generate-template-btn,#generateAllBtn'))schedule();});
document.addEventListener('change',e=>{if(e.target.matches('#visualMode,#format'))schedule();});
document.getElementById('topic')?.addEventListener('input',()=>setTimeout(apply,250));
window.LDEarthquakeTwistHookV315={apply,prompt,detectYear,eraForYear};
})();