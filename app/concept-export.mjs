/* ASSEMBL LAB MVP-14 — deterministic concept-only GLB 2.0 and part report.
 * Unit convention: source mm; glTF node translations/scales in METRES.
 * This deliberately does NOT validate engineering, collisions, loads or joinery.
 */
import {buildNightstand} from './concept-geometry.mjs';

const FACES=[
  {normal:[0,0,1],points:[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]},
  {normal:[0,0,-1],points:[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]},
  {normal:[1,0,0],points:[[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]]},
  {normal:[-1,0,0],points:[[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]},
  {normal:[0,1,0],points:[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]},
  {normal:[0,-1,0],points:[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]}
];
const MESH_KINDS=['top','side','back','shelf','drawer','leg'];
const FINISHES={
  natural:['#e0b988','#cba273','#9d754f'],
  honey:['#cb995f','#b77c44','#825533'],
  walnut:['#937057','#77543e','#503625']
};
const METER=0.001;
function assertModel(model){
  if(!model||model.certified!==false||!Array.isArray(model.parts)||
     !FINISHES[model.finish]||model.material!=='birch_plywood'||
     model.nominal_thickness_mm!==6||model.parts.length<10||model.parts.length>11)
    throw new TypeError('CONCEPT_ONLY_MODEL_REQUIRED');
  for(const p of model.parts){
    if(!MESH_KINDS.includes(p.kind)||!(/^(top|left|right|back|shelf|drawer-[12]|leg-[lrfb]+)$/.test(p.id))||
       ![p.x,p.y,p.z,p.width,p.height,p.depth].every(Number.isFinite)||
       [p.width,p.height,p.depth].some(v=>v<=0))
      throw new TypeError('INVALID_CONCEPT_PART');
  }
}
function meshBinary(){
  // 24 vertices (4 per face), paired normals, and 36 triangle indices.
  const bytes=new Uint8Array(24*3*4*2+36*2);
  const view=new DataView(bytes.buffer);
  let vertex=0, index=0;
  for(const face of FACES){
    for(const point of face.points){
      for(let i=0;i<3;i++){
        view.setFloat32(vertex*12+i*4,point[i],true);
        view.setFloat32(288+vertex*12+i*4,face.normal[i],true);
      }
      vertex++;
    }
    const start=vertex-4;
    for(const v of [0,1,2,0,2,3])view.setUint16(576+2*index++,start+v,true);
  }
  return bytes;
}
function rgb(hex){
  const n=Number.parseInt(hex.slice(1),16);
  return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255,1];
}
function materialColor(kind,finish){
  const [top,front,side]=FINISHES[finish];
  return rgb(kind==='top'?top:kind==='drawer'?front:side);
}
function pad4(n){return (n+3)&~3;}
function toGlb(gltf,bin){
  const json=new TextEncoder().encode(JSON.stringify(gltf));
  const jsonLen=pad4(json.length),binLen=pad4(bin.length);
  const output=new Uint8Array(12+8+jsonLen+8+binLen);
  const dv=new DataView(output.buffer);
  dv.setUint32(0,0x46546c67,true);
  dv.setUint32(4,2,true);
  dv.setUint32(8,output.byteLength,true);
  dv.setUint32(12,jsonLen,true);
  dv.setUint32(16,0x4e4f534a,true); // JSON
  output.fill(0x20,20,20+jsonLen);
  output.set(json,20);
  const base=20+jsonLen;
  dv.setUint32(base,binLen,true);
  dv.setUint32(base+4,0x004e4942,true); // BIN
  output.set(bin,base+8);
  return output;
}
function partEntry(part){
  return Object.freeze({
    id:part.id,kind:part.kind,
    center_mm:Object.freeze({x:part.x,y:part.y,z:part.z}),
    size_mm:Object.freeze({width:part.width,height:part.height,depth:part.depth}),
    bbox_mm:Object.freeze({
      min:Object.freeze([part.x-part.width/2,part.y-part.height/2,part.z-part.depth/2]),
      max:Object.freeze([part.x+part.width/2,part.y+part.height/2,part.z+part.depth/2])
    })
  });
}
export function conceptPartReport(concept,dimensions=concept?.dimensions_mm){
  const model=buildNightstand(concept,dimensions);
  assertModel(model);
  return Object.freeze({
    schema_version:'ASSEMBL-LAB.CONCEPT-PART-REPORT.0.1',
    geometry_kind:'UNVERIFIED_VOLUME_CONCEPT',
    source_kind:'synthetic',
    source_schema:concept.selected_slot==='DEMO'?'ASSEMBL-LAB.DEMO.0.1':'ASSEMBL-LAB.SELECTED-CONCEPT.0.1',
    source_slot:concept.selected_slot,
    source_scene:concept.scene_id,
    material:'birch_plywood',
    nominal_thickness_mm:6,
    glb_unit:'metre',
    source_unit:'millimetre',
    dimensions_mm:model.dimensions_mm,
    finish:model.finish,drawers:model.drawers,
    part_count:model.parts.length,
    parts:Object.freeze(model.parts.map(partEntry)),
    safety:Object.freeze({engineering_approval:false,manufacturing_approval:false,
      joinery_verified:false,load_verified:false,stability_verified:false,
      clearance_verified:false,collision_free_verified:false})
  });
}
export function conceptGlb(concept,dimensions=concept?.dimensions_mm){
  const model=buildNightstand(concept,dimensions);
  assertModel(model);
  const bin=meshBinary();
  const nodes=model.parts.map(p=>({
    name:p.id,mesh:MESH_KINDS.indexOf(p.kind),
    translation:[p.x*METER,p.y*METER,p.z*METER],
    scale:[p.width*METER,p.height*METER,p.depth*METER],
    extras:{id:p.id,kind:p.kind,size_mm:[p.width,p.height,p.depth],
      center_mm:[p.x,p.y,p.z],unverified:true}
  }));
  const views=[
    {buffer:0,byteOffset:0,byteLength:288,target:34962},
    {buffer:0,byteOffset:288,byteLength:288,target:34962},
    {buffer:0,byteOffset:576,byteLength:72,target:34963}
  ];
  const accessors=[
    {bufferView:0,componentType:5126,count:24,type:'VEC3',min:[-.5,-.5,-.5],max:[.5,.5,.5]},
    {bufferView:1,componentType:5126,count:24,type:'VEC3'},
    {bufferView:2,componentType:5123,count:36,type:'SCALAR',min:[0],max:[23]}
  ];
  const materials=MESH_KINDS.map(kind=>({
    name:'concept-'+kind,pbrMetallicRoughness:{
      baseColorFactor:materialColor(kind,model.finish),metallicFactor:0,roughnessFactor:.85
    },doubleSided:false
  }));
  const meshes=MESH_KINDS.map((kind,i)=>({
    name:'illustrative-'+kind,
    primitives:[{attributes:{POSITION:0,NORMAL:1},indices:2,material:i,mode:4}]
  }));
  const gltf={
    asset:{version:'2.0',generator:'ASSEMBL LAB conceptual volumes v0.1'},
    scene:0,scenes:[{nodes:nodes.map((_,i)=>i),name:'UNVERIFIED_NIGHTSTAND'}],
    nodes,meshes,materials,buffers:[{byteLength:bin.length}],
    bufferViews:views,accessors,
    extras:{geometry_kind:'UNVERIFIED_VOLUME_CONCEPT',source_kind:'synthetic',
      source_slot:concept.selected_slot,
      source_dimensions_mm:model.dimensions_mm,
      engineering_approval:false,manufacturing_approval:false}
  };
  return toGlb(gltf,bin);
}
export async function sha256Hex(bytes){
  if(!(bytes instanceof Uint8Array))throw new TypeError('BYTES_REQUIRED');
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function conceptExportBundle(concept,dimensions=concept?.dimensions_mm){
  const glb=conceptGlb(concept,dimensions);
  const report=conceptPartReport(concept,dimensions);
  const glbSha256=await sha256Hex(glb);
  return Object.freeze({
    glb,
    report:Object.freeze({...report,glb_sha256:glbSha256})
  });
}
