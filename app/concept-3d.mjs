/* MVP-13 — local-only interactive 3D concept. Never sends or stores an imported file. */
import {parseSelectedConcept,demoConcept,buildNightstand,projectNightstand,faceColor} from './concept-geometry.mjs';

const el=id=>document.getElementById(id);
const ns='http://www.w3.org/2000/svg';
const currentLanguage=()=>document.documentElement.lang==='en'?'en':'he';
const tr=(he,en)=>currentLanguage()==='he'?he:en;
let concept=demoConcept();
let dims={...concept.dimensions_mm};
let azimuth=32,elevation=27,zoom=100;
let pointer=null;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function showStatus(he,en){el('load-status').textContent=tr(he,en);}
function syncDims(){
  el('width-mm').value=String(dims.width);
  el('height-mm').value=String(dims.height);
  el('depth-mm').value=String(dims.depth);
}
function syncCamera(){
  el('azimuth').value=String(azimuth);
  el('elevation').value=String(elevation);
  el('zoom').value=String(zoom);
  el('azimuth-out').textContent=azimuth+'°';
  el('elevation-out').textContent=elevation+'°';
  el('zoom-out').textContent=zoom+'%';
}
function polygon(face,model){
  const path=document.createElementNS(ns,'polygon');
  path.setAttribute('points',face.points.map(p=>p.join(',')).join(' '));
  path.setAttribute('fill',faceColor(model.palette,face.face,face.kind));
  path.setAttribute('stroke',model.palette.outline);
  path.setAttribute('stroke-width','1.15');
  path.setAttribute('stroke-linejoin','round');
  path.setAttribute('data-part',face.part_id);
  path.setAttribute('data-face',face.face);
  return path;
}
function render(){
  const model=buildNightstand(concept,dims);
  const view=projectNightstand(model,azimuth,elevation,zoom);
  const nodes=document.createDocumentFragment();
  for(const face of view.faces)nodes.appendChild(polygon(face,view));
  el('model-faces').replaceChildren(nodes);
  syncCamera();
  el('concept-view').setAttribute('aria-label',tr(
    'המחשת תלת־ממד של שידה, '+dims.width+' רוחב, '+dims.height+' גובה, '+dims.depth+
      ' עומק במילימטרים. '+concept.drawers+' מגירות. חצים מסובבים את התצוגה.',
    '3D nightstand concept, width '+dims.width+', height '+dims.height+', depth '+
      dims.depth+' mm. '+concept.drawers+' drawer(s). Arrow keys rotate.'));
  const label=concept.selected_slot==='DEMO'?
    tr('דגם לדוגמה','Sample model'):
    tr('חלופה ','Concept ')+concept.selected_slot;
  el('model-summary').textContent=label+' · '+
    dims.width+' × '+dims.height+' × '+dims.depth+' mm · '+
    tr('לביד בירץ׳ ','Birch plywood ')+model.nominal_thickness_mm+' mm · '+
    concept.drawers+' '+tr('מגירות','drawer(s)')+' · '+
    tr('גוון ','Finish ')+concept.finish+' · '+
    model.parts.length+' '+tr('נפחים להמחשה','illustrative volumes')+' · '+
    tr('לא מאושר להנדסה או לייצור','not engineering or manufacturing approved');
}
function translate(){
  const english=currentLanguage()==='en';
  document.documentElement.dir=english?'ltr':'rtl';
  el('lang').textContent=english?'HE':'EN';
  el('lang').setAttribute('aria-label',english?'Switch to Hebrew':'החלף שפה לאנגלית');
  for(const node of document.querySelectorAll('[data-he][data-en]')){
    node.textContent=node.dataset[english?'en':'he'];
  }
  el('model-title').textContent=tr('המחשת שידה תלת־ממדית','Conceptual 3D nightstand');
  showStatus(concept.selected_slot==='DEMO'?'מוצג מודל לדוגמה.':'קובץ אפיון מקומי נטען.',
    concept.selected_slot==='DEMO'?'Showing a sample model.':'Local design intent imported.');
  render();
}
el('lang').addEventListener('click',()=>{
  document.documentElement.lang=currentLanguage()==='he'?'en':'he';
  translate();
});
el('load-demo').addEventListener('click',()=>{
  concept=demoConcept();
  dims={...concept.dimensions_mm};
  syncDims();
  el('concept-file').value='';
  translate();
});
el('concept-file').addEventListener('change',async()=>{
  const file=el('concept-file').files?.[0];
  if(!file)return;
  if(file.size===0||file.size>16000){
    showStatus('קובץ נדחה: הקובץ חייב להיות JSON קטן מ־16KB.',
      'Rejected: the JSON must be under 16KB.');
    el('concept-file').value='';
    return;
  }
  try{
    const candidate=parseSelectedConcept(await file.text());
    concept=candidate;
    dims={...candidate.dimensions_mm};
    syncDims();
    translate();
  }catch{
    showStatus('קובץ נדחה: המבנה או הנתונים אינם תואמים לאפיון הסינתטי המאושר.',
      'Rejected: invalid or unapproved synthetic design intent.');
    el('concept-file').value='';
  }
});
for(const [field,min,max] of [
  ['width',200,900],['height',250,950],['depth',200,600]
]){
  el(field+'-mm').addEventListener('change',()=>{
    const raw=el(field+'-mm').value;
    const val=Number(raw);
    if(raw.trim()===''||!Number.isInteger(val)||val<min||val>max){
      el(field+'-mm').value=String(dims[field]);
      showStatus('מידה לא חוקית. הערך הקודם נשמר.','Invalid dimension. Kept the previous value.');
      return;
    }
    dims={...dims,[field]:val};
    render();
  });
}
for(const [field,min,max] of [
  ['azimuth',0,360],['elevation',10,70],['zoom',60,160]
]){
  el(field).addEventListener('input',()=>{
    const value=clamp(Number(el(field).value),min,max);
    if(!Number.isInteger(value))return;
    if(field==='azimuth')azimuth=value;
    if(field==='elevation')elevation=value;
    if(field==='zoom')zoom=value;
    render();
  });
}
function rotate(dx,dy){
  azimuth=(azimuth+dx+360)%360;
  elevation=clamp(elevation+dy,10,70);
  render();
}
el('orbit-left').addEventListener('click',()=>rotate(-15,0));
el('orbit-right').addEventListener('click',()=>rotate(15,0));
el('orbit-up').addEventListener('click',()=>rotate(0,10));
el('orbit-down').addEventListener('click',()=>rotate(0,-10));
el('orbit-reset').addEventListener('click',()=>{
  azimuth=32;elevation=27;zoom=100;render();
});
const svg=el('concept-view');
svg.addEventListener('keydown',event=>{
  const movements={
    ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,10],ArrowDown:[0,-10]
  };
  if(Object.hasOwn(movements,event.key)){
    event.preventDefault();
    rotate(...movements[event.key]);
  }else if(event.key==='+'||event.key==='='){
    event.preventDefault();zoom=clamp(zoom+10,60,160);render();
  }else if(event.key==='-'){
    event.preventDefault();zoom=clamp(zoom-10,60,160);render();
  }
});
svg.addEventListener('pointerdown',event=>{
  if(event.button!==0||pointer)return;
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY};
  svg.setPointerCapture(event.pointerId);
});
svg.addEventListener('pointermove',event=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY};
  if(Math.abs(dx)+Math.abs(dy)<1)return;
  rotate(Math.round(dx/3),Math.round(-dy/4));
});
for(const name of ['pointerup','pointercancel','lostpointercapture']){
  svg.addEventListener(name,event=>{
    if(pointer?.id===event.pointerId)pointer=null;
  });
}
syncDims();translate();
