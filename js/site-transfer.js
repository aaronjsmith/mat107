/* MAT107 cross-site progress transfer → mat107.ensign.quest */
(function () {
  "use strict";

  var CANONICAL_HOST = "mat107.ensign.quest";
  var CANONICAL_ORIGIN = "https://" + CANONICAL_HOST;
  var FORMAT = "mat107-site-transfer";
  var MSG_READY = "mat107-transfer-ready";
  var MSG_PAYLOAD = "mat107-transfer-payload";
  var MSG_DONE = "mat107-transfer-done";
  var MSG_ERROR = "mat107-transfer-error";

  function t(key, vars) {
    var I18n = window.QuizI18n;
    return I18n && I18n.t ? I18n.t(key, vars || {}) : key;
  }

  function isCanonicalHost() {
    return location.hostname === CANONICAL_HOST;
  }

  function isTransferKey(key) {
    return typeof key === "string" && key.indexOf("mat107-") === 0;
  }

  function collectStorage() {
    var storage = {};
    var i;
    var key;
    for (i = 0; i < localStorage.length; i++) {
      key = localStorage.key(i);
      if (isTransferKey(key)) {
        storage[key] = localStorage.getItem(key);
      }
    }
    return storage;
  }

  function storageKeyCount(storage) {
    return storage ? Object.keys(storage).length : 0;
  }

  function buildPayload() {
    return {
      format: FORMAT,
      version: 1,
      exported_at: new Date().toISOString(),
      source: location.origin,
      storage: collectStorage(),
    };
  }

  function applyPayload(payload) {
    if (!payload || typeof payload !== "object" || payload.format !== FORMAT) {
      throw new Error("Invalid transfer payload");
    }
    var storage = payload.storage;
    if (!storage || typeof storage !== "object") {
      throw new Error("Invalid transfer storage");
    }
    var keys = Object.keys(storage);
    var applied = 0;
    keys.forEach(function (key) {
      if (!isTransferKey(key)) return;
      var value = storage[key];
      if (value == null) return;
      localStorage.setItem(key, String(value));
      applied += 1;
    });
    return applied;
  }

  function downloadTransferFile(payload) {
    var blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    var stamp = new Date().toISOString().slice(0, 10);
    var name = "mat107-all-progress-" + stamp + ".json";
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    return name;
  }

  function cleanTransferParams() {
    try {
      var url = new URL(location.href);
      if (!url.searchParams.has("transfer") && !url.searchParams.has("manual")) {
        return;
      }
      url.searchParams.delete("transfer");
      url.searchParams.delete("manual");
      var next = url.pathname + (url.search || "") + (url.hash || "");
      history.replaceState(null, "", next || url.pathname);
    } catch (e) {
      /* ignore */
    }
  }

  function setStatus(el, message, kind) {
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
    el.classList.remove("is-ok", "is-err", "is-busy");
    if (kind) el.classList.add(kind);
  }

  function mountBanner() {
    if (document.getElementById("site-transfer-banner")) return null;

    var banner = document.createElement("aside");
    banner.id = "site-transfer-banner";
    banner.className = "site-transfer-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", t("transfer.aria"));
    banner.innerHTML =
      '<div class="site-transfer-inner">' +
      '<div class="site-transfer-copy">' +
      '<p class="site-transfer-title" data-i18n="transfer.title"></p>' +
      '<p class="site-transfer-body" data-i18n-html="transfer.body"></p>' +
      "</div>" +
      '<div class="site-transfer-actions">' +
      '<button type="button" class="primary" id="btn-site-transfer" data-i18n="transfer.btn"></button>' +
      '<p class="site-transfer-status muted" id="site-transfer-status" hidden></p>' +
      "</div>" +
      "</div>";

    var anchor = document.querySelector("header.top");
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(banner, anchor.nextSibling);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }

    if (window.QuizI18n && window.QuizI18n.applyStatic) {
      window.QuizI18n.applyStatic();
    } else {
      banner.querySelector(".site-transfer-title").textContent = t("transfer.title");
      banner.querySelector(".site-transfer-body").innerHTML = t("transfer.body");
      banner.querySelector("#btn-site-transfer").textContent = t("transfer.btn");
    }

    return banner;
  }

  function startTransfer(statusEl, btn) {
    var payload = buildPayload();
    var count = storageKeyCount(payload.storage);
    if (!count) {
      setStatus(statusEl, t("transfer.empty"), "is-err");
      return;
    }

    setStatus(statusEl, t("transfer.working"), "is-busy");
    if (btn) btn.disabled = true;

    var transferUrl = CANONICAL_ORIGIN + "/?transfer=1";
    var child = null;
    try {
      // about:blank first so we can stash the payload in window.name before navigation.
      child = window.open("about:blank", "mat107-site-transfer");
    } catch (e) {
      child = null;
    }

    if (!child) {
      try {
        downloadTransferFile(payload);
      } catch (err) {
        setStatus(statusEl, t("transfer.failed"), "is-err");
        if (btn) btn.disabled = false;
        return;
      }
      setStatus(statusEl, t("transfer.popup_blocked"), "is-err");
      if (btn) btn.disabled = false;
      return;
    }

    try {
      child.name = JSON.stringify(payload);
    } catch (e) {
      /* window.name may be too large; postMessage still used */
    }
    try {
      child.location = transferUrl;
    } catch (e) {
      try {
        child.close();
      } catch (e2) {
        /* ignore */
      }
      try {
        downloadTransferFile(payload);
      } catch (err) {
        setStatus(statusEl, t("transfer.failed"), "is-err");
        if (btn) btn.disabled = false;
        return;
      }
      setStatus(statusEl, t("transfer.failed"), "is-err");
      if (btn) btn.disabled = false;
      return;
    }

    var settled = false;
    var timeoutId = null;

    function finish(ok, message, kind) {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      if (timeoutId) clearTimeout(timeoutId);
      setStatus(statusEl, message, kind);
      if (btn) btn.disabled = false;
    }

    function onMessage(ev) {
      if (ev.origin !== CANONICAL_ORIGIN) return;
      var data = ev.data;
      if (!data || typeof data !== "object") return;

      if (data.type === MSG_READY) {
        try {
          child.postMessage(
            { type: MSG_PAYLOAD, payload: payload },
            CANONICAL_ORIGIN
          );
        } catch (err) {
          finish(false, t("transfer.failed"), "is-err");
        }
        return;
      }

      if (data.type === MSG_DONE) {
        finish(
          true,
          t("transfer.done", { count: data.count != null ? data.count : count }),
          "is-ok"
        );
        return;
      }

      if (data.type === MSG_ERROR) {
        finish(false, t("transfer.failed"), "is-err");
      }
    }

    window.addEventListener("message", onMessage);

    timeoutId = setTimeout(function () {
      if (settled) return;
      try {
        downloadTransferFile(payload);
      } catch (e) {
        /* ignore */
      }
      finish(false, t("transfer.timeout"), "is-err");
    }, 12000);
  }

  function mountImportPanel() {
    if (document.getElementById("site-transfer-import")) return null;

    var panel = document.createElement("aside");
    panel.id = "site-transfer-import";
    panel.className = "site-transfer-banner site-transfer-import";
    panel.setAttribute("role", "region");
    panel.innerHTML =
      '<div class="site-transfer-inner">' +
      '<div class="site-transfer-copy">' +
      '<p class="site-transfer-title" data-i18n="transfer.import_title"></p>' +
      '<p class="site-transfer-body" data-i18n="transfer.import_body"></p>' +
      "</div>" +
      '<div class="site-transfer-actions">' +
      '<button type="button" class="primary" id="btn-site-transfer-import" data-i18n="transfer.import_btn"></button>' +
      '<input id="site-transfer-file" type="file" accept="application/json,.json" hidden />' +
      '<p class="site-transfer-status muted" id="site-transfer-import-status" hidden></p>' +
      "</div>" +
      "</div>";

    var anchor = document.querySelector("header.top");
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(panel, anchor.nextSibling);
    } else {
      document.body.insertBefore(panel, document.body.firstChild);
    }

    if (window.QuizI18n && window.QuizI18n.applyStatic) {
      window.QuizI18n.applyStatic();
    }

    var btn = document.getElementById("btn-site-transfer-import");
    var fileInput = document.getElementById("site-transfer-file");
    var statusEl = document.getElementById("site-transfer-import-status");

    if (btn && fileInput) {
      btn.addEventListener("click", function () {
        fileInput.value = "";
        fileInput.click();
      });
      fileInput.addEventListener("change", function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var payload = JSON.parse(String(reader.result || ""));
            var count = applyPayload(payload);
            setStatus(
              statusEl,
              t("transfer.received", { count: count }),
              "is-ok"
            );
            cleanTransferParams();
            setTimeout(function () {
              location.reload();
            }, 900);
          } catch (err) {
            setStatus(statusEl, t("transfer.failed"), "is-err");
          }
        };
        reader.onerror = function () {
          setStatus(statusEl, t("transfer.failed"), "is-err");
        };
        reader.readAsText(file);
      });
    }

    return panel;
  }

  function showReceived(count) {
    var note = document.createElement("aside");
    note.className = "site-transfer-banner is-success";
    note.setAttribute("role", "status");
    note.innerHTML =
      '<div class="site-transfer-inner">' +
      '<p class="site-transfer-title">' +
      t("transfer.received", { count: count }) +
      "</p>" +
      "</div>";
    var anchor = document.querySelector("header.top");
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(note, anchor.nextSibling);
    } else {
      document.body.insertBefore(note, document.body.firstChild);
    }
  }

  function notifyOpener(type, extra) {
    if (!window.opener || window.opener.closed) return;
    var msg = { type: type };
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        msg[k] = extra[k];
      });
    }
    try {
      window.opener.postMessage(msg, "*");
    } catch (e) {
      /* ignore */
    }
  }

  function tryApplyFromWindowName() {
    try {
      if (!window.name) return null;
      var parsed = JSON.parse(window.name);
      if (!parsed || parsed.format !== FORMAT) return null;
      var count = applyPayload(parsed);
      window.name = "";
      return count;
    } catch (e) {
      return null;
    }
  }

  function initReceiver() {
    var params;
    try {
      params = new URLSearchParams(location.search);
    } catch (e) {
      params = { get: function () { return null; } };
    }
    var expecting = params.get("transfer") === "1";
    var manual = params.get("manual") === "1";

    var fromName = tryApplyFromWindowName();
    if (fromName != null) {
      notifyOpener(MSG_DONE, { count: fromName });
      cleanTransferParams();
      showReceived(fromName);
      setTimeout(function () {
        location.reload();
      }, 900);
      return;
    }

    function onMessage(ev) {
      var data = ev.data;
      if (!data || typeof data !== "object" || data.type !== MSG_PAYLOAD) return;
      try {
        var count = applyPayload(data.payload);
        try {
          ev.source.postMessage(
            { type: MSG_DONE, count: count },
            ev.origin
          );
        } catch (err) {
          notifyOpener(MSG_DONE, { count: count });
        }
        window.removeEventListener("message", onMessage);
        cleanTransferParams();
        showReceived(count);
        setTimeout(function () {
          location.reload();
        }, 900);
      } catch (err) {
        try {
          ev.source.postMessage({ type: MSG_ERROR }, ev.origin);
        } catch (e2) {
          notifyOpener(MSG_ERROR);
        }
        if (expecting) mountImportPanel();
      }
    }

    window.addEventListener("message", onMessage);

    if (expecting) {
      notifyOpener(MSG_READY);
      // If opener never responds (or user opened the link directly), offer file import.
      setTimeout(function () {
        if (document.getElementById("site-transfer-import")) return;
        // Only show import if we still have transfer params (not already applied).
        try {
          var still = new URLSearchParams(location.search).get("transfer") === "1";
          if (still) mountImportPanel();
        } catch (e) {
          mountImportPanel();
        }
      }, manual ? 0 : 2500);
    }
  }

  function initSender() {
    var banner = mountBanner();
    if (!banner) return;
    var btn = document.getElementById("btn-site-transfer");
    var statusEl = document.getElementById("site-transfer-status");
    if (!btn) return;
    btn.addEventListener("click", function () {
      startTransfer(statusEl, btn);
    });
  }

  function boot() {
    if (isCanonicalHost()) {
      initReceiver();
    } else {
      initSender();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.Mat107SiteTransfer = {
    CANONICAL_HOST: CANONICAL_HOST,
    CANONICAL_ORIGIN: CANONICAL_ORIGIN,
    collectStorage: collectStorage,
    buildPayload: buildPayload,
    applyPayload: applyPayload,
  };
})();
