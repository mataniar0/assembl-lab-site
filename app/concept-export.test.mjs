import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {demoConcept,buildNightstand,projectNightstand} from './concept-geometry.mjs';
import {conceptGlb,conceptPartReport,conceptExportBundle,sha256Hex} from './concept-export.mjs';

function readGlb(bytes){
  const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  assert.equal(d.getUint32(0,true),0x46546c67);
  assert.equal(d.getUint32(4,true),2);
  assert.equal(d.getUint32(8,true),bytes.length);
  const jsonLen=d.getUint32(12,true);
  assert.equal(jsonLen%4,0);
  assert.equal(d.getUint32(16,true),0x4e4f534a);
  const end=20+jsonLen;
  assert.equal(d.getUint32(end,true)%4,0);
  assert.equal(d.getUint32(end+4,true),0x004e4942);
  assert.equal(bytes.length,end+8+d.getUint32(end,true));
  const gltf=JSON.parse(new TextDecoder().decode(bytes.subarray(20,end)).trimEnd());
  const bin=bytes.subarray(end+8);
  return {gltf,bin,view:new DataView(bin.buffer,bin.byteOffset,bin.byteLength)};
}
test('GLB bytes are deterministic, aligned, self-contained glTF 2.0 with correct units',()=>{
  const c=demoConcept();
  const a=conceptGlb(c);
  const b=conceptGlb(c);
  assert.deepEqual(a,b);
  const {gltf,bin}=readGlb(a);
  assert.equal(gltf.asset.version,'2.0');
  assert.equal(gltf.scene,0);
  assert.equal(gltf.buffers.length,1);
  assert.equal(Object.hasOwn(gltf.buffers[0],'uri'),false);
  assert.equal(gltf.buffers[0].byteLength,648);
  assert.equal(bin.length,648);
  assert.deepEqual(gltf.bufferViews.map(x=>x.byteOffset),[0,288,576]);
  assert.deepEqual(gltf.accessors.map(x=>x.count),[24,24,36]);
  assert.deepEqual(gltf.accessors.map(x=>x.componentType),[5126,5126,5123]);
  assert.equal(gltf.nodes.length,10);
  assert.equal(gltf.meshes.length,6);
  assert.equal(gltf.materials.length,6);
  assert.deepEqual(gltf.nodes[0].translation,[0,.547,0]);
  assert.deepEqual(gltf.nodes[0].scale,[.5,.006,.35]);
  assert.equal(gltf.extras.manufacturing_approval,false);
  assert.equal(gltf.extras.engineering_approval,false);
  assert.equal(gltf.extras.geometry_kind,'UNVERIFIED_VOLUME_CONCEPT');
  assert.equal(gltf.nodes.every(n=>n.extras.unverified===true),true);
  assert.equal(JSON.stringify(gltf).includes('"uri"'),false);
});
test('GLB cube has outward-oriented geometry, vertex normals, valid index bounds',()=>{
  const {gltf,view}=readGlb(conceptGlb(demoConcept()));
  const positions=[],normals=[];
  for(let i=0;i<24;i++){
    positions.push([0,1,2].map(j=>view.getFloat32(i*12+j*4,true)));
    normals.push([0,1,2].map(j=>view.getFloat32(288+i*12+j*4,true)));
  }
  for(let i=0;i<6;i++){
    const n=normals[i*4];
    assert.deepEqual(normals.slice(i*4,i*4+4),[n,n,n,n]);
    const i0=view.getUint16(576+i*12,true);
    const i1=view.getUint16(576+i*12+2,true);
    const i2=view.getUint16(576+i*12+4,true);
    const a=positions[i0],b=positions[i1],c=positions[i2];
    const ab=b.map((v,j)=>v-a[j]),ac=c.map((v,j)=>v-a[j]);
    const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    assert.ok(cross.reduce((s,v,j)=>s+v*n[j],0)>0);
  }
  for(let i=0;i<36;i++)assert.ok(view.getUint16(576+i*2,true)<24);
  assert.deepEqual(gltf.accessors[0].min,[-.5,-.5,-.5]);
  assert.deepEqual(gltf.accessors[0].max,[.5,.5,.5]);
});
test('GLB node transforms match 1:1 the preview and report part geometry, in metres',()=>{
  for(const c of [demoConcept(),{...demoConcept(),drawers:2,finish:'walnut',selected_slot:'B'}]){
    for(const dims of [{width:200,height:250,depth:200},{width:500,height:550,depth:350},{width:900,height:950,depth:600}]){
      const {gltf}=readGlb(conceptGlb(c,dims));
      const model=buildNightstand(c,dims);
      const report=conceptPartReport(c,dims);
      const svgProjection=projectNightstand(model,32,27,100);
      assert.ok(svgProjection.faces.length>0);
      assert.deepEqual(gltf.nodes.map(n=>n.name),report.parts.map(p=>p.id));
      assert.equal(report.part_count,model.parts.length);
      assert.equal(report.parts.filter(p=>p.kind==='drawer').length,c.drawers);
      for(let i=0;i<model.parts.length;i++){
        const n=gltf.nodes[i],p=report.parts[i];
        assert.equal(n.mesh, ['top','side','back','shelf','drawer','leg'].indexOf(p.kind));
        for(let j=0;j<3;j++){
          assert.ok(Math.abs(n.translation[j]*1000-Object.values(p.center_mm)[j])<1e-9);
          assert.ok(Math.abs(n.scale[j]*1000-Object.values(p.size_mm)[j])<1e-9);
        }
        assert.equal(n.extras.id,p.id);
        for(let j=0;j<3;j++){
          assert.ok(Math.abs((n.translation[j]-n.scale[j]/2)*1000-p.bbox_mm.min[j])<1e-9);
          assert.ok(Math.abs((n.translation[j]+n.scale[j]/2)*1000-p.bbox_mm.max[j])<1e-9);
        }
      }
      assert.deepEqual(report.dimensions_mm,dims);
      assert.equal(report.safety.joinery_verified,false);
      assert.equal(report.safety.load_verified,false);
      assert.equal(report.safety.collision_free_verified,false);
    }
  }
});
test('report SHA-256 authenticates the exact downloadable GLB and no private fields',async()=>{
  const c={...demoConcept(),selected_slot:'A',finish:'honey',drawers:2,scene_id:'SC-02'};
  const bundle=await conceptExportBundle(c,{width:540,height:580,depth:380});
  assert.equal(bundle.report.source_slot,'A');
  assert.equal(bundle.report.source_scene,'SC-02');
  assert.equal(bundle.report.glb_sha256,createHash('sha256').update(bundle.glb).digest('hex'));
  assert.equal(bundle.report.glb_sha256,await sha256Hex(bundle.glb));
  assert.equal(bundle.report.glb_sha256.length,64);
  assert.deepEqual(bundle.glb,conceptGlb(c,{width:540,height:580,depth:380}));
  assert.doesNotMatch(JSON.stringify(bundle.report),/customer|email|photo_url|data_uri|https?:/i);
});
test('report cannot be emitted for invalid or certified models',()=>{
  assert.throws(()=>conceptGlb({...demoConcept(),drawers:0}),/CONCEPT_INVALID/);
  assert.throws(()=>conceptPartReport(demoConcept(),{width:500,height:550,depth:0}),/DEPTH_INVALID/);
  assert.throws(()=>conceptGlb(demoConcept(),{width:500,height:550,depth:350,token:'a'}),/DIMENSIONS_INVALID/);
});
test('MVP-14 UI and PWA expose explicit local export with no remote provider',()=>{
  const html=readFileSync(new URL('./concept-3d.html',import.meta.url),'utf8');
  const script=readFileSync(new URL('./concept-3d.mjs',import.meta.url),'utf8');
  const sw=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
  for(const id of ['showcase-demo','download-glb','download-report','export-status']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/connect-src 'none'/);
  assert.match(script,/conceptExportBundle\(concept,dims\)/);
  assert.match(script,/URL\.createObjectURL/);
  assert.match(script,/link\.download/);
  assert.match(sw,/'\.\/concept-export\.mjs'/);
  assert.doesNotMatch(script,/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB/i);
});
