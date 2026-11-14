import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseAction,sanitizeSyntheticIntent,validateUuid,validateKey} from './synthetic-logic.mjs';

const fixture=JSON.parse(readFileSync(new URL('../../../prototype/app-mvp-03/synthetic-intent.json',import.meta.url),'utf8'));
const project='00000000-0000-4000-8000-000000000011';

test('valid design intent maps to whitelist and stays synthetic',()=>{
  const result=sanitizeSyntheticIntent(fixture);
  assert.equal(result.category,'freestanding_nightstand');
  assert.equal(result.photo_included,false);
  assert.equal(result.manufacturing_approval,false);
  assert.equal(result.engineering_approval,false);
  assert.equal(result.appearance.drawers,1);
});
test('unknown nested metadata and arbitrary image payloads are not persisted',()=>{
  const result=sanitizeSyntheticIntent({...fixture,extensions:{private_base64:'should_disappear'},appearance:{...fixture.appearance,photo:'should_disappear'}});
  assert.equal(result.extensions,undefined);
  assert.equal(result.appearance.photo,undefined);
  assert.doesNotMatch(JSON.stringify(result),/should_disappear/);
});
test('top-level image data in intent rejected',()=>{
  assert.throws(()=>sanitizeSyntheticIntent({...fixture,image_base64:'not-real'}),/IMAGE_FIELDS_NOT_ALLOWED/);
});
test('payload-level photograph explicitly rejected',()=>{
  assert.throws(()=>parseAction({action:'create_project',source_kind:'synthetic',design_intent:fixture,photo_url:'https://test.invalid/photo'}),/IMAGE_FIELDS_NOT_ALLOWED/);
});
test('non-synthetic source explicitly rejected',()=>{
  assert.throws(()=>parseAction({action:'create_project',source_kind:'user-consented',design_intent:fixture}),/SYNTHETIC_ONLY/);
});
test('unknown source and missing source are not accepted for project creation',()=>{
  assert.throws(()=>parseAction({action:'create_project',design_intent:fixture}),/SYNTHETIC_ONLY/);
});
test('invalid width (outside envelope) is rejected',()=>{
  assert.throws(()=>sanitizeSyntheticIntent({...fixture,requested_dimensions_mm:{...fixture.requested_dimensions_mm,width:901}}),/INVALID_DIMENSIONS/);
});
test('nonfinite values are rejected',()=>{
  assert.throws(()=>sanitizeSyntheticIntent({...fixture,requested_dimensions_mm:{...fixture.requested_dimensions_mm,depth:Infinity}}),/INVALID_DIMENSIONS/);
});
test('unsupported material rejected',()=>{
  assert.throws(()=>sanitizeSyntheticIntent({...fixture,construction_preferences:{material:'steel',nominal_thickness_mm:6}}),/UNSUPPORTED_MATERIAL/);
});
test('unsupported furniture rejected',()=>{
  assert.throws(()=>sanitizeSyntheticIntent({...fixture,category:'crib'}),/UNSUPPORTED_INTENT_SCHEMA/);
});
test('unsupported drawer count rejected',()=>{
  assert.throws(()=>sanitizeSyntheticIntent({...fixture,appearance:{...fixture.appearance,drawers:15}}),/INVALID_APPEARANCE/);
});
test('overlong notes are rejected',()=>{
  assert.throws(()=>sanitizeSyntheticIntent({...fixture,appearance:{...fixture.appearance,notes:'a'.repeat(501)}}),/NOTES_TOO_LONG/);
});
test('projection beyond provisional preview range uses safe defaults',()=>{
  const intent=sanitizeSyntheticIntent({...fixture,placement_preview:{relative_scale:999,horizontal_position_percent:-100}});
  assert.equal(intent.placement_preview.relative_scale,88);
  assert.equal(intent.placement_preview.horizontal_position_percent,52);
});
test('create_project emits canonical snapshot',()=>{
  const action=parseAction({action:'create_project',source_kind:'synthetic',design_intent:fixture});
  assert.equal(action.action,'create_project');
  assert.equal(action.design_intent.photo_included,false);
});
test('create_job validates project and idempotency key',()=>{
  const action=parseAction({action:'create_job',project_id:project,idempotency_key:'synthetic_request_00001'});
  assert.equal(action.project_id,project);
});
test('invalid project identifiers rejected',()=>{
  assert.throws(()=>validateUuid('../other-user'),/INVALID_IDENTIFIER/);
  assert.throws(()=>validateKey('short'),/INVALID_REQUEST_KEY/);
});
test('lookup and deletion actions validate UUID',()=>{
  assert.equal(parseAction({action:'get_job',job_id:project}).job_id,project);
  assert.equal(parseAction({action:'delete_project',project_id:project}).project_id,project);
});
test('arbitrary actions cannot invoke unapproved pipeline',()=>{
  assert.throws(()=>parseAction({action:'generate_real_ai',source_kind:'synthetic'}),/UNKNOWN_ACTION/);
});
test('migration contains owner RLS, private buckets and no public storage policy',()=>{
  const sql=readFileSync(new URL('../../migrations/20261114224500_app_synthetic_private_baseline.sql',import.meta.url),'utf8');
  assert.match(sql,/alter table public\.al_app_projects enable row level security/i);
  assert.match(sql,/alter table public\.al_app_visualization_jobs enable row level security/i);
  assert.match(sql,/using \(owner_id = \(select auth\.uid\(\)\)\)/i);
  assert.match(sql,/\('al-app-room-inputs', 'al-app-room-inputs', false, 5242880/i);
  assert.doesNotMatch(sql,/create policy [^;]* on storage\.objects/gi);
  assert.match(sql,/check \(status = 'MOCK_READY'\)/i);
  assert.match(sql,/constraint al_app_job_unique_request unique \(owner_id, idempotency_key\)/i);
});
test('Edge Function uses user JWT and RLS-scoped client, not admin',()=>{
  const ts=readFileSync(new URL('./index.ts',import.meta.url),'utf8');
  assert.match(ts,/withSupabase\(\{auth:'user'\}/);
  assert.match(ts,/const client=ctx\.supabase;/);
  assert.doesNotMatch(ts,/const client=ctx\.supabaseAdmin;/);
  assert.match(ts,/owner=ctx\.userClaims\?\.id/);
});
