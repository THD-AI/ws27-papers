// Frozen states of one figure, at desktop and phone width, for a quick look.
//
//   node tools/freeze.mjs <slug> <figure> [steps]
//
// Writes .shots/<slug>/freeze/<figure>-<step>-desktop.png and -phone.png.
// Run "node lib/build.mjs <slug>" first.
import { mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [slug, id, n = '1'] = process.argv.slice(2);
if (!slug || !id) { console.error('usage: node tools/freeze.mjs <slug> <figure> [steps]'); process.exit(1); }
const out = join(ROOT, '.shots', slug, 'freeze');
mkdirSync(out, { recursive: true });
const { server, port } = await startServer(join(ROOT, 'dist'), 0, {});
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = [];
const sizes = { desktop: { width: 1440, height: 900, deviceScaleFactor: 1 }, phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
for (let step = 0; step < +n; step++) for (const [name, vp] of Object.entries(sizes)) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(`${name} ${step}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${name} ${step}: ${m.text()}`); });
  await page.setViewport(vp);
  await page.goto(`http://127.0.0.1:${port}/${slug}/${name === "phone" ? "" : `?freeze=${id}:${step}:1`}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
  // the scene's sticky frame where it is shown; otherwise the still of this step
  let frame = null;
  for (const sel of [`[data-fig="${id}"][data-role="scene"] .fig-frame`, `[data-fig="${id}"][data-role="seq"][data-state="${step}"] .fig-frame`, `[data-fig="${id}"]:not([data-role="still"]) .fig-frame`]) {
    for (const el of await page.$$(sel)) if (await el.isVisible()) { frame = el; break; }
    if (frame) break;
  }
  // on a phone a pinned scene draws only while its passages are read: shoot the
  // screen as a reader sees it, with the step's passage at the reading line
  if (name === 'phone') {
    const passage = (await page.$$(`.scene[data-scene="${id}"] .passage`))[step];
    if (passage) {
      // scroll down in small moves until this passage is the active one, then a little further
      const all = await page.$$(`.scene[data-scene="${id}"] .passage`);
      await page.evaluate((el) => { const r = el.getBoundingClientRect(); window.scrollBy(0, r.top - window.innerHeight * 1.0); }, passage);
      for (let k = 0; k < 120; k++) {
        const active = await page.evaluate((els) => els.findIndex((e) => e.classList.contains('is-active')), all);
        if (active >= step) break;
        await page.evaluate(() => window.scrollBy(0, 12));
        await new Promise((r) => setTimeout(r, 40));
      }
      await page.evaluate(() => window.scrollBy(0, 60));
      await new Promise((r) => setTimeout(r, 2500));
      await page.screenshot({ path: join(out, `${id}-${step}-${name}.png`) });
      await page.close();
      continue;
    }
  }
  if (frame) { try { await frame.scrollIntoView(); await new Promise((r) => setTimeout(r, 700)); await frame.screenshot({ path: join(out, `${id}-${step}-${name}.png`) }); } catch (e) { errors.push(`${name} ${step}: ${e.message}`); } }
  else errors.push(`${name} ${step}: no frame for ${id}`);
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : `ok: ${n} steps of ${id} in .shots/${slug}/freeze/`);
