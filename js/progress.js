/* MAT107 progress — localStorage */
(function () {
  const STORAGE_KEY = "mat107-assessment1-progress";
  const Q = window.QuizQuestions;
  const UNAIDED = Q.UNAIDED_TO_MASTER || 10;

  function emptyTopic(label) {
    return {
      correct: 0,
      attempted: 0,
      credit: 0,
      unaided_correct: 0,
      label: label,
    };
  }

  function emptyProgress() {
    const topics = {};
    Object.keys(Q.TOPICS).forEach((key) => {
      topics[key] = emptyTopic(Q.TOPICS[key]);
    });
    return {
      total_correct: 0,
      total_attempted: 0,
      total_credit: 0,
      total_unaided_correct: 0,
      streak: 0,
      best_streak: 0,
      topics: topics,
      history: [],
      updated_at: null,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyProgress();
      const data = JSON.parse(raw);
      data.total_credit = data.total_credit != null ? data.total_credit : data.total_correct || 0;
      data.total_unaided_correct = data.total_unaided_correct || 0;
      Object.keys(Q.TOPICS).forEach((key) => {
        const t = data.topics[key] || emptyTopic(Q.TOPICS[key]);
        t.label = Q.TOPICS[key];
        t.credit = t.credit != null ? t.credit : t.correct || 0;
        t.unaided_correct = t.unaided_correct || 0;
        data.topics[key] = t;
      });
      return data;
    } catch (e) {
      return emptyProgress();
    }
  }

  function save(data) {
    data.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function gradeAccuracy(credit, attempted) {
    if (!attempted) return 0;
    return Math.round((1000 * credit) / attempted) / 10;
  }

  function topicMastery(unaided) {
    return Math.round((1000 * Math.min(unaided, UNAIDED)) / UNAIDED) / 10;
  }

  function isMastered(unaided) {
    return unaided >= UNAIDED;
  }

  function getProgressView() {
    const p = load();
    const topics = {};
    let masteredCount = 0;
    let unaidedSum = 0;
    Object.keys(p.topics).forEach((key) => {
      const info = p.topics[key];
      const unaided = info.unaided_correct || 0;
      unaidedSum += Math.min(unaided, UNAIDED);
      const mastered = isMastered(unaided);
      if (mastered) masteredCount += 1;
      topics[key] = {
        ...info,
        unaided_correct: unaided,
        unaided_needed: UNAIDED,
        mastery: topicMastery(unaided),
        mastered: mastered,
        label: Q.TOPICS[key] || info.label,
      };
    });
    const topicCount = Object.keys(Q.TOPICS).length;
    const overallNeeded = topicCount * UNAIDED;
    const overallMastery =
      overallNeeded > 0
        ? Math.round((1000 * unaidedSum) / overallNeeded) / 10
        : 0;
    return {
      total_correct: p.total_correct,
      total_attempted: p.total_attempted,
      total_credit: Math.round(p.total_credit * 100) / 100,
      total_unaided_correct: p.total_unaided_correct || 0,
      accuracy: gradeAccuracy(p.total_credit, p.total_attempted),
      streak: p.streak,
      best_streak: p.best_streak,
      mastered_topics: masteredCount,
      topic_count: topicCount,
      overall_mastery: overallMastery,
      unaided_to_master: UNAIDED,
      topics: topics,
      history: (p.history || []).slice(-20),
      updated_at: p.updated_at,
    };
  }

  function pickSmartTopic(avoidTopic) {
    const p = load();
    const keys = Object.keys(Q.TOPICS);
    const weights = keys.map((t) => {
      const info = p.topics[t] || { unaided_correct: 0, attempted: 0 };
      const remaining = Math.max(UNAIDED - (info.unaided_correct || 0), 0);
      // Prioritize gaps, but keep rotation lively with jitter.
      let w = remaining * 8 + (info.attempted < 3 ? 12 : 0) + Math.random() * 6;
      if (remaining === 0) w = 2 + Math.random() * 2;
      // Strongly prefer switching away from the topic just practiced.
      if (avoidTopic && t === avoidTopic) w *= 0.08;
      return Math.max(w, 0.5);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < keys.length; i++) {
      r -= weights[i];
      if (r <= 0) return keys[i];
    }
    return keys[keys.length - 1];
  }

  /** Adjust topic mastery counter; never below 0. Returns actual delta applied. */
  function adjustUnaided(p, topic, delta) {
    if (!p.topics[topic]) p.topics[topic] = emptyTopic(Q.TOPICS[topic] || topic);
    const prev = p.topics[topic].unaided_correct || 0;
    let next = Math.max(0, prev + delta);
    // Once a topic is mastered, keep it mastered — one miss/hint must not un-master.
    if (delta < 0 && prev >= UNAIDED) {
      next = Math.max(next, UNAIDED);
    }
    const applied = next - prev;
    p.topics[topic].unaided_correct = next;
    p.total_unaided_correct = Math.max(
      0,
      (p.total_unaided_correct || 0) + applied
    );
    return applied;
  }

  function recordAnswer(question, userAnswer, hintsUsed) {
    hintsUsed = Math.max(0, Math.min(3, hintsUsed | 0));
    const [ok, expected] = Q.checkAnswer(question, userAnswer);
    const credit = ok ? Q.HINT_CREDIT[hintsUsed] ?? 0.25 : 0;
    const p = load();
    const topic = question.topic;

    p.total_attempted += 1;
    p.total_credit = (p.total_credit || 0) + credit;
    if (!p.topics[topic]) p.topics[topic] = emptyTopic(Q.TOPICS[topic] || topic);
    p.topics[topic].attempted += 1;
    p.topics[topic].credit = (p.topics[topic].credit || 0) + credit;

    let masteryDelta = 0;
    if (ok) {
      p.total_correct += 1;
      p.topics[topic].correct += 1;
      if (hintsUsed === 0) {
        p.streak += 1;
        p.best_streak = Math.max(p.best_streak || 0, p.streak);
        masteryDelta = adjustUnaided(p, topic, 1);
      } else {
        p.streak = 0;
        masteryDelta = adjustUnaided(p, topic, -1);
      }
    } else {
      p.streak = 0;
      if (hintsUsed > 0) {
        masteryDelta = adjustUnaided(p, topic, -1);
      }
    }

    const unaided = p.topics[topic].unaided_correct || 0;
    const mastered = isMastered(unaided);

    p.history = p.history || [];
    p.history.push({
      at: new Date().toISOString(),
      topic: topic,
      correct: ok,
      hints_used: hintsUsed,
      credit: credit,
      mastery_delta: masteryDelta,
      prompt: String(question.prompt).slice(0, 120),
    });
    p.history = p.history.slice(-100);
    save(p);

    // Notes are assembled with i18n in the UI (app.js).
    return {
      correct: ok,
      expected: expected,
      credit: credit,
      hints_used: hintsUsed,
      hint: question.hint || "",
      streak: p.streak,
      unaided_correct: unaided,
      unaided_needed: UNAIDED,
      topic_mastery: topicMastery(unaided),
      mastered: mastered,
      mastery_delta: masteryDelta,
      just_mastered: Boolean(ok && hintsUsed === 0 && mastered && unaided === UNAIDED),
      note: "",
    };
  }

  /** Skip after opening hints: same mastery penalty as answering with help. */
  function recordHintSkip(question, hintsUsed) {
    hintsUsed = Math.max(0, Math.min(3, hintsUsed | 0));
    if (!question || hintsUsed <= 0) {
      return { mastery_delta: 0, unaided_correct: 0, unaided_needed: UNAIDED };
    }
    const p = load();
    const topic = question.topic;
    if (!p.topics[topic]) p.topics[topic] = emptyTopic(Q.TOPICS[topic] || topic);
    const masteryDelta = adjustUnaided(p, topic, -1);
    p.streak = 0;
    p.history = p.history || [];
    p.history.push({
      at: new Date().toISOString(),
      topic: topic,
      correct: false,
      hints_used: hintsUsed,
      credit: 0,
      skipped: true,
      mastery_delta: masteryDelta,
      prompt: String(question.prompt).slice(0, 120),
    });
    p.history = p.history.slice(-100);
    save(p);
    const unaided = p.topics[topic].unaided_correct || 0;
    return {
      mastery_delta: masteryDelta,
      unaided_correct: unaided,
      unaided_needed: UNAIDED,
      topic_mastery: topicMastery(unaided),
      mastered: isMastered(unaided),
    };
  }

  /** After a recorded miss, award recovery credit without a new attempt. */
  function awardRetryCredit(question) {
    const credit = Q.RETRY_CREDIT != null ? Q.RETRY_CREDIT : 0.05;
    const p = load();
    const topic = question.topic;
    if (!p.topics[topic]) p.topics[topic] = emptyTopic(Q.TOPICS[topic] || topic);
    p.total_credit = (p.total_credit || 0) + credit;
    p.total_correct = (p.total_correct || 0) + 1;
    p.topics[topic].credit = (p.topics[topic].credit || 0) + credit;
    p.topics[topic].correct = (p.topics[topic].correct || 0) + 1;
    // No unaided / streak bump — recovery never counts toward mastery.
    p.history = p.history || [];
    p.history.push({
      at: new Date().toISOString(),
      topic: topic,
      correct: true,
      hints_used: -1,
      credit: credit,
      retry: true,
      prompt: String(question.prompt).slice(0, 120),
    });
    p.history = p.history.slice(-100);
    save(p);
    const unaided = p.topics[topic].unaided_correct || 0;
    return {
      correct: true,
      credit: credit,
      streak: p.streak,
      unaided_correct: unaided,
      unaided_needed: UNAIDED,
      mastered: isMastered(unaided),
    };
  }

  function reset() {
    save(emptyProgress());
  }

  function exportProgress() {
    const p = load();
    return {
      format: "mat107-assessment1-progress",
      version: 1,
      exported_at: new Date().toISOString(),
      progress: p,
    };
  }

  function importProgress(raw) {
    let data = raw;
    if (typeof raw === "string") data = JSON.parse(raw);
    if (!data || typeof data !== "object") {
      throw new Error("Invalid progress file");
    }
    const p = data.progress && typeof data.progress === "object" ? data.progress : data;
    if (typeof p.total_attempted !== "number" || !p.topics || typeof p.topics !== "object") {
      throw new Error("Invalid progress data");
    }
    // Normalize against current topic list
    const next = emptyProgress();
    next.total_correct = p.total_correct || 0;
    next.total_attempted = p.total_attempted || 0;
    next.total_credit = p.total_credit != null ? p.total_credit : p.total_correct || 0;
    next.total_unaided_correct = p.total_unaided_correct || 0;
    next.streak = p.streak || 0;
    next.best_streak = p.best_streak || 0;
    next.history = Array.isArray(p.history) ? p.history.slice(-100) : [];
    Object.keys(Q.TOPICS).forEach((key) => {
      const src = (p.topics && p.topics[key]) || {};
      next.topics[key] = {
        correct: src.correct || 0,
        attempted: src.attempted || 0,
        credit: src.credit != null ? src.credit : src.correct || 0,
        unaided_correct: src.unaided_correct || 0,
        label: Q.TOPICS[key],
      };
    });
    save(next);
    return next;
  }

  function downloadProgressFile(filename) {
    const payload = exportProgress();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const stamp = new Date().toISOString().slice(0, 10);
    const name = filename || "mat107-progress-" + stamp + ".json";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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

  window.QuizProgress = {
    getProgressView: getProgressView,
    pickSmartTopic: pickSmartTopic,
    recordAnswer: recordAnswer,
    recordHintSkip: recordHintSkip,
    awardRetryCredit: awardRetryCredit,
    reset: reset,
    exportProgress: exportProgress,
    importProgress: importProgress,
    downloadProgressFile: downloadProgressFile,
    STORAGE_KEY: STORAGE_KEY,
  };
})();
