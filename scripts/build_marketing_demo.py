#!/usr/bin/env python3
"""Curated Cloudflare Pages build of frozen ASSEMBL LAB Marketing Demo V1.

Only public, synthetic /app assets and pinned product references are published.
Do not build from main: this deployment branch descends from the frozen V1 SHA.
No network access, packages, credentials, or live inquiry forms are required.
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from urllib.parse import urlsplit, unquote

SOURCE_REVISION = "d05830451a918f00dc484acf985c794443dc36f9"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist"
MAX_FILE_BYTES = 25 * 1024 * 1024

def copy(relative: str) -> None:
    src = ROOT / relative
    if not src.is_file():
        raise FileNotFoundError(f"Required source missing: {relative}")
    dest = OUT / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)

def make_stub(directory: str, heading: str) -> None:
    dest = OUT / directory / "index.html"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(
        '<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="robots" content="noindex,nofollow">'
        '<title>ASSEMBL LAB — Marketing Demo</title>'
        '<style>body{font:18px Arial,sans-serif;max-width:650px;margin:13vh auto;'
        'padding:24px;background:#fcfaf7;color:#20231f;line-height:1.7}a{color:#28463e}'
        '</style><h1>' + heading + '</h1>'
        '<p>גרסת הדגמה למשווק בלבד. עמוד זה אינו זמין בגרסת ההדגמה; '
        'אין ביצוע פניות או הזמנות.</p>'
        '<p><a href="/app/">חזרה לאפליקציית ההדגמה</a></p></html>\n',
        encoding="utf-8",
    )

def validate_output() -> None:
    public_root = OUT.resolve()
    sw_text = (OUT / "app/sw.js").read_text(encoding="utf-8")
    match = re.search(r"const SHELL\s*=\s*\[([\s\S]*?)\];", sw_text)
    if not match:
        raise ValueError("PWA shell list missing")
    cached_urls = re.findall(r"'([^']+)'", match.group(1))
    for url in cached_urls:
        relative_url = unquote(urlsplit(url).path)
        resolved = (OUT / "app" / relative_url).resolve()
        if not resolved.is_relative_to(public_root):
            raise ValueError(f"Invalid PWA shell path: {url}")
        if resolved.is_dir():
            resolved = resolved / "index.html"
        if not resolved.is_file():
            raise FileNotFoundError(f"PWA offline URL missing: {url} -> {resolved}")
    app_html = (OUT / "app/index.html").read_text(encoding="utf-8")
    assert "geometric-v11-design-only.glb" in app_html
    assert "design-studio.js?v=mvp27-20261118" in app_html
    assert "שולחן קפה עגול" in app_html
    assert (OUT / "app/assets/coffee-reference-room.webp").read_bytes()[8:12] == b"WEBP"
    assert (OUT / "app/assets/coffee-empty-room.webp").read_bytes()[8:12] == b"WEBP"
    for rel in ["geometric/media/geometric-v11-design-only.glb",
                "table/personal/media/personal-design-preview.glb"]:
        assert (OUT / rel).read_bytes()[:4] == b"glTF"
    forbidden = ("docs", ".github", "tests", ".git", ".env")
    assert all(not (OUT / path).exists() for path in forbidden)
    assert not (OUT / "inquiry" / "index.html").read_text(encoding="utf-8").find("אין ביצוע פניות") == -1
    files = [p for p in OUT.rglob("*") if p.is_file()]
    oversized = [str(p.relative_to(OUT)) for p in files if p.stat().st_size > MAX_FILE_BYTES]
    if oversized:
        raise ValueError(f"Cloudflare Pages asset over 25 MiB: {oversized}")
    print(f"Marketing Demo V1: {len(files)} curated static assets; "
          f"{sum(p.stat().st_size for p in files) / 1048576:.2f} MiB; "
          f"{len(cached_urls)} offline shell URLs verified")

def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    app = ROOT / "app"
    extensions = {".html", ".css", ".js", ".mjs", ".webmanifest"}
    for src in sorted(app.iterdir()):
        if src.is_file() and src.suffix in extensions and ".test." not in src.name:
            copy(src.relative_to(ROOT).as_posix())
    for folder, suffixes in (
        ("app/assets", {".webp"}),
        ("app/icons", {".png"}),
        ("app/media", {".webp", ".avif"}),
    ):
        for src in sorted((ROOT / folder).iterdir()):
            if src.is_file() and src.suffix in suffixes:
                copy(src.relative_to(ROOT).as_posix())
    for scene in ("SC-01", "SC-02", "SC-04", "SC-07", "SC-10"):
        copy(f"app/preview-fixtures/{scene}.png")
    for rel in (
        "assets/vendor/model-viewer-4.1.0/model-viewer.min.js",
        "assets/vendor/model-viewer-4.1.0/LICENSE",
        "assets/geometric-engineering-object-clean.webp",
        "assets/geometric-hero.webp",
        "assets/language.js", "assets/language.css",
        "assets/product-light.css", "assets/media-loading.js",
        "assets/three-preview.css", "assets/three-preview.js",
        "table/personal/media/personal-design-preview.glb",
        "table/personal/media/01-hero-finished-angled-960.webp",
        "geometric/index.html",
    ):
        copy(rel)
    for image in sorted((ROOT / "geometric/media").iterdir()):
        if image.is_file() and image.suffix.lower() in {".glb", ".webp", ".jpg", ".jpeg", ".png"}:
            copy(image.relative_to(ROOT).as_posix())
    (OUT / "index.html").write_text(
        '<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8">'
        '<meta http-equiv="refresh" content="0; url=/app/">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="robots" content="noindex,nofollow">'
        '<title>ASSEMBL LAB — Marketing Demo V1</title>'
        '<p><a href="/app/">פתיחת אפליקציית ASSEMBL LAB</a></p></html>\n',
        encoding="utf-8",
    )
    for path, title in (
        ("inquiry", "טופס פנייה אינו פעיל בהדגמה"),
        ("table", "קטלוג המוצרים אינו חלק מההדגמה"),
        ("table/flow", "דגם Flow אינו חלק מההדגמה"),
    ):
        make_stub(path, title)
    (OUT / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    (OUT / "_headers").write_text(
        "/*\n"
        "  X-Content-Type-Options: nosniff\n"
        "  X-Frame-Options: DENY\n"
        "  Referrer-Policy: strict-origin-when-cross-origin\n"
        "  X-Robots-Tag: noindex, nofollow, noarchive\n"
        "/app/sw.js\n"
        "  Cache-Control: no-cache, no-store, must-revalidate\n"
        "/app/index.html\n"
        "  Cache-Control: no-cache, must-revalidate\n",
        encoding="utf-8",
    )
    (OUT / "demo-version.json").write_text(
        json.dumps({
            "name": "ASSEMBL LAB — Marketing Demo V1",
            "source_revision": SOURCE_REVISION,
            "source_branch": "release/marketing-demo-2026-11-18",
            "deployed_from": "deploy/marketing-demo-2026-11-18",
            "app_entry": "/app/",
            "live_inquiries_enabled": False,
            "purpose": "fixed product showcase; changes in main do not propagate",
        }, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    validate_output()

if __name__ == "__main__":
    main()
