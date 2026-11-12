"""AL-016 Chromium touch/pinch/scroll check; software GPU, not a physical-device test."""
import json,sys,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from site_smoke import site_server
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with site_server(ROOT) as base,sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,service_workers='block');errors=[];writes=[]
 def guard(route):
  if route.request.method not in ('GET','HEAD'):writes.append(route.request.url);return route.abort()
  route.continue_()
 c.route('**/*',guard);page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'table/personal/');page.locator('[data-three-open]').tap();page.wait_for_function("document.querySelector('model-viewer')?.loaded",timeout=60000)
 v=page.locator('model-viewer');v.scroll_into_view_if_needed();page.wait_for_timeout(300);box=v.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2;cdp=c.new_cdp_session(page)
 def touch(kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':px,'y':py,'id':i} for i,(px,py) in enumerate(points)]})
 def orbit():return v.evaluate('e=>({...e.getCameraOrbit()})')
 before=orbit();touch('touchStart',[(x-70,y)])
 for i in range(1,11):touch('touchMove',[(x-70+14*i,y)]);page.wait_for_timeout(30)
 touch('touchEnd',[]);page.wait_for_timeout(400);after=orbit();assert abs(after['theta']-before['theta'])>.1,'Touch orbit did not rotate'
 before=after;touch('touchStart',[(x-25,y),(x+25,y)])
 for i in range(1,11):touch('touchMove',[(x-25-4*i,y),(x+25+4*i,y)]);page.wait_for_timeout(30)
 touch('touchEnd',[]);page.wait_for_timeout(400);after=orbit();assert abs(after['radius']-before['radius'])>.01,'Pinch did not zoom'
 scroll=page.evaluate('scrollY');touch('touchStart',[(x,y+70)])
 for i in range(1,11):touch('touchMove',[(x,y+70-14*i)]);page.wait_for_timeout(30)
 touch('touchEnd',[]);page.wait_for_timeout(400);delta=page.evaluate('scrollY')-scroll;assert delta>30,'Viewer trapped vertical page scroll'
 assert not errors and not writes;result={'passed':3,'failed':0,'real_posts':0,'touch_orbit':True,'pinch_zoom':True,'vertical_scroll_delta':delta,'scope':'Chromium emulated touch with software GPU; physical devices and Safari not tested'}
 (ROOT/'QA_EVIDENCE/AL-016/touch.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));c.close();b.close()
