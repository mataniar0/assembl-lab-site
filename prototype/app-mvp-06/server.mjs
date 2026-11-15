/* MVP-06 — loopback-only development API. Synthetic fixtures ONLY.
 * Never deploy this server to a public host as-is.
 * Node.js >= 20, no dependencies.
 */
import {createServer} from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {MockVisualizationStore,ApiError} from './mock-store.mjs';

const JSON_BYTES_MAX=32*1024;
const OWNER_PATTERN=/^[a-zA-Z0-9_-]{12,64}$/;
const IDEMPOTENCY_PATTERN=/^[a-zA-Z0-9_-]{16,96}$/;
const ID_PATTERN=/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i;

function equalSecret(actual,expected){
  if(typeof actual!=='string'||!actual.startsWith('Bearer '))return false;
  const supplied=Buffer.from(actual.slice(7),'utf8');
  const want=Buffer.from(expected,'utf8');
  return supplied.length===want.length&&timingSafeEqual(supplied,want);
}
function reply(res,status,payload){
  const data=JSON.stringify(payload);
  res.writeHead(status,{'content-type':'application/json; charset=utf-8',
    'content-length':Buffer.byteLength(data),'cache-control':'no-store',
    'x-content-type-options':'nosniff','referrer-policy':'no-referrer',
    'x-frame-options':'DENY','content-security-policy':"default-src 'none'"});
  res.end(data);
}
async function readBody(req){
  const length=Number(req.headers['content-length']);
  if(Number.isFinite(length)&&length>JSON_BYTES_MAX)
    throw new ApiError(413,'BODY_TOO_LARGE');
  const type=(req.headers['content-type']||'').toLowerCase();
  if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/.test(type))
    throw new ApiError(415,'JSON_REQUIRED');
  let bytes=0;
  const parts=[];
  for await(const part of req){
    bytes+=part.length;
    if(bytes>JSON_BYTES_MAX)throw new ApiError(413,'BODY_TOO_LARGE');
    parts.push(part);
  }
  let body;
  try{body=JSON.parse(Buffer.concat(parts).toString('utf8'));}
  catch{throw new ApiError(400,'MALFORMED_JSON');}
  return body;
}
export function createMockBackend({token,store=new MockVisualizationStore()}={}){
  if(typeof token!=='string'||token.length<24)throw new Error('Set a strong local development token (24+ characters).');
  return createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://127.0.0.1');
      if(req.method==='GET'&&url.pathname==='/health'){
        reply(res,200,{ok:true,service:'assembl-lab-synthetic-backend',mode:'SYNTHETIC_ONLY'});
        return;
      }
      if(!equalSecret(req.headers.authorization,token))
        throw new ApiError(401,'UNAUTHORIZED');
      const owner=req.headers['x-dev-session'];
      if(typeof owner!=='string'||!OWNER_PATTERN.test(owner))
        throw new ApiError(400,'DEV_SESSION_REQUIRED');
      if(req.method==='POST'&&url.pathname==='/api/v1/visualizations'){
        const key=req.headers['idempotency-key'];
        if(typeof key!=='string'||!IDEMPOTENCY_PATTERN.test(key))
          throw new ApiError(400,'IDEMPOTENCY_KEY_REQUIRED');
        const body=await readBody(req);
        const result=store.create({owner,idempotencyKey:key,body});
        reply(res,result.replayed?200:201,result.job);
        return;
      }
      const match=url.pathname.match(/^\/api\/v1\/visualizations\/([^/]+)$/);
      if(match&&ID_PATTERN.test(match[1])){
        const id=match[1];
        if(req.method==='GET'){reply(res,200,store.get({owner,id}));return;}
        if(req.method==='DELETE'){reply(res,200,store.delete({owner,id}));return;}
      }
      throw new ApiError(404,'ROUTE_NOT_FOUND');
    }catch(error){
      const status=error instanceof ApiError?error.status:500;
      const code=error instanceof ApiError?error.code:'INTERNAL_ERROR';
      // Never log image data, request body, authorization, or design notes.
      reply(res,status,{error:{code}});
    }
  });
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const host='127.0.0.1';
  const port=Number(process.env.ASSEMBL_LAB_DEV_PORT||8787);
  if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Port must be 1024–65535');
  const backend=createMockBackend({token:process.env.ASSEMBL_LAB_LOCAL_DEV_TOKEN});
  backend.listen(port,host,()=>console.log('Synthetic API listening on '+host+':'+port+' (no AI; no photo uploads)'));
}
