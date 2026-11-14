/* Generate ten PNG fixtures and a safe-to-share manifest.
 * Local or CI use only. Never commits real room pictures.
 * node prototype/app-mvp-07/export-synthetic-fixtures.mjs [output_dir]
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {renderScene,scenarios} from './synthetic-scenes.mjs';
import {buildDryRunInteraction,summarizeDryRun} from './gemini-image-request.mjs';
import {readFileSync} from 'node:fs';

const root=resolve(process.argv[2]||'.qa-reports/app-mvp-07');
const intent=JSON.parse(readFileSync(new URL('../app-mvp-03/synthetic-intent.json',import.meta.url),'utf8'));
await mkdir(root,{recursive:true});
const manifest=[];
for(let i=0;i<scenarios.length;i++){
  const scene=renderScene(i);
  const filename=scene.id+'.png';
  const request=buildDryRunInteraction({model:'gemini-nano-banana-2.1',intent,fixtureBytes:scene.png});
  const dryrun=summarizeDryRun(request);
  await writeFile(resolve(root,filename),scene.png);
  manifest.push({
    case_id:scene.id,description:scene.label,filename,
    source_sha256:createHash('sha256').update(scene.png).digest('hex'),
    source_type:'SYNTHETIC_PROGRAMMATIC_IMAGE',
    intended_furniture:'freestanding_nightstand',
    requested_position_percent:scene.case.position,
    dry_run:dryrun,
    output_image_generated:false,
    needs_human_evaluation:true
  });
}
await writeFile(resolve(root,'manifest.json'),JSON.stringify({
  schema_version:'ASSEMBL-LAB.MVP-07-SYNTHETIC-ROOMS.0.1',
  generated_from:'prototype/app-mvp-07/synthetic-scenes.mjs',
  room_count:manifest.length,
  provider_api_calls:0,
  customer_photos_used:0,
  test_cases:manifest
},null,2)+'\n');
console.log('Generated '+manifest.length+' synthetic PNG rooms with a dry-run-only manifest at '+root);
