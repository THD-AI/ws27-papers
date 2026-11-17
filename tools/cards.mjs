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
// Also writes lib/site/card.png, a two-up card for the article list, and
// lib/site/favicon.svg and lib/site/apple-touch-icon.png, copied to the site
// root by the build.
//
// Every card is checked at feed size (about 550 px wide): all text is 26 px
// or more. The layouts favour the full 1.91:1 feed card; apps that crop to a
// centre square show only part of each title.

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

// Renovate: title and the case on the left, the wall and the number on the right.
function renovateHtml({ fm, wall, num }) {
  return shell(`
  .bar { background: ${GREEN}; }
  h1 { position: absolute; left: 64px; top: 50px; width: 600px; font: 500 92px/0.98 'Newsreader', serif; letter-spacing: -0.02em; }
  .case { position: absolute; left: 66px; top: 260px; width: 560px; font: 500 33px/1.22 'Libre Franklin', sans-serif; color: ${INK}; }
  .by { position: absolute; left: 66px; bottom: 44px; width: 560px; }
  .field { position: absolute; left: 676px; top: 0; right: 0; bottom: 0; background: ${GREEN_FIELD}; }
  .wall { left: 708px; top: 34px; }
  .num { position: absolute; left: 712px; top: 398px; width: 470px; }
  .num .big { font: 500 96px/1 'Newsreader', serif; color: ${GREEN}; letter-spacing: -0.02em; white-space: nowrap; }
  .num .big span { font-size: 56px; color: ${INK}; }
  .num .lab { margin-top: 10px; font: 500 30px/1.18 'Libre Franklin', sans-serif; color: ${INK}; }
  .num .src { margin-top: 10px; font: 400 26px/1 'JetBrains Mono', monospace; color: ${MUTED}; }
  .nw { white-space: nowrap; }
`, `<div class="bar"></div>
<div class="field"></div>
${wallCrop(wall, 1.2)}
<h1>${esc(curly(fm.title))}</h1>
<p class="case">Why Deutsche Telekom can\u2019t bolt <span class="nw">T-Mobile\u2019s</span> AI agents onto Germany</p>
<div class="num"><p class="big">${num.value} <span>of ${num.total}</span></p>
<p class="lab">contacts at <span class="nw">T-Mobile</span> start with an AI agent</p>
<p class="src">company figure, Q2 2026</p></div>
<p class="by"><b>${esc(fm.author)}</b> · TH Deggendorf<br>winter semester 2026/27</p>`);
}

// The other half: title and byline on the left, the hero drawing on the right.
function otherHalfHtml({ fm, hero }) {
  const kicker = esc(String(fm.context || '').split('·')[0].trim());
  return shell(`
  .bar { background: ${BLUE}; }
  .kicker { position: absolute; left: 64px; top: 52px; font: 500 26px/1 'JetBrains Mono', monospace; letter-spacing: 0.06em; text-transform: uppercase; color: ${BLUE}; }
  h1 { position: absolute; left: 62px; top: 112px; width: 560px; font: 500 76px/1.02 'Newsreader', serif; letter-spacing: -0.02em; }
  .by { position: absolute; left: 64px; bottom: 50px; width: 560px; }
  .pic { position: absolute; left: 560px; top: 150px; width: 660px; height: 440px; }
  .pic img { position: absolute; inset: 0; width: 100%; height: 100%; mix-blend-mode: multiply; }
`, `<div class="bar"></div>
<p class="kicker">${kicker}</p>
<h1>${esc(curly(fm.title))}</h1>
<div class="pic"><img src="${hero.field}" alt=""><img src="${hero.line}" alt=""></div>
<p class="by"><b>${esc(fm.author)}</b><br>TH Deggendorf · winter semester 2026/27</p>`);
}

// Index: the two articles side by side, each title over its own drawing.
function indexHtml({ a, b, wall, hero }) {
  return shell(`
  .half { position: absolute; top: 0; bottom: 0; width: 600px; overflow: hidden; }
  .half.l { left: 0; background: ${GREEN_FIELD}; }
  .half.r { left: 600px; background: ${BLUE_FIELD}; }
  .half h2 { position: absolute; left: 48px; top: 40px; width: 520px; font: 500 60px/1.0 'Newsreader', serif; letter-spacing: -0.02em; }
  .half .k { position: absolute; left: 50px; bottom: 34px; font: 500 26px/1 'JetBrains Mono', monospace; letter-spacing: 0.04em; text-transform: uppercase; }
  .l .k { color: ${GREEN}; } .r .k { color: ${BLUE}; }
  .wall { left: 64px; top: 196px; }
  .r .pic { position: absolute; left: 30px; top: 200px; width: 540px; height: 360px; }
  .r .pic img { position: absolute; inset: 0; width: 100%; height: 100%; mix-blend-mode: multiply; }
  .r .pic img.f { opacity: 0; }
  .rule { position: absolute; left: 599px; top: 0; bottom: 0; width: 2px; background: ${INK}; }
`, `<div class="half l">
  ${wallCrop(wall, 1.24)}
  <h2>${esc(curly(a.title))}</h2>
  <p class="k">AI agents at Telekom</p>
</div>
<div class="half r">
  <div class="pic"><img class="f" src="${hero.field}" alt=""><img src="${hero.line}" alt=""></div>
  <h2>${esc(curly(b.title))}</h2>
  <p class="k">Quantum decoders</p>
</div>
<div class="rule"></div>`);
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
console.log('icons: lib/site/favicon.svg, lib/site/apple-touch-icon.png');

await browser.close();
server.close();
