import { randomInt, randomNonZeroInt, reduceFraction, parseSimpleFraction, fractionsEqual, fractionToLatex } from "../shared/math.js";

function randomProperFraction(maxDenominator) {
  const denominator = randomInt(2, maxDenominator);
  const numerator = randomNonZeroInt(-maxDenominator, maxDenominator);
  return reduceFraction(numerator, denominator);
}

function generateAdd(difficulty) {
  const maxDenominator = difficulty === "easy" ? 8 : difficulty === "medium" ? 12 : 16;
  const left = randomProperFraction(maxDenominator);
  const right = randomProperFraction(maxDenominator);
  const answer = reduceFraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );

  return {
    prompt: "Add",
    questionLatex: `${fractionToLatex(left)} + ${fractionToLatex(right)}`,
    answerLatex: fractionToLatex(answer),
    answerPlain: `${answer.numerator}/${answer.denominator}`,
  };
}

function generateSubtract(difficulty) {
  const maxDenominator = difficulty === "easy" ? 8 : difficulty === "medium" ? 12 : 16;
  const left = randomProperFraction(maxDenominator);
  const right = randomProperFraction(maxDenominator);
  const answer = reduceFraction(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );

  return {
    prompt: "Subtract",
    questionLatex: `${fractionToLatex(left)} - ${fractionToLatex(right)}`,
    answerLatex: fractionToLatex(answer),
    answerPlain: `${answer.numerator}/${answer.denominator}`,
  };
}

function generateMultiply(difficulty) {
  const maxDenominator = difficulty === "easy" ? 8 : difficulty === "medium" ? 12 : 16;
  const left = randomProperFraction(maxDenominator);
  const right = randomProperFraction(maxDenominator);
  const answer = reduceFraction(left.numerator * right.numerator, left.denominator * right.denominator);

  return {
    prompt: "Multiply",
    questionLatex: `${fractionToLatex(left)} \\times ${fractionToLatex(right)}`,
    answerLatex: fractionToLatex(answer),
    answerPlain: `${answer.numerator}/${answer.denominator}`,
  };
}

function generateDivide(difficulty) {
  const maxDenominator = difficulty === "easy" ? 8 : difficulty === "medium" ? 12 : 16;
  const left = randomProperFraction(maxDenominator);
  let right = randomProperFraction(maxDenominator);

  while (right.numerator === 0) {
    right = randomProperFraction(maxDenominator);
  }

  const answer = reduceFraction(left.numerator * right.denominator, left.denominator * right.numerator);

  return {
    prompt: "Divide",
    questionLatex: `${fractionToLatex(left)} \\div ${fractionToLatex(right)}`,
    answerLatex: fractionToLatex(answer),
    answerPlain: `${answer.numerator}/${answer.denominator}`,
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
  const expected = parseSimpleFraction(answerPlain);
  const entered = parseSimpleFraction(enteredRaw);

  if (!expected || !entered) {
    return false;
  }

  return fractionsEqual(expected, entered);
}

export const rationalNumbersEngine = {
  id: "rational-numbers",
  title: "Rational Numbers",
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
