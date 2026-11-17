import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const binary=path=>readFileSync(new URL(path,import.meta.url));
const checksum=bytes=>createHash('sha256').update(bytes).digest('hex');

test('approved showroom assets are the exact optimized image and a matching image fallback',()=>{
  const avif=binary('./media/personal-coffee-showcase-680.avif');
  const webp=binary('./media/personal-coffee-showcase-680.webp');
  assert.equal(avif.length,14174);
  assert.equal(checksum(avif),'288afe7e918751be227a50e070dc5d6deae39c754fca73075789f6a5b4daec09');
  assert.equal(avif.toString('ascii',4,12),'ftypavif');
  assert.equal(webp.length,33698);
  assert.equal(checksum(webp),'dcaedddcdff46059f8c77315141180e8f61a82ef37cd1fed3211f0a835f2d4e4');
  assert.equal(webp.toString('ascii',0,4),'RIFF');
  assert.equal(webp.toString('ascii',8,12),'WEBP');
});
test('DESIGN STUDY uses edited showcase image and explicitly does not claim it is a product photograph',()=>{
  const index=read('./index.html');
  assert.match(index,/id="personal-coffee-photo"/);
  assert.match(index,/srcset="\.\/media\/personal-coffee-showcase-680\.avif" type="image\/avif"/);
  assert.match(index,/srcset="\.\/media\/personal-coffee-showcase-680\.webp" type="image\/webp"/);
  assert.match(index,/img src="\.\/media\/personal-coffee-showcase-680\.webp" width="680" height="590"/);
  assert.match(index,/שולחן קפה אישי · הדמיה בחלל/);
  assert.match(index,/הדמיית ראווה/);
  assert.match(index,/תמונת הראווה היא הדמיה חזותית ערוכה, לא צילום המוצר שנבנה/);
  assert.match(index,/This edited showroom visualization is not a photograph/);
  assert.match(index,/href="\.\.\/table\/personal\/"/);
  assert.match(index,/id="personal-coffee-model"/);
  assert.match(index,/\.\.\/table\/personal\/media\/personal-design-preview\.glb/);
  assert.doesNotMatch(index,/שולחן קפה אישי · מוצר אמיתי שנבנה וצולם/);
  assert.doesNotMatch(index,/srcset="\.\.\/table\/personal\/media\/01-hero-finished-angled/);
});
test('the authentic built-product catalog remains untouched and the existing design-only GLB remains the model',()=>{
  const product=read('../table/personal/index.html');
  const hero=read('./personal-coffee-hero.mjs');
  const original=binary('../table/personal/media/01-hero-finished-angled-960.webp');
  const model=binary('../table/personal/media/personal-design-preview.glb');
  assert.match(product,/01-hero-finished-angled-960\.webp/);
  assert.match(product,/personal-design-preview\.glb/);
  assert.match(product,/המבנה והגימור אינם העתק מאומת/);
  assert.equal(original.toString('ascii',0,4),'RIFF');
  assert.equal(model.toString('ascii',0,4),'glTF');
  assert.equal(model.readUInt32LE(4),2);
  assert.match(hero,/actualModel=new URL\('\.\.\/table\/personal\/media\/personal-design-preview\.glb'/);
  assert.match(hero,/vendor\/model-viewer-4\.1\.0\/model-viewer\.min\.js/);
  assert.match(hero,/webGLAvailable/);
  assert.match(hero,/showPhoto\('error'\)/);
  assert.match(hero,/showPhoto\('unsupported'\)/);
  assert.match(hero,/next\.src=actualModel/);
  assert.doesNotMatch(hero,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|supabase|openai|cdn\./i);
});
test('landing showcase and prototype 3D stay responsive, bilingual and offline',()=>{
  const html=read('./index.html'),css=read('./personal-coffee-hero.css'),
    js=read('./personal-coffee-hero.mjs'),sw=read('./sw.js');
  assert.match(html,/<script type="module" src="\.\/personal-coffee-hero\.mjs"><\/script>/);
  assert.match(html,/<link rel="stylesheet" href="\.\/personal-coffee-hero\.css">/);
  assert.match(html,/id="personal-coffee-show-photo"[^>]*aria-pressed="true"/);
  assert.match(html,/id="personal-coffee-show-model"[^>]*aria-pressed="false"/);
  assert.match(html,/id="personal-coffee-model-status"[^>]*aria-live="polite"/);
  assert.match(js,/window\.setTimeout\(\(\)=>\{/);
  assert.match(css,/#personal-coffee-photo img\{[^}]*object-fit:cover/);
  assert.match(css,/\.personal-coffee-card #intro-scene\{display:none!important\}/);
  assert.match(sw,/'\.\/media\/personal-coffee-showcase-680\.avif'/);
  assert.match(sw,/'\.\/media\/personal-coffee-showcase-680\.webp'/);
  assert.match(sw,/'\.\.\/table\/personal\/media\/personal-design-preview\.glb'/);
  assert.match(html,/script-src 'self' 'sha256-GBnlKux09VbgrayAnLRJMrWvjFuJ9hF2QuT9vewZR6U=' 'wasm-unsafe-eval'/);
});
