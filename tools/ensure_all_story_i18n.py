# -*- coding: utf-8 -*-
"""
1) Wire remaining story generators in questions.js to t().
2) Ensure every lang/{code}.json has all English keys.
3) Apply Spanish (already), French, German, Portuguese, Chinese, Japanese,
   Korean, Russian, Arabic, Hindi, Indonesian, Turkish, Vietnamese story
   translations; other langs keep English stories (still fully working).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QJS = ROOT / "js" / "questions.js"
LANG = ROOT / "lang"

sys.path.insert(0, str(ROOT / "tools"))


def replace_function(text: str, name: str, new_body: str) -> str:
    """Replace function name() { ... } with new_body (must include function header)."""
    pattern = rf"  function {name}\(\) \{{"
    m = re.search(pattern, text)
    if not m:
        print("MISS function", name)
        return text
    start = m.start()
    i = m.end() - 1  # at '{'
    depth = 0
    j = i
    while j < len(text):
        ch = text[j]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                j += 1
                break
        j += 1
    print("replaced", name)
    return text[:start] + new_body.rstrip() + "\n\n" + text[j:].lstrip("\n")


FUNCS = {}

FUNCS["genMapScale"] = r'''
  function genMapScale() {
    const scaleFt = choice([40, 50, 100, 200]);
    const ask = choice(["map_to_real", "real_to_map"]);

    if (ask === "map_to_real") {
      const inches = choice([1.5, 2, 2.5, 3, 3.5, 4, 5]);
      return _numeric(
        t("q.map_to_real", { scaleFt: scaleFt, inches: inches }),
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
      t("q.real_to_map", { scaleFt: scaleFt, feet: feet }),
      num(feet / scaleFt),
      "scale_rates",
      0.01,
      t("h.real_to_map"),
      "inches = " + feet + " / " + scaleFt,
      t("unit.inches"),
      calcHelp(feet + " ÷ " + scaleFt + " =", feet + " ÷ " + scaleFt + " =")
    );
  }
'''

FUNCS["genCarpet"] = r'''
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
        t("q.carpet_roll", { L: L, W: W, rollW: rollW, cost: costPerLinear }),
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
        t("q.carpet_yd", { L: L, W: W, cost: costPerSqyd }),
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
      t("q.carpet_cmp", {
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
'''

FUNCS["genPizza"] = r'''
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
        t("q.pizza_cmp", { small: small, large: large, pi_note: piNote() }),
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
      t("q.pizza_double"),
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
'''

FUNCS["genBallAir"] = r'''
  function genBallAir() {
    const base = choice([100, 120, 150, 200]);
    const ask = choice(["double", "half"]);

    if (ask === "double") {
      return _numeric(
        t("q.ball_double", { base: base }),
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
      t("q.ball_half", { base: base }),
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
'''

FUNCS["genMeanMedianModeRange"] = r'''
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
        t("q.mean", { ds: ds }),
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
        t("q.median", { ds: ds }),
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
        t("q.mode", { ds: ds }),
        m,
        "stats_center",
        0,
        t("h.mode"),
        "Count how many times each value appears; pick the most frequent."
      );
    }
    return _numeric(
      t("q.range", { ds: ds }),
      _range(data),
      "stats_center",
      0,
      t("h.range"),
      "range = " + Math.max.apply(null, data) + " − " + Math.min.apply(null, data)
    );
  }
'''

FUNCS["genRangeRule"] = r'''
  function genRangeRule() {
    const data = _dataSet(8);
    data[0] = 2;
    data[1] = 40;
    const approxSd = _range(data) / 4;
    const ds = "{" + data.join(", ") + "}";
    return _numeric(
      t("q.range_rule", { ds: ds }),
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
'''

FUNCS["genPercentileFromZ"] = r'''
  function genPercentileFromZ() {
    // Keep z keys as fixed decimals so Z_TABLE lookup stays stable (String(1.0) === "1").
    const zKeys = ["-1.3", "-1.0", "1.0", "1.3", "2.0", "2.4"];
    const zKey = choice(zKeys);
    const z = parseFloat(zKey);
    const p = Z_TABLE[zKey] * 100;
    return _numeric(
      t("q.pct_from_z", { z: z }),
      Math.round(p),
      "z_scores",
      2,
      t("h.pct_from_z")
    );
  }
'''

FUNCS["genZFromPercentile"] = r'''
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
      t("q.z_from_pct", { pct: pct }),
      z,
      "z_scores",
      0.2,
      "≈50th → z≈0; ≈84th → z≈1; ≈16th → z≈−1"
    );
  }
'''

# Formula MC prompts
FORMULA_REPLACEMENTS = [
    (
        '"What is the formula for the perimeter of a square with side length s?"',
        't("q.form_sq_p")',
    ),
    (
        '"What is the formula for the area of a square with side length s?"',
        't("q.form_sq_a")',
    ),
    (
        '"What is the formula for the perimeter of a rectangle with length L and width W?"',
        't("q.form_rect_p")',
    ),
    (
        '"What is the formula for the area of a rectangle with length L and width W?"',
        't("q.form_rect_a")',
    ),
    (
        '"What is the formula for the perimeter of a triangle with sides a, b, and c?"',
        't("q.form_tri_p")' if False else 't("q.form_tri_a")',  # will fix below
    ),
]


def wire_js() -> None:
    text = QJS.read_text(encoding="utf-8")
    for name, body in FUNCS.items():
        text = replace_function(text, name, body)

    # formula prompts
    pairs = [
        (
            '"What is the formula for the perimeter of a square with side length s?"',
            't("q.form_sq_p")',
        ),
        (
            '"What is the formula for the area of a square with side length s?"',
            't("q.form_sq_a")',
        ),
        (
            '"What is the formula for the perimeter of a rectangle with length L and width W?"',
            't("q.form_rect_p")',
        ),
        (
            '"What is the formula for the area of a rectangle with length L and width W?"',
            't("q.form_rect_a")',
        ),
        (
            '"What is the formula for the perimeter of a triangle with sides a, b, and c?"',
            't("q.form_tri_a")',  # wrong key - need form_tri_p; add key later
        ),
        (
            '"What is the formula for the area of a triangle with base b and height h?"',
            't("q.form_tri_a")',
        ),
        (
            '"What is the formula for the circumference of a circle with radius r?"',
            't("q.form_circ_c")',
        ),
        (
            '"What is the formula for the area of a circle with radius r?"',
            't("q.form_circ_a")',
        ),
        (
            '"What is the formula for the volume of a cube with side length s?"',
            't("q.form_cube")',
        ),
        (
            '"What is the formula for the volume of a sphere with radius r?"',
            't("q.form_sphere")',
        ),
        (
            '"What is the formula for the volume of a cylinder with radius r and height h?"',
            't("q.form_cyl")',
        ),
    ]
    # Fix triangle perimeter - check en for key
    for old, new in pairs:
        if old in text:
            text = text.replace(old, new)
            print("formula", new)

    # Pythagorean formula question
    text = re.sub(
        r'"What is the Pythagorean Theorem[^"]*"',
        't("q.form_pyth")',
        text,
        count=1,
    )

    QJS.write_text(text, encoding="utf-8")


# --- translations: key subsets for story problems ---
# Import Spanish from es.json after wiring; build packs for other langs.

def fr_stories(en: dict) -> dict:
    return {
        "q.circ_c": "La paroisse a un moule circulaire de Jell-O vert « anneau de feu » de rayon {r} pouces (classique culinaire de tout potluck de Provo à Pocatello). Quelle est sa circonférence ? {pi_note}",
        "q.circ_a": "Le cadran d’une horloge ronde de réunion sacramentelle (celle qui ralentit miraculeusement pendant les discours) a un rayon {r}. Quelle est son aire ? {pi_note}",
        "h.circ_c": "C = 2πr. Tapez 3,14 pour π (pas la touche π — les réponses utilisent 3,14).",
        "h.circ_a": "A = πr². Tapez 3,14 pour π. Utilisez x² pour le carré.",
        "q.rect_p": "La salle culturelle a besoin de ruban de peintre autour d’un terrain rectangulaire de {L} ft sur {W} ft. Quel est son périmètre en pieds ?",
        "q.rect_a": "Sœur Jensen mesure le linoléum d’une classe Primary rectangulaire de {L} ft sur {W} ft. Quelle est l’aire du sol en pieds carrés ?",
        "q.tri_area": "Une carte de trek pioneer montre une prairie triangulaire de base {b} et hauteur {h}. Quelle est son aire ? Arrondissez au centième si besoin.",
        "q.map_to_real": "Une carte de trek pioneer a l’échelle 1 pouce : {scaleFt} pieds. Le repos est à {inches} pouces sur la carte. Combien de pieds sur le sentier ?",
        "q.real_to_map": "Une carte d’activité « terres du Livre de Mormon » a l’échelle 1 pouce : {scaleFt} pieds. Un repère « Zarahemla ? (peut-être) » est à {feet} pieds. Combien de pouces sur la carte ?",
        "q.pizza_cmp": "Débat pizza Mutual : quelle aire est plus grande — deux pizzas de {small} pouces ou une de {large} pouces ? {pi_note}",
        "q.pizza_double": "Que devient l’aire d’une pizza paroissiale si on double le rayon ?",
        "c.pizza_two": "deux de {small} pouces",
        "c.pizza_one": "une de {large} pouces",
        "q.ball_double": "Un ballon d’activité Primary contient {base} pouces cubes d’air. Combien d’air avec le double du rayon ?",
        "q.ball_half": "Les Jeunes Gens ont un ballon de {base} pouces cubes. Combien d’air avec la moitié du rayon ?",
        "q.zscore": "Un quiz de séminaire a moyenne {mean} et écart type {sd}. Quel est le z-score pour {score} ? Arrondissez au centième.",
        "q.literacy": "« Cherchez le savoir, oui, par l’étude et aussi par la foi » (D&A 88:118) — quelle pratique aide le mieux à bien utiliser les statistiques ?",
        "pi_note": "Utilisez π = 3,14. Arrondissez au centième près.",
    }


def de_stories(en: dict) -> dict:
    return {
        "q.circ_c": "Die Gemeinde hat eine runde grüne Jell-O-„Ring-of-Fire“-Form mit Radius {r} Zoll. Wie groß ist der Umfang? {pi_note}",
        "q.circ_a": "Ein rundes Abendmahlsversammlungs-Zifferblatt hat Radius {r}. Wie groß ist die Fläche? {pi_note}",
        "h.circ_c": "C = 2πr. Tippe 3,14 für π (nicht die π-Taste).",
        "h.circ_a": "A = πr². Tippe 3,14 für π. Nutze x² für das Quadrat.",
        "q.rect_p": "Die Kulturhalle braucht Malerband um ein Rechteckfeld {L} ft × {W} ft. Wie groß ist der Umfang in Fuß?",
        "q.rect_a": "Schwester Jensen misst Linoleum für einen rechteckigen Primary-Raum {L} ft × {W} ft. Wie groß ist die Bodenfläche in Quadratfuß?",
        "q.tri_area": "Eine Pioneer-Trek-Karte zeigt eine dreieckige Wiese mit Basis {b} und Höhe {h}. Wie groß ist die Fläche?",
        "q.map_to_real": "Eine Trek-Karte hat Maßstab 1 Zoll : {scaleFt} Fuß. Die Pause ist {inches} Zoll auf der Karte. Wie viele Fuß auf dem Weg?",
        "q.real_to_map": "Eine Gemeindekarte „Buch Mormon Länder“ hat Maßstab 1 Zoll : {scaleFt} Fuß. Ein Punkt „Zarahemla? (vielleicht)“ ist {feet} Fuß entfernt. Wie viele Zoll auf der Karte?",
        "q.pizza_cmp": "Mutual-Pizza-Streit: Welche Fläche ist größer — zwei {small}-Zoll-Pizzen oder eine {large}-Zoll-Pizza? {pi_note}",
        "q.pizza_double": "Was geschieht mit der Fläche einer Gemeinde-Pizza, wenn man den Radius verdoppelt?",
        "c.pizza_two": "zwei {small}-Zoll",
        "c.pizza_one": "eine {large}-Zoll",
        "q.ball_double": "Ein Primary-Ball hält {base} Kubikzoll Luft. Wie viel bei doppeltem Radius?",
        "q.ball_half": "Die Aaronischen Priesterschafts-Jungen haben einen Ball mit {base} Kubikzoll. Wie viel bei halbem Radius?",
        "q.zscore": "Ein Seminar-Quiz hat Mittelwert {mean} und Standardabweichung {sd}. Was ist der z-Wert für {score}?",
        "q.literacy": "„Sucht Lernen … durch Studium und auch durch Glauben“ (LuB 88:118)—welche Praxis hilft am besten bei guter Statistik-Nutzung?",
        "pi_note": "Verwende π = 3,14. Runde auf die nächste Hundertstel.",
    }


def pt_stories(en: dict) -> dict:
    return {
        "q.circ_c": "A ala tem um molde circular de Jell-O verde “anel de fogo” com raio {r} polegadas. Qual é a circunferência? {pi_note}",
        "q.circ_a": "O relógio circular da reunião sacramental tem raio {r}. Qual é a área? {pi_note}",
        "h.circ_c": "C = 2πr. Digite 3,14 para π (não use a tecla π).",
        "h.circ_a": "A = πr². Digite 3,14 para π. Use x² para o quadrado.",
        "q.rect_p": "O salão cultural precisa de fita ao redor de uma quadra {L} ft por {W} ft. Qual é o perímetro em pés?",
        "q.rect_a": "A irmã Jensen mede linoleum de uma sala Primary {L} ft por {W} ft. Qual é a área em pés quadrados?",
        "q.tri_area": "Um mapa de trek pioneiro mostra um prado triangular com base {b} e altura {h}. Qual é a área?",
        "q.map_to_real": "Um mapa de trek tem escala 1 polegada : {scaleFt} pés. A parada está a {inches} polegadas no mapa. Quantos pés na trilha?",
        "q.real_to_map": "Um mapa “terras do Livro de Mórmon” tem escala 1 polegada : {scaleFt} pés. Um marco “Zaraenla? (talvez)” está a {feet} pés. Quantas polegadas no mapa?",
        "q.pizza_cmp": "Debate de pizza no Mutual: qual tem mais área—duas pizzas de {small} polegadas ou uma de {large}? {pi_note}",
        "q.pizza_double": "O que acontece com a área de uma pizza da ala quando você dobra o raio?",
        "c.pizza_two": "duas de {small} polegadas",
        "c.pizza_one": "uma de {large} polegadas",
        "q.ball_double": "Uma bola do Dia de Atividade Primary tem {base} polegadas cúbicas de ar. Quanto com o dobro do raio?",
        "q.ball_half": "Os Rapazes trouxeram uma bola com {base} polegadas cúbicas. Quanto com metade do raio?",
        "q.zscore": "Um questionário do seminário tem média {mean} e desvio padrão {sd}. Qual é o escore-z de {score}?",
        "q.literacy": "“Buscai o aprendizado… pelo estudo e também pela fé” (D&C 88:118)—qual prática melhor ajuda a usar estatística bem?",
        "pi_note": "Use π = 3,14. Arredonde para o centésimo mais próximo.",
    }


def zh_stories(en: dict) -> dict:
    return {
        "q.circ_c": "支联会聚餐上常见一个半径为 {r} 英寸的圆形绿色果冻模具。它的周长是多少？{pi_note}",
        "q.circ_a": "圣餐聚会时钟表盘半径为 {r}。面积是多少？{pi_note}",
        "h.circ_c": "C = 2πr。输入 3.14 表示 π（不要用 π 键）。",
        "h.circ_a": "A = πr²。输入 3.14 表示 π。用 x² 求平方。",
        "q.rect_p": "文化厅需要给一块 {L} 英尺 × {W} 英尺的矩形场地围胶带。周长（英尺）是多少？",
        "q.rect_a": "一个 {L} 英尺 × {W} 英尺的主日学教室要铺地板。面积（平方英尺）是多少？",
        "q.tri_area": "青年拓荒者徒步地图上有一个底为 {b}、高为 {h} 的三角形草地。面积是多少？",
        "q.map_to_real": "徒步地图比例为 1 英寸:{scaleFt} 英尺。休息点在地图上距起点 {inches} 英寸。实际多少英尺？",
        "q.real_to_map": "地图比例 1 英寸:{scaleFt} 英尺。地标距起点 {feet} 英尺。地图上多少英寸？",
        "q.pizza_cmp": "青年团披萨争论：两块 {small} 英寸披萨和一块 {large} 英寸披萨，谁面积更大？{pi_note}",
        "q.pizza_double": "披萨半径加倍时，面积会怎样？",
        "c.pizza_two": "两块 {small} 英寸",
        "c.pizza_one": "一块 {large} 英寸",
        "q.ball_double": "活动日一个球装有 {base} 立方英寸空气。半径变为两倍时装多少？",
        "q.ball_half": "一个球装有 {base} 立方英寸空气。半径减半时装多少？",
        "q.zscore": "圣经班测验均值 {mean}、标准差 {sd}。分数 {score} 的 z 分数是多少？",
        "q.literacy": "“寻求学习，甚至藉着研读，也藉着信”（教约 88:118）——哪项做法最有助于善用统计？",
        "pi_note": "取 π = 3.14。四舍五入到百分位。",
    }


def ja_stories(en: dict) -> dict:
    return {
        "q.circ_c": "ワードの緑のゼリー型（半径 {r} インチ）の円周を求めよ。{pi_note}",
        "q.circ_a": "聖餐会の丸い時計の半径は {r}。面積を求めよ。{pi_note}",
        "h.circ_c": "C = 2πr。π は 3.14 と入力（πキーは使わない）。",
        "h.circ_a": "A = πr²。π は 3.14。平方は x²。",
        "q.rect_p": "文化会館の長方形コートは {L} ft × {W} ft。周囲（フィート）は？",
        "q.rect_a": "Primary 教室の床は {L} ft × {W} ft。面積（平方フィート）は？",
        "q.tri_area": "パイオニア・トレック地図の三角形の草地は底辺 {b}・高さ {h}。面積は？",
        "q.map_to_real": "縮尺 1 インチ : {scaleFt} フィート。休憩所は地図上 {inches} インチ。実際は何フィート？",
        "q.real_to_map": "縮尺 1 インチ : {scaleFt} フィート。目印は {feet} フィート先。地図上は何インチ？",
        "q.pizza_cmp": "互恵部のピザ論争：{small} インチ2枚と {large} インチ1枚、どちらが大きい？{pi_note}",
        "q.pizza_double": "半径を2倍にするとピザの面積はどうなる？",
        "c.pizza_two": "{small} インチが2枚",
        "c.pizza_one": "{large} インチが1枚",
        "q.ball_double": "ボールの空気は {base} 立方インチ。半径2倍なら？",
        "q.ball_half": "ボールの空気は {base} 立方インチ。半径半分なら？",
        "q.zscore": "セミナリーの平均 {mean}・標準偏差 {sd}。得点 {score} の z は？",
        "q.literacy": "「学びを求めよ……研究により、また信仰によっても」（教義と聖約88:118）。統計を正しく使う最善の実践は？",
        "pi_note": "π = 3.14 を使い、百分の一に丸めなさい。",
    }


def ko_stories(en: dict) -> dict:
    return {
        "q.circ_c": "와드 팟럭의 반지름 {r}인치 원형 젤리 틀의 둘레는? {pi_note}",
        "q.circ_a": "성찬식 원형 시계 반지름이 {r}일 때 넓이는? {pi_note}",
        "h.circ_c": "C = 2πr. π는 3.14로 입력(π 키 사용 금지).",
        "h.circ_a": "A = πr². π는 3.14. 제곱은 x².",
        "q.rect_p": "문화회관 직사각형 코트 {L}ft × {W}ft의 둘레(피트)는?",
        "q.rect_a": "초등회 교실 바닥 {L}ft × {W}ft의 넓이(제곱피트)는?",
        "q.tri_area": "파이오니어 트렉 지도의 삼각형 들판은 밑변 {b}, 높이 {h}. 넓이는?",
        "q.map_to_real": "축척 1인치:{scaleFt}피트. 휴게소가 지도에서 {inches}인치. 실제 거리는?",
        "q.real_to_map": "축척 1인치:{scaleFt}피트. 표지가 {feet}피트 앞. 지도상 인치는?",
        "q.pizza_cmp": "상호부조회 Mutual 피자 논쟁: {small}인치 두 판 vs {large}인치 한 판, 어느 넓이가 클까? {pi_note}",
        "q.pizza_double": "피자 반지름을 두 배로 하면 넓이는?",
        "c.pizza_two": "{small}인치 두 판",
        "c.pizza_one": "{large}인치 한 판",
        "q.ball_double": "공에 공기 {base}세제곱인치. 반지름 2배면?",
        "q.ball_half": "공에 공기 {base}세제곱인치. 반지름 절반이면?",
        "q.zscore": "세미나리 평균 {mean}, 표준편차 {sd}. 점수 {score}의 z점수는?",
        "q.literacy": "“배움을 구하라… 연구로도, 또한 신앙으로도”(교성 88:118)—통계를 잘 쓰는 최선의 습관은?",
        "pi_note": "π = 3.14를 쓰고 백분위(소수 둘째 자리)로 반올림하세요.",
    }


def ru_stories(en: dict) -> dict:
    return {
        "q.circ_c": "В приходе круглый зелёный Желло-форму «кольцо огня» радиусом {r} дюймов. Найдите длину окружности. {pi_note}",
        "q.circ_a": "Круглый циферблат часов на таинстве имеет радиус {r}. Найдите площадь. {pi_note}",
        "h.circ_c": "C = 2πr. Введите 3,14 для π (не клавишу π).",
        "h.circ_a": "A = πr². Введите 3,14 для π. Используйте x².",
        "q.rect_p": "Культурный зал: прямоугольник {L} ft × {W} ft. Периметр в футах?",
        "q.rect_a": "Класс Начальной: {L} ft × {W} ft. Площадь в кв. футах?",
        "q.tri_area": "На карте трека треугольник с основанием {b} и высотой {h}. Площадь?",
        "q.map_to_real": "Масштаб 1 дюйм : {scaleFt} футов. Остановка в {inches} дюймах на карте. Сколько футов на тропе?",
        "q.real_to_map": "Масштаб 1 дюйм : {scaleFt} футов. Ориентир в {feet} футах. Сколько дюймов на карте?",
        "q.pizza_cmp": "Спор Mutual о пицце: две по {small} дюймов или одна {large}? {pi_note}",
        "q.pizza_double": "Что станет с площадью пиццы, если удвоить радиус?",
        "c.pizza_two": "две по {small} дюймов",
        "c.pizza_one": "одна {large} дюймов",
        "q.ball_double": "Мяч содержит {base} куб. дюймов воздуха. Сколько при удвоенном радиусе?",
        "q.ball_half": "Мяч содержит {base} куб. дюймов. Сколько при половине радиуса?",
        "q.zscore": "Тест семинарии: среднее {mean}, СКО {sd}. z-оценка для {score}?",
        "q.literacy": "«Ищите знания… учением и также верой» (УиЗ 88:118)—какая практика лучше всего помогает в статистике?",
        "pi_note": "Используйте π = 3,14. Округлите до сотых.",
    }


def ar_stories(en: dict) -> dict:
    return {
        "q.circ_c": "لدى الفرع قالب جيلي دائري أخضر نصف قطره {r} بوصة. ما محيطه؟ {pi_note}",
        "q.circ_a": "ساعة اجتماع القربان الدائرية نصف قطرها {r}. ما مساحتها؟ {pi_note}",
        "h.circ_c": "C = 2πr. اكتب 3.14 للـ π (لا تستخدم مفتاح π).",
        "h.circ_a": "A = πr². اكتب 3.14 للـ π. استخدم x² للمربع.",
        "q.rect_p": "القاعة الثقافية: مستطيل {L} قدم × {W} قدم. ما المحيط بالقدم؟",
        "q.rect_a": "فصل الابتدائية: {L} قدم × {W} قدم. ما المساحة بالقدم المربع؟",
        "q.tri_area": "في خريطة الرحلة مثلث قاعدته {b} وارتفاعه {h}. ما المساحة؟",
        "q.map_to_real": "مقياس الخريطة 1 بوصة : {scaleFt} قدم. الاستراحة على بعد {inches} بوصة. كم قدمًا على الطريق؟",
        "q.real_to_map": "المقياس 1 بوصة : {scaleFt} قدم. المعلم على بعد {feet} قدم. كم بوصة على الخريطة؟",
        "q.pizza_cmp": "نقاش بيتزا الشباب: أيهما أكبر مساحة—بيتزتان {small} بوصة أم واحدة {large}؟ {pi_note}",
        "q.pizza_double": "ماذا يحدث لمساحة البيتزا عند مضاعفة نصف القطر؟",
        "c.pizza_two": "اثنتان بحجم {small} بوصة",
        "c.pizza_one": "واحدة بحجم {large} بوصة",
        "q.ball_double": "كرة تحتوي {base} بوصة مكعبة هواء. كم مع ضعف نصف القطر؟",
        "q.ball_half": "كرة تحتوي {base} بوصة مكعبة. كم مع نصف نصف القطر؟",
        "q.zscore": "اختبار المعهد متوسطه {mean} وانحرافه {sd}. ما درجة z للنتيجة {score}؟",
        "q.literacy": "«اطلبوا التعلم… بالدراسة وأيضًا بالإيمان» (ع و م 88:118)—أي ممارسة تساعد أكثر على استخدام الإحصاء جيدًا؟",
        "pi_note": "استخدم π = 3.14. قرّب إلى أقرب جزء من مئة.",
    }


def hi_stories(en: dict) -> dict:
    return {
        "q.circ_c": "वार्ड में हरे जेली के गोले का अर्धव्यास {r} इंच है। परिधि क्या है? {pi_note}",
        "q.circ_a": "सैक्रोमेंट मीटिंग की गोलाकार घड़ी का अर्धव्यास {r} है। क्षेत्रफल क्या है? {pi_note}",
        "h.circ_c": "C = 2πr। π के लिए 3.14 टाइप करें (π कुंजी नहीं)।",
        "h.circ_a": "A = πr²। π के लिए 3.14। वर्ग के लिए x²।",
        "q.rect_p": "सांस्कृतिक हॉल आयत {L} ft × {W} ft। परिमाप (फीट) क्या है?",
        "q.rect_a": "प्राथमिक कक्षा का फर्श {L} ft × {W} ft। क्षेत्रफल (वर्ग फीट) क्या है?",
        "q.tri_area": "पायनियर ट्रेक मानचित्र पर त्रिभुज आधार {b}, ऊँचाई {h}। क्षेत्रफल?",
        "q.map_to_real": "पैमाना 1 इंच : {scaleFt} फीट। विश्राम स्थल मानचित्र पर {inches} इंच। मार्ग पर कितने फीट?",
        "q.real_to_map": "पैमाना 1 इंच : {scaleFt} फीट। मील का पत्थर {feet} फीट दूर। मानचित्र पर कितने इंच?",
        "q.pizza_cmp": "म्युचुअल पिज्जा बहस: {small}-इंच दो या {large}-इंच एक—किसका क्षेत्रफल अधिक? {pi_note}",
        "q.pizza_double": "त्रिज्या दुगनी होने पर पिज्जा का क्षेत्रफल क्या होता है?",
        "c.pizza_two": "दो {small}-इंच",
        "c.pizza_one": "एक {large}-इंच",
        "q.ball_double": "गेंद में {base} घन इंच हवा। दुगनी त्रिज्या पर कितनी?",
        "q.ball_half": "गेंद में {base} घन इंच हवा। आधी त्रिज्या पर कितनी?",
        "q.zscore": "सेमिनरी क्विज़ माध्य {mean}, मानक विचलन {sd}। अंक {score} का z-स्कोर?",
        "q.literacy": "“शिक्षा खोजो… अध्ययन द्वारा और विश्वास द्वारा भी” (डि एंड सी 88:118)—आँकड़ों का सही उपयोग किस आदत से?",
        "pi_note": "π = 3.14 उपयोग करें। सौवें पर पूर्णांक करें।",
    }


EXTRA_LANG = {
    "fr": fr_stories,
    "de": de_stories,
    "pt": pt_stories,
    "zh": zh_stories,
    "ja": ja_stories,
    "ko": ko_stories,
    "ru": ru_stories,
    "ar": ar_stories,
    "hi": hi_stories,
    "id": lambda en: {
        "q.circ_c": "Ward punya cetakan Jell-O hijau circular jari-jari {r} inci. Berapa kelilingnya? {pi_note}",
        "q.circ_a": "Jam bundar pertemuan sakramen berjari-jari {r}. Berapa luasnya? {pi_note}",
        "h.circ_c": "C = 2πr. Ketik 3,14 untuk π (jangan tombol π).",
        "h.circ_a": "A = πr². Ketik 3,14 untuk π. Pakai x² untuk kuadrat.",
        "q.pizza_cmp": "Debat pizza Mutual: mana lebih luas—dua pizza {small} inci atau satu {large} inci? {pi_note}",
        "c.pizza_two": "dua {small} inci",
        "c.pizza_one": "satu {large} inci",
        "q.zscore": "Kuis seminari rata-rata {mean}, simpangan baku {sd}. Berapa z-skor untuk {score}?",
        "pi_note": "Gunakan π = 3,14. Bulatkan ke seperseratus terdekat.",
    },
    "tr": lambda en: {
        "q.circ_c": "Koğuşun yeşil Jell-O kalıbının yarıçapı {r} inç. Çevre nedir? {pi_note}",
        "q.circ_a": "Kutsal tören toplantısı saatinin yarıçapı {r}. Alan nedir? {pi_note}",
        "h.circ_c": "C = 2πr. π için 3,14 yazın (π tuşu kullanmayın).",
        "h.circ_a": "A = πr². π için 3,14. Kare için x².",
        "q.pizza_cmp": "Mutual pizza tartışması: {small} inç iki mi, {large} inç bir mi daha geniş? {pi_note}",
        "c.pizza_two": "iki {small} inç",
        "c.pizza_one": "bir {large} inç",
        "q.zscore": "Seminer quiz ortalaması {mean}, standart sapma {sd}. {score} için z-skoru?",
        "pi_note": "π = 3,14 kullanın. En yakın yüzdeye yuvarlayın.",
    },
    "vi": lambda en: {
        "q.circ_c": "Tiểu giáo khu có khuôn Jell-O xanh hình tròn bán kính {r} inch. Chu vi là bao nhiêu? {pi_note}",
        "q.circ_a": "Đồng hồ họp Tiệc Thánh hình tròn bán kính {r}. Diện tích là bao nhiêu? {pi_note}",
        "h.circ_c": "C = 2πr. Gõ 3,14 cho π (đừng dùng phím π).",
        "h.circ_a": "A = πr². Gõ 3,14 cho π. Dùng x² để bình phương.",
        "q.pizza_cmp": "Tranh luận pizza Mutual: hai bánh {small} inch hay một bánh {large} inch rộng hơn? {pi_note}",
        "c.pizza_two": "hai bánh {small} inch",
        "c.pizza_one": "một bánh {large} inch",
        "q.zscore": "Bài kiểm tra học viện trung bình {mean}, độ lệch chuẩn {sd}. Điểm z của {score}?",
        "pi_note": "Dùng π = 3,14. Làm tròn đến phần trăm.",
    },
}


def sync_all_langs() -> None:
    en_path = LANG / "en.json"
    en_data = json.loads(en_path.read_text(encoding="utf-8"))
    en_strings = en_data["strings"]

    # Ensure formula tri perimeter key exists
    if "q.form_tri_p" not in en_strings:
        en_strings["q.form_tri_p"] = (
            "What is the formula for the perimeter of a triangle with sides a, b, and c?"
        )
        en_path.write_text(
            json.dumps(en_data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    # Load Spanish stories already in es.json
    es = json.loads((LANG / "es.json").read_text(encoding="utf-8"))

    meta = json.loads((LANG / "languages.json").read_text(encoding="utf-8"))
    for L in meta["languages"]:
        code = L["code"]
        path = LANG / f"{code}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        strings = data.get("strings", {})
        # Start with full English coverage so every key resolves
        merged = dict(en_strings)
        # Keep existing UI translations
        merged.update(strings)
        if code == "es":
            merged.update(es.get("strings", {}))
        elif code in EXTRA_LANG:
            fn = EXTRA_LANG[code]
            merged.update(fn(en_strings))
        data["strings"] = merged
        data["code"] = code
        data["name"] = L["name"]
        data["native"] = L["native"]
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"synced {code}: {len(merged)} keys")

    from split_dictionaries import sync_js_from_json_files

    sync_js_from_json_files()


def main() -> None:
    wire_js()
    # Fix triangle perimeter key after wire used form_tri_a for both
    text = QJS.read_text(encoding="utf-8")
    # First occurrence in genFormulaTriangle perimeter branch
    text = text.replace(
        't("q.form_tri_a"),\n        ["P = a + b + c"',
        't("q.form_tri_p"),\n        ["P = a + b + c"',
        1,
    )
    QJS.write_text(text, encoding="utf-8")
    sync_all_langs()
    # Final audit
    js = QJS.read_text(encoding="utf-8")
    leftover = re.findall(
        r'return _(?:numeric|choice|short)\(\s*\n\s*"([A-Za-z][^"]{25,60})',
        js,
    )
    print("leftover English prompts:", leftover)


if __name__ == "__main__":
    main()
