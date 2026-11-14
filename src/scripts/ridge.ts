/**
 * Hero: generatywny krajobraz z linii (Canvas 2D).
 *
 * Teren to suma kilku sinusoid próbkowana wzdłuż ~30 „grzbietów” rysowanych od
 * horyzontu do widza (algorytm malarza — bliższe grzbiety zasłaniają dalsze).
 * Po grzbietach przesuwają się pojedyncze sygnały: sprawy płynące przez proces.
 *
 * Wydajność: jeden kontekst bez kanału alfa, DPR ograniczony do 2, pętla
 * zatrzymywana poza ekranem i w ukrytej karcie, statyczna klatka przy
 * prefers-reduced-motion.
 */

interface Glint {
  line: number;
  x: number; // 0..1
  speed: number; // ułamek szerokości na sekundę
  len: number; // 0..1
}

const LINES = 30;
const STEP = 7; // px między próbkami (w CSS px)
const BG = [13, 19, 17] as const; // --ink-900
const HAZE = [30, 44, 39] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function mountRidge(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return () => {};

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let running = false;
  let visible = true;
  let last = 0;
  let time = 0;
  let cols = 0;
  let heights = new Float32Array(0);

  // deterministyczne rozmieszczenie sygnałów — bez „skakania” między odświeżeniami
  const glints: Glint[] = Array.from({ length: 7 }, (_, i) => ({
    line: 9 + ((i * 7) % 19),
    x: (i * 0.37) % 1,
    speed: 0.018 + ((i * 13) % 7) * 0.004,
    len: 0.05 + ((i * 5) % 4) * 0.012,
  }));

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    cols = Math.ceil(w / STEP) + 2;
    heights = new Float32Array(LINES * cols);
    draw();
  };

  /**
   * Wysokość terenu 0..1: u w poprzek (0 = oś widoku), z ∈ [0,1] w głąb (1 = najbliżej).
   * Zbocza rosną ku krawędziom, środkiem biegnie meandrująca dolina.
   */
  const terrain = (u: number, z: number, t: number) => {
    const zz = z * 3.4 - t * 0.03;
    const a = Math.sin(u * 3.1 + zz * 1.7 + 0.6);
    const b = Math.sin(u * 6.7 - zz * 2.3 + 1.9) * 0.5;
    const c = Math.sin(u * 13.1 + zz * 4.1 + t * 0.04) * 0.2;
    const n = 0.5 + 0.5 * ((a + b + c) / 1.7);
    const meander = 0.12 * Math.sin(zz * 1.25);
    const side = Math.pow(smooth(0.1, 1.15, Math.abs(u + meander)), 1.2);
    return side * (0.3 + 0.7 * n) + 0.07 * n;
  };

  const draw = () => {
    const narrow = Math.min(1, w / 1100);
    const horizon = h * lerp(0.6, 0.5, narrow);
    const relief = lerp(0.42, 1, narrow);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // niebo
    const sky = ctx.createLinearGradient(0, 0, 0, horizon + 40);
    sky.addColorStop(0, '#090e0c');
    sky.addColorStop(1, '#16221e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // poświata nad horyzontem
    const glowR = Math.max(w * 0.46, 360);
    const glow = ctx.createRadialGradient(w * 0.5, horizon + 10, 0, w * 0.5, horizon + 10, glowR);
    glow.addColorStop(0, 'rgba(217, 187, 128, 0.24)');
    glow.addColorStop(0.35, 'rgba(143, 214, 187, 0.09)');
    glow.addColorStop(1, 'rgba(143, 214, 187, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, horizon + glowR);

    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';

    for (let i = 0; i < LINES; i++) {
      const z = i / (LINES - 1);
      const baseY = horizon + (h - horizon) * Math.pow(z, 1.7) * 1.12;
      const amp = lerp(h * 0.17, h * 0.26, z) * relief;
      const spread = lerp(1.5, 0.78, z) * lerp(0.6, 1, narrow);
      const row = i * cols;

      ctx.beginPath();
      ctx.moveTo(-2, h + 2);
      for (let c = 0; c < cols; c++) {
        const x = c * STEP;
        const u = ((x / w) * 2 - 1) * spread;
        const y = baseY - terrain(u, z, time) * amp;
        heights[row + c] = y;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w + 2, h + 2);
      ctx.closePath();

      const k = (1 - z) * 0.85;
      ctx.fillStyle = `rgb(${Math.round(lerp(BG[0], HAZE[0], k))}, ${Math.round(lerp(BG[1], HAZE[1], k))}, ${Math.round(lerp(BG[2], HAZE[2], k))})`;
      ctx.fill();

      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const y = heights[row + c] ?? 0;
        if (c === 0) ctx.moveTo(0, y);
        else ctx.lineTo(c * STEP, y);
      }
      ctx.strokeStyle = `rgba(214, 228, 220, ${0.09 + 0.2 * z})`;
      ctx.stroke();

      // sygnały na tym grzbiecie
      for (const g of glints) {
        if (g.line !== i) continue;
        const head = g.x * (cols - 1);
        const tail = Math.max(0, head - g.len * cols);
        const c0 = Math.floor(tail);
        const c1 = Math.min(cols - 1, Math.floor(head));
        if (c1 - c0 < 1) continue;
        const grad = ctx.createLinearGradient(c0 * STEP, 0, c1 * STEP, 0);
        grad.addColorStop(0, 'rgba(143, 214, 187, 0)');
        grad.addColorStop(1, `rgba(170, 232, 208, ${0.45 + 0.5 * z})`);
        ctx.beginPath();
        for (let c = c0; c <= c1; c++) {
          const y = heights[row + c] ?? 0;
          if (c === c0) ctx.moveTo(c * STEP, y);
          else ctx.lineTo(c * STEP, y);
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.lineWidth = 1;

        const hx = c1 * STEP;
        const hy = heights[row + c1] ?? 0;
        ctx.fillStyle = 'rgba(170, 232, 208, 0.16)';
        ctx.beginPath();
        ctx.arc(hx, hy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(214, 245, 232, 0.95)';
        ctx.beginPath();
        ctx.arc(hx, hy, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const frame = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    for (const g of glints) {
      g.x += g.speed * dt;
      if (g.x > 1 + g.len) g.x = -0.02;
    }
    draw();
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running || reduce || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) start();
      else stop();
    },
    { threshold: 0 },
  );
  io.observe(canvas);

  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  resize();
  start();

  return () => {
    stop();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
