# -*- coding: utf-8 -*-
from pathlib import Path
import re, json

js = Path(r"c:/Development/mat107/mat107/js/questions.js").read_text(encoding="utf-8")
en = json.loads(Path(r"c:/Development/mat107/mat107/lang/en.json").read_text(encoding="utf-8"))["strings"]

# Find multi-line English story concatenations that look like prompts
patterns = [
    r'"Brother ',
    r'"Sister ',
    r'"Relief ',
    r'"Mutual ',
    r'"Primary ',
    r'"Young Men',
    r'"Young Women',
    r'"A youth ',
    r'"Your family',
    r'"You.?ve got',
    r'"A ward ',
    r'"The Primary',
    r'"The cultural',
    r'"The stake',
    r'"Lehi',
    r'"Nephi',
    r'"Ammon ',
    r'"Seminary ',
    r'"Ages of',
    r'"Years of',
    r'"Missionary ',
    r'"Which has more area',
    r'"What happens to the area',
    r'"A hiking',
    r'"A room is',
    r'"Room: ',
    r'"Find the mean',
    r'"Find the median',
    r'"Find the mode',
    r'"Find the range',
    r'"Use the range rule',
    r'"Data Set',
    r'"Using a standard',
    r'"Approximate the z',
    r'"A data distribution',
    r'"A toy ball',
    r'"Which practice',
]
for p in patterns:
    if re.search(p, js):
        print("FOUND", p)

print("t(q. count", js.count('t("q.'))
print("--- functions still with English concat near return _numeric")
# show snippets of remaining English prompts
for m in re.finditer(r'return _(?:numeric|choice|short)\(\s*\n\s*"([^"]{30,80})', js):
    print("PROMPT:", m.group(1)[:80])
