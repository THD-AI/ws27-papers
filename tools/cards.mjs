// Social preview cards and site icons.
//
//   node tools/cards.mjs
//
// For each article, renders a 1200 x 630 card from the article's own
// material (Renovate: the finished walls figure; the other half: its hero
// drawing) with the title and byline, and writes it to
// articles/<slug>/art/card.png, which the build copies and links in the
// og:image and twitter:image tags. Also writes lib/site/favicon.svg and
// lib/site/apple-touch-icon.png, copied to the site root by the build.

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const ROOT = resolve('.');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FONTS = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Libre+Franklin:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400..500&display=swap';

const frontMatter = (slug) => {
  const s = readFileSync(join(ROOT, 'articles', slug, 'text.md'), 'utf8');
  const fm = {};
  for (const line of s.slice(4, s.indexOf('\n---', 4)).split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return fm;
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const curly = (s) => String(s).replace(/'/g, '\u2019');

const ARTICLES = {
  renovate: { accent: '#1F7A54', field: '#CDE9D9', art: { lab: 'fig=walls&layout=wide&step=2&t=1&bare=1&w=1100' } },
  'other-half': { accent: '#4254C5', field: '#C9D3F7', art: { hero: 'articles/other-half/art/hero' } },
};

const { server, port } = await startServer(ROOT, 0);
const base = `http://localhost:${port}`;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });

async function labImage(query) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 900, deviceScaleFactor: 2 });
  await page.goto(`${base}/articles/renovate/figures/_lab.html?${query}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__lab && window.__lab.ready', { timeout: 20000 });
  const el = await page.$('#lab svg') || await page.$('#lab');
  const png = await el.screenshot({ omitBackground: false });
  await page.close();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}
const dataUrl = (file) => `data:image/png;base64,${readFileSync(join(ROOT, file)).toString('base64')}`;

function cardHtml({ fm, accent, field, img, hero }) {
  const kicker = esc(String(fm.context || '').split('·')[0].trim());
  const pic = hero
    ? `<div class="pic hero"><img src="${hero.field}" alt=""><img src="${hero.line}" alt=""></div>`
    : `<div class="pic"><img src="${img}" alt=""></div>`;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS}">
<style>
  html, body { margin: 0; }
  body { width: 1200px; height: 630px; background: #FBFBFC; color: #15171C; overflow: hidden; position: relative; font-family: 'Libre Franklin', sans-serif; }
  .bar { position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: ${accent}; }
  .kicker { position: absolute; left: 64px; top: 52px; font: 500 17px/1 'JetBrains Mono', monospace; letter-spacing: 0.09em; text-transform: uppercase; color: ${accent}; }
  h1 { position: absolute; left: 62px; top: 92px; width: ${hero ? 520 : 1080}px; margin: 0; font: 500 ${hero ? 64 : 70}px/1.04 'Newsreader', serif; letter-spacing: -0.015em; }
  .by { position: absolute; left: 64px; bottom: 50px; width: ${hero ? 520 : 1080}px; font: 400 21px/1.3 'Libre Franklin', sans-serif; color: #4A4F5A; }
  .by b { font-weight: 600; color: #15171C; }
  .pic { position: absolute; ${hero ? 'right: 0; top: 0; width: 580px; height: 630px;' : 'left: 50px; right: 50px; top: 190px; bottom: 104px;'} display: flex; align-items: center; justify-content: center; }
  .pic img { max-width: 100%; max-height: 100%; }
  .pic.hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 62% 50%; mix-blend-mode: multiply; }
</style></head><body>
<div class="bar"></div>
<p class="kicker">${kicker}</p>
<h1>${esc(curly(fm.title))}</h1>
${pic}
<p class="by"><b>${esc(fm.author)}</b> · TH Deggendorf · winter semester 2026/27</p>
</body></html>`;
}

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
for (const [slug, a] of Object.entries(ARTICLES)) {
  const fm = frontMatter(slug);
  const html = cardHtml({
    fm, accent: a.accent, field: a.field,
    img: a.art.lab ? await labImage(a.art.lab) : null,
    hero: a.art.hero ? { field: dataUrl(`${a.art.hero}-field.png`), line: dataUrl(`${a.art.hero}-line.png`) } : null,
  });
  await page.setContent(html, { waitUntil: 'load', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 800));
  await page.evaluate(() => document.fonts.ready);
  const out = join(ROOT, 'articles', slug, 'art', 'card.png');
  await page.screenshot({ path: out, type: 'png' });
  console.log(`card: ${out}`);
}

// Site icon: a cable that turns the corner, in the green of the first article.
mkdirSync(join(ROOT, 'lib', 'site'), { recursive: true });
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="12" fill="#FBFBFC"/>
<rect x="5" y="5" width="54" height="54" rx="8" fill="none" stroke="#15171C" stroke-width="4"/>
<path d="M44 5 V20 H20 V46" fill="none" stroke="#1F7A54" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="13" y="44" width="14" height="12" rx="2" fill="#FBFBFC" stroke="#15171C" stroke-width="3.5"/>
</svg>
`;
writeFileSync(join(ROOT, 'lib', 'site', 'favicon.svg'), icon);
await page.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 });
await page.setContent(`<html><body style="margin:0">${icon.replace('<svg ', '<svg width="180" height="180" ')}</body></html>`);
await page.screenshot({ path: join(ROOT, 'lib', 'site', 'apple-touch-icon.png'), clip: { x: 0, y: 0, width: 180, height: 180 } });
console.log('icons: lib/site/favicon.svg, lib/site/apple-touch-icon.png');

await browser.close();
server.close();
