/* ASSEMBL LAB — MVP-08 / experimental Supabase REST client.
 * No third-party JS, no service key, no image upload, no persistent JWT storage.
 * All projects and generated jobs are explicitly SYNTHETIC_ONLY.
 */
export const CONFIG=Object.freeze({
  endpoint:'https://widfojfysblgbwswmigq.supabase.co',
  publishableKey:'sb_publishable_yR2p4dOdSFam9uA1OyWsaQ_ZcjqpefW',
  scope:'DEVELOPMENT_SYNTHETIC_ONLY'
});
export const HANDOFF_KEY='assembl-lab-cloud-synthetic-intent-v1';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const finishes=['natural','honey','walnut'];
const sections=['shelf','closed'];

export class CloudApiError extends Error {
  constructor(status,code){super(code);this.status=status;this.code=code;}
}
function validId(id){return typeof id==='string'&&uuid.test(id);}
function numberIn(x,min,max){return typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;}
function assertSession(session){
  if(!session||!validId(session.user?.id)||typeof session.access_token!=='string'||session.access_token.length<64)
    throw new CloudApiError(401,'SESSION_REQUIRED');
  if(Number.isFinite(session.expires_at)&&session.expires_at*1000<Date.now()+20_000)
    throw new CloudApiError(401,'SESSION_EXPIRED_SIGN_IN_AGAIN');
}
function jsonHeaders(key,token=null){
  return {'apikey':key,'content-type':'application/json',...(token?{'authorization':'Bearer '+token}:{})};
}
async function decode(response){
  const data=await response.json().catch(()=>null);
  if(!response.ok){
    const code=data?.code||data?.error_code||data?.error?.code||'REQUEST_FAILED';
    throw new CloudApiError(response.status,typeof code==='string'?code:'REQUEST_FAILED');
  }
  return data;
}

/* Only a non-photo, non-free-text projection may be sent to the synthetic backend.
 * In particular all user notes, photo URLs, device image bytes and extensions are discarded.
 */
export function canonicalSyntheticIntent(src){
  const d=src?.requested_dimensions_mm||{};
  const a=src?.appearance||{};
  const c=src?.construction_preferences||{};
  const p=src?.placement_preview||{};
  if(src?.category!=='freestanding_nightstand'||!numberIn(d.width,200,900)||
     !numberIn(d.height,200,1000)||!numberIn(d.depth,250,600)||
     !finishes.includes(a.finish)||![1,2].includes(a.drawers)||
     !sections.includes(a.lower_section)||![4,6].includes(c.nominal_thickness_mm))
    throw new CloudApiError(422,'INVALID_SYNTHETIC_NIGHTSTAND');
  const confidence=['measured','estimated','unknown'].includes(src.dimension_confidence)?
    src.dimension_confidence:'unknown';
  return {
    schema_version:'ASSEMBL-LAB.DESIGN-INTENT.0.1',
    category:'freestanding_nightstand',
    requested_dimensions_mm:{width:d.width,height:d.height,depth:d.depth},
    dimension_confidence:confidence,
    appearance:{finish:a.finish,drawers:a.drawers,lower_section:a.lower_section,notes:''},
    placement_preview:{
      relative_scale:numberIn(p.relative_scale,65,125)?p.relative_scale:88,
      horizontal_position_percent:numberIn(p.horizontal_position_percent,30,70)?p.horizontal_position_percent:52
    },
    construction_preferences:{material:'birch_plywood',nominal_thickness_mm:c.nominal_thickness_mm,
      construction_verified:false},
    lifecycle_status:'VISUAL_CONCEPT_ONLY',
    engineering_approval:false,
    manufacturing_approval:false,
    photo_included:false
  };
}
export function syntheticFixture(){
  return canonicalSyntheticIntent({
    category:'freestanding_nightstand',
    requested_dimensions_mm:{width:500,height:550,depth:350},
    dimension_confidence:'estimated',
    appearance:{finish:'natural',drawers:1,lower_section:'shelf'},
    placement_preview:{relative_scale:88,horizontal_position_percent:52},
    construction_preferences:{nominal_thickness_mm:6}
  });
}

/* In-memory Auth only: closing/reloading the page signs the prototype out.
 * Supabase retains the identity on its server, but no tokens are persisted by the page.
 */
export function createCloudClient({fetchImpl=fetch,endpoint=CONFIG.endpoint,publishableKey=CONFIG.publishableKey}={}){
  if(endpoint!==CONFIG.endpoint||publishableKey!==CONFIG.publishableKey)
    throw new Error('Unapproved Supabase development project');
  const request=async(path,{method='GET',body,token=null,prefer}={})=>{
    const headers=jsonHeaders(publishableKey,token);
    if(prefer)headers.prefer=prefer;
    return decode(await fetchImpl(endpoint+path,{method,headers,
      body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',credentials:'omit'}));
  };
  const ensure=s=>{assertSession(s);return s.user.id;};
  return {
    async signIn(email,password){
      const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
      const session={user:{id:data?.user?.id},access_token:data?.access_token,
        expires_at:Number.isFinite(data?.expires_at)?data.expires_at:Math.floor(Date.now()/1000)+(data?.expires_in||0)};
      assertSession(session);
      return session;
    },
    async signOut(session){
      if(session?.access_token){
        try{await request('/auth/v1/logout',{method:'POST',token:session.access_token});}
        catch{/* Always clear local ephemeral session; do not disclose remote failure. */}
      }
    },
    async listProjects(session){
      ensure(session);
      const rows=await request('/rest/v1/al_app_projects?select=id,created_at&order=created_at.desc&limit=3',{token:session.access_token});
      if(!Array.isArray(rows))throw new CloudApiError(500,'UNEXPECTED_LIST');
      return rows;
    },
    async createProject(session,intent){
      const userId=ensure(session);
      const source=canonicalSyntheticIntent(intent);
      const rows=await request('/rest/v1/al_app_projects?select=id,created_at',{method:'POST',
        token:session.access_token,prefer:'return=representation',
        body:{owner_id:userId,source_kind:'synthetic',design_intent:source}});
      if(!Array.isArray(rows)||!validId(rows[0]?.id))throw new CloudApiError(500,'UNEXPECTED_PROJECT_RESPONSE');
      return rows[0];
    },
    async createJob(session,projectId,requestKey){
      const userId=ensure(session);
      if(!validId(projectId)||typeof requestKey!=='string'||!/^[A-Za-z0-9_-]{16,96}$/.test(requestKey))
        throw new CloudApiError(400,'INVALID_PROJECT_OR_REQUEST');
      const rows=await request('/rest/v1/al_app_visualization_jobs?select=id,project_id,status,provider,created_at',{method:'POST',
        token:session.access_token,prefer:'return=representation',
        body:{owner_id:userId,project_id:projectId,idempotency_key:requestKey,
          status:'MOCK_READY',provider:'none',source_kind:'synthetic'}});
      if(!Array.isArray(rows)||rows[0]?.status!=='MOCK_READY'||rows[0]?.provider!=='none')
        throw new CloudApiError(500,'UNEXPECTED_JOB_RESPONSE');
      return rows[0];
    },
    async deleteProject(session,projectId){
      const userId=ensure(session);
      if(!validId(projectId))throw new CloudApiError(400,'INVALID_PROJECT_ID');
      const rows=await request('/rest/v1/al_app_projects?id=eq.'+projectId+'&owner_id=eq.'+userId+'&select=id',{method:'DELETE',
        token:session.access_token,prefer:'return=representation'});
      if(!Array.isArray(rows)||rows[0]?.id!==projectId)throw new CloudApiError(404,'PROJECT_NOT_FOUND');
      return true;
    }
  };
}
