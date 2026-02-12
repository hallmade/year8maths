export function renderLatex(element, latex) {
  if (!element) {
    return;
  }

  element.textContent = `\\(${latex}\\)`;
}

export function typesetMath(elements) {
  if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
    return window.MathJax.typesetPromise(elements);
  }

  return Promise.resolve();
}
