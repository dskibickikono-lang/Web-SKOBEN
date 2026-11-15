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
      // górny margines „bez końca”: element, który znalazł się nad oknem bez przecięcia
      // (szybki skok, rozdział z content-visibility), też zostaje odsłonięty
      { rootMargin: '100000px 0px -8% 0px', threshold: 0.08 },
    );
    targets.forEach((el) => io.observe(el));
  }
}

/**
 * Animacje SMIL (ruch po ścieżce w diagramach) nie respektują
 * prefers-reduced-motion ani widoczności — pauzujemy je ręcznie.
 */
const animated = Array.from(document.querySelectorAll<SVGSVGElement>('svg')).filter((svg) =>
  svg.querySelector('animateMotion, animate, animateTransform'),
);

if (animated.length > 0) {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  animated.forEach((svg) => svg.pauseAnimations());
  if (!still && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const svg = entry.target as SVGSVGElement;
        if (entry.isIntersecting) svg.unpauseAnimations();
        else svg.pauseAnimations();
      }
    });
    animated.forEach((svg) => io.observe(svg));
  }
}

export {};
