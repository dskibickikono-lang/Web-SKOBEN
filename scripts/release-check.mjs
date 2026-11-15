#!/usr/bin/env node
/**
 * Bramka publikacji: sprawdza, czy dane zależne od decyzji właściciela
 * zostały uzupełnione i potwierdzone. Build i audyt nie zależą od tej bramki —
 * uruchamiaj ją przed wdrożeniem na produkcję: `npm run check:release`.
 */
import { readFile } from 'node:fs/promises';

const company = JSON.parse(await readFile(new URL('../src/config/company.json', import.meta.url), 'utf8'));
const missing = [];

if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/.test(company.url)) missing.push('url — adres produkcyjny w formacie https://domena');
if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(company.contactEmail)) missing.push('contactEmail — adres do zapytań');
if (!company.legal.entity) missing.push('legal.entity — pełna nazwa podmiotu (administrator danych)');
if (!company.legal.nip) missing.push('legal.nip — NIP');
if (!company.legal.address) missing.push('legal.address — adres siedziby');
if (!company.confirmedByOwner)
  missing.push('confirmedByOwner — ustaw true po akceptacji domeny, adresu, deklaracji handlowych i treści polityki prywatności');

if (missing.length > 0) {
  console.error('Strona nie jest gotowa do publikacji. Uzupełnij src/config/company.json:\n');
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}
console.log('Dane firmy kompletne i potwierdzone — można publikować.');
