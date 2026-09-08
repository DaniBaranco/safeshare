/**
 * Router de modo: decide si la app está en modo "create" (inicio) o "open"
 * (llega un enlace con payload). El modo se publica en body[data-mode] y
 * el CSS decide qué bloques se ven; los módulos de features solo reciben
 * el aviso de cambio.
 */
import { extractPayload } from '../core/link.js';

export const MODES = Object.freeze({ CREATE: 'create', OPEN: 'open' });

export function resolveMode(hash = globalThis.location.hash) {
  return extractPayload(hash) ? MODES.OPEN : MODES.CREATE;
}

export function applyMode(mode) {
  document.body.dataset.mode = mode;
}

/** Vuelve al inicio limpiando el fragmento (sin recargar ni dejar historial). */
export function navigateToCreate() {
  history.replaceState(null, '', location.pathname);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/**
 * @param {(mode: string) => void} [onChange]
 */
export function initModeRouter(onChange) {
  const run = () => {
    const mode = resolveMode();
    if (document.body.dataset.mode !== mode) applyMode(mode);
    onChange?.(mode);
  };
  window.addEventListener('hashchange', run);
  run();
}
