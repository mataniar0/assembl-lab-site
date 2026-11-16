/* Deterministic demonstration of the offline MVP-10-A image-edit plan.
 * node prototype/app-mvp-10/run-dry-run.mjs [SC-01|SC-02|SC-04|SC-07|SC-10]
 * It reads only a checked-in fixture manifest. It never calls the network.
 */
import {readFileSync} from 'node:fs';
import {planSyntheticEdit} from './synthetic-edit-plan.mjs';

const manifest=JSON.parse(readFileSync(new URL('../../app/preview-fixtures/manifest.json',import.meta.url),'utf8'));
const id=process.argv[2]||'SC-01';
const fixture=manifest.fixtures.find(x=>x.id===id);
if(!fixture){
  process.stderr.write('Unsupported synthetic fixture ID\n');
  process.exitCode=1;
}else{
  const summary=planSyntheticEdit({
    mode:'DRY_RUN',sourceKind:'synthetic',
    requestId:'mvp10a_offline_fixture_'+id.replace('-','_')+'_001',
    sceneId:id,fixtureSha256:fixture.sha256,
    review:{sceneId:id,position:52,scale:88,finish:'natural',drawers:1,view:'after'}
  });
  process.stdout.write(JSON.stringify(summary,null,2)+'\n');
}
