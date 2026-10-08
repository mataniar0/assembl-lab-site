#!/usr/bin/env python3
"""Run the generic site smoke checks on working files or an exact Git commit."""

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def qa_python():
    for candidate in (ROOT / '.venv-qa/bin/python', ROOT / '.venv-qa/Scripts/python.exe'):
        if candidate.is_file():
            return str(candidate)
    return sys.executable


def run_checks(site_root, args, commit=None):
    runner = site_root / 'tests/site_smoke.py'
    if not runner.is_file():
        runner = ROOT / 'tests/site_smoke.py'
    if not runner.is_file():
        print('Missing tests/site_smoke.py. Restore the smoke checks before pushing.', file=sys.stderr)
        return 1
    report = Path(args.report).expanduser().resolve()
    report.parent.mkdir(parents=True, exist_ok=True)
    if report.exists():
        report.unlink()
    command = [qa_python(), str(runner), '--root', str(site_root), '--report', str(report)]
    if args.browser:
        command.extend(['--browser', args.browser])
    env = os.environ.copy()
    env.setdefault('PLAYWRIGHT_BROWSERS_PATH', str(ROOT / '.qa-browsers'))
    result = subprocess.run(command, cwd=site_root, env=env)
    if not report.is_file():
        print('Checks did not produce a report; push must stop.', file=sys.stderr)
        return 1
    data = json.loads(report.read_text(encoding='utf-8'))
    valid = isinstance(data, dict) and all(type(data.get(key)) is int and data[key] >= 0
                                          for key in ('passed', 'failed', 'real_posts'))
    results = data.get('results') if isinstance(data, dict) else None
    valid = valid and isinstance(results, list) and bool(results)
    if valid:
        valid = (all(isinstance(item, dict) and item.get('status') in ('passed', 'failed') for item in results)
                 and sum(item['status'] == 'passed' for item in results) == data['passed']
                 and sum(item['status'] == 'failed' for item in results) == data['failed'])
    if not valid:
        print('Checks produced an invalid or empty report; push must stop.', file=sys.stderr)
        return 1
    data['checked_commit'] = commit
    data['checked_working_files'] = commit is None
    report.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Report: ' + str(report), flush=True)
    if result.returncode or data['failed'] or data['passed'] == 0 or data['real_posts'] != 0:
        return result.returncode or 1
    return 0


def check_commit(args):
    resolved = subprocess.run(
        ['git', 'rev-parse', '--verify', '--end-of-options', args.commit + '^{commit}'],
        cwd=ROOT, capture_output=True, text=True,
    )
    if resolved.returncode:
        print('Cannot resolve the requested Git commit.', file=sys.stderr)
        return 1
    commit = resolved.stdout.strip()
    print('Checking outgoing commit ' + commit, flush=True)
    with tempfile.TemporaryDirectory(prefix='assemble-site-qa-') as temporary:
        snapshot = Path(temporary)
        archive = subprocess.Popen(['git', 'archive', '--format=tar', commit], cwd=ROOT, stdout=subprocess.PIPE)
        try:
            with tarfile.open(fileobj=archive.stdout, mode='r|') as tar:
                for member in tar:
                    destination = snapshot / member.name
                    if not destination.resolve().is_relative_to(snapshot.resolve()):
                        raise ValueError('Unsafe path in Git snapshot')
                    if member.isdir():
                        destination.mkdir(parents=True, exist_ok=True)
                    elif member.isfile():
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        source = tar.extractfile(member)
                        with source, destination.open('wb') as output:
                            while chunk := source.read(1024 * 1024):
                                output.write(chunk)
                    else:
                        raise ValueError('Unsupported link in Git snapshot: ' + member.name)
            if archive.wait():
                raise RuntimeError('git archive failed')
        finally:
            archive.stdout.close()
            if archive.poll() is None:
                archive.terminate()
                archive.wait()
        return run_checks(snapshot, args, commit)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--commit', help='Check this exact commit instead of working files')
    parser.add_argument('--browser', help='Chromium executable; otherwise use automatic detection')
    parser.add_argument('--report', default=str(ROOT / '.qa-reports/latest.json'))
    args = parser.parse_args()
    try:
        return check_commit(args) if args.commit else run_checks(ROOT, args)
    except (OSError, RuntimeError, ValueError, tarfile.TarError) as error:
        print('Site checks could not run: ' + str(error), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
