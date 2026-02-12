import { randomInt, randomNonZeroInt } from "../shared/math.js";

function generateProductRule(difficulty) {
  const base = randomNonZeroInt(2, difficulty === "easy" ? 5 : 9);
  const a = randomInt(1, difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8);
  const b = randomInt(1, difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8);
  return {
    prompt: "Simplify",
    questionLatex: `${base}^{${a}} \\times ${base}^{${b}}`,
    answerLatex: `${base}^{${a + b}}`,
    answerPlain: `${base}^${a + b}`,
  };
}

function generateQuotientRule(difficulty) {
  const base = randomNonZeroInt(2, difficulty === "easy" ? 5 : 9);
  const b = randomInt(1, difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8);
  const a = b + randomInt(1, difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8);
  return {
    prompt: "Simplify",
    questionLatex: `\\frac{${base}^{${a}}}{${base}^{${b}}}`,
    answerLatex: `${base}^{${a - b}}`,
    answerPlain: `${base}^${a - b}`,
  };
}

function generatePowerRule(difficulty) {
  const base = randomNonZeroInt(2, difficulty === "easy" ? 5 : 9);
  const a = randomInt(1, difficulty === "easy" ? 4 : difficulty === "medium" ? 5 : 6);
  const b = randomInt(2, difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5);
  return {
    prompt: "Simplify",
    questionLatex: `\\left(${base}^{${a}}\\right)^{${b}}`,
    answerLatex: `${base}^{${a * b}}`,
    answerPlain: `${base}^${a * b}`,
  };
}

function generate(questionType, difficulty) {
  switch (questionType) {
    case "product":
      return generateProductRule(difficulty);
    case "quotient":
      return generateQuotientRule(difficulty);
    case "power":
      return generatePowerRule(difficulty);
    default:
      return generateProductRule(difficulty);
  }
}

function normalizeExponent(text) {
  return text.replace(/\s+/g, "").replace(/\*\*/g, "^").toLowerCase();
}

function check(_questionType, _questionLatex, answerPlain, enteredRaw) {
  return normalizeExponent(enteredRaw) === normalizeExponent(answerPlain);
}

export const exponentsEngine = {
  id: "exponents",
  title: "Exponents",
  questionTypes: [
    { id: "product", label: "Product Rule" },
    { id: "quotient", label: "Quotient Rule" },
    { id: "power", label: "Power Rule" },
  ],
  difficultyOptions: ["easy", "medium", "hard"],
  generate,
  check,
};
