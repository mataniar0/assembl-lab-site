"""Validate mobile page fit, image proportions, touch targets, and anchor offsets.

Run: python3 tests/mobile_site_smoke.py
Requires Python Playwright and Chromium, as does carousel_mobile_smoke.py.
"""

import argparse
from functools import partial
from http.server import ThreadingHTTPServer
from threading import Thread

from playwright.sync_api import sync_playwright

from carousel_mobile_smoke import ROOT, QuietHandler


PAGES = ("", "geometric/", "driller_stand/", "shelf/kids/", "shoe_rack/")
VIEWPORTS = (
    (320, 568), (360, 640), (390, 844), (414, 896), (560, 800),
    (640, 900), (900, 1100), (901, 430), (568, 320), (844, 390),
    (932, 430), (1024, 430), (1280, 800), (1440, 900),
)

LAYOUT_CHECK = """() => {
    const failures = [];
    if (document.documentElement.scrollWidth > innerWidth + 1)
        failures.push('Page scrolls horizontally');
    for (const e of document.querySelectorAll('body *')) {
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        if (s.display === 'none' || s.visibility === 'hidden' || !r.width || !r.height)
            continue;
        // The thumbnail strip intentionally scrolls horizontally; hidden slides
        // are layered in the viewer and have no visible content to validate.
        if (e.closest('.nav:not(header .nav), .slide:not(.active)')) continue;
        const label = e.tagName + '.' + e.className;
        if (r.left < -1 || r.right > innerWidth + 1)
            failures.push(label + ' is outside the screen');
        if (e.matches('h1,h2,h3,p,a,small,b') && e.scrollWidth > e.clientWidth + 1)
            failures.push(label + ' has clipped text');
    }
    for (const e of document.querySelectorAll('.header a,.top a,.footer a,.adapt-link')) {
        const r = e.getBoundingClientRect();
        if (r.width && r.height && (r.width < 44 || r.height < 44))
            failures.push('Small link target: ' + e.textContent.trim());
    }
    const header = document.querySelector('.header,.top');
    const links = [...header.querySelectorAll('a')].filter(e => e.getBoundingClientRect().width);
    for (let i=0; i<links.length; i++) for (let j=i+1; j<links.length; j++) {
        const a = links[i].getBoundingClientRect(), b = links[j].getBoundingClientRect();
        if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)
            failures.push('Header links overlap');
    }
    return failures;
}"""

IMAGE_CHECK = """async () => {
    const failures = [];
    for (const img of document.images) {
        const r = img.getBoundingClientRect(), s = getComputedStyle(img);
        if (!r.width || !r.height || s.display === 'none' || img.closest('.slide:not(.active)'))
            continue;
        const label = img.alt || img.className;
        if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
            failures.push('Broken image: ' + label); continue;
        }
        const ratioError = Math.abs(r.width / r.height / (img.naturalWidth / img.naturalHeight) - 1);
        if (ratioError > .02 && s.objectFit !== 'contain')
            failures.push('Image stretched or cropped: ' + label);
        const scale = s.objectFit === 'contain'
            ? Math.min(r.width/img.naturalWidth, r.height/img.naturalHeight)
            : Math.max(r.width/img.naturalWidth, r.height/img.naturalHeight);
        if (scale > 1.01) failures.push('Image exceeds source resolution: ' + label);
        // object-fit can be correct while an implicit grid row makes the IMG
        // taller than its clipped viewer. Check the actual centered content.
        const drawnWidth=img.naturalWidth*scale, drawnHeight=img.naturalHeight*scale;
        const drawn={
            left:r.left+(r.width-drawnWidth)/2, right:r.left+(r.width+drawnWidth)/2,
            top:r.top+(r.height-drawnHeight)/2, bottom:r.top+(r.height+drawnHeight)/2
        };
        const frame=img.closest('.slide,.viewer,.hero-media,.product-media');
        if (frame) {
            const f=frame.getBoundingClientRect();
            if (drawn.left < f.left-1 || drawn.right > f.right+1 ||
                drawn.top < f.top-1 || drawn.bottom > f.bottom+1)
                failures.push('Image extends beyond its frame: ' + label);
        }
        for (let parent=img.parentElement; parent && parent !== document.body; parent=parent.parentElement) {
            const p=getComputedStyle(parent), f=parent.getBoundingClientRect();
            const clips=axis=>['hidden','clip','auto','scroll'].includes(axis);
            if ((clips(p.overflowX) && (drawn.left < f.left-1 || drawn.right > f.right+1)) ||
                (clips(p.overflowY) && (drawn.top < f.top-1 || drawn.bottom > f.bottom+1)))
                failures.push('Image clipped by ' + parent.className + ': ' + label);
        }
    }
    for (const e of document.querySelectorAll('.sprite,.hero-sprite,.driller-final-stage,.main-image,.thumb')) {
        const r=e.getBoundingClientRect(), s=getComputedStyle(e);
        const match=s.backgroundImage.match(/^url\\(["']?(.*?)["']?\\)$/);
        if (!match || !r.width || !r.height) continue;
        const img = new Image(); img.src = match[1];
        try { await img.decode(); } catch { failures.push('Broken background: ' + e.className); continue; }
        if (e.dataset.stage === 'PLANNING' || e.classList.contains('thumb-plan')) {
            if (s.backgroundSize !== 'contain') failures.push('Planning image is cropped or stretched');
            continue;
        }
        const parts=s.backgroundSize.split(' ');
        if (parts.length !== 2 || !parts.every(p=>p.endsWith('%'))) {
            failures.push('Unexpected sprite size: ' + e.className); continue;
        }
        const width=r.width*parseFloat(parts[0])/100, height=r.height*parseFloat(parts[1])/100;
        if (Math.abs(width/height/(img.naturalWidth/img.naturalHeight)-1) > .02)
            failures.push('Distorted sprite: ' + e.className);
        if (width > img.naturalWidth+1 || height > img.naturalHeight+1)
            failures.push('Sprite exceeds source resolution: ' + e.className);
    }
    const original=document.querySelector('.original-photo');
    if (original && getComputedStyle(original).aspectRatio !== 'auto')
        failures.push('Original portrait uses a forced landscape aspect ratio');
    return failures;
}"""


def check_page(browser, base_url, path, viewport):
    width, height = viewport
    page = browser.new_page(viewport={"width": width, "height": height}, has_touch=True)
    page.set_default_timeout(5000)
    errors, bad_responses = [], []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: bad_responses.append(response.url)
            if response.status >= 400 else None)
    stages = 0
    try:
        response = page.goto(base_url + path, wait_until="networkidle")
        assert response.status == 200
        page.locator("img").evaluate_all("es => es.forEach(e=>e.loading='eager')")
        page.wait_for_function("[...document.images].every(i=>i.complete)")
        assert not page.evaluate(LAYOUT_CHECK), page.evaluate(LAYOUT_CHECK)
        assert not page.evaluate(IMAGE_CHECK), page.evaluate(IMAGE_CHECK)
        count = page.locator(".step").count()
        if count:
            following = page.get_by_role("button", name="התמונה הבאה", exact=True)
            for _ in range(count):
                following.evaluate("e=>e.scrollIntoView({block:'center',behavior:'instant'})")
                following.tap()
                page.wait_for_timeout(100)
                assert not page.evaluate(LAYOUT_CHECK), page.evaluate(LAYOUT_CHECK)
                assert not page.evaluate(IMAGE_CHECK), page.evaluate(IMAGE_CHECK)
                stages += 1
        elif path == "":
            for fragment in ("products", "about", "contact"):
                link=page.locator('.header a[href="#' + fragment + '"]')
                if not link.is_visible():
                    continue
                link.tap()
                page.wait_for_timeout(750)
                position=page.locator('#' + fragment).evaluate("""e=>({
                    top:e.querySelector('h2').getBoundingClientRect().top,
                    header:document.querySelector('.header').getBoundingClientRect().bottom
                })""")
                assert position["top"] >= position["header"], position
        assert not errors, errors
        assert not bad_responses, bad_responses
        return stages
    finally:
        page.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", default="/usr/bin/chromium")
    args = parser.parse_args()
    with ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT))) as server:
        Thread(target=server.serve_forever, daemon=True).start()
        stages = 0
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(executable_path=args.browser, args=["--no-sandbox"])
                try:
                    for viewport in VIEWPORTS:
                        for path in PAGES:
                            stages += check_page(browser, f"http://127.0.0.1:{server.server_port}/", path, viewport)
                            print(f"PASS {viewport[0]}x{viewport[1]} {path or '/'}", flush=True)
                finally:
                    browser.close()
        finally:
            server.shutdown()
    print(f"PASS: {len(VIEWPORTS)*len(PAGES)} page/viewport checks; "
          f"{stages} carousel stage checks; images/layout/touch targets/anchors.")


if __name__ == "__main__":
    main()
