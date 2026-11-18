// Zoomed renders for artifacts: the article's lattice (steps 1, 3, 5) and
// clock (every step), desktop (860 px frame) and phone (336 px frame), at
// 4 device pixels per CSS pixel (2x a retina screen), into png/zoom-*.png.
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from '../../../../tools/serve.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
const { server, port } = await startServer(ROOT, 0);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const base = `http://127.0.0.1:${port}/articles/other-half/figures/_grid-lab/lab.html`;
const jobs = [];
for (const s of [1, 3, 5]) jobs.push(['current', 'lattice', s]);
for (const s of [0, 1, 2, 3, 4]) jobs.push(['clock', 'clock', s]);
for (const [v, name, s] of jobs) for (const [lay, w, vw] of [['wide', 860, 900], ['tall', 336, 380]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: vw, height: 700, deviceScaleFactor: 4 });
  page.on('pageerror', (e) => console.log('page error', e.message));
  await page.goto(`${base}?v=${v}&steps=${s}&layout=${lay}&w=${w}&bare=1`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__lab && window.__lab.ready);
  const r = await page.evaluate(() => window.__lab);
  if (r.error) console.log(r.error);
  console.log(r.report.join('\n'));
  await (await page.$('.frame')).screenshot({ path: join(HERE, 'png', `zoom-${name}-${lay === 'wide' ? 'desktop' : 'phone'}-step${s}.png`) });
  await page.close();
}
await browser.close();
server.close();
