/**
 * MAT107 Weeks 3–7 lesson practice — probability, functions 2, finance, savings/credit, insurance.
 * Exports window.QuizQuestions; also registers on window.Mat107Banks.course for overview compose.
 */
(function () {
  "use strict";

  let gadiantonBossTheme = false;

  function setBossTheme(on) {
    gadiantonBossTheme = Boolean(on);
  }

  function activeTheme() {
    return window.MAT107_THEME || "";
  }

  function t(key, vars) {
    if (window.QuizI18n && window.QuizI18n.t) {
      return window.QuizI18n.t(key, vars || {});
    }
    return key;
  }

  function i18nHas(key) {
    return Boolean(window.QuizI18n && window.QuizI18n.has && window.QuizI18n.has(key));
  }

  function tVar(key, vars) {
    const theme = activeTheme();
    if (theme && i18nHas(key + "." + theme)) return t(key + "." + theme, vars);
    if (gadiantonBossTheme && i18nHas(key + ".boss")) return t(key + ".boss", vars);
    const opts = [key];
    for (let n = 2; n <= 4; n++) {
      const k = key + ".v" + n;
      if (i18nHas(k)) opts.push(k);
    }
    const pick = opts.length > 1 ? choice(opts) : opts[0];
    return t(pick, vars);
  }

  function buildTopics() {
    return {
      prob_basic: t("topic.prob_basic"),
      prob_compound: t("topic.prob_compound"),
      prob_counting: t("topic.prob_counting"),
      fn_linear: t("topic.fn_linear"),
      fn_exp: t("topic.fn_exp"),
      fn_slope: t("topic.fn_slope"),
      fn_interest: t("topic.fn_interest"),
      fin_budget: t("topic.fin_budget"),
      fin_percent: t("topic.fin_percent"),
      fin_excel: t("topic.fin_excel"),
      save_compound: t("topic.save_compound"),
      save_annuity: t("topic.save_annuity"),
      credit_loan: t("topic.credit_loan"),
      credit_apr: t("topic.credit_apr"),
      ins_premium: t("topic.ins_premium"),
      ins_expected: t("topic.ins_expected"),
    };
  }

  const HINT_CREDIT = { 0: 1.0, 1: 0.75, 2: 0.5, 3: 0.25 };
  const RETRY_CREDIT = 0.05;
  const UNAIDED_TO_MASTER = 10;

  const recentPick = { fingerprints: [], topics: [], gens: [] };
  const RECENT_KEEP = 48;

  function remember(list, value, keep) {
    keep = keep || RECENT_KEEP;
    list.unshift(value);
    if (list.length > keep) list.length = keep;
  }

  function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function num(x, places) {
    places = places === undefined ? 4 : places;
    const p = Math.pow(10, places);
    return Math.round(Number(x) * p) / p;
  }

  function id() {
    return "c-" + Math.random().toString(36).slice(2, 10);
  }

  function calcHelp(ti, casio, tip) {
    return { ti: ti || "", casio: casio || ti || "", tip: tip || "" };
  }

  function CALC_GENERIC() {
    return { ti: t("calc_generic_ti"), casio: t("calc_generic_casio") };
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function _choice(prompt, choices, answer, topic, hint, setup, calc) {
    return {
      id: id(),
      topic: topic,
      type: "mc",
      prompt: prompt,
      choices: shuffle(choices.slice()),
      answer: answer,
      hint: hint || "",
      setup: setup || "",
      calc: calc || "",
    };
  }

  function _numeric(prompt, answer, topic, tolerance, hint, setup, unit, calc) {
    return {
      id: id(),
      topic: topic,
      type: "numeric",
      prompt: prompt,
      answer: num(answer, 4),
      tolerance: tolerance !== undefined ? tolerance : 0.05,
      hint: hint || "",
      setup: setup || "",
      calc: calc || "",
      unit: unit || "",
    };
  }

  function _multi(prompt, fields, topic, hint, setup, calc, layout) {
    const mappedFields = fields.map(function (f) {
      const field = {
        id: f.id,
        label: f.label || "",
        type: f.type || "numeric",
        unit: f.unit || "",
        tolerance: f.tolerance !== undefined ? f.tolerance : 0.05,
      };
      if (field.type === "numeric") field.answer = num(f.answer, 4);
      else if (field.type === "select") {
        field.answer = String(f.answer);
        field.options = (f.options || []).map(function (o) {
          return { value: String(o.value), label: o.label || String(o.value) };
        });
      } else field.answer = f.answer;
      return field;
    });
    return {
      id: id(),
      topic: topic,
      type: "multi",
      prompt: prompt,
      fields: mappedFields,
      layout:
        layout ||
        mappedFields.map(function (f) {
          return { widget: "field", id: f.id };
        }),
      hint: hint || "",
      setup: setup || "",
      calc: calc || "",
    };
  }

  function parseNumericInput(raw) {
    let s = String(raw == null ? "" : raw)
      .trim()
      .replace(/\s/g, "")
      .replace(/½/g, "0.5");
    if (!s) return NaN;
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
    else s = s.replace(/,/g, "");
    const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    if (frac) {
      const den = Number(frac[2]);
      if (!den) return NaN;
      return Number(frac[1]) / den;
    }
    if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return NaN;
    return Number(s);
  }

  function fact(n) {
    let p = 1;
    for (let i = 2; i <= n; i++) p *= i;
    return p;
  }

  function perm(n, r) {
    if (r > n || r < 0) return 0;
    let p = 1;
    for (let i = 0; i < r; i++) p *= n - i;
    return p;
  }

  function comb(n, r) {
    if (r > n || r < 0) return 0;
    r = Math.min(r, n - r);
    let c = 1;
    for (let i = 1; i <= r; i++) c = (c * (n - r + i)) / i;
    return Math.round(c);
  }

  function mcDistractors(correct, pool, count) {
    const out = [String(correct)];
    const shuffled = shuffle(
      pool
        .filter(function (x) {
          return String(x) !== String(correct);
        })
        .slice()
    );
    for (let i = 0; i < shuffled.length && out.length < count; i++) {
      if (out.indexOf(String(shuffled[i])) < 0) out.push(String(shuffled[i]));
    }
    while (out.length < count) {
      const bump = Number(correct) + out.length;
      if (out.indexOf(String(bump)) < 0) out.push(String(bump));
      else out.push(String(bump + 7));
    }
    return out;
  }

  // --- Probability ------------------------------------------------------------

  function genProbSimple() {
    const total = choice([20, 24, 36, 40, 52]);
    const fav = randInt(3, Math.floor(total / 2));
    const ans = num(fav / total, 4);
    const pct = num((fav / total) * 100, 2);
    return _numeric(
      tVar("c.q.prob_simple", { fav: fav, total: total }),
      ans,
      "prob_basic",
      0.01,
      t("c.h.prob_simple"),
      "P = " + fav + " / " + total + " ≈ " + pct + "%",
      "",
      calcHelp(fav + " ÷ " + total + " =", fav + " ÷ " + total + " =")
    );
  }

  function genProbComplement() {
    const p = choice([0.15, 0.22, 0.3, 0.35, 0.4, 0.65]);
    const ans = num(1 - p, 4);
    return _numeric(
      tVar("c.q.prob_complement", { p: p }),
      ans,
      "prob_basic",
      0.01,
      t("c.h.prob_complement"),
      "P(not A) = 1 − P(A) = 1 − " + p,
      "",
      calcHelp("1 − " + p + " =", "1 − " + p + " =")
    );
  }

  function genProbIndependent() {
    const p1 = choice([0.2, 0.25, 0.3, 0.4, 0.5]);
    const p2 = choice([0.1, 0.2, 0.25, 0.5]);
    const ans = num(p1 * p2, 4);
    return _numeric(
      tVar("c.q.prob_and_indep", { p1: p1, p2: p2 }),
      ans,
      "prob_compound",
      0.01,
      t("c.h.prob_and_indep"),
      "Independent: P(A and B) = P(A)·P(B) = " + p1 + " × " + p2,
      "",
      calcHelp(p1 + " × " + p2 + " =", p1 + " × " + p2 + " =")
    );
  }

  function genProbOrExclusive() {
    const p1 = choice([0.12, 0.18, 0.2, 0.25, 0.3]);
    const p2 = choice([0.1, 0.15, 0.22, 0.28]);
    const ans = num(p1 + p2, 4);
    return _numeric(
      tVar("c.q.prob_or_exclusive", { p1: p1, p2: p2 }),
      ans,
      "prob_compound",
      0.01,
      t("c.h.prob_or_exclusive"),
      "Mutually exclusive: P(A or B) = P(A) + P(B)",
      "",
      calcHelp(p1 + " + " + p2 + " =", p1 + " + " + p2 + " =")
    );
  }

  function genPerm() {
    const n = choice([6, 7, 8, 9, 10]);
    const r = choice([2, 3, 4]);
    const ans = perm(n, r);
    return _numeric(
      tVar("c.q.perm", { n: n, r: r }),
      ans,
      "prob_counting",
      0,
      t("c.h.perm"),
      "P(n,r) = n!/(n−r)! = " + n + "! / " + (n - r) + "!",
      "",
      calcHelp("nPr with n=" + n + ", r=" + r, "nPr with n=" + n + ", r=" + r)
    );
  }

  function genComb() {
    const n = choice([8, 9, 10, 12]);
    const r = choice([2, 3, 4]);
    const ans = comb(n, r);
    return _numeric(
      tVar("c.q.comb", { n: n, r: r }),
      ans,
      "prob_counting",
      0,
      t("c.h.comb"),
      "C(n,r) = n!/(r!(n−r)!) = " + n + " choose " + r,
      "",
      calcHelp("nCr with n=" + n + ", r=" + r, "nCr with n=" + n + ", r=" + r)
    );
  }

  // --- Functions 2 ------------------------------------------------------------

  function genLinearEval() {
    const m = choice([2, 3, 4, 5, -2, -3]);
    const b = choice([10, 20, 50, 100, -5]);
    const x = choice([0, 1, 2, 3, 5, 8]);
    const ans = m * x + b;
    return _numeric(
      tVar("c.q.linear_eval", { m: m, b: b, x: x }),
      ans,
      "fn_linear",
      0,
      t("c.h.linear_eval"),
      "f(x) = " + m + "x + " + b + "; substitute x = " + x,
      "",
      calcHelp(m + " × " + x + " + " + b + " =", m + " × " + x + " + " + b + " =")
    );
  }

  function genLinearModel() {
    const rate = choice([15, 20, 25, 30, 45]);
    const start = choice([50, 80, 100, 200, 250]);
    const tHours = choice([2, 3, 4, 5, 6]);
    const ans = rate * tHours + start;
    return _numeric(
      tVar("c.q.linear_model", { rate: rate, start: start, t: tHours }),
      ans,
      "fn_linear",
      0,
      t("c.h.linear_model"),
      "d(t) = " + rate + "t + " + start,
      "",
      calcHelp(rate + " × " + tHours + " + " + start + " =", rate + " × " + tHours + " + " + start + " =")
    );
  }

  function genSlopePoints() {
    const x1 = choice([0, 1, 2, -1]);
    const y1 = choice([2, 3, 5, -2]);
    const run = choice([2, 3, 4, 5]);
    const rise = choice([-6, -4, -2, 2, 3, 6, 8]);
    const x2 = x1 + run;
    const y2 = y1 + rise;
    const ans = num(rise / run, 4);
    return _numeric(
      tVar("c.q.slope_points", { x1: x1, y1: y1, x2: x2, y2: y2 }),
      ans,
      "fn_slope",
      0.01,
      t("c.h.slope_points"),
      "m = (y₂ − y₁)/(x₂ − x₁) = (" + y2 + " − " + y1 + ")/(" + x2 + " − " + x1 + ")",
      "",
      calcHelp("(" + y2 + " − " + y1 + ") ÷ (" + x2 + " − " + x1 + ") =", "(" + y2 + " − " + y1 + ") ÷ (" + x2 + " − " + x1 + ") =")
    );
  }

  function genExpEval() {
    const a = choice([100, 200, 500, 1000]);
    const r = choice([1.05, 1.08, 1.1, 0.9, 0.95]);
    const n = choice([2, 3, 4, 5]);
    const ans = num(a * Math.pow(r, n), 2);
    return _numeric(
      tVar("c.q.exp_eval", { a: a, r: r, n: n }),
      ans,
      "fn_exp",
      0.5,
      t("c.h.exp_eval"),
      "f(n) = " + a + " · (" + r + ")^" + n,
      "",
      calcHelp(a + " × " + r + " ^ " + n + " =", a + " × " + r + " ^ " + n + " =")
    );
  }

  function genSimpleInterest() {
    const P = choice([500, 800, 1000, 1500, 2000]);
    const r = choice([0.04, 0.05, 0.06, 0.075]);
    const years = choice([2, 3, 4, 5]);
    const ans = num(P * (1 + r * years), 2);
    return _numeric(
      tVar("c.q.simple_interest", { P: P, pct: num(r * 100, 2), t: years }),
      ans,
      "fn_interest",
      0.5,
      t("c.h.simple_interest"),
      "A = P(1 + rt) = " + P + "(1 + " + r + "·" + years + ")",
      "dollars",
      calcHelp(P + " × (1 + " + r + " × " + years + ") =", P + " × (1 + " + r + " × " + years + ") =")
    );
  }

  function genCompoundInterestBasic() {
    const P = choice([1000, 1500, 2000, 2500]);
    const r = choice([0.04, 0.05, 0.06]);
    const years = choice([3, 4, 5, 8]);
    const ans = num(P * Math.pow(1 + r, years), 2);
    return _numeric(
      tVar("c.q.compound_once", { P: P, pct: num(r * 100, 2), t: years }),
      ans,
      "fn_interest",
      1,
      t("c.h.compound_once"),
      "A = P(1+r)^t = " + P + "(1+" + r + ")^" + years,
      "dollars",
      calcHelp(P + " × (1 + " + r + ") ^ " + years + " =", P + " × (1 + " + r + ") ^ " + years + " =")
    );
  }

  // --- Personal finance -------------------------------------------------------

  function genBudgetSurplus() {
    const income = choice([2800, 3200, 3500, 4000, 4500]);
    const rent = choice([900, 1100, 1200, 1400]);
    const food = choice([350, 400, 450, 500]);
    const other = choice([400, 500, 600, 750]);
    const expenses = rent + food + other;
    const ans = income - expenses;
    return _multi(
      tVar("c.q.budget_surplus", {
        income: income,
        rent: rent,
        food: food,
        other: other,
      }),
      [
        { id: "expenses", label: t("c.field.total_expenses"), answer: expenses, tolerance: 0, unit: "dollars" },
        { id: "surplus", label: t("c.field.surplus"), answer: ans, tolerance: 0, unit: "dollars" },
      ],
      "fin_budget",
      t("c.h.budget_surplus"),
      "Total expenses = rent + food + other; surplus = income − expenses"
    );
  }

  function genPercentOfIncome() {
    const income = choice([3000, 3600, 4000, 4800]);
    const expense = choice([600, 720, 900, 1200]);
    const ans = num((expense / income) * 100, 2);
    return _numeric(
      tVar("c.q.pct_income", { expense: expense, income: income }),
      ans,
      "fin_percent",
      0.1,
      t("c.h.pct_income"),
      "Percent = (expense ÷ income) × 100",
      "%",
      calcHelp("(" + expense + " ÷ " + income + ") × 100 =", "(" + expense + " ÷ " + income + ") × 100 =")
    );
  }

  function genDiscountTax() {
    const price = choice([40, 55, 80, 120, 200]);
    const disc = choice([10, 15, 20, 25]);
    const tax = choice([6, 7, 8]);
    const afterDisc = price * (1 - disc / 100);
    const ans = num(afterDisc * (1 + tax / 100), 2);
    return _numeric(
      tVar("c.q.discount_tax", { price: price, disc: disc, tax: tax }),
      ans,
      "fin_percent",
      0.05,
      t("c.h.discount_tax"),
      "Sale price = " + price + "×(1−" + disc + "/100); then ×(1+" + tax + "/100)",
      "dollars",
      calcHelp(
        price + " × (1 − " + disc + "÷100) × (1 + " + tax + "÷100) =",
        price + " × (1 − " + disc + "÷100) × (1 + " + tax + "÷100) ="
      )
    );
  }

  function genExcelSum() {
    const a = randInt(120, 400);
    const b = randInt(80, 300);
    const c = randInt(50, 250);
    const d = randInt(40, 200);
    const ans = a + b + c + d;
    return _numeric(
      tVar("c.q.excel_sum", { a: a, b: b, c: c, d: d }),
      ans,
      "fin_excel",
      0,
      t("c.h.excel_sum"),
      "Like =SUM(B2:B5): add " + a + "+" + b + "+" + c + "+" + d,
      "dollars",
      calcHelp(a + " + " + b + " + " + c + " + " + d + " =", a + " + " + b + " + " + c + " + " + d + " =")
    );
  }

  function genExcelNet() {
    const income = choice([2500, 3000, 3500, 4200]);
    const expenses = choice([1800, 2100, 2400, 2900]);
    const ans = income - expenses;
    return _numeric(
      tVar("c.q.excel_net", { income: income, expenses: expenses }),
      ans,
      "fin_excel",
      0,
      t("c.h.excel_net"),
      "Net = income − expenses (like =B2−B3)",
      "dollars"
    );
  }

  // --- Savings / retirement / credit ------------------------------------------

  function genFVCompound() {
    const P = choice([2000, 3000, 5000, 8000]);
    const r = choice([0.05, 0.06, 0.07]);
    const n = choice([4, 5, 8, 10]);
    const ans = num(P * Math.pow(1 + r, n), 2);
    return _numeric(
      tVar("c.q.fv_compound", { P: P, pct: num(r * 100, 2), n: n }),
      ans,
      "save_compound",
      1,
      t("c.h.fv_compound"),
      "FV = P(1+r)^n",
      "dollars",
      calcHelp(P + " × (1+" + r + ")^" + n + " =", P + " × (1+" + r + ")^" + n + " =")
    );
  }

  function genAnnuityFV() {
    // End-of-period ordinary annuity: FV = PMT * ((1+r)^n − 1) / r
    const pmt = choice([50, 100, 150, 200]);
    const r = choice([0.04, 0.05, 0.06]);
    const n = choice([12, 24, 36, 48]);
    const ans = num(pmt * ((Math.pow(1 + r / 12, n) - 1) / (r / 12)), 2);
    return _numeric(
      tVar("c.q.annuity_fv", { pmt: pmt, apr: num(r * 100, 2), months: n }),
      ans,
      "save_annuity",
      2,
      t("c.h.annuity_fv"),
      "Monthly rate i = APR/12; FV = PMT·((1+i)^n − 1)/i",
      "dollars",
      calcHelp(
        pmt + " × ((1+" + num(r / 12, 6) + ")^" + n + " − 1)/(" + num(r / 12, 6) + ") =",
        pmt + " × ((1+" + num(r / 12, 6) + ")^" + n + " − 1)/(" + num(r / 12, 6) + ") ="
      )
    );
  }

  function genLoanInterestCost() {
    const principal = choice([8000, 10000, 12000, 15000]);
    const monthly = choice([220, 250, 280, 320, 350]);
    const months = choice([36, 48, 60]);
    const totalPaid = monthly * months;
    const interest = totalPaid - principal;
    return _multi(
      tVar("c.q.loan_cost", { principal: principal, monthly: monthly, months: months }),
      [
        { id: "total", label: t("c.field.total_paid"), answer: totalPaid, tolerance: 0, unit: "dollars" },
        { id: "interest", label: t("c.field.interest_cost"), answer: interest, tolerance: 0, unit: "dollars" },
      ],
      "credit_loan",
      t("c.h.loan_cost"),
      "Total paid = payment × months; interest = total − principal"
    );
  }

  function genAPRCompare() {
    const p = choice([1000, 1500, 2000]);
    const fee = choice([50, 75, 100]);
    const months = choice([6, 12]);
    // Approximate APR for short loan: interest/fee over principal, annualized
    const interestRate = fee / p;
    const ans = num((interestRate * (12 / months)) * 100, 2);
    return _numeric(
      tVar("c.q.apr_approx", { p: p, fee: fee, months: months }),
      ans,
      "credit_apr",
      0.5,
      t("c.h.apr_approx"),
      "Approx APR% ≈ (fee/principal) × (12/months) × 100",
      "%",
      calcHelp(
        "(" + fee + " ÷ " + p + ") × (12 ÷ " + months + ") × 100 =",
        "(" + fee + " ÷ " + p + ") × (12 ÷ " + months + ") × 100 ="
      )
    );
  }

  // --- Insurance --------------------------------------------------------------

  function genOutOfPocket() {
    const deductible = choice([500, 1000, 1500, 2000]);
    const coinsure = choice([10, 20, 30]);
    const claim = choice([3000, 4000, 5000, 8000]);
    const afterDed = Math.max(0, claim - deductible);
    const patientShare = afterDed * (coinsure / 100);
    const ans = num(deductible + patientShare, 2);
    return _numeric(
      tVar("c.q.oop", { deductible: deductible, coinsure: coinsure, claim: claim }),
      ans,
      "ins_premium",
      0.5,
      t("c.h.oop"),
      "You pay deductible + coinsurance% of (claim − deductible)",
      "dollars",
      calcHelp(
        deductible + " + " + coinsure + "% × (" + claim + " − " + deductible + ") =",
        deductible + " + " + coinsure + "% × (" + claim + " − " + deductible + ") ="
      )
    );
  }

  function genPremiumYear() {
    const monthly = choice([120, 150, 180, 220, 275]);
    const ans = monthly * 12;
    return _numeric(
      tVar("c.q.premium_year", { monthly: monthly }),
      ans,
      "ins_premium",
      0,
      t("c.h.premium_year"),
      "Annual premium = monthly × 12",
      "dollars"
    );
  }

  function genExpectedValueIns() {
    const premium = choice([400, 500, 600, 800]);
    const pLoss = choice([0.02, 0.05, 0.1]);
    const loss = choice([5000, 8000, 10000]);
    // Expected cost if uninsured vs insured: compare expected loss vs premium
    const expectedLoss = num(pLoss * loss, 2);
    const better = expectedLoss > premium ? "insure" : "self";
    const choices = [
      { value: "insure", label: t("c.c.buy_insurance") },
      { value: "self", label: t("c.c.self_insure") },
    ];
    return _multi(
      tVar("c.q.ev_insure", {
        premium: premium,
        p: pLoss,
        loss: loss,
        expected: expectedLoss,
      }),
      [
        {
          id: "expected",
          label: t("c.field.expected_loss"),
          answer: expectedLoss,
          tolerance: 0.5,
          unit: "dollars",
        },
        {
          id: "choice",
          label: t("c.field.better_choice"),
          type: "select",
          answer: better,
          options: choices,
        },
      ],
      "ins_expected",
      t("c.h.ev_insure"),
      "E[loss] = p × loss; buy insurance if premium < expected loss (risk-neutral comparison)"
    );
  }

  const GENERATORS = [
    genProbSimple,
    genProbComplement,
    genProbIndependent,
    genProbOrExclusive,
    genPerm,
    genComb,
    genLinearEval,
    genLinearModel,
    genSlopePoints,
    genExpEval,
    genSimpleInterest,
    genCompoundInterestBasic,
    genBudgetSurplus,
    genPercentOfIncome,
    genDiscountTax,
    genExcelSum,
    genExcelNet,
    genFVCompound,
    genAnnuityFV,
    genLoanInterestCost,
    genAPRCompare,
    genOutOfPocket,
    genPremiumYear,
    genExpectedValueIns,
  ];

  const topicCache = {};
  function topicOf(gen) {
    if (!topicCache[gen]) topicCache[gen] = gen().topic;
    return topicCache[gen];
  }

  function fingerprint(q) {
    let ans = "";
    if (q.type === "multi" && q.fields) {
      ans = q.fields
        .map(function (f) {
          return f.id + "=" + f.answer;
        })
        .join("|");
    } else if (q.answer != null) ans = String(q.answer);
    return (q.topic || "") + "::" + (q.type || "") + "::" + ans;
  }

  function pickTopicForMix(forcedTopic) {
    if (forcedTopic && forcedTopic !== "all") return forcedTopic;
    const keys = Object.keys(buildTopics());
    const avoid = recentPick.topics.slice(0, 2);
    const pool = keys.filter(function (k) {
      return avoid.indexOf(k) < 0;
    });
    return choice(pool.length ? pool : keys);
  }

  function generateQuestion(topic) {
    const targetTopic = pickTopicForMix(topic);
    let pool = GENERATORS;
    if (targetTopic) {
      const filtered = GENERATORS.filter(function (g) {
        return topicOf(g) === targetTopic;
      });
      if (filtered.length) pool = filtered;
    }
    for (let attempt = 0; attempt < 12; attempt++) {
      const gen = choice(pool);
      const q = gen();
      q._gen = gen;
      const fp = fingerprint(q);
      if (recentPick.fingerprints.indexOf(fp) < 0 || attempt === 11) {
        remember(recentPick.gens, gen, 8);
        remember(recentPick.topics, q.topic, 6);
        remember(recentPick.fingerprints, fp, RECENT_KEEP);
        return q;
      }
    }
    const gen = choice(pool);
    const q = gen();
    q._gen = gen;
    return q;
  }

  function remixQuestion(prev) {
    const gen = prev && typeof prev._gen === "function" ? prev._gen : null;
    if (!gen) return generateQuestion(prev && prev.topic ? prev.topic : "all");
    const oldFp = fingerprint(prev);
    for (let attempt = 0; attempt < 14; attempt++) {
      const q = gen();
      q._gen = gen;
      const fp = fingerprint(q);
      if (fp !== oldFp && recentPick.fingerprints.indexOf(fp) < 0) {
        remember(recentPick.gens, gen, 8);
        remember(recentPick.topics, q.topic, 6);
        remember(recentPick.fingerprints, fp, RECENT_KEEP);
        return q;
      }
    }
    const q = gen();
    q._gen = gen;
    return q;
  }

  function selectOptionLabel(field, value) {
    const opts = field.options || [];
    for (let i = 0; i < opts.length; i++) {
      if (String(opts[i].value) === String(value)) return opts[i].label;
    }
    return String(value);
  }

  function formatFieldExpected(field) {
    const lbl = field.label || field.id;
    if (field.type === "select") return lbl + ": " + selectOptionLabel(field, field.answer);
    const u = field.unit ? " " + field.unit : "";
    return lbl + ": " + field.answer + u;
  }

  function formatMultiExpected(question) {
    return (question.fields || []).map(formatFieldExpected).join(" · ");
  }

  function checkMultiField(field, userVal) {
    if (field.type === "select") {
      return String(userVal).trim() === String(field.answer).trim();
    }
    const val = parseNumericInput(userVal);
    if (isNaN(val)) return false;
    return (
      Math.abs(val - Number(field.answer)) <=
      Number(field.tolerance !== undefined ? field.tolerance : 0.05)
    );
  }

  function checkAnswer(question, userAnswer) {
    const qtype = question.type;
    if (qtype === "mc") {
      return [String(userAnswer).trim() === String(question.answer).trim(), String(question.answer)];
    }
    if (qtype === "numeric") {
      const val = parseNumericInput(userAnswer);
      if (isNaN(val)) return [false, String(question.answer)];
      const ok =
        Math.abs(val - Number(question.answer)) <=
        Number(question.tolerance !== undefined ? question.tolerance : 0.05);
      return [ok, String(question.answer)];
    }
    if (qtype === "multi") {
      const answers =
        typeof userAnswer === "object" && userAnswer != null ? userAnswer : {};
      let allOk = true;
      (question.fields || []).forEach(function (f) {
        if (!checkMultiField(f, answers[f.id])) allOk = false;
      });
      return [allOk, formatMultiExpected(question)];
    }
    return [false, ""];
  }

  function publicQuestion(q) {
    let hint1 = q.hint || "";
    const hint2 = q.setup || "";
    let calc = q.calc || null;
    if (!calc && hint2) calc = CALC_GENERIC();
    let hint3ti = "";
    let hint3casio = "";
    if (calc && typeof calc === "object") {
      hint3ti = calc.ti || "";
      hint3casio = calc.casio || "";
    }
    const overviewKey = "hint_overview." + (q.topic || "");
    const overview = i18nHas(overviewKey) ? t(overviewKey) : t("hint_overview.generic");
    if (hint1) hint1 = overview + "\n\n" + hint1;
    else if (overview) hint1 = overview;

    let clarify = q.clarify || "";
    if (!clarify) {
      const steps = [t("clarify_intro"), overview];
      if (q.hint) steps.push(t("clarify_step_idea") + " " + q.hint);
      if (hint2) steps.push(t("clarify_step_setup") + "\n" + hint2);
      steps.push(t("clarify_step_finish"));
      clarify = steps.join("\n\n");
    }

    const out = {
      id: q.id,
      topic: q.topic,
      topic_label: buildTopics()[q.topic] || q.topic,
      type: q.type,
      prompt: q.prompt,
      hint1: hint1,
      hint2: hint2,
      hint3_ti: hint3ti,
      hint3_casio: hint3casio,
      clarify: clarify,
      has_hint1: Boolean(hint1),
      has_hint2: Boolean(hint2),
      has_hint3: Boolean(hint3ti || hint3casio),
      has_clarify: Boolean(clarify),
      unit: q.unit || "",
    };
    if (q.type === "mc") out.choices = q.choices;
    if (q.type === "multi") {
      out.fields = (q.fields || []).map(function (f) {
        const pubField = {
          id: f.id,
          label: f.label || "",
          type: f.type || "numeric",
          unit: f.unit || "",
        };
        if (f.type === "select") {
          pubField.options = (f.options || []).map(function (o) {
            return { value: o.value, label: o.label };
          });
        }
        return pubField;
      });
      out.layout = q.layout || [];
    }
    return out;
  }

  function filterGenerators(topicIds) {
    if (!topicIds || !topicIds.length) return GENERATORS.slice();
    const allow = topicIds.reduce(function (o, tid) {
      o[tid] = true;
      return o;
    }, {});
    return GENERATORS.filter(function (g) {
      return allow[topicOf(g)];
    });
  }

  function installQuiz(topicIds) {
    const gens = filterGenerators(topicIds);
    const allTopics = buildTopics();
    const topics = {};
    (topicIds && topicIds.length ? topicIds : Object.keys(allTopics)).forEach(function (tid) {
      topics[tid] = allTopics[tid] || t("topic." + tid);
    });

    // Local generate using filtered gens
    function generateFiltered(topic) {
      const topicKeys = Object.keys(topics);
      function pickFilteredTopic(forcedTopic) {
        if (forcedTopic && forcedTopic !== "all" && forcedTopic !== "smart") {
          return forcedTopic;
        }
        const avoid = recentPick.topics.slice(0, 2);
        const pool = topicKeys.filter(function (k) {
          return avoid.indexOf(k) < 0;
        });
        return choice(pool.length ? pool : topicKeys);
      }
      const targetTopic = pickFilteredTopic(topic);
      let pool = gens;
      if (targetTopic) {
        const filtered = gens.filter(function (g) {
          return topicOf(g) === targetTopic;
        });
        if (filtered.length) pool = filtered;
      }
      if (!pool.length) pool = gens.length ? gens : GENERATORS;
      for (let attempt = 0; attempt < 12; attempt++) {
        const gen = choice(pool);
        const q = gen();
        q._gen = gen;
        const fp = fingerprint(q);
        if (recentPick.fingerprints.indexOf(fp) < 0 || attempt === 11) {
          remember(recentPick.gens, gen, 8);
          remember(recentPick.topics, q.topic, 6);
          remember(recentPick.fingerprints, fp, RECENT_KEEP);
          return q;
        }
      }
      const gen = choice(pool);
      const q = gen();
      q._gen = gen;
      return q;
    }

    window.QuizQuestions = {
      get TOPICS() {
        return topics;
      },
      HINT_CREDIT: HINT_CREDIT,
      RETRY_CREDIT: RETRY_CREDIT,
      UNAIDED_TO_MASTER: UNAIDED_TO_MASTER,
      setBossTheme: setBossTheme,
      generateQuestion: generateFiltered,
      remixQuestion: remixQuestion,
      checkAnswer: checkAnswer,
      publicQuestion: publicQuestion,
    };
  }

  window.Mat107Banks = window.Mat107Banks || {};
  window.Mat107Banks.course = {
    topics: buildTopics(),
    generators: GENERATORS,
    setBossTheme: setBossTheme,
  };

  // Standalone lesson load: filter by assessment topicIds when not composing
  if (!window.Mat107BankMode) {
    const course = window.Mat107Course;
    const assessmentId = window.MAT107_ASSESSMENT_ID;
    const assessment = course && course.getAssessment ? course.getAssessment(assessmentId) : null;
    const topicIds = assessment && assessment.topicIds ? assessment.topicIds : null;
    installQuiz(topicIds);
  }
})();
