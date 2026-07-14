# -*- coding: utf-8 -*-
"""Report which languages still use English story prompts."""
import json
from pathlib import Path

LANG = Path(r"c:/Development/mat107/mat107/lang")
en = json.loads((LANG / "en.json").read_text(encoding="utf-8"))["strings"]
meta = json.loads((LANG / "languages.json").read_text(encoding="utf-8"))

story_keys = [k for k in en if k.startswith(("q.", "h.", "c.", "s.", "card.", "flash."))]
print("story-ish keys", len(story_keys))

for L in meta["languages"]:
    code = L["code"]
    if code == "en":
        continue
    s = json.loads((LANG / f"{code}.json").read_text(encoding="utf-8"))["strings"]
    same = sum(1 for k in story_keys if s.get(k) == en.get(k))
    sample = s.get("q.circ_c", "")[:50]
    print(f"{code}: same_as_en={same}/{len(story_keys)} sample={sample.encode('ascii','replace').decode()}")
