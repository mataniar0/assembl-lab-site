/* MVP-10-A — evaluation is blocked until there is actual output image evidence.
 * This file cannot generate an image or invoke an AI provider.
 */
export const RUBRIC=Object.freeze({
  room_geometry:'Original room geometry, windows and existing objects preserved',
  furniture_identity:'Exactly one freestanding nightstand is added',
  design_fidelity:'Finish and drawer count agree with the request',
  proportions:'Scale and perspective are plausible and correctly placed',
  floor_grounding:'Furniture contacts the floor with plausible shadow and lighting',
  unintended_edits:'No unrelated changes, people or fabricated text'
});
export const METRICS=Object.freeze(Object.keys(RUBRIC));
export function assessImageReview(input){
  if(input==null||typeof input!=='object'||Array.isArray(input))
    return Object.freeze({status:'UNASSESSED',reason:'MISSING_REVIEW_RECORD',score:null});
  if(input.evidence_kind!=='HUMAN_REVIEW_OF_GENERATED_IMAGE'||
     typeof input.generated_image_sha256!=='string'||
     !/^[a-f0-9]{64}$/.test(input.generated_image_sha256)||
     typeof input.reviewer_tag!=='string'||!/^reviewer-[A-Za-z0-9_-]{3,40}$/.test(input.reviewer_tag)||
     typeof input.notes!=='string'||input.notes.trim().length<8||
     !input.scores||typeof input.scores!=='object')
    return Object.freeze({status:'UNASSESSED',reason:'IMAGE_AND_HUMAN_REVIEW_EVIDENCE_REQUIRED',score:null});
  const keys=Object.keys(input.scores);
  if(keys.length!==METRICS.length||METRICS.some(k=>!Number.isInteger(input.scores[k])||
     input.scores[k]<0||input.scores[k]>5))
    return Object.freeze({status:'UNASSESSED',reason:'INVALID_METRIC_SCORES',score:null});
  const values=METRICS.map(k=>input.scores[k]),total=values.reduce((a,b)=>a+b,0);
  return Object.freeze({
    status:total>=25&&Math.min(...values)>=3?'REVIEW_CANDIDATE':'REJECT_OR_RETRY',
    score:total,max_score:30,
    engineering_approval:false,manufacturing_approval:false,
    requires_independent_review:true
  });
}
