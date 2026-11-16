/* APP MVP-09 / deterministic visual review; offline and synthetic only.
 * No photos, external provider calls, SDK, personal data, or engineering approval.
 */
export const SCENES=Object.freeze([
  Object.freeze({id:'SC-01',he:'קיר נייטרלי',en:'Neutral wall',kind:'neutral',png:'./preview-fixtures/SC-01.png'}),
  Object.freeze({id:'SC-02',he:'חלון משמאל',en:'Left window',kind:'window',png:'./preview-fixtures/SC-02.png'}),
  Object.freeze({id:'SC-04',he:'עציץ בפינה',en:'Corner plant',kind:'plant',png:'./preview-fixtures/SC-04.png'}),
  Object.freeze({id:'SC-07',he:'קיר ירקרק ומנורה',en:'Olive wall and lamp',kind:'lamp',png:'./preview-fixtures/SC-07.png'}),
  Object.freeze({id:'SC-10',he:'חלון וחפצים',en:'Window with objects',kind:'combined',png:'./preview-fixtures/SC-10.png'})
]);
export const FINISHES=Object.freeze(['natural','honey','walnut']);
const sceneIds=new Set(SCENES.map(scene=>scene.id));
const clamp=(value,min,max,fallback)=>Number.isFinite(value)?
  Math.max(min,Math.min(max,value)):fallback;
export function normalizeReview(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('review_object_required');
  const scene=sceneIds.has(input.sceneId)?input.sceneId:'SC-01';
  const finish=FINISHES.includes(input.finish)?input.finish:'natural';
  return Object.freeze({
    schema_version:'ASSEMBL-LAB.SYNTHETIC-REVIEW.0.1',
    source_kind:'synthetic',
    scene_id:scene,
    position_percent:clamp(input.position,30,70,52),
    scale_percent:clamp(input.scale,65,125,88),
    finish,
    drawers:input.drawers===2?2:1,
    view:['before','after','compare'].includes(input.view)?input.view:'after',
    comparison_percent:clamp(input.comparison,15,85,50),
    material:'birch_plywood',
    nominal_thickness_mm:6,
    approved:false,
    photo_included:false,
    engineering_approval:false,
    manufacturing_approval:false
  });
}
export function sceneFor(id){return SCENES.find(item=>item.id===id)||SCENES[0];}
export function viewFor(state){
  const s=normalizeReview({sceneId:state?.scene_id,position:state?.position_percent,
    scale:state?.scale_percent,finish:state?.finish,drawers:state?.drawers,view:state?.view,
    comparison:state?.comparison_percent});
  return Object.freeze({
    scene_kind:sceneFor(s.scene_id).kind,
    show_nightstand:s.view!=='before',
    comparison_enabled:s.view==='compare',
    comparison_percent:s.comparison_percent,
    horizontal_position:s.position_percent+'%',
    nightstand_scale:(s.scale_percent/100).toFixed(2),
    finish:s.finish,
    drawers:s.drawers
  });
}

/* Keep the illustrative object fully inside the horizontal canvas at every
 * viewport. The effective position may be clamped on small screens; this
 * function never mutates the user's requested review values.
 */
export function fittedPlacement(roomWidth,requestedPercent,scalePercent,roomHeight=null){
  if(!Number.isFinite(roomWidth)||roomWidth<=0)throw new RangeError('room_width_invalid');
  const requested=clamp(requestedPercent,30,70,52);
  const preferredScale=clamp(scalePercent,65,125,88)/100;
  // Visual furniture is 186x208 CSS px. Keep the feet on the floor and the
  // tabletop within the cropped viewport on narrow square PNG backgrounds.
  const roomHeightValid=Number.isFinite(roomHeight)&&roomHeight>0;
  const verticalLimit=roomHeightValid ? roomHeight*0.77/208 : preferredScale;
  const horizontalLimit=(roomWidth-10)/186;
  const effectiveScale=Math.max(0.25,Math.min(preferredScale,verticalLimit,horizontalLimit));
  const objectWidth=186*effectiveScale;
  const safePadding=5;
  const half=Math.min(roomWidth/2,objectWidth/2+safePadding);
  const minPercent=100*half/roomWidth;
  const position=Math.max(minPercent,Math.min(100-minPercent,requested));
  return Object.freeze({requested_percent:requested,effective_percent:position,
    was_fitted:Math.abs(position-requested)>0.05||effectiveScale<preferredScale-0.005,
    scale_was_fitted:effectiveScale<preferredScale-0.005,
    effective_scale:effectiveScale,
    object_width:objectWidth});
}

/* A safe in-memory projection of the established design-intent contract.
 * This illustrative example never includes user images, custom text or PII.
 * Keeping the contract explicit lets later features reuse it after Auth QA.
 */
export function designIntentFor(review){
  const s=normalizeReview({
    sceneId:review?.scene_id,position:review?.position_percent,scale:review?.scale_percent,
    finish:review?.finish,drawers:review?.drawers,view:review?.view,
    comparison:review?.comparison_percent
  });
  return Object.freeze({
    schema_version:'ASSEMBL-LAB.DESIGN-INTENT.0.1',
    category:'freestanding_nightstand',
    source_kind:'synthetic',
    requested_dimensions_mm:Object.freeze({width:500,height:550,depth:350}),
    dimension_confidence:'estimated',
    appearance:Object.freeze({finish:s.finish,drawers:s.drawers,lower_section:'shelf',notes:''}),
    placement_preview:Object.freeze({horizontal_position_percent:s.position_percent,relative_scale:s.scale_percent}),
    construction_preferences:Object.freeze({
      material:'birch_plywood',nominal_thickness_mm:6,construction_verified:false
    }),
    photo_included:false,
    engineering_approval:false,
    manufacturing_approval:false
  });
}


/* MVP-11-A: A/B concept snapshots are private in-memory value objects.
 * Accept only normalized visual fields. No photos, URLs, notes, accounts or storage.
 */
const issuedConcepts=new WeakSet();
export function captureConcept(review){
  if(!review||typeof review!=='object'||Array.isArray(review))
    throw new TypeError('concept_review_required');
  if(review.view==='before')throw new RangeError('before_view_has_no_concept');
  const n=normalizeReview({
    sceneId:review.scene_id ?? review.sceneId,
    position:review.position_percent ?? review.position,
    scale:review.scale_percent ?? review.scale,
    finish:review.finish,
    drawers:review.drawers,
    view:'after'
  });
  const concept=Object.freeze({
    scene_id:n.scene_id,position_percent:n.position_percent,
    scale_percent:n.scale_percent,finish:n.finish,drawers:n.drawers
  });
  issuedConcepts.add(concept);
  return concept;
}
export function reviewFromConcept(concept){
  if(!concept||!issuedConcepts.has(concept))throw new TypeError('unknown_concept');
  return normalizeReview({
    sceneId:concept.scene_id,position:concept.position_percent,
    scale:concept.scale_percent,finish:concept.finish,drawers:concept.drawers,
    view:'after'
  });
}
export function compareConcepts(a,b){
  if(!a||!b)return Object.freeze({ready:false,changed:Object.freeze([]),identical:false});
  if(!issuedConcepts.has(a)||!issuedConcepts.has(b))
    throw new TypeError('unknown_concept');
  const names=Object.freeze([
    ['scene','scene_id'],['finish','finish'],['drawers','drawers'],
    ['position','position_percent'],['scale','scale_percent']
  ]);
  const changed=Object.freeze(names.filter(([,field])=>a[field]!==b[field]).map(([name])=>name));
  return Object.freeze({ready:true,changed,identical:changed.length===0});
}
