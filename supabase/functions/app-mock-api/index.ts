/* ASSEMBL LAB — Supabase synthetic-only Edge Function.
 * No AI provider, no photos, no secrets in client code.
 * Requires platform JWT verification AND withSupabase auth:'user'.
 * This is development scaffolding; not connected to PWA.
 */
import { withSupabase } from 'npm:@supabase/server@1';
import { parseAction, InvalidMockRequest } from './synthetic-logic.mjs';

const errorResponse=(status,code)=>Response.json({error:{code}},{status,headers:{
  'cache-control':'no-store',
  'x-content-type-options':'nosniff'
}});
const ok=(status,payload)=>Response.json(payload,{status,headers:{'cache-control':'no-store'}});
const uuidRE=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
  fetch: withSupabase({auth:'user'},async(req,ctx)=>{
    if(req.method!=='POST')return errorResponse(405,'POST_ONLY');
    // User identity is derived from the verified JWT, NEVER an owner_id supplied by the client.
    const owner=ctx.userClaims?.id;
    if(typeof owner!=='string'||!uuidRE.test(owner))return errorResponse(401,'USER_REQUIRED');
    const length=Number(req.headers.get('content-length')||'0');
    if(!Number.isFinite(length)||length>12000)return errorResponse(413,'BODY_TOO_LARGE');
    if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
      return errorResponse(415,'JSON_REQUIRED');
    try{
      const raw=await req.text();
      if(raw.length>12000)return errorResponse(413,'BODY_TOO_LARGE');
      const action=parseAction(JSON.parse(raw));
      // Using the JWT-scoped client prevents cross-owner data access.
      // Never replace this client with supabaseAdmin for user actions.
      const client=ctx.supabase;

      if(action.action==='create_project'){
        const {data,error}=await client.from('al_app_projects')
          .insert({owner_id:owner,source_kind:'synthetic',design_intent:action.design_intent})
          .select('id,created_at').single();
        if(error){
          if(error.code==='23514')return errorResponse(429,'PROJECT_LIMIT_OR_INVALID');
          return errorResponse(422,'PROJECT_CREATION_REJECTED');
        }
        return ok(201,{project_id:data.id,created_at:data.created_at,mode:'SYNTHETIC_ONLY'});
      }

      if(action.action==='create_job'){
        const {data:project,error:projectError}=await client.from('al_app_projects')
          .select('id').eq('id',action.project_id).eq('owner_id',owner).maybeSingle();
        if(projectError||!project)return errorResponse(404,'PROJECT_NOT_FOUND');

        const {data,error}=await client.from('al_app_visualization_jobs').insert({
          owner_id:owner,
          project_id:action.project_id,
          idempotency_key:action.idempotency_key,
          source_kind:'synthetic',
          provider:'none',
          status:'MOCK_READY'
        }).select('id,project_id,status,provider,created_at').single();

        if(error){
          if(error.code==='23505'){
            // Do not cross idempotency keys across users or projects.
            const {data:old}=await client.from('al_app_visualization_jobs')
              .select('id,project_id,status,provider,created_at')
              .eq('owner_id',owner).eq('idempotency_key',action.idempotency_key).maybeSingle();
            if(old?.project_id===action.project_id)
              return ok(200,{...old,replayed:true,output_image_url:null});
            return errorResponse(409,'IDEMPOTENCY_CONFLICT');
          }
          if(error.code==='23514')return errorResponse(429,'JOB_LIMIT_OR_INVALID');
          return errorResponse(422,'JOB_CREATION_REJECTED');
        }
        return ok(201,{...data,replayed:false,output_image_url:null});
      }

      if(action.action==='get_job'){
        const {data,error}=await client.from('al_app_visualization_jobs')
          .select('id,project_id,status,provider,created_at')
          .eq('owner_id',owner).eq('id',action.job_id).maybeSingle();
        if(error||!data)return errorResponse(404,'JOB_NOT_FOUND');
        return ok(200,{...data,output_image_url:null});
      }

      if(action.action==='delete_project'){
        // Deletes only a synthetic project; DB ON DELETE CASCADE removes mock jobs.
        const {data,error}=await client.from('al_app_projects').delete()
          .eq('owner_id',owner).eq('id',action.project_id).select('id').maybeSingle();
        if(error||!data)return errorResponse(404,'PROJECT_NOT_FOUND');
        return ok(200,{deleted:true,project_id:data.id});
      }
      return errorResponse(400,'UNKNOWN_ACTION');
    }catch(error){
      if(error instanceof InvalidMockRequest)return errorResponse(422,error.code);
      if(error instanceof SyntaxError)return errorResponse(400,'MALFORMED_JSON');
      // Never log request bodies, tokens, image data or design notes.
      return errorResponse(500,'INTERNAL_ERROR');
    }
  })
};
