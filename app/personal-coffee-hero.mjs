/* APP MVP-21: real-product photograph is the hero. The 3D viewer adapts the
 * archived 32-part CTB-01 digital prototype to the finish visible in actual
 * photographs 01/06 (warm timber drum rim, three PAIRS of curved black legs,
 * connecting black ring). No invented straight-leg proxy and no duplicate
 * hero screenshot from the model.
 *
 * This is a source-CAD-grounded VISUAL DESIGN preview, not a measured digital
 * twin or a fabrication model. Everything stays local/same-origin and offline.
 */
import {
  finishPersonalDesign,verifyPersonalSource
} from './photo-grounded-coffee-glb.mjs';

const $=id=>document.getElementById(id);
const host=$('personal-coffee-model');
const photo=$('personal-coffee-photo');
const image=photo.querySelector('img');
const photoButton=$('personal-coffee-show-photo');
const modelButton=$('personal-coffee-show-model');
const status=$('personal-coffee-model-status');
const vendor=new URL('../assets/vendor/model-viewer-4.1.0/model-viewer.min.js',import.meta.url).href;
const source3d=new URL('../table/personal/media/personal-design-preview.glb',import.meta.url).href;
const words={
  photo:['צילום השולחן המוגמר כפי שנבנה.','Photograph of the actual finished coffee table.'],
  loading:['טוען את מודל התכנון המקורי ומשווה את גימורו לתצלומי המוצר…',
    'Loading the original design model with a finish based on real product photos…'],
  ready:['מודל תכנון הכולל רגליים מעוקלות בזוגות, טבעת חיבור ופלטת עץ. המבנה לא אומת מול המוצר בפועל.',
    'Design preview with paired curved legs, connecting ring and warm wood top. Exact built-product geometry is unverified.'],
  unavailable:['תלת־ממד אינו זמין במכשיר זה; צילום המוצר האמיתי נשאר זמין.',
    '3D is unavailable on this device; the actual product photograph remains visible.'],
  error:['המודל לא נטען. צילום המוצר האמיתי נשאר זמין.',
    'The 3D preview could not load; the authentic product photo remains visible.']
};
const he=()=>document.documentElement.lang!=='en';
let viewer=null,blobUrl=null,loadingPromise=null,viewerPromise=null;
let generation=0,mode='photo',statusKey='photo',timeout=null;
function tell(key){statusKey=key;status.textContent=words[key][he()?0:1];}
function applyAlt(){
  image.alt=he()?image.dataset.heAlt:image.dataset.enAlt;
  if(viewer)viewer.alt=he()?
    'תצוגת מודל התכנון המקורי של שולחן הקפה, עם שלושה זוגות רגליים שחורות מעוקלות, טבעת חיבור ופלטת עץ עגולה':
    'Original design-preview coffee table with three pairs of curved black legs, black connecting ring and round wood top';
}
function webGLAvailable(){
  try{
    const canvas=document.createElement('canvas');
    const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
    if(!gl)return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  }catch{return false;}
}
function dispose(){
  if(timeout!==null){clearTimeout(timeout);timeout=null;}
  viewer?.remove();viewer=null;
  if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null;}
  host.replaceChildren();host.hidden=true;
}
function showPhoto(key='photo'){
  generation++;
  mode='photo';loadingPromise=null;
  photo.hidden=false;host.hidden=true;
  photoButton.setAttribute('aria-pressed','true');
  modelButton.setAttribute('aria-pressed','false');
  modelButton.disabled=false;
  tell(key);
}
async function showModel(){
  if(mode==='model'&&viewer?.loaded)return;
  if(viewer?.loaded&&blobUrl){
    mode='model';host.dataset.state='interactive';host.hidden=false;photo.hidden=true;
    photoButton.setAttribute('aria-pressed','false');
    modelButton.setAttribute('aria-pressed','true');tell('ready');return;
  }
  if(mode==='loading')return;
  if(!webGLAvailable()){showPhoto('unavailable');return;}
  const token=++generation;mode='loading';tell('loading');
  modelButton.disabled=true;
  try{
    viewerPromise ||= import(vendor).catch(err=>{viewerPromise=null;throw err;});
    // Source fetch is same-origin and precached by this PWA: NO cloud APIs.
    const [_,resp]=await Promise.all([viewerPromise,fetch(source3d)]);
    if(!resp.ok)throw new Error('ORIGINAL_GLTF_FETCH_FAILED');
    const original=new Uint8Array(await resp.arrayBuffer());
    await verifyPersonalSource(original); // hard stop on unexpected source edits
    if(token!==generation)return;
    const output=finishPersonalDesign(original);
    blobUrl=URL.createObjectURL(new Blob([output],{type:'model/gltf-binary'}));
    const next=document.createElement('model-viewer');
    next.setAttribute('camera-controls','');
    next.setAttribute('touch-action','pan-y');
    next.setAttribute('interaction-prompt','none');
    next.setAttribute('loading','eager');
    next.setAttribute('camera-orbit','34deg 70deg auto');
    next.setAttribute('field-of-view','30deg');
    next.setAttribute('min-field-of-view','20deg');
    next.setAttribute('max-field-of-view','60deg');
    next.setAttribute('environment-image','neutral');
    next.setAttribute('exposure','1.15');
    next.setAttribute('shadow-intensity','1');
    next.setAttribute('shadow-softness','.8');
    next.tabIndex=0;
    viewer=next;applyAlt();
    next.addEventListener('load',()=>{
      if(token!==generation)return;
      if(timeout!==null){clearTimeout(timeout);timeout=null;}
      mode='model';modelButton.disabled=false;
      host.dataset.state='interactive';host.hidden=false;photo.hidden=true;
      modelButton.setAttribute('aria-pressed','true');
      photoButton.setAttribute('aria-pressed','false');
      tell('ready');
    },{once:true});
    next.addEventListener('error',()=>{
      if(token!==generation)return;
      dispose();showPhoto('error');
    },{once:true});
    host.replaceChildren(next);
    // Keep stage rendered for WebGL but behind the original photo until load.
    host.hidden=false;host.dataset.state='loading';
    timeout=setTimeout(()=>{
      if(token!==generation||next.loaded)return;
      dispose();showPhoto('error');
    },30000);
    next.src=blobUrl;
  }catch{
    if(token===generation){dispose();showPhoto('error');}
  }finally{
    if(token===generation&&mode!=='model')modelButton.disabled=false;
    loadingPromise=null;
  }
}
photoButton.addEventListener('click',()=>showPhoto());
modelButton.addEventListener('click',()=>{
  if(mode==='model'&&viewer?.loaded)return;
  loadingPromise ||= showModel();
});
$('lang').addEventListener('click',()=>{
  // Main app owns document lang and might update it in a later click handler.
  setTimeout(()=>{applyAlt();tell(statusKey);},0);
});
window.addEventListener('pagehide',()=>{
  generation++;dispose();loadingPromise=null;
});
applyAlt();tell('photo');
