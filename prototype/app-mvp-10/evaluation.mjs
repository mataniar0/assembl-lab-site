/* ASSEMBL LAB MVP-10-A — a strict evidence gate, NOT an AI output evaluator.
 * In this milestone no image is ever generated or received from a provider.
 * Caller supplied strings, hashes or self-scored records are untrusted and
 * cannot establish that a real output exists. Every result is UNASSESSED.
 * A future MVP-10-B server-side evaluator must bind evidence to actual output
 * image bytes, their verified digest and an auditable human review.
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

export function assessImageReview(record){
  // A hash alone does not prove output existence, source, or image quality.
  // No review-candidate or PASS status may originate in MVP-10-A.
  const submitted=record!==null&&typeof record==='object'&&!Array.isArray(record);
  const hasScores=submitted&&record.scores!==null&&
    typeof record.scores==='object'&&!Array.isArray(record.scores);
  const wellFormedScores=hasScores&&Object.keys(record.scores).length===METRICS.length&&
    METRICS.every(metric=>Number.isInteger(record.scores[metric])&&
      record.scores[metric]>=0&&record.scores[metric]<=5);
  return Object.freeze({
    status:'UNASSESSED',
    reason:wellFormedScores?'VERIFIED_PROVIDER_OUTPUT_REQUIRED':'MISSING_OR_INVALID_REVIEW',
    score:null,
    max_score:30,
    engineering_approval:false,
    manufacturing_approval:false,
    requires_verified_output:true,
    requires_independent_review:true
  });
}
