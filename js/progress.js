/* MAT107 progress — localStorage */
(function () {
  const STORAGE_KEY = "mat107-assessment1-progress";
  const Q = window.QuizQuestions;
  /** Mastery badge threshold (display denominator). */
  const MASTER = Q.UNAIDED_TO_MASTER || 10;
  /** Full lock threshold (keep practicing past mastery). */
  const LOCK_AT = Q.UNAIDED_TO_LOCK || 20;
  /** Hits to break a full lock → drop to MASTER - 1 (9/10). */
  const LOCK_GRACE = Q.MASTER_LOCK_GRACE != null ? Q.MASTER_LOCK_GRACE : 3;

  function emptyTopic(label) {
    return {
      correct: 0,
      attempted: 0,
      credit: 0,
      unaided_correct: 0,
      mastered: false,
      lock_strikes: 0,
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
      final_boss_cleared: false,
      final_boss_cleared_at: null,
      updated_at: null,
    };
  }

  function syncMasteredFlag(rec) {
    const n = Number(rec.unaided_correct) || 0;
    rec.mastered = n >= MASTER;
    if (n < LOCK_AT) rec.lock_strikes = 0;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyProgress();
      const data = JSON.parse(raw);
      data.total_credit = data.total_credit != null ? data.total_credit : data.total_correct || 0;
      data.total_unaided_correct = data.total_unaided_correct || 0;
      data.final_boss_cleared = Boolean(data.final_boss_cleared);
      data.final_boss_cleared_at = data.final_boss_cleared_at || null;
      Object.keys(Q.TOPICS).forEach((key) => {
        const t = data.topics[key] || emptyTopic(Q.TOPICS[key]);
        t.label = Q.TOPICS[key];
        t.credit = t.credit != null ? t.credit : t.correct || 0;
        t.unaided_correct = Number(t.unaided_correct) || 0;
        t.lock_strikes = Number(t.lock_strikes) || 0;
        // Cap at full lock; keep mastered only when >= 10.
        if (t.unaided_correct > LOCK_AT) t.unaided_correct = LOCK_AT;
        syncMasteredFlag(t);
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

  /** Pie / % mastery is out of 10 (lock buffer beyond 10 still reads 100%). */
  function topicMastery(unaided) {
    return Math.round((1000 * Math.min(unaided, MASTER)) / MASTER) / 10;
  }

  function isMastered(unaided) {
    return (Number(unaided) || 0) >= MASTER;
  }

  function isLocked(unaided) {
    return (Number(unaided) || 0) >= LOCK_AT;
  }

  function getProgressView() {
    const p = load();
    const topics = {};
    let masteredCount = 0;
    let unaidedSum = 0;
    Object.keys(p.topics).forEach((key) => {
      const info = p.topics[key];
      const unaided = Number(info.unaided_correct) || 0;
      unaidedSum += Math.min(unaided, MASTER);
      const mastered = isMastered(unaided);
      if (mastered) masteredCount += 1;
      topics[key] = {
        ...info,
        unaided_correct: unaided,
        unaided_needed: MASTER,
        lock_at: LOCK_AT,
        locked: isLocked(unaided),
        lock_strikes: Number(info.lock_strikes) || 0,
        mastery: topicMastery(unaided),
        mastered: mastered,
        label: Q.TOPICS[key] || info.label,
      };
    });
    const topicCount = Object.keys(Q.TOPICS).length;
    const overallNeeded = topicCount * MASTER;
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
      unaided_to_master: MASTER,
      unaided_to_lock: LOCK_AT,
      lock_grace: LOCK_GRACE,
      all_locked: allTopicsLocked(),
      all_mastered: allTopicsMastered(),
      final_boss_cleared: Boolean(p.final_boss_cleared),
      final_boss_cleared_at: p.final_boss_cleared_at || null,
      topics: topics,
      history: (p.history || []).slice(-20),
      updated_at: p.updated_at,
    };
  }

  function allTopicsLocked() {
    const p = load();
    const keys = Object.keys(Q.TOPICS);
    if (!keys.length) return false;
    return keys.every(function (t) {
      return (Number((p.topics[t] || {}).unaided_correct) || 0) >= LOCK_AT;
    });
  }

  function allTopicsMastered() {
    const p = load();
    const keys = Object.keys(Q.TOPICS);
    if (!keys.length) return false;
    return keys.every(function (t) {
      return (Number((p.topics[t] || {}).unaided_correct) || 0) >= MASTER;
    });
  }

  function markFinalBossCleared() {
    const p = load();
    p.final_boss_cleared = true;
    p.final_boss_cleared_at = new Date().toISOString();
    save(p);
    return p;
  }

  /** Boss fail: only the missed topic drops just below lock (20 → 19). */
  function penalizeBossFail(topic) {
    const p = load();
    const droppedTo = LOCK_AT - 1; // 19 — mastered, but lock broken
    if (!topic || !Q.TOPICS[topic]) {
      return { dropped_to: droppedTo, topic: null, topics_affected: 0 };
    }
    if (!p.topics[topic]) p.topics[topic] = emptyTopic(Q.TOPICS[topic]);
    const rec = p.topics[topic];
    const prev = Number(rec.unaided_correct) || 0;
    if (prev >= LOCK_AT) {
      rec.unaided_correct = droppedTo;
      rec.lock_strikes = 0;
      syncMasteredFlag(rec);
      p.total_unaided_correct = Math.max(
        0,
        (p.total_unaided_correct || 0) + (droppedTo - prev)
      );
      save(p);
      return { dropped_to: droppedTo, topic: topic, topics_affected: 1 };
    }
    save(p);
    return { dropped_to: droppedTo, topic: topic, topics_affected: 0 };
  }

  function shuffleTopics() {
    const keys = Object.keys(Q.TOPICS).slice();
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = keys[i];
      keys[i] = keys[j];
      keys[j] = tmp;
    }
    return keys;
  }

  function pickSmartTopic(avoidTopic) {
    const p = load();
    const keys = Object.keys(Q.TOPICS).filter(function (t) {
      const n = Number((p.topics[t] || {}).unaided_correct) || 0;
      return n < LOCK_AT; // skip fully locked subjects
    });
    if (!keys.length) return null;
    const weights = keys.map((t) => {
      const info = p.topics[t] || { unaided_correct: 0, attempted: 0 };
      const remaining = Math.max(MASTER - (info.unaided_correct || 0), 0);
      let w = remaining * 8 + (info.attempted < 3 ? 12 : 0) + Math.random() * 6;
      if (remaining === 0) w = 2 + Math.random() * 2;
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

  /**
   * Lock-in mode: focus topics that are mastered (10+) but not fully locked (20).
   * Never serves fully locked subjects. Falls back to near-mastery topics.
   * Returns null when every topic is locked at 20.
   */
  function pickLockInTopic(avoidTopic) {
    const p = load();
    const soft = []; // 10–19
    const climbing = []; // under 10

    Object.keys(Q.TOPICS).forEach((t) => {
      const n = Number((p.topics[t] || {}).unaided_correct) || 0;
      if (n >= LOCK_AT) return; // never show locked subjects
      if (n >= MASTER) soft.push(t);
      else climbing.push(t);
    });

    const pool = soft.length ? soft : climbing;
    if (!pool.length) return null;

    const weights = pool.map((t) => {
      const n = Number((p.topics[t] || {}).unaided_correct) || 0;
      let w;
      if (n >= MASTER) {
        const toLock = LOCK_AT - n;
        const fragility = n === MASTER ? 14 : 6;
        w = toLock * 10 + fragility + Math.random() * 5;
      } else {
        w = (MASTER - n) * 6 + Math.random() * 4;
      }
      if (avoidTopic && t === avoidTopic) w *= 0.08;
      return Math.max(w, 0.4);
    });

    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  /** Mix mode across unlocked topics only (skips locked-at-20 subjects). */
  function pickAllTopic(avoidTopic) {
    const p = load();
    const keys = Object.keys(Q.TOPICS).filter(function (t) {
      const n = Number((p.topics[t] || {}).unaided_correct) || 0;
      return n < LOCK_AT;
    });
    if (!keys.length) return null;
    const weighted = [];
    keys.forEach(function (k) {
      if (avoidTopic && k === avoidTopic) return;
      const copies = k === "formulas" ? 2 : 1;
      for (let i = 0; i < copies; i++) weighted.push(k);
    });
    const pool = weighted.length ? weighted : keys;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function setUnaided(p, topic, next) {
    const rec = p.topics[topic];
    const prev = Number(rec.unaided_correct) || 0;
    const clamped = Math.max(0, Math.min(LOCK_AT, next));
    const applied = clamped - prev;
    rec.unaided_correct = clamped;
    syncMasteredFlag(rec);
    p.total_unaided_correct = Math.max(
      0,
      (p.total_unaided_correct || 0) + applied
    );
    return applied;
  }

  /** Soft mastery (10–19): one kill → 9/10. Full lock (20): 3 strikes → 9/10. */
  function applyMasteryHit(p, topic) {
    const rec = p.topics[topic];
    const n = Number(rec.unaided_correct) || 0;
    if (n >= LOCK_AT) {
      rec.lock_strikes = (Number(rec.lock_strikes) || 0) + 1;
      if (rec.lock_strikes >= LOCK_GRACE) {
        rec.lock_strikes = 0;
        return setUnaided(p, topic, MASTER - 1); // 9
      }
      return 0; // strike absorbed; still 20/10
    }
    if (n >= MASTER) {
      rec.lock_strikes = 0;
      return setUnaided(p, topic, MASTER - 1); // 9
    }
    return 0;
  }

  /** Hinted correct: erodes buffer by 1, or chips a full lock like a wrong. */
  function applyHintPenalty(p, topic) {
    const rec = p.topics[topic];
    const n = Number(rec.unaided_correct) || 0;
    if (n >= LOCK_AT) {
      return applyMasteryHit(p, topic);
    }
    if (n > 0) {
      return setUnaided(p, topic, n - 1);
    }
    return 0;
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
    const wasMastered = isMastered(p.topics[topic].unaided_correct);
    const wasLocked = isLocked(p.topics[topic].unaided_correct);

    if (ok) {
      p.total_correct += 1;
      p.topics[topic].correct += 1;
      if (hintsUsed === 0) {
        p.streak += 1;
        p.best_streak = Math.max(p.best_streak || 0, p.streak);
        const prev = Number(p.topics[topic].unaided_correct) || 0;
        masteryDelta = setUnaided(p, topic, prev + 1);
        p.topics[topic].lock_strikes = 0;
      } else {
        p.streak = 0;
        masteryDelta = applyHintPenalty(p, topic);
      }
    } else {
      p.streak = 0;
      // Wrong: kill soft mastery in one hit; chip full lock (3 → 9/10).
      // Before mastery (under 10), wrongs do not lower the counter.
      if (wasMastered) {
        masteryDelta = applyMasteryHit(p, topic);
      }
    }

    const unaided = Number(p.topics[topic].unaided_correct) || 0;
    const mastered = isMastered(unaided);
    const locked = isLocked(unaided);

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

    return {
      correct: ok,
      expected: expected,
      credit: credit,
      hints_used: hintsUsed,
      hint: question.hint || "",
      streak: p.streak,
      unaided_correct: unaided,
      unaided_needed: MASTER,
      lock_at: LOCK_AT,
      lock_strikes: Number(p.topics[topic].lock_strikes) || 0,
      topic_mastery: topicMastery(unaided),
      mastered: mastered,
      locked: locked,
      mastery_delta: masteryDelta,
      just_mastered: Boolean(ok && hintsUsed === 0 && mastered && !wasMastered),
      just_locked: Boolean(ok && hintsUsed === 0 && locked && !wasLocked),
      lock_broken: Boolean(wasMastered && !mastered),
      note: "",
    };
  }

  function recordHintSkip(question, hintsUsed) {
    hintsUsed = Math.max(0, Math.min(3, hintsUsed | 0));
    if (!question || hintsUsed <= 0) {
      return { mastery_delta: 0, unaided_correct: 0, unaided_needed: MASTER };
    }
    const p = load();
    const topic = question.topic;
    if (!p.topics[topic]) p.topics[topic] = emptyTopic(Q.TOPICS[topic] || topic);
    const wasMastered = isMastered(p.topics[topic].unaided_correct);
    const masteryDelta = applyHintPenalty(p, topic);
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
    const unaided = Number(p.topics[topic].unaided_correct) || 0;
    const mastered = isMastered(unaided);
    return {
      mastery_delta: masteryDelta,
      unaided_correct: unaided,
      unaided_needed: MASTER,
      topic_mastery: topicMastery(unaided),
      mastered: mastered,
      locked: isLocked(unaided),
      lock_strikes: Number(p.topics[topic].lock_strikes) || 0,
      lock_broken: Boolean(wasMastered && !mastered),
    };
  }

  function awardRetryCredit(question) {
    const credit = Q.RETRY_CREDIT != null ? Q.RETRY_CREDIT : 0.05;
    const p = load();
    const topic = question.topic;
    if (!p.topics[topic]) p.topics[topic] = emptyTopic(Q.TOPICS[topic] || topic);
    p.total_credit = (p.total_credit || 0) + credit;
    p.total_correct = (p.total_correct || 0) + 1;
    p.topics[topic].credit = (p.topics[topic].credit || 0) + credit;
    p.topics[topic].correct = (p.topics[topic].correct || 0) + 1;
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
    const unaided = Number(p.topics[topic].unaided_correct) || 0;
    return {
      correct: true,
      credit: credit,
      streak: p.streak,
      unaided_correct: unaided,
      unaided_needed: MASTER,
      mastered: isMastered(unaided),
      locked: isLocked(unaided),
    };
  }

  function reset() {
    save(emptyProgress());
  }

  function exportProgress() {
    const p = load();
    return {
      format: "mat107-assessment1-progress",
      version: 2,
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
    const next = emptyProgress();
    next.total_correct = p.total_correct || 0;
    next.total_attempted = p.total_attempted || 0;
    next.total_credit = p.total_credit != null ? p.total_credit : p.total_correct || 0;
    next.total_unaided_correct = p.total_unaided_correct || 0;
    next.streak = p.streak || 0;
    next.best_streak = p.best_streak || 0;
    next.final_boss_cleared = Boolean(p.final_boss_cleared);
    next.final_boss_cleared_at = p.final_boss_cleared_at || null;
    next.history = Array.isArray(p.history) ? p.history.slice(-100) : [];
    Object.keys(Q.TOPICS).forEach((key) => {
      const src = (p.topics && p.topics[key]) || {};
      let unaided = Number(src.unaided_correct) || 0;
      if (unaided > LOCK_AT) unaided = LOCK_AT;
      next.topics[key] = {
        correct: src.correct || 0,
        attempted: src.attempted || 0,
        credit: src.credit != null ? src.credit : src.correct || 0,
        unaided_correct: unaided,
        mastered: unaided >= MASTER,
        lock_strikes: Number(src.lock_strikes) || 0,
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
    pickLockInTopic: pickLockInTopic,
    pickAllTopic: pickAllTopic,
    allTopicsLocked: allTopicsLocked,
    allTopicsMastered: allTopicsMastered,
    shuffleTopics: shuffleTopics,
    markFinalBossCleared: markFinalBossCleared,
    penalizeBossFail: penalizeBossFail,
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
