"""APP MVP-28: same-site chooser, independent frozen Marketing V1, working development.

The test uses only local synthetic assets, no real customer submissions.
"""
from __future__ import annotations
import argparse
import http.server
from functools import partial
import json
from pathlib import Path
import threading
import time
from playwright.sync_api import Error as PlaywrightError
from urllib.parse import urlparse
from playwright.sync_api import expect,sync_playwright

ROOT=Path(__file__).resolve().parents[1]

class QuietServer(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass

def run(browser_path:str,output:Path)->None:
    output.mkdir(parents=True,exist_ok=True)
    server=http.server.ThreadingHTTPServer(
        ('127.0.0.1',0),partial(QuietServer,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True)
    thread.start()
    root=f'http://127.0.0.1:{server.server_port}'
    result=[]
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,executable_path=browser_path)
            for width,height in [(320,740),(390,844),(768,900),(1440,900)]:
                ctx=browser.new_context(viewport={'width':width,'height':height},
                    reduced_motion='reduce')
                page=ctx.new_page()
                errors=[]
                external=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('request',lambda request:external.append(request.url)
                    if urlparse(request.url).hostname not in ('127.0.0.1','localhost') else None)
                page.goto(root+'/app/',wait_until='networkidle')
                expect(page.locator('#app-mode-chooser')).to_be_visible()
                expect(page.locator('#mode-marketing-link')).to_be_visible()
                expect(page.locator('#mode-enter-development')).to_be_visible()
                assert page.locator('main#app').evaluate('el=>el.inert')
                assert page.locator('#mode-marketing-link').get_attribute('href')=='../marketing/v1/app/'
                if width==390:
                    page.locator('#mode-lang').click()
                    expect(page.locator('#mode-title')).to_have_text('Choose your experience')
                    expect(page.locator('#mode-enter-development')).to_contain_text('Development version')
                    page.locator('#mode-lang').click()
                    expect(page.locator('#mode-title')).to_have_text('באיזו גרסה נמשיך?')
                # The development choice unlocks the actual live UI, not a mock.
                page.locator('#mode-enter-development').click()
                expect(page.locator('#app-mode-chooser')).to_be_hidden()
                assert not page.locator('main#app').evaluate('el=>el.inert')
                expect(page.locator('#intro')).to_be_visible()
                page.locator('#start').click()
                expect(page.locator('#capture')).to_be_visible()
                page.locator('#mode-switch').click()
                expect(page.locator('#app-mode-chooser')).to_be_visible()
                page.locator('#mode-marketing-link').click()
                page.wait_for_url('**/marketing/v1/app/')
                expect(page.locator('#intro')).to_be_visible()
                assert page.locator('#app-mode-chooser').count()==0
                img=page.locator('#personal-coffee-photo img')
                expect(img).to_be_visible()
                assert img.evaluate('im=>im.complete&&im.naturalWidth>0')
                assert urlparse(img.get_attribute('src')).path.endswith(
                    'geometric-engineering-object-clean.webp')
                assert '/marketing/v1/' in img.evaluate('im=>im.currentSrc')
                meta=page.evaluate("""async()=>{
                    const r=await fetch('../demo-version.json');
                    return r.ok?await r.json():null;
                }""")
                assert meta and meta['frozen'] and meta['real_inquiries'] is False
                assert meta['source_commit']=='d05830451a918f00dc484acf985c794443dc36f9'
                assert page.locator('#personal-coffee-model').get_attribute('data-model-src')==(
                  '../geometric/media/geometric-v11-design-only.glb')
                # The marketing PWA must work offline without changing the live PWA.
                # Installation claims the client and reloads it once. Avoid
                # racing an evaluation with service-worker controllerchange.
                deadline=time.monotonic()+25
                while time.monotonic()<deadline:
                    try:
                        controlled=page.evaluate(
                            "()=>Boolean(navigator.serviceWorker.controller)")
                        if controlled:break
                    except PlaywrightError as e:
                        if 'Execution context was destroyed' not in str(e):
                            raise
                    time.sleep(.25)
                else:
                    raise AssertionError('Marketing V1 PWA never controlled the page')
                page.wait_for_load_state('networkidle')
                scope=page.evaluate("()=>navigator.serviceWorker.controller?.scriptURL||''")
                assert scope.endswith('/marketing/v1/app/sw.js'),scope
                ctx.set_offline(True)
                page.reload(wait_until='domcontentloaded')
                expect(page.locator('#intro')).to_be_visible()
                expect(page.locator('#personal-coffee-photo img')).to_be_visible()
                assert page.locator('#personal-coffee-photo img').evaluate(
                    'im=>im.complete&&im.naturalWidth>0')
                ctx.set_offline(False)
                page.goto(root+'/marketing/v1/inquiry/',wait_until='domcontentloaded')
                expect(page.locator('body')).to_contain_text('אין שליחת פניות')
                assert not errors,errors
                assert not external,external
                result.append({'viewport':width,'height':height,'chooser':'PASS',
                    'development':'PASS','frozen_marketing':'PASS','offline':'PASS'})
                print('PASS',width,height,'chooser/dev/frozen-marketing/offline/HE-EN')
                ctx.close()
            browser.close()
    finally:
        server.shutdown();server.server_close()
    (output/'mode-selection.json').write_text(json.dumps({
        'scenario':'APP_MVP_28_TWO_INDEPENDENT_VERSIONS',
        'results':result,'source_commit':'d05830451a918f00dc484acf985c794443dc36f9'
    },indent=2)+'\n',encoding='utf8')

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--browser',required=True)
    ap.add_argument('--output',default='.qa-reports/app-mvp-28')
    args=ap.parse_args()
    run(args.browser,Path(args.output))
