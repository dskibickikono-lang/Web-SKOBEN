# SKOBEN — strona B2B

Strona firmowa SKOBEN: wdrożenia agentów AI i automatyzacja przepływów pracy.
Statyczny HTML generowany przez [Astro](https://astro.build), TypeScript w trybie `strictest`,
bez frameworka w przeglądarce. Scena hero to wygenerowany film przewijany scrollem z żywą konsolą przypiętą
do ekranu laptopa; grafiki w sekcjach, fragmenty interfejsu, winiety i diagramy to SVG, HTML i CSS. Kierunek artystyczny, zestawienia ze wzorcem i nagrania:
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
  components/             Hero (film + konsola na ekranie laptopa), Art (grafiki w pętli), fragmenty interfejsu, sekcje
  data/hero-track.json    narożniki ekranu laptopa w kolejnych klatkach filmu (ze scripts/track-screen.py)
  scripts/sandbox/        sandbox: dane (data), silnik reguł (engine), szablony (view), kontroler (ui),
                          konsola sterowana zaskryptowanym kursorem — zbliżenie w hero (film)
  pages/                  /, /agenci/, /automatyzacje/, /sandbox/, /wdrozenie/,
                          /bezpieczenstwo/, /kontakt/, /polityka-prywatnosci/, 404, robots.txt
public/media/             film hero (MP4, 3 warianty), kadry (WebP)
assets-src/               źródła mediów — w repozytorium tylko SOURCES.md (modele, prompty, koszty)
docs/art-direction*       moodboard, storyboard, studium wzorca, zestawienia, nagrania scrolla
scripts/audit.cjs         audyt wizualny/UX
scripts/track-screen.py   śledzenie ekranu laptopa w klatkach filmu hero (Python + numpy + Pillow)
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

Stan na 2026-11-15: dane firmy są uzupełnione, a właściciel potwierdził treści iteracji 3 (w tym deklarację
„Wdrażamy równolegle tylko kilka firm”, dwie „zasady” na stronie głównej i zamienniki referencji) —
`confirmedByOwner: true`, bramka przechodzi. Kierunek wizualny iteracji 3 nie został odebrany (karta zadania).
Bramka jest krokiem przed wdrożeniem, nie częścią CI.

Build i audyt nie zależą od bramki — strona buduje się i działa także przed jej przejściem.

Formularz kontaktowy bez ustawionego `formEndpoint` otwiera przygotowaną wiadomość w programie
pocztowym użytkownika; po ustawieniu endpointu wysyła JSON metodą POST (polityka prywatności
dopasowuje opis automatycznie).

## Prywatność

Strona nie ustawia cookies, nie zapisuje nic w `localStorage` i nie pobiera zasobów z zewnętrznych
serwerów — audyt sprawdza to na każdej stronie. Adres e-mail z formularza w hero przechodzi do
formularza kontaktowego przez `sessionStorage` (nie w adresie URL) i jest stamtąd od razu usuwany.

## Wyniki pomiarów (build lokalny, Linux, 2026-11-15, iteracja 4)

- `astro check`: 0 błędów, 0 ostrzeżeń, 0 wskazówek.
- `npm run audit`: 9 stron × 3 szerokości bez zastrzeżeń.
- Lighthouse (mobile): Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 0,9–1,1 s,
  TBT ≤ 30 ms, CLS 0.
- Waga: JS + CSS łącznie ok. 146 kB bez kompresji dla całego serwisu; kadr hero 36–56 kB (WebP);
  film hero 2,7 MB (720p), 4,7 MB (1080p, ekrany ≥ 1100 px) albo 3,3 MB (pionowy) — pobierany po kadrze.
- Scroll hero (headless, render programowy bez GPU): telefon 58 kl./s, desktop 38–42 kl./s przy medianie
  klatki 16,7 ms; koszt wątku głównego ok. 1,4 ms na klatkę.

## Media

Kadry i film hero zostały wygenerowane na koncie właściciela (Higgsfield: Ideogram 4.0 — kadry,
Kling 3.0 Pro — film). Modele, prompty i koszty: `assets-src/**/SOURCES.md`. Pliki źródłowe (PNG, MP4)
nie są w repozytorium — są w `assets-src/` lokalnie, a w `public/media/` leżą wersje produkcyjne.
Film jest kodowany jako H.264 z samymi klatkami kluczowymi, żeby przewijanie mogło ustawiać dowolną klatkę.
Grafiki w sekcjach nie są plikami — rysuje je `src/components/Art.astro` (SVG + CSS).

## Typografia

Krój Inter z osią rozmiaru optycznego (odmiana display w nagłówkach, text w treści) i IBM Plex Mono
(tylko w interfejsie produktu) są hostowane lokalnie (pakiety `@fontsource`, licencja SIL OFL).
Po buildzie integracja `skoben:polish-typography` wstawia twarde spacje po jednoliterowych
spójnikach i przyimkach, nie pozwala myślnikowi zaczynać wiersza i chroni „e-mail” przed złamaniem.
