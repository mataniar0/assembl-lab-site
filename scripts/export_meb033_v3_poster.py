#!/usr/bin/env python3
"""Render the corrected 3D GLB itself to a browser screenshot for QA."""
from pathlib import Path
import os,base64,hashlib,json,sys
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tests"))
from site_smoke import site_server
ROOT=Path(__file__).resolve().parents[1]
with site_server(ROOT) as base,sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get("ASSEMBLE_BROWSER","/usr/bin/chromium"),
        args=["--enable-webgl","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    context=browser.new_context(viewport={"width":1300,"height":900},device_scale_factor=1)
    page=context.new_page()
    page.goto(base+"megillat_esther_box/",wait_until="networkidle")
    page.evaluate("""() => {
      const section=document.querySelector('[data-three-preview]');
      section.dataset.modelSrc='media/meb033-assembly-v3.glb';
    }""")
    page.locator('[data-three-open]').click()
    page.wait_for_function("document.querySelector('[data-three-preview]').dataset.state==='ready'",timeout=45000)
    viewer=page.locator("model-viewer")
    assert viewer.count()==1 and viewer.evaluate("el=>el.loaded")
    viewer.evaluate("""el => {
      el.cameraOrbit = '35deg 70deg auto'; el.fieldOfView='45deg';
      el.cameraTarget='auto auto auto'; el.jumpCameraToGoal();
    }""")
    viewer.scroll_into_view_if_needed()
    page.wait_for_timeout(600)
    img=viewer.screenshot(type="png")
    print("MEB033_V3_SCREENSHOT",json.dumps({"bytes":len(img),"sha256":hashlib.sha256(img).hexdigest()}),flush=True)
    print("MEB033_V3_PNG_BASE64_BEGIN",flush=True)
    enc=base64.b64encode(img).decode("ascii")
    for i in range(0,len(enc),4096):print("MEB033_V3_PNG_CHUNK:"+enc[i:i+4096],flush=True)
    print("MEB033_V3_PNG_BASE64_END",flush=True)
    browser.close()
