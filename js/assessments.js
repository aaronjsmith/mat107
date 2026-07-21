/**
 * MAT107 assessment catalog.
 * Each assessment gets its own localStorage progress key: mat107-{id}-progress
 */
(function () {
  "use strict";

  const MASTER = 10;

  const TOPIC_IDS = [
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

  const ASSESSMENTS = [
    {
      id: "assessment1",
      number: 1,
      titleKey: "assessment.1.title",
      summaryKey: "assessment.1.summary",
      brandSubKey: "brand_sub",
      pageTitleKey: "assessment.1.page_title",
      backKey: "course_back",
      available: true,
      questionsScript: "js/questions.js",
      features: { flashcards: true, notecard: true, boss: true },
      topicIds: TOPIC_IDS.slice(),
    },
    {
      id: "lesson41",
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
      topicIds: [
        "fn_arith_seq",
        "fn_arith_terms",
        "fn_geom_seq",
        "fn_geom_terms",
        "fn_arith_series",
        "fn_geom_series",
      ],
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
    return "assessment1";
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
