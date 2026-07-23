# -*- coding: utf-8 -*-
"""Write js/build-info.js from the current git HEAD (fallback for footer)."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "js" / "build-info.js"


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def main() -> None:
    sha = git("rev-parse", "HEAD")
    short = git("rev-parse", "--short=7", "HEAD")
    date = git("log", "-1", "--format=%cI")
    url = f"https://github.com/aaronjsmith/mat107/commit/{sha}"
    payload = {"sha": sha, "short": short, "date": date, "url": url}
    body = (
        "/**\n"
        " * Optional static fallback written by tools/write_build_info.py.\n"
        " * Live pages prefer the GitHub API (see footer-updated.js).\n"
        " */\n"
        f"window.MAT107_BUILD = {json.dumps(payload, indent=2)};\n"
    )
    OUT.write_text(body, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} ({short} · {date})")


if __name__ == "__main__":
    main()
