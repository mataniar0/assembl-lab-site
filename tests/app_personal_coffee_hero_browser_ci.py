"""APP MVP-21: actual photographed coffee table hero; source-CAD-grounded 32-part GLB.

Visual QA confirms the photo and source-model both represent the curved paired-leg
and ring design, not the previous three straight-leg 620mm invented showcase.
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

def check_real_photo(page):
    expect(page.locator('#intro')).to_be_visible()
    expect(page.locator('#personal-coffee-photo')).to_be_visible()
    image=page.locator('#personal-coffee-photo img')
    expect(image).to_be_visible()
    assert image.evaluate('e=>e.complete&&e.naturalWidth>300')
    current=image.evaluate('e=>e.currentSrc')
    assert any(current.endswith('/'+name) for name in [
       '01-hero-finished-angled-480.webp','01-hero-finished-angled-960.webp'])
    assert 'data:image' not in current
    expect(page.locator('.personal-coffee-disclosure')).to_contain_text(
        'צילום השולחן שנבנה בפועל')
    expect(page.locator('#personal-coffee-show-photo')).to_have_attribute(
        'aria-pressed','true')
    expect(page.locator('#personal-coffee-model')).to_be_hidden()

def read_model(page):
    return page.evaluate("""async () => {
      const e=document.querySelector('#personal-coffee-model model-viewer');
      const bytes=new Uint8Array(await (await fetch(e.src)).arrayBuffer());
      const dv=new DataView(bytes.buffer);
      if(dv.getUint32(0,true)!==0x46546c67)throw Error('NOT_GLB');
      const n=dv.getUint32(12,true);
      const d=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+n)).trim());
      return {extras:d.extras,nodes:d.nodes.map(x=>x.name),
        meshes:d.meshes.map(m=>m.name),
        materials:d.materials.map(m=>m.name),
        images:d.images.length,
        vertexCounts:d.meshes.map(m=>d.accessors[m.primitives[0].attributes.POSITION].count),
        indices:d.meshes.map(m=>m.primitives[0].indices),
        colors:d.meshes.map(m=>Object.hasOwn(m.primitives[0].attributes,'COLOR_0')),
        wood:d.meshes[28].primitives[0].material,
        ring:d.meshes[31].primitives[0].material,
        url:e.src};
    }""")

def run(browser_path,output):
    output.mkdir(parents=True,exist_ok=True)
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),
        partial(QuietServer,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    url=f'http://127.0.0.1:{server.server_port}'
    results=[]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,executable_path=browser_path,
              args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
            for w,h in [(390,844),(1440,900)]:
                context=browser.new_context(viewport={'width':w,'height':h},
                    reduced_motion='reduce',service_workers='block')
                page=context.new_page()
                external=[];errors=[]
                def route_req(route):
                    if urlparse(route.request.url).hostname not in ('127.0.0.1','localhost',''):
                        external.append(route.request.url);route.abort()
                    else:route.continue_()
                page.route('**/*',route_req)
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(url+'/app/',wait_until='networkidle')
                check_real_photo(page)
                page.screenshot(path=str(output/f'coffee-built-photo-{w}.png'),full_page=False)
                page.locator('#personal-coffee-show-model').click()
                expect(page.locator('#personal-coffee-model model-viewer')).to_be_visible(timeout=45000)
                expect(page.locator('#personal-coffee-model-status')).to_contain_text(
                    'רגליים מעוקלות בזוגות',timeout=45000)
                view=page.locator('#personal-coffee-model model-viewer')
                assert view.evaluate('e=>e.loaded') is True
                glb=read_model(page)
                assert glb['extras']['geometry_kind']=='CTB01_PHOTO_GROUNDED_DESIGN_PREVIEW'
                assert glb['extras']['preserved_geometry'] is True
                assert glb['extras']['source_mesh_count']==32
                assert glb['extras']['paired_curved_legs']==3
                assert glb['extras']['paired_leg_plates']==6
                assert glb['extras']['engineering_approval'] is False
                assert glb['extras']['photo_exact_reconstruction'] is False
                assert glb['wood']==0 and glb['ring']==2
                assert all(c is False for c in glb['colors'])
                assert glb['images']==2
                assert len(glb['nodes'])==33
                assert glb['nodes'].count('photo-finish-node-P06_BONDED')==1
                assert sum('photo-finish-node-L' in x and '_P01_' in x
                           for x in glb['nodes'])==6
                assert 'photo-finish-P07T' in glb['meshes']
                assert glb['url'].startswith('blob:')
                assert glb['vertexCounts'][28]>1000
                camera=view.evaluate('e=>e.getCameraOrbit().theta')
                view.evaluate("""e => {
                    const orbit=e.getCameraOrbit();
                    e.cameraOrbit=(orbit.theta*180/Math.PI+30)+'deg 70deg auto';
                    e.jumpCameraToGoal();
                }""")
                assert abs(view.evaluate('e=>e.getCameraOrbit().theta')-camera)>.25
                page.screenshot(path=str(output/f'coffee-real-structure-3d-{w}.png'),full_page=False)
                page.locator('#personal-coffee-show-photo').click()
                check_real_photo(page)
                page.locator('#lang').click()
                expect(page.locator('html')).to_have_attribute('lang','en')
                expect(page.locator('.personal-coffee-disclosure')).to_contain_text(
                    'real photograph of the built table')
                page.locator('#personal-coffee-show-model').click()
                expect(page.locator('#personal-coffee-model-status')).to_contain_text(
                    'paired curved legs',timeout=45000)
                assert view.evaluate('e=>e.loaded')
                page.locator('#personal-coffee-show-photo').click()
                page.locator('#lang').click()
                expect(page.locator('html')).to_have_attribute('lang','he')
                page.locator('#start').click()
                expect(page.locator('#capture')).to_be_visible()
                assert page.locator('#drawers').count()==1,'Prior nightstand flow must remain intact'
                assert not errors,'JS errors: '+str(errors)
                assert not external,'External network requests: '+str(external)
                results.append({'viewport':w,'hero':'REAL_FINISHED_PRODUCT_PHOTO',
                    'source_geometry':'FROZEN_32_PART_CTB01',
                    'three_paired_curved_legs':True,'dark_ring':True,
                    'original_built_dimensions_verified':False})
                print('PASS source-photo + correct curved-leg/ring GLB',w,h)
                context.close()

            offline=browser.new_context(viewport={'width':390,'height':844})
            page=offline.new_page()
            page.goto(url+'/app/',wait_until='networkidle')
            page.evaluate("""async () => {
              const sw=await navigator.serviceWorker.ready;
              await sw.update();
            }""")
            page.reload(wait_until='networkidle')
            for rel in [
              './photo-grounded-coffee-glb.mjs',
              './realistic-glb.mjs',
              '../table/personal/media/personal-design-preview.glb',
              '../table/personal/media/01-hero-finished-angled-480.webp',
              '../table/personal/media/01-hero-finished-angled-960.webp',
              '../assets/vendor/model-viewer-4.1.0/model-viewer.min.js'
            ]:
                assert page.evaluate("""async r=>
                  !!(await caches.match(new URL(r,location.href).href))""",rel),rel
            offline.set_offline(True)
            page.reload(wait_until='domcontentloaded')
            check_real_photo(page)
            page.locator('#personal-coffee-show-model').click()
            expect(page.locator('#personal-coffee-model-status')).to_contain_text(
               'רגליים מעוקלות בזוגות',timeout=45000)
            assert page.locator('#personal-coffee-model model-viewer').evaluate('e=>e.loaded')
            print('PASS offline real product photo + source-based 32-part GLB')
            offline.close()

            fallback=browser.new_context(viewport={'width':390,'height':844})
            fallback.add_init_script('HTMLCanvasElement.prototype.getContext=function(){return null}')
            page=fallback.new_page();page.goto(url+'/app/',wait_until='networkidle')
            check_real_photo(page)
            page.locator('#personal-coffee-show-model').click()
            expect(page.locator('#personal-coffee-model-status')).to_contain_text(
                'תלת־ממד אינו זמין במכשיר זה')
            expect(page.locator('#personal-coffee-photo')).to_be_visible()
            assert page.locator('model-viewer').count()==0
            print('PASS no-WebGL real photo remains visible')
            fallback.close()
            browser.close()
    finally:
        server.shutdown();server.server_close()

    (output/'browser-qa.json').write_text(json.dumps({
        'scope':'APP_MVP_21_SOURCE_CTB01_PHOTO_GROUNDED',
        'results':results,'offline':'PASS','no_webgl':'REAL_PHOTO_RETAINED'
    },indent=2)+'\n',encoding='utf8')

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--browser',required=True)
    p.add_argument('--output',default='.qa-reports/app-mvp-21')
    args=p.parse_args()
    run(args.browser,Path(args.output))
