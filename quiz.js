const themeToggle = document.getElementById("themeToggle");
const generateQuizBtn = document.getElementById("generateQuizBtn");
const checkAnswersBtn = document.getElementById("checkAnswersBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const questionCountSelect = document.getElementById("questionCount");
const quizSection = document.getElementById("quizSection");
const quizMessage = document.getElementById("quizMessage");
const printQuizSheet = document.getElementById("printQuizSheet");
const printAnswerSheet = document.getElementById("printAnswerSheet");
const themeStorageKey = "algebra-expression-theme";

let currentQuiz = [];

function applyTheme(theme) {
  const activeTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = activeTheme;
  themeToggle.setAttribute("aria-pressed", activeTheme === "dark" ? "true" : "false");
  themeToggle.textContent = activeTheme === "dark" ? "Switch to Light" : "Switch to Dark";
}

function readPreferredTheme() {
  try {
    const storedTheme = localStorage.getItem(themeStorageKey);
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch (error) {
    // Local storage may be blocked in strict browser settings.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNonZeroInt(min, max) {
  let value = 0;
  while (value === 0) {
    value = randomInt(min, max);
  }
  return value;
}

const simplifyVariablePool = ["x", "y", "z", "a", "b", "c"];

function pickDistinctVariables(count) {
  const pool = [...simplifyVariablePool];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, count);
}

function escapeLatexText(text) {
  return text.replace(/\\/g, "\\\\").replace(/([{}])/g, "\\$1");
}

function formatExpressionTerms(terms) {
  const parts = [];

  terms.forEach((term) => {
    const coef = term.coef;
    const variable = term.variable || "";

    if (coef === 0) {
      return;
    }

    const absCoef = Math.abs(coef);
    const core = variable
      ? absCoef === 1
        ? variable
        : `${absCoef}${variable}`
      : `${absCoef}`;

    if (parts.length === 0) {
      parts.push(coef < 0 ? `-${core}` : core);
      return;
    }

    parts.push(coef < 0 ? `- ${core}` : `+ ${core}`);
  });

  return parts.length > 0 ? parts.join(" ") : "0";
}

function formatLinearFactor(xCoefficient, constant) {
  const xPart = xCoefficient === 1 ? "x" : xCoefficient === -1 ? "-x" : `${xCoefficient}x`;

  if (constant === 0) {
    return `(${xPart})`;
  }

  if (constant > 0) {
    return `(${xPart} + ${constant})`;
  }

  return `(${xPart} - ${Math.abs(constant)})`;
}

function formatOutsideMultiplier(multiplier) {
  if (multiplier === 1) {
    return "";
  }

  if (multiplier === -1) {
    return "-";
  }

  return `${multiplier}`;
}

function generateSolveProblem(difficulty) {
  const solution =
    difficulty === "easy" ? randomInt(-6, 6) : difficulty === "medium" ? randomInt(-9, 9) : randomInt(-14, 14);
  const a =
    difficulty === "easy"
      ? randomInt(1, 6)
      : difficulty === "medium"
        ? randomNonZeroInt(-9, 9)
        : randomNonZeroInt(-14, 14);
  const b =
    difficulty === "easy" ? randomInt(-9, 9) : difficulty === "medium" ? randomInt(-14, 14) : randomInt(-24, 24);
  const c = a * solution + b;

  return {
    questionLatex: `\\text{${escapeLatexText("Solve: ")}} ${formatExpressionTerms([{ coef: a, variable: "x" }, { coef: b }])} = ${c}`,
    answerLatex: `x = ${solution}`,
    answerPlain: `x = ${solution}`,
  };
}

function generateSimplifyProblem(difficulty) {
  const variableRange = difficulty === "easy" ? 6 : difficulty === "medium" ? 8 : 10;
  const constantRange = difficulty === "easy" ? 12 : difficulty === "medium" ? 16 : 20;
  const variableCount = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
  const selectedVariables = pickDistinctVariables(variableCount);
  const terms = [];
  const variableCoefficients = [];

  selectedVariables.forEach((variable, index) => {
    const occurrences = difficulty === "easy" ? 3 : difficulty === "medium" ? 2 : index === 0 ? 3 : 2;
    let variableTotal = 0;

    for (let count = 0; count < occurrences; count += 1) {
      const coefficient = randomNonZeroInt(-variableRange, variableRange);
      terms.push({ coef: coefficient, variable });
      variableTotal += coefficient;
    }

    variableCoefficients.push({ variable, coef: variableTotal });
  });

  terms.push({ coef: randomInt(-constantRange, constantRange) });

  if (difficulty === "hard") {
    terms.push({ coef: randomInt(-constantRange, constantRange) });
  }

  for (let index = terms.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [terms[index], terms[swapIndex]] = [terms[swapIndex], terms[index]];
  }

  const simplifiedVariableTerms = variableCoefficients.filter((term) => term.coef !== 0);

  if (simplifiedVariableTerms.length === 0) {
    return generateSimplifyProblem(difficulty);
  }

  const constant = terms
    .filter((term) => !term.variable)
    .reduce((total, term) => total + term.coef, 0);

  const answerTerms = [...simplifiedVariableTerms];
  if (constant !== 0 || answerTerms.length === 0) {
    answerTerms.push({ coef: constant });
  }
  const answer = formatExpressionTerms(answerTerms);

  return {
    questionLatex: `\\text{${escapeLatexText("Simplify: ")}} ${formatExpressionTerms(terms)}`,
    answerLatex: answer,
    answerPlain: answer,
  };
}

function generateExpandProblem(difficulty) {
  const outside =
    difficulty === "easy" ? randomInt(1, 6) : difficulty === "medium" ? randomInt(2, 9) : randomNonZeroInt(-12, 12);
  const innerX =
    difficulty === "easy" ? 1 : difficulty === "medium" ? randomInt(1, 4) : randomNonZeroInt(-6, 6);
  const innerConstant =
    difficulty === "easy"
      ? randomNonZeroInt(-9, 9)
      : difficulty === "medium"
        ? randomNonZeroInt(-12, 12)
        : randomNonZeroInt(-16, 16);

  const answer = formatExpressionTerms([
    { coef: outside * innerX, variable: "x" },
    { coef: outside * innerConstant },
  ]);

  return {
    questionLatex: `\\text{${escapeLatexText("Expand: ")}} ${formatOutsideMultiplier(outside)}${formatLinearFactor(innerX, innerConstant)}`,
    answerLatex: answer,
    answerPlain: answer,
  };
}

function generateFactoriseProblem(difficulty) {
  if (difficulty === "easy") {
    const common = randomInt(2, 12);
    let insideX = randomInt(1, 6);
    let insideConstant = randomInt(1, 12);

    while (!isPrimitivePair(insideX, insideConstant)) {
      insideX = randomInt(1, 6);
      insideConstant = randomInt(1, 12);
    }

    const answer = `${common}${formatLinearFactor(insideX, insideConstant)}`;

    return {
      questionLatex: `\\text{${escapeLatexText("Factorise: ")}} ${formatExpressionTerms([
        { coef: common * insideX, variable: "x" },
        { coef: common * insideConstant },
      ])}`,
      answerLatex: answer,
      answerPlain: answer,
    };
  }

  if (difficulty === "medium") {
    const common = randomInt(2, 14);
    let insideX = randomNonZeroInt(-8, 8);
    let insideConstant = randomNonZeroInt(-14, 14);

    while (!isPrimitivePair(insideX, insideConstant)) {
      insideX = randomNonZeroInt(-8, 8);
      insideConstant = randomNonZeroInt(-14, 14);
    }

    const answer = `${common}${formatLinearFactor(insideX, insideConstant)}`;

    return {
      questionLatex: `\\text{${escapeLatexText("Factorise: ")}} ${formatExpressionTerms([
        { coef: common * insideX, variable: "x" },
        { coef: common * insideConstant },
      ])}`,
      answerLatex: answer,
      answerPlain: answer,
    };
  }

  const common = randomInt(2, 16);
  let xPartOne = randomNonZeroInt(-9, 9);
  let xPartTwo = randomNonZeroInt(-9, 9);
  let insideConstant = randomNonZeroInt(-18, 18);
  let insideX = xPartOne + xPartTwo;

  while (insideX === 0 || !isPrimitivePair(insideX, insideConstant)) {
    xPartOne = randomNonZeroInt(-9, 9);
    xPartTwo = randomNonZeroInt(-9, 9);
    insideConstant = randomNonZeroInt(-18, 18);
    insideX = xPartOne + xPartTwo;
  }

  const answer = `${common}${formatLinearFactor(insideX, insideConstant)}`;

  return {
    questionLatex: `\\text{${escapeLatexText("Factorise: ")}} ${formatExpressionTerms([
      { coef: common * xPartOne, variable: "x" },
      { coef: common * xPartTwo, variable: "x" },
      { coef: common * insideConstant },
    ])}`,
    answerLatex: answer,
    answerPlain: answer,
  };
}

function generateProblem(type, difficulty) {
  switch (type) {
    case "solve":
      return generateSolveProblem(difficulty);
    case "simplify":
      return generateSimplifyProblem(difficulty);
    case "expand":
      return generateExpandProblem(difficulty);
    case "factorise":
      return generateFactoriseProblem(difficulty);
    default:
      return generateSolveProblem(difficulty);
  }
}

function renderLatex(element, latex) {
  element.textContent = `\\(${latex}\\)`;
}

function typesetMath(elements) {
  if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
    return window.MathJax.typesetPromise(elements);
  }

  return Promise.resolve();
}

function pickCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((item) => item.value);
}

function buildEvenSequence(items, totalCount) {
  const sequence = [];
  const baseCount = Math.floor(totalCount / items.length);
  const remainder = totalCount % items.length;

  items.forEach((item, index) => {
    const count = baseCount + (index < remainder ? 1 : 0);
    for (let step = 0; step < count; step += 1) {
      sequence.push(item);
    }
  });

  for (let i = sequence.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }

  return sequence;
}

function normalizeAnswer(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function parseLinearExpression(rawInput) {
  const compact = rawInput.replace(/\s+/g, "").toLowerCase();
  if (!compact) {
    return null;
  }

  const normalized = /^[+-]/.test(compact) ? compact : `+${compact}`;
  const terms = normalized.match(/[+-][^+-]+/g);

  if (!terms || terms.join("") !== normalized) {
    return null;
  }

  const coefficients = {};
  let constant = 0;

  for (const term of terms) {
    const sign = term[0] === "-" ? -1 : 1;
    const body = term.slice(1);

    if (/^\d+$/.test(body)) {
      constant += sign * Number.parseInt(body, 10);
      continue;
    }

    const variableMatch = body.match(/^(\d+)?([a-z])$/);
    if (!variableMatch) {
      return null;
    }

    const coefficient = variableMatch[1] ? Number.parseInt(variableMatch[1], 10) : 1;
    const variable = variableMatch[2];
    coefficients[variable] = (coefficients[variable] || 0) + sign * coefficient;
  }

  return { coefficients, constant };
}

function isSameLinearExpression(left, right) {
  const allVariables = new Set([
    ...Object.keys(left.coefficients),
    ...Object.keys(right.coefficients),
  ]);

  for (const variable of allVariables) {
    if ((left.coefficients[variable] || 0) !== (right.coefficients[variable] || 0)) {
      return false;
    }
  }

  return left.constant === right.constant;
}

function parseSolveValue(rawInput) {
  const compact = rawInput.replace(/\s+/g, "").toLowerCase();

  if (/^[+-]?\d+$/.test(compact)) {
    return Number.parseInt(compact, 10);
  }

  const equationMatch = compact.match(/^x=([+-]?\d+)$/);
  if (!equationMatch) {
    return null;
  }

  return Number.parseInt(equationMatch[1], 10);
}

function gcdTwo(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }

  return x;
}

function isPrimitivePair(a, b) {
  const absA = Math.abs(a);
  const absB = Math.abs(b);

  if (absB === 0) {
    return absA === 1;
  }

  return gcdTwo(absA, absB) === 1;
}

function parseFactorisedInput(rawInput) {
  const compact = rawInput.replace(/\s+/g, "").toLowerCase();

  let outside = null;
  let inside = null;

  const prefixMatch = compact.match(/^([+-]?\d+)\(([^()]+)\)$/);
  const suffixMatch = compact.match(/^\(([^()]+)\)([+-]?\d+)$/);

  if (prefixMatch) {
    outside = Number.parseInt(prefixMatch[1], 10);
    inside = prefixMatch[2];
  } else if (suffixMatch) {
    outside = Number.parseInt(suffixMatch[2], 10);
    inside = suffixMatch[1];
  } else {
    return null;
  }

  if (!Number.isInteger(outside) || outside === 0) {
    return null;
  }

  const parsedInside = parseLinearExpression(inside);
  if (!parsedInside) {
    return null;
  }

  const insideX = parsedInside.coefficients.x || 0;
  const extraVariables = Object.keys(parsedInside.coefficients).filter((variable) => variable !== "x");
  if (insideX === 0 || extraVariables.length > 0) {
    return null;
  }

  let normalizedOutside = outside;
  let normalizedInsideX = insideX;
  let normalizedInsideConst = parsedInside.constant;

  if (normalizedOutside < 0) {
    normalizedOutside *= -1;
    normalizedInsideX *= -1;
    normalizedInsideConst *= -1;
  }

  return {
    outside: normalizedOutside,
    insideX: normalizedInsideX,
    insideConst: normalizedInsideConst,
  };
}

function isFactoriseAnswerCorrect(entered, questionLatex) {
  const question = parseLinearExpression(stripCategoryPrompt(questionLatex));
  const factorised = parseFactorisedInput(entered);

  if (!question || !factorised) {
    return false;
  }

  const onlyX = Object.keys(question.coefficients).every((variable) => variable === "x");
  if (!onlyX) {
    return false;
  }

  const targetX = question.coefficients.x || 0;
  const targetConst = question.constant;

  const expandedX = factorised.outside * factorised.insideX;
  const expandedConst = factorised.outside * factorised.insideConst;

  if (expandedX !== targetX || expandedConst !== targetConst) {
    return false;
  }

  return isPrimitivePair(factorised.insideX, factorised.insideConst);
}

function isAnswerCorrect(item, enteredRaw) {
  const entered = enteredRaw.trim();
  if (!entered) {
    return false;
  }

  if (item.topic === "solve") {
    const expectedValue = parseSolveValue(item.answerPlain);
    const enteredValue = parseSolveValue(entered);
    return expectedValue !== null && enteredValue !== null && expectedValue === enteredValue;
  }

  if (item.topic === "factorise") {
    return isFactoriseAnswerCorrect(entered, item.questionLatex);
  }

  const expectedExpression = parseLinearExpression(item.answerPlain);
  const enteredExpression = parseLinearExpression(entered);

  if (expectedExpression && enteredExpression) {
    return isSameLinearExpression(expectedExpression, enteredExpression);
  }

  return normalizeAnswer(entered) === normalizeAnswer(item.answerPlain);
}

function topicHeading(topic) {
  if (topic === "solve") {
    return "Solve the following:";
  }

  if (topic === "simplify") {
    return "Simplify the following:";
  }

  if (topic === "expand") {
    return "Expand the following:";
  }

  return "Factorise the following:";
}

function chunkPairs(items) {
  const rows = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push([items[index], items[index + 1] || null]);
  }
  return rows;
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

function buildTopicSection(topic, items) {
  let bodyRows = "";

  if (topic === "solve") {
    bodyRows = buildSolveRows(items);
  } else {
    bodyRows = buildSingleWideRows(items);
  }

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
        <td class="print-topic-title-cell" colspan="6">${topicHeading(topic)}</td>
      </tr>
      ${bodyRows}
    </table>
  `;
}

function buildPrintSheets(quizItems) {
  const topicOrder = ["solve", "simplify", "expand", "factorise"];
  const topicsPresent = topicOrder.filter((topic) => quizItems.some((item) => item.topic === topic));
  let nextPrintNumber = 1;
  const printQuizItems = [];

  topicsPresent.forEach((topic) => {
    const topicItems = quizItems.filter((item) => item.topic === topic);
    topicItems.forEach((item) => {
      printQuizItems.push({
        ...item,
        printNumber: nextPrintNumber,
      });
      nextPrintNumber += 1;
    });
  });

  const quizSectionsHtml = topicsPresent
    .map((topic) => {
      const topicItems = printQuizItems.filter((item) => item.topic === topic);
      return buildTopicSection(topic, topicItems);
    })
    .join("");

  const answerSectionsHtml = topicsPresent
    .map((topic) => {
      const topicItems = printQuizItems.filter((item) => item.topic === topic);
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
        <p class="print-answer-topic">${topicHeading(topic)}</p>
        <table class="print-answer-table">${rowHtml}</table>
      `;
    })
    .join("");

  printQuizSheet.innerHTML = `
    <table class="print-header-table">
      <tr>
        <td class="print-quiz-title" colspan="4">Algebra Quiz</td>
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
    <h2 class="print-title">Answer Sheet</h2>
    ${answerSectionsHtml}
  `;
}

function buildQuiz() {
  const topics = pickCheckedValues("topic");
  const difficulties = pickCheckedValues("difficulty");
  const questionCount = Number.parseInt(questionCountSelect.value, 10);

  if (topics.length === 0 || difficulties.length === 0) {
    quizMessage.textContent = "Choose at least one topic and one difficulty.";
    return;
  }

  const topicSequence = buildEvenSequence(topics, questionCount);
  const difficultySequence = buildEvenSequence(difficulties, questionCount);

  currentQuiz = topicSequence.map((topic, index) => {
    const difficulty = difficultySequence[index % difficultySequence.length];
    const problem = generateProblem(topic, difficulty);

    return {
      id: index + 1,
      topic,
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
            <span class="meta">${item.topic} | ${item.difficulty}</span>
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

function checkSingleQuestion(card, index) {
  const input = card.querySelector('[data-role="answer-input"]');
  const result = card.querySelector('[data-role="result"]');
  const expected = card.querySelector('[data-role="expected"]');

  const entered = input.value.trim();
  const expectedAnswer = currentQuiz[index].answerPlain;

  result.className = "result-line";

  if (!entered) {
    result.textContent = "🤔 Not attempted yet.";
    result.classList.add("blank");
    expected.classList.add("hidden");
    return false;
  }

  if (isAnswerCorrect(currentQuiz[index], entered)) {
    result.textContent = "✅ 😎 Correct.";
    result.classList.add("correct");
    expected.classList.add("hidden");
    return true;
  }

  currentQuiz[index].incorrectAttempts += 1;
  result.textContent = "❌ 😮 Not quite.";
  result.classList.add("incorrect");

  if (currentQuiz[index].incorrectAttempts >= 3) {
    expected.textContent = `Correct answer: ${expectedAnswer}`;
    expected.classList.remove("hidden");
  } else {
    expected.classList.add("hidden");
  }

  return false;
}

applyTheme(readPreferredTheme());

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem(themeStorageKey, nextTheme);
  } catch (error) {
    // Local storage may be blocked in strict browser settings.
  }
});

generateQuizBtn.addEventListener("click", buildQuiz);
checkAnswersBtn.addEventListener("click", checkAnswers);
downloadPdfBtn.addEventListener("click", () => window.print());

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
