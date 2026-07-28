/* MAT107 cross-site progress transfer → mat107.ensign.quest */
(function () {
  "use strict";

  var CANONICAL_HOST = "mat107.ensign.quest";
  var CANONICAL_ORIGIN = "https://" + CANONICAL_HOST;
  var BADGE_URL = "https://ensign.quest";
  var FORMAT = "mat107-site-transfer";
  var MSG_READY = "mat107-transfer-ready";
  var MSG_PAYLOAD = "mat107-transfer-payload";
  var MSG_DONE = "mat107-transfer-done";
  var MSG_ERROR = "mat107-transfer-error";
  var DISMISS_KEY = "mat107-transfer-modal-dismissed";

  function t(key, vars) {
    var I18n = window.QuizI18n;
    return I18n && I18n.t ? I18n.t(key, vars || {}) : key;
  }

  function applyI18n() {
    if (window.QuizI18n && window.QuizI18n.applyStatic) {
      window.QuizI18n.applyStatic();
    }
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

  function progressSummary(storage) {
    var C = window.Mat107Course;
    var quizzes = 0;
    var keys = 0;
    var id;
    var key;
    storage = storage || collectStorage();
    keys = Object.keys(storage).length;
    if (C && Array.isArray(C.ASSESSMENTS)) {
      C.ASSESSMENTS.forEach(function (a) {
        if (!a || !a.id) return;
        key = C.progressStorageKey
          ? C.progressStorageKey(a.id)
          : "mat107-" + a.id + "-progress";
        if (storage[key]) quizzes += 1;
      });
    } else {
      for (id in storage) {
        if (Object.prototype.hasOwnProperty.call(storage, id) && /-progress$/.test(id)) {
          quizzes += 1;
        }
      }
    }
    return { quizzes: quizzes, keys: keys };
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
    var applied = 0;
    Object.keys(storage).forEach(function (key) {
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

  function wasDismissed() {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function markDismissed() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch (e) {
      /* ignore */
    }
  }

  function mountSiteBadge() {
    if (document.getElementById("site-canonical-badge")) return;

    var bar = document.getElementById("site-canonical-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "site-canonical-bar";
      bar.className = "site-canonical-bar";
      var anchor = document.body.firstChild;
      document.body.insertBefore(bar, anchor);
    }

    var onCanonical = isCanonicalHost();
    var labelKey = onCanonical ? "transfer.badge_home_label" : "transfer.badge_label";
    var ariaKey = onCanonical ? "transfer.badge_home_aria" : "transfer.badge_aria";

    var badge = document.createElement("a");
    badge.id = "site-canonical-badge";
    badge.className = "site-canonical-badge";
    badge.href = BADGE_URL;
    badge.target = "_blank";
    badge.rel = "noopener noreferrer";
    badge.setAttribute("data-i18n-aria", ariaKey);
    badge.setAttribute("aria-label", t(ariaKey));
    badge.innerHTML =
      '<span class="site-canonical-badge-label" data-i18n="' +
      labelKey +
      '"></span>' +
      '<span class="site-canonical-badge-host">ensign.quest</span>';

    bar.appendChild(badge);
    applyI18n();
    var labelEl = badge.querySelector(".site-canonical-badge-label");
    if (labelEl && !labelEl.textContent) {
      labelEl.textContent = t(labelKey);
    }
  }

  function mountTransferModal() {
    if (document.getElementById("site-transfer-modal")) {
      return document.getElementById("site-transfer-modal");
    }

    var summary = progressSummary();
    var modal = document.createElement("div");
    modal.id = "site-transfer-modal";
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "site-transfer-title");
    modal.hidden = true;
    modal.innerHTML =
      '<div class="modal-backdrop" id="site-transfer-backdrop" tabindex="-1"></div>' +
      '<div class="modal-card site-transfer-card">' +
      '<header class="modal-head">' +
      '<h2 id="site-transfer-title" data-i18n="transfer.title"></h2>' +
      '<button type="button" class="modal-close" id="site-transfer-close" data-i18n-aria="transfer.close_aria" aria-label="Close">×</button>' +
      "</header>" +
      '<p class="modal-body" id="site-transfer-body" data-i18n-html="transfer.body"></p>' +
      '<p class="site-transfer-summary muted" id="site-transfer-summary"></p>' +
      '<p class="site-transfer-status muted" id="site-transfer-status" hidden></p>' +
      '<div class="modal-actions">' +
      '<button type="button" class="ghost" id="site-transfer-later" data-i18n="transfer.later"></button>' +
      '<button type="button" class="primary" id="btn-site-transfer" data-i18n="transfer.btn"></button>' +
      "</div>" +
      "</div>";

    document.body.appendChild(modal);
    applyI18n();

    var summaryEl = document.getElementById("site-transfer-summary");
    if (summaryEl) {
      summaryEl.textContent = t("transfer.summary", {
        quizzes: summary.quizzes,
        keys: summary.keys,
      });
    }

    return modal;
  }

  function openTransferModal() {
    var modal = mountTransferModal();
    if (!modal) return;
    modal.hidden = false;
    var focusBtn =
      document.getElementById("btn-site-transfer") ||
      document.getElementById("site-transfer-later");
    if (focusBtn) {
      try {
        focusBtn.focus();
      } catch (e) {
        /* ignore */
      }
    }
  }

  function closeTransferModal(persistDismiss) {
    var modal = document.getElementById("site-transfer-modal");
    if (modal) modal.hidden = true;
    if (persistDismiss) markDismissed();
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
      if (ok) markDismissed();
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

  function mountImportModal() {
    if (document.getElementById("site-transfer-import-modal")) {
      return document.getElementById("site-transfer-import-modal");
    }

    var modal = document.createElement("div");
    modal.id = "site-transfer-import-modal";
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "site-transfer-import-title");
    modal.hidden = true;
    modal.innerHTML =
      '<div class="modal-backdrop" id="site-transfer-import-backdrop" tabindex="-1"></div>' +
      '<div class="modal-card site-transfer-card">' +
      '<header class="modal-head">' +
      '<h2 id="site-transfer-import-title" data-i18n="transfer.import_title"></h2>' +
      '<button type="button" class="modal-close" id="site-transfer-import-close" data-i18n-aria="transfer.close_aria" aria-label="Close">×</button>' +
      "</header>" +
      '<p class="modal-body" data-i18n="transfer.import_body"></p>' +
      '<p class="site-transfer-status muted" id="site-transfer-import-status" hidden></p>' +
      '<div class="modal-actions">' +
      '<button type="button" class="ghost" id="site-transfer-import-later" data-i18n="transfer.later"></button>' +
      '<button type="button" class="primary" id="btn-site-transfer-import" data-i18n="transfer.import_btn"></button>' +
      '<input id="site-transfer-file" type="file" accept="application/json,.json" hidden />' +
      "</div>" +
      "</div>";

    document.body.appendChild(modal);
    applyI18n();

    var btn = document.getElementById("btn-site-transfer-import");
    var fileInput = document.getElementById("site-transfer-file");
    var statusEl = document.getElementById("site-transfer-import-status");
    var later = document.getElementById("site-transfer-import-later");
    var closeBtn = document.getElementById("site-transfer-import-close");
    var backdrop = document.getElementById("site-transfer-import-backdrop");

    function hide() {
      modal.hidden = true;
      cleanTransferParams();
    }

    if (later) later.addEventListener("click", hide);
    if (closeBtn) closeBtn.addEventListener("click", hide);
    if (backdrop) backdrop.addEventListener("click", hide);

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

    return modal;
  }

  function showReceived(count) {
    var note = document.createElement("aside");
    note.className = "site-transfer-toast";
    note.setAttribute("role", "status");
    note.textContent = t("transfer.received", { count: count });
    document.body.appendChild(note);
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
    mountSiteBadge();

    var params;
    try {
      params = new URLSearchParams(location.search);
    } catch (e) {
      params = {
        get: function () {
          return null;
        },
      };
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
          ev.source.postMessage({ type: MSG_DONE, count: count }, ev.origin);
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
        if (expecting) {
          var importModal = mountImportModal();
          importModal.hidden = false;
        }
      }
    }

    window.addEventListener("message", onMessage);

    if (expecting) {
      notifyOpener(MSG_READY);
      setTimeout(
        function () {
          try {
            var still =
              new URLSearchParams(location.search).get("transfer") === "1";
            if (!still) return;
            var importModal = mountImportModal();
            importModal.hidden = false;
          } catch (e) {
            var fallback = mountImportModal();
            fallback.hidden = false;
          }
        },
        manual ? 0 : 2500
      );
    }
  }

  function wireSenderModal(modal) {
    var btn = document.getElementById("btn-site-transfer");
    var statusEl = document.getElementById("site-transfer-status");
    var later = document.getElementById("site-transfer-later");
    var closeBtn = document.getElementById("site-transfer-close");
    var backdrop = document.getElementById("site-transfer-backdrop");

    if (btn) {
      btn.addEventListener("click", function () {
        startTransfer(statusEl, btn);
      });
    }
    if (later) {
      later.addEventListener("click", function () {
        closeTransferModal(true);
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeTransferModal(true);
      });
    }
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        closeTransferModal(true);
      });
    }
  }

  function initSender() {
    mountSiteBadge();
    var modal = mountTransferModal();
    wireSenderModal(modal);
    if (!wasDismissed()) {
      openTransferModal();
    }
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
