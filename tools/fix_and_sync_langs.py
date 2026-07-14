# -*- coding: utf-8 -*-
import json
from pathlib import Path

LANG = Path(r"c:/Development/mat107/mat107/lang")

# Fix en.json ending
en_path = LANG / "en.json"
raw = en_path.read_text(encoding="utf-8")
if raw.endswith("}\\n"):
    raw = raw[:-2] + "\n"
elif raw.endswith("}\\n\n"):
    raw = raw[:-3] + "\n"
en_path.write_text(raw if raw.endswith("\n") else raw + "\n", encoding="utf-8")
# Prefer re-dump
en = json.loads(en_path.read_text(encoding="utf-8").replace("}\\n", "}"))
en_path.write_text(json.dumps(en, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

extra = {
    "q.skew_right": "A histogram piles most values on the left with a long tail stretching to the right. How would you describe the distribution?",
    "q.skew_left": "A histogram piles most values on the right with a long tail stretching to the left. How would you describe the distribution?",
    "q.skew_uniform": "Looking at a weather-report style bar chart where daily values stay in a narrow band with no long tail, how would you describe it?",
    "q.skew_effect_follow": "What does this do to mean, median, and mode?",
    "c.skew_right": "Right-skewed",
    "c.skew_left": "Left-skewed",
    "c.skew_uniform": "Roughly uniform / roughly symmetric",
    "c.skew_impossible": "Impossible to say",
    "h.skew_right_effect": "Right-skewed data usually pulls the mean to the right of the median (mean > median > mode, roughly).",
    "h.skew_left_effect": "Left-skewed data usually pulls the mean left of the median (mean < median).",
    "h.skew_uniform_effect": "Mean, median, and mode tend to be close together.",
    "h.skew_shape": "Skew is named for the long tail direction.",
    "c.skew_wrong_a": "Mean, median, and mode are always equal no matter the shape",
    "c.skew_wrong_b": "The mode always equals the range",
    "c.skew_wrong_c": "Skewness only affects the standard deviation, never center measures",
    "q.form_tri_p": "What is the formula for the perimeter of a triangle with sides a, b, and c?",
}
en["strings"].update(extra)
en_path.write_text(json.dumps(en, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

meta = json.loads((LANG / "languages.json").read_text(encoding="utf-8"))
for L in meta["languages"]:
    path = LANG / f"{L['code']}.json"
    text = path.read_text(encoding="utf-8").replace("}\\n", "}")
    data = json.loads(text)
    merged = dict(en["strings"])
    merged.update(data.get("strings", {}))
    data["strings"] = merged
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(L["code"], len(merged))

import sys
sys.path.insert(0, str(Path(r"c:/Development/mat107/mat107/tools")))
from split_dictionaries import sync_js_from_json_files
sync_js_from_json_files()
print("ok")
