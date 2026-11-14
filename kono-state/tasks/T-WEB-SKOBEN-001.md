---
id: T-WEB-SKOBEN-001
title: Strona B2B SKOBEN — agenci AI i automatyzacja workflow
channel: pm-local
requested_by: owner
status: in-review
branch: skibiai/sharp-hamilton-he3v81
pr: https://github.com/dskibickikono-lang/Web-SKOBEN/pull/1
sha: a18afb1 (kod) — kolejny commit aktualizuje tylko tę kartę
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
- Strony: `/`, `/agenci/`, `/automatyzacje/`, `/sandbox/`, `/wdrozenie/`, `/bezpieczenstwo/`, `/kontakt/`,
  `/polityka-prywatnosci/`, 404.
- Sandbox: 3 scenariusze × 6 spraw, silnik reguł, akceptacja wyjątków, dziennik, metryki.
- Audyt: `scripts/audit.cjs` (headless Chromium + axe-core).

## Do decyzji właściciela przed publikacją
Zebrane w `src/config/company.json`; pilnuje ich bramka `npm run check:release` (obecnie: nie przechodzi —
czeka na `confirmedByOwner: true`).

- Akceptacja deklaracji: czasy etapów, model rozliczeń, zasady ze strony „Bezpieczeństwo”,
  treść polityki prywatności (projekt do przeglądu prawnego).
- Opcjonalnie endpoint formularza (domyślnie: wiadomość w programie pocztowym użytkownika).

## Wynik testów
Przebieg lokalny w kontenerze Linux (Node 22.23, Chromium 1243) oraz GitHub Actions, 2026-11-14:

- `npm run build` (`astro check` + `astro build`): 0 błędów, 0 ostrzeżeń, 0 wskazówek; 9 stron + robots.txt.
- `npm run audit`: bez zastrzeżeń — 9 stron × 3 szerokości (1440 / 834 / 390 px), 8 linków wewnętrznych,
  axe-core (WCAG 2.1 AA) bez naruszeń, brak cookies / localStorage / zasobów zewnętrznych / plików graficznych,
  scenariusz sandboxa na desktopie i mobile (3 scenariusze, akceptacja, odrzucenie, zmiana reguł, reset,
  klawiatura), formularze, menu mobilne, `prefers-reduced-motion`, praca bez JS.
- GitHub Actions, workflow `CI` (build + audyt na ubuntu-latest): sukces —
  https://github.com/dskibickikono-lang/Web-SKOBEN/actions/runs/43632399815 (kolejne przebiegi przy każdym pushu).
- Lighthouse (mobile) dla `/`, `/sandbox/`, `/automatyzacje/`, `/wdrozenie/`, `/bezpieczenstwo/`:
  Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 0,8–1,1 s; CLS 0.
- Projekt nie zawiera testów pytest — repozytorium to statyczna strona bez kodu Pythona.

## Protokół przeglądu wizualnego/UX (headless Chromium)
Obejrzane zrzuty: każda strona na 1440 px sekcja po sekcji, strona główna także na 1920 px, sandbox i strona
główna na 834 px, wszystkie strony na 390 px; stany interakcji — cztery panele produktu, trzy sceny kontroli,
cztery warstwy bezpieczeństwa, zakładki przepływu, FAQ, kalkulator, błędy i potwierdzenie formularza,
menu mobilne, fokus klawiatury, hover, 404; sandbox — trzy scenariusze, wyjątek, zmiana reguł, odrzucenie.

Usterki znalezione w przeglądzie i usunięte:
- płaski, nieczytelny krajobraz w hero; zbyt gęsty relief na wąskich ekranach,
- jasny nagłówek nad ciemnymi sekcjami (nagłówek przyjmuje teraz ton sekcji pod spodem),
- sygnały diagramu „zaparkowane” w rogu przed startem animacji,
- kontrast etykiet poniżej 4,5:1; brak etykiety regionu przewijanej tabeli; rola `log` na liście,
- treść hero szersza niż ekran 390 px,
- przesunięcie przycisku „Wyślij” po pojawieniu się błędu walidacji (gubione kliknięcie),
- przesunięcie układu sandboxa po załadowaniu JS (CLS 0,40 → 0; konsola prerenderowana w buildzie),
- późne pojawianie się nagłówka (LCP 2,5 s → 1,1 s), ciągła praca Canvas (ograniczenie do 30 kl./s),
- nakładające się podpisy w scenie progów, zbyt ciasne komunikaty błędów formularza,
- tabela porównawcza na mobile pokazywała tylko pierwszą kolumnę (teraz lista z wyróżnionym agentem),
- sierotki, myślniki na początku wiersza i łamanie „e-mail” (reguły typograficzne w buildzie),
- formy rodzajowe w treściach, adres e-mail w parametrze URL.

Po poprawkach: brak otwartych usterek wizualnych ani funkcjonalnych znanych wykonawcy.

## Decyzje właściciela z 2026-11-14 (w trakcie sesji)
- Zgoda na utworzenie pustej gałęzi `main` i otwarcie PR z gałęzi roboczej.
- Domena `skoben.pl` i adres `kontakt@skoben.pl` — potwierdzone.
- Dane administratora podane przez właściciela: nazwa „SKOBEN”, NIP i adres siedziby — wpisane do
  `src/config/company.json` (stopka, polityka prywatności).
- Bramka `npm run check:release` wymaga już tylko `confirmedByOwner: true`, czyli akceptacji deklaracji
  handlowych i treści polityki prywatności.

## Stan PR
Gałąź `main` założona jednym pustym commitem i dołączona do gałęzi roboczej zwykłym merge'em
(bez force, bez rebase). PR #1 otwarty do `main`, gotowy do przeglądu. Merge i publikacja po stronie właściciela.
