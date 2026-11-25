// v3.1 board + gates: renders the nine annotated frames, the 3 × 3 grid and the
// map to PNG, then runs G2 (stroke weight), G5 (type floor), G22 (label size
// constant across pages and hops), G24 (map edge) and two layout checks
// (labels inside the safe area, no label overlaps).
//   node tools/v31-board.mjs [out-dir]
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || join(ROOT, 'talks/quantum/v31/board/out');
mkdirSync(OUT, { recursive: true });
const { server, port } = await startServer(ROOT, 0);
const base = `http://127.0.0.1:${port}/talks/quantum/v31/`;
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
const TOK = { grid: 1.5, leader: 2, object: 3, route: 4, locator: 1.5 }, TOL = 0.2;
const FLOOR = { main: 32, mono: 28, source: 24, locator: 24, title: 32, hero: 32 };
const SAFE = { x: 96, y: 54, r: 1824, b: 1026 };
const g1 = [], g3 = [], g2 = [], g5 = [], g22 = [], keep = [], over = [], rgate = [], gap = [];

async function load(url) {
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.waitForFunction('window.V31 && window.V31.ready');
}
// measured in the page: rendered font height via getScreenCTM, label boxes in screen px
const measure = () => p.evaluate(() => {
  const texts = [...document.querySelectorAll('#ann text')].map((t) => {
    const m = t.getScreenCTM(), fs = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b);
    const bb = t.getBoundingClientRect();
    return { anchor: t.closest('[data-anchor]')?.dataset.anchor || t.dataset.anchor, role: t.dataset.role, type: t.dataset.type, px: +fs.toFixed(2), box: { x: bb.x, y: bb.y, r: bb.right, b: bb.bottom }, s: t.textContent };
  });
  const groups = [...document.querySelectorAll('#ann > [data-anchor]')].map((g) => { const bb = g.getBoundingClientRect(); return { id: g.dataset.anchor, x: bb.x, y: bb.y, r: bb.right, b: bb.bottom }; });
  const strokes = [...document.querySelectorAll('[data-stroke]')].map((e) => ({ role: e.dataset.stroke, w: parseFloat(getComputedStyle(e).strokeWidth), ns: getComputedStyle(e).vectorEffect }));
  return { texts, groups, strokes };
});

await p.setViewport({ width: 1920, height: 1080 });
const sizes = {};
for (let i = 1; i <= 9; i++) {
  await load(`${base}index.html?print=1&page=${i}`);
  await p.screenshot({ path: join(OUT, `frame-${i}.png`) });
  const m = await measure();
  // G1 colours and G3 fills, computed
  const col = await p.evaluate(() => {
    const ok = ['none', 'rgb(251, 251, 252)', 'rgb(21, 23, 28)', 'rgb(92, 99, 112)', 'rgb(187, 190, 196)', 'rgb(218, 221, 227)', 'rgb(200, 50, 31)'], RED = 'rgb(200, 50, 31)';
    const bad = [], redGroups = new Set(), fills = [];
    for (const e of document.querySelectorAll('#page *')) {
      if (e.closest('mask, clipPath') || ['g', 'mask', 'clipPath', 'image', 'tspan'].includes(e.tagName)) continue;
      const cs = getComputedStyle(e), st = cs.stroke, fi = cs.fill;
      if (e.tagName === 'text' || e.closest('text')) { if (!ok.includes(fi)) bad.push(e.tagName + ' fill ' + fi); if (fi === RED) redGroups.add(e.closest('[data-thing]')?.dataset.thing || 'text'); }
      else {
        for (const c of [st, fi]) if (!ok.includes(c)) bad.push(e.tagName + ' ' + c);
        if (st === RED || fi === RED) redGroups.add(e.id === 'route' ? 'route' : (e.closest('[data-thing]')?.dataset.thing || 'loose'));
        if (fi !== 'none' && fi !== 'rgb(251, 251, 252)' && e.tagName !== 'circle') fills.push(e.tagName + ' ' + fi);
      }
    }
    for (const t of document.querySelectorAll('#ann tspan.red')) redGroups.add(t.dataset.thing || 'loose');
    return { bad: [...new Set(bad)], red: [...redGroups], fills: [...new Set(fills)] };
  });
  g1.push({ page: i, red: col.red.join(' '), bad: col.bad.join('; '), pass: !col.bad.length && col.red.length <= 1 });
  g3.push({ page: i, fills: col.fills.join('; '), pass: !col.fills.length });
  for (const s of m.strokes) g2.push({ page: i, ...s, pass: Math.abs(s.w - TOK[s.role]) <= TOL && s.ns === 'non-scaling-stroke' });
  for (const t of m.texts) {
    g5.push({ page: i, anchor: t.anchor, role: t.role, px: t.px, pass: t.px >= FLOOR[t.type] - 0.01 });
    (sizes[t.role] ||= []).push({ page: i, t: 1, px: t.px });
    const inside = t.box.x >= SAFE.x - 1 && t.box.r <= SAFE.r + 1 && t.box.y >= SAFE.y - 1 && t.box.b <= SAFE.b + 1;
    keep.push({ page: i, anchor: t.anchor, s: t.s, pass: inside });
  }
  const T = m.texts;
  for (let a = 0; a < T.length; a++) for (let c = a + 1; c < T.length; c++) {
    const A = T[a].box, C = T[c].box; if (T[a].anchor === T[c].anchor) continue;
    const hit = A.x < C.r && C.x < A.r && A.y < C.b && C.y < A.b;
    over.push({ page: i, pair: T[a].anchor + ' × ' + T[c].anchor, pass: !hit });
  }
  // Route gate: the visible route (clipped to the world area between header and caption bands)
  // must not cross any title, hero, flag or label box. The paper halo does not count.
  const rg = await p.evaluate(() => {
    const rp = window.V31_ROUTE, head = +document.querySelector('[data-anchor=header-band]').getAttribute('height'), foot = 958;
    const boxes = [...document.querySelectorAll('#ann [data-box]')].map((g) => { const [x, y, w, h] = g.dataset.box.split(',').map(Number); return { id: g.dataset.anchor, x, y, r: x + w, b: y + h }; });
    for (const id of ['title', 'eyebrow', 'question']) { const e = document.querySelector('#ann [data-anchor=' + id + ']'); if (e) { const b = e.getBoundingClientRect(); boxes.push({ id, x: b.x, y: b.y, r: b.right, b: b.bottom }); } }
    const out = [];
    for (const bx of boxes) {
      let hit = false;
      for (let i = 0; i < rp.length - 1 && !hit; i++) for (let k = 0; k <= 400; k++) {
        const x = rp[i][0] + (rp[i + 1][0] - rp[i][0]) * k / 400, y = rp[i][1] + (rp[i + 1][1] - rp[i][1]) * k / 400;
        if (y < head || y > foot) continue;
        if (x >= bx.x && x <= bx.r && y >= bx.y && y <= bx.b) { hit = true; break; }
      }
      out.push({ id: bx.id, pass: !hit });
    }
    const route = document.getElementById('route'), mask = route.getAttribute('mask');
    const holes = mask ? document.querySelectorAll(mask.slice(4, -1) + ' path').length : 0;
    const objs = [...document.querySelectorAll('#world .zone, #world .thing')].filter((g) => !/M[^M]*L[^M]*M[^M]*L[^M]*M/.test('') ).length;
    const rulers = (window.V31_RULERS || 0);
    return { out, gap: { holes, objs: objs - rulers } };
  });
  for (const x of rg.out) rgate.push({ page: i, ...x });
  gap.push({ page: i, ...rg.gap, pass: rg.gap.holes >= rg.gap.objs });
  // G22: the same labels mid-hop (from the previous page's stop), t = 0.25, 0.5, 0.75
  if (i > 1) for (const t of [0.25, 0.5, 0.75]) {
    await load(`${base}index.html?print=1&page=${i}&from=${i - 1}&t=${t}`);
    for (const x of (await measure()).texts) (sizes[x.role] ||= []).push({ page: i, t, px: x.px });
  }
}
for (const [role, list] of Object.entries(sizes)) {
  const px = list.map((x) => x.px), spread = Math.max(...px) - Math.min(...px);
  g22.push({ role, n: list.length, min: Math.min(...px), max: Math.max(...px), pass: spread <= 1 });
}

await p.setViewport({ width: 2040, height: 1260 });
await p.goto(`${base}board/grid.html`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await p.screenshot({ path: join(OUT, 'board-grid.png'), fullPage: true });
await p.setViewport({ width: 3000, height: 900 });
await p.goto(base + 'board/map.html', { waitUntil: 'networkidle0' });
await p.waitForFunction('window.MAP');
const MAP = await p.evaluate(() => window.MAP);
await p.setViewport({ width: 1540, height: 900 });
await p.evaluate(() => document.getElementById('root').lastElementChild.remove());
await p.screenshot({ path: join(OUT, 'board-map.png'), fullPage: true });
await b.close(); server.close();

const g24 = [];
for (const it of MAP.chevron) {
  const cross = it.x < 0 || it.y < 0 || it.x + it.w > 9600 || it.y + it.h > 5400;
  g24.push({ kind: it.kind, id: it.id, pass: !cross });
}
const row = (name, rows, fail) => { const bad = rows.filter((x) => !x.pass); return `| ${name} | ${rows.length - bad.length}/${rows.length} | ${bad.length ? 'FAIL: ' + bad.slice(0, 6).map(fail).join('; ') : 'pass'} |`; };
const table = ['| Gate | Passed | Result |', '| --- | --- | --- |',
  row('G1 colours (tokens only; red on ≤ 1 group per frame)', g1, (x) => `p${x.page} red=[${x.red}] ${x.bad}`),
  row('G3 fills (paper only, except text and dots)', g3, (x) => `p${x.page} ${x.fills}`),
  row('G2 stroke weight', g2, (x) => `p${x.page} ${x.role} ${x.w}`),
  row('G5 type floor (main 32, mono 28, sources/locator 24)', g5, (x) => `p${x.page} ${x.anchor}/${x.role} ${x.px}px`),
  row('G22 label size constant (pages + hops at t .25/.5/.75)', g22, (x) => `${x.role} ${x.min}–${x.max}`),
  row('G24 map edge (cameras + panels)', g24, (x) => x.id),
  row('Keep-inside (text in 5% safe area)', keep, (x) => `p${x.page} ${x.anchor} "${x.s}"`),
  row('No label overlaps (text boxes)', over, (x) => `p${x.page} ${x.pair}`),
  row('Route clear of title, hero, flag boxes', rgate, (x) => `p${x.page} ${x.id}`),
  row('Route paper gap under every object', gap, (x) => `p${x.page} ${x.holes}/${x.objs}`)];
writeFileSync(join(OUT, 'gates.json'), JSON.stringify({ g1, g3, g2, g5, g22, g24, keep, over, rgate, gap }, null, 1));
writeFileSync(join(OUT, 'gates.md'), table.join('\n') + '\n');
console.log(table.join('\n'));
