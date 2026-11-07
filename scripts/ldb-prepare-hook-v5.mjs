// HOOK-only next-candidate prompt. NO rendering, upload or paid API call.
// Keep the exact user-approved storyboard bytes and SHA-256 identity untouched.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {validateRenderJob} from '../lib/ldb/approved-render-job.mjs';
export const APPROVAL_ID='75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05';
// Keep the full packager-produced HOOK prompt below the Workers AI 2048-char
// limit. Preserve the approved visual verbatim; replace the legacy physical
// notes because they place the lantern in front, contradicting this V5 pose.
export const COMPOSITION_LOCK=[
 'HOOK-only composition lock: Close three-quarter view including knees and whole lantern; doorway and hut wall fill the background.',
 'Adult Cameroonian woman: patterned cloth headwrap, loose short-sleeved blouse, long patterned wrap skirt.',
 'Her weight rests on the post: slumped torso, visibly bent knees, lowered chin and tired worried downward gaze.',
 'LEFT SHOULDER pressed directly against wooden doorpost with zero gap; left upper arm close to torso, left palm resting on wood.',
 'RIGHT HAND wraps five natural fingers around TOP HANDLE of ONE lantern hanging vertically beside thigh under gravity; arm naturally lowered.',
 'The extinguished lantern is a dark object: black wick, charcoal-gray glass interior as dark as its metal frame. No white center, flame, glow, halo or emitted light.',
 'Moon OUTSIDE frame; NO visible moon disk. Crop out the sky entirely; background contains only wooden doorway and dark thatched hut. Dim diffuse ambient light.',
 'Strict BLACK, WHITE, neutral GRAY with R=G=B; flat hand-inked historical 2D anime.',
 'No color, sepia, photorealism, text or watermark.'
].join(' ');
export function prepareHookV5(bundle){
 const validated=validateRenderJob(bundle);
 if(validated.id!==APPROVAL_ID)throw Error('WRONG_TEST_APPROVAL');
 const prepared=JSON.parse(JSON.stringify(bundle));
 const hook=prepared.render_scenes[0];
 if(hook.id!=='HOOK')throw Error('WRONG_SCENE');
 if(hook.image_prompt.includes('HOOK-only composition lock:'))throw Error('DIAGNOSTIC_ALREADY_PREPARED');
 const visual=JSON.parse(prepared.storyboard_utf8).scenes.HOOK.visual;
 // Build one consistent still prompt instead of appending contradictory notes.
 hook.image_prompt=[
  'IMAGE ONLY — STATIC REFERENCE STILL. Vertical 9:16. Cameroon, 1986.',
  'Historically plausible architecture, clothing, technology and geography.',
  'SPECIFIC DIRECTOR\'S STORYBOARD VISUAL:',visual,COMPOSITION_LOCK,
  'No CGI, 3D, live-action or chibi. No floating lantern, hidden grip, extra hand or extra lamp.'
 ].join('\n');
 if(hook.image_prompt.length>2048)throw Error('HOOK_PROMPT_TOO_LONG');
 if(validateRenderJob(prepared).id!==validated.id)throw Error('STORYBOARD_HASH_CHANGED');
 if(prepared.storyboard_utf8!==bundle.storyboard_utf8)throw Error('STORYBOARD_TEXT_CHANGED');
 return prepared;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const path='/tmp/ldb-hook-package/render_job.json';
 const bundle=JSON.parse(await readFile(path,'utf8'));
 await writeFile(path,JSON.stringify(prepareHookV5(bundle)));
 console.log('HOOK V5 diagnostic prepared, original storyboard approval unchanged; NO inference executed.');
}
