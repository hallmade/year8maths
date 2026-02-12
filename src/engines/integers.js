import { randomInt, randomNonZeroInt } from "../shared/math.js";

function rangeByDifficulty(difficulty) {
  if (difficulty === "easy") {
    return 20;
  }

  if (difficulty === "medium") {
    return 60;
  }

  return 150;
}

function generateAdd(difficulty) {
  const range = rangeByDifficulty(difficulty);
  const a = randomInt(-range, range);
  const b = randomInt(-range, range);
  return {
    prompt: "Add",
    questionLatex: `${a} + ${b}`,
    answerLatex: `${a + b}`,
    answerPlain: `${a + b}`,
  };
}

function generateSubtract(difficulty) {
  const range = rangeByDifficulty(difficulty);
  const a = randomInt(-range, range);
  const b = randomInt(-range, range);
  return {
    prompt: "Subtract",
    questionLatex: `${a} - (${b})`,
    answerLatex: `${a - b}`,
    answerPlain: `${a - b}`,
  };
}

function generateMultiply(difficulty) {
  const range = difficulty === "easy" ? 12 : difficulty === "medium" ? 20 : 30;
  const a = randomInt(-range, range);
  const b = randomInt(-range, range);
  return {
    prompt: "Multiply",
    questionLatex: `${a} \\times ${b}`,
    answerLatex: `${a * b}`,
    answerPlain: `${a * b}`,
  };
}

function generateDivide(difficulty) {
  const divisorRange = difficulty === "easy" ? 12 : difficulty === "medium" ? 20 : 30;
  const divisor = randomNonZeroInt(-divisorRange, divisorRange);
  const quotient = randomInt(-divisorRange, divisorRange);
  const dividend = divisor * quotient;

  return {
    prompt: "Divide",
    questionLatex: `${dividend} \\div ${divisor}`,
    answerLatex: `${quotient}`,
    answerPlain: `${quotient}`,
  };
}

function generate(questionType, difficulty) {
  switch (questionType) {
    case "add":
      return generateAdd(difficulty);
    case "subtract":
      return generateSubtract(difficulty);
    case "multiply":
      return generateMultiply(difficulty);
    case "divide":
      return generateDivide(difficulty);
    default:
      return generateAdd(difficulty);
  }
}

function check(_questionType, _questionLatex, answerPlain, enteredRaw) {
  return enteredRaw.replace(/\s+/g, "") === answerPlain.replace(/\s+/g, "");
}

export const integersEngine = {
  id: "integer-operations",
  title: "Integer Operations",
  questionTypes: [
    { id: "add", label: "Add" },
    { id: "subtract", label: "Subtract" },
    { id: "multiply", label: "Multiply" },
    { id: "divide", label: "Divide" },
  ],
  difficultyOptions: ["easy", "medium", "hard"],
  generate,
  check,
};
