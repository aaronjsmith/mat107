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
    return t("calc_header", { ti: tiSteps, casio: casioSteps, tip: tip });
  }

  // Generic leftover tip when we only have an equation setup
  function CALC_GENERIC() {
    return t("calc_generic");
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
        prompt: t("flash.recall", { front: card.front }),
        answer: card.back,
        answers: (card.answers.concat([card.back])).map(_normFormula),
        hint: card.hint,
        setup:
          "Target form: " +
          card.back.split("=")[0].trim() +
          " = …  (fill the right-hand side from memory)",
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
      t("flash.recognize", { front: card.front }),
      choices,
      card.back,
      "formulas",
      card.hint,
      t("flash.match_hint", { left: card.back.split("=")[0].trim() })
    );
  }

  // --- Generators -------------------------------------------------------------

  function genFeetInYard() {
    return _numeric(t("q.feet_in_yard"), 3, "conversions", 0, t("h.feet_in_yard"), t("s.feet_in_yard"));
  }

  function genSqFtInSqYard() {
    return _numeric(t("q.sqft_sqyd"), 9, "conversions", 0, t("h.sqft_sqyd"), t("s.sqft_sqyd"));
  }

  function genCuFtInCuYard() {
    return _numeric(t("q.cuft_cuyd"), 27, "conversions", 0, t("h.cuft_cuyd"), t("s.cuft_cuyd"));
  }

  function genDimensionConcept() {
    return _choice(
      t("q.dim_concept"),
      [t("c.dim_a"), t("c.dim_b"), t("c.dim_c"), t("c.dim_d")],
      t("c.dim_a"),
      "conversions"
    );
  }

  function genFormulaSquarePerimeter() {
    return _choice(
      "What is the formula for the perimeter of a square with side length s?",
      ["P = 4s", "P = s²", "P = 2s", "P = 6s"],
      "P = 4s",
      "formulas"
    );
  }

  function genFormulaSquareArea() {
    return _choice(
      "What is the formula for the area of a square with side length s?",
      ["A = s²", "A = 4s", "A = 2s", "A = s³"],
      "A = s²",
      "formulas"
    );
  }

  function genFormulaRectangle() {
    const which = choice(["perimeter", "area"]);
    if (which === "perimeter") {
      return _choice(
        "What is the formula for the perimeter of a rectangle with length L and width W?",
        ["P = 2L + 2W", "P = L × W", "P = L + W", "P = 4LW"],
        "P = 2L + 2W",
        "formulas"
      );
    }
    return _choice(
      "What is the formula for the area of a rectangle with length L and width W?",
      ["A = L × W", "A = 2L + 2W", "A = L + W", "A = L² + W²"],
      "A = L × W",
      "formulas"
    );
  }

  function genFormulaTriangle() {
    const which = choice(["perimeter", "area"]);
    if (which === "perimeter") {
      return _choice(
        "What is the formula for the perimeter of a triangle with sides a, b, and c?",
        ["P = a + b + c", "P = ½bh", "P = ab + bc + ca", "P = abc"],
        "P = a + b + c",
        "formulas"
      );
    }
    return _choice(
      "What is the formula for the area of a triangle with base b and height h?",
      ["A = ½bh", "A = bh", "A = 2bh", "A = b + h"],
      "A = ½bh",
      "formulas"
    );
  }

  function genFormulaCircle() {
    const which = choice(["circumference", "area"]);
    if (which === "circumference") {
      return _choice(
        "What is the formula for the circumference of a circle with radius r?",
        ["C = 2πr", "C = πr²", "C = πr", "C = 4πr"],
        "C = 2πr",
        "formulas",
        "Also written as C = πd where d is the diameter"
      );
    }
    return _choice(
      "What is the formula for the area of a circle with radius r?",
      ["A = πr²", "A = 2πr", "A = πd", "A = 4πr²"],
      "A = πr²",
      "formulas"
    );
  }

  function genFormulaVolume() {
    const which = choice(["cube", "sphere", "cylinder"]);
    if (which === "cube") {
      return _choice(
        "What is the formula for the volume of a cube with side length s?",
        ["V = s³", "V = 6s²", "V = s²", "V = 4s"],
        "V = s³",
        "formulas"
      );
    }
    if (which === "sphere") {
      return _choice(
        "What is the formula for the volume of a sphere with radius r?",
        ["V = (4/3)πr³", "V = 4πr²", "V = πr²h", "V = (4/3)πr²"],
        "V = (4/3)πr³",
        "formulas"
      );
    }
    return _choice(
      "What is the formula for the volume of a cylinder with radius r and height h?",
      ["V = πr²h", "V = 2πrh", "V = (4/3)πr³", "V = πr²"],
      "V = πr²h",
      "formulas"
    );
  }

  function genPythagoreanFormula() {
    return _choice(
      "What is the Pythagorean Theorem for a right triangle with legs a, b and hypotenuse c?",
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
        "The cultural hall needs painter’s tape around a rectangular court marking that measures " +
          L +
          " ft by " +
          W +
          " ft (yes, the same court where the stake Young Men still think they’re NBA-bound). What is its perimeter in feet?",
        2 * (L + W),
        "perimeter_area",
        0,
        "P = 2L + 2W (or 2(L+W)). On TI-36X Pro / Casio enter the expression, then =.",
        "P = 2(" + L + " + " + W + ")",
        t("unit.ft"),
        calcHelp(
          "2 × ( " + L + " + " + W + " ) =",
          "2 × ( " + L + " + " + W + " ) ="
        )
      );
    }
    return _numeric(
      "Sister Jensen is measuring linoleum for a rectangular Primary classroom " +
        L +
        " ft by " +
        W +
        " ft. (She muttered, “And it came to pass… we need more area.”) What is the floor area in square feet?",
      L * W,
      "perimeter_area",
      0,
      "A = L × W. On TI-36X Pro / Casio enter length × width, then =.",
      "A = " + L + " × " + W,
      t("unit.sq_ft"),
      calcHelp(L + " × " + W + " =", L + " × " + W + " =")
    );
  }

  function genTriangleArea() {
    const b = randInt(6, 24);
    const h = randInt(4, 18);
    return _numeric(
      "A youth pioneer-trek map shows a triangular meadow with base " +
        b +
        " units and height " +
        h +
        " units—basically the only flat place that isn’t a dust storm. What is its area? Round to the nearest hundredth if needed.",
      0.5 * b * h,
      "perimeter_area",
      0.01,
      "A = ½bh. Enter half × base × height on your calculator.",
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
        "The ward has a circular green Jell-O “ring of fire” mold with radius " +
          r +
          " inches (a culinary classic at every potluck from Provo to Pocatello). What is its circumference? " +
          piNote(),
        num(2 * PI * r),
        "perimeter_area",
        0.02,
        "C = 2πr. Type 3.14 for π (do not use the π key—answers are keyed to 3.14).",
        "C = 2 × " + PI + " × " + r,
        "",
        calcHelp("2 × 3.14 × " + r + " =", "2 × 3.14 × " + r + " =")
      );
    }
    return _numeric(
      "A circular sacrament-meeting clock face (the one that miraculously slows during talks) has radius " +
        r +
        ". What is its area? " +
        piNote(),
      num(PI * r * r),
      "perimeter_area",
      0.02,
      "A = πr². Type 3.14 for π. Use x² for the square.",
      "A = " + PI + " × (" + r + ")²",
      "",
      calcHelp("3.14 × " + r + " x² =", "3.14 × " + r + " x² =")
    );
  }

  function _lShapeSvg(W, H, cutW, cutH) {
    const scale = 12;
    const maxW = 280;
    const s = Math.min(scale, maxW / W, 200 / H);
    const ow = W * s;
    const oh = H * s;
    const cw = cutW * s;
    const ch = cutH * s;
    const path =
      "M0,0 H" +
      ow.toFixed(1) +
      " V" +
      (oh - ch).toFixed(1) +
      " H" +
      (ow - cw).toFixed(1) +
      " V" +
      oh.toFixed(1) +
      " H0 Z";
    return (
      '<svg viewBox="-8 -20 ' +
      (ow + 60) +
      " " +
      (oh + 40) +
      '" xmlns="http://www.w3.org/2000/svg" class="q-svg">\n' +
      '  <path d="' +
      path +
      '" fill="#dbeafe" stroke="#1e3a5f" stroke-width="2"/>\n' +
      '  <text x="' +
      (ow / 2).toFixed(1) +
      '" y="-6" text-anchor="middle" font-size="12" fill="#1e3a5f">' +
      W +
      "</text>\n" +
      '  <text x="-4" y="' +
      (oh / 2).toFixed(1) +
      '" text-anchor="end" font-size="12" fill="#1e3a5f">' +
      H +
      "</text>\n" +
      '  <text x="' +
      (ow - cw / 2).toFixed(1) +
      '" y="' +
      (oh - ch - 4).toFixed(1) +
      '" text-anchor="middle" font-size="11" fill="#b45309">' +
      cutW +
      "</text>\n" +
      '  <text x="' +
      (ow - cw + 10).toFixed(1) +
      '" y="' +
      (oh - ch / 2).toFixed(1) +
      '" font-size="11" fill="#b45309">' +
      cutH +
      "</text>\n" +
      "</svg>"
    );
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
        prompt: t("q.lshape_a", { W: W, H: H, cutW: cutW, cutH: cutH }),
        answer: area,
        tolerance: 0,
        hint: t("h.lshape_a"),
        setup: "A = (" + W + " × " + H + ") − (" + cutW + " × " + cutH + ")",
        calc: calcHelp(
          "( " + W + " × " + H + " ) − ( " + cutW + " × " + cutH + " ) =",
          "( " + W + " × " + H + " ) − ( " + cutW + " × " + cutH + " ) ="
        ),
        unit: "sq units",
        svg: _lShapeSvg(W, H, cutW, cutH),
      };
    }
    return {
      id: id(),
      topic: "perimeter_area",
      type: "numeric",
      prompt:
        "Nephi’s handcart storage shed (hypothetically) is an L-shape fitting in a " +
        W +
        " × " +
        H +
        " rectangle with a " +
        cutW +
        " × " +
        cutH +
        " corner notch removed—because even prophets need weird floor plans. What is the outer perimeter of the L-shape?",
      answer: perimeter,
      tolerance: 0,
      hint: t("h.lshape_p"),
      setup: "P = 2(" + W + " + " + H + ")",
      calc: calcHelp(
        "2 × ( " + W + " + " + H + " ) =",
        "2 × ( " + W + " + " + H + " ) ="
      ),
      unit: "units",
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
        "Brother Larsen wants to fence the ward community garden—" +
          ft1 +
          " feet " +
          in1 +
          " inches by " +
          ft2 +
          " feet " +
          in2 +
          " inches—so the zucchini stop “going on missions” into Sister Clark’s yard. How many feet of fencing do you need to go around it? Round to the nearest hundredth.",
        num(peri),
        "perimeter_area",
        0.05,
        "Convert inches to feet, then P = 2(L+W). Enter inches÷12 on the calculator.",
        "L = " + ft1 + " + " + in1 + "/12,  W = " + ft2 + " + " + in2 + "/12\nP = 2(L + W)",
        t("unit.ft"),
        calcHelp(
          "2 × ( (" + ft1 + " + " + in1 + " ÷ 12) + (" + ft2 + " + " + in2 + " ÷ 12) ) =",
          "2 × ( (" + ft1 + " + " + in1 + " ÷ 12) + (" + ft2 + " + " + in2 + " ÷ 12) ) ="
        )
      );
    }
    return _choice(
      "Ammon is fencing a garden plot " +
        ft1 +
        "' " +
        in1 +
        '" by ' +
        ft2 +
        "' " +
        in2 +
        "\" (smaller than King Lamoni’s fields, thankfully). Fencing comes in 50-ft or 100-ft rolls at the Deseret Industries hardware aisle. Which roll do you need?",
      [t("c.roll_50"), t("c.roll_100")],
      rolls,
      "perimeter_area",
      "Convert dimensions to feet, find the perimeter P = 2(L+W), then choose the smallest roll that is at least P.",
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
      "Relief Society is canning a legendary cylinder of funeral potatoes. The base is " +
        dNum +
        " inches across (diameter) and the can is " +
        h +
        " inches high. (If Nephi could build a ship, you can find a volume.) What is the volume? " +
        piNote(),
      num(vol),
      "volume",
      0.02,
      "V = πr²h, and r = diameter/2. Type 3.14 for π (not the π key).",
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
        "The stake-center driveway rises " +
          rise +
          " ft over a horizontal distance of " +
          run +
          " ft—steeper than a new missionary’s learning curve. What is the slope? Write as a simplified ratio rise:run or as a fraction rise/run.",
        answers,
        "pythagorean",
        "slope = rise / run (vertical change over horizontal change)",
        "slope = " + rise + "/" + run + "  (simplify if possible)",
        calcHelp(
          rise + " ÷ " + run + " =   (or leave as " + rise + "/" + run + " and simplify)",
          rise + " ÷ " + run + " =   (or use fraction key " + rise + " ▢/▢ " + run + ")",
          "For a ratio answer, write rise:run in simplest form—you may not need the calculator."
        )
      );
    }
    return _numeric(
      "Lehi’s family, if they had asphalt, might have used a driveway that rises " +
        rise +
        " ft over a horizontal distance of " +
        run +
        " ft. What is the slant length of that driveway? Round to the nearest hundredth. (Hint from Alma: have faith—and use √(a² + b²).)",
      num(slant),
      "pythagorean",
      0.05,
      "Use Pythagorean Theorem: c = √(a² + b²). Square root is 2nd x² on TI-36X Pro; √ on Casio.",
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
      "Your family just scored a " +
        diagonal +
        "-inch TV that is " +
        width +
        " inches wide—perfect for General Conference (and for arguing over who sits where). How tall is it? Round to the nearest tenth. (TV size is the diagonal, not the spiritual “bigness” of the talks.)",
      num(height, 1),
      "pythagorean",
      0.15,
      "Diagonal is hypotenuse: height = √(diagonal² − width²). Round to the nearest tenth.",
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
      "You’ve got a " +
        gallons +
        "-gallon food-storage jug of punch for the ward picnic (the pink kind that always looks vaguely fluorescent). How many " +
        bottleL +
        "-liter bottles will it take to fill it? (1 gallon = 3.785 liters). Round to the nearest hundredth. “And it came to pass” that someone bought metric bottles.",
      num(bottles),
      "scale_rates",
      0.05,
      "Convert gallons → liters, then divide by bottle size.",
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
        "A youth pioneer-trek map uses a scale of 1 inch : " +
          scaleFt +
          " feet. The rest stop (where they rediscover the joy of socks) is " +
          inches +
          " inches away on the map. How many feet down the trail is it?",
        inches * scaleFt,
        "scale_rates",
        0,
        "Multiply map inches by the scale factor (feet per inch).",
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
      "A ward “Book of Mormon lands” activity map has scale 1 inch : " +
        scaleFt +
        " feet. A landmark labeled “Zarahemla? (maybe)” is " +
        feet +
        " feet down the trail. How many inches away is it on the map? Round to the nearest hundredth if needed.",
      num(feet / scaleFt),
      "scale_rates",
      0.01,
      "Divide real distance by feet-per-inch.",
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
        "The Primary room is " +
          L +
          " ft × " +
          W +
          " ft and needs new carpet—preferably something that can survive grape juice and “Head, Shoulders, Knees, and Toes.” Carpet comes in a roll " +
          rollW +
          " ft wide at $" +
          costPerLinear +
          " per linear foot (installed). How much does this choice cost? Round to the nearest cent.",
        num(costRoll),
        "scale_rates",
        0.5,
        "Figure how many linear feet of roll you need to cover the room",
        "linear feet needed = " + linear + "\ncost = " + linear + " × " + costPerLinear,
        "dollars",
        calcHelp(
          linear + " × " + costPerLinear + " =",
          linear + " × " + costPerLinear + " =",
          "Round to the nearest cent."
        )
      );
    }
    if (ask === "yard") {
      return _numeric(
        "The cultural hall’s quiet-side classroom is " +
          L +
          " ft × " +
          W +
          " ft. Carpet costs $" +
          costPerSqyd +
          " per square yard (installed)—cheaper than building a ship like Nephi, still pricey. How much does this choice cost? Round to the nearest cent. (9 sq ft = 1 sq yd)",
        num(costYd),
        "scale_rates",
        0.5,
        "Convert sq ft to sq yd, then multiply by price",
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
        "dollars",
        calcHelp(
          "( " + L + " × " + W + " ÷ 9 ) × " + costPerSqyd + " =",
          "( " + L + " × " + W + " ÷ 9 ) × " + costPerSqyd + " =",
          "Round to the nearest cent."
        )
      );
    }
    const cheaper = costRoll < costYd ? t("c.carpet_roll") : t("c.carpet_yd");
    return _choice(
      "Relief Society is comparing carpet options for a " +
        L +
        "'×" +
        W +
        "' room (the one with the mysterious “temporary” craft closet from 1998). Option A: " +
        rollW +
        "'-wide roll at $" +
        costPerLinear +
        "/linear ft. Option B: $" +
        costPerSqyd +
        "/sq yd. Which is cheaper?",
      [t("c.carpet_roll"), t("c.carpet_yd")],
      cheaper,
      "scale_rates",
      "Compute each option’s total cost, then compare. Do not guess from unit price alone.",
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
      const more =
        aOne > aTwo ? "one " + large + "-inch" : "two " + small + "-inch";
      return _choice(
        "Mutual night pizza debate: which has more pizza area—two " +
          small +
          "-inch personal pizzas or one " +
          large +
          "-inch pizza? (Think feeding the multitude, but with cheese. " +
          piNote() +
          ")",
        ["two " + small + "-inch", "one " + large + "-inch", "they are equal"],
        Math.abs(aOne - aTwo) > 0.01 ? more : "they are equal",
        "scaling",
        "Area = πr². Doubling diameter (or radius) multiplies area by 4.",
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
      "What happens to the area of a ward-pizza when you double the radius? (And it came to pizza…)",
      [
        t("c.pizza_4x"),
        t("c.pizza_2x"),
        t("c.pizza_3x"),
        t("c.pizza_same"),
      ],
      t("c.pizza_4x"),
      "scaling",
      "A = πr², so if r → 2r then A → π(2r)² = 4πr²",
      "A_new = π(2r)² = π·4r² = 4 · (πr²)"
    );
  }

  function genBallAir() {
    const base = choice([100, 120, 150, 200]);
    const ask = choice(["double", "half"]);

    if (ask === "double") {
      return _numeric(
        "Primary Activity Day has a ball holding " +
          base +
          " cubic inches of air. If they somehow get a ball with twice the radius (like a basketball that ate too much funeral potatoes), how much air would it hold?",
        base * 8,
        "scaling",
        0,
        "Volume of a sphere scales with r³, so 2³ = 8 times the volume.",
        "V_new = " + base + " × 2³ = " + base + " × 8",
        "cubic inches",
        calcHelp(
          base + " × 8 =",
          base + " × 8 =",
          "Or compute 2³ first: TI/Casio 2 ^ 3 = (or 2 x³ on Casio), then multiply by " + base + "."
        )
      );
    }
    return _numeric(
      "Young Men brought a ball that holds " +
        base +
        " cubic inches of air. A smaller ball with half the radius somehow shows up at Saturday cultural-hall basketball (please don’t tell the bishop how many windows they’ve almost hit). How much air would the smaller ball hold?",
      base / 8,
      "scaling",
      0.01,
      "Volume scales with r³, so (1/2)³ = 1/8 of the volume.",
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
        "Seminary Scripture Mastery practice scores for the week: " +
          ds +
          ". Find the mean. Round to the nearest hundredth if needed. (No, Brother Jensen, “spiritual GPA” is not a real thing.)",
        num(_mean(data)),
        "stats_center",
        0.05,
        "Mean = sum of values ÷ number of values. Add first, then divide.",
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
        "Young Women activity attendance counts: " +
          ds +
          ". Find the median (the “middle” value after sorting—like finding the middle seat in a pew).",
        _median(data),
        "stats_center",
        0.01,
        "Sort the data; median is the middle value (or average of two middle values)",
        "Sorted: " + sortedDs
      );
    }
    if (ask === "mode") {
      const m = _mode(data);
      if (m === null) return genMeanMedianModeRange();
      return _numeric(
        "Primary singing-time song choices (coded as numbers): " +
          ds +
          ". Find the mode—the song that got requested most. (Hint: it was probably “I Am a Child of God.”)",
        m,
        "stats_center",
        0,
        "Mode = value that appears most often",
        "Count how many times each value appears; pick the most frequent."
      );
    }
    return _numeric(
      "Trek snack counts for each family: " +
        ds +
        ". Find the range (max − min). Pioneer lesson: extremes happen.",
      _range(data),
      "stats_center",
      0,
      "Range = maximum − minimum",
      "range = " + Math.max.apply(null, data) + " − " + Math.min.apply(null, data)
    );
  }

  function genBestMeasureFixed() {
    const options = [
      [t("q.best_outliers"), t("c.median"), t("h.best_outliers")],
      [t("q.best_cat"), t("c.mode"), t("h.best_cat")],
      [t("q.best_sym"), t("c.mean"), t("h.best_sym")],
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
      "Use the range rule of thumb to approximate the standard deviation of " +
        ds +
        ". Round to the nearest hundredth.",
      num(approxSd),
      "stats_spread",
      0.05,
      "Range rule of thumb: s ≈ range / 4.",
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
        t("q.compare_sd", { which: which[1], ds: ds }),
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
      t("q.compare_which", {
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
      t("q.sd_tf"),
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
      t("q.zscore", { mean: mean, sd: sd, score: score }),
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
      "Using a standard normal (Z) table, about what percentile is a data point that is " +
        z +
        " standard deviations from the mean? Enter the percentile as a number (e.g. 84 for the 84th percentile). Round to the nearest whole number.",
      Math.round(p),
      "z_scores",
      2,
      "The table gives the cumulative area to the left of z; multiply by 100 for a percentile."
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
      "Approximate the z-score for a data point on the " +
        pct +
        "th percentile (standard normal). Round to the nearest tenth if needed.",
      z,
      "z_scores",
      0.2,
      "≈50th → z≈0; ≈84th → z≈1; ≈16th → z≈−1"
    );
  }

  function genSkewHistogram() {
    const skew = choice(["right", "left", "uniform"]);
    let prompt;
    let answer;
    let effect;

    if (skew === "right") {
      prompt =
        "A histogram piles most values on the left with a long tail stretching to the right. How would you describe the distribution?";
      answer = "Right-skewed";
      effect =
        "Right-skewed data usually pulls the mean to the right of the median (mean > median > mode, roughly).";
    } else if (skew === "left") {
      prompt =
        "A histogram piles most values on the right with a long tail stretching to the left. How would you describe the distribution?";
      answer = "Left-skewed";
      effect = "Left-skewed data usually pulls the mean left of the median (mean < median).";
    } else {
      prompt =
        "Looking at a weather-report style bar chart where daily values stay in a narrow band (e.g. highs of 58, 59, 58, 60, 61, 58, 59) with no long tail, how would you describe it?";
      answer = "Roughly uniform / roughly symmetric";
      effect = "Mean, median, and mode tend to be close together.";
    }

    const ask = choice(["shape", "effect"]);
    if (ask === "shape") {
      return _choice(
        prompt,
        [
          "Left-skewed",
          "Right-skewed",
          "Roughly uniform / roughly symmetric",
          "Impossible to say",
        ],
        answer,
        "distributions",
        "Skew is named for the long tail direction."
      );
    }
    return _choice(
      prompt + " What does this do to mean, median, and mode?",
      [
        effect,
        "Mean, median, and mode are always equal no matter the shape",
        "The mode always equals the range",
        "Skewness only affects the standard deviation, never center measures",
      ],
      effect,
      "distributions"
    );
  }

  function genEmpiricalRule() {
    const mean = choice([70, 75, 80]);
    const sd = choice([5, 10, 15]);
    const ask = choice(["1sd", "2sd", "3sd_beyond", "below_1"]);

    if (ask === "1sd") {
      const lo = mean - sd;
      const hi = mean + sd;
      return _choice(
        "Ages of adults in a (very hypothetical) stake directory are roughly normal with mean " +
          mean +
          " years and SD " +
          sd +
          " years. About what percentage are between " +
          lo +
          " and " +
          hi +
          "? (Don’t say “all of them left the potluck early.”)",
        [t("c.pct68"), t("c.pct95"), t("c.pct997"), t("c.pct50")],
        t("c.pct68"),
        "distributions",
        "Empirical rule: ≈68% within 1 SD of the mean"
      );
    }
    if (ask === "2sd") {
      const lo = mean - 2 * sd;
      const hi = mean + 2 * sd;
      return _choice(
        "Years of church membership for adults in a ward are roughly normal with mean " +
          mean +
          " and SD " +
          sd +
          ". About what percentage fall between " +
          lo +
          " and " +
          hi +
          "?",
        [t("c.pct95"), t("c.pct68"), t("c.pct997"), t("c.pct34")],
        t("c.pct95"),
        "distributions",
        "Empirical rule: ≈95% within 2 SD of the mean"
      );
    }
    if (ask === "3sd_beyond") {
      const cut = mean + 3 * sd;
      return _choice(
        "Ages of Gospel Doctrine class members are roughly normal with mean " +
          mean +
          " years and SD " +
          sd +
          " years. About what percentage are older than " +
          cut +
          " (the rare “I’ve read the footnotes in Isaiah” club)?",
        [t("c.pct015"), t("c.pct25"), t("c.pct16"), t("c.pct5")],
        t("c.pct015"),
        "distributions",
        "≈99.7% within 3 SD, so about 0.3% outside total → ~0.15% in each tail"
      );
    }
    const cut = mean - sd;
    return _choice(
      "Missionary ages in a (made-up, PG) data set are roughly normal with mean " +
        mean +
        " and SD " +
        sd +
        ". About what percentage are younger than " +
        cut +
        "?",
      [t("c.pct16"), t("c.pct25"), t("c.pct015"), t("c.pct50")],
      t("c.pct16"),
      "distributions",
      "Below 1 SD left of mean ≈ half of the 32% outside the middle 68% → ~16%"
    );
  }

  function genLiteracy() {
    return _choice(
      t("q.literacy"),
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
      let val;
      try {
        val = parseFloat(
          String(userAnswer).replace(/,/g, "").replace(/\$/g, "").trim()
        );
        if (isNaN(val)) return [false, String(question.answer)];
      } catch (e) {
        return [false, String(question.answer)];
      }
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
      const answers =
        question.answers ||
        (question.answer !== undefined ? [String(question.answer)] : [""]);
      for (let i = 0; i < answers.length; i++) {
        const target =
          qtype === "flashcard"
            ? _normFormula(answers[i])
            : String(answers[i]).replace(/ /g, "");
        if (raw === target || raw.indexOf(target) !== -1 || target.indexOf(raw) !== -1) {
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
    const hint3 = q.calc || (hint2 ? CALC_GENERIC() : "");
    const out = {
      id: q.id,
      topic: q.topic,
      topic_label: (buildTopics()[q.topic] || q.topic),
      type: q.type,
      prompt: q.prompt,
      hint1: hint1,
      hint2: hint2,
      hint3: hint3,
      hint: hint1,
      setup: hint2,
      calc: hint3,
      has_hint1: Boolean(hint1),
      has_hint2: Boolean(hint2),
      has_hint3: Boolean(hint3),
      has_hint: Boolean(hint1 || hint2 || hint3),
      has_setup: Boolean(hint2 || hint3),
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
