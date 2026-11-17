/* MVP-21: finish-map the archived CTB-01 32-part design GLB to the photographed
 * Personal Coffee Table. No geometry is generated or silently replaced.
 *
 * Source is the exact 32-mesh DESIGN_ONLY candidate SHA-256 validated below:
 * paired *curved* legs (3 pairs), cross spacers, ring, radial supports,
 * circular 350mm prototype discs and finger-jointed ~50mm-deep rim.
 *
 * The warm-wood and black finish is PHOTO-GROUNDED from published finished
 * photographs 01/06; dimensions remain DESIGN_ONLY and have never been
 * verified against the manufactured object.
 *
 * A normal mapped procedural veneer is bundled INSIDE the returned GLB.
 * Original vertex positions/normals/triangles and scene transforms stay intact.
 * Never use for fabrication or customer-measurement claims.
 */
import {generateTextures} from './realistic-glb.mjs';

export const PERSONAL_DESIGN_SOURCE_SHA256 =
  '17da2aafb7f17182b940804c22cb2be8dc0430cad26f20c76ca78e08ae9b8841';
export const PERSONAL_DESIGN_SOURCE_BYTES = 1700936;
const WOOD_PARTS=new Set([27,28,29,30]);
const LEG_PARTS=new Set([1,2,7,8,13,14]);
const RING_PART=31;
const SIX_SPACERS_PER_LEG=true;
const PART_NAMES=[
  'P03','L1_P01_1','L1_P01_2','L1_S1','L1_S2','L1_S3','L1_S4',
  'L2_P01_1','L2_P01_2','L2_S1','L2_S2','L2_S3','L2_S4',
  'L3_P01_1','L3_P01_2','L3_S1','L3_S2','L3_S3','L3_S4',
  'P04L','P04U','P05_1','P05_2','P05_3','P05_4','P05_5','P05_6',
  'P07B','P07T','P07R1','P07R2','P06_BONDED'
];
const decoder=new TextDecoder(),encoder=new TextEncoder();
const aligned=n=>(n+3)&~3;

function parse(source){
  const bytes=source instanceof Uint8Array?source:new Uint8Array(source);
  if(bytes.byteLength!==PERSONAL_DESIGN_SOURCE_BYTES)
    throw new Error('PERSONAL_SOURCE_SIZE_MISMATCH');
  const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2||
     dv.getUint32(8,true)!==bytes.length||dv.getUint32(16,true)!==0x4e4f534a)
    throw new Error('PERSONAL_SOURCE_INVALID_GLB');
  const n=dv.getUint32(12,true),binOffset=20+n;
  if(binOffset+8>bytes.length||dv.getUint32(binOffset+4,true)!==0x004e4942)
    throw new Error('PERSONAL_SOURCE_INVALID_CHUNKS');
  const doc=JSON.parse(decoder.decode(bytes.subarray(20,20+n)).trim());
  const binBytes=dv.getUint32(binOffset,true);
  if(doc.asset?.version!=='2.0'||doc.meshes?.length!==32||
     doc.nodes?.length!==33||doc.scenes?.[0]?.nodes?.[0]!==0||
     doc.meshes.some((mesh,i)=>mesh.primitives?.length!==1||
       mesh.name!=='design-part-'+String(i+1).padStart(2,'0')))
    throw new Error('PERSONAL_SOURCE_REVISION_INVALID');
  if(binOffset+8+binBytes!==bytes.byteLength)throw new Error('PERSONAL_BIN_LENGTH');
  return {doc,bin:bytes.slice(binOffset+8),source:bytes};
}
export async function verifyPersonalSource(source){
  const bytes=source instanceof Uint8Array?source:new Uint8Array(source);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const actual=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
  if(actual!==PERSONAL_DESIGN_SOURCE_SHA256)throw new Error('PERSONAL_SOURCE_HASH_MISMATCH');
  return parse(bytes);
}

function positionAccessorView(doc,bin,meshIndex){
  const primitive=doc.meshes[meshIndex].primitives[0];
  const idx=primitive.attributes.POSITION;
  const accessor=doc.accessors[idx],view=doc.bufferViews[accessor.bufferView];
  if(accessor.componentType!==5126||accessor.type!=='VEC3'||
     !Number.isInteger(accessor.count)||accessor.count<3)throw Error('POSITION_FORMAT');
  const offset=(view.byteOffset??0)+(accessor.byteOffset??0);
  if(offset+accessor.count*12>bin.length||offset%4!==0)throw Error('POSITION_BOUNDS');
  const data=new DataView(bin.buffer,bin.byteOffset+offset,accessor.count*12);
  return {accessor,data};
}
function pack(doc,binary){
  const jsonBytes=encoder.encode(JSON.stringify(doc));
  const jsonLen=aligned(jsonBytes.length),binLen=aligned(binary.length);
  const result=new Uint8Array(12+8+jsonLen+8+binLen);
  const dv=new DataView(result.buffer);
  dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);
  dv.setUint32(8,result.byteLength,true);
  dv.setUint32(12,jsonLen,true);dv.setUint32(16,0x4e4f534a,true);
  result.fill(32,20,20+jsonLen);result.set(jsonBytes,20);
  const off=20+jsonLen;
  dv.setUint32(off,binLen,true);dv.setUint32(off+4,0x004e4942,true);
  result.set(binary,off+8);
  return result;
}
export function finishPersonalDesign(source){
  const {doc,bin,source:original}=parse(source);
  const portions=[bin],blen=[bin.length];
  let length=bin.length;
  function append(part,target){
    const bytes=part instanceof Uint8Array?part:new Uint8Array(part);
    const padding=aligned(length)-length;
    if(padding){portions.push(new Uint8Array(padding));length+=padding;}
    const viewIndex=doc.bufferViews.length;
    const view={buffer:0,byteOffset:length,byteLength:bytes.byteLength};
    if(target)view.target=target;
    doc.bufferViews.push(view);
    portions.push(bytes);length+=bytes.byteLength;
    return viewIndex;
  }

  // All published source vertex indices, normal vectors and triangles are
  // retained byte-for-byte. Remove the original tan per-vertex swatch so that
  // physically based materials reflect the finished photographed color.
  const textures=generateTextures('honey');
  const diffuse=append(textures.colour),normal=append(textures.normals);
  doc.images=[
    {name:'Illustrative warm timber grain',bufferView:diffuse,mimeType:'image/png'},
    {name:'Wood surface relief',bufferView:normal,mimeType:'image/png'}
  ];
  doc.samplers=[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}];
  doc.textures=[{sampler:0,source:0},{sampler:0,source:1}];
  doc.materials=[
    {name:'Warm timber circular top – photos 01/06 reference',
     pbrMetallicRoughness:{baseColorFactor:[1.17,1.13,1.08,1],
       baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:.73},
     normalTexture:{index:1,scale:.14},doubleSided:true},
    {name:'Finished near-black laminated curved legs and pairing spacers',
     pbrMetallicRoughness:{baseColorFactor:[.035,.038,.041,1],
       metallicFactor:.035,roughnessFactor:.59},doubleSided:true},
    {name:'Finished matte black connecting ring and radial supports',
     pbrMetallicRoughness:{baseColorFactor:[.045,.047,.05,1],
       metallicFactor:.03,roughnessFactor:.61},doubleSided:true},
    {name:'Dark support under top',
     pbrMetallicRoughness:{baseColorFactor:[.12,.10,.075,1],
       metallicFactor:0,roughnessFactor:.72},doubleSided:true}
  ];
  const woodCount=WOOD_PARTS.size;
  for(let i=0;i<32;i++){
    const primitive=doc.meshes[i].primitives[0];
    delete primitive.attributes.COLOR_0;
    primitive.material=WOOD_PARTS.has(i)?0:
      (LEG_PARTS.has(i)||(i>=1&&i<=18)?1:(i===RING_PART?2:3));
    doc.meshes[i].name='photo-finish-'+PART_NAMES[i];
    doc.nodes[i+1].name='photo-finish-node-'+PART_NAMES[i];
    doc.nodes[i+1].extras={source_part:PART_NAMES[i],
      material_role:WOOD_PARTS.has(i)?'WARM_WOOD':
        (i>=1&&i<=18?'PAIRED_BLACK_CURVED_LEG':i===RING_PART?'BLACK_RING':'UNDER_TOP_SUPPORT'),
      source_geometry_retained:true,measured_from_photo:false,
      manufacturing_approval:false};
    if(!WOOD_PARTS.has(i))continue;
    const {data,accessor}=positionAccessorView(doc,bin,i);
    const uv=new Float32Array(accessor.count*2);
    for(let j=0;j<accessor.count;j++){
      const x=data.getFloat32(j*12,true),y=data.getFloat32(j*12+4,true),
        z=data.getFloat32(j*12+8,true);
      if(i<=28){
        uv[2*j]=x/.35+.5;
        uv[2*j+1]=y/.35+.5;
      }else{
        const theta=Math.atan2(y,x);
        uv[2*j]=((theta+Math.PI)/(2*Math.PI))*1.5;
        uv[2*j+1]=(z-.45)/.050;
      }
    }
    const viewIndex=append(new Uint8Array(uv.buffer),34962);
    const accessorIndex=doc.accessors.length;
    doc.accessors.push({bufferView:viewIndex,componentType:5126,
      count:accessor.count,type:'VEC2'});
    primitive.attributes.TEXCOORD_0=accessorIndex;
  }
  const combined=new Uint8Array(aligned(length));
  let at=0;for(const portion of portions){combined.set(portion,at);at+=portion.length;}
  if(at!==length)throw Error('BIN_PACK_LENGTH_MISMATCH');
  doc.buffers[0].byteLength=length;
  doc.asset.generator='ASSEMBL LAB photo-grounded CTB-01 finish preview v1';
  doc.asset.extras={designation:'DESIGN_ONLY / photographed finish reference / NOT AS-BUILT VERIFIED'};
  doc.extras={
    geometry_kind:'CTB01_PHOTO_GROUNDED_DESIGN_PREVIEW',
    source_design_glb_sha256:PERSONAL_DESIGN_SOURCE_SHA256,
    source_mesh_count:32,
    source_part_identifiers:PART_NAMES,
    preserved_geometry:true,
    top_plate_diameter_m:.35,source_height_m:.5,
    dimensions_are_design_only:true,
    photo_references:['01-hero-finished-angled','06-leg-structure','05-underside-structure'],
    paired_curved_legs:3,paired_leg_plates:6,connecting_ring_parts:1,
    timber_finish_derived_from_photos:true,
    photo_exact_reconstruction:false,
    engineering_approval:false,manufacturing_approval:false,
    source_byte_length:original.length
  };
  return pack(doc,combined);
}
