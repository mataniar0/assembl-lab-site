(() => {
  'use strict';
  const STORAGE_KEY = 'assemble-language';
  const common = {
    'nav.products': {he: 'מוצרים', en: 'Products'},
    'nav.about': {he: 'אודות', en: 'About'},
    'nav.custom': {he: 'התאמה אישית', en: 'Custom size'},
    'nav.back': {he: '← לכל המוצרים', en: '← All products'},
    'nav.home': {he: 'ASSEMBLE LAB — דף הבית', en: 'ASSEMBLE LAB — Home'},
    'cta.quote': {he: 'בקשת הצעת מחיר', en: 'Request a quote'},
    'cta.inquiry': {he: 'בירור והצעת מחיר', en: 'Inquire & request a quote'},
    'status.planning': {he: 'בתכנון ופיתוח', en: 'In development / Planning'},
    'image.open': {he: 'פתיחת התמונה בגודל מלא', en: 'View full-size image'},
    'footer.discipline': {he: 'עיצוב · הנדסה · ייצור', en: 'Design · Engineering · Fabrication'},
    'language.label': {he: 'בחירת שפה', en: 'Choose a language'},
    'stage.plan': {he: 'תכנון', en: 'Planning'},
    'stage.laser': {he: 'חיתוך בלייזר', en: 'Laser cutting'},
    'stage.components': {he: 'חלקים', en: 'Components'},
    'stage.assemble': {he: 'הרכבה', en: 'Assembly'},
    'stage.finish': {he: 'גימור', en: 'Finishing'},
    'stage.object': {he: 'המוצר', en: 'The object'},
    'carousel.previous': {he: 'התמונה הקודמת', en: 'Previous image'},
    'carousel.next': {he: 'התמונה הבאה', en: 'Next image'},
    'carousel.label': {he: 'שלבי התכנון והבנייה', en: 'Design and build stages'}
  };
  let lang = 'he';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'he' || saved === 'en') lang = saved;
  } catch (_) { /* Storage may be unavailable in private or restricted browsing. */ }
  let pageCatalog;
  function catalog() {
    if (pageCatalog) return pageCatalog;
    const source = document.getElementById('page-translations');
    if (!source) return common;
    pageCatalog = {...common, ...JSON.parse(source.textContent)};
    return pageCatalog;
  }
  function t(key, variables = {}) {
    const entry = catalog()[key];
    const template = entry && (entry[lang] ?? entry.he ?? entry.en);
    if (typeof template !== 'string') {
      console.warn('Missing translation:', key);
      return key;
    }
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) =>
      Object.hasOwn(variables, name) ? String(variables[name]) : match);
  }
  function applyDocumentLanguage() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }
  applyDocumentLanguage();
  function updateHeaderHeight() {
    const header = document.querySelector('header.header,header.top');
    if (header) document.documentElement.style.setProperty(
      '--site-header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
  }
  function translate() {
    applyDocumentLanguage();
    document.querySelectorAll('[data-i18n],[data-i18n-html]').forEach(node => {
      const value = t(node.dataset.i18n || node.dataset.i18nHtml);
      if (node.hasAttribute('data-i18n-html')) node.innerHTML = value;
      else node.textContent = value;
    });
    for (const attribute of ['alt', 'title', 'aria-label', 'placeholder', 'content']) {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(node =>
        node.setAttribute(attribute, t(node.getAttribute(`data-i18n-${attribute}`))));
    }
    const toolbar = document.querySelector('.language-switch');
    if (toolbar) {
      toolbar.setAttribute('aria-label', t('language.label'));
      toolbar.querySelectorAll('button[data-language]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.language === lang));
      });
    }
    updateHeaderHeight();
  }
  function setLanguage(next) {
    if (next !== 'he' && next !== 'en') return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    translate();
    document.dispatchEvent(new CustomEvent('assemble:languagechange', {bubbles: true, detail: {lang}}));
  }
  window.ASSEMBLE_I18N = Object.freeze({get lang() {return lang;}, t, translate, setLanguage});
  // Back/forward cache can restore a page without running this script again.
  // Reconcile its saved preference while retaining any draft or active slide.
  window.addEventListener('pageshow', () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if ((saved === 'he' || saved === 'en') && saved !== lang) setLanguage(saved);
    } catch (_) {}
  });
  // Keep an already-open page consistent when another tab changes the choice.
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY && (event.newValue === 'he' || event.newValue === 'en')
        && event.newValue !== lang) setLanguage(event.newValue);
  });
  function initialize() {
    const header = document.querySelector('header.header,header.top');
    if (header && !header.querySelector('.language-switch')) {
      const toolbar = document.createElement('div');
      toolbar.className = 'language-switch';
      toolbar.setAttribute('role', 'group');
      for (const [value, label] of [['he', 'עברית'], ['en', 'English']]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.language = value;
        button.lang = value;
        button.dir = value === 'he' ? 'rtl' : 'ltr';
        button.textContent = label;
        button.addEventListener('click', () => setLanguage(value));
        toolbar.append(button);
      }
      header.append(toolbar);
    }
    translate();
    // Inline carousel code executes before DOMContentLoaded and can use t().
    // Notify listeners after static text has been translated as well.
    document.dispatchEvent(new CustomEvent('assemble:languagechange', {bubbles: true, detail: {lang}}));
    if (header && typeof ResizeObserver !== 'undefined')
      new ResizeObserver(updateHeaderHeight).observe(header);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', initialize, {once: true});
  else initialize();
})();
