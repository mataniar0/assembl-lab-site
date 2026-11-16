import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeReview,sceneFor,viewFor,SCENES,fittedPlacement,designIntentFor} from './preview-state.mjs';

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

test('compare mode preserves explicit split and never claims to generate a photo',()=>{
  const compare=normalizeReview({view:'compare',comparison:64,finish:'walnut'});
  assert.equal(compare.view,'compare');
  assert.equal(compare.comparison_percent,64);
  const view=viewFor(compare);
  assert.equal(view.comparison_enabled,true);
  assert.equal(view.show_nightstand,true);
  assert.equal(view.comparison_percent,64);
  assert.equal(normalizeReview({view:'invalid',comparison:200}).view,'after');
  assert.equal(normalizeReview({comparison:200}).comparison_percent,85);
  assert.equal(normalizeReview({comparison:1}).comparison_percent,15);
});
test('furniture stays within small canvas when position and scale reach extremes',()=>{
  for(const width of [265,320,390,768]){
    for(const scale of [65,88,125]){
      for(const position of [30,52,70]){
        const fit=fittedPlacement(width,position,scale);
        assert.ok(fit.effective_percent>=0&&fit.effective_percent<=100);
        const center=fit.effective_percent/100*width;
        const half=fit.object_width/2;
        assert.ok(center-half>=-0.0001,'left edge clipped at '+width);
        assert.ok(center+half<=width+0.0001,'right edge clipped at '+width);
      }
    }
  }
  assert.throws(()=>fittedPlacement(0,52,88),RangeError);
});
test('default design intent is compatible with design contract and is strictly synthetic',()=>{
  const item=designIntentFor(normalizeReview({finish:'walnut',drawers:2,position:57,scale:94}));
  assert.equal(item.schema_version,'ASSEMBL-LAB.DESIGN-INTENT.0.1');
  assert.equal(item.category,'freestanding_nightstand');
  assert.equal(item.requested_dimensions_mm.width,500);
  assert.equal(item.requested_dimensions_mm.height,550);
  assert.equal(item.requested_dimensions_mm.depth,350);
  assert.equal(item.construction_preferences.nominal_thickness_mm,6);
  assert.equal(item.appearance.finish,'walnut');
  assert.equal(item.appearance.drawers,2);
  assert.equal(item.placement_preview.horizontal_position_percent,57);
  assert.equal(item.placement_preview.relative_scale,94);
  assert.equal(item.appearance.notes,'');
  assert.equal(item.photo_included,false);
  assert.equal(item.engineering_approval,false);
  assert.equal(item.manufacturing_approval,false);
});
test('intent conversion strips untrusted image, contact and free-text fields',()=>{
  const source={...normalizeReview({sceneId:'SC-02'}),photo_url:'https://private.invalid',
    customer_email:'private@example.invalid',notes:'PRIVATE NOTES',image_base64:'abcd'};
  const text=JSON.stringify(designIntentFor(source));
  assert.doesNotMatch(text,/private|photo_url|image_base64|PRIVATE NOTES|customer_email/);
});
test('visual-review UI provides accessible comparison and preference controls',()=>{
  const html=readFileSync(new URL('./preview-lab.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('./preview-lab.css',import.meta.url),'utf8');
  assert.match(html,/id="compare-view"[^>]*aria-pressed="false"/);
  assert.match(html,/id="compare-split"[^>]*type="range"/);
  assert.match(html,/id="save-preferred"/);
  assert.match(html,/id="restore-preferred"/);
  assert.match(html,/id="preferred-status"[^>]*aria-live="polite"/);
  assert.match(css,/\.room\.compare \.room-after-layer\{clip-path:/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});
