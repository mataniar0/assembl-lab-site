'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/review/launch-01/form-qa-02');fs.mkdirSync(out,{recursive:true});
const sha=cp.execFileSync('git',['rev-parse','3c405f361f3171ea26483c39838265bce1c58c97^{commit}'],{cwd:root,encoding:'utf8'}).trim();
const wulRoot='/workspace/wood-u-like-site',wulSha=cp.execFileSync('git',['-C',wulRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const meta={candidateSha:sha,wulSha,scope:'local browser unless explicitly public',started:new Date().toISOString(),browser:'system Chromium',runtimeSourceHashes:{}};
for(const file of ['inquiry/index.html','inquiry/inquiry.js','inquiry/contact-config.js','assets/language.js']){const body=fs.readFileSync(path.join(root,file));meta.runtimeSourceHashes[file]=crypto.createHash('sha256').update(body).digest('hex');const expected=cp.execFileSync('git',['show',sha+':'+file],{cwd:root});if(!body.equals(expected))throw Error('Candidate source differs: '+file)}
const matrix={...meta,cases:[]},reg={...meta,cases:[],privacy:[],guardContexts:[],pageErrors:[]};
function save(){for(const [n,d] of Object.entries({GATE_MATRIX:matrix,FORM_REGRESSION:reg}))fs.writeFileSync(path.join(out,n+'.json'),JSON.stringify(d,null,2)+'\n')}
function record(target,test,pass,details={}){target.push({...details,test,status:pass?'PASS':'FAIL',candidateSha:sha});save()}
const flags=['formDestinationApproved','privacyApproved','contactDetailsApproved'];
const baseConfig={formEndpoint:'https://formspree.io/f/qaformfixture',email:'fixture@example.invalid',whatsapp:'',formDestinationApproved:true,privacyApproved:true,contactDetailsApproved:true};
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});meta.browser=browser.version();matrix.browser=reg.browser=meta.browser;
async function setup({config,scenario='success',js=true,site='assembl-lab-site',publicProbe=false}={}){
 const c=await browser.newContext({javaScriptEnabled:js,serviceWorkers:'block',...(publicProbe?{proxy:{server:process.env.HTTPS_PROXY||'http://proxy:8080'}}:{})});
 const stats={site,scenario,blockedWrites:0,mockedPosts:0,passedWrites:0,blockedWebSockets:0,readFailures:[],payloadFieldNames:[]};reg.guardContexts.push(stats);
 let pending=[];await c.routeWebSocket('**/*',ws=>{stats.blockedWebSockets++;ws.close()});
 await c.route('**/*',async r=>{const q=r.request(),u=new URL(q.url());if(!['GET','HEAD'].includes(q.method())){
  if(config!==undefined&&u.origin==='https://formspree.io'&&q.method()==='POST'){
   stats.mockedPosts++;const body=q.postData()||'';stats.payloadFieldNames=[...new Set([...body.matchAll(/name="([^"]+)"/g)].map(m=>m[1]))];
   if(['timeout','duplicate','pending-language'].includes(scenario)){pending.push(r);return}
   if(scenario==='network')return r.abort('failed');
   return r.fulfill({status:scenario==='422'?422:scenario==='500'?500:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:scenario==='malformed'?'not json':scenario==='unacknowledged'?'{}':'{"ok":true}'});
  }
  stats.blockedWrites++;return r.abort('blockedbyclient');
 }
 if(config!==undefined&&u.pathname===`/${site}/inquiry/contact-config.js`){return r.fulfill({contentType:'application/javascript',body:'window.ASSEMBLE_CONTACT = '+JSON.stringify(config)+';'})}
 if(u.origin==='http://127.0.0.1:8001'||publicProbe)return r.continue();return r.abort('blockedbyclient');});
 c.on('page',p=>{p.on('pageerror',e=>reg.pageErrors.push({site,scenario,message:e.message}));p.on('requestfailed',q=>{if(q.method()==='GET')stats.readFailures.push({url:new URL(q.url()).origin+new URL(q.url()).pathname,error:q.failure()?.errorText})})});
 const p=await c.newPage();p.setDefaultTimeout(5000);
 return {c,p,stats,load:()=>p.goto(`${publicProbe?'https://mataniar0.github.io':'http://127.0.0.1:8001'}/${site}/inquiry/`,{timeout:15000}),complete:async()=>{for(const r of pending.splice(0))try{await r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"ok":true}'})}catch{}},close:()=>c.close()};
}
async function language(p,l,site='assembl-lab-site'){await p.evaluate(({l,site})=>window[site.startsWith('wood')?'WUL_I18N':'ASSEMBLE_I18N'].setLanguage(l),{l,site})}
async function fill(p){await p.locator('#product').selectOption('geometric');await p.locator('#customer-name').fill('Synthetic QA');await p.locator('#customer-contact').fill('fixture@example.invalid');await p.locator('#quantity').fill('2')}
async function submit(p){await p.locator('#inquiry-form').evaluate(f=>f.requestSubmit())}
async function waitState(p,state){await p.waitForFunction(s=>document.querySelector('#inquiry-status').dataset.state===s,state)}
// Negative self-test establishes the guard before application testing.
{const x=await setup();await x.load();await x.p.evaluate(()=>fetch('https://formspree.io/f/qaformfixture',{method:'POST',body:'synthetic'}).catch(()=>{}));record(reg.cases,'guard self-test blocks external write',x.stats.blockedWrites===1,{scope:'harness'});await x.close()}
const configs=[];
for(let n=0;n<8;n++){const f=Object.fromEntries(flags.map((k,i)=>[k,!!(n&(1<<i))]));configs.push({id:'boolean-'+n,config:{...baseConfig,...f},expected:n===7?'MOCK_ONLY':'BLOCK',flags:f})}
for(const flag of flags)for(const kind of ['missing','null','string-true','number-one']){const config={...baseConfig};if(kind==='missing')delete config[flag];else config[flag]=kind==='null'?null:kind==='string-true'?'true':1;configs.push({id:flag+'-'+kind,config,expected:'BLOCK'})}
for(const endpoint of ['',null,'http://formspree.io/f/qaformfixture','https://example.invalid/f/qaformfixture','https://formspree.io/f/','https://formspree.io/f/qaformfixture?x=1','https://user@formspree.io/f/qaformfixture','https://formspree.io/f/qaformfixture/'])configs.push({id:'endpoint-'+String(endpoint),config:{...baseConfig,formEndpoint:endpoint},expected:'BLOCK'})
{const config={...baseConfig};delete config.formEndpoint;configs.push({id:'endpoint-missing',config,expected:'BLOCK'})}
configs.push({id:'config-null',config:null,expected:'BLOCK'},{id:'config-empty',config:{},expected:'BLOCK'});
for(const l of ['he','en'])for(const spec of configs){const x=await setup({config:spec.config});await x.load();await language(x.p,l);await fill(x.p);await submit(x.p);if(spec.expected==='MOCK_ONLY')await waitState(x.p,'success');else await x.p.waitForTimeout(60);
record(matrix.cases,spec.id,spec.expected==='MOCK_ONLY'?x.stats.mockedPosts===1&&x.stats.blockedWrites===0:x.stats.mockedPosts===0&&x.stats.blockedWrites===0,{language:l,configuration:spec.config,expected:spec.expected,mockedPosts:x.stats.mockedPosts,blockedWrites:x.stats.blockedWrites,submitVisible:await x.p.locator('#send-request').isVisible(),scope:'local; in-memory configuration only'});await x.close()}
for(const l of ['he','en']){
 const x=await setup();await x.load();await language(x.p,l);const actual=await x.p.evaluate(()=>Object.fromEntries(['formDestinationApproved','privacyApproved','contactDetailsApproved'].map(k=>[k,ASSEMBLE_CONTACT[k]])));
 record(reg.cases,'original three flags remain false',Object.values(actual).every(v=>v===false),{language:l,flags:actual});await fill(x.p);await submit(x.p);record(reg.cases,'original configuration does not attempt POST',x.stats.mockedPosts===0&&x.stats.blockedWrites===0,{language:l});
 for(const width of [320,390,768,1024,1440]){await x.p.setViewportSize({width,height:900});const info=await x.p.evaluate(()=>{const n=document.querySelector('#inquiry-privacy-notice'),controls=document.querySelector('.actions');return {lang:document.documentElement.lang,dir:document.documentElement.dir,visible:!!n?.getBoundingClientRect().height,noticeBeforeControls:!!(n.compareDocumentPosition(controls)&Node.DOCUMENT_POSITION_FOLLOWING),fontSize:parseFloat(getComputedStyle(n).fontSize),overflow:document.documentElement.scrollWidth>innerWidth+1,text:n.textContent,policyLinks:[...document.querySelectorAll('a[href]')].filter(a=>/privacy|פרטיות/.test((a.textContent+' '+a.getAttribute('href')).toLowerCase())).map(a=>a.getAttribute('href'))}});
 const hash=crypto.createHash('sha256').update(info.text).digest('hex');delete info.text;reg.privacy.push({language:l,width,...info,textSha256:hash});record(reg.cases,'privacy notice layout',info.visible&&info.noticeBeforeControls&&info.lang===l&&info.dir===(l==='he'?'rtl':'ltr')&&!info.overflow&&info.fontSize>=12,{language:l,width,...info});
 if(width===320){await x.p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const mobileViolations=await x.p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));record(reg.cases,'mobile axe WCAG A/AA',mobileViolations.length===0,{language:l,width,violations:mobileViolations})}
 if([320,1440].includes(width)){await x.p.evaluate(()=>{document.activeElement.blur();scrollTo({top:0,behavior:'instant'})});await x.p.waitForTimeout(100);await x.p.screenshot({path:path.join(out,`inquiry-${l}-${width}.png`),fullPage:true,animations:'disabled',mask:[x.p.locator('input:visible,textarea:visible')],maskColor:'#d5d5d5'});}
 }
 record(reg.cases,'full approved privacy policy link exists',reg.privacy.filter(r=>r.language===l).some(r=>r.policyLinks.length>0),{language:l,observedLinks:reg.privacy.find(r=>r.language===l).policyLinks,approval:'No approved policy or approval evidence present in candidate'});
 await x.p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const violations=await x.p.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})));record(reg.cases,'axe WCAG A/AA',violations.length===0,{language:l,violations});
 const tabs=[];await x.p.locator('#customer-name').focus();for(let i=0;i<12;i++){await x.p.keyboard.press('Tab');tabs.push(await x.p.evaluate(()=>({id:document.activeElement.id,tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineStyle})));}record(reg.cases,'keyboard can reach email fallback',tabs.some(x=>x.id==='email-request'),{language:l,focusSequence:tabs});
 const before=await x.p.locator('#inquiry-privacy-notice').innerText();await language(x.p,l==='he'?'en':'he');record(reg.cases,'notice text changes language',before!==await x.p.locator('#inquiry-privacy-notice').innerText(),{language:l});
 await x.p.locator('#email-request').evaluate(a=>a.addEventListener('click',e=>e.preventDefault()));await x.p.locator('#email-request').click();const mail=await x.p.locator('#email-request').getAttribute('href');const url=new URL(mail);record(reg.cases,'email fallback builds draft only',url.protocol==='mailto:'&&url.searchParams.has('body')&&x.stats.blockedWrites===0,{language:l,openedExternalApplication:false,fieldsEncoded:!!url.searchParams.get('body')});await x.close();
 for(const scenario of ['success','422','500','network','timeout','duplicate','malformed','unacknowledged','pending-language']){
 const x=await setup({config:baseConfig,scenario});await x.load();await language(x.p,l);
 if(scenario==='timeout')await x.p.clock.install();
 if(scenario==='success'){
  await submit(x.p);const facts=await x.p.evaluate(()=>({invalid:!!document.querySelector(':invalid'),message:document.querySelector('#inquiry-status').textContent,focus:document.activeElement.id}));record(reg.cases,'required validation and readable error',facts.invalid&&facts.message.length>0&&x.stats.mockedPosts===0,{language:l,focus:facts.focus});
  await fill(x.p);await x.p.locator('#customer-contact').fill('invalid');await submit(x.p);record(reg.cases,'invalid contact blocked',x.stats.mockedPosts===0&&await x.p.locator('#customer-contact').evaluate(e=>!e.validity.valid),{language:l});
  await language(x.p,l==='he'?'en':'he');const msg=await x.p.locator('#customer-contact').evaluate(e=>e.validationMessage);record(reg.cases,'validation message switches language',msg.length>0&&(l==='he'?!/[א-ת]/.test(msg):/[א-ת]/.test(msg)),{language:l});await language(x.p,l);
 }
 await fill(x.p);await submit(x.p);
 if(['timeout','duplicate','pending-language'].includes(scenario)){await x.p.waitForFunction(()=>document.querySelector('#inquiry-form').getAttribute('aria-busy')==='true');await x.p.waitForTimeout(40);
  if(scenario==='timeout'){await x.p.clock.fastForward(12001);await x.p.clock.resume()}
  else if(scenario==='duplicate'){await x.p.locator('#inquiry-form').evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));record(reg.cases,'pending duplicate blocked',x.stats.mockedPosts===1&&await x.p.locator('#send-request').isDisabled(),{language:l});await x.complete()}
  else{const before=await x.p.locator('#inquiry-status').innerText();await language(x.p,l==='he'?'en':'he');record(reg.cases,'language switches while submission pending',before!==await x.p.locator('#inquiry-status').innerText()&&await x.p.locator('#customer-name').inputValue()==='Synthetic QA',{language:l});await x.complete()}
 }
 const expected=['success','duplicate','pending-language'].includes(scenario)?'success':'error';await waitState(x.p,expected);
 record(reg.cases,'mock '+scenario,x.stats.mockedPosts===1&&x.stats.blockedWrites===0&&await x.p.locator('#inquiry-form').getAttribute('aria-busy')===null&&await x.p.locator('#send-request').isEnabled(),{language:l,mockedPosts:x.stats.mockedPosts,expectedState:expected,payloadFieldNames:x.stats.payloadFieldNames});
 const before=await x.p.locator('#inquiry-status').innerText();const current=await x.p.locator('html').getAttribute('lang');await language(x.p,current==='he'?'en':'he');record(reg.cases,'outcome language change '+scenario,before!==await x.p.locator('#inquiry-status').innerText()&&await x.p.locator('#customer-contact').inputValue()==='fixture@example.invalid',{language:l});await x.close();
 }
 const nj=await setup({js:false});await nj.load();const info=await nj.p.evaluate(()=>({noticeVisible:!!document.querySelector('#inquiry-privacy-notice')?.getBoundingClientRect().height,action:document.querySelector('form').getAttribute('action'),visibleFields:[...document.querySelectorAll('form input')].filter(e=>e.getBoundingClientRect().height).length,visibleSubmit:!!document.querySelector('#send-request').getBoundingClientRect().height,mailto:document.querySelector('#email-request').getAttribute('href').startsWith('mailto:')}));record(reg.cases,'no-JS safe static fallback',info.noticeVisible&&info.action==='#'&&!info.visibleFields&&!info.visibleSubmit&&info.mailto&&nj.stats.blockedWrites===0,{requestedLanguage:l,actualLanguage:'he',note:'English requires JS; no-JS is Hebrew fallback, not a claimed English pass',...info});await nj.close();
}
for(const l of ['he','en']){const x=await setup({site:'wood-u-like-site'});await x.load();await language(x.p,l,'wood-u-like-site');const facts=await x.p.evaluate(()=>({flags:[WUL_CONTACT.formDestinationApproved,WUL_CONTACT.privacyApproved,WUL_CONTACT.contactDetailsApproved],noticeVisible:!!document.querySelector('#privacy-notice')?.getBoundingClientRect().height,copy:document.querySelector('#privacy-copy').textContent.length>0,submitDisabled:document.querySelector('#send-request').disabled}));await x.p.locator('#product').selectOption('welcome');await x.p.locator('#customer-name').fill('Synthetic QA');await x.p.locator('#contact').fill('fixture@example.invalid');await submit(x.p);record(reg.cases,'WUL focused regression',facts.flags.every(v=>v===false)&&facts.noticeVisible&&facts.copy&&facts.submitDisabled&&x.stats.mockedPosts===0&&x.stats.blockedWrites===0,{language:l,wulSha,...facts});await x.close()}
// Read-only public probe: no production flags or config overrides.
{const x=await setup({publicProbe:true});try{const response=await x.load();record(reg.cases,'public inquiry reachable',response.ok(),{scope:'public',httpStatus:response.status(),deployedSha:'UNVERIFIED'})}catch(e){reg.cases.push({test:'public inquiry reachable',status:'BLOCKED',scope:'public',candidateSha:sha,error:e.message.split('\n')[0],deployedSha:'UNVERIFIED'});save()}await x.close()}
record(reg.cases,'zero forwarded writes and no page errors',reg.guardContexts.every(x=>x.passedWrites===0)&&reg.pageErrors.length===0,{totalMockedPosts:reg.guardContexts.reduce((n,x)=>n+x.mockedPosts,0),blockedWrites:reg.guardContexts.reduce((n,x)=>n+x.blockedWrites,0)});
reg.finished=new Date().toISOString();matrix.finished=reg.finished;save();await browser.close();console.log(JSON.stringify({matrix:matrix.cases.length,regression:reg.cases.length,failures:[...matrix.cases,...reg.cases].filter(x=>x.status!=='PASS')},null,2));
})().catch(e=>{save();console.error(e);process.exit(1)});
