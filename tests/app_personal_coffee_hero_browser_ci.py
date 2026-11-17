"""MVP-20: 3D coffee table and landing hero are ONE loaded GLB, not two products."""
from __future__ import annotations
import argparse
from functools import partial
import http.server
import json
from pathlib import Path
import threading
from urllib.parse import urlparse
from playwright.sync_api import expect, sync_playwright

ROOT=Path(__file__).resolve().parents[1]
class QuietServer(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass

def assert_matching_hero(page):
    expect(page.locator('#intro')).to_be_visible()
    image=page.locator('#personal-coffee-photo img')
    expect(image).to_have_attribute('data-showcase-source','exact-loaded-coffee-glb',timeout=45000)
    expect(page.locator('#personal-coffee-photo')).to_be_visible()
    src=image.get_attribute('src')
    assert src.startswith('data:image/png;base64,') and len(src)>5000
    assert image.evaluate('e=>e.complete&&e.naturalWidth>200')
    view=page.locator('#personal-coffee-model model-viewer')
    assert view.evaluate('e=>e.loaded') is True
    assert view.evaluate("e=>e.src.startsWith('blob:')") is True
    assert page.locator('#personal-coffee-model').get_attribute('data-state')=='preview'
    expect(page.locator('.personal-coffee-disclosure')).to_contain_text(
        'אותו GLB'
    )
    return src

def model_metadata(page):
    return page.evaluate("""async () => {
      const el=document.querySelector('#personal-coffee-model model-viewer');
      const data=new Uint8Array(await (await fetch(el.src)).arrayBuffer());
      const v=new DataView(data.buffer);
      if(v.getUint32(0,true)!==0x46546c67)throw Error('not glTF');
      const n=v.getUint32(12,true);
      const json=JSON.parse(new TextDecoder().decode(data.slice(20,20+n)).trim());
      return {extras:json.extras,nodeNames:json.nodes.map(x=>x.name),
        materials:json.materials.length,images:json.images.length};
    }""")

def run(browser_path,output):
    output.mkdir(parents=True,exist_ok=True)
    server=http.server.ThreadingHTTPServer(
        ('127.0.0.1',0),partial(QuietServer,directory=str(ROOT)))
    t=threading.Thread(target=server.serve_forever,daemon=True);t.start()
    base=f'http://127.0.0.1:{server.server_port}'
    results=[]
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,executable_path=browser_path,
                args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
            for width,height in [(390,844),(1440,900)]:
                context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
                page=context.new_page()
                external=[];errors=[]
                def check_request(route):
                    if urlparse(route.request.url).hostname not in ('127.0.0.1','localhost'):
                        external.append(route.request.url);route.abort()
                    else:route.continue_()
                page.route('**/*',check_request)
                page.on('pageerror',lambda error:errors.append(str(error)))
                page.goto(base+'/app/',wait_until='networkidle')
                original_hero=assert_matching_hero(page)
                page.screenshot(path=str(output/f'coffee-matched-hero-{width}.png'),full_page=False)
                page.locator('#personal-coffee-show-model').click()
                expect(page.locator('#personal-coffee-model')).to_have_attribute('data-state','interactive')
                expect(page.locator('#personal-coffee-photo')).to_be_hidden()
                view=page.locator('model-viewer')
                assert view.get_attribute('camera-controls') is not None
                meta=model_metadata(page)
                assert meta['extras']['geometry_kind']=='MATCHED_COFFEE_TABLE_SHOWROOM'
                assert meta['extras']['marketing_assets']=='hero snapshot captured directly from this GLB'
                assert meta['extras']['verified_as_built'] is False
                assert meta['nodeNames'].count('oak-round-tabletop')==1
                assert len([n for n in meta['nodeNames'] if n.startswith('satin-black-tapered-leg-')])==3
                assert meta['images']==2 and meta['materials']==3
                orbit0=view.evaluate('e=>e.getCameraOrbit().theta')
                view.evaluate("""e => {
                    const o=e.getCameraOrbit();
                    e.cameraOrbit=(o.theta*180/Math.PI+25)+'deg 68deg 1.35m';
                    e.jumpCameraToGoal();
                }""")
                orbit1=view.evaluate('e=>e.getCameraOrbit().theta')
                assert abs(orbit1-orbit0)>.25
                page.screenshot(path=str(output/f'coffee-matched-3d-{width}.png'),full_page=False)
                page.locator('#personal-coffee-show-photo').click()
                assert_matching_hero(page)
                assert page.locator('#personal-coffee-photo img').get_attribute('src')==original_hero
                page.locator('#lang').click()
                expect(page.locator('html')).to_have_attribute('lang','en')
                expect(page.locator('.personal-coffee-disclosure')).to_contain_text('same GLB')
                page.locator('#personal-coffee-show-model').click()
                expect(page.locator('#personal-coffee-model')).to_have_attribute('data-state','interactive')
                page.locator('#personal-coffee-show-photo').click()
                page.locator('#lang').click()
                expect(page.locator('html')).to_have_attribute('lang','he')
                page.locator('#start').click()
                expect(page.locator('#capture')).to_be_visible()
                assert page.locator('#drawers').count()==1, 'Existing nightstand prototype flow must not mislabel coffee table'
                assert not errors,f'page JS errors {errors}'
                assert not external,f'unexpected external requests {external}'
                results.append({'width':width,'hero_is_GLb_snapshot':True,'fidelity':'exact_model_geometry','external_requests':0})
                print('PASS matching GLB and generated screenshot hero',width)
                context.close()

            offline=browser.new_context(viewport={'width':390,'height':844})
            page=offline.new_page()
            page.goto(base+'/app/',wait_until='networkidle')
            page.evaluate("""async () => {
               const reg=await navigator.serviceWorker.ready;await reg.update();
            }""")
            page.reload(wait_until='networkidle')
            for rel in ['./coffee-showroom-glb.mjs','./realistic-glb.mjs',
                './personal-coffee-hero.mjs','../assets/vendor/model-viewer-4.1.0/model-viewer.min.js']:
                assert page.evaluate("""async u=>!!(await caches.match(new URL(u,location.href).href))""",rel),rel
            offline.set_offline(True)
            page.reload(wait_until='domcontentloaded')
            assert_matching_hero(page)
            page.locator('#personal-coffee-show-model').click()
            expect(page.locator('#personal-coffee-model')).to_have_attribute('data-state','interactive')
            print('PASS offline screenshot from exact GLB')
            offline.close()

            fallback=browser.new_context(viewport={'width':390,'height':844})
            fallback.add_init_script('HTMLCanvasElement.prototype.getContext=function(){return null}')
            page=fallback.new_page();page.goto(base+'/app/',wait_until='networkidle')
            expect(page.locator('#personal-coffee-photo')).to_be_visible()
            expect(page.locator('#personal-coffee-model')).to_be_hidden()
            expect(page.locator('#personal-coffee-model-status')).to_contain_text(
                'לא ניתן לייצר תמונת ראווה')
            assert page.locator('model-viewer').count()==0
            print('PASS no WebGL explicitly marked illustration fallback')
            fallback.close()
            browser.close()
    finally:
        server.shutdown();server.server_close()
    (output/'browser-qa.json').write_text(json.dumps({
        'scope':'APP_MVP_20_MATCHED_MODEL_AND_HERO',
        'results':results,'offline':'PASS','no_webgl':'LABELED_FALLBACK'
    },indent=2)+'\n',encoding='utf8')

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--browser',required=True)
    p.add_argument('--output',default='.qa-reports/app-mvp-20')
    a=p.parse_args()
    run(a.browser,Path(a.output))
