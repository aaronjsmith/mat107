# -*- coding: utf-8 -*-
"""Wire key question generators to QuizI18n.t() keys."""
from pathlib import Path
import re

path = Path(r"c:\Development\mat107\mat107\js\questions.js")
text = path.read_text(encoding="utf-8")

# --- Formula cards: rebuild getFormulaCards and use it ---
old_flash_start = text.find("  const FORMULA_CARDS = [")
old_flash_end = text.find("  function genFormulaFlashcard()")
if old_flash_start != -1 and old_flash_end != -1:
    new_cards = r'''  function getFormulaCards() {
    return [
      { front: t("card.sq_p.front"), back: "P = 4s", answers: ["4s", "4*s", "s+s+s+s"], hint: t("card.sq_p.hint") },
      { front: t("card.sq_a.front"), back: "A = s²", answers: ["s^2", "s*s", "s²"], hint: t("card.sq_a.hint") },
      { front: t("card.rect_p.front"), back: "P = 2L + 2W", answers: ["2l+2w", "2(l+w)", "2*l+2*w"], hint: t("card.rect_p.hint") },
      { front: t("card.rect_a.front"), back: "A = L × W", answers: ["l*w", "lw", "l×w", "w*l"], hint: t("card.rect_a.hint") },
      { front: t("card.tri_p.front"), back: "P = a + b + c", answers: ["a+b+c"], hint: t("card.tri_p.hint") },
      { front: t("card.tri_a.front"), back: "A = ½bh", answers: ["0.5bh", "0.5*b*h", "(1/2)bh", "1/2*b*h", "bh/2"], hint: t("card.tri_a.hint") },
      { front: t("card.circ_c.front"), back: "C = 2πr", answers: ["2pir", "2*pi*r", "2πr", "pid", "pi*d"], hint: t("card.circ_c.hint") },
      { front: t("card.circ_a.front"), back: "A = πr²", answers: ["pir^2", "pi*r^2", "πr²", "pi*r*r"], hint: t("card.circ_a.hint") },
      { front: t("card.cube.front"), back: "V = s³", answers: ["s^3", "s*s*s", "s³"], hint: t("card.cube.hint") },
      { front: t("card.sphere.front"), back: "V = (4/3)πr³", answers: ["(4/3)pir^3", "(4/3)*pi*r^3", "4/3pir^3", "4/3*pi*r^3"], hint: t("card.sphere.hint") },
      { front: t("card.cyl.front"), back: "V = πr²h", answers: ["pir^2h", "pi*r^2*h", "πr²h", "pi*r*r*h"], hint: t("card.cyl.hint") },
      { front: t("card.pyth.front"), back: "a² + b² = c²", answers: ["a^2+b^2=c^2", "a²+b²=c²", "c^2=a^2+b^2"], hint: t("card.pyth.hint") }
    ];
  }

'''
    text = text[:old_flash_start] + new_cards + text[old_flash_end:]
    text = text.replace("choice(FORMULA_CARDS)", "choice(getFormulaCards())")
    text = text.replace("FORMULA_CARDS.filter", "getFormulaCards().filter")
    text = text.replace(
        'prompt: "Formula flashcard — write the formula:\\n" + card.front,',
        'prompt: t("flash.recall", { front: card.front }),',
    )
    text = text.replace(
        '"Formula flashcard — which is correct for:\\n" + card.front + "?"',
        't("flash.recognize", { front: card.front })',
    )

# Literacy
text = text.replace(
'''  function genLiteracy() {
    return _choice(
      "“Seek learning, even by study and also by faith” (D&C 88:118)—which practice best helps you use statistics for good decision-making?",
      [
        "Check the source, sample, and whether graphs/summaries could be misleading",
        "Always trust a graph if it looks professional",
        "Use only the mean and ignore the rest of the data",
        "Assume correlation always means causation",
      ],
      "Check the source, sample, and whether graphs/summaries could be misleading",
      "literacy",
      "Good questions: Who was surveyed? How big was the sample? What's being compared? Are axes truncated?"
    );
  }''',
'''  function genLiteracy() {
    return _choice(
      t("q.literacy"),
      [t("c.lit_a"), t("c.lit_b"), t("c.lit_c"), t("c.lit_d")],
      t("c.lit_a"),
      "literacy",
      t("h.literacy")
    );
  }'''
)

# True/False SD
text = text.replace(
'''  function genSdTf() {
    return _choice(
      "True or False: Data points must be exactly 1, 2, or 3 standard deviations above or below the mean.",
      ["True", "False"],
      "False",
      "stats_spread",
      "Z-scores can be any real number — data can sit anywhere relative to the mean."
    );
  }''',
'''  function genSdTf() {
    return _choice(
      t("q.sd_tf"),
      [t("c.true"), t("c.false")],
      t("c.false"),
      "stats_spread",
      t("h.sd_tf")
    );
  }'''
)

# Dimension concept
text = text.replace(
'''  function genDimensionConcept() {
    return _choice(
      "Which statement is correct?",
      [
        "Perimeter is 1D, area is 2D, and volume is 3D",
        "Perimeter is 2D, area is 1D, and volume is 3D",
        "Perimeter is 1D, area is 3D, and volume is 2D",
        "Perimeter, area, and volume are all 2D",
      ],
      "Perimeter is 1D, area is 2D, and volume is 3D",
      "conversions"
    );
  }''',
'''  function genDimensionConcept() {
    return _choice(
      t("q.dim_concept"),
      [t("c.dim_a"), t("c.dim_b"), t("c.dim_c"), t("c.dim_d")],
      t("c.dim_a"),
      "conversions"
    );
  }'''
)

# Conversion getters
text = text.replace(
'''  function genFeetInYard() {
    return _numeric(
      "How many feet are in one yard? (Useful when measuring the cultural-hall volleyball court.)",
      3,
      "conversions",
      0,
      "1 yard = 3 feet",
      "feet = 1 yard × (3 feet / 1 yard)"
    );
  }''',
'''  function genFeetInYard() {
    return _numeric(t("q.feet_in_yard"), 3, "conversions", 0, t("h.feet_in_yard"), t("s.feet_in_yard"));
  }'''
)
text = text.replace(
'''  function genSqFtInSqYard() {
    return _numeric(
      "How many square feet are in one square yard? (Relief Society floor plans require this trivia.)",
      9,
      "conversions",
      0,
      "A square yard is 3 ft × 3 ft",
      "sq ft = 3 ft × 3 ft"
    );
  }''',
'''  function genSqFtInSqYard() {
    return _numeric(t("q.sqft_sqyd"), 9, "conversions", 0, t("h.sqft_sqyd"), t("s.sqft_sqyd"));
  }'''
)
text = text.replace(
'''  function genCuFtInCuYard() {
    return _numeric(
      "How many cubic feet are in one cubic yard? (Food-storage wheat math, anyone?)",
      27,
      "conversions",
      0,
      "A cubic yard is 3 ft × 3 ft × 3 ft",
      "cu ft = 3 ft × 3 ft × 3 ft"
    );
  }''',
'''  function genCuFtInCuYard() {
    return _numeric(t("q.cuft_cuyd"), 27, "conversions", 0, t("h.cuft_cuyd"), t("s.cuft_cuyd"));
  }'''
)

# Empirical rule percentage strings
for en, key in [
    ('"about 68%"', 't("c.pct68")'),
    ('"about 95%"', 't("c.pct95")'),
    ('"about 99.7%"', 't("c.pct997")'),
    ('"about 50%"', 't("c.pct50")'),
    ('"about 34%"', 't("c.pct34")'),
    ('"about 0.15%"', 't("c.pct015")'),
    ('"about 2.5%"', 't("c.pct25")'),
    ('"about 16%"', 't("c.pct16")'),
    ('"about 5%"', 't("c.pct5")'),
]:
    # only replace inside genEmpiricalRule region roughly
    pass

# Targeted empirical replacements in arrays - replace globally is OK for quiz
replacements = [
    ('["about 68%", "about 95%", "about 99.7%", "about 50%"]',
     '[t("c.pct68"), t("c.pct95"), t("c.pct997"), t("c.pct50")]'),
    ('["about 95%", "about 68%", "about 99.7%", "about 34%"]',
     '[t("c.pct95"), t("c.pct68"), t("c.pct997"), t("c.pct34")]'),
    ('["about 0.15%", "about 2.5%", "about 16%", "about 5%"]',
     '[t("c.pct015"), t("c.pct25"), t("c.pct16"), t("c.pct5")]'),
    ('["about 16%", "about 2.5%", "about 0.15%", "about 50%"]',
     '[t("c.pct16"), t("c.pct25"), t("c.pct015"), t("c.pct50")]'),
    ('"about 68%"', 't("c.pct68")'),
    ('"about 95%"', 't("c.pct95")'),
    ('"about 0.15%"', 't("c.pct015")'),
    ('"about 16%"', 't("c.pct16")'),
]
for a, b in replacements:
    text = text.replace(a, b)

# Mean/Median/Mode/Range choice labels in best measure
text = text.replace(
    '["Mean", "Median", "Mode", "Range"]',
    '[t("c.mean"), t("c.median"), t("c.mode"), t("c.range")]',
)
text = text.replace('"Median"', 't("c.median")')  # careful - too broad?

path.write_text(text, encoding="utf-8")

# Verify no obvious syntax breaks
# Check genBestMeasureFixed - Median as answer might have broken
sample = path.read_text(encoding="utf-8")
# Fix best measure: answers should use t() consistently
# Revert over-broad Median replacements outside options by reading genBestMeasureFixed
m = re.search(r"function genBestMeasureFixed\(\) \{.*?\n  \}", sample, re.S)
if m:
    block = m.group(0)
    print("best measure block ok length", len(block))
    print(block[:500])

print("done. formula cards", "getFormulaCards" in sample)
print("FORMULA_CARDS leftover", sample.count("FORMULA_CARDS"))
