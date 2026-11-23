// Renders the Quantum talk deck: one PNG per build into the slide's own
// folder (talks/quantum/slides/<dir>/export/pN.png), the PDF (one page per
// build), contact sheets, a projector pass (1024 x 768, lifted blacks, a
// little blur), the gates and the cue sheet with the timing from the notes.
//   node tools/qdeck.mjs [--only <slide id>]
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TALK = join(ROOT, 'talks', 'quantum');
const OUT = join(ROOT, '.shots', 'deck', 'quantum');
const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx > 0 ? process.argv[onlyIdx + 1] : '';
mkdirSync(join(OUT, 'projector'), { recursive: true });
// start clean, so no page from an older, longer run is left behind
if (!ONLY) for (const d of [OUT, join(OUT, 'projector')]) for (const f of readdirSync(d)) if (/^(p|x|sheet-)\d+.*\.png$/.test(f)) rmSync(join(d, f));

const { server, port } = await startServer(ROOT, 0);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('requestfailed', (r) => errs.push(`failed: ${r.url()}`));
page.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()}: ${r.url()}`); });
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${port}/talks/quantum/index.html?print=1${ONLY ? `&only=${ONLY}` : ''}`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.__deck && window.__deck.ready', { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 400));

// Gates, measured on the drawn SVG.
const report = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.page').forEach((pg) => {
    const n = pg.dataset.page, id = pg.dataset.slide;
    const small = [], off = [], band = [], overlap = [];
    const boxes = [];
    pg.querySelectorAll('text').forEach((t) => {
      if (t.closest('[data-gate="skip"]')) return;
      const fs = parseFloat(t.getAttribute('font-size')) || 0;
      const b = t.getBBox();
      const label = (t.textContent || '').slice(0, 40);
      const inBand = b.y + b.height > 990;
      if (fs < (pg.dataset.backup ? 24 : 32) && !inBand) small.push(`${fs}px "${label}"`);
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
    out.push({ n, id, build: Number(pg.dataset.build), small, off, band, overlap });
  });
  return out;
});

// PNGs: into each slide's export/ (cleared first) and into .shots for sheets.
const meta = await page.evaluate(() => window.__deck.pages.map((p, i) => {
  const el = document.querySelectorAll('.page')[i];
  return { slide: el.dataset.slide, build: Number(el.dataset.build) };
}));
const dirs = await page.evaluate(async () => (await import('./slides.js')).SLIDES.map((s) => ({ id: s.id, dir: s.dir })));
const dirOf = Object.fromEntries(dirs.map((d) => [d.id, d.dir]));
const cleared = new Set();
const els = await page.$$('.page');
const shots = [];
for (let i = 0; i < els.length; i++) {
  const { slide, build } = meta[i];
  const exp = join(TALK, 'slides', dirOf[slide], 'export');
  if (!cleared.has(exp)) { rmSync(exp, { recursive: true, force: true }); mkdirSync(exp, { recursive: true }); cleared.add(exp); }
  const file = join(exp, `p${build + 1}.png`);
  await els[i].screenshot({ path: file });
  const flat = join(OUT, `p${String(i + 1).padStart(2, '0')}.png`);
  writeFileSync(flat, readFileSync(file));
  shots.push({ flat, slide, build });
}
if (!ONLY) await page.pdf({ path: join(OUT, 'quantum-deck.pdf'), width: '13.333in', height: '7.5in', scale: 2 / 3, printBackground: true, preferCSSPageSize: true });

// Projector pass and contact sheets, drawn in the browser (no image library).
const img = (f) => `http://localhost:${port}/${f.slice(ROOT.length + 1).replaceAll('\\', '/')}`;
const sheet = await browser.newPage();
await sheet.setViewport({ width: 2880, height: 1100, deviceScaleFactor: 1 });
await sheet.goto(`http://localhost:${port}/`);
for (let i = 0; i < shots.length; i++) {
  // 1920x1080 into a 1024x768 projector: 1024x576 letterboxed, blacks lifted
  // to 12% of white, a slight blur.
  await sheet.setViewport({ width: 1024, height: 768, deviceScaleFactor: 1 });
  await sheet.setContent(`<style>body{margin:0;background:#1f1f1f;display:grid;place-items:center;height:768px}img{width:1024px;filter:blur(0.7px) contrast(0.88) brightness(1.04);}</style><img src="${img(shots[i].flat)}">`, { waitUntil: 'load' });
  await sheet.screenshot({ path: join(OUT, 'projector', `x${String(i + 1).padStart(2, '0')}.png`) });
}
await sheet.setViewport({ width: 2880, height: 1100, deviceScaleFactor: 1 });
for (let s = 0; s * 6 < shots.length; s++) {
  const part = shots.slice(s * 6, s * 6 + 6);
  await sheet.setContent(`<style>body{margin:0;background:#C9CDD3;font:20px sans-serif}#s{padding:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}figure{margin:0}img{width:100%;display:block}figcaption{color:#333;padding:2px 0}</style><div id="s">${part.map((p, k) => `<figure><img src="${img(p.flat)}"><figcaption>page ${s * 6 + k + 1} · ${p.slide} · build ${p.build + 1}</figcaption></figure>`).join('')}</div>`, { waitUntil: 'load' });
  await (await sheet.$('#s')).screenshot({ path: join(OUT, `sheet-${String(s + 1).padStart(2, '0')}.png`) });
}

// Cue sheet and timing: the notes' words at 130 a minute, 1.5 s per click,
// 2.5 s per landing (the bold line), 8 s per handover.
if (!ONLY) {
  const info = await page.evaluate(async () => (await import('./slides.js')).SLIDES.map((s) => ({
    id: s.id, dir: s.dir, n: s.n, backup: !!s.backup, end: !!s.end, builds: s.builds, clicks: s.clicks || [], title: s.title || '', part: s.part || '', speaker: s.speaker || '',
  })));
  let t = 0;
  const md = ['# Cue sheet: The other half of a quantum computer', '', 'Generated by `node tools/qdeck.mjs` from each slide\'s `notes.md`. Times: the notes at 130 words a minute, 1.5 s per click, 2.5 s per landing, 8 s per handover. Page = the PDF page.', '', '| Page | Slide | Starts at | Build | On this click | Lands on |', '| ---: | --- | ---: | --- | --- | --- |'];
  const fmt = (s) => { const r = Math.round(s); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };
  let pg = 0, words = 0, contrasts = 0;
  const per = [];
  let lastSpeaker = '';
  for (const s of info) {
    const nf = join(TALK, 'slides', s.dir, 'notes.md');
    const notes = existsSync(nf) ? readFileSync(nf, 'utf8').replace(/^#.*$/m, '') : '';
    const w = (notes.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,%-]*/gu) || []).length;
    contrasts += (notes.match(/\bnot\b[^.]*\bbut\b|n't [^.]*\. It /gi) || []).length;
    const main = !s.backup && !s.end;
    const start = t;
    if (main) {
      if (s.speaker && lastSpeaker && s.speaker !== lastSpeaker) t += 8;
      lastSpeaker = s.speaker || lastSpeaker;
      t += (w / 130) * 60 + s.builds * 1.5 + 2.5;
      words += w;
      per.push({ n: s.n, id: s.id, sec: Math.round(t - start), words: w });
    }
    for (let b = 0; b < s.builds; b++) {
      pg++;
      md.push(`| ${pg} | ${s.backup ? 'B' : ''}${s.n || (s.end ? 'end' : '')} ${s.id} | ${b === 0 && main ? fmt(start) : ''} | ${b + 1} of ${s.builds} | ${s.clicks[b] || ''} | ${b === s.builds - 1 ? s.title : ''} |`);
    }
  }
  md.push('', `**Main talk:** ${words} words, ${fmt(t)} in all. Contrast sentences in the notes: ${contrasts}.`, '', '| Slide | Seconds | Words |', '| ---: | ---: | ---: |');
  per.forEach((p) => md.push(`| ${p.n} ${p.id} | ${p.sec} | ${p.words} |`));
  writeFileSync(join(TALK, 'CUES.md'), md.join('\n') + '\n');
  console.log(`timing: ${words} words, ${fmt(t)}; contrasts ${contrasts}`);
}

const lines = [];
for (const r of report) {
  const issues = [];
  if (r.small.length) issues.push(`small: ${r.small.join('; ')}`);
  if (r.off.length) issues.push(`off page: ${r.off.join('; ')}`);
  if (r.band.length) issues.push(`in bottom band: ${r.band.join('; ')}`);
  if (r.overlap.length) issues.push(`overlap: ${r.overlap.join('; ')}`);
  if (issues.length) lines.push(`page ${r.n} (${r.id} b${r.build + 1}): ${issues.join(' | ')}`);
}
writeFileSync(join(OUT, 'gates.txt'), lines.join('\n') + '\n');
console.log(`${shots.length} pages; ${lines.length} with findings${errs.length ? `; errors: ${[...new Set(errs)].join(' / ')}` : ''}`);
if (lines.length) console.log(lines.slice(0, 80).join('\n'));
await browser.close();
server.close();
