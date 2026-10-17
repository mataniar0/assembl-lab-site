import sys,json,hashlib,time
from pathlib import Path
sys.path.insert(0,'/workspace/assembl-lab-site/tests');sys.path.insert(0,'/tmp/al007-qa')
from playwright.sync_api import sync_playwright
from site_smoke import Session,site_server,toggle
from acceptance import checks,hydrate
ROOT=Path('/workspace/assembl-lab-site')
SPECS={
 'shelf/kids/':{'index':4,'key':'build.description.5','he':'צילום המדף המורכב בסדנה, עם עיטורי טיל וכוכבים.','en':'A workshop photograph of the assembled shelf, with rocket and star decorations.'},
 'driller_stand/':{'index':3,'key':'build.description.4','he':'צילום המבנה המורכב עם שני מדפי רפפות והמשטח העליון.','en':'A photograph of the assembled structure with two slatted shelves and the top surface.'}
}
records=[];start=time.monotonic()
with site_server(ROOT)as base,sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in [320,390,768,1024,1440]:
  for language in ['he','en']:
   for path,spec in SPECS.items():
    s=Session(b,base,(width,844 if width<1000 else 900),language)
    rec={'page':path,'language':language,'width':width,'source_sha256':hashlib.sha256((ROOT/path/'index.html').read_bytes()).hexdigest(),'checks':{}}
    try:
     s.ready(path);hydrate(s);page=s.page;step=page.locator('.step').nth(spec['index'])
     step.evaluate("e=>e.scrollIntoView({block:'center',inline:'center',behavior:'instant'})")
     step.tap() if width<900 else step.click()
     assert step.get_attribute('aria-pressed')=='true','Target stage is not active'
     for lang in [language,'en'if language=='he'else'he',language]:
      if page.locator('html').get_attribute('lang')!=lang:toggle(page,lang)
      assert step.get_attribute('aria-pressed')=='true','Changing language reset the active stage'
      assert step.get_attribute('data-desc-key')==spec['key']
      caption=page.locator('.copy p').inner_text()
      assert caption==spec[lang],f'Wrong final observational caption: {caption}'
      assert page.evaluate("k=>ASSEMBLE_I18N.t(k)",spec['key'])==spec[lang]
     rec['caption']=page.locator('.copy p').inner_text();rec['label']=page.locator('.copy h3').inner_text();rec['checks']=checks(s,language)
    except Exception as e:rec['checks']['exception']=[str(e)]
    finally:s.close()
    records.append(rec);print(('FAIL'if any(rec['checks'].values())else'PASS'),path,language,width,json.dumps(rec,ensure_ascii=False),flush=True)
 b.close()
failed=[r for r in records if any(r['checks'].values())]
report={'cases':len(records),'passed':len(records)-len(failed),'failed':len(failed),'real_posts':0,'seconds':round(time.monotonic()-start,2),'records':records}
Path('/tmp/al007-qa/final-captions.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items()if k!='records'}))
raise SystemExit(bool(failed))
