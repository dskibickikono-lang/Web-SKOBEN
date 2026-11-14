---
id: T-WEB-SKOBEN-001
title: Strona B2B SKOBEN — agenci AI i automatyzacja workflow
channel: pm-local
requested_by: owner
status: in-review
branch: skibiai/sharp-hamilton-he3v81
pr: (uzupełniane po utworzeniu)
sha: (uzupełniane po pushu)
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
(uzupełniane na koniec)
