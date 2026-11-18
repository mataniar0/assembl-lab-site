"""MVP-24: ASSEMBL LAB Geometric landing product photograph + design-only
15-part frame GLB. On the original catalog page the 3D model is explicitly
unverified and has NO tabletop; we retain that limitation in the app.
"""
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

def verify_geometric_photo(page):
    expect(page.locator('#intro')).to_be_visible()
    image=page.locator('#personal-coffee-photo img')
    expect(image).to_be_visible()
    assert image.evaluate('e=>e.complete && e.naturalWidth>500')
    assert image.evaluate('e=>new URL(e.currentSrc).pathname').endswith(
        '/assets/geometric-engineering-object-clean.webp')
    expect(page.locator('.personal-coffee-disclosure')).to_contain_text(
        'שלדה בת 15 חלקים ללא פלטה עליונה')
    expect(page.locator('#personal-coffee-show-photo')).to_have_attribute(
        'aria-pressed','true')
    expect(page.locator('#personal-coffee-model')).to_be_hidden()

def verify_geometric_glb(page):
    host=page.locator('#personal-coffee-model')
    expect(host).to_be_visible(timeout=45000)
    expect(host).to_have_attribute('data-state','interactive',timeout=45000)
    expect(page.locator('#personal-coffee-model-status')).to_contain_text(
        'שלדה בת 15 חלקים',timeout=45000)
    viewer=page.locator('#personal-coffee-model model-viewer')
    expect(viewer).to_be_visible()
    assert viewer.evaluate('e=>e.loaded')
    assert viewer.evaluate('e=>new URL(e.src).pathname').endswith(
        '/geometric/media/geometric-v11-design-only.glb')
    metadata=viewer.evaluate("""async e=>{
      const bytes=new Uint8Array(await (await fetch(e.src)).arrayBuffer());
      const dv=new DataView(bytes.buffer);
      if(dv.getUint32(0,true)!==0x46546c67 ||
         dv.getUint32(4,true)!==2)throw Error('BAD_GLB');
      const length=dv.getUint32(12,true);
      const meta=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+length)).trim());
      return {version:meta.asset.version,meshes:meta.meshes?.length||0,
        bytes:bytes.length,url:e.src};
    }""")
    assert metadata['version']=='2.0'
    assert metadata['meshes']>=1
    assert metadata['bytes']==58312
    return viewer

def run(browser_path,output):
    output.mkdir(parents=True,exist_ok=True)
    server=http.server.ThreadingHTTPServer(
        ('127.0.0.1',0),partial(QuietServer,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True)
    thread.start()
    root=f'http://127.0.0.1:{server.server_port}'
    results=[]
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,executable_path=browser_path,
                args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
            for w,h in [(390,844),(1440,900)]:
                context=browser.new_context(viewport={'width':w,'height':h},
                    reduced_motion='reduce',service_workers='block')
                page=context.new_page()
                external=[];errors=[]
                def guard(route):
                    if urlparse(route.request.url).hostname not in ('127.0.0.1','localhost',''):
                        external.append(route.request.url);route.abort()
                    else:route.continue_()
                page.route('**/*',guard)
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(root+'/app/',wait_until='networkidle')
                verify_geometric_photo(page)
                page.screenshot(path=str(output/f'geometric-intro-photo-{w}.png'),full_page=False)
                page.locator('#personal-coffee-show-model').click()
                viewer=verify_geometric_glb(page)
                orbit=viewer.evaluate('e=>e.getCameraOrbit().theta')
                viewer.evaluate("""e=>{
                    const o=e.getCameraOrbit();
                    e.cameraOrbit=(o.theta*180/Math.PI+30)+'deg 70deg auto';
                    e.jumpCameraToGoal();
                }""")
                assert abs(viewer.evaluate('e=>e.getCameraOrbit().theta')-orbit)>.25
                page.screenshot(path=str(output/f'geometric-frame-only-3d-{w}.png'),full_page=False)
                page.locator('#personal-coffee-show-photo').click()
                verify_geometric_photo(page)
                page.locator('#lang').click()
                expect(page.locator('html')).to_have_attribute('lang','en')
                expect(page.locator('.personal-coffee-disclosure')).to_contain_text(
                    '15-part frame without the tabletop')
                page.locator('#personal-coffee-show-model').click()
                expect(page.locator('#personal-coffee-model-status')).to_contain_text(
                    '15-part frame',timeout=45000)
                page.locator('#personal-coffee-show-photo').click()
                page.locator('#lang').click()
                expect(page.locator('html')).to_have_attribute('lang','he')
                page.locator('#start').click()
                expect(page.locator('#capture')).to_be_visible()
                assert not errors,errors
                assert not external,external
                results.append({'viewport':w,'intro':'GEOMETRIC_TRUE_PHOTO',
                    'preview':'GEOMETRIC_V11_FRAME_ONLY_15_PART_NO_TOP',
                    'external_requests':0})
                print('PASS Geometric hero + design-only 3D',w,h)
                context.close()

            # MVP-25 regression: a new network-first HTML page may still be
            # controlled by an old cache-first PWA worker. Legacy unversioned
            # JS and CSS must not affect Geometric photo or frame-only GLB.
            stale=browser.new_context(viewport={'width':390,'height':844},
                reduced_motion='reduce')
            page=stale.new_page()
            stale_errors=[]
            page.on('pageerror',lambda e:stale_errors.append(str(e)))
            page.goto(root+'/app/',wait_until='networkidle')
            page.evaluate('async ()=>{await navigator.serviceWorker.ready}')
            page.reload(wait_until='networkidle')
            page.evaluate("""async ()=>{
              const old=await caches.open('qa-old-unversioned-entry-assets');
              for(const path of [
                './personal-coffee-hero.mjs','./return-3d.mjs',
                './nightstand-intent.js','./design-studio.js','./personal-coffee-hero.css',
                './return-3d.css'
              ]){
                const css=path.endsWith('.css');
                const body=css?'#personal-coffee-hero {display:none !important}':
                  'throw new Error("STALE_COFFEE_APP_SCRIPT_USED")';
                await old.put(new URL(path,location.href),
                  new Response(body,{headers:{'Content-Type':
                    css?'text/css':'text/javascript'}}));
              }
            }""")
            # If unversioned entry paths are loaded from the old cache here,
            # they would crash the page or hide the Geometric photo.
            page.reload(wait_until='networkidle')
            verify_geometric_photo(page)
            assert page.locator('#personal-coffee-hero').is_visible()
            for selector in [
                'link[href^="./personal-coffee-hero.css"]',
                'link[href^="./return-3d.css"]',
                'script[src^="./personal-coffee-hero.mjs"]',
                'script[src^="./return-3d.mjs"]',
                'script[src^="./nightstand-intent.js"]',
                'script[src^="./design-studio.js"]'
            ]:
                assert page.locator(selector).get_attribute('href' if selector.startswith('link') else 'src').endswith(
                    '?v=mvp26-20261118')
            page.locator('#personal-coffee-show-model').click()
            verify_geometric_glb(page)
            assert not stale_errors,stale_errors
            page.screenshot(path=str(output/'geometric-upgrade-old-cache-390.png'),full_page=False)
            print('PASS Geometric intro with stale unversioned PWA assets preseeded')
            stale.close()

            offline=browser.new_context(viewport={'width':390,'height':844})
            page=offline.new_page()
            page.goto(root+'/app/',wait_until='networkidle')
            page.evaluate("""async ()=>{
              const reg=await navigator.serviceWorker.ready;
              await reg.update();
            }""")
            page.reload(wait_until='networkidle')
            for rel in [
                '../assets/geometric-engineering-object-clean.webp',
                '../geometric/media/geometric-v11-design-only.glb',
                '../table/personal/media/personal-design-preview.glb',
                '../table/personal/media/01-hero-finished-angled-960.webp',
                '../assets/vendor/model-viewer-4.1.0/model-viewer.min.js']:
                assert page.evaluate("""async rel=>
                  !!(await caches.match(new URL(rel,location.href).href))""",rel),rel
            offline.set_offline(True)
            page.reload(wait_until='domcontentloaded')
            verify_geometric_photo(page)
            page.locator('#personal-coffee-show-model').click()
            verify_geometric_glb(page)
            print('PASS offline Geometric photo and frame-only GLB')
            offline.close()

            fallback=browser.new_context(viewport={'width':390,'height':844})
            fallback.add_init_script(
                'HTMLCanvasElement.prototype.getContext=function(){return null}')
            page=fallback.new_page()
            page.goto(root+'/app/',wait_until='networkidle')
            verify_geometric_photo(page)
            page.locator('#personal-coffee-show-model').click()
            expect(page.locator('#personal-coffee-photo')).to_be_visible()
            expect(page.locator('#personal-coffee-model')).to_be_hidden()
            expect(page.locator('#personal-coffee-model-status')).to_contain_text(
                'לא ניתן להציג תלת־ממד')
            assert page.locator('#personal-coffee-model model-viewer').count()==0
            print('PASS Geometric real photo remains on no-WebGL')
            fallback.close()
            browser.close()
    finally:
        server.shutdown();server.server_close()
    (output/'browser-qa.json').write_text(json.dumps({
        'scope':'APP_MVP_24_GEOMETRIC_INTRO_FRAME_ONLY_GLB',
        'results':results,'offline':'PASS','no_webgl':'PHOTO_RETAINED',
        'stale_pwa_cache_upgrade':'PASS'
    },indent=2)+'\n',encoding='utf8')

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--browser',required=True)
    p.add_argument('--output',default='.qa-reports/app-mvp-24-geometric')
    a=p.parse_args()
    run(a.browser,Path(a.output))
