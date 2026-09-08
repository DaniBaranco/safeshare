/**
 * Aparición progresiva de bloques al entrar en el viewport.
 * Sin IntersectionObserver (o con "reducir movimiento"), todo se muestra.
 */
export function initReveal(selector = '.reveal') {
  const items = document.querySelectorAll(selector);
  if (!items.length) return;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  items.forEach((el) => io.observe(el));
}
