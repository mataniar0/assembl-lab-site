const fs=require('fs');
const validator=require(process.env.FLOW_VALIDATOR || '/workspace/work/flow-browser/node_modules/gltf-validator');
(async()=>{for(const name of ['Flow_V3_PARTIAL_FRAME_DESIGN_ONLY','Flow_V3_PART_LIBRARY_NOT_ASSEMBLED','search/REJECTED_SW_CORNER_DESIGN_ONLY']) {
 const path=__dirname+'/artifacts/'+name;
 const report=await validator.validateBytes(new Uint8Array(fs.readFileSync(path+'.glb')),{uri:name+'.glb'});
 fs.writeFileSync(path+'-gltf-validation.json',JSON.stringify(report,null,2)+'\n');
 console.log(name,JSON.stringify({errors:report.issues.numErrors,warnings:report.issues.numWarnings,hints:report.issues.numHints}));
 if(report.issues.numErrors||report.issues.numWarnings)process.exitCode=1;
}})();
