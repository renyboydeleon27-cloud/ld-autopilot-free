// HOOK-only next-candidate prompt. NO rendering, upload or paid API call.
// Keep the exact user-approved storyboard bytes and SHA-256 identity untouched.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {validateRenderJob} from '../lib/ldb/approved-render-job.mjs';
export const APPROVAL_ID='75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05';
export const COMPOSITION_LOCK=[
 'HOOK-only composition lock: three-quarter medium shot of ONE woman beside the doorway.',
 'Her upper shoulder is visibly pressed against the vertical wooden doorpost; the contact point must be unmistakable.',
 'She holds a nonburning kerosene lantern by its U-shaped top handle at hip height with believable five-finger anatomy.',
 'Lantern glass is dark, with an extinguished wick: absolutely NO flame, NO illuminated glass and NO glow.',
 'Moon and sun must remain entirely OUTSIDE the image frame, with no visible sky disk.',
 'Ambient dim lighting only; no gas-cloud effects.',
 'Strict BLACK, WHITE and neutral gray only, all RGB channels equal (R=G=B); hand-drawn flat-shaded historical 2D anime.',
 'No sepia, colored highlights, realistic photo texture, words, logos or watermark.'
].join(' ');
export function prepareHookV5(bundle){
 const validated=validateRenderJob(bundle);
 if(validated.id!==APPROVAL_ID)throw Error('WRONG_TEST_APPROVAL');
 const prepared=JSON.parse(JSON.stringify(bundle));
 const hook=prepared.render_scenes[0];
 if(hook.id!=='HOOK')throw Error('WRONG_SCENE');
 if(hook.image_prompt.includes('HOOK-only composition lock:'))throw Error('DIAGNOSTIC_ALREADY_PREPARED');
 hook.image_prompt+='\n'+COMPOSITION_LOCK;
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
