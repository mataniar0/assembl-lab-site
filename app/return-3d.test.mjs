import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildNightstand,projectNightstand,demoConcept} from './concept-geometry.mjs';

test('MVP-15 main PWA receives approved dimensions and nominal 4mm closed-bottom concept',()=>{
  const c=Object.freeze({...demoConcept(),drawers:2,finish:'walnut',
    lower_section:'closed',nominal_thickness_mm:4,
    dimensions_mm:Object.freeze({width:650,height:950,depth:500})});
  const model=buildNightstand(c);
  assert.equal(model.nominal_thickness_mm,4);
  assert.equal(model.lower_section,'closed');
  assert.equal(model.drawers,2);
  assert.equal(model.parts.filter(p=>p.kind==='drawer').length,2);
  assert.equal(model.parts.filter(p=>p.id==='lower-front').length,1);
  assert.equal(model.parts.find(p=>p.id==='top').height,4);
  assert.deepEqual(model.dimensions_mm,{width:650,height:950,depth:500});
  const projection=projectNightstand(model,32,27,100);
  assert.ok(projection.faces.some(face=>face.part_id==='lower-front'));
  assert.ok(projection.faces.some(face=>face.part_id==='drawer-2'));
  assert.equal(model.certified,false);
});
test('MVP-15 bound extremes from main app are representable as approximate volumes',()=>{
  for(const h of [200,250,550,950,1000]){
    for(const thickness of [4,6]){
      for(const lower of ['shelf','closed']){
        const c={...demoConcept(),drawers:2,nominal_thickness_mm:thickness,lower_section:lower};
        const model=buildNightstand(c,{width:200,height:h,depth:250});
        assert.equal(model.dimensions_mm.height,h);
        assert.equal(model.nominal_thickness_mm,thickness);
        assert.equal(model.parts.filter(p=>p.kind==='front').length,lower==='closed'?1:0);
        for(const p of model.parts){
          assert.ok(p.y-p.height/2>=-0.001,p.id+' below base');
          assert.ok(p.y+p.height/2<=h+0.001,p.id+' above top');
        }
      }
    }
  }
});
test('MVP-15 rejects unsupported or nonfinite main app inputs safely',()=>{
  for(const t of [0,3,7,'6'])assert.throws(
    ()=>buildNightstand({...demoConcept(),nominal_thickness_mm:t}),/CONCEPT_INVALID/);
  for(const lower of ['image','drawer','notes',''] )assert.throws(
    ()=>buildNightstand({...demoConcept(),lower_section:lower}),/CONCEPT_INVALID/);
  for(const height of [199,1001,Number.NaN,Infinity])assert.throws(
    ()=>buildNightstand(demoConcept(),{width:500,height,depth:350}),/HEIGHT_INVALID/);
});
test('MVP-26 round coffee approval returns fixed, verified Personal Coffee Table GLB',()=>{
  const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('./return-3d.css',import.meta.url),'utf8');
  const renderer=readFileSync(new URL('./return-3d.mjs',import.meta.url),'utf8');
  const snapshot=readFileSync(new URL('./nightstand-intent.js',import.meta.url),'utf8');
  const sw=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
  assert.match(html,/id="approved-3d"/);
  assert.match(html,/id="approved-coffee-fallback"/);
  assert.match(html,/id="approved-glb-host"/);
  assert.match(html,/id="approved-3d-summary"[^>]+aria-live="polite"/);
  assert.match(html,/data-he="מודל שולחן הקפה האישי לצפייה"/);
  assert.match(html,/שאינו מותאם למידות/);
  assert.match(html,/שולחן קפה עגול — פיילוט/);
  assert.match(html,/<script type="module" src="\.\/return-3d\.mjs\?v=mvp27-20261118"><\/script>/);
  assert.match(html,/script-src 'self' 'wasm-unsafe-eval'/);
  assert.match(snapshot,/assembl:3d-model-ready/);
  assert.match(snapshot,/approvedSnapshot\?\.requested_dimensions_mm/);
  assert.match(renderer,/addEventListener\('assembl:3d-model-ready'/);
  assert.match(renderer,/fetch\(sourceGlb\)/);
  assert.match(renderer,/verifyPersonalSource\(source\)/);
  assert.match(renderer,/finishPersonalDesign\(source\)/);
  assert.match(renderer,/FIXED_PERSONAL_COFFEE_REFERENCE_GLB/);
  assert.match(renderer,/fallbackPhoto\.hidden=false/);
  assert.match(renderer,/svg\.setAttribute\('hidden',''\)/);
  assert.match(renderer,/fallbackPhoto\.hidden=true/);
  assert.match(renderer,/URL\.revokeObjectURL/);
  assert.match(sw,/'\.\.\/table\/personal\/media\/personal-design-preview\.glb'/);
  assert.match(sw,/'\.\.\/table\/personal\/media\/01-hero-finished-angled-960\.webp'/);
  assert.match(css,/#approved-coffee-fallback/);
  assert.doesNotMatch(renderer,/buildNightstand\(|showcaseNightstandGlb\(/);
  assert.doesNotMatch(renderer,/localStorage|sessionStorage|XMLHttpRequest|WebSocket|sendBeacon|indexedDB/i);
  assert.doesNotMatch(snapshot,/detail:approvedSnapshot|detail:designIntent\(/);
  const studio=readFileSync(new URL('./design-studio.js',import.meta.url),'utf8');
  assert.match(studio,/data-furniture="round-coffee-table"/);
  assert.match(studio,/function coffeeTableSvg/);
  assert.match(studio,/function usesReferencePhoto/);
  assert.match(studio,/root\.dataset\.referencePhoto/);
  assert.match(studio,/paintRoom\(scene,v\.design\)/);
  assert.match(html,/demo-room\.css\?v=mvp27-20261118/);
  const demoCSS=readFileSync(new URL('./demo-room.css',import.meta.url),'utf8');
  assert.match(demoCSS,/coffee-reference-room\.webp/);
  assert.match(demoCSS,/coffee-empty-room\.webp/);
  for(const name of ['coffee-reference-room.webp','coffee-empty-room.webp']){
    const image=readFileSync(new URL('./assets/'+name,import.meta.url));
    assert.equal(image.toString('ascii',0,4),'RIFF',name);
    assert.equal(image.toString('ascii',8,12),'WEBP',name);
    assert.ok(image.byteLength<5000,name+' asset budget');
    assert.ok(sw.includes("'./assets/"+name+"'"),name+' cached offline');
  }
  assert.doesNotMatch(studio,/nightstandSvg|drawers|lower_section|id="bottom"/);
  assert.match(snapshot,/category:'round_coffee_table'/);
  assert.match(snapshot,/requested_dimensions_mm:\{diameter:/);
  assert.match(snapshot,/tabletop_thickness_mm/);
  assert.match(renderer,/base_style:d.base_style/);
  assert.match(renderer,/diameter:d.dimensions_mm.diameter/);
  assert.doesNotMatch(renderer,/\bdrawers\b|\blower_section\b/);
  for(const selector of ['diameter-cm','height-cm','base-style','top-thickness-mm'])
    assert.match(html,new RegExp('id="'+selector+'"'));
  for(const obsolete of ['drawers','bottom','width-cm','depth-cm','plywood-thickness'])
    assert.doesNotMatch(html,new RegExp('id="'+obsolete+'"'));
  assert.match(html,/design-studio\.js\?v=mvp27-20261118/);
  assert.match(sw,/design-studio\.js\?v=mvp27-20261118/);
});
