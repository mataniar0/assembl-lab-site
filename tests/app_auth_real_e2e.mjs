/* ASSEMBL LAB — DEV-ONLY real GoTrue/JWT and PostgREST ownership audit.
 * Requires two accounts created by the project administrator OUTSIDE this script.
 * Credentials are read from ephemeral process environment; NEVER logged, stored,
 * sent to GitHub, written to files, or embedded in test artifacts.
 * Creates/deletes synthetic-only projects. Does NOT sign up, invite, change
 * app_metadata, upload media, call AI, or access the service_role key.
 *
 * AL_AUTH_PHASE=before_grant_b | after_grant_b
 * AL_AUTH_A_EMAIL, AL_AUTH_A_PASSWORD, AL_AUTH_B_EMAIL, AL_AUTH_B_PASSWORD
 *
 * BEFORE: A has app_metadata.assembl_lab_pilot=enabled; B has no grant.
 * AFTER: B has also been approved and signed in with a FRESH JWT.
 */
import {CONFIG,syntheticFixture} from '../app/cloud-api-core.mjs';
import {auditPublicAuthSettings} from './app_auth_server_readiness.mjs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const phaseNames=new Set(['before_grant_b','after_grant_b']);
const allowedProject='widfojfysblgbwswmigq';

export function e2eConfiguration(env=process.env){
  const phase=env.AL_AUTH_PHASE;
  if(!phaseNames.has(phase))throw new Error('TEST_PHASE_REQUIRED');
  const a={email:env.AL_AUTH_A_EMAIL,password:env.AL_AUTH_A_PASSWORD};
  const b={email:env.AL_AUTH_B_EMAIL,password:env.AL_AUTH_B_PASSWORD};
  for(const x of [a,b]){
    if(typeof x.email!=='string'||!x.email.includes('@')||
       typeof x.password!=='string'||x.password.length<8)
      throw new Error('TWO_TEST_ACCOUNTS_REQUIRED');
  }
  if(a.email.toLowerCase()===b.email.toLowerCase())
    throw new Error('TWO_DISTINCT_TEST_USERS_REQUIRED');
  if(!CONFIG.endpoint.includes(allowedProject))throw new Error('DEV_PROJECT_REQUIRED');
  return {phase,a,b};
}

function stop(code){throw new Error(code);}
function authHeaders(token=null,extra={}){
  return {apikey:CONFIG.publishableKey,accept:'application/json',
    ...(token?{authorization:'Bearer '+token}:{}),...extra};
}
export function jwtClaimSummary(jwt){
  if(typeof jwt!=='string'||jwt.split('.').length!==3)stop('AUTH_INVALID_JWT_FORMAT');
  let claims;
  try{claims=JSON.parse(Buffer.from(jwt.split('.')[1],'base64url').toString('utf8'))}
  catch{stop('AUTH_INVALID_JWT_CLAIMS')}
  if(!claims||typeof claims.sub!=='string'||!uuid.test(claims.sub)||
     claims.role!=='authenticated')stop('AUTH_UNEXPECTED_JWT_CLAIMS');
  // Never return or log the original JWT or identity.
  return {sub:claims.sub,role:claims.role,pilot:claims.app_metadata?.assembl_lab_pilot==='enabled'};
}

export function makeRestHarness({fetchImpl=fetch}={}){
  const base=CONFIG.endpoint;
  async function perform(path,{method='GET',token,body,prefer}={}){
    if(typeof path!=='string'||!path.startsWith('/'))stop('BAD_ENDPOINT');
    const h=authHeaders(token,body===undefined?{}:{'content-type':'application/json'});
    if(prefer)h.prefer=prefer;
    const response=await fetchImpl(base+path,{method,headers:h,cache:'no-store',
      credentials:'omit',redirect:'error',
      ...(body===undefined?{}:{body:JSON.stringify(body)}),
      signal:AbortSignal.timeout(12000)});
    const text=await response.text();
    let data=null;
    try{data=text?JSON.parse(text):null}catch{stop('UNEXPECTED_PROVIDER_RESPONSE')}
    return {status:response.status,data};
  }
  async function login(account){
    const out=await perform('/auth/v1/token?grant_type=password',{method:'POST',
      body:{email:account.email,password:account.password}});
    if(out.status!==200||typeof out.data?.access_token!=='string')stop('AUTH_LOGIN_FAILED_'+out.status);
    const claims=jwtClaimSummary(out.data.access_token);
    if(out.data.user?.id!==claims.sub)stop('AUTH_USER_JWT_MISMATCH');
    return {id:claims.sub,pilot:claims.pilot,token:out.data.access_token};
  }
  async function list(token,id){
    const r=await perform('/rest/v1/al_app_projects?select=id&id=eq.'+id,{token});
    if(r.status!==200||!Array.isArray(r.data))stop('PROJECT_SELECT_FAILED_'+r.status);
    return r.data;
  }
  async function createProject(s){
    const r=await perform('/rest/v1/al_app_projects?select=id',{method:'POST',
      token:s.token,prefer:'return=representation',
      body:{owner_id:s.id,source_kind:'synthetic',design_intent:syntheticFixture()}});
    if(r.status!==201||!uuid.test(r.data?.[0]?.id||''))stop('CREATE_SYNTHETIC_PROJECT_FAILED_'+r.status);
    return r.data[0].id;
  }
  async function createMockJob(s,id){
    const r=await perform('/rest/v1/al_app_visualization_jobs?select=id,project_id,status,provider',{
      method:'POST',token:s.token,prefer:'return=representation',
      body:{owner_id:s.id,project_id:id,source_kind:'synthetic',
        idempotency_key:'e2e_'+crypto.randomUUID().replaceAll('-',''),
        status:'MOCK_READY',provider:'none'}});
    if(r.status!==201||r.data?.[0]?.status!=='MOCK_READY'||r.data?.[0]?.provider!=='none')
      stop('CREATE_MOCK_JOB_FAILED_'+r.status);
  }
  async function deleteProject(s,id){
    const r=await perform('/rest/v1/al_app_projects?id=eq.'+id+'&select=id',{
      method:'DELETE',token:s.token,prefer:'return=representation'});
    if(r.status!==200||r.data?.[0]?.id!==id)stop('CLEANUP_PROJECT_FAILED_'+r.status);
  }
  async function logout(s){
    const r=await perform('/auth/v1/logout',{method:'POST',token:s.token});
    if(![200,204].includes(r.status))stop('LOGOUT_FAILED_'+r.status);
  }
  return {perform,login,list,createProject,createMockJob,deleteProject,logout};
}

export async function runRealAuthE2E({env=process.env,fetchImpl=fetch}={}){
  const config=e2eConfiguration(env);
  // No credentials are sent until the public configuration is safe.
  const publicFlags=await auditPublicAuthSettings({fetchImpl});
  if(publicFlags.status!=='PASS')stop('AUTH_PUBLIC_CONFIGURATION_NO_GO');
  const api=makeRestHarness({fetchImpl});
  const sessions=[],created=[];
  const checks=[];
  const record=s=>checks.push(s);
  let primaryError=null;
  try{
    const A=await api.login(config.a);sessions.push(A);
    const B=await api.login(config.b);sessions.push(B);
    if(A.id===B.id)stop('IDENTICAL_AUTH_USERS');
    if(!A.pilot)stop('OWNER_A_NOT_APPROVED');
    if(B.pilot!==(config.phase==='after_grant_b'))stop('OWNER_B_GRANT_INCORRECT_FOR_PHASE');
    record('AUTH_TWO_REAL_JWTS_ISSUED');

    const denied=await api.perform('/rest/v1/al_app_projects?select=id',{token:'not.a.jwt'});
    if(![401,403].includes(denied.status))stop('INVALID_JWT_WAS_ACCEPTED');
    record('INVALID_JWT_DENIED');

    const aProject=await api.createProject(A);created.push({session:A,id:aProject});
    await api.createMockJob(A,aProject);
    if((await api.list(A.token,aProject)).length!==1)stop('OWNER_A_CANNOT_READ_OWN');
    record('OWNER_A_CREATE_READ_MOCK_JOB');

    if((await api.list(B.token,aProject)).length!==0)stop('OWNER_B_READ_OWNER_A');
    const crossDelete=await api.perform('/rest/v1/al_app_projects?id=eq.'+aProject+'&select=id',{
      method:'DELETE',token:B.token,prefer:'return=representation'});
    if(!([200,403].includes(crossDelete.status))||crossDelete.data?.length>0)
      stop('OWNER_B_CROSS_DELETE_ALLOWED');
    if((await api.list(A.token,aProject)).length!==1)stop('CROSS_DELETE_REMOVED_A');
    record('CROSS_OWNER_READ_DELETE_DENIED');

    if(config.phase==='before_grant_b'){
      const attempt=await api.perform('/rest/v1/al_app_projects?select=id',{
        method:'POST',token:B.token,prefer:'return=representation',
        body:{owner_id:B.id,source_kind:'synthetic',design_intent:syntheticFixture()}});
      if(![401,403].includes(attempt.status))stop('UNAPPROVED_OWNER_B_WRITE_ALLOWED');
      record('UNAPPROVED_OWNER_B_RLS_DENIED');
    }else{
      const bProject=await api.createProject(B);created.push({session:B,id:bProject});
      await api.createMockJob(B,bProject);
      if((await api.list(B.token,bProject)).length!==1)stop('OWNER_B_CANNOT_READ_OWN');
      if((await api.list(A.token,bProject)).length!==0)stop('OWNER_A_READ_OWNER_B');
      record('TWO_APPROVED_OWNERS_ISOLATED');
    }
  }catch(e){primaryError=e}
  const cleanupErrors=[];
  for(const item of created.reverse()){
    try{await api.deleteProject(item.session,item.id)}
    catch{cleanupErrors.push('CLEANUP_FAILED_FOR_TEST_CREATED_PROJECT')}
  }
  for(const session of sessions){
    try{await api.logout(session)}
    catch{cleanupErrors.push('AUTH_LOGOUT_FAILED')}
  }
  if(cleanupErrors.length)stop(cleanupErrors.join(','));
  if(primaryError)throw primaryError;
  return Object.freeze({
    status:'PASS',phase:config.phase,
    authenticated_distinct_users:2,
    real_auth_jwts:true,server_rls_verified:true,
    mock_projects_created_and_deleted:created.length,
    uploaded_images:0,ai_calls:0,
    secrets_logged:false,jwts_logged:false,
    checks:Object.freeze(checks),
    note:'LIVE_DEV_TEST_ONLY'
  });
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  runRealAuthE2E().then(report=>process.stdout.write(JSON.stringify(report,null,2)+'\n'))
    .catch(error=>{
      // Never include email, password, JWT, response body or request URL.
      process.stderr.write('DEV Auth E2E NO_GO: '+error.message+'\n');
      process.exitCode=1;
    });
}
