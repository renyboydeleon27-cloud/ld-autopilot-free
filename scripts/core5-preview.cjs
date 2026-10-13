/* Local-only, no-provider Android/desktop preview. Never deploy this mock server. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const banner='<aside style="position:sticky;top:0;z-index:99999;background:#ffe18a;color:#111;padding:12px;font:16px sans-serif">CORE 5 LOCAL TEST — audit results are MOCKS, not AI approval. No paid generation. Use test copies only.</aside>';
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Security-Policy',"connect-src 'self'; form-action 'none'; object-src 'none'");
 if(url.pathname.startsWith('/api/')){
  res.setHeader('Content-Type','application/json');
  if(req.method==='POST'&&url.pathname==='/api/ai-t2v-audit'){
   req.resume();res.end(JSON.stringify({ok:true,result:'PASS',issues:[],summary:'MOCK ONLY — no historical or AI review performed'}));
  }else{res.statusCode=503;res.end(JSON.stringify({ok:false,error:'Provider APIs disabled in local Core 5 preview'}));}
  return;
 }
 if(url.pathname==='/service-worker.js'){res.writeHead(404).end();return;}
 let name;try{name=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end();return;}
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)||name.includes('/.')){res.writeHead(403).end();return;}
 try{let body=fs.readFileSync(file);if(file.endsWith('.html'))body=body.toString().replace('<body>','<body>'+banner);
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.svg')?'image/svg+xml':'application/octet-stream');res.end(body);
 }catch{res.writeHead(404).end();}
}).listen(8765,'127.0.0.1',()=>console.log('Local mock preview: http://localhost:8765 — no provider API calls. Android USB: adb reverse tcp:8765 tcp:8765'));
