import { attachThemeToggle } from "./shared/theme.js";
import { getUnit } from "./content/catalog.js";
import { getEngine } from "./engines/index.js";

const params = new URLSearchParams(window.location.search);
const unitId = params.get("unit");

const themeToggle = document.getElementById("themeToggle");
const pageTitle = document.getElementById("unitTitle");
const pageSubtitle = document.getElementById("unitSubtitle");
const topicsGrid = document.getElementById("topicsGrid");
const unitQuizLink = document.getElementById("unitQuizLink");

attachThemeToggle(themeToggle);

const unit = getUnit(unitId || "");

if (!unit) {
  pageTitle.textContent = "Unit Not Found";
  pageSubtitle.textContent = "Use the landing page to choose a valid unit.";
  unitQuizLink.classList.add("secondary");
  unitQuizLink.setAttribute("aria-disabled", "true");
  unitQuizLink.href = "index.html";
  unitQuizLink.textContent = "Unit Quiz Unavailable";
  topicsGrid.innerHTML = "<p class=\"empty-state\">This unit link is not valid yet.</p>";
} else {
  pageTitle.textContent = `${unit.title}: ${unit.subtitle}`;
  pageSubtitle.textContent = unit.description;
  const hasQuizTopics = unit.topics.some((topic) => topic.available && getEngine(topic.id));

  if (hasQuizTopics) {
    unitQuizLink.href = `unit-quiz.html?unit=${encodeURIComponent(unit.id)}`;
  } else {
    unitQuizLink.classList.add("secondary");
    unitQuizLink.setAttribute("aria-disabled", "true");
    unitQuizLink.href = "#";
    unitQuizLink.textContent = "Unit Quiz Coming Soon";
  }

  topicsGrid.innerHTML = unit.topics
    .map((topic) => {
      if (topic.available) {
        return `
          <article class="topic-card">
            <h2>${topic.title}</h2>
            <p>Practice generator, self-marking quiz, and printable PDF.</p>
            <a class="button-link" href="practice.html?unit=${encodeURIComponent(unit.id)}&topic=${encodeURIComponent(topic.id)}">Open Topic</a>
          </article>
        `;
      }

      return `
        <article class="topic-card topic-card-muted">
          <h2>${topic.title}</h2>
          <p>Coming soon in this unit rollout.</p>
          <button type="button" class="button-link secondary" disabled>Coming Soon</button>
        </article>
      `;
    })
    .join("");
}
