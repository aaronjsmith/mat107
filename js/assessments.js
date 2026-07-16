/**
 * MAT107 course catalog — lessons and assessments.
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

  const LESSONS = [
    {
      id: "lesson1",
      number: 1,
      titleKey: "lesson.1.title",
      summaryKey: "lesson.1.summary",
      topics: ["conversions"],
      assessments: ["assessment1"],
    },
    {
      id: "lesson2",
      number: 2,
      titleKey: "lesson.2.title",
      summaryKey: "lesson.2.summary",
      topics: ["formulas", "perimeter_area", "volume"],
      assessments: ["assessment1", "assessment2"],
    },
    {
      id: "lesson3",
      number: 3,
      titleKey: "lesson.3.title",
      summaryKey: "lesson.3.summary",
      topics: ["pythagorean", "scale_rates", "scaling"],
      assessments: ["assessment1", "assessment2"],
    },
    {
      id: "lesson4",
      number: 4,
      titleKey: "lesson.4.title",
      summaryKey: "lesson.4.summary",
      topics: ["stats_center"],
      assessments: ["assessment1", "assessment3"],
    },
    {
      id: "lesson5",
      number: 5,
      titleKey: "lesson.5.title",
      summaryKey: "lesson.5.summary",
      topics: ["stats_spread", "z_scores", "distributions"],
      assessments: ["assessment1", "assessment3"],
    },
    {
      id: "lesson6",
      number: 6,
      titleKey: "lesson.6.title",
      summaryKey: "lesson.6.summary",
      topics: ["literacy"],
      assessments: ["assessment1", "assessment4"],
    },
  ];

  const ASSESSMENTS = [
    {
      id: "assessment1",
      number: 1,
      titleKey: "assessment.1.title",
      summaryKey: "assessment.1.summary",
      available: true,
      lessons: ["lesson1", "lesson2", "lesson3", "lesson4", "lesson5", "lesson6"],
      topicIds: TOPIC_IDS.slice(),
    },
    {
      id: "assessment2",
      number: 2,
      titleKey: "assessment.2.title",
      summaryKey: "assessment.2.summary",
      available: false,
      lessons: ["lesson2", "lesson3"],
      topicIds: [
        "formulas",
        "perimeter_area",
        "volume",
        "pythagorean",
        "scale_rates",
        "scaling",
      ],
    },
    {
      id: "assessment3",
      number: 3,
      titleKey: "assessment.3.title",
      summaryKey: "assessment.3.summary",
      available: false,
      lessons: ["lesson4", "lesson5"],
      topicIds: [
        "stats_center",
        "stats_spread",
        "z_scores",
        "distributions",
      ],
    },
    {
      id: "assessment4",
      number: 4,
      titleKey: "assessment.4.title",
      summaryKey: "assessment.4.summary",
      available: false,
      lessons: ["lesson1", "lesson2", "lesson3", "lesson4", "lesson5", "lesson6"],
      topicIds: TOPIC_IDS.slice(),
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

  function getLesson(id) {
    return LESSONS.find(function (l) {
      return l.id === id;
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
    LESSONS: LESSONS,
    ASSESSMENTS: ASSESSMENTS,
    progressStorageKey: progressStorageKey,
    notesStorageKey: notesStorageKey,
    quizHref: quizHref,
    getAssessment: getAssessment,
    getLesson: getLesson,
    getDefaultAssessmentId: getDefaultAssessmentId,
    resolveAssessmentId: resolveAssessmentId,
    readProgressSummary: readProgressSummary,
  };
})();
