/* MVP-20: one geometry source for BOTH the hero photo-like snapshot and 3D.
 * We render the same self-contained visual GLB in the catalog's pinned local
 * model-viewer, then snapshot that camera for the hero. No separate imagined
 * image or external AI is used. The genuine built table's original photos and
 * the 32-part DESIGN_ONLY CAD preview remain unchanged at /table/personal/.
 */
import {matchingCoffeeTableGlb} from './coffee-showroom-glb.mjs';

const $=id=>document.getElementById(id);
const host=$('personal-coffee-model');
const photo=$('personal-coffee-photo');
const image=photo.querySelector('img');
const photoButton=$('personal-coffee-show-photo');
const modelButton=$('personal-coffee-show-model');
const status=$('personal-coffee-model-status');
const viewerLibrary=new URL('../assets/vendor/model-viewer-4.1.0/model-viewer.min.js',import.meta.url).href;
const words={
  loading:['טוען את הדמיית השולחן ומכין ממנה תמונת ראווה…','Loading the table model and making its matching hero…'],
  ready:['תמונת הראווה נוצרה מאותו מודל GLB. ניתן לעבור לתלת־ממד ולסובב אותו.','This hero was captured from the same GLB. Switch to 3D to rotate the table.'],
  interactive:['אותו שולחן כמו בתמונת הראווה — סובבו והגדילו את המודל.','The exact same table as the hero — rotate and zoom.'],
  fallback:['לא ניתן לייצר תמונת ראווה מהמודל במכשיר זה; מוצגת תמונת המחשה חלופית שאינה תואמת בדיוק.','A matching GLB snapshot is unavailable on this device; the original conceptual fallback image is shown instead.'],
  error:['מודל השולחן אינו זמין כרגע; מוצגת תמונת המחשה חלופית.','The table model is unavailable; showing the original fallback illustration.']
};
const he=()=>document.documentElement.lang!=='en';
let viewer=null,blobUrl=null,generation=0,state='loading',posterReady=false;
let requestPromise=null,modulePromise=null,loadingTimer=null,desired='photo';
function message(key){
  state=key;
  status.textContent=words[key][he()?0:1];
}
function applyAlt(){
  image.alt=posterReady?
    (he()?'תמונת ראווה שנוצרה מאותו מודל תלת־ממדי של שולחן הקפה העגול':'Showcase capture from the exact round coffee table GLB'):
    (he()?image.dataset.heAlt:image.dataset.enAlt);
  if(viewer)viewer.alt=he()?'מודל תצוגה של שולחן קפה עגול מעץ עם שלוש רגליים שחורות, לא מאומת לייצור':
    'Showroom round wood coffee table with three dark legs, not production verified';
}
function webGLAvailable(){
  try{
    const c=document.createElement('canvas'),gl=c.getContext('webgl2')||c.getContext('webgl');
    if(!gl)return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  }catch{return false;}
}
function setMode(mode){
  desired=mode;
  photoButton.setAttribute('aria-pressed',String(mode==='photo'));
  modelButton.setAttribute('aria-pressed',String(mode==='model'));
  if(!viewer || !viewer.loaded){
    photo.hidden=false;
    host.dataset.state='preview';
    return;
  }
  const interactive=mode==='model';
  if(interactive)viewer.setAttribute('camera-controls','');
  else{
    viewer.removeAttribute('camera-controls');
    viewer.cameraOrbit='35deg 68deg 1.35m';
    viewer.fieldOfView='37deg';
    viewer.jumpCameraToGoal();
  }
  host.dataset.state=interactive?'interactive':'preview';
  photo.hidden=interactive;
  message(interactive?'interactive':posterReady?'ready':'fallback');
}
function resetOnFailure(){
  generation++;
  if(loadingTimer!==null)clearTimeout(loadingTimer);
  loadingTimer=null;
  viewer?.remove();
  viewer=null;
  if(blobUrl)URL.revokeObjectURL(blobUrl);
  blobUrl=null;
  host.replaceChildren();
  host.dataset.state='fallback';
  host.hidden=true;
  photo.hidden=false;
  photoButton.setAttribute('aria-pressed','true');
  modelButton.setAttribute('aria-pressed','false');
  desired='photo';
  message('fallback');
}
async function snapshotFromLoadedModel(next,attempt){
  try{
    // Give the renderer two paint cycles so its lighting/frame are settled.
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(generation!==attempt||next!==viewer)return;
    const data=await next.toDataURL('image/png');
    if(typeof data!=='string'||!data.startsWith('data:image/png;base64,')||data.length<5000)
      throw new Error('NO_CANVAS_SNAPSHOT');
    if(generation!==attempt||next!==viewer)return;
    const sources=[...photo.querySelectorAll('source')];
    sources.forEach(source=>source.remove());
    image.src=data;image.removeAttribute('srcset');
    image.dataset.showcaseSource='exact-loaded-coffee-glb';
    posterReady=true;
    applyAlt();
    setMode(desired);
  }catch{
    if(generation===attempt){posterReady=false;setMode(desired);}
  }
}
async function prepareHero(){
  if(requestPromise)return requestPromise;
  if(!webGLAvailable()){
    message('fallback');
    return;
  }
  const attempt=++generation;
  message('loading');
  requestPromise=(async()=>{
    try{
      modulePromise ||= import(viewerLibrary).catch(e=>{modulePromise=null;throw e;});
      await modulePromise;
      if(generation!==attempt)return;
      if(!customElements.get('model-viewer'))throw new Error('UNREGISTERED_VIEWER');
      const next=document.createElement('model-viewer');
      next.setAttribute('loading','eager');
      next.setAttribute('interaction-prompt','none');
      next.setAttribute('touch-action','pan-y');
      next.setAttribute('camera-orbit','35deg 68deg 1.35m');
      next.setAttribute('camera-target','0m 0.225m 0m');
      next.setAttribute('field-of-view','37deg');
      next.setAttribute('environment-image','neutral');
      next.setAttribute('exposure','1.08');
      next.setAttribute('shadow-intensity','1');
      next.setAttribute('shadow-softness','.85');
      next.tabIndex=0;
      viewer=next;applyAlt();
      host.replaceChildren(next);
      host.hidden=false;
      host.dataset.state='preview'; // invisible, but still has layout for WebGL rendering
      const bytes=matchingCoffeeTableGlb();
      blobUrl=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'}));
      next.addEventListener('load',()=>{
        if(generation!==attempt)return;
        if(loadingTimer!==null)clearTimeout(loadingTimer);
        loadingTimer=null;
        setMode(desired);
        void snapshotFromLoadedModel(next,attempt);
      },{once:true});
      next.addEventListener('error',()=>{if(generation===attempt)resetOnFailure();},{once:true});
      loadingTimer=setTimeout(()=>{if(generation===attempt&&!next.loaded)resetOnFailure();},30000);
      next.src=blobUrl;
    }catch{
      if(generation===attempt)resetOnFailure();
    }
  })();
  return requestPromise;
}
photoButton.addEventListener('click',()=>setMode('photo'));
modelButton.addEventListener('click',()=>{
  setMode('model');
  if(!viewer)void prepareHero();
});
$('lang').addEventListener('click',()=>setTimeout(()=>{
  applyAlt();
  if(viewer&&viewer.loaded)message(desired==='model'?'interactive':posterReady?'ready':'fallback');
  else if(state!=='loading')message(state);
},0));
window.addEventListener('pagehide',()=>{
  generation++;
  if(loadingTimer!==null)clearTimeout(loadingTimer);
  viewer?.remove();
  if(blobUrl)URL.revokeObjectURL(blobUrl);
  viewer=null;blobUrl=null;
});
applyAlt();
void prepareHero();
