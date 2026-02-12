export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomNonZeroInt(min, max) {
  let value = 0;
  while (value === 0) {
    value = randomInt(min, max);
  }
  return value;
}

export function gcdTwo(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }

  return x;
}

export function reduceFraction(numerator, denominator) {
  if (denominator === 0) {
    return { numerator, denominator };
  }

  const sign = denominator < 0 ? -1 : 1;
  const gcd = gcdTwo(numerator, denominator);
  return {
    numerator: sign * (numerator / gcd),
    denominator: sign * (denominator / gcd),
  };
}

export function parseSimpleFraction(rawInput) {
  const compact = rawInput.replace(/\s+/g, "").toLowerCase();
  if (!compact) {
    return null;
  }

  if (/^[+-]?\d+$/.test(compact)) {
    return { numerator: Number.parseInt(compact, 10), denominator: 1 };
  }

  const match = compact.match(/^([+-]?\d+)\/([+-]?\d+)$/);
  if (!match) {
    return null;
  }

  const numerator = Number.parseInt(match[1], 10);
  const denominator = Number.parseInt(match[2], 10);

  if (denominator === 0) {
    return null;
  }

  return reduceFraction(numerator, denominator);
}

export function fractionsEqual(left, right) {
  return left.numerator === right.numerator && left.denominator === right.denominator;
}

export function fractionToLatex(fraction) {
  if (fraction.denominator === 1) {
    return `${fraction.numerator}`;
  }

  return `\\frac{${fraction.numerator}}{${fraction.denominator}}`;
}
