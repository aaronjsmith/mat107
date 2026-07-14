# -*- coding: utf-8 -*-
from pathlib import Path
import re

path = Path(r"c:/Development/mat107/mat107/js/questions.js")
text = path.read_text(encoding="utf-8")

def sub(pattern, repl, label):
    global text
    text2, n = re.subn(pattern, repl, text, count=1, flags=re.S)
    print(label, n)
    text = text2

sub(
    r'return _numeric\(\s*"Sister Jensen is measuring linoleum[\s\S]*?"A = L × W\. On TI-36X Pro / Casio enter length × width, then =\.",',
    'return _numeric(\n      t("q.rect_a", { L: L, W: W }),\n      L * W,\n      "perimeter_area",\n      0,\n      t("h.rect_a"),',
    "rect_a",
)

text = text.replace(
    '"P = 2L + 2W (or 2(L+W)). On TI-36X Pro / Casio enter the expression, then =.",',
    't("h.rect_p"),',
    1,
)

sub(
    r'return _numeric\(\s*"Brother Larsen wants to fence[\s\S]*?Round to the nearest hundredth\.",\s*num\(peri\),\s*"perimeter_area",\s*0\.05,\s*"Convert inches to feet, then P = 2\(L\+W\)\. Enter inches÷12 on the calculator\.",',
    'return _numeric(\n        t("q.fence_need", { ft1: ft1, in1: in1, ft2: ft2, in2: in2 }),\n        num(peri),\n        "perimeter_area",\n        0.05,\n        t("h.fence"),',
    "fence_need",
)

sub(
    r'return _choice\(\s*"Ammon is fencing[\s\S]*?Which roll do you need\?",\s*\[t\("c\.roll_50"\), t\("c\.roll_100"\)\],\s*rolls,\s*"perimeter_area",\s*"Convert dimensions to feet, find the perimeter P = 2\(L\+W\), then choose the smallest roll that is at least P\.",',
    'return _choice(\n      t("q.fence_roll", { ft1: ft1, in1: in1, ft2: ft2, in2: in2 }),\n      [t("c.roll_50"), t("c.roll_100")],\n      rolls,\n      "perimeter_area",\n      t("h.fence_roll"),',
    "fence_roll",
)

sub(
    r'return _numeric\(\s*"Relief Society is canning a legendary cylinder[\s\S]*?piNote\(\),\s*num\(vol\),\s*"volume",\s*0\.02,\s*"V = πr²h, and r = diameter/2\. Type 3\.14 for π \(not the π key\)\.",',
    'return _numeric(\n      t("q.soup", { d: dNum, h: h, pi_note: piNote() }),\n      num(vol),\n      "volume",\n      0.02,\n      t("h.soup"),',
    "soup",
)

# Driveway slope
sub(
    r'return _short\(\s*"The stake-center driveway rises " \+\s*rise \+\s*" ft over a horizontal distance of " \+\s*run \+\s*" ft—steeper than a new missionary’s learning curve\. What is the slope\? Write as a simplified ratio rise:run or as a fraction rise/run\.",\s*answers,\s*"pythagorean",\s*"slope = rise / run \(vertical change over horizontal change\)",',
    'return _short(\n        t("q.drive_slope", { rise: rise, run: run }),\n        answers,\n        "pythagorean",\n        t("h.drive_slope"),',
    "drive_slope",
)

sub(
    r'return _numeric\(\s*"Lehi’s family, if they had asphalt[\s\S]*?Round to the nearest hundredth\. \(Hint from Alma: have faith—and use √\(a² \+ b²\)\.\)",\s*num\(slant\),\s*"pythagorean",\s*0\.05,\s*"Use Pythagorean Theorem: c = √\(a² \+ b²\)\. Square root is 2nd x² on TI-36X Pro; √ on Casio\.",',
    'return _numeric(\n      t("q.drive_len", { rise: rise, run: run }),\n      num(slant),\n      "pythagorean",\n      0.05,\n      t("h.drive_len"),',
    "drive_len",
)

sub(
    r'return _numeric\(\s*"Your family just scored a " \+\s*diagonal \+\s*"-inch TV[\s\S]*?\(TV size is the diagonal, not the spiritual “bigness” of the talks\.\)",\s*num\(height, 1\),\s*"pythagorean",\s*0\.15,\s*"Diagonal is hypotenuse: height = √\(diagonal² − width²\)\. Round to the nearest tenth\.",',
    'return _numeric(\n      t("q.tv", { diagonal: diagonal, width: width }),\n      num(height, 1),\n      "pythagorean",\n      0.15,\n      t("h.tv"),',
    "tv",
)

sub(
    r'return _numeric\(\s*"You’ve got a " \+\s*gallons \+\s*"-gallon food-storage[\s\S]*?metric bottles\.",\s*num\(bottles\),\s*"scale_rates",\s*0\.05,\s*"Convert gallons → liters, then divide by bottle size\.",',
    'return _numeric(\n      t("q.gal_l", { gallons: gallons, bottleL: bottleL }),\n      num(bottles),\n      "scale_rates",\n      0.05,\n      t("h.gal_l"),',
    "gal_l",
)

# Empirical
sub(
    r'"Ages of adults in a \(very hypothetical\) stake directory are roughly normal with mean " \+\s*mean \+\s*" years and SD " \+\s*sd \+\s*" years\. About what percentage are between " \+\s*lo \+\s*" and " \+\s*hi \+\s*"\? \(Don’t say “all of them left the potluck early\.”\)"',
    't("q.emp_1sd", { mean: mean, sd: sd, lo: lo, hi: hi })',
    "emp1",
)
sub(
    r'"Years of church membership for adults in a ward are roughly normal with mean " \+\s*mean \+\s*" and SD " \+\s*sd \+\s*"\. About what percentage fall between " \+\s*lo \+\s*" and " \+\s*hi \+\s*"\?"',
    't("q.emp_2sd", { mean: mean, sd: sd, lo: lo, hi: hi })',
    "emp2",
)
sub(
    r'"Ages of Gospel Doctrine class members are roughly normal with mean " \+\s*mean \+\s*" years and SD " \+\s*sd \+\s*" years\. About what percentage are older than " \+\s*cut \+\s*" \(the rare “I’ve read the footnotes in Isaiah” club\)\?"',
    't("q.emp_3sd", { mean: mean, sd: sd, cut: cut })',
    "emp3",
)
sub(
    r'"Missionary ages in a \(made-up, PG\) data set are roughly normal with mean " \+\s*mean \+\s*" and SD " \+\s*sd \+\s*"\. About what percentage are younger than " \+\s*cut \+\s*"\?"',
    't("q.emp_below", { mean: mean, sd: sd, cut: cut })',
    "emp_below",
)

# hints for empirical
for en, key in [
    ('"Empirical rule: ≈68% within 1 SD of the mean"', 't("h.emp_1sd")'),
    ('"Empirical rule: ≈95% within 2 SD of the mean"', 't("h.emp_2sd")'),
    ('"≈99.7% within 3 SD, so about 0.3% outside total → ~0.15% in each tail"', 't("h.emp_3sd")'),
    ('"Below 1 SD left of mean ≈ half of the 32% outside the middle 68% → ~16%"', 't("h.emp_below")'),
]:
    if en in text:
        text = text.replace(en, key, 1)
        print("hint", key, "ok")

# zscore already may be wired
if 't("q.zscore"' not in text and "A seminary quiz has mean" in text:
    sub(
        r'return _numeric\(\s*"A seminary quiz has mean " \+[\s\S]*?\(Seek learning by study and also by… z\.\)",\s*num\(z\),\s*"z_scores",\s*0\.05,\s*"z = \(x − mean\) / standard deviation\. Enter carefully with parentheses\.",',
        'return _numeric(\n      t("q.zscore", { mean: mean, sd: sd, score: score }),\n      num(z),\n      "z_scores",\n      0.05,\n      t("h.zscore"),',
        "zscore",
    )

path.write_text(text, encoding="utf-8")
print("done")
