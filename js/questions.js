/**
 * MAT107 quiz question generators — browser port of questions.py
 * Self-contained IIFE; load via plain <script> tag (no ES modules).
 */
(function () {
  "use strict";

  const TOPICS = {
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
  const PI_NOTE = "Use π = 3.14. Round to the nearest hundredth.";
  const HINT_CREDIT = { 0: 1.0, 1: 0.5, 2: 0.25 };
  const UNAIDED_TO_MASTER = 10;

  // --- Helpers ----------------------------------------------------------------

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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

  function _choice(prompt, choices, answer, topic, hint, setup) {
    hint = hint || "";
    setup = setup || "";
    return {
      id: id(),
      topic: topic,
      type: "mc",
      prompt: prompt,
      choices: shuffle(choices.slice()),
      answer: answer,
      hint: hint,
      setup: setup,
      tolerance: 0,
    };
  }

  function _numeric(prompt, answer, topic, tolerance, hint, setup, unit) {
    tolerance = tolerance === undefined ? 0.05 : tolerance;
    hint = hint || "";
    setup = setup || "";
    unit = unit || "";
    return {
      id: id(),
      topic: topic,
      type: "numeric",
      prompt: prompt,
      answer: num(answer, 4),
      tolerance: tolerance,
      hint: hint,
      setup: setup,
      unit: unit,
    };
  }

  function _short(prompt, answers, topic, hint, setup) {
    hint = hint || "";
    setup = setup || "";
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

  const FORMULA_CARDS = [
    {
      front: "Perimeter of a square with side s",
      back: "P = 4s",
      answers: ["4s", "4*s", "s+s+s+s"],
      hint: "Add all four equal sides.",
    },
    {
      front: "Area of a square with side s",
      back: "A = s²",
      answers: ["s^2", "s*s", "s²"],
      hint: "Side times side.",
    },
    {
      front: "Perimeter of a rectangle with length L and width W",
      back: "P = 2L + 2W",
      answers: ["2l+2w", "2(l+w)", "2*l+2*w", "2(l+w)"],
      hint: "Two lengths plus two widths.",
    },
    {
      front: "Area of a rectangle with length L and width W",
      back: "A = L × W",
      answers: ["l*w", "lw", "l×w", "w*l"],
      hint: "Length times width.",
    },
    {
      front: "Perimeter of a triangle with sides a, b, and c",
      back: "P = a + b + c",
      answers: ["a+b+c", "a+b+c"],
      hint: "Add the three sides.",
    },
    {
      front: "Area of a triangle with base b and height h",
      back: "A = ½bh",
      answers: ["0.5bh", "0.5*b*h", "(1/2)bh", "1/2*b*h", "bh/2", "(1/2)*b*h"],
      hint: "Half of base times height.",
    },
    {
      front: "Circumference of a circle with radius r",
      back: "C = 2πr",
      answers: ["2pir", "2*pi*r", "2πr", "pid", "pi*d"],
      hint: "Also C = πd with diameter d.",
    },
    {
      front: "Area of a circle with radius r",
      back: "A = πr²",
      answers: ["pir^2", "pi*r^2", "πr²", "pi*r*r"],
      hint: "Pi times radius squared.",
    },
    {
      front: "Volume of a cube with side s",
      back: "V = s³",
      answers: ["s^3", "s*s*s", "s³"],
      hint: "Side times side times side.",
    },
    {
      front: "Volume of a sphere with radius r",
      back: "V = (4/3)πr³",
      answers: ["(4/3)pir^3", "(4/3)*pi*r^3", "4/3pir^3", "4/3*pi*r^3", "(4/3)πr³"],
      hint: "Four-thirds pi r-cubed.",
    },
    {
      front: "Volume of a cylinder with radius r and height h",
      back: "V = πr²h",
      answers: ["pir^2h", "pi*r^2*h", "πr²h", "pi*r*r*h"],
      hint: "Area of base circle times height.",
    },
    {
      front: "Pythagorean Theorem (legs a, b; hypotenuse c)",
      back: "a² + b² = c²",
      answers: ["a^2+b^2=c^2", "a²+b²=c²", "c^2=a^2+b^2"],
      hint: "Sum of the squares of the legs equals the square of the hypotenuse.",
    },
  ];

  function genFormulaFlashcard() {
    const card = choice(FORMULA_CARDS);
    const direction = choice(["recall", "recognize"]);
    if (direction === "recall") {
      return {
        id: id(),
        topic: "formulas",
        type: "flashcard",
        prompt: "Formula flashcard — write the formula:\n" + card.front,
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
    const wrong = FORMULA_CARDS.filter(function (c) {
      return c.back !== card.back;
    }).map(function (c) {
      return c.back;
    });
    const distractors = shuffle(wrong).slice(0, Math.min(3, wrong.length));
    const choices = [card.back].concat(distractors);
    return _choice(
      "Formula flashcard — which is correct for:\n" + card.front + "?",
      choices,
      card.back,
      "formulas",
      card.hint,
      "Match the shape name to its formula. Correct pattern starts like: " +
        card.back.split("=")[0].trim() +
        " = …"
    );
  }

  // --- Generators -------------------------------------------------------------

  function genFeetInYard() {
    return _numeric(
      "How many feet are in one yard?",
      3,
      "conversions",
      0,
      "1 yard = 3 feet",
      "feet = 1 yard × (3 feet / 1 yard)"
    );
  }

  function genSqFtInSqYard() {
    return _numeric(
      "How many square feet are in one square yard?",
      9,
      "conversions",
      0,
      "A square yard is 3 ft × 3 ft",
      "sq ft = 3 ft × 3 ft"
    );
  }

  function genCuFtInCuYard() {
    return _numeric(
      "How many cubic feet are in one cubic yard?",
      27,
      "conversions",
      0,
      "A cubic yard is 3 ft × 3 ft × 3 ft",
      "cu ft = 3 ft × 3 ft × 3 ft"
    );
  }

  function genDimensionConcept() {
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
        "A rectangle measures " + L + " ft by " + W + " ft. What is its perimeter (in feet)?",
        2 * (L + W),
        "perimeter_area",
        0,
        "P = 2L + 2W (or 2(L+W))",
        "P = 2(" + L + " + " + W + ")",
        "ft"
      );
    }
    return _numeric(
      "A rectangle measures " + L + " ft by " + W + " ft. What is its area (in square feet)?",
      L * W,
      "perimeter_area",
      0,
      "A = L × W",
      "A = " + L + " × " + W,
      "sq ft"
    );
  }

  function genTriangleArea() {
    const b = randInt(6, 24);
    const h = randInt(4, 18);
    return _numeric(
      "A triangle has base " + b + " units and height " + h + " units. What is its area?",
      0.5 * b * h,
      "perimeter_area",
      0.01,
      "A = ½bh",
      "A = ½ × " + b + " × " + h
    );
  }

  function genCirclePa() {
    const r = choice([2, 3, 4, 5, 6, 7, 8, 10]);
    const ask = choice(["circumference", "area"]);
    if (ask === "circumference") {
      return _numeric(
        "A circle has radius " + r + ". What is its circumference? " + PI_NOTE,
        num(2 * PI * r),
        "perimeter_area",
        0.02,
        "C = 2πr",
        "C = 2 × " + PI + " × " + r
      );
    }
    return _numeric(
      "A circle has radius " + r + ". What is its area? " + PI_NOTE,
      num(PI * r * r),
      "perimeter_area",
      0.02,
      "A = πr²",
      "A = " + PI + " × (" + r + ")²"
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
        prompt:
          "An L-shaped figure fits in a " +
          W +
          " × " +
          H +
          " rectangle. A " +
          cutW +
          " × " +
          cutH +
          " rectangle is cut from one corner. What is the area of the L-shape?",
        answer: area,
        tolerance: 0,
        hint: "Area of L = area of big rectangle − area of cut piece",
        setup: "A = (" + W + " × " + H + ") − (" + cutW + " × " + cutH + ")",
        unit: "sq units",
        svg: _lShapeSvg(W, H, cutW, cutH),
      };
    }
    return {
      id: id(),
      topic: "perimeter_area",
      type: "numeric",
      prompt:
        "An L-shaped figure fits in a " +
        W +
        " × " +
        H +
        " rectangle. A " +
        cutW +
        " × " +
        cutH +
        " rectangle is cut from one corner. What is the outer perimeter of the L-shape?",
      answer: perimeter,
      tolerance: 0,
      hint:
        "Walking the outside edge: the cut adds and removes edges that cancel — P = 2(W+H)",
      setup: "P = 2(" + W + " + " + H + ")",
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
    const rolls = peri <= 50 ? "50-foot" : "100-foot";
    const which = choice(["need", "roll"]);

    if (which === "need") {
      return _numeric(
        "You want to fence a garden that is " +
          ft1 +
          " feet " +
          in1 +
          " inches by " +
          ft2 +
          " feet " +
          in2 +
          " inches. How many feet of fencing do you need to go around it? Round to the nearest hundredth.",
        num(peri),
        "perimeter_area",
        0.05,
        "Convert inches to feet, then P = 2(L+W)",
        "L = " + ft1 + " + " + in1 + "/12,  W = " + ft2 + " + " + in2 + "/12\nP = 2(L + W)",
        "ft"
      );
    }
    return _choice(
      "A garden is " +
        ft1 +
        "' " +
        in1 +
        '" by ' +
        ft2 +
        "' " +
        in2 +
        '". Fencing comes in 50-ft or 100-ft rolls. Which roll do you need? (Perimeter ≈ ' +
        num(peri) +
        " ft)",
      ["50-foot", "100-foot"],
      rolls,
      "perimeter_area",
      "Buy the smallest roll that is at least as long as the perimeter",
      "Need about " + num(peri) + " ft of fencing; compare to 50 and 100."
    );
  }

  function genSoupCan() {
    const dNum = choice([2.5, 2.75, 3, 3.25, 3.5]);
    const h = choice([4, 4.5, 5, 5.5, 6]);
    const r = dNum / 2;
    const vol = PI * r * r * h;
    return _numeric(
      "Find the volume of a can if the base is " +
        dNum +
        " inches across (diameter) and the can is " +
        h +
        " inches high. " +
        PI_NOTE,
      num(vol),
      "volume",
      0.02,
      "V = πr²h, and r = diameter/2",
      "r = " + dNum + "/2\nV = " + PI + " × (r)² × " + h,
      "cubic inches"
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
        "A driveway rises " +
          rise +
          " ft over a horizontal distance of " +
          run +
          " ft. What is the slope? Write as a simplified ratio rise:run or as a fraction rise/run.",
        answers,
        "pythagorean",
        "slope = rise / run (vertical change over horizontal change)",
        "slope = " + rise + "/" + run + "  (simplify if possible)"
      );
    }
    return _numeric(
      "A driveway rises " +
        rise +
        " ft over a horizontal distance of " +
        run +
        " ft. What is the slant length of the driveway? Round to the nearest hundredth.",
      num(slant),
      "pythagorean",
      0.05,
      "Use Pythagorean Theorem: c = √(a² + b²)",
      "c = √(" + rise + "² + " + run + "²)",
      "ft"
    );
  }

  function genTv() {
    const diagonal = choice([50, 55, 60, 65, 70, 75]);
    const width = num(diagonal * (0.82 + Math.random() * 0.08), 1);
    const height = Math.sqrt(diagonal * diagonal - width * width);
    return _numeric(
      "A " +
        diagonal +
        "-inch TV is " +
        width +
        " inches wide. How tall is it? Round to the nearest tenth. (TV size is the diagonal.)",
      num(height, 1),
      "pythagorean",
      0.15,
      "Diagonal is hypotenuse: height = √(diagonal² − width²)",
      "height = √(" + diagonal + "² − " + width + "²)",
      "inches"
    );
  }

  function genGallonsLiters() {
    const gallons = choice([1, 2, 5, 10]);
    const bottleL = choice([1, 1.5, 2]);
    const liters = gallons * 3.785;
    const bottles = liters / bottleL;
    return _numeric(
      "You have a " +
        gallons +
        "-gallon jug. How many " +
        bottleL +
        "-liter bottles will it take to fill it? (1 gallon = 3.785 liters). Round to the nearest hundredth.",
      num(bottles),
      "scale_rates",
      0.05,
      "Convert gallons → liters, then divide by bottle size",
      "liters = " +
        gallons +
        " × 3.785\nbottles = (" +
        gallons +
        " × 3.785) / " +
        bottleL
    );
  }

  function genMapScale() {
    const scaleFt = choice([40, 50, 100, 200]);
    const ask = choice(["map_to_real", "real_to_map"]);

    if (ask === "map_to_real") {
      const inches = choice([1.5, 2, 2.5, 3, 3.5, 4, 5]);
      return _numeric(
        "A hiking map has a scale of 1 inch : " +
          scaleFt +
          " feet. A rest spot is " +
          inches +
          " inches away on the map. How many feet down the trail is it?",
        inches * scaleFt,
        "scale_rates",
        0,
        "Multiply map inches by the scale factor (feet per inch).",
        "feet = " + inches + " × " + scaleFt,
        "ft"
      );
    }
    const feet = choice([100, 150, 200, 220, 250, 300, 400]);
    return _numeric(
      "A hiking map has a scale of 1 inch : " +
        scaleFt +
        " feet. A landmark is " +
        feet +
        " feet down the trail. How many inches away is it on the map? Round to the nearest hundredth if needed.",
      num(feet / scaleFt),
      "scale_rates",
      0.01,
      "Divide real distance by feet-per-inch.",
      "inches = " + feet + " / " + scaleFt,
      "inches"
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
        "A room is " +
          L +
          " ft × " +
          W +
          " ft. Carpet comes in a roll " +
          rollW +
          " ft wide at $" +
          costPerLinear +
          " per linear foot (installed). How much does this choice cost? Round to the nearest cent.",
        num(costRoll),
        "scale_rates",
        0.5,
        "Figure how many linear feet of roll you need to cover the room",
        "linear feet needed = " + linear + "\ncost = " + linear + " × " + costPerLinear,
        "dollars"
      );
    }
    if (ask === "yard") {
      return _numeric(
        "A room is " +
          L +
          " ft × " +
          W +
          " ft. Carpet costs $" +
          costPerSqyd +
          " per square yard (installed). How much does this choice cost? Round to the nearest cent. (9 sq ft = 1 sq yd)",
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
        "dollars"
      );
    }
    const cheaper = costRoll < costYd ? "roll" : "per square yard";
    return _choice(
      "Room: " +
        L +
        "'×" +
        W +
        "'. Option A: " +
        rollW +
        "'-wide roll at $" +
        costPerLinear +
        "/linear ft (≈ $" +
        num(costRoll) +
        "). Option B: $" +
        costPerSqyd +
        "/sq yd (≈ $" +
        num(costYd) +
        "). Which is cheaper?",
      ["roll", "per square yard"],
      cheaper,
      "scale_rates",
      "Compare the two computed costs.",
      "Roll ≈ $" + num(costRoll) + "; per sq yd ≈ $" + num(costYd)
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
        "Which has more area: two " +
          small +
          "-inch personal pizzas or one " +
          large +
          "-inch pizza? (" +
          PI_NOTE +
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
      "What happens to the area of a pizza when you double the radius?",
      [
        "Area becomes 4 times as large",
        "Area doubles",
        "Area triples",
        "Area stays the same",
      ],
      "Area becomes 4 times as large",
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
        "A toy ball holds " +
          base +
          " cubic inches of air. How much air would a ball with twice the radius hold?",
        base * 8,
        "scaling",
        0,
        "Volume of a sphere scales with r³, so 2³ = 8 times the volume",
        "V_new = " + base + " × 2³ = " + base + " × 8",
        "cubic inches"
      );
    }
    return _numeric(
      "A toy ball holds " +
        base +
        " cubic inches of air. How much air would a ball with half the radius hold?",
      base / 8,
      "scaling",
      0.01,
      "Volume scales with r³, so (1/2)³ = 1/8 of the volume",
      "V_new = " + base + " × (1/2)³ = " + base + " × (1/8)",
      "cubic inches"
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
        "Find the mean of the data set " + ds + ". Round to the nearest hundredth if needed.",
        num(_mean(data)),
        "stats_center",
        0.05,
        "Mean = sum of values ÷ number of values",
        "mean = (" + terms + ") / " + data.length
      );
    }
    if (ask === "median") {
      const sorted = data.slice().sort(function (a, b) {
        return a - b;
      });
      const sortedDs = "{" + sorted.join(", ") + "}";
      return _numeric(
        "Find the median of the data set " + ds + ".",
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
        "Find the mode of the data set " + ds + ".",
        m,
        "stats_center",
        0,
        "Mode = value that appears most often",
        "Count how many times each value appears; pick the most frequent."
      );
    }
    return _numeric(
      "Find the range of the data set " + ds + ".",
      _range(data),
      "stats_center",
      0,
      "Range = maximum − minimum",
      "range = " + Math.max.apply(null, data) + " − " + Math.min.apply(null, data)
    );
  }

  function genBestMeasureFixed() {
    const options = [
      [
        "Which measure of center is usually best when data has extreme outliers?",
        "Median",
        "The median is resistant to outliers; the mean is pulled by extremes.",
      ],
      [
        "Which measure of center is best for favorite-color type (categorical) data?",
        "Mode",
        "Mode is the most frequent category.",
      ],
      [
        "Which measure of center uses every numeric value and fits roughly symmetric data well?",
        "Mean",
        "The mean is the balancing point of all values.",
      ],
    ];
    const picked = choice(options);
    return _choice(
      picked[0],
      ["Mean", "Median", "Mode", "Range"],
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
      "Range rule of thumb: s ≈ range / 4",
      "s ≈ (" + Math.max.apply(null, data) + " − " + Math.min.apply(null, data) + ") / 4"
    );
  }

  function genCompareVariation() {
    const d1 = [10, 2, 38, 23, 38, 23, 21, 23];
    const d2 = [13, 30, 23, 23, 21, 23, 25, 20];
    let label;
    if (Math.random() < 0.5) {
      label = "Data Set #2";
    } else {
      label = "Data Set #1";
    }
    const s1 = _range(d1) / 4;
    const s2 = _range(d2) / 4;
    const more = s1 > s2 ? "Data Set #1" : "Data Set #2";
    const ask = choice(["sd", "which"]);

    if (ask === "sd") {
      const which = choice([
        [d1, "Data Set #1", s1],
        [d2, "Data Set #2", s2],
      ]);
      const ds = "{" + which[0].join(", ") + "}";
      return _numeric(
        which[1] + ": " + ds + ". Approximate the standard deviation using the range rule of thumb.",
        num(which[2]),
        "stats_spread",
        0.05,
        "s ≈ range / 4",
        "s ≈ (" +
          Math.max.apply(null, which[0]) +
          " − " +
          Math.min.apply(null, which[0]) +
          ") / 4"
      );
    }
    return _choice(
      "Data Set #1: {" +
        d1.join(", ") +
        "}\nData Set #2: {" +
        d2.join(", ") +
        "}\nUsing the range rule of thumb, which has more variation?",
      ["Data Set #1", "Data Set #2", "They are equal"],
      Math.abs(s1 - s2) > 0.01 ? more : "They are equal",
      "stats_spread",
      "Larger approximate SD (range/4) means more variation",
      "s1 ≈ " + num(s1) + ",  s2 ≈ " + num(s2) + "  (from range/4)"
    );
  }

  function genSdTf() {
    return _choice(
      "True or False: Data points must be exactly 1, 2, or 3 standard deviations above or below the mean.",
      ["True", "False"],
      "False",
      "stats_spread",
      "Z-scores can be any real number — data can sit anywhere relative to the mean."
    );
  }

  function genZScore() {
    const mean = choice([70, 75, 80, 84.4, 90, 100]);
    const sd = choice([5, 8, 10, 12, 13.33, 15]);
    const score = choice([55, 60, 65, 70, 78, 85, 92, 95, 105]);
    const z = (score - mean) / sd;
    return _numeric(
      "A set of scores has mean " +
        mean +
        " and standard deviation " +
        sd +
        ". What is the z-score for a score of " +
        score +
        "? Round to the nearest hundredth.",
      num(z),
      "z_scores",
      0.05,
      "z = (x − mean) / standard deviation",
      "z = (" + score + " − " + mean + ") / " + sd
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
    const z = choice([-1.3, -1.0, 1.0, 1.3, 2.0, 2.4]);
    const p = Z_TABLE[String(z)] * 100;
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
        "Adult lifespans are roughly normal with mean " +
          mean +
          " years and SD " +
          sd +
          " years. About what percentage live between " +
          lo +
          " and " +
          hi +
          "?",
        ["about 68%", "about 95%", "about 99.7%", "about 50%"],
        "about 68%",
        "distributions",
        "Empirical rule: ≈68% within 1 SD of the mean"
      );
    }
    if (ask === "2sd") {
      const lo = mean - 2 * sd;
      const hi = mean + 2 * sd;
      return _choice(
        "Adult lifespans are roughly normal with mean " +
          mean +
          " years and SD " +
          sd +
          " years. About what percentage live between " +
          lo +
          " and " +
          hi +
          "?",
        ["about 95%", "about 68%", "about 99.7%", "about 34%"],
        "about 95%",
        "distributions",
        "Empirical rule: ≈95% within 2 SD of the mean"
      );
    }
    if (ask === "3sd_beyond") {
      const cut = mean + 3 * sd;
      return _choice(
        "Adult lifespans are roughly normal with mean " +
          mean +
          " years and SD " +
          sd +
          " years. About what percentage live more than " +
          cut +
          " years?",
        ["about 0.15%", "about 2.5%", "about 16%", "about 5%"],
        "about 0.15%",
        "distributions",
        "≈99.7% within 3 SD, so about 0.3% outside total → ~0.15% in each tail"
      );
    }
    const cut = mean - sd;
    return _choice(
      "Adult lifespans are roughly normal with mean " +
        mean +
        " years and SD " +
        sd +
        " years. About what percentage live less than " +
        cut +
        " years?",
      ["about 16%", "about 2.5%", "about 0.15%", "about 50%"],
      "about 16%",
      "distributions",
      "Below 1 SD left of mean ≈ half of the 32% outside the middle 68% → ~16%"
    );
  }

  function genLiteracy() {
    return _choice(
      "Which practice best helps you use statistics for good decision-making?",
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
    const out = {
      id: q.id,
      topic: q.topic,
      topic_label: TOPICS[q.topic] || q.topic,
      type: q.type,
      prompt: q.prompt,
      hint: q.hint || "",
      setup: q.setup || "",
      has_hint: Boolean(q.hint),
      has_setup: Boolean(q.setup),
      unit: q.unit || "",
    };
    if (q.type === "mc") {
      out.choices = q.choices;
    }
    if (q.type === "flashcard") {
      out.placeholder = "Type the formula (e.g. 2pir or P = 2L+2W)";
    }
    if (q.svg) {
      out.svg = q.svg;
    }
    return out;
  }

  window.QuizQuestions = {
    TOPICS: TOPICS,
    PI: PI,
    PI_NOTE: PI_NOTE,
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
