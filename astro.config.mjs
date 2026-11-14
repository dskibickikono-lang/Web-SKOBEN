import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Polska typografia: jednoliterowe spójniki i przyimki (a, i, o, u, w, z)
 * nie mogą zostawać na końcu wiersza. Po zbudowaniu strony zamieniamy spację
 * po nich na twardą — w węzłach tekstowych, z pominięciem skryptów i stylów.
 */
function polishTypography() {
  const SKIP = /(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/g;
  const ORPHAN = /(^|[\s\u00a0(„”"—–])([aiouwzAIOUWZ])[ \t\n]+(?=\S)/g;
  const fix = (text) => text.replace(ORPHAN, '$1$2\u00a0').replace(ORPHAN, '$1$2\u00a0');

  const walk = async (dir) => {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) out.push(...(await walk(p)));
      else if (entry.name.endsWith('.html')) out.push(p);
    }
    return out;
  };

  return {
    name: 'skoben:polish-typography',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const files = await walk(fileURLToPath(dir));
        let count = 0;
        for (const file of files) {
          const html = await readFile(file, 'utf8');
          const next = html
            .split(SKIP)
            .map((part, i) => {
              if (i % 2 === 1) return part; // znacznik, skrypt lub styl
              const fixed = fix(part);
              if (fixed !== part) count++;
              return fixed;
            })
            .join('');
          if (next !== html) await writeFile(file, next);
        }
        logger.info(`twarde spacje po spójnikach: ${count} fragmentów w ${files.length} plikach`);
      },
    },
  };
}

// UWAGA: `site` to docelowy adres produkcyjny — do potwierdzenia przez właściciela
// (patrz src/config/site.ts). Wpływa na canonical, sitemap i robots.
export default defineConfig({
  site: 'https://skoben.pl',
  trailingSlash: 'always',
  integrations: [sitemap(), polishTypography()],
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
});
