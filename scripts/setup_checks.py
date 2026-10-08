#!/usr/bin/env python3
"""Install the smoke-check dependencies and enable the repository pre-push hook."""

import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys
import venv

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--install-browser', action='store_true', help='Install bundled Chromium even if a system Chromium exists')
    args = parser.parse_args()
    if sys.version_info < (3, 10):
        print('Python 3.10 or newer is required.', file=sys.stderr)
        return 1
    hooks = subprocess.run(['git', 'config', '--get', 'core.hooksPath'], cwd=ROOT, capture_output=True, text=True)
    existing = hooks.stdout.strip()
    if existing and existing != '.githooks':
        print('A different Git hooks directory is configured. Integrate .githooks/pre-push into that directory before enabling checks.', file=sys.stderr)
        return 1
    default_path = subprocess.check_output(['git', 'rev-parse', '--git-path', 'hooks'], cwd=ROOT, text=True).strip()
    default_hooks = Path(default_path)
    if not default_hooks.is_absolute():
        default_hooks = ROOT / default_hooks
    active_hooks = [p for p in default_hooks.glob('*') if p.is_file() and not p.name.endswith('.sample')]
    if not existing and active_hooks:
        print('Existing Git hooks need to be preserved. Integrate .githooks/pre-push with the existing hooks before enabling checks.', file=sys.stderr)
        return 1
    environment = ROOT / '.venv-qa'
    if not environment.exists():
        print('Creating local QA environment...', flush=True)
        venv.EnvBuilder(with_pip=True).create(environment)
    python = environment / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    subprocess.run([str(python), '-m', 'pip', 'install', '--quiet', '-r', str(ROOT / 'tests/requirements.txt')], check=True)
    system_browser = os.environ.get('ASSEMBLE_BROWSER') or next(
        (shutil.which(name) for name in ('chromium', 'chromium-browser', 'google-chrome') if shutil.which(name)), None)
    if args.install_browser or not system_browser:
        env = os.environ.copy()
        env.setdefault('PLAYWRIGHT_BROWSERS_PATH', str(ROOT / '.qa-browsers'))
        subprocess.run([str(python), '-m', 'playwright', 'install', 'chromium'], env=env, check=True)
    hook = ROOT / '.githooks/pre-push'
    hook.chmod(hook.stat().st_mode | 0o111)
    subprocess.run(['git', 'config', '--local', 'core.hooksPath', '.githooks'], cwd=ROOT, check=True)
    print('Site checks installed. Normal git push now checks the outgoing commit.\nManual check: python scripts/check_site.py', flush=True)
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, subprocess.CalledProcessError) as error:
        print('Setup failed: ' + str(error), file=sys.stderr)
        sys.exit(1)
