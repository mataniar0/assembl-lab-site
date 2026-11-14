/* ASSEMBL LAB MVP-07 — Gemini Interactions request builder, DRY RUN ONLY.
 * A real network request is deliberately NOT implemented.
 * Never put an API key or a homeowner's photo in GitHub Pages or this harness.
 * Current official request format: POST /v1beta/interactions with model,
 * input [{type:'text',text:...},{type:'image',mime_type,data:base64}].
 */
import { createHash } from 'node:crypto';
import { validateDesignIntent, buildRoomEditRequest } from '../app-mvp-03/room-edit-contract.mjs';

export const MODELS=Object.freeze({
  'gemini-nano-banana-2.1':{output1kUsd:0.0336,inputPerMillionUsd:1.5},
  'gemini-3.1-flash-lite-image':{output1kUsd:0.0336,inputPerMillionUsd:0.25}
});
export const MAX_FIXTURE_BYTES=5*1024*1024;

function reject(message){throw new Error(message)}
export function detectImageMime(bytes){
  if(!Buffer.isBuffer(bytes))reject('image_buffer_required');
  if(bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
  if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
  if(bytes.length>=12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'image/webp';
  reject('unsupported_or_invalid_image_bytes');
}
export function buildDryRunInteraction({model,intent,fixtureBytes,sourceKind='synthetic'}={}){
  if(sourceKind!=='synthetic')reject('real_photo_disabled_until_private_backend');
  if(!Object.hasOwn(MODELS,model))reject('unsupported_model');
  const valid=validateDesignIntent(intent);
  if(!valid.ok)reject('invalid_design_intent:'+valid.errors.join(','));
  if(!Buffer.isBuffer(fixtureBytes)||fixtureBytes.length===0||fixtureBytes.length>MAX_FIXTURE_BYTES)reject('fixture_size_invalid');
  const mime=detectImageMime(fixtureBytes);
  const edit=buildRoomEditRequest(intent,{sourceKind:'synthetic'});
  if(edit.request_ready_for_paid_provider!==false)reject('unexpected_provider_activation');
  return {
    model,
    input:[
      {type:'text',text:edit.prompt},
      {type:'image',mime_type:mime,data:fixtureBytes.toString('base64')}
    ],
    response_format:{type:'image',aspect_ratio:'1:1'}
  };
}
/* Returns a summary that is safe to log: never the base64, room image, or prompt notes. */
export function summarizeDryRun(request){
  if(!request||!Object.hasOwn(MODELS,request.model)||!Array.isArray(request.input))
    reject('invalid_dry_run_request');
  const image=request.input.find(x=>x.type==='image');
  const data=image?.data;
  if(typeof data!=='string'||!/^[A-Za-z0-9+/=]+$/.test(data))reject('invalid_image_data');
  const bytes=Buffer.from(data,'base64');
  detectImageMime(bytes);
  return {
    mode:'DRY_RUN_ONLY',
    provider:'Gemini Interactions',
    model:request.model,
    input_mime:image.mime_type,
    synthetic_fixture_bytes:bytes.byteLength,
    synthetic_fixture_sha256:createHash('sha256').update(bytes).digest('hex'),
    estimated_output_1k_usd:MODELS[request.model].output1kUsd,
    estimated_input_usd:null,
    estimated_total_usd:null,
    number_of_paid_requests:0,
    sent_to_provider:false,
    result_image_generated:false,
    engineering_approval:false,
    manufacturing_approval:false
  };
}
