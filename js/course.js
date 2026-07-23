/* MAT107 course hub — assessment picker grouped by week */
(function () {
  "use strict";

  const C = window.Mat107Course;
  const I18n = window.QuizI18n;
  const COLLAPSE_KEY = "mat107-week-collapsed";

  function t(key, vars) {
    return I18n && I18n.t ? I18n.t(key, vars || {}) : key;
  }

  if (!C) return;

  const els = {
    assessmentList: document.getElementById("assessment-list"),
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

  function tAssessment(assessment, key, vars) {
    if (assessment && assessment.theme) {
      const themed = assessment.theme + "." + key;
      if (I18n && I18n.has && I18n.has(themed)) {
        return t(themed, vars);
      }
    }
    return t(key, vars);
  }

  function readCollapsedMap() {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeCollapsedMap(map) {
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(map));
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function isWeekCollapsed(weekId, map) {
    if (!weekId || weekId === "overview") return false;
    return Boolean(map[weekId]);
  }

  function setWeekCollapsed(weekId, collapsed) {
    if (!weekId || weekId === "overview") return;
    const map = readCollapsedMap();
    if (collapsed) map[weekId] = true;
    else delete map[weekId];
    writeCollapsedMap(map);
  }

  function progressLine(assessment, summary) {
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
      text += " · " + tAssessment(assessment, "course_boss_cleared");
    }
    return (
      '<p class="card-progress">' +
      escapeHtml(text) +
      '</p><div class="progress-bar" role="presentation"><div class="progress-fill" style="width:' +
      pct +
      '%"></div></div>'
    );
  }

  function compactProgress(summary) {
    if (!summary || !summary.total) {
      return (
        '<div class="compact-progress" aria-label="' +
        escapeHtml(t("course_no_progress")) +
        '">' +
        '<span class="compact-progress-label muted">—</span>' +
        '<div class="progress-bar progress-bar--thin" role="presentation">' +
        '<div class="progress-fill" style="width:0%"></div></div></div>'
      );
    }
    const pct = Math.round((summary.mastered / summary.total) * 100);
    const label = t("course_mastery_short", {
      mastered: summary.mastered,
      total: summary.total,
    });
    return (
      '<div class="compact-progress" aria-label="' +
      escapeHtml(
        t("course_mastery_progress", {
          mastered: summary.mastered,
          total: summary.total,
          pct: pct,
        })
      ) +
      '">' +
      '<span class="compact-progress-label">' +
      escapeHtml(label) +
      "</span>" +
      '<div class="progress-bar progress-bar--thin" role="presentation">' +
      '<div class="progress-fill" style="width:' +
      pct +
      '%"></div></div></div>'
    );
  }

  function renderCompactCard(assessment) {
    const summary = C.readProgressSummary(assessment);
    return (
      '<article class="course-card assessment-card assessment-card--compact">' +
      '<div class="compact-row">' +
      '<span class="card-badge">' +
      escapeHtml(
        t(assessment.badgeKey || "course_assessment_n", {
          n: assessment.number,
        })
      ) +
      "</span>" +
      "<h3>" +
      escapeHtml(t(assessment.titleKey)) +
      "</h3>" +
      compactProgress(summary) +
      '<a class="primary card-btn card-btn--compact" href="' +
      escapeHtml(C.quizHref(assessment.id)) +
      '">' +
      escapeHtml(t("course_open_short")) +
      "</a>" +
      "</div>" +
      "</article>"
    );
  }

  function renderCard(assessment) {
    if (assessment.compose) return renderCompactCard(assessment);
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
      progressLine(assessment, summary) +
      '<div class="card-actions">' +
      '<a class="primary card-btn" href="' +
      escapeHtml(C.quizHref(assessment.id)) +
      '">' +
      escapeHtml(t("course_open_practice")) +
      "</a>" +
      "</div>" +
      "</article>"
    );
  }

  function assessmentsForWeek(weekId) {
    return (C.ASSESSMENTS || []).filter(function (a) {
      return a.available !== false && a.weekId === weekId;
    });
  }

  function renderWeekGroup(week, collapsedMap) {
    const quizzes = assessmentsForWeek(week.id);
    if (!quizzes.length) return "";

    const isOverview = week.id === "overview";
    const title = t(week.titleKey);
    const collapsed = isWeekCollapsed(week.id, collapsedMap);

    if (isOverview) {
      return (
        '<section class="week-group week-group--overview" data-week="' +
        escapeHtml(week.id) +
        '">' +
        '<div class="card-grid card-grid--compact">' +
        quizzes.map(renderCard).join("") +
        "</div>" +
        "</section>"
      );
    }

    return (
      '<section class="week-group' +
      (collapsed ? " is-collapsed" : "") +
      '" data-week="' +
      escapeHtml(week.id) +
      '" data-collapsed="' +
      (collapsed ? "true" : "false") +
      '">' +
      '<header class="week-group-head">' +
      '<button type="button" class="week-group-toggle" aria-expanded="' +
      (collapsed ? "false" : "true") +
      '" aria-controls="week-body-' +
      escapeHtml(week.id) +
      '" data-week-toggle="' +
      escapeHtml(week.id) +
      '">' +
      '<span class="week-group-chevron" aria-hidden="true"></span>' +
      '<span class="week-group-toggle-text">' +
      "<span class=\"week-group-title\">" +
      escapeHtml(title) +
      "</span>" +
      (week.blurbKey
        ? '<span class="muted week-group-blurb">' +
          escapeHtml(t(week.blurbKey)) +
          "</span>"
        : "") +
      "</span>" +
      '<span class="visually-hidden week-toggle-hint">' +
      escapeHtml(
        collapsed
          ? t("course_week_expand", { title: title })
          : t("course_week_collapse", { title: title })
      ) +
      "</span>" +
      "</button>" +
      "</header>" +
      '<div class="week-group-body" id="week-body-' +
      escapeHtml(week.id) +
      '"' +
      (collapsed ? " hidden" : "") +
      ">" +
      '<div class="card-grid">' +
      quizzes.map(renderCard).join("") +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function renderAssessments() {
    if (!els.assessmentList) return;
    const groups = C.WEEK_GROUPS || [];
    const collapsedMap = readCollapsedMap();
    els.assessmentList.innerHTML = groups
      .map(function (week) {
        return renderWeekGroup(week, collapsedMap);
      })
      .join("");
  }

  function applyCollapsedState(section, collapsed) {
    const weekId = section.getAttribute("data-week");
    const toggle = section.querySelector("[data-week-toggle]");
    const body = section.querySelector(".week-group-body");
    const hint = section.querySelector(".week-toggle-hint");
    const title = toggle
      ? (toggle.querySelector(".week-group-title") || {}).textContent || ""
      : "";

    section.classList.toggle("is-collapsed", collapsed);
    section.setAttribute("data-collapsed", collapsed ? "true" : "false");
    if (toggle) toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    if (body) {
      if (collapsed) body.setAttribute("hidden", "");
      else body.removeAttribute("hidden");
    }
    if (hint) {
      hint.textContent = collapsed
        ? t("course_week_expand", { title: title })
        : t("course_week_collapse", { title: title });
    }
    setWeekCollapsed(weekId, collapsed);
  }

  function bindCollapse() {
    if (!els.assessmentList || els.assessmentList.dataset.collapseBound === "1") {
      return;
    }
    els.assessmentList.dataset.collapseBound = "1";
    els.assessmentList.addEventListener("click", function (ev) {
      const btn = ev.target.closest("[data-week-toggle]");
      if (!btn || !els.assessmentList.contains(btn)) return;
      const section = btn.closest(".week-group");
      if (!section || section.classList.contains("week-group--overview")) return;
      const collapsed = section.getAttribute("data-collapsed") !== "true";
      applyCollapsedState(section, collapsed);
    });
  }

  function render() {
    renderAssessments();
  }

  function start() {
    if (I18n) {
      I18n.onChange(function () {
        I18n.applyStatic();
        render();
      });
    }
    bindCollapse();
    render();
  }

  if (I18n && I18n.ready && typeof I18n.ready.then === "function") {
    I18n.ready.then(start);
  } else {
    start();
  }
})();
