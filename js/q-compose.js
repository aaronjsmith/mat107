/**
 * Composes window.QuizQuestions from banks registered on window.Mat107Banks.
 * Used by the full-course overview (and any assessment with compose: true).
 */
(function () {
  "use strict";

  const HINT_CREDIT = { 0: 1.0, 1: 0.75, 2: 0.5, 3: 0.25 };
  const RETRY_CREDIT = 0.05;
  const UNAIDED_TO_MASTER = 10;

  const recentPick = {
    fingerprints: [],
    topics: [],
    gens: [],
  };
  const RECENT_KEEP = 48;

  function t(key, vars) {
    if (window.QuizI18n && window.QuizI18n.t) {
      return window.QuizI18n.t(key, vars || {});
    }
    return key;
  }

  function i18nHas(key) {
    return Boolean(window.QuizI18n && window.QuizI18n.has && window.QuizI18n.has(key));
  }

  function remember(list, value, keep) {
    keep = keep || RECENT_KEEP;
    list.unshift(value);
    if (list.length > keep) list.length = keep;
  }

  function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function CALC_GENERIC() {
    return { ti: t("calc_generic_ti"), casio: t("calc_generic_casio") };
  }

  function parseNumericInput(raw) {
    let s = String(raw == null ? "" : raw)
      .trim()
      .replace(/\s/g, "")
      .replace(/½/g, "0.5");
    if (!s) return NaN;
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
    else s = s.replace(/,/g, "");
    const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    if (frac) {
      const den = Number(frac[2]);
      if (!den) return NaN;
      return Number(frac[1]) / den;
    }
    if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return NaN;
    return Number(s);
  }

  function collect(filterIds) {
    const banks = window.Mat107Banks || {};
    const allow =
      filterIds && filterIds.length
        ? filterIds.reduce(function (o, id) {
            o[id] = true;
            return o;
          }, {})
        : null;
    const topics = {};
    const generators = [];
    const topicCache = {};

    Object.keys(banks).forEach(function (bid) {
      const b = banks[bid];
      if (!b) return;
      const bt = b.topics || {};
      Object.keys(bt).forEach(function (tid) {
        if (!allow || allow[tid]) topics[tid] = bt[tid];
      });
      (b.generators || []).forEach(function (gen) {
        generators.push(gen);
      });
    });

    if (allow) {
      filterIds.forEach(function (tid) {
        if (!topics[tid]) topics[tid] = t("topic." + tid);
      });
    }

    function topicOf(gen) {
      if (!topicCache[gen]) {
        try {
          topicCache[gen] = gen().topic;
        } catch (e) {
          topicCache[gen] = "";
        }
      }
      return topicCache[gen];
    }

    let filtered = generators;
    if (allow) {
      filtered = generators.filter(function (g) {
        return allow[topicOf(g)];
      });
    }

    return { topics: topics, generators: filtered, topicOf: topicOf };
  }

  function fingerprint(q) {
    let ans = "";
    if (q.type === "multi" && q.fields) {
      ans = q.fields
        .map(function (f) {
          return f.id + "=" + f.answer;
        })
        .join("|");
    } else if (q.answer != null) ans = String(q.answer);
    return (q.topic || "") + "::" + (q.type || "") + "::" + ans;
  }

  function selectOptionLabel(field, value) {
    const opts = field.options || [];
    for (let i = 0; i < opts.length; i++) {
      if (String(opts[i].value) === String(value)) return opts[i].label;
    }
    return String(value);
  }

  function formatFieldExpected(field) {
    const lbl = field.label || field.id;
    if (field.type === "select") {
      return lbl + ": " + selectOptionLabel(field, field.answer);
    }
    const u = field.unit ? " " + field.unit : "";
    return lbl + ": " + field.answer + u;
  }

  function formatMultiExpected(question) {
    return (question.fields || []).map(formatFieldExpected).join(" · ");
  }

  function checkMultiField(field, userVal) {
    if (field.type === "select") {
      return String(userVal).trim() === String(field.answer).trim();
    }
    const val = parseNumericInput(userVal);
    if (isNaN(val)) return false;
    return (
      Math.abs(val - Number(field.answer)) <=
      Number(field.tolerance !== undefined ? field.tolerance : 0.05)
    );
  }

  function checkAnswer(question, userAnswer) {
    const qtype = question.type;
    if (qtype === "mc") {
      const ok = String(userAnswer).trim() === String(question.answer).trim();
      return [ok, String(question.answer)];
    }
    if (qtype === "numeric") {
      const val = parseNumericInput(userAnswer);
      if (isNaN(val)) return [false, String(question.answer)];
      const ok =
        Math.abs(val - Number(question.answer)) <=
        Number(question.tolerance !== undefined ? question.tolerance : 0.05);
      return [ok, String(question.answer)];
    }
    if (qtype === "multi") {
      const answers =
        typeof userAnswer === "object" && userAnswer != null ? userAnswer : {};
      let allOk = true;
      (question.fields || []).forEach(function (f) {
        if (!checkMultiField(f, answers[f.id])) allOk = false;
      });
      return [allOk, formatMultiExpected(question)];
    }
    if (qtype === "flashcard" || qtype === "formula") {
      const expected = String(question.answer || "").replace(/\s+/g, "").toLowerCase();
      const got = String(userAnswer || "").replace(/\s+/g, "").toLowerCase();
      return [got === expected, String(question.answer)];
    }
    return [false, ""];
  }

  function publicQuestion(q, topics) {
    let hint1 = q.hint || "";
    const hint2 = q.setup || "";
    let calc = q.calc || null;
    if (!calc && hint2) calc = CALC_GENERIC();
    let hint3ti = "";
    let hint3casio = "";
    if (calc && typeof calc === "object") {
      hint3ti = calc.ti || "";
      hint3casio = calc.casio || "";
    }
    const overviewKey = "hint_overview." + (q.topic || "");
    const overview = i18nHas(overviewKey) ? t(overviewKey) : t("hint_overview.generic");
    if (hint1) hint1 = overview + "\n\n" + hint1;
    else if (overview) hint1 = overview;

    let clarify = q.clarify || "";
    if (!clarify) {
      const steps = [t("clarify_intro"), overview];
      if (q.hint) steps.push(t("clarify_step_idea") + " " + q.hint);
      if (hint2) steps.push(t("clarify_step_setup") + "\n" + hint2);
      steps.push(t("clarify_step_finish"));
      clarify = steps.join("\n\n");
    }

    const out = {
      id: q.id,
      topic: q.topic,
      topic_label: topics[q.topic] || q.topic,
      type: q.type,
      prompt: q.prompt,
      hint1: hint1,
      hint2: hint2,
      hint3_ti: hint3ti,
      hint3_casio: hint3casio,
      clarify: clarify,
      has_hint1: Boolean(hint1),
      has_hint2: Boolean(hint2),
      has_hint3: Boolean(hint3ti || hint3casio),
      has_clarify: Boolean(clarify),
      unit: q.unit || "",
    };
    if (q.type === "mc") out.choices = q.choices;
    if (q.type === "multi") {
      out.fields = (q.fields || []).map(function (f) {
        const pubField = {
          id: f.id,
          label: f.label || "",
          type: f.type || "numeric",
          unit: f.unit || "",
        };
        if (f.type === "select") {
          pubField.options = (f.options || []).map(function (o) {
            return { value: o.value, label: o.label };
          });
        }
        return pubField;
      });
      out.layout = q.layout || [];
    }
    if (q.svg) out.svg = q.svg;
    return out;
  }

  function build(filterIds) {
    const pack = collect(filterIds);
    const topics = pack.topics;
    const GENERATORS = pack.generators;
    const topicOf = pack.topicOf;

    function pickTopicForMix(forcedTopic) {
      if (forcedTopic && forcedTopic !== "all") return forcedTopic;
      const keys = Object.keys(topics);
      if (!keys.length) return null;
      const avoid = recentPick.topics.slice(0, 2);
      const pool = keys.filter(function (k) {
        return avoid.indexOf(k) < 0;
      });
      return choice(pool.length ? pool : keys);
    }

    function generateQuestion(topic) {
      if (!GENERATORS.length) {
        return {
          id: "empty",
          topic: "literacy",
          type: "mc",
          prompt: "No generators loaded for this overview.",
          choices: ["OK"],
          answer: "OK",
          hint: "",
          setup: "",
        };
      }
      const targetTopic = pickTopicForMix(topic);
      let pool = GENERATORS;
      if (targetTopic) {
        const filtered = GENERATORS.filter(function (g) {
          return topicOf(g) === targetTopic;
        });
        if (filtered.length) pool = filtered;
      }
      for (let attempt = 0; attempt < 12; attempt++) {
        const gen = choice(pool);
        const q = gen();
        q._gen = gen;
        const fp = fingerprint(q);
        if (recentPick.fingerprints.indexOf(fp) < 0 || attempt === 11) {
          remember(recentPick.gens, gen, 8);
          remember(recentPick.topics, q.topic, 6);
          remember(recentPick.fingerprints, fp, RECENT_KEEP);
          return q;
        }
      }
      const gen = choice(pool);
      const q = gen();
      q._gen = gen;
      return q;
    }

    function remixQuestion(prev) {
      const gen = prev && typeof prev._gen === "function" ? prev._gen : null;
      if (!gen) return generateQuestion(prev && prev.topic ? prev.topic : "all");
      const oldFp = fingerprint(prev);
      for (let attempt = 0; attempt < 14; attempt++) {
        const q = gen();
        q._gen = gen;
        const fp = fingerprint(q);
        if (fp !== oldFp && recentPick.fingerprints.indexOf(fp) < 0) {
          remember(recentPick.gens, gen, 8);
          remember(recentPick.topics, q.topic, 6);
          remember(recentPick.fingerprints, fp, RECENT_KEEP);
          return q;
        }
      }
      const q = gen();
      q._gen = gen;
      return q;
    }

    let bossTheme = false;
    window.QuizQuestions = {
      get TOPICS() {
        return topics;
      },
      HINT_CREDIT: HINT_CREDIT,
      RETRY_CREDIT: RETRY_CREDIT,
      UNAIDED_TO_MASTER: UNAIDED_TO_MASTER,
      setBossTheme: function (on) {
        bossTheme = Boolean(on);
        Object.keys(window.Mat107Banks || {}).forEach(function (bid) {
          const b = window.Mat107Banks[bid];
          if (b && typeof b.setBossTheme === "function") b.setBossTheme(on);
        });
      },
      generateQuestion: generateQuestion,
      remixQuestion: remixQuestion,
      checkAnswer: checkAnswer,
      publicQuestion: function (q) {
        return publicQuestion(q, topics);
      },
    };
    return window.QuizQuestions;
  }

  window.Mat107Compose = { build: build };

  const course = window.Mat107Course;
  const id = window.MAT107_ASSESSMENT_ID;
  const assessment = course && course.getAssessment ? course.getAssessment(id) : null;
  if (assessment && assessment.compose) {
    build(assessment.topicIds || []);
  }
})();
