"""Run all four requested widths in Hebrew/English, including accessibility and navigation."""
import argparse,json,hashlib
from pathlib import Path
from homepage_smoke import site_url,check_page
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser(description='Check the clean homepage in both languages and save review screenshots.')
parser.add_argument('--output', type=Path, default=Path('/tmp/clean-light-review'))
out=parser.parse_args().output; out.mkdir(parents=True,exist_ok=True); results=[]
with site_url(None) as base,sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for lang in ('he','en'):
   for w,h in ((320,568),(390,844),(844,390),(1440,900)):
    result=check_page(b,base,(w,h),lang)
    page=b.new_page(viewport={'width':w,'height':h});page.add_init_script(f"localStorage.setItem('assemble-language','{lang}')");page.goto(base,wait_until='networkidle');page.locator('img').evaluate_all("es=>es.forEach(i=>i.loading='eager')");page.wait_for_function('[...document.images].every(i=>i.complete)');
    expected=['table/','shelf/kids/','driller_stand/','shoe_rack/','workbench/','crib/','etrog_box/','megillat_esther_box/']
    assert page.locator('.product').evaluate_all('es=>es.map(e=>e.getAttribute("href"))')==expected
    assert page.locator('.size-tag,.product-no,.open,.view').count()==0
    assert page.locator('.development').count()==4
    assert page.evaluate('document.querySelector("#products").compareDocumentPosition(document.querySelector("#made-to-size")) & Node.DOCUMENT_POSITION_FOLLOWING')
    for e in page.locator('.product').all():
     assert e.evaluate('e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44}')
     e.focus();page.keyboard.press('Shift');assert e.evaluate('e=>parseFloat(getComputedStyle(e).outlineWidth)>=2 && e.matches(":focus-visible")')
    for e in page.locator('.product-media').all():
     assert e.evaluate('e=>{const r=e.getBoundingClientRect();return Math.abs(r.width/r.height-4/3)<0.02}')
    # The sixth physical sprite panel was rejected; use the approved fifth.
    # Approved content pins: derivatives select source pixels (0,3000)-(1000,3750), the fifth panel.
    root=Path(__file__).resolve().parents[1]
    assert hashlib.sha256((root/'shelf/kids/kids_shelf_story_clean.webp').read_bytes()).hexdigest() == '5aca9863aed4aa7e72d4ee65f19b4cec3fd019d9b2a1444d7d93d3825d226773'
    for width, digest in {'480': 'b893d983d28ad3b2bb4b1e9294b098cbfa1031de6f38509a65c6c269c0f498a1', '960': 'b391e4d04e0250e9931aabc14b832c3cfdd7ba10924f70c93d8cf1f087cd3a8d'}.items():
     assert hashlib.sha256((root/f'assets/cards/kids-{width}.webp').read_bytes()).hexdigest() == digest
    assert page.locator('.product[href="shelf/kids/"] img').get_attribute('src') == 'assets/cards/kids-480.webp'
    # The product carousel must still expose exactly the approved five stages.
    shelf=page.request.get(base+'shelf/kids/').text()
    assert shelf.count('data-pos="') == 5 and 'data-pos="80%"' in shelf and 'data-pos="100%"' not in shelf
    assert page.locator('.product-media img').count() == 8
    for e in page.locator('.product-focus,.sprite').all():
     url=e.evaluate('e=>getComputedStyle(e).backgroundImage.slice(5,-2)');response=page.request.get(url);assert response.ok
    if w in (390,1440):
     page.evaluate('document.activeElement.blur(); scrollTo(0,0)');page.screenshot(path=str(out/f'home-{lang}-{w}.png'),full_page=True)
    page.close();results.append({'language':lang,**result});print('PASS',lang,w,flush=True)
 finally:b.close()
(out/'viewport-results.json').write_text(json.dumps(results,indent=2))
