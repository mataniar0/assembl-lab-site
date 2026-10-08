"""Measure actual uncached Chromium transfers; run with an output JSON path argument."""
import sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tests'))
from homepage_smoke import site_url
from playwright.sync_api import sync_playwright
root=ROOT; results=[]
with site_url(None) as base,sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(390,844),(1440,900)]:
  for path in ['', 'geometric/']:
   c=b.new_context(viewport={'width':width,'height':height},device_scale_factor=1);page=c.new_page();cdp=c.new_cdp_session(page);cdp.send('Network.enable');cdp.send('Network.setCacheDisabled',{'cacheDisabled':True});totals={};responses={}
   cdp.on('Network.responseReceived',lambda e:responses.update({e['requestId']:{'url':e['response']['url'],'type':e['type']}}))
   cdp.on('Network.loadingFinished',lambda e:totals.update({e['requestId']:e['encodedDataLength']}))
   page.goto(base+path,wait_until='networkidle');page.wait_for_timeout(1500)
   def snapshot():
    return {'bytes':sum(totals.values()),'image_bytes':sum(n for k,n in totals.items() if responses.get(k,{}).get('type')=='Image'),'requests':[dict(v,bytes=totals.get(k,0)) for k,v in responses.items()]}
   initial=snapshot()
   for y in range(0,page.evaluate('document.body.scrollHeight'),500):page.evaluate('(y)=>scrollTo(0,y)',y);page.wait_for_timeout(120)
   page.wait_for_timeout(1500);results.append({'path':path or '/', 'width':width,'initial':initial,'scrolled':snapshot()});c.close()
 b.close()
files=[p for p in root.rglob('*') if p.is_file() and p.suffix.lower() in ('.png','.jpg','.jpeg','.webp','.svg') and not any(x.startswith('.') for x in p.relative_to(root).parts)]
Path(sys.argv[1]).write_text(json.dumps({'conditions':'Chromium, fresh context per page, HTTP without compression, cache disabled, DPR 1, Hebrew, no throttling; 1.5s settle, then whole-page scroll in 500px steps','image_files_bytes':sum(p.stat().st_size for p in files),'image_files_count':len(files),'geometric_html_bytes':(root/'geometric/index.html').stat().st_size,'pages':results},indent=2))
