"""Task-specific AL-007 acceptance evidence; no app edits and no real submissions."""
import sys,json,argparse,time,traceback
from pathlib import Path
from urllib.parse import urljoin,urlsplit,parse_qs
sys.path.insert(0,'/workspace/assembl-lab-site/tests')
from playwright.sync_api import sync_playwright
from site_smoke import Session,site_server,locale_and_layout,RESOURCE_CHECK,carousel_smoke,toggle,click_href
from language_site_smoke import LOCALE_CHECK,HEADER_CHECK
from mobile_site_smoke import IMAGE_CHECK,LAYOUT_CHECK
PAGES=['','table/','geometric/','table/flow/','driller_stand/','shelf/kids/','shoe_rack/','workbench/','crib/','etrog_box/','megillat_esther_box/']
PRODUCTS={'geometric/':('table/','../geometric/','geometric'),'table/flow/':('table/','flow/','flow'),'driller_stand/':('driller_stand/',None,'driller-stand'),'shelf/kids/':('shelf/kids/',None,'kids-shelf'),'shoe_rack/':('shoe_rack/',None,'shoe-rack'),'workbench/':('workbench/',None,'workbench'),'crib/':('crib/',None,'crib'),'etrog_box/':('etrog_box/',None,'etrog-box'),'megillat_esther_box/':('megillat_esther_box/',None,'megillah-case')}
WIDTHS=[320,390,768,1024,1440]
SNAPSHOT=r'''() => ({
 cards:[...document.querySelectorAll('a.product,a.model')].map(e=>({href:e.getAttribute('href'),text:e.innerText,accessible:e.getAttribute('aria-label'),images:[...e.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),alt:i.alt})),labels:[...e.querySelectorAll('.status,.development,.catalog-status,[data-product-status]')].map(n=>({text:n.innerText,key:n.dataset.i18n,status:n.dataset.productStatus}))})),
 statuses:[...document.querySelectorAll('main .status,main .catalog-status,main [data-product-status]')].map(e=>({text:e.innerText,key:e.dataset.i18n,status:e.dataset.productStatus})),
 mediaLabels:[...document.querySelectorAll('main figcaption,main .image-explanation,main .planning-note,main .placeholder,main .media-provenance,main [data-media-kind]')].map(e=>({text:e.innerText,key:e.dataset.i18n,kind:e.dataset.mediaKind})),
 slides:[...document.querySelectorAll('.step')].map(e=>({text:e.innerText,key:e.dataset.titleKey,label:e.dataset.labelKey,code:e.dataset.code})),
 heroImages:[...document.querySelectorAll('.hero-media img')].map(e=>({src:e.getAttribute('src'),alt:e.alt})),
 placeholders:document.querySelectorAll('.placeholder').length,
 productOptions:[...document.querySelectorAll('#product option')].map(e=>({value:e.value,text:e.innerText,planning:e.dataset.planning||''}))
})'''
LABEL_FIT=r'''() => [...document.querySelectorAll('.status,.development,.catalog-status,[data-product-status],.media-provenance')].flatMap(e=>{
 const r=e.getBoundingClientRect(),s=getComputedStyle(e);if(!r.width||!r.height||s.visibility==='hidden')return[];
 const errs=[];if(r.left<-.5||r.right>innerWidth+.5)errs.push('Label outside viewport: '+e.innerText);
 if(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)errs.push('Label text clipped: '+e.innerText);
 if(parseFloat(s.fontSize)<10)errs.push('Label font smaller than10px: '+e.innerText);
 return errs;
})'''

def hydrate(s):
 p=s.page;p.wait_for_load_state('load');p.wait_for_function('Boolean(window.ASSEMBLE_I18N)')
 p.evaluate("""async()=>{document.documentElement.style.scrollBehavior='auto';document.querySelectorAll('img').forEach(i=>{if(i.dataset.src){i.src=i.dataset.src;delete i.dataset.src;}i.loading='eager'});await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await document.fonts.ready;}""")

def checks(s,lang):
 p=s.page;out={}
 for name,js,arg in [('locale',LOCALE_CHECK,lang),('header',HEADER_CHECK,None),('layout',LAYOUT_CHECK,None),('image_geometry',IMAGE_CHECK,None),('resources',RESOURCE_CHECK,None),('status_label_fit',LABEL_FIT,None)]:
  try:out[name]=p.evaluate(js,arg)
  except Exception as e:out[name]=[str(e)]
 out['errors']=list(s.errors);out['blocked_writes']=list(s.blocked_writes)
 return out

def run_case(browser,base,path,lang,width,baseline):
 s=Session(browser,base,(width,844 if width<1000 else 900),lang)
 try:
  s.ready(path);hydrate(s)
  rec={'case':'page','page':path or '/','language':lang,'width':width,'snapshot':s.page.evaluate(SNAPSHOT),'checks':checks(s,lang)}
  # Provenance labels must survive both language changes, without navigation or state resets.
  initial=s.page.url
  toggle(s.page,'en' if lang=='he' else'he');toggle(s.page,lang)
  if s.page.url!=initial:rec['checks']['toggle']=['Language changed URL']
  if not baseline:
   if path=='':
    labels=s.page.locator('a.product .catalog-status')
    expected=['catalog.tables.status','catalog.kids.status','catalog.driller.status','catalog.shoe.status','catalog.workbench.status','catalog.crib.status','catalog.etrog.status','catalog.megillah.status']
    actual=labels.evaluate_all("es=>es.map(e=>e.dataset.i18n)")
    if len(actual)!=8 or sorted(actual)!=sorted(expected):rec['checks']['home_statuses']=['Eight independent catalog status keys missing: '+repr(actual)]
    if any(not t.strip() for t in labels.all_text_contents()):rec['checks']['home_statuses']=['Empty status label']
   elif path!='table/':
    labels=s.page.locator('main .status')
    if not labels.count() or not any(labels.nth(i).is_visible() and labels.nth(i).inner_text().strip() for i in range(labels.count())):rec['checks']['product_status']=['No visible lifecycle status on product page']
   if path=='table/':
    model=s.page.locator('a.model[href="flow/"]')
    if not model.locator('[data-i18n="flow.status"]').count():rec['checks']['flow_hub_status']=['Flow planning/no-photo status missing on table hub']
   try:rec['carousel']=carousel_smoke(s.page)
   except Exception as e:rec['checks']['carousel']=[str(e)]
   if path=='table/flow/':
    if s.page.locator('main img,main [role="img"]').count():rec['checks']['truthfulness']=['Flow has invented image rather than existing no-photo placeholder']
    if s.page.locator('.placeholder').count()!=1:rec['checks']['truthfulness']=['Flow photo placeholder lost']
   if path=='shoe_rack/':
    kinds=s.page.locator('.slide').evaluate_all("es=>es.map(e=>e.dataset.photoKind||'')")
    if kinds!=['real']*6+['planning']:rec['checks']['shoe_media']=['Shoe six real photos then planning not preserved: '+repr(kinds)]
   rec['checks']['errors']=list(s.errors);rec['checks']['blocked_writes']=list(s.blocked_writes)
  return rec
 finally:s.close()

def journey(browser,base,path,lang,width):
 s=Session(browser,base,(width,844 if width<1000 else 900),lang)
 try:
  s.ready('');hydrate(s)
  card,model,product=PRODUCTS[path]
  cards=s.page.locator('a.product')
  assert cards.count()==8,f'Homepage does not have8cards: {cards.count()}'
  click_href(s.page,card);hydrate(s)
  if model:click_href(s.page,model);hydrate(s)
  assert urlsplit(s.page.url).path==urlsplit(urljoin(base,path)).path,'Wrong card/model destination'
  assert s.page.locator('html').get_attribute('lang')==lang,'Language not retained through card/model navigation'
  links=s.page.locator('a[href*="inquiry/?product="]')
  assert links.count()>0,'Missing inquiry link'
  href=links.first.get_attribute('href');assert parse_qs(urlsplit(href).query)['product']==[product]
  click_href(s.page,href);hydrate(s)
  assert s.page.locator('#product').input_value()==product,'Inquiry product prefill incorrect'
  assert s.page.locator('html').get_attribute('lang')==lang,'Inquiry language not retained'
  result={'case':'journey','page':path,'language':lang,'width':width,'product':product,'prefill':s.page.locator('#product option:checked').inner_text(),'planning_notice_visible':s.page.locator('#planning-notice').is_visible(),'checks':checks(s,lang)}
  toggle(s.page,'en'if lang=='he'else'he');assert s.page.locator('#product').input_value()==product,'Switch lost product'
  toggle(s.page,lang);assert s.page.locator('#product').input_value()==product
  expected_planning=product in {'flow','workbench','crib','etrog-box','megillah-case'}
  if result['planning_notice_visible']!=expected_planning:result['checks']['planning_notice']=[f'Planning inquiry notice={result["planning_notice_visible"]}; expected={expected_planning} for {product}']
  result['checks']['errors']=list(s.errors);result['checks']['blocked_writes']=list(s.blocked_writes)
  return result
 finally:s.close()

def main():
 a=argparse.ArgumentParser();a.add_argument('--root',default='/workspace/assembl-lab-site');a.add_argument('--output',required=True);a.add_argument('--baseline',action='store_true');a.add_argument('--widths',nargs='+',type=int,default=WIDTHS);args=a.parse_args()
 start=time.monotonic();records=[]
 with site_server(Path(args.root)) as base,sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  try:
   for width in args.widths:
    for lang in ['he','en']:
     for path in PAGES:
      try:rec=run_case(browser,base,path,lang,width,args.baseline)
      except Exception as e:rec={'case':'page','page':path or'/','language':lang,'width':width,'checks':{'exception':[str(e)]}}
      records.append(rec);print(('FAIL'if any(rec['checks'].values())else'PASS'),lang,width,path or'/',json.dumps({k:v for k,v in rec['checks'].items()if v},ensure_ascii=False),flush=True)
     if not args.baseline:
      for path in PRODUCTS:
       try:rec=journey(browser,base,path,lang,width)
       except Exception as e:rec={'case':'journey','page':path,'language':lang,'width':width,'checks':{'exception':[str(e)]}}
       records.append(rec);print(('FAIL'if any(rec['checks'].values())else'PASS'),'journey',lang,width,path,json.dumps({k:v for k,v in rec['checks'].items()if v},ensure_ascii=False),flush=True)
  finally:browser.close()
 fail=[r for r in records if any(r['checks'].values())]
 out={'root':args.root,'baseline':args.baseline,'seconds':round(time.monotonic()-start,2),'cases':len(records),'passed':len(records)-len(fail),'failed':len(fail),'real_posts':0,'records':records}
 Path(args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items()if k!='records'}),flush=True)
 return bool(fail)
if __name__=='__main__':raise SystemExit(main())
