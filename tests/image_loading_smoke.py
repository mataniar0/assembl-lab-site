"""Exercise actual lazy requests, reserved geometry, deferred stages and full-size links."""
import argparse,json
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
from homepage_smoke import site_url
parser=argparse.ArgumentParser();parser.add_argument('--report',type=Path,default=Path('/tmp/image-loading.json'));args=parser.parse_args();results=[]
with site_url(None) as base,sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for width,height in ((390,844),(1440,900)):
   context=b.new_context(viewport={'width':width,'height':height});page=context.new_page();requested=[];errors=[]
   page.on('request',lambda r:requested.append(urlsplit(r.url).path));page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script("window.qaCLS=0;new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(!e.hadRecentInput)window.qaCLS+=e.value})).observe({type:'layout-shift',buffered:true})")
   page.goto(base,wait_until='networkidle');assert page.locator('.product-media img').count()==8
   before=page.locator('.product-media').evaluate_all('es=>es.map(e=>e.getBoundingClientRect().height)')
   for img in page.locator('.product-media img').all():
    img.scroll_into_view_if_needed();img.evaluate('i=>i.decode()');assert img.evaluate('i=>i.naturalWidth>0 && i.width/i.height>0')
    assert img.get_attribute('width') and img.get_attribute('height')
    path=Path(__file__).resolve().parents[1]/urlsplit(img.evaluate('i=>i.currentSrc')).path.lstrip('/');assert path.stat().st_size<=250_000
   after=page.locator('.product-media').evaluate_all('es=>es.map(e=>e.getBoundingClientRect().height)');assert all(abs(a-z)<1 for a,z in zip(before,after)),(before,after)
   assert not any('kids_shelf_story' in r or 'driller_story' in r for r in requested),requested
   cls=page.evaluate('window.qaCLS');assert cls<0.01,cls
   requested.clear();page.goto(base+'geometric/',wait_until='networkidle');assert not any('embedded-stage' in r for r in requested)
   assert page.locator('.slide').count()==6
   for index in range(1,6):
    page.locator('.next').click();page.wait_for_function('i=>document.querySelectorAll(".slide")[i].classList.contains("active")',arg=index);page.locator('.slide.active img').evaluate('i=>i.decode()');assert page.locator('.slide.active img').evaluate('i=>i.naturalWidth>0')
   assert sum('embedded-stage' in r for r in requested)==3,requested
   for details in page.locator('details').all():details.evaluate('d=>d.open=true')
   for img in page.locator('details img').all():img.evaluate('i=>i.decode()');assert img.evaluate('i=>i.naturalWidth>0')
   assert not errors,errors
   page.goto(base+'crib/',wait_until='networkidle');assert 'webp' in page.locator('.hero-media img').evaluate('i=>i.currentSrc')
   link=page.locator('.hero-media a.image-open');assert link.get_attribute('href')=='crib-hero.png';assert page.request.get(base+'crib/crib-hero.png').ok
   results.append({'width':width,'homepage_CLS':cls,'passed':True});print('PASS',width,'no sprite requests, stable cards, six deferred stages and preserved full-size PNG',flush=True);context.close()
 finally:b.close()
args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(results,indent=2))
