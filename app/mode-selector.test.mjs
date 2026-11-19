import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const file=path=>readFileSync(new URL('../'+path,import.meta.url));
const text=path=>file(path).toString('utf8');
const exists=path=>existsSync(new URL('../'+path,import.meta.url));
const marketing='app/marketing/v1/';
const development='app/development/';
const source='d05830451a918f00dc484acf985c794443dc36f9';
const glb=path=>{const b=file(path);assert.equal(b.toString('ascii',0,4),'glTF',path);assert.equal(b.readUInt32LE(4),2,path);assert.equal(b.readUInt32LE(8),b.length,path)};
const gitHash=bytes=>createHash('sha1').update('blob '+bytes.byteLength+'\0').update(bytes).digest('hex');
function checkShell(script,scope){
  const raw=script.match(/const SHELL\s*=\s*\[([\s\S]*?)\]/)?.[1];
  assert.ok(raw,'PWA shell list found '+scope);
  const paths=[...raw.matchAll(/'([^']+)'/g)].map(m=>m[1]);
  const origin='https://example.invalid'+scope;
  for(const relative of paths){
    const u=new URL(relative,origin);
    assert.equal(u.origin,'https://example.invalid');
    const path=decodeURIComponent(u.pathname).slice(1)+(u.pathname.endsWith('/')?'index.html':'');
    assert.ok(exists(path),'missing offline file '+scope+relative+' => '+path);
  }
  return paths;
}
test('APP MVP-28 routes are branded, navigable and bilingual',()=>{
  const chooser=text('app/index.html'),js=text('app/mode-selector.js'),css=text('app/mode-selector.css');
  assert.match(chooser,/data-app-mode="selector"/);
  assert.match(chooser,/href="\.\/marketing\/v1\/"/);
  assert.match(chooser,/href="\.\/development\/"/);
  assert.match(chooser,/data-he="באיזו גרסה נמשיך\?"/);
  assert.match(chooser,/data-en="Choose your workspace"/);
  assert.match(chooser,/Marketing Demo V1/);
  assert.match(chooser,/d0583045/);
  assert.match(js,/document\.documentElement\.dir/);
  assert.match(js,/serviceWorker\.register\('\.\/sw\.js'/);
  assert.match(css,/@media\(max-width:700px\)/);
});
test('development uses one editable source of scripts and CSS and its own PWA scope',()=>{
  const dev=text(development+'index.html'),worker=text(development+'sw.js'),manifest=JSON.parse(text(development+'manifest.webmanifest'));
  assert.match(dev,/data-app-mode="development"/);
  for(const p of ['design-studio.js','nightstand-intent.js','return-3d.mjs','personal-coffee-hero.mjs','demo-room.css'])assert.ok(dev.includes('../'+p),'current dev script '+p);
  for(const p of ['assets/geometric-engineering-object-clean.webp','geometric/media/geometric-v11-design-only.glb','table/personal/media/01-hero-finished-angled-960.webp'])assert.ok(dev.includes('../../'+p),'current product asset '+p);
  assert.match(dev,/href="\.\.\/"[^>]*data-he="חזרה לבחירת גרסה"/);
  assert.match(worker,/assemble-lab-development-v1-mvp28/);
  assert.match(worker,/allowedShell\.has\(url\.pathname\)/);
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.start_url,'./');
  assert.equal(manifest.id,'./');
  assert.ok(checkShell(worker,'/app/development/').length>=25);
});
test('immutable marketing V1 source and file hashes are pinned to approved Git commit',()=>{
  const manifest=JSON.parse(text(marketing+'release-manifest.json'));
  assert.equal(manifest.source_commit,source);
  assert.equal(manifest.scope,'/app/marketing/v1/');
  assert.equal(manifest.frozen,true);
  assert.ok(manifest.files.length>=55);
  for(const e of manifest.files){
    assert.ok(e.path.startsWith(marketing));
    assert.equal(gitHash(file(e.path)),e.git_blob_sha,'frozen bytes changed: '+e.path);
    if(e.original_blob_sha===e.git_blob_sha)assert.ok(e.source_path,'copied source path required');
  }
  const html=text(marketing+'index.html');
  assert.match(html,/data-app-mode="marketing"/);
  assert.match(html,/href="\.\.\/\.\.\/" class="marketing-return"/);
  assert.match(html,/src="\.\/_snapshot\/assets\/geometric-engineering-object-clean\.webp"/);
  assert.match(html,/data-model-src="\.\/_snapshot\/geometric\/media\/geometric-v11-design-only\.glb"/);
  assert.match(html,/src="\.\/_snapshot\/table\/personal\/media\/01-hero-finished-angled-960\.webp"/);
  assert.match(html,/שולחן קפה עגול — פיילוט/);
  assert.ok(exists(marketing+'_snapshot/geometric/index.html'));
  assert.ok(exists(marketing+'_snapshot/inquiry/index.html'));
  assert.ok(text(marketing+'_snapshot/inquiry/index.html').includes('אין הזמנות'));
  glb(marketing+'_snapshot/geometric/media/geometric-v11-design-only.glb');
  glb(marketing+'_snapshot/table/personal/media/personal-design-preview.glb');
  for(const p of ['coffee-empty-room.webp','coffee-reference-room.webp']){
    const bytes=file(marketing+'assets/'+p);
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
  }
});
test('no frozen marketing UI imports mutable development scripts, CSS, GLB or images',()=>{
  for(const p of ['index.html','sw.js','return-3d.mjs','personal-coffee-hero.mjs']){
    const source=text(marketing+p);
    assert.doesNotMatch(source,/['"]\.\.\/(?:assets|geometric|table)\//,p+' uses mutable site asset');
    assert.doesNotMatch(source,/https?:\/\//,p+' external network dependency');
    assert.doesNotMatch(source,/\/app\/development\//,p+' dev runtime reference');
  }
  const hero=text(marketing+'personal-coffee-hero.mjs'),returned=text(marketing+'return-3d.mjs');
  assert.match(hero,/\.\/_snapshot\/geometric\/media\/geometric-v11-design-only\.glb/);
  assert.match(returned,/\.\/_snapshot\/table\/personal\/media\/personal-design-preview\.glb/);
  assert.match(returned,/FIXED_PERSONAL_COFFEE_REFERENCE_GLB/);
});
test('selector, development and marketing workers have separate versions and scopes',()=>{
  const selector=text('app/sw.js'),dev=text(development+'sw.js'),marketingWorker=text(marketing+'sw.js');
  assert.match(selector,/assemble-lab-selector-v1/);
  assert.match(dev,/assemble-lab-development-v1-mvp28/);
  assert.match(marketingWorker,/assemble-lab-marketing-v1-d0583045/);
  assert.doesNotMatch(selector,/marketing\/v1\//);
  assert.doesNotMatch(selector,/development\//);
  assert.match(selector,/const home=u\.pathname===scope/);
  assert.match(marketingWorker,/key\.startsWith\('assemble-lab-marketing-'/);
  assert.match(dev,/key\.startsWith\('assemble-lab-development-'/);
  checkShell(selector,'/app/');
  checkShell(marketingWorker,'/app/marketing/v1/');
  assert.match(text(marketing+'manifest.webmanifest'),/"scope": "\.\/"/);
});
