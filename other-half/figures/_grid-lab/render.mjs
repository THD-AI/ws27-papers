// Renders the grid lab: every variant at every step, desktop (wide, 860 px
// frame) and phone (tall, 360 px frame), one PNG per state into png/, and
// two contact sheets (steps 0, 3 and 5; rows current, a, b).
//   node articles/other-half/figures/_grid-lab/render.mjs [variants]
import { mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from '../../../../tools/serve.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const VS = (process.argv[2] || 'current,a,b').split(',');
const SHEETS = !process.argv.includes('--no-sheets');
const out = join(HERE, 'png');
mkdirSync(out, { recursive: true });
const { server, port } = await startServer(ROOT, 0);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const base = `http://127.0.0.1:${port}/articles/other-half/figures/_grid-lab/lab.html`;

async function shot(query, file, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 600, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => console.log('page error', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
  await page.goto(`${base}?${query}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__lab && window.__lab.ready, { timeout: 20000 });
  const r = await page.evaluate(() => window.__lab);
  if (r.error) console.log(r.error);
  const el = await page.$('#lab');
  await el.screenshot({ path: join(out, file) });
  await page.close();
  return r.report || [];
}

const lines = [];
for (const v of VS) for (let s = 0; s < 6; s++) {
  lines.push(...await shot(`v=${v}&steps=${s}&layout=wide&bare=1`, `${v}-desktop-step${s}.png`, 900));
  lines.push(...await shot(`v=${v}&steps=${s}&layout=tall&w=360&bare=1`, `${v}-phone-step${s}.png`, 400));
}
lines.push(...await shot(`v=${VS.join(',')}&steps=0,3,5&layout=wide`, 'sheet-desktop.png', 2700));
lines.push(...await shot(`v=${VS.join(',')}&steps=0,1,2,3,4,5&layout=tall&w=360`, 'sheet-phone.png', 2400));
// height of the tall layout at 336 px across
lines.push(...await shot(`v=${VS.join(',')}&steps=5&layout=tall&w=336`, 'phone336-step5.png', 400));
console.log(lines.filter((l) => /step (0|3|5)/.test(l) || l.includes(' 336 ')).join('\n'));
await browser.close();
server.close();
