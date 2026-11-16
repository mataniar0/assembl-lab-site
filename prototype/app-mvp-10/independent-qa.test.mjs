/* Reviewer-side black-box contract tests of the command line interface.
 * Uses a fresh child process for each fixture: no direct planner imports.
 * This verifies the published artifact contract rather than implementation
 * details, and never contacts external APIs.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const manifest=JSON.parse(readFileSync(new URL('../../app/preview-fixtures/manifest.json',import.meta.url),'utf8'));
const runner=new URL('./run-dry-run.mjs',import.meta.url);
function invoke(id){
  return spawnSync(process.execPath,[runner.pathname,id],{
    encoding:'utf8',timeout:8000,maxBuffer:64*1024,
    env:{PATH:process.env.PATH,HOME:process.env.HOME}
  });
}
test('the tested contract has exactly five source-controlled fixture IDs',()=>{
 assert.deepEqual(manifest.fixtures.map(f=>f.id),['SC-01','SC-02','SC-04','SC-07','SC-10']);
 assert.equal(manifest.generated_by_ai,false);
 assert.equal(manifest.contains_customer_media,false);
});
for(const f of manifest.fixtures){
  test('separate CLI process emits a safe immutable-by-content report for '+f.id,()=>{
    const child=invoke(f.id);
    assert.equal(child.status,0,child.stderr);
    assert.equal(child.stderr,'');
    const result=JSON.parse(child.stdout);
    assert.equal(result.mode,'DRY_RUN_ONLY');
    assert.equal(result.fixture.id,f.id);
    assert.equal(result.fixture.sha256,f.sha256);
    assert.equal(result.fixture.bytes,f.bytes);
    assert.equal(result.fixture.width,384);
    assert.equal(result.fixture.height,384);
    assert.equal(result.request_id,'mvp10a_offline_fixture_'+f.id.replace('-','_')+'_001');
    assert.equal(result.sent_to_provider,false);
    assert.equal(result.paid_calls,0);
    assert.equal(result.network_calls,0);
    assert.equal(result.image_output_generated,false);
    assert.equal(result.outcome,'UNASSESSED');
    assert.equal(result.approved_budget_usd,null);
    assert.equal(result.price_estimate_usd,null);
    assert.equal(result.provider,'NOT_SELECTED');
    assert.equal(result.engineering_approval,false);
    assert.equal(result.manufacturing_approval,false);
    assert.doesNotMatch(child.stdout,/sb_secret_|service_role|access_token|data:image|iVBORw0/);
    const again=invoke(f.id);
    assert.equal(again.status,0);
    assert.equal(child.stdout,again.stdout,'CLI report differs on repeat');
  });
}
test('command rejects unsupported scenes with a non-zero exit status and no content',()=>{
 const res=invoke('SC-03');
 assert.notEqual(res.status,0);
 assert.match(res.stderr,/Unsupported synthetic fixture ID/);
 assert.equal(res.stdout,'');
});
