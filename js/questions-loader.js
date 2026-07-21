/**
 * Loads the question bank for the active assessment (sync).
 */
(function () {
  "use strict";
  var id = window.MAT107_ASSESSMENT_ID || "assessment1";
  var course = window.Mat107Course;
  var assessment = course && course.getAssessment ? course.getAssessment(id) : null;
  var src = (assessment && assessment.questionsScript) || "js/questions.js";
  document.write('<script src="' + src + '"><\/script>');
})();
