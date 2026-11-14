/* MVP-06: synthetic-only, ephemeral visualization job store.
 * No files, image uploads, AI API calls, or persistent customer records.
 */
import {createHash, randomUUID} from 'node:crypto';
import {buildRoomEditRequest,validateDesignIntent} from '../app-mvp-03/room-edit-contract.mjs';

export class ApiError extends Error {
  constructor(status, code, message=code) {
    super(message);
    this.status=status;
    this.code=code;
  }
}

const has=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);

export class MockVisualizationStore {
  constructor({maxJobsPerOwner=5,clock=()=>new Date().toISOString()}={}) {
    this.maxJobsPerOwner=maxJobsPerOwner;
    this.clock=clock;
    this.jobs=new Map();
    this.idempotency=new Map();
  }

  static fingerprint(body) {
    return createHash('sha256').update(JSON.stringify(body)).digest('hex');
  }

  create({owner,idempotencyKey,body}) {
    if(!body||typeof body!=='object'||Array.isArray(body))
      throw new ApiError(400,'INVALID_BODY');
    if(body.source_kind!=='synthetic')
      throw new ApiError(422,'SYNTHETIC_ONLY','Real room photographs are disabled in the local backend.');
    if(has(body,'image')||has(body,'image_base64')||has(body,'photo')||has(body,'photo_url')||has(body,'image_url'))
      throw new ApiError(422,'IMAGE_DATA_REJECTED');
    if(Object.keys(body).some(k=>!['source_kind','design_intent'].includes(k)))
      throw new ApiError(422,'UNSUPPORTED_BODY_FIELD');
    const result=validateDesignIntent(body.design_intent);
    if(!result.ok)throw new ApiError(422,'INVALID_DESIGN_INTENT',result.errors.join(', '));
    const key=owner+':'+idempotencyKey;
    const fingerprint=MockVisualizationStore.fingerprint(body);
    const previous=this.idempotency.get(key);
    if(previous){
      if(previous.fingerprint!==fingerprint)throw new ApiError(409,'IDEMPOTENCY_CONFLICT');
      return {job:this.publicView(this.jobs.get(previous.id)),replayed:true};
    }
    const count=Array.from(this.jobs.values()).filter(j=>j.owner===owner).length;
    if(count>=this.maxJobsPerOwner)throw new ApiError(429,'DEMO_JOB_LIMIT');
    const spec=buildRoomEditRequest(body.design_intent,{sourceKind:'synthetic'});
    const job={
      id:randomUUID(),
      owner,
      status:'MOCK_READY',
      source_kind:'synthetic',
      provider:'none',
      output_image_url:null,
      design_schema:body.design_intent.schema_version||'ASSEMBL-LAB.DESIGN-INTENT.0.1',
      request_contract_version:spec.contract_version,
      requested_dimensions_mm:spec.requested_dimensions_mm,
      mock_note:'No image was generated. This validates only the API lifecycle.',
      created_at:this.clock(),
      engineering_approval:false,
      manufacturing_approval:false
    };
    this.jobs.set(job.id,job);
    this.idempotency.set(key,{id:job.id,fingerprint});
    return {job:this.publicView(job),replayed:false};
  }

  publicView(job) {
    if(!job)return null;
    const {owner,...rest}=job;
    return {...rest};
  }

  get({owner,id}) {
    const job=this.jobs.get(id);
    if(!job||job.owner!==owner)throw new ApiError(404,'JOB_NOT_FOUND');
    return this.publicView(job);
  }

  delete({owner,id}) {
    const job=this.jobs.get(id);
    if(!job||job.owner!==owner)throw new ApiError(404,'JOB_NOT_FOUND');
    this.jobs.delete(id);
    for(const [key,item] of this.idempotency){
      if(item.id===id)this.idempotency.delete(key);
    }
    return {deleted:true,id};
  }
}
