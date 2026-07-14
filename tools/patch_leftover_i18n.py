# -*- coding: utf-8 -*-
"""Hand-patch leftover English question strings that auto-translate skipped."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LANG = ROOT / "lang"

# Per-language overrides for keys still equal to English.
PATCHES: dict[str, dict[str, str]] = {
    "sw": {
        "flash.recall": "Kadi ya fomula — andika fomula:\n{front}",
        "flash.recognize": "Kadi ya fomula — ni ipi sahihi kwa:\n{front}?",
        "q.circ_c": "Wadi ina ukungu wa Jell-O wa mviringo wenye radius {r} inchi (klassiki katika kila potluck). Mzunguko wake ni upi? {pi_note}",
        "q.circ_a": "Uso wa saa ya kikao cha sakramenti wenye umbo la mviringo una radius {r}. Eneo lake ni lipi? {pi_note}",
        "q.soup": "Relief Society inaweka kwenye kopo silinda ya viazi za mazishi. Kipenyo cha msingi ni {d} inchi na urefu ni {h} inchi. Kiasi ni kipi? {pi_note}",
        "q.map_to_real": "Ramani ya trek ina kipimo cha 1 inchi : {scaleFt} futi. Kituo cha pumziko kiko umbali wa {inches} inchi kwenye ramani. Ni futi ngapi kwenda huko?",
        "q.real_to_map": "Ramani ya shughuli ina kipimo 1 inchi : {scaleFt} futi. Alama iko {feet} futi mbele. Ni inchi ngapi kwenye ramani? Kadiria kwa mia ya karibu ikihitajika.",
        "q.carpet_cmp": "Relief Society inalinganisha chaguo za zulia kwa chumba {L}'×{W}'. Chaguo A: roll yenye upana {rollW}' kwa ${costLin}/ft. Chaguo B: ${costYd}/sq yd. Lipi ni rahisi zaidi?",
        "c.carpet_roll": "roll",
        "q.pizza_cmp": "Jadala la pizza: ni lipi lina eneo kubwa zaidi—pizza mbili za {small}-inchi au pizza moja ya {large}-inchi? {pi_note}",
        "c.pizza_two": "mbili za {small}-inchi",
        "c.pizza_one": "moja ya {large}-inchi",
        "q.compare_sd": "{which}: {ds}. Kadiria mkengeuko wa kawaida ukitumia sheria ya range.",
        "q.zscore": "Mtihani una wastani {mean} na mkengeuko wa kawaida {sd}. Z-score ya alama {score} ni nini? Kadiria kwa mia ya karibu.",
        "q.emp_2sd": "Miaka ya uanachama ina takriban ugawaji wa kawaida kwa wastani {mean} na SD {sd}. Asilimia gani iko kati ya {lo} na {hi}?",
        "q.emp_below": "Umri wa wamishenari una ugawaji wa kawaida kwa wastani {mean} na SD {sd}. Asilimia gani ni chini ya {cut}?",
        "unit.ft": "ft",
        "unit.sq_ft": "sq ft",
    },
    "de": {
        "q.fence_roll": "Ammon umzäunt ein Gartenstück {ft1}' {in1}\" mal {ft2}' {in2}\". Zaunrollen gibt es in 50-ft oder 100-ft. Welche Rolle brauchst du?",
        "q.drive_slope": "Die Einfahrt des Stake Centers steigt {rise} ft über eine horizontale Distanz von {run} ft. Wie groß ist die Steigung? Als vereinfachtes Verhältnis rise:run oder als Bruch rise/run.",
        "q.drive_len": "Eine Einfahrt steigt {rise} ft über eine horizontale Distanz von {run} ft. Wie lang ist die Schräge? Auf Hundertstel runden. (Hinweis: √(a² + b²).)",
        "unit.ft": "ft",
    },
    "hi": {
        "q.fence_roll": "ऐमन एक बगीचे के हिस्से को बाड़ लगा रहा है जो {ft1}' {in1}\" × {ft2}' {in2}\" है। बाड़ 50-फुट या 100-फुट रोल में आती है। आपको कौन-सा रोल चाहिए?",
    },
    "tr": {
        "h.feet_in_yard": "1 yarda = 3 feet",
        "s.feet_in_yard": "3 ft = 1 yd",
        "s.cuft_cuyd": "cu ft = 3 ft × 3 ft × 3 ft",
        "unit.ft": "ft",
    },
    "vi": {
        "h.feet_in_yard": "1 yard = 3 feet",
        "s.feet_in_yard": "3 ft = 1 yd",
        "s.cuft_cuyd": "cu ft = 3 ft × 3 ft × 3 ft",
        "unit.ft": "ft",
    },
    "fr": {
        "c.mode": "Mode",
        "unit.dollars": "dollars",
    },
    "bn": {
        "s.cuft_cuyd": "cu ft = 3 ft × 3 ft × 3 ft",
    },
    "ur": {
        "s.cuft_cuyd": "cu ft = 3 ft × 3 ft × 3 ft",
    },
    "te": {
        "s.sqft_sqyd": "sq ft = 3 ft × 3 ft",
        "s.cuft_cuyd": "cu ft = 3 ft × 3 ft × 3 ft",
    },
}


def main() -> None:
    for code, overrides in PATCHES.items():
        path = LANG / f"{code}.json"
        pack = json.loads(path.read_text(encoding="utf-8"))
        strings = pack["strings"]
        for key, value in overrides.items():
            strings[key] = value
        path.write_text(
            json.dumps(pack, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"patched {code}: {len(overrides)} keys")


if __name__ == "__main__":
    main()
