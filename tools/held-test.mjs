// The held scene lab, measured (HELD-SCENE.md section 0; reviews/held-plan2-motion.md section 5).
//
//   node tools/held-test.mjs              unit checks, simulation, Chrome runs, shots, video, report
//   node tools/held-test.mjs --unit       only the checks that need no browser
//   node tools/held-test.mjs --no-video   skip the screen recording
//   node tools/held-test.mjs --serve [port]   serve the repository root for the lab pages
//
// Pure functions come from articles/other-half/figures/_held.js. The Chrome
// part drives _held.html with four readers (steady wheel, trackpad with
// inertia, phone flick, Space) at 1440×900, 1280×720 and 390×844, for the
// defaults (band 0.45, rest 0.5) and band 0.6 / rest 0.6, and _pinned.html
// with the same readers for comparison. Report: .shots/held/report.md.
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LAB = '/articles/other-half/figures';
const OUT = join(ROOT, '.shots', 'held');
const args = process.argv.slice(2);
const has = (f) => args.includes(f);

const H = await import(pathToFileURL(join(ROOT, 'articles/other-half/figures/_held.js')).href);
const DUR = [1.4, 2.0, 1.4, 1.4, 1.6];      // film.js durations.large (checked against the page below)

// ---------------------------------------------------------------------------
// 1. goalAt: forward at once, hysteresis backwards
// ---------------------------------------------------------------------------
function unitChecks() {
  const out = [];
  const ok = (name, cond, extra = '') => out.push({ name, pass: !!cond, extra });
  for (const O of [H.DEFAULTS, { lead: 0.1, band: 0.6, rest: 0.6 }]) {
    for (const svh of [900, 720, 844, 660]) {
      const T = H.triggers(2000, svh, O);
      const tag = `band ${O.band} rest ${O.rest}, svh ${svh}`;
      let fwd = true, jit = true, back30 = true;
      for (let e = 0; e < T.length; e++) {
        // forward at once: one px past the edge
        if (H.goalAt(T[e], e, T) !== e + 1 || H.goalAt(T[e] - 1, e, T) !== e) fwd = false;
        // resting on the edge after crossing it: ±20 px never changes the goal
        let g = e + 1;
        for (const d of [-20, 15, -18, 8, -20, 20, -5, -20, 0, 19]) { g = H.goalAt(T[e] + d, g, T); if (g !== e + 1) jit = false; }
        // 30 px back does
        if (H.goalAt(T[e] - 30, e + 1, T) !== e) back30 = false;
      }
      ok(`forward at once (${tag})`, fwd);
      ok(`±20 px at every edge keeps the goal (${tag})`, jit);
      ok(`30 px back plays the step back (${tag})`, back30);
      // a settling trackpad: past edge 2 by 40 px, rubber-bands 22 back, settles at +10
      let g = 0;
      for (const y of [T[2] - 200, T[2] + 40, T[2] + 18, T[2] - 3, T[2] - 22, T[2] + 4, T[2] + 10]) g = H.goalAt(y, g, T);
      ok(`a settling trackpad ends on goal 3 (${tag})`, g === 3, `got ${g}`);
      // a jump back far: straight to the right goal
      ok(`a jump back sets the right goal (${tag})`, H.goalAt(T[1] + 5, 5, T) === 2);
    }
  }
  // play rule
  const p = H.newPlayer(1);
  H.aimHeld(p, 5);                                  // four behind
  ok('four or more behind: set to the second-last, play only the last', p.pos === 4 && p.goal === 5);
  const q = H.newPlayer(0); H.aimHeld(q, 3);         // three behind
  H.stepHeld(q, 1 / 60, DUR);
  ok('three behind: 1/1.5 of the time, never under 1.2 s', Math.abs(q.d - Math.max(1.2, DUR[0] / 1.5)) < 1e-9, `d ${q.d.toFixed(3)}`);
  const r = H.newPlayer(0); H.aimHeld(r, 2); H.stepHeld(r, 1 / 60, DUR);
  ok('two behind: full length', Math.abs(r.d - DUR[0]) < 1e-9, `d ${r.d}`);
  // exit: the step in flight ends within 0.6 s, the queued ones are set
  const x = H.newPlayer(1); H.aimHeld(x, 3); H.stepHeld(x, 0.1, DUR);   // step 1 in flight, step 2 queued
  let t = 0, how = null;
  while (x.pos < 2 && t < 5) { how = H.stepHeld(x, 1 / 60, DUR, true); t += 1 / 60; }
  const inflightEnd = t;
  how = H.stepHeld(x, 1 / 60, DUR, true);
  ok('exit: the step in flight ends within 0.6 s', inflightEnd <= 0.6 + 1e-6, `${inflightEnd.toFixed(2)} s`);
  ok('exit: the queued step is set at once', how === 'exit' && x.pos === 3);
  return out;
}

// ---------------------------------------------------------------------------
// 2. The simulation at 60 fps (no browser): the four readers as scroll curves
// ---------------------------------------------------------------------------
function readerCurve(kind, svh) {
  // returns dy(t, dt): scroll px in this frame
  if (kind === 'wheel') return (t, dt) => {      // a 100 px notch every 0.333 s, smoothed over 0.1 s
    const ph = t % (1 / 3);
    return ph < 0.1 ? (100 * dt) / 0.1 : 0;
  };
  if (kind === 'space') return (t, dt) => {      // 0.875 of the window every 1.5 s, over 0.4 s
    const ph = t % 1.5;
    return ph < 0.4 ? (0.875 * svh * dt) / 0.4 : 0;
  };
  const tp = kind === 'trackpad';
  const [v0, tau, period] = tp ? [2500, 0.35, 1.2] : [4000, 0.5, 1.5];
  return (t, dt) => {
    const ph = t % period;
    if (tp && ph >= 0.85) return ph < 1.0 ? (-12 * dt) / 0.15 : ph < 1.1 ? (6 * dt) / 0.1 : 0;   // a resting finger settles
    return v0 * Math.exp(-ph / tau) * dt;
  };
}
function simulate(kind, svh, O) {
  const top = 1000, T = H.triggers(top, svh, O), end = top + H.holdOf(O) * svh;
  const p = H.newPlayer(), dy = readerCurve(kind, svh), dt = 1 / 60;
  const steps = DUR.map(() => ({ trig: null, start: null, done: null, set: null, capped: false }));
  const goals = [];
  let y = T[0] - 0.3 * svh, t = 0, exit = null;
  while (t < 60) {
    y += dy(t, dt);
    const exiting = y > end;
    if (exiting && !exit) exit = { t, queued: Math.max(0, p.goal - Math.ceil(p.pos)), inflight: p.pos % 1 !== 0 && p.goal > p.pos };
    const g = H.goalAt(y, p.goal, T);
    if (g !== p.goal) { goals.push({ t, from: p.goal, to: g }); for (let i = p.goal; i < g; i++) if (steps[i].trig === null) steps[i].trig = t; }
    let prev = p.pos;
    let how = H.aimHeld(p, g);
    if (how) mark(prev, p.pos, how);
    prev = p.pos;
    how = H.stepHeld(p, dt, DUR, exiting);
    mark(prev, p.pos, how || 'play', exiting);
    t += dt;
    if (y > end + 0.6 * svh && p.pos === p.goal) break;
  }
  return { steps, goals, exit };
  function mark(prev, next, how, exiting) {
    if (next <= prev) return;
    steps.forEach((s, i) => {
      if (how === 'play') {
        if (prev <= i && next > i && s.start === null) s.start = t;
        if (exiting && next > i && prev < i + 1) s.capped = true;
        if (next >= i + 1 && prev < i + 1 && s.done === null) s.done = t + dt;
      } else if (next >= i + 1 && prev < i + 1 && s.done === null) {
        if (s.start === null) { s.set = how; s.start = t; } else s.cut = how;
        s.done = t;
      }
    });
  }
}

// Flags shared by the simulation and the Chrome runs
function judge(kind, r, { lastShare = null } = {}) {
  const flags = [];
  r.steps.forEach((s, i) => {
    if (s.done === null) { flags.push(`step ${i} never complete`); return; }
    const played = s.set ? null : s.done - s.start;
    // a step set by the four-behind rule (skip) or off screen is the rule at
    // work, reported in the table, not a flag; one set at the exit is "queued"
    if (s.set === 'exit' && !(r.exit && r.exit.queued)) flags.push(`step ${i} set at the exit`);
    if (kind === 'wheel' && s.cut) flags.push(`step ${i} cut (${s.cut})`);
    else if (kind === 'wheel' && played !== null && played < 1.2 - 0.03) flags.push(`step ${i} ${played.toFixed(2)} s${s.capped ? ' (exit)' : ''}`);
  });
  const flips = r.goals.filter((g) => g.to < g.from);
  if (flips.length) flags.push(`${flips.length} step(s) flipped back`);
  if (r.exit && r.exit.queued > 0) flags.push(`${r.exit.queued} queued at let-go`);
  if ((kind === 'wheel' || kind === 'space') && lastShare !== null && lastShare < 0.75) flags.push(`last step ends ${Math.round(lastShare * 100)}% in view`);
  return flags;
}
const fmtSteps = (r) => r.steps.map((s) => (s.done === null ? '–' : s.set ? `set:${s.set}` : s.cut ? `cut:${s.cut} after ${(s.done - s.start).toFixed(2)}` : `${(s.done - s.start).toFixed(2)}${s.capped ? '*' : ''}`)).join(' · ');
const fmtWait = (r) => {
  const w = r.steps.filter((s) => s.trig !== null && s.start !== null).map((s) => s.start - s.trig);
  return w.length ? Math.max(...w).toFixed(2) : '–';
};
const fmtExit = (r) => (!r.exit ? 'not reached' : r.exit.queued ? `${r.exit.inflight !== null && r.exit.inflight !== false ? 'in flight + ' : ''}${r.exit.queued} queued` : r.exit.inflight !== null && r.exit.inflight !== false ? 'in flight' : 'clear');

// ---------------------------------------------------------------------------
// 3. Chrome
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SIZES = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '390x844', width: 390, height: 844, phone: true },
];
const VARIANTS = [{ name: 'band 0.45 / rest 0.5', q: '' }, { name: 'band 0.6 / rest 0.6', q: '?band=0.6&rest=0.6' }];
const READERS = ['wheel', 'trackpad', 'flick', 'space'];

async function open(browser, size, url, { dsf = 1, reduced = false } = {}) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errs.push(`${r.status()} ${r.url()}`); });
  await page.setViewport({ width: size.width, height: size.height, deviceScaleFactor: dsf, isMobile: !!size.phone, hasTouch: !!size.phone });
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__held && window.__held.ready', { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  const err = await page.evaluate(() => window.__held.error || null);
  if (err) throw new Error(err);
  page.errs = errs;
  return page;
}
const G = (page) => page.evaluate(() => { const g = window.__held.G; return { mode: g.mode, why: g.why, figW: g.figW, svh: g.svh, T: g.T, end: g.end, start: g.start, stop: g.stop, top: g.top }; });

async function scriptedScroll(page, kind, stop) {
  await page.evaluate(async (kind, stop) => {
    const tp = kind === 'trackpad';
    const [v0, tau, period] = tp ? [2500, 0.35, 1.2] : [4000, 0.5, 1.5];
    let y = scrollY, last = performance.now();
    const t0 = last;
    await new Promise((done) => {
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const ph = ((now - t0) / 1000) % period;
        let dy;
        if (tp && ph >= 0.85) dy = ph < 1.0 ? (-12 * dt) / 0.15 : ph < 1.1 ? (6 * dt) / 0.1 : 0;
        else dy = v0 * Math.exp(-ph / tau) * dt;
        y += dy;
        scrollTo(0, y);
        if (y >= stop || now - t0 > 45000) done(); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, kind, stop);
}

async function drive(page, kind, size) {
  const g = await G(page);
  await page.evaluate((y) => scrollTo(0, y), g.start);
  await sleep(400);
  await page.evaluate(() => { window.__held.update(true); window.__held.reset(); });
  const stop = g.stop;
  const t0 = Date.now();
  if (kind === 'wheel') {
    await page.mouse.move(size.width / 2, size.height / 2);
    while ((await page.evaluate(() => scrollY)) < stop && Date.now() - t0 < 45000) {
      const t = Date.now();
      await page.mouse.wheel({ deltaY: 100 });
      await sleep(Math.max(0, 333 - (Date.now() - t)));
    }
  } else if (kind === 'space') {
    await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
    while ((await page.evaluate(() => scrollY)) < stop && Date.now() - t0 < 45000) {
      const t = Date.now();
      await page.keyboard.press('Space');
      await sleep(Math.max(0, 1500 - (Date.now() - t)));
    }
  } else {
    await scriptedScroll(page, kind, stop);
  }
  const t1 = Date.now();
  while (Date.now() - t1 < 5000 && (await page.evaluate(() => document.documentElement.dataset.moving === '1'))) await sleep(50);
  await sleep(300);
  const log = await page.evaluate(() => JSON.parse(JSON.stringify(window.__held.log)));
  const ms = (v) => (v === null ? null : v / 1000);
  const steps = log.steps.map((s) => ({ ...s, trig: ms(s.trig), start: ms(s.start), done: ms(s.done) }));
  const exit = log.exit ? { ...log.exit, t: log.exit.t / 1000 } : null;
  return { steps, goals: log.goals, back: log.back, exit, lastShare: steps[steps.length - 1].share, mode: g.mode };
}

// ±20 px at every edge, in the page: never a flip
async function edgeRest(page) {
  const g = await G(page);
  const res = [];
  for (let e = 0; e < g.T.length; e++) {
    await page.evaluate((y) => scrollTo(0, y), g.T[e] + 2);
    await sleep(120);
    const g0 = await page.evaluate(() => window.__held.p.goal);
    let changed = false;
    for (const d of [-20, 12, -18, 8, -20, 15, -10, 0]) {
      await page.evaluate((y) => scrollTo(0, y), g.T[e] + d);
      await sleep(70);
      if ((await page.evaluate(() => window.__held.p.goal)) !== g0) changed = true;
    }
    res.push({ edge: e, goal: g0, changed });
  }
  return res;
}

// the gates on the state shown: figure lettering, lines through lettering, page text
async function gates(page, minPx) {
  return page.evaluate((minPx) => {
    const a = window.__held.audit(minPx);
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
    let pageMin = Infinity, pageMinWhat = '';
    for (const el of document.querySelectorAll('main *')) {
      if (el.closest('svg')) continue;
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || !vis(el) || el.closest('.held-skip')) continue;
      const fs = parseFloat(cs.fontSize);
      if (fs < pageMin) { pageMin = fs; pageMinWhat = el.textContent.trim().slice(0, 30); }
    }
    const sw = document.documentElement.scrollWidth > innerWidth + 1;
    return { fig: a, pageMin: +pageMin.toFixed(2), pageMinWhat, sideways: sw };
  }, minPx);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = [];
  const P = (s = '') => report.push(s);
  const log = (s) => { console.log(s); };
  P('# Held scene lab: measurements');
  P('');
  P(`Generated by \`node tools/held-test.mjs\` on ${new Date().toISOString().slice(0, 16).replace('T', ' ')}. Pages: \`${LAB}/_held.html\` and \`_pinned.html\`. Step times are the figure's own (${DUR.join(', ')} s); floor 1.2 s, back 0.6 s, exit 0.6 s, hysteresis ${H.HYST} px backwards only.`);
  P('');

  // 1. unit checks
  const units = unitChecks();
  const unitFail = units.filter((u) => !u.pass);
  P('## 1. goalAt and the play rule (Node)');
  P('');
  P(`${units.length - unitFail.length} of ${units.length} pass.${unitFail.length ? ' Failing:' : ''}`);
  for (const u of unitFail) P(`- FAIL ${u.name} ${u.extra}`);
  P('');
  P('<details><summary>All checks</summary>');
  P('');
  for (const u of units) P(`- ${u.pass ? 'pass' : 'FAIL'} – ${u.name}${u.extra ? ` (${u.extra})` : ''}`);
  P('');
  P('</details>');
  P('');
  log(`unit checks: ${units.length - unitFail.length}/${units.length} pass`);

  // 2. simulation
  P('## 2. Simulation at 60 fps (Node, no browser)');
  P('');
  P('Each step\'s played time in seconds (`*` shortened by the exit rule; `cut:skip after t` a step in flight cut short by the four-behind rule; `set:skip` set by the four-behind rule, `set:exit` set because it was still queued when the block let go). "Wait": the longest a due step waited for the one before. "At let-go": what was still to play when the block let go. Flags (the brief): a step under 1.2 s at the steady wheel; a step flipped back; a step still queued at let-go; for wheel and Space in Chrome, the last step ending with under 75% of the figure in view.');
  P('');
  P('| Variant | svh | Reader | Steps 0–4 played (s) | Wait | At let-go | Flags | |');
  P('|---|---:|---|---|---:|---|---|---|');
  const simVariants = [H.DEFAULTS, { lead: 0.1, band: 0.6, rest: 0.6 }];
  for (const O of simVariants) for (const svh of [900, 720, 630, 844, 660]) for (const kind of READERS) {
    const r = simulate(kind, svh, O);
    const f = judge(kind, r);
    P(`| ${O.band} / ${O.rest} | ${svh} | ${kind} | ${fmtSteps(r)} | ${fmtWait(r)} | ${fmtExit(r)} | ${f.join('; ') || '–'} | ${f.length ? 'FAIL' : 'pass'} |`);
  }
  P('');
  if (has('--unit')) { writeFileSync(join(OUT, 'report.md'), report.join('\n') + '\n'); log(`report: ${join(OUT, 'report.md')}`); return; }

  // 3. Chrome
  const require = createRequire(join(ROOT, 'package.json'));
  const puppeteer = require('puppeteer-core');
  const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const { server, port } = await startServer(ROOT, 0);
  const base = `http://localhost:${port}${LAB}`;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const errors = new Set();
  try {
    // the figure's step times as the page reads them
    {
      const pg = await open(browser, SIZES[0], `${base}/_held.html`);
      const dur = await pg.evaluate(() => window.__held.DUR);
      if (JSON.stringify(dur) !== JSON.stringify(DUR)) P(`**Note:** film.js durations are ${dur.join(', ')}, the simulation assumed ${DUR.join(', ')}.`);
      await pg.close();
    }

    P('## 3. Chrome: the held page, four readers');
    P('');
    P('Steady wheel: real wheel notches of 100 px every 0.333 s (Chrome\'s smooth wheel scrolling). Trackpad and flick: scripted scrolling every frame (2500 px/s, τ 0.35 s, a swipe every 1.2 s, then a −12/+6 px settle; 4000 px/s, τ 0.5 s, every 1.5 s); headless Chrome has no real touch fling. Space: the real key every 1.5 s. Times in seconds as in section 2; "last in view": share of the figure on screen when the last step completed.');
    P('');
    P('| Variant | Size | Mode | Reader | Steps 0–4 played (s) | Wait | At let-go | Last in view | Flags | |');
    P('|---|---|---|---|---|---:|---|---:|---|---|');
    const summary = [];
    const edges = [];
    for (const V of VARIANTS) for (const size of SIZES) {
      const page = await open(browser, size, `${base}/_held.html${V.q}`);
      const g = await G(page);
      for (const kind of READERS) {
        const r = await drive(page, kind, size);
        const f = g.mode === 'seq' ? [] : judge(kind, r, { lastShare: r.lastShare });
        const pass = !f.length;
        summary.push({ v: V.name, size: size.name, kind, pass, mode: g.mode });
        P(`| ${V.name} | ${size.name} | ${g.mode} | ${kind} | ${g.mode === 'seq' ? 'stills' : fmtSteps(r)} | ${fmtWait(r)} | ${fmtExit(r)} | ${r.lastShare === null ? '–' : Math.round(r.lastShare * 100) + '%'} | ${f.join('; ') || '–'} | ${pass ? 'pass' : 'FAIL'} |`);
        log(`${V.name} ${size.name} ${kind}: ${fmtSteps(r)} ${pass ? 'pass' : 'FAIL ' + f.join('; ')}`);
      }
      if (g.mode !== 'seq') edges.push({ v: V.name, size: size.name, res: await edgeRest(page) });
      for (const e of page.errs) errors.add(e);
      await page.close();
    }
    P('');
    P('### Pass/fail at a glance');
    P('');
    P(`| Variant | Size | ${READERS.join(' | ')} |`);
    P(`|---|---|${READERS.map(() => '---').join('|')}|`);
    for (const V of VARIANTS) for (const size of SIZES) {
      const row = READERS.map((k) => summary.find((s) => s.v === V.name && s.size === size.name && s.kind === k)?.pass ? 'pass' : 'FAIL');
      P(`| ${V.name} | ${size.name} | ${row.join(' | ')} |`);
    }
    P('');
    P('### Resting at a band edge (±20 px after crossing it, in the page)');
    P('');
    P('| Variant | Size | Edges 0–4 | |');
    P('|---|---|---|---|');
    for (const e of edges) P(`| ${e.v} | ${e.size} | ${e.res.map((r) => (r.changed ? `${r.edge}: FLIP` : `${r.edge}: held`)).join(' · ')} | ${e.res.some((r) => r.changed) ? 'FAIL' : 'pass'} |`);
    P('');

    // pinned, for comparison
    P('## 4. Chrome: the pinned page (the engine\'s rules), for comparison');
    P('');
    P('No 1.2 s floor here (the engine squeezes several due steps down to 0.5 s); the flags are the held page\'s, for comparison only. "At let-go": when the pinned figure is let go at the end of the scene.');
    P('');
    P('| Size | Mode | Reader | Steps 0–4 played (s) | Wait | At let-go | Last in view | Flags |');
    P('|---|---|---|---|---:|---|---:|---|');
    for (const size of SIZES) {
      const page = await open(browser, size, `${base}/_pinned.html`);
      const g = await G(page);
      if (g.mode === 'seq') { P(`| ${size.name} | stills | – | ${g.why} | | | | |`); await page.close(); continue; }
      for (const kind of READERS) {
        const r = await drive(page, kind, size);
        const f = judge(kind, r, { lastShare: r.lastShare });
        P(`| ${size.name} | ${g.mode} | ${kind} | ${fmtSteps(r)} | ${fmtWait(r)} | ${fmtExit(r)} | ${r.lastShare === null ? '–' : Math.round(r.lastShare * 100) + '%'} | ${f.join('; ') || '–'} |`);
      }
      for (const e of page.errs) errors.add(e);
      await page.close();
    }
    P('');

    // screenshots and gates
    P('## 5. Screenshots and gates (defaults)');
    P('');
    P('Every step complete, at each size; the stills under reduced motion. Gates: figure lettering at least 11 px beside, 11.5 px on top; no line through lettering; page text at least 11 px (11.5 on a phone); no sideways scroll.');
    P('');
    P('| Page | Size | Mode | Figure px | Smallest figure text | Lines through lettering | Smallest page text | Sideways | |');
    P('|---|---|---|---:|---:|---|---:|---|---|');
    const shotFiles = [];
    const gateRow = (pageName, size, g, gs, minPx) => {
      const figMin = Math.min(...gs.map((x) => Math.min(...x.fig.map((f) => f.smallest))));
      const lines = [...new Set(gs.flatMap((x) => x.fig.flatMap((f) => f.problems.filter((p) => / through /.test(p)))))];
      const small = gs.some((x) => x.fig.some((f) => f.problems.some((p) => p.startsWith('small'))));
      const pageMin = Math.min(...gs.map((x) => x.pageMin));
      const sideways = gs.some((x) => x.sideways);
      const pass = !lines.length && !small && figMin >= minPx - 0.05 && pageMin >= minPx - 0.05 && !sideways;
      P(`| ${pageName} | ${size.name} | ${g.mode} | ${g.mode === 'seq' ? '–' : g.figW} | ${figMin.toFixed(1)} | ${lines.join('; ') || 'none'} | ${pageMin.toFixed(1)} | ${sideways ? 'yes' : 'no'} | ${pass ? 'pass' : 'FAIL'} |`);
    };
    for (const size of SIZES) {
      const minPx = size.phone ? 11.5 : 11;
      for (const pageName of ['held', 'pinned']) {
        const page = await open(browser, size, `${base}/_${pageName}.html`, { dsf: size.phone ? 2 : 1 });
        const g = await G(page);
        const gs = [];
        if (g.mode !== 'seq') {
          for (let k = 0; k < 5; k++) {
            const y = pageName === 'held'
              ? (k === 0 ? g.top + 2 : k < 4 ? (g.T[k] + g.T[k + 1]) / 2 : g.T[4] + 0.25 * (g.end - g.T[4]))
              : g.T[k] + 0.06 * g.svh;
            await page.evaluate((y) => scrollTo(0, y), y);
            await sleep(250);
            await page.evaluate(() => window.__held.finish());
            await sleep(120);
            const f = join(OUT, `${pageName}-${size.name}-step${k}.png`);
            await page.screenshot({ path: f });
            shotFiles.push(f);
            gs.push(await gates(page, minPx));
          }
        } else {
          const f = join(OUT, `${pageName}-${size.name}-stills.png`);
          await page.screenshot({ path: f, fullPage: true });
          shotFiles.push(f);
          gs.push(await gates(page, minPx));
        }
        gateRow(pageName, size, g, gs, minPx);
        for (const e of page.errs) errors.add(e);
        await page.close();
      }
      // the stills, under reduced motion
      const page = await open(browser, size, `${base}/_held.html`, { dsf: size.phone ? 2 : 1, reduced: true });
      const g = await G(page);
      const box = await page.evaluate(() => { const r = document.querySelector('.held-stills').getBoundingClientRect(); const t = document.getElementById('film-block').getBoundingClientRect(); return { y: t.top + scrollY, h: r.bottom - t.top, w: innerWidth }; });
      const f = join(OUT, `held-${size.name}-reduced-stills.png`);
      await page.screenshot({ path: f, clip: { x: 0, y: box.y, width: box.w, height: box.h }, captureBeyondViewport: true });
      shotFiles.push(f);
      const gs = [await gates(page, minPx)];
      // every still's figure, not only those on screen
      gs[0].fig = await page.evaluate((minPx) => window.__held.audit(minPx), minPx);
      gateRow('held, reduced motion', size, g, gs, minPx);
      await page.close();
    }
    P('');
    // the held fit test at the sizes the plan names
    P('### Held fit test at more windows');
    P('');
    P('| Window | Mode | Figure px | Why stills |');
    P('|---|---|---:|---|');
    for (const s of [[1440, 900], [1366, 768], [1280, 720], [1280, 630], [390, 844, 1], [390, 660, 1], [844, 390, 1], [720, 450]]) {
      const size = { name: `${s[0]}x${s[1]}`, width: s[0], height: s[1], phone: !!s[2] };
      const page = await open(browser, size, `${base}/_held.html`);
      const g = await G(page);
      P(`| ${size.name} | ${g.mode} | ${g.figW || '–'} | ${g.mode === 'seq' ? g.why : ''} |`);
      if (size.name === '390x660') { const f = join(OUT, 'held-390x660.png'); await page.screenshot({ path: f }); shotFiles.push(f); }
      await page.close();
    }
    P('');

    // the recording
    if (!has('--no-video')) {
      const dir = join(OUT, 'video-wheel-1440x900');
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      const page = await open(browser, SIZES[0], `${base}/_held.html`);
      const cdp = await page.target().createCDPSession();
      const frames = [];
      cdp.on('Page.screencastFrame', async (e) => {
        const n = frames.length + 1;
        const f = join(dir, `f${String(n).padStart(5, '0')}.jpg`);
        writeFileSync(f, Buffer.from(e.data, 'base64'));
        frames.push({ f, ts: e.metadata.timestamp });
        try { await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }); } catch { /* closed */ }
      });
      const g = await G(page);
      await page.evaluate((y) => scrollTo(0, y), g.start);
      await sleep(400);
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 });
      await sleep(500);
      const r = await drive(page, 'wheel', SIZES[0]);
      await sleep(800);
      await cdp.send('Page.stopScreencast');
      await sleep(300);
      let video = '';
      const ff = spawnSync('ffmpeg', ['-version']);
      if (ff.status === 0 && frames.length > 2) {
        const list = frames.map((fr, i) => `file '${fr.f.replace(/\\/g, '/')}'\nduration ${Math.max(0.001, ((frames[i + 1]?.ts ?? fr.ts + 1 / 30) - fr.ts)).toFixed(4)}`).join('\n') + `\nfile '${frames[frames.length - 1].f.replace(/\\/g, '/')}'\n`;
        writeFileSync(join(dir, 'list.txt'), list);
        video = join(OUT, 'held-wheel-1440x900.mp4');
        const res = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'), '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '20', video]);
        if (res.status !== 0) { video = ''; P(`ffmpeg failed: ${String(res.stderr).slice(0, 200)}`); }
      }
      P('## 6. Recording');
      P('');
      P(`Steady wheel at 1440×900, defaults: ${frames.length} frames in \`${dir.replace(ROOT, '.').replace(/\\/g, '/')}\`${video ? `, stitched at their own timestamps into \`${video.replace(ROOT, '.').replace(/\\/g, '/')}\`` : ''}. Steps in this run: ${fmtSteps(r)} (recording adds load; the table above is the measurement).`);
      P('');
      await page.close();
    }

    // en dashes only
    P('## 7. En dashes');
    P('');
    const mine = ['articles/other-half/figures/_held.js', 'articles/other-half/figures/_held.css', 'articles/other-half/figures/_held.html', 'articles/other-half/figures/_pinned.html', 'articles/other-half/reviews/held-build-notes.md', 'tools/held-test.mjs', 'articles/other-half/figures/film.js'];
    const em = mine.filter((f) => readFileSync(join(ROOT, f), 'utf8').includes('\u2014'));
    P(em.length ? `Em dashes in: ${em.join(', ')}` : `No em dash in ${mine.length} files written or changed for the lab.`);
    P('');
    if (errors.size) { P('## Page errors'); P(''); for (const e of errors) P(`- ${e}`); P(''); }
    P('## Files');
    P('');
    for (const f of shotFiles) P(`- \`${f.replace(ROOT, '.').replace(/\\/g, '/')}\``);
  } finally {
    await browser.close();
    server.close();
  }
  writeFileSync(join(OUT, 'report.md'), report.join('\n') + '\n');
  log(`report: ${join(OUT, 'report.md')}`);
}

if (has('--serve')) {
  const port = Number(args[args.indexOf('--serve') + 1]) || 8823;
  await startServer(ROOT, port);
  console.log(`serving the repository root on http://localhost:${port}/`);
  console.log(`  held:   http://localhost:${port}${LAB}/_held.html`);
  console.log(`          http://localhost:${port}${LAB}/_held.html?band=0.6&rest=0.6`);
  console.log(`  pinned: http://localhost:${port}${LAB}/_pinned.html`);
  console.log(`  stills: http://localhost:${port}${LAB}/_held.html?stills=1`);
} else {
  await main();
}
