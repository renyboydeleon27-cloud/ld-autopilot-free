// Server-only adapter for code already running inside the Google Vault Durable Object.
// It deliberately exposes no OAuth token or public HTTP route.
// The production runner cannot invoke this directly across Worker boundaries;
// a separately reviewed private RPC bridge is required before full delivery.
import {DriveDelivery,GmailMilestones} from '../../lib/ldb/google-delivery.mjs';
import {storageCapacity} from '../../lib/ldb/production-delivery.mjs';

const fail=code=>{throw Error(code);};

export function createVaultLocalDriveBackend({vault,storage,enabled=false,fetcher}={}){
 // Intentional opt-in. Neither browser flags nor production status activate this.
 if(enabled!==true)fail('VAULT_DELIVERY_DISABLED');
 if(!vault||typeof vault.accessToken!=='function'||!storage||
    typeof storage.get!=='function'||typeof storage.put!=='function'||
    typeof storage.transaction!=='function')
  fail('TRUSTED_VAULT_BACKEND_REQUIRED');
 if(fetcher!==undefined&&typeof fetcher!=='function')fail('TRUSTED_FETCHER_REQUIRED');
 const tokenProvider=()=>vault.accessToken();
 const options=fetcher?{fetcher}:{};
 const drive=new DriveDelivery(storage,{tokenProvider,...options});
 const capacity=()=>storageCapacity(tokenProvider,fetcher);
 const notifyMilestone=(state,percent)=>new GmailMilestones(storage,{tokenProvider,loadState:async()=>state,...options}).send(percent);
 return Object.freeze({drive,capacity,notifyMilestone});
}
