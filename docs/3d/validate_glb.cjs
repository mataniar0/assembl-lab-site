// npm install --ignore-scripts gltf-validator@2.0.0-dev.3.10 in a disposable directory.
// NODE_PATH=/path/to/node_modules node docs/3d/validate_glb.cjs
const fs = require('fs');
const validator = require('gltf-validator');
validator.validateBytes(new Uint8Array(fs.readFileSync('table/personal/media/personal-design-preview.glb')), {uri:'personal-design-preview.glb'})
  .then(report => {
    fs.writeFileSync('QA_EVIDENCE/AL-016/gltf-validation.json', JSON.stringify(report, null, 2) + '\n');
    console.log(report.issues);
    process.exitCode = Number(Boolean(report.issues.numErrors || report.issues.numWarnings));
  }).catch(error => { console.error(error); process.exitCode = 1; });
