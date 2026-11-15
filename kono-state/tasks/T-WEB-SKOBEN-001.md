---
id: T-WEB-SKOBEN-001
title: Strona B2B SKOBEN — agenci AI i automatyzacja workflow
channel: pm-local
requested_by: owner
status: in-progress
branch: skibiai/sharp-hamilton-he3v81
pr: https://github.com/dskibickikono-lang/Web-SKOBEN/pull/1
sha: 349dc94 (ostatni commit kodu iteracji 3; późniejsze commity zmieniają tylko tę kartę)
created: 2026-11-14
---

# T-WEB-SKOBEN-001 — Strona B2B SKOBEN

## Cel
Kompletna, produkcyjna strona B2B dla SKOBEN (wdrożenia agentów AI, automatyzacja workflow),
benchmark jakości: mercury.com. Treści po polsku, interaktywny sandbox produktu.
Założenie „wyłącznie z kodu, bez plików graficznych” obowiązywało w iteracjach 1–2; brief iteracji 3
je zniósł (wygenerowane kadry i film hero). **Aktualny stan i wyniki: sekcja „Iteracja 3 — wykonanie”
na końcu karty.** Sekcje „Wynik testów” i „Protokół przeglądu” niżej opisują iterację 1 (historia).

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

## Odbiór iteracji 2 — odrzucona; brief właściciela na iterację 3 (2026-11-14)
Ocena: „ta sama konsola HTML w różnych skalach — makieta w złotej jaskini, nie Mercury. Problem leży
w założeniach”. Zmiana założeń:

1. **Zniesiony zakaz obrazów, wideo i bibliotek.** Wolno: generatory obrazów/wideo AI, licencjonowane stocki
   (Unsplash/Pexels), Blender/three.js do renderów, ffmpeg, GSAP + ScrollTrigger lub Motion, Lenis, Rive/Lottie.
   Wydajność ma być dobra (lazy-load, AVIF/WebM, poster, prefers-reduced-motion), ale nie jest celem samym w sobie.
2. **Mercury jako system** (zrzuty Playwrightem co ~300 px na 1440 i 390 + nagranie scrolla):
   - hero = pełnoekranowa edytorska scena; scroll steruje wideo (najazd kamery), nagłówek gaśnie i się rozmywa;
     to jedyny duży efekt strony,
   - typografia: variable sans w wariantach display/text (wagi 360/420/480/530) + szeryf akcentowy + mono do drobnicy;
     ciasny tracking nagłówków, dużo światła,
   - paleta: atrament #1c1c23, panele #23232f, prawie biel #f2f2f7–#fbfcfd, szarość #535461, hairline #dddde5,
     JEDEN akcent; rozdziały jasne i ciemne na przemian,
   - produkt jako skomponowana grafika: UI w ramie, ostre, z kontrolowanym glow i ziarnem; różne fragmenty
     produktu w różnych kartach,
   - wiarygodność: marquee logotypów z maską, testimonial na zdjęciu, duże metryki z hairline'ami, karty prasowe,
   - ruch selektywny: scrub w hero, pętle w mediach kart (z pauzą), marquee; subtelny hover; mega-menu 3 kolumny.
3. **Nie kopiować 1:1** (treści, zdjęć, fontów). Równoważna jakość dla SKOBEN:
   - font: para sans display/text + szeryf akcentowy z legalną licencją, prawdziwa skala (display / h1–h4 / body / ui / mono),
   - scena hero: metafora „praca domyka się sama” (np. spokojne biuro o świcie, w którym dokumenty same się
     porządkują, albo minimalistyczne wnętrze z ekranem, na którym kolejka maleje do zera); 2–3 warianty kadru,
     wybór, klip 4–6 s z ruchem kamery do przodu pod scroll (scrub); mobile: osobny pionowy kadr,
   - konsola TYLKO w dwóch miejscach: zbliżenie po najeździe w hero (czytelne) i pełny /sandbox; w sekcjach
     funkcji osobne, wykadrowane fragmenty UI (karta faktury, okno decyzji, wiersz logu) w jasnych panelach,
   - usunąć łuk/portal i złotą poświatę.
4. **Proces:** a) moodboard + storyboard sekcji (zrzut Mercury | plan SKOBEN | assety i ruch) w `docs/art-direction.md`
   z kadrami; b) tokeny w global.css (easing ~600–1000 ms ease-out); c) hero — dopiero gdy na 1440 i 390 wygląda
   premium side-by-side z Mercury, reszta sekcji; d) po każdej sekcji zrzuty w tej samej pozycji scrolla co
   referencja, krytyczna samoocena, poprawka; nagranie scrolla hero.
5. **Kryteria odbioru:** pierwszy ekran jak marka premium, nie dashboard; scrub 60 fps na laptopie, statyczny
   kadr przy prefers-reduced-motion; żaden ekran nie powtarza widoku konsoli; ≥ 2 jasne rozdziały na stronie
   głównej; jedna rodzina sans w 2 wariantach optycznych + szeryf akcentowy, spójna skala; LCP < 2,5 s na 4G,
   axe bez błędów krytycznych. Na koniec: zrzuty porównawcze Mercury vs SKOBEN (hero, funkcje, social proof)
   i link do nagrania scrolla.

Dodatkowo właściciel potwierdził deklarację „Wdrażamy równolegle tylko kilka firm”.

## Iteracja 3 — wykonanie (2026-11-14/15)

Status: **do odbioru przez właściciela**. Merge i wdrożenie po stronie właściciela.

Zrobione według procesu z briefu:
- a) `docs/art-direction.md`: moodboard, typografia, paleta, wybór kadru, storyboard 12 sekcji
  (zrzut wzorca | plan SKOBEN | zasoby i ruch); studium wzorca `docs/art-direction/mercury-study.md`
  + 91 zrzutów referencyjnych (1440 i 390) i nagrania scrolla wzorca.
- b) tokeny w `src/styles/global.css`: trzy motywy (atrament / ciepła biel / chłodna biel) przenikające
  razem z rozdziałem, jeden akcent (wirydian), Wix Madefor Display + Text, Newsreader (kursywa akcentowa),
  IBM Plex Mono; skala display / h2 / title / statement / lede / body / ui / mono; ruch 200–670 ms ease-out.
- c) hero: wygenerowana scena biura o błękitnej godzinie (kadr poziomy i osobny pionowy), film 5 s z najazdem
  kamery przewijany scrollem, ekran monitora rośnie do czytelnej, żywej konsoli; statyczny kadr przy
  `prefers-reduced-motion` i bez JS. Usunięte: łuk/portal, złota poświata.
- d) strona główna od nowa: fragmenty interfejsu (4 różne) przy liście funkcji, taśma + zasada na kadrze,
  jasne kafle 2×2 z pętlami i pauzą, cytat-zasada, dwa akordeony z kadrem, liczby, kafle kontroli,
  karty „dalej”, końcowe wezwanie. Konsola tylko w hero i na `/sandbox/`.
- panel „Produkt” (mega-menu 3 kolumny, cienkie linie), pigułka pod wskaźnikiem w nawigacji.
- podstrony przeniesione na nowe tokeny; usunięte filmy z konsolą i łuki z iteracji 2.
- dopracowanie po samoocenie: film hero w 48 kl./s (interpolacja ruchu, bez wzrostu wagi), kadry w nagłówkach
  czterech podstron, czytelna konsola na tablecie w pionie.

Dowody dla właściciela (w repozytorium):
- zestawienia Mercury vs SKOBEN: `docs/art-direction/compare/hero.jpg`, `features.jpg`, `proof.jpg`;
  nagłówki podstron: `compare/subpages.jpg`,
- nagrania scrolla hero: `docs/art-direction/video/skoben-hero-scroll-desktop.mp4`, `…-mobile.mp4`
  (składane klatka po klatce w headless Chromium),
- stan kryteriów odbioru i lista słabych miejsc: `docs/art-direction.md`, sekcja 8.

Wynik testów iteracji 3 (Linux, Node 22, Chromium 1243; lokalnie i w GitHub Actions):
- `npm run build` (`astro check` + `astro build`): 0 błędów, 0 ostrzeżeń; 9 stron.
- `npm run audit`: bez zastrzeżeń — 9 stron × 3 szerokości (1440 / 834 / 390), 16 linków wewnętrznych,
  axe-core WCAG 2.1 AA bez naruszeń; testy: film hero przewijany scrollem, konsola wychodząca z ekranu,
  trzy motywy, panel „Produkt”, liczba konsol (1 / 1 / 0), obrazy z wymiarami i lazy, budżet mediów,
  sandbox (desktop + mobile), formularze, menu mobilne, reduced-motion, praca bez JS.
- GitHub Actions `CI` (ubuntu-latest, build + audyt): sukces na `349dc94` (ostatni commit kodu) —
  https://github.com/dskibickikono-lang/Web-SKOBEN/actions/runs/43665571198 (przebieg PR) i
  https://github.com/dskibickikono-lang/Web-SKOBEN/actions/runs/43665567836 (przebieg push); wcześniejsze commity
  iteracji 3 (`cb4b583`, `29b2380`, `61a4bc0`, `b62578f`) również zielone.
- Lighthouse mobile (4G symulowane), 7 stron: 100 / 100 / 100 / 100; LCP 0,8–1,8 s; TBT ≤ 10 ms; CLS ≤ 0,001.
- Płynność scrolla hero w headless (render programowy, bez GPU), 6 s ciągłego przewijania, film 48 kl./s:
  1440 px — mediana klatki 16,7 ms, p95 16,8 ms, 1 klatka > 34 ms, 0 długich zadań; koszt wątku głównego
  0,85 ms na klatkę, 3,5 ms przy procesorze spowolnionym 4× (budżet 16,7 ms). 60 kl./s na laptopie:
  do potwierdzenia przez właściciela na fizycznym sprzęcie.
- `npm run check:release`: przechodzi od 2026-11-15 (właściciel potwierdził nowe treści; wcześniej celowo
  nie przechodziła). Bramka nie jest częścią CI.
- Projekt nie zawiera testów pytest — repozytorium to statyczna strona bez kodu Pythona.

Media i koszty:
- Higgsfield na koncie właściciela (klucz jednodniowy przekazany w sesji; nie jest zapisany w repozytorium,
  logach ani commitach — do usunięcia przez właściciela): 20 kadrów w 17 wywołaniach (Ideogram 4.0 i modele porównawcze)
  + 2 filmy (Kling 3.0 4K poziomy, Kling 3.0 Pro pionowy). Łącznie **3,455 USD** z limitu 7,50 USD.
- Modele, prompty i koszty: `assets-src/hero/generated/SOURCES.md`, `assets-src/sections/generated/SOURCES.md`.
  Pliki źródłowe (PNG, MP4 4K) są tylko w kontenerze sesji (`assets-src/`, poza gitem) — znikną z nim;
  wersje produkcyjne są w `public/media/`.

Znane ograniczenia (bez upiększeń):
- brak prawdziwych logotypów klientów, cytatów i prasy — w ich miejscach stoją taśma tekstowa, dwie zasady
  firmy i liczby z potwierdzonych deklaracji; zmyślonych referencji nie ma,
- scena jest wygenerowana (klasa wizualizacji architektonicznej), kadr pionowy to inne pomieszczenie,
- zachowanie przewijanego filmu na iOS Safari nie było sprawdzone na fizycznym urządzeniu.

Do decyzji właściciela: odbiór wizualny iteracji 3 (albo uwagi do iteracji 4), potwierdzenie nowych treści
(`confirmedByOwner`), merge PR #1, usunięcie klucza Higgsfield.

## Odbiór iteracji 3 przez właściciela (2026-11-15)

Odpowiedzi właściciela na trzy pytania zadane w sesji:
- **Odbiór wizualny: „Odrzucam kierunek”** — bez opisu, co ma być inaczej. Iteracja 3 nie jest odebrana;
  przed jakąkolwiek zmianą potrzebne jest doprecyzowanie i plan do akceptacji (reguła „plan → stop”).
- **Płynność scrolla hero na laptopie właściciela: „Płynnie”** — kryterium 60 kl./s potwierdzone na fizycznym sprzęcie.
- **Treści: „Potwierdzam, zostaw zamienniki”** — nowe treści iteracji 3 i zamienniki referencji zaakceptowane;
  `confirmedByOwner: true`, `npm run check:release` przechodzi.

Merge PR #1: nadal wyłącznie po stronie właściciela; przy odrzuconym kierunku nie jest rekomendowany.

## Stan PR
Gałąź `main` założona jednym pustym commitem i dołączona do gałęzi roboczej zwykłym merge'em
(bez force, bez rebase). PR #1 otwarty do `main`, gotowy do przeglądu. Merge i publikacja po stronie właściciela.
