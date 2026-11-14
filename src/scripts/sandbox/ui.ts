/**
 * Sandbox: kontroler interfejsu.
 *
 * Stan jest jednym obiektem; każdy region (kolejka, sprawa, dziennik, reguły,
 * metryki) ma własną funkcję renderującą wywoływaną tylko wtedy, gdy zmieniły
 * się jego dane. Symulacja to zwykłe funkcje async z „epoką” — zmiana
 * scenariusza lub reset unieważnia trwające przebiegi.
 */
import { SCENARIOS, type CaseDef, type RuleDef, type Scenario, type ScenarioId } from './data';
import { defaultRules, evaluate, forecast, pct, zl, type Check, type Rules } from './engine';

type Status = 'new' | 'running' | 'waiting' | 'closed' | 'returned' | 'rejected';
type Actor = 'agent' | 'human';
type Tone = '' | 'ok' | 'warn' | 'danger';

interface CaseState {
  def: CaseDef;
  status: Status;
  /** Indeks aktywnego kroku (0–4); 5 = wszystkie zakończone; -1 = nie rozpoczęto. */
  step: number;
  marks: number;
  fields: number;
  checks: Check[];
  checksShown: number;
  reasons: string[];
  /** Czy człowiek brał udział w decyzji. */
  touched: boolean;
  /** Co się właśnie pojawiło — tylko ten element dostaje animację wejścia. */
  fresh: '' | 'mark' | 'field' | 'check';
}

const STEPS = ['Odczyt', 'Ekstrakcja', 'Walidacja', 'Decyzja', 'Zapis'] as const;

const STATUS: Record<Status, { label: string; tone: Tone }> = {
  new: { label: 'Nowa', tone: '' },
  running: { label: 'W toku', tone: '' },
  waiting: { label: 'Czeka na Ciebie', tone: 'warn' },
  closed: { label: 'Domknięta', tone: 'ok' },
  returned: { label: 'Pytanie do nadawcy', tone: '' },
  rejected: { label: 'Odrzucona', tone: 'danger' },
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch);

const chip = (status: Status) => {
  const s = STATUS[status];
  const cls = ['chip', s.tone ? `chip--${s.tone}` : '', status === 'running' ? 'chip--live' : ''].filter(Boolean).join(' ');
  return `<span class="${cls}">${s.label}</span>`;
};

const ICON = {
  ok: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.25"/><path d="M5 8.2l2 2 4-4.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M8 2.2l6.2 10.9H1.8L8 2.2z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/><path d="M8 6.6v3M8 11.3v.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  stop: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.25"/><path d="M5.2 8h5.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

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

  const fresh = (def: CaseDef): CaseState => ({
    def,
    status: 'new',
    step: -1,
    marks: 0,
    fields: 0,
    checks: [],
    checksShown: 0,
    reasons: [],
    touched: false,
    fresh: '',
  });

  const find = (id: string) => cases.find((c) => c.def.id === id);
  const selected = () => find(selectedId) ?? cases[0];
  const finished = (c: CaseState) => c.status === 'closed' || c.status === 'returned' || c.status === 'rejected';

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
    el.queue.innerHTML = cases
      .map((c) => {
        const on = c.def.id === selectedId;
        return `<li>
          <button type="button" class="sbx-q${on ? ' is-selected' : ''} is-${c.status}" data-id="${c.def.id}"${on ? ' aria-current="true"' : ''}>
            <span class="sbx-q__row"><span class="mono">${c.def.id}</span><span class="mono">${c.def.received}</span></span>
            <span class="sbx-q__from">${esc(c.def.from)}</span>
            <span class="sbx-q__subject">${esc(c.def.subject)}</span>
            ${chip(c.status)}
          </button>
        </li>`;
      })
      .join('');

    const left = cases.filter((c) => c.status === 'new').length;
    el.run.disabled = left === 0 && !autoRun;
    el.run.textContent = autoRun ? 'Wstrzymaj' : left === cases.length ? 'Uruchom kolejkę' : left === 0 ? 'Kolejka pusta' : 'Wznów kolejkę';
    el.run.classList.toggle('is-hint', left === cases.length && !autoRun);
  };

  const renderMetrics = () => {
    const done = cases.filter(finished);
    const touchless = done.filter((c) => !c.touched).length;
    const agentSec = done.reduce((sum, c) => sum + c.def.agentSeconds, 0);
    const manualMin = done.reduce((sum, c) => sum + c.def.manualMinutes, 0);
    const waiting = cases.filter((c) => c.status === 'waiting').length;
    const time = agentSec >= 60 ? `${Math.floor(agentSec / 60)} min ${agentSec % 60} s` : `${agentSec} s`;
    const cells: [string, string, string][] = [
      ['Obsłużone', `${done.length} / ${cases.length}`, waiting ? `${waiting} czeka na Ciebie` : 'sprawy w scenariuszu'],
      ['Bez udziału człowieka', done.length ? `${Math.round((touchless / done.length) * 100)}%` : '—', 'spośród obsłużonych'],
      ['Czas pracy agenta', done.length ? time : '—', 'łącznie'],
      ['Ręcznie zajęłoby', done.length ? `~${manualMin} min` : '—', 'wg założeń scenariusza'],
    ];
    el.metrics.innerHTML = cells
      .map(([k, v, hint]) => `<div class="sbx-metric"><span>${k}</span><strong class="tnum">${v}</strong><small>${hint}</small></div>`)
      .join('');
  };

  const bodyHtml = (c: CaseState) => {
    let i = 0;
    return esc(c.def.body).replace(/\[\[(.+?)\]\]/g, (_, text: string) => {
      const idx = i++;
      const on = idx < c.marks;
      const isFresh = c.fresh === 'mark' && idx === c.marks - 1;
      return `<mark class="${on ? 'on' : ''}${isFresh ? ' fresh' : ''}">${text}</mark>`;
    });
  };

  const decisionHtml = (c: CaseState) => {
    const d = c.def;
    if (c.status === 'new') {
      return `<div class="sbx-decision">
        <div><strong>Sprawa czeka w kolejce</strong><p>Uruchom agenta dla tej sprawy albo całą kolejkę.</p></div>
        <div class="sbx-decision__actions"><button type="button" class="btn btn--ghost btn--sm" data-act="run-one"${busy ? ' disabled' : ''}>Uruchom agenta</button></div>
      </div>`;
    }
    if (c.status === 'running') {
      return `<div class="sbx-decision is-running"><div><strong>Agent pracuje</strong><p>${STEPS[Math.min(Math.max(c.step, 0), 4)]}…</p></div></div>`;
    }
    if (c.status === 'waiting') {
      return `<div class="sbx-decision is-warn" role="group" aria-label="Decyzja">
        <div>
          <strong>Czeka na Twoją decyzję</strong>
          <ul>${c.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
          <p><span class="sbx-decision__tag">Rekomendacja agenta</span> ${esc(d.advice)}</p>
        </div>
        <div class="sbx-decision__actions">
          <button type="button" class="btn btn--primary btn--sm" data-act="approve">Zatwierdź</button>
          <button type="button" class="btn btn--ghost btn--sm" data-act="reject">Odrzuć</button>
          <button type="button" class="sbx-textbtn" data-act="rules">Zmień reguły</button>
        </div>
      </div>`;
    }
    if (c.status === 'closed') {
      return `<div class="sbx-decision is-ok">
        <div>
          <strong>${c.touched ? 'Domknięta po Twojej akceptacji' : 'Domknięta bez udziału człowieka'}</strong>
          <p><span class="mono">${esc(d.result.doc)}</span> · ${esc(d.result.reply)}.</p>
        </div>
        <span class="sbx-decision__time mono">${d.agentSeconds} s</span>
      </div>`;
    }
    if (c.status === 'rejected' && c.touched) {
      return `<div class="sbx-decision is-danger"><div><strong>Odrzucona przez Ciebie</strong><p>Agent odesłał nadawcy informację z powodem odmowy. Nic nie zostało zapisane w systemie: ${esc(scenario.system)}.</p></div></div>`;
    }
    const hard = d.hard;
    return `<div class="sbx-decision${c.status === 'rejected' ? ' is-danger' : ''}">
      <div><strong>${c.status === 'rejected' ? 'Odrzucona przez agenta' : 'Zwrócona do nadawcy z pytaniem'}</strong><p>${esc(hard?.action ?? '')}</p></div>
      <span class="sbx-decision__time mono">${d.agentSeconds} s</span>
    </div>`;
  };

  const renderCase = () => {
    const c = selected();
    if (!c) return;
    const d = c.def;
    const hold = c.status === 'waiting' || c.status === 'returned' || c.status === 'rejected';

    const stepper = STEPS.map((name, i) => {
      const state = c.step > i ? 'done' : c.step === i ? (hold ? 'hold' : 'active') : 'todo';
      return `<li class="is-${state}"><span class="sbx-step__dot"></span><span>${name}</span></li>`;
    }).join('');

    const fields = d.fields
      .map((f, i) => {
        const on = i < c.fields;
        const isFresh = c.fresh === 'field' && i === c.fields - 1;
        return `<div class="${on ? 'on' : ''}${isFresh ? ' fresh' : ''}"><dt>${esc(f.label)}</dt><dd>${on ? esc(f.value) : ''}</dd></div>`;
      })
      .join('');

    const checks =
      c.checks.length === 0
        ? '<li class="sbx-empty">Pojawią się po ekstrakcji danych.</li>'
        : c.checks
            .slice(0, c.checksShown)
            .map((k, i) => {
              const isFresh = c.fresh === 'check' && i === c.checksShown - 1;
              return `<li class="is-${k.status}${isFresh ? ' fresh' : ''}">${ICON[k.status]}<span>${esc(k.label)}</span><span>${esc(k.detail)}</span></li>`;
            })
            .join('');

    el.case.innerHTML = `
      <header class="sbx-case__head">
        <div>
          <p class="sbx-case__meta"><span class="mono">${d.id}</span> · ${esc(d.channel)} · ${d.received}</p>
          <h3>${esc(d.subject)}</h3>
          <p class="sbx-case__from">${esc(d.from)}</p>
        </div>
        ${chip(c.status)}
      </header>
      <ol class="sbx-steps" aria-label="Etapy obsługi">${stepper}</ol>
      <div class="sbx-case__cols">
        <div class="sbx-block">
          <h4>Źródło</h4>
          <p class="sbx-source">${bodyHtml(c)}</p>
        </div>
        <div class="sbx-block">
          <h4>Dane wyodrębnione</h4>
          <dl class="sbx-fields">${fields}</dl>
        </div>
        <div class="sbx-block sbx-block--wide">
          <h4>Walidacja według reguł</h4>
          <ul class="sbx-checks">${checks}</ul>
        </div>
      </div>
      ${decisionHtml(c)}`;
  };

  const renderForecast = () => {
    const box = el.rules.querySelector('[data-sbx-forecast]');
    if (!box) return;
    const f = forecast(scenario, rules);
    const auto = f.filter(Boolean).length;
    box.innerHTML = `
      <div class="sbx-forecast__dots" aria-hidden="true">${f.map((ok) => `<i class="${ok ? 'ok' : 'warn'}"></i>`).join('')}</div>
      <p><strong class="tnum">${auto} z ${f.length}</strong> spraw agent obsłuży sam. ${f.length - auto === 0 ? 'Żadna nie trafi do Ciebie.' : `${f.length - auto} ${f.length - auto === 1 ? 'trafi' : 'trafią'} do Ciebie.`}</p>`;
  };

  const ruleValue = (r: RuleDef) => (r.kind === 'toggle' ? '' : r.unit === 'zł' ? zl(rules[r.key]) : pct(rules[r.key]));

  const renderRules = () => {
    el.rules.innerHTML = `
      <p class="sbx-rules__intro">Zmieniaj progi i patrz, jak zmienia się podział pracy między agentem a człowiekiem.</p>
      ${scenario.rules
        .map((r) =>
          r.kind === 'range'
            ? `<div class="sbx-rule">
                <div class="sbx-rule__head"><label for="sbx-r-${r.key}">${esc(r.label)}</label><output class="tnum" data-out="${r.key}">${ruleValue(r)}</output></div>
                <input id="sbx-r-${r.key}" type="range" min="${r.min}" max="${r.max}" step="${r.step}" value="${rules[r.key]}" data-rule="${r.key}" />
                <p>${esc(r.hint)}</p>
              </div>`
            : `<div class="sbx-rule sbx-rule--toggle">
                <div class="sbx-rule__head">
                  <label for="sbx-r-flag">${esc(r.label)}</label>
                  <input id="sbx-r-flag" class="sbx-switch" type="checkbox" role="switch" data-rule="flag"${rules.flag ? ' checked' : ''} />
                </div>
                <p>${esc(r.hint)}</p>
              </div>`,
        )
        .join('')}
      <div class="sbx-forecast" data-sbx-forecast aria-live="polite"></div>`;
    el.rules.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(paintRange);
    renderForecast();
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
    log('agent', c.def.id, `Zapisano w systemie (${scenario.system}): ${c.def.result.doc}`, 'ok');
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

  const load = (id: ScenarioId) => {
    epoch++;
    busy = false;
    autoRun = false;
    scenario = SCENARIOS.find((s) => s.id === id) ?? scenario;
    rules = defaultRules(scenario);
    cases = scenario.cases.map(fresh);
    selectedId = cases[0]?.def.id ?? '';
    const [h = '8', m = '0'] = (cases[0]?.def.received ?? '08:00').split(':');
    clock = Number(h) * 3600 + Number(m) * 60;
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
      if (out && def) out.textContent = ruleValue(def);
    }
    renderForecast();
  });

  el.rules.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const key = input.dataset.rule as keyof Rules | undefined;
    const def = scenario.rules.find((r) => r.key === key);
    if (!key || !def) return;
    const value = def.kind === 'toggle' ? (rules.flag ? 'włączono' : 'wyłączono') : ruleValue(def);
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

  load(scenario.id);
  showTab('log');
  root.classList.add('is-ready');
}
