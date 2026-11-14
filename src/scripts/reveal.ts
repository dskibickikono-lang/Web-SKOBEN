/**
 * Wejście elementów przy przewijaniu. Tylko opacity/transform — kompozytor GPU,
 * bez przeliczania layoutu. Bez JS treść pozostaje widoczna (patrz global.css).
 */
const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');

if (targets.length > 0) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    targets.forEach((el) => io.observe(el));
  }
}

export {};
