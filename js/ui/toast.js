/**
 * Toasts de feedback (sustituyen a alert()). Región aria-live única.
 */
import { icon } from './dom.js';

const DEFAULT_MS = 2400;
let region = null;

function ensureRegion() {
  if (region) return region;
  region = document.createElement('div');
  region.className = 'toast-region';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  document.body.appendChild(region);
  return region;
}

/**
 * @param {string} message
 * @param {{ tone?: 'neutral'|'success'|'danger', duration?: number }} [opts]
 */
export function toast(message, { tone = 'neutral', duration = DEFAULT_MS } = {}) {
  const host = ensureRegion();
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  const iconName = tone === 'success' ? 'check' : tone === 'danger' ? 'warning' : 'info';
  el.appendChild(icon(iconName));
  el.appendChild(document.createTextNode(message));
  host.appendChild(el);

  setTimeout(() => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 260);
  }, duration);
}
