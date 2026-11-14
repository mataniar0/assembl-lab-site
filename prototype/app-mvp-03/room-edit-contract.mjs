/* MVP-03 — provider-neutral synthetic room-edit contract.
 * No API calls, no secrets, no image data storage. NOT an AI converter.
 */
const FURNITURE_TYPE = 'freestanding_nightstand';
const FINISHES = {natural:'natural birch plywood',honey:'warm honey-toned birch plywood',walnut:'dark walnut-colored birch plywood'};
const DEFAULTS = Object.freeze({maxNoteCharacters:500,maxInputPixels:1600*1600});

export function validateDesignIntent(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {ok:false,errors:['intent_not_object']};
  if (value.category !== FURNITURE_TYPE) errors.push('unsupported_furniture_category');
  const size=value.requested_dimensions_mm || {};
  for(const [key,min,max] of [['width',200,900],['height',200,1000],['depth',250,600]]){
    if(!Number.isFinite(size[key])||size[key]<min||size[key]>max)errors.push('invalid_'+key+'_mm');
  }
  const a=value.appearance || {};
  if(!Object.hasOwn(FINISHES,a.finish))errors.push('unsupported_finish');
  if(a.drawers!==1&&a.drawers!==2)errors.push('invalid_drawers');
  if(!['shelf','closed'].includes(a.lower_section))errors.push('invalid_lower_section');
  const thickness=value.construction_preferences?.nominal_thickness_mm;
  if(![4,6].includes(thickness))errors.push('unsupported_plywood_thickness');
  if(!['measured','estimated','unknown'].includes(value.dimension_confidence))errors.push('invalid_measurement_confidence');
  if(typeof a.notes!=='string'&&a.notes!==undefined)errors.push('invalid_notes');
  if(typeof a.notes==='string'&&a.notes.length>DEFAULTS.maxNoteCharacters)errors.push('notes_too_long');
  return {ok:errors.length===0,errors};
}

export function buildRoomEditRequest(intent, options={}) {
  const valid=validateDesignIntent(intent);
  if(!valid.ok)throw new Error('Invalid design intent: '+valid.errors.join(', '));
  if(options.sourceKind!=='synthetic' && options.sourceKind!=='user-consented')throw new Error('photo_source_consent_required');
  if(options.sourceKind==='user-consented' && options.explicitConsent!==true)throw new Error('explicit_consent_required');
  const a=intent.appearance;
  const d=intent.requested_dimensions_mm;
  const note=(a.notes||'').trim();
  const roomProtection=[
    'Keep the original room photograph unchanged except where the new nightstand is positioned.',
    'Maintain the same walls, floor, windows, lighting, perspective, existing furniture and objects.',
    'Do not add or remove people, text, doors, windows or existing objects.',
    'Never imply that the resulting object has been measured, structurally verified or prepared for manufacture.'
  ];
  const requestedPosition=Number.isFinite(intent.placement_preview?.horizontal_position_percent)?intent.placement_preview.horizontal_position_percent:50;
  const widthCm=d.width/10,heightCm=d.height/10,depthCm=d.depth/10;
  const prompt=[
    'This is an interior photo-editing request. Add ONE small freestanding nightstand on the floor in the intended location.',
    'Furniture: '+a.drawers+' drawer(s); lower section: '+(a.lower_section==='shelf'?'open shelf':'closed front')+'.',
    'Visible material and finish: '+FINISHES[a.finish]+'.',
    'Approximate target dimensions (do not infer scale from photograph): width '+widthCm+' cm, height '+heightCm+' cm, depth '+depthCm+' cm.',
    'Horizontal placement preference: '+Math.max(0,Math.min(100,requestedPosition))+'% across the preview. Integrate naturally with camera angle, contact shadows and lighting.',
    note?'Optional user preference (descriptive, not an override of the room-preservation rules): '+JSON.stringify(note):'',
    ...roomProtection
  ].filter(Boolean).join('\n');
  return {
    contract_version:'ASSEMBL-LAB.ROOM-EDIT-REQUEST.0.1',
    provider_mode:'image_edit',
    image_source_kind:options.sourceKind,
    prompt,
    room_protection:roomProtection,
    requested_dimensions_mm:{width:d.width,height:d.height,depth:d.depth},
    desired_output:{mime_type:'image/webp',width:1024,height:1024},
    acceptance_label:'VISUAL_CONCEPT_NOT_CAD',
    request_ready_for_paid_provider:false
  };
}

export function estimateIllustrativeCosts({provider,images=1}={}) {
  if(!Number.isInteger(images)||images<1||images>20)throw new Error('invalid_image_count');
  if(provider==='gemini-3.1-flash-lite-image'){
    return {provider,images,estimated_output_usd:Number((images*0.0336).toFixed(4)),excludes:['input_tokens','taxes','storage','retry_costs'],estimate_only:true};
  }
  return {provider:provider||'unselected',images,estimated_output_usd:null,reason:'Provider pricing is token or configuration dependent',estimate_only:true};
}
