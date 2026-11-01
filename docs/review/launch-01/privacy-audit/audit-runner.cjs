const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const {chromium}=require('playwright');
const OUT=__dirname;
const sites=['assembl-lab-site','wood-u-like-site'];
const meta={task:'PRIVACY-AUDIT-01',started:new Date().toISOString(),scope:'local unless explicitly public',commits:Object.fromEntries(sites.map(s=>[s,cp.execFileSync('git',['-C','/workspace/'+s,'rev-parse','HEAD'],{encoding:'utf8'}).trim()]))};
const network={...meta,consoleErrors:[],pageErrors:[],requests:[],public:[],guards:[],static:[]},storage={...meta,observations:[],behavior:[]},forms={...meta,cases:[]},a11y={...meta,cases:[]};
function save(){for(const [name,data] of Object.entries({NETWORK_AUDIT:network,STORAGE_AUDIT:storage,FORM_QA:forms,ACCESSIBILITY_QA:a11y}))fs.writeFileSync(`${OUT}/${name}.json`,JSON.stringify(data,null,2)+'\n');}
function clean(u){try{const x=new URL(u);return x.origin+x.pathname+(x.search?'?[REDACTED]':'')}catch{return '[invalid URL]'}}
function result(arr,test,ok,extra={}){arr.push({test,status:ok?'PASS':'FAIL',...extra});save()}
function pages(site){return cp.execFileSync('git',['-C','/workspace/'+site,'ls-files'],{encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('index.html')&&!/^(docs|tests|QA_EVIDENCE)\//.test(f)).map(f=>f.replace(/index.html$/,''))}
function api(site){return site.startsWith('wood')?'WUL_I18N':'ASSEMBLE_I18N'}
async function lang(p,site,l){await p.evaluate(({a,l})=>window[a].setLanguage(l),{a:api(site),l})}
async function snap(p,c){return {...await p.evaluate(async()=>({localStorage:Object.fromEntries(Object.entries(localStorage)),sessionStorage:Object.fromEntries(Object.entries(sessionStorage)),indexedDB:(await indexedDB.databases()).map(x=>({name:x.name,version:x.version})),cacheStorage:await caches.keys(),serviceWorkers:(await navigator.serviceWorker.getRegistrations()).map(x=>({scope:x.scope})),registrationAttempts:window.__swAttempts||[],frames:[...document.querySelectorAll('iframe')].map(x=>x.getAttribute('src'))})),cookies:(await c.cookies()).map(({name,domain,path,secure,httpOnly,sameSite,expires})=>({name,domain,path,secure,httpOnly,sameSite,expires}))}}
(async()=>{
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
async function context(site,opts={},scenario=null){
 const c=await b.newContext({...opts,serviceWorkers:'allow'}),guard={site,scenario,blockedWrites:0,mockedWrites:0,passedWrites:0,webSocketsBlocked:0};network.guards.push(guard);
 await c.addInitScript(()=>{window.__swAttempts=[];if(navigator.serviceWorker)navigator.serviceWorker.register=async(...a)=>{window.__swAttempts.push(String(a[0]));throw new Error('Audit blocks service worker registration')};});
 await c.routeWebSocket('**/*',ws=>{guard.webSocketsBlocked++;ws.close()});
 let count=0;
 await c.route('**/*',async r=>{
  const q=r.request(),u=new URL(q.url()),method=q.method(),local=u.origin==='http://127.0.0.1:8001';
  if(!['GET','HEAD'].includes(method)){
   if(scenario&&u.origin==='https://formspree.io'&&method==='POST'){
    guard.mockedWrites++;count++;
    if(scenario==='timeout'||scenario==='duplicate')return;
    if(scenario==='network')return r.abort('failed');
    return r.fulfill({status:scenario==='422'?422:scenario==='500'?500:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:scenario==='malformed'?'not json':scenario==='unacknowledged'?'{}':'{"ok":true}'});
   }
   guard.blockedWrites++;return r.abort('blockedbyclient');
  }
  if(scenario&&site.startsWith('wood')&&u.pathname.endsWith('/contact-config.js')){
   const original=fs.readFileSync('/workspace/'+site+'/inquiry/contact-config.js','utf8');
   return r.fulfill({contentType:'application/javascript',body:original.replace('formDestinationApproved: false','formDestinationApproved: true').replace('privacyApproved: false','privacyApproved: true')});
  }
  if(local||opts.proxy)return r.continue();
  return r.abort('blockedbyclient');
 });
 c.on('page',p=>{p.on('console',m=>{if(m.type()==='error')network.consoleErrors.push({site,scope:opts.proxy?'public':'local',scenario,text:m.text().replace(/https?:\/\/[^ ]+/g,'[URL]')})});p.on('pageerror',e=>network.pageErrors.push({site,scenario,message:e.message}))});
 c.on('request',q=>{const u=new URL(q.url());network.requests.push({site,scope:opts.proxy?'public':'local',url:clean(q.url()),domain:u.hostname,method:q.method(),type:q.resourceType(),party:u.hostname==='127.0.0.1'||u.hostname==='mataniar0.github.io'?'first-party':'third-party',transmission:!['GET','HEAD'].includes(q.method())?'intercepted; not transmitted':'read request; URL/transport metadata if delivered'})});
 c.on('response',r=>{const q=r.request();const row=network.requests.findLast(x=>x.site===site&&x.url===clean(r.url())&&x.method===q.method());if(row)row.status=r.status()});
 c.on('requestfailed',q=>{const row=network.requests.findLast(x=>x.site===site&&x.url===clean(q.url())&&x.method===q.method());if(row)row.failure=q.failure()?.errorText});
 return {c,guard,count:()=>count};
}
// Guard self-test happens before any production-like interaction.
{const x=await context(sites[0]);const p=await x.c.newPage();await p.goto('http://127.0.0.1:8001/assembl-lab-site/');await p.evaluate(()=>fetch('https://formspree.io/f/auditguard',{method:'POST',body:'synthetic'}).catch(()=>{}));result(forms.cases,'write interception self-test',x.guard.blockedWrites===1,{scope:'harness'});await x.c.close()}
for(const site of sites){
 const root='/workspace/'+site,files=cp.execFileSync('git',['-C',root,'ls-files'],{encoding:'utf8'}).trim().split('\n').filter(f=>/\.(html|js|css)$/.test(f)&&! /^(docs|tools|scripts|tests|QA_EVIDENCE)\//.test(f));
 network.static.push({site,files:files.map(f=>({file:f,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')})),externalReferences:files.flatMap(f=>{const text=fs.readFileSync(path.join(root,f),'utf8');return [...new Set(text.match(/https?:\/\/[^\s"'<>`\\)]+/g)||[])].map(url=>({file:f,url:clean(url)}))}),trackingSignatures:files.flatMap(f=>/google-analytics|googletagmanager|connect\.facebook|fbq\(|gtag\(/i.test(fs.readFileSync(path.join(root,f),'utf8'))?[f]:[])});
 for(const route of ['', 'inquiry/', site.startsWith('wood')?'products/welcome/':'geometric/',site.startsWith('wood')?'collections/home-decor/':'table/'])for(const l of ['he','en']){
  const x=await context(site,{proxy:{server:process.env.HTTPS_PROXY||'http://proxy:8080'}}),p=await x.c.newPage();
  try{const r=await p.goto(`https://mataniar0.github.io/${site}/${route}`,{timeout:15000});if(!r.ok())throw Error('HTTP '+r.status());await lang(p,site,l);network.public.push({site,route,language:l,status:'PASS',http:r.status(),deploymentCommit:'UNVERIFIED'});}catch(e){network.public.push({site,route,language:l,status:'BLOCKED',error:String(e.message).split('\n')[0],deploymentCommit:'UNVERIFIED'});}await x.c.close();save();
 }
 const x=await context(site),p=await x.c.newPage();p.setDefaultTimeout(5000);
 for(const route of pages(site)){
  await p.goto(`http://127.0.0.1:8001/${site}/${route}`);await p.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager'});await p.waitForTimeout(100);
  storage.observations.push({site,route,stage:'first load',...await snap(p,x.c)});
  for(const l of ['he','en']){
   await lang(p,site,l);
   for(const width of [320,390,768,1024,1440]){
    await p.setViewportSize({width,height:900});await p.waitForTimeout(35);
    const state=await p.evaluate(()=>({lang:document.documentElement.lang,dir:document.documentElement.dir,scrollWidth:document.documentElement.scrollWidth,innerWidth,smallText:[...document.querySelectorAll('p,label,button')].filter(e=>e.getBoundingClientRect().height&&parseFloat(getComputedStyle(e).fontSize)<12).length}));
    result(a11y.cases,'viewport/language/overflow',state.lang===l&&state.dir===(l==='he'?'rtl':'ltr')&&state.scrollWidth<=width+1,{site,route,language:l,width,...state});
    if(route==='inquiry/'&&[320,1440].includes(width))await p.screenshot({path:`${OUT}/screenshots/${site}-${l}-${width}.png`,fullPage:true,mask:[p.locator('input,textarea,a[href^="mailto:"],#privacy-copy')]});
   }
   await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const violations=await p.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})));
   result(a11y.cases,'axe WCAG A/AA',violations.length===0,{site,route,language:l,violations});
   await p.keyboard.press('Tab');const focus=await p.evaluate(()=>({tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineStyle}));result(a11y.cases,'keyboard tab reaches control',focus.tag!=='BODY',{site,route,language:l,...focus});
  }
  storage.observations.push({site,route,stage:'after language switch',...await snap(p,x.c)});
 }
 await p.reload();storage.behavior.push({site,test:'reload after English selection',language:await p.locator('html').getAttribute('lang'),...await snap(p,x.c)});
 if(site.startsWith('wood')){await p.goto(`http://127.0.0.1:8001/${site}/?utm_source=audit&utm_campaign=privacy`);storage.behavior.push({site,test:'synthetic campaign capture',...await snap(p,x.c)});await p.goto(`http://127.0.0.1:8001/${site}/inquiry/`);storage.behavior.push({site,test:'campaign consumed at inquiry',...await snap(p,x.c)});await p.reload();storage.behavior.push({site,test:'consumed campaign reload',campaign:await p.evaluate(()=>window.WUL_ATTRIBUTION),...await snap(p,x.c)})}
 await x.c.close();
 // Form scenarios: intercepted in-memory response only. Production flags never modified on disk.
 for(const l of ['he','en'])for(const scenario of ['production','success','422','500','network','malformed','unacknowledged','timeout','duplicate']){
  const x=await context(site,{},scenario==='production'?null:scenario),p=await x.c.newPage();p.setDefaultTimeout(5000);await p.goto(`http://127.0.0.1:8001/${site}/inquiry/`);await lang(p,site,l);
  const w=site.startsWith('wood'),contact=w?'#contact':'#customer-contact';
  if(scenario==='production'){
   const privacy=await p.locator('#privacy-notice').count();result(forms.cases,'privacy notice present',!!privacy,{site,language:l,scope:'local unmodified configuration'});
   if(w){const flags=await p.evaluate(()=>({formDestinationApproved:WUL_CONTACT.formDestinationApproved,privacyApproved:WUL_CONTACT.privacyApproved,contactDetailsApproved:WUL_CONTACT.contactDetailsApproved}));result(forms.cases,'three production flags remain false',Object.values(flags).every(v=>v===false),{site,language:l,flags});}
  }
  if(scenario==='timeout')await p.clock.install();
  if(scenario==='success'||scenario==='production'){
   await p.locator('#inquiry-form').evaluate(f=>f.requestSubmit());
   const invalid=await p.evaluate(()=>({invalid:!!document.querySelector(':invalid'),statusText:document.querySelector('#inquiry-status').textContent,focus:document.activeElement.id}));
   result(forms.cases,'required field validation without transmission',x.count()===0&&(w&&scenario==='production'||invalid.invalid),{site,language:l,scenario,...invalid});
  }
  await p.locator('#product').selectOption(w?'welcome':'geometric');await p.locator('#customer-name').fill('Synthetic QA');await p.locator(contact).fill('audit@example.invalid');await p.locator('#quantity').fill('2');
  await p.locator('#inquiry-form').evaluate(f=>f.requestSubmit());
  if(scenario==='timeout'||scenario==='duplicate'){
   await p.waitForFunction(()=>document.querySelector('#inquiry-form').getAttribute('aria-busy')==='true');await p.waitForTimeout(50);
   if(scenario==='duplicate'){await p.locator('#inquiry-form').evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));result(forms.cases,'pending duplicate prevented',x.count()===1,{site,language:l,mockedPosts:x.count()})}
   else{await p.clock.fastForward(12001);await p.clock.resume()}
  }
  let status='';
  if(scenario!=='duplicate'&&!(w&&scenario==='production')){await p.waitForFunction(()=>['success','error'].includes(document.querySelector('#inquiry-status').dataset.state),null,{timeout:5000});status=await p.locator('#inquiry-status').getAttribute('data-state')}
  const expect=w&&scenario==='production'?'':scenario==='success'?'success':scenario==='duplicate'?'':'error';
  result(forms.cases,scenario==='production'?'unapproved production configuration does not attempt submission':'form '+scenario,scenario==='production'?x.guard.blockedWrites===0&&x.count()===0:scenario==='duplicate'?x.count()===1:status===expect,{site,language:l,statusObserved:status,mockedPosts:x.count(),blockedWrites:x.guard.blockedWrites,scope:scenario==='production'?'local original config; writes blocked':'local response/config mock'});
  const before=await p.locator('#inquiry-status').innerText();await lang(p,site,l==='he'?'en':'he');const after=await p.locator('#inquiry-status').innerText();
  if(before)result(forms.cases,'status changes with language',before!==after,{site,language:l,scenario});
  storage.behavior.push({site,test:'filled form '+scenario,language:l,...await snap(p,x.c)});
  await p.reload();result(forms.cases,'form draft not persisted on reload',(await p.locator('#customer-name').inputValue())==='',{site,language:l,scenario});
  await x.c.close();
 }
 const nj=await context(site,{javaScriptEnabled:false}),q=await nj.c.newPage();await q.goto(`http://127.0.0.1:8001/${site}/inquiry/`);
 const facts=await q.locator('#inquiry-form').evaluate(f=>({action:f.getAttribute('action'),method:f.method,submitVisible:!![...f.querySelectorAll('[type=submit]')].find(e=>e.getBoundingClientRect().height&&!e.disabled),visibleInputs:[...f.querySelectorAll('input')].filter(e=>e.getBoundingClientRect().height&&!e.disabled).length}));
 result(forms.cases,'no-JS ordinary UI cannot submit',!facts.submitVisible&&(facts.visibleInputs===0||facts.method==='get'),{site,...facts,scope:'local; programmatic submission unavailable to no-JS user'});await nj.c.close();
}
meta.finished=new Date().toISOString();save();await b.close();console.log(JSON.stringify({form:forms.cases.length,a11y:a11y.cases.length,failures:forms.cases.concat(a11y.cases).filter(x=>x.status==='FAIL'),public:network.public},null,2));
})().catch(e=>{save();console.error(e);process.exit(1)});
