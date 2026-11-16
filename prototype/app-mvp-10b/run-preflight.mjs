/* Synthetic-only, no network, no credentials, no paid provider invocation. */
import {readFileSync} from 'node:fs';
import {prepareFirstSyntheticPilot} from './pilot-preflight.mjs';
const fixtures=JSON.parse(readFileSync(new URL('../../app/preview-fixtures/manifest.json',import.meta.url),'utf8'));
const room=fixtures.fixtures.find(f=>f.id==='SC-01');
const result=prepareFirstSyntheticPilot({
  sceneId:'SC-01',
  fixtureSha256:room.sha256,
  requestId:'mvp10b_sc01_offline_first_trial_001',
  review:{sceneId:'SC-01',position:52,scale:88,finish:'natural',drawers:1,view:'after'},
  sourceKind:'synthetic',mode:'DRY_RUN',model:'gemini-3.1-flash-lite-image',
  resolutionPx:1024,requestedCalls:1
});
process.stdout.write(JSON.stringify(result,null,2)+'\n');
