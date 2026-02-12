const questionText = document.getElementById("questionText");
const answerText = document.getElementById("answerText");
const taskType = document.getElementById("taskType");
const difficultyLevel = document.getElementById("difficultyLevel");
const revealBtn = document.getElementById("revealBtn");
const nextBtn = document.getElementById("nextBtn");
const themeToggle = document.getElementById("themeToggle");
const themeStorageKey = "algebra-expression-theme";
let currentProblem = null;

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

applyTheme(readPreferredTheme());

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
    difficulty === "easy" ? randomInt(1, 6) : difficulty === "medium" ? randomNonZeroInt(-9, 9) : randomNonZeroInt(-14, 14);
  const b =
    difficulty === "easy" ? randomInt(-9, 9) : difficulty === "medium" ? randomInt(-14, 14) : randomInt(-24, 24);
  const c = a * solution + b;

  return {
    questionLatex: `\\text{${escapeLatexText("Solve: ")}} ${formatExpressionTerms([{ coef: a, variable: "x" }, { coef: b }])} = ${c}`,
    answerLatex: `x = ${solution}`,
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

  return {
    questionLatex: `\\text{${escapeLatexText("Simplify: ")}} ${formatExpressionTerms(terms)}`,
    answerLatex: formatExpressionTerms(answerTerms),
  };
}

function generateExpandProblem(difficulty) {
  const outside = difficulty === "easy" ? randomInt(1, 6) : difficulty === "medium" ? randomInt(2, 9) : randomNonZeroInt(-12, 12);
  const innerX =
    difficulty === "easy" ? 1 : difficulty === "medium" ? randomInt(1, 4) : randomNonZeroInt(-6, 6);
  const innerConstant =
    difficulty === "easy" ? randomNonZeroInt(-9, 9) : difficulty === "medium" ? randomNonZeroInt(-12, 12) : randomNonZeroInt(-16, 16);

  return {
    questionLatex: `\\text{${escapeLatexText("Expand: ")}} ${formatOutsideMultiplier(outside)}${formatLinearFactor(innerX, innerConstant)}`,
    answerLatex: formatExpressionTerms([
      { coef: outside * innerX, variable: "x" },
      { coef: outside * innerConstant },
    ]),
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

    return {
      questionLatex: `\\text{${escapeLatexText("Factorise: ")}} ${formatExpressionTerms([
        { coef: common * insideX, variable: "x" },
        { coef: common * insideConstant },
      ])}`,
      answerLatex: `${common}${formatLinearFactor(insideX, insideConstant)}`,
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

    return {
      questionLatex: `\\text{${escapeLatexText("Factorise: ")}} ${formatExpressionTerms([
        { coef: common * insideX, variable: "x" },
        { coef: common * insideConstant },
      ])}`,
      answerLatex: `${common}${formatLinearFactor(insideX, insideConstant)}`,
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

  return {
    questionLatex: `\\text{${escapeLatexText("Factorise: ")}} ${formatExpressionTerms([
      { coef: common * xPartOne, variable: "x" },
      { coef: common * xPartTwo, variable: "x" },
      { coef: common * insideConstant },
    ])}`,
    answerLatex: `${common}${formatLinearFactor(insideX, insideConstant)}`,
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

function showNewProblem() {
  currentProblem = generateProblem(taskType.value, difficultyLevel.value);
  renderLatex(questionText, currentProblem.questionLatex);
  renderLatex(answerText, currentProblem.answerLatex);
  answerText.classList.add("hidden");
  typesetMath([questionText, answerText]);
}

revealBtn.addEventListener("click", () => {
  answerText.classList.remove("hidden");
  if (currentProblem) {
    typesetMath([answerText]);
  }
});

nextBtn.addEventListener("click", showNewProblem);

taskType.addEventListener("change", showNewProblem);
difficultyLevel.addEventListener("change", showNewProblem);

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);

  try {
    localStorage.setItem(themeStorageKey, nextTheme);
  } catch (error) {
    // Local storage may be blocked in strict browser settings.
  }
});

showNewProblem();
