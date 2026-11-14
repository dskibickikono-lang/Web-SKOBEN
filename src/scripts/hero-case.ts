/**
 * Karta sprawy w hero: zapętlona symulacja trzech typowych przebiegów —
 * sprawa domknięta bez dotknięcia, wyjątek z akceptacją człowieka i faktura.
 */

interface Step {
  label: string;
  meta: string;
  /** Wstrzymanie na akceptację człowieka przed zaliczeniem kroku. */
  hold?: { meta: string; resolved: string };
}

interface Script {
  id: string;
  title: string;
  steps: [Step, Step, Step, Step];
  foot: string;
  seconds: number;
}

const SCRIPTS: Script[] = [
  {
    id: 'ZAM-2291',
    title: 'Zamówienie · Hurtownia Bałtyk',
    steps: [
      { label: 'Odczyt wiadomości', meta: '3 pozycje' },
      { label: 'Ceny i stany magazynowe', meta: 'zgodne' },
      { label: 'Decyzja według reguł', meta: 'auto' },
      { label: 'Zapis w ERP i odpowiedź', meta: 'ZS/11/0482' },
    ],
    foot: 'Domknięte bez udziału człowieka',
    seconds: 38,
  },
  {
    id: 'ZAM-2292',
    title: 'Zamówienie · Instal-Tech',
    steps: [
      { label: 'Odczyt załącznika PDF', meta: '7 pozycji' },
      { label: 'Ceny i stany magazynowe', meta: 'cena +4,1%' },
      {
        label: 'Decyzja według reguł',
        meta: 'zatwierdzone',
        hold: { meta: 'czeka na opiekuna', resolved: 'Zatwierdził opiekun klienta' },
      },
      { label: 'Zapis w ERP i odpowiedź', meta: 'ZS/11/0483' },
    ],
    foot: 'Domknięte po akceptacji wyjątku',
    seconds: 112,
  },
  {
    id: 'FV-0917',
    title: 'Faktura kosztowa · Trans-Mar',
    steps: [
      { label: 'Odczyt faktury', meta: '12 pól' },
      { label: 'Zgodność z zamówieniem i PZ', meta: '3 z 3' },
      { label: 'Decyzja według reguł', meta: 'auto' },
      { label: 'Dekretacja i zapis', meta: 'MPK 410' },
    ],
    foot: 'Domknięte bez udziału człowieka',
    seconds: 41,
  },
];

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export function mountHeroCase(root: HTMLElement): void {
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const idEl = q('[data-case-id]');
  const titleEl = q('[data-case-title]');
  const chipEl = q('[data-case-chip]');
  const footEl = q('[data-case-foot]');
  const timeEl = q('[data-case-time]');
  const stepEls = Array.from(root.querySelectorAll<HTMLElement>('[data-case-step]'));
  if (!idEl || !titleEl || !chipEl || !footEl || !timeEl || stepEls.length !== 4) return;

  const setChip = (text: string, tone: '' | 'ok' | 'warn') => {
    chipEl.textContent = text;
    chipEl.className = tone ? `chip chip--${tone}` : 'chip';
  };

  const prepare = (s: Script) => {
    idEl.textContent = s.id;
    titleEl.textContent = s.title;
    setChip('W toku', '');
    footEl.textContent = 'Agent pracuje…';
    timeEl.textContent = '0 s';
    stepEls.forEach((el, i) => {
      el.className = '';
      const step = s.steps[i];
      const label = el.querySelector('[data-case-step-label]');
      const meta = el.querySelector('[data-case-step-meta]');
      if (label && step) label.textContent = step.label;
      if (meta) meta.textContent = '';
    });
  };

  const finish = (s: Script) => {
    stepEls.forEach((el, i) => {
      el.className = 'is-done';
      const meta = el.querySelector('[data-case-step-meta]');
      const step = s.steps[i];
      if (meta && step) meta.textContent = step.meta;
    });
    setChip('Domknięta', 'ok');
    footEl.textContent = s.foot;
    timeEl.textContent = `${s.seconds} s`;
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const first = SCRIPTS[0];
    if (first) {
      prepare(first);
      finish(first);
    }
    return;
  }

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e?.isIntersecting ?? true)).observe(root);

  const play = async (s: Script) => {
    prepare(s);
    await wait(700);
    for (let i = 0; i < s.steps.length; i++) {
      const step = s.steps[i];
      const el = stepEls[i];
      if (!step || !el) continue;
      const meta = el.querySelector('[data-case-step-meta]');
      el.className = 'is-active';
      timeEl.textContent = `${Math.round((s.seconds * (i + 0.5)) / s.steps.length)} s`;
      await wait(950);
      if (step.hold) {
        el.className = 'is-hold';
        if (meta) meta.textContent = step.hold.meta;
        setChip('Czeka na człowieka', 'warn');
        footEl.textContent = 'Wyjątek: cena powyżej tolerancji 2%';
        await wait(2400);
        setChip('W toku', '');
        footEl.textContent = step.hold.resolved;
        await wait(500);
      }
      el.className = 'is-done';
      if (meta) meta.textContent = step.meta;
      await wait(260);
    }
    finish(s);
    await wait(3200);
  };

  void (async () => {
    let i = 0;
    for (;;) {
      while (!visible || document.hidden) await wait(600);
      const s = SCRIPTS[i % SCRIPTS.length];
      if (s) await play(s);
      root.classList.add('is-swapping');
      await wait(320);
      root.classList.remove('is-swapping');
      i++;
    }
  })();
}
