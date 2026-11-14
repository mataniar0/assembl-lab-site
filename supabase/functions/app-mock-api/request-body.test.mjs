import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseBoundedJson} from './request-body.mjs';

function req(body,headers={'content-type':'application/json'}){
  return new Request('https://example.invalid/app-mock-api',{method:'POST',headers,body});
}
function chunks(chunksList){
  return new Request('https://example.invalid/app-mock-api',{method:'POST',headers:{'content-type':'application/json'},
    duplex:'half',
    body:new ReadableStream({
      start(controller){
        for(const chunk of chunksList)controller.enqueue(chunk);
        controller.close();
      }
    })
  });
}
const b=(x)=>new TextEncoder().encode(x);
async function rejectsCode(request,expectedCode,options) {
  await assert.rejects(()=>parseBoundedJson(request,options),error=>error.code===expectedCode);
}

test('accepts normal JSON',async()=>{assert.deepEqual(await parseBoundedJson(req('{"action":"get_job","job_id":"abc"}')),{action:'get_job',job_id:'abc'});});
test('handles UTF-8 Hebrew notes',async()=>{assert.deepEqual(await parseBoundedJson(req(JSON.stringify({note:'שידת לילה'}))),{note:'שידת לילה'});});
test('handles multipart stream as one JSON value',async()=>{assert.deepEqual(await parseBoundedJson(chunks([b('{"x":'),b('42}')])) ,{x:42});});
test('rejects absent content type',async()=>{await rejectsCode(req('{}',{}),'JSON_REQUIRED');});
test('rejects other content types',async()=>{await rejectsCode(req('{}',{'content-type':'text/plain'}),'JSON_REQUIRED');});
test('rejects oversized declared content-length',async()=>{await rejectsCode(req('{"a":1}',{'content-type':'application/json','content-length':'10001'}),'BODY_TOO_LARGE',{maxBytes:10000});});
test('rejects invalid declared content-length',async()=>{await rejectsCode(req('{}',{'content-type':'application/json','content-length':'NaN'}),'BAD_CONTENT_LENGTH');});
test('rejects byte-over-limit streamed body even without content-length',async()=>{await rejectsCode(chunks([b('{"a":"'),new Uint8Array(300),b('"}')]),'BODY_TOO_LARGE',{maxBytes:100});});
test('counts UTF-8 bytes, not JavaScript characters',async()=>{await rejectsCode(req(JSON.stringify({name:'א'.repeat(30)})),'BODY_TOO_LARGE',{maxBytes:50});});
test('rejects malformed JSON',async()=>{await rejectsCode(req('{"no":'),'MALFORMED_JSON');});
test('rejects invalid UTF-8',async()=>{await rejectsCode(req(new Uint8Array([0x7b,0x22,0xc3,0x28,0x22,0x7d])),'BAD_UTF8');});
test('rejects empty stream',async()=>{await rejectsCode(req(''),'MALFORMED_JSON');});
test('rejects absent body',async()=>{await rejectsCode(new Request('https://example.invalid',{method:'POST',headers:{'content-type':'application/json'}}),'BODY_REQUIRED');});
test('rejects invalid byte budget',async()=>{await assert.rejects(()=>parseBoundedJson(req('{}'),{maxBytes:0}),/Invalid byte limit/);});
