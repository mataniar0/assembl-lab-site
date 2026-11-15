import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeReview,sceneFor,viewFor,SCENES} from './preview-state.mjs';

test('three recognized synthetic fixture scenarios only',()=>{
  assert.deepEqual(SCENES.map(s=>s.id),['SC-01','SC-02','SC-04']);
  assert.equal(sceneFor('SC-02').kind,'window');
  assert.equal(sceneFor('unknown').id,'SC-01');
});
test('default review never contains photos or server credentials',()=>{
  const data=normalizeReview();
  assert.equal(data.source_kind,'synthetic');
  assert.equal(data.photo_included,false);
  assert.equal(data.engineering_approval,false);
  assert.equal(data.manufacturing_approval,false);
  assert.equal(data.view,'after');
});
test('arbitrary customer or image fields are discarded by whitelist',()=>{
  const s=normalizeReview({customer_email:'private@example.invalid',
    photo:'customer room',image_base64:'secret',notes:'sensitive notes',
    sceneId:'SC-02',position:60});
  assert.equal(s.position_percent,60);
  assert.doesNotMatch(JSON.stringify(s),/private|secret|customer|notes|photo.*customer/);
});
test('scale and horizontal placement stay in visual-safe ranges',()=>{
  const a=normalizeReview({scale:99999,position:-500});
  assert.equal(a.scale_percent,125);
  assert.equal(a.position_percent,30);
  const b=normalizeReview({scale:NaN,position:Infinity});
  assert.equal(b.scale_percent,88);
  assert.equal(b.position_percent,52);
});
test('finish and drawer count accept only approved values',()=>{
  assert.equal(normalizeReview({finish:'invalid',drawers:5}).finish,'natural');
  assert.equal(normalizeReview({drawers:5}).drawers,1);
  assert.equal(normalizeReview({finish:'walnut',drawers:2}).drawers,2);
});
test('after view contains visible nightstand and position transforms',()=>{
  const view=viewFor(normalizeReview({sceneId:'SC-04',position:61,scale:104,finish:'honey',drawers:2}));
  assert.equal(view.scene_kind,'plant');
  assert.equal(view.show_nightstand,true);
  assert.equal(view.horizontal_position,'61%');
  assert.equal(view.nightstand_scale,'1.04');
  assert.equal(view.finish,'honey');
  assert.equal(view.drawers,2);
});
test('before view is synthetic room without furniture overlay',()=>{
  const view=viewFor(normalizeReview({sceneId:'SC-02',view:'before'}));
  assert.equal(view.scene_kind,'window');
  assert.equal(view.show_nightstand,false);
});
test('malformed review inputs are rejected',()=>{
  assert.throws(()=>normalizeReview(null),TypeError);
  assert.throws(()=>normalizeReview([]),TypeError);
});
test('no API calls, photos, or remote CDN code in preview module',()=>{
  const code=readFileSync(new URL('./preview-lab.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(code,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
  assert.doesNotMatch(code,/localStorage|indexedDB|sessionStorage|navigator\.camera/);
  assert.doesNotMatch(code,/supabase|service_role|sb_secret_/i);
});
test('preview page has strict zero-connect CSP and no file upload',()=>{
  const html=readFileSync(new URL('./preview-lab.html',import.meta.url),'utf8');
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/script-src 'self'/);
  assert.match(html,/type="module" src="\.\/preview-lab\.mjs"/);
  assert.doesNotMatch(html,/<input[^>]*type=["']file/);
  assert.doesNotMatch(html,/https?:\/\/|<script>(.|[\r\n])*<\/script>/);
});
test('HE and EN copy plus accessible controls are provided',()=>{
  const html=readFileSync(new URL('./preview-lab.html',import.meta.url),'utf8');
  assert.match(html,/data-he=/);
  assert.match(html,/data-en=/);
  assert.match(html,/aria-pressed="false"/);
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/for="scale"/);
  assert.match(html,/for="position"/);
});
