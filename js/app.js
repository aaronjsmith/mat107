/* MAT107 quiz UI — client-only static site */
(function () {
  const Q = window.QuizQuestions;
  const P = window.QuizProgress;
  const I18n = window.QuizI18n;

  function t(key, vars) {
    return I18n && I18n.t ? I18n.t(key, vars) : key;
  }

  if (!Q || !P) {
    document.getElementById("q-prompt").textContent = t("load_fail");
    return;
  }

  const state = {
    mode: "all",
    fullQuestion: null,
    publicQ: null,
    answered: false,
    retryPhase: false,
    lastExpected: "",
    hintsUsed: 0,
    lastTopic: null,
    clarifyShown: false,
    clarifyAiShown: false,
  };

  const els = {
    topicList: document.getElementById("topic-list"),
    prompt: document.getElementById("q-prompt"),
    topic: document.getElementById("q-topic"),
    hint1: document.getElementById("q-hint1"),
    hint2: document.getElementById("q-hint2"),
    hint3ti: document.getElementById("q-hint3-ti"),
    hint3casio: document.getElementById("q-hint3-casio"),
    hint1Btn: document.getElementById("btn-hint1"),
    hint2Btn: document.getElementById("btn-hint2"),
    hint3tiBtn: document.getElementById("btn-hint3-ti"),
    hint3casioBtn: document.getElementById("btn-hint3-casio"),
    figure: document.getElementById("q-figure"),
    choices: document.getElementById("q-choices"),
    form: document.getElementById("q-form"),
    input: document.getElementById("q-input"),
    unit: document.getElementById("q-unit"),
    mathInsert: document.getElementById("math-insert"),
    check: document.getElementById("btn-check"),
    feedback: document.getElementById("feedback"),
    next: document.getElementById("btn-next"),
    skip: document.getElementById("btn-skip"),
    reset: document.getElementById("btn-reset"),
    save: document.getElementById("btn-save"),
    load: document.getElementById("btn-load"),
    progressFile: document.getElementById("progress-file"),
    accuracy: document.getElementById("stat-accuracy"),
    streak: document.getElementById("stat-streak"),
    total: document.getElementById("stat-total"),
    mastery: null,
    masteryPie: document.getElementById("mastery-pie"),
    clarifyBtn: document.getElementById("btn-clarify"),
    clarifyPanel: document.getElementById("q-clarify"),
    calcOpen: document.getElementById("btn-calc-open"),
    calcModal: document.getElementById("calc-modal"),
    calcClose: document.getElementById("btn-calc-close"),
    calcDisplay: document.getElementById("calc-display"),
    calcKeys: document.getElementById("calc-keys"),
    notes: document.getElementById("notes-area"),
    lang: document.getElementById("lang-select"),
  };

  const PIE_COLORS = [
    "#0f6e56",
    "#1d4ed8",
    "#b45309",
    "#7c3aed",
    "#0e7490",
    "#be123c",
    "#4d7c0f",
    "#c2410c",
    "#0369a1",
    "#a21caf",
    "#15803d",
    "#9333ea",
  ];

  function polar(cx, cy, r, deg) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function sectorPath(cx, cy, rInner, rOuter, a0, a1) {
    if (a1 - a0 < 0.01) return "";
    const large = a1 - a0 > 180 ? 1 : 0;
    const [x0, y0] = polar(cx, cy, rOuter, a0);
    const [x1, y1] = polar(cx, cy, rOuter, a1);
    if (rInner <= 0.5) {
      return (
        "M" +
        cx +
        "," +
        cy +
        " L" +
        x0.toFixed(2) +
        "," +
        y0.toFixed(2) +
        " A" +
        rOuter +
        "," +
        rOuter +
        " 0 " +
        large +
        " 1 " +
        x1.toFixed(2) +
        "," +
        y1.toFixed(2) +
        " Z"
      );
    }
    const [xi0, yi0] = polar(cx, cy, rInner, a0);
    const [xi1, yi1] = polar(cx, cy, rInner, a1);
    return (
      "M" +
      x0.toFixed(2) +
      "," +
      y0.toFixed(2) +
      " A" +
      rOuter +
      "," +
      rOuter +
      " 0 " +
      large +
      " 1 " +
      x1.toFixed(2) +
      "," +
      y1.toFixed(2) +
      " L" +
      xi1.toFixed(2) +
      "," +
      yi1.toFixed(2) +
      " A" +
      rInner +
      "," +
      rInner +
      " 0 " +
      large +
      " 0 " +
      xi0.toFixed(2) +
      "," +
      yi0.toFixed(2) +
      " Z"
    );
  }

  function renderMasteryPie(p) {
    if (!els.masteryPie) return;
    const entries = Object.entries(p.topics);
    const n = entries.length || 1;
    const size = 220;
    const cx = size / 2;
    const cy = size / 2;
    const rOuter = 96;
    const rHole = 46;
    const gap = n > 1 ? 1.2 : 0;
    const sweep = 360 / n;
    const overall = p.overall_mastery != null ? p.overall_mastery : 0;

    let slices = "";
    let rows = "";
    entries.forEach(([key, info], i) => {
      const color = PIE_COLORS[i % PIE_COLORS.length];
      const a0 = i * sweep + gap / 2;
      const a1 = (i + 1) * sweep - gap / 2;
      const frac = Math.max(0, Math.min(1, (info.mastery || 0) / 100));
      const pct = Math.round(info.mastery || 0);
      const barCls = info.mastered ? "full" : pct >= 50 ? "mid" : "low";

      slices +=
        '<path d="' +
        sectorPath(cx, cy, rHole, rOuter, a0, a1) +
        '" fill="' +
        color +
        '" fill-opacity="0.18" stroke="#fff" stroke-width="1"/>';
      if (frac > 0.02) {
        const rFilled = rHole + (rOuter - rHole) * frac;
        slices +=
          '<path d="' +
          sectorPath(cx, cy, rHole, rFilled, a0, a1) +
          '" fill="' +
          color +
          '" stroke="#fff" stroke-width="0.75">' +
          "<title>" +
          info.label +
          ": " +
          info.unaided_correct +
          "/" +
          info.unaided_needed +
          "</title></path>";
      }

      rows +=
        '<li class="mastery-topic' +
        (info.mastered ? " mastered" : "") +
        '" data-topic="' +
        key +
        '" title="' +
        info.label +
        '">' +
        '<div class="mastery-topic-head">' +
        '<i style="background:' +
        color +
        '"></i>' +
        "<span>" +
        (info.mastered ? "✓ " : "") +
        info.label +
        "</span>" +
        "<em>" +
        info.unaided_correct +
        "/" +
        info.unaided_needed +
        " · " +
        pct +
        "%</em>" +
        "</div>" +
        '<div class="bar ' +
        barCls +
        '"><i style="width:' +
        pct +
        "%;background:" +
        color +
        '"></i></div>' +
        "</li>";
    });

    els.masteryPie.innerHTML =
      '<div class="pie-chart-wrap">' +
      '<svg class="mastery-pie-svg" viewBox="0 0 ' +
      size +
      " " +
      size +
      '" role="img" aria-label="' +
      t("mastery_overall_aria", { pct: overall }) +
      '">' +
      slices +
      '<circle cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="' +
      (rHole - 2) +
      '" fill="#fffcf6"/>' +
      '<text x="' +
      cx +
      '" y="' +
      (cy - 6) +
      '" text-anchor="middle" class="pie-pct">' +
      overall +
      "%</text>" +
      '<text x="' +
      cx +
      '" y="' +
      (cy + 14) +
      '" text-anchor="middle" class="pie-sub">' +
      t("mastery_overall") +
      "</text>" +
      "</svg>" +
      '<p class="pie-summary">' +
      t("mastery_pie_summary", {
        mastered: p.mastered_topics,
        total: p.topic_count,
      }) +
      "</p>" +
      "</div>" +
      '<ul class="mastery-topic-list">' +
      rows +
      "</ul>";

    els.masteryPie.querySelectorAll(".mastery-topic").forEach((item) => {
      item.addEventListener("click", () => {
        const key = item.getAttribute("data-topic");
        if (!key) return;
        state.mode = key;
        setModeButtons();
        loadQuestion();
      });
    });
  }

  function setModeButtons() {
    document.querySelectorAll(".topic[data-topic]").forEach((btn) => {
      const topic = btn.dataset.topic;
      const active =
        (state.mode === "all" && topic === "all") ||
        (state.mode === "smart" && topic === "smart") ||
        (state.mode === "flashcards" && topic === "flashcards") ||
        state.mode === topic;
      btn.classList.toggle("active", active);
    });
  }

  function refreshProgress() {
    const p = P.getProgressView();
    els.accuracy.textContent = p.total_attempted ? `${p.accuracy}%` : "—";
    els.streak.textContent = p.streak;
    els.total.textContent = p.total_attempted;

    const existing = els.topicList.querySelectorAll(".topic[data-key]");
    if (existing.length === 0) {
      Object.entries(p.topics).forEach(([key, info]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "topic";
        btn.dataset.topic = key;
        btn.dataset.key = key;
        const mark = info.mastered ? "✓ " : "";
        btn.innerHTML = `${mark}${info.label}<span class="m">${info.unaided_correct}/${info.unaided_needed}</span>`;
        btn.addEventListener("click", () => {
          state.mode = key;
          setModeButtons();
          loadQuestion();
        });
        els.topicList.appendChild(btn);
      });
    } else {
      existing.forEach((btn) => {
        const info = p.topics[btn.dataset.key];
        if (info) {
          const mark = info.mastered ? "✓ " : "";
          btn.innerHTML = `${mark}${info.label}<span class="m">${info.unaided_correct}/${info.unaided_needed}</span>`;
        }
      });
    }

    renderMasteryPie(p);
    setModeButtons();
  }

  function hideHintControls() {
    els.hint1Btn.hidden = true;
    els.hint2Btn.hidden = true;
    els.hint3tiBtn.hidden = true;
    els.hint3casioBtn.hidden = true;
  }

  function showCalcButtons(openStyle) {
    const hasTi = Boolean(els.hint3ti.textContent);
    const hasCasio = Boolean(els.hint3casio.textContent);
    if (hasTi) {
      els.hint3tiBtn.hidden = false;
      const opened = !els.hint3ti.hidden;
      els.hint3tiBtn.disabled = opened;
      els.hint3tiBtn.textContent = opened
        ? t("btn_hint3_ti_used")
        : openStyle
          ? t("btn_hint3_ti_open")
          : t("btn_hint3_ti");
    } else {
      els.hint3tiBtn.hidden = true;
    }
    if (hasCasio) {
      els.hint3casioBtn.hidden = false;
      const opened = !els.hint3casio.hidden;
      els.hint3casioBtn.disabled = opened;
      els.hint3casioBtn.textContent = opened
        ? t("btn_hint3_casio_used")
        : openStyle
          ? t("btn_hint3_casio_open")
          : t("btn_hint3_casio");
    } else {
      els.hint3casioBtn.hidden = true;
    }
  }

  function resetUI() {
    state.answered = false;
    state.retryPhase = false;
    state.lastExpected = "";
    state.hintsUsed = 0;
    state.clarifyShown = false;
    state.clarifyAiShown = false;
    if (els.clarifyBtn) {
      els.clarifyBtn.hidden = true;
      els.clarifyBtn.disabled = false;
      els.clarifyBtn.textContent = t("btn_clarify");
    }
    if (els.clarifyPanel) {
      els.clarifyPanel.hidden = true;
      els.clarifyPanel.textContent = "";
      els.clarifyPanel.className = "clarify";
    }
    els.feedback.hidden = true;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    els.check.hidden = true;
    els.check.textContent = t("btn_check");
    els.next.hidden = true;
    els.skip.hidden = false;
    els.skip.textContent = t("btn_skip");
    els.hint1.hidden = true;
    els.hint2.hidden = true;
    els.hint3ti.hidden = true;
    els.hint3casio.hidden = true;
    els.hint1.textContent = "";
    els.hint2.textContent = "";
    els.hint3ti.textContent = "";
    els.hint3casio.textContent = "";
    els.hint1Btn.disabled = false;
    els.hint2Btn.disabled = false;
    els.hint3tiBtn.disabled = false;
    els.hint3casioBtn.disabled = false;
    els.hint1Btn.textContent = t("btn_hint1");
    els.hint2Btn.textContent = t("btn_hint2");
    els.hint3tiBtn.textContent = t("btn_hint3_ti");
    els.hint3casioBtn.textContent = t("btn_hint3_casio");
    hideHintControls();
    els.choices.hidden = true;
    els.choices.innerHTML = "";
    els.form.hidden = true;
    els.figure.hidden = true;
    els.figure.innerHTML = "";
    els.input.value = "";
    els.input.placeholder = "";
    els.input.disabled = false;
    if (els.mathInsert) {
      els.mathInsert.querySelectorAll("button").forEach((btn) => {
        btn.disabled = false;
      });
    }
  }

  function loadQuestion() {
    resetUI();
    let topic = null;
    if (state.mode === "smart") {
      topic = P.pickSmartTopic(state.lastTopic);
    } else if (state.mode === "all") {
      topic = "all";
    } else {
      topic = state.mode;
    }

    const full = Q.generateQuestion(topic);
    const pub = Q.publicQuestion(full);
    state.fullQuestion = full;
    state.publicQ = pub;
    if (full && full.topic) state.lastTopic = full.topic;

    els.topic.textContent =
      state.mode === "flashcards" ? t("mode_flashcards") : pub.topic_label;
    els.prompt.textContent = pub.prompt;
    els.hint1.textContent = pub.hint1 || "";
    els.hint2.textContent = pub.hint2 || "";
    els.hint3ti.textContent = pub.hint3_ti || "";
    els.hint3casio.textContent = pub.hint3_casio || "";

    if (pub.has_hint1) {
      els.hint1Btn.hidden = false;
    } else if (pub.has_hint2) {
      els.hint2Btn.hidden = false;
    } else if (pub.has_hint3) {
      showCalcButtons(false);
    }
    // Clarification is always available when we have any guidance.
    if (els.clarifyBtn && pub.has_clarify) {
      els.clarifyBtn.hidden = false;
    }

    if (pub.svg) {
      els.figure.hidden = false;
      els.figure.innerHTML = pub.svg;
    }

    if (pub.type === "mc") {
      els.choices.hidden = false;
      pub.choices.forEach((c) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice";
        btn.textContent = c;
        btn.addEventListener("click", () => submitAnswer(c));
        els.choices.appendChild(btn);
      });
    } else {
      els.form.hidden = false;
      els.check.hidden = false;
      els.unit.textContent = pub.unit || "";
      if (pub.placeholder) els.input.placeholder = pub.placeholder;
      els.input.focus();
    }
  }

  function detectBrowserAI() {
    const ua = navigator.userAgent || "";
    const isEdge = /Edg\//.test(ua);
    const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua);
    const isFirefox = /Firefox\//.test(ua);
    const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua);
    if (isEdge) {
      return {
        key: "clarify_ai_edge",
        name: "Copilot",
        url: "https://copilot.microsoft.com/",
      };
    }
    if (isChrome) {
      return {
        key: "clarify_ai_chrome",
        name: "Gemini",
        url: "https://gemini.google.com/",
      };
    }
    if (isFirefox || isSafari) {
      return {
        key: "clarify_ai_other",
        name: "Copilot or Gemini",
        url: "https://copilot.microsoft.com/",
      };
    }
    return {
      key: "clarify_ai_other",
      name: "Copilot or Gemini",
      url: "https://gemini.google.com/",
    };
  }

  function showClarify() {
    if (!els.clarifyPanel || !state.publicQ) return;
    const promptText = state.publicQ.prompt || "";

    if (!state.clarifyShown) {
      state.clarifyShown = true;
      els.clarifyPanel.hidden = false;
      els.clarifyPanel.className = "clarify";
      els.clarifyPanel.textContent = state.publicQ.clarify || t("clarify_fallback");
      els.clarifyBtn.textContent = t("btn_clarify_more");
      // Opening clarification counts as using at least Hint 1 help.
      if (!state.answered) {
        state.hintsUsed = Math.max(state.hintsUsed, 1);
      }
      return;
    }

    // Second request — we don't have deeper automated help; route to browser AI.
    const ai = detectBrowserAI();
    state.clarifyAiShown = true;
    els.clarifyPanel.hidden = false;
    els.clarifyPanel.className = "clarify ai";
    const msg = t(ai.key, { name: ai.name, url: ai.url });
    els.clarifyPanel.innerHTML =
      msg +
      '\n\n<a class="clarify-link" href="' +
      ai.url +
      '" target="_blank" rel="noopener noreferrer">' +
      t("clarify_ai_open", { name: ai.name }) +
      "</a>" +
      '\n\n<details class="clarify-prompt"><summary>' +
      t("clarify_ai_copy_label") +
      "</summary><pre>" +
      escapeHtml(t("clarify_ai_prompt_template", { prompt: promptText })) +
      "</pre></details>";
    els.clarifyBtn.textContent = t("btn_clarify_ai_done");
    els.clarifyBtn.disabled = true;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function showHintsAfterMiss() {
    if (els.hint1.textContent) els.hint1.hidden = false;
    if (els.hint2.textContent) els.hint2.hidden = false;
    // Keep each calculator behind its own button until opened.
    els.hint3ti.hidden = true;
    els.hint3casio.hidden = true;
    els.hint1Btn.hidden = true;
    els.hint2Btn.hidden = true;
    showCalcButtons(true);
    if (els.clarifyBtn && state.publicQ?.has_clarify) {
      els.clarifyBtn.hidden = false;
    }
  }

  function lockInputs() {
    els.check.hidden = true;
    els.input.disabled = true;
    if (els.mathInsert) {
      els.mathInsert.querySelectorAll("button").forEach((btn) => {
        btn.disabled = true;
      });
    }
    if (state.publicQ && state.publicQ.type === "mc") {
      [...els.choices.children].forEach((btn) => {
        btn.disabled = true;
      });
    }
  }

  function beginRetry(result) {
    state.retryPhase = true;
    state.lastExpected = result.expected;
    els.feedback.className = "feedback no";
    const tip =
      result.hint ||
      state.publicQ?.hint1 ||
      state.publicQ?.hint2 ||
      "";
    els.feedback.textContent =
      t("feedback_wrong_retry") +
      (tip ? t("feedback_wrong_hint", { hint: tip }) : "");
    showHintsAfterMiss();

    els.next.hidden = true;
    els.skip.hidden = false;
    els.skip.textContent = t("btn_skip_retry");
    els.check.textContent = t("btn_check_retry");

    if (state.publicQ.type === "mc") {
      [...els.choices.children].forEach((btn) => {
        // Keep the wrong pick marked; allow another choice.
        if (!btn.classList.contains("wrong")) {
          btn.disabled = false;
        }
      });
      els.check.hidden = true;
    } else {
      els.form.hidden = false;
      els.check.hidden = false;
      els.input.disabled = false;
      els.input.value = "";
      if (els.mathInsert) {
        els.mathInsert.querySelectorAll("button").forEach((btn) => {
          btn.disabled = false;
        });
      }
      els.input.focus();
    }
  }

  function finishAfterRetry(ok, expected) {
    state.retryPhase = false;
    state.answered = true;
    lockInputs();
    els.skip.hidden = true;
    els.skip.textContent = t("btn_skip");
    els.check.textContent = t("btn_check");
    els.next.hidden = false;

    if (ok) {
      const credited = P.awardRetryCredit(state.fullQuestion);
      els.feedback.className = "feedback ok";
      els.feedback.textContent = t("feedback_retry_ok");
      if (state.publicQ.type === "mc") {
        [...els.choices.children].forEach((btn) => {
          btn.disabled = true;
          if (btn.textContent === expected) btn.classList.add("right");
        });
      }
      refreshProgress();
      return credited;
    }

    els.feedback.className = "feedback no";
    els.feedback.textContent = t("feedback_retry_fail", {
      expected: expected || state.lastExpected,
    });
    if (state.publicQ.type === "mc") {
      [...els.choices.children].forEach((btn) => {
        btn.disabled = true;
        if (btn.textContent === (expected || state.lastExpected)) {
          btn.classList.add("right");
        }
      });
    }
    refreshProgress();
    return null;
  }

  function submitAnswer(answer) {
    if (!state.fullQuestion) return;

    if (state.retryPhase) {
      const [ok, expected] = Q.checkAnswer(state.fullQuestion, answer);
      finishAfterRetry(ok, expected);
      return;
    }

    if (state.answered) return;
    state.answered = true;
    els.skip.hidden = true;
    els.check.hidden = true;
    els.input.disabled = true;
    hideHintControls();
    if (els.mathInsert) {
      els.mathInsert.querySelectorAll("button").forEach((btn) => {
        btn.disabled = true;
      });
    }

    const result = P.recordAnswer(state.fullQuestion, answer, state.hintsUsed);
    els.feedback.hidden = false;

    if (result.correct) {
      els.feedback.className = "feedback ok";
      const creditPct = Math.round(result.credit * 100);
      const progress = `${result.unaided_correct}/${result.unaided_needed}`;
      let note = "";
      if (result.hints_used) {
        note =
          t("feedback_note_hinted", {
            credit: creditPct,
            progress: progress,
          }) + " ";
      } else {
        note = t("feedback_note_unaided", { progress: progress }) + " ";
      }
      els.feedback.textContent = t("feedback_correct", {
        credit: creditPct,
        note: note,
        streak: result.streak,
        progress: progress,
        mastered: result.just_mastered ? t("feedback_mastered") : "",
      });
      if (state.publicQ.type === "mc") {
        [...els.choices.children].forEach((btn) => {
          btn.disabled = true;
          if (btn.textContent === result.expected) btn.classList.add("right");
        });
      }
      els.next.hidden = false;
      refreshProgress();
      return;
    }

    // First miss → recovery chance for 5% (do not reveal expected yet).
    if (state.publicQ.type === "mc") {
      [...els.choices.children].forEach((btn) => {
        btn.disabled = true;
        if (btn.textContent === String(answer)) btn.classList.add("wrong");
      });
    }
    beginRetry(result);
    refreshProgress();
  }

  function insertAtCursor(text, cursorOffset) {
    const input = els.input;
    if (!input || (state.answered && !state.retryPhase)) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    input.value = before + text + after;
    const pos =
      cursorOffset != null ? start + cursorOffset : start + text.length;
    input.focus();
    input.setSelectionRange(pos, pos);
  }

  function insertFraction() {
    const input = els.input;
    if (!input || (state.answered && !state.retryPhase)) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const selected = input.value.slice(start, end);
    if (selected) {
      insertAtCursor("(" + selected + ")/()", selected.length + 3);
    } else {
      insertAtCursor("()/()", 1);
    }
  }

  if (els.mathInsert) {
    // Keep input focus/selection when pressing insert buttons.
    els.mathInsert.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) e.preventDefault();
    });
    els.mathInsert.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || (state.answered && !state.retryPhase)) return;
      if (btn.hasAttribute("data-insert-frac")) {
        insertFraction();
        return;
      }
      const text = btn.getAttribute("data-insert");
      if (text) insertAtCursor(text);
    });
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitAnswer(els.input.value);
  });

  els.hint1Btn.addEventListener("click", () => {
    if (!els.hint1.textContent || state.answered) return;
    els.hint1.hidden = false;
    state.hintsUsed = Math.max(state.hintsUsed, 1);
    els.hint1Btn.textContent = t("btn_hint1_used");
    els.hint1Btn.disabled = true;
    if (state.publicQ?.has_hint2) els.hint2Btn.hidden = false;
    else if (state.publicQ?.has_hint3) showCalcButtons(false);
    if (els.clarifyBtn && state.publicQ?.has_clarify) els.clarifyBtn.hidden = false;
  });

  els.hint2Btn.addEventListener("click", () => {
    if (!els.hint2.textContent || state.answered) return;
    els.hint2.hidden = false;
    state.hintsUsed = Math.max(state.hintsUsed, 2);
    els.hint2Btn.textContent = t("btn_hint2_used");
    els.hint2Btn.disabled = true;
    if (state.publicQ?.has_hint3) showCalcButtons(false);
    if (els.clarifyBtn && state.publicQ?.has_clarify) els.clarifyBtn.hidden = false;
  });

  if (els.clarifyBtn) {
    els.clarifyBtn.addEventListener("click", () => {
      showClarify();
    });
  }

  function openCalcPanel(kind) {
    const panel = kind === "ti" ? els.hint3ti : els.hint3casio;
    const btn = kind === "ti" ? els.hint3tiBtn : els.hint3casioBtn;
    if (!panel.textContent || !panel.hidden) return;
    panel.hidden = false;
    if (!state.answered) {
      state.hintsUsed = Math.max(state.hintsUsed, 3);
    }
    btn.textContent =
      kind === "ti" ? t("btn_hint3_ti_used") : t("btn_hint3_casio_used");
    btn.disabled = true;
  }

  els.hint3tiBtn.addEventListener("click", () => openCalcPanel("ti"));
  els.hint3casioBtn.addEventListener("click", () => openCalcPanel("casio"));

  els.next.addEventListener("click", loadQuestion);
  els.skip.addEventListener("click", () => {
    if (state.retryPhase) {
      finishAfterRetry(false, state.lastExpected);
      return;
    }
    if (state.fullQuestion && state.hintsUsed > 0 && !state.answered) {
      P.recordHintSkip(state.fullQuestion, state.hintsUsed);
      refreshProgress();
    }
    loadQuestion();
  });

  document.querySelectorAll(".topic[data-topic]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.topic;
      setModeButtons();
      loadQuestion();
    });
  });

  els.reset.addEventListener("click", () => {
    if (!confirm(t("reset_confirm"))) return;
    P.reset();
    els.topicList.innerHTML = "";
    refreshProgress();
    loadQuestion();
  });

  if (els.save) {
    els.save.addEventListener("click", () => {
      try {
        const name = P.downloadProgressFile();
        els.feedback.hidden = false;
        els.feedback.className = "feedback ok";
        els.feedback.textContent = t("save_ok", { file: name });
      } catch (err) {
        els.feedback.hidden = false;
        els.feedback.className = "feedback no";
        els.feedback.textContent = t("save_fail");
        console.error(err);
      }
    });
  }

  if (els.load && els.progressFile) {
    els.load.addEventListener("click", () => {
      els.progressFile.value = "";
      els.progressFile.click();
    });
    els.progressFile.addEventListener("change", () => {
      const file = els.progressFile.files && els.progressFile.files[0];
      if (!file) return;
      if (!confirm(t("load_confirm"))) {
        els.progressFile.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          P.importProgress(String(reader.result || ""));
          els.topicList.innerHTML = "";
          refreshProgress();
          loadQuestion();
          els.feedback.hidden = false;
          els.feedback.className = "feedback ok";
          els.feedback.textContent = t("load_ok");
        } catch (err) {
          els.feedback.hidden = false;
          els.feedback.className = "feedback no";
          els.feedback.textContent = t("progress_load_fail");
          console.error(err);
        }
      };
      reader.onerror = () => {
        els.feedback.hidden = false;
        els.feedback.className = "feedback no";
        els.feedback.textContent = t("progress_load_fail");
      };
      reader.readAsText(file);
    });
  }

  if (I18n && els.lang) {
    I18n.fillSelect(els.lang);
    els.lang.addEventListener("change", () => {
      const wanted = els.lang.value;
      I18n.setLang(wanted).then((active) => {
        if (active && els.lang.value !== active) {
          els.lang.value = active;
        }
      });
    });
    I18n.onChange(() => {
      els.topicList.innerHTML = "";
      refreshProgress();
      loadQuestion();
    });
  }

  // --- Scratch notes (persisted) --------------------------------------------
  const NOTES_KEY = "mat107-assessment1-notes";
  if (els.notes) {
    try {
      els.notes.value = localStorage.getItem(NOTES_KEY) || "";
    } catch (e) {
      /* ignore */
    }
    els.notes.addEventListener("input", () => {
      try {
        localStorage.setItem(NOTES_KEY, els.notes.value);
      } catch (e) {
        /* ignore */
      }
    });
  }

  // --- Standard calculator modal -------------------------------------------
  const calcState = {
    display: "0",
    left: null,
    op: null,
    fresh: true,
  };

  function calcRender() {
    if (els.calcDisplay) els.calcDisplay.value = calcState.display;
  }

  function calcReset() {
    calcState.display = "0";
    calcState.left = null;
    calcState.op = null;
    calcState.fresh = true;
    calcRender();
  }

  function calcApplyOp(a, b, op) {
    if (op === "+") return a + b;
    if (op === "-") return a - b;
    if (op === "*") return a * b;
    if (op === "/") return b === 0 ? NaN : a / b;
    return b;
  }

  function calcFormat(n) {
    if (!isFinite(n)) return "Error";
    const rounded = Math.round(n * 1e10) / 1e10;
    let s = String(rounded);
    if (s.indexOf("e") >= 0) s = rounded.toPrecision(10);
    if (s.length > 14) s = String(Number(rounded.toPrecision(12)));
    return s;
  }

  function calcInputDigit(d) {
    if (calcState.display === "Error") calcReset();
    if (calcState.fresh || calcState.display === "0") {
      calcState.display = d;
      calcState.fresh = false;
    } else if (calcState.display.length < 16) {
      calcState.display += d;
    }
    calcRender();
  }

  function calcInputDot() {
    if (calcState.display === "Error") calcReset();
    if (calcState.fresh) {
      calcState.display = "0.";
      calcState.fresh = false;
    } else if (calcState.display.indexOf(".") < 0) {
      calcState.display += ".";
    }
    calcRender();
  }

  function calcSetOp(op) {
    if (calcState.display === "Error") return;
    const cur = parseFloat(calcState.display);
    if (calcState.left != null && calcState.op && !calcState.fresh) {
      const result = calcApplyOp(calcState.left, cur, calcState.op);
      calcState.display = calcFormat(result);
      calcState.left = isFinite(result) ? result : null;
    } else {
      calcState.left = cur;
    }
    calcState.op = op;
    calcState.fresh = true;
    calcRender();
  }

  function calcEquals() {
    if (calcState.display === "Error") return;
    if (calcState.left == null || !calcState.op) return;
    const cur = parseFloat(calcState.display);
    const result = calcApplyOp(calcState.left, cur, calcState.op);
    calcState.display = calcFormat(result);
    calcState.left = null;
    calcState.op = null;
    calcState.fresh = true;
    calcRender();
  }

  function openCalcModal() {
    if (!els.calcModal) return;
    els.calcModal.hidden = false;
    document.body.style.overflow = "hidden";
    calcRender();
  }

  function closeCalcModal() {
    if (!els.calcModal) return;
    els.calcModal.hidden = true;
    document.body.style.overflow = "";
  }

  if (els.calcOpen) {
    els.calcOpen.addEventListener("click", openCalcModal);
  }
  if (els.calcClose) {
    els.calcClose.addEventListener("click", closeCalcModal);
  }
  if (els.calcModal) {
    els.calcModal.querySelectorAll("[data-calc-close]").forEach((el) => {
      el.addEventListener("click", closeCalcModal);
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.calcModal && !els.calcModal.hidden) {
      closeCalcModal();
    }
  });

  if (els.calcKeys) {
    els.calcKeys.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-calc]");
      if (!btn) return;
      const action = btn.getAttribute("data-calc");
      if (action === "digit") calcInputDigit(btn.getAttribute("data-digit"));
      else if (action === "dot") calcInputDot();
      else if (action === "clear") calcReset();
      else if (action === "back") {
        if (calcState.fresh || calcState.display === "Error") {
          calcReset();
        } else if (calcState.display.length <= 1) {
          calcState.display = "0";
          calcState.fresh = true;
          calcRender();
        } else {
          calcState.display = calcState.display.slice(0, -1);
          calcRender();
        }
      } else if (action === "op") calcSetOp(btn.getAttribute("data-op"));
      else if (action === "eq") calcEquals();
      else if (action === "pi") {
        calcState.display = "3.14";
        calcState.fresh = true;
        calcRender();
      } else if (action === "sign") {
        if (calcState.display === "0" || calcState.display === "Error") return;
        calcState.display =
          calcState.display.charAt(0) === "-"
            ? calcState.display.slice(1)
            : "-" + calcState.display;
        calcRender();
      } else if (action === "sq") {
        const n = parseFloat(calcState.display);
        calcState.display = calcFormat(n * n);
        calcState.fresh = true;
        calcState.left = null;
        calcState.op = null;
        calcRender();
      } else if (action === "sqrt") {
        const n = parseFloat(calcState.display);
        calcState.display = n < 0 ? "Error" : calcFormat(Math.sqrt(n));
        calcState.fresh = true;
        calcState.left = null;
        calcState.op = null;
        calcRender();
      }
    });
  }

  function start() {
    if (I18n && I18n.applyStatic) I18n.applyStatic();
    refreshProgress();
    loadQuestion();
  }

  if (I18n && I18n.ready && typeof I18n.ready.then === "function") {
    I18n.ready.then(start);
  } else {
    start();
  }
})();
