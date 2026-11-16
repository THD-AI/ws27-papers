// Builder: articles/<slug>/text.md -> dist/<slug>/index.html (+ dist/index.html)
//
//   node lib/build.mjs            builds every article that has a text.md
//   node lib/build.mjs renovate   builds one article (the index lists all built)
//
// The text format and the page it has to produce are described in SPEC.md.
// The builder only writes HTML; everything that moves is in lib/article.js.

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, cpSync, statSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Both can be redirected, which the tests use to build a scratch article.
const ARTICLES = process.env.ARTICLES_DIR || join(ROOT, 'articles');
const DIST = process.env.DIST_DIR || join(ROOT, 'dist');
const LIB = join(ROOT, 'lib');

const FONTS = 'https://fonts.googleapis.com/css2'
  + '?family=JetBrains+Mono:wght@400;500'
  + '&family=Libre+Franklin:ital,wght@0,400;0,500;0,600;1,400'
  + '&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600'
  + '&display=swap';

class BuildError extends Error {}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

// "2026-10-05" -> "5 October 2026", "2022-09" -> "September 2022", "2026" -> "2026"
function longDate(iso) {
  const m = String(iso || '').match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (!m) return '';
  const [, y, mo, d] = m;
  if (!mo) return y;
  return `${d ? `${Number(d)} ` : ''}${MONTHS[Number(mo) - 1]} ${y}`;
}

function host(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

// ---------------------------------------------------------------------------
// Markdown: markdown-it plus the three things the text format adds inline
// ---------------------------------------------------------------------------
function createMarkdown() {
  const md = new MarkdownIt({ html: false, typographer: true, quotes: '“”‘’' });

  // {{ID ID}} – the sources of the passage it closes.
  md.inline.ruler.before('emphasis', 'src', (state, silent) => {
    const { src, pos } = state;
    if (src.charCodeAt(pos) !== 0x7b || src.charCodeAt(pos + 1) !== 0x7b) return false;
    const end = src.indexOf('}}', pos + 2);
    if (end < 0) return false;
    if (!silent) {
      const token = state.push('src', '', 0);
      token.meta = { ids: src.slice(pos + 2, end).trim().split(/[\s,]+/).filter(Boolean) };
    }
    state.pos = end + 2;
    return true;
  });

  md.renderer.rules.src = (tokens, idx, _opts, env) => {
    const nums = [];
    for (const id of tokens[idx].meta.ids) {
      if (!env.sources[id]) { env.unknown.add(id); continue; }
      // Sources are numbered in the order in which the text first cites them.
      if (!env.cited.includes(id)) env.cited.push(id);
      const n = env.cited.indexOf(id) + 1;
      if (!nums.includes(n)) nums.push(n);
    }
    if (!nums.length) return '';
    const label = nums.length === 1 ? '1 source for this passage' : `${nums.length} sources for this passage`;
    // &#8288; (word joiner) keeps the mark on the line of the last word.
    return '&#8288;<span class="src">'
      + `<button type="button" class="src-mark" data-nums="${nums.join(' ')}" aria-haspopup="dialog" aria-expanded="false" aria-label="${label}">`
      + `<span class="src-ring" aria-hidden="true"></span><span class="src-count" aria-hidden="true">${nums.length}</span></button>`
      + `<span class="src-print">[${nums.join(', ')}]</span></span>`;
  };

  // Section headings: "## 3. Title" -> number in the accent, id "s-3".
  md.renderer.rules.heading_open = (tokens, idx, _opts, env) => {
    const tag = tokens[idx].tag;
    if (tag !== 'h2') return `<${tag}>`;
    const inline = tokens[idx + 1];
    const m = inline.content.match(/^(\d+)\.\s+(.*)$/);
    let num = '';
    let title = inline.content;
    if (m) {
      [, num, title] = m;
      const first = inline.children.find((c) => c.type === 'text');
      if (first) first.content = first.content.replace(/^\d+\.\s+/, '');
    }
    let id = num ? `s-${num}` : slugify(title);
    while (env.toc.some((t) => t.id === id)) id += '-2';
    env.toc.push({ id, num, title: md.renderInline(title, { ...env, toc: [] }) });
    return `<h2 id="${id}" class="sec"><span class="sec-num">${num}</span><span class="sec-title">`;
  };
  md.renderer.rules.heading_close = (tokens, idx) => (tokens[idx].tag === 'h2'
    ? '</span></h2>\n' : `</${tokens[idx].tag}>\n`);

  // Tables: numbers in mono and right-aligned, empty cells "·", and a frame
  // that scrolls sideways on its own when the table is wider than a phone.
  md.core.ruler.push('table_cells', (state) => {
    const tokens = state.tokens;
    let cols = 0;
    let open = null;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type === 'table_open') { open = t; cols = 0; }
      if (t.type === 'th_open') cols++;
      if (t.type === 'table_close' && open) { open.attrSet('class', `cols-${cols}`); open.meta = { cols }; }
      if (t.type !== 'td_open') continue;
      const inline = tokens[i + 1];
      const text = inline.content.trim();
      if (!text) {
        inline.content = '·';
        inline.children = [Object.assign(new state.Token('text', '', 0), { content: '·' })];
        t.attrJoin('class', 'empty');
      } else if (/^[+−–-]?[\d][\d.,  ]*(%|bn|m|k|x|×)?$/.test(text)) {
        t.attrJoin('class', 'num');
      }
    }
  });
  md.renderer.rules.table_open = (tokens, idx, opts, _env, self) => {
    const wide = (tokens[idx].meta?.cols || 0) > 3 ? ' table-wide' : '';
    return `<div class="table-frame${wide}"><table${self.renderAttrs(tokens[idx])}>\n`;
  };
  md.renderer.rules.table_close = () => '</table></div>\n';

  // Links in the text leave the page in a new tab.
  const linkOpen = md.renderer.rules.link_open
    || ((tokens, idx, opts, _env, self) => self.renderToken(tokens, idx, opts));
  md.renderer.rules.link_open = (tokens, idx, opts, env, self) => {
    if (/^https?:/.test(tokens[idx].attrGet('href') || '')) {
      tokens[idx].attrSet('target', '_blank');
      tokens[idx].attrSet('rel', 'noopener noreferrer');
    }
    return linkOpen(tokens, idx, opts, env, self);
  };

  return md;
}

const md = createMarkdown();

// Typographic quotes for strings that are not run through the block parser.
const inlineHtml = (s, env) => md.renderInline(String(s || ''), env || { sources: {}, cited: [], unknown: new Set(), toc: [] });
const plain = (s) => inlineHtml(s).replace(/<[^>]+>/g, '')
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// ---------------------------------------------------------------------------
// text.md -> front matter + blocks
// ---------------------------------------------------------------------------
function parseFrontMatter(src, file) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) throw new BuildError(`${file}: no front matter (--- … ---) at the top`);
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const i = line.indexOf(':');
    if (i < 0) throw new BuildError(`${file}: front matter line without "key: value": ${line}`);
    fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const key of ['title', 'deck', 'author', 'context', 'status', 'accent']) {
    if (!fm[key]) throw new BuildError(`${file}: front matter is missing "${key}"`);
  }
  return { fm, body: src.slice(m[0].length) };
}

function parseBlocks(body, file) {
  const lines = body.split(/\r?\n/);
  const blocks = [];
  let buf = [];
  const flush = () => {
    if (buf.join('').trim()) blocks.push({ type: 'md', src: buf.join('\n') });
    buf = [];
  };
  // Lines up to the closing ":::" of a block that starts on line i.
  const inner = (i, what) => {
    const out = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^:::\s*$/.test(lines[j])) return { out, end: j };
      if (/^:::/.test(lines[j])) break;
      out.push(lines[j]);
    }
    throw new BuildError(`${file}:${i + 1}: ${what} is not closed with ":::"`);
  };

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^:::\s*(\S*)\s*(.*)$/);
    if (!m) { buf.push(lines[i]); continue; }
    flush();
    const [, kind, rest] = m;
    const args = rest.trim().split(/\s+/).filter(Boolean);
    const at = `${file}:${i + 1}`;

    if (kind === 'margin') {
      if (args.length !== 2 || !/^\d+$/.test(args[1])) throw new BuildError(`${at}: expected ":::margin <id> <state>"`);
      blocks.push({ type: 'margin', id: args[0], state: Number(args[1]) });
    } else if (kind === 'figure') {
      if (args.length !== 2 || !['wide', 'column'].includes(args[1])) {
        throw new BuildError(`${at}: expected ":::figure <id> <wide|column>"`);
      }
      const { out, end } = inner(i, `:::figure ${args[0]}`);
      blocks.push({ type: 'figure', id: args[0], layout: args[1], caption: out.join(' ').trim() });
      i = end;
    } else if (kind === 'scene') {
      if (args.length !== 1) throw new BuildError(`${at}: expected ":::scene <id>"`);
      const { out, end } = inner(i, `:::scene ${args[0]}`);
      const scene = { type: 'scene', id: args[0], caption: '', steps: [] };
      let cur = null;
      let inCaption = false;
      for (const line of out) {
        const cap = line.match(/^@caption\s+(.*)$/);
        const step = line.match(/^@step\s+(\d+)\s*$/);
        if (cap) { scene.caption = cap[1]; inCaption = true; continue; }
        if (step) { cur = { step: Number(step[1]), lines: [] }; scene.steps.push(cur); inCaption = false; continue; }
        if (/^@/.test(line)) throw new BuildError(`${at}: unknown line in scene "${args[0]}": ${line}`);
        if (inCaption) { if (line.trim()) scene.caption += ` ${line.trim()}`; else inCaption = false; continue; }
        if (!cur) {
          if (!line.trim()) continue;
          // Text before the first @step belongs to step 0.
          cur = { step: 0, lines: [] }; scene.steps.push(cur);
        }
        cur.lines.push(line);
      }
      if (!scene.steps.length) throw new BuildError(`${at}: scene "${args[0]}" has no passages`);
      blocks.push(scene);
      i = end;
    } else {
      throw new BuildError(`${at}: unknown or stray block "${lines[i].trim()}"`);
    }
  }
  flush();
  return blocks;
}

// ---------------------------------------------------------------------------
// Blocks -> HTML
// ---------------------------------------------------------------------------
function renderArticle(slug) {
  const dir = join(ARTICLES, slug);
  const file = `articles/${slug}/text.md`;
  const { fm, body } = parseFrontMatter(readFileSync(join(dir, 'text.md'), 'utf8'), file);
  const blocks = parseBlocks(body, file);

  const sourcesFile = join(dir, 'sources.json');
  const sources = existsSync(sourcesFile) ? JSON.parse(readFileSync(sourcesFile, 'utf8')) : {};
  const env = { sources, cited: [], unknown: new Set(), toc: [] };
  // The tag hangs on the last word; the space before it is not content.
  const render = (src) => md.render(src.replace(/[ \t]+\{\{/g, '{{'), env);

  const has = (rel) => existsSync(join(dir, rel));
  const figures = {};      // id -> what exists on disk, for article.js
  const note = (id, extra = {}) => {
    figures[id] = { module: has(`figures/${id}.js`), data: has(`data/${id}.json`), ...figures[id], ...extra };
  };

  let figNo = 0;
  let marginId = null;
  const html = [];

  const frame = (id) => `<div class="fig-frame" data-frame="${esc(id)}"></div>`;

  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b];

    if (block.type === 'md') {
      html.push(render(block.src));
    } else if (block.type === 'margin') {
      marginId = marginId || block.id;
      note(block.id);
      // The marker is where the pinned margin figure changes state. The still
      // (phones and print) is set after the heading that follows the marker,
      // so that it opens its section instead of closing the one before.
      const marker = `<span class="margin-mark" data-margin="${esc(block.id)}" data-state="${block.state}"></span>\n`;
      const still = `<figure class="margin-still" data-fig="${esc(block.id)}" data-role="still" data-state="${block.state}" aria-hidden="true">${frame(block.id)}</figure>\n`;
      const next = blocks[b + 1];
      const head = next && next.type === 'md' && next.src.match(/^\s*(## .*)(\r?\n|$)/);
      if (head) {
        html.push(marker, render(head[1]), still);
        next.src = next.src.slice(head[0].length);
      } else {
        html.push(marker, still);
      }
    } else if (block.type === 'figure') {
      figNo++;
      note(block.id);
      html.push(
        `<figure class="fig fig-${block.layout}${block.layout === 'wide' ? ' breakout' : ''}" id="fig-${figNo}" data-fig="${esc(block.id)}" data-role="figure" data-layout="${block.layout}">`
        + frame(block.id)
        + `<figcaption><span class="fig-label">Figure ${figNo}</span> ${inlineHtml(block.caption, env)}</figcaption></figure>\n`,
      );
    } else if (block.type === 'scene') {
      figNo++;
      const steps = Math.max(...block.steps.map((s) => s.step)) + 1;
      note(block.id, { steps });
      const caption = `<span class="fig-label">Figure ${figNo}</span> ${inlineHtml(block.caption, env)}`;
      const passages = block.steps.map((s) => (
        // The still before each passage is shown only where nothing can be
        // pinned (windows too short, see article.css 2d): the scene then
        // reads as a sequence of stills and passages.
        `<figure class="fig seq-still" data-fig="${esc(block.id)}" data-role="seq" data-state="${s.step}" aria-hidden="true">${frame(block.id)}</figure>
`
        + `<div class="passage" data-step="${s.step}">\n${render(s.lines.join('\n'))}</div>\n`
      )).join('');
      html.push(
        `<section class="scene breakout" id="fig-${figNo}" data-scene="${esc(block.id)}">\n`
        + '<div class="scene-stage">'
        + `<figure class="fig fig-scene" data-fig="${esc(block.id)}" data-role="scene" data-steps="${steps}">`
        + frame(block.id)
        + (block.caption ? `<figcaption>${caption}</figcaption>` : '')
        + '</figure></div>\n'
        + `<div class="scene-text">\n${passages}</div>\n`
        // The same caption again for phones, where the pinned stage has no
        // room for it. Only one of the two is ever displayed.
        + (block.caption ? `<p class="scene-caption">${caption}</p>\n` : '')
        + '</section>\n',
      );
    }
  }

  if (env.unknown.size) {
    const list = [...env.unknown].join(', ');
    const hint = existsSync(sourcesFile)
      ? `They are not in articles/${slug}/sources.json.`
      : `articles/${slug}/sources.json does not exist; run "node tools/sources.mjs ${slug}".`;
    throw new BuildError(`${file}: unknown source ids: ${list}\n  ${hint}`);
  }

  // Sources: only the cited ones, in the order of first citation.
  const sourceItems = env.cited.map((id, i) => {
    const s = sources[id];
    const meta = [s.publisher, s.type, longDate(s.date)].filter(Boolean).map(esc);
    const h = host(s.url);
    return `<li id="src-${i + 1}" data-id="${esc(id)}"><span class="src-n">${i + 1}</span>`
      + `<span class="src-body"><a class="src-title" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`
      + `<span class="src-meta">${meta.join(' · ')}${h ? ` <span class="src-host">${esc(h)}</span>` : ''}</span></span></li>`;
  });
  const sourcesHtml = sourceItems.length
    ? `<section class="sources" id="sources" aria-labelledby="sources-h">\n<h2 id="sources-h" class="sec"><span class="sec-num"></span><span class="sec-title">Sources</span></h2>\n<ol class="src-list">\n${sourceItems.join('\n')}\n</ol>\n</section>\n`
    : '';
  if (sourceItems.length) env.toc.push({ id: 'sources', num: '', title: 'Sources' });

  // Hero: two stacked layers, shown only when both files are there.
  const heroBase = fm.hero || (has('art/house-line.png') ? 'house' : 'hero');
  const hero = has(`art/${heroBase}-line.png`) && has(`art/${heroBase}-field.png`) ? heroBase : null;

  // Kicker: front matter "kicker", or the first and last part of the context
  // with the semester shortened, as in the SPEC's example.
  const parts = fm.context.split('·').map((s) => s.trim());
  const kicker = fm.kicker || [parts[0], parts.length > 1 ? parts[parts.length - 1] : '']
    .filter(Boolean).join(' · ')
    .replace(/winter semester\s+/i, 'WS ').replace(/summer semester\s+/i, 'SS ');

  const title = plain(fm.title);
  const shortTitle = plain(fm.short || fm.title);
  const cssString = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const toc = env.toc.map((t) => (
    `<li><a href="#${t.id}"><span class="toc-num">${t.num}</span><span class="toc-title">${t.title}</span></a></li>`
  )).join('\n');

  const manifest = { slug, margin: marginId, figures };

  const page = `<!doctype html>
<html lang="en" data-slug="${esc(slug)}" data-accent="${esc(fm.accent)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#FBFBFC">
<link rel="icon" href="data:,">
<title>${esc(title)}</title>
<meta name="description" content="${esc(plain(fm.deck))}">
<meta name="author" content="${esc(fm.author)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="article.css">
<style>
/* Running footer of the printed paper: short title left, page number right. */
@page { @bottom-left { content: "${cssString(shortTitle)}"; } }
</style>
</head>
<body>
<a class="skip" href="#text">Skip to the text</a>

<header class="title-block${hero ? ' has-hero' : ''}">
<p class="kicker"><span>${esc(kicker)}</span></p>
${hero ? `<div class="hero" aria-hidden="true"><img class="hero-field" src="art/${esc(hero)}-field.png" alt=""><img class="hero-line" src="art/${esc(hero)}-line.png" alt=""></div>` : ''}
<div class="title-text">
<h1>${inlineHtml(fm.title)}</h1>
<p class="deck">${inlineHtml(fm.deck)}</p>
<p class="byline"><span class="author">${esc(fm.author)}</span> <span class="context">${esc(fm.context)}</span></p>
<p class="status">${esc(fm.status)}</p>
</div>
</header>

<nav class="toc" aria-label="Sections">
<ol>
${toc}
</ol>
</nav>

<main id="text" class="body">
${marginId ? `<aside class="rail" aria-hidden="true"><div class="rail-pin"><figure class="fig fig-margin" data-fig="${esc(marginId)}" data-role="margin">${frame(marginId)}</figure></div></aside>` : ''}
${html.join('')}
${sourcesHtml}
</main>

<footer class="colophon">
<p><span>${esc(fm.author)}</span> · <span>${esc(fm.status)}</span> · <a href="../index.html">All articles</a></p>
</footer>

<script type="application/json" id="article-data">${JSON.stringify(manifest).replace(/</g, '\\u003c')}</script>
<script type="module" src="article.js"></script>
</body>
</html>
`;

  return { slug, fm, page, cited: env.cited.length, figures, hero };
}

// ---------------------------------------------------------------------------
// Writing dist/
// ---------------------------------------------------------------------------
function copyIfThere(from, to) {
  if (!existsSync(from)) return false;
  cpSync(from, to, { recursive: true });
  return true;
}

function writeArticle(a) {
  const src = join(ARTICLES, a.slug);
  const out = join(DIST, a.slug);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  writeFileSync(join(out, 'index.html'), a.page);
  cpSync(join(LIB, 'article.css'), join(out, 'article.css'));
  cpSync(join(LIB, 'article.js'), join(out, 'article.js'));
  copyIfThere(join(LIB, 'fig.js'), join(out, 'fig.js'));
  for (const sub of ['data', 'art']) copyIfThere(join(src, sub), join(out, sub));
  copyIfThere(join(src, 'sources.json'), join(out, 'sources.json'));

  // Figure modules sit next to fig.js in dist (figures/x.js -> ../fig.js),
  // but three levels away from it in the repository. Whatever relative path
  // a module uses to reach fig.js, it is pointed at the copy in dist.
  const figs = join(src, 'figures');
  if (existsSync(figs)) {
    mkdirSync(join(out, 'figures'), { recursive: true });
    for (const name of readdirSync(figs)) {
      if (name.startsWith('_lab')) continue;   // the figure lab stays out of the site; _shared.js and the like are needed
      const from = join(figs, name);
      if (statSync(from).isDirectory()) { cpSync(from, join(out, 'figures', name), { recursive: true }); continue; }
      if (!name.endsWith('.js')) { cpSync(from, join(out, 'figures', name)); continue; }
      const code = readFileSync(from, 'utf8')
        .replace(/(from\s*|import\s*\(\s*|import\s+)(['"])(?:\.\.?\/)+(?:lib\/)?fig\.js\2/g, '$1$2../fig.js$2');
      writeFileSync(join(out, 'figures', name), code);
    }
  }
}

function writeIndex() {
  // The index lists what is built, read back from the articles' front matter.
  const entries = readdirSync(DIST, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(DIST, d.name, 'index.html'))
      && existsSync(join(ARTICLES, d.name, 'text.md')))
    .map((d) => ({
      slug: d.name,
      fm: parseFrontMatter(readFileSync(join(ARTICLES, d.name, 'text.md'), 'utf8'), d.name).fm,
    }));
  if (!entries.length) return;

  const items = entries.map(({ slug, fm }) => `<li data-accent="${esc(fm.accent)}">
<a href="${esc(slug)}/index.html"><span class="index-title">${inlineHtml(fm.title)}</span></a>
<p class="index-deck">${inlineHtml(fm.deck)}</p>
<p class="index-meta"><span>${esc(fm.author)} · ${esc(fm.context)}</span><span class="status">${esc(fm.status)}</span></p>
</li>`).join('\n');

  const page = `<!doctype html>
<html lang="en" data-accent="${esc(entries[0].fm.accent)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#FBFBFC">
<link rel="icon" href="data:,">
<title>Articles</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="article.css">
</head>
<body class="index">
<header class="title-block">
<p class="kicker"><span>Articles · drafts for review</span></p>
</header>
<main class="body">
<ol class="index-list">
${items}
</ol>
</main>
</body>
</html>
`;
  writeFileSync(join(DIST, 'index.html'), page);
  cpSync(join(LIB, 'article.css'), join(DIST, 'article.css'));
}

// ---------------------------------------------------------------------------
function main() {
  const only = process.argv[2];
  const slugs = only ? [only] : readdirSync(ARTICLES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(ARTICLES, d.name, 'text.md')))
    .map((d) => d.name);
  if (only && !existsSync(join(ARTICLES, only, 'text.md'))) {
    throw new BuildError(`articles/${only}/text.md does not exist`);
  }
  if (!slugs.length) throw new BuildError('no article with a text.md found in articles/');

  mkdirSync(DIST, { recursive: true });
  for (const slug of slugs) {
    const a = renderArticle(slug);
    writeArticle(a);
    const ids = Object.keys(a.figures);
    const missing = ids.filter((id) => !a.figures[id].module);
    console.log(`built dist/${slug}/index.html – ${a.cited} sources cited, ${ids.length} figures`
      + (missing.length ? ` (no module yet: ${missing.join(', ')})` : '')
      + (a.hero ? `, hero art "${a.hero}"` : ', no hero art'));
  }
  writeIndex();
  console.log('built dist/index.html');
}

try {
  main();
} catch (err) {
  if (err instanceof BuildError) {
    console.error(`build failed: ${err.message}`);
    process.exit(1);
  }
  throw err;
}
