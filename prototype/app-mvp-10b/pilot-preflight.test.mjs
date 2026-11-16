import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareFirstSyntheticPilot,dispatchProviderCall,reservePaidQuota,
  QUOTE,MODEL,SOURCE_SCENE,RESOLUTION_PX,BLOCKERS} from './pilot-preflight.mjs';

const manifest=JSON.parse(readFileSync(new URL('../../app/preview-fixtures/manifest.json',import.meta.url),'utf8'));
const sc01=manifest.fixtures.find(s=>s.id==='SC-01');
function request(overrides={}){
  return {
    sceneId:SOURCE_SCENE,fixtureSha256:sc01.sha256,
    requestId:'mvp10b_sc01_abcdefghijklmnop',
    mode:'DRY_RUN',sourceKind:'synthetic',model:MODEL,
    resolutionPx:RESOLUTION_PX,requestedCalls:1,
    review:{sceneId:'SC-01',position:52,scale:88,finish:'natural',
      drawers:1,view:'after'},...overrides
  };
}
test('the first pilot produces only a blocked, immutable and safely quoted plan',()=>{
  const p=prepareFirstSyntheticPilot(request());
  assert.equal(p.status,'NO_GO');
  assert.equal(p.mode,'PREPARE_ONLY');
  assert.equal(p.eligible_for_paid_execution,false);
  assert.equal(p.approved_paid_calls,0);
  assert.equal(p.charged_calls,0);
  assert.equal(p.output_image_generated,false);
  assert.equal(p.paid_budget_approval,'NOT_GRANTED');
  assert.equal(p.server_atomic_reservation,'NOT_IMPLEMENTED');
  assert.equal(p.request.provider_request_sent,false);
  assert.equal(p.request.contains_image_bytes,false);
  assert.equal(p.request.contains_api_key,false);
  assert.equal(p.request.output_count_target,1);
  assert.equal(p.request.auto_retries,0);
  assert.equal(p.request.route,'/v1beta/interactions');
  assert.equal(p.request.source_sha256,sc01.sha256);
  assert.ok(Object.isFrozen(p));
  assert.ok(Object.isFrozen(p.request));
  assert.ok(Object.isFrozen(p.pending_gates));
});
test('price quote is a reference, never an approved or enforceable final cost',()=>{
  const r=prepareFirstSyntheticPilot(request());
  assert.equal(r.estimated_cost,QUOTE);
  assert.equal(QUOTE.model_docs.includes('gemini-3.1-flash-lite-image'),true);
  assert.equal(QUOTE.output_image_1k_reference_usd,0.0336);
  assert.equal(QUOTE.input_per_million_tokens_usd,0.25);
  assert.equal(QUOTE.price_includes_input,false);
  assert.equal(QUOTE.quote_is_enforceable_cap,false);
  assert.equal(QUOTE.estimated_total_usd,null);
  assert.equal(QUOTE.estimated_worst_case_usd,null);
});
test('all prerequisites remain NO_GO and cannot be bypassed from request options',()=>{
  const r=prepareFirstSyntheticPilot(request());
  assert.deepEqual(r.pending_gates,BLOCKERS);
  assert.ok(r.pending_gates.includes('OWNER_BUDGET_NOT_APPROVED'));
  assert.ok(r.pending_gates.includes('REAL_SUPABASE_AUTH_JWT_E2E_NOT_VERIFIED'));
  assert.ok(r.pending_gates.includes('HARD_SERVER_BUDGET_RESERVATION_NOT_IMPLEMENTED'));
  for(const prop of ['ownerApproved','authVerified','ignoreGates','paidBudgetUsd',
    'apiKey','serviceRoleKey','uploadUrl','customerPhoto','providerRequest','hardBudgetCap']){
    assert.throws(()=>prepareFirstSyntheticPilot(request({[prop]:true})),
      /UNAPPROVED_PILOT_INPUT/);
  }
});
test('accepts only first approved fixture with exact digest and review match',()=>{
  assert.throws(()=>prepareFirstSyntheticPilot(request({sceneId:'SC-02'})),/ONLY_SC01_ALLOWED/);
  assert.throws(()=>prepareFirstSyntheticPilot(request({fixtureSha256:'0'.repeat(64)})),/FIXTURE_SHA256_MISMATCH/);
  assert.throws(()=>prepareFirstSyntheticPilot(request({review:{...request().review,sceneId:'SC-02'}})),/REVIEW_SCENE_MISMATCH/);
});
test('rejects real photos and every non-dry-run or non-image editing mode',()=>{
  for(const mode of ['LIVE','TEST_LIVE','PAID',null,undefined]){
    assert.throws(()=>prepareFirstSyntheticPilot(request({mode})),/LIVE_REQUESTS_DISABLED/);
  }
  assert.throws(()=>prepareFirstSyntheticPilot(request({sourceKind:'camera'})),/CUSTOMER_MEDIA_DISABLED/);
  assert.throws(()=>prepareFirstSyntheticPilot(request({sourceKind:'real'})),/CUSTOMER_MEDIA_DISABLED/);
});
test('refuses unknown models, resolutions, retry counts, and arbitrary call limits',()=>{
  assert.throws(()=>prepareFirstSyntheticPilot(request({model:'gemini-3.1-flash-image'})),/UNSUPPORTED_PROVIDER_MODEL/);
  assert.throws(()=>prepareFirstSyntheticPilot(request({model:'free'})),/UNSUPPORTED_PROVIDER_MODEL/);
  for(const resolutionPx of [512,2048,4096,0,1024.5,'1024']){
    assert.throws(()=>prepareFirstSyntheticPilot(request({resolutionPx})),/ONLY_1K_OUTPUT_ALLOWED/);
  }
  for(const requestedCalls of [0,2,99,1.5,'1']){
    assert.throws(()=>prepareFirstSyntheticPilot(request({requestedCalls})),/ONE_CALL_MAX/);
  }
});
test('nested invalid review fields and sensitive free text are refused',()=>{
  for(const [k,v] of Object.entries({notes:'Home near the park',imageData:'base64',url:'https://example.invalid/photo',customerEmail:'x@x.test'})){
    assert.throws(()=>prepareFirstSyntheticPilot(request({review:{...request().review,[k]:v}})),
      /UNAPPROVED_REVIEW_FIELD/);
  }
});
test('symbol keys, non-enumerable fields, getters and non-plain objects are refused',()=>{
  const sym=request();sym[Symbol('secret')]='value';
  assert.throws(()=>prepareFirstSyntheticPilot(sym),/UNAPPROVED_PILOT_INPUT/);
  const hidden=request();Object.defineProperty(hidden,'jwt',{value:'secret',enumerable:false});
  assert.throws(()=>prepareFirstSyntheticPilot(hidden),/UNAPPROVED_PILOT_INPUT/);
  const getter=request();Object.defineProperty(getter,'model',{get(){throw new Error('getter invoked');}});
  assert.throws(()=>prepareFirstSyntheticPilot(getter),/UNAPPROVED_PILOT_INPUT/);
  assert.throws(()=>prepareFirstSyntheticPilot(null),/UNAPPROVED_PILOT_INPUT/);
  assert.throws(()=>prepareFirstSyntheticPilot([]),/UNAPPROVED_PILOT_INPUT/);
});
test('preview report is deterministic and never contains bytes, prompt or secrets',()=>{
  const a=JSON.stringify(prepareFirstSyntheticPilot(request()));
  const b=JSON.stringify(prepareFirstSyntheticPilot(request()));
  assert.equal(a,b);
  assert.ok(a.length<3800);
  assert.doesNotMatch(a,/iVBORw|base64|image_data|secret|access_token|Bearer|client_email|x-goog-api-key/i);
});
test('every attempted live dispatch and quota reservation fails closed',()=>{
  assert.throws(()=>dispatchProviderCall(),/PROVIDER_NETWORK_DISABLED/);
  assert.throws(()=>dispatchProviderCall({model:MODEL,approved:true}),/PROVIDER_NETWORK_DISABLED/);
  assert.throws(()=>reservePaidQuota(),/ATOMIC_SERVER_SPEND_RESERVATION_NOT_IMPLEMENTED/);
  assert.throws(()=>reservePaidQuota({approved:true,budget_usd:1}),/ATOMIC_SERVER_SPEND_RESERVATION_NOT_IMPLEMENTED/);
});
test('MVP-10-B source contains no network client or secret configuration',()=>{
  const code=readFileSync(new URL('./pilot-preflight.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(code,/\bfetch\s*\(|XMLHttpRequest|Deno\.env\.get\s*\(|process\.env\.|WebSocket\s*\(/);
  assert.doesNotMatch(code,/SUPABASE_SERVICE_ROLE_KEY|GEMINI_API_KEY|sb_secret_/);
});
