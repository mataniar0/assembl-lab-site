import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {showcaseNightstandGlb} from './showcase-glb.mjs';
import {buildNightstand,demoConcept} from './concept-geometry.mjs';
import {conceptGlb} from './concept-export.mjs';

function parseGlb(bytes){
  const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  assert.equal(dv.getUint32(0,true),0x46546c67);
  assert.equal(dv.getUint32(4,true),2);
  assert.equal(dv.getUint32(8,true),bytes.length);
  const n=dv.getUint32(12,true);
  assert.equal(n%4,0);
  assert.equal(dv.getUint32(16,true),0x4e4f534a);
  assert.equal(dv.getUint32(20+n+4,true),0x004e4942);
  const size=dv.getUint32(20+n,true);
  assert.equal(bytes.length,20+n+8+size);
  return JSON.parse(new TextDecoder().decode(bytes.slice(20,20+n)).trim());
}
test('showcase binary is real deterministic glTF2, self contained and semantically unapproved',()=>{
  const concept={...demoConcept(),version_id:'visual-v3',finish:'walnut',drawers:2,
    lower_section:'closed',nominal_thickness_mm:4,
    dimensions_mm:{width:650,height:950,depth:500}};
  const bytes=showcaseNightstandGlb(concept);
  assert.deepEqual(bytes,showcaseNightstandGlb(concept));
  const gltf=parseGlb(bytes);
  assert.equal(gltf.asset.version,'2.0');
  assert.equal(gltf.extras.geometry_kind,'SHOWROOM_CONCEPT_GLB');
  assert.equal(gltf.extras.source_version,'visual-v3');
  assert.equal(gltf.extras.manufacturing_approval,false);
  assert.equal(gltf.extras.engineering_approval,false);
  assert.equal(gltf.extras.decorative_handles,true);
  assert.equal(gltf.buffers.length,1);
  assert.equal(Object.hasOwn(gltf.buffers[0],'uri'),false);
  assert.equal(gltf.scenes[0].nodes.length,gltf.nodes.length);
  assert.equal(gltf.materials.length,8);
  assert.equal(gltf.meshes.length,8);
  assert.equal(gltf.nodes.filter(n=>n.name.endsWith('-pull')).length,2);
  assert.equal(gltf.nodes.filter(n=>n.extras?.role==='decorative_handle_only').length,6);
  assert.equal(gltf.nodes.filter(n=>n.name==='lower-front').length,1);
  assert.equal(gltf.nodes.find(n=>n.name==='top').scale[1],.004);
  assert.equal(gltf.nodes.find(n=>n.name==='top').scale[0],.65);
  assert.equal(gltf.nodes.find(n=>n.name==='drawer-2').mesh,4);
  assert.ok(gltf.materials.some(m=>m.name.includes('brass')&&m.pbrMetallicRoughness.metallicFactor>.5));
  assert.doesNotMatch(JSON.stringify(gltf),/https?:\/\/|photo|customer_email|private_note|base64,/i);
});
test('showroom nodes follow approved version for all finishes, drawer numbers and dimensions',()=>{
  for(const finish of ['natural','honey','walnut']){
    for(const drawers of [1,2]){
      for(const t of [4,6]){
        const c={...demoConcept(),finish,drawers,nominal_thickness_mm:t,
          lower_section:drawers===2?'closed':'shelf',
          dimensions_mm:{width:300,height:380,depth:270}};
        const g=parseGlb(showcaseNightstandGlb(c));
        const model=buildNightstand(c);
        assert.equal(g.nodes.length,model.parts.length+drawers*3);
        assert.equal(g.nodes.filter(n=>n.name.endsWith('-pull')).length,drawers);
        assert.equal(g.nodes.find(n=>n.name==='top').scale[1],t/1000);
        assert.equal(g.nodes.find(n=>n.name==='top').scale[0],.3);
        assert.equal(g.extras.source_dimensions_mm.width,300);
        assert.equal(g.extras.source_dimensions_mm.height,380);
        assert.equal(g.extras.source_dimensions_mm.depth,270);
        const base=parseGlb(conceptGlb(c));
        assert.equal(g.nodes.slice(0,base.nodes.length).length,base.nodes.length);
        assert.deepEqual(g.nodes.slice(0,base.nodes.length),base.nodes);
      }
    }
  }
});
test('viewer references only pinned same-origin library and local blob with resilient SVG fallback',()=>{
  const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
  const source=readFileSync(new URL('./return-3d.mjs',import.meta.url),'utf8');
  const sw=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
  assert.match(html,/id="approved-glb-host"/);
  assert.match(html,/id="approved-3d-view"/);
  assert.match(html,/connect-src 'self' blob:/);
  assert.match(source,/vendor\/model-viewer-4\.1\.0\/model-viewer\.min\.js/);
  assert.match(source,/showcaseNightstandGlb\(approved\)/);
  assert.match(source,/next\.src=blobUrl/);
  assert.match(source,/URL\.revokeObjectURL/);
  assert.match(source,/webGLAvailable/);
  assert.match(source,/failGLB/);
  assert.match(sw,/assets\/vendor\/model-viewer-4\.1\.0\/model-viewer\.min\.js/);
  assert.match(sw,/'\.\/showcase-glb\.mjs'/);
  assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|supabase|openai/gi);
});
