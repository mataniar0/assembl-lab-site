#!/usr/bin/env python3
"""Prove the pre-push gate using an isolated clone and a local bare remote.

Run after setup: python tests/pre_push_integration.py [--report PATH]
No original checkout files, external remotes, or dependency installations are changed.
The fixture runs the real smoke suite, which intercepts all inquiry submissions.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time


ROOT = Path(__file__).resolve().parents[1]
MARKER = "Pre-push: running the site checks before sending"


def require(condition, message):
    if not condition:
        raise AssertionError(message)


class Proof:
    def __init__(self, root, browser=None):
        self.root = root
        self.started = time.monotonic()
        self.results, self.commands = [], []
        self.env = os.environ.copy()
        # Reuse the configured environment and browser cache; do not copy them.
        for directory in (root / ".venv-qa/bin", root / ".venv-qa/Scripts"):
            if directory.is_dir():
                self.env["PATH"] = str(directory) + os.pathsep + self.env.get("PATH", "")
        self.env.setdefault("PLAYWRIGHT_BROWSERS_PATH", str(root / ".qa-browsers"))
        if browser:
            self.env["ASSEMBLE_BROWSER"] = str(Path(browser).expanduser().resolve())
        self.env["GIT_TERMINAL_PROMPT"] = "0"

    def git(self, *arguments, cwd=None, success=True):
        command = ["git", *map(str, arguments)]
        result = subprocess.run(command, cwd=cwd or self.root, env=self.env,
                                capture_output=True, text=True, encoding="utf-8",
                                errors="replace", timeout=600)
        self.commands.append({"command": command, "cwd": str(cwd or self.root),
                              "returncode": result.returncode,
                              "stdout": result.stdout, "stderr": result.stderr})
        if success:
            require(result.returncode == 0,
                    f"Command failed ({result.returncode}): {' '.join(command)}\n{result.stderr[-3000:]}")
        return result

    def passed(self, name, **details):
        self.results.append({"name": name, "status": "passed", "details": details})
        print("PASS " + name, flush=True)

    def remote_ref(self, remote, ref):
        result = self.git("--git-dir", remote, "rev-parse", "--verify", ref, success=False)
        return result.stdout.strip() if result.returncode == 0 else None

    def remote_refs(self, remote):
        result = self.git("--git-dir", remote, "for-each-ref", "--format=%(refname) %(objectname)")
        return dict(line.split(" ", 1) for line in result.stdout.splitlines())

    def report_for(self, checkout, commit):
        path = checkout / ".qa-reports" / ("pre-push-" + commit[:12] + ".json")
        require(path.is_file(), f"No pre-push report for {commit}")
        report = json.loads(path.read_text(encoding="utf-8"))
        require(report.get("checked_commit") == commit, "Pre-push checked a different commit")
        require(report.get("checked_working_files") is False, "Pre-push checked working files")
        require(report.get("real_posts") == 0, "Smoke report did not confirm zero real submissions")
        return report

    def run(self):
        original_head = self.git("rev-parse", "HEAD").stdout.strip()
        require((self.root / ".githooks/pre-push").is_file(), "The tracked pre-push hook is missing")
        with tempfile.TemporaryDirectory(prefix="assemble-pre-push-proof-") as temporary:
            fixture = Path(temporary)
            checkout, remote = fixture / "checkout", fixture / "remote.git"
            self.git("init", "--bare", "--quiet", remote, cwd=fixture)
            self.git("clone", "--quiet", "--no-hardlinks", self.root, checkout, cwd=fixture)
            self.git("checkout", "--quiet", "-b", "smoke-proof", original_head, cwd=checkout)
            self.git("config", "--local", "user.name", "Local pre-push integration test", cwd=checkout)
            self.git("config", "--local", "user.email", "pre-push-proof@example.invalid", cwd=checkout)
            self.git("config", "--local", "commit.gpgSign", "false", cwd=checkout)
            self.git("config", "--local", "tag.gpgSign", "false", cwd=checkout)
            self.git("config", "--local", "core.hooksPath", ".githooks", cwd=checkout)
            hook = checkout / ".githooks/pre-push"
            hook.chmod(hook.stat().st_mode | 0o111)
            self.git("remote", "remove", "origin", cwd=checkout)
            self.git("remote", "add", "proof", remote, cwd=checkout)
            require(Path(self.git("remote", "get-url", "proof", cwd=checkout).stdout.strip()).resolve()
                    == remote.resolve(), "Integration remote is not the local fixture")
            self.git("tag", "-a", "smoke-proof-tag", "-m", "Local integration fixture only", cwd=checkout)

            print("Checking a good branch and annotated tag through ordinary git push...", flush=True)
            first = self.git("push", "proof", "smoke-proof", "refs/tags/smoke-proof-tag", cwd=checkout)
            output = first.stdout + first.stderr
            require(output.count(MARKER) == 1, "Branch/tag sharing a commit were not checked exactly once")
            require(self.remote_ref(remote, "refs/heads/smoke-proof") == original_head,
                    "Good branch did not reach the fixture remote")
            require(self.remote_ref(remote, "refs/tags/smoke-proof-tag^{commit}") == original_head,
                    "Annotated tag did not resolve to the good commit")
            first_report = self.report_for(checkout, original_head)
            require(first_report.get("failed") == 0 and first_report.get("passed", 0) > 0,
                    "Good commit did not produce passing checks")
            self.passed("good push and branch/tag deduplication", commit=original_head,
                        smoke_passed=first_report["passed"], checks_invoked=1)

            homepage = checkout / "index.html"
            original_homepage = homepage.read_bytes()
            require(b"</body>" in original_homepage, "Homepage has no closing body element")
            missing = b"assets/pre-push-integration-missing.webp"
            require(not (checkout / missing.decode("ascii")).exists(), "Missing-image fixture already exists")
            inserted = b'<img src="' + missing + b'" alt="Integration fixture" width="1" height="1">\n'
            homepage.write_bytes(original_homepage.replace(b"</body>", inserted + b"</body>", 1))
            self.git("add", "--", "index.html", cwd=checkout)
            self.git("commit", "--quiet", "-m", "Integration fixture: broken committed image", cwd=checkout)
            bad_commit = self.git("rev-parse", "HEAD", cwd=checkout).stdout.strip()
            homepage.write_bytes(original_homepage)  # Deliberately NOT committed yet.
            status = self.git("status", "--porcelain", "--", "index.html", cwd=checkout).stdout
            require(" M index.html" in status, "Working-file repair was unexpectedly committed")
            committed = self.git("show", bad_commit + ":index.html", cwd=checkout).stdout
            require(missing.decode("ascii") in committed and missing not in homepage.read_bytes(),
                    "Broken commit and repaired working file were not distinct")
            refs_before = self.remote_refs(remote)

            print("Checking that a repaired working file cannot hide a broken committed image...", flush=True)
            denied = self.git("push", "proof", "smoke-proof", cwd=checkout, success=False)
            require(denied.returncode != 0, "The broken committed site was pushed successfully")
            require((denied.stdout + denied.stderr).count(MARKER) == 1,
                    "Rejected push did not run the real pre-push checks")
            require(self.remote_refs(remote) == refs_before, "Rejected push changed fixture remote refs")
            bad_report = self.report_for(checkout, bad_commit)
            require(bad_report.get("failed", 0) > 0, "Bad committed site did not report a failing check")
            require(missing.decode("ascii") in json.dumps(bad_report),
                    "Failed checks did not identify the committed missing image")
            self.passed("broken commit blocked despite repaired working file", commit=bad_commit,
                        smoke_failed=bad_report["failed"], remote_unchanged=True,
                        working_file_repaired=True)

            self.git("add", "--", "index.html", cwd=checkout)
            self.git("commit", "--quiet", "-m", "Integration fixture: commit image repair", cwd=checkout)
            repaired_commit = self.git("rev-parse", "HEAD", cwd=checkout).stdout.strip()
            print("Checking that committing the repair permits the next normal push...", flush=True)
            repaired = self.git("push", "proof", "smoke-proof", cwd=checkout)
            require((repaired.stdout + repaired.stderr).count(MARKER) == 1,
                    "Repaired push did not run exactly one check")
            require(self.remote_ref(remote, "refs/heads/smoke-proof") == repaired_commit,
                    "Repaired commit did not reach the fixture remote")
            repaired_report = self.report_for(checkout, repaired_commit)
            require(repaired_report.get("failed") == 0, "Committed repair did not pass checks")
            self.passed("committed repair permits ordinary push", commit=repaired_commit,
                        smoke_passed=repaired_report["passed"])

            print("Checking that deleting a tag does not run unnecessary site checks...", flush=True)
            reports_before = {path.name for path in (checkout / ".qa-reports").glob("*.json")}
            deletion = self.git("push", "proof", ":refs/tags/smoke-proof-tag", cwd=checkout)
            require(MARKER not in deletion.stdout + deletion.stderr, "Deletion-only push ran site checks")
            require(self.remote_ref(remote, "refs/tags/smoke-proof-tag") is None,
                    "Deletion-only push did not remove the fixture tag")
            require(self.remote_ref(remote, "refs/heads/smoke-proof") == repaired_commit,
                    "Tag deletion changed the branch")
            require({path.name for path in (checkout / ".qa-reports").glob("*.json")} == reports_before,
                    "Deletion-only push created another smoke report")
            self.passed("deletion-only push skips site checks", checks_invoked=0)

        require(not fixture.exists(), "Temporary integration repositories were not cleaned up")
        require(self.git("rev-parse", "HEAD").stdout.strip() == original_head,
                "Original checkout HEAD changed during integration checks")
        self.passed("temporary repositories cleaned and original HEAD preserved")

    def report(self):
        passed = sum(result["status"] == "passed" for result in self.results)
        return {"passed": passed, "failed": len(self.results) - passed,
                "seconds": round(time.monotonic() - self.started, 2), "real_posts": 0,
                "results": self.results, "commands": self.commands}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT, help="Checkout with committed QA hook and tests")
    parser.add_argument("--browser", help="Chromium executable; defaults to existing browser configuration")
    parser.add_argument("--report", type=Path, default=ROOT / ".qa-reports/pre-push-integration.json")
    args = parser.parse_args()
    proof = Proof(args.root.resolve(), args.browser)
    try:
        proof.run()
    except Exception as error:
        proof.results.append({"name": "integration completion", "status": "failed", "error": str(error)})
        print("FAIL integration completion: " + str(error), file=sys.stderr, flush=True)
    report = proof.report()
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Pre-push integration: {report['passed']} passed, {report['failed']} failed "
          f"in {report['seconds']}s. Report: {args.report}", flush=True)
    return 1 if report["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
