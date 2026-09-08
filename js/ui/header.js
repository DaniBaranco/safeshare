/** Cabecera: sombra al hacer scroll. */
export function initHeader(header = document.querySelector('.header')) {
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
  update();
  window.addEventListener('scroll', update, { passive: true });
}
