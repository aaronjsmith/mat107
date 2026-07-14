# -*- coding: utf-8 -*-
"""Patch questions.js for i18n hooks."""
from pathlib import Path
import re

path = Path(r"c:\Development\mat107\mat107\js\questions.js")
text = path.read_text(encoding="utf-8")

HELPER = r'''
  function t(key, vars) {
    if (window.QuizI18n && window.QuizI18n.t) {
      return window.QuizI18n.t(key, vars || {});
    }
    return key;
  }

  function buildTopics() {
    var keys = [
      "conversions", "formulas", "perimeter_area", "volume", "pythagorean",
      "scale_rates", "scaling", "stats_center", "stats_spread", "z_scores",
      "distributions", "literacy"
    ];
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      out[keys[i]] = t("topic." + keys[i]);
    }
    return out;
  }

'''

# Insert helper after "use strict";
if "function t(key, vars)" not in text:
    text = text.replace(
        '  "use strict";\n\n  const TOPICS = {',
        '  "use strict";\n' + HELPER + "\n  const TOPICS_FALLBACK = {",
        1,
    )
    # Replace TOPICS_FALLBACK block end usage - keep English labels as fallback for buildTopics
    # Change later references: publicQuestion uses TOPICS -> buildTopics()

# Make TOPICS dynamic via getter pattern at export
text = text.replace(
    "topic_label: TOPICS[q.topic] || q.topic,",
    "topic_label: (buildTopics()[q.topic] || q.topic),",
)

# PI_NOTE usages
text = text.replace("const PI_NOTE = \"Use π = 3.14. Round to the nearest hundredth.\";",
                    "function piNote() { return t(\"pi_note\"); }")
text = text.replace("PI_NOTE", "piNote()")
# Fix accidental double call if any
text = text.replace("piNote()()", "piNote()")
# Fix function name if we replaced inside piNote definition - check
text = text.replace("function piNote() { return t(\"pi_note\"); }", "function piNote() { return t(\"pi_note\"); }", 1)

# calcHelp default tip & header via t when possible - lighter touch: replace CALC_GENERIC constant
old_calc = '''  const CALC_GENERIC =
    "How to enter it (you finish and round):\\n" +
    "TI-36X Pro / Casio: type the setup left → right using × ÷ + − and parentheses.\\n" +
    "Squares: press x² after the number. Square roots: TI press 2nd x² ; Casio press √.\\n" +
    "Decimals: TI press ◄► ; Casio press S⇔D. Round to the place asked—usually hundredths. The hint never shows the final answer.";'''

new_calc = '''  function CALC_GENERIC() {
    return t("calc_generic");
  }'''

if old_calc in text:
    text = text.replace(old_calc, new_calc)
else:
    # try alternate dash
    text = re.sub(
        r'  const CALC_GENERIC =\n(?:    ".*"\s*\+\s*\n)+    ".*";',
        '  function CALC_GENERIC() {\n    return t("calc_generic");\n  }',
        text,
        count=1,
    )

text = text.replace("CALC_GENERIC", "CALC_GENERIC()")
text = text.replace("function CALC_GENERIC()()", "function CALC_GENERIC()")
text = text.replace("return t(\"calc_generic\")()", 'return t("calc_generic")')

# flashcard placeholder
text = text.replace(
    'out.placeholder = "Type the formula (e.g. 2pir or P = 2L+2W)";',
    'out.placeholder = t("flashcard_placeholder");',
)

# Export TOPICS as getter-like: replace TOPICS: TOPICS with function
text = text.replace(
    "  window.QuizQuestions = {\n    TOPICS: TOPICS,",
    "  window.QuizQuestions = {\n    get TOPICS() { return buildTopics(); },",
)

# Internal emptyTopic / progress uses Q.TOPICS - getter ok

# Progress and generators that reference TOPICS const for English labels in emptyTopic -
# questions.js may still have const TOPICS_FALLBACK - find leftover TOPICS[ references except buildTopics
# Replace standalone TOPICS[ with buildTopics()[
text = re.sub(r'(?<!build)TOPICS\[', 'buildTopics()[', text)
# Fix TOPICS_FALLBACK if we broke it
text = text.replace("buildTopics()_FALLBACK", "TOPICS_FALLBACK")
text = text.replace("const buildTopics()_FALLBACK", "const TOPICS_FALLBACK")

# If TOPICS_FALLBACK object remains, keep it but unused; if const TOPICS still exists rename
if "const TOPICS =" in text and "TOPICS_FALLBACK" not in text:
    text = text.replace("const TOPICS =", "const TOPICS_FALLBACK =", 1)

path.write_text(text, encoding="utf-8")
print("patched", path)
print("t() present", "function t(key, vars)" in text)
print("buildTopics present", "function buildTopics" in text)
print("get TOPICS", "get TOPICS()" in text)
print("piNote", "function piNote" in text)
print("CALC_GENERIC fn", "function CALC_GENERIC" in text)
