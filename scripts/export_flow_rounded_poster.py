"""Render the exact site GLB through the actual shared viewer into a WebP poster.

Run with Playwright and local Chromium. No geometry edits, external services,
or image generation; model-viewer's own screenshot API captures the CAD mesh.
"""
from pathlib import Path
import base64, hashlib, json, os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'tests'))
from site_smoke import site_server

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT/'table/flow/media/flow-v31-rounded-design-only.glb'
POSTER = MODEL.with_name(MODEL.stem+'-poster.webp')
with site_server(ROOT) as base, sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get('ASSEMBLE_BROWSER','/usr/bin/chromium'),
        args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width':1200,'height':1200}, device_scale_factor=1)
    page = context.new_page()
    page.goto(base+'table/flow/', wait_until='networkidle')
    page.evaluate("""async url => {
      await import(url); customElements.get('model-viewer').minimumRenderScale=1;
    }""", base+'assets/vendor/model-viewer-4.1.0/model-viewer.min.js')
    page.locator('[data-three-open]').click()
    page.wait_for_function("document.querySelector('[data-three-preview]').dataset.state==='ready'", timeout=45000)
    viewer = page.locator('model-viewer')
    viewer.evaluate("""el => {
      el.parentElement.style.cssText='width:900px;max-width:900px;height:900px';
      el.style.cssText='display:block;width:900px;height:900px;background:#f3f1eb';
      el.cameraOrbit='35deg 55deg auto'; el.fieldOfView='45deg';
      el.cameraTarget='auto auto auto'; el.jumpCameraToGoal();
      el.scrollIntoView({block:'center'});
    }""")
    page.wait_for_timeout(600)
    data = viewer.evaluate("el=>el.toDataURL('image/webp',.92)")
    assert data.startswith('data:image/webp;base64,')
    dimensions = page.evaluate("""data => new Promise(resolve => {
      const image=new Image(); image.onload=()=>resolve([image.naturalWidth,image.naturalHeight]); image.src=data;
    })""", data)
    assert dimensions == [900,900], dimensions
    POSTER.write_bytes(base64.b64decode(data.split(',',1)[1]))
    assert POSTER.read_bytes()[:4] == b'RIFF' and POSTER.read_bytes()[8:12] == b'WEBP'
    print(json.dumps(dict(model_sha256=hashlib.sha256(MODEL.read_bytes()).hexdigest(),
        poster_sha256=hashlib.sha256(POSTER.read_bytes()).hexdigest(), bytes=POSTER.stat().st_size,
        camera_orbit='35deg 55deg auto', field_of_view='45deg', geometry_edited=False)))
    browser.close()
