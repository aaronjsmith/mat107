# -*- coding: utf-8 -*-
"""Replace hardcoded story prompts with t() template calls."""
from pathlib import Path
import re

path = Path(r"c:\Development\mat107\mat107\js\questions.js")
text = path.read_text(encoding="utf-8")

replacements = [
    # genRectanglePa - perimeter and area prompts are multi-line - skip complex
    # L-shape area
    (
        re.compile(
            r'prompt:\s*\n\s*"The bishopric office remodel left an L-shaped floor plan that fits in a " \+\s*\n\s*W \+\s*\n\s*" × " \+\s*\n\s*H \+\s*\n\s*" rectangle, with a " \+\s*\n\s*cutW \+\s*\n\s*" × " \+\s*\n\s*cutH \+\s*\n\s*" rectangle cut from one corner for the elusive “emergency cookies” closet\. What is the area of the L-shape\?",',
            re.M,
        ),
        'prompt: t("q.lshape_a", { W: W, H: H, cutW: cutW, cutH: cutH }),',
    ),
]

# Simpler line-oriented manual replacements for hints that are static
simples = [
    ('hint: "Area of L = area of big rectangle − area of cut piece",', 'hint: t("h.lshape_a"),'),
    (
        'hint:\n        "Walking the outside edge: the cut adds and removes edges that cancel — P = 2(W+H)",',
        'hint: t("h.lshape_p"),',
    ),
]

for a, b in simples:
    if a in text:
        text = text.replace(a, b)
        print("replaced hint", a[:40])

for rx, repl in replacements:
    text2, n = rx.subn(repl, text, count=1)
    if n:
        text = text2
        print("regex replaced", n)
    else:
        print("regex miss", repl[:40])

# Z-score prompt
old_z = '''    return _numeric(
      "A seminary quiz has mean " +
        mean +
        " and standard deviation " +
        sd +
        ". What is the z-score for a score of " +
        score +
        "? Round to the nearest hundredth. (Seek learning by study and also by… z.)",
      num(z),
      "z_scores",
      0.05,
      "z = (x − mean) / standard deviation. Enter carefully with parentheses.",'''
new_z = '''    return _numeric(
      t("q.zscore", { mean: mean, sd: sd, score: score }),
      num(z),
      "z_scores",
      0.05,
      t("h.zscore"),'''
if old_z in text:
    text = text.replace(old_z, new_z)
    print("zscore ok")
else:
    print("zscore miss")

path.write_text(text, encoding="utf-8")
print("written")
