// Read-only local environment inventory: not a real Google/Gmail connection.
export const GOOGLE_DELIVERY_KEYS=Object.freeze([
 'LDB_GOOGLE_VAULT_URL','LDB_GOOGLE_VAULT_SECRET','LDB_GOOGLE_VAULT_KEY',
 'LDB_GOOGLE_CLIENT_ID','LDB_GOOGLE_CLIENT_SECRET','LDB_GOOGLE_COOKIE_KEY'
]);
export function assessLdbDeliveryConfig({env={}}={}){
 const missing=GOOGLE_DELIVERY_KEYS.filter(k=>typeof env[k]!=='string'||!env[k].trim());
 return Object.freeze({
  status:missing.length?'PREVIEW_DELIVERY_CONFIG_INCOMPLETE':'PREVIEW_CONFIG_PRESENT_UNVERIFIED',
  configuredEntries:GOOGLE_DELIVERY_KEYS.length-missing.length,
  expectedConfigurationEntries:GOOGLE_DELIVERY_KEYS.length,
  missingKeys:Object.freeze(missing),
  deliveryBridgeEnabled:false,driveConnectionVerified:false,
  driveFilesVerified:0,driveFilesExpected:69,
  gmailConnectionVerified:false,gmailMilestonesVerified:0,gmailMilestonesExpected:4,
  productionReady:false,googleApiCalled:false,gmailApiCalled:false,
  note:'Local Vercel config inventory only. Does not prove Cloudflare Vault, Drive receipts, Gmail inbox or production acceptance.'
 });
}
