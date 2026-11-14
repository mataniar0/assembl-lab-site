/* MVP-07 — evidence-oriented human image-edit evaluation.
 * Never call a generated output PASS until a human has scored an actual image.
 */
export const RUBRIC=Object.freeze({
  room_integrity:'Original walls, windows, furniture, lighting and objects preserved',
  nightstand_presence:'One freestanding nightstand visibly added to requested area',
  intent_fidelity:'Drawer count, color, lower section match design intent',
  perspective:'Furniture perspective and scale visually plausible',
  grounding:'Contact/shadow and floor grounding visually plausible',
  edit_control:'No unrelated edits, extra people, invented objects or texts'
});
export const METRICS=Object.freeze(Object.keys(RUBRIC));
export function validateAssessment(record) {
  const errors=[];
  if(!record||typeof record!=='object'||Array.isArray(record))return {ok:false,errors:['not_object']};
  if(!/^SC-(0[1-9]|10)$/.test(record.case_id||''))errors.push('unknown_case');
  if(typeof record.evaluator!=='string'||record.evaluator.trim().length<3)errors.push('evaluator_required');
  if(!['human','reviewer'].includes(record.evaluation_method))errors.push('human_review_required');
  if(typeof record.generated_image_sha256!=='string'||!/^[0-9a-f]{64}$/.test(record.generated_image_sha256))
    errors.push('generated_image_evidence_required');
  if(!record.scores||typeof record.scores!=='object')errors.push('scores_required');
  else for(const metric of METRICS){
    const n=record.scores[metric];
    if(!Number.isInteger(n)||n<0||n>5)errors.push('invalid_'+metric);
  }
  if(typeof record.notes!=='string'||record.notes.length<8)errors.push('review_notes_required');
  return {ok:errors.length===0,errors};
}
export function gradeAssessment(record){
  const validated=validateAssessment(record);
  if(!validated.ok) return {status:'UNASSESSED',errors:validated.errors,total:null};
  const scores=METRICS.map(k=>record.scores[k]);
  const total=scores.reduce((a,b)=>a+b,0);
  const floor=Math.min(...scores);
  // Candidate rubric only: later pilot agreement may tighten thresholds.
  return {status:total>=25&&floor>=3?'REVIEW_CANDIDATE':'REJECT_OR_RETRY',
    score:total,maxScore:30,minMetric:floor,engineering_approval:false,manufacturing_approval:false};
}
export function evaluateTrialSet(records){
  if(!Array.isArray(records))throw new Error('assessments_must_be_array');
  const unique=new Set();
  let passed=0,failed=0,unassessed=0;
  for(const rec of records){
    if(rec&&unique.has(rec.case_id))throw new Error('duplicate_case:'+rec.case_id);
    if(rec)unique.add(rec.case_id);
    const grade=gradeAssessment(rec);
    if(grade.status==='REVIEW_CANDIDATE')passed++;
    else if(grade.status==='REJECT_OR_RETRY')failed++;
    else unassessed++;
  }
  return {total:records.length,review_candidates:passed,retries_or_rejects:failed,
    unassessed,completeness:unassessed===0&&records.length===10&&unique.size===10,
    ready_for_live_pilot:false};
}
