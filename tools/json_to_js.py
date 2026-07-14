# -*- coding: utf-8 -*-
"""Regenerate lang/*.js from lang/languages.json and lang/{code}.json."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from split_dictionaries import sync_js_from_json_files  # noqa: E402


if __name__ == "__main__":
    sync_js_from_json_files()
    print("Done.")
