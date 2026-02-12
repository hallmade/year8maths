import { getUnit, getTopic } from "./content/catalog.js";
import { getEngine } from "./engines/index.js";
import { attachThemeToggle } from "./shared/theme.js";
import { renderLatex, typesetMath } from "./shared/latex.js";

const params = new URLSearchParams(window.location.search);
const unitId = params.get("unit") || "";
const topicId = params.get("topic") || "";

const unit = getUnit(unitId);
const topic = getTopic(unitId, topicId);
const engine = getEngine(topicId);

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const taskType = document.getElementById("taskType");
const difficultyLevel = document.getElementById("difficultyLevel");
const questionText = document.getElementById("questionText");
const answerText = document.getElementById("answerText");
const revealBtn = document.getElementById("revealBtn");
const nextBtn = document.getElementById("nextBtn");
const quizPageBtn = document.getElementById("quizPageBtn");
const themeToggle = document.getElementById("themeToggle");
const practicePanel = document.getElementById("practicePanel");

let currentProblem = null;

attachThemeToggle(themeToggle);

function setInvalidState() {
  pageTitle.textContent = "Topic Not Available";
  pageSubtitle.textContent = "Go back to Units and select an available topic.";
  practicePanel.innerHTML = `
    <p class="empty-state">This topic is not available yet.</p>
    <a class="button-link" href="index.html">Back to Units</a>
  `;
}

function populateTypeOptions() {
  taskType.innerHTML = engine.questionTypes
    .map((type) => `<option value="${type.id}">${type.label}</option>`)
    .join("");
}

function populateDifficultyOptions() {
  difficultyLevel.innerHTML = engine.difficultyOptions
    .map((difficulty) => {
      const label = difficulty === "hard" ? "Harder" : `${difficulty.slice(0, 1).toUpperCase()}${difficulty.slice(1)}`;
      return `<option value="${difficulty}">${label}</option>`;
    })
    .join("");
}

function showNewProblem() {
  currentProblem = engine.generate(taskType.value, difficultyLevel.value);
  renderLatex(questionText, currentProblem.questionLatex);
  renderLatex(answerText, currentProblem.answerLatex);
  answerText.classList.add("hidden");
  typesetMath([questionText, answerText]);
}

if (!unit || !topic || !topic.available || !engine) {
  setInvalidState();
} else {
  pageTitle.textContent = `${unit.title}: ${topic.title}`;
  pageSubtitle.textContent = "Generate practice questions, reveal answers, then switch to quiz mode.";

  quizPageBtn.href = `quiz.html?unit=${encodeURIComponent(unit.id)}&topic=${encodeURIComponent(topic.id)}`;

  populateTypeOptions();
  populateDifficultyOptions();

  revealBtn.addEventListener("click", () => {
    answerText.classList.remove("hidden");
    if (currentProblem) {
      typesetMath([answerText]);
    }
  });

  nextBtn.addEventListener("click", showNewProblem);
  taskType.addEventListener("change", showNewProblem);
  difficultyLevel.addEventListener("change", showNewProblem);

  showNewProblem();
}
