"""Create the app hero photographically styled poster by rendering the exact
same GLB that the interactive viewer loads. Never invent a second table mesh.
"""
from __future__ import annotations
import hashlib, json
from pathlib import Path
from functools import partial
import http.server, threading
from PIL import Image, ImageStat
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
MODEL=ROOT/'app/assets/personal-coffee-showroom-v2.glb'
POSTER=ROOT/'app/assets/personal-coffee-showroom-v2.webp'
SUMMARY=ROOT/'app/assets/personal-coffee-showroom-v2.json'

class Silent(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def render():
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),partial(Silent,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True)
    thread.start()
    endpoint=f'http://127.0.0.1:{server.server_port}'
    try:
      with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=[
          '--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'
        ])
        page=browser.new_page(viewport={'width':960,'height':820},device_scale_factor=1,
                              reduced_motion='reduce')
        errors=[];external=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        def guard(route):
          if not route.request.url.startswith(endpoint+'/'):
            external.append(route.request.url);route.abort()
          else:route.continue_()
        page.route('**/*',guard)
        page.goto(endpoint+'/scripts/coffee-showroom-capture.html',wait_until='networkidle')
        page.wait_for_function("document.getElementById('model').loaded === true",timeout=45000)
        assert page.locator('#model').evaluate(
           "m=>new URL(m.src).pathname.endsWith('/app/assets/personal-coffee-showroom-v2.glb')"
        )
        assert not errors,(errors[:3])
        assert not external,external
        png=page.locator('#stage').screenshot(animations='disabled',timeout=15000)
        browser.close()
      from io import BytesIO
      poster=Image.open(BytesIO(png)).convert('RGB')
      assert poster.size==(960,820)
      std=ImageStat.Stat(poster.resize((200,170))).stddev
      assert min(std)>12, f'Poster appears blank: {std}'
      POSTER.parent.mkdir(parents=True,exist_ok=True)
      poster.save(POSTER,'WEBP',quality=88,method=6)
      meta=json.loads(SUMMARY.read_text())
      assert meta['showroom_model_sha256']==hashlib.sha256(MODEL.read_bytes()).hexdigest()
      meta['poster_webp_sha256']=hashlib.sha256(POSTER.read_bytes()).hexdigest()
      meta['poster_rendered_from_model_sha256']=meta['showroom_model_sha256']
      meta['poster_pixels']=[960,820]
      meta['render_pipeline']='Pinned model-viewer 4.1.0 / local Chromium / WebGL'
      SUMMARY.write_text(json.dumps(meta,indent=2,ensure_ascii=False)+'\n')
      print('POSTER_FROM_SAME_GLB_OK',json.dumps({
        'model':str(MODEL.relative_to(ROOT)),'poster':str(POSTER.relative_to(ROOT)),
        'poster_bytes':POSTER.stat().st_size,'channel_stddev':[round(x,2) for x in std],
        'model_sha256':meta['showroom_model_sha256']
      }))
    finally:
      server.shutdown();server.server_close()

if __name__=='__main__':
    render()
