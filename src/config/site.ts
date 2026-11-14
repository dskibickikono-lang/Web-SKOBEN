/**
 * Jedno źródło prawdy dla danych firmy i deklaracji handlowych.
 * Pola oznaczone DO POTWIERDZENIA wymagają weryfikacji właściciela przed publikacją.
 */
export const site = {
  name: 'SKOBEN',
  tagline: 'Agenci AI, którzy domykają pracę',
  description:
    'SKOBEN wdraża agentów AI i automatyzuje przepływy pracy w zamówieniach, fakturach i zgłoszeniach. Z człowiekiem przy wyjątkach i dziennikiem każdej decyzji.',
  /** DO POTWIERDZENIA: domena produkcyjna (spójna z astro.config.mjs). */
  url: 'https://skoben.pl',
  /** DO POTWIERDZENIA: adres, na który trafiają zapytania z formularza. */
  contactEmail: 'kontakt@skoben.pl',
  /**
   * Opcjonalny endpoint formularza (POST JSON). Pusty = formularz otwiera
   * przygotowaną wiadomość w programie pocztowym użytkownika.
   */
  formEndpoint: '',
  /** DO UZUPEŁNIENIA: dane rejestrowe — puste pola nie są renderowane. */
  legal: {
    entity: '',
    nip: '',
    address: '',
  },
} as const;

/** DO POTWIERDZENIA: deklaracje czasu i zakresu używane w treściach. */
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
