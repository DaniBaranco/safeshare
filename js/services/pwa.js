/**
 * Servicio PWA: prompt de instalación y registro del service worker.
 */
export function initInstallPrompt(button) {
  if (!button) return;
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    button.hidden = false;
  });

  button.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    button.hidden = true;
  });

  window.addEventListener('appinstalled', () => { button.hidden = true; });
}

export function registerServiceWorker(path) {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(path).catch(() => {});
  });
}
