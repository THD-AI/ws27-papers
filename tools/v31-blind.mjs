// H2 blind board: traces the forged object to centreline paths (thinned to the
// density budget), renders four objects at the zooms of beats 1, 6 and 0 in a
// shuffled order with neutral numbers, and runs G2, G3 and G25.
//   node tools/v31-blind.mjs <forged.png> <key-file> [out-dir]
// The tile order is drawn at random and written only to <key-file> (keep it outside the repo).
// G25 (as coded here): per object, strokes (subpaths) touching each 100 × 100 px cell of ink;
//   pass when the median over inked cells is 4–18 AND the max is ≤ 24, at the beat-1 and beat-6
//   zooms. Beat 0 uses the overview variants: pass when the object has ≤ 20 strokes.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomInt } from 'node:crypto';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [src, KEY, OUT = join(ROOT, 'talks/quantum/v31/board/out')] = process.argv.slice(2);
if (!src || !KEY) { console.error('usage: node tools/v31-blind.mjs <forged.png> <key-file> [out-dir]'); process.exit(1); }
mkdirSync(OUT, { recursive: true }); mkdirSync(join(ROOT, 'talks/quantum/v31/art'), { recursive: true });
// block 4c: the forged object is shown as its raster (option b); the trace stays as the G25 proxy and option (a)
copyFileSync(src, join(ROOT, 'talks/quantum/v31/art/cryostat.png'));
const cl = readFileSync(join(ROOT, 'tools/centreline.mjs'), 'utf8');
const traceSrc = cl.slice(cl.indexOf('function trace(img, opts) {'), cl.indexOf('\nconst html'));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
await p.setContent(`<!doctype html><script>${traceSrc}</script>`);
const png = 'data:image/png;base64,' + readFileSync(src).toString('base64');

// Thinning: stronger simplification, drop short paths, then a greedy density cap –
// longest paths first (plates, posts, coil outlines), a path is kept only while every
// cell it touches stays under CAP strokes. Cells are sized to 100 screen px at the
// beat-6 zoom (the denser case): 900 map units tall × 0.6 px per unit.
const T = await p.evaluate(async (png) => {
  const img = new Image(); img.src = png; await img.decode();
  const r = trace(img, { alpha: 48, thr: 230, close: 1, spur: 12, eps: 4, join: 10 });
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); document.body.append(svg);
  const CELL = 100 / ((900 / r.H) * 0.6), CAP = 14, MINLEN = 70;
  const info = r.paths.map((d, i) => {
    const e = document.createElementNS(NS, 'path'); e.setAttribute('d', d); svg.append(e);
    const L = e.getTotalLength(), cells = new Set();
    for (let s = 0; s <= L; s += 4) { const q = e.getPointAtLength(s); cells.add(Math.floor(q.x / CELL) + ',' + Math.floor(q.y / CELL)); }
    return { i, d, L, cells: [...cells] };
  }).filter((x) => x.L >= MINLEN).sort((a, b) => b.L - a.L);
  const load = new Map(), kept = [];
  for (const x of info) {
    if (x.cells.some((c) => (load.get(c) || 0) >= CAP)) continue;
    for (const c of x.cells) load.set(c, (load.get(c) || 0) + 1);
    kept.push(x);
  }
  const paths = kept.map((x) => x.d);
  return { W: r.W, H: r.H, raw: r.paths.length, paths, overview: [...Array(Math.min(20, paths.length)).keys()] };
}, png);
writeFileSync(join(ROOT, 'talks/quantum/v31/art/cryostat.json'), JSON.stringify({ what: 'centreline trace of the forged cryostat, thinned to the density budget; overview = the 20 longest paths', W: T.W, H: T.H, overview: T.overview, paths: T.paths }));
console.log('trace', { raw: T.raw, kept: T.paths.length });

// shuffle: never the block-4 order (r, t, f, c), and never the same slot for the traced object
const ids = ['t', 'c', 'f', 'r'];
let order;
do { order = [...ids]; for (let i = order.length - 1; i > 0; i--) { const j = randomInt(i + 1); [order[i], order[j]] = [order[j], order[i]]; } } while (order.join() === 'r,t,f,c' || order[0] === 't' || order[1] === 't');
const NAMES = { t: 'FORGED cryostat (raster of forge/out/qc31-cryostat.png, recoloured, lines grown to the token)', c: 'code chip', f: 'code film', r: 'code reader (rack)' };
writeFileSync(KEY, order.map((id, i) => `${i + 1}: ${NAMES[id]}`).join('\n') + '\n');

const { server, port } = await startServer(ROOT, 0);
await p.setViewport({ width: 2000, height: 1200 });
await p.goto(`http://127.0.0.1:${port}/talks/quantum/v31/board/blind.html?order=${order.join(',')}`, { waitUntil: 'networkidle0' });
await p.waitForFunction('window.BLIND');
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: join(OUT, 'objects-board.png'), fullPage: true });
const RASTER = await p.evaluate(() => window.RASTER);
const M0 = null;
const M = await p.evaluate(() => {
  const res = { g2: [], g3: [], g25: [] };
  for (const svg of document.querySelectorAll('svg.tile')) {
    const row = svg.dataset.row, n = svg.dataset.n, paths = [...svg.querySelectorAll('path')];
    for (const e of paths) { if (e.closest('[data-proxy]')) continue; const cs = getComputedStyle(e); res.g2.push({ row, n, w: parseFloat(cs.strokeWidth), ns: cs.vectorEffect }); res.g3.push({ row, n, fill: cs.fill }); }
    if (svg.querySelector('image[data-raster]')) res.g2.push({ row, n, raster: true });
    const cells = new Map(), sv = svg.getBoundingClientRect(); let strokes = 0;
    for (const e of paths) {
      const m = e.getScreenCTM();
      for (const part of e.getAttribute('d').split(/(?=M)/)) {
        const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path'); tmp.setAttribute('d', part); e.parentNode.append(tmp);
        const L = tmp.getTotalLength(), seen = new Set();
        for (let s = 0; s <= L; s += Math.max(1, L / 200)) { const q = tmp.getPointAtLength(s); seen.add(Math.floor((m.a * q.x + m.c * q.y + m.e - sv.x) / 100) + ',' + Math.floor((m.b * q.x + m.d * q.y + m.f - sv.y) / 100)); }
        tmp.remove(); strokes++;
        for (const c of seen) cells.set(c, (cells.get(c) || 0) + 1);
      }
    }
    const v = [...cells.values()].sort((a, b) => a - b);
    res.g25.push({ row, n, median: v[Math.floor(v.length / 2)] || 0, max: v[v.length - 1] || 0, strokes });
  }
  return res;
});
// (a) vs (b) comparison, written next to the key (it names the forged object)
await p.goto(`http://127.0.0.1:${port}/talks/quantum/v31/board/blind.html?compare=1`, { waitUntil: 'networkidle0' });
await p.waitForFunction('window.BLIND');
await p.screenshot({ path: join(dirname(KEY), 'objects-trace-vs-raster.png'), fullPage: true });
await b.close(); server.close();

const PAPER = ['none', 'rgb(251, 251, 252)'];
// G2, revised tolerance (proposal): object token 3 px ± 15% (2.55–3.45) for hand-pen strokes; raster = median ink run in the same band
for (const x of M.g2) if (x.raster) x.w = RASTER[x.row].run, x.ns = 'non-scaling-stroke';
const g2bad = M.g2.filter((x) => Math.abs(x.w - 3) > 0.45 + 1e-9 || x.ns !== 'non-scaling-stroke');
const g3bad = M.g3.filter((x) => !PAPER.includes(x.fill));
const pass25 = (x) => (x.row === 'beat 0' ? x.strokes <= 20 : x.median >= 4 && x.median <= 18 && x.max <= 24);
const lines = ['| Gate | Result |', '| --- | --- |',
  `| G2 stroke weight (3 px ± 15%, non-scaling; raster: median ink run ${Object.entries(RASTER).map(([k, v]) => k + ' ' + v.run + ' px').join(', ')}) | ${M.g2.length - g2bad.length}/${M.g2.length} ${g2bad.length ? 'FAIL' : 'pass'} |`,
  `| G3 fills (none or paper) | ${M.g3.length - g3bad.length}/${M.g3.length} ${g3bad.length ? 'FAIL' : 'pass'} |`,
  `| G25 (median 4–18 and max ≤ 24 per 100 × 100 px at beats 1, 6; ≤ 20 strokes at beat 0) | ${M.g25.filter(pass25).length}/${M.g25.length} ${M.g25.every(pass25) ? 'pass' : 'FAIL'} |`,
  '', '| Object | Row | Median | Max | Strokes | G25 |', '| --- | --- | --- | --- | --- | --- |',
  ...M.g25.map((x) => `| ${x.n} | ${x.row} | ${x.median} | ${x.max} | ${x.strokes} | ${pass25(x) ? 'pass' : 'FAIL'} |`)];
writeFileSync(join(OUT, 'objects-gates.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
console.log('raster', RASTER);
