/**
 * Feature "abrir un enlace recibido": PIN → descifrado → mostrar/copiar.
 */
import { decrypt } from '../core/crypto.js';
import { extractPayload } from '../core/link.js';
import { copyText } from '../services/clipboard.js';
import { qs, on, show, hide, setBusy, setFieldError } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { navigateToCreate } from '../ui/mode.js';

export function initOpenFeature(root = document) {
  const form = qs('#openForm', root);
  if (!form) return null;

  const els = {
    form,
    pin: qs('#pinOpenInput', root),
    pinError: qs('#pinOpenError', root),
    unlock: qs('#unlockBtn', root),
    revealBox: qs('#revealBox', root),
    revealText: qs('#revealText', root),
    copy: qs('#copyRevealBtn', root),
    back: qs('#backToCreateBtn', root),
  };

  let plainText = '';

  on(els.pin, 'input', () => setFieldError(els.pin, els.pinError));

  on(form, 'submit', async (e) => {
    e.preventDefault();
    const payload = extractPayload(location.hash);
    const pin = els.pin.value.trim();

    if (!payload) {
      setFieldError(els.pin, els.pinError, 'Este enlace no contiene ningún dato protegido.');
      return;
    }
    if (!pin) {
      setFieldError(els.pin, els.pinError, 'Introduce el PIN que te han dado.');
      els.pin.focus();
      return;
    }

    setBusy(els.unlock, true);
    try {
      plainText = await decrypt(payload, pin);
      els.revealText.textContent = plainText;
      hide(form);
      show(els.revealBox);
      els.revealText.focus({ preventScroll: true });
    } catch {
      setFieldError(els.pin, els.pinError, 'PIN incorrecto o enlace dañado. Revísalo e inténtalo de nuevo.');
      els.pin.select();
    } finally {
      setBusy(els.unlock, false);
    }
  });

  on(els.copy, 'click', async () => {
    const ok = await copyText(plainText);
    toast(ok ? 'Contenido copiado' : 'No se pudo copiar. Selecciónalo y cópialo a mano.', { tone: ok ? 'success' : 'danger' });
  });

  function reset() {
    plainText = '';
    form.reset();
    els.revealText.textContent = '';
    setFieldError(els.pin, els.pinError);
    hide(els.revealBox);
    show(form);
  }

  on(els.back, 'click', () => {
    reset();
    navigateToCreate();
  });

  return {
    reset,
    focus: () => els.pin.focus({ preventScroll: true }),
  };
}
