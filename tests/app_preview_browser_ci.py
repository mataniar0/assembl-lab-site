"""APP MVP-09-B: local-only Chromium visual-review interaction and screenshot QA.

This test never loads a real room image or contacts Supabase/AI. Screenshots only
show deterministic CSS-generated synthetic rooms; no customer data.
"""
from __future__ import annotations

import argparse
from functools import partial
import http.server
import json
from pathlib import Path
import threading
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietServer(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def set_range(page, selector: str, value: int) -> None:
    page.locator(selector).evaluate(
        """(el, value) => {
          el.value = String(value);
          el.dispatchEvent(new Event('input', {bubbles: true}));
        }""",
        value,
    )


def run(browser_exe: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    server = http.server.ThreadingHTTPServer(
        ("127.0.0.1", 0), partial(QuietServer, directory=str(ROOT))
    )
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    root = f"http://127.0.0.1:{server.server_port}"
    results = []
    failures = []
    try:
        with sync_playwright() as engine:
            browser = engine.chromium.launch(headless=True, executable_path=browser_exe)
            for width, height in [(320, 740), (390, 844), (768, 900), (1440, 900)]:
                context = browser.new_context(
                    viewport={"width": width, "height": height},
                    reduced_motion="reduce",
                    device_scale_factor=1,
                )
                page = context.new_page()
                requests = []
                js_errors = []

                def filter_request(route):
                    url = route.request.url
                    if urlparse(url).hostname not in ("127.0.0.1", "localhost"):
                        requests.append(url)
                        route.abort()
                    else:
                        route.continue_()

                page.route("**/*", filter_request)
                page.on("pageerror", lambda error: js_errors.append(str(error)))
                page.goto(root + "/app/preview-lab.html", wait_until="networkidle")
                expect(page.locator("h1")).to_have_text("איך השידה תיראה בחדר?")
                expect(page.locator("#room")).to_have_class("room neutral")
                expect(page.locator("#compare-control")).to_be_hidden()
                expect(page.locator("#room")).to_have_attribute("role", "img")
                assert page.locator('input[type="file"]').count() == 0

                page.locator("#scene").select_option("SC-02")
                expect(page.locator("#room")).to_have_class("room window")
                page.locator("#finish").select_option("walnut")
                expect(page.locator("#stand")).to_have_attribute("data-finish", "walnut")
                page.locator("#drawers").select_option("2")
                expect(page.locator("#stand")).to_have_class("stand two-drawers")
                assert page.locator("#drawer-two").is_visible()

                page.locator("#toggle-view").click()
                expect(page.locator("#room")).to_have_class("room window before")
                expect(page.locator("#toggle-view")).to_have_attribute("aria-pressed", "true")
                assert not page.locator(".room-after-layer").is_visible()
                assert page.locator("#save-preferred").is_disabled()
                page.locator("#toggle-view").click()
                expect(page.locator("#room")).to_have_class("room window")

                page.locator("#compare-view").click()
                expect(page.locator("#room")).to_have_class("room window compare")
                expect(page.locator("#compare-view")).to_have_attribute("aria-pressed", "true")
                expect(page.locator("#compare-control")).to_be_visible()
                set_range(page, "#compare-split", 65)
                expect(page.locator("#room")).to_have_attribute(
                    "style", "--compare-split: 65%;"
                )
                page.locator("#compare-split").focus()
                page.keyboard.press("ArrowLeft")
                expect(page.locator("#compare-split")).to_have_value("64")
                expect(page.locator("#room")).to_have_attribute(
                    "style", "--compare-split: 64%;"
                )
                page.locator("#compare-view").click()
                expect(page.locator("#room")).to_have_class("room window")

                page.locator("#save-preferred").click()
                assert page.locator("#restore-preferred").is_enabled()
                expect(page.locator("#preferred-status")).to_contain_text("חלון משמאל")
                page.locator("#scene").select_option("SC-04")
                page.locator("#drawers").select_option("1")
                expect(page.locator("#room")).to_have_class("room plant")
                page.locator("#restore-preferred").click()
                expect(page.locator("#room")).to_have_class("room window")
                expect(page.locator("#drawers")).to_have_value("2")
                expect(page.locator("#finish")).to_have_value("walnut")

                set_range(page, "#scale", 125)
                set_range(page, "#position", 30)
                expect(page.locator("#scale-value")).to_have_text("125%")
                expect(page.locator("#position-value")).to_have_text("30%")
                room = page.locator("#room").bounding_box()
                furniture = page.locator("#stand-position").bounding_box()
                assert room and furniture
                if furniture["width"] <= room["width"]:
                    assert furniture["x"] >= room["x"] - 2, "left clipping"
                    assert furniture["x"] + furniture["width"] <= (
                        room["x"] + room["width"] + 2
                    ), "right clipping"

                page.locator("#lang").click()
                expect(page.locator("html")).to_have_attribute("lang", "en")
                expect(page.locator("html")).to_have_attribute("dir", "ltr")
                expect(page.locator("#details")).to_contain_text("Example dimensions")
                expect(page.locator("#room")).to_have_attribute(
                    "aria-label", "Synthetic room: Left window; After — schematic nightstand"
                )
                page.locator("#lang").click()
                expect(page.locator("html")).to_have_attribute("lang", "he")

                page.locator("#reset").click()
                expect(page.locator("#scene")).to_have_value("SC-01")
                expect(page.locator("#scale")).to_have_value("88")
                expect(page.locator("#position")).to_have_value("52")
                assert page.locator("#restore-preferred").is_disabled()
                expect(page.locator("#preferred-status")).to_contain_text("טרם סומנה")

                if width in (390, 1440):
                    page.screenshot(
                        path=str(output_dir / f"mvp09-after-he-{width}.png"),
                        full_page=True,
                    )
                    page.locator("#compare-view").click()
                    page.screenshot(
                        path=str(output_dir / f"mvp09-compare-he-{width}.png"),
                        full_page=True,
                    )
                assert not requests, f"External request attempted: {requests}"
                assert not js_errors, f"JavaScript errors: {js_errors}"
                assert page.evaluate("localStorage.length") == 0
                assert page.evaluate("sessionStorage.length") == 0
                results.append(
                    {"viewport": f"{width}x{height}", "status": "PASS",
                     "network": 0, "photo_uploads": 0, "js_errors": 0}
                )
                print("PASS", width, height, "scene/finish/drawers/compare/keyboard/preference/resize/language")
                context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    (output_dir / "browser-qa.json").write_text(
        json.dumps({"source": "SYNTHETIC_ONLY", "results": results,
                    "failures": failures, "real_requests": 0,
                    "customer_images": 0}, indent=2) + "\n",
        encoding="utf8",
    )
    assert len(results) == 4
    print("MVP-09-B 4/4 Chromium viewports PASS; no network, photos or persistence.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", required=True)
    parser.add_argument("--output", default=".qa-reports/app-mvp-09")
    args = parser.parse_args()
    run(args.browser, Path(args.output))
