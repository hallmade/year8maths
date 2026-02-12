import { getUnit } from "./content/catalog.js";
import { getEngine } from "./engines/index.js";
import { attachThemeToggle } from "./shared/theme.js";
import { renderLatex, typesetMath } from "./shared/latex.js";
import { pickCheckedValues, buildEvenSequence, chunkPairs } from "./shared/quiz-utils.js";

const params = new URLSearchParams(window.location.search);
const unitId = params.get("unit") || "";
const unit = getUnit(unitId);

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const setupPanel = document.getElementById("setupPanel");
const setupTopics = document.getElementById("setupTopics");
const setupQuestionTypes = document.getElementById("setupQuestionTypes");
const setupDifficulty = document.getElementById("setupDifficulty");
const quizHost = document.getElementById("quizHost");

const themeToggle = document.getElementById("themeToggle");
const generateQuizBtn = document.getElementById("generateQuizBtn");
const checkAnswersBtn = document.getElementById("checkAnswersBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const questionCountSelect = document.getElementById("questionCount");
const quizSection = document.getElementById("quizSection");
const quizMessage = document.getElementById("quizMessage");
const printQuizSheet = document.getElementById("printQuizSheet");
const printAnswerSheet = document.getElementById("printAnswerSheet");

let currentQuiz = [];
let selectedQuestionTypeKeys = new Set();
let visibleQuestionTypeKeys = new Set();

attachThemeToggle(themeToggle);

function questionTypeKey(topicId, questionTypeId) {
  return `${topicId}::${questionTypeId}`;
}

function parseQuestionTypeKey(key) {
  const splitIndex = key.indexOf("::");
  if (splitIndex === -1) {
    return null;
  }

  return {
    topicId: key.slice(0, splitIndex),
    questionTypeId: key.slice(splitIndex + 2),
  };
}

function difficultyLabel(value) {
  if (value === "easy") {
    return "Easy";
  }

  if (value === "medium") {
    return "Medium";
  }

  return "Harder";
}

function getAvailableTopicEntries() {
  if (!unit) {
    return [];
  }

  return unit.topics
    .map((topic) => ({
      topic,
      engine: getEngine(topic.id),
    }))
    .filter((entry) => entry.topic.available && entry.engine);
}

function getSelectedTopicIds() {
  return pickCheckedValues("topic");
}

function getTopicTitle(topicId) {
  const topic = unit?.topics.find((item) => item.id === topicId);
  return topic ? topic.title : topicId;
}

function getQuestionTypeLabel(topicId, questionTypeId) {
  const engine = getEngine(topicId);
  const match = engine?.questionTypes.find((item) => item.id === questionTypeId);
  return match ? match.label : questionTypeId;
}

function stripCategoryPrompt(latex) {
  return latex.replace(/^\\text\{[^}]*\}\s*/, "");
}

function expressionComplexityScore(latex) {
  return latex
    .replace(/\\text\{[^}]*\}/g, "")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}^_()]/g, "")
    .replace(/\s+/g, "").length;
}

function questionSpanForExpression(latex) {
  const score = expressionComplexityScore(latex);

  if (score <= 16) {
    return 2;
  }

  if (score <= 24) {
    return 3;
  }

  if (score <= 34) {
    return 4;
  }

  return 5;
}

function buildSingleWideRows(items) {
  return items
    .map((item) => {
      const cleanQuestion = stripCategoryPrompt(item.questionLatex);
      const question = `<span class="print-number">${item.printNumber}.</span><span class="print-expression">\\(${cleanQuestion}\\)</span>`;
      const questionSpan = questionSpanForExpression(cleanQuestion);
      const answerSpan = Math.max(1, 6 - questionSpan);

      return `
        <tr class="print-question-row wide-row">
          <td class="print-col-q" colspan="${questionSpan}">${question}</td>
          <td class="print-col-answer-ultra" colspan="${answerSpan}"></td>
        </tr>
      `;
    })
    .join("");
}

function buildTopicSection(topicId, items) {
  return `
    <table class="print-topic-table">
      <colgroup>
        <col style="width:25%">
        <col style="width:12.5%">
        <col style="width:12.5%">
        <col style="width:25%">
        <col style="width:12.5%">
        <col style="width:12.5%">
      </colgroup>
      <tr>
        <td class="print-topic-title-cell" colspan="6">${getTopicTitle(topicId)}:</td>
      </tr>
      ${buildSingleWideRows(items)}
    </table>
  `;
}

function buildPrintSheets(quizItems) {
  const topicOrder = getSelectedTopicIds();
  const topicsPresent = topicOrder.filter((topicId) => quizItems.some((item) => item.topicId === topicId));
  let nextPrintNumber = 1;
  const printQuizItems = [];

  topicsPresent.forEach((topicId) => {
    const topicItems = quizItems.filter((item) => item.topicId === topicId);
    topicItems.forEach((item) => {
      printQuizItems.push({
        ...item,
        printNumber: nextPrintNumber,
      });
      nextPrintNumber += 1;
    });
  });

  const quizSectionsHtml = topicsPresent
    .map((topicId) => {
      const topicItems = printQuizItems.filter((item) => item.topicId === topicId);
      return buildTopicSection(topicId, topicItems);
    })
    .join("");

  const answerSectionsHtml = topicsPresent
    .map((topicId) => {
      const topicItems = printQuizItems.filter((item) => item.topicId === topicId);
      const rows = chunkPairs(topicItems);
      const rowHtml = rows
        .map((row) => {
          const left = row[0];
          const right = row[1];

          const leftCell = left
            ? `<p class="print-answer-item"><span class="print-number">${left.printNumber}.</span><span class="print-expression">\\(${left.answerLatex}\\)</span></p>`
            : "";
          const rightCell = right
            ? `<p class="print-answer-item"><span class="print-number">${right.printNumber}.</span><span class="print-expression">\\(${right.answerLatex}\\)</span></p>`
            : "";

          return `
            <tr>
              <td class="print-answer-pair">${leftCell}</td>
              <td class="print-answer-pair">${rightCell}</td>
            </tr>
          `;
        })
        .join("");

      return `
        <p class="print-answer-topic">${getTopicTitle(topicId)}:</p>
        <table class="print-answer-table">${rowHtml}</table>
      `;
    })
    .join("");

  printQuizSheet.innerHTML = `
    <table class="print-header-table">
      <tr>
        <td class="print-quiz-title" colspan="4">${unit.title} Revision Quiz</td>
      </tr>
      <tr>
        <td class="label-cell">Name:</td>
        <td class="line-cell"></td>
        <td class="label-cell">Date:</td>
        <td class="line-cell"></td>
      </tr>
    </table>
    <div class="print-section-spacer"></div>
    ${quizSectionsHtml}
  `;

  printAnswerSheet.innerHTML = `
    <h2 class="print-title">${unit.title} Answer Sheet</h2>
    ${answerSectionsHtml}
  `;
}

function rebuildQuestionTypeControls() {
  const selectedTopicIds = getSelectedTopicIds();
  const entries = [];

  selectedTopicIds.forEach((topicId) => {
    const engine = getEngine(topicId);
    if (!engine) {
      return;
    }

    engine.questionTypes.forEach((questionType) => {
      entries.push({
        topicId,
        questionTypeId: questionType.id,
        questionTypeLabel: questionType.label,
        topicTitle: getTopicTitle(topicId),
      });
    });
  });

  const nextVisible = new Set(entries.map((entry) => questionTypeKey(entry.topicId, entry.questionTypeId)));

  selectedQuestionTypeKeys = new Set(
    Array.from(selectedQuestionTypeKeys).filter((key) => nextVisible.has(key)),
  );

  if (entries.length === 0) {
    setupQuestionTypes.innerHTML = '<p class="setup-note">Select at least one topic.</p>';
    visibleQuestionTypeKeys = new Set();
    return;
  }

  setupQuestionTypes.innerHTML = entries
    .map((entry) => {
      const key = questionTypeKey(entry.topicId, entry.questionTypeId);
      const shouldCheck = selectedQuestionTypeKeys.has(key) || !visibleQuestionTypeKeys.has(key);
      if (shouldCheck) {
        selectedQuestionTypeKeys.add(key);
      }

      return `<label class="check-item"><input type="checkbox" name="questionType" value="${key}" ${shouldCheck ? "checked" : ""}> ${entry.topicTitle} - ${entry.questionTypeLabel}</label>`;
    })
    .join("");

  visibleQuestionTypeKeys = nextVisible;
}

function createTopicControls() {
  const availableTopics = getAvailableTopicEntries();

  setupTopics.innerHTML = availableTopics
    .map(
      (entry, index) =>
        `<label class="check-item"><input type="checkbox" name="topic" value="${entry.topic.id}" ${index === 0 ? "checked" : ""}> ${entry.topic.title}</label>`,
    )
    .join("");
}

function createDifficultyControls() {
  const availableTopics = getAvailableTopicEntries();
  const difficultySource = availableTopics[0]?.engine;
  const difficultyOptions = difficultySource ? difficultySource.difficultyOptions : ["easy", "medium", "hard"];

  setupDifficulty.innerHTML = difficultyOptions
    .map((difficulty, index) => {
      const label = difficultyLabel(difficulty);
      return `<label class="check-item"><input type="radio" name="difficulty" value="${difficulty}" ${index === 0 ? "checked" : ""}> ${label}</label>`;
    })
    .join("");
}

function checkSingleQuestion(card, index) {
  const input = card.querySelector('[data-role="answer-input"]');
  const result = card.querySelector('[data-role="result"]');
  const expected = card.querySelector('[data-role="expected"]');
  const entered = input.value.trim();
  const item = currentQuiz[index];

  result.className = "result-line";

  if (!entered) {
    result.textContent = "🤔 Not attempted yet.";
    result.classList.add("blank");
    expected.classList.add("hidden");
    return false;
  }

  const engine = getEngine(item.topicId);
  if (!engine) {
    return false;
  }

  if (engine.check(item.questionTypeId, item.questionLatex, item.answerPlain, entered)) {
    result.textContent = "✅ 😎 Correct.";
    result.classList.add("correct");
    expected.classList.add("hidden");
    return true;
  }

  item.incorrectAttempts += 1;
  result.textContent = "❌ 😮 Not quite.";
  result.classList.add("incorrect");

  if (item.incorrectAttempts >= 3) {
    expected.textContent = `Correct answer: ${item.answerPlain}`;
    expected.classList.remove("hidden");
  } else {
    expected.classList.add("hidden");
  }

  return false;
}

function checkAnswers() {
  if (currentQuiz.length === 0) {
    return;
  }

  const cards = Array.from(quizSection.querySelectorAll(".quiz-question"));
  let correctCount = 0;

  cards.forEach((card, index) => {
    if (checkSingleQuestion(card, index)) {
      correctCount += 1;
    }
  });

  quizMessage.textContent = `Score: ${correctCount}/${currentQuiz.length}`;
}

function buildQuiz() {
  const questionTypeKeys = pickCheckedValues("questionType");
  selectedQuestionTypeKeys = new Set(questionTypeKeys);

  const selectedDifficulty = pickCheckedValues("difficulty");
  const questionCount = Number.parseInt(questionCountSelect.value, 10);

  if (questionTypeKeys.length === 0 || selectedDifficulty.length === 0) {
    quizMessage.textContent = "Choose at least one question type and one difficulty.";
    return;
  }

  const difficulty = selectedDifficulty[0];
  const questionTypeSequence = buildEvenSequence(questionTypeKeys, questionCount);

  currentQuiz = questionTypeSequence
    .map((entryKey, index) => {
      const parsed = parseQuestionTypeKey(entryKey);
      if (!parsed) {
        return null;
      }

      const engine = getEngine(parsed.topicId);
      if (!engine) {
        return null;
      }

      const problem = engine.generate(parsed.questionTypeId, difficulty);

      return {
        id: index + 1,
        topicId: parsed.topicId,
        topicTitle: getTopicTitle(parsed.topicId),
        questionTypeId: parsed.questionTypeId,
        questionTypeLabel: getQuestionTypeLabel(parsed.topicId, parsed.questionTypeId),
        difficulty,
        questionLatex: problem.questionLatex,
        answerLatex: problem.answerLatex,
        answerPlain: problem.answerPlain,
        incorrectAttempts: 0,
      };
    })
    .filter(Boolean);

  if (currentQuiz.length === 0) {
    quizMessage.textContent = "No valid questions were generated for this selection.";
    return;
  }

  quizSection.innerHTML = currentQuiz
    .map(
      (item) => `
        <article class="quiz-question" data-question-id="${item.id}">
          <div class="question-header">
            <span class="label">Question ${item.id}</span>
            <span class="meta">${item.topicTitle} | ${item.questionTypeLabel} | ${difficultyLabel(item.difficulty)}</span>
          </div>
          <p class="math" data-role="question">Loading...</p>
          <input class="quiz-answer-input" type="text" data-role="answer-input" placeholder="Type your answer exactly" autocomplete="off">
          <p class="result-line" data-role="result"></p>
          <p class="expected-answer hidden" data-role="expected">Correct answer: </p>
        </article>
      `,
    )
    .join("");

  const mathNodes = Array.from(quizSection.querySelectorAll('[data-role="question"]'));
  currentQuiz.forEach((item, index) => {
    renderLatex(mathNodes[index], item.questionLatex);
  });

  buildPrintSheets(currentQuiz);

  checkAnswersBtn.disabled = false;
  downloadPdfBtn.disabled = false;
  downloadPdfBtn.hidden = false;
  quizMessage.textContent = `Quiz ready: ${currentQuiz.length} questions.`;

  typesetMath([...mathNodes, printQuizSheet, printAnswerSheet]);
}

function bindPerQuestionEnterCheck() {
  quizSection.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    const input = event.target.closest('[data-role="answer-input"]');
    if (!input) {
      return;
    }

    const card = input.closest(".quiz-question");
    if (!card) {
      return;
    }

    event.preventDefault();

    const cards = Array.from(quizSection.querySelectorAll(".quiz-question"));
    const questionIndex = cards.indexOf(card);
    if (questionIndex === -1) {
      return;
    }

    const isCorrect = checkSingleQuestion(card, questionIndex);
    quizMessage.textContent = isCorrect
      ? `Question ${questionIndex + 1}: correct.`
      : `Question ${questionIndex + 1}: checked.`;
  });
}

function setInvalidState(message) {
  pageTitle.textContent = "Unit Quiz Not Available";
  pageSubtitle.textContent = message;
  setupPanel.style.display = "none";
  quizHost.innerHTML = `
    <p class="empty-state">${message}</p>
    <a class="button-link" href="index.html">Back to Units</a>
  `;
}

if (!unit) {
  setInvalidState("Use the landing page to choose a valid unit.");
} else {
  const availableTopics = getAvailableTopicEntries();

  if (availableTopics.length === 0) {
    setInvalidState("This unit does not have active quiz topics yet.");
  } else {
    pageTitle.textContent = `${unit.title} Revision Quiz`;
    pageSubtitle.textContent = "Pick topics and operations to build a targeted mixed-topic quiz.";

    createTopicControls();
    createDifficultyControls();
    rebuildQuestionTypeControls();

    setupPanel.addEventListener("change", (event) => {
      if (event.target && event.target.name === "topic") {
        rebuildQuestionTypeControls();
        return;
      }

      if (event.target && event.target.name === "questionType") {
        selectedQuestionTypeKeys = new Set(pickCheckedValues("questionType"));
      }
    });

    generateQuizBtn.addEventListener("click", buildQuiz);
    checkAnswersBtn.addEventListener("click", checkAnswers);
    downloadPdfBtn.addEventListener("click", () => window.print());
    bindPerQuestionEnterCheck();
  }
}
