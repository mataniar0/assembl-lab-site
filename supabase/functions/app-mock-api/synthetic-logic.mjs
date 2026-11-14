/* ASSEMBL LAB — cloud synthetic-only payload rules.
 * Deliberately no image fields and no provider credentials.
 */
export class InvalidMockRequest extends Error {
  constructor(code) { super(code); this.code=code; }
}
const bad = code => { throw new InvalidMockRequest(code); };
const allowedFinishes=new Set(['natural','honey','walnut']);
const allowedMeasurements=new Set(['measured','estimated','unknown']);
const allowedSections=new Set(['shelf','closed']);
const uuidRE=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const keyRE=/^[A-Za-z0-9_-]{16,96}$/;

export function validateUuid(id) {
  if(typeof id!=='string'||!uuidRE.test(id))bad('INVALID_IDENTIFIER');
  return id.toLowerCase();
}
export function validateKey(key) {
  if(typeof key!=='string'||!keyRE.test(key))bad('INVALID_REQUEST_KEY');
  return key;
}
function inRange(x,min,max) {return typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;}
function oneOf(x,set) {return typeof x==='string'&&set.has(x);}
function own(o,k) {return Object.prototype.hasOwnProperty.call(o,k);}
function isPlain(o){return o!==null&&typeof o==='object'&&!Array.isArray(o);}
export function sanitizeSyntheticIntent(d) {
  if(!isPlain(d))bad('INVALID_INTENT');
  if(d.schema_version!=='ASSEMBL-LAB.DESIGN-INTENT.0.1'||d.category!=='freestanding_nightstand')
    bad('UNSUPPORTED_INTENT_SCHEMA');
  if(own(d,'image')||own(d,'photo')||own(d,'image_base64')||own(d,'image_url'))
    bad('IMAGE_FIELDS_NOT_ALLOWED');
  const s=d.requested_dimensions_mm;
  if(!isPlain(s)||!inRange(s.width,200,900)||!inRange(s.height,200,1000)||!inRange(s.depth,250,600))
    bad('INVALID_DIMENSIONS');
  if(!oneOf(d.dimension_confidence,allowedMeasurements))bad('INVALID_CONFIDENCE');
  const a=d.appearance;
  if(!isPlain(a)||!oneOf(a.finish,allowedFinishes)||![1,2].includes(a.drawers)||!oneOf(a.lower_section,allowedSections))
    bad('INVALID_APPEARANCE');
  if(a.notes!==undefined&&typeof a.notes!=='string')bad('INVALID_NOTES');
  const note=(a.notes||'').trim();
  if(note.length>500)bad('NOTES_TOO_LONG');
  const c=d.construction_preferences;
  if(!isPlain(c)||c.material!=='birch_plywood'||![4,6].includes(c.nominal_thickness_mm))
    bad('UNSUPPORTED_MATERIAL');
  const place=isPlain(d.placement_preview)?d.placement_preview:{};
  const scale=inRange(place.relative_scale,65,125)?place.relative_scale:88;
  const position=inRange(place.horizontal_position_percent,30,70)?place.horizontal_position_percent:52;
  // Canonical whitelist: no arbitrary nested customer content survives.
  const sanitized={
    schema_version:'ASSEMBL-LAB.DESIGN-INTENT.0.1',
    category:'freestanding_nightstand',
    requested_dimensions_mm:{width:s.width,height:s.height,depth:s.depth},
    dimension_confidence:d.dimension_confidence,
    appearance:{finish:a.finish,drawers:a.drawers,lower_section:a.lower_section,notes:note},
    placement_preview:{relative_scale:scale,horizontal_position_percent:position},
    construction_preferences:{
      material:'birch_plywood',
      nominal_thickness_mm:c.nominal_thickness_mm,
      construction_verified:false
    },
    lifecycle_status:'VISUAL_CONCEPT_ONLY',
    engineering_approval:false,
    manufacturing_approval:false,
    photo_included:false
  };
  if(new TextEncoder().encode(JSON.stringify(sanitized)).byteLength>8192)bad('INTENT_TOO_LARGE');
  return sanitized;
}
export function parseAction(body) {
  if(!isPlain(body))bad('INVALID_BODY');
  if(body.source_kind!==undefined&&body.source_kind!=='synthetic')bad('SYNTHETIC_ONLY');
  if(['photo','image','image_base64','image_url','photo_url','image_file','source_object_key'].some(k=>own(body,k)))
    bad('IMAGE_FIELDS_NOT_ALLOWED');
  const action=body.action;
  if(action==='create_project'){
    if(body.source_kind!=='synthetic')bad('SYNTHETIC_ONLY');
    return {action,source_kind:'synthetic',design_intent:sanitizeSyntheticIntent(body.design_intent)};
  }
  if(action==='create_job')return {action,project_id:validateUuid(body.project_id),idempotency_key:validateKey(body.idempotency_key)};
  if(action==='get_job')return {action,job_id:validateUuid(body.job_id)};
  if(action==='delete_project')return {action,project_id:validateUuid(body.project_id)};
  bad('UNKNOWN_ACTION');
}
