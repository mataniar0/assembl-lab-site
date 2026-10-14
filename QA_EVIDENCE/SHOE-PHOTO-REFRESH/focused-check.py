"""External acceptance QA for the curated Shoe Rack photo refresh.

No site files are changed. All browser non-read requests are blocked by the
existing site's Session guard, including popup requests.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
import sys
import time

ROOT = Path('/workspace/assembl-lab-site')
sys.path.insert(0, str(ROOT / 'tests'))
from site_smoke import Session, site_server, locale_and_layout, toggle
from mobile_site_smoke import IMAGE_CHECK, LAYOUT_CHECK
from language_site_smoke import LOCALE_CHECK
from playwright.sync_api import sync_playwright

VIEWPORTS = ((320,568), (390,844), (640,900), (844,900), (900,1100),
             (901,1100), (1440,900), (844,390),
             (1100,900), (1200,900), (1399,900), (1400,900))

def require(value, detail):
    if not value:
        raise AssertionError(detail)

def reachable(page, locator):
    locator.evaluate("e=>e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'})")
    geometry = locator.evaluate("""e=>{
      const r=e.getBoundingClientRect(),h=document.querySelector('.header').getBoundingClientRect();
      return {width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        headerBottom:h.bottom,inside:r.left>=0&&r.right<=innerWidth&&r.top>=h.bottom&&r.bottom<=innerHeight,
        hit:[[.25,.25],[.5,.5],[.75,.75]].every(([x,y])=>{
          const p=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);return p===e||e.contains(p)}),
        enabled:!e.disabled,label:e.getAttribute('aria-label')||e.textContent.trim()};
    }""")
    require(geometry['width']>=44 and geometry['height']>=44, f'Small target: {geometry}')
    require(geometry['inside'] and geometry['hit'], f'Obscured/unreachable target: {geometry}')
    require(geometry['enabled'] and geometry['label'], f'Disabled/unnamed target: {geometry}')
    return geometry

def focus_visible(locator):
    result=locator.evaluate("""e=>({active:document.activeElement===e,visible:e.matches(':focus-visible'),
      outline:parseFloat(getComputedStyle(e).outlineWidth),style:getComputedStyle(e).outlineStyle})""")
    require(result['active'] and result['visible'] and result['outline']>=2 and result['style']=='solid',
            f'Missing keyboard focus indicator: {result}')

def selected(page, index, count):
    steps=page.locator('.gallery .step')
    slides=page.locator('.gallery .slide')
    require(page.locator('.gallery .step.active').count()==1, 'Multiple active steps')
    require(page.locator('.gallery .step[aria-pressed="true"]').count()==1, 'Invalid pressed state')
    require(steps.nth(index).get_attribute('aria-pressed')=='true', f'Wrong pressed step {index}')
    require(page.locator('.gallery .slide.active').count()==1, 'Multiple active slides')
    require(slides.nth(index).get_attribute('aria-hidden')=='false', f'Wrong visible slide {index}')
    require(page.locator('.gallery .slide[aria-hidden="true"]').count()==count-1, 'Invalid hidden-slide states')
    require(page.locator('.gallery .progress span').inner_text()==str(index+1).zfill(2), 'Wrong progress number')
    require(re.search(r'/\s*0?'+str(count)+r'\b',page.locator('.gallery .progress').inner_text()), 'Wrong progress total')
    img=slides.nth(index).locator('img')
    img.evaluate("e=>e.loading='eager'")
    img.evaluate("e=>e.decode()")
    result=img.evaluate("""e=>{const r=e.getBoundingClientRect();return {src:e.currentSrc,alt:e.alt,
      naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight,width:r.width,height:r.height,
      srcset:e.getAttribute('srcset'),sizes:e.getAttribute('sizes'),complete:e.complete,
      deferred:!!e.dataset.src}}""")
    require(result['complete'] and result['naturalWidth'] and result['naturalHeight'], 'Selected image not decoded')
    require(result['width']>0 and result['height']>0 and result['alt'], 'Image missing visible size/alt')
    require(not result['deferred'], 'Selected slide source not promoted')
    locale_and_layout(page,page.locator('html').get_attribute('lang'))
    for script in (IMAGE_CHECK, LAYOUT_CHECK):
        failures=page.evaluate(script)
        require(not failures,failures)
    failures=page.evaluate(LOCALE_CHECK,page.locator('html').get_attribute('lang'))
    require(not failures,failures)
    return result

def swipe(page, dx, dy):
    page.locator('.viewer').evaluate("""(e,d)=>{
      for(const [type,x,y] of [['touchstart',200,100],['touchend',200+d[0],100+d[1]]]){
        const touch=new Touch({identifier:1,target:e,clientX:x,clientY:y});
        e.dispatchEvent(new TouchEvent(type,{changedTouches:[touch],bubbles:true}));
      }}""",[dx,dy])

def capture(page,path,full=True):
    page.evaluate("""async()=>{await Promise.all([...document.images].filter(e=>e.getAttribute('src')).map(e=>e.decode().catch(()=>{})))}""")
    page.evaluate("scrollTo({top:0,behavior:'instant'})")
    page.wait_for_function('scrollY===0')
    page.screenshot(path=str(path),full_page=full,animations='disabled')

def check(browser,base,viewport,language,out):
    session=Session(browser,base,viewport,language)
    page=session.page
    start=time.monotonic()
    result={'viewport':list(viewport),'language':language,'passed':False,'transitions':0,'stages':[]}
    try:
        response=page.goto(base+'shoe_rack/',wait_until='networkidle')
        require(response.status==200,'Shoe page unavailable')
        page.wait_for_function('Boolean(window.ASSEMBLE_I18N)')
        locale_and_layout(page,language)
        gallery=page.locator('.gallery'); steps=gallery.locator('.step'); slides=gallery.locator('.slide')
        count=steps.count()
        result['initial_lazy_sources']=gallery.locator('img[data-src]').count()
        result['initial_requested_images']=page.evaluate("()=>performance.getEntriesByType('resource').filter(r=>r.initiatorType==='img').map(r=>r.name)")
        require(count==7 and slides.count()==7, f'Expected 6 real photos and planning: steps={count}, slides={slides.count()}')
        require(gallery.get_attribute('tabindex')=='0' and gallery.get_attribute('aria-label'), 'Gallery lacks keyboard entry/name')
        require(gallery.locator('.copy').get_attribute('aria-live')=='polite', 'Stage copy not announced')
        previous=gallery.locator('.prev'); following=gallery.locator('.next')
        require(gallery.locator('.arrow').count()==2,'Unexpected arrow count')
        active=0
        selected(page,active,count)
        for control,delta in ((following,1),(previous,-1)):
            for _ in range(count):
                reachable(page,control); control.tap(); active=(active+delta)%count
                selected(page,active,count)
                result['transitions']+=1
                for arrow in (previous,following): reachable(page,arrow)
        # Every stage can be selected directly; each full-size image must be real,
        # reachable and linked with safe new-window behavior.
        for index in range(count):
            step=steps.nth(index); reachable(page,step); step.tap(); active=index
            img=selected(page,active,count)
            for arrow in (previous,following): reachable(page,arrow)
            link=gallery.locator('.gallery-image-open')
            require(link.get_attribute('target')=='_blank' and 'noopener' in (link.get_attribute('rel') or ''),
                    'Unsafe or missing full-size target')
            require(link.get_attribute('href')==step.get_attribute('data-full-size'),'Wrong full-size selected link')
            link_response=session.context.request.get(link.evaluate('e=>e.href'))
            require(link_response.status==200 and link_response.headers.get('content-type','').startswith('image/'),
                    f'Full-size image missing: {link_response.status} {link_response.url}')
            result['stages'].append({'index':index,'title':gallery.locator('.copy h3').inner_text(),
                'label':gallery.locator('.badge').inner_text(),'description':gallery.locator('.copy p').inner_text(),
                'full_size':link.get_attribute('href'),'image':img})
            result['transitions']+=1
        following.focus(); page.keyboard.press('Shift+Tab'); focus_visible(previous)
        page.keyboard.press('Enter'); active=(active-1)%count; selected(page,active,count);result['transitions']+=1
        page.keyboard.press('Tab'); focus_visible(following)
        page.keyboard.press('Space'); active=(active+1)%count; selected(page,active,count);result['transitions']+=1
        gallery.focus()
        for key,delta in (('ArrowRight',1),('ArrowLeft',-1)):
            page.keyboard.press(key);active=(active+delta)%count;selected(page,active,count);result['transitions']+=1
        # Native TouchEvents exercise the production swipe handlers while the
        # vertical gesture assertion protects ordinary mobile page scrolling.
        for dx,delta in ((-100,1),(100,-1)):
            swipe(page,dx,2);active=(active+delta)%count;selected(page,active,count);result['transitions']+=1
        swipe(page,2,100);selected(page,active,count)
        # Switching languages must preserve the current selected stage.
        other='en' if language=='he' else 'he'
        toggle(page,other);selected(page,active,count)
        toggle(page,language);selected(page,active,count)
        hero=page.locator('.hero-media img');hero.evaluate('e=>e.decode()')
        result['hero']=hero.evaluate("e=>({src:e.currentSrc,alt:e.alt,naturalWidth:e.naturalWidth,srcset:e.srcset,sizes:e.sizes})")
        require(result['hero']['srcset'] and result['hero']['sizes'],'Hero missing responsive source metadata')
        require('planning' not in result['hero']['src'],'Hero still uses planning rendering')
        require(all(s['image']['srcset'] and s['image']['sizes'] for s in result['stages'][:6]),
                'Real gallery photo missing responsive sources')
        raw_text=page.locator('.product-opening-copy').inner_text()
        if language=='he':
            require(any(w in raw_text for w in ('לפני גימור','לפני צביעה','ללא גימור','גולמי','גלם')),f'Missing raw/pre-finish hero distinction: {raw_text}')
        else:
            require(any(w in raw_text.lower() for w in ('pre-finish','unfinished','raw','before finishing','unpainted')),f'Missing raw/pre-finish hero distinction: {raw_text}')
        # Source/label separation is audited with actual rendered final stage.
        require(any(w in result['stages'][6]['title'].lower() for w in ('תכנון','planning')), 'Planning stage not explicitly distinct')
        require('planning' in result['stages'][6]['image']['src'], 'Final planning stage wrong source')
        steps.nth(0).click();selected(page,0,count)
        if (viewport,language) in (((390,844),'he'),((1440,900),'en')):
            # Screenshot APIs can resize Chromium's emulated viewport and cancel
            # responsive image candidates. Keep functional network assertions
            # in this untouched browser context; capture evidence separately.
            quote=page.locator('.hero .adapt-link')
            href=quote.get_attribute('href')
            require('inquiry/' in href and 'product=shoe-rack' in href,'Shoe quote link lost product context')
            quote.click();page.wait_for_function('Boolean(window.ASSEMBLE_I18N)')
            require(page.locator('select[name="product"]').input_value()=='shoe-rack','Inquiry not pre-selected for shoe rack')
        session.healthy()
        result['blocked_writes']=list(session.blocked_writes)
        result['console_errors']=list(session.errors)
        result['real_posts']=0
        result['passed']=True
    except Exception as exc:
        result['error']=f'{type(exc).__name__}: {exc}'
        result['console_errors']=list(session.errors)
        result['blocked_writes']=list(session.blocked_writes)
        try: page.screenshot(path=str(out/f'failure-{language}-{viewport[0]}x{viewport[1]}.png'),full_page=True)
        except Exception: pass
    finally:
        session.close()
        result['duration_seconds']=round(time.monotonic()-start,2)
    return result

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',default='/tmp/shoe-photo-qa')
    parser.add_argument('--browser',default='/usr/bin/chromium')
    parser.add_argument('--single',action='store_true')
    args=parser.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    results=[];started=time.time()
    with site_server(ROOT) as base, sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=args.browser,args=['--no-sandbox'])
        try:
            cases=[((390,844),'he')] if args.single else [(v,l) for v in VIEWPORTS for l in ('he','en')]
            for viewport,language in cases:
                result=check(browser,base,viewport,language,out);results.append(result)
                print(('PASS' if result['passed'] else 'FAIL')+f' {language} {viewport}: '+(result.get('error') or f"{result['transitions']} transitions"),flush=True)
                report={'started_epoch':started,'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),
                    'transitions':sum(r['transitions'] for r in results),'real_posts':0,'results':results}
                (out/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        finally: browser.close()
    print(f"RESULT {report['passed']} passed {report['failed']} failed {report['transitions']} transitions 0 real writes",flush=True)
    return bool(report['failed'])

if __name__=='__main__':sys.exit(main())
