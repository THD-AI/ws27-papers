// Motion board (block 8): strips at 0 / 25 / 50 / 75 / 100% for every camera hop and every
// animated build, written to board/out/motion-*.png and combined in board/out/board-motion.png,
// plus gate G12 (motion focus): after the hop, within a build only the focus element's box
// changes, and at 100% the focus sits in the centre two thirds. Exempt: the first-build
// camera hop (hops are rendered as strips, not gated) and LOD swaps.
//   node tools/v31-motion.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), V = join(ROOT, 'talks/quantum/v31'), OUT = join(V, 'board/out');
mkdirSync(OUT, { recursive: true });
const P = JSON.parse(readFileSync(join(V, 'pages.json'), 'utf8'));
const { server, port } = await startServer(ROOT, 0);
const base = `http://127.0.0.1:${port}/talks/quantum/v31/index.html?print=1&`;
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const T = [0, 0.25, 0.5, 0.75, 1];
async function shot(qs) {
  await p.goto(base + qs, { waitUntil: 'networkidle0' });
  await p.waitForFunction('window.V31 && window.V31.ready');
  await p.evaluate(() => document.fonts.ready);
  return (await p.screenshot({ type: 'jpeg', quality: 80 })).toString('base64');
}
const items = [];
for (let i = 2; i <= P.pages.length; i++) {
  const a = P.pages[i - 2], c = P.pages[i - 1];
  if (typeof c.beat !== 'number') continue;
  if (a.camera !== c.camera) items.push({ name: `motion-hop-p${i}`, label: `hop ${a.camera} → ${c.camera} (page ${i}, eased, 1.0 s)`, qs: T.map((t) => `page=${i}&from=${i - 1}&t=${ease(t).toFixed(4)}&p=0`) });
  if (c.anim) items.push({ name: `motion-build-p${i}`, label: `beat ${c.beat} build: ${c.anim.kind} (page ${i}, ${c.anim.dur / 1000} s)`, qs: T.map((t) => `page=${i}&p=${t}`) });
}
const strips = [];
for (const it of items) {
  const imgs = []; for (const qs of it.qs) imgs.push(await shot(qs));
  const html = `<!doctype html><body style="margin:0;background:#FBFBFC;font:500 22px sans-serif;color:#15171C"><div style="padding:10px 16px">${it.label}</div><div style="display:flex;gap:10px;padding:0 16px 16px">${imgs.map((d, k) => `<figure style="margin:0"><img src="data:image/jpeg;base64,${d}" style="width:480px;outline:1px solid #DADDE3"><figcaption style="font-size:18px">${T[k] * 100}%</figcaption></figure>`).join('')}</div></body>`;
  const q = await b.newPage(); await q.setViewport({ width: 2500, height: 340 }); await q.setContent(html, { waitUntil: 'load' });
  await q.screenshot({ path: join(OUT, it.name + '.png'), fullPage: true }); await q.close();
  strips.push({ ...it, imgs });
}
// combined board
{
  const html = `<!doctype html><body style="margin:0;background:#FBFBFC;font:500 22px sans-serif;color:#15171C">${strips.map((it) => `<div style="padding:10px 16px">${it.label}</div><div style="display:flex;gap:10px;padding:0 16px 10px">${it.imgs.map((d) => `<img src="data:image/jpeg;base64,${d}" style="width:384px;outline:1px solid #DADDE3">`).join('')}</div>`).join('')}</body>`;
  const q = await b.newPage(); await q.setViewport({ width: 2000, height: 800 }); await q.setContent(html, { waitUntil: 'load' });
  await q.screenshot({ path: join(OUT, 'board-motion.png'), fullPage: true }); await q.close();
}
// G12
const boxes = async (qs) => { await p.goto(base + qs, { waitUntil: 'networkidle0' }); await p.waitForFunction('window.V31 && window.V31.ready'); await p.evaluate(() => document.fonts.ready);
  return p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#world > [data-zone], #world > [data-thing-id]')].concat([...document.querySelectorAll('#ann > [data-anchor]')].map((e) => (e.dataset.annot = 1, e))).map((e) => { const kids = [...e.children].filter((k) => k.tagName !== 'mask'); const rs = (kids.length ? kids : [e]).map((k) => k.getBoundingClientRect()).filter((q) => q.width || q.height); const x0 = Math.min(...rs.map((q) => q.x)), y0 = Math.min(...rs.map((q) => q.y)), x1 = Math.max(...rs.map((q) => q.right)), y1 = Math.max(...rs.map((q) => q.bottom)); const r = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }; return [e.dataset.annot ? 'a:' + e.dataset.anchor + ':' + (e.dataset.target || '') : e.dataset.zone ? 'z:' + e.dataset.zone : e.dataset.thingId ? 't:' + e.dataset.thingId : 'a:' + e.dataset.anchor + ':' + (e.dataset.target || ''), [r.x, r.y, r.width, r.height].map((v) => +v.toFixed(1))]; }))); };
const g12 = [];
for (let i = 1; i <= P.pages.length; i++) {
  const c = P.pages[i - 1]; if (!c.anim) continue;
  const A = await boxes(`page=${i}&p=0`), B = await boxes(`page=${i}&p=1`), f = c.anim.focus;
  const moved = Object.keys(B).filter((k) => A[k] && B[k].some((v, j) => Math.abs(v - A[k][j]) > 1));
  const other = moved.filter((k) => k !== 't:' + f && !k.endsWith(':' + f));
  const [x, y, w, h] = B['t:' + f], cx = x + w / 2, cy = y + h / 2;
  const centred = cx >= 320 && cx <= 1600 && cy >= 180 && cy <= 900;
  if (other.length) console.log('G12 detail p' + i, other.map((k) => k + ' ' + A[k] + ' -> ' + B[k]).join('; '));
  g12.push({ page: i, beat: c.beat, focus: f, moved: moved.join(' '), other: other.join(' '), centre: [Math.round(cx), Math.round(cy)], pass: !other.length && centred });
}
await b.close(); server.close();
const table = ['| Page | Beat | Focus | Others moved | Focus centre at 100% | G12 |', '| --- | --- | --- | --- | --- | --- |', ...g12.map((x) => `| ${x.page} | ${x.beat} | ${x.focus} | ${x.other || 'none'} | ${x.centre.join(', ')} | ${x.pass ? 'pass' : 'FAIL'} |`)];
writeFileSync(join(OUT, 'motion-gates.md'), table.join('\n') + '\n');
console.log(items.map((i) => i.name).join('\n')); console.log(table.join('\n'));
