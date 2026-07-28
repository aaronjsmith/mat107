# -*- coding: utf-8 -*-
"""Add unique LDS theme boss strings + themed prompt variants; regenerate en.js."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EN = ROOT / "lang" / "en.json"

# Boss UI key suffixes mirrored from winter.* / default boss_*
BOSS_KEYS = [
    "boss_drill_blocked",
    "boss_fail",
    "boss_fail_practice",
    "boss_invite_mastered",
    "boss_invite_title",
    "boss_miss_msg",
    "boss_ok",
    "boss_progress",
    "boss_retreat_msg",
    "boss_retreat_msg_real",
    "boss_start",
    "boss_start_practice",
    "boss_win",
    "boss_win_again",
    "boss_win_practice",
    "course_boss_cleared",
    "mode_finalboss",
    "mode_finalboss_cleared",
    "mode_finalboss_fighting",
    "mode_finalboss_practice",
    "mode_finalboss_practice_active",
    "mode_finalboss_ready",
]


def boss_pack(name, enemy, place, verb_hit="staggers", verb_win="defeated"):
    """Build themed boss UI strings. {name} = boss title; {enemy} short; {place} stakes."""
    return {
        "boss_drill_blocked": f"Remaster {{topic}} to 10/10 before facing {name} again. Keep practicing that topic.",
        "boss_fail": f"{place} is at risk. {name} slips away on {{topic}} — that topic drops to {{progress}}. Rebuild it to 10/10, then face the challenge again.",
        "boss_fail_practice": f"Practice run abandoned on {{topic}}. Master all topics at 10/10 when you’re ready for the real fight against {name}.",
        "boss_invite_mastered": f"Every topic is mastered at 10/10. {name} awaits — begin now?",
        "boss_invite_title": name,
        "boss_miss_msg": f"Missed {{topic}} — mastery drops to {{progress}}. Stay in the fight: clear a remix to proceed.",
        "boss_ok": f"{enemy} {verb_hit} · {{current}}/{{total}}. Press on for {place}.",
        "boss_progress": f"{name} · {{current}}/{{total}} · {{topic}}",
        "boss_retreat_msg": f"You abandoned the fight on {{topic}}. Remaster it (10/10), then face {name} again — a remix is next.",
        "boss_retreat_msg_real": f"You abandoned the fight on {{topic}} — that topic drops to {{progress}}. Remaster it (10/10), then face {name} again — a remix is next.",
        "boss_start": f"{name} threatens {place}. Answer one unaided question from each topic — no hints. A miss knocks 1 mastery off that topic; clear a remix to keep fighting.",
        "boss_start_practice": f"Practice fight vs {name}: one unaided question per topic — no hints. A miss costs 1 mastery; clear a remix to continue. Master every topic at 10/10 for the true challenge.",
        "boss_win": f"{name} is {verb_win} — {place} is safe. You’re ready for the quiz.",
        "boss_win_again": f"{place} stands again. Still quiz-ready.",
        "boss_win_practice": f"Practice victory! Master every topic at 10/10, then face {name} again to truly secure {place}.",
        "course_boss_cleared": f"{name} cleared",
        "mode_finalboss": name,
        "mode_finalboss_cleared": f"{place} is safe ✓ · ready for the quiz",
        "mode_finalboss_fighting": f"Facing {name}…",
        "mode_finalboss_practice": f"Practice: {name}",
        "mode_finalboss_practice_active": "Practice fight in progress",
        "mode_finalboss_ready": f"Face {name} · defend {place}",
    }


THEMES = {
    "zarahemla": boss_pack(
        "Gadianton Robber", "The robber", "Zarahemla", verb_win="defeated"
    ),
    "institute": boss_pack(
        "Rumors of the Adversary",
        "The rumor",
        "Institute class",
        verb_hit="falters",
        verb_win="silenced",
    ),
    "lots": boss_pack(
        "Fear Before Battle",
        "Fear",
        "Helaman’s camp",
        verb_hit="recedes",
        verb_win="overcome",
    ),
    "handcart": boss_pack(
        "Rocky Ridge",
        "The ridge",
        "the handcart company",
        verb_hit="loosens",
        verb_win="crossed",
    ),
    "singles": boss_pack(
        "Lifestyle Creep",
        "The creep",
        "your singles-ward budget",
        verb_hit="shrinks",
        verb_win="tamed",
    ),
    "mite": boss_pack(
        "The Empty Storehouse",
        "Scarcity",
        "family preparedness",
        verb_hit="recedes",
        verb_win="filled",
    ),
    "flock": boss_pack(
        "The Wolf at the Fold",
        "The wolf",
        "the flock",
        verb_hit="staggers",
        verb_win="driven off",
    ),
    "gathering": boss_pack(
        "The Scattering",
        "The scatter",
        "the Gathering",
        verb_hit="thins",
        verb_win="reversed",
    ),
    "bountiful": boss_pack(
        "The Tempest",
        "The storm",
        "Nephi’s ship",
        verb_hit="breaks",
        verb_win="calmed",
    ),
    "deseret": boss_pack(
        "Debt Bondage",
        "Bondage",
        "Deseret self-reliance",
        verb_hit="loosens",
        verb_win="broken",
    ),
}

# Winter already exists — refine place wording only if missing keys.
WINTER_EXTRA = {
    "winter.boss_fail": "You fall behind on {topic} — that topic drops to {progress}. Rebuild it to 10/10, then try the winter crossing again.",
}

META = {
    "assessment.1.summary": "Geometry, conversions, and statistics — Weeks 1–2 / Assessment 1 with hints and the Gadianton Robber boss fight (Zarahemla theme).",
    "assessment.1.badge": "Weeks 1–2 · Zarahemla",
    "assessment.2.title": "Assessment 2",
    "assessment.2.badge": "Weeks 3–4 · Bountiful",
    "assessment.2.page_title": "Ensign College MAT 107 · Assessment 2 practice",
    "assessment.2.brand_sub": "Ensign College MAT 107 · Assessment 2 practice",
    "assessment.2.summary": "Probability, sequences, and linear/exponential models — Weeks 3–4 / Assessment 2 with the Tempest boss fight (Bountiful theme).",
    "assessment.3.title": "Assessment 3",
    "assessment.3.badge": "Weeks 5–7 · Deseret",
    "assessment.3.page_title": "Ensign College MAT 107 · Assessment 3 practice",
    "assessment.3.brand_sub": "Ensign College MAT 107 · Assessment 3 practice",
    "assessment.3.summary": "Personal finance, savings & credit, and insurance — Weeks 5–7 / Assessment 3 with the Debt Bondage boss fight (Deseret theme).",
    "week.34.title": "Weeks 3–4 · Probability & Functions",
    "week.34.blurb": "Probability, sequences, and linear/exponential models — Assessment 2 content.",
    "week.57.title": "Weeks 5–7 · Finance, Savings & Insurance",
    "week.57.blurb": "Budgets, compound growth, loans, and insurance — Assessment 3 content.",
    "hw.geo.badge": "Weeks 1–2 · Meetinghouse",
    "hw.geo.summary": "Meetinghouse geometry homework — conversions, formulas, perimeter & area, volume, Pythagorean, scale, and scaling (ward culture theming).",
    "hw.geo.brand_sub": "Ensign College MAT 107 · Meetinghouse geometry HW",
    "hw.stats.badge": "Weeks 1–2 · Institute",
    "hw.stats.summary": "Institute / ward-metrics statistics — center, spread, z-scores, distributions, literacy, and the Rumors of the Adversary boss fight.",
    "hw.stats.brand_sub": "Ensign College MAT 107 · Institute statistics HW",
    "lesson.prob.badge": "Week 3 · Casting Lots",
    "lesson.prob.summary": "Probability practice with casting-lots / stripling readiness theming — and the Fear Before Battle boss fight.",
    "lesson.prob.brand_sub": "Ensign College MAT 107 · Week 3 · Casting Lots",
    "lesson.41.badge": "Lesson 4.1 · Winter Crossing",
    "lesson.fn2.badge": "Week 4 · Handcart",
    "lesson.fn2.summary": "Linear & exponential models with handcart / missionary-growth theming — and the Rocky Ridge boss fight.",
    "lesson.fn2.brand_sub": "Ensign College MAT 107 · Week 4 · Handcart trail",
    "lesson.finance.badge": "Week 5 · Singles Ward",
    "lesson.finance.summary": "Singles-ward / student-housing budgets, percents, and spreadsheet totals — vs Lifestyle Creep.",
    "lesson.finance.brand_sub": "Ensign College MAT 107 · Week 5 · Singles ward budget",
    "lesson.savings.badge": "Week 6 · Widow’s Mite",
    "lesson.savings.summary": "Compound growth, annuities, loans & APR with temple/family preparedness theming — vs The Empty Storehouse.",
    "lesson.savings.brand_sub": "Ensign College MAT 107 · Week 6 · Preparedness",
    "lesson.insurance.badge": "Week 7 · The Flock",
    "lesson.insurance.summary": "Premiums, deductibles, and expected value as stewardship — protect the flock from The Wolf at the Fold.",
    "lesson.insurance.brand_sub": "Ensign College MAT 107 · Week 7 · Stewardship",
    "lesson.overview.badge": "Full course · Gathering",
    "lesson.overview.summary": "All MAT 107 skills in one quiz — culminating Gathering theme vs The Scattering boss fight.",
    "lesson.overview.brand_sub": "Ensign College MAT 107 · Gathering overview",
}

# Themed course prompts (c.q.*)
COURSE_THEMED = {
    # --- lots (probability) ---
    "c.q.prob_simple.lots": "Helaman’s captains cast lots among {total} equally likely tokens; {fav} are marked for night watch. What is P(drawing a night-watch token)? Enter as a decimal.",
    "c.q.prob_complement.lots": "If P(a stripling is chosen for the first wave) = {p}, what is P(not chosen)?",
    "c.q.prob_and_indep.lots": "Independent trials: P(lot A) = {p1} and P(lot B) = {p2}. Find P(both).",
    "c.q.prob_or_exclusive.lots": "Mutually exclusive assignments: P(scout) = {p1}, P(messenger) = {p2}. Find P(scout or messenger).",
    "c.q.perm.lots": "How many ways can Helaman assign {r} distinct roles from {n} stripling warriors? (Permutations)",
    "c.q.comb.lots": "How many ways can you choose a committee of {r} from {n} for casting lots? (Combinations)",
    "c.q.prob_dice.lots": "A fair six-sided lot-stone is rolled once. What is P({event})? Enter as a decimal.",
    "c.q.prob_card.lots": "One token is drawn from a standard 52-card teaching deck. What is P({event})? Enter as a decimal.",
    "c.q.prob_wo_replace.lots": "A pouch has {red} red and {blue} blue lots ({total} total). Two are drawn without replacement. What is P(both red)? Enter as a decimal.",
    "c.q.prob_or_inclusive.lots": "P(A) = {pA}, P(B) = {pB}, P(A and B) = {pBoth}. Find P(A or B) for overlapping camp duties.",
    "c.q.counting_menu.lots": "A camp mess lets you pick 1 of {a} mains, 1 of {b} sides, and 1 of {c} drinks. How many different meals?",
    # --- handcart (functions 2) ---
    "c.q.linear_eval.handcart": "Handcart distance model f(x) = {m}x + {b} (miles). Find f({x}).",
    "c.q.linear_model.handcart": "You start {start} meters from camp and walk at {rate} m/min toward the next ridge. How far from camp after {t} minutes?",
    "c.q.slope_points.handcart": "Find the slope of the trail grade through ({x1}, {y1}) and ({x2}, {y2}).",
    "c.q.linear_table.handcart": "A linear handcart-progress model has (0, {b}), ({x1}, {y1}), ({x2}, {y2}). Find f({w}).",
    "c.q.linear_points_eval.handcart": "A line through ({x1}, {y1}) and ({x2}, {y2}) models miles vs days. Find f({x}).",
    "c.q.exp_growth.handcart": "A missionary companionship starts with {a} contacts and grows by {pct}% each week. Value after {n} weeks? Round to hundredths.",
    "c.q.exp_decay.handcart": "Flour stores start at {a} lb and decrease by {pct}% each week on the trail. Amount after {n} weeks? Round to hundredths.",
    "c.q.exp_eval.handcart": "Evaluate f(n) = {a}·({r})^{n} for handcart supply model n = {n}. Round to hundredths if needed.",
    "c.q.simple_interest.handcart": "A trek fund of ${P} earns {pct}% simple interest for {t} years. Account value A = P(1+rt)?",
    "c.q.compound_once.handcart": "Invest ${P} at {pct}% compounded annually for {t} years (mission savings). Ending balance? Round to nearest cent.",
    # --- singles (finance) ---
    "c.q.budget_surplus.singles": "Singles-ward take-home is ${income}. Expenses: rent ${rent}, food ${food}, other ${other}. Find total expenses and surplus (or deficit).",
    "c.q.pct_income.singles": "A ${expense} expense (student housing or Fast Sunday groceries) is what percent of ${income} monthly income? Round to hundredths of a percent.",
    "c.q.discount_tax.singles": "A deal at the mall costs ${price}. Take {disc}% off, then add {tax}% sales tax. Final price? Round to nearest cent.",
    "c.q.excel_sum.singles": "Budget sheet cells: rent {a}, food {b}, transport {c}, misc {d}. What does =SUM of those four equal?",
    "c.q.excel_net.singles": "Income cell = {income}, total expenses = {expenses}. Net cash flow (income − expenses)?",
    # --- mite (savings) ---
    "c.q.fv_compound.mite": "You set aside ${P} for family preparedness at {pct}% annual compound interest for {n} years. Future value? Round to nearest cent.",
    "c.q.annuity_fv.mite": "You deposit ${pmt} monthly for {months} months into a preparedness account at {apr}% APR compounded monthly. Approximate FV (nearest dollar).",
    "c.q.loan_cost.mite": "A ${principal} education loan is paid ${monthly}/month for {months} months. Find total paid and interest cost.",
    "c.q.apr_approx.mite": "You borrow ${p} for {months} months and pay a ${fee} finance fee. Approximate APR as a percent.",
    # --- flock (insurance) ---
    "c.q.oop.flock": "A claim is ${claim}. Deductible ${deductible}; coinsurance {coinsure}% above deductible. Out-of-pocket cost? (Stewardship math.)",
    "c.q.premium_year.flock": "A policy that protects the household costs ${monthly}/month. Annual premium?",
    "c.q.ev_insure.flock": "A loss of ${loss} occurs with probability {p}. Annual premium ${premium}. Expected loss if uninsured ≈ ${expected}. Enter that expected loss, then choose insurance vs self-insure.",
}

INSTITUTE_STATS = {
    "q.mean.institute": "Institute midterm practice scores: {ds}. Find the mean. Round to the nearest hundredth if needed.",
    "q.median.institute": "Weekly Institute attendance counts: {ds}. Find the median after sorting.",
    "q.mode.institute": "Favorite Institute lesson topics (coded): {ds}. Find the mode.",
    "q.range.institute": "Scripture-reading minutes logged by classmates: {ds}. Find the range (max − min).",
    "q.range_rule.institute": "Approximate the SD of Institute quiz scores {ds} using the range rule of thumb. Round to hundredths.",
    "q.best_cat.institute": "Which measure of center is best for favorite hymn / categorical data in Institute class?",
    "q.best_outliers.institute": "Which measure of center is usually best when one Institute score is an extreme outlier?",
    "q.best_sym.institute": "Which measure of center uses every value and fits roughly symmetric Institute exam data?",
    "q.compare_sd.institute": "{which}: {ds}. Approximate the SD with the range rule (Institute section tallies).",
    "q.compare_which.institute": "Data Set #1: {d1}\nData Set #2: {d2}\nUsing the range rule, which has more variation? (Compare two Institute sections.)",
    "q.emp_1sd.institute": "Ages in a (hypothetical) Institute roster are roughly normal with mean {mean} and SD {sd}. About what % are between {lo} and {hi}?",
    "q.emp_2sd.institute": "Years of Church membership among Institute students are roughly normal with mean {mean} and SD {sd}. About what % fall between {lo} and {hi}?",
    "q.emp_3sd.institute": "Gospel Doctrine quiz ages are roughly normal with mean {mean} and SD {sd}. About what % are older than {cut}?",
    "q.emp_below.institute": "Mission prep ages (made-up) are roughly normal with mean {mean} and SD {sd}. About what % are younger than {cut}?",
    "q.literacy.institute": "Rumors spread fast—which practice best helps you use statistics wisely against misleading claims?",
    "q.zscore.institute": "An Institute quiz has mean {mean} and SD {sd}. What is the z-score for {score}? Round to hundredths.",
    "q.pct_from_z.institute": "Using the Z table, about what percentile is z = {z} among Institute readiness scores? Round to a whole number.",
    "q.z_from_pct.institute": "Using the table, what z-score corresponds to percentile {pct} for Institute scores?",
    "q.sd_tf.institute": "True or False: Data points must be exactly 1, 2, or 3 SD from the mean. (Institute scores can sit anywhere.)",
    "q.skew_left.institute": "A histogram of study minutes piles on the right with a long left tail. How would you describe it?",
    "q.skew_right.institute": "A histogram of “last-minute cram” minutes piles on the left with a long right tail. Describe it.",
    "q.skew_uniform.institute": "Daily Institute check-in counts stay in a narrow band with no long tail. Describe the distribution.",
    "q.midrange.institute": "Find the midrange of Institute section scores {ds}.",
}


def main() -> None:
    data = json.loads(EN.read_text(encoding="utf-8"))
    s = data["strings"]
    added = 0

    def put(k: str, v: str) -> None:
        nonlocal added
        if s.get(k) != v:
            s[k] = v
            added += 1

    for theme, pack in THEMES.items():
        for suffix, text in pack.items():
            put(f"{theme}.{suffix}", text)

    for k, v in WINTER_EXTRA.items():
        put(k, v)

    for k, v in META.items():
        put(k, v)

    for k, v in COURSE_THEMED.items():
        put(k, v)

    for k, v in INSTITUTE_STATS.items():
        put(k, v)

    # Keep keys sorted for diffs
    data["strings"] = dict(sorted(s.items(), key=lambda kv: kv[0].lower()))
    EN.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {added} keys in {EN}")

    sys.path.insert(0, str(ROOT / "tools"))
    from split_dictionaries import sync_js_from_json_files

    sync_js_from_json_files()
    print("Regenerated lang/*.js")


if __name__ == "__main__":
    main()
