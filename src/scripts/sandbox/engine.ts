/**
 * Logika sandboxa bez DOM: ocena sprawy względem reguł i prognoza kolejki.
 * Te same funkcje napędzają symulację i podgląd „co się stanie, gdy zmienię próg”.
 */
import type { CaseDef, Scenario, ScenarioId } from './data';

export interface Rules {
  tol: number;
  limit: number;
  conf: number;
  flag: boolean;
}

export interface Check {
  label: string;
  detail: string;
  status: 'ok' | 'warn' | 'stop';
}

export interface Evaluation {
  checks: Check[];
  /** Powody przekazania do człowieka; pusta lista = agent domyka sam. */
  reasons: string[];
}

const nf = new Intl.NumberFormat('pl-PL', { useGrouping: 'always', maximumFractionDigits: 2 });
export const zl = (n: number) => `${nf.format(n)} zł`;
export const pct = (n: number) => `${nf.format(n)}%`;

export function defaultRules(s: Scenario): Rules {
  const rules: Rules = { tol: 0, limit: 0, conf: 0, flag: false };
  for (const r of s.rules) {
    if (r.kind === 'toggle') rules.flag = r.value;
    else rules[r.key] = r.value;
  }
  return rules;
}

const FLAG_TEXT: Record<ScenarioId, { label: string; on: string; off: string; reason: string }> = {
  orders: {
    label: 'Kontrahent',
    on: 'nowy klient',
    off: 'znany, bez zaległości',
    reason: 'Nowy klient — pierwsze zamówienie wymaga akceptacji',
  },
  invoices: {
    label: 'Dostawca',
    on: 'nowy dostawca',
    off: 'zweryfikowany, rachunek na białej liście',
    reason: 'Nowy dostawca — pierwsza faktura wymaga akceptacji',
  },
  tickets: {
    label: 'Umowa serwisowa',
    on: 'klient z umową SLA',
    off: 'standardowe warunki',
    reason: 'Klient z umową SLA — decyzję podejmuje serwis',
  },
};

const LIMIT_TEXT: Record<ScenarioId, { label: string; reason: string }> = {
  orders: { label: 'Wartość zamówienia', reason: 'Wartość powyżej limitu' },
  invoices: { label: 'Kwota faktury', reason: 'Kwota powyżej limitu' },
  tickets: { label: 'Rekompensata', reason: 'Roszczenie powyżej limitu' },
};

export function evaluate(scenario: Scenario, c: CaseDef, rules: Rules): Evaluation {
  const checks: Check[] = [];
  const reasons: string[] = [];
  const m = c.metrics;

  if (c.hard) {
    checks.push({ label: c.hard.check, detail: c.hard.reason, status: 'stop' });
    return { checks, reasons };
  }

  if (scenario.id === 'tickets') {
    const ok = m.confidence >= rules.conf;
    checks.push({
      label: 'Pewność klasyfikacji',
      detail: `${pct(m.confidence)} · próg ${pct(rules.conf)}`,
      status: ok ? 'ok' : 'warn',
    });
    if (!ok) reasons.push(`Pewność klasyfikacji ${pct(m.confidence)} poniżej progu ${pct(rules.conf)}`);
  } else {
    const ok = m.deviation <= rules.tol;
    checks.push({
      label: scenario.id === 'orders' ? 'Cena względem cennika' : 'Cena względem zamówienia',
      detail: m.deviation === 0 ? 'zgodna' : `odchylenie ${pct(m.deviation)} · tolerancja ${pct(rules.tol)}`,
      status: ok ? 'ok' : 'warn',
    });
    if (!ok) reasons.push(`Odchylenie ceny ${pct(m.deviation)} przekracza tolerancję ${pct(rules.tol)}`);
  }

  {
    const text = LIMIT_TEXT[scenario.id];
    const ok = m.amount <= rules.limit;
    checks.push({
      label: text.label,
      detail: m.amount === 0 ? 'nie dotyczy' : `${zl(m.amount)} · limit ${zl(rules.limit)}`,
      status: ok ? 'ok' : 'warn',
    });
    if (!ok) reasons.push(`${text.reason}: ${zl(m.amount)} przy limicie ${zl(rules.limit)}`);
  }

  {
    const text = FLAG_TEXT[scenario.id];
    const hit = m.flag && rules.flag;
    checks.push({
      label: text.label,
      detail: m.flag ? text.on : text.off,
      status: hit ? 'warn' : 'ok',
    });
    if (hit) reasons.push(text.reason);
  }

  checks.push(
    scenario.id === 'orders'
      ? { label: 'Stan magazynowy', detail: 'dostępne w terminie', status: 'ok' }
      : scenario.id === 'invoices'
        ? { label: 'Rachunek bankowy', detail: 'zgodny z białą listą', status: 'ok' }
        : { label: 'Komplet danych', detail: 'wystarczający do odpowiedzi', status: 'ok' },
  );

  return { checks, reasons };
}

/** Dla każdej sprawy: czy przy tych regułach agent poradzi sobie bez człowieka. */
export function forecast(scenario: Scenario, rules: Rules): boolean[] {
  return scenario.cases.map((c) => evaluate(scenario, c, rules).reasons.length === 0);
}
