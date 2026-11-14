/* ASSEMBL LAB MVP-02 — local concept design intent, no network or AI calls. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const snapshots = new Map();
  const limits = Object.freeze({
    preview: {width:[20,90], height:[20,100], depth:[25,60]},
    engineeringCandidate: {width:[30,65], height:[35,75], depth:[25,50]}
  });
  let approvedSnapshot = null;
  const he = () => document.documentElement.lang !== 'en';
  const text = (a,b) => he() ? a : b;
  function num(id) {
    const raw = $(id).value.trim();
    return raw === '' ? NaN : Number(raw);
  }
  function inside(value, range) {
    return Number.isFinite(value) && value >= range[0] && value <= range[1];
  }
  function dimensions() {
    return {width:num('width-cm'), height:num('height-cm'), depth:num('depth-cm')};
  }
  function within(fields, group) {
    return Object.entries(fields).every(([name,value])=>inside(value,limits[group][name]));
  }
  function designIntent() {
    const size = dimensions();
    const candidate = within(size,'engineeringCandidate');
    return {
      schema_version: 'ASSEMBL-LAB.DESIGN-INTENT.0.1',
      category: 'freestanding_nightstand',
      requested_dimensions_mm: {
        width: size.width * 10,
        height: size.height * 10,
        depth: size.depth * 10
      },
      dimension_confidence: $('measure').value,
      appearance: {
        finish: $('finish').value,
        drawers: Number($('drawers').value),
        lower_section: $('bottom').value,
        notes: $('description').value.trim().slice(0,500)
      },
      placement_preview: {
        relative_scale: Number($('scale').value),
        horizontal_position_percent: Number($('position').value)
      },
      construction_preferences: {
        material: 'birch_plywood',
        nominal_thickness_mm: 6,
        joining_method: 'finger_joints_candidate',
        construction_verified: false
      },
      engineering_candidate_envelope: candidate ? 'WITHIN_PROVISIONAL_LIMITS' : 'OUTSIDE_PROVISIONAL_LIMITS',
      lifecycle_status: 'VISUAL_CONCEPT_ONLY',
      engineering_approval: false,
      manufacturing_approval: false,
      photo_included: false
    };
  }
  function currentVersionId() {
    const match = ($('current-label')?.textContent || '').match(/V(\d+)/);
    return match ? Number(match[1]) : null;
  }
  function showStatus() {
    const el = $('nightstand-intent-status');
    if (!el) return;
    const size = dimensions();
    if (!within(size,'preview')) {
      el.textContent = text('יש להזין רוחב 20–90, גובה 20–100 ועומק 25–60 ס״מ.',
        'Enter width 20–90, height 20–100 and depth 25–60 cm.');
      return;
    }
    if (!within(size,'engineeringCandidate')) {
      el.textContent = text('ההדמיה מותרת, אך המידות מחוץ לטווח ההנדסי הראשוני המוצע. בהמשך תידרש בדיקה ידנית.',
        'Visual preview is allowed, but dimensions exceed the provisional engineering envelope and will need manual review.');
      return;
    }
    el.textContent = text('המידות נמצאות בטווח מועמד לתכנון. אין בכך אישור התאמה, חוזק או ייצור.',
      'Dimensions are inside a provisional engineering envelope. This is not validation of fit, strength or manufacture.');
  }
  function blockInvalidSubmission(event) {
    if (within(dimensions(),'preview')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const error = $('design-error');
    error.textContent = text('בדקו מידות: רוחב 20–90, גובה 20–100, עומק 25–60 ס״מ.',
      'Check dimensions: width 20–90, height 20–100, depth 25–60 cm.');
    error.hidden = false;
    showStatus();
  }
  function captureVersion() {
    const id = currentVersionId();
    if (!Number.isInteger(id) || id < 1 || !within(dimensions(),'preview')) return;
    snapshots.set(id, structuredClone(designIntent()));
  }
  function markApproved() {
    const id = currentVersionId();
    const snapshot = snapshots.get(id);
    approvedSnapshot = snapshot ? structuredClone(snapshot) : null;
    const btn = $('download-intent');
    if (btn) btn.hidden = !approvedSnapshot;
  }
  function exportApproved() {
    if (!approvedSnapshot) return;
    const id = currentVersionId();
    const lines = Array.from($('approval-record')?.children || []).map(el => el.textContent || '');
    const approvedAt = lines.find(line=>line.startsWith('approved_at: '))?.slice('approved_at: '.length) || null;
    const output = {
      ...approvedSnapshot,
      visual_version_id: 'visual-v' + id,
      visual_approval_recorded_at: approvedAt,
      export_type: 'LOCAL_DESIGN_INTENT_ONLY',
      generated_at: new Date().toISOString()
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(output,null,2)+'\n'],{type:'application/json'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assembl-lab-nightstand-v' + id + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  function init() {
    const form = $('design-form');
    if (!form || !$('depth-cm') || !$('download-intent')) return;
    form.addEventListener('submit',blockInvalidSubmission,true);
    form.addEventListener('submit',captureVersion);
    ['width-cm','height-cm','depth-cm','measure'].forEach(id=>$(id).addEventListener('input',showStatus));
    document.querySelectorAll('.quick-actions [data-change]').forEach(btn=>btn.addEventListener('click',captureVersion));
    $('confirm-approval').addEventListener('click',markApproved);
    $('download-intent').addEventListener('click',exportApproved);
    document.addEventListener('click',event=>{if (event.target?.id==='lang') showStatus()});
    showStatus();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
