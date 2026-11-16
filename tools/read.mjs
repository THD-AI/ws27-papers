// Reading checks: does the page read well screen by screen?
//
//   node tools/read.mjs <slug>
//
// At 1440×900, 390×844 and 844×390 it scrolls through every scene in small
// steps and checks that
//   - the figure is on screen whenever a passage of the scene is,
//   - the active passage is on screen, and not the only one there,
//   - every passage becomes the active one, in order,
//   - the place label does not stand twice (at the figure and in the text).
// At 1440×900 and 390×844 it also scans the whole page for emptiness:
//   - any gap of more than 6rem between consecutive blocks of the text,
//   - any screen that is almost empty (see emptyScreens below).
// It writes shots into .shots/<slug>/read/: three consecutive passages of
// every scene, and one section start with its margin still.

import { mkdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const slug = process.argv[2];
if (!slug) { console.error('usage: node tools/read.mjs <slug>'); process.exit(1); }

const out = join(ROOT, '.shots', slug, 'read');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const { server, port } = await startServer(join(ROOT, 'dist'));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const problems = [];

// Runs in the page: walks through one scene and reports what a reader sees.
async function walkScene(index) {
  const frame = () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  const scene = document.querySelectorAll('.scene')[index];
  const passages = [...scene.querySelectorAll('.passage')];
  const svgBox = () => scene.querySelector('.scene-stage svg')?.getBoundingClientRect();
  const vh = innerHeight;
  const start = scene.getBoundingClientRect().top + scrollY - vh;
  const end = scene.getBoundingClientRect().bottom + scrollY;
  const found = [];
  const order = [];
  const shots = {};
  for (let y = Math.max(0, start); y <= end; y += 24) {
    scrollTo(0, y);
    await frame();
    const stage = scene.querySelector('.scene-stage').getBoundingClientRect();
    const onScreen = (r, from = 0) => r.bottom > from + 8 && r.top < vh - 8;
    const floor = getComputedStyle(scene).display === 'grid' ? 0 : Math.max(0, stage.bottom);   // text under a figure pinned on top is not seen
    const seen = passages.filter((p) => onScreen(p.getBoundingClientRect(), floor));
    if (!seen.length) continue;
    // while the scene leaves, the text after it is on screen and the figure goes with the scene
    const leaving = scene.querySelector('.scene-text').getBoundingClientRect().bottom < vh;
    const fig = svgBox();
    // as much of the drawing in the window as of the text (up to 120 px);
    // 70 px are allowed for the label and the drawing's own heading
    const textSeen = Math.min(vh, Math.max(...seen.map((p) => p.getBoundingClientRect().bottom))) - Math.max(floor, Math.min(...seen.map((p) => p.getBoundingClientRect().top)));
    if (!leaving && (!fig || Math.min(fig.bottom, vh) - Math.max(fig.top, 0) < Math.min(120, textSeen - 70))) found.push(`y ${y}: a passage is on screen without the figure`);
    const k = passages.findIndex((p) => p.classList.contains('is-active'));
    if (order[order.length - 1] !== k) { order.push(k); shots[k] = y; }
    const fullySeen = seen.length === passages.length;
    if (k >= 0 && !onScreen(passages[k].getBoundingClientRect(), floor)) found.push(`y ${y}: the active passage ${k} is not on screen`);
    // while the scene comes in or leaves, the text around it is on screen too
    const entering = scene.getBoundingClientRect().top > 0 || leaving;
    if (seen.length < 2 && passages.length > 1 && !fullySeen && !entering) {
      const r = seen[0].getBoundingClientRect();
      // one long passage may fill the band of text; it must not be a short one alone
      if (r.height < (vh - floor) * 0.5) found.push(`y ${y}: passage alone on the screen`);
    }
    const label = scene.querySelector('.fig-where');
    if (label && label.textContent && getComputedStyle(label).visibility !== 'hidden') {
      const twice = [...scene.querySelectorAll('.passage .where')].some((el) => el.textContent.trim() === label.textContent && onScreen(el.getBoundingClientRect(), floor));
      if (twice) found.push(`y ${y}: the place "${label.textContent}" stands twice`);
    }
  }
  const expected = passages.map((_, i) => i).join(',');
  if (order.join(',') !== expected) found.push(`passages became active in the order ${order.join(',')}, expected ${expected}`);
  // keep the first report of each kind
  const kinds = new Map();
  for (const f of found) { const kind = f.replace(/^y \d+: /, '').replace(/\d+/g, 'n'); if (!kinds.has(kind)) kinds.set(kind, f); }
  return { id: scene.dataset.scene, problems: [...kinds.values()], shots };
}

// Runs in the page: gaps of more than 6rem between consecutive blocks.
function blockGaps() {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const blocks = [];
  (function walk(parent) {
    for (const el of parent.children) {
      if (!el.getClientRects().length || el.matches('.margin-mark')) continue;
      const cs = getComputedStyle(el);
      if (cs.position === 'absolute' || cs.float !== 'none') continue;       // margin stills stand beside the text
      if (el.matches('.scene-text, .passage')) { walk(el); continue; }
      if (el.matches('.scene')) {
        // a scene counts as one block as high as its text and figure together
        blocks.push({ el, r: el.getBoundingClientRect(), scene: true });
        continue;
      }
      blocks.push({ el, r: el.getBoundingClientRect() });
    }
  }(document.querySelector('main.body')));
  const out = [];
  for (let i = 1; i < blocks.length; i++) {
    const gap = blocks[i].r.top - blocks[i - 1].r.bottom;
    if (gap > 6 * rem) out.push(`${Math.round(gap)}px (${(gap / rem).toFixed(1)}rem) before <${blocks[i].el.tagName.toLowerCase()} class="${blocks[i].el.className}"> "${blocks[i].el.textContent.trim().slice(0, 40)}"`);
  }
  // inside a scene: the stretch a reader scrolls with nothing new in the text
  for (const b of blocks.filter((x) => x.scene)) {
    const text = b.el.querySelector('.scene-text').getBoundingClientRect();
    const stage = b.el.querySelector('.scene-stage').getBoundingClientRect();
    const sticky = getComputedStyle(b.el.querySelector('.scene-text')).position === 'sticky';
    const side = getComputedStyle(b.el).display === 'grid';
    const tail = b.r.bottom - text.bottom;
    if (side && !sticky && tail > 6 * rem) out.push(`${Math.round(tail)}px empty at the end of scene "${b.el.dataset.scene}"`);
  }
  return out;
}

// Screens that are almost empty. A screen of running text has ink in well
// over half of its pixel rows; a screen counts as empty when fewer than 12%
// of its rows carry anything but paper, or when one empty band is taller
// than 45% of the window. (Counted in rows, not pixels: text covers only
// about 5% of the pixels of a full screen.)
async function emptyScreens(page, helper, w, h) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const found = [];
  for (let y = 0; y + h <= total; y += Math.round(h / 2)) {
    await page.evaluate((v) => scrollTo(0, v), y);
    await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
    const b64 = await page.screenshot({ encoding: 'base64' });
    const res = await helper.evaluate(async (data) => {
      const img = new Image();
      img.src = `data:image/png;base64,${data}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      let inked = 0; let run = 0; let longest = 0;
      for (let row = 0; row < c.height; row++) {
        let ink = false;
        for (let x = 0; x < c.width; x += 2) {
          const i = (row * c.width + x) * 4;
          // paper is #FBFBFC; anything clearly darker or coloured is ink
          if (Math.abs(px[i] - 251) + Math.abs(px[i + 1] - 251) + Math.abs(px[i + 2] - 252) > 40) { ink = true; break; }
        }
        if (ink) { inked++; run = 0; } else { run++; if (run > longest) longest = run; }
      }
      return { rows: inked / c.height, band: longest / c.height };
    }, b64);
    if (res.rows < 0.12 || res.band > 0.45) found.push(`y ${y}: ${Math.round(res.rows * 100)}% of rows inked, longest empty band ${Math.round(res.band * 100)}% of the window`);
  }
  return found;
}

const helper = await browser.newPage();
await helper.setContent('<!doctype html><body></body>');

for (const [w, h] of [[1440, 900], [390, 844], [844, 390]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: w < 1000, hasTouch: w < 1000 });
  page.on('pageerror', (e) => problems.push(`${w}x${h}: ${e.message}`));
  await page.goto(`http://127.0.0.1:${port}/${slug}/`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await page.evaluate(() => document.fonts.ready);
  const wait = (ms = 380) => page.evaluate((d) => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(ok, d)))), ms);
  await wait(200);
  const tag = `${w}x${h}`;
  const seq = h < 560;

  const count = await page.evaluate(() => document.querySelectorAll('.scene').length);
  for (let i = 0; i < count && !seq; i++) {
    const res = await page.evaluate(walkScene, i);
    for (const p of res.problems) problems.push(`${tag} scene ${res.id}: ${p}`);
    console.log(`${tag} scene ${res.id}: ${res.problems.length ? res.problems.length + ' problems' : 'reads in order, figure and passages together'}`);
    // three consecutive passages, each a little after it became the active one
    for (const k of [0, 1, 2, 3]) {
      if (res.shots[k] === undefined) continue;
      await page.evaluate((y) => scrollTo(0, y + 60), res.shots[k]);
      await wait();
      await page.screenshot({ path: join(out, `${tag}-${res.id}-passage${k}.png`) });
    }
  }
  if (seq) {
    // the sequence: the first still of every scene with its passage
    for (let i = 0; i < count; i++) {
      const id = await page.evaluate((si) => {
        const scene = document.querySelectorAll('.scene')[si];
        scrollTo(0, scene.getBoundingClientRect().top + scrollY - 20);
        return scene.dataset.scene;
      }, i);
      await wait();
      await page.screenshot({ path: join(out, `${tag}-${id}-start.png`) });
    }
  }

  if (!seq) {
    for (const g of await page.evaluate(blockGaps)) problems.push(`${tag} gap: ${g}`);
    for (const e of await emptyScreens(page, helper, w, h)) problems.push(`${tag} empty screen: ${e}`);
  }

  // A section start with its margin still: the second, and one that cannot
  // stand in the margin if there is such a one.
  const stills = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.margin-still')].filter((s) => s.getClientRects().length);
    const pick = [all[1], all.find((s) => s.classList.contains('in-flow'))].filter(Boolean);
    return pick.map((s) => (s.previousElementSibling || s).getBoundingClientRect().top + scrollY - 40);
  });
  for (let i = 0; i < stills.length; i++) {
    await page.evaluate((y) => scrollTo(0, y), stills[i]);
    await wait();
    await page.screenshot({ path: join(out, `${tag}-section-still${i ? '-in-text' : ''}.png`) });
  }
  await page.close();
}

await browser.close();
server.close();
console.log(problems.length ? `problems:\n${problems.join('\n')}` : 'no problems');
