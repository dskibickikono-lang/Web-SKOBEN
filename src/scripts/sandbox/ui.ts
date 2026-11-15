/**
 * Sandbox: kontroler interfejsu.
 *
 * Stan jest jednym obiektem; każdy region (kolejka, sprawa, dziennik, reguły,
 * metryki) ma własną funkcję renderującą wywoływaną tylko wtedy, gdy zmieniły
 * się jego dane. Szablony HTML mieszkają w view.ts i są wspólne z renderem
 * w czasie builda. Symulacja to zwykłe funkcje async z „epoką” — zmiana
 * scenariusza lub reset unieważnia trwające przebiegi.
 */
import { SCENARIOS, type Scenario, type ScenarioId } from './data';
import { defaultRules, evaluate, type Rules } from './engine';
import {
  caseHtml,
  esc,
  forecastHtml,
  freshCase,
  metricsHtml,
  queueHtml,
  ruleValue,
  rulesHtml,
  runButton,
  type CaseState,
} from './view';

type Actor = 'agent' | 'human';
type Tone = '' | 'ok' | 'warn' | 'danger';

export function mountSandbox(root: HTMLElement): void {
  const $ = <T extends HTMLElement>(sel: string): T => {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`Sandbox: brak elementu ${sel}`);
    return el;
  };

  const el = {
    scenarios: Array.from(root.querySelectorAll<HTMLButtonElement>('[data-sbx-scenario]')),
    metrics: $('[data-sbx-metrics]'),
    queue: $('[data-sbx-queue]'),
    intro: $('[data-sbx-intro]'),
    run: $<HTMLButtonElement>('[data-sbx-run]'),
    case: $('[data-sbx-case]'),
    log: $('[data-sbx-log]'),
    rules: $('[data-sbx-rules]'),
    speed: $<HTMLButtonElement>('[data-sbx-speed]'),
    reset: $<HTMLButtonElement>('[data-sbx-reset]'),
    tabs: Array.from(root.querySelectorAll<HTMLButtonElement>('[data-sbx-tab]')),
    panels: Array.from(root.querySelectorAll<HTMLElement>('[data-sbx-panel]')),
  };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Stan -----------------------------------------------------------------

  let scenario: Scenario = SCENARIOS[0] as Scenario;
  let rules: Rules = defaultRules(scenario);
  let cases: CaseState[] = [];
  let selectedId = '';
  let epoch = 0;
  let busy = false;
  let autoRun = false;
  let speed = 1;
  let clock = 0;

  const find = (id: string) => cases.find((c) => c.def.id === id);
  const selected = () => find(selectedId) ?? cases[0];

  const delay = (ms: number) =>
    new Promise<void>((resolve) => window.setTimeout(resolve, reduce ? Math.min(ms, 60) : ms / speed));

  const stamp = () => {
    const h = Math.floor(clock / 3600) % 24;
    const m = Math.floor(clock / 60) % 60;
    const s = clock % 60;
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  };

  // --- Dziennik -------------------------------------------------------------

  const log = (actor: Actor, caseId: string, text: string, tone: Tone = '') => {
    clock += actor === 'human' ? 1 : 2 + (text.length % 5);
    const li = document.createElement('div');
    li.className = `sbx-log__item${tone ? ` is-${tone}` : ''}`;
    li.innerHTML = `
      <span class="sbx-log__time mono">${stamp()}</span>
      <span class="sbx-log__actor sbx-log__actor--${actor}">${actor === 'human' ? 'Ty' : 'Agent'}</span>
      <span class="sbx-log__text">${caseId ? `<span class="mono">${esc(caseId)}</span> ` : ''}${esc(text)}</span>`;
    el.log.append(li);
    el.log.scrollTop = el.log.scrollHeight;
    const badge = root.querySelector('[data-sbx-logcount]');
    if (badge) badge.textContent = String(el.log.children.length);
  };

  // --- Renderowanie ---------------------------------------------------------

  const renderQueue = () => {
    el.queue.innerHTML = queueHtml(cases, selectedId);
    const btn = runButton(cases, autoRun);
    el.run.disabled = btn.disabled;
    el.run.textContent = btn.label;
    el.run.classList.toggle('is-hint', btn.hint);
  };

  const renderMetrics = () => {
    el.metrics.innerHTML = metricsHtml(cases);
  };

  const renderCase = () => {
    const c = selected();
    if (c) el.case.innerHTML = caseHtml(scenario, c, busy);
  };

  const renderForecast = () => {
    const box = el.rules.querySelector('[data-sbx-forecast]');
    if (box) box.innerHTML = forecastHtml(scenario, rules);
  };

  const renderRules = () => {
    el.rules.innerHTML = rulesHtml(scenario, rules, root.dataset.idPrefix ?? 'sbx');
  };

  const paintRange = (input: HTMLInputElement) => {
    const min = Number(input.min);
    const max = Number(input.max);
    input.style.setProperty('--pct', `${((Number(input.value) - min) / (max - min)) * 100}%`);
  };

  const renderAll = () => {
    renderQueue();
    renderMetrics();
    renderCase();
  };

  const touch = (c: CaseState) => {
    renderQueue();
    renderMetrics();
    if (c.def.id === selectedId) renderCase();
  };

  // --- Symulacja ------------------------------------------------------------

  const commit = async (c: CaseState, my: number) => {
    c.status = 'running';
    c.step = 4;
    c.fresh = '';
    touch(c);
    await delay(850);
    if (my !== epoch) return;
    log('agent', c.def.id, `Zapisano (${scenario.system}): ${c.def.result.doc}`, 'ok');
    log('agent', c.def.id, c.def.result.reply);
    c.status = 'closed';
    c.step = 5;
    touch(c);
  };

  const runCase = async (c: CaseState, my: number, follow: boolean) => {
    const d = c.def;
    if (follow && selected()?.status !== 'waiting') selectedId = d.id;
    c.status = 'running';
    c.step = 0;
    touch(c);
    log('agent', d.id, `Odczytano: ${d.channel} od ${d.from}`);
    await delay(750);
    if (my !== epoch) return;

    c.step = 1;
    const marks = (d.body.match(/\[\[/g) ?? []).length;
    for (let i = 1; i <= marks; i++) {
      c.marks = i;
      c.fresh = 'mark';
      touch(c);
      await delay(170);
      if (my !== epoch) return;
    }
    for (let i = 1; i <= d.fields.length; i++) {
      c.fields = i;
      c.fresh = 'field';
      touch(c);
      await delay(150);
      if (my !== epoch) return;
    }
    log('agent', d.id, `Wyodrębniono ${d.fields.length} pola z treści`);

    c.step = 2;
    const ev = evaluate(scenario, d, rules);
    c.checks = ev.checks;
    for (let i = 1; i <= ev.checks.length; i++) {
      c.checksShown = i;
      c.fresh = 'check';
      touch(c);
      await delay(300);
      if (my !== epoch) return;
    }

    c.step = 3;
    c.fresh = '';
    touch(c);
    await delay(520);
    if (my !== epoch) return;

    if (d.hard) {
      log('agent', d.id, d.hard.reason, d.hard.status === 'rejected' ? 'danger' : 'warn');
      log('agent', d.id, d.hard.status === 'rejected' ? 'Odrzucono automatycznie, nadawca powiadomiony' : 'Wysłano pytanie do nadawcy');
      c.status = d.hard.status;
      touch(c);
      return;
    }

    if (ev.reasons.length > 0) {
      c.reasons = ev.reasons;
      c.status = 'waiting';
      log('agent', d.id, `Przekazano do akceptacji: ${ev.reasons.join('; ')}`, 'warn');
      touch(c);
      return;
    }

    log('agent', d.id, 'Zgodne z regułami — bez akceptacji');
    await commit(c, my);
  };

  const runQueue = async () => {
    if (busy) return;
    const my = epoch;
    busy = true;
    autoRun = true;
    renderQueue();
    while (autoRun && my === epoch) {
      const next = cases.find((c) => c.status === 'new');
      if (!next) break;
      await runCase(next, my, true);
      if (my !== epoch) return;
      await delay(380);
    }
    if (my !== epoch) return;
    busy = false;
    autoRun = false;
    renderAll();
  };

  const runOne = async (c: CaseState) => {
    if (busy || c.status !== 'new') return;
    const my = epoch;
    busy = true;
    await runCase(c, my, false);
    if (my !== epoch) return;
    busy = false;
    renderAll();
  };

  /** Po zmianie reguł: sprawy czekające, które teraz mieszczą się w progach, domykają się same. */
  const reevaluateWaiting = () => {
    const my = epoch;
    for (const c of cases) {
      if (c.status !== 'waiting') continue;
      const ev = evaluate(scenario, c.def, rules);
      c.checks = ev.checks;
      c.reasons = ev.reasons;
      if (ev.reasons.length === 0) {
        log('agent', c.def.id, 'Po zmianie reguł sprawa mieści się w progach — domykam', 'ok');
        void commit(c, my);
      } else if (c.def.id === selectedId) {
        renderCase();
      }
    }
  };

  // --- Scenariusz / reset ---------------------------------------------------

  /**
   * Ładuje scenariusz. Przy pierwszym uruchomieniu (`hydrate`) DOM pochodzi
   * z builda i jest już zgodny ze stanem — nie renderujemy go ponownie.
   */
  const load = (id: ScenarioId, hydrate = false) => {
    epoch++;
    busy = false;
    autoRun = false;
    scenario = SCENARIOS.find((s) => s.id === id) ?? scenario;
    rules = defaultRules(scenario);
    cases = scenario.cases.map(freshCase);
    selectedId = cases[0]?.def.id ?? '';
    const [h = '8', m = '0'] = (cases[0]?.def.received ?? '08:00').split(':');
    clock = Number(h) * 3600 + Number(m) * 60;
    if (hydrate) return;

    el.log.innerHTML = '';
    el.intro.textContent = scenario.intro;
    el.scenarios.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sbxScenario === id)));
    const badge = root.querySelector('[data-sbx-logcount]');
    if (badge) badge.textContent = '0';
    renderRules();
    renderAll();
  };

  const showTab = (name: string, focus = false) => {
    el.tabs.forEach((t) => {
      const on = t.dataset.sbxTab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    el.panels.forEach((p) => (p.hidden = p.dataset.sbxPanel !== name));
    if (name === 'log') el.log.scrollTop = el.log.scrollHeight;
  };

  /** Przy pierwszym uruchomieniu dosuwa konsolę tak, by mieściła się w oknie. */
  const bringIntoView = () => {
    const r = root.getBoundingClientRect();
    if (r.bottom <= window.innerHeight && r.top >= 0) return;
    const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 88;
    window.scrollTo({ top: window.scrollY + r.top - header + 8, behavior: reduce ? 'auto' : 'smooth' });
  };

  // --- Zdarzenia ------------------------------------------------------------

  el.scenarios.forEach((b) => b.addEventListener('click', () => load(b.dataset.sbxScenario as ScenarioId)));

  el.reset.addEventListener('click', () => load(scenario.id));

  el.speed.addEventListener('click', () => {
    speed = speed === 1 ? 3 : 1;
    el.speed.setAttribute('aria-pressed', String(speed === 3));
  });

  el.run.addEventListener('click', () => {
    if (autoRun) {
      autoRun = false;
      renderQueue();
    } else {
      bringIntoView();
      void runQueue();
    }
  });

  el.queue.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-id]');
    if (!btn?.dataset.id) return;
    selectedId = btn.dataset.id;
    renderQueue();
    renderCase();
    el.queue.querySelector<HTMLButtonElement>(`[data-id="${selectedId}"]`)?.focus();
  });

  el.case.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
    const c = selected();
    if (!btn || !c) return;
    const act = btn.dataset.act;

    if (act === 'run-one') {
      void runOne(c);
    } else if (act === 'rules') {
      showTab('rules', true);
    } else if (act === 'approve' && c.status === 'waiting') {
      c.touched = true;
      log('human', c.def.id, 'Zatwierdzono wyjątek', 'ok');
      el.case.focus();
      void commit(c, epoch);
    } else if (act === 'reject' && c.status === 'waiting') {
      c.touched = true;
      c.status = 'rejected';
      log('human', c.def.id, 'Odrzucono', 'danger');
      log('agent', c.def.id, 'Nadawca powiadomiony o odmowie; brak zapisu w systemie');
      el.case.focus();
      touch(c);
    }
  });

  el.rules.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    const key = input.dataset.rule as keyof Rules | undefined;
    if (!key) return;
    if (key === 'flag') {
      rules.flag = input.checked;
    } else {
      rules[key] = Number(input.value);
      paintRange(input);
      const def = scenario.rules.find((r) => r.key === key);
      const out = el.rules.querySelector(`[data-out="${key}"]`);
      if (out && def) out.textContent = ruleValue(def, rules);
    }
    renderForecast();
  });

  el.rules.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const key = input.dataset.rule as keyof Rules | undefined;
    const def = scenario.rules.find((r) => r.key === key);
    if (!key || !def) return;
    const value = def.kind === 'toggle' ? (rules.flag ? 'włączono' : 'wyłączono') : ruleValue(def, rules);
    log('human', '', `Zmiana reguły „${def.label}”: ${value}`);
    reevaluateWaiting();
  });

  el.tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => showTab(tab.dataset.sbxTab ?? 'log'));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = el.tabs[(i + (e.key === 'ArrowRight' ? 1 : el.tabs.length - 1)) % el.tabs.length];
      if (next) showTab(next.dataset.sbxTab ?? 'log', true);
    });
  });

  load(scenario.id, true);
  showTab('log');
  root.classList.add('is-ready');
}
