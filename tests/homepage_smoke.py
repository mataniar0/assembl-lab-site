"""Check the homepage redesign through rendered layout and real navigation.

Run locally: python3 tests/homepage_smoke.py
Run published: python3 tests/homepage_smoke.py --base-url https://example.com/site/
HTTPS runs use the environment's configured proxy and normal certificate checks.
"""

import argparse
from contextlib import contextmanager
from functools import partial
from http.server import ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
from threading import Thread
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

from carousel_mobile_smoke import ROOT, QuietHandler
from mobile_site_smoke import IMAGE_CHECK, LAYOUT_CHECK


VIEWPORTS = (
    (320, 568), (360, 640), (390, 844), (414, 896),
    (640, 900), (641, 900), (768, 1024), (900, 1100),
    (1024, 768), (1100, 900), (1101, 900), (1280, 800),
    (1440, 900), (1920, 1080), (844, 390), (932, 430),
)

REQUIRED_LINKS = (
    '.header nav a[href="#products"]',
    '.header nav a[href="#contact"]',
    '.hero-actions a[href="#products"]',
    '.hero-actions a[href="#contact"]',
)

CONTENT_CHECK = """() => {
    const failures = [];
    const visible = e => {
        const r=e.getBoundingClientRect(), s=getComputedStyle(e);
        return r.width && r.height && s.display !== 'none' && s.visibility !== 'hidden';
    };
    for (const e of document.querySelectorAll('.logo-copy small,.nav,.kicker,.hero-note,.tag,.size-tag,.product-no,.view,.footer')) {
        if (visible(e) && parseFloat(getComputedStyle(e).fontSize) < 10)
            failures.push('Label smaller than 10px: ' + e.className);
    }
    for (const media of document.querySelectorAll('.product-media')) {
        const badges=[...media.querySelectorAll('.tag,.size-tag,.open')].filter(visible);
        const frame=media.getBoundingClientRect();
        for (let i=0; i<badges.length; i++) {
            const a=badges[i].getBoundingClientRect();
            if (a.left < frame.left-1 || a.right > frame.right+1 ||
                a.top < frame.top-1 || a.bottom > frame.bottom+1)
                failures.push('Product badge outside image frame: ' + badges[i].className);
            for (let j=i+1; j<badges.length; j++) {
                const b=badges[j].getBoundingClientRect();
                if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)
                    failures.push('Product badges overlap: ' + badges[i].className + '/' + badges[j].className);
            }
        }
    }
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node=walker.currentNode, parent=node.parentElement;
        if (!node.textContent.trim() || !visible(parent) || parent.closest('script,style')) continue;
        const range=document.createRange(); range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
            if (!r.width || !r.height) continue;
            if (r.left < -1 || r.right > innerWidth+1)
                failures.push('Text outside viewport: ' + node.textContent.trim().slice(0,60));
            for (let e=parent; e && e !== document.body; e=e.parentElement) {
                const s=getComputedStyle(e), f=e.getBoundingClientRect();
                const clips=axis=>['hidden','clip','auto','scroll'].includes(axis);
                if ((clips(s.overflowX) && (r.left < f.left-1 || r.right > f.right+1)) ||
                    (clips(s.overflowY) && (r.top < f.top-1 || r.bottom > f.bottom+1))) {
                    failures.push('Text clipped by ' + e.className + ': ' + node.textContent.trim().slice(0,60));
                    break;
                }
            }
        }
    }
    return [...new Set(failures)];
}"""

GRID_CHECK = """() => {
    const rect = e => {
        const r=e.getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
    };
    return {
        grid:rect(document.querySelector('.products')),
        featured:[...document.querySelectorAll('.products > .featured')].map(rect),
        cards:[...document.querySelectorAll('.products > .product:not(.featured)')].map(rect)
    };
}"""

HIT_CHECK = """e => {
    const r=e.getBoundingClientRect(), header=document.querySelector('.header').getBoundingClientRect();
    return {
        width:r.width, height:r.height, top:r.top, left:r.left,
        right:r.right, bottom:r.bottom, headerBottom:header.bottom,
        hit:[[.25,.25],[.5,.5],[.75,.75]].every(([x,y])=>{
            const point=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);
            return point === e || e.contains(point);
        })
    };
}"""

CONTRAST_CHECK = """e => {
    const rgba=value=>{
        const parts=value.match(/[\\d.]+/g).map(Number);
        return [...parts.slice(0,3),parts.length>3?parts[3]:1];
    };
    const blend=(color,background)=>color.slice(0,3).map((c,i)=>c*color[3]+background[i]*(1-color[3]));
    const ancestry=[];
    for(let parent=e;parent;parent=parent.parentElement) ancestry.unshift(parent);
    let background=[255,255,255];
    for(const parent of ancestry)
        background=blend(rgba(getComputedStyle(parent).backgroundColor),background);
    const style=getComputedStyle(e), foreground=blend(rgba(style.color),background);
    const luminance=color=>color.map(c=>{
        const value=c/255;
        return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;
    }).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
    const values=[luminance(foreground),luminance(background)].sort((a,b)=>a-b);
    const fontSize=parseFloat(style.fontSize), weight=parseFloat(style.fontWeight)||400;
    return {ratio:(values[1]+.05)/(values[0]+.05),
            minimum:fontSize>=24||(fontSize>=18.66&&weight>=700)?3:4.5,
            fontSize,text:e.textContent.trim().slice(0,80)};
}"""


def check_contrast(page):
    checked = 0
    labels = page.locator(
        ".header nav a,.hero-actions a,.hero h1,.hero h1 span,"
        ".hero-copy,.hero-note,.kicker,.hero-photo figcaption,.product-no,.view,.footer span"
    )
    for label in labels.all():
        if label.is_visible():
            measured = label.evaluate(CONTRAST_CHECK)
            assert measured["ratio"] >= measured["minimum"], measured
            checked += 1
    for link in page.locator(".header nav a,.hero-actions a").all():
        if link.is_visible():
            link.hover()
            measured = link.evaluate(CONTRAST_CHECK)
            assert measured["ratio"] >= measured["minimum"], {"state": "hover", **measured}
            checked += 1
    page.mouse.move(0, 0)
    return checked


def check_contrast_page(browser, base_url, viewport):
    page = browser.new_page(viewport={"width": viewport[0], "height": viewport[1]}, has_touch=True)
    try:
        response = page.goto(base_url, wait_until="networkidle")
        assert response and response.status == 200
        return {"viewport": list(viewport), "contrast_checks": check_contrast(page),
                "navigation_activations": 0}
    finally:
        page.close()


def check_grid(page, width):
    measured = page.evaluate(GRID_CHECK)
    grid, featured, cards = measured["grid"], measured["featured"], measured["cards"]
    assert len(featured) == 1 and len(cards) == 7, measured
    featured = featured[0]
    assert abs(featured["left"] - grid["left"]) <= 1, measured
    assert abs(featured["right"] - grid["right"]) <= 1, measured
    assert all(card["top"] > featured["bottom"] for card in cards), measured
    rows = []
    for card in cards:
        row = next((row for row in rows if abs(row[0]["top"] - card["top"]) <= 1), None)
        if row is None:
            rows.append([card])
        else:
            row.append(card)
    expected = [1, 1, 1, 1, 1, 1, 1] if width <= 640 else [2, 2, 2, 1] if width <= 1100 else [3, 2, 2]
    assert [len(row) for row in rows] == expected, {"expected_rows": expected, **measured}
    for row in rows:
        ordered = sorted(row, key=lambda card: card["left"])
        assert max(card["width"] for card in row) - min(card["width"] for card in row) <= 1, measured
        assert abs(ordered[0]["left"] - grid["left"]) <= 1, measured
        assert abs(ordered[-1]["right"] - grid["right"]) <= 1, measured
        assert all(a["right"] < b["left"] for a, b in zip(ordered, ordered[1:])), measured
    return expected


def assert_target(page, link, *, header_link=False):
    assert link.is_visible(), "Required navigation link is hidden"
    if not header_link:
        link.evaluate("e=>e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'})")
    geometry = link.evaluate(HIT_CHECK)
    assert geometry["width"] >= 44 and geometry["height"] >= 44, geometry
    assert geometry["left"] >= -.5 and geometry["right"] <= page.viewport_size["width"] + .5, geometry
    assert geometry["top"] >= -.5 and geometry["bottom"] <= page.viewport_size["height"] + .5, geometry
    if not header_link:
        assert geometry["top"] >= geometry["headerBottom"] - .5, geometry
    assert geometry["hit"], geometry


def assert_anchor(page, fragment):
    page.wait_for_function("fragment=>location.hash==='#'+fragment", arg=fragment)
    # Wait for the native smooth scroll to settle, rather than forcing it to jump.
    page.wait_for_timeout(800)
    position = page.locator("#" + fragment).evaluate("""e=>({
        heading:e.querySelector('h2').getBoundingClientRect().top,
        section:e.getBoundingClientRect().top,
        header:document.querySelector('.header').getBoundingClientRect().bottom
    })""")
    assert position["heading"] >= position["header"] - .5, position
    assert position["section"] >= position["header"] - .5, position


def check_page(browser, base_url, viewport):
    width, height = viewport
    page = browser.new_page(viewport={"width": width, "height": height}, has_touch=True)
    page.set_default_timeout(8000)
    errors, bad_responses = [], []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: bad_responses.append(response.url)
            if response.status >= 400 else None)
    try:
        response = page.goto(base_url, wait_until="networkidle")
        assert response and response.status == 200
        page.locator("img").evaluate_all("es=>es.forEach(e=>e.loading='eager')")
        page.wait_for_function("[...document.images].every(i=>i.complete)")
        navigation = page.get_by_role("navigation", name="Main navigation")
        assert navigation.count() == 1
        assert navigation.get_by_role("link", name="PRODUCTS", exact=True).is_visible()
        assert navigation.get_by_role("link", name="CUSTOM SIZE", exact=True).is_visible()
        assert page.locator(".hero-actions").get_by_role("link", name=re.compile(r"^VIEW PRODUCTS(?:\s*→)?$")).count() == 1
        assert page.locator(".hero-actions").get_by_role("link", name=re.compile(r"^CUSTOM SIZE(?:\s*→)?$")).count() == 1
        hero_photo = page.locator(".hero-photo img")
        assert hero_photo.count() == 1 and hero_photo.is_visible(), "Missing visible product photo in Hero"
        assert hero_photo.get_attribute("alt"), "Hero photo has no accessible description"
        failures = page.evaluate(LAYOUT_CHECK) + page.evaluate(IMAGE_CHECK) + page.evaluate(CONTENT_CHECK)
        assert not failures, failures
        rows = check_grid(page, width)
        contrast_checks = check_contrast(page)
        about_visible = page.locator('.header nav a[href="#about"]').is_visible()
        assert about_visible == (width > 640), {"about_visible": about_visible, "viewport_width": width}

        for index, selector in enumerate(REQUIRED_LINKS):
            link = page.locator(selector)
            assert link.count() == 1
            assert_target(page, link, header_link=index < 2)

        # Real Tab input establishes reachability, tab order, and visible focus.
        page.goto(base_url, wait_until="networkidle")
        keyboard_seen = set()
        for _ in range(24):
            page.keyboard.press("Tab")
            focused = page.evaluate("""selectors=>{
                const e=document.activeElement, index=selectors.findIndex(s=>e.matches(s));
                const s=getComputedStyle(e);
                return {index,outline:s.outlineStyle,width:parseFloat(s.outlineWidth)};
            }""", REQUIRED_LINKS)
            if focused["index"] < 0:
                continue
            assert focused["outline"] not in ("none", "hidden") and focused["width"] >= 2, focused
            keyboard_seen.add(focused["index"])
            if len(keyboard_seen) == len(REQUIRED_LINKS):
                break
        assert len(keyboard_seen) == len(REQUIRED_LINKS), keyboard_seen

        activations = 0
        for index, selector in enumerate(REQUIRED_LINKS):
            page.goto(base_url, wait_until="networkidle")
            link = page.locator(selector)
            assert_target(page, link, header_link=index < 2)
            fragment = link.get_attribute("href").removeprefix("#")
            link.tap()
            assert_anchor(page, fragment)
            activations += 1
            page.goto(base_url, wait_until="networkidle")
            link = page.locator(selector)
            link.focus()
            page.keyboard.press("Enter")
            assert_anchor(page, fragment)
            activations += 1

        assert not errors, errors
        assert not bad_responses, bad_responses
        return {"viewport": [width, height], "grid_rows": rows,
                "navigation_activations": activations, "keyboard_links": len(keyboard_seen),
                "contrast_checks": contrast_checks}
    finally:
        page.close()


@contextmanager
def site_url(base_url):
    if base_url:
        yield base_url.rstrip("/") + "/"
        return
    with ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT))) as server:
        Thread(target=server.serve_forever, daemon=True).start()
        try:
            yield f"http://127.0.0.1:{server.server_port}/"
        finally:
            server.shutdown()


def browser_options(browser, base_url):
    options = {"executable_path": browser, "args": ["--no-sandbox"]}
    proxy_url = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    if base_url.startswith("https://") and proxy_url:
        parsed = urlsplit(proxy_url)
        options["proxy"] = {"server": parsed.scheme + "://" + parsed.hostname +
                            (":" + str(parsed.port) if parsed.port else "")}
        if parsed.username:
            options["proxy"]["username"] = parsed.username
        if parsed.password:
            options["proxy"]["password"] = parsed.password
    return options


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", default="/usr/bin/chromium")
    parser.add_argument("--base-url")
    parser.add_argument("--contrast-only", action="store_true",
                        help="Check rendered text contrast, including navigation and CTA hover states")
    parser.add_argument("--report", type=Path, help="Optional JSON result file")
    args = parser.parse_args()
    successes, failures = [], []
    with site_url(args.base_url) as base_url, sync_playwright() as playwright:
        browser = playwright.chromium.launch(**browser_options(args.browser, base_url))
        try:
            for viewport in VIEWPORTS:
                try:
                    checker = check_contrast_page if args.contrast_only else check_page
                    result = checker(browser, base_url, viewport)
                    successes.append(result)
                    print(f"PASS {viewport[0]}x{viewport[1]}: "
                          f"{result['navigation_activations']} touch/keyboard navigations; "
                          f"{result['contrast_checks']} text contrast checks", flush=True)
                except Exception as error:
                    result = {"viewport": list(viewport), "error": str(error)}
                    failures.append(result)
                    print(f"FAIL {viewport[0]}x{viewport[1]}: {error}", flush=True)
        finally:
            browser.close()
    report = {"base_url": args.base_url or "local checkout", "checks": len(VIEWPORTS),
              "passed": successes, "failed": failures,
              "navigation_activations": sum(result["navigation_activations"] for result in successes)}
    if args.report:
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"{'FAIL' if failures else 'PASS'}: {len(successes)}/{len(VIEWPORTS)} homepage viewport checks; "
          f"{report['navigation_activations']} real touch/keyboard navigations; "
          f"{len(failures)} failed viewports.", flush=True)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
