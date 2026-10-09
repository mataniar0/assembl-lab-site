"""Check painted header stability under delayed language initialization.

Run: python tests/language_stability_smoke.py [--base-url URL] [--report PATH]
The test inserts and holds a deferred, test-only script so the real body paints
before DOMContentLoaded. This reproduces the old 48px toolbar insertion reliably
instead of depending on browser/network timing. Text height may change when its
language changes; the header and main boundary must retain their dimensions.
Every non-read request is intercepted. No inquiry or email is sent.
"""

import argparse
import json
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from playwright.sync_api import sync_playwright

from homepage_smoke import browser_options, site_url
from language_site_smoke import (
    HEADER_CHECK, LOCALE_CHECK, PAGES, TOOLBAR, check_control, check_focus,
)
from mobile_site_smoke import LAYOUT_CHECK


WIDTHS = (320, 390, 780, 781, 844, 1440)
GEOMETRY = """() => {
    const h=document.querySelector('header.header,header.top').getBoundingClientRect();
    const m=document.querySelector('main').getBoundingClientRect();
    return {headerTop:h.top,headerHeight:h.height,headerWidth:h.width,
        mainTop:m.top,buttons:document.querySelectorAll('.language-switch button').length,
        readyState:document.readyState};
}"""
TWO_FRAMES = "() => new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))"
SCROLL_SETTLED = """() => new Promise(resolve=>{
    let last=scrollY,still=0; const start=performance.now();
    function frame(){
        still=Math.abs(scrollY-last)<.1?still+1:0; last=scrollY;
        if(still>=8||performance.now()-start>3500)resolve();
        else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})"""


def expect(condition, detail):
    if not condition:
        raise AssertionError(detail)


def context_for(browser, language, width):
    context = browser.new_context(
        viewport={"width": width, "height": 900 if width > 780 else 844},
        has_touch=True, locale="en-US",
    )
    if language == "en":
        context.add_init_script("localStorage.setItem('assemble-language','en')")
    return context


def geometry_matches(before, after, *, boundary=True):
    keys = ("headerTop", "headerHeight", "headerWidth", "mainTop") if boundary else ("headerHeight", "headerWidth")
    return all(abs(before[key] - after[key]) <= 1 for key in keys)


def loaded_checks(page, language):
    failures = page.evaluate(LOCALE_CHECK, language) + page.evaluate(HEADER_CHECK) + page.evaluate(LAYOUT_CHECK)
    expect(not failures, failures)
    expect(page.locator(TOOLBAR).count() == 2, "Expected two language buttons")
    for button in page.locator(TOOLBAR).all():
        expect(button.is_enabled(), "Language control remained disabled")
        check_control(page, button)
        check_focus(page, button)
        label = "עברית" if button.get_attribute("data-language") == "he" else "English"
        expect(page.get_by_role("button", name=label, exact=True).count() == 1, "Missing native accessible label")


def loading_case(browser, base, path, language, width, *, slow_language=False):
    context = context_for(browser, language, width)
    page = context.new_page()
    page.set_default_timeout(12000)
    held_ready, held_language, writes, errors = [], [], [], []
    page.on("pageerror", lambda error: errors.append(str(error)))
    gate = urljoin(base, "__qa_dom_ready_gate__.js")

    def route_request(route):
        request = route.request
        if request.method not in ("GET", "HEAD"):
            writes.append({"method": request.method, "url": request.url})
            route.abort()
        elif request.url == gate:
            held_ready.append(route)
        elif slow_language and urlsplit(request.url).path.endswith("/assets/language.js"):
            held_language.append(route)
        elif request.is_navigation_request():
            response = route.fetch()
            markup = response.text()
            expect("</head>" in markup, "Cannot add deferred readiness gate to HTML")
            route.fulfill(response=response, body=markup.replace(
                "</head>", f'<script defer src="{gate}"></script></head>', 1,
            ))
        else:
            route.continue_()

    context.route("**/*", route_request)
    try:
        response = page.goto(base + path, wait_until="commit")
        expect(response and response.status == 200, "Page did not return 200")
        if slow_language:
            # A parser-blocking head bootstrap may legitimately keep the body
            # unpainted here. Release it after a real delayed network interval;
            # the readiness gate still gives a reliable pre-init body frame.
            page.wait_for_timeout(150)
            expect(len(held_language) == 1, "Language bootstrap request was not held")
            expect(not page.evaluate("Boolean(window.ASSEMBLE_I18N)"), "Held bootstrap already initialized")
            held_language[0].continue_()
        page.wait_for_function("Boolean(document.querySelector('header.header,header.top')&&document.querySelector('main'))")
        page.wait_for_function("document.readyState==='interactive'")
        page.evaluate(TWO_FRAMES)
        expect(len(held_ready) == 1, "Deferred readiness gate was not requested")
        before = page.evaluate(GEOMETRY)
        expect(page.evaluate("!document.documentElement.hasAttribute('data-language-pending') && getComputedStyle(document.body).visibility === 'visible'"),
               "Translated page stayed hidden before delayed initialization")
        # Saved English must already be translated before delayed readiness,
        # so differently sized fallback text cannot reflow the visible page.
        untranslated = page.evaluate("""() => [...document.querySelectorAll('[data-i18n],[data-i18n-html]')].filter(node => {
            const expected = window.ASSEMBLE_I18N.t(node.dataset.i18n || node.dataset.i18nHtml);
            if (!node.hasAttribute('data-i18n-html')) return node.textContent !== expected;
            const fragment = document.createElement('template');
            fragment.innerHTML = expected;
            return node.innerHTML !== fragment.innerHTML;
        }).map(node => node.dataset.i18n || node.dataset.i18nHtml)""")
        expect(not untranslated, {"issue": "Fallback text was visible before delayed initialization", "keys": untranslated})
        held_ready[0].fulfill(body="/* QA deferred initialization gate released */", content_type="text/javascript")
        page.wait_for_load_state("load")
        page.wait_for_function("Boolean(window.ASSEMBLE_I18N)")
        page.evaluate(TWO_FRAMES)
        after = page.evaluate(GEOMETRY)
        expect(geometry_matches(before, after), {"issue": "Painted header/main moved during initialization", "before": before, "after": after})
        expect(before["buttons"] == 2, "Language controls had no reserved initial markup")
        loaded_checks(page, language)
        original_url = page.url
        for target in ("en" if language == "he" else "he", language):
            button = page.locator(TOOLBAR + f'[data-language="{target}"]')
            button.tap()
            page.wait_for_function("lang=>document.documentElement.lang===lang", arg=target)
            page.evaluate(TWO_FRAMES)
            toggled = page.evaluate(GEOMETRY)
            expect(geometry_matches(after, toggled), {"issue": "Header/main moved on language switch", "before": after, "after": toggled})
            loaded_checks(page, target)
        expect(page.url == original_url, "Language switch changed the page URL")
        expect(not errors, errors)
        expect(not writes, writes)
        return {"page": path or "/", "language": language, "width": width,
                "slow_language": slow_language, "before": before, "after": after,
                "initialization_shift_px": after["mainTop"] - before["mainTop"],
                "language_changes": 2, "real_submissions": 0}
    finally:
        context.close()


def early_body_case(browser, base, path, language):
    """Pause parsing before the final translation and inspect the first paint."""
    context = context_for(browser, language, 390)
    page = context.new_page()
    held, writes = [], []
    gate = urljoin(base, '__qa_body_end_gate__.js')
    bootstrap = '<script>window.ASSEMBLE_I18N.translate();</script>'

    def protect_and_pause(route):
        request = route.request
        if request.method not in ('GET', 'HEAD'):
            writes.append(request.url)
            route.abort()
        elif request.url == gate:
            held.append(route)
        elif request.is_navigation_request():
            response = route.fetch()
            markup = response.text()
            expect(bootstrap in markup, 'Missing early document translation')
            route.fulfill(response=response, body=markup.replace(
                bootstrap, f'<script src="{gate}"></script>' + bootstrap, 1))
        else:
            route.continue_()

    context.route('**/*', protect_and_pause)
    try:
        page.goto(base + path, wait_until='commit')
        page.wait_for_function("Boolean(document.querySelector('main'))")
        page.evaluate(TWO_FRAMES)
        expect(len(held) == 1, 'Final document parsing was not held')
        visible = page.evaluate("getComputedStyle(document.body).visibility === 'visible'")
        expect(visible == (language == 'he'), 'Untranslated English fallback was painted, or Hebrew was hidden')
        # A child with explicit visibility:visible can paint through a hidden
        # body. Check actual active gallery images as well as the ancestor.
        carousel_image_visibility = page.locator('.slide.active img').evaluate_all(
            "images => images.map(image => getComputedStyle(image).visibility === 'visible')")
        expect(all(value == (language == 'he') for value in carousel_image_visibility),
               'Active carousel image bypassed the saved-English first-paint guard')
        held[0].fulfill(body='/* QA parser gate released */', content_type='text/javascript')
        page.wait_for_load_state('load')
        expect(page.evaluate("getComputedStyle(document.body).visibility === 'visible' && !document.documentElement.hasAttribute('data-language-pending')"),
               'Completed translation did not reveal the page')
        loaded_checks(page, language)
        expect(not writes, writes)
        return {'page': path or '/', 'language': language, 'width': 390,
                'initial_body_visible': visible, 'translated_body_visible': True,
                'initial_carousel_image_visibility': carousel_image_visibility,
                'real_submissions': 0}
    finally:
        context.close()


def journey_case(browser, base, width):
    """Switch while scrolled without losing a carousel, open section or draft."""
    context = context_for(browser, "he", width)
    page = context.new_page()
    page.set_default_timeout(12000)
    writes = []

    def protect_writes(route):
        if route.request.method in ("GET", "HEAD"):
            route.continue_()
        else:
            writes.append(route.request.url)
            route.abort()

    context.route("**/*", protect_writes)
    try:
        page.goto(base, wait_until="load")
        page.wait_for_function("Boolean(window.ASSEMBLE_I18N)")
        header_height = page.evaluate(GEOMETRY)["headerHeight"]
        anchors = 0
        for language in ("he", "en"):
            page.locator(TOOLBAR + f'[data-language="{language}"]').tap()
            for fragment in ("products", "contact"):
                page.locator(f'header a[href="#{fragment}"]').tap()
                page.wait_for_function("fragment=>location.hash==='#'+fragment", arg=fragment)
                # Far-away sections need more time than nearby anchors. Wait
                # for real native scrolling to finish instead of a fixed sleep.
                page.evaluate(SCROLL_SETTLED)
                position = page.locator("#" + fragment).evaluate("""e=>({
                    top:e.getBoundingClientRect().top,
                    heading:e.querySelector('h2').getBoundingClientRect().top,
                    header:document.querySelector('header').getBoundingClientRect().bottom
                })""")
                expect(position["top"] >= position["header"] - 1 and position["heading"] >= position["header"] - 1, position)
                anchors += 1
        page.goto(base + "geometric/", wait_until="load")
        page.locator(".step").nth(3).click()
        detail = page.locator("details").first
        detail.locator("summary").click()
        for language in ("he", "en", "he"):
            # The sticky language controls are already accessible while scrolled.
            page.locator(TOOLBAR + f'[data-language="{language}"]').tap()
            expect(page.locator(".step").nth(3).get_attribute("aria-pressed") == "true", "Language switch reset active slide")
            expect(detail.get_attribute("open") is not None, "Language switch closed an open section")
            expect(page.evaluate("document.documentElement.scrollWidth<=innerWidth+1"), "Page overflows after scrolled language change")
        page.goto(base + "inquiry/?product=geometric", wait_until="load")
        page.locator("#customer-name").fill("QA preserved draft")
        page.locator("#customer-contact").fill("qa@example.invalid")
        page.locator("#optional-details > summary").click()
        page.locator("#width").fill("700")
        page.locator("#note").fill("QA no real inquiry")
        for language in ("en", "he"):
            page.locator(TOOLBAR + f'[data-language="{language}"]').tap()
            expect(page.locator("#product").input_value() == "geometric", "Product prefill changed")
            expect(page.locator("#customer-name").input_value() == "QA preserved draft", "Draft name changed")
            expect(page.locator("#customer-contact").input_value() == "qa@example.invalid", "Draft contact changed")
            expect(page.locator("#width").input_value() == "700" and page.locator("#note").input_value() == "QA no real inquiry", "Optional draft changed")
            expect(page.locator("#optional-details").get_attribute("open") is not None, "Optional section closed")
            expect(abs(page.evaluate(GEOMETRY)["headerHeight"] - header_height) <= 1, "Header height differs between pages")
        expect(not writes, writes)
        return {"kind": "scrolled_journey", "width": width, "anchors": anchors,
                "carousel_and_open_section_preserved": True, "draft_preserved": True,
                "real_submissions": 0}
    finally:
        context.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url")
    parser.add_argument("--browser", default="/usr/bin/chromium")
    parser.add_argument("--report", type=Path, default=Path("/tmp/language-stability.json"))
    parser.add_argument("--widths", nargs="+", type=int, default=WIDTHS)
    parser.add_argument("--paths", nargs="+", default=PAGES,
                        help="Optional page paths; use / for the homepage")
    parser.add_argument("--languages", nargs="+", choices=("he", "en"), default=("he", "en"))
    parser.add_argument("--loading-only", action="store_true", help="Skip representative slow-bootstrap and scrolled journeys")
    args = parser.parse_args()
    passed, failed = [], []

    def record(kind, data, callback):
        try:
            result = callback()
            passed.append({"kind": kind, **result})
            print("PASS", kind, data, flush=True)
        except Exception as error:
            failed.append({"kind": kind, **data, "error": str(error)})
            print("FAIL", kind, data, str(error), flush=True)

    with site_url(args.base_url) as base, sync_playwright() as playwright:
        browser = playwright.chromium.launch(**browser_options(args.browser, base))
        try:
            for width in args.widths:
                for language in args.languages:
                    for path in args.paths:
                        path = "" if path == "/" else path
                        data = {"page": path or "/", "language": language, "width": width}
                        record("delayed_DOMContentLoaded", data, lambda: loading_case(browser, base, path, language, width))
            if not args.loading_only:
                for path in ('', 'shoe_rack/'):
                    for language in ('he', 'en'):
                        data = {'page': path or '/', 'language': language, 'width': 390}
                        record('paused_body_translation', data, lambda: early_body_case(browser, base, path, language))
                for path, language, width in (("", "he", 390), ("", "en", 390), ("table/flow/", "he", 781), ("table/flow/", "en", 844), ("inquiry/", "he", 320), ("inquiry/", "en", 1440)):
                    data = {"page": path or "/", "language": language, "width": width}
                    record("slow_language_bootstrap", data, lambda: loading_case(browser, base, path, language, width, slow_language=True))
                for width in (390, 781, 1440):
                    record("scrolled_journey", {"width": width}, lambda: journey_case(browser, base, width))
        finally:
            browser.close()
    report = {"base_url": args.base_url or "local checkout", "passed": passed,
              "failed": failed, "checks": len(passed) + len(failed), "real_submissions": 0}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"{'FAIL' if failed else 'PASS'}: {len(passed)} passed, {len(failed)} failed; 0 real submissions", flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
