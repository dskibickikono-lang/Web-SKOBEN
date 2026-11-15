# SKOBEN — strona B2B

Strona firmowa SKOBEN: wdrożenia agentów AI i automatyzacja przepływów pracy.
Statyczny HTML generowany przez [Astro](https://astro.build), TypeScript w trybie `strictest`,
bez frameworka w przeglądarce. Scena hero to wygenerowany film przewijany scrollem; fragmenty interfejsu,
winiety i diagramy to HTML, CSS i SVG. Kierunek artystyczny, zestawienia ze wzorcem i nagrania:
[`docs/art-direction.md`](docs/art-direction.md).

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
  styles/global.css       tokeny, trzy motywy (atrament / ciepła biel / chłodna biel), typografia, prymitywy
  layouts/Base.astro      <head>, SEO, nagłówek, stopka, przenikanie motywu strony z rozdziałem
  components/             Hero (film + zbliżenie na konsolę), fragmenty interfejsu, kafle, sekcje
  scripts/sandbox/        sandbox: dane (data), silnik reguł (engine), szablony (view), kontroler (ui),
                          konsola sterowana zaskryptowanym kursorem — zbliżenie w hero (film)
  pages/                  /, /agenci/, /automatyzacje/, /sandbox/, /wdrozenie/,
                          /bezpieczenstwo/, /kontakt/, /polityka-prywatnosci/, 404, robots.txt
public/media/             film hero (MP4, 3 warianty), kadry (WebP)
assets-src/               źródła mediów — w repozytorium tylko SOURCES.md (modele, prompty, koszty)
docs/art-direction*       moodboard, storyboard, studium wzorca, zestawienia, nagrania scrolla
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
przewijanie, elementy poza ekranem, struktura nagłówków, martwe linki, zasoby zewnętrzne (ma ich
nie być), obrazy bez wymiarów lub bez leniwego ładowania, cookies i zapisy w przeglądarce, dostępność
(axe-core, WCAG 2.1 AA), precyzja układu (piony siatki, skala i grubości pisma, cele dotyku ≥ 40 px),
liczba konsol na stronie (tylko hero i `/sandbox/`). Do tego: scena hero (scroll przewija film, ekran
monitora rośnie do konsoli, podpis), trzy motywy rozdziałów, panel „Produkt”, pełny scenariusz
sandboxa, formularze, menu mobilne, `prefers-reduced-motion` (statyczny kadr, film niepobierany),
praca bez JavaScriptu oraz budżet wagi JS/CSS i mediów hero.
Zrzuty ekranu trafiają do `audit-output/`.

## Przed publikacją — bramka `npm run check:release`

Wszystko, co zależy od decyzji właściciela, jest w jednym pliku: `src/config/company.json`
(czytają go `site.ts`, `astro.config.mjs`, `robots.txt` i polityka prywatności). Bramka
`npm run check:release` kończy się błędem, jeśli brakuje któregoś z pól:

- `url` i `contactEmail` — domena produkcyjna i adres do zapytań,
- `legal.entity`, `legal.nip`, `legal.address` — dane administratora do stopki i polityki prywatności,
- `confirmedByOwner: true` — akceptacja deklaracji w treściach: czasy etapów (`facts` w `site.ts`),
  model rozliczeń („Wdrożenie”), zasady przetwarzania danych („Bezpieczeństwo”) i polityka prywatności.

Stan na 2026-11-15: dane firmy są uzupełnione, deklaracja „Wdrażamy równolegle tylko kilka firm” jest
potwierdzona. Iteracja 3 dodała nowe treści (dwie „zasady” na stronie głównej, panel „Produkt”) —
`confirmedByOwner` zostaje `false` do czasu odbioru treści przez właściciela.
Bramka jest krokiem przed wdrożeniem, nie częścią CI.

Build i audyt nie zależą od bramki — strona buduje się i działa także przed jej przejściem.

Formularz kontaktowy bez ustawionego `formEndpoint` otwiera przygotowaną wiadomość w programie
pocztowym użytkownika; po ustawieniu endpointu wysyła JSON metodą POST (polityka prywatności
dopasowuje opis automatycznie).

## Prywatność

Strona nie ustawia cookies, nie zapisuje nic w `localStorage` i nie pobiera zasobów z zewnętrznych
serwerów — audyt sprawdza to na każdej stronie. Adres e-mail z formularza w hero przechodzi do
formularza kontaktowego przez `sessionStorage` (nie w adresie URL) i jest stamtąd od razu usuwany.

## Wyniki pomiarów (build lokalny, Linux, 2026-11-15)

- `astro check`: 0 błędów, 0 ostrzeżeń, 0 wskazówek.
- `npm run audit`: 9 stron × 3 szerokości bez zastrzeżeń.
- Lighthouse (mobile, 7 stron): Performance 100, Accessibility 100, Best Practices 100, SEO 100;
  LCP 0,8–1,5 s, TBT 0 ms, CLS ≤ 0,001.
- Waga: JS + CSS łącznie ok. 138 kB bez kompresji dla całego serwisu; kadr hero 20–24 kB (WebP);
  film hero 2,0 MB (720p), 4,5 MB (1080p, ekrany ≥ 1100 px) albo 2,3 MB (pionowy) — pobierany po kadrze.

## Media

Kadry i film hero zostały wygenerowane na koncie właściciela (Higgsfield: Ideogram 4.0 — kadry,
Kling 3.0 — film). Modele, prompty i koszty: `assets-src/**/SOURCES.md`. Pliki źródłowe (PNG, MP4 4K)
nie są w repozytorium — są w `assets-src/` lokalnie, a w `public/media/` leżą wersje produkcyjne.
Film jest kodowany jako H.264 z samymi klatkami kluczowymi, żeby przewijanie mogło ustawiać dowolną klatkę.

## Typografia

Kroje Wix Madefor Display i Text (nagłówki i tekst), Newsreader (kursywa akcentowa) oraz IBM Plex Mono
(etykiety) są hostowane lokalnie (pakiety `@fontsource`, licencja SIL OFL).
Po buildzie integracja `skoben:polish-typography` wstawia twarde spacje po jednoliterowych
spójnikach i przyimkach, nie pozwala myślnikowi zaczynać wiersza i chroni „e-mail” przed złamaniem.
