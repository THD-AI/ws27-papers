// Motion gate: is a drawing drawn, or does it just appear?
//
//   node tools/motion.mjs <slug> [WxH ...]            (default 1536x864 390x844)
//   node tools/motion.mjs <slug> --frames <scene>[:<step>] [WxH] [--out <dir>] [--n 12]
//
// Still screenshots cannot show motion, and readers working from them never
// caught it when every step of every scene was drawn in 30 to 60 px of
// scroll (17 November: "not an animation, just bang, bang, bang"). This tool
// scrolls each scene, each figure in the text and each margin still in fine
// steps (8 px) and measures, per step of the figure,
//   - draw: the scroll distance over which the engine's t for that step runs
//     from 0.02 to 0.98 (from data-shown, set by lib/article.js apply()),
//   - seen: the scroll distance over which the drawing itself changes while
//     that step is shown (a cheap signature of the SVG at every position),
// and flags any step drawn (or seen to change) in under 25% of the window
// height. A first step that arrives already complete is reported as such.
// Scenes read as a sequence of stills (tablets upright, short windows) have
// no motion by design and are skipped.
//
// --frames writes a frame sequence over one step of one scene (12 frames
// from just before t 0 to just after t 1) and a contact sheet of them, so a
// person can look at the motion: .shots/<slug>/motion/ or --out.
// Exits 1 if a step is flagged.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

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
if (!sizes.length) sizes.push(...(framesOf ? [[1536, 864]] : [[1536, 864], [390, 844]]));
const STEP = 8;            // px of scroll between samples
const FLAG = 0.25;         // a step drawn in less than this share of the window height is flagged

const { server, port } = await startServer(join(ROOT, 'dist'));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 900000 });

async function open(w, h) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: w < 1000, hasTouch: w < 1000 });
  await page.goto(`http://127.0.0.1:${port}/${slug}/`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise((ok) => setTimeout(ok, 400)));
  return page;
}

// Runs in the page: scrolls the range [from, to] in steps and returns, at
// every position, what the slot shows (data-shown) and a signature of its SVG.
async function sample(index, from, to, step) {
  const frame = () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  const el = document.querySelectorAll('[data-fig]')[index];
  const hash = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); };
  const out = [];
  for (let y = Math.max(0, from); y <= to; y += step) {
    scrollTo(0, y);
    await frame();
    const svg = el.querySelector('svg');
    out.push({ y: Math.round(scrollY), shown: el.dataset.shown || '', sig: svg ? hash(svg.outerHTML) : '' });
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 1 && y > scrollY + step) break;
  }
  return out;
}

// Per step: the scroll distance from t 0.02 to t 0.98 and the distance over
// which the drawing changes while the step is shown.
function analyse(samples) {
  const pts = samples.filter((s) => s.shown).map((s) => { const [step, t] = s.shown.split(':').map(Number); return { ...s, step, t }; });
  const steps = [...new Set(pts.map((p) => p.step))].sort((a, b) => a - b);
  const res = [];
  for (const s of steps) {
    const at = (cond) => pts.find((p) => p.step > s || (p.step === s && cond(p.t)));
    const a = at((t) => t >= 0.02);
    const b = at((t) => t >= 0.98);
    const firstSeen = pts.find((p) => p.step === s);
    const complete = firstSeen && firstSeen.t >= 0.98 && (s === steps[0] ? pts.indexOf(firstSeen) === 0 : true);
    const draw = a && b ? b.y - a.y : 0;
    // changes of the drawing attributed to this step
    const ys = [];
    for (let i = 1; i < pts.length; i++) if (pts[i].sig !== pts[i - 1].sig && pts[i].step === s) ys.push(pts[i].y);
    const seen = ys.length ? ys[ys.length - 1] - ys[0] + STEP : 0;
    res.push({ step: s, draw, seen, changes: ys.length, complete: !!complete && ys.length === 0, unfinished: !!a && !b });
  }
  return res;
}

const pts0 = (samples) => samples[samples.length - 1].shown;
const pct = (px, vh) => `${Math.round(px / vh * 100)}%`;

if (framesOf) {
  // ---- a frame sequence over one step of one scene ----
  const [sceneId, stepArg] = framesOf.split(':');
  const [w, h] = sizes[0];
  const page = await open(w, h);
  const info = await page.evaluate((id) => {
    const all = [...document.querySelectorAll('[data-fig]')];
    const scene = [...document.querySelectorAll('.scene')].find((s) => s.dataset.scene === id) || document.querySelectorAll('.scene')[Number(id)];
    if (!scene) return null;
    const el = scene.querySelector('.scene-stage [data-fig]');
    const r = scene.getBoundingClientRect();
    return { index: all.indexOf(el), from: r.top + scrollY - innerHeight, to: r.bottom + scrollY, id: scene.dataset.scene };
  }, sceneId);
  if (!info) { console.error(`no scene "${sceneId}"`); process.exit(1); }
  const samples = await page.evaluate(sample, info.index, info.from, info.to, 4);
  const pts = samples.map((s) => { const [step, t] = s.shown.split(':').map(Number); return { ...s, step, t }; });
  const want = stepArg !== undefined ? Number(stepArg) : (pts.find((p) => p.step > 0) || pts[0]).step;
  const a = pts.find((p) => p.step === want && p.t > 0);
  const b = pts.find((p) => p.step > want || (p.step === want && p.t >= 1));
  if (!a || !b) { console.error(`step ${want} is not drawn in scene ${info.id}`); process.exit(1); }
  const pad = Math.round((b.y - a.y) * 0.08);
  const y0 = a.y - pad; const y1 = b.y + pad;
  mkdirSync(outDir, { recursive: true });
  const files = [];
  for (let i = 0; i < nFrames; i++) {
    const y = Math.round(y0 + (y1 - y0) * i / (nFrames - 1));
    await page.evaluate((v) => scrollTo(0, v), y);
    await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
    const shown = await page.evaluate((ix) => document.querySelectorAll('[data-fig]')[ix].dataset.shown, info.index);
    const file = join(outDir, `${slug}-${info.id}-step${want}-${w}x${h}-${String(i + 1).padStart(2, '0')}.png`);
    const b64 = await page.screenshot({ path: file, encoding: 'base64' });
    files.push({ y, shown, b64 });
    console.log(`frame ${i + 1}: scroll ${y} (+${y - y0} px), shown ${shown}`);
  }
  // a contact sheet: the frames in a grid, labelled with scroll and t
  const helper = await browser.newPage();
  await helper.setContent('<!doctype html><body></body>');
  const sheet = await helper.evaluate(async (frames, label) => {
    const imgs = await Promise.all(frames.map(async (f) => { const im = new Image(); im.src = `data:image/png;base64,${f.b64}`; await im.decode(); return im; }));
    const cols = 4; const rows = Math.ceil(imgs.length / cols);
    const s = Math.min(1, 480 / imgs[0].naturalWidth);
    const cw = Math.round(imgs[0].naturalWidth * s); const ch = Math.round(imgs[0].naturalHeight * s);
    const c = document.createElement('canvas');
    c.width = cols * cw + (cols + 1) * 8; c.height = rows * (ch + 22) + (rows + 1) * 8 + 24;
    const g = c.getContext('2d');
    g.fillStyle = '#ddd'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#111'; g.font = '14px sans-serif'; g.fillText(label, 8, 18);
    imgs.forEach((im, i) => {
      const x = 8 + (i % cols) * (cw + 8); const y = 32 + Math.floor(i / cols) * (ch + 30);
      g.drawImage(im, x, y + 18, cw, ch);
      g.fillText(`${i + 1}: +${frames[i].y - frames[0].y} px  shown ${frames[i].shown}`, x, y + 13);
    });
    return c.toDataURL('image/png').split(',')[1];
  }, files, `${slug} · scene ${info.id} · step ${want} · ${w}x${h} · ${y1 - y0} px of scroll`);
  const sheetFile = join(outDir, `${slug}-${info.id}-step${want}-${w}x${h}-sheet.png`);
  writeFileSync(sheetFile, Buffer.from(sheet, 'base64'));
  console.log(`step ${want} of scene ${info.id} drawn from scroll ${a.y} to ${b.y} (${b.y - a.y} px, ${pct(b.y - a.y, h)} of the window); sheet: ${sheetFile}`);
  await browser.close(); server.close();
  process.exit(0);
}

// ---- the gate ----
const problems = [];
const report = [];
for (const [w, h] of sizes) {
  const page = await open(w, h);
  const tag = `${w}x${h}`;
  const slots = await page.evaluate(() => [...document.querySelectorAll('[data-fig]')].map((el, index) => {
    const r = (el.closest('.scene') || el).getBoundingClientRect();
    return {
      index, id: el.dataset.fig, role: el.dataset.role,
      scene: el.closest('.scene')?.dataset.scene || '',
      shown: !!el.getClientRects().length && getComputedStyle(el).display !== 'none' && !el.closest('details:not([open])'),
      top: r.top + scrollY, bottom: r.bottom + scrollY,
    };
  }));
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  for (const s of slots) {
    if (!s.shown || s.role === 'margin' || s.role === 'seq') continue;
    // a scene from a window before it to its end; a figure or still from 1.5 windows before to its top leaving
    const from = s.role === 'scene' ? s.top - h : s.top - 1.5 * h;
    const to = s.role === 'scene' ? s.bottom : s.top + 0.2 * h;
    const samples = await page.evaluate(sample, s.index, Math.round(from), Math.round(to), STEP);
    const res = analyse(samples);
    const name = s.role === 'scene' ? `scene ${s.scene}` : `${s.role} ${s.id}`;
    const parts = [];
    for (const r of res) {
      const bits = r.complete ? 'arrives complete' : r.unfinished ? `never complete (stops at ${pts0(samples)})`
        : `draw ${r.draw} px (${pct(r.draw, h)}), seen ${r.seen} px (${pct(r.seen, h)}, ${r.changes} changes)`;
      parts.push(`step ${r.step}: ${bits}`);
      if (r.unfinished) { problems.push(`${tag} ${name} step ${r.step}: never complete, even scrolled to the end`); continue; }
      if (reduced || r.complete) continue;
      // a continuation step held at t 1 has nothing to draw
      if (r.changes === 0) continue;
      if (r.draw < FLAG * h) problems.push(`${tag} ${name} step ${r.step}: drawn in ${r.draw} px (${pct(r.draw, h)} of the window)`);
      else if (r.changes > 1 && r.seen < FLAG * h) problems.push(`${tag} ${name} step ${r.step}: the drawing changes over only ${r.seen} px`);
    }
    const line = `${tag} ${name}\n    ${parts.join('\n    ')}`;
    report.push(line);
    console.log(line);
  }
  await page.close();
}

mkdirSync(join(ROOT, '.shots'), { recursive: true });
writeFileSync(join(ROOT, '.shots', `motion-${slug}.md`), `# Motion: ${slug}\n\n\`\`\`\n${report.join('\n')}\n\`\`\`\n\n${problems.length ? `Problems:\n\n${problems.map((p) => `- ${p}`).join('\n')}` : 'No problems.'}\n`);
await browser.close();
server.close();
console.log(problems.length ? `problems:\n${problems.join('\n')}` : 'no problems');
process.exit(problems.length ? 1 : 0);
