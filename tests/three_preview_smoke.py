import sys,json,time,subprocess,math,argparse
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from site_smoke import site_server,Session,toggle,locale_and_layout
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1];OUT=R/'QA_EVIDENCE/AL-016/browser';OUT.mkdir(parents=True,exist_ok=True);RESULTS=[]
args=argparse.ArgumentParser();args.add_argument('--no-captures',action='store_true');args=args.parse_args()
BASE='/tmp/al016-baseline'
subprocess.run(['mkdir','-p',BASE],check=True)
# A separate archive is used for immutable before captures and initial request metrics.
p=subprocess.run(['git','archive','2a0fe67d742dec79421a03a9dd10076aba427aa5'],cwd=R,stdout=subprocess.PIPE,check=True);import tarfile,io
with tarfile.open(fileobj=io.BytesIO(p.stdout)) as tar:tar.extractall(BASE,filter='data')
def metrics(page):
 return page.evaluate("""()=>({resources:performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.transferSize,duration:r.duration})),LCP:window.__lcp||null})""")
def initial(context,page,url):
 page.add_init_script("try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch(_){}")
 page.goto(url,wait_until='networkidle');page.wait_for_function('Boolean(window.ASSEMBLE_I18N)')
def record(name,fn):
 try:r=fn();RESULTS.append({'case':name,'passed':True,'details':r});print('PASS',name,flush=True)
 except Exception as e:RESULTS.append({'case':name,'passed':False,'error':str(e)});print('FAIL',name,str(e),flush=True)
with site_server(R) as base,site_server(Path(BASE)) as before,sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for lang in ('he','en'):
  for width in (320,390,768,1024,1440):
   for route in ('geometric/','table/flow/','table/personal/'):
    def check(lang=lang,width=width,route=route):
     s=Session(b,base,(width,900 if width>900 else 844),lang);page=s.page;initial(s.context,page,base+route);m=metrics(page)
     assert not any('.glb' in x['url'] or 'model-viewer.min.js' in x['url'] for x in m['resources']), '3D eagerly fetched'
     # Keep exact original gallery, inquiry destinations and SEO metadata.
     original=s.context.new_page();original.goto(before+route,wait_until='networkidle')
     for selector in ('.gallery','meta[name=description]','meta[property="og:title"]','meta[property="og:description"]'):
      assert page.locator(selector).evaluate_all('(es)=>es.map(e=>e.outerHTML)')==original.locator(selector).evaluate_all('(es)=>es.map(e=>e.outerHTML)'), 'Changed original '+selector
     def inquiry_links(p):return p.locator('a[href*="inquiry"]').evaluate_all('(es)=>es.map(e=>e.getAttribute("href"))')
     assert inquiry_links(page)==inquiry_links(original);original.close()
     box=page.locator('[data-three-preview]');assert box.count()==1;locale_and_layout(page,lang)
     assert page.locator('.three-preview').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
     if route!='table/personal/':
      assert box.get_attribute('data-state')=='blocked';assert not page.locator('[data-three-open]').count()
     else:
      assert page.locator('.gallery .slide').count()==7
      page.locator('[data-three-open]').click();page.wait_for_function("document.querySelector('[data-three-preview]').dataset.state==='ready'",timeout=60000)
      viewer=page.locator('model-viewer');assert viewer.count()==1
      assert all(r['url'].startswith(base) for r in metrics(page)['resources']), 'Unexpected external request'
      orbit=viewer.evaluate('e=>({...e.getCameraOrbit()})')
      for _ in range(12):page.locator('[data-three-action=right]').click()
      after=viewer.evaluate('e=>({...e.getCameraOrbit()})');assert abs(after['theta']-orbit['theta'])>6,'No full orbit'
      page.locator('[data-three-action=in]').click();zoom=viewer.evaluate('e=>e.getCameraOrbit().radius');assert zoom<orbit['radius']
      page.locator('[data-three-action=out]').click();page.locator('[data-three-action=down]').click()
      page.locator('[data-three-action=reset]').focus();page.keyboard.press('Enter');reset=viewer.evaluate('e=>({...e.getCameraOrbit()})');assert abs(reset['theta']-orbit['theta'])<.01 and abs(reset['radius']-orbit['radius'])<.01
      assert page.locator('[data-three-action=reset]').evaluate("e=>e.matches(':focus-visible')&&parseFloat(getComputedStyle(e).outlineWidth)>=2")
      for button in page.locator('.three-toolbar button').all():assert button.evaluate('e=>{let r=e.getBoundingClientRect();return r.width>=44&&r.height>=44}')
      toggle(page,'en' if lang=='he' else'he');assert page.locator('model-viewer').count()==1;toggle(page,lang)
      page.locator('[data-three-close]').click();assert page.locator('model-viewer').count()==0;assert page.locator('.gallery').evaluate('e=>document.activeElement===e')
      page.locator('.gallery .next').click();assert page.locator('.gallery .progress span').inner_text()=='02'
     s.healthy();s.close();return {'initial':m,'model':'PASS_DESIGN_ONLY' if route=='table/personal/' else'BLOCKED'}
    record(f'{route}:{lang}:{width}',check)
 # Negative scenarios: expected network failures are scoped to this model, gallery must remain usable.
 for scenario in ('model404','library404','webgl','slow','close-loading','nojs','blockedjs'):
  def negative(scenario=scenario):
   c=b.new_context(viewport={'width':390,'height':844},java_script_enabled=scenario!='nojs',service_workers='block');writes=[];failed=[]
   def guard(route):
    req=route.request
    if req.method not in ('GET','HEAD'):writes.append(req.method);return route.abort()
    if scenario=='blockedjs' and req.url.endswith('.js'):return route.abort()
    if (scenario=='model404' and req.url.endswith('.glb')) or(scenario=='library404' and req.url.endswith('model-viewer.min.js')):return route.fulfill(status=404,body='expected test failure')
    if scenario in ('slow','close-loading') and req.url.endswith('.glb'):
     time.sleep(1)
    route.continue_()
   c.route('**/*',guard)
   if scenario=='webgl':c.add_init_script("HTMLCanvasElement.prototype.getContext=function(){return null}")
   page=c.new_page();page.goto(base+'table/personal/',wait_until='networkidle');assert page.locator('.hero-media img').evaluate('e=>e.complete&&e.naturalWidth>0')
   if scenario in ('nojs','blockedjs'):assert page.locator('[data-three-open]').is_disabled()
   else:
    page.locator('[data-three-open]').click()
    if scenario in ('model404','library404','webgl'):page.wait_for_function("document.querySelector('[data-three-preview]').dataset.state==='error'",timeout=60000);assert page.locator('[data-three-open]').is_enabled()
    elif scenario=='close-loading':page.locator('[data-three-close]').click();page.wait_for_timeout(1500);assert page.locator('model-viewer').count()==0
    else:page.wait_for_function("document.querySelector('[data-three-preview]').dataset.state==='ready'",timeout=60000)
    page.locator('.gallery .next').click();assert page.locator('.gallery .progress span').inner_text()=='02'
   assert not writes;c.close();return {'gallery_available':True,'real_posts':0}
  record('fallback:'+scenario,negative)
 if not args.no_captures:
  # Before/after screenshots are captured separately from strict functional network sessions.
  for phase,url in [('before',before),('after',base)]:
   for lang in ('he','en'):
    for width in (320,390,768,1024,1440):
     for route in ('geometric/','table/flow/','table/personal/'):
      s=Session(b,url,(width,900),lang);initial(s.context,s.page,url+route);s.page.evaluate("scrollTo({top:0,behavior:'instant'})");dest=OUT/phase;dest.mkdir(exist_ok=True)
      s.page.screenshot(path=str(dest/f'{route.strip("/").replace("/","-")}-{lang}-{width}.png'),full_page=True)
      s.close()
  # Verified model views and true poster/frame.
  s=Session(b,base,(1000,900),'en');initial(s.context,s.page,base+'table/personal/');s.page.locator('[data-three-open]').click();s.page.wait_for_function("document.querySelector('model-viewer')?.loaded",timeout=60000)
  radius=s.page.locator('model-viewer').evaluate('e=>e.getCameraOrbit().radius')*1.3
  for label,orbit in [('front',f'0deg 75deg {radius}m'),('side',f'90deg 75deg {radius}m'),('underside',f'35deg 150deg {radius}m')]:
   s.page.locator('model-viewer').evaluate('(e,v)=>{e.cameraOrbit=v;e.jumpCameraToGoal()}',orbit);s.page.wait_for_timeout(600);s.page.locator('.three-stage').screenshot(path=str(OUT/f'personal-{label}.png'))
  s.close();b.close()
report={'passed':sum(r['passed'] for r in RESULTS),'failed':sum(not r['passed'] for r in RESULTS),'real_posts':0,'results':RESULTS};(OUT/'results.json').write_text(json.dumps(report,indent=2)+'\n');print('TOTAL',report['passed'],report['failed']);sys.exit(bool(report['failed']))
