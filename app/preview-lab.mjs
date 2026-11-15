/* APP MVP-09-B: synthetic room visualization; no network, storage or photographs.
 * All concept versions live in page memory and disappear on refresh.
 */
import {normalizeReview,sceneFor,viewFor,fittedPlacement,designIntentFor} from './preview-state.mjs';

const el=id=>document.getElementById(id);
const lang=()=>document.documentElement.lang==='en'?'en':'he';
const phrase=(he,en)=>lang()==='he'?he:en;
let state=normalizeReview();
let preferred=null;

function currentInput(){
  return normalizeReview({
    sceneId:el('scene').value,
    position:Number(el('position').value),
    scale:Number(el('scale').value),
    finish:el('finish').value,
    drawers:Number(el('drawers').value),
    comparison:Number(el('compare-split').value),
    view:state.view
  });
}
function syncInputs(){
  el('scene').value=state.scene_id;
  el('position').value=String(state.position_percent);
  el('scale').value=String(state.scale_percent);
  el('finish').value=state.finish;
  el('drawers').value=String(state.drawers);
  el('compare-split').value=String(state.comparison_percent);
}
function preferredMessage(){
  if(!preferred)return phrase('טרם סומנה גרסה מועדפת.','No preferred concept selected yet.');
  const room=sceneFor(preferred.scene_id);
  return phrase(
    'הגרסה המועדפת: '+room.he+' · '+preferred.drawers+' מגירות · '+preferred.finish+
      '. אפשר להחזיר אותה בכל עת במהלך הביקור.',
    'Preferred: '+room.en+' · '+preferred.drawers+' drawer(s) · '+preferred.finish+
      '. Restore it any time during this visit.'
  );
}
function refresh(){
  const visual=viewFor(state);
  const room=el('room');
  room.className='room '+visual.scene_kind+
    (state.view==='before'?' before':state.view==='compare'?' compare':'');
  // Only approved, hard-coded local PNG fixture paths may be loaded. Never
  // accept a camera photo, URL parameter or untrusted path as image src.
  const fixture=sceneFor(state.scene_id);
  const fixtureImage=el('synthetic-room-image');
  if(fixtureImage.getAttribute('src')!==fixture.png){
    fixtureImage.setAttribute('src',fixture.png);
  }
  room.dataset.fixture='png';
  room.style.setProperty('--compare-split',state.comparison_percent+'%');
  const fit=fittedPlacement(room.clientWidth||400,state.position_percent,
    state.scale_percent,room.clientHeight||400);
  el('stand-position').style.left=fit.effective_percent.toFixed(2)+'%';
  el('stand-position').style.transform='translateX(-50%) scale('+fit.effective_scale.toFixed(3)+')';
  const stand=el('stand');
  stand.dataset.finish=visual.finish;
  stand.classList.toggle('two-drawers',visual.drawers===2);
  const scene=sceneFor(state.scene_id);
  el('scene-label').textContent=scene.id+' · '+(lang()==='he'?scene.he:scene.en);
  const mode=state.view==='before'?
    phrase('לפני — חדר דוגמה ריק','Before — empty test room'):
    state.view==='compare'?
      phrase('השוואה — לפני משמאל, אחרי מימין','Comparison — before on left, after on right'):
      phrase('אחרי — המחשת שידה סכמטית','After — schematic nightstand');
  el('toggle-view').setAttribute('aria-pressed',String(state.view==='before'));
  el('toggle-view').textContent=state.view==='before'?
    phrase('הצג את השידה בחדר','Show nightstand in room'):
    phrase('הצג את החדר לפני הוספת השידה','Show room before');
  el('compare-view').setAttribute('aria-pressed',String(state.view==='compare'));
  el('compare-view').textContent=state.view==='compare'?
    phrase('חזור להדמיה מלאה','Return to full preview'):
    phrase('השוואה לפני ואחרי','Compare before and after');
  el('compare-control').hidden=state.view!=='compare';
  el('compare-split').setAttribute('aria-label',
    phrase('גבול ההשוואה לפני ואחרי','Before and after comparison split'));
  el('view-status').textContent=mode+'. '+phrase('לא תמונת AI אמיתית.','Not a real AI image.')+
    (fit.was_fitted?phrase(' המיקום הותאם לגודל המסך כדי למנוע חיתוך.',
      ' Placement was adjusted to keep the furniture inside the canvas.'):'');
  el('position-value').textContent=state.position_percent+'%';
  el('scale-value').textContent=state.scale_percent+'%';
  const intent=designIntentFor(state);
  const size=intent.requested_dimensions_mm;
  el('details').textContent=phrase(
    'מידות דוגמה: '+size.width/10+' × '+size.height/10+' × '+size.depth/10+
    ' ס״מ (רוחב × גובה × עומק) · לביד בירץ׳ '+intent.construction_preferences.nominal_thickness_mm+
    ' מ״מ · מיקום '+state.position_percent+'% · קנה מידה '+state.scale_percent+'% · '+
    state.drawers+' מגירות. הדגם נועד להמחשה בלבד.',
    'Example dimensions: '+size.width/10+' × '+size.height/10+' × '+size.depth/10+
    ' cm (W × H × D) · '+intent.construction_preferences.nominal_thickness_mm+
    ' mm birch plywood · position '+state.position_percent+'% · illustrative scale '+
    state.scale_percent+'% · '+state.drawers+' drawer(s). Concept only.');
  room.setAttribute('aria-label',phrase(
    'חדר סינתטי: '+scene.he+'; '+mode,
    'Synthetic room: '+scene.en+'; '+mode
  ));
  el('save-preferred').disabled=state.view==='before';
  el('restore-preferred').disabled=!preferred;
  el('preferred-status').textContent=preferredMessage();
}
function translate(){
  const english=lang()==='en';
  document.documentElement.dir=english?'ltr':'rtl';
  el('lang').textContent=english?'HE':'EN';
  el('lang').setAttribute('aria-label',
    english?'Switch language to Hebrew':'החלפת שפה לאנגלית');
  for(const node of document.querySelectorAll('[data-he][data-en]')){
    node.textContent=node.dataset[english?'en':'he'];
  }
  refresh();
}
for(const id of ['scene','position','scale','finish','drawers','compare-split']){
  el(id).addEventListener(id==='position'||id==='scale'||id==='compare-split'?'input':'change',()=>{
    state=currentInput();
    refresh();
  });
}
el('toggle-view').addEventListener('click',()=>{
  state=normalizeReview({sceneId:state.scene_id,position:state.position_percent,
    scale:state.scale_percent,finish:state.finish,drawers:state.drawers,
    comparison:state.comparison_percent,view:state.view==='before'?'after':'before'});
  refresh();
});
el('compare-view').addEventListener('click',()=>{
  state=normalizeReview({sceneId:state.scene_id,position:state.position_percent,
    scale:state.scale_percent,finish:state.finish,drawers:state.drawers,
    comparison:state.comparison_percent,view:state.view==='compare'?'after':'compare'});
  refresh();
});
el('reset').addEventListener('click',()=>{state=normalizeReview();preferred=null;syncInputs();refresh();});
el('save-preferred').addEventListener('click',()=>{
  if(state.view==='before')return;
  preferred=normalizeReview({sceneId:state.scene_id,position:state.position_percent,
    scale:state.scale_percent,finish:state.finish,drawers:state.drawers,
    comparison:state.comparison_percent,view:'after'});
  refresh();
});
el('restore-preferred').addEventListener('click',()=>{
  if(!preferred)return;
  state=preferred;syncInputs();refresh();
});
el('lang').addEventListener('click',()=>{
  document.documentElement.lang=lang()==='he'?'en':'he';
  translate();
});
// Window resizing can change the safe frame on Android rotation.
window.addEventListener('resize',refresh,{passive:true});
syncInputs();translate();
