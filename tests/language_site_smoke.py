"""Check bilingual layout, persistence, carousels and mocked inquiries.

Run: python3 tests/language_site_smoke.py [--base-url URL] [--report PATH]
Requires Python Playwright and Chromium. Every Formspree POST is intercepted;
this test never sends an inquiry or email.
"""

import argparse
import json
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import sync_playwright

from carousel_mobile_smoke import ROOT, QuietHandler, assert_arrow_reachable
from homepage_smoke import assert_anchor, check_grid
from mobile_site_smoke import IMAGE_CHECK, LAYOUT_CHECK


PAGES = (
    "", "table/", "table/flow/", "geometric/", "driller_stand/", "shelf/kids/", "shoe_rack/",
    "workbench/", "crib/", "etrog_box/", "megillat_esther_box/", "inquiry/",
)
VIEWPORTS = ((320, 568), (390, 844), (844, 390), (1440, 900))
PRODUCTS = {
    "table/flow/": "flow", "geometric/": "geometric", "driller_stand/": "driller-stand",
    "shelf/kids/": "kids-shelf", "shoe_rack/": "shoe-rack",
    "workbench/": "workbench", "crib/": "crib", "etrog_box/": "etrog-box",
    "megillat_esther_box/": "megillah-case",
}
TOOLBAR = ".language-switch button[data-language]"
ARROWS = "button.arrow, button.carousel-arrow"

LOCALE_CHECK = """lang => {
    const failures = [], hebrew = /[\u0590-\u05ff]/u;
    const dir = lang === 'he' ? 'rtl' : 'ltr';
    if (document.documentElement.lang !== lang) failures.push('Wrong HTML language');
    if (document.documentElement.dir !== dir) failures.push('Wrong HTML direction');
    if (getComputedStyle(document.body).direction !== dir) failures.push('Wrong body direction');
    const active = [...document.querySelectorAll('.language-switch button')]
        .filter(e=>e.getAttribute('aria-pressed')==='true');
    if (active.length!==1 || active[0].dataset.language!==lang)
        failures.push('Language selection is not exposed accessibly');
    if (lang === 'en') {
        // A translated Etrog description quotes its actual Hebrew engraving
        // and immediately explains the inscription in English.
        const text = document.body.innerText.replaceAll('עברית','').replaceAll('ולקחתם לכם','');
        if (hebrew.test(text)) failures.push('Untranslated Hebrew body text: '+text.match(/[^\\n]*[\u0590-\u05ff][^\\n]*/gu)?.slice(0,5).join(' | '));
        for (const e of document.querySelectorAll('[aria-label],img[alt],input[placeholder],textarea[placeholder]')) {
            if (e.closest('.language-switch')) continue;
            for (const attr of ['aria-label','alt','placeholder']) {
                const text=e.getAttribute(attr)||'';
                if (hebrew.test(text)) failures.push('Untranslated '+attr+': '+text);
            }
        }
        if (hebrew.test(document.title)) failures.push('Untranslated page title');
    }
    return failures;
}"""

HEADER_CHECK = """() => {
    const failures=[], header=document.querySelector('.header,.top');
    const controls=[...header.querySelectorAll('a,button')].filter(e=>{
        const r=e.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(e).visibility!=='hidden';
    });
    for (const e of controls) {
        const r=e.getBoundingClientRect();
        if (r.width<44 || r.height<44) failures.push('Header control below 44px: '+e.textContent.trim());
        if (r.left<0 || r.right>innerWidth || r.top<0 || r.bottom>header.getBoundingClientRect().bottom+1)
            failures.push('Header control outside header: '+e.textContent.trim());
    }
    for (let i=0;i<controls.length;i++) for(let j=i+1;j<controls.length;j++) {
        const a=controls[i].getBoundingClientRect(),b=controls[j].getBoundingClientRect();
        if (a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5)
            failures.push('Header controls overlap: '+controls[i].textContent.trim()+' / '+controls[j].textContent.trim());
    }
    return failures;
}"""


def check(assertion, detail):
    if not assertion:
        raise AssertionError(detail)


def new_context(browser, locale="he", viewport=(390, 844), blocked_storage=False):
    context = browser.new_context(
        viewport={"width": viewport[0], "height": viewport[1]},
        has_touch=True, is_mobile=viewport[0] <= 900, locale="en-US",
    )
    if blocked_storage:
        context.add_init_script("""for(const method of ['getItem','setItem']) {
            Object.defineProperty(Storage.prototype,method,{value(){throw new Error('QA blocked storage')},configurable:true});
        }""")
    elif locale == "en":
        context.add_init_script("localStorage.setItem('assemble-language','en')")
    # A safety net applies to every test, including tests that do not submit.
    context.route("https://formspree.io/**", lambda route: route.abort())
    return context


def ready(page, url):
    response = page.goto(url, wait_until="load")
    check(response and response.status == 200, "Page did not return 200: " + url)
    page.wait_for_function("Boolean(window.ASSEMBLE_I18N)")
    page.locator("img").evaluate_all("es=>es.forEach(e=>e.loading='eager')")
    page.wait_for_function("[...document.images].every(i=>i.complete)")
    page.evaluate("document.fonts.ready")


def select_language(page, language):
    button = page.locator(TOOLBAR + f'[data-language="{language}"]')
    button.evaluate("e=>e.scrollIntoView({block:'center',behavior:'instant'})")
    button.tap()
    page.wait_for_function("lang=>document.documentElement.lang===lang", arg=language)
    failures = page.evaluate(LOCALE_CHECK, language)
    check(not failures, failures)


def check_control(page, control):
    control.evaluate("e=>e.scrollIntoView({block:'center',behavior:'instant'})")
    data = control.evaluate("""e=>{
        const r=e.getBoundingClientRect(), h=document.querySelector('.header,.top').getBoundingClientRect();
        return {width:r.width,height:r.height,inside:r.left>=0&&r.right<=innerWidth&&r.top>=h.top&&r.bottom<=innerHeight,
            hit:[[.25,.25],[.5,.5],[.75,.75]].every(([x,y])=>{const t=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);return t===e||e.contains(t)})};
    }""")
    check(data["width"] >= 44 and data["height"] >= 44 and data["inside"] and data["hit"], data)


def check_focus(page, control):
    control.focus()
    # Keyboard input sets focus-visible even when the element was focused by JS.
    page.keyboard.press("Shift")
    focus = control.evaluate("""e=>({active:document.activeElement===e,visible:e.matches(':focus-visible'),
        width:parseFloat(getComputedStyle(e).outlineWidth),style:getComputedStyle(e).outlineStyle})""")
    check(focus["active"] and focus["visible"] and focus["width"] >= 2 and focus["style"] == "solid", focus)


def locale_layout(browser, base, path, locale, viewport):
    context = new_context(browser, locale, viewport)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: errors.append(message.text)
            if message.type == "warning" and "Missing translation:" in message.text else None)
    try:
        ready(page, base + path)
        for check_js, arg in ((LOCALE_CHECK, locale), (LAYOUT_CHECK, None), (IMAGE_CHECK, None), (HEADER_CHECK, None)):
            failures = page.evaluate(check_js, arg)
            check(not failures, failures)
        check(page.locator(TOOLBAR).count() == 2, "Missing language buttons")
        for button in page.locator(TOOLBAR).all():
            check_control(page, button)
            check_focus(page, button)
            native = "עברית" if button.get_attribute("data-language") == "he" else "English"
            check(page.get_by_role("button", name=native, exact=True).count() == 1, "Native accessible language name missing")
            check(button.get_attribute("lang") == button.get_attribute("data-language"), "Language button pronunciation metadata is wrong")
        # Locale toggles must work in both directions without changing the URL.
        url = page.url
        select_language(page, "en" if locale == "he" else "he")
        select_language(page, locale)
        check(page.url == url, "Language toggle changed route")
        check(not errors, errors)
        return {"page": path or "/", "locale": locale, "viewport": viewport, "toolbar_controls": 2}
    finally:
        context.close()


def persistence(browser, base):
    context = new_context(browser)
    page = context.new_page()
    try:
        ready(page, base)
        check(document_language(page) == "he", "Default must be Hebrew even in an English browser")
        select_language(page, "en")
        check(page.evaluate("localStorage.getItem('assemble-language')") == "en", "English preference was not saved")
        page.locator('a[href="table/"]').first.click()
        page.wait_for_load_state("load")
        check(document_language(page) == "en", "Language lost when entering family")
        page.locator('a[href="../geometric/"]').click()
        page.wait_for_load_state("load")
        check(document_language(page) == "en", "Language lost when entering model")
        page.locator('.adapt-link').click()
        page.wait_for_load_state("load")
        check(document_language(page) == "en", "Language lost when entering inquiry")
        check(page.locator('#product').input_value() == "geometric", "Product prefill lost")
        page.reload(wait_until="load")
        check(document_language(page) == "en", "Language lost on reload")
        select_language(page, "he")
        page.reload(wait_until="load")
        check(document_language(page) == "he", "Hebrew preference lost on reload")
        return {"navigation_steps": 3, "reloads": 2, "default_hebrew_in_english_browser": True}
    finally:
        context.close()


def document_language(page):
    return page.locator("html").get_attribute("lang")


def storage_fallback(browser, base):
    context = new_context(browser, blocked_storage=True)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    try:
        ready(page, base)
        check(document_language(page) == "he", "Storage failure did not default to Hebrew")
        select_language(page, "en")
        select_language(page, "he")
        check(not errors, errors)
        return {"blocked_read_write": True, "language_changes": 2}
    finally:
        context.close()


def cached_pageshow_and_tabs(browser, base):
    context = new_context(browser)
    first = context.new_page()
    second = context.new_page()
    try:
        ready(first, base + "inquiry/?product=crib")
        first.locator("#customer-name").fill("Preserved draft")
        first.locator("#optional-details > summary").click()
        first.locator("#note").fill("Keep these dimensions")
        first.evaluate("localStorage.setItem('assemble-language','en');dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))")
        check(document_language(first) == "en", "Cached pageshow did not reconcile saved English")
        check(first.locator("#customer-name").input_value() == "Preserved draft", "Cached pageshow lost draft")
        select_language(first, "he")
        ready(second, base + "geometric/")
        second.locator(".step").nth(3).click()
        select_language(first, "en")
        second.wait_for_function("document.documentElement.lang==='en'")
        check(second.locator(".step").nth(3).get_attribute("aria-pressed") == "true", "Cross-tab synchronization reset active slide")
        select_language(second, "he")
        first.wait_for_function("document.documentElement.lang==='he'")
        check(first.locator("#customer-name").input_value() == "Preserved draft" and first.locator("#note").input_value() == "Keep these dimensions", "Cross-tab synchronization lost draft")
        return {"cached_pageshow": True, "cross_tab_changes": 2, "draft_and_slide_preserved": True}
    finally:
        context.close()


def bfcache_history(playwright, base, executable):
    options = {"executable_path": executable, "args": ["--no-sandbox"]}
    if base.startswith("https://"):
        from homepage_smoke import browser_options
        options = browser_options(executable, base)
    # Playwright disables browser back/forward caching by default. Enable it
    # here so the test exercises restoration rather than a fresh reload.
    options["ignore_default_args"] = ["--disable-back-forward-cache"]
    browser = playwright.chromium.launch(**options)
    context = new_context(browser)
    context.add_init_script("addEventListener('pageshow',e=>{window.qaPageShowPersisted=e.persisted})")
    page = context.new_page()
    try:
        ready(page, base)
        with page.expect_navigation(wait_until="load"):
            page.locator('a[href="table/"]').first.click()
        select_language(page, "en")
        page.evaluate("history.back()")
        page.wait_for_function("url=>location.href===url", arg=base)
        page.wait_for_timeout(150)
        check(page.evaluate("window.qaPageShowPersisted") is True, "Browser did not exercise BFCache restore")
        check(document_language(page) == "en", "Back restored stale Hebrew despite stored English")
        page.evaluate("history.forward()")
        page.wait_for_function("url=>location.href===url", arg=base + "table/")
        page.wait_for_timeout(150)
        check(document_language(page) == "en", "Forward lost English preference")
        check(page.evaluate("window.qaPageShowPersisted") is True, "Forward did not exercise BFCache restore")
        return {"bfcache_restores": 2, "back_forward_language_persistence": True}
    finally:
        context.close()
        browser.close()


def homepage_navigation(browser, base, locale, viewport):
    context = new_context(browser, locale, viewport)
    page = context.new_page()
    try:
        ready(page, base)
        rows = check_grid(page, viewport[0])
        targets = 0
        for fragment in ("products", "about", "contact"):
            link = page.locator(f'header a[href="#{fragment}"]')
            if not link.is_visible():
                continue
            page.evaluate("scrollTo({top:0,behavior:'instant'})")
            check_control(page, link)
            link.tap()
            assert_anchor(page, fragment)
            targets += 1
        # Both controls are reachable in the native keyboard tab sequence.
        page.locator(TOOLBAR + '[data-language="en"]').focus()
        page.keyboard.press("Enter")
        check(document_language(page) == "en", "Enter failed to select English")
        page.keyboard.press("Shift+Tab")
        check(page.locator(TOOLBAR + '[data-language="he"]').evaluate("e=>document.activeElement===e"), "Hebrew button missing from tab sequence")
        page.keyboard.press("Space")
        check(document_language(page) == "he", "Space failed to select Hebrew")
        return {"balanced_grid_rows": rows, "sticky_header_anchor_targets": targets, "keyboard_language_changes": 2}
    finally:
        context.close()


def carousel(browser, base, path, locale, viewport):
    context = new_context(browser, locale, viewport)
    page = context.new_page()
    try:
        ready(page, base + path)
        arrows = page.locator(ARROWS)
        check(arrows.count() == 2, "Expected two arrows")
        previous = arrows.nth(0)
        following = arrows.nth(1)
        for arrow in (previous, following):
            assert_arrow_reachable(page, arrow)
        steps = page.locator(".step")
        count = steps.count()
        check(count == {"geometric/": 6, "driller_stand/": 5, "shelf/kids/": 5, "shoe_rack/": 2}[path], "Stage count changed")
        check(previous.is_enabled() and following.is_enabled(), "Carousel arrows must be active")
        active = 0
        transitions = 0

        def stage(expected):
            check(steps.nth(expected).get_attribute("aria-pressed") == "true", "Wrong active step")
            check(page.locator('.step[aria-pressed="true"]').count() == 1, "More than one selected step")
            if path == "shoe_rack/":
                check(page.locator('.slide.active').count() == 1, "Expected one visible Shoe Rack image")
                check(page.locator('.slide').nth(expected).get_attribute('aria-hidden') == 'false', "Wrong visible Shoe Rack image")
                full_size = ("shoe-rack-planning-clean.webp", "media/shoe-rack-cutting-original.jpeg")[expected]
                check(page.locator('.gallery-image-open').get_attribute('href').endswith(full_size), "Full-size link does not match the selected stage")
                check(page.locator('.progress').inner_text().replace('\n', '') == f"0{expected+1} / 02", "Shoe Rack progress does not match the selected stage")
            failures = page.evaluate(LOCALE_CHECK, document_language(page))
            check(not failures, failures)

        for arrow, delta in ((following, 1), (previous, -1)):
            for _ in range(count):
                assert_arrow_reachable(page, arrow)
                arrow.tap()
                active = (active + delta) % count
                transitions += 1
                stage(active)
                for control in (previous, following):
                    assert_arrow_reachable(page, control)
                if path == "shoe_rack/":
                    # Stage 02 loads only when selected; wait for its real pixels
                    # before preserving the strict image geometry assertions.
                    page.locator('.slide.active img').evaluate("image => image.decode()")
                for script in (LAYOUT_CHECK, IMAGE_CHECK):
                    failures = page.evaluate(script)
                    check(not failures, failures)
        # Translate the visible active caption without returning to slide 01.
        following.tap()
        active = (active + 1) % count
        transitions += 1
        before = page.locator(".copy h3,.caption h3").first.inner_text()
        select_language(page, "en" if locale == "he" else "he")
        stage(active)
        after = page.locator(".copy h3,.caption h3").first.inner_text()
        check(before != after, "Active slide caption did not translate")
        select_language(page, locale)
        stage(active)
        assert_arrow_reachable(page, previous)
        check_focus(page, previous)
        page.keyboard.press("Enter")
        active = (active - 1) % count
        transitions += 1
        stage(active)
        following.focus()
        page.keyboard.press("Space")
        active = (active + 1) % count
        transitions += 1
        stage(active)
        for key, delta in (("ArrowRight", 1), ("ArrowLeft", -1)):
            page.keyboard.press(key)
            active = (active + delta) % count
            transitions += 1
            stage(active)
        return {"stages": count, "transitions": transitions, "active_preserved_on_locale_change": True}
    finally:
        context.close()


def inquiry(browser, base, locale):
    context = new_context(browser, locale)
    page = context.new_page()
    requests = []
    pending = []

    def hold(route):
        if route.request.method == "OPTIONS":
            return route.fulfill(status=204, headers={"access-control-allow-origin": "*", "access-control-allow-methods": "POST", "access-control-allow-headers": "*"})
        requests.append(route.request.post_data or "")
        pending.append(route)

    context.route("https://formspree.io/f/xwlvlbno", hold)
    try:
        ready(page, base + "inquiry/?product=megillah-case")
        check(page.locator("#product").input_value() == "megillah-case", "Product query not preselected")
        check(page.locator("#planning-notice").is_visible(), "Planning notice not shown")
        check(page.locator("#whatsapp-request").is_hidden(), "Unconfigured WhatsApp appeared")
        page.locator("#customer-name").fill("QA Customer")
        page.locator("#customer-contact").fill("customer@example.invalid")
        page.locator("#quantity").fill("2")
        page.locator("#optional-details > summary").click()
        page.locator("#width").fill("310")
        page.locator("#note").fill("QA sample only <literal text>")
        before = page.locator("#inquiry-form").evaluate("f=>Object.fromEntries(new FormData(f))")
        other = "en" if locale == "he" else "he"
        select_language(page, other)
        after = page.locator("#inquiry-form").evaluate("f=>Object.fromEntries(new FormData(f))")
        check(before == after, "Language switch discarded form input")
        select_language(page, locale)
        email = page.locator("#email-request")
        email.evaluate("e=>e.addEventListener('click',event=>event.preventDefault())")
        email.click()
        parsed = urlsplit(email.get_attribute("href"))
        check(parsed.scheme == "mailto" and parsed.path == "labassemble@gmail.com", "Email destination changed")
        body = parse_qs(parsed.query)["body"][0]
        check("QA Customer" in body and "310" in body, "Email draft missing request details")
        if locale == "en":
            check(not any("\u0590" <= char <= "\u05ff" for char in body), "English email draft contains untranslated Hebrew")
        old_status = page.locator("#inquiry-status").inner_text()
        check(old_status, "No mail app status")
        select_language(page, other)
        check(page.locator("#inquiry-status").inner_text() != old_status, "Status did not translate")
        select_language(page, locale)
        page.locator("#send-request").click()
        page.wait_for_function("document.querySelector('#inquiry-form').getAttribute('aria-busy')==='true'")
        page.wait_for_function("document.querySelector('#send-request').disabled")
        page.wait_for_timeout(50)
        check(len(pending) == 1, "Submission not intercepted once")
        busy_caption = page.locator("#send-request").inner_text()
        select_language(page, other)
        check(page.locator("#send-request").is_disabled(), "Language change enabled busy submit")
        check(page.locator("#send-request").inner_text() != busy_caption, "Busy caption failed to translate")
        check(page.locator("#inquiry-form").get_attribute("aria-busy") == "true", "Language change lost busy state")
        pending.pop().fulfill(status=200, content_type="application/json", headers={"access-control-allow-origin": "*"}, body='{"ok":true}')
        page.wait_for_function("document.querySelector('#inquiry-status').dataset.state==='success'")
        check(page.locator("#send-request").is_enabled(), "Submit stayed disabled after confirmation")
        success = page.locator("#inquiry-status").inner_text()
        select_language(page, locale)
        check(page.locator("#inquiry-status").inner_text() != success, "Success status failed to translate")
        check(len(requests) == 1, "Unexpected duplicate request")
        failures = page.evaluate(LOCALE_CHECK, locale)
        check(not failures, failures)
        return {"prefill": True, "input_preserved": True, "email_draft": True, "busy_and_success_translated": True, "intercepted_posts": 1, "real_posts": 0}
    finally:
        context.close()


def product_entrypoints(browser, base, locale):
    context = new_context(browser, locale)
    page = context.new_page()
    try:
        for path, product in PRODUCTS.items():
            ready(page, base + path)
            link = page.locator(".adapt-link")
            check_control(page, link)
            with page.expect_navigation(wait_until="load"):
                link.tap()
            check(page.locator("#product").input_value() == product, "Wrong product prefill: " + path)
            check(document_language(page) == locale, "Locale lost at inquiry entry: " + path)
        return {"product_links": len(PRODUCTS), "locale": locale}
    finally:
        context.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url")
    parser.add_argument("--browser", default="/usr/bin/chromium")
    parser.add_argument("--report", default="/tmp/bilingual-qa/report.json")
    parser.add_argument("--quick", action="store_true", help="Check 320px and desktop without changing the test assertions")
    args = parser.parse_args()
    server = None
    if args.base_url:
        base = args.base_url.rstrip("/") + "/"
    else:
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
        Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_port}/"
    report = {"base_url": base, "passed": [], "failed": [], "real_posts": 0}
    viewports = (VIEWPORTS[0], VIEWPORTS[-1]) if args.quick else VIEWPORTS
    try:
        with sync_playwright() as playwright:
            options = {"executable_path": args.browser, "args": ["--no-sandbox"]}
            if base.startswith("https://"):
                from homepage_smoke import browser_options
                options = browser_options(args.browser, base)
            browser = playwright.chromium.launch(**options)
            try:
                tasks = [
                    (f"layout:{path or '/'}:{locale}:{viewport[0]}", lambda p=path, l=locale, v=viewport: locale_layout(browser, base, p, l, v))
                    for viewport in viewports for locale in ("he", "en") for path in PAGES
                ]
                tasks += [("persistence", lambda: persistence(browser, base)), ("storage-fallback", lambda: storage_fallback(browser, base))]
                tasks += [("cached-pageshow-and-tabs", lambda: cached_pageshow_and_tabs(browser,base)),
                          ("bfcache-history", lambda: bfcache_history(playwright,base,args.browser))]
                tasks += [(f"homepage-navigation:{locale}:{viewport[0]}", lambda l=locale,v=viewport: homepage_navigation(browser,base,l,v))
                          for locale in ("he", "en") for viewport in (VIEWPORTS[0], VIEWPORTS[-1])]
                tasks += [
                    (f"carousel:{path}:{locale}:{viewport[0]}", lambda p=path, l=locale, v=viewport: carousel(browser, base, p, l, v))
                    for viewport in viewports for locale in ("he", "en") for path in ("geometric/", "driller_stand/", "shelf/kids/", "shoe_rack/")
                ]
                tasks += [(f"inquiry:{locale}", lambda l=locale: inquiry(browser, base, l)) for locale in ("he", "en")]
                tasks += [(f"product-entrypoints:{locale}", lambda l=locale: product_entrypoints(browser, base, l)) for locale in ("he", "en")]
                for name, task in tasks:
                    try:
                        result = task()
                        report["passed"].append({"case": name, **result})
                        print("PASS", name, json.dumps(result, ensure_ascii=False), flush=True)
                    except Exception as error:
                        report["failed"].append({"case": name, "error": str(error)})
                        print("FAIL", name, str(error), flush=True)
            finally:
                browser.close()
    finally:
        if server:
            server.shutdown()
    path = Path(args.report)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"COMPLETE: {len(report['passed'])} passed, {len(report['failed'])} failed; 0 real Formspree posts.", flush=True)
    return bool(report["failed"])


if __name__ == "__main__":
    raise SystemExit(main())
