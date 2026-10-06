"""Check every carousel arrow using real Chromium taps and keyboard input.

Run: python3 tests/carousel_mobile_smoke.py
Requires Python Playwright and Chromium (--browser can override its location).
The test serves the checkout on a temporary loopback port; it writes no site files.
"""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
PAGES = ("geometric/", "driller_stand/", "shelf/kids/", "shoe_rack/")
VIEWPORTS = (
    (320, 568), (360, 640), (390, 844), (414, 896),
    (560, 800), (640, 900), (900, 1100), (844, 390), (1440, 900),
)
ARROWS = "button.arrow, button.carousel-arrow"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def assert_arrow_reachable(page, arrow):
    # Center controls as a user scrolls to them, including tall portrait
    # slides. Playwright's default scrolling can leave them under the header.
    arrow.evaluate("e => e.scrollIntoView({block:'center', inline:'nearest', behavior:'instant'})")
    geometry = arrow.evaluate("""e => {
        const r = e.getBoundingClientRect();
        const header = document.querySelector('.header, .top').getBoundingClientRect();
        const points = [[.25,.25], [.5,.5], [.75,.75]];
        return {
            width: r.width, height: r.height, left: r.left, top: r.top,
            right: r.right, bottom: r.bottom, headerBottom: header.bottom,
            inside: r.left >= 0 && r.right <= innerWidth &&
                    r.top >= header.bottom && r.bottom <= innerHeight,
            hit: points.every(([x,y]) => {
                const hit = document.elementFromPoint(r.left+r.width*x, r.top+r.height*y);
                return hit === e || e.contains(hit);
            })
        };
    }""")
    assert geometry["width"] >= 44 and geometry["height"] >= 44, geometry
    assert geometry["inside"] and geometry["hit"], geometry
    assert arrow.get_attribute("aria-label"), "Arrow has no accessible name"


def check_page(browser, base_url, path, viewport):
    width, height = viewport
    page = browser.new_page(
        viewport={"width": width, "height": height},
        is_mobile=width <= 900, has_touch=True,
    )
    page.set_default_timeout(5000)
    errors, bad_responses = [], []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: bad_responses.append(response.url)
            if response.status >= 400 else None)
    try:
        response = page.goto(base_url + path, wait_until="networkidle")
        assert response.status == 200
        arrows = page.locator(ARROWS)
        assert arrows.count() == 2, "Unexpected carousel arrow count"
        assert page.locator(".viewer").bounding_box()["width"] <= width
        previous = page.get_by_role("button", name="התמונה הקודמת", exact=True)
        following = page.get_by_role("button", name="התמונה הבאה", exact=True)
        for arrow in (previous, following):
            assert_arrow_reachable(page, arrow)

        if path == "shoe_rack/":
            for arrow in (previous, following):
                assert arrow.is_disabled(), "Single-image navigation must be disabled"
                description = arrow.get_attribute("aria-describedby")
                assert description and page.locator("#" + description).inner_text().strip()
            return 0

        steps = page.locator(".step")
        count = steps.count()
        assert count > 1
        active = 0

        def assert_stage(expected):
            assert steps.nth(expected).get_attribute("aria-pressed") == "true"
            assert page.locator('.step[aria-pressed="true"]').count() == 1

        # Geometric marks its initial stage with a class; aria-pressed is set
        # when navigation runs. Verify the initial selection without assuming
        # every page initializes that attribute in its markup.
        assert steps.nth(active).evaluate("e => e.classList.contains('active')")
        assert page.locator('.step.active').count() == 1
        for arrow, delta in ((following, 1), (previous, -1)):
            for _ in range(count):
                assert_arrow_reachable(page, arrow)
                arrow.tap()
                active = (active + delta) % count
                assert_stage(active)
                # Aspect ratios change on some slides: recheck both arrows each time.
                for control in (previous, following):
                    assert_arrow_reachable(page, control)

        following.focus()
        page.keyboard.press("Shift+Tab")
        assert previous.evaluate("e => e === document.activeElement"), "Previous arrow is not in tab order"
        focus = previous.evaluate("""e => ({
            visible: e.matches(':focus-visible'),
            width: parseFloat(getComputedStyle(e).outlineWidth),
            style: getComputedStyle(e).outlineStyle
        })""")
        assert focus["visible"] and focus["width"] >= 2 and focus["style"] == "solid", focus
        page.keyboard.press("Enter")
        active = (active - 1) % count
        assert_stage(active)
        page.keyboard.press("Tab")
        assert following.evaluate("e => e === document.activeElement"), "Next arrow is not in tab order"
        page.keyboard.press("Space")
        active = (active + 1) % count
        assert_stage(active)
        for key, delta in (("ArrowRight", 1), ("ArrowLeft", -1)):
            page.keyboard.press(key)
            active = (active + delta) % count
            assert_stage(active)
        return count * 2 + 4
    finally:
        page.close()
        assert not errors, errors
        assert not bad_responses, bad_responses


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", default="/usr/bin/chromium")
    args = parser.parse_args()
    handler = partial(QuietHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        Thread(target=server.serve_forever, daemon=True).start()
        base_url = f"http://127.0.0.1:{server.server_port}/"
        transitions = 0
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(
                    executable_path=args.browser, args=["--no-sandbox"],
                )
                try:
                    for viewport in VIEWPORTS:
                        for path in PAGES:
                            transitions += check_page(browser, base_url, path, viewport)
                            print(f"PASS {viewport[0]}x{viewport[1]} {path}", flush=True)
                finally:
                    browser.close()
        finally:
            server.shutdown()
    print(f"PASS: {len(VIEWPORTS) * len(PAGES)} page/viewport checks; "
          f"{transitions} tap/keyboard transitions; single-image arrows correctly disabled.")


if __name__ == "__main__":
    main()
