// Builds the 18-page Quantum talk (talks/quantum/v5) as ONE self-contained
// page: every page drawn once from the deck's source, the two drawings and
// the fonts embedded, no server or network at the talk. It is both the file
// to present from and the talk's page on the site (dist/other-half/talk/).
// Right, Space or a click: next. Left: back. Home, End. N: speaker notes.
// F: full screen. Ctrl+P: every page, one per sheet, at 13.333 x 7.5 in.
//   node tools/qtalk-site.mjs [--site]
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DECK = join(ROOT, 'talks', 'quantum', 'v5');
const require = createRequire(join(ROOT, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = join(ROOT, '.shots', 'deck', 'quantum-v5');
mkdirSync(OUT, { recursive: true });

// 1. Fonts: the latin subsets of the deck's Google fonts, and Excalifont, inlined.
const src = readFileSync(join(DECK, 'index.html'), 'utf8');
const cssUrl = src.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/)[1].replace(/&amp;/g, '&');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const css = await (await fetch(cssUrl, { headers: { 'user-agent': UA } })).text();
let fontCss = '';
for (const b of css.split('/* ').slice(1).filter((x) => /^(latin|latin-ext) \*\//.test(x))) {
  const url = b.match(/url\((https:[^)]+)\)/)[1];
  const data = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64');
  fontCss += b.slice(b.indexOf('*/') + 2).replace(url, `data:font/woff2;base64,${data}`) + '\n';
}
const excali = readFileSync(join(ROOT, 'lib', 'vendor', 'excalifont', 'Excalifont.woff2')).toString('base64');
fontCss += `@font-face { font-family: 'Excalifont'; src: url(data:font/woff2;base64,${excali}) format('woff2'); }\n`;

// 2. Every page, drawn once by the source page; its SVG kept as it is.
const { server, port } = await startServer(ROOT, 0);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(`http://localhost:${port}/talks/quantum/v5/index.html`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.DONE', { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
const raw = await page.evaluate(() => [...document.querySelectorAll('.s')].map((el) => ({
  id: el.id, svg: el.innerHTML,
  // the page's title: its big serif lines, in order
  title: [...el.querySelectorAll('text')].filter((t) => parseFloat(t.getAttribute('font-size') || getComputedStyle(t).fontSize) >= 60 && /Newsreader|serif/.test(t.getAttribute('font-family') || getComputedStyle(t).fontFamily) && !/Mono/.test(t.getAttribute('font-family') || getComputedStyle(t).fontFamily)).map((t) => t.textContent).join(' '),
})));
await browser.close();
server.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

// 3. The drawings, embedded once each and referenced by every page that uses them.
const img = (f) => `data:image/png;base64,${readFileSync(join(DECK, f)).toString('base64')}`;
const IMAGES = { 'heap.png': img('heap.png'), 'read.png': img('read.png') };

// 4. Page numbers and speaker notes (notes.md: a table, one row per page).
const notes = {};
for (const row of readFileSync(join(DECK, 'notes.md'), 'utf8').split(/\r?\n/)) {
  const m = row.match(/^\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/);
  if (m) notes[m[1]] = { say: m[2].replace(/&#124;/g, '|'), term: m[3] };
}
let n = 0;
const PAGES = raw.map(({ id, svg, title }) => {
  const backup = id.startsWith('b');
  const label = backup ? `backup ${id.slice(1)}` : `${++n} / 18`;
  const note = backup ? null : notes[n];
  return { id, label, backup, title: title || (n === 1 && !backup ? 'The other half of a quantum computer' : ''), svg, say: note ? note.say : '', term: note ? note.term : '' };
});
if (n !== 18) throw new Error(`expected 18 main pages, found ${n}`);

// 5. The player (talks/quantum/v5/player.html) with the fonts and pages poured in.
const data = { pages: PAGES.map(({ svg, ...p }) => p), svgs: PAGES.map((p) => p.svg), images: IMAGES };
const html = readFileSync(join(DECK, 'player.html'), 'utf8')
  .replace('/*__FONTS__*/', () => fontCss)
  .replace('/*__DATA__*/null', () => JSON.stringify(data).replace(/<\//g, '<\\/'));
writeFileSync(join(OUT, 'quantum-talk.html'), html);
console.log('wrote', join(OUT, 'quantum-talk.html'), `${(html.length / 1e6).toFixed(1)} MB`, `${PAGES.length} pages`);
if (process.argv.includes('--site')) {
  const dir = join(ROOT, 'dist', 'other-half', 'talk');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  console.log('wrote', join(dir, 'index.html'));
}
