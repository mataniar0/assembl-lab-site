/* MVP-24: return the site's ORIGINAL Personal Coffee Table design GLB inside
 * the main app after a visual-approval event. This is a FIXED demonstration
 * reference, NOT a per-customer parametric coffee-table adaptation; the legacy
 * pilot input values are retained for the request, not applied to this GLB.
 * The source design is SHA-256 verified and gets local photo-based materials.
 * No cloud, external AI or manufacture approval.
 */
import {finishPersonalDesign,verifyPersonalSource} from './photo-grounded-coffee-glb.mjs';

const $=id=>document.getElementById(id);
const he=()=>document.documentElement.lang!=='en';
const tr=(a,b)=>he()?a:b;
const viewerLibrary=new URL('../assets/vendor/model-viewer-4.1.0/model-viewer.min.js',import.meta.url).href;
const sourceGlb=new URL('../table/personal/media/personal-design-preview.glb',import.meta.url).href;
let approved=null;
let viewer=null,blobUrl=null,loadGeneration=0,viewerPromise=null,loadTimeout=null;
const host=$('approved-glb-host');
const svg=$('approved-3d-view');
const fallbackPhoto=$('approved-coffee-fallback');

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
  return tr('שולחן קפה אישי – מודל תכנון מקורי בן 32 חלקים, לא תואם למידות שהוזנו',
    'Personal Coffee Table – original 32-part design GLB, not customized to the selected dimensions');
}
function status(heText,enText){
  $('approved-glb-status').textContent=tr(heText,enText);
}
function setRecord(){
  if(!approved)return;
  for(const line of $('approval-record').children){
    if(line.textContent?.startsWith('next_stage: '))
      line.textContent='next_stage: FIXED_PERSONAL_COFFEE_REFERENCE_GLB';
  }
}
function render(){
  if(!approved)return;
  const d=approved.dimensions_mm;
  $('approved-3d-summary').textContent=
    approved.version_id+' · '+
    tr('מודל הדגמה: שולחן קפה אישי · תכנון קבוע בן 32 חלקים. ', 'Demo: Personal Coffee Table · fixed 32-part reference. ')+
    tr('נתוני הבקשה שלא יושמו במודל: ', 'Request inputs NOT applied to model: ')+
    d.width+' × '+d.height+' × '+d.depth+' mm · '+
    tr('גוון מבוקש: ','Requested finish: ')+approved.finish+' · '+
    tr('מגירות (בפיילוט הישן): ','Drawers (legacy pilot): ')+approved.drawers+' · '+
    tr('ללא אישור ייצור','Not manufacturing approved');
  const fallbackAlt=he()?fallbackPhoto.dataset.heAlt:fallbackPhoto.dataset.enAlt;
  fallbackPhoto.alt=fallbackAlt;
  svg.setAttribute('aria-label',alt());
  $('approved-3d-svg-title').textContent=alt();
  if(viewer)viewer.setAttribute('alt',alt());
  setRecord();
}
function resetFallback(){
  svg.setAttribute('hidden','');
  fallbackPhoto.hidden=false;
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
    'תצוגת GLB דורשת WebGL. במקום המודל מוצג צילום שולחן הקפה האישי.',
    'GLB viewing requires WebGL. Showing the real Personal Coffee Table photo instead.');
  else status(
    'מודל ה־GLB לא נטען. מוצג צילום שולחן הקפה האישי.',
    'Could not load the GLB. Showing the Personal Coffee Table photograph.');
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
  status('טוען את קובץ שולחן הקפה האישי ובודק את מקורו…',
    'Loading and checking the Personal Coffee Table reference GLB…');
  try{
    viewerPromise ||= import(viewerLibrary).catch(error=>{
      viewerPromise=null;
      throw error;
    });
    const [_,response]=await Promise.all([viewerPromise,fetch(sourceGlb)]);
    if(request!==loadGeneration)return;
    if(!response.ok)throw new Error('REFERENCE_COFFEE_GLB_NOT_FOUND');
    const source=new Uint8Array(await response.arrayBuffer());
    await verifyPersonalSource(source); // Fail closed on changed or unknown source.
    if(request!==loadGeneration)return;
    if(!customElements.get('model-viewer'))throw new Error('VIEWER_NOT_REGISTERED');
    const bytes=finishPersonalDesign(source); // Original 32 meshes + visual materials.
    if(request!==loadGeneration)return;
    blobUrl=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'}));
    const next=document.createElement('model-viewer');
    next.setAttribute('camera-controls','');
    next.setAttribute('touch-action','pan-y');
    next.setAttribute('interaction-prompt','none');
    next.setAttribute('loading','eager');
    next.setAttribute('camera-orbit','270deg 68deg 1.12m');
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
      svg.setAttribute('hidden','');fallbackPhoto.hidden=true;
      status('מודל שולחן הקפה האישי מוכן. זהו דגם תכנון קבוע, לא ייצור לפי הגדרותיכם.',
        'Personal Coffee Table GLB ready. This fixed design is not customized to your selections.');
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
  // No fake geometry is rotated when the real reference GLB is unavailable.

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
  // When WebGL is unavailable, retain the authentic product photo.

}
$('approved-3d-left').addEventListener('click',()=>rotate(-30));
$('approved-3d-right').addEventListener('click',()=>rotate(30));
$('approved-3d-zoom-in').addEventListener('click',()=>zoom(.8));
$('approved-3d-zoom-out').addEventListener('click',()=>zoom(1.25));
$('approved-3d-reset').addEventListener('click',()=>{
  if(viewer?.loaded&&host.dataset.state==='ready'){
    viewer.cameraOrbit='270deg 68deg 1.12m';
    viewer.fieldOfView='45deg';
    viewer.cameraTarget='auto auto auto';
    viewer.jumpCameraToGoal();
  }
  render();
});
document.addEventListener('click',event=>{
  if(event.target?.id==='lang'&&approved)render();
});
window.addEventListener('pagehide',()=>{
  loadGeneration++;
  disposeViewer();
});
