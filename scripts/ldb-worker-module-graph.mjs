import {readFile} from 'node:fs/promises';
import {posix} from 'node:path';
// Keep module paths intact so Cloudflare can resolve relative imports.
export async function workerModules(entry,{read=readFile}={}){
 const modules=new Map();
 async function visit(path){
  if(!/^(cloudflare|lib)\/[a-zA-Z0-9_./-]+\.mjs$/.test(path)||path.split('/').includes('..'))throw Error('UNSAFE_MODULE_PATH');
  if(modules.has(path))return;
  const source=String(await read(path,'utf8'));modules.set(path,source);
  for(const match of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){
   const specifier=match[1];
   if(specifier.startsWith('.'))await visit(posix.normalize(posix.join(posix.dirname(path),specifier)));
   else if(!/^(node:|cloudflare:)/.test(specifier))throw Error('UNSUPPORTED_MODULE_IMPORT');
  }
 }
 await visit(entry);return modules;
}
