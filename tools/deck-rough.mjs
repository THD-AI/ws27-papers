// Renders the v4 quantum deck's rough frames: one PNG per build (p01.png…),
// a contact sheet of the main pages with each slide's landing line as a
// caption, and a second sheet for the end slide and the backups.
//   node tools/deck-rough.mjs        -> .shots/v4-rough/
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = join(ROOT, '.shots', 'v4-rough');
mkdirSync(OUT, { recursive: true });

const { server, port } = await startServer(ROOT, 0);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()}: ${r.url()}`); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${port}/talks/quantum-v4/index.html?print=1`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.__deck && window.__deck.ready', { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);

const meta = await page.evaluate(async () => {
  const { SLIDES } = await import('./slides.js');
  return window.__deck.pages.map((p, i) => {
    const s = SLIDES[p.slide];
    const kind = s.backup ? s.backup : s.end ? 'E' : String(s.n);
    return { page: i + 1, main: !s.backup && !s.end, kind, build: p.build + 1, builds: s.builds, line: s.landing || s.title || '' };
  });
});
const els = await page.$$('.page');
for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: join(OUT, `p${String(i + 1).padStart(2, '0')}.png`) });

async function sheet(list, file, cols) {
  const img = (m) => `http://localhost:${port}/.shots/v4-rough/p${String(m.page).padStart(2, '0')}.png`;
  const html = `<style>body{margin:0;background:#C9CDD3;font:17px/1.25 Arial,sans-serif}#s{padding:12px;display:grid;grid-template-columns:repeat(${cols},480px);gap:14px 12px}
  figure{margin:0}img{width:480px;display:block;box-shadow:0 0 0 1px #9AA0AA}figcaption{color:#222;padding:4px 2px 0;height:44px;overflow:hidden}
  b{font-size:19px;margin-right:6px}</style><div id="s">${list.map((m) => `<figure><img src="${img(m)}"><figcaption><b>${m.page}</b> ${m.kind}.${m.build}/${m.builds} · ${m.line}</figcaption></figure>`).join('')}</div>`;
  await page.setViewport({ width: cols * 492 + 40, height: 800, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await (await page.$('#s')).screenshot({ path: join(OUT, file) });
}
await sheet(meta.filter((m) => m.main), 'contact.png', 6);
await sheet(meta.filter((m) => !m.main), 'backups.png', 5);
console.log(`${meta.length} pages (${meta.filter((m) => m.main).length} main)${errs.length ? `; errors: ${[...new Set(errs)].join(' / ')}` : ''}`);
await browser.close();
server.close();
