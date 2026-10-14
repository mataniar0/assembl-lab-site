import importlib.util
from functools import partial
from http.server import ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
spec=importlib.util.spec_from_file_location('review','/tmp/shoe-rack-photo-review.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with ThreadingHTTPServer(('127.0.0.1',0),partial(m.Quiet,directory='/tmp/shoe-photo-review-701d22cf')) as s:
 Thread(target=s.serve_forever,daemon=True).start()
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for lang,width in (('he',320),('he',390),('en',844),('en',1440)):
   c=m.make_context(b,lang,width);writes=[];m.guard(c,writes);p=c.new_page();p.goto(f'http://127.0.0.1:{s.server_port}/shoe_rack/',wait_until='networkidle')
   p.locator('.step').nth(1).tap();p.locator('.slide.active img').evaluate('e=>e.decode()');p.locator('.viewer').evaluate("e=>e.scrollIntoView({block:'center',behavior:'instant'})");m.frame(p)
   p.screenshot(path=f'/tmp/shoe-rack-photo-review/stage2-viewport-{lang}-{width}.png')
   assert not writes
   c.close()
  b.close()
 s.shutdown()
