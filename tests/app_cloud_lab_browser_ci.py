"""MVP-08 browser smoke: render and exercise the real UI with mocked Supabase responses.
No real signup, no real login, no external API calls, no user images.
"""
import argparse
from functools import partial
import http.server
import json
from pathlib import Path
import threading
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
PROVIDER="widfojfysblgbwswmigq.supabase.co"
USER="11111111-1111-4111-8111-111111111111"
PROJECT="22222222-2222-4222-8222-222222222222"
JOB="33333333-3333-4333-8333-333333333333"

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):
        pass

def main(browser_path:str):
    server=http.server.ThreadingHTTPServer(("127.0.0.1",0),partial(QuietHandler,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True)
    thread.start()
    base=f"http://127.0.0.1:{server.server_port}"
    errors=[]
    provider_calls=[]
    try:
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(headless=True,executable_path=browser_path)
            for index,size in enumerate([{"width":390,"height":844},{"width":1280,"height":800}]):
                context=browser.new_context(viewport=size)
                page=context.new_page()
                page.on("pageerror",lambda err:errors.append(str(err)))
                def mock_supabase(route):
                    req=route.request
                    path=urlparse(req.url).path
                    headers={
                      "Access-Control-Allow-Origin":"*",
                      "Access-Control-Allow-Headers":"apikey,authorization,content-type,prefer",
                      "Access-Control-Allow-Methods":"GET,POST,DELETE,OPTIONS",
                      "Cache-Control":"no-store"
                    }
                    provider_calls.append((req.method,path,req.post_data or ""))
                    if req.method=="OPTIONS":
                        route.fulfill(status=204,headers=headers)
                        return
                    if path=="/auth/v1/token" and req.method=="POST":
                        data={"access_token":"a"*90,"user":{"id":USER},"expires_in":3600}
                    elif path=="/rest/v1/al_app_projects" and req.method=="GET":
                        data=[]
                    elif path=="/rest/v1/al_app_projects" and req.method=="POST":
                        body=json.loads(req.post_data)
                        if body.get("source_kind")!="synthetic" or body.get("owner_id")!=USER or body.get("design_intent",{}).get("appearance",{}).get("notes")!="":
                            errors.append("unsafe project payload")
                        if "photo_url" in req.post_data or "image_base64" in req.post_data:
                            errors.append("photo data leaked")
                        data=[{"id":PROJECT,"created_at":"2026-11-15T10:00:00Z"}]
                    elif path=="/rest/v1/al_app_visualization_jobs" and req.method=="POST":
                        body=json.loads(req.post_data)
                        if body.get("provider")!="none" or body.get("status")!="MOCK_READY":
                            errors.append("wrong job mode")
                        data=[{"id":JOB,"project_id":PROJECT,"status":"MOCK_READY","provider":"none","created_at":"2026-11-15T10:00:00Z"}]
                    elif path=="/rest/v1/al_app_projects" and req.method=="DELETE":
                        data=[{"id":PROJECT}]
                    else:
                        errors.append("Unexpected remote route: "+req.method+" "+path)
                        route.abort()
                        return
                    route.fulfill(status=200,content_type="application/json",headers=headers,body=json.dumps(data))
                page.route(f"https://{PROVIDER}/**",mock_supabase)
                calls_before_page_load=len(provider_calls)
                page.goto(base+"/app/cloud-dev.html",wait_until="networkidle")
                assert page.locator("h1").inner_text()=="חיבור ניסיוני לענן"
                assert page.locator("#save-synthetic").is_disabled()
                assert page.locator("#sign-up").is_enabled()
                summary=page.locator("#design-summary").inner_text()
                assert "רוחב 50 ס״מ" in summary
                assert "ללא צילום" in summary
                assert page.locator('input[type="file"]').count()==0
                assert page.evaluate("localStorage.length")==0
                assert len(provider_calls)==calls_before_page_load, "No provider call should occur before signing in"
                if index==0:
                    page.locator("#dev-email").fill("synthetic@example.test")
                    page.locator("#dev-password").fill("synthetic-strong-password")
                    page.locator("#sign-in").click()
                    expect(page.locator("#save-synthetic")).to_be_enabled(timeout=10000)
                    page.locator("#save-synthetic").click()
                    expect(page.locator("#project-id")).to_have_text(PROJECT,timeout=10000)
                    assert page.locator("#project-id").inner_text()==PROJECT
                    page.locator("#create-job").click()
                    expect(page.locator("#job-status")).to_have_text("MOCK_READY",timeout=10000)
                    assert page.locator("#job-id").inner_text()==JOB
                    page.on("dialog",lambda dialog:dialog.accept())
                    page.locator("#delete-project").click()
                    expect(page.locator("#jobs-panel")).to_be_hidden(timeout=10000)
                    assert any(path=="/auth/v1/token" for _,path,_ in provider_calls)
                    assert any(path=="/rest/v1/al_app_visualization_jobs" for _,path,_ in provider_calls)
                    assert not errors, repr(errors)
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
    print("2 browser viewports PASS; mock login/create project/create job/delete project PASS; no actual external requests")

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--browser",required=True)
    args=parser.parse_args()
    main(args.browser)
