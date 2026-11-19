// Renders the talk deck: one PNG per build, the PDF (one page per build),
// contact sheets for review, and the gates (lettering floors, nothing off the
// page, nothing in the bottom band but the source line and the page number).
//   node tools/deck.mjs [renovate]
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const talk = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'renovate';
const V = process.argv.includes('--v2') ? '&v=2' : '';
const OUT = join(ROOT, '.shots', 'deck', talk + (process.argv.includes('--v2') ? '-v2' : ''));
mkdirSync(OUT, { recursive: true });

const { server, port } = await startServer(ROOT, 0);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('requestfailed', (r) => errs.push(`failed: ${r.url()}`));
page.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()}: ${r.url()}`); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${port}/talks/${talk}/index.html?print=1${V}`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.__deck && window.__deck.ready', { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);

// Gates, measured on the drawn SVG text. Floors from the talk plan: nothing
// under 32 px except the source line and the page number (bottom band).
const report = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.page').forEach((pg) => {
    const n = pg.dataset.page, id = pg.dataset.slide;
    const small = [], off = [], band = [], overlap = [];
    const boxes = [];
    pg.querySelectorAll('text').forEach((t) => {
      const fs = parseFloat(t.getAttribute('font-size')) || 0;
      const b = t.getBBox();
      const label = (t.textContent || '').slice(0, 40);
      const inBand = b.y + b.height > 1000;
      if (fs < (/^b\d/.test(id) ? 24 : 32) && !inBand) small.push(`${fs}px "${label}"`);
      if (b.x < 40 || b.x + b.width > 1880 || b.y < 30 || b.y + b.height > 1068) off.push(`"${label}"`);
      if (inBand && fs > 28) band.push(`"${label}"`);
      boxes.push({ b, label });
    });
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].b, c = boxes[j].b;
      const ix = Math.min(a.x + a.width, c.x + c.width) - Math.max(a.x, c.x);
      const iy = Math.min(a.y + a.height, c.y + c.height) - Math.max(a.y, c.y);
      if (ix > 4 && iy > 6) overlap.push(`"${boxes[i].label}" x "${boxes[j].label}"`);
    }
    out.push({ n, id, small, off, band, overlap });
  });
  return out;
});

const n = await page.evaluate(() => document.querySelectorAll('.page').length);
const els = await page.$$('.page');
for (let i = 0; i < n; i++) await els[i].screenshot({ path: join(OUT, `p${String(i + 1).padStart(2, '0')}.png`) });
await page.pdf({ path: join(OUT, `${talk}-deck.pdf`), width: '13.333in', height: '7.5in', scale: 2 / 3, printBackground: true, preferCSSPageSize: true });
// one page at a time, fitted, presentation mode where the viewer honours it
spawnSync('python', [join(ROOT, 'tools', 'deck_pdf_view.py'), join(OUT, `${talk}-deck.pdf`)], { stdio: 'inherit' });

// contact sheets, six pages each, for review
const imgs = Array.from({ length: n }, (_, i) => `http://localhost:${port}/.shots/deck/${basename(OUT)}/p${String(i + 1).padStart(2, '0')}.png`);
await page.goto(`http://localhost:${port}/`);
await page.setViewport({ width: 2880, height: 1100, deviceScaleFactor: 1 });
for (let s = 0; s * 6 < n; s++) {
  const part = imgs.slice(s * 6, s * 6 + 6);
  await page.setContent(`<style>body{margin:0;background:#C9CDD3;font:20px sans-serif}#s{padding:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}figure{margin:0}img{width:100%;display:block}figcaption{color:#333;padding:2px 0}</style><div id="s">${part.map((u, i) => `<figure><img src="${u}"><figcaption>page ${s * 6 + i + 1}</figcaption></figure>`).join('')}</div>`, { waitUntil: 'load' });
  await (await page.$('#s')).screenshot({ path: join(OUT, `sheet-${String(s + 1).padStart(2, '0')}.png`) });
}

// the cue sheet: page by page, what is on screen and the line he lands on
const cues = await (async () => {
  const pg = await browser.newPage();
  await pg.goto(`http://localhost:${port}/talks/${talk}/index.html?print=1${V}`, { waitUntil: 'networkidle0' });
  await pg.waitForFunction('window.__deck && window.__deck.ready');
  const out = await pg.evaluate(async () => {
    const { SLIDES } = await import(location.search.includes('v=2') ? './slides2.js' : './slides.js');
    return window.__deck.pages.map((p, i) => {
      const s = SLIDES[p.slide];
      const last = p.build === s.builds - 1;
      const notes = (s.notes || '').replace(/<b>(.*?)<\/b>/g, '**$1**').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return { page: i + 1, id: s.id, n: s.backup || (s.end ? 'end' : s.n), build: p.build + 1, builds: s.builds, start: p.build === 0 ? (s.start || '') : '', click: (s.clicks || [])[p.build] || '', title: s.landings ? (s.landings[p.build] || '') : last ? (s.title || '') : '', notes: p.build === 0 ? notes : '' };
    });
  });
  await pg.close();
  return out;
})();
const md = ["# Cue sheet: Renovate, don't repaint", '', 'Generated by `node tools/deck.mjs`. Page = the PDF page; type it in the viewer to jump. ' + (V ? 'The title is on the page from the first build; it is the line to say at the last build.' : 'The title appears on the last build of each slide and is the line to say.') + '', '', '| Page | Slide | Starts at | Build | On this click | Lands on |', '| ---: | --- | ---: | --- | --- | --- |'];
for (const c of cues) md.push(`| ${c.page} | ${c.n} | ${c.start} | ${c.build} of ${c.builds} | ${c.click} | ${c.title} |`);
md.push('', '## Notes by slide', '');
for (const c of cues) if (c.notes) md.push(`**${c.n} (page ${c.page}).** ${c.notes}`, '');
writeFileSync(join(ROOT, 'talks', talk, V ? 'CUES-v2.md' : 'CUES.md'), md.join('\n') + '\n');

const lines = [];
let bad = 0;
for (const r of report) {
  const issues = [];
  if (r.small.length) issues.push(`small: ${r.small.join('; ')}`);
  if (r.off.length) issues.push(`off page: ${r.off.join('; ')}`);
  if (r.band.length) issues.push(`in bottom band: ${r.band.join('; ')}`);
  if (r.overlap.length) issues.push(`overlap: ${r.overlap.join('; ')}`);
  if (issues.length) { bad++; lines.push(`page ${r.n} (${r.id}): ${issues.join(' | ')}`); }
}
writeFileSync(join(OUT, 'gates.txt'), lines.join('\n') + '\n');
console.log(`${n} pages; ${bad} with findings${errs.length ? `; errors: ${[...new Set(errs)].join(' / ')}` : ''}`);
if (lines.length) console.log(lines.slice(0, 60).join('\n'));
await browser.close();
server.close();
