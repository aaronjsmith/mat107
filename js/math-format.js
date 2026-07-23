/**
 * Render quiz math as readable equations (KaTeX when available).
 * Converts ASCII / course notation into TeX, and formats multi-line
 * hint/setup text into styled steps.
 */
(function () {
  "use strict";

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function hasKatex() {
    return Boolean(window.katex && typeof window.katex.renderToString === "function");
  }

  /** Convert lightweight course math into TeX. */
  function toTex(raw) {
    let s = String(raw == null ? "" : raw).trim();
    if (!s) return "";

    // Normalize unicode operators / dashes
    s = s
      .replace(/[−–—]/g, "-")
      .replace(/×/g, " \\times ")
      .replace(/÷/g, " \\div ")
      .replace(/[·⋅]/g, " \\cdot ")
      .replace(/≈/g, " \\approx ")
      .replace(/≠/g, " \\neq ")
      .replace(/≤/g, " \\le ")
      .replace(/≥/g, " \\ge ")
      .replace(/π/g, "\\pi ")
      .replace(/∞/g, "\\infty ")
      .replace(/√/g, "\\sqrt ");

    // Percent stays as \%
    s = s.replace(/%/g, "\\%");

    // Braced sub/sup already TeX-like
    // a_{n-1}, r^{n-1} — keep
    // Parenthesized superscripts: r^(n-1) → r^{(n-1)}
    s = s.replace(/\^\(([^)]+)\)/g, "^{($1)}");

    // Simple a_1 / S_n (avoid turning rate_ into junk — only single letter base)
    s = s.replace(/\b([A-Za-z])_([0-9]+|[nN])\b/g, "$1_{$2}");
    s = s.replace(/\b([A-Za-z])\^([0-9]+|[nN])\b/g, "$1^{$2}");

    // (num)/(den) → display-sized fraction (dfrac stays readable inline)
    s = s.replace(
      /\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g,
      "\\dfrac{$1}{$2}"
    );
    // simple token / token → fraction (after subscripts are normalized)
    s = s.replace(
      /(^|[=+\-]\s*|,\s*)([A-Za-z0-9\\_{}]+)\s*\/\s*([A-Za-z0-9\\_{}]+)(?=\s*$|\s*[.,;])/g,
      "$1\\dfrac{$2}{$3}"
    );

    // n! for permutations display
    s = s.replace(/\b([0-9A-Za-z]+)\!/g, "$1!");

    // Collapse excess spaces around TeX commands
    s = s.replace(/ {2,}/g, " ").trim();
    return s;
  }

  function renderTex(tex, displayMode) {
    if (!tex) return "";
    if (!hasKatex()) {
      return (
        '<span class="math-fallback">' +
        escapeHtml(tex.replace(/\\times/g, "×").replace(/\\cdot/g, "·").replace(/\\div/g, "÷")) +
        "</span>"
      );
    }
    try {
      return window.katex.renderToString(tex, {
        displayMode: Boolean(displayMode),
        throwOnError: false,
        strict: "ignore",
        trust: false,
      });
    } catch (e) {
      return '<span class="math-fallback">' + escapeHtml(tex) + "</span>";
    }
  }

  function isStepLabel(line) {
    return /^(identify|write|substitute|compute|setup|step\s*\d+|given|model|formula|then|so)\b/i.test(
      line.trim()
    );
  }

  /** True when a string looks like English prose (not a pure formula). */
  function looksLikeProse(s) {
    const text = String(s);
    const mid = text.match(/\b[A-Za-z]{3,}\b/g) || [];
    const long = text.match(/\b[A-Za-z]{4,}\b/g) || [];
    // "Find slope, use the..." (≥4 short words) or "Point … intercept" (≥2 longer words)
    if (mid.length >= 4 || long.length >= 2) return true;
    // Function words + another English token → sentence, not an equation
    if (
      /\b(find|use|then|from|when|where|with|into|over|between|substitute|given|after|before|each|your|this|that|and|for|the|slope|intercept)\b/i.test(
        text
      ) &&
      mid.length >= 2
    ) {
      return true;
    }
    // Three or more space-separated tokens with letters → keep as prose
    const tokens = text.trim().split(/\s+/);
    if (tokens.length >= 5 && /[A-Za-z]{3,}/.test(text)) return true;
    return false;
  }

  function isEquationLine(line) {
    const s = line.trim();
    if (!s || s.length > 160) return false;
    if (/^overview:/i.test(s)) return false;
    if (isStepLabel(s) && !/=/.test(s)) return false;
    // Sentences with an embedded "=" (e.g. "... from x=0, then ...") must
    // stay prose — KaTeX would otherwise collapse word spaces.
    if (looksLikeProse(s)) return false;
    // Calculator instruction lines often end with "=" and are fine as equations
    if (/[=≈]/.test(s)) return true;
    // Pure formula fragments like "P(A and B)" or "a_n"
    if (/^[A-Za-z]\(/.test(s) && s.length < 40) return true;
    return false;
  }

  /**
   * RHS of an inline "var = ..." chunk: math tokens only.
   * Stops before English connectors so "x=0, then ..." keeps the prose.
   */
  const INLINE_MATH_RHS =
    "(?:\\\\[a-zA-Z]+|[A-Za-z](?:_[0-9nN]+|\\([A-Za-z0-9]+\\))?[0-9]*|[0-9]+(?:\\.[0-9]+)?|[+\\-*/^()_{}]|[·⋅×÷π≈]|\\s+(?=[0-9A-Za-z+(\\\\π]))+";

  /** Pull inline math-ish tokens out of prose and render them. */
  function formatInlineProse(line) {
    const s = String(line);
    // Split on likely formula chunks: f(x) = mx + b, d(t) = rate·t + start, a_n = ...
    const parts = [];
    const re = new RegExp(
      "([A-Za-z](?:_[\\{0-9A-Za-z]+|\\([A-Za-z0-9]+\\))?(?:\\([^)]*\\))?\\s*[=≈]\\s*" +
        INLINE_MATH_RHS +
        "|[A-Za-z]_\\{?[^}\\s=]+\\}?(?:\\^[\\{(]?[^})\\s]+[})])?" +
        "|[A-Za-z]\\([^)]*\\)\\s*[=≈]\\s*" +
        INLINE_MATH_RHS +
        ")",
      "g"
    );
    let last = 0;
    let m;
    while ((m = re.exec(s)) !== null) {
      // Reject greedy/prose matches (KaTeX would strip spaces)
      if (looksLikeProse(m[0])) {
        re.lastIndex = m.index + 1;
        continue;
      }
      if (m.index > last) {
        parts.push({ type: "text", value: s.slice(last, m.index) });
      }
      parts.push({ type: "math", value: m[0] });
      last = m.index + m[0].length;
    }
    if (last < s.length) parts.push({ type: "text", value: s.slice(last) });
    if (!parts.length) parts.push({ type: "text", value: s });

    return parts
      .map(function (p) {
        if (p.type === "text") return escapeHtml(p.value);
        const tex = toTex(p.value);
        return (
          '<span class="math-inline">' + renderTex(tex, false) + "</span>"
        );
      })
      .join("");
  }

  function formatLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return '<div class="math-gap" aria-hidden="true"></div>';

    // "Overview: ..." header
    const overview = trimmed.match(/^Overview:\s*(.*)$/i);
    if (overview) {
      return (
        '<p class="math-overview"><span class="math-overview-label">Overview</span>' +
        formatInlineProse(overview[1]) +
        "</p>"
      );
    }

    // Step labels like "Identify:" or "Substitute t = 6:"
    const step = trimmed.match(
      /^((?:Identify|Write(?: the model)?|Substitute|Compute|Given|Model|Formula|Setup|Step\s*\d+)[^:]*):\s*(.*)$/i
    );
    if (step) {
      const label = escapeHtml(step[1].trim());
      const rest = step[2].trim();
      if (!rest) {
        return '<p class="math-step-label">' + label + "</p>";
      }
      if (isEquationLine(rest)) {
        return (
          '<div class="math-step">' +
          '<p class="math-step-label">' +
          label +
          "</p>" +
          '<div class="math-block">' +
          renderTex(toTex(rest), true) +
          "</div></div>"
        );
      }
      return (
        '<div class="math-step">' +
        '<p class="math-step-label">' +
        label +
        "</p>" +
        '<p class="math-prose">' +
        formatInlineProse(rest) +
        "</p></div>"
      );
    }

    if (isEquationLine(trimmed)) {
      return (
        '<div class="math-block">' + renderTex(toTex(trimmed), true) + "</div>"
      );
    }

    return '<p class="math-prose">' + formatInlineProse(trimmed) + "</p>";
  }

  /**
   * Full rich HTML for hint / setup / calc panels.
   * Preserves blank-line gaps as visual step separators.
   */
  function formatRichHtml(text) {
    if (text == null || text === "") return "";
    const lines = String(text).replace(/\r\n/g, "\n").split("\n");
    const out = ['<div class="math-doc">'];
    for (let i = 0; i < lines.length; i++) {
      out.push(formatLine(lines[i]));
    }
    out.push("</div>");
    return out.join("");
  }

  /** Lightweight HTML (sub/sup only) — used for MC choices etc. */
  function formatMathHtml(text) {
    if (text == null || text === "") return "";
    let s = escapeHtml(text);
    s = s.replace(/_\{([^}]+)\}/g, "<sub>$1</sub>");
    s = s.replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>");
    s = s.replace(/\^\(([^)]+)\)/g, "<sup>$1</sup>");
    s = s.replace(/([A-Za-z])_([0-9n]+)/g, "$1<sub>$2</sub>");
    s = s.replace(/([A-Za-z0-9\)])\^([0-9n]+)/g, "$1<sup>$2</sup>");
    return s;
  }

  /* ── Calculator keycap hints (TI-36X Pro / Casio fx-115ES·991ES) ── */

  function spokenKeyLabel(label) {
    const map = {
      "2nd": "second",
      SHIFT: "shift",
      "S⇔D": "S to D",
      "◄►": "toggle decimal",
      "×": "times",
      "÷": "divide",
      "−": "minus",
      "+": "plus",
      "=": "equals",
      "x²": "x squared",
      "x³": "x cubed",
      "x□": "power",
      "√": "square root",
      π: "pi",
      "(": "open parenthesis",
      ")": "close parenthesis",
      ".": "decimal point",
      nPr: "n P r",
      nCr: "n C r",
    };
    return map[label] || label;
  }

  function keyKind(label, brand) {
    if (label === "2nd" || label === "SHIFT") return "shift";
    if (label === "=") return "enter";
    if (/^[0-9.]$/.test(label)) return "num";
    if (/^[×÷−+]$/.test(label)) return "op";
    if (label === "◄►" || label === "S⇔D") return brand === "ti" ? "op" : "fn";
    return "fn";
  }

  /** Expand brand-specific aliases into physical key presses. */
  function expandBrandKeys(label, brand) {
    if (brand === "ti") {
      if (label === "√") return ["2nd", "x²"];
      if (label === "x³") return ["x□", "3"];
      if (label === "^") return ["x□"];
    }
    if (brand === "casio") {
      if (label === "2nd") return ["SHIFT"];
      if (label === "x³") return ["SHIFT", "x²"];
      if (label === "^") return ["x□"];
      if (label === "◄►") return ["S⇔D"];
    }
    if (label === "^") return ["x□"];
    return [label];
  }

  /**
   * Tokenize a calculator step line into keys + plain text.
   * Numbers become per-digit keycaps; known keys match physical labels.
   */
  function tokenizeCalcLine(line, brand) {
    const s = String(line);
    const out = [];
    let i = 0;

    function pushKeys(label) {
      const labels = expandBrandKeys(label, brand);
      for (let k = 0; k < labels.length; k++) {
        out.push({
          type: "key",
          label: labels[k],
          kind: keyKind(labels[k], brand),
        });
      }
    }

    function pushText(value) {
      if (!value) return;
      const last = out[out.length - 1];
      if (last && last.type === "text") {
        last.value += value;
      } else {
        out.push({ type: "text", value: value });
      }
    }

    // Longest-first key matchers
    const matchers = [
      { re: /^(2nd)\b/i, label: "2nd" },
      { re: /^(SHIFT)\b/i, label: "SHIFT" },
      { re: /^(S⇔D|S<=>D|S↔D)/, label: "S⇔D" },
      { re: /^(◄►|<>≈)/, label: "◄►" },
      { re: /^(nPr)\b/, label: "nPr" },
      { re: /^(nCr)\b/, label: "nCr" },
      { re: /^(x\^\()/, label: "x□", after: "(" },
      { re: /^(x\^)/, label: "x□" },
      { re: /^(x²|x2\b)/, label: "x²" },
      { re: /^(x³|x3\b)/, label: "x³" },
      { re: /^(√)/, label: "√" },
      { re: /^(π)/, label: "π" },
      { re: /^(÷)/, label: "÷" },
      { re: /^(×)/, label: "×" },
      { re: /^([−–—])/, label: "−" },
      { re: /^(\+)/, label: "+" },
      { re: /^(=)/, label: "=" },
      { re: /^(\^)/, label: "^" },
      { re: /^(\()/, label: "(" },
      { re: /^(\))/, label: ")" },
      { re: /^(\.)/, label: "." },
      { re: /^([0-9])/, label: null }, // digit — label from match
    ];

    while (i < s.length) {
      if (/\s/.test(s.charAt(i))) {
        i++;
        continue;
      }

      const rest = s.slice(i);
      let matched = false;
      for (let m = 0; m < matchers.length; m++) {
        const spec = matchers[m];
        const hit = rest.match(spec.re);
        if (!hit) continue;
        const raw = hit[1] || hit[0];
        const label = spec.label == null ? raw : spec.label;
        pushKeys(label);
        if (spec.after) pushKeys(spec.after);
        i += hit[0].length;
        matched = true;
        break;
      }
      if (matched) continue;

      // ASCII hyphen as minus when it looks like an operator
      if (s.charAt(i) === "-") {
        const prev = out[out.length - 1];
        const prevIsKey = prev && prev.type === "key";
        const nextIsDigit = /[0-9]/.test(s.charAt(i + 1) || "");
        if (prevIsKey && prev.label !== "(" && nextIsDigit) {
          // e.g. × -3 → treat as minus then digits (unary)
          pushKeys("−");
          i++;
          continue;
        }
        if (!prev || prev.type === "text" || (prevIsKey && /[×÷+−(=]/.test(prev.label))) {
          pushKeys("−");
          i++;
          continue;
        }
        pushKeys("−");
        i++;
        continue;
      }

      // Plain text run until next key-like character
      let j = i + 1;
      while (j < s.length) {
        const ch = s.charAt(j);
        if (/\s/.test(ch)) break;
        const slice = s.slice(j);
        let keyNext = false;
        for (let m = 0; m < matchers.length; m++) {
          if (matchers[m].re.test(slice)) {
            keyNext = true;
            break;
          }
        }
        if (keyNext || ch === "-") break;
        j++;
      }
      pushText(s.slice(i, j));
      i = j;
    }

    return out;
  }

  function isCalcKeyLine(line) {
    const s = line.trim();
    if (!s) return false;
    if (/^(TI-36X|Casio\b)/i.test(s)) return false;
    // Tip / instruction sentences stay as prose (even if they mention π, ×, etc.)
    if (
      /^(or |do not |round |type |convert |hints?\b|you |never |enter each|start at)/i.test(
        s
      )
    ) {
      return false;
    }
    if (looksLikeProse(s)) return false;

    // Explicit key vocabulary
    if (
      /\b2nd\b|SHIFT|S⇔D|S<=>D|◄►|x²|x³|x\^|\bnPr\b|\bnCr\b|[×÷√π]/.test(s)
    ) {
      return true;
    }
    // Compact entry lines ending with = or built from ops
    if (/[=]/.test(s) && /[×÷+\-−^()]/.test(s)) {
      return true;
    }
    if (/^[0-9.()\s×÷+\-−^=x²³√π^]+$/i.test(s) && /[×÷+\-−^=]/.test(s)) {
      return true;
    }
    return false;
  }

  function renderKeycap(token, brand) {
    const label = token.label;
    const kind = token.kind || keyKind(label, brand);
    const spoken = spokenKeyLabel(label);
    return (
      '<kbd class="calc-keycap calc-keycap--' +
      escapeHtml(brand) +
      " calc-keycap--" +
      escapeHtml(kind) +
      '" title="' +
      escapeHtml(spoken) +
      '" aria-label="' +
      escapeHtml(spoken) +
      '"><span class="calc-keycap-label" aria-hidden="true">' +
      escapeHtml(label) +
      "</span></kbd>"
    );
  }

  function renderCalcSequence(line, brand) {
    const tokens = tokenizeCalcLine(line, brand);
    if (!tokens.length) {
      return '<p class="math-prose">' + formatInlineProse(line) + "</p>";
    }

    const spokenParts = [];
    const htmlParts = [];
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.type === "key") {
        spokenParts.push(spokenKeyLabel(tok.label));
        htmlParts.push(renderKeycap(tok, brand));
      } else {
        const t = String(tok.value).trim();
        if (!t) continue;
        spokenParts.push(t);
        htmlParts.push(
          '<span class="calc-seq-text">' + escapeHtml(tok.value) + "</span>"
        );
      }
    }

    const brandName = brand === "casio" ? "Casio" : "TI-36X Pro";
    return (
      '<div class="calc-seq" role="group" aria-label="' +
      escapeHtml(brandName + " keys: " + spokenParts.join(", ")) +
      '">' +
      htmlParts.join("") +
      "</div>"
    );
  }

  /**
   * Rich HTML for calculator hint panels with stylized keycaps.
   * brand: "ti" | "casio"
   */
  function formatCalcHtml(text, brand) {
    if (text == null || text === "") return "";
    const b = brand === "casio" ? "casio" : "ti";
    const lines = String(text).replace(/\r\n/g, "\n").split("\n");
    const out = ['<div class="math-doc calc-doc calc-doc--' + b + '">'];

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (!trimmed) {
        out.push('<div class="math-gap" aria-hidden="true"></div>');
        continue;
      }

      // Brand header line
      if (/^(TI-36X Pro|Casio)\b/i.test(trimmed)) {
        out.push(
          '<p class="calc-brand-header">' + escapeHtml(trimmed) + "</p>"
        );
        continue;
      }

      if (isCalcKeyLine(trimmed)) {
        out.push(renderCalcSequence(trimmed, b));
        continue;
      }

      out.push(formatLine(raw));
    }

    out.push("</div>");
    return out.join("");
  }

  window.QuizMathFormat = {
    toHtml: formatMathHtml,
    toRichHtml: formatRichHtml,
    formatCalcHtml: formatCalcHtml,
    tokenizeCalcLine: tokenizeCalcLine,
    toTex: toTex,
    renderTex: renderTex,
  };
})();