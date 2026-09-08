/**
 * Servicio de compartición: WhatsApp (deep link) y Web Share API nativa.
 */
const WHATSAPP_BASE = 'https://wa.me/';

export function whatsappUrl(text) {
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(text)}`;
}

export function openWhatsApp(text) {
  window.open(whatsappUrl(text), '_blank', 'noopener');
}

export function canShareNative() {
  return typeof navigator.share === 'function';
}

/**
 * Abre la hoja de compartir del sistema.
 * @returns {Promise<boolean>} true si el usuario completó la acción.
 */
export async function shareNative({ title, text }) {
  if (!canShareNative()) return false;
  try {
    await navigator.share({ title, text });
    return true;
  } catch (err) {
    // AbortError = el usuario cerró la hoja; no es un fallo.
    if (err?.name === 'AbortError') return false;
    throw err;
  }
}
