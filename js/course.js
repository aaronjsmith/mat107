/* MAT107 course hub — lessons & assessments index */
(function () {
  "use strict";

  const C = window.Mat107Course;
  const I18n = window.QuizI18n;

  function t(key, vars) {
    return I18n && I18n.t ? I18n.t(key, vars || {}) : key;
  }

  if (!C) return;

  const els = {
    lessonList: document.getElementById("lesson-list"),
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

  function primaryAssessmentForLesson(lesson) {
    const ids = lesson.assessments || [];
    for (let i = 0; i < ids.length; i++) {
      const a = C.getAssessment(ids[i]);
      if (a && a.available) return a;
    }
    return null;
  }

  function renderLessons() {
    if (!els.lessonList) return;
    els.lessonList.innerHTML = C.LESSONS.map(function (lesson) {
      const practice = primaryAssessmentForLesson(lesson);
      const practiceHtml = practice
        ? '<a class="card-link" href="' +
          escapeHtml(C.quizHref(practice.id)) +
          '">' +
          escapeHtml(t("course_practice_assessment", { n: practice.number })) +
          "</a>"
        : '<span class="card-soon muted">' +
          escapeHtml(t("course_coming_soon")) +
          "</span>";
      return (
        '<article class="course-card lesson-card">' +
        '<div class="card-badge">' +
        escapeHtml(t("course_lesson_n", { n: lesson.number })) +
        "</div>" +
        "<h3>" +
        escapeHtml(t(lesson.titleKey)) +
        "</h3>" +
        '<p class="card-summary">' +
        escapeHtml(t(lesson.summaryKey)) +
        "</p>" +
        '<div class="topic-pills">' +
        topicPills(lesson.topics) +
        "</div>" +
        '<div class="card-actions">' +
        practiceHtml +
        "</div>" +
        "</article>"
      );
    }).join("");
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
      const status = assessment.available
        ? '<span class="status-pill status-live">' +
          escapeHtml(t("course_status_live")) +
          "</span>"
        : '<span class="status-pill status-soon">' +
          escapeHtml(t("course_status_soon")) +
          "</span>";
      const action = assessment.available
        ? '<a class="primary card-btn" href="' +
          escapeHtml(C.quizHref(assessment.id)) +
          '">' +
          escapeHtml(t("course_open_practice")) +
          "</a>"
        : '<button class="ghost card-btn" type="button" disabled>' +
          escapeHtml(t("course_coming_soon")) +
          "</button>";
      return (
        '<article class="course-card assessment-card' +
        (assessment.available ? "" : " is-soon") +
        '">' +
        '<div class="card-head">' +
        '<div class="card-badge">' +
        escapeHtml(t("course_assessment_n", { n: assessment.number })) +
        "</div>" +
        status +
        "</div>" +
        "<h3>" +
        escapeHtml(t(assessment.titleKey)) +
        "</h3>" +
        '<p class="card-summary">' +
        escapeHtml(t(assessment.summaryKey)) +
        "</p>" +
        progressLine(summary) +
        '<div class="card-actions">' +
        action +
        "</div>" +
        "</article>"
      );
    }).join("");
  }

  function render() {
    renderLessons();
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
