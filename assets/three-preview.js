/* AL-016: optional shared design viewer. No library or model fetch before a click. */
(() => {
  'use strict';
  const library = new URL('vendor/model-viewer-4.1.0/model-viewer.min.js', document.currentScript.src).href;
  let modulePromise;
  const t = key => window.ASSEMBLE_I18N.t(`three.${key}`);
  for (const box of document.querySelectorAll('[data-three-preview][data-model-src]')) {
    const open = box.querySelector('[data-three-open]'), stage = box.querySelector('.three-stage'),
      poster = box.querySelector('.three-poster'), toolbar = box.querySelector('.three-toolbar'), status = box.querySelector('.three-status');
    let viewer = null, generation = 0, statusKey = '';
    function message(key) { statusKey = key; status.textContent = key ? t(key) : ''; }
    function restore(state, key, focus = false) {
      generation++; viewer?.remove(); viewer = null; stage.replaceChildren(); stage.hidden = true;
      poster.hidden = false; toolbar.hidden = true; open.disabled = false;
      open.setAttribute('aria-expanded', 'false'); box.dataset.state = state; message(key);
      if (focus) open.focus();
    }
    function backToPhotos() { restore('idle', ''); const gallery = document.querySelector('.gallery'); if (gallery) { gallery.scrollIntoView({block:'center', behavior:'instant'}); gallery.focus({preventScroll:true}); } else open.focus(); }
    box.querySelector('[data-three-close]').addEventListener('click', backToPhotos);
    open.disabled = false;
    open.addEventListener('click', async () => {
      const attempt = ++generation;
      box.dataset.state = 'loading'; open.disabled = true; open.setAttribute('aria-expanded', 'true');
      box.querySelector('[data-three-close]').hidden = false; toolbar.hidden = false;
      toolbar.querySelectorAll('[data-three-action]').forEach(b => b.disabled = true);
      message('loading');
      let timer;
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!context) throw new Error('WebGL unavailable');
        context.getExtension('WEBGL_lose_context')?.loseContext();
        modulePromise ||= import(library).catch(error => { modulePromise = null; throw error; });
        await Promise.race([modulePromise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('library timeout')), 25000); })]);
        clearTimeout(timer);
        if (attempt !== generation) return;
        viewer = document.createElement('model-viewer');
        viewer.setAttribute('camera-controls', ''); viewer.setAttribute('touch-action', 'pan-y');
        viewer.setAttribute('interaction-prompt', 'none'); viewer.setAttribute('camera-orbit', '35deg 70deg auto');
        viewer.setAttribute('min-camera-orbit', 'auto 5deg 0.1m'); viewer.setAttribute('max-camera-orbit', 'auto 175deg 10m');
        viewer.setAttribute('min-field-of-view', '20deg'); viewer.setAttribute('max-field-of-view', '60deg');
        viewer.setAttribute('field-of-view', '45deg'); viewer.setAttribute('alt', t('alt'));
        const ready = new Promise((resolve, reject) => {
          viewer.addEventListener('load', resolve, {once: true});
          viewer.addEventListener('error', () => { if (attempt === generation) restore('error', 'error'); reject(new Error('model load error')); }, {once: true});
          timer = setTimeout(() => reject(new Error('model timeout')), 30000);
        });
        viewer.src = box.dataset.modelSrc; stage.replaceChildren(viewer); stage.hidden = false;
        await ready; clearTimeout(timer);
        if (attempt !== generation) return;
        poster.hidden = true; box.dataset.state = 'ready';
        toolbar.querySelectorAll('[data-three-action]').forEach(b => b.disabled = false);
        message('ready'); viewer.focus();
      } catch (_) { clearTimeout(timer); if (attempt === generation) restore('error', 'error'); }
    });
    for (const button of toolbar.querySelectorAll('[data-three-action]')) button.addEventListener('click', () => {
      if (!viewer?.loaded) return;
      const action = button.dataset.threeAction, orbit = viewer.getCameraOrbit();
      let theta = orbit.theta * 180 / Math.PI, phi = orbit.phi * 180 / Math.PI, radius = orbit.radius;
      if (action === 'reset') { viewer.cameraOrbit = '35deg 70deg auto'; viewer.fieldOfView = '45deg'; viewer.cameraTarget = 'auto auto auto'; }
      else {
        if (action === 'left') theta -= 30;
        if (action === 'right') theta += 30;
        if (action === 'up') phi = Math.max(5, phi - 20);
        if (action === 'down') phi = Math.min(175, phi + 20);
        if (action === 'in') radius = Math.max(.1, radius * .8);
        if (action === 'out') radius = Math.min(10, radius * 1.25);
        viewer.cameraOrbit = `${theta}deg ${phi}deg ${radius}m`;
      }
      viewer.jumpCameraToGoal();
    });
    box.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); backToPhotos(); } });
    document.addEventListener('assemble:languagechange', () => { message(statusKey); viewer?.setAttribute('alt', t('alt')); });
  }
})();
