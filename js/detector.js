/**
 * SafeShare — detector de patrones de datos especialmente críticos.
 *
 * No bloquea nada: solo avisa cuando el texto contiene algo que, aunque
 * vaya cifrado, es tan sensible que sería mejor no compartirlo nunca por
 * este medio (p. ej. una tarjeta completa con CVV), recomendando canales
 * oficiales en su lugar.
 */
const SafeDetector = (() => {
  const CARD_NUMBER_RE = /\b(?:\d[ -]?){13,19}\b/;
  const CVV_NEAR_RE = /\bcvv\b|\bcvc\b|c[oó]digo de seguridad/i;
  const FULL_CARD_RE = /\b(?:\d[ -]?){13,19}\b.{0,40}(cvv|cvc)/i;

  function analyze(text) {
    const warnings = [];
    if (!text) return warnings;

    const hasCardNumber = CARD_NUMBER_RE.test(text);
    const mentionsCvv = CVV_NEAR_RE.test(text);

    if (hasCardNumber && mentionsCvv) {
      warnings.push({
        level: 'danger',
        message:
          'Parece que incluyes el número completo de una tarjeta junto con su CVV. Aunque va cifrado, ' +
          'te recomendamos no compartir nunca estos dos datos juntos por ningún medio: usa la app oficial de tu banco.',
      });
    } else if (hasCardNumber) {
      warnings.push({
        level: 'warning',
        message:
          'Detectamos lo que parece un número largo (¿tarjeta o cuenta?). Revisa que solo compartas lo estrictamente necesario.',
      });
    }

    return warnings;
  }

  return { analyze };
})();
