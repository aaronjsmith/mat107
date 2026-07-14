/* MAT107 quiz UI — client-only static site */
(function () {
  const Q = window.QuizQuestions;
  const P = window.QuizProgress;

  if (!Q || !P) {
    document.getElementById("q-prompt").textContent =
      "Failed to load quiz scripts. Open index.html from the project folder (js/questions.js and js/progress.js must be next to it).";
    return;
  }

  const state = {
    mode: "all",
    fullQuestion: null, // includes answers (kept only in memory)
    publicQ: null,
    answered: false,
    hintsUsed: 0,
  };

  const els = {
    topicList: document.getElementById("topic-list"),
    prompt: document.getElementById("q-prompt"),
    topic: document.getElementById("q-topic"),
    hint: document.getElementById("q-hint"),
    setup: document.getElementById("q-setup"),
    hintBtn: document.getElementById("btn-hint"),
    setupBtn: document.getElementById("btn-setup"),
    figure: document.getElementById("q-figure"),
    choices: document.getElementById("q-choices"),
    form: document.getElementById("q-form"),
    input: document.getElementById("q-input"),
    unit: document.getElementById("q-unit"),
    feedback: document.getElementById("feedback"),
    next: document.getElementById("btn-next"),
    skip: document.getElementById("btn-skip"),
    reset: document.getElementById("btn-reset"),
    accuracy: document.getElementById("stat-accuracy"),
    streak: document.getElementById("stat-streak"),
    total: document.getElementById("stat-total"),
    mastery: document.getElementById("mastery-bars"),
  };

  function setModeButtons() {
    document.querySelectorAll(".topic[data-topic]").forEach((btn) => {
      const t = btn.dataset.topic;
      const active =
        (state.mode === "all" && t === "all") ||
        (state.mode === "smart" && t === "smart") ||
        (state.mode === "flashcards" && t === "flashcards") ||
        state.mode === t;
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
            <span>${info.unaided_correct}/${info.unaided_needed} unaided</span>
          </header>
          <div class="bar ${cls}"><i style="width:${info.mastery}%"></i></div>
        `;
        els.mastery.appendChild(row);
      });

    setModeButtons();
  }

  function resetUI() {
    state.answered = false;
    state.hintsUsed = 0;
    els.feedback.hidden = true;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    els.next.hidden = true;
    els.skip.hidden = false;
    els.hint.hidden = true;
    els.hint.textContent = "";
    els.setup.hidden = true;
    els.setup.textContent = "";
    els.hintBtn.hidden = true;
    els.setupBtn.hidden = true;
    els.hintBtn.disabled = false;
    els.setupBtn.disabled = false;
    els.hintBtn.textContent = "Hint 1 · concept";
    els.setupBtn.textContent = "Hint 2 · setup equation";
    els.choices.hidden = true;
    els.choices.innerHTML = "";
    els.form.hidden = true;
    els.figure.hidden = true;
    els.figure.innerHTML = "";
    els.input.value = "";
    els.input.placeholder = "";
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
      state.mode === "flashcards" ? "Formula flashcards" : pub.topic_label;
    els.prompt.textContent = pub.prompt;
    els.hint.textContent = pub.hint || "";
    els.setup.textContent = pub.setup || "";
    els.hintBtn.hidden = !pub.has_hint;

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
      els.unit.textContent = pub.unit || "";
      if (pub.placeholder) els.input.placeholder = pub.placeholder;
      els.input.focus();
    }
  }

  function submitAnswer(answer) {
    if (!state.fullQuestion || state.answered) return;
    state.answered = true;
    els.skip.hidden = true;
    els.hintBtn.hidden = true;
    els.setupBtn.hidden = true;

    const result = P.recordAnswer(state.fullQuestion, answer, state.hintsUsed);
    els.feedback.hidden = false;

    if (result.correct) {
      els.feedback.className = "feedback ok";
      const creditPct = Math.round(result.credit * 100);
      const progress = `${result.unaided_correct}/${result.unaided_needed}`;
      els.feedback.textContent =
        `Correct · ${creditPct}% credit. ${result.note || ""}\n` +
        `Unaided streak: ${result.streak}. Mastery: ${progress}` +
        (result.mastered ? " — mastered!" : "");
    } else {
      els.feedback.className = "feedback no";
      els.feedback.textContent =
        `Not quite. Expected: ${result.expected}` +
        (result.hint ? `\nHint: ${result.hint}` : "");
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

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitAnswer(els.input.value);
  });

  els.hintBtn.addEventListener("click", () => {
    if (!els.hint.textContent || state.answered) return;
    els.hint.hidden = false;
    state.hintsUsed = Math.max(state.hintsUsed, 1);
    els.hintBtn.textContent = "Hint 1 used (−50% if correct)";
    els.hintBtn.disabled = true;
    if (state.publicQ?.has_setup) els.setupBtn.hidden = false;
  });

  els.setupBtn.addEventListener("click", () => {
    if (!els.setup.textContent || state.answered) return;
    els.setup.hidden = false;
    state.hintsUsed = Math.max(state.hintsUsed, 2);
    els.setupBtn.textContent = "Hint 2 used (−75% if correct)";
    els.setupBtn.disabled = true;
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
    if (!confirm("Reset all progress stored in this browser?")) return;
    P.reset();
    els.topicList.innerHTML = "";
    refreshProgress();
    loadQuestion();
  });

  refreshProgress();
  loadQuestion();
})();
