import { randomInt, randomNonZeroInt, gcdTwo } from "../shared/math.js";

const simplifyVariablePool = ["x", "y", "z", "a", "b", "c"];

function pickDistinctVariables(count) {
  const pool = [...simplifyVariablePool];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, count);
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

function isPrimitivePair(a, b) {
  const absA = Math.abs(a);
  const absB = Math.abs(b);

  if (absB === 0) {
    return absA === 1;
  }

  return gcdTwo(absA, absB) === 1;
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

function generateSolve(difficulty) {
  const solution =
    difficulty === "easy" ? randomInt(-6, 6) : difficulty === "medium" ? randomInt(-9, 9) : randomInt(-14, 14);
  const a =
    difficulty === "easy" ? randomInt(1, 6) : difficulty === "medium" ? randomNonZeroInt(-9, 9) : randomNonZeroInt(-14, 14);
  const b =
    difficulty === "easy" ? randomInt(-9, 9) : difficulty === "medium" ? randomInt(-14, 14) : randomInt(-24, 24);
  const c = a * solution + b;

  const expression = `${formatExpressionTerms([{ coef: a, variable: "x" }, { coef: b }])} = ${c}`;
  return {
    prompt: "Solve",
    questionLatex: expression,
    answerLatex: `x = ${solution}`,
    answerPlain: `x = ${solution}`,
  };
}

function generateSimplify(difficulty) {
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
    return generateSimplify(difficulty);
  }

  const constant = terms
    .filter((term) => !term.variable)
    .reduce((total, term) => total + term.coef, 0);

  const answerTerms = [...simplifiedVariableTerms];
  if (constant !== 0 || answerTerms.length === 0) {
    answerTerms.push({ coef: constant });
  }

  return {
    prompt: "Simplify",
    questionLatex: formatExpressionTerms(terms),
    answerLatex: formatExpressionTerms(answerTerms),
    answerPlain: formatExpressionTerms(answerTerms),
  };
}

function generateExpand(difficulty) {
  const outside = difficulty === "easy" ? randomInt(1, 6) : difficulty === "medium" ? randomInt(2, 9) : randomNonZeroInt(-12, 12);
  const innerX = difficulty === "easy" ? 1 : difficulty === "medium" ? randomInt(1, 4) : randomNonZeroInt(-6, 6);
  const innerConstant =
    difficulty === "easy" ? randomNonZeroInt(-9, 9) : difficulty === "medium" ? randomNonZeroInt(-12, 12) : randomNonZeroInt(-16, 16);

  const answer = formatExpressionTerms([
    { coef: outside * innerX, variable: "x" },
    { coef: outside * innerConstant },
  ]);

  return {
    prompt: "Expand",
    questionLatex: `${formatOutsideMultiplier(outside)}${formatLinearFactor(innerX, innerConstant)}`,
    answerLatex: answer,
    answerPlain: answer,
  };
}

function generateFactorise(difficulty) {
  if (difficulty === "easy") {
    const common = randomInt(2, 12);
    let insideX = randomInt(1, 6);
    let insideConstant = randomInt(1, 12);

    while (!isPrimitivePair(insideX, insideConstant)) {
      insideX = randomInt(1, 6);
      insideConstant = randomInt(1, 12);
    }

    return {
      prompt: "Factorise",
      questionLatex: formatExpressionTerms([
        { coef: common * insideX, variable: "x" },
        { coef: common * insideConstant },
      ]),
      answerLatex: `${common}${formatLinearFactor(insideX, insideConstant)}`,
      answerPlain: `${common}${formatLinearFactor(insideX, insideConstant)}`,
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
      prompt: "Factorise",
      questionLatex: formatExpressionTerms([
        { coef: common * insideX, variable: "x" },
        { coef: common * insideConstant },
      ]),
      answerLatex: `${common}${formatLinearFactor(insideX, insideConstant)}`,
      answerPlain: `${common}${formatLinearFactor(insideX, insideConstant)}`,
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
    prompt: "Factorise",
    questionLatex: formatExpressionTerms([
      { coef: common * xPartOne, variable: "x" },
      { coef: common * xPartTwo, variable: "x" },
      { coef: common * insideConstant },
    ]),
    answerLatex: `${common}${formatLinearFactor(insideX, insideConstant)}`,
    answerPlain: `${common}${formatLinearFactor(insideX, insideConstant)}`,
  };
}

function generate(questionType, difficulty) {
  switch (questionType) {
    case "solve":
      return generateSolve(difficulty);
    case "simplify":
      return generateSimplify(difficulty);
    case "expand":
      return generateExpand(difficulty);
    case "factorise":
      return generateFactorise(difficulty);
    default:
      return generateSolve(difficulty);
  }
}

function isFactoriseAnswerCorrect(entered, questionLatex) {
  const question = parseLinearExpression(questionLatex);
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

function check(questionType, questionLatex, expectedAnswerPlain, enteredRaw) {
  const entered = enteredRaw.trim();
  if (!entered) {
    return false;
  }

  if (questionType === "solve") {
    const expectedValue = parseSolveValue(expectedAnswerPlain);
    const enteredValue = parseSolveValue(entered);
    return expectedValue !== null && enteredValue !== null && expectedValue === enteredValue;
  }

  if (questionType === "factorise") {
    return isFactoriseAnswerCorrect(entered, questionLatex);
  }

  const expectedExpression = parseLinearExpression(expectedAnswerPlain);
  const enteredExpression = parseLinearExpression(entered);

  if (expectedExpression && enteredExpression) {
    return isSameLinearExpression(expectedExpression, enteredExpression);
  }

  return entered.replace(/\s+/g, "").toLowerCase() === expectedAnswerPlain.replace(/\s+/g, "").toLowerCase();
}

export const algebraExpressionsEngine = {
  id: "algebra-expressions",
  title: "Algebra Expressions",
  questionTypes: [
    { id: "solve", label: "Solve" },
    { id: "simplify", label: "Simplify" },
    { id: "expand", label: "Expand" },
    { id: "factorise", label: "Factorise" },
  ],
  difficultyOptions: ["easy", "medium", "hard"],
  generate,
  check,
};
