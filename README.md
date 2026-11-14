# SKOBEN — strona B2B

Strona firmowa SKOBEN: wdrożenia agentów AI i automatyzacja przepływów pracy.
Statyczny HTML generowany przez [Astro](https://astro.build), TypeScript w trybie `strictest`,
bez frameworka w przeglądarce i bez plików graficznych — cała warstwa wizualna to SVG, CSS i Canvas.

## Uruchomienie

```bash
npm install
npm run dev        # serwer deweloperski
npm run build      # astro check (typy) + build do dist/
npm run preview    # podgląd zbudowanej strony
npm run audit      # audyt w headless Chromium (wymaga wcześniejszego build)
```

Wymagany Node ≥ 20. Audyt korzysta z pakietu `playwright` z przeglądarką Chromium — nie jest on
zależnością projektu (lokalnie: `npm i --no-save playwright && npx playwright install chromium`).

## Struktura

```
src/
  config/site.ts          dane firmy, deklaracje czasu, nawigacja — jedno źródło prawdy
  styles/global.css       tokeny, motywy (jasny/ciemny), typografia, prymitywy
  layouts/Base.astro      <head>, SEO, nagłówek, stopka
  components/             sekcje i makiety interfejsu (HTML/CSS/SVG)
  scripts/ridge.ts        krajobraz w hero (Canvas 2D)
  scripts/hero-case.ts    animowana karta sprawy w hero
  scripts/sandbox/        sandbox: dane scenariuszy, silnik reguł, kontroler UI
  pages/                  /, /agenci/, /automatyzacje/, /sandbox/, /wdrozenie/,
                          /bezpieczenstwo/, /kontakt/, 404
scripts/audit.cjs         audyt wizualny/UX
kono-state/tasks/         karta zadania
```

## Sandbox

`/sandbox/` to klikalna symulacja konsoli operacyjnej. Trzy scenariusze (zamówienia, faktury,
zgłoszenia) po sześć spraw. Agent przechodzi przez odczyt, ekstrakcję, walidację, decyzję i zapis;
wyjątki trafiają do użytkownika, a zmiana progów w zakładce „Reguły” na żywo zmienia podział pracy
i potrafi domknąć sprawy czekające na decyzję. Logika oceny (`engine.ts`) jest oddzielona od DOM.

Wszystkie firmy, dokumenty i kwoty w sandboxie oraz w makietach są fikcyjne.

## Co sprawdza audyt

Każda strona w trzech szerokościach (1440 / 834 / 390 px): błędy konsoli i sieci, poziome
przewijanie, elementy poza ekranem, struktura nagłówków, martwe linki, zasoby zewnętrzne i pliki
graficzne (ma ich nie być), cele dotyku, dostępność (axe-core, WCAG 2.1 AA), a do tego pełny
scenariusz sandboxa, formularze, menu mobilne, `prefers-reduced-motion` i praca bez JavaScriptu.
Zrzuty ekranu trafiają do `audit-output/`.

## Przed publikacją — do potwierdzenia przez właściciela

Wartości przyjęte roboczo, zebrane w `src/config/site.ts` i `astro.config.mjs`:

- domena produkcyjna (`https://skoben.pl`) — wpływa na canonical, sitemap i `public/robots.txt`,
- adres kontaktowy (`kontakt@skoben.pl`),
- dane rejestrowe spółki (puste — stopka ich nie renderuje),
- deklaracje czasu: rozmowa 30 minut, mapowanie 1–2 tygodnie, pilot 4–6 tygodni, odpowiedź w 1 dzień roboczy,
- deklaracje ze strony „Bezpieczeństwo” (miejsce przetwarzania, trenowanie modeli, umowa powierzenia)
  oraz model rozliczeń ze strony „Wdrożenie”.

Formularz kontaktowy bez ustawionego `formEndpoint` otwiera przygotowaną wiadomość w programie
pocztowym użytkownika. Strona nie zawiera jeszcze polityki prywatności — wymaga danych spółki.

## Typografia

Kroje Hanken Grotesk i Geist Mono są hostowane lokalnie (pakiety `@fontsource-variable`).
Po buildzie integracja `skoben:polish-typography` wstawia twarde spacje po jednoliterowych
spójnikach i przyimkach, żeby nie zostawały na końcu wiersza.
