import { attachThemeToggle } from "./shared/theme.js";
import { units } from "./content/catalog.js";

const themeToggle = document.getElementById("themeToggle");
const unitGrid = document.getElementById("unitGrid");

attachThemeToggle(themeToggle);

if (unitGrid) {
  unitGrid.innerHTML = units
    .map(
      (unit) => `
        <article class="unit-card">
          <p class="unit-kicker">${unit.title}</p>
          <h2>${unit.subtitle}</h2>
          <p>${unit.description}</p>
          <a class="button-link" href="unit.html?unit=${encodeURIComponent(unit.id)}">Open ${unit.title}</a>
        </article>
      `,
    )
    .join("");
}
