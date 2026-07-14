/**
 * MAT107 quiz question generators — browser port of questions.py
 * Self-contained IIFE; load via plain <script> tag (no ES modules).
 */
(function () {
  "use strict";

  function t(key, vars) {
    if (window.QuizI18n && window.QuizI18n.t) {
      return window.QuizI18n.t(key, vars || {});
    }
    return key;
  }

  /** Pick a random prompt variant: key, key.v2, key.v3, … when present. */
  function tVar(key, vars) {
    const opts = [key];
    for (let n = 2; n <= 6; n++) {
      const k = key + ".v" + n;
      if (window.QuizI18n && window.QuizI18n.has && window.QuizI18n.has(k)) {
        opts.push(k);
      }
    }
    return t(choice(opts), vars);
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


  const TOPICS_FALLBACK = {
    conversions: "Unit Conversions",
    formulas: "Formulas & Flashcards",
    perimeter_area: "Perimeter & Area",
    volume: "Volume",
    pythagorean: "Pythagorean Theorem & Slope",
    scale_rates: "Scale & Unit Rates",
    scaling: "How Area & Volume Scale",
    stats_center: "Mean, Median, Mode, Range",
    stats_spread: "Standard Deviation & Variation",
    z_scores: "Z-Scores & Percentiles",
    distributions: "Distributions & Empirical Rule",
    literacy: "Statistical Literacy",
  };

  const PI = 3.14;
  function piNote() { return t("pi_note"); }
  // Credit remaining after hints: 0→100%, 1→75%, 2→50%, 3→25%
  const HINT_CREDIT = { 0: 1.0, 1: 0.75, 2: 0.5, 3: 0.25 };
  /** Credit for correcting a miss on the recovery attempt (not mastery). */
  const RETRY_CREDIT = 0.05;
  const UNAIDED_TO_MASTER = 10;

  // --- Helpers ----------------------------------------------------------------

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    // Mutates in place and returns the same array (callers often ignore the return).
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  function num(x, places) {
    if (places === undefined) places = 2;
    const p = Math.pow(10, places);
    return Math.round(x * p) / p;
  }

  function id() {
    let s = "";
    for (let i = 0; i < 12; i++) {
      s += Math.floor(Math.random() * 16).toString(16);
    }
    return s;
  }

  function calcHelp(tiSteps, casioSteps, tip) {
    tip = tip || t("calc_tip_default");
    const tipBlock = tip ? "\n\n" + tip : "";
    return {
      ti: t("calc_panel_ti", { steps: tiSteps }) + tipBlock,
      casio: t("calc_panel_casio", { steps: casioSteps }) + tipBlock,
    };
  }

  // Generic leftover tip when we only have an equation setup
  function CALC_GENERIC() {
    return {
      ti: t("calc_generic_ti"),
      casio: t("calc_generic_casio"),
    };
  }

  function _choice(prompt, choices, answer, topic, hint, setup, calc) {
    hint = hint || "";
    setup = setup || "";
    calc = calc || "";
    return {
      id: id(),
      topic: topic,
      type: "mc",
      prompt: prompt,
      choices: shuffle(choices.slice()),
      answer: answer,
      hint: hint,
      setup: setup,
      calc: calc,
      tolerance: 0,
    };
  }

  function _numeric(prompt, answer, topic, tolerance, hint, setup, unit, calc) {
    tolerance = tolerance === undefined ? 0.05 : tolerance;
    hint = hint || "";
    setup = setup || "";
    unit = unit || "";
    calc = calc || "";
    return {
      id: id(),
      topic: topic,
      type: "numeric",
      prompt: prompt,
      answer: num(answer, 4),
      tolerance: tolerance,
      hint: hint,
      setup: setup,
      calc: calc,
      unit: unit,
    };
  }

  function _short(prompt, answers, topic, hint, setup, calc) {
    hint = hint || "";
    setup = setup || "";
    calc = calc || "";
    return {
      id: id(),
      topic: topic,
      type: "short",
      prompt: prompt,
      answers: answers.map(function (a) {
        return a.toLowerCase().trim();
      }),
      hint: hint,
      setup: setup,
      calc: calc,
    };
  }

  function _normFormula(s) {
    let t = String(s).toLowerCase().trim();
    const replacements = [
      [" ", ""],
      ["×", "*"],
      ["·", "*"],
      ["3.14", "pi"],
      ["π", "pi"],
      ["²", "^2"],
      ["³", "^3"],
      ["**", "^"],
      ["½", "1/2"],
      ["1/2", "0.5"],
    ];
    for (let i = 0; i < replacements.length; i++) {
      t = t.split(replacements[i][0]).join(replacements[i][1]);
    }
    const prefixes = [
      "a=",
      "p=",
      "v=",
      "c=",
      "area=",
      "perimeter=",
      "volume=",
      "circumference=",
    ];
    for (let j = 0; j < prefixes.length; j++) {
      if (t.startsWith(prefixes[j])) {
        t = t.slice(prefixes[j].length);
      }
    }
    return t;
  }

  /** Strict numeric parse: locale decimals, simple a/b, reject trailing junk. */
  function parseNumericInput(raw) {
    let s = String(raw == null ? "" : raw)
      .trim()
      .replace(/\$/g, "")
      .replace(/\s/g, "")
      .replace(/½/g, "0.5");
    if (!s) return NaN;
    // European decimal comma (3,14) vs thousands (1,234)
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

  function getFormulaCards() {
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

  function genFormulaFlashcard() {
    const card = choice(getFormulaCards());
    const direction = choice(["recall", "recognize"]);
    if (direction === "recall") {
      return {
        id: id(),
        topic: "formulas",
        type: "flashcard",
        prompt: tVar("flash.recall", { front: card.front }),
        answer: card.back,
        answers: (card.answers.concat([card.back])).map(_normFormula),
        hint: card.hint,
        setup: t("flash.target_form", {
          left: card.back.split("=")[0].trim(),
        }),
        back: card.back,
        unit: "",
      };
    }
    const wrong = getFormulaCards().filter(function (c) {
      return c.back !== card.back;
    }).map(function (c) {
      return c.back;
    });
    const distractors = shuffle(wrong).slice(0, Math.min(3, wrong.length));
    const choices = [card.back].concat(distractors);
    return _choice(
      tVar("flash.recognize", { front: card.front }),
      choices,
      card.back,
      "formulas",
      card.hint,
      t("flash.match_hint", { left: card.back.split("=")[0].trim() })
    );
  }

  // --- Generators -------------------------------------------------------------

  function genFeetInYard() {
    return _numeric(tVar("q.feet_in_yard"), 3, "conversions", 0, t("h.feet_in_yard"), t("s.feet_in_yard"));
  }

  function genSqFtInSqYard() {
    return _numeric(tVar("q.sqft_sqyd"), 9, "conversions", 0, t("h.sqft_sqyd"), t("s.sqft_sqyd"));
  }

  function genCuFtInCuYard() {
    return _numeric(tVar("q.cuft_cuyd"), 27, "conversions", 0, t("h.cuft_cuyd"), t("s.cuft_cuyd"));
  }

  function genDimensionConcept() {
    return _choice(
      tVar("q.dim_concept"),
      [t("c.dim_a"), t("c.dim_b"), t("c.dim_c"), t("c.dim_d")],
      t("c.dim_a"),
      "conversions"
    );
  }

  function genFormulaSquarePerimeter() {
    return _choice(
      tVar("q.form_sq_p"),
      ["P = 4s", "P = s²", "P = 2s", "P = 6s"],
      "P = 4s",
      "formulas"
    );
  }

  function genFormulaSquareArea() {
    return _choice(
      tVar("q.form_sq_a"),
      ["A = s²", "A = 4s", "A = 2s", "A = s³"],
      "A = s²",
      "formulas"
    );
  }

  function genFormulaRectangle() {
    const which = choice(["perimeter", "area"]);
    if (which === "perimeter") {
      return _choice(
        tVar("q.form_rect_p"),
        ["P = 2L + 2W", "P = L × W", "P = L + W", "P = 4LW"],
        "P = 2L + 2W",
        "formulas"
      );
    }
    return _choice(
      tVar("q.form_rect_a"),
      ["A = L × W", "A = 2L + 2W", "A = L + W", "A = L² + W²"],
      "A = L × W",
      "formulas"
    );
  }

  function genFormulaTriangle() {
    const which = choice(["perimeter", "area"]);
    if (which === "perimeter") {
      return _choice(
        tVar("q.form_tri_p"),
        ["P = a + b + c", "P = ½bh", "P = ab + bc + ca", "P = abc"],
        "P = a + b + c",
        "formulas"
      );
    }
    return _choice(
      tVar("q.form_tri_a"),
      ["A = ½bh", "A = bh", "A = 2bh", "A = b + h"],
      "A = ½bh",
      "formulas"
    );
  }

  function genFormulaCircle() {
    const which = choice(["circumference", "area"]);
    if (which === "circumference") {
      return _choice(
        tVar("q.form_circ_c"),
        ["C = 2πr", "C = πr²", "C = πr", "C = 4πr"],
        "C = 2πr",
        "formulas",
        "Also written as C = πd where d is the diameter"
      );
    }
    return _choice(
      tVar("q.form_circ_a"),
      ["A = πr²", "A = 2πr", "A = πd", "A = 4πr²"],
      "A = πr²",
      "formulas"
    );
  }

  function genFormulaVolume() {
    const which = choice(["cube", "sphere", "cylinder"]);
    if (which === "cube") {
      return _choice(
        tVar("q.form_cube"),
        ["V = s³", "V = 6s²", "V = s²", "V = 4s"],
        "V = s³",
        "formulas"
      );
    }
    if (which === "sphere") {
      return _choice(
        tVar("q.form_sphere"),
        ["V = (4/3)πr³", "V = 4πr²", "V = πr²h", "V = (4/3)πr²"],
        "V = (4/3)πr³",
        "formulas"
      );
    }
    return _choice(
      tVar("q.form_cyl"),
      ["V = πr²h", "V = 2πrh", "V = (4/3)πr³", "V = πr²"],
      "V = πr²h",
      "formulas"
    );
  }

  function genPythagoreanFormula() {
    return _choice(
      tVar("q.form_pyth"),
      ["a² + b² = c²", "a + b = c", "a² − b² = c²", "a² + b² = c"],
      "a² + b² = c²",
      "formulas"
    );
  }

  function genRectanglePa() {
    const L = randInt(4, 20);
    const W = randInt(3, 15);
    const ask = choice(["perimeter", "area"]);
    if (ask === "perimeter") {
      return _numeric(
        tVar("q.rect_p", { L: L, W: W }),
        2 * (L + W),
        "perimeter_area",
        0,
        t("h.rect_p"),
        "P = 2(" + L + " + " + W + ")",
        t("unit.ft"),
        calcHelp(
          "2 × ( " + L + " + " + W + " ) =",
          "2 × ( " + L + " + " + W + " ) ="
        )
      );
    }
    return _numeric(
      tVar("q.rect_a", { L: L, W: W }),
      L * W,
      "perimeter_area",
      0,
      t("h.rect_a"),
      "A = " + L + " × " + W,
      t("unit.sq_ft"),
      calcHelp(L + " × " + W + " =", L + " × " + W + " =")
    );
  }

  function genTriangleArea() {
    const b = randInt(6, 24);
    const h = randInt(4, 18);
    return _numeric(
      tVar("q.tri_area", { b: b, h: h }),
      0.5 * b * h,
      "perimeter_area",
      0.01,
      t("h.tri_area"),
      "A = ½ × " + b + " × " + h,
      "",
      calcHelp(
        "0.5 × " + b + " × " + h + " =",
        "0.5 × " + b + " × " + h + " =",
        "Or use the fraction key: TI n/d or Casio ▢/▢ for 1/2, then × base × height."
      )
    );
  }

  function genCirclePa() {
    const r = choice([2, 3, 4, 5, 6, 7, 8, 10]);
    const ask = choice(["circumference", "area"]);
    if (ask === "circumference") {
      return _numeric(
        tVar("q.circ_c", { r: r, pi_note: piNote() }),
        num(2 * PI * r),
        "perimeter_area",
        0.02,
        t("h.circ_c"),
        "C = 2 × " + PI + " × " + r,
        "",
        calcHelp("2 × 3.14 × " + r + " =", "2 × 3.14 × " + r + " =")
      );
    }
    return _numeric(
      tVar("q.circ_a", { r: r, pi_note: piNote() }),
      num(PI * r * r),
      "perimeter_area",
      0.02,
      t("h.circ_a"),
      "A = " + PI + " × (" + r + ")²",
      "",
      calcHelp("3.14 × " + r + " x² =", "3.14 × " + r + " x² =")
    );
  }

  function _lShapeSvg(W, H, cutW, cutH) {
    // Padding keeps dimension labels inside the viewBox (no clipping).
    const padL = 40;
    const padR = 36;
    const padT = 32;
    const padB = 24;
    const maxDrawW = 300;
    const maxDrawH = 220;
    const s = Math.min(maxDrawW / W, maxDrawH / H);
    const ow = W * s;
    const oh = H * s;
    const cw = cutW * s;
    const ch = cutH * s;
    const ox = padL;
    const oy = padT;
    const vbW = padL + ow + padR;
    const vbH = padT + oh + padB;

    const path =
      "M" +
      ox.toFixed(1) +
      "," +
      oy.toFixed(1) +
      " H" +
      (ox + ow).toFixed(1) +
      " V" +
      (oy + oh - ch).toFixed(1) +
      " H" +
      (ox + ow - cw).toFixed(1) +
      " V" +
      (oy + oh).toFixed(1) +
      " H" +
      ox.toFixed(1) +
      " Z";

    return (
      '<svg viewBox="0 0 ' +
      vbW.toFixed(1) +
      " " +
      vbH.toFixed(1) +
      '" xmlns="http://www.w3.org/2000/svg" class="q-svg" role="img" aria-label="L-shaped figure">' +
      '<path d="' +
      path +
      '" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2" stroke-linejoin="round"/>' +
      // Outer width (top)
      '<text x="' +
      (ox + ow / 2).toFixed(1) +
      '" y="' +
      (oy - 10).toFixed(1) +
      '" text-anchor="middle" dominant-baseline="auto" font-size="14" font-family="IBM Plex Sans, sans-serif" fill="#1e3a5f">' +
      W +
      "</text>" +
      // Outer height (left)
      '<text x="' +
      (ox - 12).toFixed(1) +
      '" y="' +
      (oy + oh / 2).toFixed(1) +
      '" text-anchor="end" dominant-baseline="middle" font-size="14" font-family="IBM Plex Sans, sans-serif" fill="#1e3a5f">' +
      H +
      "</text>" +
      // Cut width (inner notch, horizontal)
      '<text x="' +
      (ox + ow - cw / 2).toFixed(1) +
      '" y="' +
      (oy + oh - ch - 8).toFixed(1) +
      '" text-anchor="middle" font-size="13" font-family="IBM Plex Sans, sans-serif" fill="#b45309">' +
      cutW +
      "</text>" +
      // Cut height (inner notch, vertical)
      '<text x="' +
      (ox + ow - cw + 14).toFixed(1) +
      '" y="' +
      (oy + oh - ch / 2).toFixed(1) +
      '" text-anchor="start" dominant-baseline="middle" font-size="13" font-family="IBM Plex Sans, sans-serif" fill="#b45309">' +
      cutH +
      "</text>" +
      "</svg>"
    );
  }

  function _triRectSemiSvg(a, b, r) {
    // Right triangle (base a) + rectangle (width b, height 2r) + right semicircle (radius r).
    const h = 2 * r;
    const padL = 36;
    const padR = 48;
    const padT = 28;
    const padB = 36;
    const maxDrawW = 340;
    const maxDrawH = 200;
    const s = Math.min(maxDrawW / (a + b + r), maxDrawH / h);
    const A = a * s;
    const B = b * s;
    const H = h * s;
    const R = r * s;
    const ox = padL;
    const oy = padT;
    const x1 = ox; // left of triangle base
    const x2 = ox + A; // triangle/rect join (bottom)
    const x3 = ox + A + B; // diameter line (rect right)
    const yTop = oy;
    const yBot = oy + H;
    const cy = oy + H / 2; // semicircle center

    // Outer path: bottom L→R, arc, top R→L, hypotenuse
    const path =
      "M" +
      x1.toFixed(1) +
      "," +
      yBot.toFixed(1) +
      " H" +
      x3.toFixed(1) +
      " A" +
      R.toFixed(1) +
      "," +
      R.toFixed(1) +
      " 0 0 0 " +
      x3.toFixed(1) +
      "," +
      yTop.toFixed(1) +
      " H" +
      x2.toFixed(1) +
      " L" +
      x1.toFixed(1) +
      "," +
      yBot.toFixed(1) +
      " Z";

    const vbW = padL + A + B + R + padR;
    const vbH = padT + H + padB;

    return (
      '<svg viewBox="0 0 ' +
      vbW.toFixed(1) +
      " " +
      vbH.toFixed(1) +
      '" xmlns="http://www.w3.org/2000/svg" class="q-svg" role="img" aria-label="Triangle, rectangle, and semicircle figure">' +
      '<path d="' +
      path +
      '" fill="#bfdbfe" stroke="#1e3a5f" stroke-width="2.5" stroke-linejoin="round"/>' +
      // Diameter line (visual cue)
      '<line x1="' +
      x3.toFixed(1) +
      '" y1="' +
      yTop.toFixed(1) +
      '" x2="' +
      x3.toFixed(1) +
      '" y2="' +
      yBot.toFixed(1) +
      '" stroke="#1e3a5f" stroke-width="1.5"/>' +
      // Center dot
      '<circle cx="' +
      x3.toFixed(1) +
      '" cy="' +
      cy.toFixed(1) +
      '" r="3" fill="#1e3a5f"/>' +
      // Triangle base a
      '<text x="' +
      (x1 + A / 2).toFixed(1) +
      '" y="' +
      (yBot + 18).toFixed(1) +
      '" text-anchor="middle" font-size="14" font-family="IBM Plex Sans, sans-serif" fill="#1e3a5f">' +
      a +
      "</text>" +
      // Rectangle width b
      '<text x="' +
      (x2 + B / 2).toFixed(1) +
      '" y="' +
      (yBot + 18).toFixed(1) +
      '" text-anchor="middle" font-size="14" font-family="IBM Plex Sans, sans-serif" fill="#1e3a5f">' +
      b +
      "</text>" +
      // Radius r (from center down)
      '<line x1="' +
      x3.toFixed(1) +
      '" y1="' +
      cy.toFixed(1) +
      '" x2="' +
      x3.toFixed(1) +
      '" y2="' +
      yBot.toFixed(1) +
      '" stroke="#b45309" stroke-width="1.25" stroke-dasharray="3 2"/>' +
      '<text x="' +
      (x3 + 12).toFixed(1) +
      '" y="' +
      ((cy + yBot) / 2).toFixed(1) +
      '" text-anchor="start" dominant-baseline="middle" font-size="14" font-family="IBM Plex Sans, sans-serif" fill="#b45309">' +
      r +
      "</text>" +
      "</svg>"
    );
  }

  function genCompositeTriRectSemi() {
    // Matches textbook-style composites: △ + rectangle + semicircle (diameter = height).
    const a = choice([3, 4, 5, 6]);
    const b = choice([4, 5, 6, 7, 8]);
    const r = choice([2, 3, 4, 5]);
    const h = 2 * r;
    const hypot = Math.sqrt(a * a + h * h);
    const area = a * r + 2 * b * r + 0.5 * PI * r * r;
    // Outer path: bottom (a+b) + semicircle arc (πr) + top of rect (b) + hypotenuse
    const perimeter = a + 2 * b + PI * r + hypot;
    const ask = choice(["perimeter", "area"]);
    const svg = _triRectSemiSvg(a, b, r);

    if (ask === "area") {
      return {
        id: id(),
        topic: "perimeter_area",
        type: "numeric",
        prompt: tVar("q.combo_trs_a", {
          a: a,
          b: b,
          r: r,
          pi_note: piNote(),
        }),
        answer: num(area),
        tolerance: 0.05,
        hint: t("h.combo_trs_a"),
        setup:
          "h = 2r = " +
          h +
          "\nA = ½·a·h + b·h + ½·π·r²\nA = ½·" +
          a +
          "·" +
          h +
          " + " +
          b +
          "·" +
          h +
          " + ½·" +
          PI +
          "·(" +
          r +
          ")²",
        calc: calcHelp(
          "0.5 × " + a + " × " + h + " + " + b + " × " + h + " + 0.5 × 3.14 × " + r + " x² =",
          "0.5 × " + a + " × " + h + " + " + b + " × " + h + " + 0.5 × 3.14 × " + r + " x² ="
        ),
        unit: t("unit.sq_units"),
        svg: svg,
      };
    }
    return {
      id: id(),
      topic: "perimeter_area",
      type: "numeric",
      prompt: tVar("q.combo_trs_p", {
        a: a,
        b: b,
        r: r,
        pi_note: piNote(),
      }),
      answer: num(perimeter),
      tolerance: 0.05,
      hint: t("h.combo_trs_p"),
      setup:
        "h = 2r = " +
        h +
        "\nhypotenuse = √(a² + h²) = √(" +
        a +
        "² + " +
        h +
        "²)\nP = a + 2b + πr + hypotenuse\nP = " +
        a +
        " + 2·" +
        b +
        " + " +
        PI +
        "·" +
        r +
        " + √(" +
        a +
        "² + " +
        h +
        "²)",
      calc: calcHelp(
        a +
          " + 2 × " +
          b +
          " + 3.14 × " +
          r +
          " + √( " +
          a +
          " x² + " +
          h +
          " x² ) =",
        a +
          " + 2 × " +
          b +
          " + 3.14 × " +
          r +
          " + √( " +
          a +
          " x² + " +
          h +
          " x² ) ="
      ),
      unit: t("unit.units"),
      svg: svg,
    };
  }

  function genCompositeLShape() {
    let W = choice([8, 10, 12, 14, 16]);
    let H = choice([10, 12, 14, 16, 18]);
    let cutW = choice([3, 4, 5, 6]);
    let cutH = choice([4, 5, 6, 7]);
    while (cutW >= W || cutH >= H) {
      cutW = choice([3, 4, 5]);
      cutH = choice([4, 5, 6]);
    }

    const area = W * H - cutW * cutH;
    const perimeter = 2 * (W + H);
    const ask = choice(["perimeter", "area"]);

    if (ask === "area") {
      return {
        id: id(),
        topic: "perimeter_area",
        type: "numeric",
        prompt: tVar("q.lshape_a", { W: W, H: H, cutW: cutW, cutH: cutH }),
        answer: area,
        tolerance: 0,
        hint: t("h.lshape_a"),
        setup: "A = (" + W + " × " + H + ") − (" + cutW + " × " + cutH + ")",
        calc: calcHelp(
          "( " + W + " × " + H + " ) − ( " + cutW + " × " + cutH + " ) =",
          "( " + W + " × " + H + " ) − ( " + cutW + " × " + cutH + " ) ="
        ),
        unit: t("unit.sq_units"),
        svg: _lShapeSvg(W, H, cutW, cutH),
      };
    }
    return {
      id: id(),
      topic: "perimeter_area",
      type: "numeric",
      prompt: tVar("q.lshape_p", { W: W, H: H, cutW: cutW, cutH: cutH }),
      answer: perimeter,
      tolerance: 0,
      hint: t("h.lshape_p"),
      setup: "P = 2(" + W + " + " + H + ")",
      calc: calcHelp(
        "2 × ( " + W + " + " + H + " ) =",
        "2 × ( " + W + " + " + H + " ) ="
      ),
      unit: t("unit.units"),
      svg: _lShapeSvg(W, H, cutW, cutH),
    };
  }

  function _inches(ft, inch) {
    return ft + inch / 12;
  }

  function genFence() {
    const ft1 = randInt(8, 18);
    const in1 = randInt(0, 11);
    const ft2 = randInt(10, 22);
    const in2 = randInt(0, 11);
    const L = _inches(ft1, in1);
    const W = _inches(ft2, in2);
    const peri = 2 * (L + W);
    const rolls = peri <= 50 ? t("c.roll_50") : t("c.roll_100");
    const which = choice(["need", "roll"]);

    if (which === "need") {
      return _numeric(
        tVar("q.fence_need", { ft1: ft1, in1: in1, ft2: ft2, in2: in2 }),
        num(peri),
        "perimeter_area",
        0.05,
        t("h.fence"),
        "L = " + ft1 + " + " + in1 + "/12,  W = " + ft2 + " + " + in2 + "/12\nP = 2(L + W)",
        t("unit.ft"),
        calcHelp(
          "2 × ( (" + ft1 + " + " + in1 + " ÷ 12) + (" + ft2 + " + " + in2 + " ÷ 12) ) =",
          "2 × ( (" + ft1 + " + " + in1 + " ÷ 12) + (" + ft2 + " + " + in2 + " ÷ 12) ) ="
        )
      );
    }
    return _choice(
      tVar("q.fence_roll", { ft1: ft1, in1: in1, ft2: ft2, in2: in2 }),
      [t("c.roll_50"), t("c.roll_100")],
      rolls,
      "perimeter_area",
      t("h.fence_roll"),
      "L = " +
        ft1 +
        " + " +
        in1 +
        "/12,  W = " +
        ft2 +
        " + " +
        in2 +
        "/12\nP = 2(L + W)  → compare P to 50 and to 100 (do not skip the comparison).",
      calcHelp(
        "2 × ( (" + ft1 + " + " + in1 + " ÷ 12) + (" + ft2 + " + " + in2 + " ÷ 12) ) =",
        "2 × ( (" + ft1 + " + " + in1 + " ÷ 12) + (" + ft2 + " + " + in2 + " ÷ 12) ) =",
        "After you get P, pick 50-foot if P ≤ 50, otherwise 100-foot. The hint does not state which roll."
      )
    );
  }

  function genSoupCan() {
    const dNum = choice([2.5, 2.75, 3, 3.25, 3.5]);
    const h = choice([4, 4.5, 5, 5.5, 6]);
    const r = dNum / 2;
    const vol = PI * r * r * h;
    return _numeric(
      tVar("q.soup", { d: dNum, h: h, pi_note: piNote() }),
      num(vol),
      "volume",
      0.02,
      t("h.soup"),
      "r = " + dNum + "/2\nV = " + PI + " × (r)² × " + h,
      t("unit.cu_in"),
      calcHelp(
        "3.14 × ( " + dNum + " ÷ 2 ) x² × " + h + " =",
        "3.14 × ( " + dNum + " ÷ 2 ) x² × " + h + " ="
      )
    );
  }

  function genDriveway() {
    const run = randInt(8, 20);
    const rise = randInt(2, 6);
    const slant = Math.sqrt(run * run + rise * rise);
    const ask = choice(["slope", "length"]);

    if (ask === "slope") {
      const g = gcd(rise, run);
      const sr = rise / g;
      const sn = run / g;
      const answers = [
        rise + ":" + run,
        rise + "/" + run,
        sr + ":" + sn,
        sr + "/" + sn,
        rise + " to " + run,
        sr + " to " + sn,
      ];
      return _short(
        tVar("q.drive_slope", { rise: rise, run: run }),
        answers,
        "pythagorean",
        t("h.drive_slope"),
        "slope = " + rise + "/" + run + "  (simplify if possible)",
        calcHelp(
          rise + " ÷ " + run + " =   (or leave as " + rise + "/" + run + " and simplify)",
          rise + " ÷ " + run + " =   (or use fraction key " + rise + " ▢/▢ " + run + ")",
          "For a ratio answer, write rise:run in simplest form—you may not need the calculator."
        )
      );
    }
    return _numeric(
      tVar("q.drive_len", { rise: rise, run: run }),
      num(slant),
      "pythagorean",
      0.05,
      t("h.drive_len"),
      "c = √(" + rise + "² + " + run + "²)",
      t("unit.ft"),
      calcHelp(
        "2nd x² ( " + rise + " x² + " + run + " x² ) =   then ◄► if needed",
        "√ ( " + rise + " x² + " + run + " x² ) =   then S⇔D if needed"
      )
    );
  }

  function genTv() {
    const diagonal = choice([50, 55, 60, 65, 70, 75]);
    const width = num(diagonal * (0.82 + Math.random() * 0.08), 1);
    const height = Math.sqrt(diagonal * diagonal - width * width);
    return _numeric(
      tVar("q.tv", { diagonal: diagonal, width: width }),
      num(height, 1),
      "pythagorean",
      0.15,
      t("h.tv"),
      "height = √(" + diagonal + "² − " + width + "²)",
      t("unit.inches"),
      calcHelp(
        "2nd x² ( " + diagonal + " x² − " + width + " x² ) =   then ◄► ; round to tenth",
        "√ ( " + diagonal + " x² − " + width + " x² ) =   then S⇔D ; round to tenth",
        "Round to the nearest tenth (one decimal place)."
      )
    );
  }

  function genGallonsLiters() {
    const gallons = choice([1, 2, 5, 10]);
    const bottleL = choice([1, 1.5, 2]);
    const liters = gallons * 3.785;
    const bottles = liters / bottleL;
    return _numeric(
      tVar("q.gal_l", { gallons: gallons, bottleL: bottleL }),
      num(bottles),
      "scale_rates",
      0.05,
      t("h.gal_l"),
      "liters = " +
        gallons +
        " × 3.785\nbottles = (" +
        gallons +
        " × 3.785) / " +
        bottleL,
      "",
      calcHelp(
        "( " + gallons + " × 3.785 ) ÷ " + bottleL + " =",
        "( " + gallons + " × 3.785 ) ÷ " + bottleL + " ="
      )
    );
  }


  function genMapScale() {
    const scaleFt = choice([40, 50, 100, 200]);
    const ask = choice(["map_to_real", "real_to_map"]);

    if (ask === "map_to_real") {
      const inches = choice([1.5, 2, 2.5, 3, 3.5, 4, 5]);
      return _numeric(
        tVar("q.map_to_real", { scaleFt: scaleFt, inches: inches }),
        inches * scaleFt,
        "scale_rates",
        0,
        t("h.map_to_real"),
        "feet = " + inches + " × " + scaleFt,
        t("unit.ft"),
        calcHelp(
          inches + " × " + scaleFt + " =",
          inches + " × " + scaleFt + " ="
        )
      );
    }
    const feet = choice([100, 150, 200, 220, 250, 300, 400]);
    return _numeric(
      tVar("q.real_to_map", { scaleFt: scaleFt, feet: feet }),
      num(feet / scaleFt),
      "scale_rates",
      0.01,
      t("h.real_to_map"),
      "inches = " + feet + " / " + scaleFt,
      t("unit.inches"),
      calcHelp(feet + " ÷ " + scaleFt + " =", feet + " ÷ " + scaleFt + " =")
    );
  }


  function genCarpet() {
    const L = randInt(10, 16);
    const W = randInt(12, 22);
    const rollW = choice([12, 13, 15]);
    let linear;
    if (rollW >= L) {
      linear = W;
    } else if (rollW >= W) {
      linear = L;
    } else {
      const strips = Math.ceil(L / rollW);
      linear = strips * W;
    }

    const costPerLinear = choice([25, 27, 29, 32]);
    const costRoll = linear * costPerLinear;
    const areaSqft = L * W;
    const areaSqyd = areaSqft / 9;
    const costPerSqyd = choice([20, 23, 25, 28]);
    const costYd = areaSqyd * costPerSqyd;
    const ask = choice(["roll", "yard", "cheaper"]);

    if (ask === "roll") {
      return _numeric(
        tVar("q.carpet_roll", { L: L, W: W, rollW: rollW, cost: costPerLinear }),
        num(costRoll),
        "scale_rates",
        0.5,
        t("h.carpet_roll"),
        "linear feet needed = " + linear + "\ncost = " + linear + " × " + costPerLinear,
        t("unit.dollars"),
        calcHelp(
          linear + " × " + costPerLinear + " =",
          linear + " × " + costPerLinear + " =",
          "Round to the nearest cent."
        )
      );
    }
    if (ask === "yard") {
      return _numeric(
        tVar("q.carpet_yd", { L: L, W: W, cost: costPerSqyd }),
        num(costYd),
        "scale_rates",
        0.5,
        t("h.carpet_yd"),
        "sq yd = (" +
          L +
          " × " +
          W +
          ") / 9\ncost = [(" +
          L +
          " × " +
          W +
          ") / 9] × " +
          costPerSqyd,
        t("unit.dollars"),
        calcHelp(
          "( " + L + " × " + W + " ÷ 9 ) × " + costPerSqyd + " =",
          "( " + L + " × " + W + " ÷ 9 ) × " + costPerSqyd + " =",
          "Round to the nearest cent."
        )
      );
    }
    const cheaper = costRoll < costYd ? t("c.carpet_roll") : t("c.carpet_yd");
    return _choice(
      tVar("q.carpet_cmp", {
        L: L,
        W: W,
        rollW: rollW,
        costLin: costPerLinear,
        costYd: costPerSqyd,
      }),
      [t("c.carpet_roll"), t("c.carpet_yd")],
      cheaper,
      "scale_rates",
      t("h.carpet_cmp"),
      "Roll: linear feet × " +
        costPerLinear +
        " (linear feet depends on covering " +
        L +
        "×" +
        W +
        " with width " +
        rollW +
        ")\nSq yd: ((" +
        L +
        " × " +
        W +
        ") / 9) × " +
        costPerSqyd,
      calcHelp(
        "Find each total with × and ÷ as in the setup, then compare the two results.",
        "Find each total with × and ÷ as in the setup, then compare the two results.",
        "The cheaper option is the one with the smaller total. Hints never state which option wins."
      )
    );
  }


  function genPizza() {
    const small = choice([8, 9, 10]);
    const large = small * 2;
    const aTwo = 2 * PI * Math.pow(small / 2, 2);
    const aOne = PI * Math.pow(large / 2, 2);
    const ask = choice(["compare", "double"]);

    if (ask === "compare") {
      const twoLabel = t("c.pizza_two", { small: small });
      const oneLabel = t("c.pizza_one", { large: large });
      const eqLabel = t("c.pizza_eq");
      const more = aOne > aTwo ? oneLabel : twoLabel;
      return _choice(
        tVar("q.pizza_cmp", { small: small, large: large, pi_note: piNote() }),
        [twoLabel, oneLabel, eqLabel],
        Math.abs(aOne - aTwo) > 0.01 ? more : eqLabel,
        "scaling",
        t("h.pizza_cmp"),
        "Two small: 2 × " +
          PI +
          " × (" +
          small +
          "/2)²    One large: " +
          PI +
          " × (" +
          large +
          "/2)²"
      );
    }
    return _choice(
      tVar("q.pizza_double"),
      [
        t("c.pizza_4x"),
        t("c.pizza_2x"),
        t("c.pizza_3x"),
        t("c.pizza_same"),
      ],
      t("c.pizza_4x"),
      "scaling",
      t("h.pizza_double"),
      "A_new = π(2r)² = π·4r² = 4 · (πr²)"
    );
  }


  function genBallAir() {
    const base = choice([100, 120, 150, 200]);
    const ask = choice(["double", "half"]);

    if (ask === "double") {
      return _numeric(
        tVar("q.ball_double", { base: base }),
        base * 8,
        "scaling",
        0,
        t("h.ball_double"),
        "V_new = " + base + " × 2³ = " + base + " × 8",
        t("unit.cu_in"),
        calcHelp(
          base + " × 8 =",
          base + " × 8 =",
          "Or compute 2³ first: TI/Casio 2 ^ 3 = (or 2 x³ on Casio), then multiply by " + base + "."
        )
      );
    }
    return _numeric(
      tVar("q.ball_half", { base: base }),
      base / 8,
      "scaling",
      0.01,
      t("h.ball_half"),
      "V_new = " + base + " × (1/2)³ = " + base + " × (1/8)",
      t("unit.cu_in"),
      calcHelp(
        base + " ÷ 8 =",
        base + " ÷ 8 =",
        "Or (1÷2) ^ 3 × " + base + " on TI/Casio."
      )
    );
  }

  function _dataSet(n) {
    if (n === undefined) n = 8;
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push(randInt(1, 40));
    }
    return out;
  }

  function _mean(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length;
  }

  function _median(data) {
    const s = data.slice().sort(function (a, b) {
      return a - b;
    });
    const n = s.length;
    const mid = Math.floor(n / 2);
    if (n % 2) return s[mid];
    return (s[mid - 1] + s[mid]) / 2;
  }

  function _mode(data) {
    const counts = {};
    for (let i = 0; i < data.length; i++) {
      const x = data[i];
      counts[x] = (counts[x] || 0) + 1;
    }
    let m = 0;
    for (const k in counts) {
      if (counts[k] > m) m = counts[k];
    }
    if (m === 1) return null;
    const modes = [];
    for (const k in counts) {
      if (counts[k] === m) modes.push(Number(k));
    }
    return modes.length === 1 ? modes[0] : null;
  }

  function _range(data) {
    return Math.max.apply(null, data) - Math.min.apply(null, data);
  }


  function genMeanMedianModeRange() {
    const base = [];
    for (let i = 0; i < 5; i++) base.push(randInt(5, 35));
    const modeVal = choice(base);
    const data = base.concat([modeVal, modeVal, randInt(5, 35)]);
    shuffle(data);
    const ask = choice(["mean", "median", "mode", "range"]);
    const ds = "{" + data.join(", ") + "}";

    if (ask === "mean") {
      const terms = data.join(" + ");
      return _numeric(
        tVar("q.mean", { ds: ds }),
        num(_mean(data)),
        "stats_center",
        0.05,
        t("h.mean"),
        "mean = (" + terms + ") / " + data.length,
        "",
        calcHelp(
          "( " + terms + " ) ÷ " + data.length + " =",
          "( " + terms + " ) ÷ " + data.length + " ="
        )
      );
    }
    if (ask === "median") {
      const sorted = data.slice().sort(function (a, b) {
        return a - b;
      });
      const sortedDs = "{" + sorted.join(", ") + "}";
      return _numeric(
        tVar("q.median", { ds: ds }),
        _median(data),
        "stats_center",
        0.01,
        t("h.median"),
        "Sorted: " + sortedDs
      );
    }
    if (ask === "mode") {
      const m = _mode(data);
      if (m === null) return genMeanMedianModeRange();
      return _numeric(
        tVar("q.mode", { ds: ds }),
        m,
        "stats_center",
        0,
        t("h.mode"),
        "Count how many times each value appears; pick the most frequent."
      );
    }
    return _numeric(
      tVar("q.range", { ds: ds }),
      _range(data),
      "stats_center",
      0,
      t("h.range"),
      "range = " + Math.max.apply(null, data) + " − " + Math.min.apply(null, data)
    );
  }

  function genBestMeasureFixed() {
    const options = [
      [tVar("q.best_outliers"), t("c.median"), t("h.best_outliers")],
      [tVar("q.best_cat"), t("c.mode"), t("h.best_cat")],
      [tVar("q.best_sym"), t("c.mean"), t("h.best_sym")],
    ];
    const picked = choice(options);
    return _choice(
      picked[0],
      [t("c.mean"), t("c.median"), t("c.mode"), t("c.range")],
      picked[1],
      "stats_center",
      picked[2]
    );
  }


  function genRangeRule() {
    const data = _dataSet(8);
    data[0] = 2;
    data[1] = 40;
    const approxSd = _range(data) / 4;
    const ds = "{" + data.join(", ") + "}";
    return _numeric(
      tVar("q.range_rule", { ds: ds }),
      num(approxSd),
      "stats_spread",
      0.05,
      t("h.range_rule"),
      "s ≈ (" + Math.max.apply(null, data) + " − " + Math.min.apply(null, data) + ") / 4",
      "",
      calcHelp(
        "( " + Math.max.apply(null, data) + " − " + Math.min.apply(null, data) + " ) ÷ 4 =",
        "( " + Math.max.apply(null, data) + " − " + Math.min.apply(null, data) + " ) ÷ 4 ="
      )
    );
  }

  function genCompareVariation() {
    const d1 = [10, 2, 38, 23, 38, 23, 21, 23];
    const d2 = [13, 30, 23, 23, 21, 23, 25, 20];
    const s1 = _range(d1) / 4;
    const s2 = _range(d2) / 4;
    const more = s1 > s2 ? t("c.ds1") : t("c.ds2");
    const ask = choice(["sd", "which"]);

    if (ask === "sd") {
      const which = choice([
        [d1, t("c.ds1"), s1],
        [d2, t("c.ds2"), s2],
      ]);
      const ds = "{" + which[0].join(", ") + "}";
      return _numeric(
        tVar("q.compare_sd", { which: which[1], ds: ds }),
        num(which[2]),
        "stats_spread",
        0.05,
        t("h.compare_sd"),
        "s ≈ (" +
          Math.max.apply(null, which[0]) +
          " − " +
          Math.min.apply(null, which[0]) +
          ") / 4"
      );
    }
    return _choice(
      tVar("q.compare_which", {
        d1: "{" + d1.join(", ") + "}",
        d2: "{" + d2.join(", ") + "}",
      }),
      [t("c.ds1"), t("c.ds2"), t("c.equal")],
      Math.abs(s1 - s2) > 0.01 ? more : t("c.equal"),
      "stats_spread",
      t("h.compare_which"),
      "s1 ≈ " + num(s1) + ",  s2 ≈ " + num(s2) + "  (from range/4)"
    );
  }

  function genSdTf() {
    return _choice(
      tVar("q.sd_tf"),
      [t("c.true"), t("c.false")],
      t("c.false"),
      "stats_spread",
      t("h.sd_tf")
    );
  }

  function genZScore() {
    const mean = choice([70, 75, 80, 84.4, 90, 100]);
    const sd = choice([5, 8, 10, 12, 13.33, 15]);
    const score = choice([55, 60, 65, 70, 78, 85, 92, 95, 105]);
    const z = (score - mean) / sd;
    return _numeric(
      tVar("q.zscore", { mean: mean, sd: sd, score: score }),
      num(z),
      "z_scores",
      0.05,
      t("h.zscore"),
      "z = (" + score + " − " + mean + ") / " + sd,
      "",
      calcHelp(
        "( " + score + " − " + mean + " ) ÷ " + sd + " =",
        "( " + score + " − " + mean + " ) ÷ " + sd + " ="
      )
    );
  }

  const Z_TABLE = {
    "-2.5": 0.0062,
    "-2.4": 0.0082,
    "-2.3": 0.0107,
    "-2.0": 0.0228,
    "-1.5": 0.0668,
    "-1.3": 0.0968,
    "-1.0": 0.1587,
    "-0.5": 0.3085,
    "0.0": 0.5,
    "0.5": 0.6915,
    "1.0": 0.8413,
    "1.3": 0.9032,
    "1.5": 0.9332,
    "2.0": 0.9772,
    "2.3": 0.9893,
    "2.4": 0.9918,
    "2.5": 0.9938,
  };


  function genPercentileFromZ() {
    // Keep z keys as fixed decimals so Z_TABLE lookup stays stable (String(1.0) === "1").
    const zKeys = ["-1.3", "-1.0", "1.0", "1.3", "2.0", "2.4"];
    const zKey = choice(zKeys);
    const z = parseFloat(zKey);
    const p = Z_TABLE[zKey] * 100;
    return _numeric(
      tVar("q.pct_from_z", { z: z }),
      Math.round(p),
      "z_scores",
      2,
      t("h.pct_from_z")
    );
  }


  function genZFromPercentile() {
    const pairs = [
      [50, 0.0],
      [56, 0.15],
      [84, 1.0],
      [16, -1.0],
      [97.5, 2.0],
      [2.5, -2.0],
    ];
    const picked = choice(pairs);
    const pct = picked[0];
    const z = picked[1];
    return _numeric(
      tVar("q.z_from_pct", { pct: pct }),
      z,
      "z_scores",
      0.2,
      "≈50th → z≈0; ≈84th → z≈1; ≈16th → z≈−1"
    );
  }

  function _skewHistogramSvg(kind, showMarkers) {
    // Bar heights (relative) — left = long left tail / peak on right; right = opposite.
    let heights;
    let label;
    if (kind === "left") {
      heights = [1.2, 1.6, 2.2, 3.0, 4.2, 6.0, 8.5, 7.2];
      label = "Left-skewed histogram";
    } else if (kind === "right") {
      heights = [7.2, 8.5, 6.0, 4.2, 3.0, 2.2, 1.6, 1.2];
      label = "Right-skewed histogram";
    } else {
      heights = [5.0, 5.4, 4.9, 5.6, 5.1, 5.5, 4.8, 5.2];
      label = "Roughly uniform histogram";
    }

    const padL = 28;
    const padR = 16;
    const padT = 18;
    const padB = showMarkers ? 32 : 22;
    const plotW = 280;
    const plotH = 140;
    const n = heights.length;
    const gap = 4;
    const barW = (plotW - gap * (n - 1)) / n;
    const maxH = Math.max.apply(null, heights);
    const ox = padL;
    const oy = padT;
    const baseY = oy + plotH;
    const vbW = padL + plotW + padR;
    const vbH = padT + plotH + padB;

    let bars = "";
    for (let i = 0; i < n; i++) {
      const bh = (heights[i] / maxH) * (plotH - 4);
      const x = ox + i * (barW + gap);
      const y = baseY - bh;
      bars +=
        '<rect x="' +
        x.toFixed(1) +
        '" y="' +
        y.toFixed(1) +
        '" width="' +
        barW.toFixed(1) +
        '" height="' +
        bh.toFixed(1) +
        '" fill="#93c5fd" stroke="#1e3a5f" stroke-width="1.25" rx="2"/>';
    }

    let markers = "";
    if (showMarkers && (kind === "left" || kind === "right")) {
      const meanX =
        kind === "left" ? ox + plotW * 0.28 : ox + plotW * 0.72;
      const medX = ox + plotW * 0.5;
      const modeX =
        kind === "left" ? ox + plotW * 0.78 : ox + plotW * 0.22;
      const mk = function (x, txt, color) {
        return (
          '<line x1="' +
          x.toFixed(1) +
          '" y1="' +
          oy.toFixed(1) +
          '" x2="' +
          x.toFixed(1) +
          '" y2="' +
          baseY.toFixed(1) +
          '" stroke="' +
          color +
          '" stroke-width="1.5" stroke-dasharray="3 2"/>' +
          '<text x="' +
          x.toFixed(1) +
          '" y="' +
          (baseY + 16).toFixed(1) +
          '" text-anchor="middle" font-size="10" font-family="IBM Plex Sans, sans-serif" fill="' +
          color +
          '">' +
          txt +
          "</text>"
        );
      };
      markers =
        mk(meanX, "mean", "#b45309") +
        mk(medX, "median", "#0f6e56") +
        mk(modeX, "mode", "#1e3a5f");
    }

    return (
      '<svg viewBox="0 0 ' +
      vbW.toFixed(1) +
      " " +
      vbH.toFixed(1) +
      '" xmlns="http://www.w3.org/2000/svg" class="q-svg" role="img" aria-label="' +
      label +
      '">' +
      '<rect x="' +
      ox.toFixed(1) +
      '" y="' +
      oy.toFixed(1) +
      '" width="' +
      plotW.toFixed(1) +
      '" height="' +
      plotH.toFixed(1) +
      '" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>' +
      bars +
      '<line x1="' +
      ox.toFixed(1) +
      '" y1="' +
      baseY.toFixed(1) +
      '" x2="' +
      (ox + plotW).toFixed(1) +
      '" y2="' +
      baseY.toFixed(1) +
      '" stroke="#1e3a5f" stroke-width="1.5"/>' +
      markers +
      "</svg>"
    );
  }

  function genSkewHistogram() {
    const skew = choice(["right", "left", "uniform"]);
    let prompt;
    let answer;
    let effect;

    if (skew === "right") {
      prompt = tVar("q.skew_right");
      answer = t("c.skew_right");
      effect = t("h.skew_right_effect");
    } else if (skew === "left") {
      prompt = tVar("q.skew_left");
      answer = t("c.skew_left");
      effect = t("h.skew_left_effect");
    } else {
      prompt = tVar("q.skew_uniform");
      answer = t("c.skew_uniform");
      effect = t("h.skew_uniform_effect");
    }

    const ask = choice(["shape", "effect"]);
    const svg = _skewHistogramSvg(skew, ask === "effect");
    let q;
    if (ask === "shape") {
      q = _choice(
        prompt,
        [
          t("c.skew_left"),
          t("c.skew_right"),
          t("c.skew_uniform"),
          t("c.skew_impossible"),
        ],
        answer,
        "distributions",
        t("h.skew_shape")
      );
    } else {
      q = _choice(
        prompt + " " + tVar("q.skew_effect_follow"),
        [
          effect,
          t("c.skew_wrong_a"),
          t("c.skew_wrong_b"),
          t("c.skew_wrong_c"),
        ],
        effect,
        "distributions"
      );
    }
    q.svg = svg;
    return q;
  }

  function genEmpiricalRule() {
    const mean = choice([70, 75, 80]);
    const sd = choice([5, 10, 15]);
    const ask = choice(["1sd", "2sd", "3sd_beyond", "below_1"]);

    if (ask === "1sd") {
      const lo = mean - sd;
      const hi = mean + sd;
      return _choice(
        tVar("q.emp_1sd", { mean: mean, sd: sd, lo: lo, hi: hi }),
        [t("c.pct68"), t("c.pct95"), t("c.pct997"), t("c.pct50")],
        t("c.pct68"),
        "distributions",
        t("h.emp_1sd")
      );
    }
    if (ask === "2sd") {
      const lo = mean - 2 * sd;
      const hi = mean + 2 * sd;
      return _choice(
        tVar("q.emp_2sd", { mean: mean, sd: sd, lo: lo, hi: hi }),
        [t("c.pct95"), t("c.pct68"), t("c.pct997"), t("c.pct34")],
        t("c.pct95"),
        "distributions",
        t("h.emp_2sd")
      );
    }
    if (ask === "3sd_beyond") {
      const cut = mean + 3 * sd;
      return _choice(
        tVar("q.emp_3sd", { mean: mean, sd: sd, cut: cut }),
        [t("c.pct015"), t("c.pct25"), t("c.pct16"), t("c.pct5")],
        t("c.pct015"),
        "distributions",
        t("h.emp_3sd")
      );
    }
    const cut = mean - sd;
    return _choice(
      tVar("q.emp_below", { mean: mean, sd: sd, cut: cut }),
      [t("c.pct16"), t("c.pct25"), t("c.pct015"), t("c.pct50")],
      t("c.pct16"),
      "distributions",
      t("h.emp_below")
    );
  }

  function genLiteracy() {
    return _choice(
      tVar("q.literacy"),
      [t("c.lit_a"), t("c.lit_b"), t("c.lit_c"), t("c.lit_d")],
      t("c.lit_a"),
      "literacy",
      t("h.literacy")
    );
  }

  const GENERATORS = [
    genFeetInYard,
    genSqFtInSqYard,
    genCuFtInCuYard,
    genDimensionConcept,
    genFormulaSquarePerimeter,
    genFormulaSquareArea,
    genFormulaRectangle,
    genFormulaTriangle,
    genFormulaCircle,
    genFormulaVolume,
    genPythagoreanFormula,
    genFormulaFlashcard,
    genFormulaFlashcard,
    genFormulaFlashcard,
    genRectanglePa,
    genTriangleArea,
    genCirclePa,
    genCompositeLShape,
    genCompositeTriRectSemi,
    genCompositeTriRectSemi,
    genFence,
    genSoupCan,
    genDriveway,
    genTv,
    genGallonsLiters,
    genMapScale,
    genCarpet,
    genPizza,
    genBallAir,
    genMeanMedianModeRange,
    genBestMeasureFixed,
    genRangeRule,
    genCompareVariation,
    genSdTf,
    genZScore,
    genPercentileFromZ,
    genZFromPercentile,
    genSkewHistogram,
    genEmpiricalRule,
    genLiteracy,
  ];

  const topicCache = {};

  function topicOf(gen) {
    if (!topicCache[gen]) {
      topicCache[gen] = gen()["topic"];
    }
    return topicCache[gen];
  }

  function generateQuestion(topic) {
    if (topic === "flashcards") {
      return genFormulaFlashcard();
    }
    if (topic && topic !== "all") {
      let pool = GENERATORS.filter(function (g) {
        return topicOf(g) === topic;
      });
      if (!pool.length) pool = GENERATORS;
      return choice(pool)();
    }
    return choice(GENERATORS)();
  }

  function checkAnswer(question, userAnswer) {
    const qtype = question.type;

    if (qtype === "mc") {
      const ok =
        String(userAnswer).trim() === String(question.answer).trim();
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

    if (qtype === "short" || qtype === "flashcard") {
      const raw =
        qtype === "flashcard"
          ? _normFormula(userAnswer)
          : String(userAnswer).toLowerCase().trim().replace(/ /g, "");
      if (!raw) {
        const display = question.answer || (question.answers && question.answers[0]) || "";
        return [false, String(display)];
      }
      const answers =
        question.answers ||
        (question.answer !== undefined ? [String(question.answer)] : []);
      for (let i = 0; i < answers.length; i++) {
        const target =
          qtype === "flashcard"
            ? _normFormula(answers[i])
            : String(answers[i]).toLowerCase().replace(/ /g, "");
        if (!target) continue;
        // Exact match only — substring matches made empty/"s"/"a" count as correct.
        if (raw === target) {
          const display = question.answer || question.answers[0];
          return [true, String(display)];
        }
      }
      const display = question.answer || question.answers[0];
      return [false, String(display)];
    }

    return [false, ""];
  }

  function publicQuestion(q) {
    // Three progressive hints — never include the final answer.
    const hint1 = q.hint || "";
    const hint2 = q.setup || "";
    let calc = q.calc || null;
    if (!calc && hint2) calc = CALC_GENERIC();
    let hint3ti = "";
    let hint3casio = "";
    if (calc && typeof calc === "object") {
      hint3ti = calc.ti || "";
      hint3casio = calc.casio || "";
    } else if (typeof calc === "string" && calc) {
      // Legacy single-string calc tips apply to both.
      hint3ti = calc;
      hint3casio = calc;
    }
    const hasCalc = Boolean(hint3ti || hint3casio);
    const out = {
      id: q.id,
      topic: q.topic,
      topic_label: (buildTopics()[q.topic] || q.topic),
      type: q.type,
      prompt: q.prompt,
      hint1: hint1,
      hint2: hint2,
      hint3: hint3ti || hint3casio,
      hint3_ti: hint3ti,
      hint3_casio: hint3casio,
      hint: hint1,
      setup: hint2,
      calc: calc,
      has_hint1: Boolean(hint1),
      has_hint2: Boolean(hint2),
      has_hint3: hasCalc,
      has_hint: Boolean(hint1 || hint2 || hasCalc),
      has_setup: Boolean(hint2 || hasCalc),
      unit: q.unit || "",
    };
    if (q.type === "mc") {
      out.choices = q.choices;
    }
    if (q.type === "flashcard") {
      out.placeholder = t("flashcard_placeholder");
    }
    if (q.svg) {
      out.svg = q.svg;
    }
    return out;
  }

  window.QuizQuestions = {
    get TOPICS() { return buildTopics(); },
    PI: PI,
    get PI_NOTE() { return piNote(); },
    HINT_CREDIT: HINT_CREDIT,
    RETRY_CREDIT: RETRY_CREDIT,
    UNAIDED_TO_MASTER: UNAIDED_TO_MASTER,
    randInt: randInt,
    choice: choice,
    shuffle: shuffle,
    gcd: gcd,
    num: num,
    id: id,
    generateQuestion: generateQuestion,
    checkAnswer: checkAnswer,
    publicQuestion: publicQuestion,
  };
})();
