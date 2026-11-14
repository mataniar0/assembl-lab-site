import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {renderScene,scenarios} from './synthetic-scenes.mjs';
import {MODELS,buildDryRunInteraction,detectImageMime,summarizeDryRun} from './gemini-image-request.mjs';
import {RUBRIC,METRICS,gradeAssessment,evaluateTrialSet} from './evaluation.mjs';

const intent=JSON.parse(readFileSync(new URL('../app-mvp-03/synthetic-intent.json',import.meta.url),'utf8'));
function sampleReview(caseId,score=4){
  return {
    case_id:caseId,evaluator:'test-reviewer',evaluation_method:'human',
    generated_image_sha256:'a'.repeat(64),
    scores:Object.fromEntries(METRICS.map(k=>[k,score])),
    notes:'Evidence-based review of a synthetic model output.'
  };
}
test('ten scenarios have unique IDs and model variants',()=>{
  assert.equal(scenarios.length,10);
  assert.equal(new Set(scenarios.map(s=>s.id)).size,10);
  assert.deepEqual(Object.keys(MODELS),['gemini-nano-banana-2.1','gemini-3.1-flash-lite-image']);
  assert.equal(METRICS.length,6);
  assert.equal(Object.keys(RUBRIC).length,6);
});
for(let i=0;i<10;i++){
  test('room '+scenarios[i].id+' produces valid synthetic-only dry-run payload',()=>{
    const result=renderScene(i);
    const bytes=result.png;
    assert.equal(detectImageMime(bytes),'image/png');
    assert.equal(bytes.readUInt32BE(16),384);
    assert.equal(bytes.readUInt32BE(20),384);
    assert.ok(bytes.length>500);
    assert.ok(bytes.length<5*1024*1024);
    const req=buildDryRunInteraction({model:'gemini-nano-banana-2.1',intent,fixtureBytes:bytes});
    assert.equal(req.input[0].type,'text');
    assert.equal(req.input[1].mime_type,'image/png');
    assert.equal(req.input[1].data,bytes.toString('base64'));
    const summary=summarizeDryRun(req);
    assert.equal(summary.sent_to_provider,false);
    assert.equal(summary.result_image_generated,false);
    assert.equal(summary.manufacturing_approval,false);
    assert.equal(summary.synthetic_fixture_bytes,bytes.byteLength);
    assert.equal(summary.synthetic_fixture_sha256,createHash('sha256').update(bytes).digest('hex'));
    assert.equal(JSON.stringify(summary).includes('data:'),false);
  });
}
test('all ten synthetic PNG images are distinct',()=>{
  const ids=scenarios.map((_,i)=>createHash('sha256').update(renderScene(i).png).digest('hex'));
  assert.equal(new Set(ids).size,10);
});
test('renderer rejects out-of-bounds scene index',()=>{
  assert.throws(()=>renderScene(-1),/invalid_scenario_index/);
  assert.throws(()=>renderScene(10),/invalid_scenario_index/);
});
test('request builder rejects real photos even if model is supported',()=>{
  assert.throws(()=>buildDryRunInteraction({model:'gemini-nano-banana-2.1',intent,fixtureBytes:renderScene(0).png,sourceKind:'user-consented'}),/real_photo_disabled/);
});
test('request builder rejects unknown model before any network action',()=>{
  assert.throws(()=>buildDryRunInteraction({model:'free-public-api',intent,fixtureBytes:renderScene(0).png}),/unsupported_model/);
});
test('request builder rejects invalid intent',()=>{
  assert.throws(()=>buildDryRunInteraction({model:'gemini-nano-banana-2.1',intent:{...intent,category:'crib'},fixtureBytes:renderScene(0).png}),/invalid_design_intent/);
});
test('request builder rejects empty, invalid and oversized fixtures',()=>{
  const options={model:'gemini-nano-banana-2.1',intent};
  assert.throws(()=>buildDryRunInteraction({...options,fixtureBytes:Buffer.alloc(0)}),/fixture_size_invalid/);
  assert.throws(()=>buildDryRunInteraction({...options,fixtureBytes:Buffer.alloc(20,1)}),/unsupported_or_invalid/);
  assert.throws(()=>buildDryRunInteraction({...options,fixtureBytes:Buffer.alloc(5*1024*1024+1)}),/fixture_size_invalid/);
});
test('cheap model is supported for dry-run as a cost alternative',()=>{
  const req=buildDryRunInteraction({model:'gemini-3.1-flash-lite-image',intent,fixtureBytes:renderScene(0).png});
  assert.equal(summarizeDryRun(req).number_of_paid_requests,0);
  assert.equal(summarizeDryRun(req).estimated_total_usd,null);
});
test('evaluation refuses to infer quality from missing output evidence',()=>{
  const unscored={case_id:'SC-01',evaluator:'test-reviewer',scores:{},notes:'not tested'};
  assert.equal(gradeAssessment(unscored).status,'UNASSESSED');
  assert.equal(gradeAssessment({...sampleReview('SC-01'),generated_image_sha256:null}).status,'UNASSESSED');
});
test('evaluation rubric flags weak or missing properties',()=>{
  assert.equal(gradeAssessment(sampleReview('SC-01',4)).status,'REJECT_OR_RETRY'); // 24/30 is below threshold
  const high=sampleReview('SC-01',5);
  assert.equal(gradeAssessment(high).status,'REVIEW_CANDIDATE');
  assert.equal(gradeAssessment({...high,scores:{...high.scores,room_integrity:1}}).status,'REJECT_OR_RETRY');
  assert.equal(gradeAssessment(high).engineering_approval,false);
});
test('ten human-reviewed image outputs are needed for a complete trial',()=>{
  const records=scenarios.map((x)=>sampleReview(x.id,5));
  const summary=evaluateTrialSet(records);
  assert.equal(summary.completeness,true);
  assert.equal(summary.review_candidates,10);
  assert.equal(summary.ready_for_live_pilot,false);
  assert.equal(evaluateTrialSet([]).completeness,false);
  assert.throws(()=>evaluateTrialSet([records[0],records[0]]),/duplicate_case/);
});
test('PNG IDAT bytes inflate to correct scanline size',()=>{
  const png=renderScene(0).png;
  assert.equal(png.toString('ascii',12,16),'IHDR');
  const off=33, len=png.readUInt32BE(off);
  assert.equal(png.toString('ascii',off+4,off+8),'IDAT');
  const raw=inflateSync(png.subarray(off+8,off+8+len));
  assert.equal(raw.byteLength,384*(1+384*3));
});
