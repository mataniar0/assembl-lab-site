"""MVP-24: after legacy pilot approval, show the existing fixed Personal Coffee
Table 32-part source-verified GLB in the main app. Do NOT claim that nightstand
form fields are applied to its mesh. All content stays same-origin and offline.
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

def flow_to_config(page):
    page.locator('#start').click()
    expect(page.locator('#capture')).to_be_visible()
    page.locator('#demo').click()
    page.locator('#capture-next').click()
    expect(page.locator('#configure')).to_be_visible()
    expect(page.locator('#configure')).to_contain_text(
        'טופס הפיילוט עדיין מגדיר שידת לילה')

def set_design(page,finish,drawers,lower,width,height,depth,thickness):
    page.locator('#finish').select_option(finish)
    page.locator('#drawers').select_option(str(drawers))
    page.locator('#bottom').select_option(lower)
    page.locator('#width-cm').fill(str(width))
    page.locator('#height-cm').fill(str(height))
    page.locator('#depth-cm').fill(str(depth))
    page.locator('#plywood-thickness').select_option(str(thickness))

def approve(page):
    expect(page.locator('#review')).to_be_visible()
    page.locator('#open-approval').click()
    expect(page.locator('#approval-dialog')).to_be_visible()
    page.locator('#confirm-approval').click()
    expect(page.locator('#approved')).to_be_visible()
    expect(page.locator('#approved-3d')).to_be_visible()
    expect(page.locator('#approved-glb-host')).to_have_attribute('data-state','ready',timeout=45000)
    viewer=page.locator('#approved-glb-host model-viewer')
    expect(viewer).to_be_visible()
    assert viewer.evaluate('e=>e.loaded')
    expect(page.locator('#approved-glb-status')).to_contain_text('שולחן הקפה האישי')
    expect(page.locator('#approved-coffee-fallback')).to_be_hidden()
    return viewer

def get_glb(page):
    return page.evaluate("""async ()=>{
      const e=document.querySelector('#approved-glb-host model-viewer');
      const bytes=new Uint8Array(await (await fetch(e.src)).arrayBuffer());
      const v=new DataView(bytes.buffer);
      if(v.getUint32(0,true)!==0x46546c67 ||
         v.getUint32(4,true)!==2)throw Error('BAD_GLB');
      const n=v.getUint32(12,true);
      const d=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+n)).trim());
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      return {extras:d.extras,meshes:d.meshes.length,nodes:d.nodes.map(x=>x.name),
        materials:d.materials.map(x=>x.name),images:d.images.length,
        hash:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')};
    }""")

def validate_original_coffee_model(glb):
    assert glb['extras']['geometry_kind']=='CTB01_PHOTO_GROUNDED_DESIGN_PREVIEW'
    assert glb['extras']['preserved_geometry'] is True
    assert glb['extras']['source_mesh_count']==32
    assert glb['extras']['paired_curved_legs']==3
    assert glb['extras']['engineering_approval'] is False
    assert glb['extras']['photo_exact_reconstruction'] is False
    assert glb['meshes']==32
    assert glb['images']==2
    assert 'photo-finish-P07T' in glb['nodes'][0] or len(glb['nodes'])>=32
    assert any('layered wooden drum rim' in x for x in glb['materials'])

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
            for w,h in [(320,740),(390,844),(768,900),(1440,900)]:
                context=browser.new_context(viewport={'width':w,'height':h},
                    reduced_motion='reduce',device_scale_factor=1,
                    service_workers='block')
                page=context.new_page()
                external=[];errors=[]
                def route_req(route):
                    if urlparse(route.request.url).hostname not in ('127.0.0.1','localhost',''):
                        external.append(route.request.url);route.abort()
                    else:route.continue_()
                page.route('**/*',route_req)
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(root+'/app/',wait_until='networkidle')
                page.evaluate("""()=>{
                  window.approvedSelections=[];
                  window.addEventListener('assembl:3d-model-ready',
                    e=>window.approvedSelections.push(e.detail));
                }""")
                flow_to_config(page)
                set_design(page,'walnut',2,'closed',65,95,50,4)
                page.locator('#description').fill(
                    'PRIVATE_NOTE_NOT_FOR_GLB customer@example.invalid')
                page.locator('#generate').click()
                expect(page.locator('#current-label')).to_have_text('V1')
                viewer=approve(page)
                summary=page.locator('#approved-3d-summary')
                expect(summary).to_contain_text('visual-v1')
                expect(summary).to_contain_text('650 × 950 × 500')
                expect(summary).to_contain_text('תכנון קבוע בן 32 חלקים')
                expect(summary).to_contain_text('נתוני הבקשה שלא יושמו במודל')
                expect(page.locator('#approval-record')).to_contain_text(
                    'FIXED_PERSONAL_COFFEE_REFERENCE_GLB')
                assert page.locator('#approved-3d-faces polygon').count()==0
                glb=get_glb(page)
                validate_original_coffee_model(glb)
                original_hash=glb['hash']
                orbit0=viewer.evaluate('e=>e.getCameraOrbit().theta')
                page.locator('#approved-3d-right').click()
                orbit1=viewer.evaluate('e=>e.getCameraOrbit().theta')
                assert abs(orbit1-orbit0)>.25
                page.locator('#approved-3d-reset').click()
                assert abs(viewer.evaluate('e=>e.getCameraOrbit().theta')-orbit0)<.1
                r0=viewer.evaluate('e=>e.getCameraOrbit().radius')
                page.locator('#approved-3d-zoom-in').click()
                r1=viewer.evaluate('e=>e.getCameraOrbit().radius')
                assert r1<r0
                page.locator('#approved-3d-reset').click()
                page.locator('#lang').click()
                expect(page.locator('html')).to_have_attribute('lang','en')
                expect(summary).to_contain_text('Request inputs NOT applied to model')
                page.locator('#lang').click()
                expect(page.locator('html')).to_have_attribute('lang','he')
                page.locator('#approved-back').click()
                page.locator('#return-config').click()
                expect(page.locator('#configure')).to_be_visible()
                set_design(page,'natural',1,'shelf',50,55,35,6)
                page.locator('#description').fill('')
                page.locator('#generate').click()
                expect(page.locator('#current-label')).to_have_text('V2')
                approve(page)
                glb2=get_glb(page)
                validate_original_coffee_model(glb2)
                assert glb2['hash']==original_hash,'fixed reference should not falsely change with customer choices'
                expect(summary).to_contain_text('visual-v2')
                expect(summary).to_contain_text('500 × 550 × 350')
                expect(summary).to_contain_text('מגירות (בפיילוט הישן): 1')
                page.locator('#approved-back').click()
                page.locator('#versions button').filter(has_text='V1').click()
                approve(page)
                assert get_glb(page)['hash']==original_hash
                expect(summary).to_contain_text('visual-v1')
                selections=page.evaluate('window.approvedSelections')
                assert [v['version_id'] for v in selections]==[
                    'visual-v1','visual-v2','visual-v1']
                assert 'PRIVATE_NOTE' not in json.dumps(selections)
                assert 'example.invalid' not in json.dumps(selections)
                assert not external,external
                assert not errors,errors
                assert page.evaluate('localStorage.length')==0
                if w in (390,1440):
                    page.screenshot(path=str(output/f'approved-personal-coffee-glb-{w}.png'),
                                    full_page=True)
                results.append({'viewport':w,'approved_versions':3,
                    'reference_glb_sha256':original_hash,
                    'customer_fields_altered_geometry':False})
                print('PASS Personal Coffee source GLB after approval',w)
                context.close()

            offline=browser.new_context(viewport={'width':390,'height':844})
            page=offline.new_page()
            page.goto(root+'/app/',wait_until='networkidle')
            page.evaluate("""async ()=>{
              const sw=await navigator.serviceWorker.ready;
              await sw.update();
            }""")
            page.reload(wait_until='networkidle')
            offline.set_offline(True)
            page.reload(wait_until='domcontentloaded')
            flow_to_config(page)
            set_design(page,'honey',2,'shelf',50,55,35,6)
            page.locator('#generate').click()
            approve(page)
            validate_original_coffee_model(get_glb(page))
            print('PASS offline Personal Coffee source GLB after approval')
            offline.close()

            fallback=browser.new_context(viewport={'width':390,'height':844})
            fallback.add_init_script(
                'HTMLCanvasElement.prototype.getContext=function(){return null}')
            page=fallback.new_page()
            page.goto(root+'/app/',wait_until='networkidle')
            flow_to_config(page)
            set_design(page,'natural',1,'shelf',50,55,35,6)
            page.locator('#generate').click()
            page.locator('#open-approval').click()
            page.locator('#confirm-approval').click()
            expect(page.locator('#approved')).to_be_visible()
            expect(page.locator('#approved-3d')).to_be_visible()
            expect(page.locator('#approved-coffee-fallback')).to_be_visible()
            expect(page.locator('#approved-3d-view')).to_be_hidden()
            expect(page.locator('#approved-glb-host')).to_be_hidden()
            expect(page.locator('#approved-glb-status')).to_contain_text('WebGL')
            print('PASS no-WebGL authentic Personal Coffee photo fallback')
            fallback.close()
            browser.close()
    finally:
        server.shutdown();server.server_close()
    (output/'browser-qa.json').write_text(json.dumps({
        'scope':'APP_MVP_24_PERSONAL_FIXED_REFERENCE_GLB_AFTER_APPROVAL',
        'results':results,'offline':'PASS','no_webgl':'AUTHENTIC_PHOTO_FALLBACK'
    },indent=2)+'\n',encoding='utf8')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--browser',required=True)
    parser.add_argument('--output',default='.qa-reports/app-mvp-24-personal')
    args=parser.parse_args()
    run(args.browser,Path(args.output))
