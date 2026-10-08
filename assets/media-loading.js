/* Deferred carousel resources are promoted immediately when a stage is selected. */
(() => {
  function load(root) {
    root?.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      delete img.dataset.src;
    });
  }
  window.ASSEMBLE_MEDIA = Object.freeze({load});
  document.addEventListener('toggle', event => {
    if (event.target.matches('details[open]')) {
      load(event.target);
      event.target.querySelectorAll('img[loading="lazy"]').forEach(img => {img.loading = 'eager';});
    }
  }, true);
})();
