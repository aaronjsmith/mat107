# -*- coding: utf-8 -*-
"""Add English prompt variants (.v2, .v3) for story question keys."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EN = ROOT / "lang" / "en.json"

# Two alternate English wordings per base key (keeps same placeholders).
VARIANTS: dict[str, list[str]] = {
    "q.feet_in_yard": [
        "One yard equals how many feet? (Handy before laying out chairs for stake conference.)",
        "Convert: 1 yard → ? feet. Cultural-hall measuring crew needs the number.",
    ],
    "q.sqft_sqyd": [
        "How many square feet make one square yard? (Floor-plan math for the meetinghouse remodel.)",
        "A square yard covers how many square feet?",
    ],
    "q.cuft_cuyd": [
        "How many cubic feet are in a cubic yard? (Food-storage pantry volume check.)",
        "Convert 1 cubic yard into cubic feet.",
    ],
    "q.rect_p": [
        "Tape off a {L} ft by {W} ft rectangle on the cultural-hall floor. What perimeter of tape do you need?",
        "A rectangular activity zone measures {L} ft × {W} ft. Find its perimeter in feet.",
    ],
    "q.rect_a": [
        "A rectangular classroom is {L} ft by {W} ft. How many square feet of flooring are needed?",
        "Find the area (sq ft) of a {L} ft × {W} ft rectangle in the Primary area.",
    ],
    "q.tri_area": [
        "A triangular plot on a trek map has base {b} and height {h}. What is its area?",
        "Triangle area time: base {b}, height {h}. Round to the nearest hundredth if needed.",
    ],
    "q.circ_c": [
        "A circular Jell-O mold has radius {r} inches. What is its circumference? {pi_note}",
        "Find the circumference of a circle with radius {r}. {pi_note}",
    ],
    "q.circ_a": [
        "A round clock face has radius {r}. What is its area? {pi_note}",
        "Circle area: radius {r}. {pi_note}",
    ],
    "q.lshape_a": [
        "An L-shaped room fits in a {W} × {H} rectangle with a {cutW} × {cutH} corner cut out. What is the L’s area?",
        "Big rectangle {W} by {H}, remove a {cutW} by {cutH} corner. Area of the L-shape?",
    ],
    "q.lshape_p": [
        "An L-shape sits in a {W} × {H} rectangle with a {cutW} × {cutH} notch removed. What is the outer perimeter?",
        "Find the outer perimeter of an L that fits in {W}×{H} with a {cutW}×{cutH} cutout.",
    ],
    "q.fence_need": [
        "Fence a garden {ft1} ft {in1} in by {ft2} ft {in2} in. How many feet of fencing for the perimeter? Round to the nearest hundredth.",
        "Plot size: {ft1}' {in1}\" by {ft2}' {in2}\". Length of fencing around it (feet, hundredths)?",
    ],
    "q.fence_roll": [
        "Garden fence needed for {ft1}' {in1}\" by {ft2}' {in2}\". Rolls come in 50-ft or 100-ft. Which roll do you buy?",
        "Perimeter fencing for {ft1}' {in1}\" × {ft2}' {in2}\". Choose the 50-foot or 100-foot roll.",
    ],
    "q.soup": [
        "A cylindrical can has diameter {d} in and height {h} in. What is its volume? {pi_note}",
        "Cylinder volume: diameter {d} inches, height {h} inches. {pi_note}",
    ],
    "q.drive_slope": [
        "A driveway rises {rise} ft over {run} ft horizontal. What is the slope (rise:run or rise/run, simplified)?",
        "Slope check: rise {rise} ft, run {run} ft. Write a simplified ratio or fraction.",
    ],
    "q.drive_len": [
        "Rise {rise} ft, run {run} ft. What is the slant length of the driveway? Round to the nearest hundredth.",
        "Find the hypotenuse for legs {rise} and {run}. Round to hundredths.",
    ],
    "q.tv": [
        "A TV is labeled {diagonal} inches (diagonal) and is {width} inches wide. How tall is it? Round to the nearest tenth.",
        "Diagonal {diagonal}\", width {width}\". Find the height to the nearest tenth.",
    ],
    "q.gal_l": [
        "You have {gallons} gallons of punch. How many {bottleL}-liter bottles fill it? (1 gal = 3.785 L). Round to hundredths.",
        "Convert {gallons} gal to {bottleL}-L bottles (1 gal = 3.785 L). Round to the nearest hundredth.",
    ],
    "q.map_to_real": [
        "Map scale 1 in : {scaleFt} ft. A trail is {inches} inches on the map. How many real feet is that?",
        "Scale: 1\" = {scaleFt} ft. Map distance {inches}\". Real distance in feet?",
    ],
    "q.real_to_map": [
        "Scale 1 in : {scaleFt} ft. A landmark is {feet} feet away for real. How many inches on the map? Round if needed.",
        "Real distance {feet} ft; scale 1\" : {scaleFt} ft. Map length in inches?",
    ],
    "q.carpet_roll": [
        "Room {L} ft × {W} ft. Carpet roll is {rollW} ft wide at ${cost}/linear ft installed. Total cost (nearest cent)?",
        "Cover {L}'×{W}' with a {rollW}'-wide roll at ${cost} per linear foot. Cost to the nearest cent?",
    ],
    "q.carpet_yd": [
        "Room {L} ft × {W} ft. Carpet is ${cost} per square yard installed. Cost to the nearest cent? (9 sq ft = 1 sq yd)",
        "Floor {L}' by {W}' at ${cost}/sq yd. Total installed cost (nearest cent)?",
    ],
    "q.carpet_cmp": [
        "Room {L}'×{W}'. Option A: {rollW}' roll at ${costLin}/linear ft. Option B: ${costYd}/sq yd. Which is cheaper?",
        "Compare costs for a {L}'×{W}' room — roll ({rollW}' @ ${costLin}/ft) vs sq-yd pricing (${costYd}). Cheaper option?",
    ],
    "q.pizza_cmp": [
        "More pizza area: two {small}-inch pizzas or one {large}-inch pizza? {pi_note}",
        "Compare areas: 2×({small}\" radius pizzas) vs 1×({large}\" pizza). Which wins? {pi_note}",
    ],
    "q.pizza_double": [
        "If you double a pizza’s radius, what happens to its area?",
        "Pizza radius doubles. How does the area change?",
    ],
    "q.ball_double": [
        "A ball holds {base} cubic inches of air. Double the radius—how much air then?",
        "Volume was {base} cu in. New ball has 2× the radius. New volume?",
    ],
    "q.ball_half": [
        "A ball holds {base} cu in. Half the radius—how much air in the smaller ball?",
        "Volume {base} cu in; radius → ½. New volume?",
    ],
    "q.mean": [
        "Data: {ds}. Find the mean. Round to the nearest hundredth if needed.",
        "Compute the average of {ds}.",
    ],
    "q.median": [
        "Data: {ds}. What is the median?",
        "Find the middle value of {ds} after sorting.",
    ],
    "q.mode": [
        "Data: {ds}. What is the mode?",
        "Which value appears most often in {ds}?",
    ],
    "q.range": [
        "Data: {ds}. Find the range (max − min).",
        "What is max − min for {ds}?",
    ],
    "q.range_rule": [
        "Approximate the SD of {ds} with the range rule of thumb. Round to hundredths.",
        "Using s ≈ range/4, estimate the standard deviation of {ds}.",
    ],
    "q.compare_which": [
        "Data Set #1: {d1}\nData Set #2: {d2}\nWhich has more variation by the range rule of thumb?",
        "Compare variation (range/4):\n#1 {d1}\n#2 {d2}\nWhich set varies more?",
    ],
    "q.zscore": [
        "Mean {mean}, SD {sd}. Z-score for x = {score}? Round to hundredths.",
        "Find z for score {score} when μ={mean} and σ={sd}. Round to the nearest hundredth.",
    ],
    "q.emp_1sd": [
        "Roughly normal: mean {mean}, SD {sd}. About what % lie between {lo} and {hi}?",
        "Empirical rule: μ={mean}, σ={sd}. Percent between {lo} and {hi}?",
    ],
    "q.emp_2sd": [
        "Normal-ish data: mean {mean}, SD {sd}. About what % fall between {lo} and {hi}?",
        "≈95% rule check: μ={mean}, σ={sd}. Percent from {lo} to {hi}?",
    ],
    "q.emp_3sd": [
        "Mean {mean}, SD {sd} (approx. normal). About what % are older/greater than {cut}?",
        "Tail question: μ={mean}, σ={sd}. Percent above {cut}?",
    ],
    "q.emp_below": [
        "Approx. normal ages: mean {mean}, SD {sd}. About what % are younger than {cut}?",
        "μ={mean}, σ={sd}. Percent below {cut}?",
    ],
    "q.literacy": [
        "Which habit best supports wise use of statistics?",
        "Best practice for reading studies and graphs?",
    ],
    "flash.recall": [
        "Write the formula for:\n{front}",
        "Recall mode — formula please:\n{front}",
    ],
    "flash.recognize": [
        "Which formula matches:\n{front}?",
        "Pick the correct formula for:\n{front}",
    ],
}


def main() -> None:
    pack = json.loads(EN.read_text(encoding="utf-8"))
    strings = pack["strings"]
    added = 0
    for key, alts in VARIANTS.items():
        if key not in strings:
            print("missing base", key)
            continue
        for i, text in enumerate(alts, start=2):
            vk = f"{key}.v{i}"
            strings[vk] = text
            added += 1
    EN.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"added {added} variant strings")


if __name__ == "__main__":
    main()
