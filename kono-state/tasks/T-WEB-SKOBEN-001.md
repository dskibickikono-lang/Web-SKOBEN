---
id: T-WEB-SKOBEN-001
title: Strona B2B SKOBEN — agenci AI i automatyzacja workflow
channel: pm-local
requested_by: owner
status: in-progress
branch: skibiai/sharp-hamilton-he3v81
pr: https://github.com/dskibickikono-lang/Web-SKOBEN/pull/1
sha: patrz PR #1 — ostatni commit kodu „Pomiar precyzji w audycie…”
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

## Bramka publikacji
`npm run check:release` przechodzi: domena, adres kontaktowy, dane administratora i deklaracje są
potwierdzone przez właściciela (plik `src/config/company.json`). Poza bramką zostaje decyzja o hostingu
i wdrożeniu oraz opcjonalny endpoint formularza (domyślnie: wiadomość w programie pocztowym użytkownika).

## Wynik testów
Przebieg lokalny w kontenerze Linux (Node 22.23, Chromium 1243) oraz GitHub Actions, 2026-11-14:

- `npm run build` (`astro check` + `astro build`): 0 błędów, 0 ostrzeżeń, 0 wskazówek; 9 stron + robots.txt.
- `npm run check:release`: przechodzi.
- `npm run audit`: bez zastrzeżeń — 9 stron × 3 szerokości (1440 / 834 / 390 px), 8 linków wewnętrznych,
  axe-core (WCAG 2.1 AA) bez naruszeń, brak cookies / localStorage / zasobów zewnętrznych / plików graficznych,
  scenariusz sandboxa na desktopie i mobile (3 scenariusze, akceptacja, odrzucenie, zmiana reguł, reset,
  klawiatura), formularze, menu mobilne, `prefers-reduced-motion`, praca bez JS.
- GitHub Actions, workflow `CI` (build + audyt + bramka publikacji, ubuntu-latest): sukces na `14c853a`
  w przebiegu dla PR #1 — https://github.com/dskibickikono-lang/Web-SKOBEN/actions/runs/43640589447
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

- (pomiar precyzji) dziesięć grubości pisma sprowadzonych do sześciu; kontrolki dotykowe poniżej 40 px
  powiększone; mniejszy stopień nagłówka na ekranach ≤ 420 px.

### Pomiar precyzji (wpisany do `npm run audit`, pilnowany przez CI)
- Siatka: wszystkie nagłówki h1/h2 stoją na krawędzi kontenera (120 px przy 1440, 20 px przy 390);
  na żadnej stronie nie ma więcej niż dwóch pionów.
- Typografia: 6 grubości pisma (400, 450, 460, 500, 540, 620), najwyżej 14 rozmiarów na stronie,
  skala promieni 2 / 4 / 8 / 12 / 16 / 20 px + pigułka.
- Dotyk: każda kontrolka na ekranie dotykowym ma co najmniej 40 px; linki tekstowe mają powiększony
  obszar dotyku.
- Odniesienie do benchmarku (pomiar mercury.com z tej sesji): nagłówek h1 49 px / grubość 480 / interlinia
  1,1 — SKOBEN 60 px / 460 / 1,06; tekst 16 px — SKOBEN 17 px; ten sam układ „lista + panel produktu”,
  nagłówek zmieniający ton nad sekcjami, przyciski-pigułki.

### Wynik własnego audytu wykonawcy
**Zaliczony.** Po poprawkach nie ma otwartych usterek wizualnych, funkcjonalnych ani dostępnościowych
znanych wykonawcy; każda z powyższych kontroli jest powtarzalna poleceniem `npm run audit`.
Odbiór przez właściciela: zapowiedziany po merge'u (uwagi w kolejnej iteracji).

## Decyzje właściciela z 2026-11-14 (w trakcie sesji)
- Zgoda na utworzenie pustej gałęzi `main` i otwarcie PR z gałęzi roboczej.
- Domena `skoben.pl` i adres `kontakt@skoben.pl` — potwierdzone.
- Dane administratora podane przez właściciela: nazwa „SKOBEN”, NIP i adres siedziby — wpisane do
  `src/config/company.json` (stopka, polityka prywatności).
- Właściciel potwierdził wszystkie deklaracje w treściach (czasy etapów, model rozliczeń, zasady
  przetwarzania danych) i zaakceptował treść polityki prywatności → `confirmedByOwner: true`,
  bramka `npm run check:release` przechodzi.
- Odbiór wizualny: właściciel obejrzy stronę po merge'u; ewentualne uwagi w kolejnej iteracji.
- Merge PR #1: po stronie właściciela.

## Odbiór właściciela z 2026-11-14 — odrzucony, iteracja 2
Właściciel obejrzał stronę i nie zaakceptował jakości („dalekie od tego, o co prosiłem”); merge wstrzymany.
Przysłał trzy nagrania mercury.com z telefonu i wskazał, czego brakuje:
- pierwsze pociągnięcia po ekranie nie przewijają strony, tylko prowadzą kamerę w głąb sceny,
- przy funkcjach lecą zapętlone filmy produktu z kursorem i pauzą,
- jasne kafle z miękkimi, zapętlonymi winietami („prawie każda grafika to film CSS”), cichy luksus,
- typografia i jakość ogólna poniżej wzorca.
Doprecyzował: stosować techniki, nie kopiować laptopa i gór; strona ma sprzedawać ekskluzywny dostęp
do agenckiego, zautomatyzowanego świata.

Zrobione w iteracji 2 (wszystko z kodu, bez plików graficznych):
- hero „brama”: łuk ze znaku SKOBEN jako wejście; przewijanie prowadzi kamerę przez łuk, aż działająca
  konsola wypełni ekran (scena przypięta, transformacje GPU); usunięty krajobraz z linii,
- filmy produktowe (`scripts/sandbox/film.ts`): prawdziwa konsola sterowana zaskryptowanym kursorem —
  cztery filmy przy liście funkcji, automatyczne przejście do kolejnej pozycji, pasek postępu, pauza,
- sekcja kafli-winiet (`Vignettes.astro`) w miejsce schematycznych rysunków SVG,
- skala pisma przestawiona na wartości wzorca (h1 30–50 px, grubość 480, luźniejsze światła),
- przekaz: „Wejdź do świata, w którym praca domyka się sama”, wezwanie „Poproś o dostęp”.
  Nowa deklaracja w treści do potwierdzenia: „Wdrażamy równolegle tylko kilka firm” (strona Kontakt).
- audyt rozszerzony o test najazdu kamery i odtwarzania filmu.

Dopracowanie iteracji 2:
- konsola po najeździe osiada jako kafel z podpisem sekcji (przejście hero → funkcje),
- filmy z kamerą podążającą za kursorem — wycinek konsoli w czytelnej skali,
- filmy na podstronach Agenci, Automatyzacje, Wdrożenie; kafle-winiety na stronie Bezpieczeństwo,
- start filmów odroczony do bezczynności / zbliżenia do ekranu.
- lista funkcji wsuwa się pod podpis osiadłej konsoli (bez pustego pola na telefonie),
- brama: dwa cofnięte łuki i oddychające światło budują głębię,
- podstrony: motyw trzech łuków rozsuwających się z przewijaniem oraz filmy wjeżdżające w kadr
  (CSS scroll-driven animations, bez JS; w przeglądarkach bez wsparcia elementy są statyczne).

Pomiar stanu po iteracji 2 (Linux, lokalnie): `astro check` 0 błędów; `npm run audit` bez zastrzeżeń
(9 stron × 3 szerokości, w tym test najazdu, osiadania i odtwarzania filmu); Lighthouse mobile:
strona główna 99 / 100 / 100 / 100 (LCP 1,1 s, TBT 120 ms, CLS 0), Agenci, Sandbox i Bezpieczeństwo 100 × 4.
Odbiór właściciela dla iteracji 2: oczekuje.

## Stan PR
Gałąź `main` założona jednym pustym commitem i dołączona do gałęzi roboczej zwykłym merge'em
(bez force, bez rebase). PR #1 otwarty do `main`, gotowy do przeglądu. Merge i publikacja po stronie właściciela.
