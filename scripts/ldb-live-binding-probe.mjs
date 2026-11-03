// Local operator read-only smoke test: no redirects, uploads or secret logging.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const fail=code=>{throw Error(code)};
export async function verifyLiveBindingProbe({url,secret,fetcher=globalThis.fetch}={}){
 let u;
 try{u=new URL(url);}catch{fail('INVALID_PROBE_URL')}
 if(u.protocol!=='https:'||
    !/^ner-ldb-runner-binding-probe\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname)||
    u.pathname!=='/delivery-bridge-probe'||
    u.search||u.hash||u.port||u.username||u.password)fail('UNSAFE_PROBE_URL');
 if(typeof secret!=='string'||secret.length<32)fail('PROBE_SECRET_REQUIRED');
 let res,body;
 try{res=await fetcher(u.toString(),{method:'GET',redirect:'manual',
  headers:{Authorization:'Bearer '+secret,Accept:'application/json'},
  signal:AbortSignal.timeout(12000)});}
 catch{fail('PROBE_TRANSPORT_UNAVAILABLE')}
 if(res?.status!==200)fail('PROBE_NOT_AUTHENTICATED');
 try{body=await res.json()}catch{fail('PROBE_RESPONSE_INVALID')}
 if(!body||body.status!=='BRIDGE_AUTHENTICATED'||body.productionReady!==false||
    Object.keys(body).sort().join(',')!=='productionReady,status')fail('PROBE_RESPONSE_INVALID');
 return {status:'BRIDGE_AUTHENTICATED',productionReady:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{await verifyLiveBindingProbe({url:process.env.LDB_PROBE_URL,secret:process.env.LDB_RUNNER_SECRET});
  console.log('PASS: Worker-to-Worker binding authenticated. Production remains disabled.');
 }catch(e){console.error('FAIL: '+e.message+'. No production readiness claim.');process.exitCode=1;}
}
