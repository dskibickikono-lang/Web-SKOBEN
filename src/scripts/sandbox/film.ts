/**
 * „Film” produktowy: prawdziwa konsola sandboxa sterowana zaskryptowanym
 * kursorem. Nie ma tu nagrania — kursor klika rzeczywiste przyciski,
 * a interfejs reaguje tak samo jak dla użytkownika. Dzięki temu film jest
 * ostry w każdej skali, waży tyle co kod i zawsze pokazuje aktualny produkt.
 */
import { mountSandbox } from './ui';

export type FilmId = 'orders' | 'invoices' | 'tickets' | 'rules';

export interface FilmHandle {
  play(id: FilmId): void;
  setPaused(paused: boolean): void;
  readonly paused: boolean;
}

interface Options {
  /** Wywoływane po zakończeniu filmu (przed ewentualną pętlą). */
  onEnd?: (id: FilmId) => void;
  /** Postęp 0..1 szacowany z liczby obsłużonych spraw. */
  onProgress?: (value: number) => void;
  loop?: boolean;
}

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export function mountFilm(stage: HTMLElement, options: Options = {}): FilmHandle {
  const root = stage.querySelector<HTMLElement>('[data-sbx-film]');
  const cursor = stage.querySelector<HTMLElement>('[data-film-cursor]');
  const canvas = stage.querySelector<HTMLElement>('[data-film-canvas]');
  const noop: FilmHandle = { play() {}, setPaused() {}, paused: true };
  if (!root || !cursor || !canvas) return noop;

  mountSandbox(root);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let token = 0;
  let paused = false;
  let visible = false;

  // Skalowanie: konsola ma stały rozmiar projektowy i jest dopasowywana transformacją.
  const fit = () => {
    const design = canvas.offsetWidth;
    if (design > 0) stage.style.setProperty('--film-scale', String(stage.clientWidth / design));
  };
  new ResizeObserver(fit).observe(stage);
  fit();

  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel);

  /** Czeka, respektując pauzę, widoczność i zmianę filmu. */
  const wait = async (ms: number, my: number) => {
    let left = ms;
    while (left > 0 || paused || !visible) {
      if (my !== token) throw new Error('cancelled');
      await sleep(80);
      if (!paused && visible) left -= 80;
    }
    if (my !== token) throw new Error('cancelled');
  };

  const until = async (test: () => boolean, my: number, timeout = 45000) => {
    let spent = 0;
    while (!test()) {
      await wait(120, my);
      spent += 120;
      if (spent > timeout) throw new Error('timeout');
    }
  };

  const moveTo = async (el: Element, my: number) => {
    const scale = Number(getComputedStyle(stage).getPropertyValue('--film-scale')) || 1;
    const a = canvas.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const x = (b.left + b.width * 0.5 - a.left) / scale;
    const y = (b.top + b.height * 0.55 - a.top) / scale;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    await wait(720, my);
  };

  const click = async (sel: string, my: number) => {
    const el = q(sel);
    if (!el) return;
    await moveTo(el, my);
    cursor.classList.add('is-down');
    await wait(140, my);
    el.click();
    cursor.classList.remove('is-down');
    await wait(420, my);
  };

  const slide = async (sel: string, to: number, my: number) => {
    const input = q<HTMLInputElement>(sel);
    if (!input) return;
    await moveTo(input, my);
    cursor.classList.add('is-down');
    const from = Number(input.value);
    const step = Number(input.step) || 1;
    for (let i = 1; i <= 14; i++) {
      const v = from + ((to - from) * i) / 14;
      input.value = String(Math.round(v / step) * step);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const r = input.getBoundingClientRect();
      const a = canvas.getBoundingClientRect();
      const scale = Number(getComputedStyle(stage).getPropertyValue('--film-scale')) || 1;
      const pct = (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min));
      cursor.style.transitionDuration = '60ms';
      cursor.style.transform = `translate3d(${(r.left + r.width * pct - a.left) / scale}px, ${(r.top + r.height * 0.55 - a.top) / scale}px, 0)`;
      await wait(60, my);
    }
    cursor.style.transitionDuration = '';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    cursor.classList.remove('is-down');
    await wait(500, my);
  };

  const count = (sel: string) => root.querySelectorAll(sel).length;
  const busy = () => count('.sbx-q.is-new, .sbx-q.is-running') > 0;
  const report = () => options.onProgress?.(count('.sbx-q.is-closed, .sbx-q.is-returned, .sbx-q.is-rejected') / Math.max(1, count('.sbx-q')));

  /** Obsługuje kolejkę do końca, podejmując decyzje według przepisu. */
  const drain = async (decide: ('approve' | 'reject')[], my: number) => {
    let n = 0;
    for (;;) {
      await until(() => !busy() || count('.sbx-q.is-waiting') > 0, my);
      report();
      if (count('.sbx-q.is-waiting') === 0) break;
      await wait(900, my);
      await click('.sbx-q.is-waiting', my);
      await wait(500, my);
      await click(`[data-act="${decide[n] ?? 'approve'}"]`, my);
      n++;
      await until(() => count('.sbx-q.is-running') === 0 || busy(), my);
      report();
    }
    await until(() => count('.sbx-q.is-running') === 0, my);
    report();
  };

  const SCRIPTS: Record<FilmId, (my: number) => Promise<void>> = {
    orders: async (my) => {
      await click('[data-sbx-run]', my);
      await drain(['approve', 'approve'], my);
    },
    invoices: async (my) => {
      await click('[data-sbx-run]', my);
      await drain(['reject', 'approve'], my);
    },
    tickets: async (my) => {
      await click('[data-sbx-run]', my);
      await drain(['approve', 'approve'], my);
    },
    rules: async (my) => {
      await click('[data-sbx-tab="rules"]', my);
      await slide('[data-rule="tol"]', 5, my);
      await slide('[data-rule="limit"]', 45000, my);
      await click('[data-rule="flag"]', my);
      await wait(600, my);
      await click('[data-sbx-run]', my);
      await drain([], my);
    },
  };

  const run = async (id: FilmId) => {
    const my = ++token;
    const scenario = id === 'rules' ? 'orders' : id;
    options.onProgress?.(0);
    cursor.style.transform = 'translate3d(60%, 70%, 0)';
    q(`[data-sbx-scenario="${scenario}"]`)?.click();
    q('[data-sbx-tab="log"]')?.click();
    if (q('[data-sbx-speed]')?.getAttribute('aria-pressed') !== 'true') q('[data-sbx-speed]')?.click();
    try {
      await wait(700, my);
      await SCRIPTS[id](my);
      await wait(2200, my);
      options.onEnd?.(id);
      if (options.loop && my === token) void run(id);
    } catch {
      // film przerwany zmianą sceny — nic do zrobienia
    }
  };

  new IntersectionObserver(([e]) => (visible = e?.isIntersecting ?? false), { threshold: 0.15 }).observe(stage);

  if (reduce) {
    // bez ruchu: konsola zostaje w stanie początkowym jako statyczny kadr
    return noop;
  }

  return {
    play: (id) => void run(id),
    setPaused: (value) => {
      paused = value;
      stage.classList.toggle('is-paused', value);
    },
    get paused() {
      return paused;
    },
  };
}
