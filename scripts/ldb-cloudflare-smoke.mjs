import { mkdir, writeFile, access } from 'node:fs/promises';
import { generateImage } from '../lib/ldb/cloudflare-image.mjs';
// Explicit one-build test, not part of default deployment and never an HTTP endpoint.
if (!process.argv.includes('--confirmed-free-plan-single-image')) {
  console.error('Explicit confirmed-free-plan single-image flag required.'); process.exit(1);
}
const dir = 'assets/ldb-cloudflare-smoke';
try { await access(`${dir}/result.json`); console.error('Existing smoke result: refusing duplicate generation.'); process.exit(1); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const prompt = 'Hand-drawn 2D historical anime illustration, strictly neutral black and white grayscale. A peaceful rural hillside overlooking Lake Nyos, Cameroon, 1986, with a small modest house and one adult standing quietly beside a wooden doorway. Ink outlines, restrained cel shading, historically plausible rural clothing and architecture, quiet natural light. No color, no sepia, no photorealism, no 3D, no lettering, no text, no watermark. Technical integration sample, peaceful scene.';
try {
  const image = await generateImage({ prompt, freePlanConfirmed: true });
  await mkdir(dir, {recursive:true});
  await writeFile(`${dir}/sample.jpg`, image.bytes, {flag:'wx'});
  const result = { schema:'ldb-image-smoke-v1', status:'IMAGE_BYTES_RECEIVED', model:image.model, steps:image.steps, bytes:image.bytes.length, sha256:image.sha256, generatedAt:new Date().toISOString(), inferenceTested:true, autoProductionReady:false, visualReview:'PENDING', portraitRequirement:'NOT_VERIFIED', prompt };
  await writeFile(`${dir}/result.json`, JSON.stringify(result,null,2), {flag:'wx'});
  console.log(JSON.stringify({...result,prompt:undefined}));
} catch (error) { console.error('LDB image smoke failed:', error.code || 'LOCAL_OUTPUT_FAILED'); process.exit(1); }
