/**
 * MAT107 assessment catalog.
 * Each assessment gets its own localStorage progress key: mat107-{id}-progress
 * Aligned with Canvas course 25999 modules (Weeks 1–7).
 */
(function () {
  "use strict";

  const MASTER = 10;

  const GEO_STATS_TOPICS = [
    "conversions",
    "formulas",
    "perimeter_area",
    "volume",
    "pythagorean",
    "scale_rates",
    "scaling",
    "stats_center",
    "stats_spread",
    "z_scores",
    "distributions",
    "literacy",
  ];

  /** Canvas Geometry reading / homework skill set (Weeks 1–2). */
  const GEO_HW_TOPICS = [
    "conversions",
    "formulas",
    "perimeter_area",
    "volume",
    "pythagorean",
    "scale_rates",
    "scaling",
  ];

  /** Canvas Statistics homework skill set (Weeks 1–2). */
  const STATS_HW_TOPICS = [
    "stats_center",
    "stats_spread",
    "z_scores",
    "distributions",
    "literacy",
  ];

  const PROB_TOPICS = ["prob_basic", "prob_compound", "prob_counting"];

  const FN1_TOPICS = [
    "fn_arith_seq",
    "fn_arith_terms",
    "fn_geom_seq",
    "fn_geom_terms",
    "fn_arith_series",
    "fn_geom_series",
  ];

  const FN2_TOPICS = ["fn_linear", "fn_exp", "fn_slope", "fn_interest"];

  const FINANCE_TOPICS = ["fin_budget", "fin_percent", "fin_excel"];

  const SAVINGS_CREDIT_TOPICS = [
    "save_compound",
    "save_annuity",
    "credit_loan",
    "credit_apr",
  ];

  const INSURANCE_TOPICS = ["ins_premium", "ins_expected"];

  const OVERVIEW_TOPICS = GEO_STATS_TOPICS.concat(
    PROB_TOPICS,
    FN1_TOPICS,
    FN2_TOPICS,
    FINANCE_TOPICS,
    SAVINGS_CREDIT_TOPICS,
    INSURANCE_TOPICS
  );

  const TOPIC_IDS = GEO_STATS_TOPICS.slice();

  /** Hub groups aligned with Canvas modules (Weeks 1–7). */
  const WEEK_GROUPS = [
    {
      id: "overview",
      titleKey: "week.overview.title",
      blurbKey: "week.overview.blurb",
    },
    {
      id: "weeks12",
      titleKey: "week.12.title",
      blurbKey: "week.12.blurb",
    },
    {
      id: "week3",
      titleKey: "week.3.title",
      blurbKey: "week.3.blurb",
    },
    {
      id: "week4",
      titleKey: "week.4.title",
      blurbKey: "week.4.blurb",
    },
    {
      id: "week5",
      titleKey: "week.5.title",
      blurbKey: "week.5.blurb",
    },
    {
      id: "week6",
      titleKey: "week.6.title",
      blurbKey: "week.6.blurb",
    },
    {
      id: "week7",
      titleKey: "week.7.title",
      blurbKey: "week.7.blurb",
    },
  ];

  /**
   * Boss visuals (unique per theme):
   *   bossEmoji      — live / idle (ready or fighting)
   *   bossEmojiHit   — damaged after a correct hit
   *   bossEmojiWin   — just defeated (victory flash)
   *   bossEmojiDead  — cleared / permanently down
   */
  const ASSESSMENTS = [
    {
      id: "overview",
      weekId: "overview",
      number: 0,
      titleKey: "lesson.overview.title",
      summaryKey: "lesson.overview.summary",
      badgeKey: "lesson.overview.badge",
      brandSubKey: "lesson.overview.brand_sub",
      pageTitleKey: "lesson.overview.page_title",
      backKey: "course_back",
      theme: "gathering",
      bossEmoji: "🌪️",
      bossEmojiHit: "💨",
      bossEmojiWin: "🧭",
      bossEmojiDead: "✨",
      available: true,
      compose: true,
      questionsScripts: [
        "js/questions.js",
        "js/questions-functions.js",
        "js/questions-course.js",
      ],
      features: { flashcards: false, notecard: true, boss: true },
      topicIds: OVERVIEW_TOPICS.slice(),
    },
    {
      id: "assessment1",
      weekId: "weeks12",
      number: 1,
      titleKey: "assessment.1.title",
      summaryKey: "assessment.1.summary",
      badgeKey: "assessment.1.badge",
      brandSubKey: "brand_sub",
      pageTitleKey: "assessment.1.page_title",
      backKey: "course_back",
      theme: "zarahemla",
      bossEmoji: "😈",
      bossEmojiHit: "👹",
      bossEmojiWin: "🛡️",
      bossEmojiDead: "💀",
      available: true,
      questionsScript: "js/questions.js",
      features: { flashcards: true, notecard: true, boss: true },
      topicIds: GEO_STATS_TOPICS.slice(),
    },
    {
      id: "hw_geo",
      weekId: "weeks12",
      number: 11,
      titleKey: "hw.geo.title",
      summaryKey: "hw.geo.summary",
      badgeKey: "hw.geo.badge",
      brandSubKey: "hw.geo.brand_sub",
      pageTitleKey: "hw.geo.page_title",
      backKey: "course_back",
      theme: "meetinghouse",
      available: true,
      questionsScript: "js/questions.js",
      features: { flashcards: true, notecard: true, boss: false },
      topicIds: GEO_HW_TOPICS.slice(),
    },
    {
      id: "hw_stats",
      weekId: "weeks12",
      number: 12,
      titleKey: "hw.stats.title",
      summaryKey: "hw.stats.summary",
      badgeKey: "hw.stats.badge",
      brandSubKey: "hw.stats.brand_sub",
      pageTitleKey: "hw.stats.page_title",
      backKey: "course_back",
      theme: "institute",
      bossEmoji: "🗣️",
      bossEmojiHit: "🗯️",
      bossEmojiWin: "📖",
      bossEmojiDead: "🔇",
      available: true,
      questionsScript: "js/questions.js",
      features: { flashcards: false, notecard: true, boss: true },
      topicIds: STATS_HW_TOPICS.slice(),
    },
    {
      id: "lesson_prob",
      weekId: "week3",
      number: 3,
      titleKey: "lesson.prob.title",
      summaryKey: "lesson.prob.summary",
      badgeKey: "lesson.prob.badge",
      brandSubKey: "lesson.prob.brand_sub",
      pageTitleKey: "lesson.prob.page_title",
      backKey: "course_back",
      theme: "lots",
      bossEmoji: "⚔️",
      bossEmojiHit: "💥",
      bossEmojiWin: "🛡️",
      bossEmojiDead: "🏳️",
      available: true,
      questionsScript: "js/questions-course.js",
      features: { flashcards: false, notecard: false, boss: true },
      topicIds: PROB_TOPICS.slice(),
    },
    {
      id: "lesson41",
      weekId: "week4",
      number: 41,
      titleKey: "lesson.41.title",
      summaryKey: "lesson.41.summary",
      badgeKey: "lesson.41.badge",
      brandSubKey: "lesson.41.brand_sub",
      pageTitleKey: "lesson.41.page_title",
      backKey: "course_back",
      theme: "winter",
      bossEmoji: "❄️",
      bossEmojiHit: "🌨️",
      bossEmojiWin: "🔥",
      bossEmojiDead: "⛺",
      available: true,
      questionsScript: "js/questions-functions.js",
      features: { flashcards: false, notecard: false, boss: true },
      topicIds: FN1_TOPICS.slice(),
    },
    {
      id: "lesson_fn2",
      weekId: "week4",
      number: 44,
      titleKey: "lesson.fn2.title",
      summaryKey: "lesson.fn2.summary",
      badgeKey: "lesson.fn2.badge",
      brandSubKey: "lesson.fn2.brand_sub",
      pageTitleKey: "lesson.fn2.page_title",
      backKey: "course_back",
      theme: "handcart",
      bossEmoji: "🛞",
      bossEmojiHit: "🪨",
      bossEmojiWin: "🏔️",
      bossEmojiDead: "🛤️",
      available: true,
      questionsScript: "js/questions-course.js",
      features: { flashcards: false, notecard: false, boss: true },
      topicIds: FN2_TOPICS.slice(),
    },
    {
      id: "lesson_finance",
      weekId: "week5",
      number: 5,
      titleKey: "lesson.finance.title",
      summaryKey: "lesson.finance.summary",
      badgeKey: "lesson.finance.badge",
      brandSubKey: "lesson.finance.brand_sub",
      pageTitleKey: "lesson.finance.page_title",
      backKey: "course_back",
      theme: "singles",
      bossEmoji: "💳",
      bossEmojiHit: "💸",
      bossEmojiWin: "🧾",
      bossEmojiDead: "🚫",
      available: true,
      questionsScript: "js/questions-course.js",
      features: { flashcards: false, notecard: false, boss: true },
      topicIds: FINANCE_TOPICS.slice(),
    },
    {
      id: "lesson_savings",
      weekId: "week6",
      number: 6,
      titleKey: "lesson.savings.title",
      summaryKey: "lesson.savings.summary",
      badgeKey: "lesson.savings.badge",
      brandSubKey: "lesson.savings.brand_sub",
      pageTitleKey: "lesson.savings.page_title",
      backKey: "course_back",
      theme: "mite",
      bossEmoji: "🫙",
      bossEmojiHit: "📉",
      bossEmojiWin: "🌾",
      bossEmojiDead: "✅",
      available: true,
      questionsScript: "js/questions-course.js",
      features: { flashcards: false, notecard: false, boss: true },
      topicIds: SAVINGS_CREDIT_TOPICS.slice(),
    },
    {
      id: "lesson_insurance",
      weekId: "week7",
      number: 7,
      titleKey: "lesson.insurance.title",
      summaryKey: "lesson.insurance.summary",
      badgeKey: "lesson.insurance.badge",
      brandSubKey: "lesson.insurance.brand_sub",
      pageTitleKey: "lesson.insurance.page_title",
      backKey: "course_back",
      theme: "kimball",
      bossEmoji: "🌊",
      bossEmojiHit: "🏚️",
      bossEmojiWin: "🤝",
      bossEmojiDead: "☀️",
      available: true,
      questionsScript: "js/questions-course.js",
      features: { flashcards: false, notecard: false, boss: true },
      topicIds: INSURANCE_TOPICS.slice(),
    },
  ];

  function progressStorageKey(assessmentId) {
    return "mat107-" + assessmentId + "-progress";
  }

  function notesStorageKey(assessmentId) {
    return "mat107-" + assessmentId + "-notes";
  }

  function quizHref(assessmentId) {
    return "quiz.html?a=" + encodeURIComponent(assessmentId);
  }

  function getAssessment(id) {
    return ASSESSMENTS.find(function (a) {
      return a.id === id;
    });
  }

  function getDefaultAssessmentId() {
    return "overview";
  }

  function resolveAssessmentId(id) {
    const found = getAssessment(id);
    return found ? found.id : null;
  }

  function assessmentOwnsTopic(assessment, topicId) {
    if (!assessment || !topicId) return false;
    const ids = assessment.topicIds || [];
    return ids.indexOf(topicId) >= 0;
  }

  /** Non-compose (week) quiz that owns a topic, if any. */
  function weekAssessmentForTopic(topicId) {
    if (!topicId) return null;
    for (let i = 0; i < ASSESSMENTS.length; i++) {
      const a = ASSESSMENTS[i];
      if (a.compose) continue;
      if (assessmentOwnsTopic(a, topicId)) return a;
    }
    return null;
  }

  /**
   * Assessments that should receive topic-level progress sync from `fromAssessmentId`.
   * Overview (compose) → week owner(s); week quiz → compose overview(s) that include the topic.
   */
  function relatedAssessmentIdsForTopic(topicId, fromAssessmentId) {
    const from = getAssessment(fromAssessmentId);
    if (!from || !topicId || !assessmentOwnsTopic(from, topicId)) return [];
    const ids = [];
    if (from.compose) {
      ASSESSMENTS.forEach(function (a) {
        if (a.compose || a.id === from.id) return;
        if (assessmentOwnsTopic(a, topicId)) ids.push(a.id);
      });
    } else {
      ASSESSMENTS.forEach(function (a) {
        if (!a.compose || a.id === from.id) return;
        if (assessmentOwnsTopic(a, topicId)) ids.push(a.id);
      });
    }
    return ids;
  }

  function readStoredProgress(assessmentId) {
    try {
      const raw = localStorage.getItem(progressStorageKey(assessmentId));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function topicUnaided(progress, topicId) {
    if (!progress || !progress.topics) return 0;
    return Number((progress.topics[topicId] || {}).unaided_correct) || 0;
  }

  function readProgressSummary(assessment) {
    if (!assessment) return null;
    const topicIds = assessment.topicIds || [];
    const empty = {
      mastered: 0,
      total: topicIds.length,
      attempted: 0,
      accuracy: null,
      bossCleared: false,
    };
    try {
      const p = readStoredProgress(assessment.id) || {};
      let mastered = 0;
      topicIds.forEach(function (tid) {
        let n = topicUnaided(p, tid);
        // Overview hub: also count week-quiz mastery for the same topic.
        if (assessment.compose) {
          const week = weekAssessmentForTopic(tid);
          if (week) {
            const wp = readStoredProgress(week.id);
            n = Math.max(n, topicUnaided(wp, tid));
          }
        }
        if (n >= MASTER) mastered += 1;
      });
      const attempted = Number(p.total_attempted) || 0;
      const credit = Number(p.total_credit) || 0;
      return {
        mastered: mastered,
        total: topicIds.length,
        attempted: attempted,
        accuracy: attempted ? Math.round((credit / attempted) * 100) : null,
        bossCleared: Boolean(p.final_boss_cleared),
      };
    } catch (e) {
      return empty;
    }
  }

  window.Mat107Course = {
    MASTER: MASTER,
    TOPIC_IDS: TOPIC_IDS,
    WEEK_GROUPS: WEEK_GROUPS,
    ASSESSMENTS: ASSESSMENTS,
    progressStorageKey: progressStorageKey,
    notesStorageKey: notesStorageKey,
    quizHref: quizHref,
    getAssessment: getAssessment,
    getDefaultAssessmentId: getDefaultAssessmentId,
    resolveAssessmentId: resolveAssessmentId,
    assessmentOwnsTopic: assessmentOwnsTopic,
    weekAssessmentForTopic: weekAssessmentForTopic,
    relatedAssessmentIdsForTopic: relatedAssessmentIdsForTopic,
    readProgressSummary: readProgressSummary,
  };
})();
