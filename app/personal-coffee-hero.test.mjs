import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const binary=path=>readFileSync(new URL(path,import.meta.url));
const checksum=bytes=>createHash('sha256').update(bytes).digest('hex');

test('the old edited image remains an explicit no-WebGL fallback, not the matched hero',()=>{
  const avif=binary('./media/personal-coffee-showcase-680.avif');
  const webp=binary('./media/personal-coffee-showcase-680.webp');
  assert.equal(avif.length,14174);
  assert.equal(checksum(avif),'288afe7e918751be227a50e070dc5d6deae39c754fca73075789f6a5b4daec09');
  assert.equal(webp.length,33698);
  assert.equal(checksum(webp),'dcaedddcdff46059f8c77315141180e8f61a82ef37cd1fed3211f0a835f2d4e4');
  assert.equal(avif.toString('ascii',4,12),'ftypavif');
  assert.equal(webp.toString('ascii',0,4),'RIFF');
});
test('landing says hero derived from same GLB, while preserving the honest disclaimer',()=>{
  const index=read('./index.html'),hero=read('./personal-coffee-hero.mjs');
  assert.match(index,/id="personal-coffee-photo"/);
  assert.match(index,/id="personal-coffee-model"/);
  assert.match(index,/data-model-src="generated-visual-glb"/);
  assert.match(index,/אותה הדמיה בתמונה ובתלת־ממד/);
  assert.match(index,/תמונת הראווה נוצרת מתוך אותו GLB/);
  assert.match(index,/אינה שחזור מדוד של המוצר/);
  assert.match(index,/href="\.\.\/table\/personal\/"/);
  assert.match(hero,/matchingCoffeeTableGlb/);
  assert.match(hero,/snapshotFromLoadedModel/);
  assert.match(hero,/toDataURL\('image\/png'\)/);
  assert.match(hero,/image\.src=data/);
  assert.match(hero,/image\.dataset\.showcaseSource='exact-loaded-coffee-glb'/);
  assert.match(hero,/new Blob\(\[bytes\],\{type:'model\/gltf-binary'\}\)/);
  assert.match(hero,/camera-orbit','35deg 68deg 1\.35m/);
  assert.doesNotMatch(hero,/fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|supabase|openai|cdn\./i);
});
test('original engineering design-preview file and authentic finished-product photo stay unchanged',()=>{
  const product=read('../table/personal/index.html');
  const original=binary('../table/personal/media/01-hero-finished-angled-960.webp');
  const design=binary('../table/personal/media/personal-design-preview.glb');
  assert.match(product,/personal-design-preview\.glb/);
  assert.match(product,/המבנה והגימור אינם העתק מאומת/);
  assert.equal(original.toString('ascii',0,4),'RIFF');
  assert.equal(design.toString('ascii',0,4),'glTF');
  assert.equal(design.readUInt32LE(4),2);
  assert.equal(design.byteLength,1700936);
});
test('model-viewer is local and hero screenshot can be generated offline',()=>{
  const html=read('./index.html'),css=read('./personal-coffee-hero.css'),
    js=read('./personal-coffee-hero.mjs'),sw=read('./sw.js');
  assert.match(html,/<script type="module" src="\.\/personal-coffee-hero\.mjs"><\/script>/);
  assert.match(html,/id="personal-coffee-show-photo"/);
  assert.match(html,/id="personal-coffee-show-model"/);
  assert.match(js,/vendor\/model-viewer-4\.1\.0\/model-viewer\.min\.js/);
  assert.match(js,/webGLAvailable/);
  assert.match(js,/resetOnFailure/);
  assert.match(js,/URL\.revokeObjectURL/);
  assert.match(css,/#personal-coffee-model\[data-state="interactive"\]/);
  assert.match(sw,/'\.\/personal-coffee-hero\.mjs'/);
  assert.match(sw,/'\.\/coffee-showroom-glb\.mjs'/);
  assert.match(sw,/'\.\/realistic-glb\.mjs'/);
  assert.match(sw,/'\.\/media\/personal-coffee-showcase-680\.webp'/);
  assert.match(html,/script-src 'self' 'sha256-GBnlKux09VbgrayAnLRJMrWvjFuJ9hF2QuT9vewZR6U=' 'wasm-unsafe-eval'/);
});
