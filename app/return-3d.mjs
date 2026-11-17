/* APP MVP-15: return a schematic 3D model inside the MAIN PWA approval step.
 * Receives only the approved, whitelisted version (no notes, photos, cloud or AI).
 */
import {buildNightstand,projectNightstand,faceColor} from './concept-geometry.mjs';

const $=id=>document.getElementById(id);
const ns='http://www.w3.org/2000/svg';
const he=()=>document.documentElement.lang!=='en';
const tr=(a,b)=>he()?a:b;
let approved=null,azimuth=32,elevation=27,pointer=null;
function valid(d){
  if(!d||typeof d!=='object')return false;
  if(!/^visual-v[1-9]\d*$/.test(d.version_id)||
     !['natural','honey','walnut'].includes(d.finish)||
     ![1,2].includes(d.drawers)||
     !['shelf','closed'].includes(d.lower_section)||
     ![4,6].includes(d.nominal_thickness_mm))return false;
  const size=d.dimensions_mm;
  if(!size||typeof size!=='object')return false;
  return [['width',200,900],['height',200,1000],['depth',250,600]].every(
    ([key,min,max])=>Number.isInteger(size[key])&&size[key]>=min&&size[key]<=max);
}
function setRecord(){
  // The existing visual-approval record is kept, but its "next_stage" is no
  // longer falsely reported as not implemented after receipt of the model.
  if(!approved)return;
  for(const line of $('approval-record').children){
    if(line.textContent?.startsWith('next_stage: '))
      line.textContent='next_stage: LOCAL_CONCEPT_3D_READY';
  }
}
function render(){
  if(!approved)return;
  const model=buildNightstand(approved,approved.dimensions_mm);
  const view=projectNightstand(model,azimuth,elevation,100);
  const fragment=document.createDocumentFragment();
  for(const face of view.faces){
    const polygon=document.createElementNS(ns,'polygon');
    polygon.setAttribute('points',face.points.map(x=>x.join(',')).join(' '));
    polygon.setAttribute('fill',faceColor(view.palette,face.face,face.kind));
    polygon.setAttribute('stroke',view.palette.outline);
    polygon.setAttribute('stroke-width','1.1');
    polygon.setAttribute('stroke-linejoin','round');
    polygon.dataset.part=face.part_id;
    polygon.dataset.face=face.face;
    fragment.append(polygon);
  }
  $('approved-3d-faces').replaceChildren(fragment);
  const mm=model.dimensions_mm;
  $('approved-3d-summary').textContent=
    approved.version_id+' · '+mm.width+' × '+mm.height+' × '+mm.depth+' mm · '+
    tr('גוון: ','Finish: ')+approved.finish+' · '+
    approved.drawers+' '+tr('מגירות','drawer(s)')+' · '+
    tr('תחתית: ','Lower section: ')+
      (approved.lower_section==='closed'?tr('חזית סגורה','Closed front'):tr('מדף פתוח','Open shelf'))+' · '+
    tr('לביד ','Plywood ')+approved.nominal_thickness_mm+' mm · '+
    tr('המחשה לא מאושרת לייצור','Unverified manufacturing concept');
  const desc=tr('שידת לילה בתלת־ממד: ','3D nightstand: ')+
    approved.drawers+' '+tr('מגירות, ','drawers, ')+
    mm.width+' × '+mm.height+' × '+mm.depth+' mm';
  $('approved-3d-view').setAttribute('aria-label',desc);
  $('approved-3d-svg-title').textContent=desc;
  setRecord();
}
function rotate(dx,dy=0){
  azimuth=(azimuth+dx+360)%360;
  elevation=Math.max(10,Math.min(70,elevation+dy));
  render();
}
window.addEventListener('assembl:3d-model-ready',event=>{
  const panel=$('approved-3d');
  const error=$('approved-3d-error');
  if(!valid(event.detail)){
    approved=null;
    panel.hidden=true;
    error.hidden=false;
    error.textContent=tr('לא ניתן להציג מודל מהגרסה שאושרה. ניתן לחזור לגרסאות ולנסות שוב.',
      'Unable to show this approved version. Return to your concepts and try again.');
    return;
  }
  const d=event.detail;
  approved=Object.freeze({
    version_id:d.version_id,
    finish:d.finish,drawers:d.drawers,
    lower_section:d.lower_section,
    nominal_thickness_mm:d.nominal_thickness_mm,
    dimensions_mm:Object.freeze({
      width:d.dimensions_mm.width,height:d.dimensions_mm.height,depth:d.dimensions_mm.depth
    })
  });
  azimuth=32;elevation=27;
  panel.hidden=false;
  error.hidden=true;
  error.textContent='';
  render();
  // The existing inline approval handler may run AFTER the intent handler.
  // Use a browser task, not a microtask: between separate event listeners the
  // browser may run a microtask checkpoint. This runs after ALL click handlers,
  // including the legacy main app go('approved'), and avoids stale progress.
  window.setTimeout(()=>{
    if(!approved||$('approved').hidden)return;
    document.querySelector('.progress-step[data-phase="1"]')?.classList.remove('active');
    document.querySelector('.progress-step[data-phase="2"]')?.classList.add('active');
    setRecord();
  },0);
});
$('approved-3d-left').addEventListener('click',()=>rotate(-15));
$('approved-3d-right').addEventListener('click',()=>rotate(15));
$('approved-3d-reset').addEventListener('click',()=>{
  azimuth=32;elevation=27;render();
});
const svg=$('approved-3d-view');
svg.addEventListener('keydown',event=>{
  const key={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,10],ArrowDown:[0,-10]}[event.key];
  if(!key)return;
  event.preventDefault();
  rotate(key[0],key[1]);
});
svg.addEventListener('pointerdown',event=>{
  if(event.button!==0||pointer!==null)return;
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY};
  svg.setPointerCapture(event.pointerId);
});
svg.addEventListener('pointermove',event=>{
  if(!pointer||event.pointerId!==pointer.id)return;
  const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
  pointer={id:pointer.id,x:event.clientX,y:event.clientY};
  if(Math.abs(dx)+Math.abs(dy)<1)return;
  rotate(Math.round(dx/3),Math.round(-dy/4));
});
for(const name of ['pointerup','pointercancel','lostpointercapture']){
  svg.addEventListener(name,event=>{
    if(pointer?.id===event.pointerId)pointer=null;
  });
}
document.addEventListener('click',event=>{
  if(event.target?.id==='lang'&&approved)render();
});
