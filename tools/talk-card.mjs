// The link preview of the two talk pages: a 1200 x 630 card made from each
// talk's own title page, and the Open Graph and Twitter tags that point to it.
// Run after deck-offline.mjs and qtalk-site.mjs have written dist/*/talk/.
//   node tools/talk-card.mjs
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SITE = (process.env.SITE_URL || 'https://thd-ai.github.io/ws27-papers/').replace(/\/?$/, '/');

const TALKS = [
  { dir: 'other-half', title: 'The other half of a quantum computer: the talk',
    description: 'The 15-minute talk of the article: how an ordinary computer reads a quantum chip’s errors, and why it has to keep up. Quantum Computing seminar, TH Deggendorf, 9 January 2027.',
    alt: 'The talk’s title page: The other half of a quantum computer, above a line drawing of a quantum computer’s cooling stack with a film strip of frames running out of it.' },
  { dir: 'renovate', title: 'Renovate, don’t repaint: the talk',
    description: 'The talk of the article: why Deutsche Telekom can’t bolt T-Mobile’s AI agents onto Germany, and what to rebuild first. Innovation Management for AI, TH Deggendorf, 12 December 2026.',
    alt: 'The talk’s title page: Renovate, don’t repaint, beside a line drawing of a plug in front of a brick wall.' },
];
const e = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
// the whole title page fits the card's height (1120 x 630), on the page's own white
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
for (const t of TALKS) {
  const file = join(ROOT, 'dist', t.dir, 'talk', 'index.html');
  await page.goto(pathToFileURL(file).href + '?audience#1', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html, body { background: #FBFBFC !important; } #help, #notes { display: none !important; }' });
  await new Promise((r) => setTimeout(r, 600));
  const shot = await page.screenshot({ type: 'png' });
  // back to 1200 x 630 for the card
  const small = await browser.newPage();
  await small.setViewport({ width: 1200, height: 630 });
  await small.setContent(`<body style="margin:0"><img src="data:image/png;base64,${Buffer.from(shot).toString('base64')}" style="width:1200px;height:630px;display:block"></body>`);
  await small.screenshot({ path: join(ROOT, 'dist', t.dir, 'talk', 'card.png') });
  await small.close();
  const url = `${SITE}${t.dir}/talk/`, img = `${url}card.png`;
  const tags = [
    `<meta name="description" content="${e(t.description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Alexander Rudaev">`,
    `<meta property="og:locale" content="en_GB">`,
    `<meta property="og:title" content="${e(t.title)}">`,
    `<meta property="og:description" content="${e(t.description)}">`,
    `<meta property="og:url" content="${e(url)}">`,
    `<meta property="og:image" content="${e(img)}">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${e(t.alt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${e(t.title)}">`,
    `<meta name="twitter:description" content="${e(t.description)}">`,
    `<meta name="twitter:image" content="${e(img)}">`,
    `<meta name="twitter:image:alt" content="${e(t.alt)}">`,
  ].join('\n');
  let html = readFileSync(file, 'utf8').replace(/<!-- talk-card -->[\s\S]*?<!-- \/talk-card -->\n?/, '');
  html = html.replace(/(<title>[^<]*<\/title>\n?)/, `$1<!-- talk-card -->\n${tags}\n<!-- /talk-card -->\n`);
  writeFileSync(file, html);
  console.log('card and tags ->', t.dir + '/talk/');
}
await browser.close();
