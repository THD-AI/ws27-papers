// Builds the talk as ONE offline HTML file for presenting: every build
// pre-drawn as SVG, the three typefaces and the house drawing embedded, no
// network and no server. Double-click it, press F11, then Right / Left.
//   node tools/deck-offline.mjs [renovate]
// Writes .shots/deck/<talk>/<talk>-talk.html
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const talk = process.argv[2] || 'renovate';
const OUT = join(ROOT, '.shots', 'deck', talk);
mkdirSync(OUT, { recursive: true });

// 1. The fonts: the same request the deck makes, only the latin subsets, inlined.
const html0 = readFileSync(join(ROOT, 'talks', talk, 'index.html'), 'utf8');
const cssUrl = html0.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/)[1].replace(/&amp;/g, '&');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const css = await (await fetch(cssUrl, { headers: { 'user-agent': UA } })).text();
const blocks = css.split('/* ').slice(1).filter((b) => /^(latin|latin-ext) \*\//.test(b));
const cache = new Map();
let fontCss = '';
for (const b of blocks) {
  const url = b.match(/url\((https:[^)]+)\)/)[1];
  if (!cache.has(url)) cache.set(url, Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64'));
  fontCss += b.slice(b.indexOf('*/') + 2).replace(url, `data:font/woff2;base64,${cache.get(url)}`) + '\n';
}

// 2. Every page drawn once, in the deck's own print mode.
const { server, port } = await startServer(ROOT, 0);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(`http://localhost:${port}/talks/${talk}/index.html?print=1`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.__deck && window.__deck.ready', { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
const pages = await page.evaluate(async () => {
  const { SLIDES } = await import('./slides.js');
  const els = [...document.querySelectorAll('.page')];
  return window.__deck.pages.map((p, i) => {
    const s = SLIDES[p.slide];
    return {
      svg: els[i].querySelector('svg').outerHTML,
      n: s.backup || (s.end ? 'end' : `${s.n}`),
      build: p.build + 1, builds: s.builds,
      click: (s.clicks || [])[p.build] || '',
      start: s.start || '',
      notes: p.build === 0 || p.build === s.builds - 1 ? (s.notes || '') : '',
    };
  });
});
await browser.close();
server.close();

// 3. The drawing once, as a data URI the pages point to at show time.
const HOUSE = '../../articles/renovate/art/house.png';
const house = `data:image/png;base64,${readFileSync(join(ROOT, 'articles', talk, 'art', 'house.png')).toString('base64')}`;
for (const p of pages) p.svg = p.svg.split(HOUSE).join('%HOUSE%');

const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Renovate, don’t repaint: the talk</title>
<style>
${fontCss}
html, body { margin: 0; height: 100%; background: #111214; overflow: hidden; }
#stage { position: fixed; inset: 0; }
#slide { position: absolute; left: 50%; top: 50%; width: 1920px; height: 1080px; background: #FBFBFC; transform-origin: center center; }
#slide svg { display: block; width: 1920px; height: 1080px; }
#notes { position: fixed; left: 0; right: 0; bottom: 0; max-height: 36vh; overflow: auto; background: #FBFBFC; color: #15171C;
  font: 19px/1.5 'Libre Franklin', Arial, sans-serif; padding: 14px 28px; box-shadow: 0 -1px 0 #DADDE3; }
#notes .where { color: #5C6370; font-size: 15px; }
#help { position: fixed; right: 12px; top: 10px; color: #8A9099; font: 13px 'Libre Franklin', Arial, sans-serif; opacity: 0.8; }
body.clean #help { display: none; }
</style>
</head>
<body>
<div id="stage"><div id="slide"></div></div>
<aside id="notes" hidden></aside>
<div id="help">F11 full screen, Right or Space next, Left back, N notes, G go to page (this hint hides after the first key)</div>
<script>
var PAGES = ${JSON.stringify(pages)};
var HOUSE = ${JSON.stringify(house)};
var slide = document.getElementById('slide'), notes = document.getElementById('notes');
var n = Math.max(0, Math.min(PAGES.length - 1, (parseInt((location.hash || '').slice(1), 10) || 1) - 1));
function fit() { var k = Math.min(innerWidth / 1920, innerHeight / 1080); slide.style.transform = 'translate(-50%, -50%) scale(' + k + ')'; }
function show(k) {
  n = Math.max(0, Math.min(PAGES.length - 1, k));
  var p = PAGES[n];
  slide.innerHTML = p.svg.split('%HOUSE%').join(HOUSE);
  notes.innerHTML = '<div class="where">Page ' + (n + 1) + ' of ' + PAGES.length + ', slide ' + p.n + ', build ' + p.build + ' of ' + p.builds
    + (p.start ? ', starts at ' + p.start : '') + (p.click ? ': ' + p.click : '') + '</div>' + p.notes;
  history.replaceState(null, '', '#' + (n + 1));
}
addEventListener('resize', fit);
addEventListener('keydown', function (e) {
  document.body.classList.add('clean');
  if (['ArrowRight', ' ', 'PageDown', 'Enter', 'ArrowDown'].indexOf(e.key) >= 0) { e.preventDefault(); show(n + 1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace', 'ArrowUp'].indexOf(e.key) >= 0) { e.preventDefault(); show(n - 1); }
  else if (e.key === 'Home') show(0);
  else if (e.key === 'End') show(PAGES.length - 1);
  else if (e.key === 'n' || e.key === 'N') notes.hidden = !notes.hidden;
  else if (e.key === 'g' || e.key === 'G') { var k = parseInt(prompt('Go to page (1–' + PAGES.length + ')'), 10); if (k) show(k - 1); }
});
slide.addEventListener('click', function () { document.body.classList.add('clean'); show(n + 1); });
fit(); show(n);
</script>
</body>
</html>
`;
const file = join(OUT, `${talk}-talk.html`);
writeFileSync(file, doc);
console.log(`${pages.length} pages, ${(doc.length / 1e6).toFixed(1)} MB, fonts ${cache.size} files -> ${file}`);
