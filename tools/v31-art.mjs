// Prepares the forged cryostat raster for the world (block 5): ink recoloured to the pen
// colour, lines grown so they render at the 3 px object token between the A (0.8 px/unit)
// and CD (0.6) cameras at 700 map units tall, stored at half the source size.
//   node tools/v31-art.mjs  ->  talks/quantum/v31/art/cryostat-world.png
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), ART = join(ROOT, 'talks/quantum/v31/art');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
const png = 'data:image/png;base64,' + readFileSync(join(ART, 'cryostat.png')).toString('base64');
const out = await p.evaluate(async (png) => {
  const img = new Image(); img.src = png; await img.decode();
  const W = img.width, H = img.height, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, W, H).data;
  let M = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) M[i] = d[i * 4 + 3] >= 64 ? 1 : 0;
  const disp = (700 / H) * 0.7, need = 3 / disp, src = 3, r = Math.max(0, Math.round((need - src) / 2));
  for (let it = 0; it < r; it++) { const o = new Uint8Array(W * H); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; o[i] = M[i] | M[i - 1] | M[i + 1] | M[i - W] | M[i + W]; } M = o; }
  const id = g.createImageData(W, H); for (let i = 0; i < W * H; i++) { id.data[i * 4] = 0x15; id.data[i * 4 + 1] = 0x17; id.data[i * 4 + 2] = 0x1c; id.data[i * 4 + 3] = M[i] ? 255 : 0; }
  g.clearRect(0, 0, W, H); g.putImageData(id, 0, 0);
  const s = document.createElement('canvas'); s.width = W / 2; s.height = H / 2; const sg = s.getContext('2d'); sg.imageSmoothingQuality = 'high'; sg.drawImage(c, 0, 0, W / 2, H / 2);
  return { url: s.toDataURL('image/png'), r };
}, png);
writeFileSync(join(ART, 'cryostat-world.png'), Buffer.from(out.url.split(',')[1], 'base64'));
console.log('cryostat-world.png, grown by', out.r, 'px');
await b.close();
