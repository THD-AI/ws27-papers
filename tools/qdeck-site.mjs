// Builds the Quantum talk as ONE self-contained page that is both the file to
// present from and the talk's page on the site (dist/other-half/talk/): every
// build drawn once in the deck's print mode (the article's figures, the hand
// strokes and all), fonts and drawings embedded, no server or network.
// Around the slides: a bar (the article, contents, references, thanks,
// keys), speaker notes, full screen, and Ctrl+P prints every page, one per
// sheet, at 13.333 x 7.5 in.
//   node tools/qdeck-site.mjs [--site]
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = join(ROOT, '.shots', 'deck', 'quantum');
mkdirSync(OUT, { recursive: true });

// 1. Fonts, latin subsets, inlined.
const html0 = readFileSync(join(ROOT, 'talks', 'quantum', 'index.html'), 'utf8');
const cssUrl = html0.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/)[1].replace(/&amp;/g, '&');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const css = await (await fetch(cssUrl, { headers: { 'user-agent': UA } })).text();
let fontCss = '';
for (const b of css.split('/* ').slice(1).filter((x) => /^(latin|latin-ext) \*\//.test(x))) {
  const url = b.match(/url\((https:[^)]+)\)/)[1];
  const data = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64');
  fontCss += b.slice(b.indexOf('*/') + 2).replace(url, `data:font/woff2;base64,${data}`) + '\n';
}
const virgil = readFileSync(join(ROOT, 'articles', 'other-half', 'art', 'film-virgil.woff2')).toString('base64');
fontCss += `@font-face { font-family: 'Virgil'; src: url(data:font/woff2;base64,${virgil}) format('woff2'); }\n`;
// Excalifont: the article figures' notes are set in it (lib/fig.js)
const excali = readFileSync(join(ROOT, 'lib', 'vendor', 'excalifont', 'Excalifont.woff2')).toString('base64');
fontCss += `@font-face { font-family: 'Excalifont'; src: url(data:font/woff2;base64,${excali}) format('woff2'); }\n`;

// 2. Every page, drawn once in print mode; its whole HTML kept.
const { server, port } = await startServer(ROOT, 0);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(`http://localhost:${port}/talks/quantum/index.html?print=1`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.__deck && window.__deck.ready', { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 500));
const pages = await page.evaluate(async () => {
  const { SLIDES } = await import('./slides.js');
  const els = [...document.querySelectorAll('.page')];
  return window.__deck.pages.map((p, i) => {
    const s = SLIDES[p.slide];
    return {
      html: els[i].innerHTML, id: s.id, title: s.title || '', dir: s.dir,
      n: s.backup ? s.n : s.end ? '' : `${s.n}`, backup: !!s.backup, end: !!s.end,
      build: p.build + 1, builds: s.builds, click: (s.clicks || [])[p.build] || '',
      notes: p.build === 0 ? (s.notes || '') : '',
    };
  });
});
const sources = JSON.parse(readFileSync(join(ROOT, 'articles', 'other-half', 'sources.json'), 'utf8'));
await browser.close();
server.close();

// 3. Each drawing once, as a data URI the pages point to.
// the article's figures name their drawings by absolute URL (import.meta.url)
const PREFIXES = [[`http://localhost:${port}/articles/other-half/art/`, join(ROOT, 'articles', 'other-half', 'art')], ['../../articles/other-half/art/', join(ROOT, 'articles', 'other-half', 'art')], ['./art/', join(ROOT, 'talks', 'quantum', 'art')]];
const ART = {};
for (const p of pages) for (const [prefix, dir] of PREFIXES) {
  p.html = p.html.split(prefix).map((part, i) => {
    if (i === 0) return part;
    const m = part.match(/^[\w.-]+\.(png|woff2)/);
    if (!m) return prefix + part;
    if (!ART[m[0]]) ART[m[0]] = `data:${m[1] === 'png' ? 'image/png' : 'font/woff2'};base64,${readFileSync(join(dir, m[0])).toString('base64')}`;
    return `%ART:${m[0]}%` + part.slice(m[0].length);
  }).join('');
}

// 4. References and thanks, from the article's own list and the deck's.
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const refs = Object.entries(sources).map(([id, s]) => `<li><b>${esc(s.title)}</b>. ${esc(s.publisher || s.author || '')}${s.date ? `, ${esc(s.date)}` : ''}. ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url.replace(/^https?:\/\//, ''))}</a>` : ''} <span class="id">${esc(id)}</span></li>`).join('');
const contents = [];
pages.forEach((p, i) => { if (p.build === 1) contents.push(`<li><a href="#${i + 1}" data-go="${i}"><span class="num">${p.backup ? p.n : p.end ? '·' : p.n}</span> ${esc(p.title)}</a></li>`); });

const ARTICLE = 'https://thd-ai.github.io/ws27-papers/other-half/';
const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="description" content="The talk for the Quantum Computing seminar at TH Deggendorf: the program that reads a quantum chip's errors, why a neural network can do it better, and what that costs. Built from the article The other half of a quantum computer.">
<title>The other half of a quantum computer: the talk</title>
<style>
${fontCss}
:root { --ink: #15171C; --muted: #5C6370; --paper: #FBFBFC; --accent: #4254C5; --hair: #DADDE3; }
html, body { margin: 0; height: 100%; background: #16171A; overflow: hidden; font-family: 'Libre Franklin', Arial, sans-serif; }
#stage { position: fixed; inset: 44px 0 0 0; }
body.full #stage { inset: 0; }
.page { position: absolute; width: 1920px; height: 1080px; background: var(--paper); overflow: hidden; }
#stage .page { left: 50%; top: 50%; transform-origin: center center; }
.page > svg { display: block; width: 1920px; height: 1080px; }
.page > svg.ink { position: absolute; left: 0; top: 0; pointer-events: none; }
.page a { cursor: pointer; }
#bar { position: fixed; left: 0; right: 0; top: 0; height: 44px; display: flex; align-items: center; gap: 4px; padding: 0 12px; background: #0E0F11; color: #E8EAEE; font-size: 15px; z-index: 5; }
#bar .name { font-weight: 600; margin-right: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#bar a, #bar button { color: #E8EAEE; background: none; border: 0; font: inherit; padding: 8px 10px; border-radius: 6px; cursor: pointer; text-decoration: none; white-space: nowrap; }
#bar a:hover, #bar button:hover { background: #25272C; }
#bar .where { color: #9AA1AD; font-variant-numeric: tabular-nums; padding: 0 8px; }
body.full #bar, body.full #notes { display: none !important; }
#notes { position: fixed; left: 0; right: 0; bottom: 0; max-height: 34vh; overflow: auto; background: var(--paper); color: var(--ink); font: 19px/1.5 'Libre Franklin', Arial, sans-serif; padding: 14px 28px; box-shadow: 0 -1px 0 var(--hair); z-index: 4; }
#notes .where { color: var(--muted); font-size: 15px; }
.panel { position: fixed; inset: 44px 0 0 auto; width: min(720px, 100%); background: var(--paper); color: var(--ink); overflow: auto; padding: 22px 30px 60px; box-shadow: -1px 0 0 var(--hair); z-index: 6; font-size: 17px; line-height: 1.55; }
.panel h2 { font-size: 22px; margin: 6px 0 12px; } .panel h3 { font-size: 17px; margin: 26px 0 6px; }
.panel ol, .panel ul { padding-left: 22px; } .panel li { margin: 6px 0; }
.panel a { color: var(--accent); } .panel .id { color: var(--muted); font-family: 'JetBrains Mono', monospace; font-size: 13px; }
.panel .num { display: inline-block; min-width: 2.2em; color: var(--muted); font-variant-numeric: tabular-nums; }
.panel .close { float: right; font-size: 15px; }
#print { display: none; }
@page { size: 13.333in 7.5in; margin: 0; }
@media print {
  html, body { height: auto; overflow: visible; background: #fff; }
  #bar, #stage, #notes, .panel { display: none !important; }
  #print { display: block; }
  #print .page { position: relative; zoom: 0.6667; break-after: page; }
}
</style>
</head>
<body>
<nav id="bar" aria-label="The talk">
  <span class="name">The other half of a quantum computer: the talk</span>
  <span class="where" id="where"></span>
  <button data-panel="contents">Contents</button>
  <a href="${ARTICLE}" target="_blank" rel="noopener">The article</a>
  <button data-panel="refs">References and thanks</button>
  <button data-panel="keys">Keys</button>
  <button id="full">Full screen</button>
</nav>
<div id="stage"></div>
<aside id="notes" hidden></aside>
<section class="panel" id="contents" hidden><button class="close" data-close>Close</button><h2>Contents</h2><ol style="list-style:none;padding-left:0">${contents.join('')}</ol></section>
<section class="panel" id="refs" hidden><button class="close" data-close>Close</button><h2>References and thanks</h2>
<p>This talk is built from the article <a href="${ARTICLE}" target="_blank" rel="noopener"><i>The other half of a quantum computer</i></a> (Quantum Computing seminar, TH Deggendorf, winter semester 2026/27). Every number on the slides comes from it or from its data files; each slide's source line names where.</p>
<h3>Sources</h3><ol>${refs}</ol>
<h3>Thanks</h3>
<ul>
<li>Google Quantum AI, for publishing the 2024 result with its supplement and for making its recordings public.</li>
<li>Craig Gidney and the Stim authors, and Oscar Higgott and the PyMatching authors, for free software that made our runs possible.</li>
<li>Excalidraw and rough.js (MIT licence), whose hand-drawn style the sketches on these slides use.</li>
<li>Photographers on Wikimedia Commons: Lars Ploughman (the cryostat, CC BY-SA 2.0), CEphoto, Uwe Aranas (the film reel, CC BY-SA 3.0), TheJosh (the desk computer, public domain), and Dsv (the rack servers, public domain): the references for the drawings.</li>
<li>Prof. Dr. Patrick Glauner, for the seminar.</li>
</ul>
<h3>How this was made</h3><p>The slides are drawn in code from the article's own figures; the drawings were made with an image model from Alexander Rudaev's own line reference and real photographs; independent reviewers checked the plan, the drawing and the slides.</p>
</section>
<section class="panel" id="keys" hidden><button class="close" data-close>Close</button><h2>Keys</h2><ul>
<li>Right, Space or a click: next. Left: back. Home and End.</li><li>F: full screen (the notes and this bar hide there).</li><li>N: speaker notes. G: go to a page.</li><li>Ctrl+P: print or save every slide as a PDF, one per page.</li></ul></section>
<div id="print"></div>
<script>
var PAGES = ${JSON.stringify(pages)};
var ART = ${JSON.stringify(ART)};
function art(s) { return s.replace(/%ART:([^%]+)%/g, function (m, f) { return ART[f]; }); }
var stage = document.getElementById('stage'), notes = document.getElementById('notes'), where = document.getElementById('where');
var n = Math.max(0, Math.min(PAGES.length - 1, (parseInt((location.hash || '').slice(1), 10) || 1) - 1));
var cur = null;
function fit() { if (!cur) return; var r = stage.getBoundingClientRect(); var k = Math.min(r.width / 1920, r.height / 1080); cur.style.transform = 'translate(-50%, -50%) scale(' + k + ')'; }
function show(k) {
  n = Math.max(0, Math.min(PAGES.length - 1, k));
  var p = PAGES[n];
  cur = document.createElement('div'); cur.className = 'page'; cur.innerHTML = art(p.html);
  stage.replaceChildren(cur); fit();
  where.textContent = (p.backup ? p.n : p.end ? 'Questions' : 'Slide ' + p.n) + (p.builds > 1 ? ' · ' + p.build + '/' + p.builds : '') + ' · page ' + (n + 1) + ' of ' + PAGES.length;
  notes.innerHTML = '<div class="where">' + where.textContent + (p.click ? ': ' + p.click : '') + '</div>' + (p.notes || PAGES.slice(0, n + 1).reverse().find(function (q) { return q.id === p.id && q.notes; })?.notes || '');
  history.replaceState(null, '', '#' + (n + 1));
}
function isFull() { return !!document.fullscreenElement || matchMedia('(display-mode: fullscreen)').matches || (Math.abs(innerHeight - screen.height) < 3 && Math.abs(innerWidth - screen.width) < 3); }
function mode() { document.body.classList.toggle('full', isFull()); setTimeout(fit, 0); }
function full() { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(function () {}); }
function panel(id) { document.querySelectorAll('.panel').forEach(function (p) { p.hidden = p.id !== id || !p.hidden; }); }
addEventListener('resize', function () { fit(); mode(); });
document.addEventListener('fullscreenchange', mode);
document.getElementById('full').onclick = full;
document.querySelectorAll('[data-panel]').forEach(function (b) { b.onclick = function () { panel(b.dataset.panel); }; });
document.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { panel(''); }; });
document.querySelectorAll('[data-go]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); panel(''); show(+a.dataset.go); }; });
addEventListener('keydown', function (e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (['ArrowRight', ' ', 'PageDown', 'Enter', 'ArrowDown'].indexOf(e.key) >= 0) { e.preventDefault(); show(n + 1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace', 'ArrowUp'].indexOf(e.key) >= 0) { e.preventDefault(); show(n - 1); }
  else if (e.key === 'Home') show(0);
  else if (e.key === 'End') show(PAGES.length - 1);
  else if (e.key === 'n' || e.key === 'N') notes.hidden = !notes.hidden;
  else if (e.key === 'f' || e.key === 'F') full();
  else if (e.key === 'Escape') panel('');
  else if (e.key === 'g' || e.key === 'G') { var k = parseInt(prompt('Go to page (1–' + PAGES.length + ')'), 10); if (k) show(k - 1); }
});
stage.addEventListener('click', function (e) { if (e.target.closest('a')) return; show(n + 1); });
// Every page for Ctrl+P, drawn once when the browser is idle.
(window.requestIdleCallback || setTimeout)(function () {
  document.getElementById('print').innerHTML = PAGES.map(function (p) { return '<div class="page">' + art(p.html) + '</div>'; }).join('');
});
mode(); show(n);
</script>
</body>
</html>
`;
const file = join(OUT, 'quantum-talk.html');
writeFileSync(file, doc);
if (process.argv.includes('--site')) {
  const site = join(ROOT, 'dist', 'other-half', 'talk');
  mkdirSync(site, { recursive: true });
  writeFileSync(join(site, 'index.html'), doc);
  console.log(`site page -> ${join(site, 'index.html')}`);
}
console.log(`${pages.length} pages, ${(doc.length / 1e6).toFixed(1)} MB, drawings ${Object.keys(ART).join(', ')} -> ${file}`);
