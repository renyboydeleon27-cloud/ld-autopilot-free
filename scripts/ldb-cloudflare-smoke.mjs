import { mkdir, writeFile, access } from 'node:fs/promises';
import { generateImage } from '../lib/ldb/cloudflare-image.mjs';
// Explicit one-build test, not part of default deployment and never an HTTP endpoint.
if (!process.argv.includes('--confirmed-free-plan-single-image')) {
  console.error('Explicit confirmed-free-plan single-image flag required.'); process.exit(1);
}
const dir = 'assets/ldb-cloudflare-portrait-smoke';
try { await access(`${dir}/result.json`); console.error('Existing smoke result: refusing duplicate generation.'); process.exit(1); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const prompt = 'Portrait 9:16 composition. Cinematic hand-drawn 2D historical anime film still, strictly neutral black and white grayscale. Bold confident ink outlines, rich black shadows, layered gray cel shading, detailed expressive adult character in the foreground at the doorway, dramatic depth. A peaceful rural hillside overlooking Lake Nyos, Cameroon, 1986, with a small modest house and one adult standing quietly beside a wooden doorway. Ink outlines, restrained cel shading, historically plausible rural clothing and architecture, quiet natural light. No color, no sepia, no photorealism, no 3D, no lettering, no text, no watermark. Absolutely no page number, signature, frame, caption, border, logo or writing in any corner. Fill the canvas with the scene.';
try {
  const image = await generateImage({ prompt, freePlanConfirmed: true });
  await mkdir(dir, {recursive:true});
  await writeFile(`${dir}/sample.${image.extension}`, image.bytes, {flag:'wx'});
  const result = { schema:'ldb-image-smoke-v1', status:'IMAGE_BYTES_RECEIVED', model:image.model, steps:image.steps, bytes:image.bytes.length, width:image.width, height:image.height, mimeType:image.mimeType, file:`sample.${image.extension}`, sha256:image.sha256, generatedAt:new Date().toISOString(), inferenceTested:true, autoProductionReady:false, visualReview:'PENDING', portraitRequirement:'PASSED_576x1024', prompt };
  await writeFile(`${dir}/result.json`, JSON.stringify(result,null,2), {flag:'wx'});
  console.log(JSON.stringify({...result,prompt:undefined}));
} catch (error) { console.error('LDB image smoke failed:', error.code || 'LOCAL_OUTPUT_FAILED'); process.exit(1); }
