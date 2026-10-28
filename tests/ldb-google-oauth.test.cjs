'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const oauth=require('../api/_ldb-google-oauth');
const start=require('../api/ldb-google-start');
const callback=require('../api/ldb-google-callback');
function res(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},writeHead(v,h){this.statusCode=v;Object.assign(this.headers,h);return this;},end(v){this.body=v||'';return this;}};}
test('AES-GCM encrypted OAuth state round-trip and tampering blocked',()=>{
 const key=crypto.randomBytes(32),token=oauth.seal({state:'abc',exp:Date.now()+1000},key);
 assert.equal(oauth.unseal(token,key).state,'abc');
 assert.throws(()=>oauth.unseal(token.slice(0,-2)+'xx',key));
});
test('OAuth start fails closed without server configuration',async()=>{
 const old={...process.env};
 try{delete process.env.LDB_GOOGLE_CLIENT_ID;delete process.env.LDB_GOOGLE_CLIENT_SECRET;delete process.env.LDB_GOOGLE_COOKIE_KEY;
 const r=res();await start({method:'GET',headers:{}},r);assert.equal(r.statusCode,503);assert.match(r.body,/not configured/);}
 finally{process.env=old;}
});
test('OAuth start sets PKCE challenge and encrypted state cookie',async()=>{
 const old={...process.env};
 try{process.env.LDB_GOOGLE_CLIENT_ID='client-test';process.env.LDB_GOOGLE_CLIENT_SECRET='secret-test';process.env.LDB_GOOGLE_COOKIE_KEY='ab'.repeat(32);
 const r=res();await start({method:'GET',headers:{}},r);assert.equal(r.statusCode,302);
 const u=new URL(r.headers.Location);assert.equal(u.searchParams.get('redirect_uri'),oauth.CALLBACK);
 assert.equal(u.searchParams.get('code_challenge_method'),'S256');
 assert.match(r.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Lax/);
 const c=r.headers['Set-Cookie'].split(';')[0].split('=')[1];
 const pending=oauth.unseal(c,Buffer.from('ab'.repeat(32),'hex'));
 assert.equal(pending.state,u.searchParams.get('state'));assert.ok(pending.verifier);}
 finally{process.env=old;}
});
test('OAuth callback rejects missing or invalid session without token exchange',async()=>{
 const old={...process.env};
 try{process.env.LDB_GOOGLE_CLIENT_ID='client-test';process.env.LDB_GOOGLE_CLIENT_SECRET='secret-test';process.env.LDB_GOOGLE_COOKIE_KEY='ab'.repeat(32);
 const r=res();await callback({method:'GET',url:'/api/ldb-google-callback?code=abc&state=bad',headers:{}},r);
 assert.equal(r.statusCode,400);assert.match(r.body,/session expired/);}
 finally{process.env=old;}
});
test('OAuth callback does not store refresh token in browser cookies',async()=>{
 const old={...process.env},originalFetch=global.fetch;
 try{process.env.LDB_GOOGLE_CLIENT_ID='client-test';process.env.LDB_GOOGLE_CLIENT_SECRET='secret-test';process.env.LDB_GOOGLE_COOKIE_KEY='ab'.repeat(32);
 const key=Buffer.from('ab'.repeat(32),'hex'),pending=oauth.seal({state:'valid',verifier:'verifier',exp:Date.now()+60000},key);
 global.fetch=async()=>({ok:true,json:async()=>({access_token:'access-secret',refresh_token:'refresh-secret'})});
 const r=res();await callback({method:'GET',url:'/api/ldb-google-callback?code=abc&state=valid',headers:{cookie:'ldb_google_pending='+pending}},r);
 assert.equal(r.statusCode,200);assert.doesNotMatch(JSON.stringify(r.headers),/refresh-secret|ldb_google_token/);
 assert.match(r.body,/No tokens saved/);}
 finally{process.env=old;global.fetch=originalFetch;}
});
