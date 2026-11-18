import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
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
  const gltf=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+n)).trim());
  const bin=bytes.slice(28+n);
  assert.ok(gltf.buffers[0].byteLength<=bin.length);
  for(const v of gltf.bufferViews){
    assert.equal(v.byteOffset%4,0);
    assert.ok(v.byteOffset+v.byteLength<=gltf.buffers[0].byteLength);
  }
  for(const a of gltf.accessors){
    assert.ok(a.bufferView<gltf.bufferViews.length);
    assert.ok(a.count>0);
  }
  return {gltf,bin};
}
function parsePNG(gltf,bin,idx){
  const image=gltf.images[idx],v=gltf.bufferViews[image.bufferView];
  const bytes=bin.slice(v.byteOffset,v.byteOffset+v.byteLength);
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const w=dv.getUint32(16,false),h=dv.getUint32(20,false);
  let offset=8,payload=[];
  while(offset<bytes.length){
    const length=dv.getUint32(offset,false);
    const name=new TextDecoder().decode(bytes.slice(offset+4,offset+8));
    if(name==='IDAT')payload.push(bytes.slice(offset+8,offset+8+length));
    if(name==='IEND')break;
    offset+=12+length;
  }
  const zipped=Buffer.concat(payload.map(x=>Buffer.from(x)));
  const raw=inflateSync(zipped);
  assert.equal(raw.length,(w*3+1)*h);
  for(let y=0;y<h;y++)assert.equal(raw[y*(w*3+1)],0);
  return {w,h,raw};
}
const selected=()=>({...demoConcept(),version_id:'visual-v3',
  finish:'walnut',drawers:2,lower_section:'closed',nominal_thickness_mm:4,
  dimensions_mm:{width:650,height:950,depth:500}});

test('MVP-17 yields deterministic self-contained GLB v2 with complex rounded mesh, PBR and visual-only flags',()=>{
  const c=selected(),a=showcaseNightstandGlb(c);
  const b=showcaseNightstandGlb(c);
  assert.deepEqual(a,b);
  const {gltf}=parseGlb(a);
  assert.equal(gltf.asset.version,'2.0');
  assert.equal(gltf.extras.geometry_kind,'REALISTIC_TEXTURED_SHOWROOM_CONCEPT');
  assert.equal(gltf.extras.visual_quality,'bevelled-textured-pbr-v1');
  assert.equal(gltf.extras.source_version,'visual-v3');
  assert.equal(gltf.extras.manufacturing_approval,false);
  assert.equal(gltf.extras.engineering_approval,false);
  assert.equal(gltf.extras.joinery_verified,false);
  assert.equal(gltf.extras.decorations_are_visual_only,true);
  assert.equal(gltf.buffers.length,1);
  assert.equal(Object.hasOwn(gltf.buffers[0],'uri'),false);
  assert.equal(gltf.scenes[0].nodes.length,gltf.nodes.length);
  assert.ok(gltf.meshes.length>14);
  assert.ok(gltf.nodes.length>25);
  assert.equal(gltf.nodes.filter(n=>n.name.endsWith('-pull')).length,2);
  assert.ok(gltf.nodes.some(n=>n.name==='drawer-2-face-visual'));
  assert.ok(gltf.nodes.some(n=>n.name==='lower-visual-face'));
  assert.equal(gltf.nodes.find(n=>n.name==='top').scale[1],.004);
  assert.equal(gltf.nodes.find(n=>n.name==='top').scale[0],.65);
  const brass=gltf.materials.find(m=>m.name.includes('Satin machined brass'));
  assert.ok(brass.pbrMetallicRoughness.metallicFactor>.5);
  assert.equal(gltf.images.length,2);
  assert.equal(gltf.textures.length,2);
  assert.equal(gltf.materials.filter(m=>m.normalTexture?.index===1).length>=4,true);
  assert.doesNotMatch(JSON.stringify(gltf),/https?:\/\/|customer_email|private_note|base64,/i);
  for(const mesh of gltf.meshes){
    const p=mesh.primitives[0];
    assert.ok(p.attributes.POSITION>=0&&p.attributes.NORMAL>=0&&p.attributes.TEXCOORD_0>=0);
    assert.ok(gltf.accessors[p.attributes.POSITION].count>=24);
    assert.equal(gltf.accessors[p.attributes.POSITION].componentType,5126);
    assert.equal(gltf.accessors[p.attributes.TEXCOORD_0].type,'VEC2');
  }
  const top=gltf.meshes[gltf.nodes[0].mesh].primitives[0];
  assert.ok(gltf.accessors[top.attributes.POSITION].count>=300,'bevel has many real curved-edge vertices');
  assert.ok(gltf.accessors[top.indices].count>1000,'bevel has dense mesh triangulation');
});
test('embedded albedo and wood normal maps are PNGs with real nonflat pixel variation',()=>{
  const {gltf,bin}=parseGlb(showcaseNightstandGlb(selected()));
  const color=parsePNG(gltf,bin,0),normal=parsePNG(gltf,bin,1);
  assert.equal(color.w,512);assert.equal(color.h,256);
  assert.equal(normal.w,256);assert.equal(normal.h,128);
  const red=new Set(),green=new Set(),normalRed=new Set(),normalGreen=new Set();
  for(let y=0;y<256;y+=7){
    for(let x=0;x<512;x+=7){
      const i=y*(512*3+1)+1+x*3;
      red.add(color.raw[i]);green.add(color.raw[i+1]);
    }
  }
  for(let y=0;y<128;y+=7)for(let x=0;x<256;x+=7){
    const i=y*(256*3+1)+1+x*3;
    normalRed.add(normal.raw[i]);normalGreen.add(normal.raw[i+1]);
  }
  assert.ok(red.size>40);
  assert.ok(green.size>40);
  assert.ok(normalRed.size>2);
  assert.ok(normalGreen.size>2);
  assert.equal(gltf.images.every(p=>p.mimeType==='image/png'&&p.bufferView!==undefined),true);
  assert.equal(gltf.images.some(p=>Object.hasOwn(p,'uri')),false);
  assert.equal(gltf.materials.filter(p=>p.pbrMetallicRoughness?.baseColorTexture).length,5);
});
test('every approved finish, drawer layout and thickness preserve actual size nodes while adding cabinet details',()=>{
  const textureHashes=new Map();
  for(const finish of ['natural','honey','walnut']){
    for(const drawers of [1,2]){
      for(const t of [4,6]){
        for(const lower_section of ['shelf','closed']){
          const c={...demoConcept(),finish,drawers,nominal_thickness_mm:t,lower_section,
            dimensions_mm:{width:300,height:380,depth:270}};
          const {gltf,bin}=parseGlb(showcaseNightstandGlb(c));
          const model=buildNightstand(c);
          const base=parseGlb(conceptGlb(c)).gltf;
          assert.equal(gltf.nodes.filter(n=>n.name.endsWith('-pull')).length,drawers);
          assert.equal(gltf.nodes.filter(n=>n.name.includes('-face-visual')).length,drawers);
          assert.equal(gltf.nodes.filter(n=>n.name==='lower-visual-face').length,lower_section==='closed'?1:0);
          assert.equal(gltf.nodes.find(n=>n.name==='top').scale[1],t/1000);
          assert.equal(gltf.nodes.find(n=>n.name==='top').scale[0],.3);
          assert.deepEqual(gltf.extras.source_dimensions_mm,{width:300,height:380,depth:270});
          assert.equal(gltf.extras.lower_section,lower_section);
          assert.equal(gltf.nodes.filter(n=>n.name.endsWith('-brass-sock')).length,4);
          assert.equal(gltf.nodes.slice(0,base.nodes.length).length,model.parts.length);
          for(let i=0;i<model.parts.length;i++){
            assert.equal(gltf.nodes[i].name,base.nodes[i].name);
            assert.deepEqual(gltf.nodes[i].translation,base.nodes[i].translation);
            assert.deepEqual(gltf.nodes[i].scale,base.nodes[i].scale);
          }
          if(!textureHashes.has(finish)){
            const png=parsePNG(gltf,bin,0);
            textureHashes.set(finish,png.raw[10000]+'-'+png.raw[11111]);
          }
        }
      }
    }
  }
  assert.equal(textureHashes.size,3);
  assert.ok(new Set([...textureHashes.values()]).size>=2);
});
test('viewer connects only pinned site library and blob data; app and offline service worker retain fallback',()=>{
  const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
  const source=readFileSync(new URL('./return-3d.mjs',import.meta.url),'utf8');
  const sw=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
  assert.match(html,/id="approved-glb-host"/);
  assert.match(html,/id="approved-3d-view"/);
  assert.match(html,/connect-src 'self' blob:/);
  assert.match(source,/vendor\/model-viewer-4\.1\.0\/model-viewer\.min\.js/);
  assert.match(source,/verifyPersonalSource\(source\)/);
  assert.match(source,/finishPersonalDesign\(source\)/);
  assert.doesNotMatch(source,/showcaseNightstandGlb\(approved\)/);
  assert.match(source,/next\.src=blobUrl/);
  assert.match(source,/URL\.revokeObjectURL/);
  assert.match(source,/webGLAvailable/);
  assert.match(source,/failGLB/);
  assert.match(sw,/assets\/vendor\/model-viewer-4\.1\.0\/model-viewer\.min\.js/);
  assert.match(sw,/'\.\/showcase-glb\.mjs'/);
  assert.match(sw,/'\.\/realistic-glb\.mjs'/);
  assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|supabase|openai/gi);
});
