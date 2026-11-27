// Builds the talk as ONE offline HTML file for presenting: every build
// pre-drawn as SVG, the three typefaces and the house drawing embedded, no
// network and no server. Double-click it, press F11, then Right / Left.
//   node tools/deck-offline.mjs [renovate] [--site]
// Writes .shots/deck/<talk>-v2/<talk>-talk.html. slides2.js is the only deck;
// --v2 is still accepted and changes nothing (v1 is under the tag
// archive/renovate-deck-v1).
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const talk = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'renovate';
const OUT = join(ROOT, '.shots', 'deck', `${talk}-v2`);
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
  const { SLIDES } = await import('./slides2.js');
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

// 3. Each drawing (and the Virgil face) once, as a data URI the pages point
// to at show time. The deck draws from its article's art. (The Quantum talk is
// built by tools/qtalk-site.mjs.)
const PREFIXES = [[`../../articles/${talk}/art/`, join(ROOT, 'articles', talk, 'art')]];
const MIME = { png: 'image/png', woff2: 'font/woff2' };
const ART = {};
for (const p of pages) {
  for (const [prefix, dir] of PREFIXES) {
    p.svg = p.svg.split(prefix).map((part, i) => {
      if (i === 0) return part;
      const m = part.match(/^[\w.-]+\.(png|woff2)/);
      if (!m) return prefix + part;
      const f = m[0];
      if (!ART[f]) ART[f] = `data:${MIME[m[1]]};base64,${readFileSync(join(dir, f)).toString('base64')}`;
      return `%ART:${f}%` + part.slice(f.length);
    }).join('');
  }
}

const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Renovate, don’t repaint: the talk</title>
<style>
${fontCss}
html, body { margin: 0; height: 100%; background: #111214; overflow: hidden; }
#stage { position: fixed; inset: 0; }
#slide { position: absolute; left: 50%; top: 50%; width: 1920px; height: 1080px; background: #FBFBFC; transform-origin: center center; }
#slide svg { display: block; width: 1920px; height: 1080px; }
#slide a { cursor: pointer; }
#notes { position: fixed; left: 0; right: 0; bottom: 0; max-height: 36vh; overflow: auto; background: #FBFBFC; color: #15171C;
  font: 19px/1.5 'Libre Franklin', Arial, sans-serif; padding: 14px 28px; box-shadow: 0 -1px 0 #DADDE3; }
#notes .where { color: #5C6370; font-size: 15px; }
/* in full screen the room sees the screen: the notes never show there */
body.full #notes { display: none !important; }
</style>
</head>
<body>
<div id="stage"><div id="slide"></div></div>
<aside id="notes" hidden></aside>
<script>
var PAGES = ${JSON.stringify(pages)};
var ART = ${JSON.stringify(ART)};
var slide = document.getElementById('slide'), notes = document.getElementById('notes');
var n = Math.max(0, Math.min(PAGES.length - 1, (parseInt((location.hash || '').slice(1), 10) || 1) - 1));
function fit() { var k = Math.min(innerWidth / 1920, innerHeight / 1080); slide.style.transform = 'translate(-50%, -50%) scale(' + k + ')'; }
function show(k) {
  n = Math.max(0, Math.min(PAGES.length - 1, k));
  var p = PAGES[n];
  slide.innerHTML = p.svg.replace(/%ART:([^%]+)%/g, function (m, f) { return ART[f]; });
  notes.innerHTML = '<div class="where">Page ' + (n + 1) + ' of ' + PAGES.length + ', slide ' + p.n + ', build ' + p.build + ' of ' + p.builds
    + (p.start ? ', starts at ' + p.start : '') + (p.click ? ': ' + p.click : '') + '</div>' + p.notes;
  history.replaceState(null, '', '#' + (n + 1));
}
// Full screen = the Fullscreen API, the browser's own full screen (F11) or a
// window as large as the screen. In full screen the notes are hidden.
function isFull() { return !!document.fullscreenElement || matchMedia('(display-mode: fullscreen)').matches || (Math.abs(innerHeight - screen.height) < 3 && Math.abs(innerWidth - screen.width) < 3); }
function mode() { document.body.classList.toggle('full', isFull()); }
addEventListener('resize', function () { fit(); mode(); });
document.addEventListener('fullscreenchange', mode);
addEventListener('keydown', function (e) {
  document.body.classList.add('clean');
  if (['ArrowRight', ' ', 'PageDown', 'Enter', 'ArrowDown'].indexOf(e.key) >= 0) { e.preventDefault(); show(n + 1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace', 'ArrowUp'].indexOf(e.key) >= 0) { e.preventDefault(); show(n - 1); }
  else if (e.key === 'Home') show(0);
  else if (e.key === 'End') show(PAGES.length - 1);
  else if (e.key === 'n' || e.key === 'N') notes.hidden = !notes.hidden;
  else if (e.key === 'f' || e.key === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(function () {}); }
  else if (e.key === 'g' || e.key === 'G') { var k = parseInt(prompt('Go to page (1–' + PAGES.length + ')'), 10); if (k) show(k - 1); }
});
slide.addEventListener('click', function (e) { if (e.target.closest('a')) return; document.body.classList.add('clean'); show(n + 1); });
// The wheel: one notch, one page. A clicker or the Flipper's Slides remote scrolls.
var wheelAt = 0, wheelSum = 0;
addEventListener('wheel', function (e) {
  if (e.target.closest && e.target.closest('#notes')) return; // the notes scroll
  e.preventDefault();
  var now = Date.now();
  if (now - wheelAt > 400) wheelSum = 0;
  wheelSum += e.deltaY;
  if (Math.abs(wheelSum) >= 30 && now - wheelAt > 250) { document.body.classList.add('clean'); show(n + (wheelSum > 0 ? 1 : -1)); wheelAt = now; wheelSum = 0; }
}, { passive: false });
fit(); mode(); show(n);
</script>
</body>
</html>
`;
const file = join(OUT, `${talk}-talk.html`);
writeFileSync(file, doc);
// --site: the same file as the site's page for the talk, dist/<talk>/talk/ (after lib/build.mjs, which rewrites dist/<talk>)
if (process.argv.includes('--site')) {
  const site = join(ROOT, 'dist', talk, 'talk');
  mkdirSync(site, { recursive: true });
  writeFileSync(join(site, 'index.html'), doc);
  console.log(`site page -> ${join(site, 'index.html')}`);
}
console.log(`${pages.length} pages, ${(doc.length / 1e6).toFixed(1)} MB, fonts ${cache.size} files, drawings ${Object.keys(ART).join(', ')} -> ${file}`);
