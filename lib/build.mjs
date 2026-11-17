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
  + '?family=JetBrains+Mono:wght@400;500;600'
  + '&family=Libre+Franklin:ital,wght@0,400;0,500;0,600;1,400'
  + '&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600'
  + '&display=swap';

// Where the pages are published. Canonical links, social cards and the
// sitemap use it; override with SITE_URL for another host.
const SITE = (process.env.SITE_URL || 'https://thd-ai.github.io/ws27-papers/').replace(/\/?$/, '/');

// Head tags for search and social previews. A page is kept out of search
// engines while its front matter says "draft: true" (the default while the
// status line starts with "Draft"); everything else is in place for the day
// it is published.
function headMeta({ title, docTitle, description, url, image, imageAlt, author, date, modified, draft, type = 'article', jsonld, root = '../' }) {
  const e = (v) => esc(String(v ?? ''));
  const tags = [
    `<meta name="robots" content="${draft ? 'noindex' : 'index, follow, max-image-preview:large'}">`,
    `<title>${e(docTitle || title)}</title>`,
    `<meta name="description" content="${e(description)}">`,
    author ? `<meta name="author" content="${e(author)}">` : '',
    `<link rel="canonical" href="${e(url)}">`,
    `<meta property="og:type" content="${e(type)}">`,
    `<meta property="og:site_name" content="WS27 papers · TH Deggendorf">`,
    `<meta property="og:locale" content="en_GB">`,
    `<meta property="og:title" content="${e(title)}">`,
    `<meta property="og:description" content="${e(description)}">`,
    `<meta property="og:url" content="${e(url)}">`,
    image ? `<meta property="og:image" content="${e(image)}">` : '',
    image ? `<meta property="og:image:type" content="image/png">` : '',
    image ? `<meta property="og:image:width" content="1200">` : '',
    image ? `<meta property="og:image:height" content="630">` : '',
    image ? `<meta property="og:image:alt" content="${e(imageAlt)}">` : '',
    date && type === 'article' ? `<meta property="article:published_time" content="${e(date)}">` : '',
    modified && type === 'article' ? `<meta property="article:modified_time" content="${e(modified)}">` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${e(title)}">`,
    `<meta name="twitter:description" content="${e(description)}">`,
    image ? `<meta name="twitter:image" content="${e(image)}">` : '',
    image ? `<meta name="twitter:image:alt" content="${e(imageAlt)}">` : '',
    `<link rel="icon" href="${e(root)}favicon.svg" type="image/svg+xml">`,
    `<link rel="icon" href="${e(root)}favicon-48.png" type="image/png" sizes="48x48">`,
    `<link rel="apple-touch-icon" href="${e(root)}apple-touch-icon.png">`,
    jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : '',
  ];
  return tags.filter(Boolean).join('\n');
}

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

// The language of a source's title: its "lang" field if there is one, else
// German when the title has umlauts or ß, or two different common German words.
const GERMAN = /\b(der|die|das|und|für|fuer|mit|von|zur|zum|nicht|eine?|einer|des|dem|den|auf|über|ueber|bei|im|oder|wird|sind|unser|um)\b/gi;
function langOf(s) {
  if (s.lang) return /^en\b/i.test(s.lang) ? '' : s.lang;
  const t = String(s.title || '');
  if (/[äöüÄÖÜß]/.test(t)) return 'de';
  return new Set((t.match(GERMAN) || []).map((w) => w.toLowerCase())).size >= 2 ? 'de' : '';
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
      if (t.type === 'th_open') { cols++; t.attrSet('scope', 'col'); }
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
    // "@where <label>": the place the text is about from here on.
    const place = lines[i].match(/^@where\s+(.+?)\s*$/);
    if (place) { flush(); blocks.push({ type: 'where', label: place[1] }); continue; }
    const m = lines[i].match(/^:::\s*(\S*)\s*(.*)$/);
    if (!m) { buf.push(lines[i]); continue; }
    flush();
    const [, kind, rest] = m;
    const args = rest.trim().split(/\s+/).filter(Boolean);
    const at = `${file}:${i + 1}`;

    if (kind === 'margin') {
      if (args.length !== 2 || !/^(\d+|end)$/.test(args[1])) throw new BuildError(`${at}: expected ":::margin <id> <state|end>"`);
      if (args[1] === 'end') blocks.push({ type: 'margin-end', id: args[0] });
      else blocks.push({ type: 'margin', id: args[0], state: Number(args[1]) });
    } else if (kind === 'figure') {
      if (args.length !== 2 || !['wide', 'column'].includes(args[1])) {
        throw new BuildError(`${at}: expected ":::figure <id> <wide|column>"`);
      }
      const { out, end } = inner(i, `:::figure ${args[0]}`);
      blocks.push({ type: 'figure', id: args[0], layout: args[1], caption: out.join(' ').trim() });
      i = end;
    } else if (kind === 'steps') {
      // A numbered list drawn as a path of steps (see .steps in article.css).
      const { out, end } = inner(i, ':::steps');
      blocks.push({ type: 'steps', src: out.join('\n') });
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
        const where = line.match(/^@where\s+(.+?)\s*$/);
        if (where) {
          // Before the first passage it is the place the scene opens in;
          // after "@step" it is the place of that passage and those after it.
          if (cur && !cur.lines.join('').trim()) cur.where = where[1]; else if (!cur) scene.where = where[1];
          else { cur = { step: cur.step, lines: [], where: where[1] }; scene.steps.push(cur); }
          inCaption = false;
          continue;
        }
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

  // A scene's figure may name the steps worth a still where the scene reads
  // as a sequence (export const stills = [2, 4]). Read from the module's
  // source, so that the builder never runs figure code.
  const stillsOf = (id) => {
    if (!has(`figures/${id}.js`)) return null;
    const m = readFileSync(join(dir, 'figures', `${id}.js`), 'utf8').match(/export\s+const\s+stills\s*=\s*\[([\d\s,]*)\]/);
    return m ? m[1].split(',').map((x) => x.trim()).filter(Boolean).map(Number) : null;
  };

  let figNo = 0;
  let marginId = null;
  // The current place (@where). It holds until the next @where or "##" heading.
  let where = '';
  const whereLine = (label) => `<p class="where"><span>${inlineHtml(label, env)}</span></p>\n`;
  const html = [];

  const frame = (id) => `<div class="fig-frame" data-frame="${esc(id)}"></div>`;

  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b];

    if (block.type === 'where') {
      where = block.label;
      html.push(whereLine(where));
    } else if (block.type === 'md') {
      if (/^## /m.test(block.src)) where = '';
      html.push(render(block.src));
    } else if (block.type === 'steps') {
      html.push(`<div class="steps">\n${render(block.src)}</div>\n`);
    } else if (block.type === 'margin-end') {
      // Where the story of the margin figure ends: on screen the pinned
      // figure fades out as this point reaches it and does not come back.
      // Nothing is drawn here, on screen or on paper.
      html.push(`<span class="margin-mark margin-end" data-margin="${esc(block.id)}"></span>\n`);
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
        where = '';
        html.push(marker, render(head[1]), still);
        next.src = next.src.slice(head[0].length);
      } else {
        html.push(marker, still);
      }
    } else if (block.type === 'figure') {
      figNo++;
      note(block.id);
      html.push(
        `<figure class="fig fig-${block.layout}${block.layout === 'wide' ? ' breakout' : ''}" id="fig-${figNo}" data-fig="${esc(block.id)}" data-role="figure" data-layout="${block.layout}" data-where="${esc(plain(where))}">`
        + frame(block.id)
        + `<figcaption><span class="fig-label">Figure ${figNo}</span> ${inlineHtml(block.caption, env)}</figcaption></figure>\n`,
      );
    } else if (block.type === 'scene') {
      figNo++;
      const steps = Math.max(...block.steps.map((s) => s.step)) + 1;
      note(block.id, { steps });
      const caption = `<span class="fig-label">Figure ${figNo}</span> ${inlineHtml(block.caption, env)}`;
      if (block.where) where = block.where;
      const opening = where;
      let shown = null;       // the place last written out as a kicker
      let lastStep = null;
      const chosen = stillsOf(block.id);
      const passages = block.steps.map((s) => {
        if (s.where) where = s.where;
        const kicker = where && where !== shown ? whereLine(where) : '';
        shown = where;
        // A still is shown only where nothing can be pinned (article.css
        // 2d): the scene then reads as a sequence. Without a list of stills,
        // one stands before the first passage of every step; with one (the
        // figure's "stills" export), one after the first passage of each
        // step named.
        const first = s.step !== lastStep;
        const still = first && (!chosen || chosen.includes(s.step))
          ?`<figure class="fig seq-still" data-fig="${esc(block.id)}" data-role="seq" data-state="${s.step}" data-where="${esc(plain(where))}" aria-hidden="true">${frame(block.id)}</figure>\n`
          : '';
        lastStep = s.step;
        const passage = `<div class="passage" data-step="${s.step}" data-where="${esc(plain(where))}">\n${kicker}${render(s.lines.join('\n'))}</div>\n`;
        return chosen ? passage + still : still + passage;
      }).join('');
      html.push(
        `<section class="scene breakout" id="fig-${figNo}" data-scene="${esc(block.id)}">\n`
        + '<div class="scene-stage">'
        + `<figure class="fig fig-scene" data-fig="${esc(block.id)}" data-role="scene" data-steps="${steps}" data-where="${esc(plain(opening))}">`
        // the place the active passage is about, kept beside the drawing
        + '<p class="fig-where" aria-hidden="true"></p>'
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

  // Sources: only the cited ones, in the order of first citation. A German
  // title is marked as German, so that it is read out as German.
  const sourceItems = env.cited.map((id, i) => {
    const s = sources[id];
    const lang = langOf(s);
    const meta = [s.publisher, s.type, longDate(s.date)].filter(Boolean).map(esc);
    const h = host(s.url);
    return `<li id="src-${i + 1}" data-id="${esc(id)}"><span class="src-n">${i + 1}</span>`
      + `<span class="src-body"><a class="src-title" href="${esc(s.url)}"${lang ? ` lang="${esc(lang)}"` : ''} target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`
      + `<span class="src-meta">${meta.join(' · ')}${h ? ` <span class="src-host">${esc(h)}</span>` : ''}</span></span></li>`;
  });
  const sourcesHtml = sourceItems.length
    // The heading stands before the fold (inside <summary> it drops out of
    // heading navigation); the summary is only the switch.
    ? `<section class="sources" id="sources" aria-labelledby="sources-h">\n<h2 id="sources-h" class="sec"><span class="sec-num"></span><span class="sec-title">Sources<span class="src-total"> (${sourceItems.length})</span></span></h2>\n<details class="src-fold" open>\n<summary><span class="src-show">Show the ${sourceItems.length} sources</span><span class="src-hide">Hide the sources</span></summary>\n<ol class="src-list">\n${sourceItems.join('\n')}\n</ol>\n</details>\n</section>\n`
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

  // The first two figures are fetched with the page instead of after
  // article.js asks for them: their modules, fig.js and their data.
  const firstFigs = [...new Set([...body.matchAll(/^:::(?:figure|scene)\s+(\S+)/gm)].map((m) => m[1]))]
    .filter((id) => figures[id]?.module).slice(0, 2);
  const preload = [
    '<link rel="modulepreload" href="article.js">',
    existsSync(join(LIB, 'fig.js')) ? '<link rel="modulepreload" href="fig.js">' : '',
    ...firstFigs.map((id) => `<link rel="modulepreload" href="figures/${esc(id)}.js">`),
    ...firstFigs.filter((id) => figures[id].data).map((id) => `<link rel="preload" as="fetch" href="data/${esc(id)}.json" crossorigin>`),
  ].filter(Boolean).join('\n');

  // search and social previews
  const url = `${SITE}${slug}/`;
  const draft = fm.draft !== undefined ? String(fm.draft) !== 'false' : /^draft/i.test(String(fm.status || ''));
  const description = plain(fm.summary || fm.deck);
  const card = has('art/card.png') ? `${url}art/card.png` : '';
  const authors = String(fm.author || '').split(/\s+and\s+/).filter(Boolean);
  const meta = headMeta({
    title, docTitle: fm.seo_title ? plain(fm.seo_title) : title, description, url, draft, author: fm.author,
    image: card, imageAlt: plain(fm.card_alt || fm.title),
    date: fm.date, modified: fm.modified || fm.date,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      headline: title,
      description,
      url,
      inLanguage: 'en-GB',
      ...(fm.date ? { datePublished: fm.date, dateModified: fm.modified || fm.date } : {}),
      author: authors.filter((name) => !/^group$/i.test(name.trim())).map((name) => ({ '@type': 'Person', name })),
      publisher: { '@type': 'Person', name: authors[0] },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      ...(card ? { image: { '@type': 'ImageObject', url: card, width: 1200, height: 630 } } : {}),
      isPartOf: { '@type': 'Course', name: plain(String(fm.context || '').split('·')[0].trim()), provider: { '@type': 'CollegeOrUniversity', name: 'Technische Hochschule Deggendorf' } },
      ...(fm.keywords ? { keywords: String(fm.keywords) } : {}),
      abstract: description,
      isAccessibleForFree: true,
      ...(/group/i.test(String(fm.author || '')) ? { contributor: { '@type': 'Organization', name: `${plain(String(fm.context || '').split('·')[0].trim())} group, TH Deggendorf` } } : {}),
    },
  });

  const page = `<!doctype html>
<html lang="en-GB" data-slug="${esc(slug)}" data-accent="${esc(fm.accent)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="${fm.accent === 'other-half' ? '#4254C5' : '#1F7A54'}">
${meta}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="article.css">
${preload}
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
<details class="toc-fold" open>
<summary>Contents</summary>
<ol>
${toc}
</ol>
</details>
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
  copyIfThere(join(src, 'data'), join(out, 'data'));
  // art/: only what the page or its previews use (not the notes on how the drawings were made)
  if (existsSync(join(src, 'art'))) cpSync(join(src, 'art'), join(out, 'art'), { recursive: true, filter: (f) => {
    const name = f.replace(/\\/g, '/').split('/').pop();
    if (!/\./.test(name)) return true;                       // the folder itself
    return name === 'card.png' || (a.hero && name.startsWith(`${a.hero}-`));
  } });
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
<h2 class="index-h"><a href="${esc(slug)}/"><span class="index-title">${inlineHtml(fm.title)}</span></a></h2>
<p class="index-deck">${inlineHtml(fm.deck)}</p>
<p class="index-meta"><span>${esc(fm.author)} · ${esc(fm.context)}</span><span class="status">${esc(fm.status)}</span></p>
</li>`).join('\n');

  const page = `<!doctype html>
<html lang="en-GB" data-accent="${esc(entries[0].fm.accent)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FBFBFC">
${headMeta({
    title: 'WS27 papers · Alexander Rudaev', type: 'website', url: SITE, root: '',
    description: 'Two long-form articles from the winter semester 2026/27 at TH Deggendorf: AI agents in customer service, and the decoders of quantum computers.',
    draft: entries.some(({ fm }) => /^draft/i.test(String(fm.status || '')) && String(fm.draft) !== 'false'),
    image: existsSync(join(LIB, 'site', 'card.png')) ? `${SITE}card.png` : '',
    imageAlt: 'Two article cards side by side: a cable cut into a plastered brick wall in green, and a line drawing of a quantum computer beside an ordinary computer in blue.',
    jsonld: {
      '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'WS27 papers', url: SITE, inLanguage: 'en-GB',
      description: 'Two long-form articles from the winter semester 2026/27 at TH Deggendorf.', author: { '@type': 'Person', name: 'Alexander Rudaev' },
      mainEntity: { '@type': 'ItemList', itemListElement: entries.map(({ slug, fm }, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}${slug}/`, name: plain(fm.title) })) },
    },
  })}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="article.css">
</head>
<body class="index">
<header class="title-block">
<h1 class="kicker"><span>WS27 papers · drafts for review</span></h1>
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

  // site files: icons, sitemap.xml, 404 page
  copyIfThere(join(LIB, 'site'), DIST);
  // (no robots.txt: on a project site crawlers read it only at the domain root)
  rmSync(join(DIST, 'robots.txt'), { force: true });
  const urls = [SITE, ...entries.map(({ slug }) => `${SITE}${slug}/`)];
  const lastmod = (fm) => (fm && (fm.modified || fm.date)) ? `<lastmod>${esc(fm.modified || fm.date)}</lastmod>` : '';
  writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u, i) => `<url><loc>${esc(u)}</loc>${i ? lastmod(entries[i - 1].fm) : ''}</url>`).join('\n')}
</urlset>
`);
  writeFileSync(join(DIST, '404.html'), `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Not found · WS27 papers</title>
<link rel="icon" href="/ws27-papers/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/ws27-papers/apple-touch-icon.png">
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/ws27-papers/article.css">
</head>
<body class="index">
<header class="title-block"><h1 class="kicker"><span>Page not found</span></h1></header>
<main class="body">
<ol class="index-list">
${entries.map(({ slug, fm }) => `<li data-accent="${esc(fm.accent)}"><a href="/ws27-papers/${esc(slug)}/"><span class="index-title">${inlineHtml(fm.title)}</span></a></li>`).join('')}
</ol>
<p><a href="/ws27-papers/">All articles</a></p>
</main>
</body>
</html>
`);
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
