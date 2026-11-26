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
const raw = await page.evaluate(() => [...document.querySelectorAll('.s')].map((el) => ({ id: el.id, svg: el.innerHTML })));
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
const PAGES = raw.map(({ id, svg }) => {
  const backup = id.startsWith('b');
  const label = backup ? `backup ${id.slice(1)}` : `${++n} / 18`;
  const note = backup ? null : notes[n];
  return { id, label, svg, say: note ? note.say : '', term: note ? note.term : '' };
});
if (n !== 18) throw new Error(`expected 18 main pages, found ${n}`);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>The other half of a quantum computer: the talk</title>
<style>
${fontCss}
html, body { margin: 0; background: #1b1d22; color: #FBFBFC; font-family: 'Libre Franklin', sans-serif; height: 100%; overflow: hidden; }
#bar { position: fixed; left: 0; right: 0; top: 0; height: 40px; display: flex; align-items: center; gap: 24px; padding: 0 16px; font-size: 14px; color: #B9BEC8; }
#bar a { color: #FBFBFC; }
#bar .pg { margin-left: auto; font-family: 'JetBrains Mono', monospace; }
#stage { position: absolute; left: 0; right: 0; top: 40px; bottom: 0; display: flex; align-items: center; justify-content: center; }
#slide { width: 1920px; height: 1080px; background: #FBFBFC; transform-origin: center center; flex: none; cursor: pointer; }
#slide svg { display: block; }
#notes { position: fixed; left: 0; right: 0; bottom: 0; max-height: 34vh; overflow: auto; background: #FBFBFC; color: #15171C; padding: 16px 24px; font-size: 20px; line-height: 1.45; box-shadow: 0 -2px 12px rgba(0,0,0,.4); }
#notes em { color: #4A505B; }
body.full #bar, body.full #notes { display: none; }
body.full #stage { top: 0; }
#print { display: none; }
@page { size: 13.333in 7.5in; margin: 0; }
@media print {
  html, body { background: #FBFBFC; height: auto; overflow: visible; }
  #bar, #stage, #notes { display: none !important; }
  #print { display: block; }
  #print .page { width: 1920px; height: 1080px; zoom: 0.6667; break-after: page; background: #FBFBFC; overflow: hidden; }
}
</style>
</head>
<body>
<header id="bar"><a href="../">The other half of a quantum computer</a><span>the talk · Quantum Computing seminar, TH Deggendorf, 9 January 2027</span><span>Right or click: next · Left: back · N: notes · F: full screen · Ctrl+P: print</span><span>Drawings after a photograph by Lars Ploughman, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a></span><span class="pg" id="pg"></span></header>
<div id="stage"><div id="slide" role="img"></div></div>
<aside id="notes" hidden></aside>
<div id="print"></div>
<script>
var PAGES = ${JSON.stringify(PAGES.map(({ svg, ...p }) => p))};
var SVG = ${JSON.stringify(PAGES.map((p) => p.svg))};
var IMAGES = ${JSON.stringify(IMAGES)};
function art(s) { return s.replace(/href="(heap|read)\\.png"/g, function (_, f) { return 'href="' + IMAGES[f + '.png'] + '"'; }); }
var i = Math.max(0, Math.min(PAGES.length - 1, (parseInt(location.hash.slice(1), 10) || 1) - 1));
var slide = document.getElementById('slide'), notes = document.getElementById('notes'), pg = document.getElementById('pg');
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function show() {
  slide.innerHTML = art(SVG[i]);
  var p = PAGES[i];
  slide.setAttribute('aria-label', 'page ' + p.label);
  pg.textContent = p.label;
  notes.innerHTML = p.say ? esc(p.say) + (p.term ? ' <em>The field’s word: ' + esc(p.term) + '.</em>' : '') : '<em>No notes for this page.</em>';
  history.replaceState(null, '', '#' + (i + 1));
  fit();
}
function fit() {
  var st = document.getElementById('stage').getBoundingClientRect();
  slide.style.transform = 'scale(' + Math.min(st.width / 1920, st.height / 1080) + ')';
}
function go(d) { i = Math.max(0, Math.min(PAGES.length - 1, i + d)); show(); }
function isFull() { return !!document.fullscreenElement || (Math.abs(innerHeight - screen.height) < 3 && Math.abs(innerWidth - screen.width) < 3); }
function mode() { document.body.classList.toggle('full', isFull()); fit(); }
addEventListener('resize', mode);
document.addEventListener('fullscreenchange', mode);
slide.addEventListener('click', function () { go(1); });
addEventListener('keydown', function (e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
  else if (e.key === 'Home') { i = 0; show(); }
  else if (e.key === 'End') { i = 17; show(); }
  else if (e.key === 'n' || e.key === 'N') { notes.hidden = !notes.hidden; }
  else if (e.key === 'f' || e.key === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(function () {}); }
});
addEventListener('beforeprint', function () {
  document.getElementById('print').innerHTML = SVG.map(function (s) { return '<div class="page">' + art(s) + '</div>'; }).join('');
});
show(); mode();
</script>
</body>
</html>
`;
writeFileSync(join(OUT, 'quantum-talk.html'), html);
console.log('wrote', join(OUT, 'quantum-talk.html'), `${(html.length / 1e6).toFixed(1)} MB`, `${PAGES.length} pages`);
if (process.argv.includes('--site')) {
  const dir = join(ROOT, 'dist', 'other-half', 'talk');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  console.log('wrote', join(dir, 'index.html'));
}
