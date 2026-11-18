/* APP MVP-26: Round Personal Coffee design intent. Filename retained for PWA compatibility. */
(function mainCoffeeIntent(){
 'use strict';
 const $=id=>document.getElementById(id);
 const snapshots=new Map();
 const he=()=>document.documentElement.lang!=='en';
 const tr=(hebrew,english)=>he()?hebrew:english;
 const allowedStyles=['curved-ring','curved-open'];
 const allowedThickness=[20,30,40];
 let approvedSnapshot=null;
 const num=id=>{const s=$(id).value.trim();return s===''?NaN:Number(s);};
 const dimensions=()=>({diameter:num('diameter-cm'),height:num('height-cm')});
 const validSize=size=>Number.isInteger(size.diameter)&&size.diameter>=40&&size.diameter<=90&&
   Number.isInteger(size.height)&&size.height>=30&&size.height<=70;
 const validInput=()=>validSize(dimensions())&&allowedThickness.includes(num('top-thickness-mm'))&&
   allowedStyles.includes($('base-style').value);
 const currentVersionId=()=>{const v=($('current-label')?.textContent||'').match(/V(\d+)/);return v?Number(v[1]):null;};
 function designIntent(){
   const d=dimensions(),thickness=num('top-thickness-mm');
   return {
     schema_version:'ASSEMBL-LAB.DESIGN-INTENT.0.2',
     category:'round_coffee_table',
     requested_dimensions_mm:{diameter:d.diameter*10,height:d.height*10},
     dimension_confidence:$('measure').value,
     appearance:{
       finish:$('finish').value,
       base_style:$('base-style').value,
       tabletop_thickness_mm:thickness,
       notes:$('description').value.trim().slice(0,500)
     },
     placement_preview:{
       relative_scale:Number($('scale').value),
       horizontal_position_percent:Number($('position').value)
     },
     construction_preferences:{
       tabletop_thickness_mm:thickness,
       materials:'wood_and_metal_concept',
       construction_verified:false
     },
     engineering_candidate_envelope:'NOT_ASSESSED',
     lifecycle_status:'VISUAL_CONCEPT_ONLY',
     engineering_approval:false,
     manufacturing_approval:false,
     photo_included:false,
     returned_model_kind:'FIXED_PERSONAL_COFFEE_REFERENCE_NOT_PARAMETRIC'
   };
 }
 function showStatus(){
   const el=$('coffee-intent-status');if(!el)return;
   if(!validInput()){
     el.textContent=tr('קוטר חייב להיות 40–90 ס״מ, גובה 30–70 ס״מ ועובי הפלטה מתוך האפשרויות.',
       'Diameter must be 40–90 cm, height 30–70 cm and tabletop thickness one of the listed options.');
     return;
   }
   el.textContent=tr('ההמחשה סכמטית בלבד; אין אישור מידות, יציבות, חיבורים או ייצור. ה־GLB שיוחזר הוא דגם קבוע.',
     'Schematic preview only; dimensions, stability, joinery and manufacturing are unverified. The returned GLB is a fixed reference.');
 }
 function blockInvalidSubmission(event){
   if(validInput())return;
   event.preventDefault();event.stopImmediatePropagation();
   const el=$('design-error');
   el.textContent=tr('בדקו קוטר 40–90 ס״מ, גובה 30–70 ס״מ ועובי פלטה תקין.',
     'Check diameter 40–90 cm, height 30–70 cm and a valid tabletop thickness.');
   el.hidden=false;showStatus();
 }
 function renderSnapshotDetails(){
   const snap=snapshots.get(currentVersionId()),summary=$('design-summary');
   if(!summary||!snap)return;
   summary.querySelector('[data-design-intent-detail]')?.remove();
   const line=document.createElement('div');
   line.dataset.designIntentDetail='';
   const heading=document.createElement('strong');
   heading.textContent=tr('תכנון שולחן / עובי פלטה: ','Coffee table / tabletop: ');
   line.append(heading,document.createTextNode(snap.appearance.base_style+' · '+snap.appearance.tabletop_thickness_mm+' mm · '+tr('המחשה בלבד','schematic only')));
   summary.append(line);
 }
 function captureVersion(){
   window.setTimeout(()=>{
     const id=currentVersionId();
     if(!Number.isInteger(id)||id<1||!validInput())return;
     snapshots.set(id,structuredClone(designIntent()));
     renderSnapshotDetails();
   },0);
 }
 function markApproved(){
   const id=currentVersionId();
   const snapshot=snapshots.get(id);
   approvedSnapshot=snapshot?structuredClone(snapshot):null;
   const dl=$('download-intent');if(dl)dl.hidden=!approvedSnapshot;
   const d=approvedSnapshot?.requested_dimensions_mm;
   const a=approvedSnapshot?.appearance;
   const valid=!!d&&!!a&&Number.isInteger(d.diameter)&&d.diameter>=400&&d.diameter<=900&&
     Number.isInteger(d.height)&&d.height>=300&&d.height<=700&&
     ['natural','honey','walnut'].includes(a.finish)&&allowedStyles.includes(a.base_style)&&
     allowedThickness.includes(a.tabletop_thickness_mm);
   const data=valid?Object.freeze({
     version_id:'visual-v'+id,
     finish:a.finish,
     base_style:a.base_style,
     tabletop_thickness_mm:a.tabletop_thickness_mm,
     dimensions_mm:Object.freeze({diameter:d.diameter,height:d.height})
   }):null;
   window.dispatchEvent(new CustomEvent('assembl:3d-model-ready',{detail:data}));
 }
 function exportApproved(){
   if(!approvedSnapshot)return;
   const id=currentVersionId();
   const record=Array.from($('approval-record')?.children||[]).map(n=>n.textContent||'');
   const at=record.find(x=>x.startsWith('approved_at: '))?.slice('approved_at: '.length)||null;
   const payload={...approvedSnapshot,visual_version_id:'visual-v'+id,visual_approval_recorded_at:at,
      export_type:'LOCAL_DESIGN_INTENT_ONLY',generated_at:new Date().toISOString()};
   const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'}));
   const link=document.createElement('a');
   link.href=url;link.download='assembl-lab-round-coffee-v'+id+'.json';
   document.body.append(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
 function init(){
   const form=$('design-form');if(!form||!$('diameter-cm')||!$('download-intent'))return;
   form.addEventListener('submit',blockInvalidSubmission,true);
   form.addEventListener('submit',captureVersion);
   for(const id of ['diameter-cm','height-cm','top-thickness-mm','base-style','measure'])
     $(id).addEventListener('input',showStatus);
   $('versions').addEventListener('click',event=>{
     if(!event.target.closest('button'))return;
     const snap=snapshots.get(currentVersionId());if(!snap)return;
     $('diameter-cm').value=String(snap.requested_dimensions_mm.diameter/10);
     $('height-cm').value=String(snap.requested_dimensions_mm.height/10);
     $('base-style').value=snap.appearance.base_style;
     $('top-thickness-mm').value=String(snap.appearance.tabletop_thickness_mm);
     renderSnapshotDetails();showStatus();
   });
   for(const btn of document.querySelectorAll('.quick-actions [data-change]'))
     btn.addEventListener('click',captureVersion);
   $('confirm-approval').addEventListener('click',markApproved);
   $('download-intent').addEventListener('click',exportApproved);
   document.addEventListener('click',e=>{if(e.target?.id==='lang'){showStatus();renderSnapshotDetails();}});
   showStatus();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
