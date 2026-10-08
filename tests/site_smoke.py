"""Small functional gate for a static checkout, independent of its visual design.

Run: python tests/site_smoke.py [--root PATH] [--browser PATH] [--report PATH]
Install: python -m pip install -r tests/requirements.txt
Browser: a system Chromium, ASSEMBLE_BROWSER, or `python -m playwright install chromium`.
All non-read browser requests are intercepted: no real inquiry is ever sent.
"""

from __future__ import annotations

import argparse
from collections import deque
from contextlib import contextmanager
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import shutil
import sys
from threading import Thread
import time
from urllib.parse import parse_qs, unquote, urljoin, urlsplit


EXCLUDED = {".git", ".venv", "venv", "node_modules", "tests", "tooling", "tools", "generated_images"}
VIEWPORTS = ((390, 844), (1440, 900))
ARROWS = "button.arrow, button.carousel-arrow"
URL_PATTERN = re.compile(r"url\(\s*(['\"]?)(.*?)\1\s*\)", re.I)


def require(condition, message):
    if not condition:
        raise AssertionError(message)


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.refs, self.links, self.ids = [], [], set()
        self.feed(source)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "a" and attrs.get("name"):
            self.ids.add(attrs["name"])
        for key in ("src", "href", "poster"):
            if attrs.get(key):
                self.refs.append(attrs[key])
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        # Data URLs contain commas and are handled by the browser image check.
        if attrs.get("srcset") and not attrs["srcset"].startswith("data:"):
            self.refs.extend(item.strip().split()[0] for item in attrs["srcset"].split(",") if item.strip())


def discover(root):
    pages = sorted(path for path in root.rglob("index.html")
                   if not any(part in EXCLUDED or part.startswith(".") for part in path.relative_to(root).parts))
    require(root / "index.html" in pages, "No homepage index.html found in --root")
    return {path: Document(path.read_text(encoding="utf-8")) for path in pages}


def local_target(root, source, reference):
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc:
        return None
    target = (root / unquote(parsed.path).lstrip("/") if parsed.path.startswith("/")
              else source.parent / unquote(parsed.path)) if parsed.path else source
    target = target.resolve()
    if target.is_dir():
        target /= "index.html"
    require(target.is_relative_to(root), f"Reference escapes website root: {source.relative_to(root)} → {reference}")
    return target, unquote(parsed.fragment)


def check_references(root, documents):
    checked = 0
    failures = []
    sources = {path: (doc.refs + [url for _, url in URL_PATTERN.findall(path.read_text(encoding="utf-8"))])
               for path, doc in documents.items()}
    for path in root.rglob("*.css"):
        if not any(part in EXCLUDED or part.startswith(".") for part in path.relative_to(root).parts):
            sources[path] = [url for _, url in URL_PATTERN.findall(path.read_text(encoding="utf-8"))]
    for source, references in sources.items():
        for ref in references:
            try:
                # Template-literal URLs are populated by site JavaScript; the
                # browser resource check validates their resolved backgrounds.
                if "${" in ref:
                    continue
                resolved = local_target(root, source, ref)
                if resolved is None:
                    continue
                target, fragment = resolved
                checked += 1
                require(target.is_file(), f"Missing local file: {source.relative_to(root)} → {ref}")
                if fragment and target.suffix.lower() == ".html":
                    document = documents.get(target) or Document(target.read_text(encoding="utf-8"))
                    require(fragment in document.ids, f"Missing link target: {source.relative_to(root)} → {ref}")
            except (AssertionError, ValueError) as error:
                failures.append(str(error))
    require(not failures, "\n".join(failures[:20]))
    return {"references_checked": checked, "pages_discovered": len(documents)}


def route_name(root, path):
    relative = path.parent.relative_to(root).as_posix()
    return "" if relative == "." else relative + "/"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


@contextmanager
def site_server(root):
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(root)))
    server.daemon_threads = True
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}/"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


class Session:
    """One test context; the write guard covers every page, even popups."""

    def __init__(self, browser, base, viewport=(390, 844), locale="he"):
        self.base = base
        self.errors, self.blocked_writes, self.mock_requests = [], [], []
        self.mock_endpoint = None
        self.context = browser.new_context(viewport={"width": viewport[0], "height": viewport[1]},
                                           has_touch=True, is_mobile=viewport[0] < 900, service_workers="block")
        self.context.set_default_timeout(5000)
        # Hebrew tests use genuinely empty storage, checking the site's default.
        # English initializes only an empty preference; later navigation must
        # retain the user's selection rather than having the test restore it.
        if locale == "en":
            self.context.add_init_script("try { if (!localStorage.getItem('assemble-language')) localStorage.setItem('assemble-language', 'en'); } catch (_) { /* Initial about:blank has no storage. */ }")
        self.context.route("**/*", self.guard)
        self.context.on("page", self.observe)
        self.page = self.context.new_page()

    def guard(self, route):
        request = route.request
        if request.method in ("GET", "HEAD"):
            return route.continue_()
        headers = {"access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS",
                   "access-control-allow-headers": "*"}
        if self.mock_endpoint and request.url == self.mock_endpoint:
            if request.method == "OPTIONS":
                return route.fulfill(status=204, headers=headers)
            if request.method == "POST":
                self.mock_requests.append(request.post_data or "")
                return route.fulfill(status=200, content_type="application/json", headers=headers,
                                     body='{"ok":true}')
        self.blocked_writes.append(f"{request.method} {request.url}")
        route.abort()

    def observe(self, page):
        page.on("pageerror", lambda error: self.errors.append(f"JavaScript: {error}"))
        page.on("console", lambda message: self.errors.append(f"Console {message.type}: {message.text}")
                if message.type == "error" or (message.type == "warning" and "Missing translation:" in message.text) else None)
        page.on("response", lambda response: self.errors.append(f"HTTP {response.status}: {response.url}")
                if response.url.startswith(self.base) and response.status >= 400 else None)
        page.on("requestfailed", lambda request: self.errors.append(f"Failed local request: {request.url}")
                if request.url.startswith(self.base) else None)

    def ready(self, route):
        response = self.page.goto(urljoin(self.base, route), wait_until="load")
        require(response and response.status == 200, f"Page did not return HTTP 200: {route or '/'}")
        self.page.wait_for_function("Boolean(window.ASSEMBLE_I18N)")
        self.page.evaluate("""async () => {
            document.querySelectorAll('img').forEach(image => image.loading = 'eager');
            await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
        }""")

    def healthy(self):
        require(not self.errors, "\n".join(self.errors[:12]))
        require(not self.blocked_writes, "Unexpected write was blocked: " + ", ".join(self.blocked_writes))

    def close(self):
        self.context.close()


RESOURCE_CHECK = r"""async () => {
    const failures = [];
    for (const image of document.images) {
        if (!image.complete || !image.naturalWidth || !image.naturalHeight)
            failures.push('Image failed to load: ' + (image.currentSrc || image.src).slice(0, 180));
    }
    const urls = new Set();
    for (const element of document.querySelectorAll('*')) {
        for (const pseudo of [null, '::before', '::after']) {
            const background = getComputedStyle(element, pseudo).backgroundImage;
            for (const match of background.matchAll(/url\(["']?(.*?)["']?\)/g)) urls.add(match[1]);
        }
    }
    await Promise.all([...urls].map(url => new Promise(resolve => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = () => {failures.push('Background failed to load: ' + url.slice(0, 180)); resolve();};
        image.src = url;
    })));
    return failures;
}"""


def locale_and_layout(page, locale):
    result = page.evaluate("""() => ({lang: document.documentElement.lang, dir: document.documentElement.dir,
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
        selected: [...document.querySelectorAll('.language-switch button[aria-pressed="true"]')].map(e => e.dataset.language)})""")
    require(result["lang"] == locale and result["dir"] == ("rtl" if locale == "he" else "ltr"),
            f"Incorrect language or direction: {result}")
    require(result["selected"] == [locale], f"Language control selection is incorrect: {result}")
    require(result["overflow"] <= 2, f"Horizontal page overflow: {result['overflow']}px")


def toggle(page, locale):
    button = page.locator(f'.language-switch button[data-language="{locale}"]')
    require(button.count() == 1 and button.is_visible(), f"Missing visible language button: {locale}")
    button.click()
    page.wait_for_function("locale => document.documentElement.lang === locale", arg=locale)
    locale_and_layout(page, locale)


def carousel_smoke(page):
    arrows = page.locator(ARROWS)
    if not arrows.count():
        return {"carousels": 0, "transitions": 0}
    groups = page.locator(".gallery").filter(has=page.locator(ARROWS))
    require(groups.count() > 0, "Carousel controls exist without a discoverable gallery")
    transitions, disabled = 0, 0
    for gallery in groups.all():
        controls = gallery.locator(ARROWS)
        require(controls.count() == 2, "Carousel must expose previous and next controls")
        previous, following = controls.nth(0), controls.nth(1)
        steps = gallery.locator(".step")
        if steps.count() < 2:
            require(previous.is_disabled() and following.is_disabled(), "Single-image arrows must be disabled")
            disabled += 1
            continue
        require(previous.is_enabled() and following.is_enabled(), "Multi-image carousel arrows are disabled")

        def active():
            indices = steps.evaluate_all("es => es.flatMap((e,i) => e.classList.contains('active') || e.getAttribute('aria-pressed') === 'true' ? [i] : [])")
            require(len(indices) == 1, f"Carousel must have one selected stage: {indices}")
            return indices[0]

        initial = active()
        total = steps.count()
        for control, delta, key in ((following, 1, None), (previous, -1, None),
                                    (following, 1, "Space"), (previous, -1, "Enter")):
            before = active()
            control.evaluate("e => e.scrollIntoView({block:'center', behavior:'instant'})")
            require(bool(control.get_attribute("aria-label")), "Carousel arrow lacks an accessible name")
            if key:
                control.focus()
                require(control.evaluate("e => e === document.activeElement"), "Carousel arrow cannot receive focus")
                control.press(key)
            elif page.viewport_size["width"] < 900:
                control.tap()
            else:
                control.click()
            require(active() == (before + delta) % total, "Carousel arrow did not select the expected next/previous stage")
            transitions += 1
        require(active() == initial, "Carousel did not return to the initial stage")
        before = active()
        language = page.locator("html").get_attribute("lang")
        toggle(page, "en" if language == "he" else "he")
        require(active() == before, "Language toggle reset the carousel")
        toggle(page, language)
    return {"carousels": groups.count(), "transitions": transitions, "disabled_single_image": disabled}


def page_smoke(browser, base, path, locale, viewport):
    session = Session(browser, base, viewport, locale)
    try:
        session.ready(path)
        locale_and_layout(session.page, locale)
        toggle(session.page, "en" if locale == "he" else "he")
        toggle(session.page, locale)
        details = carousel_smoke(session.page)
        failures = session.page.evaluate(RESOURCE_CHECK)
        require(not failures, "\n".join(failures[:12]))
        session.healthy()
        return {"page": path or "/", "language": locale, "viewport": list(viewport), **details}
    finally:
        session.close()


def shortest_path(graph, start, target):
    queue, seen = deque([(start, [])]), {start}
    while queue:
        node, trail = queue.popleft()
        if node == target:
            return trail
        for following, href in graph.get(node, []):
            if following not in seen:
                seen.add(following)
                queue.append((following, trail + [(following, href)]))
    raise AssertionError(f"Product page is unreachable from the homepage: {target}")


def click_href(page, href):
    # href is data from an HTML document; pass it as an argument, never as JS code.
    indices = page.locator("a[href]").evaluate_all("(es, href) => es.flatMap((e,i) => e.getAttribute('href') === href ? [i] : [])", href)
    for index in indices:
        link = page.locator("a[href]").nth(index)
        if link.is_visible():
            link.evaluate("e => e.scrollIntoView({block:'center', behavior:'instant'})")
            link.click()
            page.wait_for_load_state("load")
            return
    raise AssertionError(f"No visible navigation link: {href}")


def navigation_cases(root, documents):
    graph, quotes = {}, []
    for source, document in documents.items():
        graph[source] = []
        for href in document.links:
            target = local_target(root, source, href)
            if target is None:
                continue
            path, _ = target
            if path in documents and path != source:
                graph[source].append((path, href))
            product = parse_qs(urlsplit(href).query).get("product", [None])[0]
            if product and path in documents:
                quotes.append((source, path, href, product))
    require(quotes, "No product-to-inquiry links discovered")
    # Multiple CTAs for one product do not require duplicate browser journeys.
    return graph, list({(source, product): (source, path, href, product) for source, path, href, product in quotes}.values())


def navigation_smoke(browser, base, root, documents, graph, quote):
    source, inquiry, href, product = quote
    session = Session(browser, base, locale=None)
    page = session.page
    try:
        session.ready("")
        require(page.locator("html").get_attribute("lang") == "he", "Fresh visit did not default to Hebrew")
        toggle(page, "en")
        for destination, link in shortest_path(graph, root / "index.html", source):
            click_href(page, link)
            require(urlsplit(page.url).path == urlsplit(urljoin(base, route_name(root, destination))).path,
                    f"Navigation reached an unexpected page: {page.url}")
            locale_and_layout(page, "en")
        click_href(page, href)
        locale_and_layout(page, "en")
        require(page.locator("#product").input_value() == product, f"Inquiry prefill lost: {product}")
        page.reload(wait_until="load")
        locale_and_layout(page, "en")
        home_links = [link for link in documents[inquiry].links
                      if local_target(root, inquiry, link) and local_target(root, inquiry, link)[0] == root / "index.html"]
        require(home_links, "Inquiry lacks a link back to the homepage")
        click_href(page, home_links[0])
        require(urlsplit(page.url).path == urlsplit(base).path, "Return link did not reach the homepage")
        locale_and_layout(page, "en")
        session.healthy()
        return {"product": product, "page": route_name(root, source), "language_persisted": True, "prefill": True, "returned_home": True}
    finally:
        session.close()


def form_smoke(browser, base, root, quote, locale):
    _, inquiry, href, product = quote
    session = Session(browser, base, locale=locale)
    try:
        session.ready(route_name(root, inquiry) + "?product=" + product)
        page = session.page
        form, send = page.locator("#inquiry-form"), page.locator("#send-request")
        require(form.count() == 1 and send.is_visible() and send.is_enabled(), "Inquiry submission controls are unavailable")
        session.mock_endpoint = form.get_attribute("action")
        require(session.mock_endpoint and urlsplit(session.mock_endpoint).scheme == "https", "No configured HTTPS form endpoint")
        require(not form.evaluate("f => f.checkValidity()"), "Empty required fields are accepted")
        send.click()
        require(not session.mock_requests, "Invalid form was submitted")
        require(form.locator(":invalid").count() > 0, "Required-field validation did not identify an invalid field")
        page.locator("#customer-name").fill("Smoke test — never delivered")
        page.locator("#customer-contact").fill("qa@example.invalid")
        page.locator("#quantity").fill("1")
        before = form.evaluate("f => Object.fromEntries(new FormData(f))")
        toggle(page, "en" if locale == "he" else "he")
        require(form.evaluate("f => Object.fromEntries(new FormData(f))") == before, "Language toggle discarded the form draft")
        toggle(page, locale)
        require(form.evaluate("f => f.checkValidity()"), "Valid form remains invalid")
        send.click()
        page.wait_for_function("document.querySelector('#inquiry-status').dataset.state === 'success'")
        require(len(session.mock_requests) == 1, "Successful form did not issue exactly one mocked POST")
        require(product in session.mock_requests[0] and "qa@example.invalid" in session.mock_requests[0], "Mocked submission omitted product or contact")
        require(send.is_enabled(), "Submit control was not restored after completion")
        session.healthy()
        return {"language": locale, "required_validation": True, "draft_preserved": True, "mocked_posts": 1, "real_posts": 0}
    finally:
        session.close()


def choose_browser(playwright, configured):
    if configured:
        executable = shutil.which(configured) or str(Path(configured).expanduser())
        require(Path(executable).is_file(), f"Browser not found: {configured}")
        return executable
    for command in ("chromium", "chromium-browser", "google-chrome"):
        if shutil.which(command):
            return shutil.which(command)
    require(Path(playwright.chromium.executable_path).is_file(),
            "Chromium is not installed. Run: python scripts/setup_checks.py --install-browser, or set ASSEMBLE_BROWSER.")
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--browser", default=os.environ.get("ASSEMBLE_BROWSER"))
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    started = time.monotonic()
    results = []

    def run(name, callback):
        case_started = time.monotonic()
        try:
            details = callback()
            result = {"name": name, "status": "passed", "details": details}
        except Exception as error:
            result = {"name": name, "status": "failed", "error": str(error)}
        result["seconds"] = round(time.monotonic() - case_started, 3)
        results.append(result)
        print(f"{'PASS' if result['status'] == 'passed' else 'FAIL'} {name}" +
              (f": {result['error']}" if result["status"] == "failed" else ""), flush=True)
        return result["status"] == "passed"

    try:
        from playwright.sync_api import sync_playwright
        documents = discover(root)
        run("local files and internal link targets", lambda: check_references(root, documents))
        graph, quotes = navigation_cases(root, documents)
        with site_server(root) as base, sync_playwright() as playwright:
            executable = choose_browser(playwright, args.browser)
            browser = playwright.chromium.launch(executable_path=executable, args=["--no-sandbox"])
            try:
                for locale in ("he", "en"):
                    for viewport in VIEWPORTS:
                        for path in documents:
                            route = route_name(root, path)
                            run(f"page {route or '/'} {locale} {viewport[0]}x{viewport[1]}",
                                lambda route=route, locale=locale, viewport=viewport:
                                page_smoke(browser, base, route, locale, viewport))
                for quote in quotes:
                    run(f"navigation and inquiry prefill: {quote[3]}",
                        lambda quote=quote: navigation_smoke(browser, base, root, documents, graph, quote))
                for locale in ("he", "en"):
                    run(f"required fields and mocked form success: {locale}",
                        lambda locale=locale: form_smoke(browser, base, root, quotes[0], locale))
            finally:
                browser.close()
    except ImportError:
        run("test setup", lambda: require(False, "Playwright is missing. Run: python -m pip install -r tests/requirements.txt"))
    except Exception as error:
        run("test setup", lambda: require(False, str(error)))
    passed = sum(item["status"] == "passed" for item in results)
    report = {"passed": passed, "failed": len(results) - passed, "seconds": round(time.monotonic() - started, 2),
              "real_posts": 0, "results": results}
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Smoke: {report['passed']} passed, {report['failed']} failed in {report['seconds']}s; no real submissions.", flush=True)
    return 1 if report["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
