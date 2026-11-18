import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {matchingCoffeeTableGlb,roundWoodTop,slimSplayedLeg,COFFEE_SHOWROOM} from './coffee-showroom-glb.mjs';

function parse(){
  const bytes=matchingCoffeeTableGlb();
  const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  assert.equal(dv.getUint32(0,true),0x46546c67);
  assert.equal(dv.getUint32(4,true),2);
  assert.equal(dv.getUint32(8,true),bytes.length);
  const size=dv.getUint32(12,true);
  const json=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+size)).trim());
  const bin=bytes.subarray(size+28);
  assert.equal(dv.getUint32(size+24,true),0x004e4942);
  for(const v of json.bufferViews){
    assert.equal(v.byteOffset%4,0);
    assert.ok(v.byteOffset+v.byteLength<=bin.byteLength);
  }
  return {bytes,json,bin};
}
test('same-source showroom GLB contains round wood top and three dark outward-tapered legs',()=>{
  const {json,bytes}=parse();
  assert.equal(json.asset.version,'2.0');
  assert.equal(json.extras.geometry_kind,'MATCHED_COFFEE_TABLE_SHOWROOM');
  assert.equal(json.extras.coherence_key,'personal-coffee-3d-is-hero-source');
  assert.equal(json.extras.marketing_assets,'hero snapshot captured directly from this GLB');
  assert.equal(json.extras.engineering_approval,false);
  assert.equal(json.extras.manufacturing_approval,false);
  assert.equal(json.extras.verified_as_built,false);
  assert.deepEqual(json.extras.nominal_dimensions_mm,{diameter:620,height:455,top_thickness:29});
  assert.equal(json.nodes.filter(n=>n.name.startsWith('satin-black-tapered-leg-')).length,3);
  assert.equal(json.nodes.filter(n=>n.name.startsWith('underside-bracket-')).length,3);
  assert.equal(json.nodes[0].name,'oak-round-tabletop');
  assert.equal(json.meshes.length,7);
  assert.equal(json.materials.length,3);
  assert.equal(json.images.length,2);
  assert.equal(json.textures.length,2);
  assert.equal(json.scenes[0].name,'MATCHED_COFFEE_TABLE_SHOWROOM_VISUAL_ONLY');
  assert.equal(json.scenes[0].nodes.length,7);
  assert.ok(bytes.byteLength>200_000);
  assert.deepEqual(bytes,matchingCoffeeTableGlb());
  assert.doesNotMatch(JSON.stringify(json),/https?:\/\/|private|email|client_photo|base64,/i);
});
test('top meshes actually form a round bevelled 620mm tabletop and leg mounts',()=>{
  const top=roundWoodTop();
  assert.ok(top.position.length/3>1200);
  assert.ok(top.index.length/3>2000);
  const xs=top.position.filter((_,i)=>i%3===0);
  const ys=top.position.filter((_,i)=>i%3===1);
  const zs=top.position.filter((_,i)=>i%3===2);
  assert.ok(Math.abs(Math.max(...xs)-310)<.001);
  assert.ok(Math.abs(Math.min(...xs)+310)<.001);
  assert.ok(Math.abs(Math.max(...zs)-310)<.001);
  assert.ok(Math.abs(Math.min(...zs)+310)<.001);
  assert.equal(Math.max(...ys),455);
  assert.equal(Math.min(...ys),426);
  assert.equal(top.uv.length,top.position.length/3*2);
  assert.ok(top.normal.some(n=>n>.98));
  for(let i=0;i<3;i++){
    const leg=slimSplayedLeg(i*2*Math.PI/3+Math.PI/6);
    const height=leg.position.filter((_,j)=>j%3===1);
    assert.equal(Math.max(...height),424);
    assert.equal(Math.min(...height),0);
    assert.equal(leg.uv.length,leg.position.length/3*2);
    assert.ok(leg.index.length/3>16);
  }
  assert.equal(COFFEE_SHOWROOM.verified_as_built,false);
});
test('legacy three-straight-leg proxy is retired from customer app; exact CTB-01 model is used',()=>{
  const source=readFileSync(new URL('./personal-coffee-hero.mjs',import.meta.url),'utf8');
  const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
  const sw=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/matchingCoffeeTableGlb\(\)/);
  assert.doesNotMatch(source,/toDataURL\('image\/png'\)/);
  assert.match(source,/finishPersonalDesign\(original\)/);
  assert.match(source,/verifyPersonalSource\(original\)/);
  assert.match(html,/media\/personal-coffee-front-showcase-960\.webp/);
  assert.match(html,/תמונת הראווה היא הדמיה ערוכה/);
  assert.match(html,/data-model-src="\.\.\/table\/personal\/media\/personal-design-preview\.glb"/);
  assert.match(sw,/'\.\/photo-grounded-coffee-glb\.mjs'/);
  assert.doesNotMatch(sw,/'\.\/coffee-showroom-glb\.mjs'/);
});
