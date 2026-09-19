(()=>{'use strict';
const TARGET=/\b(?:great\s+kant(?:o|ō)|kant(?:o|ō)\s+earthquake)\b/i;
const YEAR=/\b1923\b/;
const MODE_KEY='ld-auto-visual-mode-v1';

function topic(){
  return (document.getElementById('topic')?.value||document.getElementById('projectTitle')?.textContent||'').trim();
}
function isTarget(){
  return localStorage.getItem(MODE_KEY)==='real' && TARGET.test(topic()) && YEAR.test(topic());
}
function hook(){
  return [...document.querySelectorAll('.stage-card')].find(c=>(c.dataset.stage||c.querySelector('.stage-name')?.textContent||'').trim().toUpperCase()==='HOOK');
}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}

function prompt(){
return `VIDEO PROMPT — EXACTLY 10 SECONDS

GREAT KANTŌ EARTHQUAKE — TOKYO, JAPAN — 1923

CREATE A CINEMATIC TWIST HOOK FOR A HISTORICAL DISASTER CHAPTER.

FORMAT:
Portrait 9:16.
Exactly 10 seconds.
Text-to-video only — NO supplied starting image is required.
One continuous live-action historical disaster sequence.
Photorealistic REAL HUMAN mode.

ABSOLUTE CONTINUITY LOCK:
The HOOK must belong to the exact same historical world as P1–P14: same disaster, same year, same country, same era-appropriate architecture, clothing, infrastructure, documentary tone and historical atmosphere. It must feel like the opening of the SAME chapter, not a different film or era.

ERA AUTHENTICITY LOCK:
The event is unmistakably Tokyo, Japan, in 1923. All visible clothing, interiors, household objects, streets, buildings, transport, signs, utilities, tools and construction materials must be historically believable for Tokyo in 1923. No modern objects, vehicles, architecture, street design or consumer items.

ABSOLUTE GLOBAL MONOCHROME LOCK:
THE ENTIRE 10-SECOND VIDEO MUST REMAIN TRUE BLACK-AND-WHITE FROM FRAME 1 TO THE FINAL FRAME.
This applies before, during and after every movement, impact, reveal and disaster escalation.
Never introduce color.
No color restoration.
No sepia.
No warm tint.
No cool tint.
No modern cinematic grading.
No colorized second half.
No modern digital look after the glass impact.
The visual style MUST NOT reset at any time.

CAPTURE STYLE LOCK:
Use a true early-20th-century restored-film/newsreel character: monochrome black-and-white, organic photographic grain, soft optical resolution, subtle lens softness, restrained contrast, limited tonal latitude, slight natural exposure imperfection and period documentary character. Do not make it look like modern digital cinema, a glossy reenactment, clean 4K footage or a modern video with a fake vintage filter.

CORE RHYTHM:
1 SECOND CALM NORMAL LIFE
→ FIRST TREMOR
→ ONE VISIBLE GLASS FALLS
→ GLASS IMPACT BY ABOUT 4 SECONDS
→ SIX FULL SECONDS OF MAJOR EARTHQUAKE IMPACT.

0.0–1.0s — CALM:
Inside a modest period-appropriate Japanese washroom in Tokyo, 1923. ONE adult Japanese man briefly brushes his teeth at a wooden washbasin. EXACTLY ONE transparent drinking glass stands clearly near the edge. Quiet ordinary morning. No danger yet. Keep this setup brief.

1.0–2.0s — FIRST TREMOR:
A subtle earthquake begins. Mirror vibrates. Water ripples. Small objects rattle. A hanging light or suspended object sways slightly. The SAME visible glass vibrates and physically slides toward the edge.

2.0–4.0s — GLASS FALL CHAIN:
The SAME glass reaches the edge, progressively loses support, tips outward, falls and hits the floor. Keep the complete action visually readable:
VISIBLE GLASS → VIBRATES → SLIDES → REACHES EDGE → TIPS → FALLS → HITS FLOOR.
Use brief dramatic slow motion ONLY during the actual falling-glass moment if useful, but do not overextend it. The camera follows the falling glass clearly enough to understand the motion. The SAME glass must hit the floor by approximately 4.0 seconds. ONE sharp glass crash. No teleportation, duplication, second glass or missing impact.

4.0–10.0s — SIX SECONDS OF MAJOR EARTHQUAKE:
Immediately after the glass impact, the earthquake becomes fully violent.

CONTINUITY AFTER IMPACT:
Do NOT reset the video into a different-looking scene.
Do NOT change the visual style.
Do NOT introduce color.
Do NOT make it feel like a separate movie.
Instead, the camera continues seamlessly into a wider reveal of the SAME 1923 Tokyo disaster world.
If the camera moves from interior to exterior, the reveal must remain continuous and belong to the same monochrome historical reality with the same grain, contrast, soft optics and archival exposure character.

CRITICAL CAMERA LOCK:
THE CAMERA MUST KEEP MOVING FORWARD THROUGH THE DISASTER FOR THE FULL FINAL SIX SECONDS.
Do not stop.
Do not become a static observer shot.
The viewer must feel pulled directly into the earthquake.

4.0–5.5s:
Camera surges into a violently shaking historical Tokyo environment. Adults react in fear and confusion. Roof tiles begin falling. Dust shakes loose. Signs swing violently.

5.5–7.0s:
KEEP MOVING FORWARD. Existing wooden structures begin partially failing. Roof sections loosen. Debris falls into the path. Utility poles sway violently.

7.0–8.5s:
KEEP PUSHING DEEPER. Another already-damaged structure loses part of its facade or roof. Adults scramble away while struggling to remain upright. Dust thickens.

8.5–10.0s:
CAMERA STILL MOVES FORWARD THROUGH PEAK CHAOS. Multiple layers of physically believable earthquake destruction occur around the moving camera: falling roof tiles, breaking wooden elements, failing facades, swinging utilities, running adults, heavy dust and ground-level debris. Finish while the camera is STILL MOVING FORWARD. Cut during peak escalation.

DESTRUCTION LOGIC:
The earthquake causes the destruction. The moving camera does NOT cause buildings to collapse. Every failure comes from already-existing architecture. No spontaneous buildings. No random explosions.

HUMAN LOCK:
Adults only. Realistic adult human anatomy. No duplicated people. No flying people. No children. No gore.

CAMERA FEEL:
Professional cinematic documentary energy with strong depth. Foreground objects pass camera and midground destruction becomes foreground as the camera advances. Restrained earthquake vibration layered over forward motion. No orbit, whip pan, crash zoom or flashy effects.

AUDIO:
0–1s quiet washroom ambience.
1–2s subtle rattling and low earthquake rumble.
2–4s rising rumble, glass sliding, then ONE sharp glass impact.
4–10s powerful earthquake roar, wood cracking, roof tiles smashing, debris impacts, signs and utilities shaking, adult reactions and dust-heavy disaster ambience.
NO MUSIC. NO VOICEOVER.

NEGATIVE LOCK:
No modern objects.
No modern lighting aesthetic.
No color footage.
No glossy contemporary movie look.
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
If the model cannot fully execute every secondary environmental action, simplify the background. DO NOT simplify or omit the main hook chain:
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
The finished HOOK must feel unmistakably like the Great Kantō Earthquake in Tokyo, Japan, 1923, captured in authentic monochrome archival live-action style and visually compatible with the historical world that continues in P1–P14.`;
}

function apply(){
  if(!isTarget())return false;
  const card=hook(); if(!card)return false;
  const img=card.querySelector('.image-prompt');
  const flow=card.querySelector('.flow-prompt');
  if(img){
    img.value='TEXT-TO-VIDEO HOOK — NO STARTING IMAGE REQUIRED. Use the Flow prompt directly. Historical world continuity is locked to Tokyo, Japan, 1923 and the following P1–P14 sequence.';
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
  if(role)role.textContent='TEXT-TO-VIDEO TWIST HOOK · 1923 ERA LOCK · 1s calm → glass trigger → 6s major impact';
  const note=card.querySelector('.stage-note');
  if(note)note.textContent='HOOK: text-to-video only · no starting image · entire 10s remains monochrome 1923 archival live-action';
  return true;
}

function schedule(){requestAnimationFrame(()=>setTimeout(apply,180));}
window.addEventListener('load',()=>{schedule();setTimeout(apply,800)});
document.addEventListener('click',e=>{if(e.target.closest('#buildBtn,.project-list button,.generate-template-btn,#generateAllBtn'))schedule();});
document.addEventListener('change',e=>{if(e.target.matches('#visualMode,#format'))schedule();});
document.getElementById('topic')?.addEventListener('input',()=>setTimeout(apply,250));
window.LDTwistHookV314={apply,prompt};
})();