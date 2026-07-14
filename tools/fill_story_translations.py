# -*- coding: utf-8 -*-
"""Translate story/q/h/c keys that are still English copies, preserving {placeholders}."""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[1]
LANG_DIR = ROOT / "lang"

# Google Translate target codes
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
        variants = [
            f"XPHX{i}XPHX",
            f"xphx{i}xphx",
            f"Xphx{i}Xphx",
            f"XPHX {i} XPHX",
            f"xphx {i} xphx",
        ]
        for v in variants:
            if v in text:
                text = text.replace(v, token)
                break
    return text


def placeholders_ok(original: str, translated: str) -> bool:
    return PH_RE.findall(original) == PH_RE.findall(translated)


def translate_one(translator: GoogleTranslator, text: str, retries: int = 4) -> str:
    protected, parts = protect(text)
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            raw = translator.translate(protected)
            if not raw:
                raise RuntimeError("empty translation")
            out = restore(raw, parts)
            if not placeholders_ok(text, out):
                # Retry once more; if still broken, insert originals at end
                if attempt + 1 < retries:
                    time.sleep(0.8 * (attempt + 1))
                    continue
                # Force-restore any missing placeholders that look corrupted
                missing = [p for p in PH_RE.findall(text) if p not in out]
                if missing:
                    # Prefer keeping English over broken placeholders
                    return text
            return out
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            time.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"translate failed: {last_err}")


def is_story_key(key: str) -> bool:
    return any(key == p or key.startswith(p) for p in STORY_PREFIXES)


def main() -> int:
    only = sys.argv[1:]  # optional language codes
    en_pack = json.loads((LANG_DIR / "en.json").read_text(encoding="utf-8"))
    en = en_pack["strings"]
    story_keys = sorted(k for k in en if is_story_key(k))

    catalog = json.loads((LANG_DIR / "languages.json").read_text(encoding="utf-8"))
    codes = [L["code"] for L in catalog["languages"] if L["code"] != "en"]
    if only:
        codes = [c for c in codes if c in only]

    cache: dict[tuple[str, str], str] = {}

    for code in codes:
        target = GT_TARGET.get(code)
        if not target:
            print(f"skip {code}: no GT mapping")
            continue
        path = LANG_DIR / f"{code}.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        strings = pack["strings"]
        todo = [k for k in story_keys if strings.get(k) == en.get(k)]
        print(f"\n=== {code} ({target}): {len(todo)} keys to translate ===", flush=True)
        if not todo:
            continue
        translator = GoogleTranslator(source="en", target=target)
        done = 0
        for key in todo:
            src = en[key]
            cache_key = (target, src)
            if cache_key in cache:
                strings[key] = cache[cache_key]
            else:
                try:
                    translated = translate_one(translator, src)
                except Exception as exc:  # noqa: BLE001
                    print(f"  FAIL {key}: {exc}", flush=True)
                    continue
                cache[cache_key] = translated
                strings[key] = translated
                time.sleep(0.15)
            done += 1
            if done % 10 == 0 or done == len(todo):
                print(f"  {done}/{len(todo)}", flush=True)
                path.write_text(
                    json.dumps(pack, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )
        path.write_text(
            json.dumps(pack, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        same = sum(1 for k in story_keys if strings.get(k) == en.get(k))
        print(f"  done {code}: remaining same_as_en={same}/{len(story_keys)}", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
