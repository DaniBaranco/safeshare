/**
 * SafeShare — punto de entrada.
 * Solo compone: resuelve el modo, arranca las features y los servicios.
 * Nada de lógica de negocio aquí.
 */
import { CONFIG } from './config.js';
import { qs } from './ui/dom.js';
import { MODES, initModeRouter } from './ui/mode.js';
import { initReveal } from './ui/reveal.js';
import { initHeader } from './ui/header.js';
import { initThemePicker } from './ui/theme.js';
import { initInstallPrompt, registerServiceWorker } from './services/pwa.js';
import { initCreateFeature } from './features/create.js';
import { initOpenFeature } from './features/open.js';

document.documentElement.classList.remove('no-js');

const createFeature = initCreateFeature();
const openFeature = initOpenFeature();

initModeRouter((mode) => {
  if (mode === MODES.OPEN) openFeature?.focus();
  else createFeature?.reset({ focus: false });
  // Los bloques ya visibles al cambiar de modo deben aparecer sin esperar al scroll.
  initReveal('.reveal:not(.is-visible)');
});

initHeader();
initThemePicker();
initInstallPrompt(qs('#installBtn'));
registerServiceWorker(CONFIG.UI.SERVICE_WORKER_PATH);
