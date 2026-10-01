/**
 * Selector de tema de color.
 * Pieza de UI sin negocio: aplica un tema sobre html[data-theme], lo
 * persiste en localStorage y pinta un popover accesible con los swatches.
 * El sistema visual entero deriva de la escala de acento (--o-*) en
 * tokens.css, así que cambiar de tema es solo cambiar el atributo.
 */
import { qs, on, icon } from './dom.js';

const STORAGE_KEY = 'safeshare:theme';
const DEFAULT_THEME = 'orange';

/** Lista de temas. `swatch` es el color de muestra (acento, paso 50). */
export const THEMES = Object.freeze([
  { id: 'orange', name: 'Naranja',  swatch: '#ef8a3c' },
  { id: 'coral',  name: 'Coral',    swatch: '#ef583e' },
  { id: 'amber',  name: 'Ámbar',    swatch: '#efbd3e' },
  { id: 'green',  name: 'Verde',    swatch: '#54d98b' },
  { id: 'teal',   name: 'Turquesa', swatch: '#4be2d3' },
  { id: 'blue',   name: 'Azul',     swatch: '#4299eb' },
  { id: 'indigo', name: 'Índigo',   swatch: '#6574e6' },
  { id: 'purple', name: 'Morado',   swatch: '#a663d9' },
  { id: 'pink',   name: 'Rosa',     swatch: '#de4f96' },
  { id: 'slate',  name: 'Grafito',  swatch: '#8895a5' },
]);

const isValid = (id) => THEMES.some((t) => t.id === id);

export function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isValid(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Aplica el tema al documento (sin persistir). Se usa también sin flash. */
export function applyTheme(id) {
  const theme = isValid(id) ? id : DEFAULT_THEME;
  document.documentElement.dataset.theme = theme;
  return theme;
}

function storeTheme(id) {
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* modo privado */ }
}

/**
 * @param {object} [refs]
 * @param {HTMLElement} [refs.button]   Botón que abre el popover.
 * @param {HTMLElement} [refs.panel]    Contenedor del popover.
 * @param {HTMLElement} [refs.list]     Contenedor donde se pintan los swatches.
 */
export function initThemePicker({
  button = qs('#themeBtn'),
  panel = qs('#themePanel'),
  list = qs('#themeSwatches'),
} = {}) {
  let current = applyTheme(readStoredTheme());
  if (!button || !panel || !list) return { current: () => current };

  const buttons = THEMES.map((theme) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.setAttribute('role', 'radio');
    b.dataset.theme = theme.id;
    b.title = theme.name;
    b.style.setProperty('--swatch', theme.swatch);
    b.innerHTML =
      `<span class="swatch__dot" aria-hidden="true"></span>` +
      `<span class="swatch__name">${theme.name}</span>`;
    b.appendChild(icon('check', 'swatch__check icon--xs'));
    list.appendChild(b);
    return b;
  });

  const syncChecked = () => {
    buttons.forEach((b) => {
      const on = b.dataset.theme === current;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
  };
  syncChecked();

  const select = (id) => {
    current = applyTheme(id);
    storeTheme(current);
    syncChecked();
  };

  const isOpen = () => !panel.hidden;
  const open = () => {
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onOutside, true);
    (buttons.find((b) => b.dataset.theme === current) || buttons[0])?.focus();
  };
  const close = ({ focusButton = false } = {}) => {
    if (panel.hidden) return;
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('pointerdown', onOutside, true);
    if (focusButton) button.focus();
  };
  const toggle = () => (isOpen() ? close() : open());

  function onOutside(e) {
    if (!panel.contains(e.target) && !button.contains(e.target)) close();
  }

  function moveFocus(step) {
    const currentIdx = buttons.findIndex((b) => b === document.activeElement);
    const from = currentIdx === -1 ? buttons.findIndex((b) => b.dataset.theme === current) : currentIdx;
    const next = (from + step + buttons.length) % buttons.length;
    const target = buttons[next];
    select(target.dataset.theme);
    target.focus();
  }

  function onKeydown(e) {
    switch (e.key) {
      case 'Escape': e.preventDefault(); close({ focusButton: true }); break;
      case 'ArrowRight': case 'ArrowDown': e.preventDefault(); moveFocus(1); break;
      case 'ArrowLeft': case 'ArrowUp': e.preventDefault(); moveFocus(-1); break;
      default: break;
    }
  }

  on(button, 'click', toggle);
  buttons.forEach((b) =>
    on(b, 'click', () => {
      select(b.dataset.theme);
      close({ focusButton: true });
    })
  );

  return { current: () => current, open, close, select };
}
