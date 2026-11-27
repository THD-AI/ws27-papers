// A 3x zoom crop of one hatched tile (the flip-check at the lower left of
// the large grid, step 0, desktop frame of 860 px), into png/final2-zoom-tile.png.
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from '../../../../tools/serve.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const { server, port } = await startServer(resolve(HERE, '../../../..'), 0);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 700, deviceScaleFactor: 3 });
await page.goto(`http://127.0.0.1:${port}/articles/other-half/figures/_grid-lab/lab.html?v=final2&steps=0&layout=wide&bare=1`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__lab && window.__lab.ready);
const [stp, bx, by, bs, name] = [process.argv[2] || '0', +(process.argv[3] || 130), +(process.argv[4] || 216), +(process.argv[5] || 132), process.argv[6] || 'final2-zoom-tile.png'];
await page.goto(`http://127.0.0.1:${port}/articles/other-half/figures/_grid-lab/lab.html?v=final2&steps=${stp}&layout=wide&bare=1`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__lab && window.__lab.ready);
const box = await page.evaluate(([bx, by, bs]) => {
  const svg = document.querySelector('.frame svg'), r = svg.getBoundingClientRect(), k = r.width / 720;
  return { x: r.left + bx * k, y: r.top + by * k, width: bs * k, height: bs * k };
}, [bx, by, bs]);
await page.screenshot({ path: join(HERE, 'png', name), clip: box });
await browser.close(); server.close();
