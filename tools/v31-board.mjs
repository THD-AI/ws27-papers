// v3.1 board + gates (block 2): renders map, grid (chevron and strip) and the
// nine stand-in frames to PNG, then runs G2 (stroke weight) and G24 (map edge).
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
const TOK = { grid: 1.5, leader: 2, object: 3, route: 4 }, TOL = 0.2;
const g2 = [];

await p.setViewport({ width: 1920, height: 1080 });
for (const route of ['chevron', 'strip']) {
  for (let i = 1; i <= 9; i++) {
    await p.goto(`${base}index.html?print=1&page=${i}&route=${route}`, { waitUntil: 'networkidle0' });
    await p.waitForFunction('window.V31 && window.V31.ready');
    await p.evaluate(() => document.fonts.ready);
    if (route === 'chevron') await p.screenshot({ path: join(OUT, `frame-${i}.png`) });
    // G2: computed stroke width in screen px. Non-scaling strokes: CSS px = screen px at 1920 x 1080.
    const rows = await p.evaluate(() => [...document.querySelectorAll('[data-stroke]')].map((e) => ({ role: e.dataset.stroke, w: parseFloat(getComputedStyle(e).strokeWidth), ns: getComputedStyle(e).vectorEffect })));
    for (const r of rows) g2.push({ route, page: i, ...r, pass: Math.abs(r.w - TOK[r.role]) <= TOL && r.ns === 'non-scaling-stroke' });
  }
}
await p.setViewport({ width: 3000, height: 900 });
await p.goto(base + 'board/map.html', { waitUntil: 'networkidle0' });
await p.waitForFunction('window.MAP');
await p.screenshot({ path: join(OUT, 'board-map.png'), fullPage: true });
const MAP = await p.evaluate(() => window.MAP);
for (const route of ['chevron', 'strip']) {
  await p.setViewport({ width: 2040, height: 1260 });
  await p.goto(`${base}board/grid.html?route=${route}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));
  await p.screenshot({ path: join(OUT, `board-grid-${route}.png`), fullPage: true });
}
await b.close(); server.close();

// G24: every camera rectangle and lifted panel inside 9600 x 5400
const g24 = [];
for (const [route, items] of Object.entries(MAP)) for (const it of items) {
  const cross = it.x < 0 || it.y < 0 || it.x + it.w > 9600 || it.y + it.h > 5400;
  g24.push({ route, kind: it.kind, id: it.id, x: Math.round(it.x), y: Math.round(it.y), r: Math.round(it.x + it.w), b: Math.round(it.y + it.h), pass: !cross });
}
const sum = (rows, route) => { const r = rows.filter((x) => x.route === route); return `${r.filter((x) => x.pass).length}/${r.length}`; };
const table = ['| Gate | Route | Passed | Result |', '| --- | --- | --- | --- |'];
for (const route of ['chevron', 'strip']) {
  table.push(`| G2 stroke weight | ${route} | ${sum(g2, route)} | ${g2.filter((x) => x.route === route).every((x) => x.pass) ? 'pass' : 'FAIL'} |`);
  const f = g24.filter((x) => x.route === route && !x.pass);
  table.push(`| G24 map edge | ${route} | ${sum(g24, route)} | ${f.length ? 'FAIL: ' + f.map((x) => x.id).join(', ') : 'pass, 0 crossings'} |`);
}
writeFileSync(join(OUT, 'gates.json'), JSON.stringify({ g2, g24 }, null, 1));
writeFileSync(join(OUT, 'gates.md'), table.join('\n') + '\n');
console.log(table.join('\n'));
console.log(g24.filter((x) => !x.pass));
