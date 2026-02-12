const themeStorageKey = "algebra-expression-theme";

export function applyTheme(theme, button) {
  const activeTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = activeTheme;

  if (button) {
    button.setAttribute("aria-pressed", activeTheme === "dark" ? "true" : "false");
    button.textContent = activeTheme === "dark" ? "Switch to Light" : "Switch to Dark";
  }
}

export function readPreferredTheme() {
  try {
    const storedTheme = localStorage.getItem(themeStorageKey);
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch (error) {
    // Ignore storage failures.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function attachThemeToggle(button) {
  applyTheme(readPreferredTheme(), button);

  if (!button) {
    return;
  }

  button.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, button);

    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch (error) {
      // Ignore storage failures.
    }
  });
}
