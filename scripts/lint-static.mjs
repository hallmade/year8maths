import { readFile } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "unit.html",
  "practice.html",
  "quiz.html",
  "unit-quiz.html",
  "styles.css",
  "quiz.css",
  "src/landing.js",
  "src/unit.js",
  "src/practice.js",
  "src/quiz-page.js",
  "src/unit-quiz.js",
  "src/content/catalog.js",
  "src/engines/index.js",
];
const requiredIndexSnippets = [
  '<link rel="stylesheet" href="styles.css">',
  'id="unitGrid"',
  '<script type="module" src="src/landing.js"></script>',
];

async function ensureFileHasContent(filePath) {
  const content = await readFile(filePath, "utf8");

  if (!content.trim()) {
    throw new Error(`${filePath} is empty.`);
  }

  return content;
}

async function run() {
  const htmlContent = await ensureFileHasContent("index.html");

  for (const filePath of requiredFiles.slice(1)) {
    await ensureFileHasContent(filePath);
  }

  for (const snippet of requiredIndexSnippets) {
    if (!htmlContent.includes(snippet)) {
      throw new Error(`index.html is missing required markup: ${snippet}`);
    }
  }

  console.log("Static checks passed.");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
