/* APP MVP-28: marketing snapshot and development app are different URLs/byte copies. */
(()=>{'use strict';
  const gate=document.getElementById('app-mode-chooser');
  const marketing=document.getElementById('mode-marketing-link');
  const develop=document.getElementById('mode-enter-development');
  const switcher=document.getElementById('mode-switch');
  const langButton=document.getElementById('mode-lang');
  if(!gate||!marketing||!develop||!switcher||!langButton)return;
  const locale=()=>document.documentElement.lang==='en'?'en':'he';
  const inertElements=[
    document.querySelector('header.app-header'),
    document.querySelector('.progress'),
    document.querySelector('main#app'),
    document.querySelector('footer'),
    document.querySelector('#update-banner')
  ].filter(Boolean);
  function setGateLanguage(){
    langButton.textContent=locale()==='he'?'EN':'עברית';
  }
  function setGate(open){
    gate.hidden=!open;
    document.body.classList.toggle('mode-gate-open',open);
    inertElements.forEach(el=>{el.inert=open});
    switcher.hidden=open;
    if(open){
      marketing.focus({preventScroll:true});
    }
  }
  function enterDevelopment(){
    try{sessionStorage.setItem('assembl-lab-selected-mode','development')}catch{}
    setGate(false);
    document.getElementById('start')?.focus({preventScroll:true});
  }
  function showChoice(){
    try{sessionStorage.removeItem('assembl-lab-selected-mode')}catch{}
    setGate(true);
    setGateLanguage();
  }
  const params=new URLSearchParams(location.search);
  let selected=false;
  try{selected=sessionStorage.getItem('assembl-lab-selected-mode')==='development'}catch{}
  // Direct development links are for QA/bookmarks; normal /app/ asks for a mode.
  if(params.get('mode')==='development'||selected)enterDevelopment();
  else showChoice();
  develop.addEventListener('click',enterDevelopment);
  switcher.addEventListener('click',showChoice);
  langButton.addEventListener('click',()=>{
    // Reuse the app's existing bilingual switch; there is a single locale state.
    document.getElementById('lang')?.click();
    setGateLanguage();
  });
})();
