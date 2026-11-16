import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditPublicAuthSettings} from './app_auth_server_readiness.mjs';
const settings=(overrides={})=>({
  disable_signup:true,mailer_autoconfirm:false,
  external:{email:true,anonymous_users:false},...overrides
});
function mock(data,status=200){
 const calls=[];
 return {calls,fetchImpl:async(url,opts)=>{
   calls.push({url,opts});
   return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
 }};
}
test('complete hardened public Auth settings pass without any mutation',async()=>{
 const m=mock(settings());
 const r=await auditPublicAuthSettings({fetchImpl:m.fetchImpl});
 assert.equal(r.status,'PASS');
 assert.equal(r.signup,'DISABLED');
 assert.equal(r.email_auth,'ENABLED');
 assert.equal(r.email_confirmation,'REQUIRED');
 assert.equal(r.anonymous_signup,'DISABLED');
 assert.equal(r.data_mutated,false);
 assert.equal(r.tokens_used,false);
 assert.equal(r.user_accounts_tested,0);
 assert.equal(m.calls.length,1);
 assert.match(m.calls[0].url,/\/auth\/v1\/settings$/);
 assert.equal(m.calls[0].opts.method,'GET');
 assert.ok(m.calls[0].opts.headers.apikey.startsWith('sb_publishable_'));
 assert.equal(m.calls[0].opts.headers.authorization,undefined);
});
test('signup still open is NO_GO',async()=>{
 const m=mock(settings({disable_signup:false}));
 const r=await auditPublicAuthSettings({fetchImpl:m.fetchImpl});
 assert.equal(r.status,'NO_GO');
 assert.equal(r.signup,'ENABLED');
});
test('auto-confirmed emails remain NO_GO',async()=>{
 const m=mock(settings({mailer_autoconfirm:true}));
 assert.equal((await auditPublicAuthSettings({fetchImpl:m.fetchImpl})).status,'NO_GO');
});
test('email sign-in disabled remains NO_GO',async()=>{
 const m=mock(settings({external:{email:false,anonymous_users:false}}));
 assert.equal((await auditPublicAuthSettings({fetchImpl:m.fetchImpl})).status,'NO_GO');
});
test('anonymous signups enabled or unknown remain NO_GO',async()=>{
 for(const external of [{email:true,anonymous_users:true},{email:true}]){
   const m=mock(settings({external}));
   const out=await auditPublicAuthSettings({fetchImpl:m.fetchImpl});
   assert.equal(out.status,'NO_GO');
 }
});
test('unavailable or malformed Auth setting responses fail rather than guess',async()=>{
 const m=mock({external:{}},200);
 await assert.rejects(()=>auditPublicAuthSettings({fetchImpl:m.fetchImpl}),/UNEXPECTED_PUBLIC_AUTH_SETTINGS/);
 const n=mock({error:'not found'},404);
 await assert.rejects(()=>auditPublicAuthSettings({fetchImpl:n.fetchImpl}),/PUBLIC_AUTH_SETTINGS_UNAVAILABLE_404/);
});
