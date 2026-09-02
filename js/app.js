/**
 * SafeShare — lógica de la aplicación.
 * Todo ocurre en el cliente: no hay fetch a ningún backend propio.
 */
(() => {
  const $ = (sel) => document.querySelector(sel);

  const viewCreate = $('#view-create');
  const viewOpen = $('#view-open');
  const hero = $('#hero');
  const steps = $('#steps');

  const secretInput = $('#secretInput');
  const pinInput = $('#pinInput');
  const genPinBtn = $('#genPinBtn');
  const createLinkBtn = $('#createLinkBtn');
  const clearCreateBtn = $('#clearCreateBtn');
  const detectorWarnings = $('#detectorWarnings');

  const resultCard = $('#resultCard');
  const linkOutput = $('#linkOutput');
  const copyLinkBtn = $('#copyLinkBtn');
  const whatsappBtn = $('#whatsappBtn');

  const pinOpenInput = $('#pinOpenInput');
  const unlockBtn = $('#unlockBtn');
  const unlockError = $('#unlockError');
  const revealBox = $('#revealBox');
  const revealText = $('#revealText');
  const copyRevealBtn = $('#copyRevealBtn');
  const backToCreateBtn = $('#backToCreateBtn');

  const installBtn = $('#install-btn');
  const howBtn = $('#how-btn');
  const howModal = $('#howModal');
  const howCloseBtn = $('#howCloseBtn');

  /* ---------------- Detector en vivo ---------------- */
  secretInput.addEventListener('input', () => {
    const warnings = SafeDetector.analyze(secretInput.value);
    detectorWarnings.innerHTML = warnings
      .map(
        (w) =>
          `<div class="alert-box ${w.level === 'danger' ? 'danger' : ''}">
             <i class="fi fi-rr-triangle-warning"></i><p>${w.message}</p>
           </div>`
      )
      .join('');
  });

  /* ---------------- Generar PIN ---------------- */
  genPinBtn.addEventListener('click', () => {
    pinInput.value = SafeCrypto.generatePin();
  });

  /* ---------------- Crear enlace protegido ---------------- */
  createLinkBtn.addEventListener('click', async () => {
    const text = secretInput.value.trim();
    const pin = pinInput.value.trim();

    if (!text) {
      secretInput.focus();
      return;
    }
    if (!/^\d{4,10}$/.test(pin)) {
      pinInput.focus();
      pinInput.setCustomValidity('Introduce un PIN numérico de al menos 4 dígitos');
      pinInput.reportValidity();
      return;
    }
    pinInput.setCustomValidity('');

    createLinkBtn.disabled = true;
    try {
      const payload = await SafeCrypto.encrypt(text, pin);
      const url = `${location.origin}${location.pathname}#d=${payload}`;
      linkOutput.value = url;
      resultCard.classList.remove('hidden');

      const waText = encodeURIComponent(
        `Te he compartido un dato protegido con SafeShare 🔒\n${url}\n\n(El PIN te lo paso por otro canal)`
      );
      whatsappBtn.onclick = () => window.open(`https://wa.me/?text=${waText}`, '_blank', 'noopener');

      resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      alert('No se ha podido cifrar el contenido. Inténtalo de nuevo.');
    } finally {
      createLinkBtn.disabled = false;
    }
  });

  copyLinkBtn.addEventListener('click', () => copyToClipboard(linkOutput.value, copyLinkBtn));

  clearCreateBtn.addEventListener('click', () => {
    secretInput.value = '';
    pinInput.value = '';
    detectorWarnings.innerHTML = '';
    resultCard.classList.add('hidden');
  });

  /* ---------------- Desbloquear enlace recibido ---------------- */
  function getEncryptedPayloadFromUrl() {
    const hash = location.hash || '';
    const match = hash.match(/#d=(.+)/);
    return match ? match[1] : null;
  }

  function showOpenView() {
    hero.classList.add('hidden');
    steps.classList.add('hidden');
    viewCreate.classList.remove('active');
    viewOpen.classList.add('active');
  }

  function showCreateView() {
    hero.classList.remove('hidden');
    steps.classList.remove('hidden');
    viewOpen.classList.remove('active');
    viewCreate.classList.add('active');
    history.replaceState(null, '', location.pathname);
  }

  const incomingPayload = getEncryptedPayloadFromUrl();
  if (incomingPayload) showOpenView();

  unlockBtn.addEventListener('click', async () => {
    const payload = getEncryptedPayloadFromUrl();
    const pin = pinOpenInput.value.trim();
    unlockError.classList.add('hidden');

    if (!payload || !pin) return;

    unlockBtn.disabled = true;
    try {
      const text = await SafeCrypto.decrypt(payload, pin);
      revealText.textContent = text;
      revealBox.classList.remove('hidden');
      copyRevealBtn.onclick = () => copyToClipboard(text, copyRevealBtn);
    } catch (err) {
      unlockError.classList.remove('hidden');
    } finally {
      unlockBtn.disabled = false;
    }
  });

  pinOpenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') unlockBtn.click();
  });

  backToCreateBtn.addEventListener('click', showCreateView);

  /* ---------------- Copiar al portapapeles ---------------- */
  function copyToClipboard(value, btn) {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fi fi-rr-check"></i>';
      setTimeout(() => (btn.innerHTML = original), 1400);
    });
  }

  /* ---------------- Modal "Cómo funciona" ---------------- */
  howBtn.addEventListener('click', () => howModal.classList.remove('hidden'));
  howCloseBtn.addEventListener('click', () => howModal.classList.add('hidden'));
  howModal.addEventListener('click', (e) => {
    if (e.target === howModal) howModal.classList.add('hidden');
  });

  /* ---------------- Instalación PWA ---------------- */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add('hidden');
  });
  window.addEventListener('appinstalled', () => installBtn.classList.add('hidden'));

  /* ---------------- Service worker ---------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
