/**
 * MAT107 Lesson 4.1 — Modeling with Functions practice questions.
 * Separate bank from Assessment 1; exports window.QuizQuestions.
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
    if (theme && i18nHas(key + "." + theme)) {
      return t(key + "." + theme, vars);
    }
    if (gadiantonBossTheme && i18nHas(key + ".boss")) {
      return t(key + ".boss", vars);
    }
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
      fn_arith_seq: t("topic.fn_arith_seq"),
      fn_arith_terms: t("topic.fn_arith_terms"),
      fn_geom_seq: t("topic.fn_geom_seq"),
      fn_geom_terms: t("topic.fn_geom_terms"),
      fn_arith_series: t("topic.fn_arith_series"),
      fn_geom_series: t("topic.fn_geom_series"),
    };
  }

  const HINT_CREDIT = { 0: 1.0, 1: 0.75, 2: 0.5, 3: 0.25 };
  const RETRY_CREDIT = 0.05;
  const UNAIDED_TO_MASTER = 10;

  const recentPick = {
    fingerprints: [],
    topics: [],
    gens: [],
    variantByKey: {},
  };
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
    return "fn-" + Math.random().toString(36).slice(2, 10);
  }

  function calcHelp(ti, casio, tip) {
    const out = { ti: ti || "", casio: casio || ti || "", tip: tip || "" };
    return out;
  }

  function CALC_GENERIC() {
    return { ti: t("calc_generic_ti"), casio: t("calc_generic_casio") };
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
      if (field.type === "numeric") {
        field.answer = num(f.answer, 4);
      } else if (field.type === "select") {
        field.answer = String(f.answer);
        field.options = (f.options || []).map(function (o) {
          return { value: String(o.value), label: o.label || String(o.value) };
        });
      } else {
        field.answer = f.answer;
      }
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

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
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

  function arithTerm(a1, d, n) {
    return a1 + (n - 1) * d;
  }

  function arithSumN(a1, d, n) {
    const an = arithTerm(a1, d, n);
    return (n * (a1 + an)) / 2;
  }

  function geomTerm(a1, r, n) {
    return a1 * Math.pow(r, n - 1);
  }

  function geomSumN(a1, r, n) {
    if (Math.abs(r - 1) < 1e-9) return a1 * n;
    return (a1 * (1 - Math.pow(r, n))) / (1 - r);
  }

  function formatSeqTerms(a1, stepFn, count) {
    const terms = [];
    for (let i = 0; i < count; i++) {
      terms.push(stepFn(i));
    }
    return terms;
  }

  function seqLabel(terms) {
    return terms.join(", ") + ", …";
  }

  function formatArithExplicit(a1, d) {
    const c = a1 - d;
    let s = d + "n";
    if (c > 0) s += " + " + c;
    else if (c < 0) s += " − " + Math.abs(c);
    return s;
  }

  function seqTypeOptions() {
    return [
      { value: "arith", label: t("fn.c.arith_seq") },
      { value: "geom", label: t("fn.c.geom_seq") },
      { value: "neither", label: t("fn.c.neither_seq") },
    ];
  }

  function recursiveRuleLabel(a1, d) {
    const step = d >= 0 ? "+ " + d : "− " + Math.abs(d);
    return "a_1 = " + a1 + "; a_n = a_{n−1} " + step;
  }

  function mcDistractors(correct, pool, count) {
    const out = [String(correct)];
    const shuffled = shuffle(pool.filter(function (x) {
      return String(x) !== String(correct);
    }).slice());
    for (let i = 0; i < shuffled.length && out.length < count; i++) {
      if (out.indexOf(String(shuffled[i])) < 0) out.push(String(shuffled[i]));
    }
    while (out.length < count) {
      const bump = Number(correct) + (out.length - 1) * 2;
      if (out.indexOf(String(bump)) < 0) out.push(String(bump));
    }
    return out;
  }

  // --- Generators -------------------------------------------------------------

  function genArithCommonDiff() {
    const a1 = choice([8, 12, 20, 25, 40, 55, 90, 120]);
    const d = choice([-12, -8, -5, -3, 4, 5, 6, 7, 8, 10, 15]);
    const terms = formatSeqTerms(a1, function (i) {
      return a1 + i * d;
    }, 5);
    const wrong = mcDistractors(d, [d + 2, d - 2, -d, d * 2, d / 2 || d + 1, 1, -1], 3);
    return _choice(
      tVar("fn.q.arith_diff", { seq: seqLabel(terms) }),
      wrong,
      String(d),
      "fn_arith_seq",
      t("fn.h.arith_diff"),
      "d = second term − first term = " + terms[1] + " − " + terms[0],
      calcHelp(terms[1] + " − " + terms[0] + " =", terms[1] + " − " + terms[0] + " =")
    );
  }

  function genArithExplicitMc() {
    const a1 = choice([4, 6, 8, 11, 15, 18]);
    const d = choice([3, 4, 5, 6, 7]);
    const terms = formatSeqTerms(a1, function (i) {
      return a1 + i * d;
    }, 5);
    const correct = "a_n = " + a1 + " + " + d + "(n − 1)";
    const choices = shuffle([
      correct,
      "a_n = " + d + " + " + a1 + "(n − 1)",
      "a_n = " + a1 + " · " + d + "^(n−1)",
      "a_n = " + a1 + " + " + d + "n",
      "a_1 = " + a1 + ", a_n = a_{n−1} + " + (d + 1),
    ]);
    return _choice(
      tVar("fn.q.arith_explicit_mc", { seq: seqLabel(terms) }),
      choices,
      correct,
      "fn_arith_seq",
      t("fn.h.arith_explicit"),
      "Arithmetic explicit form: a_n = a_1 + (n − 1)d with a_1 = " + a1 + ", d = " + d
    );
  }

  function genArithNthTerm() {
    const a1 = choice([5, 7, 9, 12, 15, 20]);
    const d = choice([2, 3, 4, 5, 6, 8]);
    const n = choice([6, 8, 10, 12, 15]);
    const ans = arithTerm(a1, d, n);
    return _numeric(
      tVar("fn.q.arith_nth", { a1: a1, d: d, n: n }),
      ans,
      "fn_arith_terms",
      0,
      t("fn.h.arith_nth"),
      [
        "Identify:",
        "a_1 = " + a1,
        "d = " + d,
        "n = " + n,
        "",
        "Write the model:",
        "a_n = a_1 + (n - 1)d",
        "",
        "Substitute:",
        "a_" + n + " = " + a1 + " + (" + n + " - 1)(" + d + ")",
      ].join("\n"),
      "",
      calcHelp(
        a1 + " + (" + n + " − 1)(" + d + ") =",
        a1 + " + (" + n + " − 1)(" + d + ") ="
      )
    );
  }

  function genArithFirstFive() {
    const a1 = choice([6, 8, 10, 12, 14]);
    const d = choice([-10, -6, -4, -2, 3, 5, 7]);
    const terms = formatSeqTerms(a1, function (i) {
      return arithTerm(a1, d, i + 1);
    }, 5);
    return _multi(
      tVar("fn.q.arith_first5", { a1: a1, d: d }),
      [
        { id: "t1", label: t("fn.field.term1"), answer: terms[0], tolerance: 0 },
        { id: "t2", label: t("fn.field.term2"), answer: terms[1], tolerance: 0 },
        { id: "t3", label: t("fn.field.term3"), answer: terms[2], tolerance: 0 },
        { id: "t4", label: t("fn.field.term4"), answer: terms[3], tolerance: 0 },
        { id: "t5", label: t("fn.field.term5"), answer: terms[4], tolerance: 0 },
      ],
      "fn_arith_terms",
      t("fn.h.arith_first5"),
      "a_n = " + a1 + " + (n − 1)(" + d + "); substitute n = 1, 2, 3, 4, 5",
      calcHelp("Start at " + a1 + ", add " + d + " each time.", "Start at " + a1 + ", add " + d + " each time.")
    );
  }

  function genGeomCommonRatio() {
    const pairs = [
      { a1: 5, r: 3, terms: [5, 15, 45, 135] },
      { a1: 81, r: 1 / 3, terms: [81, 27, 9, 3] },
      { a1: 2, r: 4, terms: [2, 8, 32, 128] },
      { a1: 48, r: 0.25, terms: [48, 12, 3, 0.75] },
      { a1: -2, r: -3, terms: [-2, 6, -18, 54] },
    ];
    const p = choice(pairs);
    const rDisplay = num(p.r, 4);
    const wrong = mcDistractors(
      rDisplay,
      [-rDisplay, rDisplay * 2, rDisplay + 1, 1 / (rDisplay || 2), 2, 3, 0.5],
      3
    );
    return _choice(
      tVar("fn.q.geom_ratio", { seq: seqLabel(p.terms) }),
      wrong.map(String),
      String(rDisplay),
      "fn_geom_seq",
      t("fn.h.geom_ratio"),
      "r = term ÷ previous term, e.g. " + p.terms[1] + " ÷ " + p.terms[0]
    );
  }

  function genGeomNthTerm() {
    const a1 = choice([2, 3, 4, 5, 6, 8]);
    const r = choice([2, 3, -2, 0.5, -0.5]);
    const n = choice([5, 6, 7, 8, 9]);
    const ans = num(geomTerm(a1, r, n), 2);
    return _numeric(
      tVar("fn.q.geom_nth", { a1: a1, r: r, n: n }),
      ans,
      "fn_geom_terms",
      0.05,
      t("fn.h.geom_nth"),
      [
        "Identify:",
        "a_1 = " + a1,
        "r = " + r,
        "n = " + n,
        "",
        "Write the model:",
        "a_n = a_1 · r^(n-1)",
        "",
        "Substitute:",
        "a_" + n + " = " + a1 + " · (" + r + ")^(" + (n - 1) + ")",
      ].join("\n"),
      "",
      calcHelp(a1 + " × " + r + " x^(" + (n - 1) + ") =", a1 + " × " + r + " ^ (" + (n - 1) + ") =")
    );
  }

  function genGeomExplicitMc() {
    const a1 = choice([3, 5, 6, 10]);
    const r = choice([2, 3, 0.5, -2]);
    const terms = formatSeqTerms(a1, function (i) {
      return num(geomTerm(a1, r, i + 1), 4);
    }, 4);
    const correct = "a_n = " + a1 + " · " + r + "^(n−1)";
    const choices = shuffle([
      correct,
      "a_n = " + a1 + " + (n − 1)(" + r + ")",
      "a_n = " + r + " + " + a1 + "(n − 1)",
      "a_n = " + a1 + " · n · " + r,
    ]);
    return _choice(
      tVar("fn.q.geom_explicit_mc", { seq: seqLabel(terms) }),
      choices,
      correct,
      "fn_geom_seq",
      t("fn.h.geom_explicit"),
      "Geometric explicit form: a_n = a_1 · r^(n−1)"
    );
  }

  function genArithSeriesSum() {
    const a1 = choice([0.4, 1, 2, 5, 8, 10]);
    const d = choice([0.2, 1, 1.4, 1.5, 2, 3]);
    const n = choice([6, 8, 10, 12]);
    const ans = num(arithSumN(a1, d, n), 2);
    const an = num(arithTerm(a1, d, n), 2);
    const wrong = [
      num(ans + d * 2, 2),
      num(ans - d * 3, 2),
      num((n * an) / 2 + d, 2),
      num(a1 * n + d, 2),
    ].map(String);
    const choices = mcDistractors(ans, wrong, 3);
    return _choice(
      tVar("fn.q.arith_series", { a1: a1, d: d, n: n, an: an }),
      choices,
      String(ans),
      "fn_arith_series",
      t("fn.h.arith_series"),
      [
        "Identify:",
        "a_1 = " + a1,
        "a_n = " + an,
        "n = " + n,
        "",
        "Write the model:",
        "S_n = n(a_1 + a_n)/2",
        "",
        "Substitute:",
        "S_" + n + " = " + n + "(" + a1 + " + " + an + ")/2",
      ].join("\n"),
      calcHelp(
        n + " × (" + a1 + " + " + an + ") ÷ 2 =",
        n + " × (" + a1 + " + " + an + ") ÷ 2 ="
      )
    );
  }

  function genGeomSeriesSum() {
    const a1 = choice([100, 200, 50, 81, 8]);
    const r = choice([0.5, -0.5, 0.25, -0.2, 2]);
    const n = choice([5, 6, 8, 10]);
    const ans = num(geomSumN(a1, r, n), 2);
    const wrong = [
      num(ans * 0.85, 2),
      num(ans * 1.12, 2),
      num(a1 * n, 2),
      num(geomTerm(a1, r, n), 2),
    ].map(String);
    const choices = mcDistractors(ans, wrong, 3);
    return _choice(
      tVar("fn.q.geom_series", { a1: a1, r: r, n: n }),
      choices,
      String(ans),
      "fn_geom_series",
      t("fn.h.geom_series"),
      "S_" + n + " = a_1(1 − r^" + n + ") / (1 − r) with a_1 = " + a1 + ", r = " + r,
      calcHelp(
        a1 + " × (1 − " + r + " ^ " + n + ") ÷ (1 − " + r + ") =",
        a1 + " × (1 − " + r + " ^ " + n + ") ÷ (1 − " + r + ") ="
      )
    );
  }

  function genSeqType() {
    const kind = choice(["arith", "geom", "neither"]);
    let seq;
    let correct;
    let topic;
    if (kind === "arith") {
      const a1 = randInt(5, 30);
      const d = choice([-7, -4, 3, 5, 6]);
      seq = formatSeqTerms(a1, function (i) {
        return a1 + i * d;
      }, 5);
      correct = t("fn.c.arith_seq");
      topic = "fn_arith_seq";
    } else if (kind === "geom") {
      const a1 = choice([2, 3, 5, 7]);
      const r = choice([2, 3, 0.5]);
      seq = formatSeqTerms(a1, function (i) {
        return geomTerm(a1, r, i + 1);
      }, 5).map(function (x) {
        return num(x, 4);
      });
      correct = t("fn.c.geom_seq");
      topic = "fn_geom_seq";
    } else {
      const start = randInt(1, 3);
      seq = formatSeqTerms(start, function (i) {
        const k = start + i;
        return k * k;
      }, 5);
      correct = t("fn.c.neither_seq");
      topic = "fn_arith_seq";
    }
    return _choice(
      tVar("fn.q.seq_type", { seq: seqLabel(seq) }),
      [t("fn.c.arith_seq"), t("fn.c.geom_seq"), t("fn.c.neither_seq"), t("fn.c.both_seq")],
      correct,
      topic,
      t("fn.h.seq_type")
    );
  }

  function genSeqClassifyMulti() {
    const a1 = randInt(12, 28);
    const d = choice([-6, -4, 4, 5, 7]);
    const arithSeq = formatSeqTerms(a1, function (i) {
      return a1 + i * d;
    }, 5);
    const g1 = choice([2, 3, 4, 6]);
    const gr = choice([2, 3, 0.5]);
    const geomSeq = formatSeqTerms(g1, function (i) {
      return num(geomTerm(g1, gr, i + 1), 4);
    }, 5);
    const n0 = randInt(2, 4);
    const neitherSeq = formatSeqTerms(n0, function (i) {
      const k = n0 + i;
      return k * (k + 1);
    }, 5);
    const sets = shuffle([
      { seq: arithSeq, answer: "arith" },
      { seq: geomSeq, answer: "geom" },
      { seq: neitherSeq, answer: "neither" },
    ]);
    const opts = seqTypeOptions();
    return _multi(
      tVar("fn.q.seq_classify"),
      sets.map(function (s, i) {
        return {
          id: "s" + (i + 1),
          label: seqLabel(s.seq),
          type: "select",
          options: opts,
          answer: s.answer,
        };
      }),
      "fn_arith_seq",
      t("fn.h.seq_classify"),
      "Check constant difference (arithmetic), constant ratio (geometric), or neither."
    );
  }

  function genArithRecursiveMc() {
    const a1 = choice([28, 31, 36, 42, 50]);
    const d = choice([-8, -6, -5, 4, 6, 7]);
    const terms = formatSeqTerms(a1, function (i) {
      return a1 + i * d;
    }, 5);
    const correct = recursiveRuleLabel(a1, d);
    const choices = shuffle([
      correct,
      recursiveRuleLabel(a1 + d, d),
      recursiveRuleLabel(a1, -d),
      "a_1 = " + a1 + "; a_n = a_{n−1} · " + (d + 2),
      "a_n = " + a1 + " + " + d + "n",
    ]);
    return _choice(
      tVar("fn.q.arith_recursive_mc", { seq: seqLabel(terms) }),
      choices,
      correct,
      "fn_arith_terms",
      t("fn.h.arith_recursive"),
      "Recursive arithmetic: a_1 is the first term; each next term adds d."
    );
  }

  function genArithRecursiveNth() {
    const a1 = choice([3, 7, 11, 15, 20]);
    const d = choice([-12, -8, -6, 5, 9]);
    const n = choice([8, 9, 11, 12, 14]);
    const ans = arithTerm(a1, d, n);
    return _numeric(
      tVar("fn.q.arith_recursive_nth", { rule: recursiveRuleLabel(a1, d), n: n }),
      ans,
      "fn_arith_terms",
      0,
      t("fn.h.arith_recursive_nth"),
      "Use a_n = a_{n−1} " + (d >= 0 ? "+ " + d : "− " + Math.abs(d)) + " repeatedly, or a_n = a_1 + (n − 1)(" + d + ").",
      "",
      calcHelp(
        a1 + " + (" + n + " − 1)(" + d + ") =",
        a1 + " + (" + n + " − 1)(" + d + ") ="
      )
    );
  }

  function genArithNthFromSeq() {
    const a1 = choice([6, 9, 11, 14, 18]);
    const d = choice([3, 4, 5, 6, 7]);
    const n = choice([8, 10, 12, 15]);
    const terms = formatSeqTerms(a1, function (i) {
      return a1 + i * d;
    }, 5);
    const ans = arithTerm(a1, d, n);
    return _numeric(
      tVar("fn.q.arith_nth_seq", { seq: seqLabel(terms), n: n }),
      ans,
      "fn_arith_terms",
      0,
      t("fn.h.arith_nth_seq"),
      "Find d from two consecutive terms, then a_" + n + " = a_1 + (" + n + " − 1)d.",
      "",
      calcHelp(a1 + " + (" + n + " − 1)(" + d + ") =", a1 + " + (" + n + " − 1)(" + d + ") =")
    );
  }

  function genArithExplicitTermMc() {
    const a1 = choice([5, 8, 11, 14, 17]);
    const d = choice([2, 3, 4, 5, 6]);
    const n = choice([8, 10, 12]);
    const an = arithTerm(a1, d, n);
    const explicit = formatArithExplicit(a1, d);
    const correct = "a_n = " + explicit + "; a_" + n + " = " + an;
    const choices = shuffle([
      correct,
      "a_n = " + formatArithExplicit(a1, d + 1) + "; a_" + n + " = " + arithTerm(a1, d + 1, n),
      "a_n = " + explicit + "; a_" + n + " = " + (an + d),
      "a_n = " + a1 + " + " + d + "n; a_" + n + " = " + (a1 + d * n),
      "a_n = " + formatArithExplicit(a1 + 2, d) + "; a_" + n + " = " + arithTerm(a1 + 2, d, n),
    ]);
    const terms = formatSeqTerms(a1, function (i) {
      return a1 + i * d;
    }, 5);
    return _choice(
      tVar("fn.q.arith_explicit_term_mc", { seq: seqLabel(terms), n: n }),
      choices,
      correct,
      "fn_arith_terms",
      t("fn.h.arith_explicit"),
      "Explicit: a_n = a_1 + (n − 1)d. Simplify, then substitute n = " + n + "."
    );
  }

  function genGeomExplicitTermMc() {
    const a1 = choice([2, 3, 4, 5]);
    const r = choice([2, 3, -2, 0.5]);
    const n = choice([6, 8, 10]);
    const an = num(geomTerm(a1, r, n), 2);
    const correct = "a_n = " + a1 + " · " + r + "^(n−1); a_" + n + " = " + an;
    const terms = formatSeqTerms(a1, function (i) {
      return num(geomTerm(a1, r, i + 1), 4);
    }, 5);
    const choices = shuffle([
      correct,
      "a_n = " + a1 + " + (n − 1)(" + r + "); a_" + n + " = " + num(arithTerm(a1, r, n), 2),
      "a_n = " + a1 + " · " + r + "^(n−1); a_" + n + " = " + num(geomTerm(a1, r, n - 1), 2),
      "a_n = " + (a1 * r) + " · " + r + "^(n−1); a_" + n + " = " + num(geomTerm(a1 * r, r, n), 2),
    ]);
    return _choice(
      tVar("fn.q.geom_explicit_term_mc", { seq: seqLabel(terms), n: n }),
      choices,
      correct,
      "fn_geom_terms",
      t("fn.h.geom_explicit"),
      "a_" + n + " = " + a1 + " · (" + r + ")^(" + n + "−1)"
    );
  }

  function genGeomNthFromFormula() {
    const a1 = choice([4, 6, 8, 10, 12]);
    const r = choice([1.5, 2, 0.5, -1.5]);
    const n = choice([6, 8, 10, 12]);
    const ans = num(geomTerm(a1, r, n), 2);
    const formula = "a_n = " + a1 + "(" + r + ")^(n−1)";
    return _numeric(
      tVar("fn.q.geom_nth_formula", { formula: formula, n: n }),
      ans,
      "fn_geom_terms",
      0.05,
      t("fn.h.geom_nth_formula"),
      "Substitute n = " + n + " into the formula.",
      "",
      calcHelp(a1 + " × (" + r + ")^(" + (n - 1) + ") =", a1 + " × (" + r + ")^(" + (n - 1) + ") =")
    );
  }

  function genGeomA1FromFormula() {
    const a1 = choice([2, 5, 7, 9, 11]);
    const r = choice([2, 3, 4, 0.5, -2]);
    const formula = "a_n = " + a1 + " · " + r + "^(n−1)";
    const wrong = mcDistractors(a1, [a1 + 1, a1 - 1, r, a1 * r, a1 + r, 1], 3);
    return _choice(
      tVar("fn.q.geom_a1_mc", { formula: formula }),
      wrong.map(String),
      String(a1),
      "fn_geom_terms",
      t("fn.h.geom_a1"),
      "In a_n = a_1 · r^(n−1), the coefficient out front is a_1."
    );
  }

  const GENERATORS = [
    genArithCommonDiff,
    genArithExplicitMc,
    genArithExplicitTermMc,
    genArithNthTerm,
    genArithNthFromSeq,
    genArithFirstFive,
    genArithRecursiveMc,
    genArithRecursiveNth,
    genGeomCommonRatio,
    genGeomExplicitMc,
    genGeomExplicitTermMc,
    genGeomNthTerm,
    genGeomNthFromFormula,
    genGeomA1FromFormula,
    genArithSeriesSum,
    genGeomSeriesSum,
    genSeqType,
    genSeqClassifyMulti,
  ];

  const topicCache = {};
  function topicOf(gen) {
    if (!topicCache[gen]) topicCache[gen] = gen().topic;
    return topicCache[gen];
  }

  function fingerprint(q) {
    let ans = "";
    if (q.type === "multi" && q.fields) {
      ans = q.fields.map(function (f) {
        return f.id + "=" + f.answer;
      }).join("|");
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
    if (field.type === "select") {
      return lbl + ": " + selectOptionLabel(field, field.answer);
    }
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
      const ok = String(userAnswer).trim() === String(question.answer).trim();
      return [ok, String(question.answer)];
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

  window.Mat107Banks = window.Mat107Banks || {};
  window.Mat107Banks.functions = {
    topics: buildTopics(),
    generators: GENERATORS,
    setBossTheme: setBossTheme,
  };

  if (!window.Mat107BankMode) {
    window.QuizQuestions = {
      get TOPICS() {
        return buildTopics();
      },
      HINT_CREDIT: HINT_CREDIT,
      RETRY_CREDIT: RETRY_CREDIT,
      UNAIDED_TO_MASTER: UNAIDED_TO_MASTER,
      setBossTheme: setBossTheme,
      generateQuestion: generateQuestion,
      remixQuestion: remixQuestion,
      checkAnswer: checkAnswer,
      publicQuestion: publicQuestion,
    };
  }
})();
