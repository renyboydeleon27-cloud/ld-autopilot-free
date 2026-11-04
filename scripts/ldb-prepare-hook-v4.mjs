// Prepare a bounded HOOK diagnostic from the existing approved episode.
import {readFile,writeFile} from 'node:fs/promises';
import {validateRenderJob} from '../lib/ldb/approved-render-job.mjs';
const path='/tmp/ldb-hook-package/render_job.json';
const bundle=JSON.parse(await readFile(path,'utf8'));
const before=validateRenderJob(bundle);
if(before.id!=='75dde2562c9a9fea831092a4f21ca6706bb568cf5bcc40a5db80b71285afdd05')throw Error('WRONG_TEST_APPROVAL');
bundle.render_scenes[0].image_prompt+='\nCritical composition: three-quarter medium shot, woman leaning her shoulder against a wooden doorpost. Her visible hand grips the top metal handle of a kerosene lantern hanging at hip height. The lantern is cold and switched off: black wick, dark transparent glass chamber, no flame, no glowing white shape inside, no light halo. Illumination comes only from faint ambient moonlight outside the frame, never from the lantern. Hand-drawn ink outlines and flat grayscale anime cel shading, not photographic texture. No visible gas cloud.';
validateRenderJob(bundle);
await writeFile(path,JSON.stringify(bundle));
console.log('Approved storyboard retained; only HOOK diagnostic direction reinforced.');
