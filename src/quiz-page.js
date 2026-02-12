import { getUnit, getTopic } from "./content/catalog.js";
import { getEngine } from "./engines/index.js";
import { attachThemeToggle } from "./shared/theme.js";
import { renderLatex, typesetMath } from "./shared/latex.js";
import { pickCheckedValues, buildEvenSequence, chunkPairs } from "./shared/quiz-utils.js";

const params = new URLSearchParams(window.location.search);
const unitId = params.get("unit") || "";
const topicId = params.get("topic") || "";

const unit = getUnit(unitId);
const topic = getTopic(unitId, topicId);
const engine = getEngine(topicId);

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const setupTopics = document.getElementById("setupTopics");
const setupDifficulty = document.getElementById("setupDifficulty");
const setupPanel = document.getElementById("setupPanel");
const quizHost = document.getElementById("quizHost");
const backPracticeLink = document.getElementById("backPracticeLink");

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

attachThemeToggle(themeToggle);

function difficultyLabel(value) {
  if (value === "easy") {
    return "Easy";
  }

  if (value === "medium") {
    return "Medium";
  }

  return "Harder";
}

function questionTypeLabel(id) {
  const entry = engine.questionTypes.find((item) => item.id === id);
  return entry ? entry.label : id;
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

function buildSolveRows(items) {
  const rows = chunkPairs(items);

  return rows
    .map((row) => {
      const left = row[0];
      const right = row[1];
      const leftQuestionHtml = left
        ? `<span class="print-number">${left.printNumber}.</span><span class="print-expression">\\(${stripCategoryPrompt(left.questionLatex)}\\)</span>`
        : "";
      const rightQuestionHtml = right
        ? `<span class="print-number">${right.printNumber}.</span><span class="print-expression">\\(${stripCategoryPrompt(right.questionLatex)}\\)</span>`
        : "";

      return `
        <tr class="print-question-row solve-row">
          <td class="print-col-q">${leftQuestionHtml}</td>
          <td class="print-col-xeq">\\(x=\\)</td>
          <td class="print-col-answer-line"></td>
          <td class="print-col-q">${rightQuestionHtml}</td>
          <td class="print-col-xeq">\\(x=\\)</td>
          <td class="print-col-answer-line"></td>
        </tr>
      `;
    })
    .join("");
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

function buildTopicSection(typeId, items) {
  const useSolveLayout = engine.id === "algebra-expressions" && typeId === "solve";
  const title = `${questionTypeLabel(typeId)}:`;

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
        <td class="print-topic-title-cell" colspan="6">${title}</td>
      </tr>
      ${useSolveLayout ? buildSolveRows(items) : buildSingleWideRows(items)}
    </table>
  `;
}

function buildPrintSheets(quizItems) {
  const typeOrder = engine.questionTypes.map((item) => item.id);
  const typesPresent = typeOrder.filter((typeId) => quizItems.some((item) => item.questionType === typeId));
  let nextPrintNumber = 1;
  const printQuizItems = [];

  typesPresent.forEach((typeId) => {
    const typeItems = quizItems.filter((item) => item.questionType === typeId);
    typeItems.forEach((item) => {
      printQuizItems.push({
        ...item,
        printNumber: nextPrintNumber,
      });
      nextPrintNumber += 1;
    });
  });

  const quizSectionsHtml = typesPresent
    .map((typeId) => {
      const typeItems = printQuizItems.filter((item) => item.questionType === typeId);
      return buildTopicSection(typeId, typeItems);
    })
    .join("");

  const answerSectionsHtml = typesPresent
    .map((typeId) => {
      const typeItems = printQuizItems.filter((item) => item.questionType === typeId);
      const rows = chunkPairs(typeItems);
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
        <p class="print-answer-topic">${questionTypeLabel(typeId)}:</p>
        <table class="print-answer-table">${rowHtml}</table>
      `;
    })
    .join("");

  printQuizSheet.innerHTML = `
    <table class="print-header-table">
      <tr>
        <td class="print-quiz-title" colspan="4">${topic.title} Quiz</td>
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
    <h2 class="print-title">${topic.title} Answer Sheet</h2>
    ${answerSectionsHtml}
  `;
}

function createQuestionTypeControls() {
  setupTopics.innerHTML = engine.questionTypes
    .map(
      (type, index) =>
        `<label class="check-item"><input type="checkbox" name="questionType" value="${type.id}" ${index === 0 ? "checked" : ""}> ${type.label}</label>`,
    )
    .join("");
}

function createDifficultyControls() {
  setupDifficulty.innerHTML = engine.difficultyOptions
    .map((difficulty, index) => {
      const label = difficultyLabel(difficulty);
      return `<label class="check-item"><input type="radio" name="difficulty" value="${difficulty}" ${index === 0 ? "checked" : ""}> ${label}</label>`;
    })
    .join("");
}

function buildQuiz() {
  const selectedTypes = pickCheckedValues("questionType");
  const selectedDifficulty = pickCheckedValues("difficulty");
  const questionCount = Number.parseInt(questionCountSelect.value, 10);

  if (selectedTypes.length === 0 || selectedDifficulty.length === 0) {
    quizMessage.textContent = "Choose at least one question type and one difficulty.";
    return;
  }

  const typeSequence = buildEvenSequence(selectedTypes, questionCount);
  const difficulty = selectedDifficulty[0];

  currentQuiz = typeSequence.map((questionType, index) => {
    const problem = engine.generate(questionType, difficulty);

    return {
      id: index + 1,
      questionType,
      difficulty,
      questionLatex: problem.questionLatex,
      answerLatex: problem.answerLatex,
      answerPlain: problem.answerPlain,
      incorrectAttempts: 0,
    };
  });

  quizSection.innerHTML = currentQuiz
    .map(
      (item) => `
        <article class="quiz-question" data-question-id="${item.id}">
          <div class="question-header">
            <span class="label">Question ${item.id}</span>
            <span class="meta">${questionTypeLabel(item.questionType)} | ${difficultyLabel(item.difficulty)}</span>
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
  quizMessage.textContent = `Quiz ready: ${questionCount} questions.`;

  typesetMath([...mathNodes, printQuizSheet, printAnswerSheet]);
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

  if (engine.check(item.questionType, item.questionLatex, item.answerPlain, entered)) {
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

function setInvalidState() {
  pageTitle.textContent = "Topic Not Available";
  pageSubtitle.textContent = "Go back to Units and select an available topic.";
  setupPanel.style.display = "none";
  quizHost.innerHTML = `
    <p class="empty-state">This topic is not available yet.</p>
    <a class="button-link" href="index.html">Back to Units</a>
  `;
}

if (!unit || !topic || !topic.available || !engine) {
  setInvalidState();
} else {
  pageTitle.textContent = `${unit.title}: ${topic.title} Quiz`;
  pageSubtitle.textContent = "Choose question types and difficulty, then generate a self-marking printable quiz.";
  backPracticeLink.href = `practice.html?unit=${encodeURIComponent(unit.id)}&topic=${encodeURIComponent(topic.id)}`;

  createQuestionTypeControls();
  createDifficultyControls();

  generateQuizBtn.addEventListener("click", buildQuiz);
  checkAnswersBtn.addEventListener("click", checkAnswers);
  downloadPdfBtn.addEventListener("click", () => window.print());
  bindPerQuestionEnterCheck();
}
