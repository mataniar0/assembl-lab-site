/* APP MVP-09 / deterministic visual review; offline and synthetic only.
 * No photos, external provider calls, SDK, personal data, or engineering approval.
 */
export const SCENES=Object.freeze([
  Object.freeze({id:'SC-01',he:'קיר נייטרלי',en:'Neutral wall',kind:'neutral'}),
  Object.freeze({id:'SC-02',he:'חלון משמאל',en:'Left window',kind:'window'}),
  Object.freeze({id:'SC-04',he:'עציץ בפינה',en:'Corner plant',kind:'plant'})
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
export function fittedPlacement(roomWidth,requestedPercent,scalePercent){
  if(!Number.isFinite(roomWidth)||roomWidth<=0)throw new RangeError('room_width_invalid');
  const requested=clamp(requestedPercent,30,70,52);
  const scale=clamp(scalePercent,65,125,88)/100;
  const objectWidth=186*scale;
  // The drop shadow is decorative, not part of the object's visible width.
  const safePadding=5;
  const half=Math.min(roomWidth/2,objectWidth/2+safePadding);
  const minPercent=100*half/roomWidth;
  const position=Math.max(minPercent,Math.min(100-minPercent,requested));
  return Object.freeze({requested_percent:requested,effective_percent:position,
    was_fitted:Math.abs(position-requested)>0.05,object_width:objectWidth});
}
