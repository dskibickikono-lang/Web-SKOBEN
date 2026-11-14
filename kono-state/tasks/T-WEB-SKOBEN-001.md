---
id: T-WEB-SKOBEN-001
title: Strona B2B SKOBEN — agenci AI i automatyzacja workflow
channel: pm-local
requested_by: owner
status: in-review
branch: skibiai/sharp-hamilton-he3v81
pr: brak — repozytorium nie ma gałęzi bazowej (patrz „Stan PR”)
sha: aebf9a2 (kod) + commit aktualizujący tę kartę
created: 2026-11-14
---

# T-WEB-SKOBEN-001 — Strona B2B SKOBEN

## Cel
Kompletna, produkcyjna strona B2B dla SKOBEN (wdrożenia agentów AI, automatyzacja workflow),
benchmark jakości: mercury.com. Treści po polsku, interaktywny sandbox produktu, wizualizacje
wyłącznie z kodu (SVG/CSS/Canvas), bez zewnętrznych plików graficznych.

## Uwagi do reguł pracy
- Identyfikator karty nadany lokalnie — w tym repozytorium nie było wcześniej katalogu `kono-state/`
  ani `decisions/REJESTR_DECYZJI_BIZNESOWYCH.md`, więc nie było zapisanych decyzji do zastosowania.
- Zgoda na wykonanie: polecenie `/goal` właściciela (praca autonomiczna na gałęzi roboczej).
- Bez wdrożeń, bez SSH, bez zmian na hostach. Merge wyłącznie po stronie właściciela.

## Zakres
- Astro (statyczny HTML) + TypeScript `strictest`, zero frameworka w runtime.
- Strony: `/`, `/agenci/`, `/automatyzacje/`, `/sandbox/`, `/wdrozenie/`, `/bezpieczenstwo/`, `/kontakt/`, 404.
- Sandbox: 3 scenariusze × 6 spraw, silnik reguł, akceptacja wyjątków, dziennik, metryki.
- Audyt: `scripts/audit.cjs` (headless Chromium + axe-core).

## Do decyzji właściciela przed publikacją
- Domena produkcyjna i adres kontaktowy (`src/config/site.ts`, `astro.config.mjs`, `public/robots.txt`).
- Dane rejestrowe spółki i polityka prywatności.
- Deklaracje handlowe: czasy etapów, model rozliczeń, zapisy ze strony „Bezpieczeństwo”.
- Endpoint formularza kontaktowego (obecnie: wiadomość w programie pocztowym użytkownika).

## Wynik testów
Przebieg lokalny w kontenerze Linux (Node 22.23, Chromium 1243), 2026-11-14:

- `npm run build` (`astro check` + `astro build`): 0 błędów, 0 ostrzeżeń, 0 wskazówek; 8 stron.
- `npm run audit`: bez zastrzeżeń — 8 stron × 3 szerokości (1440 / 834 / 390 px), 7 linków
  wewnętrznych, scenariusz sandboxa na desktopie i mobile (3 scenariusze, akceptacja, odrzucenie,
  zmiana reguł, reset, klawiatura), formularze, menu mobilne, `prefers-reduced-motion`, praca bez JS,
  axe-core (WCAG 2.1 AA) bez naruszeń.
- Lighthouse (mobile) dla `/`, `/sandbox/`, `/automatyzacje/`, `/wdrozenie/`, `/bezpieczenstwo/`:
  Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 0,8–1,1 s; CLS 0.
- Projekt nie zawiera testów pytest — repozytorium to statyczna strona bez kodu Pythona.
- Workflow `.github/workflows/ci.yml` (build + audyt) nie był jeszcze uruchomiony na GitHub Actions.

## Stan PR
Repozytorium zdalne było puste, więc gałąź robocza `skibiai/sharp-hamilton-he3v81` jest w nim jedyną
gałęzią i nie ma bazy, do której można otworzyć pull request. Utworzenie gałęzi bazowej (np. `main`)
wymaga decyzji właściciela — bez niej PR nie powstał.
