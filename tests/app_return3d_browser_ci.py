"""MVP-15: main Android PWA returns approved customer's 3D concept in-app.

No model downloads, network services, actual images or approval data needed.
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


def flow_to_config(page) -> None:
    page.locator("#start").click()
    expect(page.locator("#capture")).to_be_visible()
    page.locator("#demo").click()
    page.locator("#capture-next").click()
    expect(page.locator("#configure")).to_be_visible()


def set_design(page, finish: str, drawers: int, lower: str,
               width: int, height: int, depth: int, thickness: int) -> None:
    page.locator("#finish").select_option(finish)
    page.locator("#drawers").select_option(str(drawers))
    page.locator("#bottom").select_option(lower)
    page.locator("#width-cm").fill(str(width))
    page.locator("#height-cm").fill(str(height))
    page.locator("#depth-cm").fill(str(depth))
    page.locator("#plywood-thickness").select_option(str(thickness))


def approve(page) -> None:
    expect(page.locator("#review")).to_be_visible()
    page.locator("#open-approval").click()
    expect(page.locator("#approval-dialog")).to_be_visible()
    page.locator("#confirm-approval").click()
    expect(page.locator("#approved")).to_be_visible()
    expect(page.locator("#approved-3d")).to_be_visible()
    page.wait_for_function(
        "document.querySelector('#approved-glb-host')?.dataset.state==='ready'",
        timeout=45000
    )
    expect(page.locator("#approved-glb-host model-viewer")).to_be_visible()
    assert page.locator("model-viewer").evaluate("e=>e.loaded")
    expect(page.locator("#approved-glb-status")).to_contain_text("GLB")


def run(browser_exe: str, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    server = http.server.ThreadingHTTPServer(
        ("127.0.0.1", 0), partial(QuietServer, directory=str(ROOT))
    )
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    root = f"http://127.0.0.1:{server.server_port}"
    results = []
    try:
        with sync_playwright() as engine:
            browser = engine.chromium.launch(
                headless=True, executable_path=browser_exe,
                args=["--enable-webgl","--use-angle=swiftshader",
                      "--enable-unsafe-swiftshader"]
            )
            for width, height in [(320, 740), (390, 844), (768, 900), (1440, 900)]:
                context = browser.new_context(
                    viewport={"width": width, "height": height},
                    reduced_motion="reduce",
                    device_scale_factor=1
                )
                page = context.new_page()
                external = []
                errors = []

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
                page.goto(root + "/app/", wait_until="networkidle")
                page.evaluate("""() => {
                  window.testApprovedPayloads = [];
                  window.addEventListener('assembl:3d-model-ready',
                    event => window.testApprovedPayloads.push(event.detail));
                }""")
                expect(page.locator("#approved-3d")).to_be_hidden()

                flow_to_config(page)
                set_design(page, "walnut", 2, "closed", 65, 95, 50, 4)
                page.locator("#description").fill(
                    "PRIVATE_NOTE_NOT_FOR_3D customer@example.invalid"
                )
                page.locator("#generate").click()
                expect(page.locator("#current-label")).to_have_text("V1")
                approve(page)
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "visual-v1"
                )
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "650 × 950 × 500"
                )
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "2 מגירות"
                )
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "4 mm"
                )
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "חזית סגורה"
                )
                assert page.locator(
                    '#approved-3d-faces polygon[data-part="drawer-2"]'
                ).count() > 0
                assert page.locator(
                    '#approved-3d-faces polygon[data-part="lower-front"]'
                ).count() > 0
                expect(page.locator(".progress-step[data-phase='2']")).to_have_class(
                    "progress-step active"
                )
                payloads = page.evaluate("window.testApprovedPayloads")
                assert len(payloads) == 1
                assert payloads[0]["version_id"] == "visual-v1"
                assert payloads[0]["nominal_thickness_mm"] == 4
                assert payloads[0]["dimensions_mm"] == {
                    "width": 650, "height": 950, "depth": 500
                }
                assert sorted(payloads[0].keys()) == sorted([
                    "version_id", "finish", "drawers", "lower_section",
                    "nominal_thickness_mm", "dimensions_mm"
                ])
                assert "PRIVATE_NOTE" not in json.dumps(payloads)
                assert "example.invalid" not in json.dumps(payloads)
                expect(page.locator("#approval-record")).to_contain_text(
                    "next_stage: LOCAL_CONCEPT_GLB_READY"
                )

                model_view = page.locator("#approved-glb-host model-viewer")
                orbit_before = model_view.evaluate("e=>({...e.getCameraOrbit()})")
                page.locator("#approved-3d-right").click()
                orbit_after = model_view.evaluate("e=>({...e.getCameraOrbit()})")
                assert abs(orbit_after["theta"]-orbit_before["theta"])>0.25
                page.locator("#approved-3d-reset").click()
                orbit_reset = model_view.evaluate("e=>({...e.getCameraOrbit()})")
                assert abs(orbit_reset["theta"]-orbit_before["theta"])<.05
                assert model_view.get_attribute("src").startswith("blob:")
                assert model_view.get_attribute("shadow-intensity") == "1"
                gltf = page.evaluate("""async () => {
                    const uri=document.querySelector('model-viewer').src;
                    const bytes=new Uint8Array(await (await fetch(uri)).arrayBuffer());
                    const v=new DataView(bytes.buffer);
                    if(v.getUint32(0,true)!==0x46546c67)throw Error('Not GLB');
                    const n=v.getUint32(12,true);
                    return JSON.parse(new TextDecoder().decode(
                      bytes.slice(20,20+n)).trim());
                }""")
                assert gltf["asset"]["version"] == "2.0"
                assert gltf["extras"]["geometry_kind"] == "SHOWROOM_CONCEPT_GLB"
                assert gltf["extras"]["source_version"] == "visual-v1"
                assert gltf["extras"]["manufacturing_approval"] is False
                assert gltf["nodes"][0]["scale"][1] == .004
                assert any(n["name"]=="drawer-2-pull" for n in gltf["nodes"])
                assert any(n["name"]=="lower-front" for n in gltf["nodes"])
                assert len(gltf["materials"])>=8

                page.locator("#lang").click()
                expect(page.locator("html")).to_have_attribute("lang", "en")
                expect(page.locator("#approved-3d-title")).to_have_text(
                    "Your 3D model is ready to view"
                )
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "Closed front"
                )
                page.locator("#lang").click()
                expect(page.locator("html")).to_have_attribute("lang", "he")
                assert page.locator("model-viewer").evaluate("e=>e.loaded")

                # Return to versions, make another choice, approve and replace
                # the in-app model, not a downloaded file or stale V1 snapshot.
                page.locator("#approved-back").click()
                expect(page.locator("#review")).to_be_visible()
                page.locator("#return-config").click()
                expect(page.locator("#configure")).to_be_visible()
                set_design(page, "natural", 1, "shelf", 50, 55, 35, 6)
                page.locator("#description").fill("")
                page.locator("#generate").click()
                expect(page.locator("#current-label")).to_have_text("V2")
                approve(page)
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "visual-v2"
                )
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "500 × 550 × 350"
                )
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "1 מגירות"
                )
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "6 mm"
                )
                gltf2 = page.evaluate("""async () => {
                    const uri=document.querySelector('model-viewer').src;
                    const a=new Uint8Array(await (await fetch(uri)).arrayBuffer());
                    const n=new DataView(a.buffer).getUint32(12,true);
                    return JSON.parse(new TextDecoder().decode(a.slice(20,20+n)).trim());
                }""")
                assert gltf2["extras"]["source_version"] == "visual-v2"
                assert gltf2["nodes"][0]["scale"][1] == .006
                assert not any(n["name"]=="drawer-2-pull" for n in gltf2["nodes"])
                assert page.locator(
                    '#approved-3d-faces polygon[data-part="drawer-2"]'
                ).count() == 0
                assert page.locator(
                    '#approved-3d-faces polygon[data-part="lower-front"]'
                ).count() == 0

                # Selecting and approving an earlier saved version must restore
                # its own depth/thickness from nightstand-intent snapshots.
                page.locator("#approved-back").click()
                page.locator("#versions button").filter(has_text="V1").click()
                approve(page)
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "650 × 950 × 500"
                )
                expect(page.locator("#approved-3d-summary")).to_contain_text(
                    "4 mm"
                )
                payloads = page.evaluate("window.testApprovedPayloads")
                assert [item["version_id"] for item in payloads] == [
                    "visual-v1", "visual-v2", "visual-v1"
                ]

                assert not errors, f"JavaScript errors: {errors}"
                assert not external, f"External requests: {external}"
                assert page.evaluate("localStorage.length") == 0
                assert page.evaluate("sessionStorage.length") == 0
                if width in (390, 1440):
                    page.screenshot(
                        path=str(output_dir / f"approved-3d-{width}.png"),
                        full_page=True
                    )
                results.append({
                    "viewport": f"{width}x{height}",
                    "status": "PASS",
                    "external_requests": 0,
                    "approved_versions": 3,
                    "user_photo_or_notes_in_3d": False
                })
                print("PASS", width, height, "main app 3D, approval, history, privacy")
                context.close()

            offline = browser.new_context(viewport={"width": 390, "height": 844})
            page = offline.new_page()
            page.goto(root + "/app/", wait_until="networkidle")
            page.evaluate("""async () => {
              const reg = await navigator.serviceWorker.ready;
              await reg.update();
            }""")
            page.reload(wait_until="networkidle")
            offline.set_offline(True)
            page.reload(wait_until="domcontentloaded")
            flow_to_config(page)
            set_design(page, "walnut", 2, "shelf", 50, 55, 35, 6)
            page.locator("#generate").click()
            approve(page)
            expect(page.locator("#approved-3d-summary")).to_contain_text(
                "500 × 550 × 350"
            )
            assert page.locator("#approved-3d-faces polygon").count() > 0
            expect(page.locator("#approved-glb-host model-viewer")).to_be_visible()
            offline.close()
            # Deterministic no-WebGL fallback, not a blank approval screen.
            fallback = browser.new_context(viewport={"width":390,"height":844})
            fallback.add_init_script(
                "HTMLCanvasElement.prototype.getContext=function(){return null}"
            )
            page = fallback.new_page()
            page.goto(root+"/app/",wait_until="networkidle")
            flow_to_config(page)
            set_design(page,"natural",1,"shelf",50,55,35,6)
            page.locator("#generate").click()
            page.locator("#open-approval").click()
            page.locator("#confirm-approval").click()
            expect(page.locator("#approved-3d")).to_be_visible()
            expect(page.locator("#approved-3d-view")).to_be_visible()
            expect(page.locator("#approved-glb-host")).to_be_hidden()
            expect(page.locator("#approved-glb-status")).to_contain_text("WebGL")
            assert page.locator("model-viewer").count() == 0
            fallback.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    assert len(results) == 4
    (output_dir / "browser-qa.json").write_text(
        json.dumps({
            "scope": "MAIN_PWA_EMBEDDED_APPROVED_3D",
            "results": results, "offline_approved_3d": "PASS"
        }, indent=2)+"\n", encoding="utf8"
    )
    print("MVP-16 PASS: real in-app GLB, 4 viewports, history, offline and WebGL fallback")


if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--browser",required=True)
    p.add_argument("--output",default=".qa-reports/app-mvp-15")
    a=p.parse_args()
    run(a.browser,Path(a.output))
