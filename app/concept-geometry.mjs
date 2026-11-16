/* ASSEMBL LAB MVP-13 — offline conceptual 3D, no backend, external assets or AI.
 * Geometry is a schematic volume study, not CAD, a joinery solution or a cut plan.
 */
export const SPEC_VERSION='ASSEMBL-LAB.SELECTED-CONCEPT.0.1';
export const DEFAULT_DIMS=Object.freeze({width:500,height:550,depth:350});
const SCENES=Object.freeze(['SC-01','SC-02','SC-04','SC-07','SC-10']);
const FINISHES=Object.freeze(['natural','honey','walnut']);
const PALETTE=Object.freeze({
  natural:Object.freeze({top:'#e0b988',front:'#cba273',side:'#a88253',outline:'#5a452d'}),
  honey:Object.freeze({top:'#cb995f',front:'#b77c44',side:'#8a5d35',outline:'#4d3522'}),
  walnut:Object.freeze({top:'#937057',front:'#77543e',side:'#573c2c',outline:'#30251e'})
});
const KEYS=Object.freeze({
  root:['schema_version','source_kind','selected_slot','scene_id','review','design_intent','photo_included','engineering_approval','manufacturing_approval'],
  review:['scene_id','finish','drawers','horizontal_position_percent','illustrative_scale_percent'],
  intent:['schema_version','category','source_kind','requested_dimensions_mm','dimension_confidence','appearance','placement_preview','construction_preferences','photo_included','engineering_approval','manufacturing_approval'],
  dimensions:['width','height','depth'],
  appearance:['finish','drawers','lower_section','notes'],
  placement:['horizontal_position_percent','relative_scale'],
  construction:['material','nominal_thickness_mm','construction_verified']
});
function checkRecord(value,keys,code){
  if(value===null||typeof value!=='object'||Array.isArray(value)||
     Object.getPrototypeOf(value)!==Object.prototype||
     Reflect.ownKeys(value).length!==keys.length)throw new TypeError(code);
  for(const key of Reflect.ownKeys(value)){
    const d=Object.getOwnPropertyDescriptor(value,key);
    if(typeof key!=='string'||!keys.includes(key)||!d||!Object.hasOwn(d,'value'))
      throw new TypeError(code);
  }
}
function yes(value,code){if(!value)throw new RangeError(code);}
function integer(value,min,max,code){yes(Number.isInteger(value)&&value>=min&&value<=max,code);return value;}
function isFalse(value){return value===false;}
export function parseSelectedConcept(text){
  if(typeof text!=='string'||text.length>16000)throw new TypeError('CONCEPT_FILE_INVALID_SIZE');
  let raw;
  try{raw=JSON.parse(text);}catch{throw new TypeError('CONCEPT_INVALID_JSON');}
  checkRecord(raw,KEYS.root,'CONCEPT_ROOT_INVALID');
  checkRecord(raw.review,KEYS.review,'CONCEPT_REVIEW_INVALID');
  checkRecord(raw.design_intent,KEYS.intent,'CONCEPT_INTENT_INVALID');
  const intent=raw.design_intent;
  checkRecord(intent.requested_dimensions_mm,KEYS.dimensions,'CONCEPT_DIMENSIONS_INVALID');
  checkRecord(intent.appearance,KEYS.appearance,'CONCEPT_APPEARANCE_INVALID');
  checkRecord(intent.placement_preview,KEYS.placement,'CONCEPT_PLACEMENT_INVALID');
  checkRecord(intent.construction_preferences,KEYS.construction,'CONCEPT_CONSTRUCTION_INVALID');
  yes(raw.schema_version===SPEC_VERSION&&raw.source_kind==='synthetic','CONCEPT_SCHEMA_UNSUPPORTED');
  yes(raw.selected_slot==='A'||raw.selected_slot==='B','CONCEPT_SLOT_INVALID');
  yes(SCENES.includes(raw.scene_id)&&raw.review.scene_id===raw.scene_id,'CONCEPT_SCENE_INVALID');
  const r=raw.review;
  yes(FINISHES.includes(r.finish),'CONCEPT_FINISH_INVALID');
  yes(r.drawers===1||r.drawers===2,'CONCEPT_DRAWERS_INVALID');
  integer(r.horizontal_position_percent,30,70,'CONCEPT_POSITION_INVALID');
  integer(r.illustrative_scale_percent,65,125,'CONCEPT_SCALE_INVALID');
  yes(intent.schema_version==='ASSEMBL-LAB.DESIGN-INTENT.0.1'&&
      intent.category==='freestanding_nightstand'&&intent.source_kind==='synthetic'&&
      intent.dimension_confidence==='estimated','CONCEPT_INTENT_SCHEMA_INVALID');
  const d=intent.requested_dimensions_mm;
  integer(d.width,200,900,'CONCEPT_WIDTH_INVALID');
  integer(d.height,250,950,'CONCEPT_HEIGHT_INVALID');
  integer(d.depth,200,600,'CONCEPT_DEPTH_INVALID');
  yes(intent.appearance.finish===r.finish&&intent.appearance.drawers===r.drawers&&
    intent.appearance.lower_section==='shelf'&&intent.appearance.notes==='',
    'CONCEPT_APPEARANCE_MISMATCH');
  yes(intent.placement_preview.horizontal_position_percent===r.horizontal_position_percent&&
    intent.placement_preview.relative_scale===r.illustrative_scale_percent,
    'CONCEPT_PLACEMENT_MISMATCH');
  yes(intent.construction_preferences.material==='birch_plywood'&&
    intent.construction_preferences.nominal_thickness_mm===6&&
    isFalse(intent.construction_preferences.construction_verified),
    'CONCEPT_MATERIAL_INVALID');
  yes(isFalse(raw.photo_included)&&isFalse(raw.engineering_approval)&&
    isFalse(raw.manufacturing_approval)&&isFalse(intent.photo_included)&&
    isFalse(intent.engineering_approval)&&isFalse(intent.manufacturing_approval),
    'CONCEPT_APPROVAL_OR_PHOTO_INVALID');
  return Object.freeze({
    selected_slot:raw.selected_slot,scene_id:raw.scene_id,
    finish:r.finish,drawers:r.drawers,
    placement_percent:r.horizontal_position_percent,
    illustrative_scale_percent:r.illustrative_scale_percent,
    dimensions_mm:Object.freeze({width:d.width,height:d.height,depth:d.depth}),
    material:'birch_plywood',nominal_thickness_mm:6,
    source_kind:'synthetic',engineering_approval:false,manufacturing_approval:false
  });
}
export function demoConcept(){
  return Object.freeze({
    selected_slot:'DEMO',scene_id:'SC-01',finish:'natural',drawers:1,
    placement_percent:52,illustrative_scale_percent:88,
    dimensions_mm:DEFAULT_DIMS,material:'birch_plywood',nominal_thickness_mm:6,
    source_kind:'synthetic',engineering_approval:false,manufacturing_approval:false
  });
}
function part(id,kind,x,y,z,w,h,d){
  const nums=[x,y,z,w,h,d];
  if(!nums.every(Number.isFinite)||w<=0||h<=0||d<=0)throw new RangeError('INVALID_PART');
  return Object.freeze({id,kind,x,y,z,width:w,height:h,depth:d});
}
export function buildNightstand(concept,dimensions=concept?.dimensions_mm){
  if(!concept||!FINISHES.includes(concept.finish)||![1,2].includes(concept.drawers))
    throw new TypeError('CONCEPT_INVALID');
  if(!dimensions||Object.getPrototypeOf(dimensions)!==Object.prototype)
    throw new TypeError('DIMENSIONS_INVALID');
  if(Reflect.ownKeys(dimensions).length!==3||
     !['width','height','depth'].every(k=>Object.hasOwn(dimensions,k)))
    throw new TypeError('DIMENSIONS_INVALID');
  const W=integer(dimensions.width,200,900,'WIDTH_INVALID');
  const H=integer(dimensions.height,250,950,'HEIGHT_INVALID');
  const D=integer(dimensions.depth,200,600,'DEPTH_INVALID');
  const T=6,L=Math.min(82,Math.round(H*0.16)),cabinetH=H-L-T;
  const result=[
    part('top','top',0,H-T/2,0,W,T,D),
    part('left','side',-W/2+T/2,L+cabinetH/2,0,T,cabinetH,D-2*T),
    part('right','side',W/2-T/2,L+cabinetH/2,0,T,cabinetH,D-2*T),
    part('back','back',0,L+cabinetH/2,-D/2+T/2,W-2*T,cabinetH,T),
    part('shelf','shelf',0,L+T*2,0,W-2*T,T,D-2*T)
  ];
  const frontZ=D/2-T/2;
  const frontTop=H-T-8;
  const fHeight=Math.min(48,Math.max(25,Math.round(cabinetH*0.17)));
  for(let i=0;i<concept.drawers;i++){
    const yc=frontTop-fHeight/2-i*(fHeight+8);
    result.push(part('drawer-'+(i+1),'drawer',0,yc,frontZ,W-2*T-12,fHeight,T));
  }
  for(const x of [-W/2+24,W/2-24]){
    for(const z of [-D/2+24,D/2-24]){
      result.push(part('leg-'+(x<0?'l':'r')+(z<0?'b':'f'),'leg',x,L/2,z,24,L,24));
    }
  }
  const parts=Object.freeze(result);
  for(const p of parts){
    if(p.x-p.width/2 < -W/2-0.001||p.x+p.width/2 > W/2+0.001||
       p.y-p.height/2 < -0.001||p.y+p.height/2 > H+0.001||
       p.z-p.depth/2 < -D/2-0.001||p.z+p.depth/2 > D/2+0.001)
      throw new RangeError('PART_EXCEEDS_ENVELOPE');
  }
  return Object.freeze({parts,dimensions_mm:Object.freeze({width:W,height:H,depth:D}),
    finish:concept.finish,drawers:concept.drawers,material:'birch_plywood',
    nominal_thickness_mm:T,certified:false});
}
const FACE_DEFS=Object.freeze([
  Object.freeze({name:'left',axis:'x',sign:-1,indices:[0,4,6,2]}),
  Object.freeze({name:'right',axis:'x',sign:1,indices:[1,3,7,5]}),
  Object.freeze({name:'bottom',axis:'y',sign:-1,indices:[0,1,5,4]}),
  Object.freeze({name:'top',axis:'y',sign:1,indices:[2,6,7,3]}),
  Object.freeze({name:'back',axis:'z',sign:-1,indices:[0,2,3,1]}),
  Object.freeze({name:'front',axis:'z',sign:1,indices:[4,5,7,6]})
]);
function vertices(b){
  const x0=b.x-b.width/2,x1=b.x+b.width/2;
  const y0=b.y-b.height/2,y1=b.y+b.height/2;
  const z0=b.z-b.depth/2,z1=b.z+b.depth/2;
  return [[x0,y0,z0],[x1,y0,z0],[x0,y1,z0],[x1,y1,z0],
    [x0,y0,z1],[x1,y0,z1],[x0,y1,z1],[x1,y1,z1]];
}
function cameraBasis(azimuth,elevation){
  const a=azimuth*Math.PI/180,e=elevation*Math.PI/180;
  const sa=Math.sin(a),ca=Math.cos(a),se=Math.sin(e),ce=Math.cos(e);
  return {dir:[sa*ce,se,ca*ce],right:[ca,0,-sa],up:[-sa*se,ce,-ca*se]};
}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
export function projectNightstand(model,azimuth=32,elevation=27,zoom=100){
  integer(azimuth,0,360,'AZIMUTH_INVALID');
  integer(elevation,10,70,'ELEVATION_INVALID');
  integer(zoom,60,160,'ZOOM_INVALID');
  const basis=cameraBasis(azimuth,elevation);
  const faces=[];
  const all=[];
  const H=model.dimensions_mm.height;
  for(const p of model.parts){
    const verts=vertices(p).map(v=>[v[0],v[1]-H/2,v[2]]);
    for(const def of FACE_DEFS){
      const normal=[0,0,0];normal[{x:0,y:1,z:2}[def.axis]]=def.sign;
      if(dot(normal,basis.dir)<=0.00001)continue;
      const vv=def.indices.map(i=>verts[i]);
      const projected=vv.map(v=>[dot(v,basis.right),dot(v,basis.up)]);
      all.push(...projected);
      faces.push({part_id:p.id,kind:p.kind,face:def.name,points:projected,
        depth:vv.reduce((s,v)=>s+dot(v,basis.dir),0)/4});
    }
  }
  const minX=Math.min(...all.map(v=>v[0])),maxX=Math.max(...all.map(v=>v[0]));
  const minY=Math.min(...all.map(v=>v[1])),maxY=Math.max(...all.map(v=>v[1]));
  const fit=Math.min(660/Math.max(1,maxX-minX),440/Math.max(1,maxY-minY))*zoom/100;
  const originX=400-(minX+maxX)*fit/2,originY=280+(minY+maxY)*fit/2;
  const rendered=faces.map(face=>Object.freeze({
    part_id:face.part_id,kind:face.kind,face:face.face,depth:face.depth,
    points:Object.freeze(face.points.map(p=>Object.freeze([
      Math.round((originX+p[0]*fit)*10)/10,Math.round((originY-p[1]*fit)*10)/10
    ])))
  })).sort((a,b)=>a.depth-b.depth);
  return Object.freeze({faces:Object.freeze(rendered),view_box:'0 0 800 560',
    palette:PALETTE[model.finish],geometry_kind:'CONCEPT_ONLY'});
}
export function faceColor(palette,face,kind){
  if(kind==='leg')return palette.side;
  if(face==='top')return palette.top;
  if(face==='front')return palette.front;
  return palette.side;
}
