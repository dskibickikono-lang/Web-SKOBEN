/**
 * Dane sandboxa. Wszystkie firmy, dokumenty i kwoty są fikcyjne —
 * służą wyłącznie pokazaniu mechaniki: odczyt → walidacja → decyzja → zapis.
 */

export type ScenarioId = 'orders' | 'invoices' | 'tickets';

export interface RangeRule {
  kind: 'range';
  key: 'tol' | 'limit' | 'conf';
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
}

export interface ToggleRule {
  kind: 'toggle';
  key: 'flag';
  label: string;
  hint: string;
  value: boolean;
}

export type RuleDef = RangeRule | ToggleRule;

export interface CaseDef {
  id: string;
  from: string;
  subject: string;
  channel: string;
  received: string;
  /** Treść źródłowa; fragmenty [[tekst]] agent oznacza przy ekstrakcji. */
  body: string;
  fields: { label: string; value: string }[];
  metrics: {
    /** Kwota, której dotyczy limit (zł). */
    amount: number;
    /** Odchylenie ceny w % (zamówienia, faktury). */
    deviation: number;
    /** Nowy kontrahent / klient z umową SLA. */
    flag: boolean;
    /** Pewność klasyfikacji w % (zgłoszenia). */
    confidence: number;
  };
  /** Wynik niezależny od progów: agent sam zwraca sprawę do nadawcy lub ją odrzuca. */
  hard?: { status: 'returned' | 'rejected'; check: string; reason: string; action: string };
  /** Co powstaje po domknięciu. */
  result: { doc: string; reply: string };
  /** Rekomendacja agenta, gdy sprawa trafia do człowieka. */
  advice: string;
  manualMinutes: number;
  agentSeconds: number;
}

export interface Scenario {
  id: ScenarioId;
  name: string;
  system: string;
  intro: string;
  rules: RuleDef[];
  cases: CaseDef[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'orders',
    name: 'Zamówienia',
    system: 'ERP',
    intro: 'Zamówienia przychodzą e-mailem, w PDF-ach i przez EDI. Agent zakłada dokument w ERP i odpisuje klientowi.',
    rules: [
      {
        kind: 'range',
        key: 'tol',
        label: 'Tolerancja ceny',
        hint: 'Odchylenie od cennika, które agent akceptuje sam.',
        min: 0,
        max: 10,
        step: 0.5,
        value: 2,
        unit: '%',
      },
      {
        kind: 'range',
        key: 'limit',
        label: 'Limit wartości zamówienia',
        hint: 'Powyżej tej kwoty decyduje opiekun klienta.',
        min: 5000,
        max: 50000,
        step: 1000,
        value: 25000,
        unit: 'zł',
      },
      {
        kind: 'toggle',
        key: 'flag',
        label: 'Nowi klienci wymagają akceptacji',
        hint: 'Pierwsze zamówienie zawsze ogląda człowiek.',
        value: true,
      },
    ],
    cases: [
      {
        id: 'ZAM-2291',
        from: 'Hurtownia Bałtyk',
        subject: 'Zamówienie na przyszły tydzień',
        channel: 'E-mail',
        received: '08:14',
        body: 'Dzień dobry, proszę o [[240 szt.]] [[uszczelki EPDM 40 mm]] oraz [[60 szt.]] [[opaski 32–50]]. Dostawa do [[czwartku]], ceny jak ostatnio.',
        fields: [
          { label: 'Klient', value: 'Hurtownia Bałtyk' },
          { label: 'Pozycje', value: 'USZ-EPDM-40 × 240, OPA-32-50 × 60' },
          { label: 'Wartość netto', value: '878,40 zł' },
          { label: 'Termin dostawy', value: 'czw., 14.11' },
        ],
        metrics: { amount: 878.4, deviation: 0, flag: false, confidence: 98 },
        result: { doc: 'ZS/11/0482', reply: 'Potwierdzenie z terminem dostawy wysłane do klienta' },
        advice: 'Zatwierdzić — stały klient, ceny zgodne z cennikiem.',
        manualMinutes: 6,
        agentSeconds: 38,
      },
      {
        id: 'ZAM-2292',
        from: 'Instal-Tech',
        subject: 'Zamówienie nr 4471/11',
        channel: 'PDF',
        received: '08:31',
        body: 'W załączeniu zamówienie [[4471/11]]: [[7 pozycji]], wartość [[12 460,00 zł]] netto. Zawór DN25 w cenie [[79,60 zł]] — zgodnie z ofertą z września.',
        fields: [
          { label: 'Klient', value: 'Instal-Tech' },
          { label: 'Pozycje', value: '7 indeksów, 312 szt.' },
          { label: 'Wartość netto', value: '12 460,00 zł' },
          { label: 'Cena ZAW-DN25', value: '79,60 zł (cennik: 83,00 zł)' },
        ],
        metrics: { amount: 12460, deviation: 4.1, flag: false, confidence: 96 },
        result: { doc: 'ZS/11/0483', reply: 'Potwierdzenie z ceną ofertową wysłane do klienta' },
        advice: 'Zatwierdzić — w CRM jest oferta z września z ceną 79,60 zł, ważna do końca roku.',
        manualMinutes: 9,
        agentSeconds: 52,
      },
      {
        id: 'ZAM-2293',
        from: 'Zakład Mechaniczny Orzeł',
        subject: 'Pilne — łożyska',
        channel: 'E-mail',
        received: '09:02',
        body: 'Potrzebujemy [[40 szt.]] [[łożysk 6204 2RS]] na [[jutro rano]]. [[Odbiór własny]].',
        fields: [
          { label: 'Klient', value: 'Zakład Mechaniczny Orzeł' },
          { label: 'Pozycje', value: 'LOZ-6204-2RS × 40' },
          { label: 'Wartość netto', value: '1 140,00 zł' },
          { label: 'Wydanie', value: 'odbiór własny, pt. 8:00' },
        ],
        metrics: { amount: 1140, deviation: 0, flag: false, confidence: 99 },
        result: { doc: 'ZS/11/0484', reply: 'Potwierdzenie i awizo odbioru wysłane do klienta' },
        advice: 'Zatwierdzić — towar na stanie, klient bez zaległości.',
        manualMinutes: 5,
        agentSeconds: 31,
      },
      {
        id: 'ZAM-2294',
        from: 'Budmax',
        subject: 'Pierwsze zamówienie — klej C2TE',
        channel: 'Formularz B2B',
        received: '09:20',
        body: 'Pierwsze zamówienie: [[12 palet]] [[kleju C2TE 25 kg]], dostawa na budowę [[Gdańsk, ul. Portowa]]. Proszę o fakturę z [[terminem 30 dni]].',
        fields: [
          { label: 'Klient', value: 'Budmax (nowy)' },
          { label: 'Pozycje', value: 'KLEJ-C2TE-25 × 576' },
          { label: 'Wartość netto', value: '41 800,00 zł' },
          { label: 'Płatność', value: 'przelew 30 dni' },
        ],
        metrics: { amount: 41800, deviation: 0, flag: true, confidence: 97 },
        result: { doc: 'ZS/11/0485', reply: 'Potwierdzenie z warunkami płatności wysłane do klienta' },
        advice: 'Do decyzji opiekuna — nowy klient prosi o odroczony termin przy dużej wartości.',
        manualMinutes: 12,
        agentSeconds: 47,
      },
      {
        id: 'ZAM-2295',
        from: 'Hydro-Serwis',
        subject: 'Pompy — jak w zeszłym roku',
        channel: 'E-mail',
        received: '09:47',
        body: 'Proszę o wysyłkę [[15 szt.]] pompy — [[model jak w zeszłym roku]]. Dostawa [[do końca miesiąca]].',
        fields: [
          { label: 'Klient', value: 'Hydro-Serwis' },
          { label: 'Pozycje', value: 'niejednoznaczne (2 modele w historii)' },
          { label: 'Ilość', value: '15 szt.' },
          { label: 'Termin', value: 'do 30.11' },
        ],
        metrics: { amount: 0, deviation: 0, flag: false, confidence: 54 },
        hard: {
          status: 'returned',
          check: 'Indeks towaru',
          reason: 'W historii klienta są dwa modele pomp — nie da się jednoznacznie ustalić indeksu.',
          action: 'Agent odpisał z pytaniem o model i podał oba warianty z cenami. Sprawa wróci do kolejki po odpowiedzi.',
        },
        result: { doc: '', reply: '' },
        advice: '',
        manualMinutes: 7,
        agentSeconds: 29,
      },
      {
        id: 'ZAM-2296',
        from: 'Hurtownia Bałtyk',
        subject: 'ORDERS — dostawa 18.11',
        channel: 'EDI',
        received: '10:05',
        body: 'Komunikat [[ORDERS D.96A]] · [[18 pozycji]] · wartość netto [[9 312,50 zł]] · dostawa [[18.11]] · magazyn [[Gdynia]].',
        fields: [
          { label: 'Klient', value: 'Hurtownia Bałtyk' },
          { label: 'Pozycje', value: '18 indeksów, 1 460 szt.' },
          { label: 'Wartość netto', value: '9 312,50 zł' },
          { label: 'Odchylenie cen', value: '+1,2% na 2 pozycjach' },
        ],
        metrics: { amount: 9312.5, deviation: 1.2, flag: false, confidence: 99 },
        result: { doc: 'ZS/11/0486', reply: 'Komunikat ORDRSP wysłany do klienta' },
        advice: 'Zatwierdzić — różnica wynika z aktualizacji cennika z 1.11.',
        manualMinutes: 8,
        agentSeconds: 26,
      },
    ],
  },
  {
    id: 'invoices',
    name: 'Faktury',
    system: 'system księgowy',
    intro: 'Faktury kosztowe z poczty i KSeF. Agent dopasowuje je do zamówień i przyjęć, dekretuje i przekazuje do płatności.',
    rules: [
      {
        kind: 'range',
        key: 'tol',
        label: 'Tolerancja ceny względem zamówienia',
        hint: 'Różnica, przy której faktura przechodzi bez pytania.',
        min: 0,
        max: 10,
        step: 0.5,
        value: 2,
        unit: '%',
      },
      {
        kind: 'range',
        key: 'limit',
        label: 'Limit kwoty faktury',
        hint: 'Powyżej tej kwoty zatwierdza kierownik działu.',
        min: 1000,
        max: 50000,
        step: 1000,
        value: 20000,
        unit: 'zł',
      },
      {
        kind: 'toggle',
        key: 'flag',
        label: 'Nowi dostawcy wymagają akceptacji',
        hint: 'Pierwsza faktura od dostawcy zawsze trafia do człowieka.',
        value: true,
      },
    ],
    cases: [
      {
        id: 'FV-0915',
        from: 'Trans-Mar',
        subject: 'FV 0915/11 — transport krajowy',
        channel: 'KSeF',
        received: '07:58',
        body: 'Faktura [[0915/11]] za [[transport krajowy, 3 kursy]]. Netto [[4 200,00 zł]], termin [[14 dni]]. Zamówienie [[PO-2231]].',
        fields: [
          { label: 'Dostawca', value: 'Trans-Mar' },
          { label: 'Kwota netto', value: '4 200,00 zł' },
          { label: 'Zamówienie / PZ', value: 'PO-2231 · wykonanie potwierdzone' },
          { label: 'Dekretacja', value: 'MPK 410 · konto 402-01' },
        ],
        metrics: { amount: 4200, deviation: 0, flag: false, confidence: 99 },
        result: { doc: 'KZ/11/0915', reply: 'Faktura przekazana do płatności w terminie' },
        advice: 'Zatwierdzić — zgodna z zamówieniem.',
        manualMinutes: 7,
        agentSeconds: 41,
      },
      {
        id: 'FV-0916',
        from: 'Elektro-Hurt',
        subject: 'FV/11/881 — kable YDY',
        channel: 'PDF',
        received: '08:12',
        body: '[[Kabel YDY 3×2,5 — 500 m]], cena [[12,90 zł/m]], netto [[6 450,00 zł]]. Zamówienie [[PO-2240]], termin [[21 dni]].',
        fields: [
          { label: 'Dostawca', value: 'Elektro-Hurt' },
          { label: 'Kwota netto', value: '6 450,00 zł' },
          { label: 'Cena', value: '12,90 zł/m (zamówienie: 12,40 zł/m)' },
          { label: 'Zamówienie / PZ', value: 'PO-2240 · PZ 500 m' },
        ],
        metrics: { amount: 6450, deviation: 4.0, flag: false, confidence: 97 },
        result: { doc: 'KZ/11/0916', reply: 'Faktura przekazana do płatności w terminie' },
        advice: 'Odesłać do dostawcy z prośbą o korektę 250,00 zł — brak aneksu do zamówienia.',
        manualMinutes: 10,
        agentSeconds: 49,
      },
      {
        id: 'FV-0917',
        from: 'Papirus Biuro',
        subject: 'Faktura za materiały biurowe',
        channel: 'E-mail',
        received: '08:40',
        body: 'Faktura [[2291/B]] — [[papier A4, tonery]]. Netto [[318,40 zł]], płatność [[7 dni]].',
        fields: [
          { label: 'Dostawca', value: 'Papirus Biuro' },
          { label: 'Kwota netto', value: '318,40 zł' },
          { label: 'Zamówienie / PZ', value: 'nie wymagane (kategoria do 500 zł)' },
          { label: 'Dekretacja', value: 'MPK 100 · konto 401-03' },
        ],
        metrics: { amount: 318.4, deviation: 0, flag: false, confidence: 98 },
        result: { doc: 'KZ/11/0917', reply: 'Faktura przekazana do płatności w terminie' },
        advice: 'Zatwierdzić — kategoria rozliczana bez zamówienia.',
        manualMinutes: 5,
        agentSeconds: 27,
      },
      {
        id: 'FV-0918',
        from: 'Stal-Kon',
        subject: 'Pierwsza faktura — profile stalowe',
        channel: 'KSeF',
        received: '09:05',
        body: 'Faktura [[114/11]] za [[profile stalowe 80×40, 2,4 t]]. Netto [[28 900,00 zł]], termin [[30 dni]]. Zamówienie [[PO-2255]].',
        fields: [
          { label: 'Dostawca', value: 'Stal-Kon (nowy)' },
          { label: 'Kwota netto', value: '28 900,00 zł' },
          { label: 'Zamówienie / PZ', value: 'PO-2255 · PZ 2,4 t' },
          { label: 'Rachunek', value: 'zgodny z białą listą' },
        ],
        metrics: { amount: 28900, deviation: 0, flag: true, confidence: 96 },
        result: { doc: 'KZ/11/0918', reply: 'Faktura przekazana do płatności w terminie' },
        advice: 'Zatwierdzić po weryfikacji danych dostawcy — dokumenty są zgodne.',
        manualMinutes: 14,
        agentSeconds: 55,
      },
      {
        id: 'FV-0919',
        from: 'Trans-Mar',
        subject: 'FV 0915/11 — ponowna wysyłka',
        channel: 'E-mail',
        received: '09:31',
        body: 'W załączeniu faktura [[0915/11]] za [[transport krajowy]]. Netto [[4 200,00 zł]]. Prosimy o [[potwierdzenie otrzymania]].',
        fields: [
          { label: 'Dostawca', value: 'Trans-Mar' },
          { label: 'Kwota netto', value: '4 200,00 zł' },
          { label: 'Numer', value: '0915/11 (istnieje w księgach)' },
          { label: 'Źródło pierwotne', value: 'KSeF, dziś 07:58' },
        ],
        metrics: { amount: 4200, deviation: 0, flag: false, confidence: 99 },
        hard: {
          status: 'rejected',
          check: 'Unikalność dokumentu',
          reason: 'Duplikat: faktura 0915/11 została już zaksięgowana dziś o 07:58.',
          action: 'Agent oznaczył dokument jako duplikat i potwierdził dostawcy otrzymanie oryginału. Nic nie trafiło do płatności.',
        },
        result: { doc: '', reply: '' },
        advice: '',
        manualMinutes: 6,
        agentSeconds: 22,
      },
      {
        id: 'FV-0920',
        from: 'Chem-Pol',
        subject: 'FV 4410 — środki czystości',
        channel: 'KSeF',
        received: '10:02',
        body: 'Faktura [[4410]] za [[środki czystości, dostawa kwartalna]]. Netto [[1 980,00 zł]], zamówienie [[PO-2250]], termin [[14 dni]].',
        fields: [
          { label: 'Dostawca', value: 'Chem-Pol' },
          { label: 'Kwota netto', value: '1 980,00 zł' },
          { label: 'Odchylenie ceny', value: '+1,5% (waloryzacja z umowy)' },
          { label: 'Dekretacja', value: 'MPK 220 · konto 401-07' },
        ],
        metrics: { amount: 1980, deviation: 1.5, flag: false, confidence: 98 },
        result: { doc: 'KZ/11/0920', reply: 'Faktura przekazana do płatności w terminie' },
        advice: 'Zatwierdzić — waloryzacja przewidziana w umowie ramowej.',
        manualMinutes: 7,
        agentSeconds: 36,
      },
    ],
  },
  {
    id: 'tickets',
    name: 'Zgłoszenia',
    system: 'helpdesk',
    intro: 'Zgłoszenia klientów z poczty i formularza. Agent klasyfikuje, odpowiada albo przekazuje właściwej osobie.',
    rules: [
      {
        kind: 'range',
        key: 'conf',
        label: 'Minimalna pewność klasyfikacji',
        hint: 'Poniżej tego progu agent nie odpowiada sam.',
        min: 60,
        max: 99,
        step: 1,
        value: 80,
        unit: '%',
      },
      {
        kind: 'range',
        key: 'limit',
        label: 'Limit rekompensaty bez akceptacji',
        hint: 'Korekty i zwroty do tej kwoty agent uznaje według regulaminu.',
        min: 0,
        max: 1000,
        step: 50,
        value: 300,
        unit: 'zł',
      },
      {
        kind: 'toggle',
        key: 'flag',
        label: 'Klienci z umową SLA zawsze do człowieka',
        hint: 'Agent przygotowuje sprawę, decyzję podejmuje serwis.',
        value: true,
      },
    ],
    cases: [
      {
        id: 'ZGL-7701',
        from: 'Sklep Ogrodnik',
        subject: 'Kiedy dotrze zamówienie 0471?',
        channel: 'E-mail',
        received: '08:03',
        body: 'Dzień dobry, zamówienie [[0471]] miało być [[we wtorek]]. Gdzie jest [[przesyłka]]?',
        fields: [
          { label: 'Klient', value: 'Sklep Ogrodnik' },
          { label: 'Kategoria', value: 'Status przesyłki' },
          { label: 'Dokument', value: 'ZS/11/0471 · list przewozowy znaleziony' },
          { label: 'Status u przewoźnika', value: 'w doręczeniu, dziś do 16:00' },
        ],
        metrics: { amount: 0, deviation: 0, flag: false, confidence: 97 },
        result: { doc: 'ZGL-7701 zamknięte', reply: 'Odpowiedź ze statusem i linkiem do śledzenia wysłana' },
        advice: 'Odpowiedzieć statusem przesyłki.',
        manualMinutes: 4,
        agentSeconds: 24,
      },
      {
        id: 'ZGL-7702',
        from: 'Instal-Tech',
        subject: 'Uszkodzona paleta w dostawie',
        channel: 'Formularz',
        received: '08:26',
        body: 'W dostawie [[WZ 4398]] jedna paleta uszkodzona — [[6 worków rozerwanych]]. [[Zdjęcia w załączniku]]. Proszę o [[korektę]].',
        fields: [
          { label: 'Klient', value: 'Instal-Tech' },
          { label: 'Kategoria', value: 'Reklamacja — uszkodzenie w transporcie' },
          { label: 'Dowody', value: '4 zdjęcia, protokół przewoźnika' },
          { label: 'Wartość korekty', value: '186,00 zł' },
        ],
        metrics: { amount: 186, deviation: 0, flag: false, confidence: 93 },
        result: { doc: 'KOR/11/0092', reply: 'Informacja o uznaniu reklamacji i korekcie wysłana' },
        advice: 'Uznać — komplet dowodów, kwota w limicie regulaminu.',
        manualMinutes: 11,
        agentSeconds: 58,
      },
      {
        id: 'ZGL-7703',
        from: 'Zakład Mechaniczny Orzeł',
        subject: 'Linia stoi — brak części',
        channel: 'E-mail',
        received: '08:44',
        body: 'Od rana [[stoi linia nr 2]]. Potrzebujemy [[paska HTD 1200]] [[natychmiast]]. Kto może przyjechać?',
        fields: [
          { label: 'Klient', value: 'Zakład Mechaniczny Orzeł (umowa SLA 2 h)' },
          { label: 'Kategoria', value: 'Awaria — przestój' },
          { label: 'Część', value: 'PAS-HTD-1200 · 3 szt. na stanie' },
          { label: 'Najbliższy serwisant', value: 'dostępny od 10:30' },
        ],
        metrics: { amount: 0, deviation: 0, flag: true, confidence: 95 },
        result: { doc: 'SRW/11/0031', reply: 'Potwierdzenie przyjazdu serwisu wysłane do klienta' },
        advice: 'Wysłać serwisanta na 10:30 z paskiem ze stanu — mieści się w SLA.',
        manualMinutes: 9,
        agentSeconds: 33,
      },
      {
        id: 'ZGL-7704',
        from: 'Budmax',
        subject: 'Zwrot 3 szt. — zły wymiar',
        channel: 'Formularz',
        received: '09:10',
        body: 'Chcę zwrócić [[3 szt.]] [[zawór DN32]] — [[zły wymiar]]. Jak to zrobić?',
        fields: [
          { label: 'Klient', value: 'Budmax' },
          { label: 'Kategoria', value: 'Zwrot towaru' },
          { label: 'Towar', value: 'ZAW-DN32 × 3' },
          { label: 'Dokument sprzedaży', value: 'brak w zgłoszeniu' },
        ],
        metrics: { amount: 0, deviation: 0, flag: false, confidence: 91 },
        hard: {
          status: 'returned',
          check: 'Komplet danych',
          reason: 'Brakuje numeru dokumentu sprzedaży — bez niego nie da się sprawdzić terminu zwrotu.',
          action: 'Agent odpisał z prośbą o numer faktury lub WZ i dołączył instrukcję zwrotu. Sprawa wróci do kolejki po odpowiedzi.',
        },
        result: { doc: '', reply: '' },
        advice: '',
        manualMinutes: 5,
        agentSeconds: 21,
      },
      {
        id: 'ZGL-7705',
        from: 'Tynk-Bud',
        subject: 'Reklamacja jakości — partia L-2291',
        channel: 'E-mail',
        received: '09:38',
        body: 'Partia [[L-2291]] kleju [[nie wiąże zgodnie z kartą techniczną]]. Żądamy [[zwrotu całej dostawy]] i [[pokrycia kosztów robocizny]].',
        fields: [
          { label: 'Klient', value: 'Tynk-Bud' },
          { label: 'Kategoria', value: 'Reklamacja jakościowa (lub doradztwo techniczne)' },
          { label: 'Partia', value: 'L-2291 · 2 inne zgłoszenia w tym tygodniu' },
          { label: 'Roszczenie', value: '4 300,00 zł + robocizna' },
        ],
        metrics: { amount: 4300, deviation: 0, flag: false, confidence: 71 },
        result: { doc: 'REK/11/0017', reply: 'Potwierdzenie przyjęcia reklamacji i termin oględzin wysłane' },
        advice: 'Przekazać do działu jakości — trzecie zgłoszenie tej partii w tygodniu.',
        manualMinutes: 15,
        agentSeconds: 44,
      },
      {
        id: 'ZGL-7706',
        from: 'Hydro-Serwis',
        subject: 'Prośba o duplikat faktury',
        channel: 'E-mail',
        received: '10:01',
        body: 'Proszę o [[duplikat faktury]] [[FV 0388/10]] na adres [[księgowości]].',
        fields: [
          { label: 'Klient', value: 'Hydro-Serwis' },
          { label: 'Kategoria', value: 'Dokumenty' },
          { label: 'Dokument', value: 'FV 0388/10 · znaleziona w archiwum' },
          { label: 'Adresat', value: 'adres księgowości z kartoteki' },
        ],
        metrics: { amount: 0, deviation: 0, flag: false, confidence: 99 },
        result: { doc: 'ZGL-7706 zamknięte', reply: 'Duplikat wysłany na adres z kartoteki klienta' },
        advice: 'Wysłać duplikat.',
        manualMinutes: 4,
        agentSeconds: 18,
      },
    ],
  },
];
