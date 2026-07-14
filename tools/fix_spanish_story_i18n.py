# -*- coding: utf-8 -*-
"""Wire story generators to i18n keys and add Spanish story translations."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QJS = ROOT / "js" / "questions.js"
ES = ROOT / "lang" / "es.json"

# Spanish translations for story / math prompt keys (override English leftovers).
ES_STORY = {
    "q.rect_p": "El salón cultural necesita cinta de pintor alrededor de una cancha rectangular de {L} ft por {W} ft (sí, la misma donde los Hombres Jóvenes del estaca aún se creen NBA). ¿Cuál es su perímetro en pies?",
    "q.rect_a": "La hermana Jensen mide el linoleo de un salón Primary rectangular de {L} ft por {W} ft. (Murmuró: “Y aconteció… que necesitamos más área.”) ¿Cuál es el área del piso en pies cuadrados?",
    "h.rect_p": "P = 2L + 2W (o 2(L+W)). En TI-36X Pro / Casio escribe la expresión y luego =.",
    "h.rect_a": "A = L × W. En TI-36X Pro / Casio escribe largo × ancho y luego =.",
    "q.tri_area": "Un mapa de la caminata pioneer de los jóvenes muestra un prado triangular con base {b} y altura {h}: básicamente el único lugar plano que no es una tormenta de polvo. ¿Cuál es su área? Redondea a la centésima si hace falta.",
    "h.tri_area": "A = ½bh. Entra mitad × base × altura en tu calculadora.",
    "q.circ_c": "El barrio tiene un molde circular de Jell-O verde “anillo de fuego” con radio {r} pulgadas (clásico culinario en cada potluck de Provo a Pocatello). ¿Cuál es su circunferencia? {pi_note}",
    "q.circ_a": "La cara de un reloj circular de reunión sacramental (el que milagrosamente se ralentiza durante los discursos) tiene radio {r}. ¿Cuál es su área? {pi_note}",
    "h.circ_c": "C = 2πr. Escribe 3.14 para π (no uses la tecla π: las respuestas usan 3.14).",
    "h.circ_a": "A = πr². Escribe 3.14 para π. Usa x² para el cuadrado.",
    "q.lshape_a": "La remodelación de la oficina del obispado dejó un plano en L que cabe en un rectángulo {W} × {H}, con un rectángulo {cutW} × {cutH} cortado de una esquina para el elusivo closet de “galletas de emergencia”. ¿Cuál es el área de la forma en L?",
    "q.lshape_p": "El cobertizo de carretas de Nefi (hipotético) es una L que cabe en un rectángulo {W} × {H} con un recorte {cutW} × {cutH} —porque hasta los profetas tienen planos raros. ¿Cuál es el perímetro exterior de la L?",
    "h.lshape_a": "Área de L = área del rectángulo grande − área de la pieza cortada",
    "h.lshape_p": "Al caminar el borde exterior: el corte añade y quita lados que se cancelan — P = 2(W+H)",
    "q.fence_need": "El hermano Larsen quiere cercar el jardín comunitario del barrio—{ft1} pies {in1} pulgadas por {ft2} pies {in2} pulgadas—para que el zucchini deje de “irse de misión” al patio de la hermana Clark. ¿Cuántos pies de cerca necesitas? Redondea a la centésima.",
    "q.fence_roll": "Amón cerca un lote {ft1}' {in1}\" por {ft2}' {in2}\" (más chico que los campos del rey Lamoni, por suerte). La cerca viene en rollos de 50 ft o 100 ft en el pasillo de ferretería de Deseret Industries. ¿Qué rollo necesitas?",
    "h.fence": "Convierte pulgadas a pies, luego P = 2(L+W). Entra pulgadas÷12 en la calculadora.",
    "h.fence_roll": "Convierte a pies, halla P = 2(L+W), luego elige el rollo más pequeño que sea al menos P.",
    "q.soup": "La Sociedad de Socorro enlatará un cilindro legendario de papas funeral. La base mide {d} pulgadas de diámetro y el envase {h} de alto. (Si Nefi pudo construir un barco, tú puedes hallar un volumen.) ¿Cuál es el volumen? {pi_note}",
    "h.soup": "V = πr²h, y r = diámetro/2. Escribe 3.14 para π (no la tecla π).",
    "q.drive_slope": "La entrada del centro de estaca sube {rise} ft en una distancia horizontal de {run} ft—más empinada que la curva de aprendizaje de un misionero nuevo. ¿Cuál es la pendiente? Escríbela como razón simplificada subida:avance o como fracción subida/avance.",
    "q.drive_len": "La familia de Lehi, si hubiera tenido asfalto, quizá usaría una entrada que sube {rise} ft en {run} ft horizontales. ¿Cuál es la longitud inclinada? Redondea a la centésima. (Consejo de Alma: ten fe—y usa √(a² + b²).)",
    "h.drive_slope": "pendiente = subida / avance (cambio vertical sobre horizontal)",
    "h.drive_len": "Usa el teorema de Pitágoras: c = √(a² + b²). Raíz: 2nd x² en TI-36X Pro; √ en Casio.",
    "q.tv": "Tu familia acaba de conseguir una TV de {diagonal} pulgadas que mide {width} de ancho—perfecta para la Conferencia General (y para discutir quién se sienta dónde). ¿Qué tan alta es? Redondea a la décima. (El tamaño de la TV es la diagonal, no la “grandeza” espiritual de los discursos.)",
    "h.tv": "La diagonal es la hipotenusa: altura = √(diagonal² − ancho²). Redondea a la décima.",
    "q.gal_l": "Tienes un jarro de almacenamiento de {gallons} galones de punch para el picnic del barrio (el rosa neón). ¿Cuántas botellas de {bottleL} litros se necesitan para llenarlo? (1 galón = 3.785 litros). Redondea a la centésima. “Y aconteció” que alguien compró botellas métricas.",
    "h.gal_l": "Convierte galones → litros, luego divide por el tamaño de la botella.",
    "q.map_to_real": "Un mapa de la caminata pioneer usa escala 1 pulgada : {scaleFt} pies. El descanso (donde redescubren la alegría de los calcetines) está a {inches} pulgadas en el mapa. ¿A cuántos pies por el sendero está?",
    "q.real_to_map": "Un mapa de actividad “tierras del Libro de Mormón” del barrio tiene escala 1 pulgada : {scaleFt} pies. Un hito “¿Zarahemla? (tal vez)” está a {feet} pies por el sendero. ¿A cuántas pulgadas está en el mapa? Redondea a la centésima si hace falta.",
    "h.map_to_real": "Multiplica las pulgadas del mapa por el factor de escala (pies por pulgada).",
    "h.real_to_map": "Divide la distancia real entre pies-por-pulgada.",
    "q.carpet_roll": "El salón Primary mide {L} ft × {W} ft y necesita alfombra nueva—preferible que sobreviva al jugo de uva y a “Cabeza, hombros, rodillas y pies”. La alfombra viene en rollo de {rollW} ft de ancho a ${cost} por pie lineal (instalada). ¿Cuánto cuesta? Redondea al centavo.",
    "q.carpet_yd": "El aula tranquila del salón cultural mide {L} ft × {W} ft. La alfombra cuesta ${cost} por yarda cuadrada (instalada)—más barato que construir un barco como Nefi, pero aun así caro. ¿Cuánto cuesta? Redondea al centavo. (9 pie² = 1 yd²)",
    "q.carpet_cmp": "La Sociedad de Socorro compara opciones de alfombra para un cuarto {L}'×{W}' (el del misterioso closet de manualidades “temporal” de 1998). Opción A: rollo de {rollW}' a ${costLin}/pie lineal. Opción B: ${costYd}/yd². ¿Cuál es más barata?",
    "h.carpet_roll": "Calcula cuántos pies lineales de rollo necesitas para cubrir el cuarto",
    "h.carpet_yd": "Convierte pie² a yd², luego multiplica por el precio",
    "h.carpet_cmp": "Calcula el costo total de cada opción y compara. No adivines solo con el precio unitario.",
    "q.pizza_cmp": "Debate de pizza de Mutual: ¿qué tiene más área—dos pizzas personales de {small} pulgadas o una de {large} pulgadas? (Piensa en alimentar a la multitud, pero con queso. {pi_note})",
    "q.pizza_double": "¿Qué le pasa al área de una pizza del barrio si duplicas el radio? (Y aconteció la pizza…)",
    "h.pizza_cmp": "Área = πr². Duplicar el diámetro (o radio) multiplica el área por 4.",
    "h.pizza_double": "A = πr², así que si r → 2r entonces A → π(2r)² = 4πr²",
    "c.pizza_two": "dos de {small} pulgadas",
    "c.pizza_one": "una de {large} pulgadas",
    "q.ball_double": "El Día de actividad Primary tiene un balón con {base} pulgadas cúbicas de aire. Si de alguna forma obtienen uno con el doble de radio (como un baloncesto que comió demasiadas papas funeral), ¿cuánto aire cabría?",
    "q.ball_half": "Los Hombres Jóvenes trajeron un balón con {base} pulgadas cúbicas de aire. Aparece uno más chico con la mitad del radio en el baloncesto del sábado en el salón cultural (no le digas al obispo cuántas ventanas casi rompen). ¿Cuánto aire cabría en el más chico?",
    "h.ball_double": "El volumen de una esfera escala con r³, así que 2³ = 8 veces el volumen.",
    "h.ball_half": "El volumen escala con r³, así que (1/2)³ = 1/8 del volumen.",
    "q.mean": "Puntuaciones de dominio de Escrituras del Seminario esta semana: {ds}. Halla la media. Redondea a la centésima si hace falta. (No, hermano Jensen, el “GPA espiritual” no es una cosa real.)",
    "q.median": "Conteos de asistencia a actividad de Mujeres Jóvenes: {ds}. Halla la mediana (el valor “del medio” tras ordenar—como el asiento del medio en una banca).",
    "q.mode": "Canciones de cantos Primary (codificadas como números): {ds}. Halla la moda—la más pedida. (Pista: probablemente era “Soy un hijo de Dios.”)",
    "q.range": "Conteos de snacks de Trek por familia: {ds}. Halla el rango (máx − mín). Lección pioneer: los extremos existen.",
    "h.mean": "Media = suma de valores ÷ cantidad de valores. Suma primero, luego divide.",
    "h.median": "Ordena los datos; la mediana es el valor del medio (o el promedio de los dos centrales)",
    "h.mode": "Moda = valor que aparece con más frecuencia",
    "h.range": "Rango = máximo − mínimo",
    "q.best_outliers": "¿Qué medida de centro suele ser mejor cuando hay valores atípicos extremos (como ese barrio que trajo 47 bandejas de papas funeral)?",
    "q.best_cat": "¿Qué medida de centro es mejor para himnos favoritos / datos categóricos tipo color favorito?",
    "q.best_sym": "¿Qué medida de centro usa cada valor numérico y funciona bien con datos aproximadamente simétricos (como asistencia Mutual bastante pareja)?",
    "q.range_rule": "Usa la regla del rango para aproximar la desviación estándar de {ds}. Redondea a la centésima.",
    "h.range_rule": "Regla del rango: s ≈ rango / 4.",
    "q.compare_sd": "{which}: {ds}. Aproxima la desviación estándar con la regla del rango.",
    "q.compare_which": "Conjunto #1: {d1}\nConjunto #2: {d2}\nCon la regla del rango, ¿cuál tiene más variación?",
    "q.sd_tf": "Verdadero o falso: los puntos de datos deben estar exactamente a 1, 2 o 3 desviaciones estándar por encima o debajo de la media.",
    "q.zscore": "Un cuestionario de seminario tiene media {mean} y desviación estándar {sd}. ¿Cuál es el z-score de una puntuación {score}? Redondea a la centésima. (Busca aprendizaje por el estudio y también por… z.)",
    "h.zscore": "z = (x − media) / desviación estándar. Usa paréntesis con cuidado.",
    "q.pct_from_z": "Con una tabla normal estándar (Z), ¿aproximadamente qué percentil es un dato a {z} desviaciones estándar de la media? Escribe el percentil como número (p. ej. 84 para el percentil 84). Redondea al entero más cercano.",
    "h.pct_from_z": "La tabla da el área acumulada a la izquierda de z; multiplica por 100 para un percentil.",
    "q.z_from_pct": "Aproxima el z-score de un dato en el percentil {pct} (normal estándar). Redondea a la décima si hace falta.",
    "q.skew": "Una distribución está sesgada a la derecha (cola a la derecha), como una reunión “súper larga” rara que sube el promedio. ¿Qué suele ser cierto?",
    "h.skew": "El sesgo a la derecha tira la media hacia la cola larga derecha.",
    "q.emp_1sd": "Las edades de adultos en un directorio de estaca (muy hipotético) son aproximadamente normales con media {mean} años y DE {sd} años. ¿Qué porcentaje está aproximadamente entre {lo} y {hi}? (No digas “todos se fueron temprano del potluck.”)",
    "q.emp_2sd": "Los años de membresía de adultos en un barrio son aproximadamente normales con media {mean} y DE {sd}. ¿Qué porcentaje cae aproximadamente entre {lo} y {hi}?",
    "q.emp_3sd": "Las edades de la clase de Doctrina del Evangelio son aproximadamente normales con media {mean} años y DE {sd}. ¿Qué porcentaje es mayor que {cut} (el raro club “he leído las notas al pie de Isaías”)?",
    "q.emp_below": "Las edades misioneras en un conjunto inventado (PG) son aproximadamente normales con media {mean} y DE {sd}. ¿Qué porcentaje es menor que {cut}?",
    "h.emp_1sd": "Regla empírica: ≈68% dentro de 1 DE de la media",
    "h.emp_2sd": "Regla empírica: ≈95% dentro de 2 DE de la media",
    "h.emp_3sd": "≈99,7% dentro de 3 DE, así que ~0,3% fuera en total → ~0,15% en cada cola",
    "h.emp_below": "Por debajo de 1 DE a la izquierda de la media ≈ la mitad del 32% fuera del centro 68% → ~16%",
    "q.literacy": "“Buscad el conocimiento, sí, por el estudio y también por la fe” (DyC 88:118)—¿qué práctica te ayuda mejor a usar la estadística para buenas decisiones?",
    "c.lit_a": "Revisa la fuente, la muestra y si gráficos/resúmenes podrían engañar",
    "c.lit_b": "Siempre confía en un gráfico si se ve profesional",
    "c.lit_c": "Usa solo la media e ignora el resto de los datos",
    "c.lit_d": "Asume que correlación siempre significa causalidad",
    "h.literacy": "Buenas preguntas: ¿A quién se encuestó? ¿Qué tan grande fue la muestra? ¿Qué se compara? ¿Los ejes están recortados?",
    "c.skew_a": "Media > mediana",
    "c.skew_b": "Media < mediana",
    "c.skew_c": "Media = moda siempre",
    "c.skew_d": "La moda siempre iguala el rango",
}


def patch_questions_js(text: str) -> str:
    # Rectangle
    text = re.sub(
        r'return _numeric\(\s*"The cultural hall needs painter[^"]*"\s*\+\s*\n\s*L \+\s*\n\s*" ft by " \+\s*\n\s*W \+\s*\n\s*" ft \(yes[^"]*"\s*,',
        'return _numeric(\n        t("q.rect_p", { L: L, W: W }),',
        text,
        count=1,
    )
    # Fallback simpler replacements if regex fails - do function-level replacements

    replacements = [
        (
            '''  function genRectanglePa() {
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
  }''',
            '''  function genRectanglePa() {
    const L = randInt(4, 20);
    const W = randInt(3, 15);
    const ask = choice(["perimeter", "area"]);
    if (ask === "perimeter") {
      return _numeric(
        t("q.rect_p", { L: L, W: W }),
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
      t("q.rect_a", { L: L, W: W }),
      L * W,
      "perimeter_area",
      0,
      t("h.rect_a"),
      "A = " + L + " × " + W,
      t("unit.sq_ft"),
      calcHelp(L + " × " + W + " =", L + " × " + W + " =")
    );
  }''',
        ),
        (
            '''  function genTriangleArea() {
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
  }''',
            '''  function genTriangleArea() {
    const b = randInt(6, 24);
    const h = randInt(4, 18);
    return _numeric(
      t("q.tri_area", { b: b, h: h }),
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
  }''',
        ),
        (
            '''  function genCirclePa() {
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
  }''',
            '''  function genCirclePa() {
    const r = choice([2, 3, 4, 5, 6, 7, 8, 10]);
    const ask = choice(["circumference", "area"]);
    if (ask === "circumference") {
      return _numeric(
        t("q.circ_c", { r: r, pi_note: piNote() }),
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
      t("q.circ_a", { r: r, pi_note: piNote() }),
      num(PI * r * r),
      "perimeter_area",
      0.02,
      t("h.circ_a"),
      "A = " + PI + " × (" + r + ")²",
      "",
      calcHelp("3.14 × " + r + " x² =", "3.14 × " + r + " x² =")
    );
  }''',
        ),
    ]

    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
            print("replaced block ok")
        else:
            print("MISS block starting", old[20:60].replace("\n", " "))

    # L-shape prompts if still English concatenated
    text = text.replace(
        'hint: t("h.lshape_a"),',
        'hint: t("h.lshape_a"),',
    )

    # Empirical rule prompts
    text = re.sub(
        r'"Ages of adults in a \(very hypothetical\) stake directory are roughly normal with mean " \+\s*\n\s*mean \+\s*\n\s*" years and SD " \+\s*\n\s*sd \+\s*\n\s*" years\. About what percentage are between " \+\s*\n\s*lo \+\s*\n\s*" and " \+\s*\n\s*hi \+\s*\n\s*"\? \(Don’t say “all of them left the potluck early\.”\)"',
        't("q.emp_1sd", { mean: mean, sd: sd, lo: lo, hi: hi })',
        text,
        count=1,
    )

    return text


def wire_remaining_simple(text: str) -> str:
    """Wire remaining high-value prompts with targeted replacements."""

    # genCompositeLShape area prompt already may use t - check Nephi
    if 't("q.lshape_a"' not in text and "bishopric office remodel" in text:
        text = re.sub(
            r'prompt:\s*\n\s*t\("q\.lshape_a"[^,]*,',
            'prompt: t("q.lshape_a", { W: W, H: H, cutW: cutW, cutH: cutH }),',
            text,
            count=1,
        )
        # If still English multi-line
        if "bishopric office remodel" in text:
            start = text.find("The bishopric office remodel")
            # find prompt assignment - replace whole English with t()
            text = text.replace(
                """prompt:
          "The bishopric office remodel left an L-shaped floor plan that fits in a " +
          W +
          " × " +
          H +
          " rectangle, with a " +
          cutW +
          " × " +
          cutH +
          " rectangle cut from one corner for the elusive “emergency cookies” closet. What is the area of the L-shape?",""",
                'prompt: t("q.lshape_a", { W: W, H: H, cutW: cutW, cutH: cutH }),',
            )
            print("lshape area wired")

    if "Nephi’s handcart" in text or "Nephi" in text and "q.lshape_p" not in text[text.find("function genCompositeLShape"):text.find("function genCompositeLShape")+800]:
        text = text.replace(
            """prompt:
        "Nephi’s handcart storage shed (hypothetically) is an L-shape fitting in a " +
        W +
        " × " +
        H +
        " rectangle with a " +
        cutW +
        " × " +
        cutH +
        " corner notch removed—because even prophets need weird floor plans. What is the outer perimeter of the L-shape?",""",
            'prompt: t("q.lshape_p", { W: W, H: H, cutW: cutW, cutH: cutH }),',
        )
        print("lshape p attempt")

    return text


def main() -> None:
    text = QJS.read_text(encoding="utf-8")
    text = patch_questions_js(text)
    text = wire_remaining_simple(text)
    QJS.write_text(text, encoding="utf-8")

    es = json.loads(ES.read_text(encoding="utf-8"))
    es["strings"].update(ES_STORY)
    ES.write_text(json.dumps(es, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Updated es.json story strings:", len(ES_STORY))

    # regenerate js packs
    import sys

    sys.path.insert(0, str(ROOT / "tools"))
    from split_dictionaries import sync_js_from_json_files

    sync_js_from_json_files()


if __name__ == "__main__":
    main()
