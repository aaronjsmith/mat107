# -*- coding: utf-8 -*-
"""Merge missing English keys into active language packs and translate them."""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[1]
LANG_DIR = ROOT / "lang"

GT_TARGET = {
    "zh": "zh-CN",
    "hi": "hi",
    "es": "es",
    "fr": "fr",
    "ar": "ar",
    "pt": "pt",
    "de": "de",
    "ja": "ja",
    "ko": "ko",
}

# Also refresh these existing UI strings when English gained new meaning.
FORCE_REFRESH = {
    "topics_blurb",
    "mastery_blurb",
}

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
        for v in (
            f"XPHX{i}XPHX",
            f"xphx{i}xphx",
            f"Xphx{i}Xphx",
            f"XPHX {i} XPHX",
            f"xphx {i} xphx",
        ):
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
                if attempt + 1 < retries:
                    time.sleep(0.8 * (attempt + 1))
                    continue
                return text
            return out
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            time.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"translate failed: {last_err}")


def main() -> int:
    only = [c for c in sys.argv[1:] if not c.startswith("-")]
    en_pack = json.loads((LANG_DIR / "en.json").read_text(encoding="utf-8"))
    en = en_pack["strings"]
    catalog = json.loads((LANG_DIR / "languages.json").read_text(encoding="utf-8"))
    codes = [L["code"] for L in catalog["languages"] if L["code"] != "en"]
    if only:
        codes = [c for c in codes if c in only]

    cache: dict[tuple[str, str], str] = {}

    for code in codes:
        target = GT_TARGET.get(code)
        if not target:
            print(f"skip {code}: no GT mapping", flush=True)
            continue

        path = LANG_DIR / f"{code}.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        strings = pack["strings"]

        todo: list[str] = []
        for key, src in en.items():
            if key not in strings:
                strings[key] = src
                todo.append(key)
            elif key in FORCE_REFRESH:
                todo.append(key)
            elif strings.get(key) == src:
                todo.append(key)

        # Stable order: UI/btn first, then questions.
        todo = sorted(set(todo), key=lambda k: (0 if k.startswith(("btn_", "feedback_", "calc_", "topics_", "mastery_")) else 1, k))

        print(f"\n=== {code} ({target}): {len(todo)} keys ===", flush=True)
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
                    strings[key] = src
                    continue
                cache[cache_key] = translated
                strings[key] = translated
                time.sleep(0.12)
            done += 1
            if done % 15 == 0 or done == len(todo):
                print(f"  {done}/{len(todo)}", flush=True)
                path.write_text(
                    json.dumps(pack, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )

        pack["strings"] = dict(sorted(strings.items(), key=lambda kv: kv[0]))
        path.write_text(
            json.dumps(pack, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        still = sum(1 for k in en if strings.get(k) == en[k])
        print(f"  done {code}: still_english={still}/{len(en)}", flush=True)

    sys.path.insert(0, str(ROOT / "tools"))
    from split_dictionaries import sync_js_from_json_files

    sync_js_from_json_files()
    print("\nJS packs regenerated.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
