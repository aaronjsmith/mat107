# -*- coding: utf-8 -*-
"""Add Assessment 3 (Deseret) catalog + review question strings; regenerate en.js."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EN = ROOT / "lang" / "en.json"


def boss_pack(name, enemy, place, verb_hit="staggers", verb_win="defeated"):
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


STRINGS = {
    "btn_review": "Assessment 3 review",
    "assessment.3.title": "Assessment 3",
    "assessment.3.badge": "Weeks 5–7 · Deseret",
    "assessment.3.page_title": "Ensign College MAT 107 · Assessment 3 practice",
    "assessment.3.brand_sub": "Ensign College MAT 107 · Assessment 3 practice",
    "assessment.3.summary": "Personal finance, savings & credit, and insurance — Weeks 5–7 / Assessment 3 with the Debt Bondage boss fight (Deseret theme).",
    "week.57.title": "Weeks 5–7 · Finance, Savings & Insurance",
    "week.57.blurb": "Budgets, compound growth, loans, and insurance — Assessment 3 content.",
    # Fields
    "c.field.k401_contrib": "401(k) contribution",
    "c.field.taxes_total": "Total taxes withheld",
    "c.field.takehome": "Monthly take-home pay",
    "c.field.max_consumer": "Max affordable consumer debt payment",
    "c.field.total_financed": "Total financed",
    "c.field.monthly_payment": "Monthly payment",
    "c.field.total_paid_bank": "Total paid back to the bank",
    "c.field.cost_of_credit": "Cost of credit",
    "c.field.injury_payout": "Injury payout by insurer",
    "c.field.property_payout": "Property-damage payout",
    # Prompts
    "c.q.afford_car": "Gross pay is ${gross}/month, income tax is {tax}%, and affordable debt is {debt}% of take-home. You already have ${existing}/month in consumer debt. What monthly car payment can you afford?",
    "c.q.afford_car.deseret": "Deseret stewardship: gross ${gross}/month, tax {tax}%, affordable debt {debt}% of take-home, existing consumer debt ${existing}. Affordable monthly car payment?",
    "c.q.takehome_debt": "Gross salary ${gross}/month. Deductions: {k401}% to 401(k), {fed}% federal income tax, {ss}% Social Security, {med}% Medicare, {state}% state tax. Find 401(k) contribution, total taxes, take-home, and max consumer credit payment (20% of take-home).",
    "c.q.takehome_debt.deseret": "Household gross ${gross}/month. Put {k401}% in 401(k); withhold {fed}% federal, {ss}% Social Security, {med}% Medicare, {state}% state. Find 401(k), taxes, take-home, and 20% max consumer debt payment.",
    "c.q.debt_guideline": "What guideline does the lending industry commonly use to decide if you can “afford” consumer debt?",
    "c.q.months_to_save": "You put ${pmt} monthly into an account earning {apr}% APR compounded monthly. How many months to accumulate ${goal} (round up to a whole number)?",
    "c.q.months_to_save.deseret": "You set aside ${pmt}/month at {apr}% APR (monthly compounding) toward a ${goal} cash purchase. Months needed (round up)?",
    "c.q.mortgage_credit": "Home price ${price}, down payment ${down}. Borrow the rest plus a {feePct}% loan/closing fee on the amount after the down payment. Rate {apr}% for {years} years. Find total financed, monthly payment, total paid to the bank, and cost of credit.",
    "c.q.extra_pmt_months": "Mortgage principal ${principal} at {apr}% for {years} years. If you pay an extra ${extra} each month, how many months to pay it off? Round to the nearest whole number.",
    "c.q.car_loan_pmt": "Finance ${principal} at {apr}% APR compounded monthly for {years} years. What is the monthly payment?",
    "c.q.car_loan_pmt.deseret": "A ${principal} auto loan at {apr}% APR (monthly compounding) for {years} years — monthly payment?",
    "c.q.compound_freq": "Invest ${P} at {pct}% per year for {years} years, compounded {freq}. Future value? Round to the nearest cent.",
    "c.q.compound_freq.deseret": "College/preparedness fund: ${P} at {pct}% for {years} years, compounded {freq}. Ending balance (nearest cent)?",
    "c.q.present_value": "What is the present value of ${fv} received in {years} years at {pct}% compounded {freq}? Round to the nearest cent.",
    "c.q.excel_rel": "When do you use a relative cell reference (like A1) in a spreadsheet?",
    "c.q.excel_abs": "When do you use an absolute cell reference (like $A$1) in a spreadsheet?",
    "c.q.rate_divisor": "When interest is compounded {kind}, what do you divide the annual RATE by?",
    "c.q.bond_yield": "You buy a bond for ${price} with face value ${face} and coupon rate {coupon}%. What is your current yield as a percent?",
    "c.q.liability_payout": "A {policy} auto liability policy covers an accident with {injured} injured people at ${injury} each and ${property} property damage. How much does the insurer pay for injuries and for property?",
    "c.q.health_coinsure": "Health insurance pays {coinsure}% of medical costs. One claim is ${claim1} and other family costs are ${claim2}. How much does the insurer pay (nearest whole dollar)?",
    "c.q.dink_need": "You provide {yourPct}% of family income (spouse {spousePct}%), no children. Total income ${income}/year. Funeral expense ${funeral}; debts ${debts}. Using the DINK method, how much life insurance do you need for yourself?",
    "c.q.dink_need.deseret": "DINK stewardship: you earn {yourPct}% of ${income} household income (spouse {spousePct}%), funeral ${funeral}, debts ${debts}. Life insurance need for yourself (your % of debts + funeral)?",
    "c.q.policy_limits": "What do the numbers in a 100/250/50 car insurance policy mean?",
    "c.q.mortgage_not_all_pi": "When you submit a typical mortgage payment, not all of it goes to paying principal and interest on the loan. True or false?",
    "c.q.self_insurance": "What is self-insurance?",
    "c.q.stock_chars": "What are the characteristics of a share of stock, and what does it provide?",
    "c.q.bond_chars": "What are the characteristics of bonds, and what do they provide you?",
    "c.q.six_keys": "Which set best matches the six keys to financial success taught in this course?",
    "c.q.retire_rule": "Based on the study-guide rule of thumb, about how much of your monthly gross income do you need after you retire?",
    "c.q.consumer_debt_types": "Which set best names types of consumer debt (and what is usually not counted as consumer debt)?",
    "c.q.takehome_deductions": "Which items reduce gross income when calculating take-home pay?",
    "c.q.cost_credit_steps": "Which list correctly gives the five steps for calculating the cost of credit?",
    "c.q.lifelong_principles": "What are the four lifelong financial principles?",
    "c.q.credit_pros_cons": "Which statement best summarizes advantages and disadvantages of credit?",
    "c.q.primary_alt_invest": "Which pairing correctly identifies primary vs alternate investments?",
    "c.q.financially_secure": "To become financially secure requires that you put your money to work. In order to become financially secure you need to become financially self-reliant. True or false?",
    # Hints
    "c.h.afford_car": "Find take-home after tax, take 15% of that, then subtract existing consumer debt.",
    "c.h.takehome_debt": "Apply each percent to gross; take-home excludes 401(k) and taxes; max consumer debt is 20% of take-home.",
    "c.h.debt_guideline": "Consumer debt should stay within about 15–20% of take-home pay.",
    "c.h.months_to_save": "Use the ordinary annuity formula and solve for n; always round up.",
    "c.h.mortgage_credit": "Financed = (price − down) + fee; then amortizing PMT, total paid, and cost of credit = total − financed.",
    "c.h.extra_pmt_months": "Add the extra to the normal payment, then solve the amortization formula for n.",
    "c.h.car_loan_pmt": "Use monthly rate APR/12 and n = years×12 in the loan payment formula.",
    "c.h.compound_freq": "Divide the annual rate by m and multiply years by m.",
    "c.h.present_value": "Discount the future amount: PV = FV ÷ (1 + r/m)^(m·t).",
    "c.h.excel_refs": "Relative references move with the formula; absolute references stay locked with $.",
    "c.h.rate_divisor": "Match compounding frequency: daily÷365, monthly÷12, quarterly÷4, annually÷1.",
    "c.h.bond_yield": "Yield ≈ annual coupon payment ÷ what you paid for the bond.",
    "c.h.liability_payout": "Cap each person’s injury at the per-person limit, then cap the accident total; property has its own limit.",
    "c.h.health_coinsure": "Add covered costs, then multiply by the insurer’s percent.",
    "c.h.dink_need": "DINK: your percentage of the debts + your funeral expense.",
    "c.h.policy_limits": "Per-person bodily / per-accident bodily / property damage (in thousands).",
    "c.h.mortgage_not_all_pi": "Escrow often adds property tax and homeowners insurance.",
    "c.h.self_insurance": "You retain the risk and fund losses yourself.",
    "c.h.stock_chars": "Equity ownership with possible dividends and price changes.",
    "c.h.bond_chars": "Creditor claim with coupon interest and face value at maturity.",
    "c.h.six_keys": "Pay the Lord first, pay yourself second, spend less than you earn, save/invest the difference, collect interest, develop discipline.",
    "c.h.retire_rule": "Study guide: about 75% of monthly gross income after retirement.",
    "c.h.consumer_debt_types": "Auto loans and store credit count; mortgages, tuition, insurance, and rent usually do not.",
    "c.h.takehome_deductions": "Taxes, FICA, 401(k), and other payroll deductions — not rent or groceries.",
    "c.h.cost_credit_steps": "Final step: cost of credit = total paid back − amount financed.",
    "c.h.lifelong_principles": "Goals, budget, net worth, and records.",
    "c.h.credit_pros_cons": "Buy now / float vs interest, obligation, and risk to assets.",
    "c.h.primary_alt_invest": "Primary markets vs collectibles/metals/real estate.",
    "c.h.financially_secure": "Self-reliance means putting money to work.",
    # Choices
    "c.c.true": "True",
    "c.c.false": "False",
    "c.c.debt_10": "About 10% of take-home pay",
    "c.c.debt_15": "About 15% of take-home pay",
    "c.c.debt_15_20": "About 15–20% of take-home (net) income",
    "c.c.debt_20": "About 20% of gross pay",
    "c.c.debt_20_gross": "About 20% of gross pay",
    "c.c.debt_28": "About 28% of gross pay (housing only)",
    "c.c.freq_annually": "annually",
    "c.c.freq_semiannually": "semiannually",
    "c.c.freq_quarterly": "quarterly",
    "c.c.freq_monthly": "monthly",
    "c.c.freq_weekly": "weekly",
    "c.c.freq_daily": "daily",
    "c.c.excel_rel_ans": "When the formula should adjust as you copy it to other cells",
    "c.c.excel_abs_ans": "When a cell (like a tax rate) must stay fixed as you copy the formula",
    "c.c.excel_mixed_ans": "Only when printing the sheet",
    "c.c.excel_named_ans": "Only inside pivot tables",
    "c.c.div_365": "365 (or 360 in some bank conventions)",
    "c.c.div_12": "12",
    "c.c.div_4": "4",
    "c.c.div_1": "1 (do not divide)",
    "c.c.div_52": "52",
    "c.c.policy_100_250_50": "$100,000 bodily injury per person / $250,000 bodily injury per accident / $50,000 property damage",
    "c.c.policy_wrong_premium": "$100 premium / $250 deductible / $50 copay",
    "c.c.policy_wrong_deductible": "$100,000 deductible / $250,000 premium / $50,000 coinsurance",
    "c.c.policy_wrong_life": "$100,000 life / $250,000 health / $50,000 disability",
    "c.c.self_ins_def": "Setting aside your own money to cover possible losses instead of buying a policy",
    "c.c.self_ins_wrong_policy": "Buying the highest-limit policy available",
    "c.c.self_ins_wrong_gov": "Letting the government pay all medical bills",
    "c.c.self_ins_wrong_employer": "Relying only on employer life insurance",
    "c.c.stock_ans": "Ownership in a company; may provide dividends and/or capital gains (with risk of loss)",
    "c.c.stock_wrong_debt": "A loan you make to a company that must pay fixed interest",
    "c.c.stock_wrong_fdic": "An FDIC-insured deposit with a guaranteed return",
    "c.c.stock_wrong_fixed": "A contract that always pays a fixed coupon and returns face value",
    "c.c.bond_ans": "A loan to an issuer; typically pays coupon interest and returns face value at maturity",
    "c.c.bond_wrong_ownership": "Ownership shares with voting rights and unlimited upside only",
    "c.c.bond_wrong_vote": "Always includes voting control of the company",
    "c.c.bond_wrong_unlimited": "Never pays interest and never matures",
    "c.c.six_keys_ans": "Pay the Lord first; pay yourself second; spend less than you earn; save and invest the difference; do not pay interest — collect it instead; develop the will, desire, and discipline to be a financial success",
    "c.c.six_keys_wrong_debt": "Maximize credit cards, refinance endlessly, and spend raises immediately",
    "c.c.six_keys_wrong_lottery": "Rely on lottery winnings and payday loans",
    "c.c.six_keys_wrong_spend": "Ignore budgets and only track investments after age 50",
    "c.c.retire_70_80": "About 70–80% of pre-retirement income",
    "c.c.retire_75": "About 75% of monthly gross income",
    "c.c.retire_50": "About 50% of pre-retirement income",
    "c.c.retire_100": "Exactly 100% of pre-retirement income",
    "c.c.retire_25": "About 25% of pre-retirement income",
    "c.c.consumer_debt_ans": "Department store credit and auto loans (not home loans, tuition, insurance, or rent)",
    "c.c.consumer_debt_wrong_mortgage": "Home mortgages and property taxes only",
    "c.c.consumer_debt_wrong_rent": "Rent and grocery bills",
    "c.c.consumer_debt_wrong_tuition": "Tuition and insurance premiums only",
    "c.c.takehome_ded_ans": "Federal/state/local income tax, 401(k), Medicare, Social Security, and other payroll deductions",
    "c.c.takehome_ded_wrong_rent": "Rent, groceries, and entertainment only",
    "c.c.takehome_ded_wrong_grocery": "Only charitable donations",
    "c.c.takehome_ded_wrong_none": "Nothing — take-home equals gross",
    "c.c.cost_credit_ans": "1) Amount to borrow 2) Final loan amount with fees 3) Payment 4) Total paid back 5) Cost = total paid − amount financed",
    "c.c.cost_credit_wrong_flip": "1) Amount to borrow 2) Fees 3) Payment 4) Total paid 5) Cost = amount borrowed − total paid",
    "c.c.cost_credit_wrong_skip": "1) Payment 2) Interest rate only — skip fees and totals",
    "c.c.cost_credit_wrong_interest_only": "Cost of credit is only the first month’s interest",
    "c.c.lifelong_ans": "Set financial goals, budget, track net worth, and keep financial records",
    "c.c.lifelong_wrong_credit": "Maximize credit, avoid budgets, and ignore net worth",
    "c.c.lifelong_wrong_ignore": "Only track investments after retirement",
    "c.c.lifelong_wrong_lottery": "Rely on lottery winnings and payday advances",
    "c.c.credit_pros_cons_ans": "Advantages: buy now, possible asset growth above finance costs, credit-card float. Disadvantages: interest until paid, less self-reliance, obligation to others, risk to assets",
    "c.c.credit_pros_cons_wrong_free": "Credit is always free and never creates obligation",
    "c.c.credit_pros_cons_wrong_only_bad": "Credit has no advantages under any circumstance",
    "c.c.credit_pros_cons_wrong_assets": "Credit never risks personal assets if unpaid",
    "c.c.primary_alt_ans": "Primary: bank accounts, stocks, bonds, mutual funds. Alternate: stamps, art, coins, precious metals, real estate, collectibles",
    "c.c.primary_alt_wrong_swap": "Primary: stamps and art. Alternate: stocks and bonds",
    "c.c.primary_alt_wrong_only_bank": "Only bank accounts count as investments",
    "c.c.primary_alt_wrong_all_same": "Primary and alternate investments are the same list",
}

# Themed Deseret prompts for shared week generators
DESETET_PROMPTS = {
    "c.q.budget_surplus.deseret": "Stewardship budget: take-home ${income}. Expenses rent ${rent}, food ${food}, other ${other}. Total expenses and surplus (or deficit)?",
    "c.q.pct_income.deseret": "A ${expense} expense is what percent of ${income} monthly income? Round to hundredths of a percent.",
    "c.q.discount_tax.deseret": "An item costs ${price}. Take {disc}% off, then add {tax}% sales tax. Final price (nearest cent)?",
    "c.q.excel_sum.deseret": "Budget cells: {a}, {b}, {c}, {d}. What does =SUM of those four equal?",
    "c.q.excel_net.deseret": "Income {income}, expenses {expenses}. Net cash flow?",
    "c.q.fv_compound.deseret": "Set aside ${P} at {pct}% annual compound interest for {n} years. Future value (nearest cent)?",
    "c.q.annuity_fv.deseret": "Deposit ${pmt} monthly for {months} months at {apr}% APR compounded monthly. Approximate FV (nearest dollar).",
    "c.q.loan_cost.deseret": "A ${principal} loan paid ${monthly}/month for {months} months. Total paid and interest cost?",
    "c.q.apr_approx.deseret": "Borrow ${p} for {months} months with a ${fee} finance fee. Approximate APR (%)?",
    "c.q.oop.deseret": "Claim ${claim}, deductible ${deductible}, coinsurance {coinsure}% above deductible. Out-of-pocket?",
    "c.q.premium_year.deseret": "Policy costs ${monthly}/month. Annual premium?",
    "c.q.ev_insure.deseret": "Loss ${loss} with probability {p}; premium ${premium}. Expected loss if uninsured ≈ ${expected}. Enter expected loss, then choose insurance vs self-insure.",
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

    for suffix, text in boss_pack(
        "Debt Bondage",
        "Bondage",
        "Deseret self-reliance",
        verb_hit="loosens",
        verb_win="broken",
    ).items():
        put(f"deseret.{suffix}", text)

    for k, v in STRINGS.items():
        put(k, v)
    for k, v in DESETET_PROMPTS.items():
        put(k, v)

    data["strings"] = dict(sorted(s.items(), key=lambda kv: kv[0].lower()))
    EN.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {added} keys in {EN}")

    sys.path.insert(0, str(ROOT / "tools"))
    from split_dictionaries import sync_js_from_json_files

    sync_js_from_json_files()
    print("Regenerated lang/*.js")


if __name__ == "__main__":
    main()
