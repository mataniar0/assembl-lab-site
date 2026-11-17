/* MVP-20: showroom poster is a pixel capture from THIS exact GLB.
 * Both are visual reconstructions of the real Personal Coffee Table, not
 * independently verified manufacturing CAD or authentic product photos.
 * Original real-world photographs remain on /table/personal/.
 */
const $=id=>document.getElementById(id);
const host=$('personal-coffee-model');
const photo=$('personal-coffee-photo');
const photoButton=$('personal-coffee-show-photo');
const modelButton=$('personal-coffee-show-model');
const status=$('personal-coffee-model-status');
const image=photo.querySelector('img');
const viewerLibrary=new URL('../assets/vendor/model-viewer-4.1.0/model-viewer.min.js',import.meta.url).href;
const actualModel=new URL('./assets/personal-coffee-showroom-v2.glb',import.meta.url).href;
const wording={
  loading:['טוען את אותו מודל תלת־ממדי ששימש לתמונת הראווה…','Loading the exact same 3D model as the showroom image…'],
  ready:['אותו שולחן כמו בתמונת הראווה. גררו לסיבוב וצבטו לזום. המודל להמחשה בלבד, לא מאומת לייצור.','The same table as the showroom image. Drag to rotate and pinch to zoom. Visual concept only; not manufacturing-verified.'],
  unsupported:['במכשיר זה לא ניתן להציג מודל תלת־ממדי. תמונת הראווה נשארת זמינה, וצילומי המוצר האמיתיים נמצאים בעמוד המוצר.','3D is unavailable on this device. The showcase image is still available; real product photos are on the product page.'],
  error:['מודל התכנון לא נטען. תמונת הראווה נשארת זמינה, וצילומי המוצר האמיתיים נמצאים בעמוד המוצר.','The design model did not load. The showcase image remains available.']
};
let viewer=null,viewerPromise=null,generation=0,showingModel=false,statusKey='',timeout=null;
const isEnglish=()=>document.documentElement.lang==='en';
function speak(key){
  statusKey=key;
  status.textContent=key?wording[key][isEnglish()?1:0]:'';
}
function updateAlt(){
  image.alt=isEnglish()?image.dataset.enAlt:image.dataset.heAlt;
  if(viewer)viewer.alt=isEnglish()?
    'Personal Coffee Table showroom 3D model matching the hero render; unverified for manufacturing':
    'מודל שולחן הקפה התואם לתמונת הראווה; אינו מאומת לייצור';
}
function webGLAvailable(){
  try{
    const context=document.createElement('canvas').getContext('webgl2')||
      document.createElement('canvas').getContext('webgl');
    if(!context)return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  }catch{return false;}
}
function clearViewer(){
  if(timeout!==null){clearTimeout(timeout);timeout=null;}
  viewer?.remove();
  viewer=null;host.replaceChildren();
  host.hidden=true;
}
function showPhoto(key=''){
  generation++;
  showingModel=false;
  clearViewer();
  photo.hidden=false;
  photoButton.setAttribute('aria-pressed','true');
  modelButton.setAttribute('aria-pressed','false');
  speak(key);
}
async function showModel(){
  const token=++generation;
  showingModel=false;clearViewer();
  speak('loading');
  if(!webGLAvailable()){showPhoto('unsupported');return;}
  modelButton.disabled=true;
  try{
    viewerPromise ||= import(viewerLibrary).catch(error=>{viewerPromise=null;throw error;});
    await viewerPromise;
    if(token!==generation)return;
    if(!customElements.get('model-viewer'))throw new Error('NO_MODEL_VIEWER');
    const next=document.createElement('model-viewer');
    next.setAttribute('camera-controls','');
    next.setAttribute('touch-action','pan-y');
    next.setAttribute('loading','eager');
    next.setAttribute('interaction-prompt','none');
    next.setAttribute('camera-orbit','28deg 65deg auto');
    next.setAttribute('field-of-view','34deg');
    next.setAttribute('min-field-of-view','20deg');
    next.setAttribute('max-field-of-view','60deg');
    next.setAttribute('shadow-intensity','1.4');
    next.setAttribute('shadow-softness','.8');
    next.setAttribute('environment-image','neutral');
    next.setAttribute('exposure','1.2');
    next.tabIndex=0;
    viewer=next;updateAlt();
    next.addEventListener('load',()=>{
      if(token!==generation)return;
      if(timeout!==null){clearTimeout(timeout);timeout=null;}
      showingModel=true;
      speak('ready');
    },{once:true});
    next.addEventListener('error',()=>{
      if(token===generation)showPhoto('error');
    },{once:true});
    host.replaceChildren(next);
    host.hidden=false;
    photo.hidden=true;
    modelButton.setAttribute('aria-pressed','true');
    photoButton.setAttribute('aria-pressed','false');
    timeout=window.setTimeout(()=>{
      if(token===generation&&!showingModel)showPhoto('error');
    },30000);
    next.src=actualModel;
  }catch{
    if(token===generation)showPhoto('error');
  }finally{
    modelButton.disabled=false;
  }
}
photoButton.addEventListener('click',()=>showPhoto());
modelButton.addEventListener('click',()=>{if(!showingModel)void showModel();});
$('lang').addEventListener('click',()=>{
  // The main app's language handler may run after this module's listener.
  // Update UI after ALL handlers so status/alt follow the final document lang.
  window.setTimeout(()=>{
    updateAlt();
    speak(statusKey);
  },0);
});
window.addEventListener('pagehide',()=>showPhoto());
updateAlt();
