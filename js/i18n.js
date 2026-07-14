/**
 * MAT107 i18n — one JSON/JS pack per language under lang/.
 * Expects: window.QUIZ_LANGUAGES (from languages.js) and
 * window.QUIZ_LANG_PACKS[code] (from en.js and other lang/{code}.js).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "mat107-assessment1-lang";
  const RTL = { ar: true, ur: true };

  const meta = window.QUIZ_LANGUAGES;
  window.QUIZ_LANG_PACKS = window.QUIZ_LANG_PACKS || {};

  if (!meta || !meta.languages) {
    console.error("QUIZ_LANGUAGES missing. Load lang/languages.js before i18n.js.");
    window.QuizI18n = {
      t: function (k) {
        return k;
      },
      getLang: function () {
        return "en";
      },
      setLang: function () {
        return Promise.resolve();
      },
      languages: function () {
        return [{ code: "en", name: "English", native: "English" }];
      },
      onChange: function () {},
      applyStatic: function () {},
      fillSelect: function () {},
      ready: Promise.resolve(),
    };
    return;
  }

  const listeners = [];
  const defaultLang = meta.default || "en";
  let lang = defaultLang;
  let langRequestId = 0;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && meta.languages.some(function (L) {
      return L.code === saved;
    })) {
      lang = saved;
    } else if (saved) {
      // Drop removed language codes so the select matches the pack list.
      try {
        localStorage.setItem(STORAGE_KEY, defaultLang);
      } catch (e2) {
        /* ignore */
      }
    }
  } catch (e) {
    /* ignore */
  }

  function packFor(code) {
    return window.QUIZ_LANG_PACKS[code] || null;
  }

  function format(str, vars) {
    if (!vars) return str;
    return String(str).replace(/\{(\w+)\}/g, function (_, key) {
      return vars[key] != null ? String(vars[key]) : "{" + key + "}";
    });
  }

  function t(key, vars) {
    const pack = packFor(lang) || {};
    const fallback = packFor(defaultLang) || {};
    const raw = pack[key] != null ? pack[key] : fallback[key];
    if (raw == null) return key;
    return format(raw, vars);
  }

  function applyDir() {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL[lang] ? "rtl" : "ltr";
  }

  function applyStatic() {
    applyDir();
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      const attr = el.getAttribute("data-i18n-attr");
      const text = t(key);
      if (attr) el.setAttribute(attr, text);
      else el.textContent = text;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute(
        "placeholder",
        t(el.getAttribute("data-i18n-placeholder"))
      );
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    const titleKey = document.documentElement.getAttribute("data-i18n-title");
    if (titleKey) document.title = t(titleKey);
  }

  function loadPack(code) {
    if (packFor(code)) return Promise.resolve(packFor(code));
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector(
        'script[data-lang-pack="' + code + '"]'
      );
      if (existing) {
        // Already loaded successfully.
        if (packFor(code)) {
          resolve(packFor(code));
          return;
        }
        // Previous failed attempt — don't hang on a completed script's "load".
        if (existing.getAttribute("data-lang-status") === "error") {
          reject(new Error("Language pack failed: " + code));
          return;
        }
        existing.addEventListener("load", function onLoad() {
          existing.removeEventListener("load", onLoad);
          if (packFor(code)) resolve(packFor(code));
          else reject(new Error("Language pack empty: " + code));
        });
        existing.addEventListener("error", function onErr() {
          existing.removeEventListener("error", onErr);
          existing.setAttribute("data-lang-status", "error");
          reject(new Error("Failed to load lang/" + code + ".js"));
        });
        return;
      }
      const s = document.createElement("script");
      s.src = "lang/" + code + ".js";
      s.async = true;
      s.setAttribute("data-lang-pack", code);
      s.onload = function () {
        if (packFor(code)) {
          s.setAttribute("data-lang-status", "ok");
          resolve(packFor(code));
        } else {
          s.setAttribute("data-lang-status", "error");
          reject(new Error("Language pack empty: " + code));
        }
      };
      s.onerror = function () {
        s.setAttribute("data-lang-status", "error");
        reject(new Error("Failed to load lang/" + code + ".js"));
      };
      document.head.appendChild(s);
    });
  }

  function notify() {
    listeners.forEach(function (fn) {
      try {
        fn(lang);
      } catch (err) {
        console.error(err);
      }
    });
  }

  function setLang(code) {
    if (!meta.languages.some(function (L) {
      return L.code === code;
    })) {
      return Promise.resolve(lang);
    }
    const requestId = ++langRequestId;
    return loadPack(code)
      .catch(function () {
        return loadPack(defaultLang).then(function () {
          code = defaultLang;
        });
      })
      .then(function () {
        // Ignore stale responses from rapid language switching.
        if (requestId !== langRequestId) return lang;
        lang = code;
        try {
          localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
          /* ignore */
        }
        applyStatic();
        notify();
        return lang;
      });
  }

  function fillSelect(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    meta.languages.forEach(function (L) {
      const opt = document.createElement("option");
      opt.value = L.code;
      const flag = L.flag ? L.flag + " " : "";
      const label =
        flag + L.native + (L.native !== L.name ? " · " + L.name : "");
      opt.textContent = label;
      if (L.code === lang) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  const ready = loadPack(defaultLang)
    .then(function () {
      if (lang !== defaultLang) return loadPack(lang);
    })
    .then(function () {
      applyStatic();
    })
    .catch(function (err) {
      console.error(err);
      applyStatic();
    });

  window.QuizI18n = {
    t: t,
    getLang: function () {
      return lang;
    },
    setLang: setLang,
    languages: function () {
      return meta.languages.slice();
    },
    onChange: function (fn) {
      listeners.push(fn);
    },
    applyStatic: applyStatic,
    fillSelect: fillSelect,
    has: function (key) {
      const pack = packFor(lang) || {};
      const fallback = packFor(defaultLang) || {};
      return pack[key] != null || fallback[key] != null;
    },
    ready: ready,
    loadPack: loadPack,
  };
})();
