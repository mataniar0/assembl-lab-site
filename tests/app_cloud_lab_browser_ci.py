"""Synthetic-only browser smoke for MVP-08 Supabase cloud lab.
No login, network, photos, real account creation or provider requests.
Runs using Chromium from the existing site-checks CI Python venv.
"""
import argparse
from functools import partial
import http.server
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
PROVIDER="widfojfysblgbwswmigq.supabase.co"

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):
        pass

def main(browser_path:str):
    server=http.server.ThreadingHTTPServer(("127.0.0.1",0),partial(QuietHandler,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True)
    thread.start()
    base=f"http://127.0.0.1:{server.server_port}"
    errors=[]
    provider_requests=[]
    try:
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(headless=True,executable_path=browser_path)
            for size in [{"width":390,"height":844},{"width":1280,"height":800}]:
                context=browser.new_context(viewport=size)
                page=context.new_page()
                page.on("pageerror",lambda err:errors.append(str(err)))
                page.route(f"https://{PROVIDER}/**",
                    lambda route:(provider_requests.append(route.request.url),route.abort()))
                page.goto(base+"/app/cloud-dev.html",wait_until="networkidle")
                assert page.locator("h1").inner_text()=="חיבור ניסיוני לענן"
                assert page.locator("#save-synthetic").is_disabled()
                assert page.locator("#sign-up").is_enabled()
                summary=page.locator("#design-summary").inner_text()
                assert "50.0" not in summary  # formatted as integer cm
                assert "רוחב 50 ס״מ" in summary
                assert "ללא צילום" in summary
                assert page.locator('input[type="file"]').count()==0
                assert page.evaluate("localStorage.length")==0
                assert not provider_requests, "Provider must never be called before explicit sign-in"
                page.goto(base+"/app/",wait_until="networkidle")
                assert page.locator('a[href="./cloud-dev.html"]').count()>=1
                page.locator('a[href="./cloud-dev.html"]').first.click()
                assert page.locator("h1").inner_text()=="חיבור ניסיוני לענן"
                assert not errors, "JS runtime errors: "+repr(errors)
                context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("2/2 browser cloud-lab smoke viewports PASS; no Supabase traffic or photos sent")

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--browser",required=True)
    opts=parser.parse_args()
    main(opts.browser)
