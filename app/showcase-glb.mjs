/* MVP-16: enhanced showroom GLB from the approved nightstand geometry.
 * The same real glTF 2.0 structure used in the product catalog viewer.
 * Decorative metal pulls are visual details, NOT engineering-approved joinery.
 * No runtime remote dependencies, photos, text prompts or sensitive information.
 */
import {conceptGlb} from './concept-export.mjs';
import {buildNightstand} from './concept-geometry.mjs';

const encoder=new TextEncoder();
const decoder=new TextDecoder();
const mm=0.001;
const aligned=n=>(n+3)&~3;
function unpack(bytes){
  if(!(bytes instanceof Uint8Array))throw new TypeError('GLB_BYTES_REQUIRED');
  const data=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(data.getUint32(0,true)!==0x46546c67||data.getUint32(4,true)!==2||
    data.getUint32(8,true)!==bytes.byteLength)throw new Error('INVALID_GLTF');
  const n=data.getUint32(12,true);
  const gltf=JSON.parse(decoder.decode(bytes.subarray(20,20+n)).trimEnd());
  const offset=20+n;
  if(data.getUint32(16,true)!==0x4e4f534a||data.getUint32(offset+4,true)!==0x004e4942)
    throw new Error('GLB_CHUNKS_INVALID');
  return {gltf,bin:bytes.slice(offset+8)};
}
function pack(gltf,bin){
  const json=encoder.encode(JSON.stringify(gltf));
  const jsonSize=aligned(json.byteLength),binSize=aligned(bin.byteLength);
  const output=new Uint8Array(12+8+jsonSize+8+binSize);
  const dv=new DataView(output.buffer);
  dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);
  dv.setUint32(8,output.byteLength,true);
  dv.setUint32(12,jsonSize,true);dv.setUint32(16,0x4e4f534a,true);
  output.fill(0x20,20,20+jsonSize);output.set(json,20);
  const offset=20+jsonSize;
  dv.setUint32(offset,binSize,true);dv.setUint32(offset+4,0x004e4942,true);
  output.set(bin,offset+8);
  return output;
}
export function showcaseNightstandGlb(concept){
  const model=buildNightstand(concept,concept.dimensions_mm);
  const {gltf,bin}=unpack(conceptGlb(concept,concept.dimensions_mm));
  const metalIndex=gltf.materials.length;
  gltf.materials.push({
    name:'Satin warm brass - illustrative pulls',
    pbrMetallicRoughness:{
      baseColorFactor:[0.70,0.54,0.30,1],metallicFactor:.68,roughnessFactor:.31
    },doubleSided:false
  });
  const metalMesh=gltf.meshes.length;
  gltf.meshes.push({name:'Decorative handle details (not engineering CAD)',
    primitives:[{attributes:{POSITION:0,NORMAL:1},indices:2,material:metalIndex,mode:4}]});
  const front=model.dimensions_mm.depth/2;
  function addBox(name,x,y,z,width,height,depth){
    if(![x,y,z,width,height,depth].every(Number.isFinite)||
       [width,height,depth].some(v=>v<=0))throw new Error('INVALID_SHOWCASE_PART');
    const index=gltf.nodes.length;
    gltf.nodes.push({name,mesh:metalMesh,
      translation:[x*mm,y*mm,z*mm],
      scale:[width*mm,height*mm,depth*mm],
      extras:{role:'decorative_handle_only',engineering_approval:false}
    });
    gltf.scenes[0].nodes.push(index);
  }
  for(const drawer of model.parts.filter(p=>p.kind==='drawer')){
    const bar=Math.min(110,Math.round(model.dimensions_mm.width*.24));
    const y=drawer.y;
    addBox(drawer.id+'-pull',0,y,front+13,bar,7,8);
    addBox(drawer.id+'-left-post',-bar*.38,y,front+6,7,8,13);
    addBox(drawer.id+'-right-post',bar*.38,y,front+6,7,8,13);
  }
  // A presentation-oriented material finish improves the look under the
  // viewer's physically based illumination without pretending to show grain.
  for(const [i,m]of gltf.materials.entries()){
    if(i===metalIndex)continue;
    m.pbrMetallicRoughness.roughnessFactor=.72;
    m.pbrMetallicRoughness.metallicFactor=0;
  }
  gltf.asset.generator='ASSEMBL LAB showroom 3D (procedural concept) v0.1';
  gltf.extras={...gltf.extras,geometry_kind:'SHOWROOM_CONCEPT_GLB',
    decorative_handles:true,source_version:concept.version_id||'unknown',
    engineering_approval:false,manufacturing_approval:false};
  return pack(gltf,bin);
}
