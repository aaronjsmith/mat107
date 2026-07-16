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
    mode: "smart",
    fullQuestion: null,
    publicQ: null,
    answered: false,
    retryPhase: false,
    lastExpected: "",
    hintsUsed: 0,
    lastTopic: null,
    clarifyShown: false,
    clarifyAiShown: false,
    /** After a miss, serve a remix of the same generator next. */
    remixAfterFail: false,
    /** Question to remix after a boss miss / retreat modal. */
    pendingBossRemix: null,
    /** After a miss modal, stay in the fight and remix. */
    bossContinueAfterMiss: false,
    boss: {
      active: false,
      queue: [],
      index: 0,
      status: null, // "running" | "won" | "failed"
      real: false,
    },
  };

  const els = {
    topicList: document.getElementById("topic-list"),
    finalBossBtn: document.getElementById("btn-final-boss"),
    bossFace: document.getElementById("boss-face"),
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
    singleField: document.getElementById("q-single-field"),
    multiFields: document.getElementById("q-multi-fields"),
    input: document.getElementById("q-input"),
    unit: document.getElementById("q-unit"),
    mathInsert: document.getElementById("math-insert"),
    check: document.getElementById("btn-check"),
    feedback: document.getElementById("feedback"),
    next: document.getElementById("btn-next"),
    skip: document.getElementById("btn-skip"),
    remix: document.getElementById("btn-remix"),
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
    bossInviteModal: document.getElementById("boss-invite-modal"),
    bossInviteMsg: document.getElementById("boss-invite-msg"),
    bossInviteFight: document.getElementById("boss-invite-fight"),
    bossInviteLater: document.getElementById("boss-invite-later"),
    bossInviteClose: document.getElementById("boss-invite-close"),
    bossInviteBackdrop: document.getElementById("boss-invite-backdrop"),
    bossRetreatModal: document.getElementById("boss-retreat-modal"),
    bossRetreatMsg: document.getElementById("boss-retreat-msg"),
    bossRetreatOk: document.getElementById("boss-retreat-ok"),
    bossRetreatClose: document.getElementById("boss-retreat-close"),
    bossRetreatBackdrop: document.getElementById("boss-retreat-backdrop"),
    notes: document.getElementById("notes-area"),
    notesStatus: document.getElementById("notes-status"),
    notesSortAsc: document.getElementById("notes-sort-asc"),
    notesSortDesc: document.getElementById("notes-sort-desc"),
    notesSum: document.getElementById("notes-sum"),
    notesUnique: document.getElementById("notes-unique"),
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
        (state.mode === "finalboss" && topic === "finalboss") ||
        state.mode === topic;
      btn.classList.toggle("active", active);
    });
  }

  function updateFinalBossButton(p) {
    const btn = els.finalBossBtn;
    if (!btn) return;
    const ready = Boolean(p && p.all_mastered);
    const inFight = bossFightActive();
    const realFight = Boolean(
      (state.boss && state.boss.real) || (inFight && ready)
    );
    btn.disabled = false;
    btn.classList.toggle("cleared", Boolean(p && p.final_boss_cleared && ready));
    // Never mark the button as practice during a real (all-mastered) fight.
    btn.classList.toggle("practice", !ready && !realFight);
    if (inFight && realFight) {
      btn.textContent = "😈 " + t("mode_finalboss_fighting");
    } else if (inFight) {
      btn.textContent = "😈 " + t("mode_finalboss_practice_active");
    } else if (p && p.final_boss_cleared && ready) {
      btn.textContent = "💀 " + t("mode_finalboss_cleared");
    } else if (ready) {
      btn.textContent = "😈 " + t("mode_finalboss_ready");
    } else {
      btn.textContent = "😈 " + t("mode_finalboss_practice");
    }
  }

  let bossFaceTimer = null;
  let bossAudioCtx = null;

  function getBossAudioCtx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!bossAudioCtx) bossAudioCtx = new AC();
    return bossAudioCtx;
  }

  /** Short 8-bit square-wave "hit" blip. */
  function playBossHitSound() {
    try {
      const ctx = getBossAudioCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      // Descending square chirp — classic console hit.
      const notes = [
        { freq: 380, at: 0, dur: 0.05 },
        { freq: 190, at: 0.045, dur: 0.07 },
        { freq: 95, at: 0.1, dur: 0.1 },
      ];
      notes.forEach(function (n) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(n.freq, now + n.at);
        const t0 = now + n.at;
        const t1 = t0 + n.dur;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t1 + 0.02);
      });
    } catch (e) {
      /* ignore audio failures */
    }
  }

  function setBossFace(emoji, mode) {
    if (!els.bossFace) return;
    if (bossFaceTimer) {
      clearTimeout(bossFaceTimer);
      bossFaceTimer = null;
    }
    els.bossFace.hidden = false;
    els.bossFace.textContent = emoji;
    els.bossFace.classList.remove("hit", "dead");
    if (mode) els.bossFace.classList.add(mode);
    els.bossFace.setAttribute("aria-hidden", "false");
  }

  function hideBossFace() {
    if (!els.bossFace) return;
    if (bossFaceTimer) {
      clearTimeout(bossFaceTimer);
      bossFaceTimer = null;
    }
    els.bossFace.hidden = true;
    els.bossFace.classList.remove("hit", "dead");
    els.bossFace.textContent = "😈";
    els.bossFace.setAttribute("aria-hidden", "true");
  }

  function bossFightActive() {
    return (
      state.mode === "finalboss" &&
      state.boss &&
      state.boss.active &&
      state.boss.status === "running"
    );
  }

  /** Boss takes a hit: 👹 for 2s, then back to 😈 only while the fight continues. */
  function bossTakeDamage(onDone) {
    if (!bossFightActive()) {
      hideBossFace();
      return;
    }
    playBossHitSound();
    setBossFace("👹", "hit");
    bossFaceTimer = setTimeout(function () {
      if (!bossFightActive()) {
        hideBossFace();
        return;
      }
      if (typeof onDone === "function") {
        onDone();
        return;
      }
      setBossFace("😈");
    }, 2000);
  }

  function persistBossRun() {
    if (
      state.boss &&
      state.boss.active &&
      state.boss.status === "running" &&
      Array.isArray(state.boss.queue) &&
      state.boss.queue.length
    ) {
      P.saveBossRun({
        active: true,
        queue: state.boss.queue.slice(),
        index: state.boss.index,
        status: "running",
        real: Boolean(state.boss.real),
      });
    } else if (P.clearBossRun) {
      P.clearBossRun();
    }
  }

  function restoreBossRunFromStorage() {
    const saved = P.getBossRun && P.getBossRun();
    if (!saved) return false;
    state.boss = {
      active: true,
      queue: saved.queue.slice(),
      index: saved.index,
      status: "running",
      real: Boolean(saved.real),
    };
    return true;
  }

  function startBossRun() {
    const real = Boolean(P.allTopicsMastered && P.allTopicsMastered());
    state.boss = {
      active: true,
      queue: P.shuffleTopics(),
      index: 0,
      status: "running",
      real: real,
    };
    persistBossRun();
    setBossFace("😈");
    updateFinalBossButton(P.getProgressView());
    if (P.clearBossDrillTopic) P.clearBossDrillTopic();
  }

  function failBoss() {
    // Abandon the run (e.g. Skip) — leave the fight and train the missed skill.
    const missedQ = state.fullQuestion;
    const missedTopic =
      (missedQ && missedQ.topic) ||
      (state.boss.queue && state.boss.queue[state.boss.index]) ||
      null;
    const topicLabel =
      missedTopic && Q.TOPICS[missedTopic] ? Q.TOPICS[missedTopic] : t("mode_finalboss");
    const real = Boolean(state.boss.real);
    let penalty = { dropped_to: 9, topic: missedTopic, topics_affected: 0 };
    if (real) {
      penalty = P.penalizeBossFail(missedTopic);
    }
    state.boss.status = "failed";
    state.boss.active = false;
    if (P.clearBossRun) P.clearBossRun();
    state.answered = true;
    state.pendingBossRemix = missedQ;
    state.bossContinueAfterMiss = false;
    if (missedTopic && P.setBossDrillTopic) P.setBossDrillTopic(missedTopic);
    hideBossFace();
    lockInputs();
    hideHintControls();
    els.skip.hidden = true;
    if (els.remix) els.remix.hidden = true;
    els.check.hidden = true;
    els.next.hidden = true;
    els.feedback.hidden = true;
    state.mode = missedTopic && Q.TOPICS[missedTopic] ? missedTopic : "smart";
    els.topic.textContent =
      missedTopic && Q.TOPICS[missedTopic] ? Q.TOPICS[missedTopic] : t("mode_smart");
    setModeButtons();
    refreshProgress();
    openBossRetreatModal({
      continueFight: false,
      topicLabel: topicLabel,
      real: real,
      progress: penalty.dropped_to + "/10",
    });
  }

  /** Wrong answer / hint in boss: knock 1 mastery, stay in fight, remix same question. */
  function bossMissAndRemix() {
    const missedQ = state.fullQuestion;
    const missedTopic =
      (missedQ && missedQ.topic) ||
      (state.boss.queue && state.boss.queue[state.boss.index]) ||
      null;
    const topicLabel =
      missedTopic && Q.TOPICS[missedTopic] ? Q.TOPICS[missedTopic] : t("mode_finalboss");
    const penalty =
      P.penalizeBossMiss && missedTopic
        ? P.penalizeBossMiss(missedTopic)
        : { dropped_to: 0, topics_affected: 0 };
    state.answered = true;
    state.pendingBossRemix = missedQ;
    state.bossContinueAfterMiss = true;
    persistBossRun();
    lockInputs();
    hideHintControls();
    els.skip.hidden = true;
    if (els.remix) els.remix.hidden = true;
    els.check.hidden = true;
    els.next.hidden = true;
    els.feedback.hidden = true;
    refreshProgress();
    openBossRetreatModal({
      continueFight: true,
      topicLabel: topicLabel,
      progress: penalty.dropped_to + "/10",
    });
  }

  let bossRetreatOpen = false;

  function openBossRetreatModal(opts) {
    if (!els.bossRetreatModal) {
      finishBossRetreat();
      return;
    }
    opts = opts || {};
    const titleEl = document.getElementById("boss-retreat-title");
    if (titleEl) {
      titleEl.textContent = opts.continueFight
        ? t("boss_miss_title")
        : t("boss_retreat_title");
    }
    if (els.bossRetreatMsg) {
      if (opts.continueFight) {
        els.bossRetreatMsg.textContent = t("boss_miss_msg", {
          topic: opts.topicLabel || "",
          progress: opts.progress || "—",
        });
      } else {
        els.bossRetreatMsg.textContent = opts.real
          ? t("boss_retreat_msg_real", {
              topic: opts.topicLabel || "",
              progress: opts.progress || "9/10",
            })
          : t("boss_retreat_msg", { topic: opts.topicLabel || "" });
      }
    }
    if (els.bossRetreatOk) {
      els.bossRetreatOk.textContent = opts.continueFight
        ? t("boss_miss_ok")
        : t("boss_retreat_ok");
    }
    const face = els.bossRetreatModal.querySelector(".boss-invite-face");
    if (face) face.textContent = opts.continueFight ? "👹" : "🏃";
    bossRetreatOpen = true;
    els.bossRetreatModal.hidden = false;
    const focusBtn = els.bossRetreatOk;
    if (focusBtn) {
      setTimeout(function () {
        focusBtn.focus();
      }, 0);
    }
  }

  function finishBossRetreat() {
    if (els.bossRetreatModal) els.bossRetreatModal.hidden = true;
    bossRetreatOpen = false;
    const missedQ = state.pendingBossRemix;
    const continueFight = Boolean(state.bossContinueAfterMiss);
    state.pendingBossRemix = null;
    state.bossContinueAfterMiss = false;
    state.remixAfterFail = false;

    if (continueFight && state.boss && state.boss.active && state.boss.status === "running") {
      if (Q.setBossTheme) Q.setBossTheme(true);
      setModeButtons();
      updateFinalBossButton(P.getProgressView());
      if (missedQ && typeof missedQ._gen === "function") {
        state.fullQuestion = missedQ;
        loadRemix();
        return;
      }
      loadQuestion();
      return;
    }

    if (Q.setBossTheme) Q.setBossTheme(false);
    setModeButtons();
    refreshProgress();
    if (missedQ && typeof missedQ._gen === "function") {
      state.fullQuestion = missedQ;
      loadRemix();
      return;
    }
    loadQuestion();
  }

  function winBoss() {
    const real = Boolean(state.boss.real);
    const already = Boolean(P.getProgressView().final_boss_cleared);
    if (real) {
      P.markFinalBossCleared();
    }
    state.boss.status = "won";
    state.boss.active = false;
    if (P.clearBossRun) P.clearBossRun();
    state.answered = true;
    setBossFace("💀", "dead");
    bossFaceTimer = setTimeout(hideBossFace, 1100);
    lockInputs();
    hideHintControls();
    els.skip.hidden = true;
    if (els.remix) els.remix.hidden = true;
    els.check.hidden = true;
    els.next.hidden = false;
    els.feedback.hidden = false;
    els.feedback.className = "feedback ok";
    if (real) {
      els.feedback.textContent = already ? t("boss_win_again") : t("boss_win");
      els.topic.textContent = t("mode_finalboss_cleared");
    } else {
      els.feedback.textContent = t("boss_win_practice");
      els.topic.textContent = t("mode_finalboss");
    }
    if (P.clearBossDrillTopic) P.clearBossDrillTopic();
    refreshProgress();
  }

  function advanceBossAfterCorrect() {
    state.boss.index += 1;
    if (state.boss.index >= state.boss.queue.length) {
      if (P.clearBossRun) P.clearBossRun();
      playBossHitSound();
      setBossFace("👹", "hit");
      bossFaceTimer = setTimeout(function () {
        winBoss();
      }, 2000);
      return;
    }
    persistBossRun();
    els.feedback.hidden = false;
    els.feedback.className = "feedback ok";
    els.feedback.textContent = t("boss_ok", {
      current: state.boss.index,
      total: state.boss.queue.length,
    });
    els.next.hidden = true;
    bossTakeDamage(function () {
      if (!bossFightActive()) return;
      loadQuestion();
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
    updateFinalBossButton(p);
  }

  const BOSS_INVITE_KEY = "mat107-boss-invite-dismissed";
  let bossInviteOpen = false;

  function dismissBossInvite() {
    if (!bossInviteOpen) return;
    bossInviteOpen = false;
    if (els.bossInviteModal) els.bossInviteModal.hidden = true;
    try {
      sessionStorage.setItem(BOSS_INVITE_KEY, "1");
    } catch (e) {
      /* ignore */
    }
  }

  function acceptBossInvite() {
    if (!bossInviteOpen) return;
    bossInviteOpen = false;
    if (els.bossInviteModal) els.bossInviteModal.hidden = true;
    const p = P.getProgressView();
    state.mode = "finalboss";
    state.boss = {
      active: false,
      queue: [],
      index: 0,
      status: null,
      real: false,
    };
    setModeButtons();
    updateFinalBossButton(p);
    loadQuestion();
  }

  function openBossInviteModal() {
    if (!els.bossInviteModal) return;
    if (els.bossInviteMsg) {
      els.bossInviteMsg.textContent = t("boss_invite_mastered");
    }
    bossInviteOpen = true;
    els.bossInviteModal.hidden = false;
    const focusBtn = els.bossInviteFight || els.bossInviteLater;
    if (focusBtn) {
      setTimeout(function () {
        focusBtn.focus();
      }, 0);
    }
  }

  function maybePromptBossFight(p) {
    if (bossInviteOpen) return;
    if (state.mode === "finalboss" && state.boss && state.boss.active) return;
    p = p || P.getProgressView();
    if (!p || !p.all_mastered) {
      try {
        sessionStorage.removeItem(BOSS_INVITE_KEY);
      } catch (e) {
        /* ignore */
      }
      return;
    }
    try {
      if (sessionStorage.getItem(BOSS_INVITE_KEY) === "1") return;
    } catch (e) {
      /* ignore */
    }
    openBossInviteModal();
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
    if (els.remix) els.remix.hidden = false;
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
    clearMultiFields();
    els.singleField.hidden = false;
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
    els.unit.textContent = "";
  }

  function clearMultiFields() {
    if (!els.multiFields) return;
    els.multiFields.innerHTML = "";
    els.multiFields.hidden = true;
  }

  function getMultiInputs() {
    if (!els.multiFields) return [];
    return [
      ...els.multiFields.querySelectorAll("input[data-field-id]"),
      ...els.multiFields.querySelectorAll("select[data-field-id]"),
    ];
  }

  function collectMultiAnswers() {
    const out = {};
    getMultiInputs().forEach((control) => {
      out[control.dataset.fieldId] = control.value;
    });
    return out;
  }

  function createMultiInput(f, inputId) {
    if (f.type === "select") {
      const select = document.createElement("select");
      select.id = inputId;
      select.dataset.fieldId = f.id;
      (f.options || []).forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label || opt.value;
        select.appendChild(option);
      });
      return select;
    }
    const input = document.createElement("input");
    input.id = inputId;
    input.type = "text";
    input.dataset.fieldId = f.id;
    input.autocomplete = "off";
    input.spellcheck = false;
    if (f.placeholder) input.placeholder = f.placeholder;
    if (f.maxLength) input.maxLength = f.maxLength;
    if (f.digit) {
      input.className = "digit-input";
      input.inputMode = "numeric";
    }
    return input;
  }

  function appendStandardField(f, focus) {
    const row = document.createElement("div");
    row.className = "multi-field";

    const label = document.createElement("label");
    const inputId = "mf-" + f.id;
    label.htmlFor = inputId;
    label.textContent = f.label || f.id;

    const inputRow = document.createElement("div");
    inputRow.className = "input-row";

    const control = createMultiInput(f, inputId);
    inputRow.appendChild(control);
    if (f.unit) {
      const unit = document.createElement("span");
      unit.className = "unit";
      unit.textContent = f.unit;
      inputRow.appendChild(unit);
    }

    row.appendChild(label);
    row.appendChild(inputRow);
    els.multiFields.appendChild(row);
    if (focus) control.focus();
    return control;
  }

  function renderMultiFields(pub) {
    clearMultiFields();
    els.singleField.hidden = true;
    els.multiFields.hidden = false;
    const fieldById = Object.fromEntries((pub.fields || []).map((f) => [f.id, f]));
    const layout =
      pub.layout || (pub.fields || []).map((f) => ({ widget: "field", id: f.id }));
    let focusSet = false;

    layout.forEach((item) => {
      if (item.widget === "fraction") {
        const numF = fieldById[item.num];
        const denF = fieldById[item.denom];
        if (!numF || !denF) return;

        const row = document.createElement("div");
        row.className = "multi-field multi-fraction";

        if (item.label) {
          const label = document.createElement("span");
          label.className = "multi-widget-label";
          label.textContent = item.label;
          row.appendChild(label);
        }

        const frac = document.createElement("div");
        frac.className = "fraction-input";
        frac.setAttribute("role", "group");
        frac.setAttribute("aria-label", item.label || t("field.slope"));

        const numIn = createMultiInput(numF, "mf-" + item.num);
        const denIn = createMultiInput(denF, "mf-" + item.denom);
        const bar = document.createElement("span");
        bar.className = "fraction-bar";
        bar.setAttribute("aria-hidden", "true");

        frac.appendChild(numIn);
        frac.appendChild(bar);
        frac.appendChild(denIn);
        row.appendChild(frac);
        els.multiFields.appendChild(row);

        if (!focusSet) {
          numIn.focus();
          focusSet = true;
        }
        return;
      }

      if (item.widget === "unit_value") {
        const valF = fieldById[item.value];
        const unitF = fieldById[item.unit];
        if (!valF || !unitF) return;

        const row = document.createElement("div");
        row.className = "multi-field multi-unit-value";

        if (item.label) {
          const label = document.createElement("label");
          label.className = "multi-widget-label";
          label.textContent = item.label;
          row.appendChild(label);
        }

        const inputRow = document.createElement("div");
        inputRow.className = "input-row unit-value-row";

        const valIn = createMultiInput(valF, "mf-" + item.value);
        const unitSel = createMultiInput(unitF, "mf-" + item.unit);
        unitSel.className = "unit-select";

        inputRow.appendChild(valIn);
        inputRow.appendChild(unitSel);
        row.appendChild(inputRow);
        els.multiFields.appendChild(row);

        if (!focusSet) {
          valIn.focus();
          focusSet = true;
        }
        return;
      }

      if (item.widget === "division") {
        const row = document.createElement("div");
        row.className = "multi-field multi-division";

        const work = document.createElement("div");
        work.className = "division-work";
        work.setAttribute("role", "group");
        work.setAttribute("aria-label", t("field.division_work"));

        const quotientRow = document.createElement("div");
        quotientRow.className = "div-row quotient-row";

        const gutter = document.createElement("div");
        gutter.className = "div-gutter";
        gutter.setAttribute("aria-hidden", "true");
        quotientRow.appendChild(gutter);

        const qDigits = document.createElement("div");
        qDigits.className = "div-quotient-digits";
        (item.quotient || []).forEach((qid) => {
          const qf = fieldById[qid];
          if (qf) qDigits.appendChild(createMultiInput(qf, "mf-" + qid));
        });
        quotientRow.appendChild(qDigits);

        if (item.remainder && fieldById[item.remainder]) {
          const remWrap = document.createElement("div");
          remWrap.className = "div-remainder";
          const remLbl = document.createElement("span");
          remLbl.className = "div-rem-label";
          remLbl.textContent = "R";
          remWrap.appendChild(remLbl);
          remWrap.appendChild(
            createMultiInput(fieldById[item.remainder], "mf-" + item.remainder)
          );
          quotientRow.appendChild(remWrap);
        }

        const problemRow = document.createElement("div");
        problemRow.className = "div-row problem-row";

        const divisorEl = document.createElement("span");
        divisorEl.className = "div-divisor";
        divisorEl.textContent = String(item.divisor);

        const parenEl = document.createElement("span");
        parenEl.className = "div-paren";
        parenEl.textContent = ")";

        const dividendEl = document.createElement("span");
        dividendEl.className = "div-dividend";
        dividendEl.textContent = String(item.dividend);

        const barEl = document.createElement("div");
        barEl.className = "div-bar";
        barEl.setAttribute("aria-hidden", "true");

        problemRow.appendChild(divisorEl);
        problemRow.appendChild(parenEl);
        problemRow.appendChild(dividendEl);

        work.appendChild(quotientRow);
        work.appendChild(barEl);
        work.appendChild(problemRow);
        row.appendChild(work);
        els.multiFields.appendChild(row);

        const firstQ = qDigits.querySelector("input");
        if (!focusSet && firstQ) {
          firstQ.focus();
          focusSet = true;
        }
        return;
      }

      if (item.widget === "field") {
        const f = fieldById[item.id];
        if (!f) return;
        appendStandardField(f, !focusSet);
        if (!focusSet) focusSet = true;
      }
    });
  }

  function getAnswerPayload() {
    if (state.publicQ && state.publicQ.type === "multi") {
      return collectMultiAnswers();
    }
    return els.input.value;
  }

  function setInputsDisabled(disabled) {
    els.input.disabled = disabled;
    getMultiInputs().forEach((input) => {
      input.disabled = disabled;
    });
    if (els.mathInsert) {
      els.mathInsert.querySelectorAll("button").forEach((btn) => {
        btn.disabled = disabled;
      });
    }
  }

  function clearAnswerInputs() {
    els.input.value = "";
    getMultiInputs().forEach((control) => {
      if (control.tagName === "SELECT") control.selectedIndex = 0;
      else control.value = "";
    });
  }

  function focusFirstAnswerInput() {
    if (state.publicQ && state.publicQ.type === "multi") {
      const first = getMultiInputs()[0];
      if (first) first.focus();
      return;
    }
    els.input.focus();
  }

  function loadQuestion() {
    resetUI();
    els.next.textContent = t("btn_next");

    if (state.mode !== "finalboss") {
      hideBossFace();
    } else if (!bossFightActive()) {
      // Between runs / after win-fail — keep face hidden until a new fight starts.
      if (state.boss.status !== "won") hideBossFace();
    }

    let topic = null;
    // After a boss defeat, drill only the missed topic until it is remastered.
    const drillTopic =
      state.mode !== "finalboss" && P.syncBossDrillTopic
        ? P.syncBossDrillTopic()
        : null;
    if (drillTopic) {
      topic = drillTopic;
      state.mode = drillTopic;
      setModeButtons();
    } else if (state.mode === "finalboss") {
      if (!state.boss.active || state.boss.status === "failed" || state.boss.status === "won") {
        // Resume a saved mid-fight run after refresh / leaving the mode.
        if (!restoreBossRunFromStorage()) {
          startBossRun();
          els.feedback.hidden = false;
          els.feedback.className = "feedback ok";
          // Real fights never use practice copy.
          els.feedback.textContent = state.boss.real
            ? t("boss_start")
            : t("boss_start_practice");
        } else {
          setBossFace("😈");
          updateFinalBossButton(P.getProgressView());
          els.feedback.hidden = false;
          els.feedback.className = "feedback ok";
          if (state.boss.index > 0) {
            els.feedback.textContent = t("boss_ok", {
              current: state.boss.index,
              total: state.boss.queue.length,
            });
          } else {
            els.feedback.textContent = state.boss.real
              ? t("boss_start")
              : t("boss_start_practice");
          }
        }
      }
      topic = state.boss.queue[state.boss.index];
    } else if (state.mode === "smart") {
      topic = P.pickSmartTopic(state.lastTopic);
    } else if (state.mode === "all") {
      topic = P.pickAllTopic(state.lastTopic);
    } else if (state.mode === "flashcards") {
      topic = "flashcards";
    } else {
      topic = state.mode;
    }

    if (!topic) {
      els.prompt.textContent = t("loading");
      els.topic.textContent =
        state.mode === "finalboss" ? t("mode_finalboss") : t("mode_smart");
      els.check.hidden = true;
      els.skip.hidden = true;
      if (els.remix) els.remix.hidden = true;
      hideHintControls();
      return;
    }

    if (Q.setBossTheme) Q.setBossTheme(state.mode === "finalboss");
    const full = Q.generateQuestion(topic);
    showQuestion(full);
    // After a question loads (e.g. post-mastery Next), offer the boss fight.
    if (state.mode !== "finalboss") {
      maybePromptBossFight();
    }
  }

  function loadRemix() {
    if (!state.fullQuestion) {
      loadQuestion();
      return;
    }
    // Abandon current item without skip penalty — intentional reshuffle.
    resetUI();
    if (Q.setBossTheme) Q.setBossTheme(state.mode === "finalboss");
    const full = Q.remixQuestion(state.fullQuestion);
    showQuestion(full);
  }

  function showQuestion(full) {
    const pub = Q.publicQuestion(full);
    state.fullQuestion = full;
    state.publicQ = pub;
    if (full && full.topic) state.lastTopic = full.topic;

    els.topic.textContent =
      state.mode === "flashcards"
        ? t("mode_flashcards")
        : state.mode === "finalboss"
          ? t("boss_progress", {
              current: state.boss.index + 1,
              total: state.boss.queue.length,
              topic: pub.topic_label,
            })
          : pub.topic_label;
    if (bossFightActive()) {
      setBossFace("😈");
    } else if (state.mode !== "finalboss" || state.boss.status !== "won") {
      hideBossFace();
    }
    els.prompt.textContent = pub.prompt;
    els.hint1.textContent = pub.hint1 || "";
    els.hint2.textContent = pub.hint2 || "";
    els.hint3ti.textContent = pub.hint3_ti || "";
    els.hint3casio.textContent = pub.hint3_casio || "";

    if (pub.has_hint1 && state.mode !== "finalboss") {
      els.hint1Btn.hidden = false;
    } else if (pub.has_hint2 && state.mode !== "finalboss") {
      els.hint2Btn.hidden = false;
    } else if (pub.has_hint3 && state.mode !== "finalboss") {
      showCalcButtons(false);
    }
    // Clarification is available outside the Final Boss gauntlet.
    if (els.clarifyBtn && pub.has_clarify && state.mode !== "finalboss") {
      els.clarifyBtn.hidden = false;
    }

    if (state.mode === "finalboss") {
      // No remix/skip during boss — especially the real defense of Zarahemla.
      if (els.remix) els.remix.hidden = true;
      els.skip.hidden = true;
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
    } else if (pub.type === "multi") {
      els.form.hidden = false;
      els.check.hidden = false;
      renderMultiFields(pub);
    } else {
      els.form.hidden = false;
      els.check.hidden = false;
      els.unit.textContent = pub.unit || "";
      if (pub.placeholder) els.input.placeholder = pub.placeholder;
      focusFirstAnswerInput();
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
    setInputsDisabled(true);
    if (state.publicQ && state.publicQ.type === "mc") {
      [...els.choices.children].forEach((btn) => {
        btn.disabled = true;
      });
    }
  }

  function beginRetry(result) {
    state.retryPhase = true;
    state.remixAfterFail = true;
    state.lastExpected = result.expected;
    els.feedback.className = "feedback no";
    const tip =
      result.hint ||
      state.publicQ?.hint1 ||
      state.publicQ?.hint2 ||
      "";
    const progress = `${result.unaided_correct}/${result.unaided_needed}`;
    let masteryNote = "";
    if (result.mastery_delta < 0) {
      masteryNote = t("feedback_note_mastery_drop", { progress: progress });
    }
    els.feedback.textContent =
      t("feedback_wrong_retry") +
      masteryNote +
      (tip ? t("feedback_wrong_hint", { hint: tip }) : "");
    showHintsAfterMiss();

    els.next.hidden = true;
    els.skip.hidden = false;
    els.skip.textContent = t("btn_skip_retry");
    if (els.remix) els.remix.hidden = false;
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
      clearAnswerInputs();
      setInputsDisabled(false);
      focusFirstAnswerInput();
    }
  }

  function finishAfterRetry(ok, expected) {
    state.retryPhase = false;
    if (ok) state.remixAfterFail = false;
    state.answered = true;
    lockInputs();
    els.skip.hidden = true;
    els.skip.textContent = t("btn_skip");
    if (els.remix) els.remix.hidden = true;
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
    if (els.remix) els.remix.hidden = true;
    els.check.hidden = true;
    setInputsDisabled(true);
    hideHintControls();

    // Final Boss: miss knocks 1 mastery off that topic, then remix same question to continue.
    if (state.mode === "finalboss" && state.boss.active) {
      const [ok, expected] = Q.checkAnswer(state.fullQuestion, answer);
      els.feedback.hidden = false;
      if (state.publicQ.type === "mc") {
        [...els.choices.children].forEach((btn) => {
          btn.disabled = true;
          if (ok && btn.textContent === expected) btn.classList.add("right");
          if (!ok && btn.textContent === String(answer)) btn.classList.add("wrong");
        });
      }
      if (!ok || state.hintsUsed > 0) {
        bossMissAndRemix();
        return;
      }
      advanceBossAfterCorrect();
      return;
    }

    const result = P.recordAnswer(state.fullQuestion, answer, state.hintsUsed);
    els.feedback.hidden = false;

    if (result.correct) {
      state.remixAfterFail = false;
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
      const masteredNote = result.just_mastered ? t("feedback_mastered") : "";
      els.feedback.textContent = t("feedback_correct", {
        credit: creditPct,
        note: note,
        streak: result.streak,
        progress: progress,
        mastered: masteredNote,
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
    submitAnswer(getAnswerPayload());
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

  if (els.remix) {
    els.remix.addEventListener("click", () => {
      if (state.retryPhase) {
        // Miss already recorded; reshuffle without the 0% skip finish.
        state.retryPhase = false;
      }
      loadRemix();
    });
  }

  function goToNextQuestion() {
    if (state.mode === "finalboss" && state.boss.status === "won") {
      state.boss.status = null;
    }
    // After a miss (and failed/skipped retry), drill the same problem type.
    if (
      state.remixAfterFail &&
      state.mode !== "finalboss" &&
      state.fullQuestion &&
      typeof state.fullQuestion._gen === "function"
    ) {
      state.remixAfterFail = false;
      loadRemix();
      return;
    }
    state.remixAfterFail = false;
    loadQuestion();
  }

  document.querySelectorAll(".topic[data-topic]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const nextMode = btn.dataset.topic;
      state.remixAfterFail = false;

      // Leaving an active fight pauses it (progress is persisted).
      if (bossFightActive() && nextMode !== "finalboss") {
        state.mode = nextMode;
        setModeButtons();
        loadQuestion();
        return;
      }

      if (nextMode === "finalboss") {
        const drill = P.syncBossDrillTopic && P.syncBossDrillTopic();
        if (drill && !restoreBossRunFromStorage()) {
          // Remaster the missed topic before starting a new fight.
          state.mode = drill;
          setModeButtons();
          loadQuestion();
          els.feedback.hidden = false;
          els.feedback.className = "feedback no";
          els.feedback.textContent = t("boss_drill_blocked", {
            topic: Q.TOPICS[drill] || drill,
          });
          return;
        }
        if (!restoreBossRunFromStorage()) {
          state.boss = { active: false, queue: [], index: 0, status: null, real: false };
        }
        state.mode = "finalboss";
      } else {
        const drill = P.syncBossDrillTopic && P.syncBossDrillTopic();
        // While rebuilding after a defeat, stay on the missed topic only.
        state.mode = drill || nextMode;
      }
      setModeButtons();
      loadQuestion();
    });
  });

  els.next.addEventListener("click", () => {
    goToNextQuestion();
  });
  els.skip.addEventListener("click", () => {
    if (state.mode === "finalboss" && state.boss.active) {
      failBoss();
      return;
    }
    if (state.retryPhase) {
      finishAfterRetry(false, state.lastExpected);
      return;
    }
    if (state.fullQuestion && state.hintsUsed > 0 && !state.answered) {
      P.recordHintSkip(state.fullQuestion, state.hintsUsed);
      refreshProgress();
    }
    state.remixAfterFail = false;
    loadQuestion();
  });

  els.reset.addEventListener("click", () => {
    if (!confirm(t("reset_confirm"))) return;
    P.reset();
    els.topicList.innerHTML = "";
    refreshProgress();
    loadQuestion();
  });

  if (els.bossInviteFight) {
    els.bossInviteFight.addEventListener("click", acceptBossInvite);
  }
  if (els.bossInviteLater) {
    els.bossInviteLater.addEventListener("click", dismissBossInvite);
  }
  if (els.bossInviteClose) {
    els.bossInviteClose.addEventListener("click", dismissBossInvite);
  }
  if (els.bossInviteBackdrop) {
    els.bossInviteBackdrop.addEventListener("click", dismissBossInvite);
  }
  if (els.bossRetreatOk) {
    els.bossRetreatOk.addEventListener("click", finishBossRetreat);
  }
  if (els.bossRetreatClose) {
    els.bossRetreatClose.addEventListener("click", finishBossRetreat);
  }
  if (els.bossRetreatBackdrop) {
    els.bossRetreatBackdrop.addEventListener("click", finishBossRetreat);
  }

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

  // --- Scratch notes (persisted) + dataset tools ----------------------------
  const NOTES_KEY = "mat107-assessment1-notes";

  function persistNotes() {
    if (!els.notes) return;
    try {
      localStorage.setItem(NOTES_KEY, els.notes.value);
    } catch (e) {
      /* ignore */
    }
  }

  function setNotesStatus(msg, empty) {
    if (!els.notesStatus) return;
    if (!msg) {
      els.notesStatus.hidden = true;
      els.notesStatus.textContent = "";
      return;
    }
    els.notesStatus.hidden = false;
    els.notesStatus.textContent = msg;
    els.notesStatus.classList.toggle("empty", Boolean(empty));
  }

  function parseNoteNumbers(text) {
    const re = /-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
    const out = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      const n = parseFloat(m[0]);
      if (!isNaN(n) && isFinite(n)) out.push(n);
    }
    return out;
  }

  function formatNoteNumber(n) {
    if (Number.isInteger(n)) return String(n);
    const s = String(Math.round(n * 1e10) / 1e10);
    return s;
  }

  function notesTarget() {
    const ta = els.notes;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (typeof start === "number" && typeof end === "number" && end > start) {
      return {
        mode: "selection",
        start: start,
        end: end,
        text: ta.value.slice(start, end),
      };
    }
    return { mode: "all", start: 0, end: ta.value.length, text: ta.value };
  }

  function replaceNotesTarget(target, replacement) {
    const ta = els.notes;
    const before = ta.value.slice(0, target.start);
    const after = ta.value.slice(target.end);
    ta.value = before + replacement + after;
    const caret = before.length + replacement.length;
    ta.focus();
    ta.setSelectionRange(before.length, caret);
    persistNotes();
  }

  function notesSumOf(nums) {
    return nums.reduce(function (a, b) {
      return a + b;
    }, 0);
  }

  function updateNotesStatusFrom(nums) {
    if (!nums.length) {
      setNotesStatus(t("notes_status_empty"), true);
      return;
    }
    setNotesStatus(
      t("notes_status", {
        n: nums.length,
        sum: formatNoteNumber(notesSumOf(nums)),
      })
    );
  }

  function sortNumbersInPlace(text, desc) {
    const re = /-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
    const nums = [];
    let m;
    const finder = new RegExp(re.source, "gi");
    while ((m = finder.exec(text)) !== null) {
      const n = parseFloat(m[0]);
      if (!isNaN(n) && isFinite(n)) nums.push(n);
    }
    if (!nums.length) return null;
    const sorted = nums.slice().sort(function (a, b) {
      return desc ? b - a : a - b;
    });
    let i = 0;
    const out = text.replace(re, function () {
      return formatNoteNumber(sorted[i++]);
    });
    return { text: out, nums: sorted };
  }

  function notesSort(desc) {
    if (!els.notes) return;
    const target = notesTarget();
    const result = sortNumbersInPlace(target.text, desc);
    if (!result) {
      setNotesStatus(t("notes_status_empty"), true);
      return;
    }
    replaceNotesTarget(target, result.text);
    updateNotesStatusFrom(result.nums);
  }

  function notesAppendSum() {
    if (!els.notes) return;
    const target = notesTarget();
    const nums = parseNoteNumbers(target.text);
    if (!nums.length) {
      setNotesStatus(t("notes_status_empty"), true);
      return;
    }
    const line = t("notes_sum_line", {
      n: nums.length,
      sum: formatNoteNumber(notesSumOf(nums)),
    });
    const base = target.mode === "selection" ? target.text : els.notes.value;
    const joined = (base.replace(/\s+$/, "") + "\n" + line).replace(/^\n/, "");
    replaceNotesTarget(target, joined);
    updateNotesStatusFrom(nums);
  }

  function notesAppendUnique() {
    if (!els.notes) return;
    const target = notesTarget();
    const nums = parseNoteNumbers(target.text);
    if (!nums.length) {
      setNotesStatus(t("notes_status_empty"), true);
      return;
    }
    const freq = {};
    const order = [];
    nums.forEach(function (n) {
      const key = formatNoteNumber(n);
      if (!Object.prototype.hasOwnProperty.call(freq, key)) {
        freq[key] = 0;
        order.push(key);
      }
      freq[key] += 1;
    });
    order.sort(function (a, b) {
      return parseFloat(a) - parseFloat(b);
    });
    const list = order
      .map(function (k) {
        return k + (freq[k] > 1 ? "×" + freq[k] : "");
      })
      .join(", ");
    const line = t("notes_unique_line", { list: list });
    const base = target.mode === "selection" ? target.text : els.notes.value;
    const joined = (base.replace(/\s+$/, "") + "\n" + line).replace(/^\n/, "");
    replaceNotesTarget(target, joined);
    updateNotesStatusFrom(nums);
  }

  if (els.notes) {
    try {
      els.notes.value = localStorage.getItem(NOTES_KEY) || "";
    } catch (e) {
      /* ignore */
    }
    els.notes.addEventListener("input", persistNotes);
  }
  if (els.notesSortAsc) {
    els.notesSortAsc.addEventListener("click", () => notesSort(false));
  }
  if (els.notesSortDesc) {
    els.notesSortDesc.addEventListener("click", () => notesSort(true));
  }
  if (els.notesSum) {
    els.notesSum.addEventListener("click", notesAppendSum);
  }
  if (els.notesUnique) {
    els.notesUnique.addEventListener("click", notesAppendUnique);
  }

  // --- Floating calculator (draggable / dockable) ---------------------------
  const calcState = {
    display: "0",
    left: null,
    op: null,
    fresh: true,
  };

  const calcUi = {
    x: null,
    y: null,
    dock: null, // null | "left" | "right"
    dragging: false,
    grabX: 0,
    grabY: 0,
  };

  const CALC_SNAP = 36;

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

  function calcPanelSize() {
    const el = els.calcModal;
    if (!el) return { w: 320, h: 420 };
    return {
      w: el.offsetWidth || 320,
      h: el.offsetHeight || 420,
    };
  }

  function defaultCalcPosition() {
    const { w, h } = calcPanelSize();
    calcUi.x = Math.max(12, window.innerWidth - w - 16);
    calcUi.y = Math.max(12, Math.min(120, window.innerHeight - h - 16));
    calcUi.dock = null;
  }

  function applyCalcPosition() {
    const el = els.calcModal;
    if (!el || el.hidden) return;
    const { w, h } = calcPanelSize();
    const maxX = Math.max(0, window.innerWidth - w);
    const maxY = Math.max(0, window.innerHeight - h);

    if (calcUi.x == null || calcUi.y == null) defaultCalcPosition();

    if (calcUi.dock === "left") {
      calcUi.x = 0;
    } else if (calcUi.dock === "right") {
      calcUi.x = maxX;
    } else {
      calcUi.x = Math.min(maxX, Math.max(0, calcUi.x));
    }
    calcUi.y = Math.min(maxY, Math.max(0, calcUi.y));

    el.classList.toggle("is-docked-left", calcUi.dock === "left");
    el.classList.toggle("is-docked-right", calcUi.dock === "right");
    el.style.left = calcUi.x + "px";
    el.style.top = calcUi.y + "px";
    el.style.right = "auto";
    el.style.bottom = "auto";
  }

  function snapCalcDock() {
    const { w } = calcPanelSize();
    const maxX = Math.max(0, window.innerWidth - w);
    if (calcUi.x <= CALC_SNAP) {
      calcUi.dock = "left";
      calcUi.x = 0;
    } else if (calcUi.x >= maxX - CALC_SNAP) {
      calcUi.dock = "right";
      calcUi.x = maxX;
    } else {
      calcUi.dock = null;
    }
  }

  function openCalcModal() {
    if (!els.calcModal) return;
    els.calcModal.hidden = false;
    if (calcUi.x == null || calcUi.y == null) defaultCalcPosition();
    applyCalcPosition();
    calcRender();
  }

  function closeCalcModal() {
    if (!els.calcModal) return;
    els.calcModal.hidden = true;
    els.calcModal.classList.remove("is-dragging");
    calcUi.dragging = false;
  }

  if (els.calcOpen) {
    els.calcOpen.addEventListener("click", openCalcModal);
  }
  if (els.calcClose) {
    els.calcClose.addEventListener("click", closeCalcModal);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (els.bossRetreatModal && !els.bossRetreatModal.hidden) {
      finishBossRetreat();
      return;
    }
    if (els.bossInviteModal && !els.bossInviteModal.hidden) {
      dismissBossInvite();
      return;
    }
    if (els.calcModal && !els.calcModal.hidden) {
      closeCalcModal();
    }
  });
  window.addEventListener("resize", () => {
    if (els.calcModal && !els.calcModal.hidden) applyCalcPosition();
  });

  const calcHandle = document.getElementById("calc-drag-handle");
  if (calcHandle && els.calcModal) {
    calcHandle.addEventListener("pointerdown", (e) => {
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest && e.target.closest("button")) return;
      const rect = els.calcModal.getBoundingClientRect();
      calcUi.dragging = true;
      calcUi.dock = null;
      calcUi.grabX = e.clientX - rect.left;
      calcUi.grabY = e.clientY - rect.top;
      els.calcModal.classList.add("is-dragging");
      calcHandle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    calcHandle.addEventListener("pointermove", (e) => {
      if (!calcUi.dragging) return;
      calcUi.x = e.clientX - calcUi.grabX;
      calcUi.y = e.clientY - calcUi.grabY;
      applyCalcPosition();
    });
    function endCalcDrag(e) {
      if (!calcUi.dragging) return;
      calcUi.dragging = false;
      els.calcModal.classList.remove("is-dragging");
      try {
        calcHandle.releasePointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
      snapCalcDock();
      applyCalcPosition();
    }
    calcHandle.addEventListener("pointerup", endCalcDrag);
    calcHandle.addEventListener("pointercancel", endCalcDrag);
  }

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
    hideBossFace();
    if (restoreBossRunFromStorage()) {
      state.mode = "finalboss";
    }
    refreshProgress();
    setModeButtons();
    loadQuestion();
  }

  if (I18n && I18n.ready && typeof I18n.ready.then === "function") {
    I18n.ready.then(start);
  } else {
    start();
  }
})();
