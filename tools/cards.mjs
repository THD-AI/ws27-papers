// Social preview cards and site icons.
//
//   node tools/cards.mjs
//
// For each article, renders a 1200 x 630 card from the article's own
// material and writes it to articles/<slug>/art/card.png, which the build
// copies and links in the og:image and twitter:image tags:
//   Renovate: the "cut in and plastered" wall from the walls figure (rendered
//     by the lab page, cropped here with CSS), the case in plain words and one
//     sourced number from data/numbers.json.
//   The other half: its hero drawing beside the title.
// Also writes lib/site/card.png, the card for the article list, and
// lib/site/favicon.svg, lib/site/favicon-48.png and
// lib/site/apple-touch-icon.png, copied to the site root by the build.
//
// Every card is checked at feed size (about 500 px wide), as a centre
// 630 x 630 square and with the bottom-left corner covered as X does.

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

const INK = '#15171C', MUTED = '#4A4F5A', PAPER = '#FBFBFC';
const GREEN = '#1F7A54', GREEN_FIELD = '#CDE9D9';
const BLUE = '#4254C5', BLUE_FIELD = '#C9D3F7';

// The walls figure at step 2 renders 1100 CSS px wide. The third panel ("cut
// in and plastered") sits at about x 740-1090, y 125-385 of that render: the
// wall, the green channel and the brick, without the small labels.
const WALLS = { query: 'fig=walls&layout=wide&step=2&t=1&bare=1&w=1100', width: 1100, crop: { x: 740, y: 125, w: 350, h: 258 } };

const { server, port } = await startServer(ROOT, 0);
const base = `http://localhost:${port}`;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });

async function labImage(query) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 900, deviceScaleFactor: 3 });
  await page.goto(`${base}/articles/renovate/figures/_lab.html?${query}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__lab && window.__lab.ready', { timeout: 20000 });
  const el = await page.$('#lab svg') || await page.$('#lab');
  const png = await el.screenshot({ omitBackground: false });
  await page.close();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}
const dataUrl = (file) => `data:image/png;base64,${readFileSync(join(ROOT, file)).toString('base64')}`;

// A window onto the walls render: shows the crop box at `scale`.
// It sits on a paper plate, the figure's own background, so the green
// channel keeps its plaster against the card's coloured field.
const wallCrop = (img, scale, cls = 'wall') => {
  const { width, crop } = WALLS;
  return `<div class="${cls}" style="position:absolute;padding:16px 18px 18px;background:${PAPER}">
  <div style="width:${crop.w * scale}px;height:${crop.h * scale}px;overflow:hidden;position:relative">
  <img src="${img}" alt="" style="position:absolute;width:${width * scale}px;left:${-crop.x * scale}px;top:${-crop.y * scale}px">
  </div>
</div>`;
};

const shell = (css, body) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS}">
<style>
  html, body { margin: 0; }
  body { width: 1200px; height: 630px; background: ${PAPER}; color: ${INK}; overflow: hidden; position: relative; font-family: 'Libre Franklin', sans-serif; }
  p, h1, h2 { margin: 0; }
  .bar { position: absolute; left: 0; top: 0; bottom: 0; width: 10px; }
  .by { font: 400 26px/1.25 'Libre Franklin', sans-serif; color: ${MUTED}; }
  .by b { font-weight: 600; color: ${INK}; }
${css}
</style></head><body>
${body}
</body></html>`;

// Layout rules, from the social audit:
//   - no text below 34 px on the 1200 px canvas (about 14 px at feed size);
//   - the bottom 90 px of the left third stays empty, because X lays the
//     domain over that corner;
//   - the centre 630 x 630 square (WhatsApp, some mobile views) holds the key
//     part of the drawing; the title may run past it.

// Renovate: title, case and byline on the left; on the green field, the wall
// with its socket and corner just right of centre, and the number below it.
function renovateHtml({ fm, wall, num }) {
  return shell(`
  .bar { background: ${GREEN}; }
  h1 { position: absolute; left: 64px; top: 48px; width: 520px; font: 500 88px/0.98 'Newsreader', serif; letter-spacing: -0.02em; }
  .case { position: absolute; left: 66px; top: 252px; width: 480px; font: 500 36px/1.2 'Libre Franklin', sans-serif; color: ${INK}; }
  .by { position: absolute; left: 66px; top: 470px; width: 480px; font-size: 34px; }
  .field { position: absolute; left: 576px; top: 0; right: 0; bottom: 0; background: ${GREEN_FIELD}; }
  .wall { left: 600px; top: 26px; }
  .num { position: absolute; left: 606px; top: 334px; width: 572px; }
  .num .big { font: 500 88px/1 'Newsreader', serif; color: ${GREEN}; letter-spacing: -0.02em; white-space: nowrap; }
  .num .big span { font-size: 52px; color: ${INK}; }
  .num .lab { margin-top: 8px; font: 500 34px/1.16 'Libre Franklin', sans-serif; color: ${INK}; text-wrap: balance; }
  .num .src { margin-top: 10px; font: 400 34px/1 'JetBrains Mono', monospace; color: ${MUTED}; letter-spacing: -0.02em; }
  .nw { white-space: nowrap; }
`, `<div class="bar"></div>
<div class="field"></div>
${wallCrop(wall, 1.0)}
<h1>${esc(curly(fm.title))}</h1>
<p class="case">Why Deutsche Telekom can’t bolt <span class="nw">T-Mobile’s</span> AI agents onto Germany</p>
<p class="by"><b>${esc(fm.author)}</b></p>
<div class="num"><p class="big">${num.value} <span>of ${num.total}</span></p>
<p class="lab">contract customers’ contacts at <span class="nw">T-Mobile</span> were served by an AI agent</p>
<p class="src">company figure, Q2 2026</p></div>`);
}

// The other half: kicker, title and byline on the left; the hero drawing with
// the cryostat just right of centre.
function otherHalfHtml({ fm, hero }) {
  const kicker = esc(String(fm.context || '').split('·')[0].trim());
  return shell(`
  .bar { background: ${BLUE}; }
  .kicker { position: absolute; left: 64px; top: 50px; font: 500 34px/1 'JetBrains Mono', monospace; letter-spacing: 0.02em; text-transform: uppercase; color: ${BLUE}; }
  h1 { position: absolute; left: 62px; top: 112px; width: 500px; font: 500 70px/1.02 'Newsreader', serif; letter-spacing: -0.02em; }
  .by { position: absolute; left: 64px; top: 450px; font-size: 34px; white-space: nowrap; }
  .pic { position: absolute; left: 488px; top: 176px; width: 630px; height: 420px; }
  .pic img { position: absolute; inset: 0; width: 100%; height: 100%; mix-blend-mode: multiply; }
`, `<div class="bar"></div>
<p class="kicker">${kicker}</p>
<h1>${esc(curly(fm.title))}</h1>
<div class="pic"><img src="${hero.field}" alt=""><img src="${hero.line}" alt=""></div>
<p class="by"><b>${esc(fm.author)}</b></p>`);
}

// Index: the two titles stacked in the centre over both drawings side by
// side, so the centre square reads as one picture. The coloured wings at
// the sides carry each article's subject in the wide feed card.
function indexHtml({ a, b, wall, hero }) {
  return shell(`
  .wing { position: absolute; top: 0; bottom: 0; width: 236px; }
  .wing.l { left: 0; background: ${GREEN_FIELD}; }
  .wing.r { right: 0; background: ${BLUE_FIELD}; }
  .wing .k { position: absolute; top: 250px; font: 500 34px/1.2 'JetBrains Mono', monospace; letter-spacing: -0.01em; text-transform: uppercase; }
  .wing.l .k { left: 28px; color: ${GREEN}; }
  .wing.r .k { right: 28px; text-align: right; color: ${BLUE}; }
  .titles { position: absolute; left: 270px; width: 660px; top: 40px; text-align: center; }
  .titles h2 { font: 500 57px/1.0 'Newsreader', serif; letter-spacing: -0.02em; }
  .titles h2 + h2 { margin-top: 18px; }
  .titles h2 i { font-style: normal; display: inline-block; width: 22px; height: 22px; margin-right: 14px; vertical-align: 6px; }
  .plate { position: absolute; left: 264px; top: 292px; width: 672px; height: 270px; }
  .plate .wall { left: 0; top: 0; }
  .plate .pic { position: absolute; left: 332px; top: 18px; width: 345px; height: 230px; }
  .plate .pic img { position: absolute; inset: 0; width: 100%; height: 100%; mix-blend-mode: multiply; }
  .plate .pic img.f { opacity: 0.55; }
`, `<div class="wing l"><p class="k">AI agents<br>at Telekom</p></div>
<div class="wing r"><p class="k">Quantum<br>decoders</p></div>
<div class="titles">
  <h2><i style="background:${GREEN}"></i>${esc(curly(a.title))}</h2>
  <h2><i style="background:${BLUE}"></i>${esc(curly(b.title))}</h2>
</div>
<div class="plate">
  ${wallCrop(wall, 0.86)}
  <div class="pic"><img class="f" src="${hero.field}" alt=""><img src="${hero.line}" alt=""></div>
</div>`);
}

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
async function shoot(html, out) {
  await page.setContent(html, { waitUntil: 'load', timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: out, type: 'png' });
  console.log(`card: ${out}`);
}

const wall = await labImage(WALLS.query);
const hero = { field: dataUrl('articles/other-half/art/hero-field.png'), line: dataUrl('articles/other-half/art/hero-line.png') };
const plate = JSON.parse(readFileSync(join(ROOT, 'articles', 'renovate', 'data', 'numbers.json'), 'utf8')).plateA;
const num = { value: plate.slide.value, total: plate.total.value };
const fmR = frontMatter('renovate'), fmO = frontMatter('other-half');

await shoot(renovateHtml({ fm: fmR, wall, num }), join(ROOT, 'articles', 'renovate', 'art', 'card.png'));
await shoot(otherHalfHtml({ fm: fmO, hero }), join(ROOT, 'articles', 'other-half', 'art', 'card.png'));
mkdirSync(join(ROOT, 'lib', 'site'), { recursive: true });
await shoot(indexHtml({ a: fmR, b: fmO, wall, hero }), join(ROOT, 'lib', 'site', 'card.png'));

// Site icon: a cable that turns the corner, in the green of the first article.
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
await page.setViewport({ width: 48, height: 48, deviceScaleFactor: 1 });
await page.setContent(`<html><body style="margin:0;background:transparent">${icon.replace('<svg ', '<svg width="48" height="48" ')}</body></html>`);
await page.screenshot({ path: join(ROOT, 'lib', 'site', 'favicon-48.png'), clip: { x: 0, y: 0, width: 48, height: 48 }, omitBackground: true });
console.log('icons: lib/site/favicon.svg, lib/site/apple-touch-icon.png, lib/site/favicon-48.png');

await browser.close();
server.close();
