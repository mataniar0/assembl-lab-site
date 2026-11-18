"""MVP-26: round coffee table schematic and fixed Personal Coffee 32-part
source-verified GLB after approval. User dimensions and choices are recorded
but NOT applied to the immutable GLB. Same-origin/offline/no private uploads.
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
        'שולחן קפה עגול — פיילוט')

def set_design(page,finish,base,diameter,height,thickness):
    page.locator('#finish').select_option(finish)
    page.locator('#base-style').select_option(base)
    page.locator('#diameter-cm').fill(str(diameter))
    page.locator('#height-cm').fill(str(height))
    page.locator('#top-thickness-mm').select_option(str(thickness))
    expect(page.locator('#config-scene svg[data-furniture="round-coffee-table"]')).to_be_visible()


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
                # Reject off-range coffee dimensions before creating a version.
                page.locator('#diameter-cm').fill('39')
                page.locator('#generate').click()
                expect(page.locator('#design-error')).to_be_visible()
                expect(page.locator('#configure')).to_be_visible()
                set_design(page,'walnut','curved-open',78,60,40)
                page.locator('#description').fill(
                    'PRIVATE_NOTE_NOT_FOR_GLB customer@example.invalid')
                page.locator('#generate').click()
                expect(page.locator('#current-label')).to_have_text('V1')
                expect(page.locator('#result-scene svg[data-furniture="round-coffee-table"]')).to_be_visible()
                assert page.locator('#result-scene svg').get_attribute('data-base-style')=='curved-open'
                assert page.locator('#drawers').count()==0
                assert page.locator('#bottom').count()==0
                expect(page.locator('#design-summary')).to_contain_text('קוטר 78 cm')
                expect(page.locator('#design-summary')).to_contain_text('גובה 60 cm')
                viewer=approve(page)
                summary=page.locator('#approved-3d-summary')
                expect(summary).to_contain_text('visual-v1')
                expect(summary).to_contain_text('780 mm')
                expect(summary).to_contain_text('600 mm')
                expect(summary).to_contain_text('curved-open')
                expect(summary).to_contain_text('40 mm')
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
                set_design(page,'natural','curved-ring',62,45,20)
                page.locator('#description').fill('')
                page.locator('#generate').click()
                expect(page.locator('#current-label')).to_have_text('V2')
                approve(page)
                glb2=get_glb(page)
                validate_original_coffee_model(glb2)
                assert glb2['hash']==original_hash,'fixed reference should not falsely change with customer choices'
                expect(summary).to_contain_text('visual-v2')
                expect(summary).to_contain_text('620 mm')
                expect(summary).to_contain_text('450 mm')
                expect(summary).to_contain_text('curved-ring')
                page.locator('#approved-back').click()
                page.locator('#versions button').filter(has_text='V1').click()
                expect(page.locator('#diameter-cm')).to_have_value('78')
                expect(page.locator('#height-cm')).to_have_value('60')
                expect(page.locator('#base-style')).to_have_value('curved-open')
                expect(page.locator('#top-thickness-mm')).to_have_value('40')
                approve(page)
                assert get_glb(page)['hash']==original_hash
                expect(summary).to_contain_text('visual-v1')
                selections=page.evaluate('window.approvedSelections')
                assert [v['version_id'] for v in selections]==[
                    'visual-v1','visual-v2','visual-v1']
                assert all(set(v)=={'version_id','finish','base_style',
                    'tabletop_thickness_mm','dimensions_mm'} for v in selections)
                assert selections[0]['dimensions_mm']=={'diameter':780,'height':600}
                assert selections[1]['dimensions_mm']=={'diameter':620,'height':450}
                assert 'PRIVATE_NOTE' not in json.dumps(selections)
                assert 'example.invalid' not in json.dumps(selections)
                assert not external,external
                assert not errors,errors
                assert page.evaluate('localStorage.length')==0
                if w in (390,1440):
                    page.screenshot(path=str(output/f'approved-personal-coffee-glb-{w}.png'),
                                    full_page=True)
                # Quick actions are coffee-specific and generate a distinct round version.
                page.locator('#approved-back').click()
                page.locator('.quick-actions [data-change="baseStyle"]').click()
                expect(page.locator('#current-label')).to_have_text('V3')
                expect(page.locator('#result-scene svg[data-furniture="round-coffee-table"]')).to_be_visible()
                assert page.locator('#result-scene svg').get_attribute('data-base-style')=='curved-ring'
                expect(page.locator('#design-summary')).to_contain_text('רגליים מעוקלות עם טבעת')
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
            set_design(page,'honey','curved-ring',68,46,30)
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
            set_design(page,'natural','curved-ring',62,45,20)
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
