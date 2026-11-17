"""APP MVP-13: browser QA of local-only 3D concept and strict JSON import."""
from __future__ import annotations

import argparse
import hashlib
import struct
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


def candidate(drawers: int = 2) -> dict:
    return {
        "schema_version": "ASSEMBL-LAB.SELECTED-CONCEPT.0.1",
        "source_kind": "synthetic",
        "selected_slot": "B", "scene_id": "SC-07",
        "review": {
            "scene_id": "SC-07", "finish": "walnut", "drawers": drawers,
            "horizontal_position_percent": 55, "illustrative_scale_percent": 91,
        },
        "design_intent": {
            "schema_version": "ASSEMBL-LAB.DESIGN-INTENT.0.1",
            "category": "freestanding_nightstand",
            "source_kind": "synthetic",
            "requested_dimensions_mm": {"width": 500, "height": 550, "depth": 350},
            "dimension_confidence": "estimated",
            "appearance": {
                "finish": "walnut", "drawers": drawers,
                "lower_section": "shelf", "notes": "",
            },
            "placement_preview": {
                "horizontal_position_percent": 55, "relative_scale": 91,
            },
            "construction_preferences": {
                "material": "birch_plywood",
                "nominal_thickness_mm": 6,
                "construction_verified": False,
            },
            "photo_included": False, "engineering_approval": False,
            "manufacturing_approval": False,
        },
        "photo_included": False, "engineering_approval": False,
        "manufacturing_approval": False,
    }


def put_json(page, data: dict, name: str = "selected.json") -> None:
    page.locator("#concept-file").set_input_files({
        "name": name, "mimeType": "application/json",
        "buffer": json.dumps(data).encode("utf8"),
    })


def run(browser_exe: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    server = http.server.ThreadingHTTPServer(
        ("127.0.0.1", 0), partial(QuietServer, directory=str(ROOT))
    )
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    root = f"http://127.0.0.1:{server.server_port}"
    report = []
    try:
        with sync_playwright() as browser_engine:
            browser = browser_engine.chromium.launch(
                headless=True, executable_path=browser_exe
            )
            for width, height in [(320, 740), (390, 844), (768, 900), (1440, 900)]:
                ctx = browser.new_context(
                    viewport={"width": width, "height": height},
                    reduced_motion="reduce",
                    device_scale_factor=1,
                    accept_downloads=True,
                )
                page = ctx.new_page()
                errors = []
                external = []

                def only_local(route):
                    if urlparse(route.request.url).hostname not in (
                        "127.0.0.1", "localhost"
                    ):
                        external.append(route.request.url)
                        route.abort()
                    else:
                        route.continue_()

                page.route("**/*", only_local)
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(root + "/app/concept-3d.html", wait_until="networkidle")
                expect(page.locator("h1")).to_have_text(
                    "מהאפיון להמחשה תלת־ממדית"
                )
                expect(page.locator("#concept-view")).to_be_visible()
                expect(page.locator("#model-faces polygon").first).to_be_visible()
                expect(page.locator("#model-summary")).to_contain_text(
                    "דגם לדוגמה"
                )
                initial_face = page.locator("#model-faces polygon").first.get_attribute(
                    "points"
                )
                page.locator("#orbit-right").click()
                expect(page.locator("#azimuth")).to_have_value("47")
                assert page.locator("#model-faces polygon").first.get_attribute(
                    "points"
                ) != initial_face
                page.locator("#concept-view").focus()
                page.keyboard.press("ArrowRight")
                expect(page.locator("#azimuth")).to_have_value("57")
                page.locator("#orbit-reset").click()
                expect(page.locator("#azimuth")).to_have_value("32")

                put_json(page, candidate())
                expect(page.locator("#load-status")).to_contain_text(
                    "קובץ אפיון מקומי נטען"
                )
                expect(page.locator("#model-summary")).to_contain_text(
                    "חלופה B"
                )
                expect(page.locator("#model-summary")).to_contain_text(
                    "2 מגירות"
                )
                expect(page.locator("#model-summary")).to_contain_text(
                    "11 נפחים"
                )
                assert page.locator('[data-part="drawer-2"]').count() > 0
                page.locator("#width-mm").fill("650")
                page.locator("#width-mm").press("Tab")
                expect(page.locator("#model-summary")).to_contain_text(
                    "650 × 550 × 350"
                )
                page.locator("#width-mm").fill("99999")
                page.locator("#width-mm").press("Tab")
                expect(page.locator("#width-mm")).to_have_value("650")

                # MVP-14: download exact binary GLB and matching part-list SHA-256.
                with page.expect_download() as glb_event:
                    page.locator("#download-glb").click()
                glb_download = glb_event.value
                assert glb_download.suggested_filename == (
                    "assembl-lab-concept-b-650x550x350.glb"
                )
                glb_bytes = Path(glb_download.path()).read_bytes()
                magic, version, total = struct.unpack_from("<III", glb_bytes, 0)
                assert magic == 0x46546C67 and version == 2
                assert total == len(glb_bytes)
                json_length, json_type = struct.unpack_from("<II", glb_bytes, 12)
                assert json_type == 0x4E4F534A and json_length % 4 == 0
                gltf = json.loads(glb_bytes[20:20+json_length].decode("utf8"))
                assert gltf["asset"]["version"] == "2.0"
                assert gltf["extras"]["engineering_approval"] is False
                assert gltf["extras"]["manufacturing_approval"] is False
                assert gltf["nodes"][0]["name"] == "top"
                assert abs(gltf["nodes"][0]["scale"][0] - .65) < 1e-8
                assert len(gltf["nodes"]) == 11
                assert "uri" not in gltf["buffers"][0]
                assert gltf["scenes"][0]["name"] == "UNVERIFIED_NIGHTSTAND"
                with page.expect_download() as report_event:
                    page.locator("#download-report").click()
                parts_download = report_event.value
                assert parts_download.suggested_filename == (
                    "assembl-lab-concept-b-650x550x350-parts.json"
                )
                report = json.loads(Path(parts_download.path()).read_text("utf8"))
                assert report["glb_sha256"] == hashlib.sha256(glb_bytes).hexdigest()
                assert report["source_slot"] == "B"
                assert report["part_count"] == 11
                assert report["dimensions_mm"] == {
                    "width": 650, "height": 550, "depth": 350
                }
                assert report["safety"]["engineering_approval"] is False
                assert report["safety"]["collision_free_verified"] is False
                expect(page.locator("#export-status")).to_contain_text(
                    report["glb_sha256"]
                )

                attack = candidate()
                attack["photo_url"] = "https://example.invalid/private"
                put_json(page, attack, "unapproved.json")
                expect(page.locator("#load-status")).to_contain_text(
                    "קובץ נדחה"
                )
                expect(page.locator("#model-summary")).to_contain_text(
                    "חלופה B"
                )
                assert page.locator('[data-part="drawer-2"]').count() > 0

                page.locator("#lang").click()
                expect(page.locator("html")).to_have_attribute("lang", "en")
                expect(page.locator("html")).to_have_attribute("dir", "ltr")
                expect(page.locator("#model-summary")).to_contain_text(
                    "Concept B"
                )
                page.locator("#lang").click()
                expect(page.locator("html")).to_have_attribute("lang", "he")

                page.locator("#load-demo").click()
                expect(page.locator("#model-summary")).to_contain_text(
                    "דגם לדוגמה"
                )
                expect(page.locator("#model-summary")).to_contain_text(
                    "10 נפחים"
                )
                expect(page.locator("#width-mm")).to_have_value("500")
                assert page.locator('[data-part="drawer-2"]').count() == 0
                page.locator("#showcase-demo").click()
                expect(page.locator("#model-summary")).to_contain_text("2 מגירות")
                expect(page.locator("#load-status")).to_contain_text("דמו שיווקי")
                assert page.locator('[data-part="drawer-2"]').count() > 0
                page.reload(wait_until="networkidle")
                expect(page.locator("#model-summary")).to_contain_text(
                    "דגם לדוגמה"
                )

                assert not errors, f"JavaScript errors: {errors}"
                assert not external, f"External requests: {external}"
                assert page.evaluate("localStorage.length") == 0
                assert page.evaluate("sessionStorage.length") == 0
                if width in (390, 1440):
                    page.screenshot(
                        path=str(output_dir / f"concept-3d-{width}.png"), full_page=True
                    )
                report.append({
                    "viewport": f"{width}x{height}",
                    "status": "PASS",
                    "external_requests": 0,
                    "sensitive_uploads": 0,
                    "js_errors": 0,
                })
                print("PASS", width, height, "3D, JSON, validation, HE/EN, controls")
                ctx.close()

            # Offline smoke: the installed app worker must precache this screen.
            offline = browser.new_context(viewport={"width": 390, "height": 844})
            page = offline.new_page()
            page.goto(root + "/app/index.html", wait_until="networkidle")
            page.evaluate("""async () => {
                const worker = await navigator.serviceWorker.ready;
                await worker.update();
            }""")
            page.goto(root + "/app/concept-3d.html", wait_until="networkidle")
            expect(page.locator("#model-faces polygon").first).to_be_visible()
            offline.set_offline(True)
            page.goto(root + "/app/concept-3d.html", wait_until="domcontentloaded")
            expect(page.locator("#model-faces polygon").first).to_be_visible()
            expect(page.locator("#load-status")).to_contain_text("מודל לדוגמה")
            with page.expect_download() as offline_glb:
                page.locator("#download-glb").click()
            assert Path(offline_glb.value.path()).read_bytes()[:4] == b"glTF"
            offline.close()

            # MVP-14 marketing path: chosen A/B opens a validated 3D concept
            # in one click. Hash fragments are never transmitted to the server.
            journey = browser.new_context(viewport={"width": 390, "height": 844})
            page = journey.new_page()
            page.goto(root + "/app/preview-lab.html", wait_until="networkidle")
            page.locator("#scene").select_option("SC-07")
            page.locator("#finish").select_option("walnut")
            page.locator("#drawers").select_option("2")
            page.locator("#capture-b").click()
            page.locator("#choose-b").click()
            handoff = page.locator("#open-selected-3d").get_attribute("href")
            assert handoff.startswith("./concept-3d.html#selected=")
            assert "customer" not in handoff and "photo_url" not in handoff
            page.locator("#open-selected-3d").click()
            expect(page).to_have_url(
                lambda url: "/app/concept-3d.html#selected=" in url
            )
            expect(page.locator("#model-summary")).to_contain_text("חלופה B")
            expect(page.locator("#model-summary")).to_contain_text("2 מגירות")
            expect(page.locator("#load-status")).to_contain_text("הועברה")
            assert page.locator('[data-part="drawer-2"]').count() > 0
            journey.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    assert len(report) == 4
    (output_dir / "browser-qa.json").write_text(
        json.dumps({"scope": "LOCAL_SYNTHETIC_CONCEPT_3D", "results": report},
                   indent=2) + "\n", encoding="utf8"
    )
    print("MVP-13 PASS: 4 Chromium viewports + offline PWA, no user photos or cloud")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--browser", required=True)
    parser.add_argument("--output", default=".qa-reports/app-mvp-13")
    opts = parser.parse_args()
    run(opts.browser, Path(opts.output))
