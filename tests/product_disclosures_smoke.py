"""Validate product and inquiry disclosure accessibility and state, with review screenshots."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
from homepage_smoke import site_url
from language_site_smoke import new_context, ready, select_language, check_focus
from mobile_site_smoke import LAYOUT_CHECK, IMAGE_CHECK

PRODUCTS=('geometric/','shelf/kids/','driller_stand/','shoe_rack/','workbench/','crib/','etrog_box/','megillat_esther_box/','table/flow/')
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=Path('/tmp/product-review'));out=parser.parse_args().output;out.mkdir(parents=True,exist_ok=True);results=[]
with site_url(None) as base,sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for lang in ('he','en'):
   for viewport in ((390,844),(1440,900)):
    for path in (*PRODUCTS,'inquiry/'):
     context=new_context(browser,lang,viewport);page=context.new_page()
     try:
      ready(page,base+path)
      assert page.locator('h1').count()==1
      assert page.evaluate("[...document.querySelectorAll('[aria-labelledby],[aria-describedby]')].every(e=>['aria-labelledby','aria-describedby'].every(a=>(e.getAttribute(a)||'').split(/\\s+/).filter(Boolean).every(id=>document.getElementById(id))))")
      assert not page.evaluate(LAYOUT_CHECK)
      for summary in page.locator('details > summary').all():
       summary.evaluate("e=>e.scrollIntoView({block:'center',behavior:'instant'})")
       check_focus(page,summary);page.keyboard.press('Enter');assert summary.evaluate('e=>e.parentElement.open')
       select_language(page,'en' if lang=='he' else 'he');assert summary.evaluate('e=>e.parentElement.open')
       select_language(page,lang);summary.focus();page.keyboard.press('Enter');assert not summary.evaluate('e=>e.parentElement.open')
      if path=='inquiry/':
       ready(page,base+'inquiry/?product=kids-shelf');assert page.locator('#product').input_value()=='kids-shelf'
       page.locator('#customer-name').fill('QA draft');page.locator('#customer-contact').fill('qa@example.invalid');page.locator('#optional-details > summary').click();page.locator('#width').fill('700');page.locator('#note').fill('Preserve draft');page.locator('#optional-details > summary').click();select_language(page,'en' if lang=='he' else 'he');assert page.locator('#optional-details').get_attribute('open') is None;page.locator('#optional-details > summary').click();assert page.locator('#note').input_value()=='Preserve draft' and page.locator('#width').input_value()=='700';assert page.locator('#customer-name').input_value()=='QA draft';select_language(page,lang);page.locator('#optional-details > summary').click();assert page.locator('#whatsapp-request').is_hidden()
      else:
       cta=page.locator('.adapt-link');assert cta.count()==1
       assert cta.is_visible()
       for detail in page.locator('details').all():detail.evaluate('e=>e.open=true')
       assert not page.evaluate(LAYOUT_CHECK),page.evaluate(LAYOUT_CHECK)
       assert not page.evaluate(IMAGE_CHECK),page.evaluate(IMAGE_CHECK)
       for link in page.locator('a.image-open,a.product-open-image').all():assert page.request.get(base+path+link.get_attribute('href')).ok
       if path=='shelf/kids/':assert page.locator('.step').count()==5 and page.locator('.step').last.get_attribute('data-pos')=='80%'
       if path=='crib/':assert page.locator('.safety-note').is_visible() and page.locator('.safety-note').inner_text()
       for detail in page.locator('details').all():detail.evaluate('e=>e.open=false')
      if path in ('geometric/','shelf/kids/','crib/','inquiry/'):
       page.evaluate('document.activeElement.blur();scrollTo(0,0)');page.screenshot(path=str(out/f'{path.strip("/").replace("/","-")}-{lang}-{viewport[0]}.png'),full_page=True)
      results.append({'page':path,'language':lang,'viewport':viewport,'passed':True});print('PASS',path,lang,viewport,flush=True)
     finally:context.close()
 finally:browser.close()
(out/'disclosures.json').write_text(json.dumps(results,indent=2));print(f'PASS {len(results)} product/inquiry disclosure cases; no real submissions.')
