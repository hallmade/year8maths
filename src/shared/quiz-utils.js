import { randomInt } from "./math.js";

export function pickCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((item) => item.value);
}

export function buildEvenSequence(items, totalCount) {
  const sequence = [];
  const baseCount = Math.floor(totalCount / items.length);
  const remainder = totalCount % items.length;

  items.forEach((item, index) => {
    const count = baseCount + (index < remainder ? 1 : 0);
    for (let step = 0; step < count; step += 1) {
      sequence.push(item);
    }
  });

  for (let index = sequence.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [sequence[index], sequence[swapIndex]] = [sequence[swapIndex], sequence[index]];
  }

  return sequence;
}

export function chunkPairs(items) {
  const rows = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push([items[index], items[index + 1] || null]);
  }
  return rows;
}
