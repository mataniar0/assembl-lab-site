"""Inspect the actual exported rounded GLB; preserve earlier R/L render evidence."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import threading, json
from playwright.sync_api import sync_playwright

P = Path(__file__).parent
OUT = P / 'artifacts/R_ROUNDED_SHOULDERS'
workspace = P.resolve().parents[2]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(workspace)))
threading.Thread(target=server.serve_forever, daemon=True).start()
checks = []
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
            args=['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        page = b.new_page(viewport={'width': 1216, 'height': 1000})
        errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
        for option in ['R_ROUNDED_SHOULDERS', 'R_RAIL_REINDEX']:
            page.goto(f'http://127.0.0.1:{server.server_port}/assembl-lab-site/engineering/flow-v31/preview.html?option={option}')
            page.wait_for_function('window.ready || window.loadError')
            assert page.evaluate('window.ready'), page.evaluate('window.loadError')
            assert page.evaluate('(()=>{let n=0;model.traverse(x=>{if(x.isMesh)n++});return n})()') == 19
            for view in (['front', 'side', 'underside', 'top', 'detail'] if option == 'R_ROUNDED_SHOULDERS' else ['detail']):
                page.evaluate('(v)=>window.view(v)', view)
                page.wait_for_timeout(100)
                extent = page.evaluate('window.maxProjectedExtent'); assert extent < 1
                name = view if option == 'R_ROUNDED_SHOULDERS' else 'detail-before'
                page.screenshot(path=str(OUT / (name+'.png')))
                checks.append(dict(option=option, view=view, status='PASS', mesh_nodes=19,
                                   max_projected_extent=extent))
        assert not errors
        b.close()
finally:
    server.shutdown(); server.server_close()
(OUT / 'browser-qc.json').write_text(json.dumps(dict(status='PASS', views=checks, page_errors=errors,
    browser='Chromium software WebGL', physical_device_test=False), indent=2)+'\n')
print('PASS: four full views and before/after shoulder detail, 19 mesh nodes, no clipping/errors')
