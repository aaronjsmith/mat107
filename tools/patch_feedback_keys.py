# -*- coding: utf-8 -*-
"""Patch all lang packs: feedback spacing helpers + calc_header newline; sync JS."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LANG = ROOT / "lang"

EN_EXTRAS = {
    "feedback_note_hinted": "Hints used → {credit}% credit (not counted toward mastery).",
    "feedback_note_unaided": "Unaided · mastery progress {progress}.",
    "flash.target_form": "Target form: {left} = …  (fill the right-hand side from memory)",
}


def main() -> None:
    en_path = LANG / "en.json"
    en = json.loads(en_path.read_text(encoding="utf-8"))
    for k, v in EN_EXTRAS.items():
        en["strings"][k] = v
    # Ensure calc_header / compare_which newlines
    en["strings"]["calc_header"] = (
        "How to enter it (you finish and round):\n"
        "TI-36X Pro:  {ti}\nCasio fx-115ES/991ES:  {casio}{tip}"
    )
    en["strings"]["q.compare_which"] = (
        "Data Set #1: {d1}\nData Set #2: {d2}\n"
        "Using the range rule of thumb, which has more variation?"
    )
    en_path.write_text(json.dumps(en, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    for path in sorted(LANG.glob("*.json")):
        if path.name in ("en.json", "languages.json"):
            continue
        pack = json.loads(path.read_text(encoding="utf-8"))
        strings = pack["strings"]
        # Add missing helper keys (English fallback content is OK; packs fall back to en anyway)
        for k, v in EN_EXTRAS.items():
            if k not in strings:
                strings[k] = v
        # Fix fused Casio line if present
        ch = strings.get("calc_header", "")
        if "Pro:  {ti}Casio" in ch:
            strings["calc_header"] = ch.replace("Pro:  {ti}Casio", "Pro:  {ti}\nCasio")
        cq = strings.get("q.compare_which", "")
        if "{d1}Data Set" in cq or "{d1}{d2}" in cq or re.search(r"\{d1\}[^\n]", cq):
            # Only force newline glue if datasets are jammed
            if "{d1}Data" in cq or "{d1}数据" in cq or "{d2}Using" in cq or "{d2}使用" in cq:
                pass  # leave translated unless obvious English glue
            if "{d1}Data Set #2" in cq:
                strings["q.compare_which"] = cq.replace(
                    "{d1}Data Set #2", "{d1}\nData Set #2"
                ).replace("{d2}Using", "{d2}\nUsing")
        path.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("patched", path.name)

    # sync js
    from split_dictionaries import sync_js_from_json_files

    sync_js_from_json_files()
    print("synced js")


if __name__ == "__main__":
    main()
