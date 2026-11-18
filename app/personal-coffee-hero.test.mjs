import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const binary=path=>readFileSync(new URL(path,import.meta.url));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

test('approved front-angle showcase image is a real WebP file from the selected edited render',()=>{
  const image=binary('./media/personal-coffee-front-showcase-960.webp');
  assert.equal(image.byteLength,43304);
  assert.equal(sha256(image),'6e130eeb13af7e9b657153530b274d4f9725001c33f0d834883ae19654464f29');
  assert.equal(image.toString('ascii',0,4),'RIFF');
  assert.equal(image.toString('ascii',8,12),'WEBP');
  const html=read('./index.html');
  assert.match(html,/id="personal-coffee-photo"/);
  assert.match(html,/src="\.\/media\/personal-coffee-front-showcase-960\.webp" width="960" height="960"/);
  assert.doesNotMatch(html,/srcset="\.\.\/table\/personal\/media\/01-hero-finished-angled/);
  assert.match(html,/data-he="הדמיית ראווה" data-en="Showcase image"/);
  assert.match(html,/תמונת הראווה היא הדמיה ערוכה, לא צילום מתועד של המוצר/);
  assert.match(html,/The showcase image is an edited visualization, not a documentary product photo/);
  assert.match(html,/href="\.\.\/table\/personal\/"/);
  assert.doesNotMatch(html,/>צילום המוצר אמיתי</);
});

test('original published product photograph and the frozen source design GLB stay untouched',()=>{
  const photo=binary('../table/personal/media/01-hero-finished-angled-960.webp');
  const glb=binary('../table/personal/media/personal-design-preview.glb');
  const catalog=read('../table/personal/index.html');
  assert.equal(photo.byteLength,122958);
  assert.equal(photo.toString('ascii',0,4),'RIFF');
  assert.equal(glb.byteLength,1700936);
  assert.equal(sha256(glb),'17da2aafb7f17182b940804c22cb2be8dc0430cad26f20c76ca78e08ae9b8841');
  assert.equal(glb.toString('ascii',0,4),'glTF');
  assert.equal(glb.readUInt32LE(4),2);
  assert.match(catalog,/01-hero-finished-angled-960\.webp/);
  assert.match(catalog,/המבנה והגימור אינם העתק מאומת/);
});

test('3D button still opens the original 32-part photo-grounded design, not a still or imagined model',()=>{
  const html=read('./index.html'),module=read('./personal-coffee-hero.mjs');
  assert.match(html,/id="personal-coffee-model"/);
  assert.match(html,/data-model-src="\.\.\/table\/personal\/media\/personal-design-preview\.glb"/);
  assert.match(html,/data-he="מודל תלת־ממד"/);
  assert.match(module,/photo-grounded-coffee-glb\.mjs/);
  assert.match(module,/verifyPersonalSource\(original\)/);
  assert.match(module,/finishPersonalDesign\(original\)/);
  assert.match(module,/new Blob\(\[output\],\{type:'model\/gltf-binary'\}\)/);
  assert.match(module,/URL\.revokeObjectURL/);
  assert.match(module,/webGLAvailable/);
  assert.match(module,/fetch\(source3d\)/);
  assert.doesNotMatch(module,/toDataURL|snapshotFromLoadedModel|matchingCoffeeTableGlb/);
  assert.doesNotMatch(module,/XMLHttpRequest|localStorage|sessionStorage|indexedDB|supabase|openai|cdn\./i);
});

test('showcase is precached for offline use without retaining obsolete app hero photos',()=>{
  const sw=read('./sw.js'),css=read('./personal-coffee-hero.css');
  const js=read('./personal-coffee-hero.mjs'),html=read('./index.html');
  assert.match(sw,/assemble-lab-android-v0\.13\.0-front-showcase-hero/);
  assert.match(sw,/'\.\/media\/personal-coffee-front-showcase-960\.webp'/);
  assert.match(sw,/'\.\.\/table\/personal\/media\/personal-design-preview\.glb'/);
  assert.doesNotMatch(sw,/'\.\.\/table\/personal\/media\/01-hero-finished-angled-(480|960)\.webp'/);
  assert.match(css,/object-position:center center/);
  assert.doesNotMatch(css,/filter:saturate/);
  assert.match(js,/vendor\/model-viewer-4\.1\.0\/model-viewer\.min\.js/);
  assert.match(html,/script-src 'self' 'sha256-GBnlKux09VbgrayAnLRJMrWvjFuJ9hF2QuT9vewZR6U=' 'wasm-unsafe-eval'/);
});
