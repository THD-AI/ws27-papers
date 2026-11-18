// Read-through tool: scrolls an article from top to bottom the way a reader
// does and writes contact sheets of consecutive screens, so the whole page can
// be read screen by screen.
//
//   node tools/filmstrip.mjs <slug> [width] [height] [perSheet]
//
// Output: .shots/<slug>/strip-<width>x<height>-<n>.png

import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const [slug = 'renovate', W = '1440', H = '900', PER = '6'] = process.argv.slice(2);
const width = +W, height = +H, per = +PER;
const root = resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const data = await readFile(join(root, p));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${port}/${slug}/`, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);

const total = await page.evaluate(() => document.documentElement.scrollHeight);
const step = Math.round(height * 0.8);
const frames = [];
for (let y = 0; y < total - height + step; y += step) {
  // scroll in small moves so scroll-driven figures see a real reader
  await page.evaluate(async (to) => {
    const from = window.scrollY, n = 8;
    for (let i = 1; i <= n; i++) { window.scrollTo(0, from + (to - from) * i / n); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
  }, y);
  await new Promise(r => setTimeout(r, 450));
  // steps play over time once triggered (lib/article.js): wait until they are drawn
  await page.waitForFunction(() => !document.documentElement.dataset.moving, { timeout: 8000 }).catch(() => {});
  frames.push({ y, data: await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 }) });
}

const out = resolve('.shots', slug);
await mkdir(out, { recursive: true });
const sheet = await browser.newPage();
const cols = width > height ? 3 : 6, scale = width > height ? 0.5 : 0.62;
const cw = Math.round(width * scale), ch = Math.round(height * scale);
let n = 0;
for (let i = 0; i < frames.length; i += per) {
  const part = frames.slice(i, i + per);
  const rows = Math.ceil(part.length / cols);
  await sheet.setViewport({ width: cols * (cw + 12) + 12, height: rows * (ch + 30) + 12, deviceScaleFactor: 1 });
  await sheet.setContent(`<body style="margin:12px;background:#888;display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:12px;font:12px monospace;color:#fff">${part.map((f, k) => `<div><div>screen ${i + k + 1} · y ${f.y}</div><img src="data:image/jpeg;base64,${f.data}" style="width:${cw}px;height:${ch}px;display:block"></div>`).join('')}</body>`);
  n += 1;
  await sheet.screenshot({ path: join(out, `strip-${width}x${height}-${String(n).padStart(2, '0')}.png`) });
}
console.log(`${frames.length} screens, ${n} sheets in .shots/${slug}/ (page height ${total})`);
await browser.close();
server.close();
