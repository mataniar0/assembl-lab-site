import {after,before,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMockBackend} from './server.mjs';

const intent=JSON.parse(readFileSync(new URL('../app-mvp-03/synthetic-intent.json',import.meta.url),'utf8'));
const token='DEVELOPMENT_ONLY_TOKEN_1234567890';
const ownerA='synthetic_owner_001';
const ownerB='synthetic_owner_002';
let backend;
let base;
let sequence=0;
const sample=()=>({source_kind:'synthetic',design_intent:intent});
function nextKey(){return 'synthetic_request_'+String(++sequence).padStart(6,'0');}
function reqHeaders(owner=ownerA,key=nextKey()){
  return {'authorization':'Bearer '+token,'x-dev-session':owner,
    'idempotency-key':key,'content-type':'application/json'};
}
async function call(path,method='GET',body,headers={}){
  const res=await fetch(base+path,{method,headers,body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)});
  const data=await res.json();
  return {status:res.status,data,headers:res.headers};
}
before(async()=>{
  backend=createMockBackend({token});
  await new Promise(resolve=>backend.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+backend.address().port;
});
after(async()=>{if(backend)await new Promise((resolve,reject)=>backend.close(err=>err?reject(err):resolve()));});

test('health endpoint is synthetic only',async()=>{
  const x=await call('/health');
  assert.equal(x.status,200);
  assert.equal(x.data.mode,'SYNTHETIC_ONLY');
  assert.equal(x.headers.get('cache-control'),'no-store');
});
test('API rejects requests without authentication',async()=>{
  const x=await call('/api/v1/visualizations','POST',sample(),{'content-type':'application/json','x-dev-session':ownerA,'idempotency-key':nextKey()});
  assert.equal(x.status,401);
});
test('rejects short/missing dev session',async()=>{
  const x=await call('/api/v1/visualizations','POST',sample(),{'authorization':'Bearer '+token,'idempotency-key':nextKey(),'content-type':'application/json'});
  assert.equal(x.data.error.code,'DEV_SESSION_REQUIRED');
});
test('rejects invalid idempotency key',async()=>{
  const x=await call('/api/v1/visualizations','POST',sample(),{...reqHeaders(), 'idempotency-key':'bad'});
  assert.equal(x.status,400);
});
test('rejects missing JSON content type',async()=>{
  const h=reqHeaders();delete h['content-type'];
  const x=await call('/api/v1/visualizations','POST',JSON.stringify(sample()),h);
  assert.equal(x.status,415);
});
test('rejects malformed JSON',async()=>{
  const x=await call('/api/v1/visualizations','POST','{"oops":',reqHeaders());
  assert.equal(x.status,400);
});
test('rejects oversized JSON',async()=>{
  const body=JSON.stringify({...sample(),padding:'x'.repeat(34000)});
  const x=await call('/api/v1/visualizations','POST',body,reqHeaders());
  assert.equal(x.status,413);
});
test('rejects real photographs even with consent flag',async()=>{
  const x=await call('/api/v1/visualizations','POST',{...sample(),source_kind:'user-consented',explicit_consent:true},reqHeaders());
  assert.equal(x.status,422);
  assert.equal(x.data.error.code,'SYNTHETIC_ONLY');
});
test('rejects image content',async()=>{
  const x=await call('/api/v1/visualizations','POST',{...sample(),image_base64:'TEST_NOT_A_REAL_PHOTO'},reqHeaders());
  assert.equal(x.status,422);
  assert.equal(x.data.error.code,'IMAGE_DATA_REJECTED');
});
test('rejects invalid nightstand parameters',async()=>{
  const x=await call('/api/v1/visualizations','POST',
    {source_kind:'synthetic',design_intent:{...intent,requested_dimensions_mm:{width:9999,height:550,depth:350}}},reqHeaders());
  assert.equal(x.status,422);
  assert.equal(x.data.error.code,'INVALID_DESIGN_INTENT');
});
test('creates only a mock job with no output photo or CAD',async()=>{
  const x=await call('/api/v1/visualizations','POST',sample(),reqHeaders());
  assert.equal(x.status,201);
  assert.equal(x.data.status,'MOCK_READY');
  assert.equal(x.data.output_image_url,null);
  assert.equal(x.data.manufacturing_approval,false);
  assert.equal(x.data.engineering_approval,false);
  assert.equal(x.data.provider,'none');
  assert.equal(x.data.owner,undefined);
  globalThis.demoJobId=x.data.id;
});
test('idempotency replay returns same job; changed payload conflicts',async()=>{
  const key=nextKey(),headers=reqHeaders(ownerA,key);
  const first=await call('/api/v1/visualizations','POST',sample(),headers);
  const repeated=await call('/api/v1/visualizations','POST',sample(),headers);
  assert.equal(first.status,201);
  assert.equal(repeated.status,200);
  assert.equal(first.data.id,repeated.data.id);
  const changed={source_kind:'synthetic',design_intent:{...intent,appearance:{...intent.appearance,drawers:2}}};
  const conflict=await call('/api/v1/visualizations','POST',changed,headers);
  assert.equal(conflict.status,409);
});
test('owner-isolated read',async()=>{
  const path='/api/v1/visualizations/'+globalThis.demoJobId;
  const mine=await call(path,'GET',undefined,reqHeaders(ownerA));
  const other=await call(path,'GET',undefined,reqHeaders(ownerB));
  assert.equal(mine.status,200);
  assert.equal(other.status,404);
});
test('owner can delete a job, which is then inaccessible',async()=>{
  const path='/api/v1/visualizations/'+globalThis.demoJobId;
  const del=await call(path,'DELETE',undefined,reqHeaders(ownerA));
  const get=await call(path,'GET',undefined,reqHeaders(ownerA));
  assert.equal(del.status,200);
  assert.equal(del.data.deleted,true);
  assert.equal(get.status,404);
});
test('finite job quota returns 429 without billing or AI',async()=>{
  const limitedOwner='quota_owner_00001';
  let statuses=[];
  for(let i=0;i<6;i++){
    const x=await call('/api/v1/visualizations','POST',sample(),reqHeaders(limitedOwner,nextKey()));
    statuses.push(x.status);
  }
  assert.deepEqual(statuses,[201,201,201,201,201,429]);
});
test('unrecognized route has no frontend/CORS access',async()=>{
  const x=await call('/api/v1/admin','GET',undefined,reqHeaders());
  assert.equal(x.status,404);
  assert.equal(x.headers.get('access-control-allow-origin'),null);
});
