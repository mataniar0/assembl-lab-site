"""Browser replay of checked GLB. Serve /workspace on port 8765."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
OUT=Path(__file__).parent/'artifacts'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1164,'height':860});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8765/assembl-lab-site/engineering/flow-v3/preview.html');page.wait_for_function('window.ready || window.loadError');assert page.evaluate('window.ready'),page.evaluate('window.loadError')
 meshes=page.evaluate('(()=>{let n=0;model.traverse(o=>{if(o.isMesh)n++});return n})()');assert meshes==7
 for view in ['front','side','underside']:
  page.evaluate('(v)=>window.view(v)',view);page.screenshot(path=str(OUT/(view+'.png')))
 assert not errors
 (OUT/'browser.json').write_text(json.dumps(dict(status='PASS',browser='Chromium software WebGL',meshes=meshes,errors=errors,views=['front','side','underside'],scope='Partial frame only; full intended table comparison BLOCKED'),indent=2)+'\n');b.close()
