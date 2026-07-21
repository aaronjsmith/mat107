/**
 * Turn lightweight math notation (a_1, a_{n}, S_{n}, r^(n−1)) into HTML for CSS styling.
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

  function formatMathHtml(text) {
    if (text == null || text === "") return "";

    let s = escapeHtml(text);

    // Braced subscripts: a_{n}, S_{n}, a_{n−1}
    s = s.replace(/_\{([^}]+)\}/g, "<sub>$1</sub>");
    // Braced superscripts: r^{n-1}
    s = s.replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>");
    // Parenthesized superscripts: r^(n−1)
    s = s.replace(/\^\(([^)]+)\)/g, "<sup>$1</sup>");
    // Simple subscripts: a_1, S_n (not inside a word)
    s = s.replace(/([A-Za-z])_([0-9n]+)/g, "$1<sub>$2</sub>");
    // Simple superscripts: r^2, x^3
    s = s.replace(/([A-Za-z0-9\)])\^([0-9n]+)/g, "$1<sup>$2</sup>");

    return s;
  }

  window.QuizMathFormat = {
    toHtml: formatMathHtml,
  };
})();
