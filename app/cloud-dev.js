/* ASSEMBL LAB MVP-08 — development-only UI.
 * Does not handle or upload images. Memory-only Supabase user JWT.
 * Never include this page in a public rollout without Auth abuse/rate-limit review.
 */
import {createCloudClient,canonicalSyntheticIntent,syntheticFixture,HANDOFF_KEY,CloudApiError} from './cloud-api-core.mjs';

const el=id=>document.getElementById(id);
const cloud=createCloudClient();
let session=null;
let projectId=null;
let busy=false;
let candidate=syntheticFixture();
let candidateOrigin='בדיקת דוגמה סינתטית';

function setStatus(id,message){el(id).textContent=message;}
function errorMessage(error){
  if(error instanceof CloudApiError){
    if(error.status===401)return 'ההתחברות אינה תקפה או פג תוקפה. יש להתחבר מחדש.';
    if(error.status===429)return 'הגעת למכסת הניסוי. אפשר למחוק פרויקט קודם.';
    if(error.code==='PROJECT_NOT_FOUND')return 'הפרויקט לא נמצא או אינו שייך לחשבון המחובר.';
    if(error.status===400||error.status===422)return 'נתוני הבקשה לא התקבלו. בדקו את טופס הניסוי.';
    if(error.status===409)return 'הבקשה כבר נוצלה לפרויקט אחר.';
  }
  return 'הפעולה לא הושלמה. בדוק את החיבור ונסה שוב.';
}
function render(){
  const loggedIn=!!session&&!busy;
  el('sign-in').disabled=busy;
  el('sign-up').disabled=busy;
  el('sign-out').hidden=!session;
  el('sign-out').disabled=busy;
  el('save-synthetic').disabled=!loggedIn;
  el('jobs-panel').hidden=!session||!projectId;
  el('create-job').disabled=!loggedIn||!projectId;
  el('delete-project').disabled=!loggedIn||!projectId;
  el('project-id').textContent=projectId||'—';
  if(!session) {
    el('job-id').textContent='—';
    el('job-status').textContent='—';
  }
}
function describe(){
  const d=candidate.requested_dimensions_mm;
  const a=candidate.appearance;
  const colors={natural:'בירץ׳ טבעי',honey:'גוון דבש',walnut:'גוון אגוז'};
  setStatus('design-summary',[
    candidateOrigin,
    'רוחב '+d.width/10+' ס״מ · גובה '+d.height/10+' ס״מ · עומק '+d.depth/10+' ס״מ',
    'חומר: לביד בירץ׳ '+candidate.construction_preferences.nominal_thickness_mm+' מ״מ',
    'גוון: '+(colors[a.finish]||a.finish)+' · מגירות: '+a.drawers,
    'ללא צילום וללא הערות אישיות'
  ].join('\n'));
}
async function withBusy(action,outputId){
  if(busy)return;
  busy=true;render();
  try{await action();}
  catch(error){setStatus(outputId,errorMessage(error));}
  finally{busy=false;render();}
}
function fromHandoff(){
  let raw=null;
  try{
    raw=sessionStorage.getItem(HANDOFF_KEY);
    sessionStorage.removeItem(HANDOFF_KEY);
  }catch{/* Safe fallback when browser storage is unavailable. */}
  if(!raw)return;
  try{
    const value=JSON.parse(raw);
    candidate=canonicalSyntheticIntent(value);
    candidateOrigin='מידות שידה מאושרות — נתונים מסוננים בלבד';
  }catch{
    candidate=syntheticFixture();
    candidateOrigin='בדיקת דוגמה סינתטית (נתוני המקור נדחו)';
  }
}
function credentials(){
  const email=el('dev-email').value.trim();
  const password=el('dev-password').value;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)
    throw new CloudApiError(400,'INVALID_EMAIL');
  if(password.length<8||password.length>128)throw new CloudApiError(400,'INVALID_PASSWORD');
  return {email,password};
}
async function signIn(){
  await withBusy(async()=>{
    const {email,password}=credentials();
    session=null;projectId=null; // Never retain a prior user's project on account change.
    session=await cloud.signIn(email,password);
    el('dev-password').value='';
    setStatus('auth-status','התחברת בהצלחה. הפרויקטים מבודדים באמצעות הרשאות המשתמש שלך.');
    const projects=await cloud.listProjects(session);
    projectId=projects[0]?.id||null;
    setStatus('save-status','מוכנים לשמור נתוני שידה סינתטיים. '+projects.length+' פרויקטים נמצאו בחשבון.');
    render();
  },'auth-status');
  el('dev-password').value='';
}
async function signUp(){
  await withBusy(async()=>{
    const {email,password}=credentials();
    const result=await cloud.register(email,password);
    setStatus('auth-status',result.confirmation_required?
      'בקשת ההרשמה התקבלה. בדוק את הדוא״ל לאישור החשבון, ואז התחבר כאן.':
      'בקשת ההרשמה התקבלה. אפשר לנסות להתחבר.');
  },'auth-status');
  el('dev-password').value='';
}
async function signOut(){
  await withBusy(async()=>{
    await cloud.signOut(session);
    session=null;projectId=null;
    setStatus('auth-status','התנתקת. האסימון נמחק מזיכרון הדף.');
    setStatus('save-status','יש להתחבר כדי לשמור נתונים.');
    setStatus('job-message','');
    render();
  },'auth-status');
}
async function save(){
  await withBusy(async()=>{
    if(!session)throw new CloudApiError(401,'SESSION_REQUIRED');
    // Only whitelisted, note-free, no-photo design parameters leave this page.
    const project=await cloud.createProject(session,candidate);
    projectId=project.id;
    el('job-id').textContent='—';el('job-status').textContent='—';
    setStatus('save-status','הפרויקט הסינתטי נשמר. מזהה הפרויקט מוצג למטה.');
    setStatus('job-message','אפשר ליצור כעת משימת הדמיה מדומה.');
    render();
  },'save-status');
}
async function createJob(){
  await withBusy(async()=>{
    if(!session||!projectId)throw new CloudApiError(401,'SESSION_REQUIRED');
    const key='job_'+crypto.randomUUID().replaceAll('-','');
    const job=await cloud.createJob(session,projectId,key);
    el('job-id').textContent=job.id;
    el('job-status').textContent=job.status;
    setStatus('job-message','השרת יצר משימה מדומה. לא בוצעה יצירת תמונת AI.');
  },'job-message');
}
async function deleteProject(){
  if(!projectId||!session||busy)return;
  if(!window.confirm('למחוק את פרויקט הניסוי ואת המשימות המדומות המשויכות אליו?'))return;
  await withBusy(async()=>{
    await cloud.deleteProject(session,projectId);
    projectId=null;
    setStatus('save-status','פרויקט הניסוי נמחק. ניתן ליצור פרויקט חדש.');
    setStatus('job-message','');
    el('job-id').textContent='—';
    el('job-status').textContent='—';
    render();
  },'job-message');
}
function init(){
  fromHandoff();describe();render();
  el('auth-form').addEventListener('submit',event=>{event.preventDefault();void signIn();});
  el('sign-up').addEventListener('click',()=>void signUp());
  el('sign-out').addEventListener('click',()=>void signOut());
  el('save-synthetic').addEventListener('click',()=>void save());
  el('create-job').addEventListener('click',()=>void createJob());
  el('delete-project').addEventListener('click',()=>void deleteProject());
  // Reload/close clears access by design; no credentials in localStorage, URL or service worker.
}
init();
