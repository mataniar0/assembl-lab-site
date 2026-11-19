import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const binary=path=>readFileSync(new URL(path,import.meta.url));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

test('intro uses the exact existing Geometric clean product image and separate frame-only GLB',()=>{
  const image=binary('../assets/geometric-engineering-object-clean.webp');
  const model=binary('../geometric/media/geometric-v11-design-only.glb');
  const sourcePage=read('../geometric/index.html');
  const html=read('./development/index.html');
  const js=read('./personal-coffee-hero.mjs');
  assert.equal(image.length,46360);
  assert.equal(image.toString('ascii',0,4),'RIFF');
  assert.equal(image.toString('ascii',8,12),'WEBP');
  assert.equal(model.length,58312);
  assert.equal(model.toString('ascii',0,4),'glTF');
  assert.equal(model.readUInt32LE(4),2);
  assert.equal(model.readUInt32LE(8),model.byteLength);
  assert.match(sourcePage,/data-model-src="media\/geometric-v11-design-only\.glb"/);
  assert.match(sourcePage,/הפלטה העליונה אינה כלולה/);
  assert.match(sourcePage,/שלדת Geometric V1\.1 בלבד \(15 חלקים\)/);
  assert.match(html,/src="\.\.\/\.\.\/assets\/geometric-engineering-object-clean\.webp"/);
  assert.match(html,/data-model-src="\.\.\/\.\.\/geometric\/media\/geometric-v11-design-only\.glb"/);
  assert.match(html,/href="\.\.\/\.\.\/geometric\/"/);
  assert.match(html,/שלדה בת 15 חלקים ללא פלטה עליונה/);
  assert.match(js,/geometric\/media\/geometric-v11-design-only\.glb/);
  assert.match(js,/next\.src=sourceGlb/);
  assert.doesNotMatch(js,/finishPersonalDesign|matchingCoffeeTableGlb|showcaseNightstandGlb/);
});
test('intro Geometric image is different from approved Personal Coffee Table reference',()=>{
  const html=read('./development/index.html');
  const return3d=read('./return-3d.mjs');
  const coffee=binary('../table/personal/media/personal-design-preview.glb');
  assert.equal(coffee.length,1700936);
  assert.equal(sha256(coffee),'17da2aafb7f17182b940804c22cb2be8dc0430cad26f20c76ca78e08ae9b8841');
  assert.match(return3d,/new URL\('\.\.\/table\/personal\/media\/personal-design-preview\.glb'/);
  assert.match(return3d,/verifyPersonalSource\(source\)/);
  assert.match(return3d,/finishPersonalDesign\(source\)/);
  assert.match(return3d,/FIXED_PERSONAL_COFFEE_REFERENCE_GLB/);
  assert.match(html,/שולחן קפה עגול — פיילוט/);
  assert.match(html,/שאינו מותאם למידות/);
  assert.match(html,/id="approved-coffee-fallback"/);
  assert.match(html,/id="approved-glb-host"/);
});
test('explicit PWA allowlist and shell retain both exact models and fallback photographs',()=>{
  const sw=read('./development/sw.js'),html=read('./development/index.html'),intro=read('./personal-coffee-hero.mjs');
  assert.match(sw,/development-v1-mvp28/);
  for(const path of [
    '../../assets/geometric-engineering-object-clean.webp',
    '../../geometric/media/geometric-v11-design-only.glb',
    '../../table/personal/media/personal-design-preview.glb',
    '../../table/personal/media/01-hero-finished-angled-960.webp'
  ])assert.ok(sw.includes("'"+path+"'"));
  assert.match(sw,/allowedShell\.has\(url\.pathname\)/);
  for(const asset of ['../assets/coffee-reference-room.webp','../assets/coffee-empty-room.webp'])
    assert.ok(sw.includes("'"+asset+"'"),'photo asset must work offline: '+asset);
  assert.match(intro,/vendor\/model-viewer-4\.1\.0\/model-viewer\.min\.js/);
  assert.match(intro,/supportsWebGL/);
  assert.match(intro,/showPhoto\('unavailable'\)/);
  assert.match(intro,/url\.origin===self\.location\.origin|new URL\('\.\.\/geometric\/media\//);
  assert.match(html,/script-src 'self' 'wasm-unsafe-eval'/);
  assert.doesNotMatch(intro,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|supabase|openai|cdn\./i);
});

// Regression: /app/ HTML is fetched network-first by the older PWA controller,
// but its cache-first JS/CSS must NEVER match legacy unversioned cache entries.
test('MVP-25 release URLs prevent mixed Geometric markup with stale round Personal Coffee 3D',()=>{
  const html=read('./development/index.html');
  const sw=read('./development/sw.js');
  const return3d=read('./return-3d.mjs');
  const suffix='?v=mvp27-20261118';
  for(const path of [
    './personal-coffee-hero.mjs','./personal-coffee-hero.css',
    './return-3d.mjs','./return-3d.css','./nightstand-intent.js','./design-studio.js','./demo-room.css'
  ]){
    const suffixUrl='../'+path.slice(2)+suffix;
    assert.ok(html.includes('="'+suffixUrl+'"'),'HTML must pin '+path);
    assert.ok(sw.includes("'"+suffixUrl+"'"),'SW must precache '+path);
    assert.ok(!html.includes('="'+path+'"'),'unversioned entry would match old cache: '+path);
  }
  assert.match(return3d,/photo-grounded-coffee-glb\.mjs\?v=mvp27-20261118/);
  assert.ok(sw.includes("'../photo-grounded-coffee-glb.mjs"+suffix+"'"));
  assert.match(sw,/assemble-lab-development-v1-mvp28/);
  assert.match(html,/data-model-src="\.\.\/\.\.\/geometric\/media\/geometric-v11-design-only\.glb"/);
  assert.match(read('./personal-coffee-hero.mjs'),/next\.src=sourceGlb/);
});
