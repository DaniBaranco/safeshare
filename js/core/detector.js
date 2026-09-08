/**
 * SafeShare — detector de patrones de datos especialmente críticos.
 *
 * Módulo puro. No bloquea nada: solo avisa cuando el texto contiene algo
 * que, aunque vaya cifrado, es mejor no compartir por este medio.
 *
 * Para añadir un aviso nuevo basta con añadir una regla a RULES. Las reglas
 * se evalúan en orden y la primera que coincide dentro de un mismo `group`
 * gana, lo que permite expresar "danger" y "warning" excluyentes.
 */

const LONG_NUMBER_RE = /\b(?:\d[ -]?){13,19}\b/;
const CVV_RE = /\bcvv\b|\bcvc\b|c[oó]digo de seguridad/i;

export const RULES = Object.freeze([
  {
    id: 'card-with-cvv',
    group: 'card',
    level: 'danger',
    test: (text) => LONG_NUMBER_RE.test(text) && CVV_RE.test(text),
    message:
      'Parece que incluyes el número completo de una tarjeta junto con su CVV. Aunque va cifrado, ' +
      'no compartas nunca esos dos datos juntos por ningún medio: usa la app oficial de tu banco.',
  },
  {
    id: 'long-number',
    group: 'card',
    level: 'warning',
    test: (text) => LONG_NUMBER_RE.test(text),
    message:
      'Detectamos lo que parece un número largo (¿tarjeta o cuenta?). Comparte solo lo estrictamente necesario.',
  },
]);

/**
 * @param {string} text
 * @returns {{ id: string, level: 'danger'|'warning'|'info', message: string }[]}
 */
export function analyze(text) {
  if (!text) return [];
  const seenGroups = new Set();
  const warnings = [];
  for (const rule of RULES) {
    if (seenGroups.has(rule.group)) continue;
    if (rule.test(text)) {
      seenGroups.add(rule.group);
      warnings.push({ id: rule.id, level: rule.level, message: rule.message });
    }
  }
  return warnings;
}
