// Rasterises dist/v31/talk.pdf with pdf.js (a real PDF renderer, not Chrome's print path)
// and writes selected sheets to board/out/pdf-sheet-<n>.png at 1920 px wide.
//   node tools/v31-pdfrender.mjs 3 6 11
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'talks/quantum/v31/board/out');
const want = process.argv.slice(2).map(Number);
const { server, port } = await startServer(ROOT, 0);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
await p.goto(`http://127.0.0.1:${port}/talks/quantum/v31/board/grid.html`, { waitUntil: 'load' });
const imgs = await p.evaluate(async (b64, port, want) => {
  const lib = await import(`http://127.0.0.1:${port}/node_modules/pdfjs-dist/build/pdf.mjs`);
  lib.GlobalWorkerOptions.workerSrc = `http://127.0.0.1:${port}/node_modules/pdfjs-dist/build/pdf.worker.mjs`;
  const doc = await lib.getDocument({ data: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), standardFontDataUrl: `http://127.0.0.1:${port}/node_modules/pdfjs-dist/standard_fonts/` }).promise, out = {};
  for (const i of want) { const pg = await doc.getPage(i), v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: 1920 / v0.width }); const c = document.createElement('canvas'); c.width = 1920; c.height = Math.round(vp.height); await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; out[i] = c.toDataURL('image/png'); }
  return out;
}, readFileSync(join(ROOT, 'dist/v31/talk.pdf')).toString('base64'), port, want);
for (const [i, d] of Object.entries(imgs)) writeFileSync(join(OUT, `pdf-sheet-${i}.png`), Buffer.from(d.split(',')[1], 'base64'));
await b.close(); server.close(); console.log('ok', Object.keys(imgs));
