// Scroll engine, margin scene, source marks. One ES module, no library.
//
// The page works without this file: text, captions and the source list are
// plain HTML. What this file adds:
//   - mounts the figure modules (figures/<id>.js) per the contract in SPEC.md
//   - turns the scroll position into set(step, t) calls
//   - the pinned margin figure and its states
//   - the source marks' popover
//   - print mode: ?print=1 on screen, and automatically while printing
//
// Query parameters for review:
//   ?freeze=<id>:<step>:<t>[,<id>:<step>:<t>…]   pin figure states
//   ?print=1                                      preview print mode on screen

const params = new URLSearchParams(location.search);
const root = document.documentElement;
const manifest = JSON.parse(document.getElementById('article-data')?.textContent || '{"figures":{}}');

const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const PRINT_PREVIEW = params.get('print') === '1';
let printMode = false;

// ?freeze=numbers:2:0.5 -> { numbers: { step: 2, t: 0.5 } }
const frozen = {};
for (const part of (params.get('freeze') || '').split(',')) {
  const [id, step, t] = part.split(':');
  if (id && step !== undefined) {
    frozen[id] = { step: Math.max(0, parseInt(step, 10) || 0), t: clamp01(t === undefined ? 1 : parseFloat(t)) };
  }
}

function clamp01(x) { return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0; }

// ---------------------------------------------------------------------------
// Print mode
// ---------------------------------------------------------------------------
// The print rules live in "@media print" blocks and the screen layout in
// "@media screen" blocks (see article.css). Print mode turns the first on
// and the second off by rewriting the media conditions, so the same rules
// serve the preview (?print=1), the moment before printing, and the paper.
const mediaRules = [];
for (const sheet of document.styleSheets) {
  let rules;
  try { rules = sheet.cssRules; } catch { continue; }   // the font stylesheet is cross-origin
  for (const rule of rules) {
    if (rule instanceof CSSMediaRule) mediaRules.push({ rule, text: rule.media.mediaText });
  }
}
function applyMedia(print) {
  for (const { rule, text } of mediaRules) {
    const isPrint = /\bprint\b/.test(text);
    const isScreen = /\bscreen\b/.test(text);
    if (!isPrint && !isScreen) continue;
    rule.media.mediaText = print ? (isPrint ? 'all' : 'not all') : text;
  }
  root.classList.toggle('is-print', print);
}

// ---------------------------------------------------------------------------
// Figures
// ---------------------------------------------------------------------------
const modules = new Map();   // id -> module or null
const datasets = new Map();  // id -> parsed JSON or null

async function load(id) {
  const info = manifest.figures[id] || {};
  if (!modules.has(id)) {
    let mod = null;
    // The builder records which modules exist, so a missing figure is a
    // placeholder and not a failed request.
    if (info.module) {
      try { mod = await import(new URL(`figures/${id}.js`, document.baseURI).href); }
      catch (err) { console.warn(`figure "${id}" could not be loaded:`, err); }
    }
    modules.set(id, mod && typeof mod.default === 'function' ? mod : null);
  }
  if (!datasets.has(id)) {
    let data = null;
    if (info.data) {
      try { data = await (await fetch(new URL(`data/${id}.json`, document.baseURI))).json(); }
      catch (err) { console.warn(`data for figure "${id}" could not be loaded:`, err); }
    }
    datasets.set(id, data);
  }
}

const ctxCss = (name) => getComputedStyle(root)
  .getPropertyValue(name.startsWith('--') ? name : `--${name}`).trim();

// One slot per place where a figure is shown: a scene, a figure in the text,
// the pinned margin figure, or a still of one margin state.
const slots = [...document.querySelectorAll('[data-fig]')].map((el) => ({
  el,
  frame: el.querySelector('.fig-frame'),
  id: el.dataset.fig,
  role: el.dataset.role,                              // scene | figure | margin | still
  wide: el.dataset.role === 'scene' || el.dataset.layout === 'wide',
  state: Number(el.dataset.state || 0),
  declared: Number(el.dataset.steps || 0),            // steps the text uses (scenes)
  handle: null,
  steps: 1,
  key: '',
  last: '',
}));

// How a scene is laid out. The same conditions are in article.css (2d).
const MODES = {
  side: matchMedia('(min-width: 1000px) and (min-height: 560px)'),     // figure pinned beside the passages
  top: matchMedia('(max-width: 999.98px) and (min-height: 560px)'),    // figure pinned above them
};                                                                     // neither: a sequence of stills
const sceneMode = () => (MODES.side.matches ? 'side' : MODES.top.matches ? 'top' : 'seq');

// A 'wide' drawing is only given a frame in which it is shown at 80% of its
// own size or more (its lettering is drawn at 11 to 13 px). The drawing's
// size is known after its first mount; until then 440 px is assumed, and
// mount() tries again as 'tall' if the drawing turns out larger.
const minWide = new Map();   // id -> smallest frame width for the wide layout
const TALL_MAX = 432;        // a 'tall' drawing (about 360 units wide) is not blown up beyond this

// The room a slot has: the width available to its frame, and for pinned
// scene figures the height it may take.
function roomOf(slot) {
  let width = slot.el.clientWidth;
  let height = Infinity;
  if (slot.role === 'scene') {
    const stage = slot.el.parentElement;
    const cs = getComputedStyle(stage);
    width = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const vh = innerHeight;
    const rem = parseFloat(getComputedStyle(root).fontSize);
    // Beside the passages the figure may fill most of the window's height;
    // above them it must leave four lines of text and their spacing.
    if (sceneMode() === 'side') height = Math.min(vh * 0.78, vh - 8 * rem);
    else height = Math.max(180, vh - 4 * 1.62 * 1.06 * rem - 5.5 * rem);
  }
  return { width, height };
}

// Decides 'wide' or 'tall' and the frame's width in px (null: let CSS decide).
function sizeOf(slot, mod) {
  if (slot.role === 'margin' || slot.role === 'still') return { layout: 'tall', width: null };
  if (printMode) return { layout: slot.wide ? 'wide' : 'tall', width: null };
  const { width, height } = roomOf(slot);
  const aspect = (layout) => mod?.aspect?.[layout] || (layout === 'tall' ? 0.8 : 1.6);
  const wide = Math.min(width, height * aspect('wide'));
  if (wide >= (minWide.get(slot.id) ?? 440)) return { layout: 'wide', width: wide };
  return { layout: 'tall', width: Math.min(width, height * aspect('tall'), TALL_MAX) };
}

const displayed = (slot) => slot.frame.getClientRects().length > 0;

function placeholder(slot) {
  const box = document.createElement('div');
  box.className = 'fig-placeholder';
  const name = document.createElement('b');
  name.textContent = slot.id;
  const state = document.createElement('span');
  box.append(name, state);
  slot.frame.append(box);
  // A scene has as many steps as the text uses; the margin figure as many
  // as its markers ask for.
  const states = [...document.querySelectorAll('.margin-mark')].map((m) => Number(m.dataset.state) + 1);
  const steps = Math.max(1, slot.declared, slot.role === 'margin' ? Math.max(0, ...states) : 0);
  return {
    steps,
    set(step, t) { state.textContent = steps > 1 || slot.role !== 'figure' ? `step ${step} · t ${t.toFixed(2)}` : 'figure to come'; },
    destroy() { box.remove(); },
  };
}

function unmount(slot) {
  if (slot.handle) { try { slot.handle.destroy?.(); } catch (err) { console.warn(err); } }
  slot.handle = null;
  slot.last = '';
  slot.frame.replaceChildren();
}

// Mounts a slot if it is displayed and not mounted for the current layout.
function mount(slot) {
  if (!displayed(slot)) { if (slot.handle) unmount(slot); slot.key = ''; return; }
  const mod = modules.get(slot.id);
  const { layout, width } = sizeOf(slot, mod);
  // The width can change without a new mount; the layout cannot.
  slot.frame.style.width = width ? `${Math.floor(width)}px` : '';
  const key = `${layout}|${printMode}|${reducedQuery.matches}`;
  if (slot.handle && slot.key === key) return;
  unmount(slot);
  slot.key = key;

  if (!mod) {
    // Stills of a figure that does not exist yet would only be empty boxes
    // in the text; the placeholder is shown where the figure itself goes.
    if (slot.role === 'still' || slot.role === 'seq') { slot.el.classList.add('is-empty'); return; }
    slot.frame.style.setProperty('--aspect', slot.role === 'margin' ? 0.8 : 1.6);
    const p = placeholder(slot);
    slot.handle = p; slot.steps = p.steps;
    return;
  }

  slot.el.classList.remove('is-empty');
  slot.el.dataset.mounted = layout;                   // read by tools/matrix.mjs
  const aspect = mod.aspect?.[layout] || (layout === 'tall' ? 0.8 : 1.6);
  slot.frame.style.setProperty('--aspect', aspect);
  slot.steps = Math.max(1, mod.steps || 1);
  // A still shows one state of the margin scene, not the print composite,
  // so it is mounted as a motionless screen figure even on paper.
  const still = slot.role === 'still' || slot.role === 'seq';
  const ctx = {
    layout,
    print: printMode && !still,
    reduced: reducedQuery.matches || still || printMode,
    data: datasets.get(slot.id),
    css: ctxCss,
  };
  try {
    slot.handle = mod.default(slot.frame, ctx) || { set() {}, destroy() {} };
    // Now the drawing's own width is known. If the frame shows the wide
    // drawing too small to read, it is mounted again as the tall one.
    const drawn = slot.frame.querySelector('svg')?.viewBox?.baseVal?.width;
    if (layout === 'wide' && drawn && !printMode) {
      minWide.set(slot.id, Math.max(minWide.get(slot.id) || 0, drawn * 0.8));
      if (width && width < drawn * 0.8) { slot.key = ''; unmount(slot); mount(slot); }
    }
  } catch (err) {
    console.warn(`figure "${slot.id}" failed to mount:`, err);
    slot.frame.replaceChildren();
    const p = placeholder(slot);
    slot.handle = p; slot.steps = p.steps;
  }
}

// The one place where set() is called. Applies freeze, print and reduced
// motion, clamps the step, and skips calls that would repeat the last one.
function apply(slot, step, t) {
  if (!slot.handle) return;
  const pin = frozen[slot.id];
  const fixed = slot.role === 'still' || slot.role === 'seq';
  if (pin && !fixed) { step = pin.step; t = pin.t; }
  else if (fixed) { step = slot.state; t = 1; }
  else if (printMode) { step = slot.role === 'margin' ? step : slot.steps - 1; t = 1; }
  else if (reducedQuery.matches) { if (slot.role === 'figure') step = slot.steps - 1; t = 1; }
  step = Math.min(slot.steps - 1, Math.max(0, Math.round(step)));
  t = Math.round(clamp01(t) * 1000) / 1000;
  const sig = `${step}:${t}`;
  if (sig === slot.last) return;
  slot.last = sig;
  try { slot.handle.set(step, t); } catch (err) { console.warn(`figure "${slot.id}" set(${step}, ${t}) failed:`, err); }
}

// ---------------------------------------------------------------------------
// Scroll -> (step, t)
// ---------------------------------------------------------------------------
const scenes = [...document.querySelectorAll('.scene')].map((el) => ({
  el,
  stage: el.querySelector('.scene-stage'),
  passages: [...el.querySelectorAll('.passage')],
  slot: slots.find((s) => s.el === el.querySelector('[data-fig]')),
}));
const figureSlots = slots.filter((s) => s.role === 'figure');
const marginSlot = slots.find((s) => s.role === 'margin');
const marginMarks = [...document.querySelectorAll('.margin-mark')];
const railPin = document.querySelector('.rail-pin');
const breakouts = [...document.querySelectorAll('.breakout')];
const hero = document.querySelector('.hero');

function updateScene(scene, vh) {
  const pinnedOnTop = sceneMode() === 'top';
  // The reading line: where a passage counts as the one being read. Beside a
  // pinned figure that is a little below the middle of the window; under a
  // figure pinned on top it is in the band of text below the figure.
  let line = vh * 0.62;
  if (pinnedOnTop) {
    const bottom = Math.max(0, Math.min(vh * 0.7, scene.stage.getBoundingClientRect().bottom));
    line = bottom + (vh - bottom) * 0.72;
  }
  // t runs from 0 to 1 while the passage travels this far past the line.
  const travel = vh * (pinnedOnTop ? 0.26 : 0.36);

  let active = scene.passages[0];
  for (const p of scene.passages) {
    if (p.getBoundingClientRect().top <= line) active = p; else break;
  }
  const t = (line - active.getBoundingClientRect().top) / travel;
  for (const p of scene.passages) p.classList.toggle('is-active', p === active);
  apply(scene.slot, Number(active.dataset.step), t);
}

// A figure in the text assembles while it enters the window and is complete
// (last step, t = 1) once its upper part has passed the middle.
function updateFigure(slot, vh) {
  const top = slot.frame.getBoundingClientRect().top;
  const p = clamp01((vh * 0.94 - top) / (vh * 0.52));
  if (p >= 1) return apply(slot, slot.steps - 1, 1);
  const x = p * slot.steps;
  apply(slot, Math.floor(x), x - Math.floor(x));
}

function updateMargin(vh) {
  if (!marginSlot || !marginSlot.handle) return;
  const line = vh * 0.5;
  let active = null;
  for (const m of marginMarks) {
    if (m.getBoundingClientRect().top <= line) active = m; else break;
  }
  // Above the first marker the first state is shown complete.
  if (!active || active === marginMarks[0]) apply(marginSlot, Number(marginMarks[0]?.dataset.state || 0), 1);
  else apply(marginSlot, Number(active.dataset.state), (line - active.getBoundingClientRect().top) / (vh * 0.3));

  // Scenes and wide figures run through the margin column; the pinned
  // figure steps out of their way.
  const pin = railPin.getBoundingClientRect();
  const away = !frozen[marginSlot.id] && breakouts.some((b) => {
    const r = b.getBoundingClientRect();
    return r.top < pin.bottom + 48 && r.bottom > pin.top - 48;
  });
  railPin.classList.toggle('is-away', away);
}

function updateHero() {
  if (!hero || printMode || reducedQuery.matches) return;
  const y = Math.min(scrollY, innerHeight * 1.5);
  // The field drifts a little more slowly than the line drawing over it.
  hero.querySelector('.hero-field').style.transform = `translate3d(0, ${(y * 0.09).toFixed(1)}px, 0)`;
  hero.querySelector('.hero-line').style.transform = `translate3d(0, ${(y * 0.035).toFixed(1)}px, 0)`;
}

// The art files carry empty paper around the drawing. The page sizes the
// hero by the drawing itself, so its bounds are read once from the pixels
// and handed to the stylesheet as fractions of the image.
async function fitHero() {
  if (!hero) return;
  const imgs = [...hero.querySelectorAll('img')];
  try {
    await Promise.all(imgs.map((img) => img.decode()));
    const w = 240;
    const ar = imgs[0].naturalHeight / imgs[0].naturalWidth;
    const h = Math.round(w * ar);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const c = canvas.getContext('2d', { willReadFrequently: true });
    c.fillStyle = '#fff';
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'multiply';
    for (const img of imgs) c.drawImage(img, 0, 0, w, h);
    const px = c.getImageData(0, 0, w, h).data;
    let l = w, r = 0, t = h, b = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (px[i] + px[i + 1] + px[i + 2] > 700) continue;   // paper
        if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y;
      }
    }
    if (r <= l || b <= t) return;
    const s = hero.style;
    s.setProperty('--ar', ar.toFixed(4));
    s.setProperty('--bw', ((r - l + 1) / w).toFixed(4));          // drawing width / image width
    s.setProperty('--bh', ((b - t + 1) / h).toFixed(4));
    s.setProperty('--pl', (l / w).toFixed(4));                    // empty share on each side
    s.setProperty('--pr', (1 - (r + 1) / w).toFixed(4));
    s.setProperty('--pt', (t / h).toFixed(4));
    s.setProperty('--pb', (1 - (b + 1) / h).toFixed(4));
    s.setProperty('--ratio', ((b - t + 1) / (r - l + 1)).toFixed(4));   // drawing height / drawing width
    s.setProperty('--sy',`${((0.5 - (t + b + 1) / 2 / h) * 100).toFixed(2)}%`);   // centres the drawing, not the file
  } catch (err) { console.warn('hero art could not be measured:', err); }
}

function update() {
  const vh = innerHeight;
  for (const scene of scenes) if (scene.slot?.handle) updateScene(scene, vh);
  for (const slot of figureSlots) if (slot.handle) updateFigure(slot, vh);
  for (const slot of slots) if (slot.role === 'still' || slot.role === 'seq') apply(slot, slot.state, 1);
  updateMargin(vh);
  updateHero();
}

// Scroll and resize only ask for a frame; the work happens once per frame.
let asked = false;
function requestUpdate() {
  if (asked) return;
  asked = true;
  requestAnimationFrame(() => { asked = false; update(); });
}

function mountAll() {
  for (const slot of slots) mount(slot);
  update();
}

// ---------------------------------------------------------------------------
// Print: where the spanning figures go
// ---------------------------------------------------------------------------
// A figure that spans both columns cannot break across pages. Where it
// stands in the text it often does not fit on the rest of its page, and the
// browser then leaves that rest empty. A journal moves such a figure down
// past the next paragraphs, so that text fills the page and the figure opens
// the next one. This pass does the same before the pages are laid out: it
// measures every block, walks through a simple model of the pages (two
// columns, 266mm high) and moves a spanning figure down where the model
// shows more than a fifth of a page would stay empty.
const MM = 96 / 25.4;
const PAGE_H = 266 * MM - 12;         // 297mm minus the page margins, minus a little slack
let movedNodes = [];

function restoreFlow() {
  for (const m of movedNodes.reverse()) m.parent.insertBefore(m.node, m.next);
  movedNodes = [];
}

const SPANNERS = '.scene-stage, .fig-wide, .table-frame.table-wide';

// The blocks of the text in reading order, wrappers opened up.
function flowBlocks() {
  const out = [];
  (function walk(parent, inSources) {
    for (const el of parent.children) {
      if (el.matches('.rail, .margin-mark, .scene-caption, .seq-still, .table-hint')) continue;
      if (el.matches('.scene, .scene-text, .passage')) walk(el, inSources);
      else if (el.matches('.sources, .src-list')) walk(el, true);
      else if (el.matches(SPANNERS)) out.push({ el, span: true });
      else out.push({ el, head: el.matches('h2, h3'), fixed: inSources, solid: el.matches('figure, .table-frame') });
    }
  }(document.querySelector('main.body'), false));
  return out;
}

function arrangeForPrint() {
  restoreFlow();
  const main = document.querySelector('main.body');
  if (!main) return;
  const blocks = flowBlocks();
  if (!blocks.some((b) => b.span)) return;
  const outer = (el) => {
    const cs = getComputedStyle(el);
    return el.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
  };

  // Spanning figures and the title block are measured at page width …
  for (const b of blocks) if (b.span) b.h = outer(b.el);
  const title = document.querySelector('.title-block');
  const titleH = title ? outer(title) : 0;
  // … everything else in one column of the real column width, with the
  // spanning figures out of the way. A block's height is the distance to
  // the next block, which includes the margins between them.
  root.classList.add('is-measure-col');
  const cols = blocks.filter((b) => !b.span);
  const tops = cols.map((b) => b.el.getBoundingClientRect().top);
  const end = main.getBoundingClientRect().bottom;
  cols.forEach((b, i) => { b.h = Math.max(0, (i + 1 < cols.length ? tops[i + 1] : end) - tops[i]); });
  root.classList.remove('is-measure-col');

  // The model: y is how far down the page the current stretch of columns
  // starts, seg how much one-column text it holds so far.
  let y = titleH;
  let seg = 0;
  let solid = 0;                       // the tallest block of the stretch that cannot break (a column figure)
  const trace = [`title ${Math.round(titleH)} of ${Math.round(PAGE_H)}`];   // window.__printTrace, for review
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!b.span) {
      // Real columns lose a line or two at every column end (headings and
      // figures that may not break), so text counts for a little more.
      seg += b.h * 1.04;
      if (b.solid) solid = Math.max(solid, b.h);
      while (seg > 2 * (PAGE_H - y)) { seg -= 2 * (PAGE_H - y); y = 0; solid = b.solid ? b.h : 0; }
      continue;
    }
    // The columns above it are balanced, but never shorter than a figure in them.
    const top = y + Math.max(seg / 2, Math.min(solid, PAGE_H - y));
    trace.push(`${(b.el.querySelector('[data-fig]') || b.el).dataset.fig || 'table'}: top ${Math.round(top)} height ${Math.round(b.h)}${b.moved ? ' (moved)' : ''}`);
    if (top + b.h <= PAGE_H * 0.95) { y = top + b.h; seg = 0; solid = 0; continue; }
    const empty = Math.max(0, PAGE_H - top);
    if (b.moved >= 2 || empty < PAGE_H * 0.2) { y = Math.min(b.h, PAGE_H); seg = 0; solid = 0; continue; }

    // Move it down past as much text as fills the rest of the page. It stays
    // in front of the next spanning figure and of the list of sources, and
    // never lands between a heading and its first paragraph.
    // Spanning figures that follow it directly move with it, in their order.
    let j = i;
    while (j + 1 < blocks.length && blocks[j + 1].span) j++;
    let k = j;
    let filled = 0;
    while (k + 1 < blocks.length && !blocks[k + 1].span && !blocks[k + 1].fixed
      && (filled < 2 * empty || blocks[k].head)) { k++; filled += blocks[k].h; }
    while (k > j && blocks[k].head) k--;
    if (k === j) { y = Math.min(b.h, PAGE_H); seg = 0; solid = 0; continue; }
    const group = blocks.slice(i, j + 1);
    // Remember every place first: the figures of a group are each other's neighbours.
    // A figure may be moved a second time (when the one before it took the page);
    // its first, original place is the one that is restored.
    for (const g of group) if (!g.moved) movedNodes.push({ node: g.el, parent: g.el.parentNode, next: g.el.nextSibling });
    let after = blocks[k].el;
    for (const g of group) { after.after(g.el); after = g.el; g.moved = (g.moved || 0) + 1; }
    blocks.splice(k + 1, 0, ...group);
    blocks.splice(i, group.length);
    i--;                                           // the block that moved up into this place is next
  }
  window.__printTrace = trace;
}

function setPrintMode(on) {
  if (on === printMode) return;
  printMode = on;
  if (!on) restoreFlow();
  applyMedia(on);
  closePopover();
  mountAll();
  if (on) arrangeForPrint();
}

// ---------------------------------------------------------------------------
// Source marks
// ---------------------------------------------------------------------------
let pop = null;       // the open popover
let popMark = null;   // the mark it belongs to

function closePopover(returnFocus = false) {
  if (!pop) return;
  pop.remove();
  popMark.setAttribute('aria-expanded', 'false');
  if (returnFocus) popMark.focus();
  pop = null; popMark = null;
}

function openPopover(mark) {
  closePopover();
  const nums = mark.dataset.nums.split(' ');
  pop = document.createElement('div');
  pop.className = 'src-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', nums.length === 1 ? 'Source for this passage' : 'Sources for this passage');
  pop.tabIndex = -1;
  const head = document.createElement('h2');
  head.textContent = nums.length === 1 ? 'Source' : `${nums.length} sources`;
  const list = document.createElement('ol');
  for (const n of nums) {
    // The entries are copies of the list at the end of the page.
    const item = document.getElementById(`src-${n}`);
    if (!item) continue;
    const copy = item.cloneNode(true);
    copy.removeAttribute('id');
    list.append(copy);
  }
  pop.append(head, list);
  document.body.append(pop);

  // Under the mark, kept inside the window; above it if there is no room below.
  const r = mark.getBoundingClientRect();
  const w = pop.offsetWidth;
  const h = pop.offsetHeight;
  const edge = 12;
  const docW = root.clientWidth;
  const left = Math.max(edge, Math.min(r.left - 14, docW - w - edge));
  const below = innerHeight - r.bottom;
  const top = below < h + 16 && r.top > h + 16 ? r.top - h - 8 : r.bottom + 8;
  pop.style.left = `${left + scrollX}px`;
  pop.style.top = `${top + scrollY}px`;

  popMark = mark;
  mark.setAttribute('aria-expanded', 'true');
  (pop.querySelector('a') || pop).focus({ preventScroll: true });
}

document.addEventListener('click', (e) => {
  const mark = e.target.closest?.('.src-mark');
  if (mark) {
    e.preventDefault();
    if (mark === popMark) closePopover(true); else openPopover(mark);
  } else if (pop && !pop.contains(e.target)) {
    closePopover();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && pop) { e.preventDefault(); closePopover(true); }
});
// Tabbing out of the popover closes it and carries on from its mark.
document.addEventListener('focusin', (e) => {
  if (pop && !pop.contains(e.target) && e.target !== popMark) closePopover();
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
// A table wider than its frame scrolls inside it. It then says so under the
// table, and the frame can be reached and scrolled by keyboard.
function markTables() {
  for (const frame of document.querySelectorAll('.table-frame')) {
    const scrolls = !printMode && frame.scrollWidth > frame.clientWidth + 1;
    let hint = frame.nextElementSibling;
    if (!hint?.classList.contains('table-hint')) hint = null;
    if (scrolls && !hint) {
      hint = document.createElement('p');
      hint.className = 'table-hint';
      hint.textContent = 'The table scrolls sideways →';
      frame.after(hint);
      frame.tabIndex = 0;
      frame.setAttribute('role', 'region');
      frame.setAttribute('aria-label', 'Table, scrolls sideways');
    } else if (!scrolls && hint) {
      hint.remove();
      frame.removeAttribute('tabindex');
      frame.removeAttribute('role');
      frame.removeAttribute('aria-label');
    }
  }
}

async function start() {
  await Promise.all([...new Set(slots.map((s) => s.id))].map(load));
  if (PRINT_PREVIEW) { printMode = true; applyMedia(true); }
  await fitHero();
  for (const scene of scenes) scene.el.classList.add('is-live');
  mountAll();
  if (printMode) document.fonts.ready.then(arrangeForPrint);

  markTables();

  addEventListener('scroll', requestUpdate, { passive: true });
  let resizeTimer = 0;
  // A new size or orientation can mean another layout: frames are sized
  // again, and a figure whose layout changes is destroyed and mounted anew.
  const relayout = () => {
    requestUpdate();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { closePopover(); mountAll(); markTables(); }, 160);
  };
  addEventListener('resize', relayout);
  addEventListener('orientationchange', relayout);
  screen.orientation?.addEventListener?.('change', relayout);
  reducedQuery.addEventListener('change', mountAll);
  document.fonts?.ready.then(requestUpdate);

  // Ctrl+P: switch to print mode before the browser lays out the pages.
  addEventListener('beforeprint', () => setPrintMode(true));
  addEventListener('afterprint', () => setPrintMode(PRINT_PREVIEW));

  // A frozen figure is what the reviewer wants to see: bring it into view.
  const first = slots.find((s) => frozen[s.id] && s.role !== 'still' && s.handle);
  if (first) first.frame.scrollIntoView({ block: 'center' });

  root.dataset.ready = '1';   // tools/shots.mjs waits for this
}

start();
