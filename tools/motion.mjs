// Motion gate: is each step triggered by the scroll and played by time?
//
//   node tools/motion.mjs <slug> [WxH ...]            (default 1536x864 390x844 360x800)
//   node tools/motion.mjs <slug> --frames <scene>[:<step>] [WxH] [--out <dir>] [--n 12]
//
// The scroll decides which step a figure shows, a clock decides how it gets
// there (lib/article.js, "Scroll decides which step, time decides how").
// Before that, steps were scrubbed by the scroll: over one wheel tick they
// went "bang, bang" (17 November), at reading pace they lasted half a
// minute. This tool scrolls each scene, each figure in the text, each margin
// still and the margin scene in small steps (8 px, two frames each, in the
// browser's real time) and checks that
//   - between triggers the drawing does not change with the scroll (no step
//     is scrubbed),
//   - each triggered step plays by itself, the scroll held still, and is
//     complete when it stops (data-shown "step:1" for the goal),
//   - forward, it lasts 0.5 to 3.5 s in real time and is seen to change in at
//     least 8 distinct frames (never a jump),
//   - one step played backwards (scrolled back past its trigger) lasts at
//     least 0.3 s.
// It reports per step the real duration, the frames and the longest still
// stretch inside it (dead time over 40% is listed as a warning: the figure's
// own timeline idles). Scenes read as a sequence of stills (tablets upright,
// short windows, and on top any scene whose figure cannot be pinned legibly
// in its share of the window) have no motion by design and are skipped.
//
// --frames writes a frame sequence over one step of one scene, on a clock
// the tool drives (tools/clock.mjs), and a contact sheet: .shots/<slug>/motion/
// or --out. Exits 1 if a step is flagged.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';
import { clockScript } from './clock.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const slug = args.shift();
if (!slug) { console.error('usage: node tools/motion.mjs <slug> [WxH ...] | --frames <scene>[:<step>] [WxH] [--out dir]'); process.exit(1); }
const opt = (name) => { const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const framesOf = opt('--frames');
const outDir = opt('--out') || join(ROOT, '.shots', slug, 'motion');
const nFrames = Number(opt('--n') || 12);
const sizes = args.filter((a) => /^\d+x\d+$/.test(a)).map((a) => a.split('x').map(Number));
if (!sizes.length) sizes.push(...(framesOf ? [[1536, 864]] : [[1536, 864], [390, 844], [360, 800]]));
const STEP = 8;            // px of scroll between samples
const MIN_S = 0.5, MAX_S = 3.5, MIN_FRAMES = 8, MIN_BACK = 0.3, DEAD = 0.4;

const { server, port } = await startServer(join(ROOT, 'dist'));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 1800000 });

async function open(w, h, clock = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: w < 1000, hasTouch: w < 1000 });
  if (clock) await page.evaluateOnNewDocument(clockScript);
  await page.goto(`http://127.0.0.1:${port}/${slug}/`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise((ok) => setTimeout(ok, 400)));
  return page;
}

// Runs in the page: scrolls [from, to] in steps; at every position, two
// frames later, notes the goal and the drawing; when a step is triggered,
// holds the scroll and records every frame (real time) until it stops.
// Then scrolls back past the last trigger and records that too.
async function walk(index, from, to, step, backwards) {
  const el = document.querySelectorAll('[data-fig]')[index];
  const root = document.documentElement;
  const raf = () => new Promise((ok) => requestAnimationFrame(ok));
  const two = async () => { await raf(); await raf(); };
  const hash = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); };
  const sig = () => { const svg = el.querySelector('svg'); return svg ? hash(svg.outerHTML) : ''; };
  // a figure with an idle motion of its own changes without any scroll
  await two();
  const s0 = sig(); await two(); await two();
  const idle = sig() !== s0;
  const play = async (y) => {
    const t0 = performance.now();
    const frames = [{ t: 0, shown: el.dataset.shown, sig: sig() }];
    while (root.dataset.moving && performance.now() - t0 < 8000) {
      await raf();
      frames.push({ t: (performance.now() - t0) / 1000, shown: el.dataset.shown, sig: sig() });
    }
    return { y, goal: Number(el.dataset.goal), frames, stuck: !!root.dataset.moving };
  };
  const plays = [];
  const scrubbed = [];
  const player = window.__engine.players.find((q) => q.slot.el === el);
  let goal = String(player ? player.goal : el.dataset.goal);
  let last = sig();
  let lastY = null;
  let idleSeen = false;
  for (let y = Math.max(0, from); y <= to; y += step) {
    scrollTo(0, y);
    await two();
    // The hidden margin can prepare its next state before fading in.
    const fr = (el.querySelector('.fig-frame') || el).getBoundingClientRect();
    const onScreen = fr.bottom > 0 && fr.top < innerHeight && !el.closest('.rail-pin.is-away');
    if (el.dataset.goal !== undefined && Number(el.dataset.goal) > Number(goal) && onScreen && root.dataset.moving) {
      goal = el.dataset.goal;
      plays.push({ ...(await play(Math.round(scrollY))), from: Number(plays.length ? plays[plays.length - 1].goal : NaN) });
      lastY = Math.round(scrollY);
    } else {
      if (el.dataset.goal !== undefined) goal = el.dataset.goal;
      const now = sig();
      if (now !== last && !idle && onScreen && !root.dataset.moving) {
        // an idle motion that runs only in some states (the film runs while it
        // rests between its steps) changes with the scroll held still too: that
        // is idle motion, not a step scrubbed by the scroll
        const held = sig();
        await new Promise((ok) => setTimeout(ok, 300));
        if (sig() !== held) idleSeen = true; else scrubbed.push(Math.round(scrollY));
      }
    }
    last = sig();
    if (scrollY >= document.documentElement.scrollHeight - innerHeight - 1 && y > scrollY + step) break;
  }
  // backwards over the last trigger
  let back = null;
  if (lastY !== null && backwards) {
    scrollTo(0, lastY); await two();
    while (root.dataset.moving) await raf();
    const g = el.dataset.goal;
    for (let y = lastY - step; y > lastY - 600; y -= step) {
      scrollTo(0, y); await two();
      if (el.dataset.goal !== g) { back = await play(Math.round(scrollY)); break; }
    }
  }
  return { plays, scrubbed, back, idle: idle || idleSeen };
}

// Per playback: real duration from the first to the last visible change,
// distinct frames, the longest still stretch inside it.
function analyse(p) {
  const f = p.frames;
  const ch = [];
  for (let i = 1; i < f.length; i++) if (f[i].sig !== f[i - 1].sig) ch.push(i);
  if (!ch.length) return { dur: 0, frames: 0, dead: 0, end: f[f.length - 1].shown };
  const a = f[ch[0] - 1].t, b = f[ch[ch.length - 1]].t;
  let dead = 0;
  for (let k = 1; k < ch.length; k++) dead = Math.max(dead, f[ch[k]].t - f[ch[k - 1]].t);
  return { dur: b - a, frames: ch.length, dead: b > a ? dead / (b - a) : 0, end: f[f.length - 1].shown };
}

if (framesOf) {
  // ---- a frame sequence over one step of one scene, on the tool's clock ----
  const [sceneId, stepArg] = framesOf.split(':');
  const [w, h] = sizes[0];
  const page = await open(w, h, true);
  const info = await page.evaluate((id) => {
    const all = [...document.querySelectorAll('[data-fig]')];
    const scene = [...document.querySelectorAll('.scene')].find((s) => s.dataset.scene === id) || document.querySelectorAll('.scene')[Number(id)];
    if (!scene) return null;
    const el = scene.querySelector('.scene-stage [data-fig]');
    const r = scene.getBoundingClientRect();
    const p = window.__engine.players.find((q) => q.slot.el === el);
    return { index: all.indexOf(el), from: r.top + scrollY - innerHeight, to: r.bottom + scrollY, id: scene.dataset.scene, seq: p?.seq || [] };
  }, sceneId);
  if (!info) { console.error(`no scene "${sceneId}"`); process.exit(1); }
  const want = stepArg !== undefined ? Number(stepArg) : (info.seq[1] ?? info.seq[0]);
  const g = info.seq.indexOf(want);
  if (g < 0) { console.error(`scene ${info.id} has no step ${want} (steps ${info.seq.join(', ')})`); process.exit(1); }
  // scroll on the tool's clock until the step is triggered, letting everything before it finish
  const FRAME = 1000 / 60;
  const trig = await page.evaluate((ix, from, to, goal, ms) => {
    __clock.start();
    const el = document.querySelectorAll('[data-fig]')[ix];
    for (let y = Math.max(0, from); y <= to; y += 4) {
      __clock.scroll(y, ms);
      if (Number(el.dataset.goal) >= goal) return y;
      for (let k = 0; k < 400 && document.documentElement.dataset.moving; k++) __clock.tick(ms);
    }
    return null;
  }, info.index, info.from, info.to, g + 1, FRAME);
  if (trig === null) { console.error(`step ${want} is never triggered in scene ${info.id}`); process.exit(1); }
  const dur = await page.evaluate((ix, gi) => { const el = document.querySelectorAll('[data-fig]')[ix]; const p = window.__engine.players.find((q) => q.slot.el === el); return window.__engine.duration(p, gi); }, info.index, g);
  mkdirSync(outDir, { recursive: true });
  const files = [];
  const span = dur * 1.08;
  let at = 0;
  for (let i = 0; i < nFrames; i++) {
    const want2 = span * i / (nFrames - 1);
    const n = Math.round((want2 - at) * 1000 / FRAME);
    await page.evaluate((k, ms) => { for (let j = 0; j < k; j++) __clock.tick(ms); }, n, FRAME);
    at += n * FRAME / 1000;
    const shown = await page.evaluate((ix) => document.querySelectorAll('[data-fig]')[ix].dataset.shown, info.index);
    const file = join(outDir, `${slug}-${info.id}-step${want}-${w}x${h}-${String(i + 1).padStart(2, '0')}.png`);
    const b64 = await page.screenshot({ path: file, encoding: 'base64' });
    files.push({ s: at, shown, b64 });
    console.log(`frame ${i + 1}: ${at.toFixed(2)} s after the trigger, shown ${shown}`);
  }
  const helper = await browser.newPage();
  await helper.setContent('<!doctype html><body></body>');
  const sheet = await helper.evaluate(async (frames, label) => {
    const imgs = await Promise.all(frames.map(async (f) => { const im = new Image(); im.src = `data:image/png;base64,${f.b64}`; await im.decode(); return im; }));
    const cols = 4; const rows = Math.ceil(imgs.length / cols);
    const s = Math.min(1, 480 / imgs[0].naturalWidth);
    const cw = Math.round(imgs[0].naturalWidth * s); const ch = Math.round(imgs[0].naturalHeight * s);
    const c = document.createElement('canvas');
    c.width = cols * cw + (cols + 1) * 8; c.height = rows * (ch + 22) + (rows + 1) * 8 + 24;
    const g2 = c.getContext('2d');
    g2.fillStyle = '#ddd'; g2.fillRect(0, 0, c.width, c.height);
    g2.fillStyle = '#111'; g2.font = '14px sans-serif'; g2.fillText(label, 8, 18);
    imgs.forEach((im, i) => {
      const x = 8 + (i % cols) * (cw + 8); const y = 32 + Math.floor(i / cols) * (ch + 30);
      g2.drawImage(im, x, y + 18, cw, ch);
      g2.fillText(`${i + 1}: ${frames[i].s.toFixed(2)} s  shown ${frames[i].shown}`, x, y + 13);
    });
    return c.toDataURL('image/png').split(',')[1];
  }, files, `${slug} · scene ${info.id} · step ${want} · ${w}x${h} · played over ${dur.toFixed(1)} s, scroll held still`);
  const sheetFile = join(outDir, `${slug}-${info.id}-step${want}-${w}x${h}-sheet.png`);
  writeFileSync(sheetFile, Buffer.from(sheet, 'base64'));
  console.log(`step ${want} of scene ${info.id} triggered at scroll ${trig}, played over ${dur.toFixed(2)} s; sheet: ${sheetFile}`);
  await browser.close(); server.close();
  process.exit(0);
}

// ---- the gate ----
const problems = [];
const warnings = [];
const report = [];
for (const [w, h] of sizes) {
  const page = await open(w, h);
  const tag = `${w}x${h}`;
  const slots = await page.evaluate(() => [...document.querySelectorAll('[data-fig]')].map((el, index) => {
    const r = (el.closest('.scene') || el).getBoundingClientRect();
    const marks = [...document.querySelectorAll('.margin-mark:not(.margin-end)')].map((m) => m.getBoundingClientRect().top + scrollY);
    return {
      index, id: el.dataset.fig, role: el.dataset.role, state: Number(el.dataset.state || 0),
      scene: el.closest('.scene')?.dataset.scene || '',
      shown: !!el.getClientRects().length && getComputedStyle(el).display !== 'none' && !el.closest('details:not([open])') && !!el.dataset.shown,
      top: r.top + scrollY, bottom: r.bottom + scrollY, marks,
    };
  }));
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  for (const s of slots) {
    if (!s.shown || s.role === 'seq') continue;
    let from, to;
    if (s.role === 'scene') { from = s.top - h; to = s.bottom; }
    else if (s.role === 'margin') { if (!s.marks.length) continue; from = s.marks[0] - h; to = s.marks[s.marks.length - 1] + h * 0.2; }
    else { from = s.top - 1.2 * h; to = s.top + 0.3 * h; }
    // a figure in the text or a still plays once and has no step back
    const res = await page.evaluate(walk, s.index, Math.round(from), Math.round(to), STEP, s.role === 'scene' || s.role === 'margin');
    const name = s.role === 'scene' ? `scene ${s.scene}` : s.role === 'margin' ? `margin ${s.id}` : `${s.role} ${s.id}${s.role === 'still' ? `:${s.state}` : ''}`;
    const parts = [];
    for (const p of res.plays) {
      const a = analyse(p);
      const what = `goal ${p.goal}`;
      parts.push(`${what}: ${a.dur.toFixed(2)} s, ${a.frames} frames, dead ${Math.round(a.dead * 100)}%, ends ${a.end}${p.stuck ? ' STUCK' : ''}`);
      if (reduced) continue;
      if (p.stuck) problems.push(`${tag} ${name} ${what}: still playing after 8 s`);
      else if (!a.end?.endsWith(':1')) problems.push(`${tag} ${name} ${what}: stops at ${a.end}, not complete`);
      if (a.frames && a.dur < MIN_S) problems.push(`${tag} ${name} ${what}: played in ${a.dur.toFixed(2)} s`);
      if (a.dur > MAX_S) problems.push(`${tag} ${name} ${what}: played over ${a.dur.toFixed(2)} s`);
      if (a.frames && a.frames < MIN_FRAMES) problems.push(`${tag} ${name} ${what}: seen to change in only ${a.frames} frames`);
      if (a.dead > DEAD) warnings.push(`${tag} ${name} ${what}: the drawing stands still for ${Math.round(a.dead * 100)}% of the step`);
    }
    if (res.back) {
      const a = analyse(res.back);
      parts.push(`back to goal ${res.back.goal}: ${a.dur.toFixed(2)} s, ${a.frames} frames`);
      if (!reduced && a.frames && a.dur < MIN_BACK) problems.push(`${tag} ${name} back to goal ${res.back.goal}: played in ${a.dur.toFixed(2)} s`);
    }
    if (res.scrubbed.length) {
      parts.push(`changes with the scroll alone at ${res.scrubbed.length} positions (first ${res.scrubbed[0]})`);
      problems.push(`${tag} ${name}: the drawing changes with the scroll between triggers (${res.scrubbed.length} positions, first at ${res.scrubbed[0]})`);
    }
    if (res.idle) parts.push('(idle motion of its own)');
    if (!res.plays.length) parts.push('no step triggered in this range');
    const line = `${tag} ${name}\n    ${parts.join('\n    ')}`;
    report.push(line);
    console.log(line);
  }
  await page.close();
}

mkdirSync(join(ROOT, '.shots'), { recursive: true });
writeFileSync(join(ROOT, '.shots', `motion-${slug}.md`), `# Motion: ${slug}\n\n\`\`\`\n${report.join('\n')}\n\`\`\`\n\n${problems.length ? `Problems:\n\n${problems.map((p) => `- ${p}`).join('\n')}` : 'No problems.'}\n\n${warnings.length ? `Warnings (dead time inside a step):\n\n${warnings.map((p) => `- ${p}`).join('\n')}\n` : ''}`);
await browser.close();
server.close();
if (warnings.length) console.log(`warnings:\n${warnings.join('\n')}`);
console.log(problems.length ? `problems:\n${problems.join('\n')}` : 'no problems');
process.exit(problems.length ? 1 : 0);
