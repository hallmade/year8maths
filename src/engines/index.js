import { algebraExpressionsEngine } from "./algebra-expressions.js";
import { integersEngine } from "./integers.js";
import { rationalNumbersEngine } from "./rational-numbers.js";
import { exponentsEngine } from "./exponents.js";

export const engineMap = {
  [algebraExpressionsEngine.id]: algebraExpressionsEngine,
  [integersEngine.id]: integersEngine,
  [rationalNumbersEngine.id]: rationalNumbersEngine,
  [exponentsEngine.id]: exponentsEngine,
};

export function getEngine(topicId) {
  return engineMap[topicId] || null;
}
