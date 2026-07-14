# -*- coding: utf-8 -*-
"""Retry leftover English story keys with safer quoting + MyMemory fallback."""
from __future__ import annotations

import json
import re
import time
from pathlib import Path

from deep_translator import GoogleTranslator, MyMemoryTranslator

ROOT = Path(__file__).resolve().parents[1]
LANG_DIR = ROOT / "lang"

GT_TARGET = {
    "zh": "zh-CN",
    "hi": "hi",
    "es": "es",
    "fr": "fr",
    "ar": "ar",
    "bn": "bn",
    "pt": "pt",
    "ru": "ru",
    "ur": "ur",
    "id": "id",
    "de": "de",
    "ja": "ja",
    "sw": "sw",
    "mr": "mr",
    "te": "te",
    "tr": "tr",
    "ta": "ta",
    "vi": "vi",
    "ko": "ko",
}

STORY_PREFIXES = ("q.", "h.", "c.", "s.", "card.", "flash.", "pi_note", "unit.")
PH_RE = re.compile(r"\{[^{}]+\}")
TAG_RE = re.compile(r"</?[a-zA-Z][^>]*>")

# Short math/unit strings that can stay as-is or use fixed forms.
MANUAL = {
    "s.sqft_sqyd": "sq ft = 3 ft × 3 ft",
    "s.cuft_cuyd": "cu ft = 3 ft × 3 ft × 3 ft",
    "s.feet_in_yard": "3 ft = 1 yd",
    "unit.ft": "ft",
    "unit.sq_ft": "sq ft",
    "unit.dollars": "dollars",
    "c.mode": "Mode",
}


def is_story_key(key: str) -> bool:
    return any(key == p or key.startswith(p) for p in STORY_PREFIXES)


def protect(text: str) -> tuple[str, list[str]]:
    parts: list[str] = []

    def keep(m: re.Match[str]) -> str:
        parts.append(m.group(0))
        return f"XPHX{len(parts) - 1}XPHX"

    out = PH_RE.sub(keep, text)
    out = TAG_RE.sub(keep, out)
    return out, parts


def restore(text: str, parts: list[str]) -> str:
    for i, token in enumerate(parts):
        for v in (f"XPHX{i}XPHX", f"xphx{i}xphx", f"Xphx{i}Xphx"):
            if v in text:
                text = text.replace(v, token)
                break
    return text


def clean_quotes(text: str) -> str:
    return (
        text.replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u00d7", "x")
    )


def translate_one(text: str, target: str) -> str | None:
    protected, parts = protect(text)
    protected = clean_quotes(protected)
    for attempt in range(5):
        for factory in (
            lambda: GoogleTranslator(source="en", target=target).translate(protected),
            lambda: MyMemoryTranslator(source="en", target=target).translate(protected),
        ):
            try:
                raw = factory()
                if not raw:
                    continue
                out = restore(raw, parts)
                if PH_RE.findall(text) == PH_RE.findall(out):
                    return out
            except Exception:
                pass
        time.sleep(1.0 * (attempt + 1))
    return None


def main() -> int:
    en = json.loads((LANG_DIR / "en.json").read_text(encoding="utf-8"))["strings"]
    for code, target in GT_TARGET.items():
        path = LANG_DIR / f"{code}.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        strings = pack["strings"]
        todo = [k for k in en if is_story_key(k) and strings.get(k) == en.get(k)]
        if not todo:
            continue
        print(f"=== {code}: {len(todo)} ===", flush=True)
        changed = False
        for key in todo:
            if key in MANUAL:
                # Only apply manual when English equals current and MANUAL differs
                # OR when key is a formula stub — mark translated by using MANUAL text.
                if MANUAL[key] != en[key] or key.startswith("s.") or key.startswith("unit.") or key == "c.mode":
                    # For true leftovers that are identical in many languages, attach
                    # a zero-width marker? Better: leave Mode/ft/dollars as English.
                    if key in ("c.mode", "unit.ft", "unit.sq_ft", "unit.dollars") and MANUAL[key] == en[key]:
                        print(f"  skip identical {key}", flush=True)
                        continue
                    if key.startswith("s.") and MANUAL[key] == en.get(key):
                        # Normalize multiply sign only so they are not English-problematic.
                        strings[key] = MANUAL[key]
                        changed = True
                        print(f"  manual {key}", flush=True)
                        continue
            out = translate_one(en[key], target)
            if out and out != en[key]:
                strings[key] = out
                changed = True
                print(f"  ok {key}", flush=True)
            else:
                print(f"  FAIL {key}", flush=True)
            time.sleep(0.15)
        if changed:
            path.write_text(
                json.dumps(pack, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
    print("DONE leftovers", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
