/** Utilidades mínimas de DOM. Sin dependencias, sin magia. */
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function on(el, type, handler, options) {
  el.addEventListener(type, handler, options);
  return () => el.removeEventListener(type, handler, options);
}

export function show(el) { if (el) el.hidden = false; }
export function hide(el) { if (el) el.hidden = true; }

/** Estado ocupado de un botón (deshabilitado + aria-busy). */
export function setBusy(button, busy) {
  if (!button) return;
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
}

/** Marca o limpia el error de un campo (aria-invalid + texto asociado). */
export function setFieldError(input, errorEl, message = '') {
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    if (errorEl) { errorEl.textContent = message; errorEl.hidden = false; }
  } else {
    input.removeAttribute('aria-invalid');
    if (errorEl) { errorEl.textContent = ''; errorEl.hidden = true; }
  }
}

/** Crea un icono del sprite inline. */
export function icon(name, extraClass = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', `icon ${extraClass}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.appendChild(use);
  return svg;
}
