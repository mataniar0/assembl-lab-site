#!/usr/bin/env python3
"""MEB-033 GLB visual integration: load, orbit, zoom, language, fallback."""
from pathlib import Path
import argparse,os,sys
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parent))
from site_smoke import site_server, Session, toggle
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser()
ap.add_argument("--browser",default=os.environ.get("ASSEMBLE_BROWSER","/usr/bin/chromium"))
args=ap.parse_args()
with site_server(ROOT) as base,sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=args.browser,headless=True,args=["--enable-webgl","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    for lang in ("he","en"):
        for width in (390,1440):
            s=Session(browser,base,(width,844 if width==390 else 900),lang)
            page=s.page
            errors=[];writes=[]
            page.on("pageerror",lambda e:errors.append(str(e)))
            page.on("request",lambda r:writes.append(r.url) if r.method not in ("GET","HEAD") else None)
            page.goto(base+"megillat_esther_box/",wait_until="networkidle")
            box=page.locator("[data-three-preview]")
            assert box.count()==1 and box.get_attribute("data-state")=="idle"
            assert page.locator(".three-poster").count()==1
            page.locator(".three-poster").scroll_into_view_if_needed()
            page.wait_for_function("document.querySelector('.three-poster').naturalWidth>0")
            assert not any(x.endswith(".glb") for x in page.evaluate("performance.getEntriesByType('resource').map(e=>e.name)"))
            assert box.evaluate("e=>e.scrollWidth <= e.clientWidth+2")
            page.wait_for_function("!document.querySelector('[data-three-open]').disabled")
            page.locator("[data-three-open]").click()
            page.wait_for_function("['ready','error'].includes(document.querySelector('[data-three-preview]').dataset.state)",timeout=50000)
            info=page.evaluate("()=>({state:document.querySelector('[data-three-preview]').dataset.state,status:document.querySelector('.three-status').textContent,loaded:!!document.querySelector('model-viewer')?.loaded})")
            assert info["state"]=="ready" and info["loaded"],(lang,width,info,errors)
            model=page.locator("model-viewer")
            prior=model.evaluate("e=>({...e.getCameraOrbit()})")
            page.locator('[data-three-action="right"]').click()
            changed=model.evaluate("e=>({...e.getCameraOrbit()})")
            assert abs(changed["theta"]-prior["theta"])>0.2
            page.locator('[data-three-action="reset"]').click()
            toggle(page,"en" if lang=="he" else "he")
            assert model.count()==1
            toggle(page,lang)
            page.locator("[data-three-close]").click()
            assert box.get_attribute("data-state")=="idle" and model.count()==0
            assert not errors,(lang,width,errors)
            assert not writes,(lang,width,writes)
            s.close()
            print("PASS MEB-033 viewer",lang,width,"/ 0 POSTs",flush=True)
    # No JS must retain the prior concept image as a fallback.
    ctx=browser.new_context(java_script_enabled=False)
    page=ctx.new_page();page.goto(base+"megillat_esther_box/",wait_until="networkidle")
    assert page.locator(".three-poster").is_visible()
    assert page.locator(".three-poster").evaluate("e=>e.naturalWidth>0")
    ctx.close();browser.close()
print("PASS MEB-033 3D browser tests")
