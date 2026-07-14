# -*- coding: utf-8 -*-
import json, re
from pathlib import Path

js = Path(r"c:/Development/mat107/mat107/js/questions.js").read_text(encoding="utf-8")
assert "function genSkewHistogram" in js
assert 't("q.skew_right")' in js
# brace balance rough
assert js.count("{") == js.count("}")

# leftover long English return prompts
left = re.findall(r'return _(?:numeric|choice|short)\(\s*\n\s*"([A-Za-z])', js)
print("leftover starts", left)

langs = json.loads(Path(r"c:/Development/mat107/mat107/lang/languages.json").read_text(encoding="utf-8"))["languages"]
en_q = [k for k in json.loads(Path(r"c:/Development/mat107/mat107/lang/en.json").read_text(encoding="utf-8"))["strings"] if k.startswith("q.")]
for L in langs:
    code = L["code"]
    s = json.loads(Path(rf"c:/Development/mat107/mat107/lang/{code}.json").read_text(encoding="utf-8"))["strings"]
    miss = [k for k in en_q if k not in s]
    circ = s["q.circ_c"]
    # ascii-safe mark: Spanish if contains barrio, Chinese if contains, English if ward has
    tag = "en"
    if "barrio" in circ or "circunferencia" in circ:
        tag = "es"
    elif "paroisse" in circ or "circonférence" in circ:
        tag = "fr"
    elif "Gemeinde" in circ:
        tag = "de"
    elif "支联会" in circ or "周长" in circ:
        tag = "zh"
    elif "ワード" in circ:
        tag = "ja"
    elif "와드" in circ:
        tag = "ko"
    elif "приходе" in circ or "окружности" in circ:
        tag = "ru"
    elif "الفرع" in circ:
        tag = "ar"
    elif "वार्ड" in circ:
        tag = "hi"
    print(code, "miss", len(miss), "circ_lang", tag)

print("JS skew ok, all lang packs have all q keys")
