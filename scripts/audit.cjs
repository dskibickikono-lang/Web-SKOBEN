#!/usr/bin/env node
/**
 * Audyt wizualny/UX zbudowanej strony w headless Chromium.
 *
 *   npm run build && npm run audit
 *
 * Sprawdza każdą stronę w trzech szerokościach: błędy konsoli i sieci,
 * poziome przewijanie, strukturę nagłówków, martwe linki wewnętrzne,
 * zewnętrzne zasoby i pliki graficzne (ma ich nie być), dostępność (axe-core),
 * precyzję układu (piony siatki, skala i grubości pisma, cele dotyku ≥ 40 px)
 * oraz pełny scenariusz klikania sandboxa. Zrzuty trafiają do audit-output/.
 *
 * Wymaga pakietu `playwright` z przeglądarką Chromium (nie jest zależnością
 * projektu — w CI: `npx playwright install chromium`).
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'audit-output');
const AXE = require.resolve('axe-core/axe.min.js');

const PAGES = ['/', '/agenci/', '/automatyzacje/', '/sandbox/', '/wdrozenie/', '/bezpieczenstwo/', '/kontakt/', '/polityka-prywatnosci/', '/404.html'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
];

/** Dozwolone grubości pisma (skala systemu projektowego). */
const WEIGHTS = ['400', '450', '480', '500', '540', '620'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.json': 'application/json',
};

function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let file = path.join(DIST, p);
    if (!file.startsWith(DIST)) file = path.join(DIST, '404.html');
    let status = 200;
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(DIST, '404.html');
      status = 404;
    }
    res.writeHead(status, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const slug = (p) => (p === '/' ? 'home' : p.replace(/\//g, '').replace('.html', ''));

async function auditPage(browser, base, route, vp, problems) {
  const touch = vp.name === 'mobile';
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  const tag = `${route} @${vp.name}`;
  const fail = (msg) => problems.push(`${tag}: ${msg}`);

  page.on('console', (m) => m.type() === 'error' && !(route === '/404.html' && /404/.test(m.text())) && fail(`console: ${m.text()}`));
  page.on('pageerror', (e) => fail(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => fail(`request failed: ${r.url()}`));
  const external = new Set();
  const images = new Set();
  page.on('request', (r) => {
    const url = r.url();
    if (!url.startsWith(base) && !url.startsWith('data:')) external.add(url);
    if (r.resourceType() === 'image' && !url.endsWith('/favicon.svg')) images.add(url);
  });

  const res = await page.goto(base + route, { waitUntil: 'networkidle' });
  if (route !== '/404.html' && res.status() !== 200) fail(`status ${res.status()}`);

  // Przewinięcie całej strony uruchamia animacje wejścia.
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(vp.height * 0.7)) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(140);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);

  const facts = await page.evaluate(() => {
    const doc = document.documentElement;
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    // elementy wystające poza prawą krawędź (z pominięciem celowo przewijanych kontenerów)
    const wide = [];
    for (const el of document.querySelectorAll('body *')) {
      // dekoracje (aria-hidden) celowo wychodzą poza kadr i są przycinane przez kontener
      if (!visible(el) || el.closest('[aria-hidden="true"], .compare-wrap, .sbx__queue-list, .pipe__tabs, svg')) continue;
      const r = el.getBoundingClientRect();
      if (r.right > doc.clientWidth + 1 || r.left < -1) wide.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
    }
    const small = [];
    for (const el of document.querySelectorAll('a, button, input, select, textarea, summary')) {
      if (!visible(el) || el.closest('[aria-hidden="true"], [inert]')) continue;
      const r = el.getBoundingClientRect();
      const inline = getComputedStyle(el).display === 'inline';
      // .link ma obszar dotyku powiększony pseudoelementem (global.css)
      if (!inline && !el.classList.contains('link') && (r.height < 40 || r.width < 40)) small.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    // Precyzja: siatka, skala typograficzna, grubości pisma
    const edges = new Set();
    for (const el of document.querySelectorAll('main h1, main h2')) {
      if (!visible(el) || el.closest('[aria-hidden="true"], [data-sbx]') || getComputedStyle(el).textAlign === 'center') continue;
      edges.add(Math.round(el.getBoundingClientRect().left));
    }
    const sizes = new Set();
    const weights = new Set();
    for (const el of document.querySelectorAll('body *')) {
      // skala dotyczy treści; ilustracyjne makiety interfejsu (aria-hidden) mają własną, mniejszą
      if (!visible(el) || el.closest('svg, [aria-hidden="true"]')) continue;
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el);
      sizes.add(cs.fontSize);
      weights.add(cs.fontWeight);
    }
    return {
      edges: [...edges],
      sizes: [...sizes],
      weights: [...weights],
      overflow: doc.scrollWidth - doc.clientWidth,
      wide: [...new Set(wide)].slice(0, 6),
      small: small.slice(0, 6),
      h1: document.querySelectorAll('h1').length,
      headings: [...document.querySelectorAll('h1,h2,h3,h4')].filter(visible).map((h) => Number(h.tagName[1])),
      imgs: document.querySelectorAll('img, picture, video').length,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      lang: doc.lang,
      links: [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')),
      unrevealed: document.querySelectorAll('[data-reveal]:not(.is-in)').length,
    };
  });

  if (facts.overflow > 0) fail(`poziome przewijanie o ${facts.overflow}px`);
  if (facts.wide.length) fail(`elementy poza ekranem: ${facts.wide.join(', ')}`);
  if (facts.h1 !== 1) fail(`liczba h1 = ${facts.h1}`);
  for (let i = 1; i < facts.headings.length; i++) {
    if (facts.headings[i] - facts.headings[i - 1] > 1) {
      fail(`przeskok poziomu nagłówka h${facts.headings[i - 1]} → h${facts.headings[i]}`);
      break;
    }
  }
  if (facts.imgs > 0) fail(`znaleziono ${facts.imgs} elementów img/picture/video`);
  if (images.size) fail(`żądania plików graficznych: ${[...images].join(', ')}`);
  if (external.size) fail(`zasoby zewnętrzne: ${[...external].join(', ')}`);
  if (!facts.title || facts.title.length > 70) fail(`tytuł strony: "${facts.title}"`);
  if (facts.description.length < 50 || facts.description.length > 170) fail(`meta description ma ${facts.description.length} znaków`);
  if (facts.lang !== 'pl') fail(`lang="${facts.lang}"`);
  if (facts.unrevealed > 0) fail(`${facts.unrevealed} elementów [data-reveal] nie weszło`);
  if (vp.name === 'mobile' && facts.small.length) fail(`małe cele dotyku: ${facts.small.join(' | ')}`);

  // Precyzja: nagłówki stoją na najwyżej dwóch pionach siatki, pismo trzyma się skali
  if (facts.edges.length > 2) fail(`nagłówki na ${facts.edges.length} różnych pionach: ${facts.edges.join(', ')} px`);
  const offScale = facts.weights.filter((w) => !WEIGHTS.includes(w));
  if (offScale.length) fail(`grubości pisma spoza skali: ${offScale.join(', ')}`);
  if (facts.sizes.length > 14) fail(`zbyt wiele rozmiarów pisma na stronie: ${facts.sizes.length}`);

  // Prywatność: strona deklaruje brak cookies i trwałych zapisów w przeglądarce
  const cookies = await ctx.cookies();
  if (cookies.length) fail(`ustawiono cookies: ${cookies.map((c) => c.name).join(', ')}`);
  const stored = await page.evaluate(() => ({ local: window.localStorage.length, session: Object.keys(window.sessionStorage) }));
  if (stored.local > 0) fail(`zapis w localStorage (${stored.local})`);
  if (stored.session.length > 0) fail(`nieoczekiwany zapis w sessionStorage: ${stored.session.join(', ')}`);

  // Dostępność
  await page.addScriptTag({ path: AXE });
  const axe = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] });
    return r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× np. ${v.nodes[0].target.join(' ')}`);
  });
  axe.forEach((v) => fail(`axe: ${v}`));

  await page.screenshot({ path: path.join(OUT, `${slug(route)}-${vp.name}.png`), fullPage: true });
  await ctx.close();
  return facts.links;
}

async function auditSandbox(browser, base, vp, problems) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  const tag = `sandbox-flow @${vp.name}`;
  const fail = (msg) => problems.push(`${tag}: ${msg}`);
  page.on('pageerror', (e) => fail(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && fail(`console: ${m.text()}`));

  await page.goto(base + '/sandbox/', { waitUntil: 'networkidle' });
  const statuses = () => page.$$eval('.sbx-q', (els) => els.map((e) => e.className.match(/is-(new|running|waiting|closed|returned|rejected)/)?.[1]));

  for (const scenario of ['orders', 'invoices', 'tickets']) {
    await page.click(`[data-sbx-scenario="${scenario}"]`);
    if ((await page.getAttribute('[data-sbx-speed]', 'aria-pressed')) !== 'true') await page.click('[data-sbx-speed]');
    await page.click('[data-sbx-run]');
    await page.waitForFunction(() => !document.querySelector('.sbx-q.is-new, .sbx-q.is-running'), null, { timeout: 90000 });
    let s = await statuses();
    if (!s.includes('waiting')) fail(`${scenario}: żadna sprawa nie trafiła do człowieka`);
    if (!s.includes('closed')) fail(`${scenario}: żadna sprawa nie domknęła się automatycznie`);

    // 1) zatwierdzenie pierwszego wyjątku
    await page.locator('.sbx-q.is-waiting').first().click();
    await page.click('[data-act="approve"]');
    await page.waitForFunction(() => document.querySelector('.sbx-q.is-selected')?.classList.contains('is-closed'), null, { timeout: 15000 });

    // 2) poluzowanie reguł domyka resztę czekających
    await page.click('[data-sbx-tab="rules"]');
    for (const id of ['#sbx-r-tol', '#sbx-r-limit', '#sbx-r-conf']) {
      const input = page.locator(id);
      if (!(await input.count())) continue;
      const target = id === '#sbx-r-conf' ? await input.getAttribute('min') : await input.getAttribute('max');
      await input.fill(String(target));
      await input.dispatchEvent('change');
    }
    const flag = page.locator('#sbx-r-flag');
    if (await flag.isChecked()) await flag.click();
    await page.waitForFunction(() => !document.querySelector('.sbx-q.is-running'), null, { timeout: 20000 });
    const closedByRules = (await statuses()).filter((x) => x === 'closed').length;
    if (closedByRules < 4) fail(`${scenario}: poluzowanie reguł nie domknęło czekających spraw (${closedByRules} domkniętych)`);
    // sprawy ponad maksymalny próg suwaka nadal wymagają człowieka — zatwierdzamy je ręcznie
    while (await page.locator('.sbx-q.is-waiting').count()) {
      await page.locator('.sbx-q.is-waiting').first().click();
      await page.click('[data-act="approve"]');
      await page.waitForFunction(() => !document.querySelector('.sbx-q.is-selected.is-waiting, .sbx-q.is-running'), null, { timeout: 15000 });
    }
    s = await statuses();
    if (s.some((x) => x === 'new' || x === 'waiting' || x === 'running')) fail(`${scenario}: kolejka nieobsłużona do końca: ${s.join(',')}`);

    await page.click('[data-sbx-tab="log"]');
    const logCount = await page.locator('.sbx-log__item').count();
    if (logCount < 20) fail(`${scenario}: dziennik ma tylko ${logCount} wpisów`);
    const metric = await page.locator('.sbx-metric strong').first().innerText();
    if (!/^6 \/ 6$/.test(metric.trim())) fail(`${scenario}: metryka „Obsłużone” = ${metric}`);
    await page.screenshot({ path: path.join(OUT, `sandbox-${scenario}-${vp.name}.png`) });
  }

  // odrzucenie + reset
  await page.click('[data-sbx-reset]');
  if ((await statuses()).some((x) => x !== 'new')) fail('reset nie przywrócił kolejki');
  await page.click('[data-sbx-run]');
  await page.waitForSelector('.sbx-q.is-waiting', { timeout: 60000 });
  await page.locator('.sbx-q.is-waiting').first().click();
  await page.click('[data-act="reject"]');
  if (!(await page.locator('.sbx-q.is-selected.is-rejected').count())) fail('odrzucenie nie zmieniło statusu sprawy');

  // klawiatura: zakładki panelu bocznego
  await page.focus('[data-sbx-tab="log"]');
  await page.keyboard.press('ArrowRight');
  if ((await page.getAttribute('[data-sbx-tab="rules"]', 'aria-selected')) !== 'true') fail('strzałki nie przełączają zakładek');
  await ctx.close();
}

async function auditInteractions(browser, base, problems) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const fail = (msg) => problems.push(`interakcje: ${msg}`);
  page.on('pageerror', (e) => fail(`pageerror: ${e.message}`));

  // Strona główna: przełącznik funkcji, kalkulator, FAQ, formularz hero
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const triggers = page.locator('[data-fs]').first().locator('[data-fs-trigger]');
  await triggers.nth(2).click();
  if ((await triggers.nth(2).getAttribute('aria-expanded')) !== 'true') fail('akordeon funkcji nie reaguje');
  const activePanels = await page.locator('[data-fs]').first().locator('[data-fs-panels] > .is-active').count();
  if (activePanels !== 1) fail(`aktywnych paneli: ${activePanels}`);

  const before = await page.locator('[data-res="hours"]').innerText();
  await page.locator('#calc-cases').fill('8000');
  const after = await page.locator('[data-res="hours"]').innerText();
  if (before === after) fail('kalkulator nie przelicza wyniku');

  await page.locator('.faq__item summary').first().click();
  if (!(await page.locator('.faq__item').first().getAttribute('open')) === null) fail('FAQ się nie otwiera');

  // Hero: przewijanie prowadzi kamerę przez bramę — ekran konsoli rośnie do szerokości okna
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const screenWidth = () => page.evaluate(() => document.querySelector('.cine__screen').getBoundingClientRect().width);
  const w0 = await screenWidth();
  await page.evaluate(() => window.scrollTo(0, document.querySelector('[data-cine]').offsetHeight - window.innerHeight));
  await page.waitForTimeout(500);
  const w1 = await screenWidth();
  if (!(w0 < 520 && w1 > 1300)) fail(`najazd kamery w hero nie działa: ekran ${Math.round(w0)} → ${Math.round(w1)} px`);
  const filmRuns = await page.waitForFunction(() => document.querySelectorAll('[data-film="hero"] .sbx-log__item').length > 2, null, { timeout: 20000 }).then(() => true).catch(() => false);
  if (!filmRuns) fail('film w hero nie odtwarza się');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  await page.fill('#hero-email', 'anna@firma.example');
  await Promise.all([page.waitForURL('**/kontakt/**'), page.click('.hero__form button')]);
  if ((await page.inputValue('#f-email')) !== 'anna@firma.example') fail('e-mail z hero nie trafił do formularza kontaktowego');
  if (page.url().includes('anna')) fail('adres e-mail pozostał w adresie URL');
  if (await page.evaluate(() => window.sessionStorage.length)) fail('adres e-mail pozostał w pamięci sesji po przeniesieniu');

  // Kontakt: walidacja
  await page.fill('#f-email', 'zly-adres');
  await page.click('.form button[type="submit"]');
  if ((await page.getAttribute('#f-name', 'aria-invalid')) !== 'true') fail('brak walidacji pola „Imię i nazwisko”');
  if ((await page.getAttribute('#f-email', 'aria-invalid')) !== 'true') fail('brak walidacji e-maila');

  // Automatyzacje: zakładki przepływu
  await page.goto(base + '/automatyzacje/', { waitUntil: 'networkidle' });
  await page.locator('[data-pipe] [role="tab"]').nth(1).click();
  if (await page.locator('[data-pipe] [role="tabpanel"]').nth(1).isHidden()) fail('zakładki przepływu nie przełączają panelu');
  await ctx.close();

  // Menu mobilne
  const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await m.newPage();
  await mp.goto(base + '/', { waitUntil: 'networkidle' });
  await mp.click('[data-menu-toggle]');
  await mp.waitForTimeout(500);
  if (await mp.locator('[data-menu]').isHidden()) fail('menu mobilne się nie otwiera');
  await mp.screenshot({ path: path.join(OUT, 'menu-mobile.png') });
  await mp.keyboard.press('Escape');
  await mp.waitForTimeout(400);
  if (await mp.locator('[data-menu]').isVisible()) fail('Escape nie zamyka menu');
  await m.close();

  // prefers-reduced-motion: treść widoczna, brak błędów
  const r = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const rp = await r.newPage();
  rp.on('pageerror', (e) => fail(`reduced-motion pageerror: ${e.message}`));
  await rp.goto(base + '/', { waitUntil: 'networkidle' });
  const hidden = await rp.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity !== '1').length);
  if (hidden) fail(`reduced-motion: ${hidden} elementów pozostaje ukrytych`);
  await r.close();

  // Bez JavaScriptu treść musi pozostać czytelna
  const n = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const np = await n.newPage();
  await np.goto(base + '/', { waitUntil: 'load' });
  const noJs = await np.evaluate(() => ({
    hidden: [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity !== '1').length,
    h1: document.querySelector('h1')?.textContent,
  }));
  if (noJs.hidden) fail(`bez JS: ${noJs.hidden} elementów ukrytych`);
  await n.close();
}

(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('Brak katalogu dist/ — najpierw uruchom `npm run build`.');
    process.exit(2);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const problems = [];
  const links = new Set();

  for (const route of PAGES) {
    for (const vp of VIEWPORTS) {
      const found = await auditPage(browser, base, route, vp, problems);
      found.forEach((l) => links.add(l));
    }
    process.stdout.write(`✓ ${route}\n`);
  }

  for (const href of links) {
    const clean = href.split('#')[0].split('?')[0];
    const file = path.join(DIST, clean.endsWith('/') ? clean + 'index.html' : clean);
    if (!fs.existsSync(file)) problems.push(`martwy link wewnętrzny: ${href}`);
  }
  process.stdout.write(`✓ linki wewnętrzne (${links.size})\n`);

  await auditSandbox(browser, base, VIEWPORTS[0], problems);
  await auditSandbox(browser, base, VIEWPORTS[2], problems);
  process.stdout.write('✓ sandbox (desktop + mobile)\n');

  await auditInteractions(browser, base, problems);
  process.stdout.write('✓ interakcje, menu mobilne, reduced-motion, bez JS\n');

  await browser.close();
  server.close();

  // Budżet wagi: HTML + CSS + JS strony głównej (bez fontów)
  const weigh = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((sum, e) => {
    const p = path.join(dir, e.name);
    return sum + (e.isDirectory() ? weigh(p) : /\.(js|css)$/.test(e.name) ? fs.statSync(p).size : 0);
  }, 0);
  const assetsKb = Math.round(weigh(DIST) / 1024);
  const fontsKb = Math.round(fs.readdirSync(path.join(DIST, '_astro')).filter((f) => f.endsWith('.woff2')).reduce((s, f) => s + fs.statSync(path.join(DIST, '_astro', f)).size, 0) / 1024);
  console.log(`\nWaga: JS+CSS łącznie ${assetsKb} kB (nieskompresowane), fonty ${fontsKb} kB (wszystkie podzbiory).`);
  if (assetsKb > 400) problems.push(`JS+CSS przekracza budżet 400 kB: ${assetsKb} kB`);

  if (problems.length) {
    console.log(`\n✗ Problemy (${problems.length}):`);
    problems.forEach((p) => console.log('  - ' + p));
    process.exit(1);
  }
  console.log(`\n✓ Audyt bez zastrzeżeń: ${PAGES.length} stron × ${VIEWPORTS.length} szerokości. Zrzuty: audit-output/`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
