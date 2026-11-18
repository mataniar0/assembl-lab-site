/* APP MVP-24 — Geometric intro: original product photograph + real Geometric V1.1
 * frame-only design GLB from the site. It does NOT contain a tabletop or
 * represent the physical, production-approved finished Geometric table.
 * No AI image, substitutions, CDN, client files or remote provider requests.
 *
 * IDs are retained to avoid breaking the existing intro/PWA integrations.
 */
const $=id=>document.getElementById(id);
const photo=$('personal-coffee-photo');
const image=photo.querySelector('img');
const host=$('personal-coffee-model');
const photoButton=$('personal-coffee-show-photo');
const modelButton=$('personal-coffee-show-model');
const status=$('personal-coffee-model-status');
const he=()=>document.documentElement.lang!=='en';
const viewerLibrary=new URL('../assets/vendor/model-viewer-4.1.0/model-viewer.min.js',import.meta.url).href;
const sourceGlb=new URL('../geometric/media/geometric-v11-design-only.glb',import.meta.url).href;
const captions={
  photo:['תמונת המוצר המלא. מודל התלת־ממד מציג שלדה בלבד, ללא פלטה.',
    'Complete product photograph. The 3D design is frame-only, without a tabletop.'],
  loading:['טוען את קובץ התכנון המקורי של Geometric V1.1 (שלדה בלבד)…',
    'Loading original Geometric V1.1 frame-only design GLB…'],
  ready:['מודל Geometric V1.1: שלדה בת 15 חלקים, ללא פלטה; אין אישור התאמה או ייצור.',
    'Geometric V1.1: 15-part frame, no tabletop; not fit- or manufacturing-verified.'],
  unavailable:['לא ניתן להציג תלת־ממד במכשיר זה. תמונת Geometric נשארת זמינה.',
    '3D is unavailable on this device; Geometric product image is still available.'],
  error:['מודל השלדה לא נטען. תמונת Geometric נשארת זמינה.',
    'The frame-only design could not load. Geometric product image is still available.']
};
let viewer=null,importPromise=null,token=0,timer=null,state='photo',mode='photo';

function tell(key){state=key;status.textContent=captions[key][he()?0:1];}
function updateAlt(){
  image.alt=he()?image.dataset.heAlt:image.dataset.enAlt;
  if(viewer)viewer.alt=he()?'מודל תכנון של שלדת Geometric V1.1 בת 15 חלקים, ללא פלטה':
    'Geometric V1.1 frame-only 15-part design preview without tabletop';
}
function supportsWebGL(){
  try{
    const canvas=document.createElement('canvas');
    const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
    if(!gl)return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  }catch{return false;}
}
function clear(){
  if(timer!==null){clearTimeout(timer);timer=null;}
  viewer?.remove();viewer=null;host.replaceChildren();host.hidden=true;
}
function showPhoto(message='photo'){
  token++;
  mode='photo';
  photo.hidden=false;
  host.hidden=true;
  photoButton.setAttribute('aria-pressed','true');
  modelButton.setAttribute('aria-pressed','false');
  modelButton.disabled=false;
  tell(message);
}
async function showModel(){
  if(mode==='model'&&viewer?.loaded)return;
  if(viewer?.loaded){
    mode='model';
    host.hidden=false;host.dataset.state='interactive';photo.hidden=true;
    photoButton.setAttribute('aria-pressed','false');
    modelButton.setAttribute('aria-pressed','true');
    tell('ready');return;
  }
  if(mode==='loading')return;
  if(!supportsWebGL()){showPhoto('unavailable');return;}
  const request=++token;
  mode='loading';tell('loading');modelButton.disabled=true;
  try{
    importPromise ||= import(viewerLibrary).catch(error=>{importPromise=null;throw error;});
    await importPromise;
    if(token!==request)return;
    if(!customElements.get('model-viewer'))throw new Error('VIEWER_UNAVAILABLE');
    const next=document.createElement('model-viewer');
    next.setAttribute('camera-controls','');
    next.setAttribute('touch-action','pan-y');
    next.setAttribute('interaction-prompt','none');
    next.setAttribute('loading','eager');
    next.setAttribute('camera-orbit','45deg 70deg auto');
    next.setAttribute('field-of-view','35deg');
    next.setAttribute('min-field-of-view','20deg');
    next.setAttribute('max-field-of-view','65deg');
    next.setAttribute('environment-image','neutral');
    next.setAttribute('shadow-intensity','1');
    next.setAttribute('shadow-softness','0.8');
    next.tabIndex=0;
    viewer=next;updateAlt();
    next.addEventListener('load',()=>{
      if(request!==token)return;
      if(timer!==null){clearTimeout(timer);timer=null;}
      mode='model';modelButton.disabled=false;
      host.dataset.state='interactive';host.hidden=false;photo.hidden=true;
      photoButton.setAttribute('aria-pressed','false');
      modelButton.setAttribute('aria-pressed','true');
      tell('ready');
    },{once:true});
    next.addEventListener('error',()=>{
      if(request!==token)return;
      clear();showPhoto('error');
    },{once:true});
    host.replaceChildren(next);
    host.hidden=false;host.dataset.state='loading';
    timer=setTimeout(()=>{
      if(request!==token||next.loaded)return;
      clear();showPhoto('error');
    },30000);
    next.src=sourceGlb;
  }catch{
    if(token===request){clear();showPhoto('error');}
  }finally{
    if(token===request&&mode!=='model')modelButton.disabled=false;
  }
}
photoButton.addEventListener('click',()=>showPhoto());
modelButton.addEventListener('click',()=>void showModel());
$('lang').addEventListener('click',()=>setTimeout(()=>{updateAlt();tell(state);},0));
window.addEventListener('pagehide',()=>{token++;clear();});
updateAlt();tell('photo');
