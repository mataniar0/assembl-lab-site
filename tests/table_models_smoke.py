"""Validate table-family navigation, Flow inquiry prefill and design download.

Run: python3 tests/table_models_smoke.py
"""
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright
from homepage_smoke import site_url
from language_site_smoke import LOCALE_CHECK
from mobile_site_smoke import LAYOUT_CHECK, IMAGE_CHECK


def main():
    cases = 0
    with site_url(None) as base, sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        try:
            for locale in ("he", "en"):
                for width, height in ((320, 568), (844, 390), (1440, 900)):
                    context = browser.new_context(viewport={"width": width, "height": height}, accept_downloads=True)
                    context.add_init_script(f"localStorage.setItem('assemble-language', '{locale}')")
                    page = context.new_page()
                    errors = []
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.route("https://formspree.io/**", lambda route: route.abort())
                    try:
                        page.goto(base)
                        page.locator('.product[href="table/"]').click()
                        page.wait_for_url(urljoin(base, 'table/'))
                        for path in ('table/', 'table/flow/'):
                            page.goto(urljoin(base, path))
                            assert not page.evaluate(LAYOUT_CHECK)
                            assert not page.evaluate(LOCALE_CHECK, locale)
                            assert not page.evaluate(IMAGE_CHECK)
                            assert len(page.locator('.placeholder').all()) == 1
                        with page.expect_download() as download:
                            page.locator('a[download]').click()
                        assert download.value.suggested_filename == 'FLOW_OPTION2_TRI_BASE_REV2_DXF.zip'
                        assert download.value.failure() is None
                        page.locator('a[href="../../inquiry/?product=flow"]').click()
                        page.wait_for_url('**/inquiry/?product=flow')
                        assert page.locator('#product').input_value() == 'flow'
                        assert page.locator('html').get_attribute('lang') == locale
                        assert 'Flow' in page.locator('#product option:checked').inner_text()
                        page.goto(urljoin(base, 'table/'))
                        page.locator('a[href="../geometric/"]').click()
                        page.wait_for_url(urljoin(base, 'geometric/'))
                        page.locator('.header a[href="../table/"]').click()
                        page.wait_for_url(urljoin(base, 'table/'))
                        assert not errors, errors
                        cases += 1
                        print(f'PASS {locale} {width}x{height}: family, models, download, inquiry and return navigation', flush=True)
                    finally:
                        context.close()
        finally:
            browser.close()
    print(f'PASS: {cases} table model journeys; no real inquiries sent.')


if __name__ == '__main__':
    main()
