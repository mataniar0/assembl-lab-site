/* AL APP UX-002 phase-one prototype. Schematic vector overlay ONLY; no server/AI/network. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const screens = ['intro','capture','configure','review','approved'];
  const palettes = {
    natural: { top:'#e4bc86',front:'#d5a56b',side:'#b7834e',edge:'#9d7041',line:'#936538' },
    honey: { top:'#d09b58',front:'#bc8042',side:'#965e30',edge:'#78451f',line:'#664122' },
    walnut: { top:'#8d6249',front:'#6c4432',side:'#523428',edge:'#3b241e',line:'#36231b' }
  };
  const i18n = {"he":{"needImage":"בחרו תמונת חלל או חלל הדגמה כדי להמשיך.","invalidImage":"יש לבחור קובץ תמונה תקין עד 10MB.","invalidDimensions":"הזינו קוטר 40–90 ס״מ וגובה 30–70 ס״מ.","v":"גרסה","comparePrev":"גרסה קודמת","compareCurrent":"גרסה נבחרת","compareNone":"אין עדיין גרסה נוספת להשוואה.","summary":"פרטי גרסה","diameter":"קוטר","height":"גובה","base":"סוג בסיס","topThickness":"עובי פלטה","finish":"גוון","dimensions":"מידות רצויות","confidence":"סטטוס מידות","note":"הערה","noNote":"אין","measured":"נמדדו","estimated":"משוערות","unknown":"לא ידועות","curved-ring":"רגליים מעוקלות עם טבעת","curved-open":"רגליים מעוקלות ללא טבעת","natural":"בירץ טבעי","honey":"דבש","walnut":"אגוז","approved":"אושרה גרסה","approveDialog":"לאשר את גרסה","confirm":"גרסה","modified":"יצירת גרסה חדשה תדרוש אישור מחודש.","noEarlier":"אין גרסה קודמת להשוואה.","photo":"התמונה שבחרתם","demo":"חלל הדגמה ריאליסטי","demoReference":"צילום להמחשה · דגם קבוע","demoSchematic":"המחשה סכמטית לפי בחירה"},"en":{"needImage":"Choose a room photo or demo room.","invalidImage":"Choose a valid image file smaller than 10 MB.","invalidDimensions":"Use diameter 40–90 cm and height 30–70 cm.","v":"Version","comparePrev":"Previous version","compareCurrent":"Selected version","compareNone":"No earlier version to compare.","summary":"Version summary","diameter":"Diameter","height":"Height","base":"Base style","topThickness":"Tabletop thickness","finish":"Finish","dimensions":"Requested size","confidence":"Measurement status","note":"Note","noNote":"None","measured":"Measured","estimated":"Estimated","unknown":"Unknown","curved-ring":"Curved legs with ring","curved-open":"Curved legs without ring","natural":"Natural birch","honey":"Honey","walnut":"Walnut","approved":"Approved version","approveDialog":"Approve version","confirm":"Version","modified":"Making a new version requires fresh approval.","noEarlier":"No earlier version to compare.","photo":"Your photo","demo":"Photographic demo room","demoReference":"Reference photo · fixed example","demoSchematic":"Schematic · selected options"}};

  let lang='he', stage='intro', roomKind=null, roomUrl=null, versions=[], selected=0, approved=null, cameraStream=null, installPrompt=null, waitingWorker=null;
  const t=key=>i18n[lang][key] || key;
  const configFields=['finish','base-style','diameter-cm','height-cm','top-thickness-mm','measure','scale','position','description'];
  function init() {
    $('intro-scene').innerHTML='<div class="furniture-mount"></div>';
    $('intro-scene').querySelector('.furniture-mount').innerHTML=coffeeTableSvg({finish:'natural',baseStyle:'curved-ring',diameter:62,height:45,topThickness:30});
    $('start').addEventListener('click',()=>go('capture'));
    $('capture-back').addEventListener('click',()=>go('intro'));
    $('capture-next').addEventListener('click',()=>{if(!roomKind)return showError('capture-error',t('needImage')); go('configure')});
    $('configure-back').addEventListener('click',()=>go('capture'));
    $('return-config').addEventListener('click',()=>go('configure'));
    $('review-back').addEventListener('click',()=>go('configure'));
    $('approved-back').addEventListener('click',()=>go('review'));
    $('demo').addEventListener('click',()=>chooseRoom('demo'));
    $('live-camera').addEventListener('click',openCamera);
    $('take-shot').addEventListener('click',takePhoto);
    $('close-camera').addEventListener('click',stopCamera);
    $('photo').addEventListener('change',onFileChange);
    $('gallery').addEventListener('change',onFileChange);
    $('design-form').addEventListener('submit',onGenerate);
    configFields.forEach(id=>$(id).addEventListener('input',()=>renderRoom('config-scene',readInputs())));
    $('open-approval').addEventListener('click',()=>{
      if(!versions.length)return;
      $('dialog-version').textContent=`${t('approveDialog')} V${versions[selected].id}?`;
      $('approval-dialog').showModal();
    });
    $('cancel-approval').addEventListener('click',()=>$('approval-dialog').close());
    $('confirm-approval').addEventListener('click',()=>{
      if(!versions.length)return;
      approved={id:versions[selected].id,versionId:`visual-v${versions[selected].id}`,at:new Date().toISOString()};
      $('approval-dialog').close();go('approved');
    });
    $('compare').addEventListener('click',()=>{$('comparison').hidden=!$('comparison').hidden;renderComparison()});
    document.querySelectorAll('.quick-actions [data-change]').forEach(b=>b.addEventListener('click',()=>{
      const v=versions[selected]?.design; if(!v)return;
      applyInputs(v);
      const field=b.dataset.change;
      if(field==='finish')$('finish').value=v.finish==='natural'?'honey':v.finish==='honey'?'walnut':'natural';
      if(field==='baseStyle')$('base-style').value=v.baseStyle==='curved-ring'?'curved-open':'curved-ring';
      if(field==='topThickness')$('top-thickness-mm').value=v.topThickness===20?'30':v.topThickness===30?'40':'20';
      createVersion(readInputs());
    }));
    $('lang').addEventListener('click',()=>setLanguage(lang==='he'?'en':'he'));
    setLanguage('he');go('intro');
  }
  function setLanguage(next){lang=next; document.documentElement.lang=next;document.documentElement.dir=next==='he'?'rtl':'ltr';
    document.querySelectorAll('[data-he][data-en]').forEach(n=>{n.textContent=n.dataset[next]});
    $('lang').textContent=next==='he'?'EN':'עברית';$('photo').setAttribute('aria-label',next==='he'?'צילום חלל במצלמה':'Take room photo');$('gallery').setAttribute('aria-label',next==='he'?'העלאת תמונה מהגלריה':'Upload room image');
    if(stage==='capture')renderRoom('capture-scene');if(stage==='configure')renderRoom('config-scene',readInputs());if(stage==='review')renderReview();if(stage==='approved')renderApproved();
  }
  function go(next){if(stage==='capture'&&next!=='capture')stopCamera();stage=next;screens.forEach(id=>$(id).hidden=id!==next);
    document.querySelectorAll('.progress-step').forEach(el=>{el.classList.toggle('active',el.dataset.phase==='1')});
    if(next==='configure')renderRoom('config-scene',readInputs());
    if(next==='review')renderReview();if(next==='approved')renderApproved();
    window.scrollTo({top:0,behavior:'instant'});
    if(next!=='intro')$(next).querySelector('h1')?.focus?.();
  }
  function showError(id,msg){$(id).textContent=msg;$(id).hidden=false}
  function clearError(id){$(id).hidden=true;$(id).textContent=''}
  function chooseRoom(kind,url=null){
    if(roomUrl)URL.revokeObjectURL(roomUrl);
    roomUrl=url;roomKind=kind;versions=[];selected=0;approved=null;
    $('capture-next').disabled=false;clearError('capture-error');
    renderRoom('capture-scene');
    renderRoom('config-scene',readInputs());
    $('photo').value='';$('gallery').value='';
  }
  async function openCamera(){
    clearError('capture-error');
    if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia){
      showError('capture-error',lang==='he'?'המצלמה דורשת פתיחה ב־HTTPS ודפדפן תומך. ניתן לצלם דרך המכשיר או להעלות תמונה.':'Live camera requires HTTPS and a supported browser. Use device camera or gallery instead.');return;
    }
    stopCamera();
    try{
      cameraStream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'}}});
      if(stage!=='capture'){stopCamera();return;}
      const video=$('camera-preview');video.srcObject=cameraStream;$('live-camera-panel').hidden=false;
      await video.play().catch(()=>{});
    }catch(err){stopCamera();const denied=['NotAllowedError','PermissionDeniedError'].includes(err?.name);
      showError('capture-error',denied?(lang==='he'?'לא התקבלה הרשאה למצלמה. אפשר לאשר ב־Chrome או להעלות תמונה.':'Camera permission was denied. You can enable it in Chrome or upload a photo.'):(lang==='he'?'לא ניתן לפתוח מצלמה במכשיר זה. אפשר לצלם דרך המכשיר או להעלות תמונה.':'Camera unavailable. Use the device camera or gallery instead.'));
    }
  }
  function stopCamera(){if(cameraStream){cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null;}const video=$('camera-preview');video.pause();video.srcObject=null;$('live-camera-panel').hidden=true;}
  function takePhoto(){const video=$('camera-preview');if(!cameraStream||!video.videoWidth||!video.videoHeight){showError('capture-error',lang==='he'?'המצלמה עדיין לא מוכנה לצילום.':'Camera is not ready yet.');return;}
    const canvas=document.createElement('canvas');const scale=Math.min(1,1600/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
    canvas.toBlob(blob=>{if(!blob){showError('capture-error',lang==='he'?'לא הצלחנו לשמור את התמונה.':'Could not capture photo.');return;}
      const url=URL.createObjectURL(blob);const img=new Image();img.onload=()=>{stopCamera();chooseRoom('photo',url)};img.onerror=()=>{URL.revokeObjectURL(url);showError('capture-error',lang==='he'?'שגיאה בקובץ הצילום.':'Photo decode error.')};img.src=url;
    },'image/jpeg',.88);
  }
  function onFileChange(e){const f=e.target.files?.[0];if(!f)return;
    if(!f.type.startsWith('image/')||f.size>10*1024*1024){showError('capture-error',t('invalidImage'));e.target.value='';return}
    const newUrl=URL.createObjectURL(f);const img=new Image();
    img.onload=()=>chooseRoom('photo',newUrl);
    img.onerror=()=>{URL.revokeObjectURL(newUrl);showError('capture-error',t('invalidImage'));};
    img.src=newUrl;
  }
  function readInputs(){return {finish:$('finish').value,baseStyle:$('base-style').value,diameter:Number($('diameter-cm').value),height:Number($('height-cm').value),topThickness:Number($('top-thickness-mm').value),measure:$('measure').value,scale:Number($('scale').value),position:Number($('position').value),description:$('description').value.trim().slice(0,500)}}
  function applyInputs(d){$('finish').value=d.finish;$('base-style').value=d.baseStyle;$('diameter-cm').value=d.diameter;$('height-cm').value=d.height;$('top-thickness-mm').value=d.topThickness;$('measure').value=d.measure;$('scale').value=d.scale;$('position').value=d.position;$('description').value=d.description||''}
  function onGenerate(e){e.preventDefault();if(!roomKind){go('capture');return showError('capture-error',t('needImage'))}
    const d=readInputs();if(!Number.isInteger(d.diameter)||!Number.isInteger(d.height)||d.diameter<40||d.diameter>90||d.height<30||d.height>70||![20,30,40].includes(d.topThickness))return showError('design-error',t('invalidDimensions'));
    clearError('design-error');createVersion(d);
  }
  function createVersion(d){const oldApproved=approved;versions.push({id:versions.length+1,design:{...d},roomKind,created:new Date().toISOString()});selected=versions.length-1;approved=null;
    $('comparison').hidden=true;go('review');
    if(oldApproved) $('design-summary').setAttribute('title',t('modified'));
  }
  function usesReferencePhoto(d){
    // A photographic example is displayed only for the unchanged default
    // round-table preset. Every edited option returns to the live SVG schematic.
    return d && d.finish==='natural' && d.baseStyle==='curved-ring' &&
      d.diameter===62 && d.height===45 && d.topThickness===30 &&
      d.scale===88 && d.position===52;
  }
  function paintRoom(root,design){
    const reference=roomKind==='demo'&&usesReferencePhoto(design);
    root.dataset.roomKind=roomKind||'none';
    root.dataset.referencePhoto=String(!!reference);
    const photo=root.querySelector('.room-photo');
    if(photo){
      photo.hidden=roomKind!=='photo';
      if(roomKind==='photo'&&roomUrl)photo.src=roomUrl;
      else photo.removeAttribute('src');
    }
    const mount=root.querySelector('.furniture-mount');
    if(mount){
      mount.hidden=!design||reference;
      if(design){
        mount.innerHTML=coffeeTableSvg(design);
        mount.style.left=`${design.position}%`;
        mount.style.width=`${Math.round(design.scale*.50)}%`;
      }
    }
    const label=root.querySelector('.scene-corner-label');
    if(label&&roomKind)
      label.textContent=roomKind==='photo'?t('photo'):
        reference?t('demoReference'):design?t('demoSchematic'):t('demo');
  }
  function renderRoom(targetId,design){
    const root=$(targetId);if(root)paintRoom(root,design);
  }
  function coffeeTableSvg(d){
  const p=palettes[d.finish]||palettes.natural;
  const diameter=Number.isFinite(d.diameter)?Math.max(40,Math.min(90,d.diameter)):62;
  const height=Number.isFinite(d.height)?Math.max(30,Math.min(70,d.height)):45;
  const tabletop=([20,30,40].includes(d.topThickness)?d.topThickness:30);
  const horizontal=(0.79+(diameter-40)*0.0072).toFixed(3);
  const vertical=(0.84+(height-30)*0.0075).toFixed(3);
  const rim=tabletop===20?14:tabletop===30?20:26;
  const ring=d.baseStyle==='curved-open'?'':`<ellipse cx="175" cy="252" rx="77" ry="22" fill="none" stroke="#262a2b" stroke-width="10"/><path d="M98 252 Q175 290 252 252" fill="none" stroke="#525a5c" stroke-width="3"/>`;
  return `<svg viewBox="0 0 360 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-furniture="round-coffee-table" data-base-style="${d.baseStyle==='curved-open'?'curved-open':'curved-ring'}"><ellipse cx="175" cy="363" rx="130" ry="20" fill="#221e1b" opacity=".14"/><g transform="translate(175 0) scale(${horizontal} 1) translate(-175 0)"><g transform="translate(0 146) scale(1 ${vertical}) translate(0 -146)"><path d="M160 150 Q154 213 169 342 L188 344 Q194 228 189 150 Z" fill="#303536" stroke="#212525" stroke-width="3"/><path d="M101 153 Q102 245 55 347 L77 350 Q132 247 133 155 Z" fill="#353a3b" stroke="#212525" stroke-width="4"/><path d="M224 155 Q228 249 272 348 L294 344 Q258 236 256 153 Z" fill="#353a3b" stroke="#212525" stroke-width="4"/><path d="M125 153 Q140 237 111 336 L130 338 Q161 241 150 152 Z" fill="#272d2f" stroke="#212525" stroke-width="3" opacity=".9"/><path d="M200 153 Q190 239 221 336 L242 336 Q218 235 223 150 Z" fill="#272d2f" stroke="#212525" stroke-width="3" opacity=".9"/>${ring}</g><path d="M44 112 Q44 ${112+rim} 175 ${113+rim} Q306 ${112+rim} 306 112 L306 128 Q306 ${131+rim} 175 ${132+rim} Q44 ${131+rim} 44 128 Z" fill="${p.edge}" stroke="${p.line}" stroke-width="3"/><ellipse cx="175" cy="112" rx="132" ry="46" fill="${p.top}" stroke="${p.line}" stroke-width="4"/><path d="M93 99 Q150 76 216 107 T270 113" fill="none" stroke="${p.line}" stroke-width="2.5" opacity=".35"/><path d="M83 118 Q141 147 225 126" fill="none" stroke="${p.front}" stroke-width="3" opacity=".45"/></g></svg>`;
}

  function renderReview(){if(!versions.length)return;const v=versions[selected];renderRoom('result-scene',v.design);$('current-label').textContent=`V${v.id}`;
    const list=$('versions');list.replaceChildren();versions.forEach((ver,i)=>{const b=document.createElement('button');b.type='button';b.className=i===selected?'selected':'';b.textContent=`V${ver.id}`;b.setAttribute('aria-pressed',String(i===selected));b.addEventListener('click',()=>{selected=i;applyInputs(versions[i].design);renderReview()});list.append(b)});
    const d=v.design;const rows=[[t('finish'),t(d.finish)],[t('base'),t(d.baseStyle)],[t('dimensions'),`${t('diameter')} ${d.diameter} cm · ${t('height')} ${d.height} cm`],[t('topThickness'),d.topThickness+' mm'],[t('confidence'),t(d.measure)],[t('note'),d.description||t('noNote')]];
    const summary=$('design-summary');summary.replaceChildren();rows.forEach(([k,val])=>{const row=document.createElement('div');const strong=document.createElement('strong');strong.textContent=k+': ';row.append(strong,document.createTextNode(val));summary.append(row)});
    if(!$('comparison').hidden)renderComparison();
  }
  function renderComparison(){const cmp=$('comparison');cmp.replaceChildren();if(cmp.hidden||versions.length<2){if(!cmp.hidden){const p=document.createElement('p');p.textContent=t('noEarlier');cmp.append(p)}return}
    const current=versions[selected],prior=versions[selected===0?1:selected-1];[[prior,t('comparePrev')],[current,t('compareCurrent')]].forEach(([v,title])=>{
      const box=document.createElement('div');const heading=document.createElement('strong');heading.textContent=`${title} · V${v.id}`;box.append(heading);
      const scene=document.createElement('div');scene.className='scene scene-demo';scene.innerHTML='<div class="wall-corner"></div><div class="floor-line"></div><img class="room-photo" alt="" hidden><div class="furniture-mount"></div>';
      paintRoom(scene,v.design);box.append(scene);cmp.append(box);
    });
  }
  function renderApproved(){if(!approved)return;$('approved-detail').textContent=`${t('approved')} V${approved.id}`;
    const a=$('approval-record');a.replaceChildren();const lines=[`approval: VISUAL_APPROVED`,`approved_visual_version_id: ${approved.versionId}`,`approved_at: ${approved.at}`,`server_submission: false`,`next_stage: NOT_IMPLEMENTED`];lines.forEach(s=>{const div=document.createElement('div');div.textContent=s;a.append(div)});
  }
  window.addEventListener('pagehide',()=>{stopCamera();if(roomUrl)URL.revokeObjectURL(roomUrl)});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera()});
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('install-app').hidden=false});
  window.addEventListener('appinstalled',()=>{$('install-app').hidden=true;installPrompt=null});
  document.addEventListener('click',async event=>{if(event.target?.id!=='install-app'||!installPrompt)return;
    const prompt=installPrompt;installPrompt=null;$('install-app').hidden=true;await prompt.prompt();await prompt.userChoice;
  });
  if('serviceWorker' in navigator && location.protocol.startsWith('http')){
    window.addEventListener('load',async()=>{
      try{const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
        const showWaiting=()=>{if(registration.waiting && navigator.serviceWorker.controller){waitingWorker=registration.waiting;$('update-banner').hidden=false;}};
        showWaiting();registration.addEventListener('updatefound',()=>{const worker=registration.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed')showWaiting()})});
        navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload());
        document.getElementById('apply-update').addEventListener('click',()=>waitingWorker?.postMessage({type:'SKIP_WAITING'}));
        document.addEventListener('visibilitychange',()=>{if(!document.hidden)registration.update().catch(()=>{})});
      }catch(err){/* PWA remains usable in a regular browser */}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
