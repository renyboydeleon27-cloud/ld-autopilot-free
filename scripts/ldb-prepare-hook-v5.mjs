// HOOK-only next-candidate prompt. NO rendering, upload or paid API call.
// Keep the exact user-approved storyboard bytes and SHA-256 identity untouched.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {validateRenderJob} from '../lib/ldb/approved-render-job.mjs';
export const APPROVAL_ID='75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05';
// Keep the original approved storyboard bytes and 16 other scenes unchanged.
// The Python packager supplies an older 754-character PHYSICAL COMPOSITION note
// that contradicts the newer V5 lantern pose. Replace that generated note,
// rather than append a second redundant direction past the 2048-char limit.
export const COMPOSITION_LOCK=[
 'HOOK-only composition lock: Three-quarter view including knees and whole lantern.',
 'Adult Cameroonian woman: patterned cloth headwrap, loose short-sleeved blouse, long patterned wrap skirt.',
 'Torso sags toward post, knees slightly bent, tired worried face looking downward.',
 'LEFT SHOULDER touches wooden doorpost; left palm flat on wood.',
 'RIGHT HAND wraps five natural fingers around TOP HANDLE of ONE lantern hanging vertically beside thigh under gravity; arm naturally lowered.',
 'Lantern OFF: black wick, dark glass, no flame, glow or halo.',
 'Moon OUTSIDE frame; NO visible moon disk. Faint ambient night light only.',
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
 const startTag='PHYSICAL COMPOSITION:';
 const endTag='No floating lantern, hidden grip, extra hand or extra lamp.';
 const before=hook.image_prompt;
 const start=before.indexOf(startTag),end=before.indexOf(endTag);
 // The expected generated HOOK notes are not an approved storyboard field.
 // Fail closed for partially modified or repeated notes; preserve the original.
 if(start!==-1||end!==-1){
  if(start<0||end<start||
     before.indexOf(startTag,start+startTag.length)!==-1||
     before.indexOf(endTag,end+endTag.length)!==-1)
   throw Error('HOOK_NOTE_FORMAT_CHANGED');
  hook.image_prompt=before.slice(0,start)+COMPOSITION_LOCK+before.slice(end+endTag.length);
 }else{
  // Minimal synthetic/unit-test prompts do not contain packager notes.
  hook.image_prompt+='\n'+COMPOSITION_LOCK;
 }
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
