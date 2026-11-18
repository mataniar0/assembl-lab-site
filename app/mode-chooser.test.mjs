import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';

const root=resolve(import.meta.dirname,'..');
const snap=join(root,'marketing/v1');
const read=(p)=>readFileSync(join(root,p),'utf8');

test('Marketing V1 is independently frozen and all 64 Git blobs match pinned source',()=>{
  const m=JSON.parse(read('marketing/v1/file-manifest.json'));
  assert.equal(m.source_commit,'d05830451a918f00dc484acf985c794443dc36f9');
  assert.equal(m.files.length,64);
  const unique=new Set();
  for(const f of m.files){
    assert.match(f.blob,/^[a-f0-9]{40}$/);
    const p=resolve(snap,f.path);
    assert.ok(p.startsWith(snap+sep),'snapshot path must stay within frozen subtree');
    assert.ok(!unique.has(f.path),'duplicate snapshot asset: '+f.path);
    unique.add(f.path);
    const b=readFileSync(p);
    assert.equal(b.length,f.size,f.path+' byte length changed');
    const sha=createHash('sha1').update(Buffer.from('blob '+b.length+'\0'))
      .update(b).digest('hex');
    assert.equal(sha,f.blob,'Frozen V1 asset modified: '+f.path);
  }
  assert.ok(!existsSync(join(snap,'docs')));
  assert.ok(!existsSync(join(snap,'.github')));
  assert.ok(!existsSync(join(snap,'tests')));
  assert.ok(!existsSync(join(snap,'inquiry/formspree.js')));
  assert.equal(JSON.parse(read('marketing/v1/demo-version.json')).real_inquiries,false);
});

test('Marketing snapshot and development worker cannot clear or overwrite each other caches',()=>{
  const marketing=read('marketing/v1/app/sw.js'),live=read('app/sw.js');
  assert.match(marketing,/assemble-lab-marketing-v1-photo-real-room/);
  assert.match(marketing,/key.startsWith\('assemble-lab-marketing-'\)/);
  assert.doesNotMatch(marketing,/key.startsWith\('assemble-lab-android-'\)/);
  assert.match(live,/assemble-lab-android-v0\.14\.4-mode-selection/);
  assert.match(live,/key.startsWith\('assemble-lab-android-'\)/);
  assert.doesNotMatch(live,/key.startsWith\('assemble-lab-marketing-'\)/);
  assert.match(live,/mode-chooser\.js\?v=mvp28-20261118/);
  assert.match(live,/mode-chooser\.css\?v=mvp28-20261118/);
});

test('App startup provides two explicit HE/EN choices and independent same-site marketing URL',()=>{
  const html=read('app/index.html'),script=read('app/mode-chooser.js');
  assert.match(html,/id="app-mode-chooser"/);
  assert.match(html,/role="dialog" aria-modal="true"/);
  assert.match(html,/id="mode-marketing-link"[^>]*href="\.\.\/marketing\/v1\/app\/"/);
  assert.match(html,/id="mode-enter-development"/);
  assert.match(html,/data-he="גרסה שיווקית" data-en="Marketing version"/);
  assert.match(html,/data-he="גרסת פיתוח" data-en="Development version"/);
  assert.match(html,/mode-chooser\.css\?v=mvp28-20261118/);
  assert.match(html,/mode-chooser\.js\?v=mvp28-20261118/);
  assert.match(script,/params.get\('mode'\)==='development'/);
  assert.match(script,/sessionStorage\.setItem\('assembl-lab-selected-mode','development'\)/);
  assert.match(script,/inertElements\.forEach/);
  assert.match(html,/data-model-src="\.\.\/geometric\/media\/geometric-v11-design-only\.glb"/);
  assert.match(html,/personal-design-preview\.glb|approved-3d-view/);
});

test('Frozen Marketing V1 has the original photo/table GLBs and no live request route',()=>{
  const demo=read('marketing/v1/app/index.html');
  assert.doesNotMatch(demo,/id="app-mode-chooser"/);
  assert.match(demo,/geometric-v11-design-only\.glb/);
  assert.match(demo,/שולחן קפה עגול/);
  assert.match(demo,/mvp27-20261118/);
  assert.equal(readFileSync(join(snap,'geometric/media/geometric-v11-design-only.glb')).subarray(0,4).toString(),'glTF');
  assert.equal(readFileSync(join(snap,'table/personal/media/personal-design-preview.glb')).subarray(0,4).toString(),'glTF');
  assert.match(read('marketing/v1/inquiry/index.html'),/אין שליחת פניות או הזמנות אמיתיות/);
  assert.match(read('marketing/v1/index.html'),/url=\.\/app\//);
});
