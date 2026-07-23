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
      available: true,
      questionsScript: "js/questions.js",
      features: { flashcards: true, notecard: true, boss: true },
      topicIds: GEO_STATS_TOPICS.slice(),
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
      const raw = localStorage.getItem(progressStorageKey(assessment.id));
      if (!raw) return empty;
      const p = JSON.parse(raw);
      let mastered = 0;
      topicIds.forEach(function (tid) {
        const n = Number((p.topics && p.topics[tid] || {}).unaided_correct) || 0;
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
    readProgressSummary: readProgressSummary,
  };
})();
