"""MVP-19: edited round coffee table showroom landing + original site GLB in app."""
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


def check_photo(page):
    expect(page.locator("#intro")).to_be_visible()
    expect(page.locator("#personal-coffee-photo")).to_be_visible()
    photo = page.locator("#personal-coffee-photo img")
    expect(photo).to_be_visible()
    assert photo.get_attribute("src") == "./media/personal-coffee-showcase-680.webp"
    expect(page.locator('#personal-coffee-photo source[type="image/avif"]')).to_have_attribute(
        "srcset", "./media/personal-coffee-showcase-680.avif"
    )
    # A srcset resource is density-corrected: naturalWidth may reflect the
    # browser's sizes calculation, not the 480/960 source file width.
    assert photo.evaluate("image=>image.complete&&image.naturalWidth>250") is True
    assert photo.evaluate("image=>image.currentSrc").endswith((
        "/app/media/personal-coffee-showcase-680.avif",
        "/app/media/personal-coffee-showcase-680.webp",
    ))
    assert photo.evaluate("image=>getComputedStyle(image).objectFit") == "cover"
    expect(page.locator("#personal-coffee-show-photo")).to_have_attribute(
        "aria-pressed", "true"
    )
    expect(page.locator(".personal-coffee-product-link")).to_have_attribute(
        "href", "../table/personal/"
    )
    assert page.locator("#intro-scene").evaluate(
        "e=>getComputedStyle(e).display"
    ) == "none"


def run(browser_path: str, output: Path):
    output.mkdir(parents=True, exist_ok=True)
    server = http.server.ThreadingHTTPServer(
        ("127.0.0.1", 0), partial(QuietServer, directory=str(ROOT))
    )
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f"http://127.0.0.1:{server.server_port}"
    results = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True, executable_path=browser_path,
                args=["--enable-webgl", "--use-angle=swiftshader",
                      "--enable-unsafe-swiftshader"],
            )
            for width, height in [(390, 844), (1440, 900)]:
                context = browser.new_context(
                    viewport={"width": width, "height": height},
                    reduced_motion="reduce",
                )
                page = context.new_page()
                external, errors = [], []

                def filter_request(route):
                    if urlparse(route.request.url).hostname not in (
                        "127.0.0.1", "localhost"
                    ):
                        external.append(route.request.url)
                        route.abort()
                    else:
                        route.continue_()

                page.route("**/*", filter_request)
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(url + "/app/", wait_until="networkidle")
                check_photo(page)
                expect(page.locator("#personal-coffee-model")).to_be_hidden()
                expect(page.locator(".personal-coffee-disclosure")).to_contain_text(
                    "הדמיה חזותית ערוכה"
                )
                assert page.locator("#personal-coffee-photo img").get_attribute(
                    "data-en-alt"
                ).startswith("Illustrative showroom image")
                page.screenshot(
                    path=str(output / f"personal-coffee-photo-{width}.png"),
                    full_page=False,
                )

                page.locator("#personal-coffee-show-model").click()
                expect(page.locator("#personal-coffee-model")).to_be_visible()
                expect(page.locator("#personal-coffee-photo")).to_be_hidden()
                expect(page.locator("#personal-coffee-model model-viewer")).to_be_visible()
                expect(page.locator("#personal-coffee-model-status")).to_contain_text(
                    "אינו העתק מאומת", timeout=45000
                )
                view = page.locator("#personal-coffee-model model-viewer")
                assert view.evaluate("e=>e.loaded") is True
                assert view.evaluate("e=>new URL(e.src).pathname").endswith(
                    "/table/personal/media/personal-design-preview.glb"
                )
                assert view.get_attribute("camera-controls") is not None
                assert view.get_attribute("shadow-intensity") == "1"
                assert page.locator("#personal-coffee-show-model").get_attribute(
                    "aria-pressed"
                ) == "true"
                page.screenshot(
                    path=str(output / f"personal-coffee-model-{width}.png"),
                    full_page=False,
                )
                page.locator("#lang").click()
                expect(page.locator("html")).to_have_attribute("lang", "en")
                expect(page.locator("#personal-coffee-model-status")).to_contain_text(
                    "Not a verified replica"
                )
                expect(page.locator(".personal-coffee-disclosure")).to_contain_text(
                    "edited showroom visualization"
                )
                page.locator("#personal-coffee-show-photo").click()
                check_photo(page)
                expect(page.locator("#personal-coffee-model")).to_be_hidden()
                expect(page.locator("#personal-coffee-show-model")).to_have_attribute(
                    "aria-pressed", "false"
                )
                page.locator("#lang").click()
                expect(page.locator("html")).to_have_attribute("lang", "he")

                # Product showcase must not silently re-label the still-nightstand
                # customer configuration flow as a coffee-table configurator.
                page.locator("#start").click()
                expect(page.locator("#capture")).to_be_visible()
                expect(page.locator("#demo")).to_be_visible()
                assert page.locator("#drawers").count() == 1
                assert not errors, f"JavaScript errors: {errors}"
                assert not external, f"External requests: {external}"
                results.append({"viewport": width, "showcase": "PASS",
                                "original_glb_loaded": "PASS",
                                "language": "PASS", "external_requests": 0})
                print("PASS approved coffee table showroom image/GLB", width, height)
                context.close()

            offline = browser.new_context(viewport={"width": 390, "height": 844})
            page = offline.new_page()
            page.goto(url + "/app/", wait_until="networkidle")
            page.evaluate("""async () => {
                const registration=await navigator.serviceWorker.ready;
                await registration.update();
            }""")
            page.reload(wait_until="networkidle")
            for asset in [
                "./media/personal-coffee-showcase-680.avif",
                "./media/personal-coffee-showcase-680.webp",
                "../table/personal/media/personal-design-preview.glb",
                "./personal-coffee-hero.mjs",
            ]:
                available = page.evaluate(
                    """async asset => !!(await caches.match(
                        new URL(asset,location.href).href))""", asset
                )
                assert available, f"Offline PWA cache missing: {asset}"
            offline.set_offline(True)
            page.reload(wait_until="domcontentloaded")
            check_photo(page)
            page.locator("#personal-coffee-show-model").click()
            expect(page.locator("#personal-coffee-model-status")).to_contain_text(
                "אינו העתק מאומת", timeout=45000
            )
            assert page.locator("model-viewer").evaluate("e=>e.loaded") is True
            print("PASS offline approved showcase and original site GLB")
            offline.close()

            # Lack of WebGL keeps the approved showcase still visible and usable.
            fallback = browser.new_context(viewport={"width": 390, "height": 844})
            fallback.add_init_script(
                "HTMLCanvasElement.prototype.getContext=function(){return null}"
            )
            page = fallback.new_page()
            page.goto(url + "/app/", wait_until="networkidle")
            check_photo(page)
            page.locator("#personal-coffee-show-model").click()
            expect(page.locator("#personal-coffee-photo")).to_be_visible()
            expect(page.locator("#personal-coffee-model")).to_be_hidden()
            expect(page.locator("#personal-coffee-model-status")).to_contain_text(
                "לא ניתן להציג מודל תלת־ממדי"
            )
            assert page.locator("model-viewer").count() == 0
            print("PASS fallback showcase image on no-WebGL device")
            fallback.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    (output / "browser-qa.json").write_text(
        json.dumps({"scope": "APPROVED_PERSONAL_COFFEE_SHOWCASE_HERO",
                    "results": results, "offline": "PASS",
                    "no_webgl": "SHOWCASE_RETAINED"}, indent=2),
        encoding="utf8",
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", required=True)
    parser.add_argument("--output", default=".qa-reports/app-mvp-18")
    args = parser.parse_args()
    run(args.browser, Path(args.output))
