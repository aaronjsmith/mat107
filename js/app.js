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
    hintsUsed: 0,
  };

  const els = {
    topicList: document.getElementById("topic-list"),
    prompt: document.getElementById("q-prompt"),
    topic: document.getElementById("q-topic"),
    hint1: document.getElementById("q-hint1"),
    hint2: document.getElementById("q-hint2"),
    hint3: document.getElementById("q-hint3"),
    hint1Btn: document.getElementById("btn-hint1"),
    hint2Btn: document.getElementById("btn-hint2"),
    hint3Btn: document.getElementById("btn-hint3"),
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
    mastery: document.getElementById("mastery-bars"),
    lang: document.getElementById("lang-select"),
  };

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

    els.mastery.innerHTML = "";
    Object.entries(p.topics)
      .sort((a, b) => a[1].mastery - b[1].mastery)
      .forEach(([, info]) => {
        const cls = info.mastered ? "" : info.mastery >= 50 ? "mid" : "low";
        const row = document.createElement("div");
        row.className = "mastery-row" + (info.mastered ? " mastered" : "");
        row.innerHTML = `
          <header>
            <span>${info.mastered ? "✓ " : ""}${info.label}</span>
            <span>${info.unaided_correct}/${info.unaided_needed} ${t("mastery_unaided")}</span>
          </header>
          <div class="bar ${cls}"><i style="width:${info.mastery}%"></i></div>
        `;
        els.mastery.appendChild(row);
      });

    setModeButtons();
  }

  function hideHintControls() {
    els.hint1Btn.hidden = true;
    els.hint2Btn.hidden = true;
    els.hint3Btn.hidden = true;
  }

  function resetUI() {
    state.answered = false;
    state.hintsUsed = 0;
    els.feedback.hidden = true;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    els.check.hidden = true;
    els.next.hidden = true;
    els.skip.hidden = false;
    els.hint1.hidden = true;
    els.hint2.hidden = true;
    els.hint3.hidden = true;
    els.hint1.textContent = "";
    els.hint2.textContent = "";
    els.hint3.textContent = "";
    els.hint1Btn.disabled = false;
    els.hint2Btn.disabled = false;
    els.hint3Btn.disabled = false;
    els.hint1Btn.textContent = t("btn_hint1");
    els.hint2Btn.textContent = t("btn_hint2");
    els.hint3Btn.textContent = t("btn_hint3");
    hideHintControls();
    els.choices.hidden = true;
    els.choices.innerHTML = "";
    els.form.hidden = true;
    els.figure.hidden = true;
    els.figure.innerHTML = "";
    els.input.value = "";
    els.input.placeholder = "";
    if (els.mathInsert) {
      els.mathInsert.querySelectorAll("button").forEach((btn) => {
        btn.disabled = false;
      });
    }
  }

  function loadQuestion() {
    resetUI();
    let topic = null;
    if (state.mode === "smart") topic = P.pickSmartTopic();
    else if (state.mode === "all") topic = "all";
    else topic = state.mode;

    const full = Q.generateQuestion(topic);
    const pub = Q.publicQuestion(full);
    state.fullQuestion = full;
    state.publicQ = pub;

    els.topic.textContent =
      state.mode === "flashcards" ? t("mode_flashcards") : pub.topic_label;
    els.prompt.textContent = pub.prompt;
    els.hint1.textContent = pub.hint1 || "";
    els.hint2.textContent = pub.hint2 || "";
    els.hint3.textContent = pub.hint3 || "";

    if (pub.has_hint1) {
      els.hint1Btn.hidden = false;
    } else if (pub.has_hint2) {
      els.hint2Btn.hidden = false;
    } else if (pub.has_hint3) {
      els.hint3Btn.hidden = false;
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

  function submitAnswer(answer) {
    if (!state.fullQuestion || state.answered) return;
    state.answered = true;
    els.skip.hidden = true;
    els.check.hidden = true;
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
      els.feedback.textContent = t("feedback_correct", {
        credit: creditPct,
        note: result.note || "",
        streak: result.streak,
        progress: progress,
        mastered: result.mastered ? t("feedback_mastered") : "",
      });
    } else {
      els.feedback.className = "feedback no";
      const tip =
        result.hint ||
        state.publicQ?.hint1 ||
        state.publicQ?.hint2 ||
        "";
      els.feedback.textContent =
        t("feedback_wrong", { expected: result.expected }) +
        (tip ? t("feedback_wrong_hint", { hint: tip }) : "");
      // Show approach/setup hints so the miss is still a learning moment.
      if (els.hint1.textContent) els.hint1.hidden = false;
      if (els.hint2.textContent) els.hint2.hidden = false;
      if (els.hint3.textContent) els.hint3.hidden = false;
    }

    if (state.publicQ.type === "mc") {
      [...els.choices.children].forEach((btn) => {
        btn.disabled = true;
        if (btn.textContent === result.expected) btn.classList.add("right");
        if (btn.textContent === String(answer) && !result.correct) btn.classList.add("wrong");
      });
    }

    els.next.hidden = false;
    refreshProgress();
  }

  function insertAtCursor(text, cursorOffset) {
    const input = els.input;
    if (!input || state.answered) return;
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
    if (!input || state.answered) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const selected = input.value.slice(start, end);
    if (selected) {
      // Wrap selection as (sel)/() with cursor in the denominator.
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
      if (!btn || state.answered) return;
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
    else if (state.publicQ?.has_hint3) els.hint3Btn.hidden = false;
  });

  els.hint2Btn.addEventListener("click", () => {
    if (!els.hint2.textContent || state.answered) return;
    els.hint2.hidden = false;
    state.hintsUsed = Math.max(state.hintsUsed, 2);
    els.hint2Btn.textContent = t("btn_hint2_used");
    els.hint2Btn.disabled = true;
    if (state.publicQ?.has_hint3) els.hint3Btn.hidden = false;
  });

  els.hint3Btn.addEventListener("click", () => {
    if (!els.hint3.textContent || state.answered) return;
    els.hint3.hidden = false;
    state.hintsUsed = Math.max(state.hintsUsed, 3);
    els.hint3Btn.textContent = t("btn_hint3_used");
    els.hint3Btn.disabled = true;
  });

  els.next.addEventListener("click", loadQuestion);
  els.skip.addEventListener("click", loadQuestion);

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
      I18n.setLang(els.lang.value);
    });
    I18n.onChange(() => {
      els.topicList.innerHTML = "";
      refreshProgress();
      loadQuestion();
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
