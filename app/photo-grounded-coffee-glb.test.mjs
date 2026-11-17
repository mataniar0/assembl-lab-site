import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 finishPersonalDesign,verifyPersonalSource,
 PERSONAL_DESIGN_SOURCE_SHA256,PERSONAL_DESIGN_SOURCE_BYTES
} from './photo-grounded-coffee-glb.mjs';

const original=readFileSync(new URL('../table/personal/media/personal-design-preview.glb',import.meta.url));
function parse(bytes){
  const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  assert.equal(dv.getUint32(0,true),0x46546c67);
  assert.equal(dv.getUint32(4,true),2);
  assert.equal(dv.getUint32(8,true),bytes.length);
  const length=dv.getUint32(12,true);
  assert.equal(length%4,0);
  assert.equal(dv.getUint32(16,true),0x4e4f534a);
  assert.equal(dv.getUint32(24+length,true),0x004e4942);
  const doc=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+length)).trim());
  const bin=bytes.slice(28+length);
  for(const view of doc.bufferViews){
    assert.equal(view.byteOffset%4,0);
    assert.ok(view.byteOffset+view.byteLength<=doc.buffers[0].byteLength);
  }
  return {doc,bin};
}
test('uses checksum-pinned exact frozen 32-part CTB-01 design source, not invented straight-leg model',async()=>{
  assert.equal(original.byteLength,PERSONAL_DESIGN_SOURCE_BYTES);
  assert.equal(createHash('sha256').update(original).digest('hex'),PERSONAL_DESIGN_SOURCE_SHA256);
  await verifyPersonalSource(original);
  await assert.rejects(verifyPersonalSource(new Uint8Array(original.length)),/HASH_MISMATCH/);
  const source=parse(original).doc;
  assert.equal(source.meshes.length,32);
  assert.equal(source.nodes.length,33);
  const finished=parse(finishPersonalDesign(original)).doc;
  assert.equal(finished.meshes.length,32);
  assert.equal(finished.nodes.length,33);
  assert.equal(finished.extras.geometry_kind,'CTB01_PHOTO_GROUNDED_DESIGN_PREVIEW');
  assert.equal(finished.extras.source_design_glb_sha256,PERSONAL_DESIGN_SOURCE_SHA256);
  assert.equal(finished.extras.paired_curved_legs,3);
  assert.equal(finished.extras.paired_leg_plates,6);
  assert.equal(finished.extras.connecting_ring_parts,1);
  assert.equal(finished.extras.photo_exact_reconstruction,false);
  assert.equal(finished.extras.manufacturing_approval,false);
  assert.equal(finished.extras.engineering_approval,false);
  assert.equal(finished.extras.dimensions_are_design_only,true);
  assert.equal(finished.extras.top_plate_diameter_m,.35);
  assert.equal(finished.extras.source_height_m,.5);
});
test('preserves all source vertices, normals, triangle indices and transforms exactly',()=>{
  const src=parse(original),output=parse(finishPersonalDesign(original));
  const sourceBinLength=src.doc.buffers[0].byteLength;
  // Compare digests, not Buffer vs Uint8Array prototypes: both byte sequences
  // must be exactly identical and giant test diff logs are unhelpful.
  const digest=x=>createHash('sha256').update(x).digest('hex');
  assert.equal(digest(output.bin.subarray(0,sourceBinLength)),
    digest(src.bin.subarray(0,sourceBinLength)));
  assert.deepEqual(output.doc.nodes[0].matrix,src.doc.nodes[0].matrix);
  assert.deepEqual(output.doc.scenes[0].nodes,src.doc.scenes[0].nodes);
  for(let i=0;i<32;i++){
    const a=src.doc.meshes[i].primitives[0];
    const b=output.doc.meshes[i].primitives[0];
    assert.equal(a.indices,b.indices,'source triangle indices must be preserved');
    assert.equal(a.attributes.POSITION,b.attributes.POSITION);
    assert.equal(a.attributes.NORMAL,b.attributes.NORMAL);
    assert.ok(!('COLOR_0' in b.attributes),'original brown swatch replaced');
    assert.equal(b.material,[27,28,29,30].includes(i)?0:
      (i>=1&&i<=18?1:(i===31?2:3)));
    assert.equal(output.doc.nodes[i+1].extras.source_geometry_retained,true);
  }
  assert.equal(output.doc.nodes.filter(n=>/photo-finish-node-L[123]_P01_[12]/.test(n.name)).length,6);
  assert.ok(output.doc.nodes.some(n=>n.name==='photo-finish-node-P06_BONDED'));
});
test('photo-informed finish actually uses timber-grain PBR and dark curved leg/ring materials',()=>{
  const {doc,bin}=parse(finishPersonalDesign(original));
  assert.equal(doc.images.length,2);
  assert.equal(doc.materials.length,4);
  assert.equal(doc.materials[0].pbrMetallicRoughness.baseColorTexture.index,0);
  assert.equal(doc.materials[0].normalTexture.index,1);
  assert.ok(doc.materials[1].pbrMetallicRoughness.baseColorFactor[0]<.08);
  assert.ok(doc.materials[2].pbrMetallicRoughness.baseColorFactor[0]<.08);
  for(let i=0;i<2;i++){
    const image=doc.images[i],v=doc.bufferViews[image.bufferView];
    assert.deepEqual([...bin.subarray(v.byteOffset,v.byteOffset+8)],
      [137,80,78,71,13,10,26,10]);
  }
  for(let i of [27,28,29,30]){
    const p=doc.meshes[i].primitives[0],uv=doc.accessors[p.attributes.TEXCOORD_0],
      pos=doc.accessors[p.attributes.POSITION];
    assert.equal(uv.count,pos.count);
    assert.equal(uv.componentType,5126);
    assert.equal(uv.type,'VEC2');
  }
  assert.ok(doc.extras.source_part_identifiers.includes('P07R1'));
  assert.ok(doc.extras.source_part_identifiers.includes('P07R2'));
});
test('the two model finishes are deterministic and no private/customer data is included',()=>{
  const a=finishPersonalDesign(original),b=finishPersonalDesign(original);
  assert.equal(createHash('sha256').update(a).digest('hex'),
    createHash('sha256').update(b).digest('hex'));
  const {doc}=parse(a);
  assert.doesNotMatch(JSON.stringify(doc),/https?:\/\/|customer_email|private_note|user_photo|base64,/i);
});
