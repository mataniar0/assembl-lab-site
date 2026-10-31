import sys,json,time
from pathlib import Path
sys.path.insert(0,'/workspace/assembl-lab-site/tests')
from site_smoke import Session,site_server,toggle,locale_and_layout,carousel_smoke,RESOURCE_CHECK
from mobile_site_smoke import IMAGE_CHECK,LAYOUT_CHECK
from playwright.sync_api import sync_playwright
R=Path('/workspace/assembl-lab-site');out=R/'.qa-reports/al015';out.mkdir(parents=True,exist_ok=True);results=[]
with site_server(R) as base,sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
 for lang in ('he','en'):
  for w in (320,390,768,1024,1440):
   s=Session(b,base,(w,900 if w>1000 else 844),lang);rec={'language':lang,'width':w}
   try:
    s.ready('');card=s.page.locator('.product[href="table/"]');card.click();s.page.wait_for_load_state('load');assert s.page.locator('.model').count()==3
    s.page.locator('.model[href="personal/"]').click();s.page.wait_for_load_state('load');page=s.page
    page.wait_for_function("Boolean(window.ASSEMBLE_I18N)")
    assert page.locator('.step').count()==7
    for index in range(7):
     page.locator('.step').nth(index).click();img=page.locator('.slide.active img');img.evaluate('e=>e.decode()');assert page.locator('.progress span').inner_text()==f'{index+1:02d}';assert img.get_attribute('alt');assert s.context.request.get(page.locator('.gallery-image-open').evaluate('e=>e.href')).status==200
     for arrow in page.locator('.arrow').all():
      arrow.evaluate("e=>e.scrollIntoView({block:'center',behavior:'instant'})")
      assert arrow.evaluate("e=>{let r=e.getBoundingClientRect(),h=document.querySelector('header').getBoundingClientRect();return r.width>=44&&r.height>=44&&r.top>=h.bottom&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e}")
     assert not page.evaluate(IMAGE_CHECK);assert not page.evaluate(LAYOUT_CHECK);locale_and_layout(page,lang)
    page.locator('.next').click();assert page.locator('.progress span').inner_text()=='01';page.locator('.prev').focus();page.keyboard.press('Enter');assert page.locator('.progress span').inner_text()=='07'
    page.locator('.gallery').focus();page.keyboard.press('ArrowRight');assert page.locator('.progress span').inner_text()=='01'
    toggle(page,'en' if lang=='he' else'he');assert page.locator('.progress span').inner_text()=='01';toggle(page,lang)
    page.locator('.viewer').evaluate("e=>{for(let [t,x] of [['touchstart',240],['touchend',80]])e.dispatchEvent(new TouchEvent(t,{changedTouches:[new Touch({identifier:1,target:e,clientX:x,clientY:100})],bubbles:true}))}")
    assert page.locator('.progress span').inner_text()=='02'
    page.locator('.step').nth(0).click();page.locator('.slide.active img').evaluate('e=>e.decode()');page.evaluate("scrollTo({top:0,behavior:'instant'})")
    # Screenshot capture is kept outside strict functional sessions: browser viewport changes cancel responsive candidates.
    page.locator('.hero .adapt-link').click();page.wait_for_load_state('load');assert page.locator('#product').input_value()=='personal-coffee-table';assert not page.locator('#planning-notice').is_visible()
    s.healthy();rec.update(passed=True,slides=7,real_posts=0)
   except Exception as e:rec.update(passed=False,error=str(e));print('FAIL',rec,flush=True)
   finally:s.close()
   results.append(rec);print('CASE',lang,w,rec.get('passed'),flush=True)
 b.close()
report={'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'real_posts':0,'results':results};(out/'focused.json').write_text(json.dumps(report,indent=2)+'\n');print(report);sys.exit(bool(report['failed']))
