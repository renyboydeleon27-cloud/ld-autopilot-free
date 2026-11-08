// Isolated Cloudflare service-binding diagnostic. This makes NO Google request,
// cannot upload to Drive or send Gmail, and does not enable production.
const fail=()=>{throw Error('BRIDGE_PROBE_UNAVAILABLE');};
const validNonce=x=>typeof x==='string'&&/^[a-f0-9]{32}$/.test(x);
export async function probeGoogleVaultBinding(env,nonce){
 if(!validNonce(nonce)||env?.BRIDGE_PROBE_ENABLED!=='true'||
    typeof env.GOOGLE_BRIDGE_PROBE_SECRET!=='string'||
    env.GOOGLE_BRIDGE_PROBE_SECRET.length<32||
    !env.GOOGLE_VAULT||typeof env.GOOGLE_VAULT.fetch!=='function')fail();
 let response;
 try {
  response=await env.GOOGLE_VAULT.fetch('https://ldb-vault.internal/internal/bridge/health',{
   method:'GET',
   headers:{Authorization:'Bearer '+env.GOOGLE_BRIDGE_PROBE_SECRET,
    'X-LDB-Probe-Nonce':nonce,'Cache-Control':'no-store'},
   redirect:'manual'
  });
 }catch{fail();}
 if(response?.status!==200)fail();
 let data;
 try{data=await response.json();}catch{fail();}
 if(!data||data.status!=='BRIDGE_AUTHENTICATED'||data.nonce!==nonce||
    Object.keys(data).sort().join(',')!=='nonce,status')fail();
 return Object.freeze({status:'BRIDGE_AUTHENTICATED',productionReady:false,nonce});
}
