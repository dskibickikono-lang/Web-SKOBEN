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
npm run check:release  # bramka publikacji: komplet i potwierdzenie danych firmy
```

Wymagany Node ≥ 20. Audyt korzysta z pakietu `playwright` z przeglądarką Chromium — nie jest on
zależnością projektu (lokalnie: `npm i --no-save playwright && npx playwright install chromium`).

## Struktura

```
src/
  config/company.json     dane zależne od decyzji właściciela (domena, adres, dane rejestrowe)
  config/site.ts          treści wspólne, deklaracje czasu, nawigacja
  styles/global.css       tokeny, motywy (jasny/ciemny), typografia, prymitywy
  layouts/Base.astro      <head>, SEO, nagłówek, stopka
  components/             sekcje i makiety interfejsu (HTML/CSS/SVG)
  scripts/ridge.ts        krajobraz w hero (Canvas 2D)
  scripts/hero-case.ts    animowana karta sprawy w hero
  scripts/sandbox/        sandbox: dane (data), silnik reguł (engine), szablony (view), kontroler (ui)
  pages/                  /, /agenci/, /automatyzacje/, /sandbox/, /wdrozenie/,
                          /bezpieczenstwo/, /kontakt/, /polityka-prywatnosci/, 404, robots.txt
scripts/audit.cjs         audyt wizualny/UX
kono-state/tasks/         karta zadania
```

## Sandbox

`/sandbox/` to klikalna symulacja konsoli operacyjnej. Trzy scenariusze (zamówienia, faktury,
zgłoszenia) po sześć spraw. Agent przechodzi przez odczyt, ekstrakcję, walidację, decyzję i zapis;
wyjątki trafiają do użytkownika, a zmiana progów w zakładce „Reguły” na żywo zmienia podział pracy
i potrafi domknąć sprawy czekające na decyzję. Logika oceny (`engine.ts`) i szablony HTML (`view.ts`)
są oddzielone od DOM — stan początkowy konsoli renderuje się w czasie builda tymi samymi funkcjami,
których używa przeglądarka, więc strona nie „skacze” po załadowaniu skryptów.

Wszystkie firmy, dokumenty i kwoty w sandboxie oraz w makietach są fikcyjne.

## Co sprawdza audyt

Każda strona w trzech szerokościach (1440 / 834 / 390 px): błędy konsoli i sieci, poziome
przewijanie, elementy poza ekranem, struktura nagłówków, martwe linki, zasoby zewnętrzne i pliki
graficzne (ma ich nie być), cele dotyku, dostępność (axe-core, WCAG 2.1 AA), a do tego pełny
scenariusz sandboxa, formularze, menu mobilne, `prefers-reduced-motion` i praca bez JavaScriptu.
Zrzuty ekranu trafiają do `audit-output/`.

## Przed publikacją — bramka `npm run check:release`

Wszystko, co zależy od decyzji właściciela, jest w jednym pliku: `src/config/company.json`
(czytają go `site.ts`, `astro.config.mjs`, `robots.txt` i polityka prywatności). Bramka
`npm run check:release` kończy się błędem, jeśli brakuje któregoś z pól:

- `url` i `contactEmail` — domena produkcyjna i adres do zapytań,
- `legal.entity`, `legal.nip`, `legal.address` — dane administratora do stopki i polityki prywatności,
- `confirmedByOwner: true` — akceptacja deklaracji w treściach: czasy etapów (`facts` w `site.ts`),
  model rozliczeń („Wdrożenie”), zasady przetwarzania danych („Bezpieczeństwo”) i polityka prywatności.

Stan na 2026-11-14: wszystkie pola uzupełnione i potwierdzone przez właściciela — bramka przechodzi.
Po zmianie którejkolwiek deklaracji w treściach potwierdzenie trzeba ponowić.

Build i audyt nie zależą od bramki — strona buduje się i działa także przed jej przejściem.

Formularz kontaktowy bez ustawionego `formEndpoint` otwiera przygotowaną wiadomość w programie
pocztowym użytkownika; po ustawieniu endpointu wysyła JSON metodą POST (polityka prywatności
dopasowuje opis automatycznie).

## Prywatność

Strona nie ustawia cookies, nie zapisuje nic w `localStorage` i nie pobiera zasobów z zewnętrznych
serwerów — audyt sprawdza to na każdej stronie. Adres e-mail z formularza w hero przechodzi do
formularza kontaktowego przez `sessionStorage` (nie w adresie URL) i jest stamtąd od razu usuwany.

## Wyniki pomiarów (build lokalny, Linux)

- `astro check`: 0 błędów, 0 ostrzeżeń, 0 wskazówek.
- `npm run audit`: 9 stron × 3 szerokości bez zastrzeżeń.
- GitHub Actions: workflow `CI` (build + audyt) zakończony sukcesem na gałęzi roboczej.
- Lighthouse (mobile, 5 stron): Performance 100, Accessibility 100, Best Practices 100, SEO 100;
  LCP 0,8–1,1 s, CLS 0.
- Waga: JS + CSS łącznie ok. 112 kB bez kompresji dla całego serwisu.

## Typografia

Kroje Hanken Grotesk i Geist Mono są hostowane lokalnie (pakiety `@fontsource-variable`).
Po buildzie integracja `skoben:polish-typography` wstawia twarde spacje po jednoliterowych
spójnikach i przyimkach, nie pozwala myślnikowi zaczynać wiersza i chroni „e-mail” przed złamaniem.
