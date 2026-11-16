import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSelectedConcept,demoConcept,buildNightstand,projectNightstand,faceColor} from './concept-geometry.mjs';

function validPackage(){
  return {
    schema_version:'ASSEMBL-LAB.SELECTED-CONCEPT.0.1',
    source_kind:'synthetic',selected_slot:'B',scene_id:'SC-07',
    review:{scene_id:'SC-07',finish:'walnut',drawers:2,
      horizontal_position_percent:55,illustrative_scale_percent:91},
    design_intent:{
      schema_version:'ASSEMBL-LAB.DESIGN-INTENT.0.1',
      category:'freestanding_nightstand',source_kind:'synthetic',
      requested_dimensions_mm:{width:500,height:550,depth:350},
      dimension_confidence:'estimated',
      appearance:{finish:'walnut',drawers:2,lower_section:'shelf',notes:''},
      placement_preview:{horizontal_position_percent:55,relative_scale:91},
      construction_preferences:{material:'birch_plywood',nominal_thickness_mm:6,construction_verified:false},
      photo_included:false,engineering_approval:false,manufacturing_approval:false
    },
    photo_included:false,engineering_approval:false,manufacturing_approval:false
  };
}
function parse(x){return parseSelectedConcept(JSON.stringify(x));}
test('loads exact MVP-12 Design Intent selected B locally and returns frozen whitelist',()=>{
  const p=parse(validPackage());
  assert.equal(p.selected_slot,'B');
  assert.equal(p.scene_id,'SC-07');
  assert.equal(p.finish,'walnut');
  assert.equal(p.drawers,2);
  assert.equal(p.nominal_thickness_mm,6);
  assert.deepEqual(p.dimensions_mm,{width:500,height:550,depth:350});
  assert.deepEqual(Object.keys(p),[
    'selected_slot','scene_id','finish','drawers','placement_percent',
    'illustrative_scale_percent','dimensions_mm','material',
    'nominal_thickness_mm','source_kind','engineering_approval','manufacturing_approval'
  ]);
  assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.dimensions_mm));
});
test('the built-in sample is independent of imports and contains only design-only data',()=>{
  const p=demoConcept();
  assert.equal(p.source_kind,'synthetic');
  assert.equal(p.manufacturing_approval,false);
  assert.equal(p.selected_slot,'DEMO');
  assert.doesNotMatch(JSON.stringify(p),/http|token|email|photo_url|image_base64/i);
});
test('rejects unapproved top-level and nested fields including text, URLs, image bytes',()=>{
  for(const extra of ['photo_url','customer_email','upload','__secret']){
    const p=validPackage();p[extra]='sensitive';
    assert.throws(()=>parse(p),/CONCEPT_ROOT_INVALID/);
  }
  const nested=validPackage();nested.design_intent.appearance.notes='home address';
  assert.throws(()=>parse(nested),/CONCEPT_APPEARANCE_MISMATCH/);
  const nested2=validPackage();nested2.design_intent.requested_dimensions_mm.photo='private';
  assert.throws(()=>parse(nested2),/CONCEPT_DIMENSIONS_INVALID/);
  const nested3=validPackage();nested3.review.untrusted_url='https://example.invalid';
  assert.throws(()=>parse(nested3),/CONCEPT_REVIEW_INVALID/);
  const polluted='{"__proto__":{"admin":true},'+JSON.stringify(validPackage()).slice(1);
  assert.throws(()=>parseSelectedConcept(polluted),/CONCEPT_ROOT_INVALID/);
});
test('rejects invalid JSON, files beyond limit, and accessor inputs indirectly',()=>{
  for(const input of ['bad json','[]','null','{}','"hello"',' '.repeat(16001),42,null]){
    assert.throws(()=>parseSelectedConcept(input),TypeError);
  }
});
test('prevents faux approval, real photos, changed construction metadata or schema',()=>{
  for(const field of ['photo_included','engineering_approval','manufacturing_approval']){
    const p=validPackage();p[field]=true;
    assert.throws(()=>parse(p),/CONCEPT_APPROVAL_OR_PHOTO_INVALID/);
    const q=validPackage();q.design_intent[field]=true;
    assert.throws(()=>parse(q),/CONCEPT_APPROVAL_OR_PHOTO_INVALID/);
  }
  for(const [name,value] of [['material','steel'],['nominal_thickness_mm',4],['construction_verified',true]]){
    const p=validPackage();p.design_intent.construction_preferences[name]=value;
    assert.throws(()=>parse(p),/CONCEPT_MATERIAL_INVALID/);
  }
  const p=validPackage();p.design_intent.category='crib';
  assert.throws(()=>parse(p),/CONCEPT_INTENT_SCHEMA_INVALID/);
});
test('validates schema coherence for slot, scene, finish and number of drawers',()=>{
  for(const value of ['C','DEMO',null]){
    const p=validPackage();p.selected_slot=value;
    assert.throws(()=>parse(p),/CONCEPT_SLOT_INVALID/);
  }
  for(const id of ['SC-11','https://example.invalid','../photo.jpg']){
    const p=validPackage();p.scene_id=id;
    assert.throws(()=>parse(p),/CONCEPT_SCENE_INVALID/);
  }
  const p=validPackage();p.review.scene_id='SC-01';
  assert.throws(()=>parse(p),/CONCEPT_SCENE_INVALID/);
  const q=validPackage();q.review.finish='natural';
  assert.throws(()=>parse(q),/CONCEPT_APPEARANCE_MISMATCH/);
  const z=validPackage();z.review.drawers=3;
  assert.throws(()=>parse(z),/CONCEPT_DRAWERS_INVALID/);
});
test('dimension values must be integers within bounded conceptual ranges',()=>{
  for(const [field,bad] of [['width',199],['height',951],['depth',601],['width',500.5],['height','550'],['depth',null]]){
    const p=validPackage();p.design_intent.requested_dimensions_mm[field]=bad;
    assert.throws(()=>parse(p),/CONCEPT_(WIDTH|HEIGHT|DEPTH)_INVALID/);
  }
  for(const [field,bad] of [['horizontal_position_percent',80],['illustrative_scale_percent',30]]){
    const p=validPackage();p.review[field]=bad;
    assert.throws(()=>parse(p),/CONCEPT_(POSITION|SCALE)_INVALID/);
  }
  const q=validPackage();q.design_intent.placement_preview.relative_scale=95;
  assert.throws(()=>parse(q),/CONCEPT_PLACEMENT_MISMATCH/);
});
test('1-drawer and 2-drawer parametric concepts have bounded distinct physical volumes',()=>{
  for(const drawers of [1,2]){
    const concept={...demoConcept(),drawers};
    for(const dimensions of [
      {width:200,height:250,depth:200},
      {width:500,height:550,depth:350},
      {width:900,height:950,depth:600}
    ]){
      const model=buildNightstand(concept,dimensions);
      assert.equal(model.drawers,drawers);
      assert.equal(model.parts.length,9+drawers);
      assert.equal(model.parts.filter(p=>p.kind==='drawer').length,drawers);
      assert.ok(Object.isFrozen(model.parts));
      assert.equal(model.certified,false);
      for(const part of model.parts){
        assert.ok(part.x-part.width/2>=-dimensions.width/2-0.001);
        assert.ok(part.x+part.width/2<=dimensions.width/2+0.001);
        assert.ok(part.y-part.height/2>=-0.001);
        assert.ok(part.y+part.height/2<=dimensions.height+0.001);
        assert.ok(part.z-part.depth/2>=-dimensions.depth/2-0.001);
        assert.ok(part.z+part.depth/2<=dimensions.depth/2+0.001);
      }
    }
  }
});
test('rejects malformed geometry overrides and unsupported concept properties',()=>{
  assert.throws(()=>buildNightstand(demoConcept(),{width:500,height:550,depth:99999}),/DEPTH_INVALID/);
  assert.throws(()=>buildNightstand(demoConcept(),{width:500,height:550,depth:350,secret:1}),/DIMENSIONS_INVALID/);
  assert.throws(()=>buildNightstand({...demoConcept(),drawers:3}),/CONCEPT_INVALID/);
});
test('viewer produces sorted, finite faces at multiple camera angles',()=>{
  const model=buildNightstand(demoConcept());
  for(const azimuth of [0,32,90,180,270,360]){
    for(const elevation of [10,27,70]){
      const view=projectNightstand(model,azimuth,elevation,100);
      assert.ok(view.faces.length>0);
      assert.equal(view.view_box,'0 0 800 560');
      assert.equal(view.geometry_kind,'CONCEPT_ONLY');
      assert.ok(Object.isFrozen(view.faces));
      assert.deepEqual([...view.faces].map(f=>f.depth),[...view.faces].map(f=>f.depth).sort((a,b)=>a-b));
      for(const face of view.faces){
        assert.equal(face.points.length,4);
        assert.ok(face.points.every(pair=>pair.length===2&&pair.every(Number.isFinite)));
        assert.match(faceColor(view.palette,face.face,face.kind),/^#[0-9a-f]{6}$/);
      }
    }
  }
});
test('camera rejects unsafe/out-of-range values',()=>{
  const m=buildNightstand(demoConcept());
  for(const a of [-1,360.4,361,Infinity])assert.throws(()=>projectNightstand(m,a,27,100),/AZIMUTH_INVALID/);
  for(const e of [0,71,'27'])assert.throws(()=>projectNightstand(m,32,e,100),/ELEVATION_INVALID/);
  for(const z of [0,200,100.3])assert.throws(()=>projectNightstand(m,32,27,z),/ZOOM_INVALID/);
});
test('viewer source has no remote libraries, cloud APIs, persistence or hidden paid calls',()=>{
  const client=readFileSync(new URL('./concept-3d.mjs',import.meta.url),'utf8');
  const geometry=readFileSync(new URL('./concept-geometry.mjs',import.meta.url),'utf8');
  const html=readFileSync(new URL('./concept-3d.html',import.meta.url),'utf8');
  const sw=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/id="concept-file" accept="\.json,application\/json"/);
  assert.match(html,/id="concept-view"/);
  assert.match(sw,/'\.\/concept-geometry\.mjs'/);
  for(const src of [client,geometry]){
    assert.doesNotMatch(src,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|service_role|SUPABASE_URL|GEMINI_API_KEY/i);
  }
  assert.doesNotMatch(html,/<script[^>]*src="https?:\/\//i);
  assert.doesNotMatch(html,/https?:\/\/[^"']+\.(js|css)/i);
  const preview=readFileSync(new URL('./preview-lab.html',import.meta.url),'utf8');
  assert.match(preview,/href="\.\/concept-3d\.html"/);
});
