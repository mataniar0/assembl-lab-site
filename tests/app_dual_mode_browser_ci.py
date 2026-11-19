#!/usr/bin/env python3
"""APP MVP-28: one host, dual routes, immutable Marketing V1 and independent PWA scopes."""
from __future__ import annotations
import argparse
import http.server
import json
import threading
from functools import partial
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import expect,sync_playwright
from app_return3d_browser_ci import (
    QuietServer,flow_to_config,set_design,approve,get_glb,validate_original_coffee_model
)
from app_personal_coffee_hero_browser_ci import verify_geometric_photo,verify_geometric_glb

ROOT=Path(__file__).resolve().parents[1]

def run(executable,output):
    output.mkdir(parents=True,exist_ok=True)
    server=http.server.ThreadingHTTPServer(
        ('127.0.0.1',0),partial(QuietServer,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True)
    thread.start()
    host=f'http://127.0.0.1:{server.server_port}'
    report={'selector':[],'marketing':None,'development':None,'offline':None}
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,executable_path=executable,
                args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
            for width,height in ((390,844),(1440,900)):
                ctx=browser.new_context(viewport={'width':width,'height':height},
                    reduced_motion='reduce',service_workers='block')
                page=ctx.new_page()
                errors=[]
                page.on('pageerror',lambda err:errors.append(str(err)))
                page.goto(host+'/app/',wait_until='networkidle')
                expect(page.locator('html')).to_have_attribute('data-app-mode','selector')
                expect(page.locator('a[href="./marketing/v1/"]')).to_be_visible()
                expect(page.locator('a[href="./development/"]')).to_be_visible()
                page.locator('#lang').click()
                expect(page.locator('html')).to_have_attribute('lang','en')
                expect(page.locator('h1')).to_contain_text('Choose your workspace')
                page.locator('#lang').click()
                expect(page.locator('html')).to_have_attribute('lang','he')
                assert not errors,errors
                page.screenshot(path=str(output/f'dual-mode-selector-{width}.png'),full_page=False)
                report['selector'].append(width)
                ctx.close()

            ctx=browser.new_context(viewport={'width':390,'height':844},
                reduced_motion='reduce')
            page=ctx.new_page()
            external=[]
            all_requests=[]
            errors=[]
            page.on('pageerror',lambda err:errors.append(str(err)))
            def guard(route):
                url=route.request.url
                all_requests.append(url)
                if urlparse(url).hostname not in ('127.0.0.1','localhost',''):
                    external.append(url)
                    route.abort()
                else:
                    route.continue_()
            page.route('**/*',guard)
            page.goto(host+'/app/',wait_until='networkidle')
            # Ignore expected selector assets; audit requests starting at Marketing navigation.
            all_requests.clear()
            page.locator('a[href="./marketing/v1/"]').click()
            expect(page.locator('html')).to_have_attribute('data-app-mode','marketing')
            assert page.url.endswith('/app/marketing/v1/')
            verify_geometric_photo(page)
            page.locator('#personal-coffee-show-model').click()
            verify_geometric_glb(page)
            page.locator('#personal-coffee-show-photo').click()
            flow_to_config(page)
            set_design(page,'walnut','curved-open',75,50,40)
            page.locator('#generate').click()
            approve(page)
            validate_original_coffee_model(get_glb(page))
            assert not external,external
            assert not errors,errors
            urls=[urlparse(url).path for url in all_requests]
            escaped=[url for url in urls if url.startswith('/app/') and
                     not (url.startswith('/app/marketing/v1/') or url in ('/app/',))]
            assert not escaped,'Marketing fetched a mutable app asset: '+repr(escaped)
            # A controlled PWA may satisfy the model fetch from CacheStorage,
            # so Playwright's network-route list alone is not a complete request audit.
            source_path='/app/marketing/v1/_snapshot/table/personal/media/personal-design-preview.glb'
            resources=page.evaluate("""()=>performance.getEntriesByType('resource').map(
              e=>new URL(e.name).pathname)""")
            cached=page.evaluate("""async()=>{
              const url=new URL('./_snapshot/table/personal/media/personal-design-preview.glb',location.href);
              const response=await caches.match(url);
              if(!response)return false;
              const bytes=new Uint8Array(await response.arrayBuffer());
              return bytes.length===1700936&&
                new TextDecoder().decode(bytes.slice(0,4))==='glTF';
            }""")
            assert source_path in resources or cached,{
                'source_model_not_loaded_or_cached':source_path,'resources':resources[-30:]}
            audit_resources=[url for url in resources if url.startswith('/app/')]
            leaked=[url for url in audit_resources if not url.startswith('/app/marketing/v1/')]
            assert not leaked,'Marketing resource timings include mutable app assets: '+repr(leaked)
            page.screenshot(path=str(output/'marketing-v1-approved-390.png'),full_page=False)
            report['marketing']={'asset_requests':len(urls),'external':len(external),
                'model':'PERSONAL_COFFEE_FIXED','escape_paths':escaped}
            print('PASS Marketing V1: Geometric intro, round table, fixed Personal Coffee GLB, isolated assets')
            # The frozen Geometric catalogue link must return to Marketing V1;
            # the inactive contact link must not open the live inquiry form.
            page.goto(host+'/app/marketing/v1/_snapshot/geometric/',wait_until='networkidle')
            expect(page.locator('a[href="../inquiry/?product=geometric"]')).to_have_count(1)
            page.locator('a[href="../inquiry/?product=geometric"]').click()
            assert '/app/marketing/v1/_snapshot/inquiry/' in page.url,page.url
            assert page.locator('#inquiry-form').count()==0
            page.goto(host+'/app/marketing/v1/_snapshot/geometric/',wait_until='networkidle')
            page.locator('a[href="../../"]').first.click()
            expect(page.locator('html')).to_have_attribute('data-app-mode','marketing')
            page.goto(host+'/app/',wait_until='networkidle')
            page.locator('a[href="./development/"]').click()
            expect(page.locator('html')).to_have_attribute('data-app-mode','development')
            expect(page.locator('.mode-banner')).to_contain_text('Development')
            verify_geometric_photo(page)
            page.locator('.mode-banner a').click()
            expect(page.locator('html')).to_have_attribute('data-app-mode','selector')
            report['development']='PASS'
            assert not errors,errors
            print('PASS Development route and back navigation')
            ctx.close()

            # A legacy /app/ PWA controller must be upgraded without replacing
            # either nested mode's scope or deleting their independently named caches.
            ctx=browser.new_context(viewport={'width':390,'height':844})
            page=ctx.new_page()
            page.goto(host+'/app/',wait_until='networkidle')
            page.evaluate('async ()=>{await navigator.serviceWorker.ready}')
            page.goto(host+'/app/marketing/v1/',wait_until='networkidle')
            page.evaluate('async ()=>{await navigator.serviceWorker.getRegistration("./")}')
            page.reload(wait_until='networkidle')
            scope=page.evaluate("""async ()=>{
              const reg=await navigator.serviceWorker.getRegistration('./');
              if(!reg)throw Error('No marketing SW');
              await navigator.serviceWorker.ready;
              return reg.scope;
            }""")
            assert scope.endswith('/app/marketing/v1/'),scope
            keys=page.evaluate('async ()=>await caches.keys()')
            assert any(k.startswith('assemble-lab-marketing-v1-') for k in keys),keys
            ctx.set_offline(True)
            page.reload(wait_until='domcontentloaded')
            verify_geometric_photo(page)
            page.locator('#personal-coffee-show-model').click()
            verify_geometric_glb(page)
            ctx.set_offline(False)
            page.goto(host+'/app/development/',wait_until='networkidle')
            page.evaluate('async ()=>{await navigator.serviceWorker.ready}')
            page.reload(wait_until='networkidle')
            scope2=page.evaluate("""async ()=>{
              const reg=await navigator.serviceWorker.getRegistration('./');
              if(!reg)throw Error('No development SW');
              return reg.scope;
            }""")
            assert scope2.endswith('/app/development/'),scope2
            keys2=page.evaluate('async ()=>await caches.keys()')
            assert any(k.startswith('assemble-lab-development-') for k in keys2),keys2
            assert any(k.startswith('assemble-lab-marketing-') for k in keys2),keys2
            report['offline']={'marketing_scope':scope,'development_scope':scope2,
                'distinct_caches':True}
            print('PASS offline Marketing V1 and independent Development PWA scope/caches')
            ctx.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    (output/'dual-mode.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('APP MVP-28 PASS',report)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--browser',required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    run(args.browser,args.output)
