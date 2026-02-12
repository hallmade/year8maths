export const units = [
  {
    id: "unit-1",
    title: "Unit 1",
    subtitle: "Number and Index Skills",
    description: "Core number fluency topics with generator, quiz, and worksheet output.",
    topics: [
      { id: "integer-operations", title: "Integer Operations", available: true },
      { id: "rational-numbers", title: "Rational Numbers", available: true },
      { id: "exponents", title: "Exponents", available: true },
    ],
  },
  {
    id: "unit-2",
    title: "Unit 2",
    subtitle: "Geometry and Measurement",
    description: "Geometry, perimeter, volume, and ratio generators can be added next.",
    topics: [
      { id: "geometry", title: "Geometry", available: false },
      { id: "perimeter", title: "Perimeter", available: false },
      { id: "volume", title: "Volume", available: false },
      { id: "ratios", title: "Ratios", available: false },
      { id: "capacity", title: "Capacity", available: false },
    ],
  },
  {
    id: "unit-3",
    title: "Unit 3",
    subtitle: "Algebra",
    description: "Expression practice covering solve, simplify, expand, and factorise.",
    topics: [
      { id: "algebra-expressions", title: "Algebra Expressions", available: true },
    ],
  },
  {
    id: "unit-4",
    title: "Unit 4",
    subtitle: "Data and Probability",
    description: "Data analysis and probability generators can be added next.",
    topics: [
      { id: "data-analysis", title: "Data Analysis", available: false },
      { id: "probability", title: "Probability", available: false },
    ],
  },
];

export function getUnit(unitId) {
  return units.find((unit) => unit.id === unitId) || null;
}

export function getTopic(unitId, topicId) {
  const unit = getUnit(unitId);
  if (!unit) {
    return null;
  }

  return unit.topics.find((topic) => topic.id === topicId) || null;
}
