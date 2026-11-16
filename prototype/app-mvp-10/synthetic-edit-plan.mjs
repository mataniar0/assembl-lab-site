/* ASSEMBL LAB MVP-10-A — strictly offline, provider-neutral dry-run.
 * This module has NO HTTP client, no provider SDK and no image-upload API.
 * Only the five checked-in synthetic PNG fixtures are valid sources.
 * No homeowner photographs, free text, secrets, remote URLs, or payment actions.
 */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {normalizeReview,designIntentFor} from '../../app/preview-state.mjs';

export const MODE='DRY_RUN';
export const PILOT_VERSION='ASSEMBL-LAB.IMAGE-EDIT-PILOT.0.1';

const manifest=JSON.parse(readFileSync(
  new URL('../../app/preview-fixtures/manifest.json',import.meta.url),'utf8'
));
const ids=new Map(manifest.fixtures.map(x=>[x.id,Object.freeze({...x})]));
const sha256=b=>createHash('sha256').update(b).digest('hex');
// Unforgeable in-process provenance: summaries cannot be accepted merely because
// a caller copied the public JSON fields of a previously issued plan.
const issuedPlans=new WeakSet();

function fail(code){throw new Error(code);}
function plain(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;}
function whitelist(v,allowed,code){
  if(!plain(v))fail(code);
  for(const k of Object.keys(v))if(!allowed.includes(k))fail(code+':'+k);
}
function checkReview(r,sceneId){
  whitelist(r,['sceneId','position','scale','finish','drawers','view','comparison'],'UNAPPROVED_REVIEW_FIELD');
  if(r.sceneId!==sceneId)fail('REVIEW_SCENE_MISMATCH');
  if(r.view!==undefined&&r.view!=='after')fail('ONLY_AFTER_VIEW_SUPPORTED');
  if(r.position!==undefined&&(!Number.isInteger(r.position)||r.position<30||r.position>70))
    fail('POSITION_OUT_OF_RANGE');
  if(r.scale!==undefined&&(!Number.isInteger(r.scale)||r.scale<65||r.scale>125))
    fail('SCALE_OUT_OF_RANGE');
  if(r.comparison!==undefined&&(!Number.isInteger(r.comparison)||r.comparison<15||r.comparison>85))
    fail('COMPARISON_OUT_OF_RANGE');
  if(r.finish!==undefined&&!['natural','honey','walnut'].includes(r.finish))
    fail('UNAPPROVED_FINISH');
  if(r.drawers!==undefined&&![1,2].includes(r.drawers))
    fail('UNAPPROVED_DRAWER_COUNT');
  return normalizeReview(r);
}

export function planSyntheticEdit(input){
  whitelist(input,['sceneId','fixtureSha256','review','requestId','mode','sourceKind'],'UNAPPROVED_REQUEST_FIELD');
  if(input.mode!==MODE)fail('LIVE_PROVIDER_DISABLED_IN_MVP10A');
  if(input.sourceKind!=='synthetic')fail('NON_SYNTHETIC_SOURCE_DISABLED');
  if(typeof input.requestId!=='string'||!/^[A-Za-z0-9_-]{16,96}$/.test(input.requestId))
    fail('INVALID_IDEMPOTENCY_KEY');
  const fixture=ids.get(input.sceneId);
  if(!fixture)fail('SCENE_NOT_ALLOWLISTED');
  if(input.fixtureSha256!==fixture.sha256)fail('FIXTURE_SHA256_MISMATCH');
  if(!/^SC-(01|02|04|07|10)\.png$/.test(fixture.file))fail('INVALID_COMMITTED_FIXTURE_PATH');
  const review=checkReview(input.review,fixture.id);
  const source=readFileSync(new URL('../../app/preview-fixtures/'+fixture.file,import.meta.url));
  if(source.length!==fixture.bytes||sha256(source)!==fixture.sha256)fail('COMMITTED_FIXTURE_TAMPERED');
  const intent=designIntentFor(review);
  if(intent.source_kind!=='synthetic'||intent.photo_included!==false||intent.appearance.notes!=='')
    fail('UNEXPECTED_DESIGN_INTENT');
  const intentDigest=sha256(Buffer.from(JSON.stringify(intent),'utf8'));
  const summary={
    version:PILOT_VERSION,
    mode:'DRY_RUN_ONLY',
    fixture:Object.freeze({id:fixture.id,sha256:fixture.sha256,bytes:source.byteLength,
      width:manifest.dimensions_px.width,height:manifest.dimensions_px.height}),
    intent_sha256:intentDigest,
    request_id:input.requestId,
    requested_output:'AI_ROOM_EDIT_PREVIEW',
    provider:'NOT_SELECTED',
    price_estimate_usd:null,
    approved_budget_usd:null,
    paid_calls:0,
    network_calls:0,
    sent_to_provider:false,
    image_output_generated:false,
    outcome:'UNASSESSED',
    engineering_approval:false,
    manufacturing_approval:false,
    reason:'OFFLINE_ONLY_PENDING_SEPARATE_OWNER_APPROVAL'
  };
  const issued=Object.freeze(summary);
  issuedPlans.add(issued);
  return issued;
}


/* In-memory idempotency check for test plans. It cannot queue, bill, persist,
 * schedule or invoke a provider. Replaying the same request is harmless;
 * reusing the ID for a different scene/design is rejected.
 */
export function createDryRunLedger(){
  const seen=new Map();
  return Object.freeze({
    accept(plan){
      if(!plain(plan)||!issuedPlans.has(plan)||
         plan.version!==PILOT_VERSION||plan.mode!=='DRY_RUN_ONLY'||
         typeof plan.request_id!=='string'||typeof plan.intent_sha256!=='string'||
         typeof plan.fixture?.sha256!=='string'||plan.sent_to_provider!==false||
         plan.paid_calls!==0||plan.network_calls!==0)
        fail('INVALID_OFFLINE_PLAN');
      const digest=plan.fixture.sha256+':'+plan.intent_sha256;
      const prior=seen.get(plan.request_id);
      if(prior!==undefined&&prior!==digest)fail('IDEMPOTENCY_CONFLICT');
      if(prior===digest)return Object.freeze({replayed:true,submitted:false,paid_calls:0});
      seen.set(plan.request_id,digest);
      return Object.freeze({replayed:false,submitted:false,paid_calls:0});
    }
  });
}

/* Intentionally impossible to activate a live provider in this milestone.
 * A separate audited server-only adapter and owner budget approval are required.
 */
export function callLiveProvider(){fail('LIVE_PROVIDER_DISABLED_IN_MVP10A');}
