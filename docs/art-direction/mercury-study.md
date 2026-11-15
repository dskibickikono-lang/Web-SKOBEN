# Studium kierunku artystycznego: mercury.com (strona główna)

Stan na 2026-11-14. Źródło: https://mercury.com, wersja US, bez logowania.
Metoda: Playwright (Chromium headless), viewport 1440×900 oraz 390×844 (touch, UA iPhone), bez `prefers-reduced-motion`. Fakty liczbowe pochodzą z `getComputedStyle`, z arkuszy CSS strony i z pomiarów `getBoundingClientRect`; opisy kompozycji z obejrzenia zrzutów w `ref/`.
W repo są wyłącznie pomniejszone zrzuty ekranu (720 px / 300 px szerokości). Nie kopiowano żadnych zdjęć, filmów ani fontów Mercury.

## Jak czytać nazwy plików

`ref/desktop-NNNNN.jpg` i `ref/mobile-NNNNN.jpg`: `NNNNN` to **droga przewinięcia w pikselach od góry strony** (suma ruchów kółka), krok 300 px na desktopie i 375 px na mobile.

To nie jest `scrollY` dokumentu. Dwie pierwsze sekcje są przypięte tylko przy pierwszym przejściu, a potem się zwijają i strona koryguje pozycję przewinięcia (szczegóły w części o hero). Dlatego:

| Viewport | Wysokość dokumentu przy wejściu | Po zwinięciu | Przeliczenie po zwinięciu |
|---|---|---|---|
| 1440×900 | 12 984 px | 11 634 px | `scrollY = droga − 1200` (od drogi 2100) |
| 390×844 | 16 154–16 324 px | 15 058 px | `scrollY = droga − 1284` (od drogi 2250) |

Pliki dodatkowe: `desktop-megamenu.jpg`, `desktop-megamenu-hover.jpg`, `desktop-megamenu-solutions.jpg`, `desktop-megamenu-light.jpg`, `desktop-nav-hover.jpg` (wycinek paska 720×140 w skali 1:1), `mobile-menu.jpg`, `mobile-menu-products.jpg`.

---

## (a) Co sprawia, że to wygląda drogo

Mercury wygląda drogo, bo cała strona jest jednym ciągłym ujęciem, a nie stosem bloków. Jedno fotorealistyczne zdjęcie (biurko z laptopem na wzgórzu) przechodzi przewijaniem w ekran laptopa, ekran odkleja się od zdjęcia i staje się żywym interfejsem produktu, a ten interfejs ląduje w pierwszej sekcji treści. Wszystko po hero trzyma tę samą dyscyplinę: jedna rodzina kroju w dwóch odmianach i wąskim zakresie grubości (360–480, bez boldów), nagłówki zaskakująco małe (h1 ma 49 px przy 1440), treść w wąskiej kolumnie 1024 px z dużym marginesem, jeden kolor akcentu użyty kilka razy na całą stronę, płaskie kafle o jednym promieniu 12 px bez cieni i ramek, cienkie linie zamiast pudełek. Tło całej strony zmienia się płynnie między trzema tematami (ciemny granat, ciepły beż, chłodna biel), więc sekcje nie są „paskami”, tylko zmianą światła. Każda ilustracja jest z jednej rodziny: rozmyte, monochromatyczne fragmenty UI albo abstrakcyjne rendery w tej samej palecie. Ruchu jest mało i jest wolny: jedno wejście sekcji, krótkie pętle wideo z przyciskiem pauzy, żadnych liczników, paralaks ani efektów hover na kartach.

---

## (b) Strona główna sekcja po sekcji

Kolumna „Droga” to wartość z nazwy pliku. „DOM” to `scrollY` po zwinięciu sekcji przypiętych. Wysokości z desktopu / mobile.

| # | Droga (desktop) | DOM top / wys. (desktop) | Zrzuty desktop | Zrzuty mobile | Co to jest | Układ | Zasoby | Ruch |
|---|---|---|---|---|---|---|---|---|
| 1 | 0–1350 | 0 / 900 (przypięte: 2250) | `desktop-00000`, `-00300`, `-00600`, `-00900`, `-01200` | `mobile-00000`, `-00375`, `-00750`, `-01125` | Hero: „Radically different banking”, podtytuł, pole e-mail + „Open account”, „Launch demo”, pastylka z notą prawną na dole | Tekst wyśrodkowany w 8 z 16 kolumn (672 px), h1 144 px od góry; zdjęcie pełnoekranowe pod przezroczystą nawigacją | Wideo mp4 przewijane scrollem (jedno ujęcie z najazdem kamery), klatka startowa i końcowa jako JPEG | Scrub scrollem, wygaszenie nagłówka, maska zwężająca kadr do ekranu laptopa (opis niżej) |
| 2 | 1350–ok. 2050 przypięte, potem do 3072 | 900 / 972 | `desktop-01500`, `-01800`, `-02100`, `-02400` | `mobile-01500`, `-01875`, `-02250` | „Everything you do with money. All in one place.”: 4 zakładki produktu (akordeon) + nagranie UI | Tekst w kolumnach 2–7 po lewej, scena z UI po prawej; na mobile miniatura 16:9 nad tekstem i wideo wewnątrz otwartej pozycji | 4 pliki mp4 z nagraniem interfejsu (3840×1440, 8–11 s), maskowane piórkowaną krawędzią | Panel UI przesuwa się z centrum w prawo (600 ms), tekst wchodzi po 300 ms; wideo aktywnej zakładki gra i startuje od nowa; brak automatycznej zmiany zakładek |
| 3 | od 3072 | 1872 / 393 | `desktop-02700`, `-03000` | `mobile-02625`, `-03000` | „Loved by 450K+ of the most ambitious entrepreneurs on the planet” + taśma logotypów | Nagłówek wyśrodkowany, 3 linie; taśma na całą szerokość minus marginesy | 9 logotypów jako inline SVG w jednym kolorze tekstu, wysokość 56 px (40 px mobile) | Marquee 45 s liniowo, w pętli; krawędzie wygaszone maską 20% z każdej strony |
| 4 | od 3465 | 2265 / 668 | `desktop-03300`, `-03600` | `mobile-03375`, `-03750` | Karuzela 3 referencji (zdjęcie założyciela + cytat + imię, rola) | Jedna karta 1024×512 (2:1), cytat nałożony po lewej na zdjęcie; pod spodem 3 paski postępu 159×4 px. Mobile: zdjęcie 9:16, tekst na dole | Zdjęcia portretowe w dwóch kadrach (2:1 i 9:16), etykieta branży w lewym górnym rogu | Zmiana slajdu przez rozmycie (0,5 s); w 9 s obserwacji brak automatycznego przewijania |
| 5 | od 4133 | 2933 / 1130 | `desktop-03900`, `-04200`, `-04500` | `mobile-04125`, `-04500`, `-04875` | „Banking’s been a headache. Now, it’s a head start.”: 4 funkcje | Linia 1 px, tytuł po lewej, siatka 2×2 kafli 496×331 (3:2), podpis pod kaflem; mobile 1 kolumna | 2 obrazy statyczne + 2 wideo Mux (1620×1080); rozmyte, jasne fragmenty UI na beżowym tle | Wideo startuje po wejściu w kadr, pauzuje po wyjściu; przycisk pauzy 40 px w lewym dolnym rogu kafla. Tło strony przechodzi w beż |
| 6 | od 5263 | 4063 / 338 | `desktop-04800`, `-05100` | `mobile-05250` | Cytat: Paul Copplestone, Supabase | Sam tekst, wyśrodkowany, 8 kolumn; bez zdjęcia i bez logo | Brak | Tylko wejście sekcji. Tło przechodzi w chłodną biel |
| 7 | od 5602 | 4402 / 732 | `desktop-05400`, `-05700` | `mobile-05625`, `-06000` | „Get started fast. And never stop moving.”: akordeon 3 pozycji + obraz | Tytuł u góry lewej kolumny, akordeon dosunięty do dołu, obraz 496×620 (4:5) po prawej | Abstrakcyjny render (promienie zbiegające się w punkt) | Zmiana pozycji akordeonu ręczna; obraz przenika z rozmyciem 0,5 s |
| 8 | od 6334 | 5134 / 712 | `desktop-06000`, `-06300` | `mobile-06375`, `-06750` | „Stop losing money to fees. Start using it to fuel your growth.” | Lustrzane odbicie sekcji 7: obraz 480×600 po lewej, tekst po prawej | Pierwsza pozycja to pętla wideo Mux (1080×1350, 10 s, kula ziemska), pozostałe to statyczne rendery | Jak w sekcji 7 |
| 9 | od 7046 | 5846 / 1045 | `desktop-06600`, `-06900`, `-07200`, `-07500` | `mobile-07125`, `-07500`, `-07875` | „Run your business like a seasoned pro”: 4 funkcje | Jak sekcja 5: linia, tytuł, siatka 2×2 | Naprzemiennie ciemny abstrakcyjny render i jasnoniebieski kafel z fragmentem UI (2 wideo Mux) | Jak sekcja 5 |
| 10 | od 8090 | 6890 / 449 | `desktop-07800`, `-08100` | `mobile-08625`, `-09000` | „You’re creating something to stand the test of time. So are we.” + 4 liczby | Nagłówek wyśrodkowany, pod nim 4 kolumny po 256 px rozdzielone pionowymi liniami 1 px; mobile: stos z liniami poziomymi | Tylko typografia | Brak licznika: tekst liczb jest stały. Tło wraca do ciemnego |
| 11 | od 8539 | 7339 / 744 | `desktop-08400`, `-08700` | `mobile-09375`, `-09750`, `-10125` | „Standard protection stops short. Mercury goes further.”: 3 karty bezpieczeństwa | Linia, tytuł, 3 kafle 320×400 (4:5) w rzędzie, podpisy pod spodem | Ciemne rendery z jasnymi, miękko świecącymi obiektami (słupek, odcisk palca, przełączniki) | Tylko wejście sekcji |
| 12 | od 9284 | 8084 / 621 | `desktop-09000`, `-09300` | `mobile-11250`, `-11625` | „Mercury in the spotlight”: 3 karty prasowe | 3 karty 320×447, w każdej kafel z logo redakcji 256×171, tytuł 28 px, okrągły przycisk ze strzałką | Logotypy redakcji jako obrazy na ciemnym kaflu | Cała karta jest linkiem (nowa karta przeglądarki); nie wykryto zmiany stylu karty na hover |
| 13 | od 9905 | 8705 / 787 | `desktop-09900`, `-10200` | `mobile-12375`, `-12750` | Końcowe wezwanie: „Banking – redesigned from the ground up.” + dwie karty (business / personal) | Nagłówek i 2 przyciski wyśrodkowane; pod spodem 2 karty 496×258 | Tylko typografia | Tylko wejście sekcji |
| 14 | od 10692 | 9492 / 917 | `desktop-10500`, `-10800` | `mobile-13500`, `-13875` | Stopka | 8 grup linków: 4 kolumny × 2 rzędy (mobile 2 × 4); bez logo, bez newslettera, bez wielkiego napisu | Brak | Brak |
| 15 | od 11609 | 10409 / 1225 | `desktop-11400`, `-11700`, `-12000` | `mobile-15000`, `-15375`, `-15750` | Noty prawne i przypisy | Linia 1 px, etykieta w 4 kolumnach, tekst w 8 kolumnach, 12 px | Brak | Brak |

Na mobile te same sekcje zaczynają się (DOM po zwinięciu) na: 0, 844, 1731, 2049, 2781, 4284, 4589, 5270, 5993, 7439, 8073, 9845, 11149, 11972, 13499. Najdłuższe sekcje mobile to karty bezpieczeństwa (1772 px), noty prawne (1559 px) i stopka (1526 px).

### Hero: jak naprawdę działa najazd kamery

- **To jest wideo, nie canvas i nie sekwencja obrazów.** Jeden element `<video muted playsinline preload="auto">` bez `autoplay` i bez `loop`, z trzema źródłami: `hero-scrub-lg.mp4` (≥1024 px, 1920×720, 6,4 s, 4,8 MB), `hero-scrub-md.mp4` (3,2 MB), `hero-scrub-sm.mp4` (1080×720, 2,4 MB). Jedyny `<canvas>` na stronie (149×44 px) to efekt światła na głównym przycisku.
- **Najazd jest wyrenderowany w filmie.** Skrypt tylko ustawia `currentTime` proporcjonalnie do przewinięcia: 6,4 s na 150% wysokości okna (ok. 0,0047 s na piksel przy 900 px). Nie zweryfikowano, czy plik ma gęste klatki kluczowe ani czy skrypt wygładza wartość.
- **Konstrukcja:** kontener o wysokości `250vh`, w środku scena `position: sticky; top: 0; height: 100vh`. Pod wideo leży `<picture>` z klatką startową (osobne JPEG dla 4 progów, w tym pionowy dla telefonu), ukrywany przy pierwszym ruchu.
- **Co się dzieje z nagłówkiem:** nie przesuwa się (pozycja h1 stała), tylko gaśnie w miejscu. Przezroczystość 1→0 między 20% a 40% drogi (270–540 px), rozmycie tła pod tekstem `blur(8px)`→0 między 20% a 50%. Ciemny gradient u góry (czytelność nawigacji) znika w pierwszych 10% drogi.
- **Końcówka:** między 80% a 100% drogi maska CSS na wideo zmniejsza się z 7200×2700 do 2400×900 px z piórkowaną krawędzią. Zdjęcie znika, zostaje sam ekran laptopa jako panel UI na tle `#171721` (`desktop-01200`).
- **Jednorazowość:** po dojściu do końca hero zwija się do `100vh`, strona cofa `scrollY` o 1350 px, a kolejna sekcja dostaje `200vh` z przypiętą sceną. Po ok. 700 px ona też się zwija. Przewinięcie z powrotem pokazuje statyczne hero: scrub nie odtwarza się wstecz.
- **Przy `prefers-reduced-motion`:** klasy `motion-reduce:!h-screen` i `motion-reduce:hidden` na wideo wskazują, że hero jest wtedy statycznym kadrem. Nie testowano w przeglądarce.
- **Mobile:** ta sama mechanika z plikiem `sm`. Po zakończeniu kadr końcowy zmniejsza się do miniatury 16:9 nad tekstem (animacja wysokości 800 ms, `cubic-bezier(0.76, 0, 0.24, 1)`).

### Media w kartach funkcji

- Kafel to kontener `aspect-ratio 3/2` (lub 4/5), `border-radius: 12px`, `overflow: hidden`. Podpis leży pod kaflem, 12 px niżej. Karta nie ma tła, ramki ani cienia.
- Obrazy statyczne: źródła 1320×880, serwowane jako AVIF (10–180 KB).
- Wideo: element `<mux-video>` (strumień HLS z Mux), `muted playsinline preload="auto"`, z plakatem. Atrybut `autoplay` jest włączany, gdy kafel wchodzi w kadr, i zdejmowany po wyjściu. Filmy trwają 4,9–10 s.
- Filmy bez `loop` grają raz i zatrzymują się na ostatniej klatce; przycisk zmienia się wtedy z „Pause” na „Play”. Przycisk: koło 40 px, tło `rgba(112,115,147,0.1)` + ramka 1 px + `backdrop-filter: blur(20px)`, 12 px od lewej i dolnej krawędzi.
- Jedna pętla (`loop`, 5 s) nie miała przycisku pauzy w chwili pomiaru.
- Nagrania zakładek w sekcji 2 to zwykłe mp4 z serwera strony (0,66–1,13 MB każde). Nieaktywne mają `preload="metadata"`.

---

## (c) Tokeny

### Typografia

Dwa kroje własne: `arcadiaDisplay` (nagłówki, zmienny, 320–480) i `arcadia` (tekst i UI, zmienny, 360–500). To fonty licencjonowane, serwowane z domeny Mercury. Na stronie głównej nie ma tekstu szeryfowego ani maszynowego: `tiemposHeadline` i `IBM Plex Mono` są zadeklarowane w CSS, ale miały status „unloaded”, czyli nic ich nie użyło.

| Rola | Element / klasa | Krój, grubość | 1440 px: rozmiar / interlinia / odstęp liter | 390 px |
|---|---|---|---|---|
| Liczby | `p` `arcadia-display-2` | Display 480 | 65,3 / 71,9 px (110%) / 0 | 36 / 39,6 |
| h1 | `h1` (nadpisane na `arcadia-display-4`) | Display 480 | 49,3 / 54,3 px (110%) / 0 | 28 / 30,8 |
| h2 wyśrodkowane | `arcadia-heading-1` | Display 480 | 42 / 48,3 px (115%) / 0,01em | 28 / 33,6, 0,015em |
| Tytuł sekcji (lewy) | `p` `arcadia-heading-3` | Display 480 | 32 / 36,8 px (115%) / 0,015em | 24 / 28,8, 0,02em |
| Tytuł karty prasowej (h2 w karcie) | `arcadia-heading-5` | Display 480 | 28 / 33,6 px (120%) / 0,015em | 21 / 25,2 |
| Duży cytat | `blockquote` `arcadia-subheading-5` | Display **360** | 28 / 33,6 px / 0,015em, kolor przygaszony | 21 / 25,2 |
| Tytuł sekcji z akordeonem | `arcadia-heading-6` | Display 480 | 24 / 28,8 px (120%) / 0,02em | 21 / 25,2 |
| Cytat na zdjęciu | `arcadia-heading-7` | Display 480 | 21 / 25,2 px / 0,02em | 18 / 24,3, 0,03em |
| Imię i nazwisko | `arcadia-heading-8` | Text 480 | 21 / 25,2 px | 16 / 21,6 |
| Tytuł kafla (h3-odpowiednik) | `arcadia-heading-9` | Text 480 | 18 / 24,3 px (135%) | 14 / 18,9 |
| Pozycja akordeonu (`h3 > button`) | `arcadia-heading-10` | Text 480 | 16 / 21,6 px (135%) | 14 / 19,6, 0,01em |
| Podtytuł hero, rola osoby | `arcadia-body-1` | Text 360 | 21 / 28,4 px (135%) | 16 / 21,6 |
| Opis kafla | `arcadia-body-2` | Text 360 | 18 / 24,3 px | 14 / 18,9 |
| Treść akordeonu, nagłówki grup stopki | `arcadia-body-3` | Text 400 | 16 / 22,4 px (140%) | 14 / 19,6, 0,01em |
| Nawigacja, przyciski | `arcadia-ui-1` | Text 420 | 16 px, interlinia 1 | 16 |
| Linki stopki | `arcadia-ui-1` | Text 420 | 16 / 20 px | 16 / 20 |
| Etykieta, drobne linki menu | `arcadia-ui-2` | Text 420 | 14 px, interlinia 1, 0,005em | 14 |
| Tekst prawny | `small`, `arcadia-body-5` | Text 400 (wyróżnienia 480 i 700) | 12 / 16,8 px (140%) / 0,02em | 10 / 14, 0,03em |

Obserwacje systemowe:

- Rozmiary display są płynne: `clamp(1.75rem, 0.683rem + 2.668vw, 3.938rem)` dla h1 i `clamp(2.25rem, 0.79rem + 3.66vw, 5.25rem)` dla liczb. Reszta skacze na progach 768, 1024, 1280, 1536 i 1952 px.
- Nagłówki mają **dodatni** odstęp liter (0,01–0,02em), nie ujemny.
- Hierarchię buduje rozmiar i kolor (domyślny / przygaszony), nie grubość. Różnica między tytułem a opisem kafla to 480 wobec 360 przy tym samym rozmiarze 18 px.
- Tytuły sekcji to semantycznie `<p>`, a `h2` dostają tylko duże zdania wyśrodkowane i tytuły kart prasowych.

### Kolory

Trzy tematy, zmieniane globalnie na kontenerze całej strony. Akcent jest wspólny.

| Token | Ciemny (`dark-neutral`) | Beż (`beige`) | Jasny (`neutral`) |
|---|---|---|---|
| Tło strony | `#171721` | `#F6F5F2` | `#FBFCFD` |
| Tło drugie / powierzchnia karty | `#1E1E2A` | `#EFEEE9` | `#F4F5F9` / `#EDEDF3` |
| Powierzchnia uniesiona (menu, dymek) | `#272735` | `#FCFCFA` | `#FFFFFF` |
| Tekst domyślny | `#EDEDF3` | `#2A2924` | `#272735` |
| Tekst przygaszony | `#C3C3CC` | `#5A5548` | `#535461` |
| Tekst wzmocniony | `#F4F5F9` | `#201F1C` | `#1E1E2A` |
| Linia sekcji (`border-subdued`) | `#70707D` | `#C8C4B8` | `#C3C3CC` |
| Linia „szklana” (`border-frosted`) | `rgba(175,178,206,0.36)` | `rgba(112,115,147,0.22)` | `rgba(112,115,147,0.22)` |
| Linia aktywnej pozycji (`border-emphasized`) | `#EDEDF3` | `#2A2924` | `#272735` |
| Powierzchnia „szklana” | `rgba(175,178,206,0.20)` | `rgba(112,115,147,0.10)` | `rgba(112,115,147,0.10)` |
| Przycisk tonalny | `rgba(156,180,232,0.20)`, hover `0.28` | `rgba(138,117,60,0.10)` | `rgba(82,102,235,0.10)` |
| Kolor pomocniczy (`surface-magic`) | `#9CB4E8` | `#8A753C` | `#5266EB` |

Akcent: `#5266EB`, hover `#4354C8`, wciśnięty `#3442A6`, tekst na akcencie `#FFFFFF`. Na całej stronie głównej występuje tylko w: przycisku „Open account” (nawigacja, hero, końcowe wezwanie), kropce aktywnej pozycji akordeonu w jasnych tematach i obrysie fokusu. Na ciemnym tle kropka aktywnej pozycji ma `#CDDDFF`.

Kolejność tematów na stronie (desktop, DOM po zwinięciu):

| Od (px) | Do (px) | Temat | Sekcje |
|---|---|---|---|
| 0 | 2933 | Ciemny `#171721` | Hero, zakładki produktu, logotypy, karuzela referencji |
| 2933 | 4063 | Beż `#F6F5F2` | Siatka funkcji 1 |
| 4063 | 6890 | Jasny `#FBFCFD` | Cytat, dwa akordeony z obrazem, siatka funkcji 2 |
| 6890 | 11634 | Ciemny `#171721` | Liczby, bezpieczeństwo, prasa, końcowe wezwanie, stopka, noty |

Zmiana następuje, gdy granica sekcji mija mniej więcej środek okna (zaobserwowano przełączenie na beż przy `scrollY` ≈ 2500 dla sekcji zaczynającej się na 2933). Pasek nawigacji zmienia kolor razem z tłem.

### Siatka i odstępy

| Token | 1440 px | 390 px |
|---|---|---|
| Liczba kolumn | 16 | 12 |
| Margines boczny siatki | 32 px | 24 px |
| Odstęp między kolumnami | 32 px | 16 px |
| Szerokość kolumny | 56 px | 13,8 px |
| Maksymalna szerokość siatki | 1952 px | 1952 px |
| Kolumna treści | 12 z 16 kolumn = **1024 px** (x od 208 do 1232) | 342 px |
| Rzeczywisty margines treści | 208 px z każdej strony | 24 px |
| Blok wyśrodkowany (h1, h2, cytat) | 8 kolumn = 672 px | 342 px |
| `layout-padding-sm` (tytuł sekcji → siatka kafli) | 40 px | 32 px |
| `layout-padding-md` (góra sekcji z siatką kafli) | 72 px | 56 px |
| `layout-padding-lg` (góra sekcji z cytatem i akordeonem) | 112 px | 80 px |
| `layout-padding-xl` (góra stopki, dół ostatniej sekcji, dół not) | 128 px | 96 px |
| Odstęp kafli w siatce (kolumna × rząd) | 32 × 40 px | 16 × 32 px |
| Kafel → podpis | 12 px | 12 px |
| Wypełnienie karty z tłem (prasa, wezwanie) | 32 px | 16 px (token `gap-md`; nie mierzono osobno) |
| Wysokość nawigacji | 72 px | 72 px |

Sekcje mają odstęp tylko u góry (dolnego nie ma), więc rytm pionowy to suma: górny odstęp następnej sekcji. Sekcje z tytułem zaczynają się linią 1 px na szerokość 1024 px, a tytuł leży ok. 25 px pod nią.

### Promienie, linie, cienie

| Element | Wartość |
|---|---|
| Kafel z obrazem lub wideo, karta prasowa, karta wezwania, pastylka z notą prawną, zdjęcie referencji | 12 px |
| Kafel z logo w karcie prasowej, wideo w akordeonie mobile | 8 px |
| Przyciski tekstowe i pole e-mail | pełna pastylka (wysokość 40 px; pole w hero 48 px na desktopie) |
| Przyciski okrągłe (pauza, strzałka) | koło 40 px |
| Panel mega-menu | 0 u góry, 12 px na dole |
| Obrys fokusu, linki | 4 px |
| Linie | zawsze 1 px, kolory w tabeli kolorów |
| Cienie | brak na kartach. Bardzo słaby cień tylko na pastylce z notą prawną i dymku zgody (`rgba(0,0,0,0.05)`, rozmycie 3–20 px) |

Przyciski: wysokość 40 px, wypełnienie poziome 20 px, tekst 16 px / 420. Warianty: główny (akcent), tonalny (półprzezroczysty błękit), „szklany” (tło 20% + ramka 1 px + `backdrop-filter: blur(20px)`), tekstowy w nawigacji (przezroczysty, tło dopiero na hover).

### Ruch: czasy i krzywe

| Zjawisko | Czas | Krzywa | Uwagi |
|---|---|---|---|
| Scrub hero | zależny od scrolla | liniowe mapowanie na `currentTime` | 150vh drogi = 6,4 s filmu |
| Wygaszenie nagłówka hero | 20–40% drogi | liniowo | rozmycie tła 8 px → 0 do 50% |
| Zwężenie maski do ekranu laptopa | 80–100% drogi | liniowo | 5× → 1,67× szerokości okna |
| Przesunięcie panelu UI po hero | 600 ms (mobile: wysokość 800 ms) | `cubic-bezier(0.76, 0, 0.24, 1)` | tekst wchodzi po 300 ms, 200 ms ease-out |
| Wejście sekcji | 670 ms, opóźnienie 150 ms | przesunięcie o 50 px: `cubic-bezier(0.28, 1.1, 0.74, 1)`; przezroczystość: `cubic-bezier(0.59, 0.41, 0.68, 0.49)` | cała sekcja jako jeden blok, raz; 12 kontenerów |
| Zmiana tematu strony | 500 ms | `cubic-bezier(0, 0, 0.6, 1)` | tło, tekst, linie, nawigacja naraz |
| Hover przycisków i linków | 300 ms | `cubic-bezier(0, 0, 0.2, 1)` | tylko kolor |
| Rozwinięcie akordeonu | 300 ms | `cubic-bezier(0, 0, 0.2, 1)` | `grid-template-rows` 0fr → 1fr |
| Zmiana obrazu przy akordeonie i slajdu referencji | 500 ms | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | przezroczystość → 0 i `blur(4px)` |
| Zmiana wideo zakładki | 400 ms | ease-out | przezroczystość + rozmycie |
| Tekst zakładki | 300 ms | ease-in-out | przesunięcie o 5 px |
| Taśma logotypów | 45 s | liniowo, w pętli | przesunięcie o −50% |
| Mega-menu: otwarcie i zamknięcie | 250 ms | `cubic-bezier(0.2, 1, 0.4, 1)` | przezroczystość + `rotateX(-10deg) scale(0.9)` → 0, oś u góry |
| Pastylka z notą prawną w hero | 500 ms | `cubic-bezier(0.65, 0.05, 0.36, 1)` | zmiana pozycji `bottom` |
| Menu mobilne | 300 ms | `cubic-bezier(0.6, 0, 0.8, 0)` (zmierzone w stanie otwartym) | panel wjeżdża z prawej |

Czego nie ma: liczników przy liczbach, paralaksy, animacji pojedynczych liter lub słów, kaskadowego wejścia kafli, powiększania kart na hover, automatycznej karuzeli (w czasie obserwacji).

---

## (d) Nawigacja i mega-menu

**Pasek.** Wysokość 72 px, `position: sticky`, wypełnienie 16 × 32 px. Logo po lewej (139×32), 5 pozycji na środku (Products, Solutions, Resources, About z szewronem, Pricing bez), po prawej „Log in” jako przycisk tekstowy i „Open account” w kolorze akcentu. Odstęp między pozycjami 8 px, każda to pastylka 40 px z wypełnieniem 20 px.

**Tło paska.** Na samej górze przezroczyste, czytelność zapewnia ciemny gradient nałożony na zdjęcie. Po ruszeniu strony pasek dostaje kolor tła bieżącego tematu i `backdrop-filter: blur(10px)`. Bez linii i bez cienia. (`desktop-00000` wobec `desktop-00300`.)

**Hover.** Pozycja dostaje tło `rgba(156,180,232,0.28)` w kształcie pastylki, 300 ms (`desktop-nav-hover.jpg`). Główny przycisk ciemnieje do `#4354C8` i ma nakładkę `<canvas>` z jasną plamą podążającą za kursorem (`mix-blend-mode: screen`); efektu w ruchu nie nagrywano.

**Mega-menu „Products”** (`desktop-megamenu.jpg`, jasny wariant `desktop-megamenu-light.jpg`):

- Panel na pełną szerokość okna (1440×670), przyklejony pod paskiem, tło `#272735` (w jasnym temacie `#FFFFFF`), ramka 1 px, dolne rogi 12 px. Pasek przyjmuje ten sam kolor, więc tworzą jedną płaszczyznę. Strona pod spodem nie jest przyciemniana.
- Trzy kolumny po 480 px rozdzielone liniami 1 px, bez kart w środku.
- Lewa kolumna: tytuł grupy 21 px, opis 18 px przygaszony, dwie pozycje z linią nad każdą (nazwa 18 px / 480 + opis 14 px), mała pastylka „Try the demo” (wysokość 32 px).
- Środek i prawa: siatka 2×2 grup. W każdej: nazwa 18 px / 480, opis 14 px, etykieta wersalikami 14 px / 500 w kolorze przygaszonym, lista linków 14 px / 420 co 24 px.
- Dolny pas na całą szerokość: „Personal Banking →” z opisem.
- **Zero ikon i zero obrazów.** Jedyny znak graficzny to strzałka.
- Hover linku: kolor tekstu przechodzi na przygaszony i pojawia się strzałka (`desktop-megamenu-hover.jpg`).
- „Solutions” ma niższy panel (320 px): 2 kolumny pozycji z opisem i wąska kolumna „& More” z samymi linkami (`desktop-megamenu-solutions.jpg`). Wysokość panelu dopasowuje się do zawartości.
- Otwiera się po najechaniu i po kliknięciu (komponent Radix Navigation Menu).

**Mobile** (`mobile-menu.jpg`, `mobile-menu-products.jpg`): w pasku tylko logo i ikona menu, bez przycisku akcji. Menu to pełnoekranowy panel w kolorze `#272735` wjeżdżający z prawej. Wiersze 48 px z linią 1 px i szewronem. Podpoziom wsuwa się jako kolejny ekran z nagłówkiem „‹ Menu” i powtarza strukturę mega-menu w jednej kolumnie. Dwa równe przyciski („Open account”, „Log in”) są przypięte do dołu ekranu na obu poziomach.

---

## (e) Co będzie wyglądało tanio, jeśli zrobimy to źle

1. **Najazd kamery zrobiony przez `transform: scale()` na zdjęciu.** U Mercury ruch kamery jest w filmie (zmienia się perspektywa, głębia, ostrość). Skalowane zdjęcie daje płaski zoom i rozmycie pikseli. Jeśli nie mamy wyrenderowanego ujęcia, lepiej nie udawać najazdu.
2. **Scrub bez klatki startowej i bez wersji mobilnej.** Mercury ma osobny JPEG pod wideo dla 4 progów i 3 pliki wideo. Bez tego jest czarny prostokąt przy wolnym łączu albo kadr poziomy rozciągnięty na pionowy ekran.
3. **Scrub odtwarzany przy każdym przejściu.** Tu jest jednorazowy: po przejściu sekcja się zwija i nie trzyma użytkownika 1350 px przy powrocie na górę. Stałe przypięcie na 250vh męczy.
4. **Za duże i za grube nagłówki.** h1 ma 49 px i grubość 480, tytuły sekcji 32 px. Typowy odruch (72–96 px, bold, ujemny odstęp liter) od razu zmienia charakter na „szablon SaaS”.
5. **Więcej niż dwie grubości pisma w jednym bloku.** Tu tytuł i opis kafla mają ten sam rozmiar, różni je 480 wobec 360 i kolor. Dodanie 700 psuje spokój.
6. **Akcent rozlany po stronie.** `#5266EB` pojawia się w 3 przyciskach i kropce akordeonu. Akcentowe ikony, podkreślenia, tła sekcji i gradienty robią z niego dekorację.
7. **Karty z ramką, cieniem i hoverem z uniesieniem.** Kafle Mercury to płaski obraz o promieniu 12 px i tekst pod spodem. Karty z tłem są tylko tam, gdzie karta jest linkiem lub wyborem (prasa, końcowe wezwanie).
8. **Mieszanie stylów ilustracji.** Wszystkie obrazy są z jednej rodziny: miękkie, lekko rozmyte, w palecie strony, bez ostrych zrzutów ekranu wklejonych w ramkę przeglądarki. Jeden stockowy obraz albo jeden surowy zrzut łamie całość.
9. **Ikony w mega-menu i w listach funkcji.** Menu nie ma ani jednej ikony, tylko typografię i linie. Zestaw kolorowych ikonek to najszybsza droga do wyglądu szablonu.
10. **Sekcje jako kolorowe pasy.** U Mercury zmienia się tło całej strony w 500 ms, gdy sekcja mija środek okna. Twarde przejścia tła na granicach sekcji wyglądają jak klocki.
11. **Kontrastowe przeskoki tła.** Przejście idzie ciemny → beż → chłodna biel → ciemny, czyli sąsiednie jasne tematy różnią się tylko temperaturą. Biel `#FFFFFF` obok czerni `#000000` byłaby krzykliwa; tu nie ma ani jednej, ani drugiej.
12. **Kaskadowe animacje wejścia i liczniki.** Sekcja wchodzi raz, jako całość, o 50 px. Liczby stoją. Każdy dodatkowy efekt (liczenie do 450K, kafle wpadające po kolei) obniża powagę.
13. **Wideo bez sterowania.** Każde nagranie, które gra dłużej, ma przycisk pauzy 40 px w tym samym miejscu, gra tylko w kadrze i zatrzymuje się po wyjściu. Pętle bez pauzy i dźwięk to błąd dostępności i wrażenie reklamy.
14. **Taśma logotypów w kolorach marek.** Logotypy są jednobarwne (kolor tekstu), równej wysokości 56 px, z wygaszeniem krawędzi. Kolorowe logo o różnych wysokościach wyglądają jak ściana sponsorów.
15. **Referencja bez twarzy albo ze zdjęciem z banku zdjęć.** Karuzela ma prawdziwe portrety w dwóch kadrach (2:1 i 9:16), z tekstem na gradiencie o wielu przystankach. Jeśli nie mamy takich zdjęć, lepszy jest sam cytat typograficzny (sekcja 6) niż awatar w kółku.
16. **Za szeroka treść.** Treść zajmuje 1024 z 1440 px, a zdania wyśrodkowane 672 px. Rozciągnięcie siatki do 1280–1360 px zabiera powietrze, które tu robi połowę wrażenia.
17. **Stopka z dużym logo, newsletterem i ikonami społecznościowymi.** Tu stopka to 8 list linków 16 px na tym samym tle i noty prawne 12 px. Nic nie konkuruje z końcowym wezwaniem nad nią.
18. **Fonty z opóźnionym ładowaniem.** W naszych testach pierwsze wczytanie strony w świeżej sesji kilka razy pokazało krój zastępczy (szeryfowy), mimo statusu „loaded”. Przy lekkich grubościach 360–480 podmiana kroju jest bardzo widoczna, więc trzeba dobrać metrykę kroju zastępczego i wstępnie ładować pliki.

---

## Czego nie udało się zweryfikować

- Zachowania na prawdziwym iOS Safari (bezwładność dotyku, `100dvh`, autoodtwarzanie wideo). Testy mobilne to emulacja w Chromium.
- Struktury klatek kluczowych w plikach scrub i tego, czy skrypt wygładza `currentTime` (nie pobieraliśmy plików).
- Czy karuzela referencji przewija się sama po czasie dłuższym niż 9 s i czy zakładki produktu zmieniają się same po dłuższym czasie niż 16 s (w tych oknach nie zmieniły się).
- Wyglądu efektu światła na głównym przycisku w ruchu (wiadomo tylko, że to `<canvas>` z mieszaniem „screen”).
- Zachowania przy `prefers-reduced-motion` (wnioski tylko z klas CSS).
- Wypełnienia kart na mobile i stanów hover na urządzeniach dotykowych.
- Podstron: studium obejmuje tylko stronę główną i menu.
