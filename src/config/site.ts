/**
 * Jedno źródło prawdy dla danych firmy i deklaracji handlowych.
 *
 * Wartości zależne od decyzji właściciela (domena, adres, dane rejestrowe)
 * są w company.json — ten sam plik czyta astro.config.mjs i bramka
 * publikacji `npm run check:release`.
 */
import company from './company.json';

export const site = {
  name: 'SKOBEN',
  tagline: 'Agenci AI, którzy domykają pracę',
  description:
    'SKOBEN wdraża agentów AI i automatyzuje przepływy pracy w zamówieniach, fakturach i zgłoszeniach. Z człowiekiem przy wyjątkach i dziennikiem każdej decyzji.',
  /** Domena produkcyjna. */
  url: company.url,
  /** Adres, na który trafiają zapytania z formularza. */
  contactEmail: company.contactEmail,
  /**
   * Opcjonalny endpoint formularza (POST JSON). Pusty = formularz otwiera
   * przygotowaną wiadomość w programie pocztowym użytkownika.
   */
  formEndpoint: company.formEndpoint,
  /** Dane rejestrowe — puste pola nie są renderowane. */
  legal: company.legal,
  /** Data ostatniej zmiany polityki prywatności (RRRR-MM-DD). */
  privacyUpdated: company.privacyUpdated,
};

/** Deklaracje czasu i zakresu używane w treściach — do potwierdzenia przez właściciela. */
export const facts = {
  callLength: '30 minut',
  mapping: '1–2 tygodnie',
  pilot: '4–6 tygodni',
  responseTime: '1 dnia roboczego',
} as const;

export const nav = [
  { href: '/agenci/', label: 'Agenci' },
  { href: '/automatyzacje/', label: 'Automatyzacje' },
  { href: '/wdrozenie/', label: 'Wdrożenie' },
  { href: '/bezpieczenstwo/', label: 'Bezpieczeństwo' },
] as const;
