// Timing: how long each drawing takes, in real time, for real readers.
//
//   node tools/timing.mjs [slug ...] [WxH ...] [--wheel|--trackpad]
//        (default: both articles; 1536x864 390x844; both readers)
//   node tools/timing.mjs --video [slug ...]   videos at reading pace into .shots/video/
//
// The engine (lib/article.js) triggers a step by scroll and plays it by
// time. This tool reads each page from top to bottom as two readers do,
// in the browser's real time, and records with wall-clock timestamps when
// each step is triggered, when the drawing visibly starts and when it is
// visibly complete (a signature of the SVG, at every change of data-shown),
// and when the reader reaches the passage the step belongs to.
//
// Readers, both at a steady reading pace (230 words a minute over the text
// that crosses the reading line, half the window; never faster than half a
// window per second where there is little text):
//   - wheel: 100 px ticks, no smooth scrolling; before each tick the reader
//     reads the text that tick brings past the reading line;
//   - trackpad: scrolls continuously at reading pace, every frame.
// Time while nothing plays (no data-moving on the root) is skipped: the
// engine is idle then, so nothing on screen can change, and skipping it is
// exact. Reader times are that clock ("reading time"); durations of steps
// are measured in real time only.
//
// For each step: duration (first to last visible change), lag after the
// trigger, and when it completes relative to the reader reaching its
// passage (scene: the step's first passage; margin scene: the paragraph
// after its marker; still: the paragraph after it). Half read: reached plus
// half its words at reading pace. A figure in the text has no passage: it
// must be complete before it starts to leave the window.
// Flags: under 0.5 s, over 3.5 s, complete after the passage is half read.
//
// Output: .shots/TIMING.md and .shots/timing.json. Not committed.

import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';
import { clockScript } from './clock.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FFMPEG = process.env.FFMPEG || 'C:/ProgramData/chocolatey/bin/ffmpeg.exe';
const args = process.argv.slice(2);
const VIDEO = args.includes('--video');
const slugs = args.filter((a) => /^[a-z][a-z-]+$/.test(a));
if (!slugs.length) slugs.push('renovate', 'other-half');
const sizes = args.filter((a) => /^\d+x\d+$/.test(a)).map((a) => a.split('x').map(Number));
if (!sizes.length) sizes.push([1536, 864], [390, 844]);
const readers = args.includes('--wheel') ? ['wheel'] : args.includes('--trackpad') ? ['trackpad'] : ['wheel', 'trackpad'];
const WPM = 230;           // steady reading pace
const VMAX = 0.5;          // at most half a window of scroll per second at reading pace
const TICK = 100;          // px per wheel tick
const FLAG_MIN = 0.5, FLAG_MAX = 3.5;
const NAMES = { renovate: 'Renovate', 'other-half': 'Quantum (other-half)' };

const { server, port } = await startServer(join(ROOT, 'dist'));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 3600000 });

async function open(slug, w, h, clock = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: w < 1000, hasTouch: w < 1000 });
  if (clock) await page.evaluateOnNewDocument(clockScript);
  await page.goto(`http://127.0.0.1:${port}/${slug}/`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; return new Promise((ok) => setTimeout(ok, 500)); });
  return page;
}

// ---------------------------------------------------------------------------
// In the page: the layout (slots, passages, text blocks, markers)
// ---------------------------------------------------------------------------
function layoutInPage() {
  const Y = scrollY;
  const top = (el) => el.getBoundingClientRect().top + Y;
  const visible = (el) => !!el.getClientRects().length && !el.closest('details:not([open])')
    && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
  const words = (el) => (el.innerText || '').trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  const first = (el, n = 7) => words(el).slice(0, n).join(' ');
  const SEL = 'h1, h2, h3, h4, p, li, figcaption, tr, dt, dd, blockquote, .deck';
  const cand = [...document.querySelectorAll(SEL)]
    .filter((el) => !el.closest('.src-body, .sources, [role="dialog"], .popover, .vh, .fig-where, .toc-fold'))
    .filter(visible);
  const set = new Set(cand);
  const blocks = cand.filter((el) => { for (let a = el.parentElement; a; a = a.parentElement) if (set.has(a)) return false; return true; })
    .map((el) => { const r = el.getBoundingClientRect(); return { top: r.top + Y, bottom: r.bottom + Y, words: words(el).length }; })
    .filter((b) => b.words > 0)
    .sort((a, b) => a.top - b.top);
  const para = (el, kind) => { const r = el.getBoundingClientRect(); return { top: r.top + Y, bottom: r.bottom + Y, words: words(el).length, text: first(el), kind }; };
  const players = window.__engine?.players || [];
  const slots = [...document.querySelectorAll('[data-fig]')].map((el, index) => {
    const role = el.dataset.role;
    const scene = el.closest('.scene');
    const box = (role === 'scene' ? scene : el.querySelector('.fig-frame') || el).getBoundingClientRect();
    const p = players.find((q) => q.slot.el === el);
    const info = {
      index, id: el.dataset.fig, role, state: Number(el.dataset.state || 0),
      shown: visible(el) && !!el.dataset.shown, folded: !!el.closest('details:not([open])') || !!el.querySelector('details:not([open])'),
      top: box.top + Y, bottom: box.bottom + Y, scene: scene?.dataset.scene || '', seq: p ? p.seq : [], refs: [],
    };
    if (role === 'scene' && scene) {
      // the first passage of each step, with its text's own bottom
      const ps = [...scene.querySelectorAll('.passage')];
      ps.forEach((q, i) => {
        if (i > 0 && q.dataset.step === ps[i - 1].dataset.step) return;
        const r = q.getBoundingClientRect();
        info.refs.push({ top: r.top + Y, bottom: q.lastElementChild.getBoundingClientRect().bottom + Y, words: words(q).length, text: first(q), kind: 'passage' });
      });
    } else if (role === 'figure') {
      info.refs.push({ top: box.top + Y, bottom: box.bottom + Y, words: 0, text: el.querySelector('figcaption') ? first(el.querySelector('figcaption')) : el.dataset.fig, kind: 'figure' });
    } else if (role === 'still') {
      let next = el.nextElementSibling;
      while (next && !(next.matches('p, ul, ol') && visible(next))) next = next.nextElementSibling;
      if (next) info.refs.push(para(next, 'paragraph after'));
    } else if (role === 'margin') {
      for (const m of document.querySelectorAll('.margin-mark:not(.margin-end)')) {
        let next = m.nextElementSibling;
        while (next && !(next.matches('p, ul, ol, h2') && visible(next))) next = next.nextElementSibling;
        info.refs.push(next ? para(next, 'paragraph after marker') : { top: top(m), bottom: top(m), words: 0, text: '', kind: 'marker' });
      }
    }
    return info;
  });
  const sections = [...document.querySelectorAll('h2.sec')].map((h) => ({ id: h.id, top: top(h) }));
  const side = matchMedia('(min-width: 1000px) and (min-height: 560px), (min-width: 640px) and (min-height: 450px) and (max-height: 559.98px)').matches;
  const topm = matchMedia('(max-width: 699.98px) and (min-height: 560px)').matches;
  return { slots, blocks, sections, mode: side ? 'side' : topm ? 'top' : 'seq', maxScroll: document.documentElement.scrollHeight - innerHeight, vh: innerHeight, rail: !!document.querySelector('.rail-pin')?.getClientRects().length };
}

// ---------------------------------------------------------------------------
// The reading model: scroll position <-> seconds of reading
// ---------------------------------------------------------------------------
function readingModel(L, wpm = WPM) {
  const { blocks, vh, maxScroll } = L;
  const line = vh * 0.5;
  const tops = [];
  for (const b of blocks) {
    const y = Math.min(maxScroll, Math.max(0, b.top - line));
    if (tops.length && Math.abs(tops[tops.length - 1].y - y) < 1) tops[tops.length - 1].words += b.words;
    else tops.push({ y, words: b.words });
  }
  const pts = [{ y: 0, T: 0 }];
  const minT = (dy) => dy / (VMAX * vh);
  if (tops.length && tops[0].y > 0) pts.push({ y: tops[0].y, T: minT(tops[0].y) });
  for (let i = 0; i < tops.length; i++) {
    const yNext = i + 1 < tops.length ? tops[i + 1].y : maxScroll;
    const dy = Math.max(0, yNext - tops[i].y);
    pts.push({ y: yNext, T: pts[pts.length - 1].T + Math.max(tops[i].words * 60 / wpm, minT(dy)) });
  }
  const clean = [];
  for (const p of pts) { if (clean.length && p.y < clean[clean.length - 1].y) p.y = clean[clean.length - 1].y; clean.push(p); }
  return clean;
}
// (shared with the page: these two are passed in as source)
function modelAt(pts, y) {
  if (y <= pts[0].y) return pts[0].T;
  for (let k = pts.length - 1; k >= 0; k--) {
    if (pts[k].y <= y) {
      const n = pts[k + 1];
      if (!n || n.y === pts[k].y) return pts[k].T;
      return pts[k].T + (y - pts[k].y) / (n.y - pts[k].y) * (n.T - pts[k].T);
    }
  }
  return 0;
}
function modelInv(pts, t) {
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1];
    if (t >= a.T && t <= b.T) return b.T === a.T ? a.y : a.y + (t - a.T) / (b.T - a.T) * (b.y - a.y);
  }
  return pts[pts.length - 1].y;
}

// ---------------------------------------------------------------------------
// In the page: one reader, top to bottom, in real time
// ---------------------------------------------------------------------------
async function readInPage(kind, pts, zones, tick, atSrc, invSrc) {
  // eslint-disable-next-line no-new-func
  const at = new Function(`return ${atSrc}`)();
  // eslint-disable-next-line no-new-func
  const inv = new Function(`return ${invSrc}`)();
  const root = document.documentElement;
  const els = [...document.querySelectorAll('[data-fig]')];
  const players = window.__engine.players;
  const playerOf = new Map(players.map((p) => [p.slot.el, p]));
  const hash = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); };
  const t0 = performance.now();
  let skipped = 0;
  const V = () => (performance.now() - t0) / 1000 + skipped;
  const events = [];
  const mo = new MutationObserver((list) => {
    const v = V();
    for (const m of list) {
      const el = m.target;
      const i = els.indexOf(el);
      if (m.attributeName === 'data-goal') events.push({ V: v, i, a: 'g', v: Number(el.dataset.goal) });
      else {
        const svg = el.querySelector('svg');
        events.push({ V: v, i, a: 's', v: el.dataset.shown, pos: playerOf.get(el)?.pos ?? null, h: svg ? hash(svg.outerHTML) : '' });
      }
    }
  });
  const frame = () => new Promise((ok) => requestAnimationFrame(() => setTimeout(ok, 0)));
  // start at the top, everything set
  scrollTo(0, 0);
  await frame(); await frame();
  window.__engine.finish();
  // the state of every figure before the reader starts
  const initial = els.map((el) => { const svg = el.querySelector('svg'); return { shown: el.dataset.shown || '', goal: el.dataset.goal !== undefined ? Number(el.dataset.goal) : (playerOf.get(el)?.goal ?? 0), h: svg ? hash(svg.outerHTML) : '' }; });
  for (const el of els) mo.observe(el, { attributes: true, attributeFilter: ['data-shown', 'data-goal'] });
  const max = document.documentElement.scrollHeight - innerHeight;
  const ylog = [{ V: 0, y: 0 }];
  const near = (y) => zones.some(([a, b]) => y >= a && y <= b);
  const go = async (y) => { scrollTo(0, y); ylog.push({ V: V(), y: Math.round(scrollY) }); await frame(); };
  let y = 0;
  if (kind === 'wheel') {
    while (y < max) {
      const yn = Math.min(max, y + tick);
      const end = V() + (at(pts, yn) - at(pts, y));
      // the reader reads; whatever plays, plays in real time
      while (V() < end) {
        if (root.dataset.moving) await frame();
        else { skipped += end - V(); break; }
      }
      y = yn;
      await go(y);
    }
  } else {
    while (y < max) {
      let yn;
      if (root.dataset.moving) yn = Math.max(y, Math.min(max, inv(pts, V())));
      else {
        yn = Math.min(max, y + (near(y) ? 4 : 48));
        const want = at(pts, yn);
        if (want > V()) skipped += want - V();
      }
      if (yn !== y) { y = yn; await go(y); } else await frame();
    }
  }
  // let the last steps finish
  for (let k = 0; k < 400 && root.dataset.moving; k++) await frame();
  mo.disconnect();
  return { events, ylog, initial, total: V() };
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------
// When the reader's scroll first reaches y (reading time).
function whenAt(ylog, y) {
  for (const p of ylog) if (p.y >= y - 0.5) return p.V;
  return null;
}

function analyse(run, L) {
  const { events, ylog, initial } = run;
  const vh = L.vh;
  const rows = [];
  for (const slot of L.slots) {
    if (!slot.shown || slot.role === 'seq' || !slot.seq.length) continue;
    const ev = events.filter((e) => e.i === slot.index);
    const goals = ev.filter((e) => e.a === 'g');
    const shows = ev.filter((e) => e.a === 's');
    let goal = initial[slot.index].goal;
    for (let gi = 0; gi < goals.length; gi++) {
      const g = goals[gi];
      const from = goal;
      goal = g.v;
      if (g.v <= from) continue;   // readers only read forward; a goal going back is the engine resetting an unseen figure
      // the frames from the trigger on; a step is followed to its own end,
      // even when the next trigger comes while it plays
      const after = shows.filter((e) => e.V >= g.V - 1e-6 && e.pos !== null);
      for (let i = from; i < g.v; i++) {
        const seg = [];
        let interrupted = false;
        for (const e of after) {
          if (e.pos <= i + 1e-9) { if (seg.length) { interrupted = true; break; } continue; }
          if (e.pos > i + 1 + 1e-9) break;
          seg.push(e);
          if (e.pos >= i + 1 - 1e-9 || e.v === `${slot.seq[i]}:1`) break;
        }
        const ref = slot.role === 'margin' ? slot.refs[i] : slot.role === 'scene' ? slot.refs[i] : slot.refs[0];
        const row = { slot, i, step: slot.seq[i], trigger: g.V, ref, skipped: false, interrupted };
        // no frame inside the step, or one frame that lands on its end: set at once
        if (!seg.length || (seg.length === 1 && seg[0].pos >= i + 1 - 1e-9)) { row.skipped = true; rows.push(row); continue; }
        const k0 = shows.indexOf(seg[0]);
        let lastH = k0 > 0 ? shows[k0 - 1].h : initial[slot.index].h;
        const prevV = k0 > 0 ? Math.max(g.V, shows[k0 - 1].V) : g.V;
        let start = null, end = null;
        for (const e of seg) { if (e.h !== lastH) { if (start === null) start = e.V; end = e.V; } lastH = e.h; }
        // the frame before the first change is when the drawing starts to move
        row.start = start === null ? null : Math.max(prevV, start - 1 / 60);
        row.end = end;
        row.dur = start === null ? 0 : end - row.start;
        row.lag = start === null ? null : row.start - g.V;
        if (ref) {
          const line = vh * 0.5;
          row.reach = whenAt(ylog, ref.top - line);
          // half read: a passage, when the reader has spent half its words at
          // reading pace after reaching it; a figure in the text, when it
          // starts to leave the window (it is not pinned: it has to finish
          // while it is still on screen)
          row.half = ref.kind === 'figure' ? whenAt(ylog, ref.top) : row.reach == null ? null : row.reach + 0.5 * ref.words * 60 / WPM;
          // where the passage stood when the step was triggered (% of the window from the top)
          const yAtTrig = [...ylog].reverse().find((p) => p.V <= g.V + 1e-6)?.y ?? 0;
          row.refPct = Math.round((ref.top - yAtTrig) / vh * 100);
        }
        rows.push(row);
      }
    }
  }
  return rows;
}

const sizeOf = (slot) => (slot.role === 'scene' ? 'LARGE' : slot.role === 'figure' ? 'MEDIUM' : 'SMALL');
const nameOf = (slot) => (slot.role === 'scene' ? slot.scene : slot.role === 'still' ? `${slot.id} still` : slot.role === 'margin' ? `${slot.id} (rail)` : slot.id);
const stepName = (r) => (r.slot.role === 'scene' ? (r.i === 0 ? `${r.step} (entry)` : `${r.slot.seq[r.i - 1]}→${r.step}`)
  : r.slot.role === 'margin' ? (r.i === 0 ? `${r.step}` : `${r.slot.seq[r.i - 1]}→${r.step}`) : `${r.step}`);
const f1 = (x) => (x == null || !Number.isFinite(x) ? '–' : x.toFixed(1));
const f2 = (x) => (x == null || !Number.isFinite(x) ? '–' : x.toFixed(2));

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const results = [];
async function measure(slug, w, h, kind) {
  const page = await open(slug, w, h);
  const L = await page.evaluate(layoutInPage);
  const pts = readingModel(L);
  const zones = [];
  for (const s of L.slots) {
    if (!s.shown || s.role === 'seq') continue;
    if (s.role === 'margin') for (const r of s.refs) zones.push([r.top - 1.3 * h, r.top]);
    else zones.push([s.top - 1.3 * h, s.bottom + 0.3 * h]);
  }
  const t = Date.now();
  const run = await page.evaluate(readInPage, kind, pts, zones, TICK, modelAt.toString(), modelInv.toString());
  await page.close();
  const rows = analyse(run, L);
  for (const r of rows) {
    r.size = sizeOf(r.slot);
    const flags = [];
    if (!r.skipped && r.dur > 0 && r.dur < FLAG_MIN) flags.push('under 0.5 s');
    if (!r.skipped && r.dur > FLAG_MAX) flags.push('over 3.5 s');
    if (!r.skipped && r.end != null && r.half != null && r.end > r.half) flags.push('complete after the passage is half read');
    r.flags = flags;
  }
  results.push({ slug, w, h, kind, L, rows, total: run.total, wall: (Date.now() - t) / 1000 });
  console.log(`  ${slug} ${w}x${h} ${kind}: ${rows.length} steps, page read in ${(run.total / 60).toFixed(1)} min of reading time (${((Date.now() - t) / 1000).toFixed(0)} s to run)`);
}

if (VIDEO) {
  await videos();
  await browser.close(); server.close();
  process.exit(0);
}

for (const slug of slugs) for (const [w, h] of sizes) for (const kind of readers) { console.log(`reading ${slug} ${w}x${h} (${kind})`); await measure(slug, w, h, kind); }
writeReport();
await browser.close();
server.close();

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------
function writeReport() {
  const all = [];
  const out = ['# Timing of the drawings (real time)', ''];
  out.push(`Measured ${new Date().toISOString().slice(0, 16).replace('T', ' ')} by \`node tools/timing.mjs\` on the built \`dist/\`.`, '');
  out.push('**How to read this.**',
    '- **Sizes.** LARGE = pinned scene figure; MEDIUM = figure in the text; SMALL = the margin scene in the rail, or its stills in the text.',
    `- **Readers.** wheel: ${TICK} px ticks, each after reading the text it brings past the reading line (${WPM} wpm); trackpad: continuous scroll at that pace. Time while nothing plays is skipped (exact: the engine is idle); durations are real time.`,
    '- **at trigger.** Where the step\'s passage stood when the step was triggered, % of the window from the top.',
    '- **dur.** First to last visible change of the SVG, in seconds of real time. **lag**: from the trigger to the first change.',
    '- **vs reach.** When the step is complete relative to the reader reaching its passage (its top at the reading line, half the window): negative = complete before. **vs half**: relative to the passage half read (reached, plus half its words at reading pace; a figure in the text: when it starts to leave the window). A step overtaken by the next trigger is followed to its own end (marked *overtaken*).',
    '');
  for (const res of results) for (const r of res.rows) all.push({ ...r, slug: res.slug, vp: `${res.w}x${res.h}`, kind: res.kind });
  const live = all.filter((a) => !a.skipped && a.dur > 0);
  const stats = (xs) => { const s = [...xs].sort((a, b) => a - b); if (!s.length) return '–'; return `min ${f2(s[0])} s, median ${f2(s[Math.floor(s.length / 2)])} s, max ${f2(s[s.length - 1])} s (n=${s.length})`; };
  const sum = ['## Summary', ''];
  for (const vp of [...new Set(all.map((a) => a.vp))]) for (const kind of readers) {
    sum.push(`**${vp}, ${kind}**`, '');
    for (const slug of slugs) for (const size of ['LARGE', 'MEDIUM', 'SMALL']) {
      const xs = live.filter((a) => a.vp === vp && a.kind === kind && a.slug === slug && a.size === size).map((a) => a.dur);
      if (xs.length) sum.push(`- ${NAMES[slug] || slug} ${size}: ${stats(xs)}`);
    }
    const sel = all.filter((a) => a.vp === vp && a.kind === kind);
    sum.push(`- all: ${stats(live.filter((a) => a.vp === vp && a.kind === kind).map((a) => a.dur))}; set at once ${sel.filter((a) => a.skipped).length}; flagged ${sel.filter((a) => a.flags.length).length}`, '');
  }
  sum.push('### Flags', '');
  const flagged = all.filter((a) => a.flags.length);
  if (!flagged.length) sum.push('- none', '');
  else {
    const by = new Map();
    for (const a of flagged) { const k = `${a.vp} · ${a.kind} · ${NAMES[a.slug] || a.slug} · ${a.size}`; if (!by.has(k)) by.set(k, []); by.get(k).push(`${nameOf(a.slot)} ${stepName(a)} (${a.flags.join(', ')}; ${f2(a.dur)} s, vs half ${f1(a.end - a.half)} s)`); }
    for (const [k, v] of by) sum.push(`- ${k}: ${v.join('; ')}`);
    sum.push('');
  }
  const skippedRows = all.filter((a) => a.skipped);
  if (skippedRows.length) {
    sum.push('### Set at once (several steps behind: the second-last is set, the last plays)', '');
    const by = new Map();
    for (const a of skippedRows) { const k = `${a.vp} · ${a.kind} · ${NAMES[a.slug] || a.slug}`; if (!by.has(k)) by.set(k, []); by.get(k).push(`${nameOf(a.slot)} ${stepName(a)}`); }
    for (const [k, v] of by) sum.push(`- ${k}: ${v.join(', ')}`);
    sum.push('');
  }
  for (const res of results) {
    out.push(`## ${NAMES[res.slug] || res.slug}, ${res.w}×${res.h}, ${res.kind}`, '');
    out.push(`Scenes ${res.L.mode}${res.L.rail ? ', margin rail' : ''}; page read in ${(res.total / 60).toFixed(1)} min of reading time.`, '');
    out.push('| size | figure | step | passage (first words) | at trigger | lag s | dur s | vs reach s | vs half s | flags |', '|---|---|---|---|---|---|---|---|---|---|');
    for (const r of res.rows) {
      out.push(`| ${r.size} | ${nameOf(r.slot)} | ${stepName(r)} | ${(r.ref?.text || '').replace(/\|/g, '/')}… | ${r.refPct ?? '–'}% | ${r.skipped ? '–' : f2(r.lag)} | ${r.skipped ? 'set at once' : f2(r.dur)} | ${r.skipped ? '–' : f1(r.end - r.reach)} | ${r.skipped ? '–' : f1(r.end - r.half)} | ${[...r.flags, ...(r.interrupted ? ['overtaken'] : [])].join(', ')} |`);
    }
    out.push('');
  }
  const doc = [...out.slice(0, 4), ...sum, ...out.slice(4)];
  mkdirSync(join(ROOT, '.shots'), { recursive: true });
  writeFileSync(join(ROOT, '.shots', 'TIMING.md'), doc.join('\n'));
  writeFileSync(join(ROOT, '.shots', 'timing.json'), JSON.stringify(all.map((a) => ({
    slug: a.slug, vp: a.vp, reader: a.kind, size: a.size, figure: nameOf(a.slot), step: stepName(a), trigger: a.trigger, start: a.start, end: a.end,
    dur: a.dur, lag: a.lag, reach: a.reach, half: a.half, refPct: a.refPct, skipped: a.skipped, flags: a.flags,
  })), null, 1));
  console.log(sum.join('\n'));
  console.log(`wrote ${join(ROOT, '.shots', 'TIMING.md')}`);
}

// ---------------------------------------------------------------------------
// Videos at reading pace, on a clock the tool drives (tools/clock.mjs), so
// the steps play at their real speed however long a screenshot takes.
// ---------------------------------------------------------------------------
async function videos() {
  const dir = join(ROOT, '.shots', 'video');
  mkdirSync(dir, { recursive: true });
  const W = 1536, H = 864, FPS = 30;
  const scenes = (L) => L.slots.filter((s) => s.role === 'scene' && s.shown);
  const jobs = [
    // the first 90 s from a window above the first scene, trackpad at reading pace
    { slug: 'renovate', name: 'renovate-first-90s', reader: 'trackpad', from: (L) => scenes(L)[0].top - H, seconds: 90 },
    { slug: 'other-half', name: 'quantum-first-90s', reader: 'trackpad', from: (L) => scenes(L)[0].top - H, seconds: 90 },
    // one scene played through, wheel at reading pace
    { slug: 'renovate', name: 'renovate-scene-numbers-wheel', reader: 'wheel', scene: 'numbers' },
    { slug: 'other-half', name: 'quantum-scene-lattice-wheel', reader: 'wheel', scene: 'lattice' },
  ].filter((j) => slugs.includes(j.slug));
  for (const job of jobs) {
    const page = await open(job.slug, W, H, true);
    const L = await page.evaluate(layoutInPage);
    const pts = readingModel(L);
    let y0, y1;
    if (job.scene) {
      const s = scenes(L).find((x) => x.scene === job.scene) || scenes(L)[0];
      y0 = Math.max(0, s.top - H * 0.9); y1 = Math.min(L.maxScroll, s.bottom - H * 0.5);
    } else {
      y0 = Math.max(0, job.from(L));
      y1 = Math.min(L.maxScroll, modelInv(pts, modelAt(pts, y0) + job.seconds));
    }
    const T0 = modelAt(pts, y0), T1 = modelAt(pts, y1);
    // the scroll position at reading time T
    const yAt = job.reader === 'wheel'
      ? (T) => { let y = y0; while (y < y1 && modelAt(pts, Math.min(y1, y + TICK)) <= T) y = Math.min(y1, y + TICK); return y; }
      : (T) => Math.min(y1, modelInv(pts, T));
    const n = Math.round((T1 - T0 + 2.5) * FPS);   // and the last step played out
    const file = join(dir, `${job.name}-${W}x${H}.mp4`);
    console.log(`${job.name}: scroll ${Math.round(y0)}→${Math.round(y1)}, ${(n / FPS).toFixed(1)} s, ${n} frames`);
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((ok, bad) => { ff.on('close', (c) => (c === 0 ? ok() : bad(new Error(`ffmpeg exited ${c}`)))); });
    await page.evaluate((y) => scrollTo(0, y), Math.round(y0));
    await page.evaluate(() => new Promise((ok) => setTimeout(ok, 400)));
    await page.evaluate(() => { window.__engine.finish(); __clock.start(); });
    for (let i = 0; i < n; i++) {
      const y = Math.round(yAt(T0 + i / FPS));
      await page.evaluate((v, ms) => __clock.scroll(v, ms), y, 1000 / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 86 });
      if (!ff.stdin.write(buf)) await new Promise((ok) => ff.stdin.once('drain', ok));
      if (i % 450 === 0) console.log(`  frame ${i}/${n} at scroll ${y}`);
    }
    ff.stdin.end();
    await done;
    console.log(`wrote ${file}`);
    await page.close();
  }
}
