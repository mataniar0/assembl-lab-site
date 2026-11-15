import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planSyntheticEdit,callLiveProvider,createDryRunLedger} from './synthetic-edit-plan.mjs';
import {assessImageReview,METRICS} from './evaluation.mjs';
const manifest=JSON.parse(readFileSync(new URL('../../app/preview-fixtures/manifest.json',import.meta.url)));
const fixture=manifest.fixtures[0];
const input=(overrides={})=>({
 sceneId:fixture.id,fixtureSha256:fixture.sha256,requestId:'dryrun_abcdefghijklmnop',
 mode:'DRY_RUN',sourceKind:'synthetic',
 review:{sceneId:fixture.id,position:52,scale:88,finish:'natural',drawers:1,view:'after'},
 ...overrides
});

test('default dry-run produces a safe summary with strictly zero traffic and cost',()=>{
 const r=planSyntheticEdit(input());
 assert.equal(r.mode,'DRY_RUN_ONLY');
 assert.equal(r.fixture.id,fixture.id);
 assert.equal(r.fixture.sha256,fixture.sha256);
 assert.equal(r.fixture.bytes,fixture.bytes);
 assert.equal(r.fixture.width,384);
 assert.equal(r.fixture.height,384);
 assert.match(r.intent_sha256,/^[a-f0-9]{64}$/);
 assert.equal(r.provider,'NOT_SELECTED');
 assert.equal(r.price_estimate_usd,null);
 assert.equal(r.approved_budget_usd,null);
 assert.equal(r.network_calls,0);
 assert.equal(r.paid_calls,0);
 assert.equal(r.sent_to_provider,false);
 assert.equal(r.image_output_generated,false);
 assert.equal(r.outcome,'UNASSESSED');
 assert.equal(r.engineering_approval,false);
 assert.equal(r.manufacturing_approval,false);
});

test('all five checked-in fixture SHA hashes are accepted without image transmission',()=>{
 for(const row of manifest.fixtures){
  const r=planSyntheticEdit(input({
    sceneId:row.id,fixtureSha256:row.sha256,review:{...input().review,sceneId:row.id}
  }));
  assert.equal(r.fixture.id,row.id);
  assert.doesNotMatch(JSON.stringify(r),/base64|image_bytes|image_data/);
 }
});

test('same fixture/design yields same digest; new design yields different digest',()=>{
 const a=planSyntheticEdit(input());
 const b=planSyntheticEdit(input());
 assert.equal(a.intent_sha256,b.intent_sha256);
 const c=planSyntheticEdit(input({review:{...input().review,drawers:2}}));
 assert.notEqual(a.intent_sha256,c.intent_sha256);
});

test('untrusted photo, free-text, credential, remote path and cost fields are refused',()=>{
 for(const [key,val] of Object.entries({
  photo_url:'https://example.invalid/room.png',
  image_base64:'secretbytes',
  access_token:'secret',
  budget_usd:12,
  provider:'gemini',
  user_notes:'my home address'
 })){
  assert.throws(()=>planSyntheticEdit(input({[key]:val})),/UNAPPROVED_REQUEST_FIELD/);
 }
});

test('non-whitelisted review notes and source fields are refused',()=>{
 for(const [key,val] of Object.entries({photo:'camera.jpg',notes:'private',
  room_photo:'x',user_metadata:{name:'somebody'},sourceKind:'real'})){
  if(key==='sourceKind')assert.throws(()=>planSyntheticEdit(input({sourceKind:'real'})),/NON_SYNTHETIC_SOURCE_DISABLED/);
  else assert.throws(()=>planSyntheticEdit(input({review:{...input().review,[key]:val}})),/UNAPPROVED_REVIEW_FIELD/);
 }
});

test('wrong manifest SHA, unknown scene and mismatched review ID fail closed',()=>{
 assert.throws(()=>planSyntheticEdit(input({fixtureSha256:'0'.repeat(64)})),/FIXTURE_SHA256_MISMATCH/);
 assert.throws(()=>planSyntheticEdit(input({sceneId:'SC-03'})),/SCENE_NOT_ALLOWLISTED/);
 assert.throws(()=>planSyntheticEdit(input({review:{...input().review,sceneId:'SC-04'}})),/REVIEW_SCENE_MISMATCH/);
});

test('no mode except DRY_RUN can ever be enabled',()=>{
 for(const mode of ['LIVE','PAID','TEST',null,undefined,'dry_run']){
  assert.throws(()=>planSyntheticEdit(input({mode})),/LIVE_PROVIDER_DISABLED/);
 }
 assert.throws(()=>callLiveProvider(),/LIVE_PROVIDER_DISABLED/);
 assert.throws(()=>callLiveProvider({ownerApproval:true,budget_usd:100}),/LIVE_PROVIDER_DISABLED/);
});

test('request idempotency key is required and restricted',()=>{
 for(const requestId of ['',undefined,'a','abc@example.test','../../private',42]){
  assert.throws(()=>planSyntheticEdit(input({requestId})),/INVALID_IDEMPOTENCY_KEY/);
 }
});

test('design limits and unsupported choices cannot slip through from invalid UI fields',()=>{
 for(const review of [
  {...input().review,position:200}, {...input().review,scale:Infinity},
  {...input().review,drawers:0}, {...input().review,finish:'custom'},
  {...input().review,view:'before'}, {...input().review,position:'51'}
 ]){
  assert.throws(()=>planSyntheticEdit(input({review})));
 }
});

test('source hash is immutable, no dynamic image URLs and no network functions exist',()=>{
 const src=readFileSync(new URL('./synthetic-edit-plan.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/\bfetch\s*\(|XMLHttpRequest|https\.request|http\.request|WebSocket\s*\(|\bdynamicImport\b/);
 assert.doesNotMatch(src,/service_role|sb_secret_|process\.env\./);
 assert.equal(planSyntheticEdit(input()).fixture.sha256,fixture.sha256);
});

test('untrusted scalar and prototype inputs are rejected before file I/O',()=>{
 assert.throws(()=>planSyntheticEdit(null),/UNAPPROVED_REQUEST_FIELD/);
 assert.throws(()=>planSyntheticEdit([]),/UNAPPROVED_REQUEST_FIELD/);
 assert.throws(()=>planSyntheticEdit(input({review:[]})),/UNAPPROVED_REVIEW_FIELD/);
 assert.throws(()=>planSyntheticEdit(input({review:null})),/UNAPPROVED_REVIEW_FIELD/);
});

test('existing room fixture bytes are never present in returned plan',()=>{
 const summary=JSON.stringify(planSyntheticEdit(input()));
 assert.ok(summary.length<1400);
 assert.doesNotMatch(summary,/iVBORw0KGgo/);
 assert.doesNotMatch(summary,/request_prompt|photo_url|input_data|personal/);
});

test('human scoring remains UNASSESSED without real image output evidence',()=>{
 assert.equal(assessImageReview(null).status,'UNASSESSED');
 assert.equal(assessImageReview({scores:{}}).status,'UNASSESSED');
 assert.equal(assessImageReview({
  evidence_kind:'DRY_RUN',generated_image_sha256:'a'.repeat(64),
  scores:Object.fromEntries(METRICS.map(k=>[k,5])),reviewer_tag:'reviewer-test',notes:'Mock content'
 }).status,'UNASSESSED');
});

test('fabricated output hash and scores cannot approve image in offline stage',()=>{
 const record={evidence_kind:'HUMAN_REVIEW_OF_GENERATED_IMAGE',
 generated_image_sha256:'a'.repeat(64),reviewer_tag:'reviewer-test',
 notes:'Imaginary file reviewed',scores:Object.fromEntries(METRICS.map(k=>[k,5]))};
 const result=assessImageReview(record);
 assert.equal(result.status,'UNASSESSED');
 assert.equal(result.reason,'VERIFIED_PROVIDER_OUTPUT_REQUIRED');
 assert.equal(result.score,null);
 assert.equal(result.requires_verified_output,true);
 assert.equal(result.requires_independent_review,true);
 assert.equal(result.engineering_approval,false);
 assert.equal(result.manufacturing_approval,false);
});

test('invalid numeric scores or scores missing any required metric remain unassessed',()=>{
 const valid=Object.fromEntries(METRICS.map(k=>[k,5]));
 const basic={evidence_kind:'HUMAN_REVIEW_OF_GENERATED_IMAGE',
  generated_image_sha256:'a'.repeat(64),reviewer_tag:'reviewer-test',
  notes:'Image visually assessed',scores:valid};
 const bad={...valid,[METRICS[0]]:5.5};
 assert.equal(assessImageReview({...basic,scores:bad}).status,'UNASSESSED');
 assert.equal(assessImageReview({...basic,scores:{room_geometry:5}}).status,'UNASSESSED');
 assert.equal(assessImageReview({...basic,scores:bad}).reason,'MISSING_OR_INVALID_REVIEW');
 assert.equal(assessImageReview({...basic,scores:valid}).reason,'VERIFIED_PROVIDER_OUTPUT_REQUIRED');
});

test('memory-only ledger replays identical plans without submitting a request',()=>{
 const ledger=createDryRunLedger();
 const plan=planSyntheticEdit(input());
 assert.deepEqual(ledger.accept(plan),{replayed:false,submitted:false,paid_calls:0});
 assert.deepEqual(ledger.accept(plan),{replayed:true,submitted:false,paid_calls:0});
});
test('idempotency key reuse with changed design or different fixture fails closed',()=>{
 const ledger=createDryRunLedger();
 ledger.accept(planSyntheticEdit(input()));
 const changed=planSyntheticEdit(input({review:{...input().review,drawers:2}}));
 assert.throws(()=>ledger.accept(changed),/IDEMPOTENCY_CONFLICT/);
 const row=manifest.fixtures[1];
 const other=planSyntheticEdit(input({sceneId:row.id,fixtureSha256:row.sha256,
  review:{...input().review,sceneId:row.id}}));
 assert.throws(()=>ledger.accept(other),/IDEMPOTENCY_CONFLICT/);
});
test('ledger never accepts a fabricated billable or network plan',()=>{
 const ledger=createDryRunLedger();
 const plan=planSyntheticEdit(input());
 for(const change of [{sent_to_provider:true},{network_calls:1},{paid_calls:1},{mode:'LIVE'}]){
  assert.throws(()=>ledger.accept({...plan,...change}),/INVALID_OFFLINE_PLAN/);
 }
});

test('offline module cannot emit a PASS or candidate decision',()=>{
 const source=readFileSync(new URL('./evaluation.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/status\\s*:\\s*['"]REVIEW_CANDIDATE['"]/);
 assert.doesNotMatch(source,/status\\s*:\\s*['"]PASS['"]/);
});
