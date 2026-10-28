import { createHash } from 'node:crypto';
export const MODEL = '@cf/black-forest-labs/flux-2-klein-4b';
export class ImageGenerationError extends Error { constructor(code) { super(code); this.code = code; } }
const fail = code => { throw new ImageGenerationError(code); };
// This adapter is server-only. Caller must reserve durable quota and authorize jobs.
// No retries: an ambiguous timeout may already have consumed provider quota.
export async function generateImage({ prompt, freePlanConfirmed = false, env = process.env, fetcher = globalThis.fetch } = {}) {
  if (!freePlanConfirmed) fail('FREE_PLAN_CONFIRMATION_REQUIRED');
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 2048) fail('INVALID_PROMPT');
  const account = env.CLOUDFLARE_ACCOUNT_ID || '', token = env.CLOUDFLARE_API_TOKEN || '';
  if (!/^[a-f0-9]{32}$/i.test(account) || !token || /\s/.test(token)) fail('CONFIGURATION_REQUIRED');
  const body = new FormData();
  body.set('prompt', prompt); body.set('width', '576'); body.set('height', '1024');
  try {
    const response = await fetcher(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${MODEL}`, {
      method: 'POST', redirect: 'error', headers: { Authorization: `Bearer ${token}` },
      body, signal: AbortSignal.timeout(90000)
    });
    if (!response.ok) fail(response.status === 429 ? 'QUOTA_OR_RATE_LIMIT' : [401,403].includes(response.status) ? 'AUTHORIZATION_FAILED' : 'PROVIDER_FAILED');
    // Bound the response before parsing; never forward provider error details.
    const reader = response.body.getReader(); let size = 0; const chunks = [];
    for (;;) { const {done,value} = await reader.read(); if (done) break; size += value.length; if (size > 12000000) { await reader.cancel(); fail('RESPONSE_TOO_LARGE'); } chunks.push(Buffer.from(value)); }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (data.success !== true || typeof data.result?.image !== 'string') fail('INVALID_IMAGE_RESPONSE');
    const encoded = data.result.image;
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4) fail('INVALID_IMAGE_RESPONSE');
    const bytes = Buffer.from(encoded, 'base64');
    const metadata = imageMetadata(bytes);
    if (metadata.width !== 576 || metadata.height !== 1024) fail('INVALID_PORTRAIT_DIMENSIONS');
    return { bytes, ...metadata, model: MODEL, steps: 4, sha256: createHash('sha256').update(bytes).digest('hex') };
  } catch (error) { if (error instanceof ImageGenerationError) throw error; fail('PROVIDER_UNAVAILABLE_OR_INVALID_RESPONSE'); }
}

// Inspect encoded dimensions before accepting output. Full decode is part of delivery QA.
export function imageMetadata(bytes) {
  if (bytes.length < 100) fail('INVALID_IMAGE');
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16)==='IHDR')
    return {mimeType:'image/png',extension:'png',width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
  if(bytes[0]!==255 || bytes[1]!==216 || bytes.at(-2)!==255 || bytes.at(-1)!==217) fail('INVALID_IMAGE');
  let at=2;
  while(at+4<bytes.length) {
    if(bytes[at++]!==255) fail('INVALID_IMAGE');
    while(bytes[at]===255) at++;
    const marker=bytes[at++];
    if(marker===0xda || marker===0xd9) break;
    if(marker===0x01 || (marker>=0xd0 && marker<=0xd7)) continue;
    const length=bytes.readUInt16BE(at);
    if(length<2 || at+length>bytes.length) fail('INVALID_IMAGE');
    if([0xc0,0xc1,0xc2].includes(marker) && length>=8)
      return {mimeType:'image/jpeg',extension:'jpg',height:bytes.readUInt16BE(at+3),width:bytes.readUInt16BE(at+5)};
    at+=length;
  }
  fail('INVALID_IMAGE');
}
