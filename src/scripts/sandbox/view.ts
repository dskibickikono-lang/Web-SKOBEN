/**
 * Sandbox: szablony HTML bez dostępu do DOM.
 *
 * Te same funkcje renderują stan początkowy w czasie builda (Sandbox.astro)
 * i każdą kolejną zmianę w przeglądarce (ui.ts). Dzięki temu konsola jest
 * kompletna już w statycznym HTML — bez przesunięć układu po załadowaniu JS.
 */
import type { CaseDef, RuleDef, Scenario } from './data';
import { forecast, pct, zl, type Check, type Rules } from './engine';

export type Status = 'new' | 'running' | 'waiting' | 'closed' | 'returned' | 'rejected';
type Tone = '' | 'ok' | 'warn' | 'danger';

export interface CaseState {
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

export const STEPS = ['Odczyt', 'Ekstrakcja', 'Walidacja', 'Decyzja', 'Zapis'] as const;

const STATUS: Record<Status, { label: string; tone: Tone }> = {
  new: { label: 'Nowa', tone: '' },
  running: { label: 'W toku', tone: '' },
  waiting: { label: 'Czeka na Ciebie', tone: 'warn' },
  closed: { label: 'Domknięta', tone: 'ok' },
  returned: { label: 'Pytanie do nadawcy', tone: '' },
  rejected: { label: 'Odrzucona', tone: 'danger' },
};

const ICON = {
  ok: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.25"/><path d="M5 8.2l2 2 4-4.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M8 2.2l6.2 10.9H1.8L8 2.2z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/><path d="M8 6.6v3M8 11.3v.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  stop: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.25"/><path d="M5.2 8h5.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch);

export const freshCase = (def: CaseDef): CaseState => ({
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

export const finished = (c: CaseState) => c.status === 'closed' || c.status === 'returned' || c.status === 'rejected';

const chip = (status: Status) => {
  const s = STATUS[status];
  const cls = ['chip', s.tone ? `chip--${s.tone}` : '', status === 'running' ? 'chip--live' : ''].filter(Boolean).join(' ');
  return `<span class="${cls}">${s.label}</span>`;
};

// --- Kolejka ------------------------------------------------------------------

export function queueHtml(cases: CaseState[], selectedId: string): string {
  return cases
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
}

export function runButton(cases: CaseState[], autoRun: boolean): { label: string; disabled: boolean; hint: boolean } {
  const left = cases.filter((c) => c.status === 'new').length;
  return {
    label: autoRun ? 'Wstrzymaj' : left === cases.length ? 'Uruchom kolejkę' : left === 0 ? 'Kolejka pusta' : 'Wznów kolejkę',
    disabled: left === 0 && !autoRun,
    hint: left === cases.length && !autoRun,
  };
}

// --- Metryki ------------------------------------------------------------------

export function metricsHtml(cases: CaseState[]): string {
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
  return cells
    .map(([k, v, hint]) => `<div class="sbx-metric"><span>${k}</span><strong class="tnum">${v}</strong><small>${hint}</small></div>`)
    .join('');
}

// --- Sprawa -------------------------------------------------------------------

function bodyHtml(c: CaseState): string {
  let i = 0;
  return esc(c.def.body).replace(/\[\[(.+?)\]\]/g, (_, text: string) => {
    const idx = i++;
    const on = idx < c.marks;
    const isFresh = c.fresh === 'mark' && idx === c.marks - 1;
    return `<mark class="${on ? 'on' : ''}${isFresh ? ' fresh' : ''}">${text}</mark>`;
  });
}

function decisionHtml(scenario: Scenario, c: CaseState, busy: boolean): string {
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
  return `<div class="sbx-decision${c.status === 'rejected' ? ' is-danger' : ''}">
    <div><strong>${c.status === 'rejected' ? 'Odrzucona przez agenta' : 'Zwrócona do nadawcy z pytaniem'}</strong><p>${esc(d.hard?.action ?? '')}</p></div>
    <span class="sbx-decision__time mono">${d.agentSeconds} s</span>
  </div>`;
}

export function caseHtml(scenario: Scenario, c: CaseState, busy: boolean): string {
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

  return `
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
    ${decisionHtml(scenario, c, busy)}`;
}

// --- Reguły -------------------------------------------------------------------

export const ruleValue = (r: RuleDef, rules: Rules) =>
  r.kind === 'toggle' ? '' : r.unit === 'zł' ? zl(rules[r.key]) : pct(rules[r.key]);

export function forecastHtml(scenario: Scenario, rules: Rules): string {
  const f = forecast(scenario, rules);
  const auto = f.filter(Boolean).length;
  const human = f.length - auto;
  return `
    <div class="sbx-forecast__dots" aria-hidden="true">${f.map((ok) => `<i class="${ok ? 'ok' : 'warn'}"></i>`).join('')}</div>
    <p><strong class="tnum">${auto} z ${f.length}</strong> spraw agent obsłuży sam. ${human === 0 ? 'Żadna nie trafi do Ciebie.' : `${human} ${human === 1 ? 'trafi' : 'trafią'} do Ciebie.`}</p>`;
}

export function rulesHtml(scenario: Scenario, rules: Rules): string {
  return `
    <p class="sbx-rules__intro">Zmieniaj progi i patrz, jak zmienia się podział pracy między agentem a człowiekiem.</p>
    ${scenario.rules
      .map((r) => {
        if (r.kind === 'toggle') {
          return `<div class="sbx-rule sbx-rule--toggle">
            <div class="sbx-rule__head">
              <label for="sbx-r-flag">${esc(r.label)}</label>
              <input id="sbx-r-flag" class="sbx-switch" type="checkbox" role="switch" data-rule="flag"${rules.flag ? ' checked' : ''} />
            </div>
            <p>${esc(r.hint)}</p>
          </div>`;
        }
        const fill = ((rules[r.key] - r.min) / (r.max - r.min)) * 100;
        return `<div class="sbx-rule">
          <div class="sbx-rule__head"><label for="sbx-r-${r.key}">${esc(r.label)}</label><output class="tnum" for="sbx-r-${r.key}" data-out="${r.key}">${ruleValue(r, rules)}</output></div>
          <input id="sbx-r-${r.key}" type="range" min="${r.min}" max="${r.max}" step="${r.step}" value="${rules[r.key]}" data-rule="${r.key}" style="--pct:${fill}%" />
          <p>${esc(r.hint)}</p>
        </div>`;
      })
      .join('')}
    <div class="sbx-forecast" data-sbx-forecast aria-live="polite">${forecastHtml(scenario, rules)}</div>`;
}
