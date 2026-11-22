"""Self-contained software-WebGL review harness; no public-site integration."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import threading,json
from playwright.sync_api import sync_playwright
P=Path(__file__).parent;workspace=P.resolve().parents[2]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(workspace)));threading.Thread(target=server.serve_forever,daemon=True).start()
results=[]
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page(viewport={'width':1216,'height':920});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  for option in ['R_RAIL_REINDEX','L_LEG_BASE']:
   page.goto(f'http://127.0.0.1:{server.server_port}/assembl-lab-site/engineering/flow-v31/preview.html?option={option}');page.wait_for_function('window.ready || window.loadError');assert page.evaluate('window.ready'),page.evaluate('window.loadError')
   count=page.evaluate('(()=>{let n=0;model.traverse(x=>{if(x.isMesh)n++});return n})()');assert count==19
   extents={}
   for v in ['front','side','underside','top']:
    page.evaluate('(v)=>window.view(v)',v);extent=page.evaluate('window.maxProjectedExtent');assert extent<1;extents[v]=extent;page.screenshot(path=str(P/'artifacts'/option/(v+'.png')))
   assert not errors;results.append(dict(option=option,status='PASS',mesh_nodes=count,browser='Chromium software WebGL',four_view_ndc_extents=extents,errors=errors,physical_device_test=False))
  b.close()
finally:server.shutdown();server.server_close()
(P/'artifacts/browser-qc.json').write_text(json.dumps(results,indent=2)+'\n');print(results)
