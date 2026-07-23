/**
 * Loads the question bank for the active assessment (sync).
 * Overview assessments set compose:true and list questionsScripts to merge banks.
 */
(function () {
  "use strict";
  var id = window.MAT107_ASSESSMENT_ID || "assessment1";
  var course = window.Mat107Course;
  var assessment = course && course.getAssessment ? course.getAssessment(id) : null;
  var scripts;
  if (assessment && assessment.compose && assessment.questionsScripts) {
    window.Mat107BankMode = true;
    scripts = assessment.questionsScripts.slice();
    scripts.push("js/q-compose.js");
  } else {
    scripts = [(assessment && assessment.questionsScript) || "js/questions.js"];
  }
  for (var i = 0; i < scripts.length; i++) {
    document.write('<script src="' + scripts[i] + '"><\/script>');
  }
})();
