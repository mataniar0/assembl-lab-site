/* MVP-16: product-style GLB displayed INSIDE the main customer PWA.
 * Reuses the site's local, pinned @google/model-viewer 4.1.0.
 * The input is an approved, strictly whitelisted version snapshot.
 * No cloud, AI, real customer photography, request to external hosts or
 * engineering/manufacturing approval.
 */
import {buildNightstand,projectNightstand,faceColor} from './concept-geometry.mjs';
import {showcaseNightstandGlb} from './showcase-glb.mjs';

const $=id=>document.getElementById(id);
const ns='http://www.w3.org/2000/svg';
const he=()=>document.documentElement.lang!=='en';
const tr=(a,b)=>he()?a:b;
const viewerLibrary=new URL('../assets/vendor/model-viewer-4.1.0/model-viewer.min.js',import.meta.url).href;
let approved=null,azimuth=32,elevation=27,zoomLevel=100,pointer=null;
let viewer=null,blobUrl=null,loadGeneration=0,viewerPromise=null,loadTimeout=null;
const host=$('approved-glb-host');
const svg=$('approved-3d-view');

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
function alt(){
  if(!approved)return tr('שידה תלת־ממדית','3D nightstand');
  const d=approved.dimensions_mm;
  return tr('מודל GLB של שידת לילה להמחשה, ','Concept GLB nightstand, ')+
    d.width+' × '+d.height+' × '+d.depth+' mm, '+
    approved.drawers+' '+tr('מגירות','drawer(s)');
}
function status(heText,enText){
  $('approved-glb-status').textContent=tr(heText,enText);
}
function setRecord(){
  if(!approved)return;
  for(const line of $('approval-record').children){
    if(line.textContent?.startsWith('next_stage: '))
      line.textContent='next_stage: LOCAL_CONCEPT_GLB_READY';
  }
}
function render(){
  if(!approved)return;
  const model=buildNightstand(approved,approved.dimensions_mm);
  const view=projectNightstand(model,azimuth,elevation,zoomLevel);
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
    tr('להמחשה בלבד — לא מאושר לייצור','Concept only — not manufacturing approved');
  svg.setAttribute('aria-label',alt());
  $('approved-3d-svg-title').textContent=alt();
  if(viewer)viewer.setAttribute('alt',alt());
  setRecord();
}
function resetFallback(){
  svg.hidden=false;
  host.hidden=true;
  host.dataset.state='fallback';
}
function disposeViewer(){
  if(loadTimeout!==null){clearTimeout(loadTimeout);loadTimeout=null;}
  viewer?.remove();
  viewer=null;
  host.replaceChildren();
  if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null;}
  resetFallback();
}
function failGLB(request,reason){
  if(request!==loadGeneration)return;
  disposeViewer();
  if(reason==='webgl')status(
    'תצוגת GLB דורשת WebGL. מוצגת במקומה תצוגה תלת־ממדית חלופית.',
    'GLB viewing requires WebGL. Showing the alternative 3D preview.');
  else status(
    'לא ניתן לטעון את מודל ה־GLB במכשיר זה. מוצגת המחשה חלופית.',
    'Could not load this GLB on your device. Showing the alternative preview.');
}
function webGLAvailable(){
  try{
    const c=document.createElement('canvas');
    const context=c.getContext('webgl2')||c.getContext('webgl');
    if(!context)return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  }catch{return false;}
}
async function loadQualityGLB(){
  const request=++loadGeneration;
  disposeViewer();
  if(!approved)return;
  if(!webGLAvailable()){failGLB(request,'webgl');return;}
  status('מכין מודל GLB איכותי לתצוגה בתוך האפליקציה…',
    'Preparing your GLB for the in-app 3D viewer…');
  try{
    viewerPromise ||= import(viewerLibrary).catch(error=>{
      viewerPromise=null;
      throw error;
    });
    await viewerPromise;
    if(request!==loadGeneration)return;
    if(!customElements.get('model-viewer'))throw new Error('VIEWER_NOT_REGISTERED');
    // The generated binary is a real glTF 2.0 GLB and belongs ONLY to this
    // approved concept. No URL is ever passed from a user or remote service.
    const bytes=showcaseNightstandGlb(approved);
    if(request!==loadGeneration)return;
    blobUrl=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'}));
    const next=document.createElement('model-viewer');
    next.setAttribute('camera-controls','');
    next.setAttribute('touch-action','pan-y');
    next.setAttribute('interaction-prompt','none');
    next.setAttribute('loading','eager');
    next.setAttribute('camera-orbit','35deg 70deg auto');
    next.setAttribute('field-of-view','45deg');
    next.setAttribute('min-field-of-view','20deg');
    next.setAttribute('max-field-of-view','60deg');
    next.setAttribute('min-camera-orbit','auto 5deg 0.1m');
    next.setAttribute('max-camera-orbit','auto 175deg 10m');
    next.setAttribute('environment-image','neutral');
    next.setAttribute('shadow-intensity','1');
    next.setAttribute('shadow-softness','0.8');
    next.setAttribute('exposure','1.15');
    next.setAttribute('alt',alt());
    next.setAttribute('aria-label',alt());
    next.tabIndex=0;
    const onLoaded=()=>{
      if(request!==loadGeneration)return;
      if(loadTimeout!==null){clearTimeout(loadTimeout);loadTimeout=null;}
      host.dataset.state='ready';
      svg.hidden=true;
      status('מודל GLB מוכן! סובבו עם האצבע, הגדילו והקטינו.',
        'Your GLB is ready! Drag to rotate and pinch to zoom.');
    };
    next.addEventListener('load',onLoaded,{once:true});
    next.addEventListener('error',()=>failGLB(request,'load'),{once:true});
    viewer=next;
    host.dataset.state='loading';
    host.hidden=false;
    host.replaceChildren(next);
    loadTimeout=setTimeout(()=>failGLB(request,'timeout'),30000);
    next.src=blobUrl;
  }catch{
    failGLB(request,'library');
  }
}
function rotate(dx,dy=0){
  if(viewer?.loaded&&host.dataset.state==='ready'){
    const orbit=viewer.getCameraOrbit();
    const theta=orbit.theta*180/Math.PI+dx;
    const phi=Math.max(5,Math.min(175,orbit.phi*180/Math.PI-dy));
    viewer.cameraOrbit=theta+'deg '+phi+'deg '+orbit.radius+'m';
    viewer.jumpCameraToGoal();
    return;
  }
  azimuth=(azimuth+dx+360)%360;
  elevation=Math.max(10,Math.min(70,elevation+dy));
  render();
}
window.addEventListener('assembl:3d-model-ready',event=>{
  const panel=$('approved-3d'),error=$('approved-3d-error');
  if(!valid(event.detail)){
    loadGeneration++;
    disposeViewer();
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
  azimuth=32;elevation=27;zoomLevel=100;
  panel.hidden=false;
  error.hidden=true;
  error.textContent='';
  render();
  void loadQualityGLB();
  // Main inline approval handler runs later than the intent snapshot handler.
  // Wait for the browser task to finish before marking step 2 active.
  window.setTimeout(()=>{
    if(!approved||$('approved').hidden)return;
    document.querySelector('.progress-step[data-phase="1"]')?.classList.remove('active');
    document.querySelector('.progress-step[data-phase="2"]')?.classList.add('active');
    setRecord();
  },0);
});
function zoom(factor){
  if(viewer?.loaded&&host.dataset.state==='ready'){
    const orbit=viewer.getCameraOrbit();
    const radius=Math.max(.1,Math.min(10,orbit.radius*factor));
    viewer.cameraOrbit=(orbit.theta*180/Math.PI)+'deg '+
      (orbit.phi*180/Math.PI)+'deg '+radius+'m';
    viewer.jumpCameraToGoal();
    return;
  }
  zoomLevel=Math.max(60,Math.min(160,Math.round(zoomLevel/factor)));
  render();
}
$('approved-3d-left').addEventListener('click',()=>rotate(-30));
$('approved-3d-right').addEventListener('click',()=>rotate(30));
$('approved-3d-zoom-in').addEventListener('click',()=>zoom(.8));
$('approved-3d-zoom-out').addEventListener('click',()=>zoom(1.25));
$('approved-3d-reset').addEventListener('click',()=>{
  azimuth=32;elevation=27;zoomLevel=100;
  if(viewer?.loaded&&host.dataset.state==='ready'){
    viewer.cameraOrbit='35deg 70deg auto';
    viewer.fieldOfView='45deg';
    viewer.cameraTarget='auto auto auto';
    viewer.jumpCameraToGoal();
  }
  render();
});
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
window.addEventListener('pagehide',()=>{
  loadGeneration++;
  disposeViewer();
});
