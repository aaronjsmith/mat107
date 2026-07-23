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

    // (num)/(den) → fraction when both sides look math-y
    s = s.replace(
      /\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g,
      "\\frac{$1}{$2}"
    );
    // simple token / token → fraction (after subscripts are normalized)
    s = s.replace(
      /(^|[=+\-]\s*|,\s*)([A-Za-z0-9\\_{}]+)\s*\/\s*([A-Za-z0-9\\_{}]+)(?=\s*$|\s*[.,;])/g,
      "$1\\frac{$2}{$3}"
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

  function isEquationLine(line) {
    const s = line.trim();
    if (!s || s.length > 160) return false;
    if (/^overview:/i.test(s)) return false;
    if (isStepLabel(s) && !/=/.test(s)) return false;
    // Calculator instruction lines often end with "=" and are fine as equations
    if (/[=≈]/.test(s)) return true;
    // Pure formula fragments like "P(A and B)" or "a_n"
    if (/^[A-Za-z]\(/.test(s) && s.length < 40) return true;
    return false;
  }

  /** Pull inline math-ish tokens out of prose and render them. */
  function formatInlineProse(line) {
    const s = String(line);
    // Split on likely formula chunks: f(x) = mx + b, d(t) = rate·t + start, a_n = ...
    const parts = [];
    const re =
      /([A-Za-z](?:_[\{0-9A-Za-z]+|\([A-Za-z0-9]+\))?(?:\([^)]*\))?(?:\s*[=≈]\s*[^.;]+)|[A-Za-z]_\{?[^}\s=]+\}?(?:\^[\{(]?[^})\s]+[})]?)?|[A-Za-z]\([^)]*\)\s*=\s*[^=;]+)/g;
    let last = 0;
    let m;
    while ((m = re.exec(s)) !== null) {
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
      if (isEquationLine(rest) || /[=≈]/.test(rest)) {
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

  window.QuizMathFormat = {
    toHtml: formatMathHtml,
    toRichHtml: formatRichHtml,
    toTex: toTex,
    renderTex: renderTex,
  };
})();
