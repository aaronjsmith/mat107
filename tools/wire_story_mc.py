# -*- coding: utf-8 -*-
"""Wire remaining high-traffic story generators to dictionary keys."""
from pathlib import Path

path = Path(r"c:\Development\mat107\mat107\js\questions.js")
text = path.read_text(encoding="utf-8")

# Pizza double MC choices
old_pizza_choices = '''      [
        "Area becomes 4 times as large",
        "Area doubles",
        "Area triples",
        "Area stays the same",
      ],
      "Area becomes 4 times as large",'''
new_pizza_choices = '''      [
        t("c.pizza_4x"),
        t("c.pizza_2x"),
        t("c.pizza_3x"),
        t("c.pizza_same"),
      ],
      t("c.pizza_4x"),'''
if old_pizza_choices in text:
    text = text.replace(old_pizza_choices, new_pizza_choices)

# Fence rolls
text = text.replace('["50-foot", "100-foot"]', '[t("c.roll_50"), t("c.roll_100")]')
# Only replace answer rolls carefully - peri roll returns rolls variable with English strings
# Keep rolls as "50-foot"/"100-foot" internal then map:
text = text.replace(
    '''    const rolls = peri <= 50 ? "50-foot" : "100-foot";''',
    '''    const rolls = peri <= 50 ? t("c.roll_50") : t("c.roll_100");''',
)

# Carpet cheaper options
text = text.replace(
    '''    const cheaper = costRoll < costYd ? "roll" : "per square yard";''',
    '''    const cheaper = costRoll < costYd ? t("c.carpet_roll") : t("c.carpet_yd");''',
)
text = text.replace('["roll", "per square yard"]', '[t("c.carpet_roll"), t("c.carpet_yd")]')

# Units on a few questions
text = text.replace(',\n        "ft",\n', ',\n        t("unit.ft"),\n')
text = text.replace(',\n      "ft",\n', ',\n      t("unit.ft"),\n')
text = text.replace(',\n      "sq ft",\n', ',\n      t("unit.sq_ft"),\n')
text = text.replace(',\n      "cubic inches",\n', ',\n      t("unit.cu_in"),\n')
text = text.replace(',\n      "inches",\n', ',\n      t("unit.inches"),\n')
text = text.replace(',\n      "dollars",\n', ',\n      t("unit.dollars"),\n')

path.write_text(text, encoding="utf-8")
print("wired story MC bits")
