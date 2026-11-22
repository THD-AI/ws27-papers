// Screenshots a studio figure at given positions and stage sizes (the 390 px
// thumbnail gate and alone frames).
//   node tools/studio-lab.mjs <fig> <pos,pos> <WxH> [<WxH> ...]   -> .shots/studio/lab/<fig>-<WxH>.png
import { mkdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [fig, pos, ...sizes] = process.argv.slice(2);
const out = join(ROOT, '.shots', 'studio', 'lab'); await mkdir(out, { recursive: true });
const { server, port } = await startServer(resolve(ROOT, 'studio'), 0);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
for (const s of sizes) {
  const [w, h] = s.split('x').map(Number);
  const p = await b.newPage();
  const n = pos.split(',').length;
  await p.setViewport({ width: Math.min(1900, (w + 20) * n), height: h + 60 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/lab.html?fig=${fig}&pos=${pos}&w=${w}&h=${h}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  await p.screenshot({ path: join(out, `${fig}-${s}.png`), fullPage: true });
  if (errs.length) console.log(s, errs);
  await p.close();
}
await b.close(); server.close();
console.log('ok');
