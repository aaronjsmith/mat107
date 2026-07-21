/* MAT107 course hub — assessment picker */
(function () {
  "use strict";

  const C = window.Mat107Course;
  const I18n = window.QuizI18n;

  function t(key, vars) {
    return I18n && I18n.t ? I18n.t(key, vars || {}) : key;
  }

  if (!C) return;

  const els = {
    assessmentList: document.getElementById("assessment-list"),
    lang: document.getElementById("lang-select"),
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function topicPills(topicIds) {
    return topicIds
      .map(function (tid) {
        return (
          '<span class="topic-pill">' + escapeHtml(t("topic." + tid)) + "</span>"
        );
      })
      .join("");
  }

  function progressLine(summary) {
    if (!summary || !summary.total) {
      return '<p class="card-progress muted">' + escapeHtml(t("course_no_progress")) + "</p>";
    }
    const pct = Math.round((summary.mastered / summary.total) * 100);
    let text = t("course_mastery_progress", {
      mastered: summary.mastered,
      total: summary.total,
      pct: pct,
    });
    if (summary.attempted && summary.accuracy != null) {
      text +=
        " · " +
        t("course_grade_progress", {
          grade: summary.accuracy,
          answered: summary.attempted,
        });
    }
    if (summary.bossCleared) {
      text += " · " + t("course_boss_cleared");
    }
    return (
      '<p class="card-progress">' +
      escapeHtml(text) +
      '</p><div class="progress-bar" role="presentation"><div class="progress-fill" style="width:' +
      pct +
      '%"></div></div>'
    );
  }

  function renderAssessments() {
    if (!els.assessmentList) return;
    els.assessmentList.innerHTML = C.ASSESSMENTS.map(function (assessment) {
      const summary = C.readProgressSummary(assessment);
      return (
        '<article class="course-card assessment-card">' +
        '<div class="card-badge">' +
        escapeHtml(
          t(assessment.badgeKey || "course_assessment_n", {
            n: assessment.number,
          })
        ) +
        "</div>" +
        "<h3>" +
        escapeHtml(t(assessment.titleKey)) +
        "</h3>" +
        '<p class="card-summary">' +
        escapeHtml(t(assessment.summaryKey)) +
        "</p>" +
        '<div class="topic-pills">' +
        topicPills(assessment.topicIds || []) +
        "</div>" +
        progressLine(summary) +
        '<div class="card-actions">' +
        '<a class="primary card-btn" href="' +
        escapeHtml(C.quizHref(assessment.id)) +
        '">' +
        escapeHtml(t("course_open_practice")) +
        "</a>" +
        "</div>" +
        "</article>"
      );
    }).join("");
  }

  function render() {
    renderAssessments();
  }

  function start() {
    if (I18n && els.lang) {
      I18n.fillSelect(els.lang);
      els.lang.addEventListener("change", function () {
        I18n.setLang(els.lang.value);
      });
      I18n.onChange(function () {
        I18n.applyStatic();
        render();
      });
    }
    render();
  }

  if (I18n && I18n.ready && typeof I18n.ready.then === "function") {
    I18n.ready.then(start);
  } else {
    start();
  }
})();
