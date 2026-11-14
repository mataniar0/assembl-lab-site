/* Bounded JSON request decoding for MVP-06.
 * Reject large/chunked requests before buffering unbounded data.
 * This is not a substitute for gateway rate limiting.
 */
export class RequestBodyError extends Error {
  constructor(status, code) {super(code); this.status=status; this.code=code;}
}

export async function parseBoundedJson(req,{maxBytes=12000}={}) {
  if(!Number.isInteger(maxBytes)||maxBytes<1)throw new Error('Invalid byte limit');
  const type=(req.headers.get('content-type')||'').toLowerCase().replace(/\s+/g,'').trim();
  if(!/^application\/json(?:;charset=utf-8)?$/.test(type))
    throw new RequestBodyError(415,'JSON_REQUIRED');
  const len=req.headers.get('content-length');
  if(len!==null){
    if(!/^\d+$/.test(len))throw new RequestBodyError(400,'BAD_CONTENT_LENGTH');
    if(Number(len)>maxBytes)throw new RequestBodyError(413,'BODY_TOO_LARGE');
  }
  if(!req.body)throw new RequestBodyError(400,'BODY_REQUIRED');
  const reader=req.body.getReader();
  let bytes=0;
  const parts=[];
  try {
    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      bytes+=value.byteLength;
      if(bytes>maxBytes){
        await reader.cancel('request body limit exceeded').catch(()=>{});
        throw new RequestBodyError(413,'BODY_TOO_LARGE');
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const all=new Uint8Array(bytes);
  let offset=0;
  for(const part of parts){all.set(part,offset);offset+=part.byteLength;}
  let text;
  try{text=new TextDecoder('utf-8',{fatal:true}).decode(all);}
  catch{throw new RequestBodyError(400,'BAD_UTF8');}
  try{return JSON.parse(text);}
  catch{throw new RequestBodyError(400,'MALFORMED_JSON');}
}
