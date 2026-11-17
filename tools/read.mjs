// Reading checks: does the page read well screen by screen?
//
//   node tools/read.mjs <slug>
//
// At 1440×900, 390×844 and 768×1024 it scrolls through every scene in small
// steps and checks that
//   - the figure is on screen whenever a passage of the scene is,
//   - two or three passages are in view while the figure is pinned,
//   - the active passage is the one at the reading line, and on screen,
//   - every passage becomes the active one, in order,
//   - the figure's state moves forward with the scroll, without jumps, and a
//     step is complete before the next one begins,
//   - the figure rests about a third of a window after the last passage,
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

// Runs in the page: walks through one scene in steps of 16 px and reports
// what a reader sees. The rule (lib/article.js, updateScene): the figure is
// pinned, the passages scroll past it about a third of a window apart; the one
// whose top has last passed the reading line is active; a new step is drawn
// while its passage comes up (t 0 as the passage before is read, 1 at the line;
// tools/motion.mjs measures how far).
async function walkScene(index) {
  const frame = () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  const scene = document.querySelectorAll('.scene')[index];
  const passages = [...scene.querySelectorAll('.passage')];
  const figure = scene.querySelector('.scene-stage [data-fig]');
  const stageEl = scene.querySelector('.scene-stage');
  const side = getComputedStyle(scene).display === 'grid';
  const vh = innerHeight;
  // the words of a passage, not its box (the box includes the room after it)
  const words = (p) => {
    const first = p.firstElementChild.getBoundingClientRect();
    const lastR = p.lastElementChild.getBoundingClientRect();
    return { top: first.top, bottom: lastR.bottom, height: lastR.bottom - first.top };
  };
  const start = scene.getBoundingClientRect().top + scrollY - vh;
  const end = scene.getBoundingClientRect().bottom + scrollY;
  const found = [];
  const order = [];
  const shots = {};
  const counts = [];
  let prev = null;                 // the figure state at the last position
  let restFrom = null;             // where the last passage became active
  let pinnedUntil = null;          // the last position at which the figure was pinned
  let alone = null;                // where a run of one passage in view began
  const stickyTop = parseFloat(getComputedStyle(stageEl).top) || 0;

  for (let y = Math.max(0, start); y <= end; y += 16) {
    scrollTo(0, y);
    await frame();
    const stage = stageEl.getBoundingClientRect();
    const floor = side ? 0 : Math.max(0, stage.bottom);          // text under a figure pinned on top is not seen
    // as readingLine() in lib/article.js: under a figure pinned on top, one pitch below it
    const pitchPx = parseFloat(scene.style.getPropertyValue('--pitch')) || Infinity;
    const line = side ? vh * 0.5 : floor + Math.min(pitchPx, (vh - floor) * 0.2);
    const seen = passages.filter((p) => { const w = words(p); return w.bottom > floor + 6 && w.top < vh - 6; });
    if (!seen.length) continue;
    const box = scene.getBoundingClientRect();
    const pinned = Math.abs(stage.top - stickyTop) < 2 && box.top <= stickyTop + 1;
    if (pinned) pinnedUntil = y;
    const leaving = scene.querySelector('.scene-text').getBoundingClientRect().bottom < vh;

    const svg = figure.querySelector('svg')?.getBoundingClientRect();
    const textSeen = Math.min(vh, Math.max(...seen.map((p) => words(p).bottom))) - Math.max(floor, Math.min(...seen.map((p) => words(p).top)));
    if (!leaving && (!svg || Math.min(svg.bottom, vh) - Math.max(svg.top, 0) < Math.min(120, textSeen - 70))) found.push(`y ${y}: a passage is on screen without the figure`);

    const k = passages.findIndex((p) => p.classList.contains('is-active'));
    if (order[order.length - 1] !== k) { order.push(k); shots[k] = y; }
    if (k === passages.length - 1 && restFrom === null) restFrom = y;

    // the active passage is the one at the reading line
    let want = 0;
    passages.forEach((p, i) => { if (p.getBoundingClientRect().top <= line + 0.5) want = i; });
    // a passage whose words have left the window hands over to the next one
    while (want < passages.length - 1 && words(passages[want]).bottom < floor + 12) want++;
    if (k !== want) found.push(`y ${y}: passage ${k} is active, passage ${want} is at the reading line`);
    const wk = words(passages[k]);
    if (pinned && !(wk.bottom > floor + 6 && wk.top < vh - 6)) found.push(`y ${y}: the active passage ${k} is not on screen`);

    // two or three passages in view while the figure is pinned (a long one may stand with one neighbour less)
    if (pinned && !leaving) {
      counts.push(seen.length);
      const longOne = seen.some((p) => words(p).height > (vh - floor) * 0.45);
      // the last passage rests alone at the line before the figure is let go
      // (under a tall figure pinned on top, a short passage may stand alone
      // for a moment while the one before slides under the figure and the
      // next comes in: each step needs a long pitch of scroll to be drawn
      // over. Alone for more than 12% of a window of scroll is a problem.)
      if (seen.length < 2 && passages.length > 1 && !longOne && k !== passages.length - 1) {
        alone = alone === null ? y : alone;
        if (y - alone > vh * 0.12) found.push(`y ${y}: only ${seen.length} passage in view for ${Math.round(y - alone)} px`);
      } else alone = null;
      if (seen.length > 4) found.push(`y ${y}: ${seen.length} passages in view`);
    }

    // the figure moves forward with the scroll, and a step is complete before the next begins
    const [step, t] = (figure.dataset.shown || '0:0').split(':').map(Number);
    if (prev) {
      if (step < prev.step || (step === prev.step && t < prev.t - 0.001)) found.push(`y ${y}: the figure went back from ${prev.step}:${prev.t} to ${step}:${t}`);
      // (steps follow each other without a rest, so a sample 16 px before the
      // end of a step may show it at 0.95 or more; tools/motion.mjs measures the drawing)
      if (step > prev.step && prev.t < 0.95) found.push(`y ${y}: step ${prev.step} ended at t ${prev.t}`);
      if (step === prev.step && t - prev.t > 0.25) found.push(`y ${y}: t jumped from ${prev.t} to ${t} in 16 px`);
    }
    prev = { step, t };

    const label = scene.querySelector('.fig-where');
    if (label && label.textContent && getComputedStyle(label).visibility !== 'hidden') {
      const twice = [...scene.querySelectorAll('.passage .where')].some((el) => { const q = el.getBoundingClientRect(); return el.textContent.trim() === label.textContent && q.bottom > floor + 6 && q.top < vh - 6; });
      if (twice) found.push(`y ${y}: the place "${label.textContent}" stands twice`);
    }
  }
  const expected = passages.map((_, i) => i).join(',');
  if (order.join(',') !== expected) found.push(`passages became active in the order ${order.join(',')}, expected ${expected}`);
  // the figure stays for about a third of a window after the last passage has reached the line
  const rest = restFrom !== null && pinnedUntil !== null ? pinnedUntil - restFrom : 0;
  if (side && rest < vh * 0.28) found.push(`the figure rests only ${Math.round(rest)} px after the last passage reached the line`);
  // keep the first report of each kind
  const kinds = new Map();
  for (const f of found) { const kind = f.replace(/^y [\d.]+: /, '').replace(/[\d.]+/g, 'n'); if (!kinds.has(kind)) kinds.set(kind, f); }
  const sorted = [...counts].sort((x, z) => x - z);
  return {
    id: scene.dataset.scene, problems: [...kinds.values()], shots,
    inView: sorted.length ? `${sorted[0]} to ${sorted[sorted.length - 1]}, mostly ${sorted[Math.floor(sorted.length / 2)]}` : '–',
    rest: Math.round(rest),
    length: Math.round(scene.getBoundingClientRect().height / vh * 10) / 10,
  };
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
    // a caption that follows the scene is reading matter, not an empty stretch
    const cap = b.el.querySelector('.scene-caption');
    const capR = cap && getComputedStyle(cap).display !== 'none' ? cap.getBoundingClientRect() : null;
    const tail = (capR && capR.height ? capR.top : b.r.bottom) - text.bottom;
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

for (const [w, h] of (process.env.SIZES ? JSON.parse(process.env.SIZES) : [[1440, 900], [390, 844], [768, 1024], [844, 390], [793, 496], [1366, 500]])) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: w < 1000, hasTouch: w < 1000 });
  page.on('pageerror', (e) => problems.push(`${w}x${h}: ${e.message}`));
  await page.goto(`http://127.0.0.1:${port}/${slug}/`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await page.evaluate(() => document.fonts.ready);
  const wait = (ms = 380) => page.evaluate((d) => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(ok, d)))), ms);
  await wait(200);
  const tag = `${w}x${h}`;
  // scenes as a sequence of stills: as MODES in lib/article.js (lower than
  // 450 px, narrow and short, or a tablet held upright: 700 to 999 px wide)
  const seq = h < 450 || (w < 640 && h < 560) || (w >= 700 && w < 1000 && h >= 560);

  const count = await page.evaluate(() => document.querySelectorAll('.scene').length);
  for (let i = 0; i < count && !seq; i++) {
    const res = await page.evaluate(walkScene, i);
    for (const p of res.problems) problems.push(`${tag} scene ${res.id}: ${p}`);
    console.log(`${tag} scene ${res.id}: ${res.length} windows long, ${res.inView} passages in view, figure rests ${res.rest} px at the end – ${res.problems.length ? res.problems.length + ' problems' : 'ok'}`);
    // three consecutive passages, each a little after it became the active one
    for (const k of [1, 2]) {
      if (res.shots[k] === undefined) continue;
      for (const [name, add] of [['early', 50], ['late', 260]]) {
        await page.evaluate((y) => scrollTo(0, y), res.shots[k] + add);
        await wait();
        await page.screenshot({ path: join(out, `${tag}-${res.id}-passage${k}-${name}.png`) });
      }
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
