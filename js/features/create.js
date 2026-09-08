/**
 * Feature "proteger un dato": formulario → enlace cifrado → compartir.
 * Orquesta core + services + ui; no contiene lógica de cifrado.
 */
import { CONFIG } from '../config.js';
import { encrypt, generatePin } from '../core/crypto.js';
import { analyze } from '../core/detector.js';
import { buildShareUrl, currentBaseUrl } from '../core/link.js';
import { copyText } from '../services/clipboard.js';
import { openWhatsApp, canShareNative, shareNative } from '../services/share.js';
import { qs, on, show, hide, setBusy, setFieldError, icon } from '../ui/dom.js';
import { toast } from '../ui/toast.js';

export function initCreateFeature(root = document) {
  const form = qs('#createForm', root);
  if (!form) return null;

  const els = {
    form,
    secret: qs('#secretInput', root),
    secretError: qs('#secretError', root),
    warnings: qs('#detectorWarnings', root),
    pin: qs('#pinInput', root),
    pinError: qs('#pinError', root),
    genPin: qs('#genPinBtn', root),
    submit: qs('#createLinkBtn', root),
    result: qs('#createResult', root),
    linkOutput: qs('#linkOutput', root),
    copyLink: qs('#copyLinkBtn', root),
    whatsapp: qs('#whatsappBtn', root),
    share: qs('#shareBtn', root),
    newSecret: qs('#newSecretBtn', root),
  };

  let currentUrl = '';

  /* ---------- Detector en vivo ---------- */
  function renderWarnings(text) {
    els.warnings.replaceChildren();
    for (const w of analyze(text)) {
      const box = document.createElement('div');
      box.className = `alert alert--${w.level}`;
      box.setAttribute('role', w.level === 'danger' ? 'alert' : 'note');
      box.appendChild(icon('warning'));
      const p = document.createElement('p');
      p.textContent = w.message;
      box.appendChild(p);
      els.warnings.appendChild(box);
    }
  }

  on(els.secret, 'input', () => {
    setFieldError(els.secret, els.secretError);
    renderWarnings(els.secret.value);
  });
  on(els.pin, 'input', () => setFieldError(els.pin, els.pinError));

  /* ---------- Generar PIN ---------- */
  on(els.genPin, 'click', () => {
    els.pin.value = generatePin(CONFIG.PIN.GENERATED_LENGTH);
    setFieldError(els.pin, els.pinError);
    els.pin.focus();
  });

  /* ---------- Validación ---------- */
  function validate() {
    let ok = true;
    const text = els.secret.value.trim();
    const pin = els.pin.value.trim();

    if (!text) {
      setFieldError(els.secret, els.secretError, 'Escribe el dato que quieres proteger.');
      ok = false;
    }
    if (!CONFIG.PIN.PATTERN.test(pin)) {
      setFieldError(
        els.pin, els.pinError,
        `El PIN debe ser numérico, de ${CONFIG.PIN.MIN_LENGTH} a ${CONFIG.PIN.MAX_LENGTH} dígitos.`,
      );
      ok = false;
    }
    if (!ok) (text ? els.pin : els.secret).focus();
    return ok ? { text, pin } : null;
  }

  /* ---------- Crear enlace ---------- */
  on(form, 'submit', async (e) => {
    e.preventDefault();
    const input = validate();
    if (!input) return;

    setBusy(els.submit, true);
    try {
      const payload = await encrypt(input.text, input.pin);
      currentUrl = buildShareUrl(payload, currentBaseUrl());
      showResult(currentUrl);
    } catch (err) {
      console.error(err);
      toast('No se ha podido cifrar el contenido. Inténtalo de nuevo.', { tone: 'danger' });
    } finally {
      setBusy(els.submit, false);
    }
  });

  function showResult(url) {
    els.linkOutput.textContent = url;
    els.share.hidden = !canShareNative();
    hide(form);
    show(els.result);
    els.result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    els.whatsapp.focus({ preventScroll: true });
  }

  function reset({ focus = true } = {}) {
    form.reset();
    currentUrl = '';
    els.warnings.replaceChildren();
    setFieldError(els.secret, els.secretError);
    setFieldError(els.pin, els.pinError);
    hide(els.result);
    show(form);
    if (focus) els.secret.focus();
  }

  on(form, 'reset', (e) => {
    e.preventDefault();
    reset();
  });
  on(els.newSecret, 'click', () => reset());

  /* ---------- Compartir ---------- */
  on(els.copyLink, 'click', async () => {
    const ok = await copyText(currentUrl);
    toast(ok ? 'Enlace copiado' : 'No se pudo copiar. Selecciónalo y cópialo a mano.', { tone: ok ? 'success' : 'danger' });
  });

  on(els.whatsapp, 'click', () => openWhatsApp(CONFIG.SHARE.message(currentUrl)));

  on(els.share, 'click', async () => {
    try {
      await shareNative({ title: CONFIG.APP_NAME, text: CONFIG.SHARE.message(currentUrl) });
    } catch {
      toast('No se pudo abrir el menú de compartir.', { tone: 'danger' });
    }
  });

  return { reset };
}
