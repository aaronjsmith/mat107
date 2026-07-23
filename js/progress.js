/* MAT107 progress — localStorage */
(function () {
  const ASSESSMENT_ID =
    window.MAT107_ASSESSMENT_ID ||
    (window.Mat107Course && window.Mat107Course.getDefaultAssessmentId()) ||
    "assessment1";
  const STORAGE_KEY =
    window.Mat107Course && window.Mat107Course.progressStorageKey
      ? window.Mat107Course.progressStorageKey(ASSESSMENT_ID)
      : "mat107-" + ASSESSMENT_ID + "-progress";
  const Q = window.QuizQuestions;
  /** Unaided corrects needed to master a topic. */
  const MASTER = Q.UNAIDED_TO_MASTER || 10;
  /**
   * Teach Me layers still showing (5 → 0). Each correct answer removes one layer.
   * 5: hints + how-to + answer · 4: hints + how-to · 3: hint1+2+calc · 2: hint1+2 · 1: hint1 · 0: graduated
   */
  const TEACH_MAX = 5;

  function emptyTopic(label) {
    return {
      correct: 0,
      attempted: 0,
      credit: 0,
      unaided_correct: 0,
      mastered: false,
      teach_scaffold: null,
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
      boss_run: null,
      boss_drill_topic: null,
      updated_at: null,
    };
  }

  function syncMasteredFlag(rec) {
    const n = Number(rec.unaided_correct) || 0;
    rec.mastered = n >= MASTER;
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
      data.boss_run = normalizeBossRun(data.boss_run);
      data.boss_drill_topic =
        data.boss_drill_topic && Q.TOPICS[data.boss_drill_topic]
          ? data.boss_drill_topic
          : null;
      Object.keys(Q.TOPICS).forEach((key) => {
        const t = data.topics[key] || emptyTopic(Q.TOPICS[key]);
        t.label = Q.TOPICS[key];
        t.credit = t.credit != null ? t.credit : t.correct || 0;
        t.unaided_correct = Number(t.unaided_correct) || 0;
        // Cap at mastery; migrate any old lock scores (11–20) down to 10.
        if (t.unaided_correct > MASTER) t.unaided_correct = MASTER;
        if (t.teach_scaffold != null) {
          t.teach_scaffold = Math.max(
            0,
            Math.min(TEACH_MAX, Number(t.teach_scaffold) || 0)
          );
        } else {
          t.teach_scaffold = null;
        }
        delete t.lock_strikes;
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

  function foreignStorageKey(assessmentId) {
    if (
      window.Mat107Course &&
      window.Mat107Course.progressStorageKey
    ) {
      return window.Mat107Course.progressStorageKey(assessmentId);
    }
    return "mat107-" + assessmentId + "-progress";
  }

  function currentAssessment() {
    return window.Mat107Course && window.Mat107Course.getAssessment
      ? window.Mat107Course.getAssessment(ASSESSMENT_ID)
      : null;
  }

  function isComposeAssessment() {
    const a = currentAssessment();
    return Boolean(a && a.compose);
  }

  /** Unaided count from the week quiz that owns this topic (0 if none / unread). */
  function weekUnaidedForTopic(topic) {
    if (!topic || !window.Mat107Course || !window.Mat107Course.weekAssessmentForTopic) {
      return 0;
    }
    const week = window.Mat107Course.weekAssessmentForTopic(topic);
    if (!week) return 0;
    const fp = loadForeign(week.id);
    return Number((fp.topics[topic] || {}).unaided_correct) || 0;
  }

  /**
   * Display/logic unaided for a topic. On the overview (compose) quiz, take the
   * max of overview storage and the owning week quiz so prior week practice counts.
   */
  function effectiveUnaided(p, topic) {
    const local = Number((p.topics[topic] || {}).unaided_correct) || 0;
    if (!isComposeAssessment()) return Math.min(local, MASTER);
    return Math.min(MASTER, Math.max(local, weekUnaidedForTopic(topic)));
  }

  function emptyForeignProgress() {
    return {
      total_correct: 0,
      total_attempted: 0,
      total_credit: 0,
      total_unaided_correct: 0,
      streak: 0,
      best_streak: 0,
      topics: {},
      history: [],
      final_boss_cleared: false,
      final_boss_cleared_at: null,
      boss_run: null,
      boss_drill_topic: null,
      updated_at: null,
    };
  }

  function loadForeign(assessmentId) {
    try {
      const raw = localStorage.getItem(foreignStorageKey(assessmentId));
      if (!raw) return emptyForeignProgress();
      const data = JSON.parse(raw);
      data.topics = data.topics || {};
      data.total_credit =
        data.total_credit != null ? data.total_credit : data.total_correct || 0;
      data.total_unaided_correct = data.total_unaided_correct || 0;
      data.total_correct = data.total_correct || 0;
      data.total_attempted = data.total_attempted || 0;
      return data;
    } catch (e) {
      return emptyForeignProgress();
    }
  }

  function saveForeign(assessmentId, data) {
    data.updated_at = new Date().toISOString();
    localStorage.setItem(foreignStorageKey(assessmentId), JSON.stringify(data));
  }

  /**
   * Week-master sync: push topic progress between overview (compose) and the
   * week quiz that owns the topic. Unaided uses max-merge so independent higher
   * progress is never wiped; attempted/correct/credit apply the same deltas.
   */
  function syncTopicToRelated(topic, deltas) {
    if (!topic || !window.Mat107Course) return;
    const related =
      window.Mat107Course.relatedAssessmentIdsForTopic &&
      window.Mat107Course.relatedAssessmentIdsForTopic(topic, ASSESSMENT_ID);
    if (!related || !related.length) return;

    const attemptedDelta = Number(deltas && deltas.attempted) || 0;
    const correctDelta = Number(deltas && deltas.correct) || 0;
    const creditDelta = Number(deltas && deltas.credit) || 0;
    const sourceUnaided =
      deltas && deltas.unaided_correct != null
        ? Math.max(0, Math.min(MASTER, Number(deltas.unaided_correct) || 0))
        : null;
    const label =
      (Q.TOPICS && Q.TOPICS[topic]) ||
      (deltas && deltas.label) ||
      topic;

    related.forEach(function (id) {
      if (!id || id === ASSESSMENT_ID) return;
      const p = loadForeign(id);
      if (!p.topics[topic]) p.topics[topic] = emptyTopic(label);
      const rec = p.topics[topic];
      rec.label = label;

      if (attemptedDelta) {
        p.total_attempted = (p.total_attempted || 0) + attemptedDelta;
        rec.attempted = (rec.attempted || 0) + attemptedDelta;
      }
      if (correctDelta) {
        p.total_correct = (p.total_correct || 0) + correctDelta;
        rec.correct = (rec.correct || 0) + correctDelta;
      }
      if (creditDelta) {
        p.total_credit = (p.total_credit || 0) + creditDelta;
        rec.credit = (rec.credit || 0) + creditDelta;
      }

      if (sourceUnaided != null) {
        const prev = Number(rec.unaided_correct) || 0;
        const next = Math.max(prev, sourceUnaided);
        if (next !== prev) {
          rec.unaided_correct = next;
          syncMasteredFlag(rec);
          p.total_unaided_correct = Math.max(
            0,
            (p.total_unaided_correct || 0) + (next - prev)
          );
        } else {
          syncMasteredFlag(rec);
        }
      }

      saveForeign(id, p);
    });
  }

  /** After import, raise related assessment topics to at least this store's unaided. */
  function syncAllTopicsFromCurrent() {
    const p = load();
    Object.keys(p.topics || {}).forEach(function (topic) {
      const rec = p.topics[topic] || {};
      syncTopicToRelated(topic, {
        unaided_correct: Number(rec.unaided_correct) || 0,
        label: rec.label,
      });
    });
  }

  function normalizeBossRun(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (!raw.active || raw.status !== "running") return null;
    if (!Array.isArray(raw.queue) || !raw.queue.length) return null;
    const topicKeys = Q.TOPICS ? Object.keys(Q.TOPICS) : [];
    const queue = raw.queue.filter(function (t) {
      return topicKeys.indexOf(t) >= 0;
    });
    if (!queue.length) return null;
    let index = Number(raw.index) || 0;
    if (index < 0) index = 0;
    if (index >= queue.length) index = queue.length - 1;
    return {
      active: true,
      queue: queue,
      index: index,
      status: "running",
      real: Boolean(raw.real),
    };
  }

  function getBossRun() {
    return normalizeBossRun(load().boss_run);
  }

  function saveBossRun(run) {
    const p = load();
    p.boss_run = normalizeBossRun(run);
    save(p);
    return p.boss_run;
  }

  function clearBossRun() {
    const p = load();
    if (p.boss_run == null) return;
    p.boss_run = null;
    save(p);
  }

  function getBossDrillTopic() {
    const key = load().boss_drill_topic;
    return key && Q.TOPICS[key] ? key : null;
  }

  function setBossDrillTopic(topic) {
    const p = load();
    p.boss_drill_topic = topic && Q.TOPICS[topic] ? topic : null;
    save(p);
    return p.boss_drill_topic;
  }

  function clearBossDrillTopic() {
    const p = load();
    if (p.boss_drill_topic == null) return;
    p.boss_drill_topic = null;
    save(p);
  }

  /** Clear drill when the topic is remastered. Returns true if still drilling. */
  function syncBossDrillTopic() {
    const key = getBossDrillTopic();
    if (!key) return null;
    const p = load();
    if (effectiveUnaided(p, key) >= MASTER) {
      clearBossDrillTopic();
      return null;
    }
    return key;
  }

  function gradeAccuracy(credit, attempted) {
    if (!attempted) return 0;
    return Math.round((1000 * credit) / attempted) / 10;
  }

  function topicMastery(unaided) {
    return Math.round((1000 * Math.min(unaided, MASTER)) / MASTER) / 10;
  }

  function isMastered(unaided) {
    return (Number(unaided) || 0) >= MASTER;
  }

  function allTopicsMastered() {
    const p = load();
    const keys = Object.keys(Q.TOPICS);
    if (!keys.length) return false;
    return keys.every(function (t) {
      return effectiveUnaided(p, t) >= MASTER;
    });
  }

  function getProgressView() {
    const p = load();
    const topics = {};
    let masteredCount = 0;
    let unaidedSum = 0;
    // Always iterate course topics (not only keys present in storage).
    Object.keys(Q.TOPICS).forEach((key) => {
      const info = p.topics[key] || emptyTopic(Q.TOPICS[key]);
      const unaided = effectiveUnaided(p, key);
      unaidedSum += unaided;
      const mastered = isMastered(unaided);
      if (mastered) masteredCount += 1;
      topics[key] = {
        ...info,
        unaided_correct: unaided,
        unaided_needed: MASTER,
        mastery: topicMastery(unaided),
        mastered: mastered,
        teach_scaffold: getTeachScaffold(key),
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
      all_mastered: allTopicsMastered(),
      final_boss_cleared: Boolean(p.final_boss_cleared),
      final_boss_cleared_at: p.final_boss_cleared_at || null,
      topics: topics,
      history: (p.history || []).slice(-20),
      updated_at: p.updated_at,
    };
  }

  function markFinalBossCleared() {
    const p = load();
    p.final_boss_cleared = true;
    p.final_boss_cleared_at = new Date().toISOString();
    save(p);
    return p;
  }

  /** Boss miss: knock exactly one unaided point off the topic (if any). */
  function penalizeBossMiss(topic) {
    const p = load();
    if (!topic || !Q.TOPICS[topic]) {
      return { dropped_to: 0, topic: null, topics_affected: 0, prev: 0 };
    }
    if (!p.topics[topic]) p.topics[topic] = emptyTopic(Q.TOPICS[topic]);
    const rec = p.topics[topic];
    const prev = Number(rec.unaided_correct) || 0;
    if (prev <= 0) {
      save(p);
      syncTopicToRelated(topic, { unaided_correct: 0 });
      return { dropped_to: 0, topic: topic, topics_affected: 0, prev: prev };
    }
    const droppedTo = prev - 1;
    rec.unaided_correct = droppedTo;
    syncMasteredFlag(rec);
    p.total_unaided_correct = Math.max(0, (p.total_unaided_correct || 0) - 1);
    save(p);
    // Max-merge will not lower related; still push current so gains stay aligned.
    syncTopicToRelated(topic, { unaided_correct: droppedTo });
    return { dropped_to: droppedTo, topic: topic, topics_affected: 1, prev: prev };
  }

  /** Full boss abandon (e.g. skip): missed topic drops to 9/10 if it was mastered. */
  function penalizeBossFail(topic) {
    const p = load();
    const droppedTo = MASTER - 1;
    if (!topic || !Q.TOPICS[topic]) {
      return { dropped_to: droppedTo, topic: null, topics_affected: 0 };
    }
    if (!p.topics[topic]) p.topics[topic] = emptyTopic(Q.TOPICS[topic]);
    const rec = p.topics[topic];
    const prev = Number(rec.unaided_correct) || 0;
    if (prev >= MASTER) {
      rec.unaided_correct = droppedTo;
      syncMasteredFlag(rec);
      p.total_unaided_correct = Math.max(
        0,
        (p.total_unaided_correct || 0) + (droppedTo - prev)
      );
      save(p);
      syncTopicToRelated(topic, { unaided_correct: droppedTo });
      return { dropped_to: droppedTo, topic: topic, topics_affected: 1 };
    }
    save(p);
    syncTopicToRelated(topic, { unaided_correct: Math.min(prev, droppedTo) });
    return { dropped_to: Math.min(prev, droppedTo), topic: topic, topics_affected: 0 };
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
    const keys = Object.keys(Q.TOPICS);
    if (!keys.length) return null;
    const weights = keys.map((t) => {
      const info = p.topics[t] || { unaided_correct: 0, attempted: 0 };
      const remaining = Math.max(MASTER - effectiveUnaided(p, t), 0);
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

  function pickAllTopic(avoidTopic) {
    const p = load();
    const keys = Object.keys(Q.TOPICS);
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

  function teachableTopicKeys() {
    return Object.keys(Q.TOPICS).filter(function (k) {
      return k !== "flashcards";
    });
  }

  /**
   * Remaining Teach Me layers for a topic (0 = training wheels off).
   * Unset topics: full scaffold unless already mastered.
   */
  function getTeachScaffold(topic) {
    if (!topic || !Q.TOPICS[topic] || topic === "flashcards") return 0;
    const p = load();
    const rec = p.topics[topic] || emptyTopic(Q.TOPICS[topic]);
    if (rec.teach_scaffold != null) {
      return Math.max(0, Math.min(TEACH_MAX, Number(rec.teach_scaffold) || 0));
    }
    if ((Number(rec.unaided_correct) || 0) >= MASTER) return 0;
    return TEACH_MAX;
  }

  function teachTopicsRemaining() {
    return teachableTopicKeys().filter(function (k) {
      return getTeachScaffold(k) > 0;
    });
  }

  function allTeachGraduated() {
    return teachTopicsRemaining().length === 0;
  }

  /** Prefer topics that still have Teach Me layers; weight by layers left. */
  function pickTeachTopic(avoidTopic) {
    const keys = teachTopicsRemaining();
    if (!keys.length) return null;
    const weights = keys.map(function (t) {
      let w = getTeachScaffold(t) * 10 + 4 + Math.random() * 5;
      if (avoidTopic && t === avoidTopic) w *= 0.12;
      return Math.max(w, 0.5);
    });
    const total = weights.reduce(function (a, b) {
      return a + b;
    }, 0);
    let r = Math.random() * total;
    for (let i = 0; i < keys.length; i++) {
      r -= weights[i];
      if (r <= 0) return keys[i];
    }
    return keys[keys.length - 1];
  }

  /**
   * After a correct Teach Me answer: peel one scaffold layer.
   * Does not award unaided mastery (training wheels).
   */
  function recordTeachCorrect(topic) {
    if (!topic || !Q.TOPICS[topic] || topic === "flashcards") {
      return {
        teach_scaffold: 0,
        graduated: false,
        all_graduated: allTeachGraduated(),
      };
    }
    const p = load();
    if (!p.topics[topic]) p.topics[topic] = emptyTopic(Q.TOPICS[topic]);
    const rec = p.topics[topic];
    let cur = getTeachScaffold(topic);
    const next = Math.max(0, cur - 1);
    rec.teach_scaffold = next;
    // Light attempt tracking so grade isn't empty, but no unaided bump.
    rec.attempted = (Number(rec.attempted) || 0) + 1;
    rec.correct = (Number(rec.correct) || 0) + 1;
    p.total_attempted = (p.total_attempted || 0) + 1;
    p.total_correct = (p.total_correct || 0) + 1;
    save(p);
    return {
      teach_scaffold: next,
      graduated: cur > 0 && next === 0,
      all_graduated: allTeachGraduated(),
      teach_max: TEACH_MAX,
    };
  }

  function setUnaided(p, topic, next) {
    const rec = p.topics[topic];
    const prev = Number(rec.unaided_correct) || 0;
    const clamped = Math.max(0, Math.min(MASTER, next));
    const applied = clamped - prev;
    rec.unaided_correct = clamped;
    syncMasteredFlag(rec);
    p.total_unaided_correct = Math.max(
      0,
      (p.total_unaided_correct || 0) + applied
    );
    return applied;
  }

  function applyHintPenalty(p, topic) {
    const rec = p.topics[topic];
    const n = Number(rec.unaided_correct) || 0;
    if (n > 0) return setUnaided(p, topic, n - 1);
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

    if (ok) {
      p.total_correct += 1;
      p.topics[topic].correct += 1;
      if (hintsUsed === 0) {
        p.streak += 1;
        p.best_streak = Math.max(p.best_streak || 0, p.streak);
        const prev = Number(p.topics[topic].unaided_correct) || 0;
        masteryDelta = setUnaided(p, topic, prev + 1);
      } else {
        p.streak = 0;
        masteryDelta = applyHintPenalty(p, topic);
      }
    } else {
      // Wrong answers never change mastery (streak only).
      p.streak = 0;
    }

    const unaided = Number(p.topics[topic].unaided_correct) || 0;
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

    syncTopicToRelated(topic, {
      attempted: 1,
      correct: ok ? 1 : 0,
      credit: credit,
      unaided_correct: unaided,
      label: Q.TOPICS[topic] || topic,
    });

    return {
      correct: ok,
      expected: expected,
      credit: credit,
      hints_used: hintsUsed,
      hint: question.hint || "",
      streak: p.streak,
      unaided_correct: unaided,
      unaided_needed: MASTER,
      topic_mastery: topicMastery(unaided),
      mastered: mastered,
      mastery_delta: masteryDelta,
      just_mastered: Boolean(ok && hintsUsed === 0 && mastered && !wasMastered),
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
    syncTopicToRelated(topic, {
      unaided_correct: unaided,
      label: Q.TOPICS[topic] || topic,
    });
    return {
      mastery_delta: masteryDelta,
      unaided_correct: unaided,
      unaided_needed: MASTER,
      topic_mastery: topicMastery(unaided),
      mastered: isMastered(unaided),
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
    syncTopicToRelated(topic, {
      correct: 1,
      credit: credit,
      unaided_correct: unaided,
      label: Q.TOPICS[topic] || topic,
    });
    return {
      correct: true,
      credit: credit,
      streak: p.streak,
      unaided_correct: unaided,
      unaided_needed: MASTER,
      mastered: isMastered(unaided),
    };
  }

  function reset() {
    save(emptyProgress());
  }

  function exportProgress() {
    const p = load();
    return {
      format: "mat107-" + ASSESSMENT_ID + "-progress",
      assessment_id: ASSESSMENT_ID,
      version: 3,
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
    next.boss_run = normalizeBossRun(p.boss_run);
    next.boss_drill_topic =
      p.boss_drill_topic && Q.TOPICS[p.boss_drill_topic]
        ? p.boss_drill_topic
        : null;
    next.history = Array.isArray(p.history) ? p.history.slice(-100) : [];
    Object.keys(Q.TOPICS).forEach((key) => {
      const src = (p.topics && p.topics[key]) || {};
      let unaided = Number(src.unaided_correct) || 0;
      if (unaided > MASTER) unaided = MASTER;
      next.topics[key] = {
        correct: src.correct || 0,
        attempted: src.attempted || 0,
        credit: src.credit != null ? src.credit : src.correct || 0,
        unaided_correct: unaided,
        mastered: unaided >= MASTER,
        teach_scaffold:
          src.teach_scaffold != null
            ? Math.max(0, Math.min(TEACH_MAX, Number(src.teach_scaffold) || 0))
            : null,
        label: Q.TOPICS[key],
      };
    });
    save(next);
    syncAllTopicsFromCurrent();
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
    pickAllTopic: pickAllTopic,
    pickTeachTopic: pickTeachTopic,
    getTeachScaffold: getTeachScaffold,
    teachTopicsRemaining: teachTopicsRemaining,
    allTeachGraduated: allTeachGraduated,
    recordTeachCorrect: recordTeachCorrect,
    TEACH_MAX: TEACH_MAX,
    allTopicsMastered: allTopicsMastered,
    shuffleTopics: shuffleTopics,
    markFinalBossCleared: markFinalBossCleared,
    penalizeBossFail: penalizeBossFail,
    penalizeBossMiss: penalizeBossMiss,
    getBossRun: getBossRun,
    saveBossRun: saveBossRun,
    clearBossRun: clearBossRun,
    getBossDrillTopic: getBossDrillTopic,
    setBossDrillTopic: setBossDrillTopic,
    clearBossDrillTopic: clearBossDrillTopic,
    syncBossDrillTopic: syncBossDrillTopic,
    recordAnswer: recordAnswer,
    recordHintSkip: recordHintSkip,
    awardRetryCredit: awardRetryCredit,
    reset: reset,
    exportProgress: exportProgress,
    importProgress: importProgress,
    downloadProgressFile: downloadProgressFile,
    STORAGE_KEY: STORAGE_KEY,
    ASSESSMENT_ID: ASSESSMENT_ID,
  };
})();
