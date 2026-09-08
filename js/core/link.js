/**
 * SafeShare — codec del enlace.
 *
 * Encapsula el formato "#d=<payload>" para que ningún otro módulo tenga
 * que conocerlo. Si en el futuro el fragmento lleva más parámetros
 * (versión, tipo de contenido...), se cambia aquí y solo aquí.
 */

export const FRAGMENT_KEY = 'd';
const PAYLOAD_RE = /^[A-Za-z0-9_-]+$/;

/** Construye la URL a compartir a partir del payload cifrado. */
export function buildShareUrl(payload, baseUrl) {
  return `${baseUrl}#${FRAGMENT_KEY}=${payload}`;
}

/**
 * Extrae el payload del fragmento de una URL ("#d=..." o "#a=1&d=...").
 * @returns {string|null}
 */
export function extractPayload(hash) {
  if (!hash) return null;
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const value = new URLSearchParams(raw).get(FRAGMENT_KEY);
  return value && PAYLOAD_RE.test(value) ? value : null;
}

/** URL base de la página actual, sin query ni fragmento. */
export function currentBaseUrl(loc = globalThis.location) {
  return `${loc.origin}${loc.pathname}`;
}
