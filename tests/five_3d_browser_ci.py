#!/usr/bin/env python3
"""AL-016/017 five-product WebGL/browser regression; requires local Chromium + Playwright."""
from __future__ import annotations
import argparse,json,os,sys,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parent))
from site_smoke import site_server,Session,toggle
ROOT=Path(__file__).resolve().parents[1]
ROUTES=("geometric/","table/flow/","table/personal/","shelf/kids/","driller_stand/")
ap=argparse.ArgumentParser();ap.add_argument("--browser",default=os.environ.get("ASSEMBLE_BROWSER","/usr/bin/chromium"));args=ap.parse_args()
results=[]
def check(label,fn):
 try: r=fn();results.append({"name":label,"status":"PASS","details":r});print("PASS",label,flush=True)
 except Exception as error: results.append({"name":label,"status":"FAIL","error":str(error),"trace":traceback.format_exc()});print("FAIL",label,str(error),flush=True)
with site_server(ROOT) as base,sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.browser,headless=True,args=["--enable-webgl","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
 for route in ROUTES:
  for lang in ("he","en"):
   for width in (320,390,768,1024,1440):
    def run(route=route,lang=lang,width=width):
     session=Session(browser,base,(width,844 if width<600 else 900),lang)
     page=session.page
     network_posts=[];errors=[]
     page.on("request",lambda req:network_posts.append(req.method+" "+req.url) if req.method not in ("GET","HEAD") else None)
     page.on("pageerror",lambda err:errors.append(str(err)))
     page.goto(base+route,wait_until="networkidle")
     box=page.locator("[data-three-preview]")
     assert box.count()==1 and box.get_attribute("data-state")=="idle"
     poster=page.locator(".three-poster")
     poster.scroll_into_view_if_needed()
     page.wait_for_function("document.querySelector('.three-poster')?.complete&&document.querySelector('.three-poster')?.naturalWidth>0")
     assert box.evaluate("e=>e.scrollWidth<=e.clientWidth+2"),"3D section horizontal overflow"
     assert not any(".glb" in u for u in page.evaluate("performance.getEntriesByType('resource').map(x=>x.name)")),"eager GLB request"
     page.wait_for_function("!document.querySelector('[data-three-open]')?.disabled")
     gallery_before=page.locator(".gallery").count()
     if width in (390,1440):
      page.locator("[data-three-open]").click()
      page.wait_for_function("['ready','error'].includes(document.querySelector('[data-three-preview]').dataset.state)",timeout=45000)
      state=box.get_attribute("data-state")
      diagnostics=page.evaluate("""() => ({
        state:document.querySelector('[data-three-preview]').dataset.state,
        status:document.querySelector('.three-status')?.textContent,
        stageSize:(() => {const r=document.querySelector('.three-stage')?.getBoundingClientRect();return r?{width:r.width,height:r.height}:null})(),
        modelLoaded:!!document.querySelector('model-viewer')?.loaded,
        modelResourceRequests:performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.glb')).map(e=>e.name),
      })""")
      assert state=="ready", (route,lang,width,diagnostics,errors)
      model=page.locator("model-viewer");assert model.count()==1
      before=model.evaluate("e=>({...e.getCameraOrbit()})")
      page.locator("[data-three-action=right]").click()
      after=model.evaluate("e=>({...e.getCameraOrbit()})")
      assert abs(after["theta"]-before["theta"])>0.2,"orbit did not update"
      page.locator("[data-three-action=out]").click()
      assert model.evaluate("e=>e.getCameraOrbit().radius")>before["radius"],"zoom failed"
      page.locator("[data-three-action=reset]").click()
      reset=model.evaluate("e=>({...e.getCameraOrbit()})")
      assert abs(reset["theta"]-before["theta"])<0.05,"reset failed"
      toggle(page,"en" if lang=="he" else "he");toggle(page,lang)
      assert page.locator("model-viewer").count()==1,"locale transition destroyed viewer"
      page.locator("[data-three-close]").click()
      assert page.locator("model-viewer").count()==0
      assert box.get_attribute("data-state")=="idle"
     assert page.locator(".gallery").count()==gallery_before,"gallery changed"
     assert not network_posts,(route,network_posts)
     assert not errors,(route,errors)
     session.close()
     return {"route":route,"lang":lang,"width":width,"loaded":width in (390,1440),"real_posts":0}
    check(f"{route}:{lang}:{width}",run)
 # Simulate missing original GLB and no WebGL: the image/gallery must remain visible.
 for failure in ("missing-asset","no-webgl"):
  def negative(failure=failure):
   ctx=browser.new_context(viewport={"width":390,"height":844},service_workers="block")
   writes=[]
   def guard(route):
    if route.request.method not in ("GET","HEAD"):
     writes.append(route.request.url);return route.abort()
    if failure=="missing-asset" and route.request.url.endswith("geometric-v11-design-only.glb"):
     return route.fulfill(status=404,body="deliberately missing GLB")
    route.continue_()
   ctx.route("**/*",guard)
   if failure=="no-webgl":
    ctx.add_init_script("HTMLCanvasElement.prototype.getContext=function(){return null}")
   page=ctx.new_page();page.goto(base+"geometric/",wait_until="networkidle")
   page.locator("[data-three-open]").click()
   page.wait_for_function("document.querySelector('[data-three-preview]').dataset.state==='error'",timeout=60000)
   assert page.locator(".three-poster").is_visible()
   assert page.locator("[data-three-open]").is_enabled()
   assert not writes
   ctx.close();return {"fallback":failure,"real_posts":0}
  check("fallback:"+failure,negative)
 browser.close()
total={"passed":sum(x["status"]=="PASS" for x in results),"failed":sum(x["status"]=="FAIL" for x in results),"real_posts":0,"results":results}
report=ROOT/".qa-reports/ci/five-models-browser-results.json"
report.parent.mkdir(parents=True,exist_ok=True);report.write_text(json.dumps(total,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({k:v for k,v in total.items() if k!="results"},indent=2))
sys.exit(total["failed"]>0)
