"""APP MVP-09-B: local-only Chromium visual-review interaction and screenshot QA.

This test loads only fixed local procedural 384x384 PNG room images, never
contacts Supabase/AI, and uses no customer content.
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
                    accept_downloads=True,
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
                expect(page.locator("#room")).to_have_attribute("data-fixture", "png")
                room_png = page.locator("#synthetic-room-image")
                expect(room_png).to_have_attribute("src", "./preview-fixtures/SC-01.png")
                expect(room_png).to_have_js_property("naturalWidth", 384)
                expect(room_png).to_have_js_property("naturalHeight", 384)
                expect(room_png).to_have_js_property("complete", True)
                expect(page.locator("#room")).to_have_attribute("data-fixture", "png")
                assert page.locator('input[type="file"]').count() == 0

                page.locator("#scene").select_option("SC-02")
                expect(page.locator("#room")).to_have_class("room window")
                expect(room_png).to_have_attribute("src", "./preview-fixtures/SC-02.png")
                expect(room_png).to_have_js_property("naturalWidth", 384)
                page.locator("#finish").select_option("walnut")
                expect(page.locator("#stand")).to_have_attribute("data-finish", "walnut")
                page.locator("#drawers").select_option("2")
                expect(page.locator("#stand")).to_have_class("stand two-drawers")
                assert page.locator("#drawer-two").is_visible()

                selected_fixture = room_png.get_attribute("src")
                page.locator("#toggle-view").click()
                expect(page.locator("#room")).to_have_class("room window before")
                assert room_png.get_attribute("src") == selected_fixture, (
                    "Before mode must retain identical room PNG"
                )
                expect(page.locator("#toggle-view")).to_have_attribute("aria-pressed", "true")
                assert not page.locator(".room-after-layer").is_visible()
                assert page.locator("#save-preferred").is_disabled()
                page.locator("#toggle-view").click()
                expect(page.locator("#room")).to_have_class("room window")

                page.locator("#compare-view").click()
                expect(page.locator("#room")).to_have_class("room window compare")
                assert room_png.get_attribute("src") == selected_fixture, (
                    "Wipe comparison must retain identical background"
                )
                expect(page.locator("#compare-view")).to_have_attribute("aria-pressed", "true")
                expect(page.locator("#compare-control")).to_be_visible()
                set_range(page, "#compare-split", 65)
                expect(page.locator("#room")).to_have_attribute(
                    "style", "--compare-split: 65%;"
                )
                page.locator("#compare-split").focus()
                page.keyboard.press("ArrowLeft")
                # RTL native range semantics: ArrowLeft increases the value by one.
                expect(page.locator("#compare-split")).to_have_value("66")
                expect(page.locator("#room")).to_have_attribute(
                    "style", "--compare-split: 66%;"
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

                # MVP-11-A: two independent, session-only synthetic A/B concepts.
                page.locator("#capture-a").click()
                expect(page.locator("#restore-a")).to_be_enabled()
                expect(page.locator("#concept-a-status")).to_contain_text("חלון משמאל")
                page.locator("#scene").select_option("SC-04")
                page.locator("#finish").select_option("natural")
                page.locator("#drawers").select_option("1")
                page.locator("#capture-b").click()
                expect(page.locator("#restore-b")).to_be_enabled()
                expect(page.locator("#concept-b-status")).to_contain_text("עציץ בפינה")
                expect(page.locator("#ab-summary")).to_contain_text("הבדלים בין")
                expect(page.locator("#ab-summary")).to_contain_text("מגירות")
                # MVP-12: explicit final selection emits a local, sanitized JSON intent.
                expect(page.locator("#download-selected")).to_be_disabled()
                page.locator("#choose-b").click()
                expect(page.locator("#choose-b")).to_have_attribute("aria-pressed", "true")
                expect(page.locator("#selected-status")).to_contain_text("חלופה B")
                expect(page.locator("#download-selected")).to_be_enabled()
                with page.expect_download() as download_info:
                    page.locator("#download-selected").click()
                download = download_info.value
                assert download.suggested_filename == "assembl-lab-selected-concept-B.json"
                payload = json.loads(Path(download.path()).read_text(encoding="utf8"))
                assert payload["schema_version"] == "ASSEMBL-LAB.SELECTED-CONCEPT.0.1"
                assert payload["selected_slot"] == "B"
                assert payload["scene_id"] == "SC-04"
                assert payload["review"]["drawers"] == 1
                assert payload["design_intent"]["requested_dimensions_mm"] == {
                    "width": 500, "height": 550, "depth": 350
                }
                assert payload["design_intent"]["engineering_approval"] is False
                assert payload["photo_included"] is False
                assert "image_base64" not in json.dumps(payload)
                page.locator("#restore-a").click()
                expect(page.locator("#scene")).to_have_value("SC-02")
                expect(page.locator("#finish")).to_have_value("walnut")
                expect(page.locator("#drawers")).to_have_value("2")
                page.locator("#lang").click()
                expect(page.locator("#ab-summary")).to_contain_text("A/B differences")
                expect(page.locator("#selected-status")).to_contain_text("Selected concept B")
                page.locator("#lang").click()
                page.locator("#toggle-view").click()
                expect(page.locator("#capture-a")).to_be_disabled()
                expect(page.locator("#capture-b")).to_be_disabled()
                page.locator("#toggle-view").click()

                # All newly added image scenes must have their own local pixels.
                for id in ["SC-04", "SC-07", "SC-10"]:
                    page.locator("#scene").select_option(id)
                    expect(room_png).to_have_attribute("src", f"./preview-fixtures/{id}.png")
                    expect(room_png).to_have_js_property("naturalWidth", 384)
                    expect(room_png).to_have_js_property("naturalHeight", 384)
                    expect(room_png).to_have_js_property("complete", True)
                    expect(page.locator("#room")).to_have_attribute("data-fixture", "png")
                    if width in (390, 1440):
                        page.locator("#room").screenshot(
                            path=str(output_dir / f"mvp09-scene-{id}-{width}.png")
                        )
                page.locator("#scene").select_option("SC-02")
                expect(room_png).to_have_attribute("src", "./preview-fixtures/SC-02.png")

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
                assert page.locator("#restore-a").is_disabled()
                assert page.locator("#restore-b").is_disabled()
                assert page.locator("#download-selected").is_disabled()
                expect(page.locator("#selected-status")).to_contain_text("טרם נבחרה")
                expect(page.locator("#preferred-status")).to_contain_text("טרם סומנה")

                if width <= 390:
                    # Mobile screenshots exposed an oversized flex-basis in the
                    # preferred-action column. Keep controls touch-friendly, not gigantic.
                    preferred_button = page.locator("#save-preferred").bounding_box()
                    assert preferred_button and 44 <= preferred_button["height"] <= 70, (
                        "Preferred button consumes too much mobile vertical space"
                    )
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
            # MVP-11-A: prove navigation does not poison the cached PWA home.
            pwa_context = browser.new_context(viewport={"width": 390, "height": 844})
            pwa = pwa_context.new_page()
            pwa.goto(root + "/app/index.html", wait_until="networkidle")
            expect(pwa.locator('a[href="./preview-lab.html"]')).to_be_visible()
            pwa.evaluate("""async () => {
                const registration = await navigator.serviceWorker.ready;
                await registration.update();
            }""")
            pwa.goto(root + "/app/preview-lab.html", wait_until="networkidle")
            expect(pwa.locator("#room")).to_have_attribute("data-fixture", "png")
            pwa_context.set_offline(True)
            pwa.goto(root + "/app/index.html", wait_until="domcontentloaded")
            expect(pwa.locator("#intro-title")).to_be_visible()
            assert pwa.locator("#ab-summary").count() == 0, (
                "Offline home must not be replaced by preview page"
            )
            pwa.goto(root + "/app/preview-lab.html", wait_until="domcontentloaded")
            expect(pwa.locator("#ab-summary")).to_be_visible()
            pwa_context.close()

            # Failure injection: missing local PNG should never blank the room.
            fallback = browser.new_context(viewport={"width":390, "height":844})
            fallback_page = fallback.new_page()
            fallback_errors = []
            fallback_page.on("pageerror", lambda error: fallback_errors.append(str(error)))
            fallback_page.route("**/app/preview-fixtures/SC-10.png", lambda route: route.abort())
            fallback_page.goto(root + "/app/preview-lab.html", wait_until="networkidle")
            fallback_page.locator("#scene").select_option("SC-10")
            expect(fallback_page.locator("#synthetic-room-image")).to_have_attribute(
                "src", "./preview-fixtures/SC-10.png"
            )
            expect(fallback_page.locator("#room")).to_have_attribute(
                "data-fixture", "css"
            )
            expect(fallback_page.locator("#view-status")).to_contain_text(
                "תמונת החדר אינה זמינה"
            )
            assert not fallback_errors, repr(fallback_errors)
            fallback.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    (output_dir / "browser-qa.json").write_text(
        json.dumps({"source": "SYNTHETIC_PNG_FIXTURES", "results": results,
                    "failures": failures, "real_requests": 0,
                    "customer_images": 0}, indent=2) + "\n",
        encoding="utf8",
    )
    assert len(results) == 4
    print("MVP-09-C 4/4 Chromium viewports + missing-image fallback PASS; 5 local PNG fixtures; no external requests or customer content.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", required=True)
    parser.add_argument("--output", default=".qa-reports/app-mvp-09")
    args = parser.parse_args()
    run(args.browser, Path(args.output))
