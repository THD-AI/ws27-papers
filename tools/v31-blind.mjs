// H2 blind board (block 4): traces the forged object to centreline paths, renders
// four objects at the zooms of beats 1, 6 and 0 with neutral numbers, and runs
// G2 (stroke weight), G3 (fills) and G25 (strokes per 100 × 100 px).
//   node tools/v31-blind.mjs <forged.png> [out-dir]
// Writes talks/quantum/v31/art/cryostat.json, <out>/objects-board.png, <out>/objects-key.txt, <out>/objects-gates.md
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [src, OUT = join(ROOT, 'talks/quantum/v31/board/out')] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true }); mkdirSync(join(ROOT, 'talks/quantum/v31/art'), { recursive: true });
// the trace function is the spike's, taken from tools/centreline.mjs
const cl = readFileSync(join(ROOT, 'tools/centreline.mjs'), 'utf8');
const traceSrc = cl.slice(cl.indexOf('function trace(img, opts) {'), cl.indexOf('\nconst html'));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
await p.setContent(`<!doctype html><script>${traceSrc}</script>`);
const png = 'data:image/png;base64,' + readFileSync(src).toString('base64');
const T = await p.evaluate(async (png) => {
  const img = new Image(); img.src = png; await img.decode();
  const r = trace(img, { alpha: 48, thr: 230, close: 1, spur: 10, eps: 2.5, join: 8 });
  // drop specks: paths whose extent is under 30 px of the source
  const keep = r.paths.filter((d) => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number), xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2); return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) >= 30; });
  return { W: r.W, H: r.H, ink: r.ink, skel: r.skel, paths: keep, dropped: r.paths.length - keep.length, nodes: r.nodes };
}, png);
writeFileSync(join(ROOT, 'talks/quantum/v31/art/cryostat.json'), JSON.stringify({ what: 'centreline trace of the forged cryostat (forge/out/qc31-cryostat.png), source px', W: T.W, H: T.H, paths: T.paths }));
console.log('trace', { W: T.W, H: T.H, inkPx: T.ink, skeletonPx: T.skel, paths: T.paths.length, dropped: T.dropped });

const { server, port } = await startServer(ROOT, 0);
const order = 'reader,traced,film,chip';
await p.setViewport({ width: 2000, height: 1200 });
await p.goto(`http://127.0.0.1:${port}/talks/quantum/v31/board/blind.html?order=${order}`, { waitUntil: 'networkidle0' });
await p.waitForFunction('window.BLIND');
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: join(OUT, 'objects-board.png'), fullPage: true });
const M = await p.evaluate(() => {
  const res = { g2: [], g3: [], g25: [] };
  for (const svg of document.querySelectorAll('svg.tile')) {
    const row = svg.dataset.row, obj = svg.dataset.obj, paths = [...svg.querySelectorAll('path')];
    for (const e of paths) { const cs = getComputedStyle(e); res.g2.push({ row, obj, w: parseFloat(cs.strokeWidth), ns: cs.vectorEffect }); res.g3.push({ row, obj, fill: cs.fill }); }
    // G25: split each path into its subpaths (strokes); count strokes touching each 100 × 100 px cell
    const cells = new Map(), sv = svg.getBoundingClientRect();
    let strokeId = 0;
    for (const e of paths) {
      const m = e.getScreenCTM(), parts = e.getAttribute('d').split(/(?=M)/);
      for (const part of parts) {
        const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path'); tmp.setAttribute('d', part); e.parentNode.append(tmp);
        const L = tmp.getTotalLength(), seen = new Set();
        for (let s = 0; s <= L; s += Math.max(1, L / 200)) { const q = tmp.getPointAtLength(s), x = m.a * q.x + m.c * q.y + m.e - sv.x, y = m.b * q.x + m.d * q.y + m.f - sv.y; seen.add(Math.floor(x / 100) + ',' + Math.floor(y / 100)); }
        tmp.remove(); strokeId++;
        for (const c of seen) cells.set(c, (cells.get(c) || 0) + 1);
      }
    }
    const v = [...cells.values()].sort((a, b) => a - b);
    res.g25.push({ row, obj, cells: v.length, median: v[Math.floor(v.length / 2)] || 0, max: v[v.length - 1] || 0, strokes: strokeId });
  }
  return res;
});
await b.close(); server.close();

const PAPER = ['none', 'rgb(251, 251, 252)'];
const g2bad = M.g2.filter((x) => Math.abs(x.w - 3) > 0.2 || x.ns !== 'non-scaling-stroke');
const g3bad = M.g3.filter((x) => !PAPER.includes(x.fill));
const lines = ['| Gate | Result |', '| --- | --- |',
  `| G2 stroke weight (object token 3 ± 0.2, non-scaling) | ${M.g2.length - g2bad.length}/${M.g2.length} ${g2bad.length ? 'FAIL' : 'pass'} |`,
  `| G3 fills (none or paper) | ${M.g3.length - g3bad.length}/${M.g3.length} ${g3bad.length ? 'FAIL' : 'pass'} |`,
  '', '| G25 strokes per 100 × 100 px (4–18) | Row | Median | Max | Result |', '| --- | --- | --- | --- | --- |'];
const num = Object.fromEntries(order.split(',').map((id, i) => [id, i + 1]));
for (const x of M.g25) lines.push(`| object ${num[x.obj]} | ${x.row} | ${x.median} | ${x.max} | ${x.row === 'beat 0' ? 'info (overview variant due)' : x.median >= 4 && x.max <= 18 ? 'pass' : 'FAIL'} |`);
writeFileSync(join(OUT, 'objects-gates.md'), lines.join('\n') + '\n');
writeFileSync(join(OUT, 'objects-key.txt'), order.split(',').map((id, i) => `${i + 1}: ${id === 'traced' ? 'FORGED cryostat (centreline trace of forge/out/qc31-cryostat.png)' : 'code ' + id}`).join('\n') + '\n');
console.log(lines.join('\n'));
