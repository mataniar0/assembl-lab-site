#!/usr/bin/env python3
"""Temporary AL-001 remote acceptance fixture. Never merge this proof branch."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ASSET = 'assets/cards/kids-480.webp'


def git(*args, cwd=ROOT):
    return subprocess.check_output(['git', *args], cwd=cwd, text=True).strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', required=True)
    parser.add_argument('--report-dir', required=True)
    args = parser.parse_args()
    reports = Path(args.report_dir).resolve()
    reports.mkdir(parents=True, exist_ok=True)
    source = git('rev-parse', 'HEAD')
    with tempfile.TemporaryDirectory(prefix='al001-red-proof-') as temporary:
        fixture = Path(temporary) / 'fixture'
        # Local clone only; no credentials, hooks or network push in this fixture.
        subprocess.run(['git', 'clone', '--quiet', '--no-hardlinks', str(ROOT), str(fixture)], check=True)
        git('checkout', '--quiet', '--detach', source, cwd=fixture)
        assert (fixture / ASSET).is_file(), 'Expected fixture image must exist first'
        git('rm', '--quiet', '--', ASSET, cwd=fixture)
        git('-c', 'user.name=AL-001 fixture', '-c', 'user.email=fixture@example.invalid',
            'commit', '--quiet', '-m', 'Isolated missing-image fixture; never push', cwd=fixture)
        broken = git('rev-parse', 'HEAD', cwd=fixture)
        metadata = {'source_checkout_commit': source, 'fixture_commit': broken,
                    'missing_asset': ASSET, 'remote_pushes': 0,
                    'fixture_only': True, 'expected_checker_exit': 'nonzero'}
        (reports / 'missing-image-fixture.json').write_text(json.dumps(metadata, indent=2) + '\n')
        print(json.dumps(metadata), flush=True)
        # The existing checker validates the exact broken commit and retains JSON.
        result = subprocess.run([sys.executable, str(fixture / 'scripts/check_site.py'),
                                 '--commit', broken, '--browser', args.browser,
                                 '--report', str(reports / 'site-smoke.json')], cwd=fixture)
        if git('rev-parse', 'HEAD') != source or not (ROOT / ASSET).is_file():
            raise RuntimeError('Source checkout preservation failed')
        print('Original checkout and image preserved; fixture removed on exit.', flush=True)
        # Deliberately retain the checker failure: never convert it to a green job.
        if result.returncode == 0:
            raise RuntimeError('Missing-image checker unexpectedly passed')
        return result.returncode


if __name__ == '__main__':
    sys.exit(main())
