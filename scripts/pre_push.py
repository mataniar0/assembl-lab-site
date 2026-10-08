#!/usr/bin/env python3
"""Git pre-push adapter: check each outgoing commit, never the working files."""

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    commits = []
    for line in sys.stdin:
        fields = line.split()
        if len(fields) != 4:
            print('Cannot parse Git pre-push input; push stopped.', file=sys.stderr)
            return 1
        local_ref, local_sha, _remote_ref, _remote_sha = fields
        if set(local_sha) == {'0'}:
            continue  # A deleted ref has no outgoing site to check.
        resolved = subprocess.run(
            ['git', 'rev-parse', '--verify', '--end-of-options', local_sha + '^{commit}'],
            cwd=ROOT, capture_output=True, text=True,
        )
        if resolved.returncode:
            print('Cannot resolve outgoing ref ' + local_ref + '; push stopped.', file=sys.stderr)
            return 1
        commit = resolved.stdout.strip()
        if commit not in commits:
            commits.append(commit)
    for commit in commits:
        print('Pre-push: running the site checks before sending ' + commit[:12], flush=True)
        command = [sys.executable, str(ROOT / 'scripts/check_site.py'), '--commit', commit,
                   '--report', str(ROOT / '.qa-reports' / ('pre-push-' + commit[:12] + '.json'))]
        result = subprocess.run(command, cwd=ROOT)
        if result.returncode:
            print('Push stopped: site checks failed. Fix the issue and create a new commit before retrying.', file=sys.stderr)
            return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
