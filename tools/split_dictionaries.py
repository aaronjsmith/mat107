# -*- coding: utf-8 -*-
"""
Split monolithic lang/dictionary.json into:
  lang/languages.json          — catalog
  lang/{code}.json             — one string pack per language
  lang/languages.js            — browser catalog
  lang/{code}.js               — browser packs (file:// safe)
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LANG_DIR = ROOT / "lang"
MONO = LANG_DIR / "dictionary.json"


def write_js_pack(code: str, strings: dict) -> None:
    out = LANG_DIR / f"{code}.js"
    out.write_text(
        "/* Auto-generated from "
        + code
        + ".json — edit the JSON, then run tools/json_to_js.py */\n"
        "window.QUIZ_LANG_PACKS = window.QUIZ_LANG_PACKS || {};\n"
        "window.QUIZ_LANG_PACKS["
        + json.dumps(code)
        + "] = "
        + json.dumps(strings, ensure_ascii=False)
        + ";\n",
        encoding="utf-8",
    )


def write_languages_js(meta: dict) -> None:
    out = LANG_DIR / "languages.js"
    out.write_text(
        "/* Auto-generated from languages.json — edit the JSON, then run tools/json_to_js.py */\n"
        "window.QUIZ_LANGUAGES = "
        + json.dumps(meta, ensure_ascii=False)
        + ";\n",
        encoding="utf-8",
    )


def sync_js_from_json_files() -> None:
    meta_path = LANG_DIR / "languages.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    write_languages_js(meta)
    for L in meta["languages"]:
        code = L["code"]
        src = LANG_DIR / f"{code}.json"
        data = json.loads(src.read_text(encoding="utf-8"))
        strings = data.get("strings", data)
        write_js_pack(code, strings)
        print(f"  {code}.json -> {code}.js ({len(strings)} keys)")


def split_monolith() -> None:
    raw = json.loads(MONO.read_text(encoding="utf-8"))
    languages = raw["languages"]
    default = raw.get("default", "en")
    strings_by_lang = raw["strings"]

    meta = {
        "default": default,
        "languages": [
            {
                "code": L["code"],
                "name": L["name"],
                "native": L["native"],
                "file": L["code"] + ".json",
            }
            for L in languages
        ],
    }
    (LANG_DIR / "languages.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Wrote languages.json")

    for L in languages:
        code = L["code"]
        pack = {
            "code": code,
            "name": L["name"],
            "native": L["native"],
            "strings": strings_by_lang.get(code, {}),
        }
        (LANG_DIR / f"{code}.json").write_text(
            json.dumps(pack, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote {code}.json ({len(pack['strings'])} keys)")

    sync_js_from_json_files()

    # Remove monolith so there's a single clear layout
    for dead in (MONO, LANG_DIR / "dictionary.js"):
        if dead.exists():
            dead.unlink()
            print(f"Removed {dead.name}")


if __name__ == "__main__":
    if MONO.exists():
        split_monolith()
    else:
        sync_js_from_json_files()
    print("Done.")
