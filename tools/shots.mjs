// Screenshots and the PDF for review, with puppeteer-core and the installed Chrome.
//
//   node tools/shots.mjs <slug> [--quick]
//
// Serves dist/ on a free local port and writes into .shots/<slug>/ :
//   index.png      the list of articles (dist/index.html)
//   desktop-*.png   1440×900: top, every section, every scene step, every figure, a source popover
//   phone-*.png     390×844: top, a few sections, scene steps, figures, tables, a source popover
//   freeze-*.png    every figure state, pinned with ?freeze=<id>:<step>:1
//   reduced-*.png   one scene with prefers-reduced-motion
//   print.pdf       the paper (print mode, A4, background graphics on)
//   print-ctrlp.pdf the same page printed without ?print=1, as Ctrl+P does it
//   print-p<n>.png  the pages of print.pdf, rendered with pdf.js
//   print-sheet-<n>.png  the same pages three to a sheet
//   console.txt     console errors and warnings, page errors, failed requests
//
// --quick skips the freeze shots and the phone run.
//
//   node tools/shots.mjs <slug> --matrix
//
// runs the any-device matrix instead (tools/matrix.mjs): shots in
// .shots/<slug>/matrix/ and a summary table in .shots/<slug>/matrix.md.

import { mkdirSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';
import { runMatrix } from './matrix.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const slug = process.argv[2];
const quick = process.argv.includes('--quick');
const matrix = process.argv.includes('--matrix');
if (!slug) { console.error('usage: node tools/shots.mjs <slug> [--quick]'); process.exit(1); }
if (!existsSync(join(ROOT, 'dist', slug, 'index.html'))) {
  console.error(`dist/${slug}/index.html does not exist; run "node lib/build.mjs ${slug}" first`);
  process.exit(1);
}

const out = join(ROOT, '.shots', slug);
// A matrix run keeps the other shots, and the other way round. The reading
// shots (tools/read.mjs) and the filmstrips (tools/filmstrip.mjs) are kept too.
if (matrix) {
  rmSync(join(out, 'matrix'), { recursive: true, force: true });
} else if (existsSync(out)) {
  for (const f of readdirSync(out)) if (f !== 'matrix' && f !== 'matrix.md' && f !== 'read' && !f.startsWith('strip-')) rmSync(join(out, f), { recursive: true, force: true });
}
mkdirSync(join(out, 'matrix'), { recursive: true });

const { server, port } = await startServer(join(ROOT, 'dist'), 0, {
  '/__pdfjs/': join(ROOT, 'node_modules', 'pdfjs-dist', 'build'),
  '/__shots/': join(ROOT, '.shots'),
});
const base = `http://127.0.0.1:${port}/${slug}/`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const log = [];
const written = [];

async function open(viewport, query = '', features = [], prep = null) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  if (prep) await prep(page);
  if (features.length) await page.emulateMediaFeatures(features);
  const tag = `[${viewport.width}px${query ? ` ${query}` : ''}]`;
  page.on('console', (m) => { if (['error', 'warn'].includes(m.type())) log.push(`${tag} console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => log.push(`${tag} page error: ${e.message}`));
  page.on('requestfailed', (r) => log.push(`${tag} request failed: ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', (r) => { if (r.status() >= 400) log.push(`${tag} HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(base + query, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

// Lets the scroll engine run (one frame), the fades finish and every step
// that was triggered play to its end (lib/article.js sets data-moving on the
// root while one plays; at most 8 s).
const settle = (page, ms = 420) => page.evaluate((d) => new Promise((ok) => {
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => {
    const t0 = performance.now();
    const wait = () => (!document.documentElement.dataset.moving || performance.now() - t0 > 8000 ? setTimeout(ok, 60) : requestAnimationFrame(wait));
    wait();
  }, d)));
}), ms);

async function shot(page, name, options = {}) {
  await page.screenshot({ path: join(out, name), ...options });
  written.push(name);
}

// Scrolls so that the top of the element sits at `at` (a share of the window height).
async function scrollTo(page, selector, index, at) {
  const ok = await page.evaluate((sel, i, a) => {
    const el = document.querySelectorAll(sel)[i];
    if (!el) return false;
    scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - innerHeight * a));
    return true;
  }, selector, index, at);
  await settle(page);
  return ok;
}

// What there is to photograph, read from the built page.
async function anchors(page) {
  return page.evaluate(() => ({
    sections: [...document.querySelectorAll('main h2.sec')].map((h) => h.id),
    scenes: [...document.querySelectorAll('.scene')].map((s) => ({
      id: s.dataset.scene,
      steps: [...s.querySelectorAll('.passage')].map((p) => Number(p.dataset.step)),
    })),
    figures: [...document.querySelectorAll('[data-role="figure"]')].map((f) => f.dataset.fig),
    tables: document.querySelectorAll('.table-frame').length,
    margin: (() => {
      const marks = [...document.querySelectorAll('.margin-mark:not(.margin-end)')];
      return marks.length ? { id: marks[0].dataset.margin, states: marks.map((m) => Number(m.dataset.state)) } : null;
    })(),
    manifest: JSON.parse(document.getElementById('article-data').textContent),
  }));
}

async function run(prefix, viewport, { everySection }) {
  const page = await open(viewport);
  const a = await anchors(page);
  await shot(page, `${prefix}-00-top.png`);
  // A little way down: the hero layers have drifted apart, the title is leaving.
  await page.evaluate(() => scrollTo(0, 280));
  await settle(page);
  await shot(page, `${prefix}-01-top-scrolled.png`);

  for (let i = 0; i < a.sections.length; i++) {
    if (!everySection && i % 3 !== 1) continue;
    await scrollTo(page, 'main h2.sec', i, 0.12);
    await shot(page, `${prefix}-section-${String(i + 1).padStart(2, '0')}-${a.sections[i]}.png`);
  }

  let p = 0;
  for (const scene of a.scenes) {
    for (let k = 0; k < scene.steps.length; k++, p++) {
      if (!everySection && k % 2 === 1 && k !== scene.steps.length - 1) continue;
      // The passage a little above the reading line: its step is complete.
      await scrollTo(page, '.passage', p, viewport.width < 900 ? 0.56 : 0.24);
      await shot(page, `${prefix}-scene-${scene.id}-step${scene.steps[k]}.png`);
    }
  }

  for (let i = 0; i < a.figures.length; i++) {
    await scrollTo(page, '[data-role="figure"]', i, 0.14);
    await shot(page, `${prefix}-figure-${a.figures[i]}.png`);
  }
  for (let i = 0; i < a.tables; i++) {
    await scrollTo(page, '.table-frame', i, 0.2);
    await shot(page, `${prefix}-table-${i + 1}.png`);
  }

  // A source popover, opened by keyboard, then closed with Escape.
  await scrollTo(page, '.src-mark', 3, 0.45);
  await page.evaluate(() => document.querySelectorAll('.src-mark')[3].focus());
  await page.keyboard.press('Enter');
  await settle(page, 150);
  await shot(page, `${prefix}-sources-popover.png`);
  const open1 = await page.evaluate(() => !!document.querySelector('.src-pop'));
  await page.keyboard.press('Escape');
  const open2 = await page.evaluate(() => !!document.querySelector('.src-pop'));
  const back = await page.evaluate(() => document.activeElement === document.querySelectorAll('.src-mark')[3]);
  if (!open1 || open2 || !back) log.push(`[${viewport.width}px] source popover: opened=${open1} closedByEscape=${!open2} focusBack=${back}`);

  // The last mark of the page, close to the right edge on a phone.
  const last = await page.evaluate(() => document.querySelectorAll('.src-mark').length - 1);
  await scrollTo(page, '.src-mark', last, 0.3);
  await page.evaluate((i) => document.querySelectorAll('.src-mark')[i].click(), last);
  await settle(page, 150);
  await shot(page, `${prefix}-sources-popover-last.png`);
  const box = await page.evaluate(() => {
    const r = document.querySelector('.src-pop')?.getBoundingClientRect();
    return r ? { left: r.left, right: r.right, width: document.documentElement.clientWidth } : null;
  });
  if (!box || box.left < 0 || box.right > box.width) log.push(`[${viewport.width}px] source popover leaves the window: ${JSON.stringify(box)}`);
  await page.keyboard.press('Escape');

  await scrollTo(page, '#sources', 0, 0.1);
  await shot(page, `${prefix}-sources-list.png`);

  // Anything wider than the window makes the page scroll sideways.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) log.push(`[${viewport.width}px] the page is ${overflow}px wider than the window`);

  await page.close();
  return a;
}

if (matrix) {
  await runMatrix({ slug, out, open, settle, scrollTo, log });
  await browser.close();
  server.close();
  process.exit(0);
}

// --- the index page ---------------------------------------------------------
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('response', (r) => { if (r.status() >= 400) log.push(`[index] HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await shot(page, 'index.png');
  await page.close();
}

// --- desktop and phone ------------------------------------------------------
const a = await run('desktop', { width: 1440, height: 900 }, { everySection: true });
if (!quick) {
  await run('phone', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, { everySection: false });
}

// --- every figure state, frozen ---------------------------------------------
if (!quick) {
  const states = [];
  for (const s of a.scenes) for (const step of [...new Set(s.steps)]) states.push([s.id, step]);
  for (const id of a.figures) states.push([id, 0]);
  if (a.margin) for (const st of [...new Set(a.margin.states)]) states.push([a.margin.id, st]);
  for (const [id, step] of states) {
    const page = await open({ width: 1440, height: 900 }, `?freeze=${id}:${step}:1`);
    await settle(page, 200);
    const frame = await page.$(`[data-fig="${id}"]:not([data-role="still"]) .fig-frame`);
    if (frame) { await frame.screenshot({ path: join(out, `freeze-${id}-${step}.png`) }); written.push(`freeze-${id}-${step}.png`); }
    await page.close();
  }
}

// --- reduced motion: the scene must show complete stills --------------------
{
  const page = await open({ width: 1440, height: 900 }, '', [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await scrollTo(page, '.passage', 1, 0.6);
  await shot(page, 'reduced-scene.png');
  await page.close();
}

// --- print ------------------------------------------------------------------
// Google Fonts serves variable fonts to browsers, and Chrome embeds those in a
// PDF as Type 3 glyphs, which some viewers draw jagged. A plain client gets
// static TrueType files instead, so the PDF fetches the font CSS that way and
// embeds real outlines.
async function staticFonts(page) {
  await page.setCacheEnabled(false);
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    if (!req.url().startsWith('https://fonts.googleapis.com/')) { req.continue(); return; }
    try {
      const r = await fetch(req.url());
      req.respond({ status: r.status, contentType: 'text/css', headers: { 'access-control-allow-origin': '*' }, body: await r.text() });
    } catch { req.continue(); }
  });
}
async function pdf(query, name) {
  const page = await open({ width: 1240, height: 1754 }, query, [], staticFonts);
  await page.emulateMediaType('print');
  await settle(page, 200);
  await page.pdf({ path: join(out, name), preferCSSPageSize: true, printBackground: true });
  written.push(name);
  await page.close();
}
await pdf('?print=1', 'print.pdf');
await pdf('', 'print-ctrlp.pdf');

// The print preview as the screen shows it, for comparison with the PDF.
{
  const page = await open({ width: 1240, height: 1754 }, '?print=1');
  await shot(page, 'print-preview-screen.png');
  await page.close();
}

// The first pages of each PDF as images, drawn by pdf.js inside Chrome.
async function pdfPages(name, prefix, count) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 1800 });
  page.on('pageerror', (e) => log.push(`[pdf.js] ${e.message}`));
  await page.goto(`http://127.0.0.1:${port}/__shots/${slug}/${name}`).catch(() => {});
  await page.setContent('<!doctype html><body style="margin:0;background:#888"><canvas id="c"></canvas></body>');
  const pages = await page.evaluate(async (url, origin) => {
    const pdfjs = await import(`${origin}/__pdfjs/pdf.min.mjs`);
    pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/__pdfjs/pdf.worker.min.mjs`;
    window.__doc = await pdfjs.getDocument(url).promise;
    return window.__doc.numPages;
  }, `http://127.0.0.1:${port}/__shots/${slug}/${name}`, `http://127.0.0.1:${port}`);
  for (let n = 1; n <= Math.min(count, pages); n++) {
    await page.evaluate(async (num) => {
      const p = await window.__doc.getPage(num);
      const viewport = p.getViewport({ scale: 2 });
      const canvas = document.getElementById('c');
      canvas.width = viewport.width; canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / 2}px`;
      await p.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    }, n);
    const canvas = await page.$('#c');
    await canvas.screenshot({ path: join(out, `${prefix}-p${n}.png`) });
    written.push(`${prefix}-p${n}.png`);
  }
  // Contact sheets, three pages side by side, to judge how full the pages are.
  const shown = Math.min(count, pages);
  for (let first = 1; first <= shown; first += 3) {
    const imgs = [];
    for (let n = first; n < first + 3 && n <= shown; n++) {
      imgs.push(`<img src="http://127.0.0.1:${port}/__shots/${slug}/${prefix}-p${n}.png" style="width:620px;border:1px solid #999;background:#fff">`);
    }
    await page.setContent(`<!doctype html><body style="margin:0;background:#888"><div id="s" style="display:inline-flex;gap:12px;padding:12px">${imgs.join('')}</div></body>`, { waitUntil: 'load' });
    const sheet = await page.$('#s');
    const name = `${prefix}-sheet-${Math.ceil(first / 3)}.png`;
    await sheet.screenshot({ path: join(out, name) });
    written.push(name);
  }
  await page.close();
  return pages;
}
try {
  const n = await pdfPages('print.pdf', 'print', 99);
  const m = await pdfPages('print-ctrlp.pdf', 'print-ctrlp', 2);
  console.log(`print.pdf: ${n} pages; print-ctrlp.pdf: ${m} pages`);
} catch (err) {
  log.push(`pdf pages could not be rendered: ${err.message}`);
}

await browser.close();
server.close();

writeFileSync(join(out, 'console.txt'), log.length ? `${log.join('\n')}\n` : 'no console errors, warnings or failed requests\n');
console.log(`${written.length} files in .shots/${slug}/ – ${log.length} console/log lines (console.txt)`);
