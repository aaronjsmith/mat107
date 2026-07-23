/**
 * Fills #footer-updated with commit hash + commit time.
 * Prefers GitHub API (latest main); falls back to js/build-info.js.
 */
(function () {
  "use strict";

  var REPO = "aaronjsmith/mat107";
  var BRANCH = "main";
  var API =
    "https://api.github.com/repos/" + REPO + "/commits/" + encodeURIComponent(BRANCH);

  function t(key, vars) {
    if (window.QuizI18n && window.QuizI18n.t) {
      return window.QuizI18n.t(key, vars || {});
    }
    var fallback = {
      footer_updated: "Last updated {hash} · {when}",
    };
    var str = fallback[key] || key;
    return String(str).replace(/\{(\w+)\}/g, function (_, k) {
      return vars && vars[k] != null ? String(vars[k]) : "{" + k + "}";
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatWhen(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso || "");
    try {
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch (e) {
      return d.toISOString();
    }
  }

  function fill(el, sha, iso, htmlUrl) {
    var short = String(sha || "").slice(0, 7);
    var when = formatWhen(iso);
    var hashHtml = short
      ? htmlUrl
        ? '<a href="' +
          escapeHtml(htmlUrl) +
          '" target="_blank" rel="noopener noreferrer"><code>' +
          escapeHtml(short) +
          "</code></a>"
        : "<code>" + escapeHtml(short) + "</code>"
      : "";
    el.setAttribute("datetime", iso || "");
    el.innerHTML = t("footer_updated", {
      hash: hashHtml,
      when: escapeHtml(when),
    });
  }

  function applyKnown() {
    var el = document.getElementById("footer-updated");
    if (!el) return;
    var info = window.MAT107_BUILD;
    if (info && info.sha) {
      fill(
        el,
        info.sha,
        info.date || "",
        info.url ||
          "https://github.com/" + REPO + "/commit/" + encodeURIComponent(info.sha)
      );
    }
  }

  function loadFromGithub() {
    var el = document.getElementById("footer-updated");
    if (!el) return;
    fetch(API, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("github " + res.status);
        return res.json();
      })
      .then(function (data) {
        var sha = data.sha || "";
        var iso =
          (data.commit &&
            data.commit.committer &&
            data.commit.committer.date) ||
          (data.commit && data.commit.author && data.commit.author.date) ||
          "";
        var url = data.html_url || "";
        window.MAT107_BUILD = { sha: sha, date: iso, url: url };
        fill(el, sha, iso, url);
      })
      .catch(function () {
        applyKnown();
      });
  }

  function start() {
    applyKnown();
    loadFromGithub();
    if (window.QuizI18n && typeof window.QuizI18n.onChange === "function") {
      window.QuizI18n.onChange(function () {
        var info = window.MAT107_BUILD;
        var el = document.getElementById("footer-updated");
        if (el && info && info.sha) {
          fill(el, info.sha, info.date || "", info.url || "");
        }
      });
    }
  }

  if (window.QuizI18n && window.QuizI18n.ready && typeof window.QuizI18n.ready.then === "function") {
    window.QuizI18n.ready.then(start);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
