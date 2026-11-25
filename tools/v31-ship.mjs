// Block 9 gates on the single offline file dist/v31/talk.html (build it first: node tools/v31-bundle.mjs):
//   PDF of the print mode, presenter screenshot, U+2009 measurement in the embedded fonts,
//   G16 print = screen, G17 offline, G18 performance.
//   node tools/v31-ship.mjs
import { readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'talks/quantum/v31/board/out');
mkdirSync(OUT, { recursive: true });
const FILE = join(ROOT, 'dist/v31/talk.html'), URL0 = pathToFileURL(FILE).href, PDF = join(ROOT, 'dist/v31/talk.pdf');
const P = JSON.parse(readFileSync(join(ROOT, 'talks/quantum/v31/pages.json'), 'utf8'));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 240000, args: ['--allow-file-access-from-files'] });
const ready = (p) => p.waitForFunction('window.V31 && window.V31.ready', { timeout: 60000 });

// 1. thin space in the embedded figure font
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
const t0 = Date.now();
await p.goto(URL0 + '?page=1', { waitUntil: 'load' }); await ready(p);
// first paint of the drawn deck: time from navigation start until the first page is drawn (an upper bound)
// median over three loads of the time from navigation start to the first drawn frame
const firsts = []; for (let k = 0; k < 3; k++) { await p.goto(URL0 + '?page=1', { waitUntil: 'load' }); await ready(p); await p.waitForFunction('window.V31_FIRST'); firsts.push(await p.evaluate(() => window.V31_FIRST)); }
const paint = firsts.sort((a, b) => a - b)[1];
const thin = await p.evaluate(() => { const r = {}; for (const f of ['600 120px "Libre Franklin"', '600 44px "Libre Franklin"', '400 32px "Libre Franklin"']) { const c = document.createElement('canvas').getContext('2d'); c.font = f; r[f] = { space: +(c.measureText('24 s').width - c.measureText('24s').width).toFixed(1), thin: +(c.measureText('24\u2009s').width - c.measureText('24s').width).toFixed(1) }; } return r; });

// 2. PDF of print mode (timed)
const pp = await b.newPage(); await pp.setViewport({ width: 1920, height: 1080 });
const tp = Date.now();
await pp.goto(URL0 + '?print=all', { waitUntil: 'load' }); await ready(pp);
await pp.pdf({ path: PDF, width: '13.333in', height: '7.5in', printBackground: true, preferCSSPageSize: true });
const printSecs = (Date.now() - tp) / 1000;
const sheets = await pp.evaluate(() => window.V31.sheets); await pp.close();

// 3. G16: pdfjs render of each PDF page vs the screen still, caption band masked
const { server, port } = await startServer(ROOT, 0);
const pj = await b.newPage(); await pj.setViewport({ width: 1920, height: 1080 });
await pj.bringToFront(); await pj.goto(`http://127.0.0.1:${port}/talks/quantum/v31/board/grid.html`, { waitUntil: 'load' });
const pdfB64 = readFileSync(PDF).toString('base64');
const pdfPages = await pj.evaluate(async (b64, port) => {
  const lib = await import(`http://127.0.0.1:${port}/node_modules/pdfjs-dist/build/pdf.mjs`);
  lib.GlobalWorkerOptions.workerSrc = `http://127.0.0.1:${port}/node_modules/pdfjs-dist/build/pdf.worker.mjs`;
  const doc = await lib.getDocument({ data: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) }).promise, out = [];
  for (let i = 1; i <= doc.numPages; i++) { const pg = await doc.getPage(i), vp0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: 1920 / vp0.width }); const c = document.createElement('canvas'); c.width = 1920; c.height = Math.round(vp.height); await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; out.push(c.toDataURL('image/png')); }
  return out;
}, pdfB64, port);
const g16 = [];
const order = []; P.pages.forEach((pg, i) => { if (typeof pg.beat === 'string' && typeof P.pages[i - 1]?.beat === 'number') order.push(null); order.push(i + 1); });
for (let k = 0; k < order.length; k++) {
  const n = order[k]; if (n == null) continue;
  await p.goto(URL0 + `?print=1&page=${n}`, { waitUntil: 'load' }); await ready(p);
  await p.bringToFront(); const shot = 'data:image/png;base64,' + (await p.screenshot({ encoding: 'base64' })); await pj.bringToFront();
  const diff = await pj.evaluate(async (a, bb) => {
    const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const [A, B] = await Promise.all([load(a), load(bb)]), c = (img) => { const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080; const g = cv.getContext('2d'); g.drawImage(img, 0, 0, 1920, 1080); return g.getImageData(0, 0, 1920, 958).data; };
    // a pixel differs only if no pixel within 2 px in the other image matches it (rasteriser anti-aliasing and sub-pixel shifts are not differences)
    const x = c(A), y = c(B), W = 1920, H = 958, near = (u, v, i) => Math.max(Math.abs(u[i] - v[i]), Math.abs(u[i + 1] - v[i + 1]), Math.abs(u[i + 2] - v[i + 2])) <= 48;
    let bad = 0; for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) { const i = (py * W + px) * 4; if (near(x, y, i)) continue; let ok = false; for (let dy = -2; dy <= 2 && !ok; dy++) for (let dx = -2; dx <= 2 && !ok; dx++) { const qx = px + dx, qy = py + dy; if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue; const j = (qy * W + qx) * 4; if (Math.max(Math.abs(x[i] - y[j]), Math.abs(x[i + 1] - y[j + 1]), Math.abs(x[i + 2] - y[j + 2])) <= 48) ok = true; } if (!ok) bad++; }
    return bad / (x.length / 4);
  }, pdfPages[k], shot);
  if (process.env.DUMP == n) { writeFileSync(join(OUT, 'g16-pdf.png'), Buffer.from(pdfPages[k].split(',')[1], 'base64')); writeFileSync(join(OUT, 'g16-screen.png'), Buffer.from(shot.split(',')[1], 'base64')); }
  g16.push({ page: n, pct: +(diff * 100).toFixed(2), pass: diff <= 0.01 });
}
server.close(); await pj.close(); await p.close();

// 4. G17 offline: no http(s) requests; deck and presenter follow the clicker keys
const po = await b.newPage(); await po.bringToFront(); await po.setViewport({ width: 1920, height: 1080 });
const reqs = []; po.on('request', (r) => { if (/^https?:/.test(r.url())) reqs.push(r.url()); });
await po.goto(URL0 + '?page=1', { waitUntil: 'load' }); await ready(po);
await po.evaluate(() => window.V31_KEY('M')); // motion off for the key test
const popP = new Promise((r) => b.once('targetcreated', (t) => r(t)));
await po.keyboard.press('KeyP');
const pres = await (await popP).page(); pres.on('request', (r) => { if (/^https?:/.test(r.url())) reqs.push(r.url()); });
await pres.waitForFunction('window.V31 && window.V31.presenter', { timeout: 30000 });
for (let i = 0; i < 3; i++) { await po.keyboard.press('ArrowRight'); await new Promise((r) => setTimeout(r, 300)); }
await po.keyboard.press('PageDown'); await po.keyboard.press('ArrowLeft'); await new Promise((r) => setTimeout(r, 800));
const deckPage = await po.evaluate(() => window.V31.page), presPage = await pres.evaluate(() => window.V31.page());
await pres.setViewport({ width: 1600, height: 900 }); await pres.bringToFront(); await new Promise((r) => setTimeout(r, 1500));
await pres.screenshot({ path: join(ROOT, 'dist/v31/presenter.png') });
const g17 = { requests: reqs.length, deckPage, presPage, pass: reqs.length === 0 && deckPage === 4 && presPage === 4 };

// 5. G18 performance: frame times during every hop with motion on, at 1920 × 1080
await po.close(); await pres.close(); const pf = await b.newPage(); await pf.bringToFront(); await pf.setViewport({ width: 1920, height: 1080 });
await pf.goto(URL0 + '?page=1', { waitUntil: 'load' }); await ready(pf); await pf.bringToFront();
const hops = [];
// warm-up pass through all hops (first-use compilation and caches), then back to page 1
for (let n = 1; n < 11; n++) await pf.evaluate((n) => Promise.race([window.V31_GO(n + 1), new Promise((r) => setTimeout(r, 3000))]), n);
await pf.goto(URL0 + '?page=1', { waitUntil: 'load' }); await ready(pf);
for (let n = 1; n < 11; n++) {
  const r = await pf.evaluate(async (n) => {
    const d = []; let last = performance.now(), on = true; const tick = (t) => { d.push(t - last); last = t; if (on) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    const pr = window.V31_GO(n + 1); await Promise.race([pr, new Promise((r) => setTimeout(r, 3000))]); on = false;
    const s = d.slice(1).sort((a, b) => a - b); return { max: s[s.length - 1], p95: s[Math.floor(s.length * 0.95)], frames: d.length };
  }, n);
  hops.push({ to: n + 1, ...r });
}
const size = statSync(FILE).size, pdfSize = statSync(PDF).size;
await b.close();

const hv = hops.filter((h) => Number.isFinite(h.max)); const maxFrame = Math.max(...hv.map((h) => h.max));
const machine = `${os.cpus()[0].model.trim()}, ${os.cpus().length} threads, ${(os.totalmem() / 2 ** 30).toFixed(0)} GB, ${os.platform()} ${os.release()}; headless Chrome`;
const g18 = [
  ['Camera hop: max frame (ms)', +maxFrame.toFixed(1) + ' (95th percentile ' + Math.max(...hv.map((h) => h.p95)).toFixed(1) + ')', '≤ 50', maxFrame <= 50],
  ['First drawn page of the offline file (s)', paint ? +(paint / 1000).toFixed(2) : 'n/a', '≤ 1.5', paint != null && paint <= 1500],
  ['Offline file (MB)', +(size / 2 ** 20).toFixed(2), '≤ 10', size <= 10 * 2 ** 20],
  ['Print of all pages (s)', +printSecs.toFixed(1), '≤ 30', printSecs <= 30],
];
const lines = ['| Gate | Result | Detail |', '| --- | --- | --- |',
  `| G16 print = screen (≤ 1% pixels differ beyond 2 px, caption band masked) | ${g16.filter((x) => x.pass).length}/${g16.length} ${g16.every((x) => x.pass) ? 'pass' : 'FAIL'} | worst ${Math.max(...g16.map((x) => x.pct))}% |`,
  `| G17 offline (0 network requests; deck and presenter follow keys) | ${g17.pass ? 'pass' : 'FAIL'} | ${g17.requests} requests; deck page ${g17.deckPage}, presenter page ${g17.presPage} |`,
  ...g18.map(([k, v, t, ok]) => `| G18 ${k} | ${ok ? 'pass' : 'FAIL'} | ${v} (budget ${t}) |`),
  '', `G18 measured on: ${machine}. Not the presenting laptop; repeat there (PLAYER.md).`,
  '', `Thin space in the embedded fonts (px, '24 s' minus '24s'): ${JSON.stringify(thin)}`,
  `PDF: ${sheets} sheets, ${(pdfSize / 2 ** 20).toFixed(2)} MB`];
writeFileSync(join(OUT, 'ship-gates.md'), lines.join('\n') + '\n');
writeFileSync(join(OUT, 'ship-gates.json'), JSON.stringify({ g16, g17, hops, g18, thin, machine }, null, 1));
console.log(lines.join('\n'));
