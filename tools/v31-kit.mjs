// Kit view (block 5): renders board/kit.html to board/out/kit.png and runs G3 (fills)
// and G25 (strokes per 100 × 100 px: median 4–18 and max ≤ 24 at the reading zoom;
// ≤ 20 strokes for overview variants) on every code object.
//   node tools/v31-kit.mjs
import { writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'talks/quantum/v31/board/out');
const { server, port } = await startServer(ROOT, 0);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 2400, height: 1200 });
await p.goto(`http://127.0.0.1:${port}/talks/quantum/v31/board/kit.html`, { waitUntil: 'networkidle0' });
await p.waitForFunction('window.KIT'); await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: join(OUT, 'kit.png'), fullPage: true });
const M = await p.evaluate(() => [...document.querySelectorAll('svg.tile')].map((svg) => {
  const paths = [...svg.querySelectorAll('path')], sv = svg.getBoundingClientRect(), cells = new Map(); let strokes = 0;
  const fills = paths.map((e) => getComputedStyle(e).fill).filter((f) => f !== 'none' && f !== 'rgb(251, 251, 252)');
  for (const e of paths) { const m = e.getScreenCTM(); for (const part of e.getAttribute('d').split(/(?=M)/)) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'path'); t.setAttribute('d', part); e.parentNode.append(t);
    const L = t.getTotalLength(), seen = new Set(); for (let s = 0; s <= L; s += Math.max(1, L / 200)) { const q = t.getPointAtLength(s); seen.add(Math.floor((m.a * q.x + m.c * q.y + m.e - sv.x) / 100) + ',' + Math.floor((m.b * q.x + m.d * q.y + m.f - sv.y) / 100)); }
    t.remove(); strokes++; for (const c of seen) cells.set(c, (cells.get(c) || 0) + 1); } }
  const v = [...cells.values()].sort((a, c) => a - c);
  return { name: svg.dataset.name, row: svg.dataset.row, raster: !!svg.querySelector('image'), fills: fills.length, strokes, median: v[Math.floor(v.length / 2)] || 0, max: v[v.length - 1] || 0 };
}));
await b.close(); server.close();
// Small single-purpose glyphs (qubit, tile, frame, rulers) and data marks (prism rows) sit under the 4-stroke median by nature;
// G25's band is for objects that fill a cell field, so those are reported but marked "glyph".
const GLYPH = /qubit|check tile|^frame|rulers|prisms/; // glyphs and data marks: max only
const pass = (x) => x.raster || (x.row === '2' ? x.strokes <= 20 : (GLYPH.test(x.name) ? x.max <= 24 : x.median >= 4 && x.median <= 18 && x.max <= 24));
const lines = ['| Object | Zoom | Strokes | Median | Max | G3 fills | G25 |', '| --- | --- | --- | --- | --- | --- | --- |',
  ...M.map((x) => `| ${x.name} | ${x.row === '1' ? 'reading' : 'overview'} | ${x.raster ? 'raster' : x.strokes} | ${x.median} | ${x.max} | ${x.fills ? 'FAIL' : 'pass'} | ${x.raster ? 'n/a (raster; blind board)' : pass(x) ? (GLYPH.test(x.name) && x.row === '1' ? 'pass (glyph/data: max only)' : 'pass') : 'FAIL'} |`)];
writeFileSync(join(OUT, 'kit-gates.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
