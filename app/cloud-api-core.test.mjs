import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CONFIG,canonicalSyntheticIntent,syntheticFixture,createCloudClient,CloudApiError} from './cloud-api-core.mjs';

const USER='11111111-1111-4111-8111-111111111111';
const PROJECT='22222222-2222-4222-8222-222222222222';
const JOB='33333333-3333-4333-8333-333333333333';
const token='a'.repeat(90);
const session={access_token:token,user:{id:USER},expires_at:Math.floor(Date.now()/1000)+1800};
function mock(payload,status=200){
  const calls=[];
  const fetchImpl=async(url,request)=>{
    calls.push({url,request,body:request.body?JSON.parse(request.body):undefined});
    const value=typeof payload==='function'?payload(url,request):payload;
    return {ok:status>=200&&status<300,status,json:async()=>value};
  };
  return {calls,cloud:createCloudClient({fetchImpl})};
}

test('development credentials contain only the publishable key',()=>{
  assert.match(CONFIG.publishableKey,/^sb_publishable_/);
  assert.doesNotMatch(CONFIG.publishableKey,/service_role|sb_secret_/);
  assert.match(CONFIG.endpoint,/^https:\/\/widfojfysblgbwswmigq\.supabase\.co$/);
});
test('canonical synthetic nightstand strips real room photos, user notes and arbitrary metadata',()=>{
  const actual=syntheticFixture();
  actual.appearance.notes='my home address';
  actual.room_photo='base64: PRIVATE PHOTO';
  actual.photo_url='https://private.invalid/photo';
  actual.extra_contact='private@example.test';
  const safe=canonicalSyntheticIntent(actual),json=JSON.stringify(safe);
  assert.equal(safe.appearance.notes,'');
  assert.equal(safe.photo_included,false);
  assert.doesNotMatch(json,/private|address|room_photo|contact|photo_url/);
});
test('canonical preserves supported dimensions and technical preferences only',()=>{
  const d=canonicalSyntheticIntent(syntheticFixture());
  assert.equal(d.requested_dimensions_mm.width,500);
  assert.equal(d.requested_dimensions_mm.height,550);
  assert.equal(d.requested_dimensions_mm.depth,350);
  assert.equal(d.appearance.drawers,1);
  assert.equal(d.construction_preferences.nominal_thickness_mm,6);
});
test('canonical rejects out-of-range real-world parameters',()=>{
  const d=syntheticFixture();
  assert.throws(()=>canonicalSyntheticIntent({...d,requested_dimensions_mm:{...d.requested_dimensions_mm,width:5000}}),/INVALID_SYNTHETIC_NIGHTSTAND/);
});
test('canonical rejects unsupported furniture',()=>{
  assert.throws(()=>canonicalSyntheticIntent({...syntheticFixture(),category:'crib'}),/INVALID_SYNTHETIC_NIGHTSTAND/);
});
test('canonical rejects 8mm material for limited pilot',()=>{
  assert.throws(()=>canonicalSyntheticIntent({...syntheticFixture(),construction_preferences:{nominal_thickness_mm:8}}),/INVALID_SYNTHETIC_NIGHTSTAND/);
});
test('register uses Supabase Auth endpoint and never appends email to URL',async()=>{
  const {cloud,calls}=mock({id:USER,access_token:null});
  const result=await cloud.register('dev@example.test','a very long password');
  assert.equal(result.confirmation_required,true);
  assert.match(calls[0].url,/\/auth\/v1\/signup$/);
  assert.equal(calls[0].body.email,'dev@example.test');
  assert.equal(calls[0].request.headers.apikey,CONFIG.publishableKey);
  assert.equal(calls[0].request.credentials,'omit');
  assert.equal(calls[0].request.cache,'no-store');
  assert.ok(!calls[0].url.includes('dev@example.test'));
});
test('sign in yields ephemeral session from Auth response',async()=>{
  const {cloud,calls}=mock({access_token:token,user:{id:USER},expires_in:3600});
  const result=await cloud.signIn('dev@example.test','a very long password');
  assert.equal(result.user.id,USER);
  assert.equal(result.access_token,token);
  assert.match(calls[0].url,/\/auth\/v1\/token\?grant_type=password$/);
});
test('sign in rejects insufficient Auth response',async()=>{
  const {cloud}=mock({access_token:'bad',user:{id:'wrong'}});
  await assert.rejects(()=>cloud.signIn('dev@example.test','secretpw'),/SESSION_REQUIRED/);
});
test('create project sends owner-scoped, strictly synthetic JSON with no notes or photo',async()=>{
  const {cloud,calls}=mock([{id:PROJECT,created_at:'2026-11-15T10:00:00Z'}]);
  const input=syntheticFixture();
  input.appearance.notes='do not upload';
  input.photo='raw image';
  const project=await cloud.createProject(session,input);
  assert.equal(project.id,PROJECT);
  const body=calls[0].body;
  assert.equal(body.owner_id,USER);
  assert.equal(body.source_kind,'synthetic');
  assert.equal(body.design_intent.appearance.notes,'');
  assert.equal(body.design_intent.photo_included,false);
  assert.doesNotMatch(JSON.stringify(body),/raw image|do not upload/);
  assert.equal(calls[0].request.headers.authorization,'Bearer '+token);
  assert.equal(calls[0].request.headers.prefer,'return=representation');
  assert.match(calls[0].url,/\/rest\/v1\/al_app_projects\?select=/);
});
test('create project without login never sends network request',async()=>{
  const {cloud,calls}=mock([{id:PROJECT}]);
  await assert.rejects(()=>cloud.createProject(null,syntheticFixture()),/SESSION_REQUIRED/);
  assert.equal(calls.length,0);
});
test('expired token blocks requests before fetch',async()=>{
  const {cloud,calls}=mock([]);
  await assert.rejects(()=>cloud.listProjects({...session,expires_at:1}),/SESSION_EXPIRED/);
  assert.equal(calls.length,0);
});
test('list projects uses RLS-protected REST endpoint',async()=>{
  const {cloud,calls}=mock([{id:PROJECT,created_at:'2026-11-15T10:00:00Z'}]);
  const values=await cloud.listProjects(session);
  assert.equal(values.length,1);
  assert.match(calls[0].url,/\/rest\/v1\/al_app_projects\?select=/);
  assert.equal(calls[0].request.method,'GET');
});
test('create job sends only mock status and no provider invocation',async()=>{
  const {cloud,calls}=mock([{id:JOB,project_id:PROJECT,status:'MOCK_READY',provider:'none'}]);
  const job=await cloud.createJob(session,PROJECT,'job_0123456789abcdef');
  assert.equal(job.status,'MOCK_READY');
  assert.equal(calls[0].body.owner_id,USER);
  assert.equal(calls[0].body.source_kind,'synthetic');
  assert.equal(calls[0].body.provider,'none');
  assert.equal(calls[0].request.method,'POST');
  assert.match(calls[0].url,/al_app_visualization_jobs/);
});
test('job creation with malformed id never calls server',async()=>{
  const {cloud,calls}=mock([]);
  await assert.rejects(()=>cloud.createJob(session,'bad-id','job_0123456789abcdef'),/INVALID_PROJECT_OR_REQUEST/);
  assert.equal(calls.length,0);
});
test('delete project uses authenticated owner filter and delete method',async()=>{
  const {cloud,calls}=mock([{id:PROJECT}]);
  assert.equal(await cloud.deleteProject(session,PROJECT),true);
  assert.match(calls[0].url,new RegExp('id=eq\\.'+PROJECT));
  assert.match(calls[0].url,new RegExp('owner_id=eq\\.'+USER));
  assert.equal(calls[0].request.method,'DELETE');
});
test('server errors remain code-only and are not echoed into HTML',async()=>{
  const {cloud}=mock({code:'PGRST301',message:'sensitive SQL details'},401);
  await assert.rejects(()=>cloud.listProjects(session),e=>e instanceof CloudApiError&&e.status===401&&e.message==='PGRST301');
});
test('sign out uses bearer authorization only',async()=>{
  const {cloud,calls}=mock({});
  await cloud.signOut(session);
  assert.match(calls[0].url,/\/auth\/v1\/logout$/);
  assert.equal(calls[0].request.headers.authorization,'Bearer '+token);
});
test('cloud lab is independent from room camera and no third-party code is loaded',()=>{
  const html=readFileSync(new URL('./cloud-dev.html',import.meta.url),'utf8');
  const ui=readFileSync(new URL('./cloud-dev.js',import.meta.url),'utf8');
  assert.match(html,/connect-src https:\/\/widfojfysblgbwswmigq\.supabase\.co/);
  assert.match(html,/script-src 'self'/);
  assert.match(html,/src="\.\/cloud-dev\.js"/);
  assert.doesNotMatch(html,/<input[^>]*type=["']file/);
  assert.doesNotMatch(ui,/\blocalStorage\b.*setItem/);
  assert.doesNotMatch(ui,/image_base64|room_photo|photo_url/);
});
test('service worker only writes index.html cache for main app, never cloud lab',()=>{
  const sw=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
  assert.match(sw,/const isMainApp=path===scopePath\|\|path===scopePath\+'index.html'/);
  assert.match(sw,/if\(isMainApp\)\{/);
  assert.match(sw,/event.respondWith\(fetch\(request\)\);return;/);
});
test('main inline CSP hash and script are unchanged',()=>{
  const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  const base=createHash('sha256').update(script,'utf8').digest('base64');
  assert.equal(base,'GBnlKux09VbgrayAnLRJMrWvjFuJ9hF2QuT9vewZR6U=');
});
