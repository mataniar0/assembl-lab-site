/* MVP-18: The existing, photographed ASSEMBL LAB Personal Coffee Table.
 * Both the image and the GLB are the exact assets on /table/personal/.
 * The GLB is an unverified digital design preview, not an accurate replica.
 * No remote providers, generated replacement geometry or customer content.
 */
const $=id=>document.getElementById(id);
const host=$('personal-coffee-model');
const photo=$('personal-coffee-photo');
const photoButton=$('personal-coffee-show-photo');
const modelButton=$('personal-coffee-show-model');
const status=$('personal-coffee-model-status');
const image=photo.querySelector('img');
const viewerLibrary=new URL('../assets/vendor/model-viewer-4.1.0/model-viewer.min.js',import.meta.url).href;
const actualModel=new URL('../table/personal/media/personal-design-preview.glb',import.meta.url).href;
const wording={
  loading:['טוען את מודל התכנון התלת־ממדי של שולחן הקפה האישי…','Loading the existing Personal Coffee Table 3D design preview…'],
  ready:['מודל התכנון מוכן. גררו לסיבוב, צבטו לזום. אינו העתק מאומת של המוצר המצולם.','Design model ready. Drag to rotate or pinch to zoom. Not a verified replica of the photographed product.'],
  unsupported:['במכשיר זה לא ניתן להציג מודל תלת־ממדי. צילום השולחן האמיתי ממשיך להיות זמין.','3D is unavailable on this device. The authentic product photograph is still available.'],
  error:['מודל התכנון לא נטען. צילום השולחן האמיתי ממשיך להיות זמין.','The design model did not load. The authentic photograph remains available.']
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
    'Unverified 3D design preview of Personal Coffee Table, not a replica of the real product':
    'מודל תכנון תלת־ממדי לא מאומת של שולחן קפה אישי, אינו העתק של המוצר האמיתי';
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
    next.setAttribute('camera-orbit','35deg 65deg auto');
    next.setAttribute('field-of-view','45deg');
    next.setAttribute('min-field-of-view','20deg');
    next.setAttribute('max-field-of-view','60deg');
    next.setAttribute('shadow-intensity','1');
    next.setAttribute('shadow-softness','.8');
    next.setAttribute('environment-image','neutral');
    next.setAttribute('exposure','1.15');
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
