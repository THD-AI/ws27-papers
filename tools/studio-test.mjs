// The studio's system test (studio/README.md, "System test"): drives a
// studio page through reading scenarios on every device class, records a
// video and contact sheets per run, and checks the pass criteria by script.
//
//   node tools/studio-test.mjs [page=run.html] [devices=all|name,name] [--video]
//
// Output: .shots/studio/<page>/<device>/{slow.webm, sheet-*.png, report.json}
// and .shots/studio/<page>/summary.md. Chromium only: iOS toolbars, momentum
// and printing must still be checked on the real iPhone SE.

import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const page = args.find((a) => a.endsWith('.html')) || 'run.html';
const only = (args.find((a) => !a.startsWith('--') && !a.endsWith('.html')) || 'all').split(',');
const video = args.includes('--video');

export const DEVICES = [
  ['phone-360', 360, 800, true], ['iphone-se', 375, 667, true], ['phone-390', 390, 844, true], ['phone-430', 430, 932, true],
  ['phone-sideways', 844, 390, true], ['tablet-768', 768, 1024, true], ['tablet-820', 820, 1180, true], ['tablet-sideways', 1180, 820, true],
  ['ipad-pro-upright', 1024, 1366, true], ['surface-upright', 960, 1440, true], ['surface-sideways', 1440, 960, true],
  ['window-960x540', 960, 540, false], ['laptop-1366', 1366, 768, false], ['laptop-1440', 1440, 900, false], ['laptop-1536', 1536, 864, false],
  ['desktop-1920', 1920, 1080, false], ['desktop-2560', 2560, 1440, false], ['ultrawide-3440', 3440, 1440, false],
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function scrollRead(p, pxPerSec = 260, stepMs = 50) {
  const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const per = pxPerSec * stepMs / 1000;
  for (let y = 0; y < total; y += per) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await wait(stepMs); }
}

async function measure(p) {
  return p.evaluate(() => {
    const T = window.__tell;
    let minFont = Infinity;
    for (const t of document.querySelectorAll('.stage text')) {
      const svg = t.ownerSVGElement;
      if (!svg || !t.textContent.trim() || !t.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      if (+getComputedStyle(t).opacity < 0.05 || [...svg.querySelectorAll('g')].some((g) => g.contains(t) && +getComputedStyle(g).opacity < 0.05)) continue;
      const fs = parseFloat(t.getAttribute('font-size') || getComputedStyle(t).fontSize);
      const m = svg.getScreenCTM(); if (!m) continue;
      minFont = Math.min(minFont, fs * m.a);
    }
    return { line: T.line, cls: T.cls, violations: T.violations.length, steps: T.steps.slice(), frames: T.frames.slice(), durWarn: T.durWarn.slice(), lastMotion: T.lastMotion, now: performance.now(), minFont: Number.isFinite(minFont) ? minFont : null };
  });
}

async function runDevice(browser, base, [name, w, h, mobile], outDir) {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  // an independent sampler, outside the engine: every frame, how many figures
  // are visible on any stage (a set's fading overlay excluded)
  await p.evaluateOnNewDocument(() => {
    window.__sample = { max: 0, twoFrames: 0 };
    const tick = () => {
      for (const st of document.querySelectorAll('.stage')) {
        const n = [...st.children].filter((l) => l.classList.contains('layer') && !l.classList.contains('ghost-out') && +getComputedStyle(l).opacity > 0.02).length;
        if (n > window.__sample.max) window.__sample.max = n;
        if (n > 1) window.__sample.twoFrames++;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(base + page, { waitUntil: 'networkidle0' });
  await wait(600);
  const res = { device: name, size: `${w}x${h}`, errors, checks: {} };

  // 1. slow read, with contact sheets every 0.6 screen (old sheets cleared first)
  for (const f of (await import('node:fs')).readdirSync(outDir)) if (f.startsWith('sheet-')) (await import('node:fs')).rmSync(join(outDir, f));
  let rec = null;
  if (video) rec = await p.screencast({ path: join(outDir, 'slow.webm') });
  const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  let sheet = 0, nextShot = 0;
  const per = 13, stepMs = 50;
  let maxMinFont = Infinity;
  for (let y = 0; y <= total; y += per) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await wait(stepMs);
    if (y >= nextShot) {
      await wait(900);   // let a step finish, as a reader's eye does
      const m = await measure(p);
      if (m.minFont != null && m.minFont < maxMinFont) maxMinFont = m.minFont;
      await p.screenshot({ path: join(outDir, `sheet-${String(sheet++).padStart(3, '0')}.png`) });
      nextShot += 0.6 * h;
    }
  }
  if (rec) await rec.stop();
  const stopAt = await p.evaluate(() => performance.now());
  await wait(2600);
  const m1 = await measure(p);
  res.cls = m1.cls;
  const smp = await p.evaluate(() => window.__sample);
  res.sampled = smp;
  res.checks.twoFigures = m1.violations === 0 && smp.twoFrames === 0;
  res.checks.stillAfter2500 = m1.lastMotion <= stopAt + 2500;
  const played = m1.steps.filter((s) => s.end && s.dir > 0);
  const durs = played.map((s) => (s.end - s.start) / 1000);
  res.stepDurations = durs.map((d) => +d.toFixed(2));
  res.checks.stepClamp = m1.durWarn.length === 0;
  res.durWarn = m1.durWarn;
  res.minFont = Number.isFinite(maxMinFont) ? +maxMinFont.toFixed(1) : null;
  res.checks.lettering = res.minFont == null || res.minFont >= 11.5;
  // held frames on a monotonic scroll: frames only go up
  const fr = m1.frames.map((f) => f.frame);
  res.heldFrames = fr;
  res.checks.heldMonotonic = fr.every((f, i) => i === 0 || f >= fr[i - 1] || f === 1);

  // 2. flick down three screens and back
  await p.evaluate(() => window.scrollTo(0, 0)); await wait(800);
  const firstStep = await p.evaluate(() => { const e = document.querySelector('.chapter p[data-k="step"]'); return e.getBoundingClientRect().top + scrollY; });
  await p.evaluate((y) => window.scrollTo(0, y - innerHeight * 0.5), firstStep); await wait(1500);
  const v0 = (await measure(p)).violations;
  // a momentum flick: wheel events that decay, about three screens down, then back
  const flick = async (dir) => { for (let i = 0; i < 24; i++) { await p.mouse.wheel({ deltaY: dir * Math.round(h * 0.28 * Math.pow(0.88, i)) }); await wait(16); } };
  await p.mouse.move(w / 2, h * 0.7);
  await flick(1); await wait(2500);
  await flick(-1); await wait(2500);
  const m2 = await measure(p);
  res.checks.flickNoTwoFigures = m2.violations === v0 && (await p.evaluate(() => window.__sample.twoFrames)) === 0;
  await p.screenshot({ path: join(outDir, 'after-flick-back.png') });

  // 3. "toolbar": the height changes by 10%, the width doesn't. Nothing may move.
  const anchorTop = () => p.evaluate(() => { const ps = [...document.querySelectorAll('main p')]; const e = ps.find((x) => x.getBoundingClientRect().top > 0); return e ? [ps.indexOf(e), e.getBoundingClientRect().top] : null; });
  const a0 = await anchorTop();
  await p.setViewport({ width: w, height: Math.round(h * 0.9), isMobile: mobile, hasTouch: mobile });
  await wait(600);
  const a1 = await anchorTop();
  // toolbars exist only on touch devices; a desktop window's height change relays out on purpose
  if (mobile) res.checks.toolbarStill = !!(a0 && a1 && a0[0] === a1[0] && Math.abs(a0[1] - a1[1]) <= 2);
  await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile });
  await wait(600);

  // 4. rotation: the reader's paragraph stays near where it was
  if (mobile) {
    // the engine keeps the paragraph at its reading line (window.__tell.anchor); it must end up on screen
    await p.setViewport({ width: h, height: w, isMobile: mobile, hasTouch: mobile });
    await wait(900);
    const vis = await p.evaluate(() => { const a = window.__tell.anchor; return !!a && a.after >= -1 && a.after < innerHeight * 0.8; });
    res.checks.rotationKeepsParagraph = vis;
    await p.screenshot({ path: join(outDir, 'rotated.png') });
    await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile });
    await wait(900);
  }

  // 5. anchor jump: the figure is set, never replayed from the start
  await p.evaluate(() => window.scrollTo(0, 0)); await wait(800);
  const before = (await measure(p)).steps.length;
  const target = await p.evaluate(() => { const hs = [...document.querySelectorAll('.run h2[id]')]; return (hs[2] || hs[1] || hs[0])?.id || 'second'; });
  res.anchor = target;
  await p.evaluate((t) => { location.hash = '#' + t; }, target); await wait(1800);
  const m5 = await measure(p);
  res.checks.anchorNoReplay = m5.steps.length - before <= 1;
  await p.screenshot({ path: join(outDir, 'anchor.png') });

  // 6. reduced motion: no played steps at all, only sets
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.goto(base + page, { waitUntil: 'networkidle0' }); await wait(400);
  const pre = (await measure(p)).steps.length;
  await scrollRead(p, 900, 60);
  await wait(800);
  res.checks.reducedNoPlay = (await measure(p)).steps.length === pre;
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

  res.errorsCount = errors.length;
  res.pass = Object.values(res.checks).every(Boolean) && errors.length === 0;
  await writeFile(join(outDir, 'report.json'), JSON.stringify(res, null, 1));
  await p.close();
  return res;
}

const { server, port } = await startServer(resolve(ROOT, 'studio'), 0);
const base = `http://127.0.0.1:${port}/`;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const outRoot = join(ROOT, '.shots', 'studio', page.replace('.html', ''));
const rows = [];
for (const d of DEVICES) {
  if (!only.includes('all') && !only.includes(d[0])) continue;
  const out = join(outRoot, d[0]);
  await mkdir(out, { recursive: true });
  try {
    const r = await runDevice(browser, base, d, out);
    const failed = Object.entries(r.checks).filter(([, v]) => !v).map(([k]) => k);
    rows.push(`| ${d[0]} | ${r.size} | ${r.cls} | ${r.pass ? 'pass' : 'FAIL'} | ${failed.join(', ') || '–'} | ${r.minFont ?? '–'} | ${r.errorsCount} |`);
    console.log(d[0], r.cls, r.pass ? 'pass' : 'FAIL ' + failed.join(','), r.errors.slice(0, 2).join(' | '));
  } catch (e) {
    rows.push(`| ${d[0]} | ${d[1]}x${d[2]} | – | ERROR | ${e.message.slice(0, 60)} | – | – |`);
    console.log(d[0], 'ERROR', e.message);
  }
}
await writeFile(join(outRoot, 'summary.md'), `# Studio system test: ${page}\n\n| Device | Size | Class | Result | Failed checks | Smallest lettering (px) | Errors |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`);
await browser.close();
server.close();
