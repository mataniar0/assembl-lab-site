/* ASSEMBL LAB MVP-10-B — server-side pilot preflight descriptor only.
 * This ESM module has NO HTTP client, API key, request sender or image bytes.
 * It cannot activate paid calls or storage uploads. Authorisation and cost caps
 * must be enforced independently on a future private backend.
 */
import {planSyntheticEdit} from '../app-mvp-10/synthetic-edit-plan.mjs';

export const MODEL='gemini-3.1-flash-lite-image';
export const SOURCE_SCENE='SC-01';
export const RESOLUTION_PX=1024;
export const OFFLINE_MODE='DRY_RUN';
export const QUOTE=Object.freeze({
  price_source:'https://ai.google.dev/gemini-api/docs/pricing',
  model_docs:'https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-image',
  verified_on:'2026-11-16',
  currency:'USD',
  output_image_1k_reference_usd:0.0336,
  input_per_million_tokens_usd:0.25,
  estimated_total_usd:null,
  estimated_worst_case_usd:null,
  price_includes_input:false,
  quote_is_enforceable_cap:false,
});
export const BLOCKERS=Object.freeze([
  'OWNER_BUDGET_NOT_APPROVED',
  'HARD_SERVER_BUDGET_RESERVATION_NOT_IMPLEMENTED',
  'GOOGLE_BILLING_QUOTA_NOT_VERIFIED',
  'REAL_SUPABASE_AUTH_JWT_E2E_NOT_VERIFIED',
  'STORAGE_UPLOAD_DELETE_LIFECYCLE_NOT_VERIFIED',
  'SERVER_ONLY_PROVIDER_TRANSPORT_NOT_REVIEWED',
  'INDEPENDENT_G5_RELEASE_APPROVAL_NOT_GRANTED',
]);

function fail(msg){throw new Error(msg);}
function strictRecord(x,allowed,code){
  if(x===null||typeof x!=='object'||Array.isArray(x)||
     Object.getPrototypeOf(x)!==Object.prototype)fail(code);
  for(const k of Reflect.ownKeys(x)){
    if(typeof k!=='string'||!allowed.includes(k))fail(code);
    const descriptor=Object.getOwnPropertyDescriptor(x,k);
    if(!descriptor||!Object.hasOwn(descriptor,'value'))fail(code);
  }
}

export function prepareFirstSyntheticPilot(input){
  strictRecord(input,
    ['sceneId','fixtureSha256','requestId','review','sourceKind','mode','model',
     'resolutionPx','requestedCalls'],
    'UNAPPROVED_PILOT_INPUT');
  if(input.mode!==OFFLINE_MODE)fail('LIVE_REQUESTS_DISABLED');
  if(input.sourceKind!=='synthetic')fail('CUSTOMER_MEDIA_DISABLED');
  if(input.sceneId!==SOURCE_SCENE)fail('ONLY_SC01_ALLOWED');
  if(input.model!==MODEL)fail('UNSUPPORTED_PROVIDER_MODEL');
  if(input.resolutionPx!==RESOLUTION_PX)fail('ONLY_1K_OUTPUT_ALLOWED');
  if(input.requestedCalls!==1)fail('ONE_CALL_MAX_UNTIL_APPROVAL');
  const approvedDryRun=planSyntheticEdit({
    mode:'DRY_RUN',sourceKind:'synthetic',sceneId:input.sceneId,
    fixtureSha256:input.fixtureSha256,requestId:input.requestId,review:input.review
  });
  const pending=Object.freeze([...BLOCKERS]);
  const request=Object.freeze({
    protocol:'Google Gemini Interactions API (planned)',
    method:'POST',
    route:'/v1beta/interactions',
    model:MODEL,
    output_resolution_px:RESOLUTION_PX,
    source_media_mime:'image/png',
    output_count_target:1,
    auto_retries:0,
    source_kind:'synthetic',
    source_scene:SOURCE_SCENE,
    source_sha256:approvedDryRun.fixture.sha256,
    design_intent_sha256:approvedDryRun.intent_sha256,
    request_id:approvedDryRun.request_id,
    contains_image_bytes:false,
    contains_api_key:false,
    provider_request_sent:false,
  });
  return Object.freeze({
    stage:'MVP-10-B',
    status:'NO_GO',
    mode:'PREPARE_ONLY',
    eligible_for_paid_execution:false,
    requested_calls:1,
    approved_paid_calls:0,
    charged_calls:0,
    paid_budget_approval:'NOT_GRANTED',
    server_atomic_reservation:'NOT_IMPLEMENTED',
    external_billing_cap:'NOT_VERIFIED',
    estimated_cost:QUOTE,
    request,
    pending_gates:pending,
    output_image_generated:false,
    engineering_approval:false,
    manufacturing_approval:false
  });
}

export function dispatchProviderCall(){
  fail('PROVIDER_NETWORK_DISABLED_WITHOUT_SEPARATE_OWNER_APPROVAL_AND_SERVER_GATES');
}

export function reservePaidQuota(){
  fail('ATOMIC_SERVER_SPEND_RESERVATION_NOT_IMPLEMENTED');
}
