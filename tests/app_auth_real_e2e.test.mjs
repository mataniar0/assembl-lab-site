/* Purely simulated transport. No actual accounts, Supabase calls, or secrets.
 * These tests exercise two-phase runtime behavior and guaranteed test cleanup.
 * Only the manual live E2E command can verify real signed JWTs.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {e2eConfiguration,jwtClaimSummary,runRealAuthE2E} from './app_auth_real_e2e.mjs';
const A_ID='11111111-1111-4111-8111-111111111111';
const B_ID='22222222-2222-4222-8222-222222222222';
const env=(phase='before_grant_b')=>({
 AL_AUTH_PHASE:phase,AL_AUTH_A_EMAIL:'a@testing.invalid',AL_AUTH_A_PASSWORD:'test-A-password',
 AL_AUTH_B_EMAIL:'b@testing.invalid',AL_AUTH_B_PASSWORD:'test-B-password'
});
function fakeJwt(id,approved){
 const payload={sub:id,role:'authenticated',app_metadata:approved?{assembl_lab_pilot:'enabled'}:{}};
 return ['eyJhbGciOiJub25lIn0',Buffer.from(JSON.stringify(payload)).toString('base64url'),'offline-only'].join('.');
}
function mockTransport({grantB=false,signupDisabled=true,failJob=false}={}){
 const users=new Map([['a@testing.invalid',{id:A_ID,approved:true}],['b@testing.invalid',{id:B_ID,approved:grantB}]]);
 const tokenMap=new Map();
 const projects=new Map();
 let logoutCount=0,rawCalls=0,jobFailed=false;
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
 async function fetchImpl(url,opts){
  rawCalls++;
  const parsed=new URL(url);
  const path=parsed.pathname;
  const method=opts?.method||'GET';
  if(path==='/auth/v1/settings'){
   assert.equal(method,'GET');
   assert.ok(opts.headers.apikey.startsWith('sb_publishable_'));
   return reply({disable_signup:signupDisabled,mailer_autoconfirm:false,
     external:{email:true,anonymous_users:false}});
  }
  if(path==='/auth/v1/token'){
   const body=JSON.parse(opts.body);
   const user=users.get(body.email);
   if(!user)return reply({code:'invalid_credentials'},400);
   const jwt=fakeJwt(user.id,user.approved);
   tokenMap.set(jwt,user);
   return reply({access_token:jwt,user:{id:user.id,app_metadata:user.approved?{assembl_lab_pilot:'enabled'}:{}}});
  }
  const token=opts.headers?.authorization?.replace(/^Bearer /,'');
  const user=tokenMap.get(token);
  if(!user)return reply({code:'invalid_token'},401);
  if(path==='/auth/v1/logout'){
   logoutCount++;
   return reply({});
  }
  if(path==='/rest/v1/al_app_projects'){
   if(method==='POST'){
    const b=JSON.parse(opts.body);
    if(!user.approved||b.owner_id!==user.id)return reply({code:'42501'},403);
    projects.set(b.id,{id:b.id,owner:user.id});
    return reply([{id:b.id}],201);
   }
   const id=parsed.searchParams.get('id')?.replace(/^eq\./,'');
   const own=[...projects.values()].filter(x=>x.owner===user.id&&user.approved&&(!id||x.id===id));
   if(method==='GET')return reply(own.map(x=>({id:x.id})));
   if(method==='DELETE'){
    for(const x of own)projects.delete(x.id);
    return reply(own.map(x=>({id:x.id})));
   }
  }
  if(path==='/rest/v1/al_app_visualization_jobs'&&method==='POST'){
   if(failJob&&!jobFailed){jobFailed=true;return reply({code:'simulated_failure'},500)}
   const b=JSON.parse(opts.body);
   if(!user.approved||!projects.has(b.project_id)||projects.get(b.project_id).owner!==user.id)
     return reply({code:'42501'},403);
   return reply([{id:crypto.randomUUID(),project_id:b.project_id,status:'MOCK_READY',provider:'none'}],201);
  }
  throw new Error('Unexpected mock API route');
 }
 return {fetchImpl,projects,getLogoutCount:()=>logoutCount,getCalls:()=>rawCalls};
}
test('required phase and two independent secret-bearing test accounts',()=>{
 assert.equal(e2eConfiguration(env()).phase,'before_grant_b');
 assert.throws(()=>e2eConfiguration({}),/TEST_PHASE_REQUIRED/);
 assert.throws(()=>e2eConfiguration({...env(),AL_AUTH_B_EMAIL:'a@testing.invalid'}),/TWO_DISTINCT_TEST_USERS_REQUIRED/);
 assert.throws(()=>e2eConfiguration({...env(),AL_AUTH_A_PASSWORD:''}),/TWO_TEST_ACCOUNTS_REQUIRED/);
});
test('JWT claims parser rejects missing and invalid tokens',()=>{
 assert.equal(jwtClaimSummary(fakeJwt(A_ID,true)).pilot,true);
 assert.equal(jwtClaimSummary(fakeJwt(B_ID,false)).pilot,false);
 assert.throws(()=>jwtClaimSummary('bad-token'),/AUTH_INVALID_JWT_FORMAT/);
});
test('before B pilot grant, signed-in B is isolated and denied any write',async()=>{
 const mock=mockTransport();
 const out=await runRealAuthE2E({env:env('before_grant_b'),fetchImpl:mock.fetchImpl});
 assert.equal(out.status,'PASS');
 assert.equal(out.phase,'before_grant_b');
 assert.equal(out.mock_projects_created_and_deleted,1);
 assert.ok(out.checks.includes('UNAPPROVED_OWNER_B_RLS_DENIED'));
 assert.equal(mock.projects.size,0);
 assert.equal(mock.getLogoutCount(),2);
});
test('after granting B and refreshing JWT, each pilot has isolated owned rows',async()=>{
 const mock=mockTransport({grantB:true});
 const out=await runRealAuthE2E({env:env('after_grant_b'),fetchImpl:mock.fetchImpl});
 assert.equal(out.status,'PASS');
 assert.equal(out.mock_projects_created_and_deleted,2);
 assert.ok(out.checks.includes('TWO_APPROVED_OWNERS_ISOLATED'));
 assert.equal(mock.projects.size,0);
 assert.equal(mock.getLogoutCount(),2);
});
test('unsafe public signup halts before a single password is transmitted',async()=>{
 const mock=mockTransport({signupDisabled:false});
 await assert.rejects(()=>runRealAuthE2E({env:env(),fetchImpl:mock.fetchImpl}),
   /AUTH_PUBLIC_CONFIGURATION_NO_GO/);
 assert.equal(mock.getCalls(),1);
 assert.equal(mock.getLogoutCount(),0);
 assert.equal(mock.projects.size,0);
});
test('a failing mock job still releases created test projects and signs out',async()=>{
 const mock=mockTransport({failJob:true});
 await assert.rejects(()=>runRealAuthE2E({env:env(),fetchImpl:mock.fetchImpl}),/CREATE_MOCK_JOB_FAILED_500/);
 assert.equal(mock.projects.size,0);
 assert.equal(mock.getLogoutCount(),2);
});
test('phase-specific grants are required before DB mutation',async()=>{
 const mock=mockTransport({grantB:false});
 await assert.rejects(()=>runRealAuthE2E({env:env('after_grant_b'),fetchImpl:mock.fetchImpl}),/OWNER_B_GRANT_INCORRECT_FOR_PHASE/);
 assert.equal(mock.projects.size,0);
 assert.equal(mock.getLogoutCount(),2);
});
