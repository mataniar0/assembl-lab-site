/* APP MVP-09: synthetic room preview; zero network, zero persistence.
 * This page deliberately has no input for user photographs or personal notes.
 */
import {normalizeReview,sceneFor,viewFor} from './preview-state.mjs';
const el=id=>document.getElementById(id);
const lang=()=>document.documentElement.lang==='en'?'en':'he';
const phrase=(he,en)=>lang()==='he'?he:en;
let state=normalizeReview();
function currentInput(){
  return normalizeReview({
    sceneId:el('scene').value,
    position:Number(el('position').value),
    scale:Number(el('scale').value),
    finish:el('finish').value,
    drawers:Number(el('drawers').value),
    view:state.view
  });
}
function syncInputs(){
  el('scene').value=state.scene_id;
  el('position').value=String(state.position_percent);
  el('scale').value=String(state.scale_percent);
  el('finish').value=state.finish;
  el('drawers').value=String(state.drawers);
}
function refresh(){
  const visual=viewFor(state);
  const room=el('room');
  room.className='room '+visual.scene_kind+(visual.show_nightstand?'':' before');
  el('stand-position').style.left=visual.horizontal_position;
  el('stand-position').style.transform='translateX(-50%) scale('+visual.nightstand_scale+')';
  const stand=el('stand');
  stand.dataset.finish=visual.finish;
  stand.classList.toggle('two-drawers',visual.drawers===2);
  const scene=sceneFor(state.scene_id);
  el('scene-label').textContent=scene.id+' · '+(lang()==='he'?scene.he:scene.en);
  const mode=visual.show_nightstand?
    phrase('אחרי — המחשת שידה סכמטית','After — schematic nightstand'):
    phrase('לפני — חדר דוגמה ריק','Before — empty test room');
  el('toggle-view').setAttribute('aria-pressed',String(!visual.show_nightstand));
  el('toggle-view').textContent=visual.show_nightstand?
    phrase('הצג את החדר לפני הוספת השידה','Show room before'):
    phrase('הצג את השידה בחדר','Show nightstand in room');
  el('view-status').textContent=mode+'. '+phrase('לא תמונת AI אמיתית.','Not a real AI image.');
  el('position-value').textContent=state.position_percent+'%';
  el('scale-value').textContent=state.scale_percent+'%';
  el('details').textContent=phrase(
    'מיקום '+state.position_percent+'% · קנה מידה '+state.scale_percent+'% · '+state.drawers+' מגירות. הדגם נועד להמחשה בלבד.',
    'Position '+state.position_percent+'% · illustrative scale '+state.scale_percent+'% · '+state.drawers+' drawer(s). Concept only.');
  room.setAttribute('aria-label',phrase(
    'חדר סינתטי: '+scene.he+'; '+mode,
    'Synthetic room: '+scene.en+'; '+mode
  ));
}
function translate(){
  const english=lang()==='en';
  document.documentElement.dir=english?'ltr':'rtl';
  el('lang').textContent=english?'HE':'EN';
  for(const node of document.querySelectorAll('[data-he][data-en]')){
    node.textContent=node.dataset[english?'en':'he'];
  }
  refresh();
}
for(const id of ['scene','position','scale','finish','drawers']){
  el(id).addEventListener(id==='position'||id==='scale'?'input':'change',()=>{
    state=currentInput();refresh();
  });
}
el('toggle-view').addEventListener('click',()=>{
  state=normalizeReview({...state,sceneId:state.scene_id,
    position:state.position_percent,scale:state.scale_percent,
    view:state.view==='before'?'after':'before'});
  refresh();
});
el('reset').addEventListener('click',()=>{state=normalizeReview();syncInputs();refresh();});
el('lang').addEventListener('click',()=>{
  document.documentElement.lang=lang()==='he'?'en':'he';
  translate();
});
syncInputs();translate();
