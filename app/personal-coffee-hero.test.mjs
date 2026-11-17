import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('DESIGN STUDY / 001 uses exact finished round table photograph and published GLB from the product site',()=>{
  const index=read('./index.html');
  const product=read('../table/personal/index.html');
  const hero=read('./personal-coffee-hero.mjs');
  assert.match(product,/שולחן קפה אישי/);
  assert.match(product,/פלטה עגולה בגוון עץ חם ורגליים שחורות/);
  assert.match(product,/01-hero-finished-angled-960\.webp/);
  assert.match(product,/personal-design-preview\.glb/);
  assert.match(index,/id="personal-coffee-photo"/);
  assert.match(index,/id="personal-coffee-model"/);
  assert.match(index,/\.\.\/table\/personal\/media\/01-hero-finished-angled-480\.webp/);
  assert.match(index,/\.\.\/table\/personal\/media\/01-hero-finished-angled-960\.webp/);
  assert.match(index,/\.\.\/table\/personal\/media\/personal-design-preview\.glb/);
  assert.match(hero,/\.\.\/table\/personal\/media\/personal-design-preview\.glb/);
  assert.match(index,/href="\.\.\/table\/personal\/"/);
  assert.doesNotMatch(index,/חלל לדוגמה · שידה סכמטית/);
  assert.match(index,/שולחן קפה אישי · מוצר אמיתי שנבנה וצולם/);
  assert.match(index,/אינו העתק מאומת של המוצר המצולם/);
  assert.match(product,/המבנה והגימור אינם העתק מאומת/);
});
test('gallery photograph and GLB are existing repository bytes, not an invented render or wrong product',()=>{
  const base=new URL('../table/personal/media/',import.meta.url);
  for(const entry of [
    ['01-hero-finished-angled-480.webp','RIFF',10000],
    ['01-hero-finished-angled-960.webp','RIFF',10000],
    ['personal-design-preview.glb','glTF',20000]
  ]){
    const bin=readFileSync(new URL(entry[0],base));
    assert.ok(bin.byteLength>entry[2]);
    assert.equal(bin.subarray(0,4).toString('ascii'),entry[1]);
    if(entry[1]==='RIFF')assert.equal(bin.subarray(8,12).toString('ascii'),'WEBP');
    if(entry[1]==='glTF'){
      assert.equal(bin.readUInt32LE(4),2);
      assert.equal(bin.readUInt32LE(8),bin.byteLength);
    }
  }
  const provenance=read('../table/personal/media/IMAGE_QA.md');
  assert.match(provenance,/No generated product image/);
  assert.match(provenance,/original plaque/);
});
test('the real photograph and design-preview GLB remain distinguishable and offline PWA compatible',()=>{
  const index=read('./index.html'),js=read('./personal-coffee-hero.mjs'),
    css=read('./personal-coffee-hero.css'),sw=read('./sw.js');
  assert.match(index,/<script type="module" src="\.\/personal-coffee-hero\.mjs"><\/script>/);
  assert.match(index,/<link rel="stylesheet" href="\.\/personal-coffee-hero\.css">/);
  assert.match(index,/id="personal-coffee-show-photo"[^>]*aria-pressed="true"/);
  assert.match(index,/id="personal-coffee-show-model"[^>]*aria-pressed="false"/);
  assert.match(index,/id="personal-coffee-model-status"[^>]*aria-live="polite"/);
  assert.match(js,/actualModel=new URL\('\.\.\/table\/personal\/media\/personal-design-preview\.glb'/);
  assert.match(js,/vendor\/model-viewer-4\.1\.0\/model-viewer\.min\.js/);
  assert.match(js,/webGLAvailable/);
  assert.match(js,/showPhoto\('error'\)/);
  assert.match(js,/showPhoto\('unsupported'\)/);
  assert.match(js,/viewer\.src|next\.src=actualModel/);
  assert.match(css,/\.personal-coffee-card #intro-scene\{display:none!important\}/);
  assert.match(sw,/'\.\/personal-coffee-hero\.mjs'/);
  assert.match(sw,/'\.\/personal-coffee-hero\.css'/);
  assert.match(sw,/'\.\.\/table\/personal\/media\/personal-design-preview\.glb'/);
  assert.match(sw,/'\.\.\/table\/personal\/media\/01-hero-finished-angled-960\.webp'/);
  assert.match(index,/script-src 'self' 'sha256-GBnlKux09VbgrayAnLRJMrWvjFuJ9hF2QuT9vewZR6U=' 'wasm-unsafe-eval'/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|supabase|openai|cdn\./i);
});
