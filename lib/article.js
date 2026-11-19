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

// The module and its data are requested together; the figure is ready when
// both are in (or have failed: a missing figure is a placeholder).
async function load(id) {
  if (modules.has(id) && datasets.has(id)) return;
  const info = manifest.figures[id] || {};
  // The builder records which modules exist, so a missing figure is a
  // placeholder and not a failed request.
  const [mod, data] = await Promise.all([
    info.module
      ? import(new URL(`figures/${id}.js`, document.baseURI).href)
        .catch((err) => { console.warn(`figure "${id}" could not be loaded:`, err); return null; })
      : null,
    info.data
      ? fetch(new URL(`data/${id}.json`, document.baseURI)).then((r) => r.json())
        .catch((err) => { console.warn(`data for figure "${id}" could not be loaded:`, err); return null; })
      : null,
  ]);
  datasets.set(id, data);
  modules.set(id, mod && typeof mod.default === 'function' ? mod : null);
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
  wide: (el.dataset.role === 'scene' && !el.closest('.scene-column')) || el.dataset.layout === 'wide',
  state: Number(el.dataset.state || 0),
  where: el.dataset.where || '',                       // the place the text is about here (@where)
  whereEl: el.querySelector('.fig-where'),             // its label beside a pinned figure
  declared: Number(el.dataset.steps || 0),            // steps the text uses (scenes)
  handle: null,
  steps: 1,
  key: '',
  last: '',
}));

// How a scene is laid out. The same conditions are in article.css (2d).
// Upright screens under 1000 px wide (phones and tablets held upright) pin
// the figure on top, the passages scrolling under it; windows lower than
// 450 px (a phone held sideways), and narrow windows under 560 px high, read
// a scene as a sequence of stills: nothing pinned there leaves room to read.
const MODES = {
  side: matchMedia('(min-width: 1000px) and (min-height: 560px), (min-width: 640px) and (min-height: 450px) and (max-height: 559.98px)'),     // figure pinned beside the passages
  top: matchMedia('(max-width: 999.98px) and (min-height: 560px)'),    // figure pinned above them
};                                                                     // neither: a sequence of stills
const sceneMode = () => (MODES.side.matches ? 'side' : MODES.top.matches ? 'top' : 'seq');
// A scene pinned on top whose figure cannot be drawn legibly in the height it
// may take there (topFit) reads as a sequence of stills on this window
// (.scene.is-seq, decided per scene in layoutAll), so its text reads full width.
const modeOf = (scene) => { const m = sceneMode(); return m === 'top' && scene?.fallback ? 'seq' : m; };

// No lettering in a figure is shown under 11.5 px. A layout is only given a
// frame in which its smallest lettering, as the drawing sets it, reaches
// that size: the frame must be at least (drawing width × 11.5 / smallest
// font size) wide. Both are read once per figure and layout from a copy
// drawn off screen at a size where nothing is lifted by fig.js's own floor.
const LETTER_PX = 11.5;
const fits = new Map();      // 'id|layout' -> smallest frame width in px
const cutAspect = new Map(); // 'id|state|layout' -> aspect of a sequence still cut to its own step
const TALL_MAX = 432;        // a 'tall' drawing (about 360 units wide) pinned on top is not blown up beyond this
const TALL_TEXT = 680;       // in the text, a 'tall' drawing may grow to the room it has, up to this
// A still of a scene read as a sequence stands in at most 92% of the window
// height; to fit there its lettering may go down to 10 px (fig.js never
// draws it under its own floor, so nothing is cut).
const SEQ_H = 0.92;
const SEQ_LETTER = 10;
function smallestFont(svg) {
  let min = Infinity;
  for (const t of svg.querySelectorAll('text')) {
    if (!t.textContent.trim()) continue;
    let shown = true;
    for (let a = t; a && a !== svg; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.display === 'none' || parseFloat(cs.opacity) < 0.05) { shown = false; break; }
    }
    if (!shown) continue;
    const fs = parseFloat(t.getAttribute('font-size')) || parseFloat(getComputedStyle(t).fontSize);
    if (fs > 0) min = Math.min(min, fs);
  }
  return min;
}
function fitWidth(slot, mod, layout) {
  const key = `${slot.id}|${layout}`;
  if (fits.has(key)) return fits.get(key);
  let px = layout === 'wide' ? 440 : 0;
  if (mod) {
    const box = document.createElement('div');
    box.style.cssText = 'position:absolute;left:-12000px;top:0;width:2400px;visibility:hidden;pointer-events:none;contain:layout';
    box.setAttribute('aria-hidden', 'true');
    document.body.append(box);
    try {
      const h = mod.default(box, { layout, print: false, reduced: true, data: datasets.get(slot.id), css: ctxCss, where: slot.where });
      const svg = box.querySelector('svg');
      const vbw = svg?.viewBox?.baseVal?.width;
      let min = Infinity;
      if (vbw && h) {
        // lettering that only some steps show counts as well
        const n = Math.max(1, mod.steps || 1);
        for (let st = 0; st < n; st++) { try { h.set(st, 1); } catch { /* the drawing says what it can */ } min = Math.min(min, smallestFont(svg)); }
        if (Number.isFinite(min)) px = Math.ceil(vbw * LETTER_PX / min);
      }
      h?.destroy?.();
    } catch (err) { console.warn(`figure "${slot.id}" could not be measured:`, err); }
    box.remove();
  }
  fits.set(key, px);
  return px;
}

// The room a slot has: the width available to its frame, and for pinned
// scene figures the height it may take.
function roomOf(slot) {
  let width = slot.el.clientWidth;
  const base = width;                                  // the width the layout gives it
  let height = Infinity;
  // A still of a scene read as a sequence: at most 92% of the window high.
  // The first still also carries the caption under it: its drawing leaves
  // room for that, so drawing and caption fit the window together.
  if (slot.role === 'seq') {
    const cap = slot.el.querySelector(':scope > .seq-cap');
    const capH = cap?.getClientRects().length ? cap.getBoundingClientRect().height + parseFloat(getComputedStyle(cap).marginTop) : 0;
    // (the caption takes its room from the drawing only while the drawing
    // keeps 70% of the window: a long caption under a small window flows on
    // below rather than squeezing the lettering together)
    height = Math.max(innerHeight * 0.7, innerHeight * SEQ_H - capH);
  }
  // A figure in the text column, or a still, may reach out of the column on
  // both sides by the same amount: as far as the page's gutters, and on the
  // right never into the margin column.
  if ((slot.role === 'figure' && !slot.wide) || slot.role === 'seq') width = Math.max(base, evenRoom(slot.el));
  if (slot.role === 'scene') {
    const stage = slot.el.parentElement;
    const cs = getComputedStyle(stage);
    width = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const vh = innerHeight;
    const rem = parseFloat(getComputedStyle(root).fontSize);
    // Beside the passages the figure may fill most of the window's height;
    // above them it must leave four lines of text and their spacing.
    // in a short window the figure takes all but room for its caption
    if (sceneMode() === 'side') height = vh < 560 ? vh - 2.5 * rem : Math.min(vh * 0.78, vh - 9 * rem);
    else height = Math.max(180, vh - 4 * 1.62 * 1.06 * rem - 7 * rem);
    return { width, height, base: width };
  }
  return { width, height, base };
}

// The width a block in the text column can take when it reaches out by the
// same amount on both sides: to the page's gutter on the left, to the gutter
// or the margin column on the right.
function evenRoom(el) {
  const r = el.getBoundingClientRect();
  const main = document.querySelector('main.body');
  const gutter = main ? parseFloat(getComputedStyle(main).paddingRight) || 0 : 0;
  let right = root.clientWidth - gutter;
  const rail = document.querySelector('.rail');
  if (rail?.getClientRects().length) right = Math.min(right, rail.getBoundingClientRect().left - 8);
  const half = Math.max(0, Math.min(r.left - gutter, right - r.right));
  return r.width + 2 * half;
}

// Decides 'wide' or 'tall' and the frame's width in px (null: let CSS decide).
function sizeOf(slot, mod) {
  if (slot.role === 'margin' || slot.role === 'still') return { layout: 'tall', width: null };
  if (printMode) return { layout: slot.wide ? 'wide' : 'tall', width: null };
  const { width, height, base } = roomOf(slot);
  const aspect = (layout) => mod?.aspect?.[layout] || (layout === 'tall' ? 0.8 : 1.6);
  // A scene pinned above its text on an upright screen (phones, tablets held
  // upright) uses the drawing's stacked layout: a wide drawing there leaves
  // half the stage empty while its later parts wait. Up to 560 px across and
  // half the window high, so the passages keep their room.
  // Its width is decided with the scene's mode (topFit): at most TOP_H of the
  // window high, as the drawing is drawn and cut, and never so small that its
  // lettering falls under 11.5 px.
  if (slot.role === 'scene' && sceneMode() === 'top') {
    const layout = slot.scene?.topLayout || 'tall';
    const w = slot.scene?.topWidth || Math.min(width, height * aspect('tall'), innerHeight * TOP_H * aspect('tall'), 560);
    return { layout, width: Math.min(width, w) };
  }
  // A still of a sequence: the layout that shows its lettering larger, at
  // the size that fits the room and 92% of the window height.
  if (slot.role === 'seq') {
    const k = SEQ_LETTER / LETTER_PX;
    const opt = (layout) => {
      // once a still has been cut to its own step, its own shape decides the height
      const w = Math.min(width, height * (cutAspect.get(`${slot.id}|${slot.state}|${layout}`) || aspect(layout)));
      const n = fitWidth(slot, mod, layout);
      return { layout, width: w, ok: w >= n * k, ratio: w / Math.max(1, n) };
    };
    const wd = opt('wide');
    const tl = opt('tall');
    const pick = wd.ok ? wd : tl.ok ? tl : (wd.ratio >= tl.ratio ? wd : tl);
    return { layout: pick.layout, width: pick.width };
  }
  // wide where its lettering can be read at the size the room allows (a
  // figure in the text column takes more than the column only if it must)
  const need = fitWidth(slot, mod, 'wide');
  let wide = Math.min(width, height * aspect('wide'));
  if (slot.role === 'figure' && !slot.wide) wide = Math.min(wide, Math.max(base, need));
  if (wide >= need) return { layout: 'wide', width: wide };
  // else tall. Pinned beside the passages it takes the stage's width and the
  // height it is given; in the text it grows to the room it has, up to
  // TALL_TEXT, and the lettering wins over that cap.
  if (slot.role === 'scene') return { layout: 'tall', width: Math.min(width, height * aspect('tall')) };
  // (never past 92% of the window height, unless that is under the old
  // TALL_MAX; a drawing that is a long list, over twice as high as wide, is
  // read by scrolling anyway and takes the full width)
  const cap = aspect('tall') < 0.5 ? TALL_TEXT : Math.min(TALL_TEXT, Math.max(TALL_MAX, innerHeight * SEQ_H * aspect('tall')));
  const tall = Math.min(width, Math.max(Math.min(width, cap), fitWidth(slot, mod, 'tall')));
  return { layout: 'tall', width: tall };
}

const displayed = (slot) => slot.frame.getClientRects().length > 0;

// A frame in the text (a figure, a still of a sequence) stands in the middle
// of its block: one wider than the block reaches out by the same amount on
// both sides.
function centre(slot) {
  if (slot.role !== 'figure' && slot.role !== 'seq') return;
  const w = parseFloat(slot.frame.style.width);
  const ml = !printMode && w ? `${Math.round((slot.el.clientWidth - w) / 2)}px` : '';
  if (slot.frame.style.marginLeft !== ml) slot.frame.style.marginLeft = ml;
}

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
  const states = [...document.querySelectorAll('.margin-mark:not(.margin-end)')].map((m) => Number(m.dataset.state) + 1);
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
  slot.cropKey = '';
  slot.frame.style.marginBottom = '';
  slot.frame.replaceChildren();
}

// Mounts a slot if it is displayed and not mounted for the current layout.
function mount(slot) {
  if (!displayed(slot)) { if (slot.handle) unmount(slot); slot.key = ''; return; }
  if (!modules.has(slot.id)) return;                  // still loading: mounted when it arrives
  const mod = modules.get(slot.id);
  const { layout, width } = sizeOf(slot, mod);
  // The width can change without a new mount; the layout cannot.
  slot.frame.style.width = width ? `${Math.floor(width)}px` : '';
  slot.room = width || 0;
  centre(slot);
  if (slot.whereEl) slot.whereEl.style.width = slot.frame.style.width;   // the label lines up with the drawing's left edge
  const key = `${layout}|${printMode}|${reducedQuery.matches}`;
  if (slot.handle && slot.key === key) { applyCrop(slot); return; }
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
    get where() { return slot.where; },
  };
  try {
    slot.handle = mod.default(slot.frame, ctx) || { set() {}, destroy() {} };
    applyCrop(slot);
  } catch (err) {
    console.warn(`figure "${slot.id}" failed to mount:`, err);
    slot.frame.replaceChildren();
    const p = placeholder(slot);
    slot.handle = p; slot.steps = p.steps;
  }
}

// Under a figure pinned on top (phones and tablets held upright) the stage is
// exactly as tall as what the figure draws in any of its steps, and the
// drawing stands in the middle of the page: the empty parts of its viewBox
// are cut off. The bounds are measured once per mount, in the drawing's own
// units, by showing every step complete and taking what is visible.
const DRAWN = new Set(['text', 'circle', 'ellipse', 'rect', 'line', 'path', 'polyline', 'polygon', 'image', 'use']);
const HIDDEN_TREE = new Set(['defs', 'clipPath', 'mask', 'marker', 'pattern', 'symbol', 'title', 'desc']);
// The drawn part of one state: a walk down the drawing that reads each
// group's style once and leaves out a hidden group whole, so it costs one
// layout per state, not one per element.
function drawnBounds(svg, box, k, acc) {
  (function walk(node) {
    for (const el of node.children) {
      const tag = el.localName;
      if (HIDDEN_TREE.has(tag)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || parseFloat(cs.opacity) < 0.05) continue;
      if (!DRAWN.has(tag)) { walk(el); continue; }
      if (cs.visibility === 'hidden' || (cs.fill === 'none' && cs.stroke === 'none')) continue;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      acc.x0 = Math.min(acc.x0, (r.left - box.left) * k); acc.x1 = Math.max(acc.x1, (r.right - box.left) * k);
      acc.y0 = Math.min(acc.y0, (r.top - box.top) * k); acc.y1 = Math.max(acc.y1, (r.bottom - box.top) * k);
      if (tag === 'text') continue;
      walk(el);
    }
  }(svg));
}
// Crops are kept per figure, layout, width and state: a mount at the same
// size (a resize back, a second relayout) does not measure again. Nothing
// that runs per frame measures; applyCrop does so only after a new mount.
const crops = new Map();
function measureCrop(slot, only = null) {
  const svg = slot.frame.querySelector('svg');
  const vb = svg?.viewBox?.baseVal;
  if (!svg || !vb?.width || !slot.handle) return null;
  const box = svg.getBoundingClientRect();
  if (!box.width) return null;
  const memo = `${slot.id}|${slot.key}|${Math.round(box.width)}|${only}|${svg.dataset.vb0}`;
  if (crops.has(memo)) return crops.get(memo);
  const k = vb.width / box.width;                     // drawing units per px
  const acc = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (let s = 0; s < slot.steps; s++) {
    if (only !== null && s !== only) continue;
    try { slot.handle.set(s, 1); } catch { continue; }
    drawnBounds(svg, box, k, acc);
  }
  slot.last = '';                                     // the next update() puts the real state back
  const { x0, x1, y0, y1 } = acc;
  let crop = null;
  if (x1 > x0 && y1 > y0) {
    // in the viewBox's own coordinates; nothing outside it counts (below it,
    // what the figure declares as its content height does)
    const h = Math.max(vb.height, parseFloat(svg.dataset.contentH) || 0);
    crop = {
      x0: vb.x + Math.max(0, x0), x1: vb.x + Math.min(vb.width, x1),
      y0: vb.y + Math.max(0, y0), y1: vb.y + Math.min(h, y1),
      top: vb.y, w: vb.width, h,
    };
  }
  crops.set(memo, crop);
  return crop;
}
function applyCrop(slot) {
  if (slot.role !== 'scene' && slot.role !== 'figure' && slot.role !== 'seq') return;
  const svg = slot.frame.querySelector('svg');
  const fs = slot.frame.style;
  // a still of a sequence is cut to what its own step draws
  const seq = slot.role === 'seq';
  const on = svg && !printMode && ((slot.role === 'scene' && sceneMode() === 'top' && !frozen[slot.id]) || seq);
  // the figure's own viewBox and aspect, as it drew them
  if (svg && !svg.dataset.vb0) { svg.dataset.vb0 = svg.getAttribute('viewBox') || ''; svg.dataset.aspect0 = fs.getPropertyValue('--aspect'); }
  const restore = () => {
    if (!svg?.dataset.vb0) return;
    if (svg.getAttribute('viewBox') !== svg.dataset.vb0) svg.setAttribute('viewBox', svg.dataset.vb0);
    fs.setProperty('--aspect', svg.dataset.aspect0);
  };
  if (on && slot.cropKey !== slot.key) { restore(); slot.crop = measureCrop(slot, seq ? Math.min(slot.state, slot.steps - 1) : null); slot.cropKey = slot.key; }
  if (!on || !slot.crop) {
    restore();
    // A drawing that says it runs below its viewBox (data-content-h) keeps
    // that room under its frame, so a caption or a pinned edge never lies on
    // it, on paper too (the appendix table's caption sat on its last rule).
    const vb = svg?.viewBox?.baseVal;
    const ch = parseFloat(svg?.dataset.contentH);
    fs.marginBottom = vb?.height && ch > vb.height
      ? `${Math.ceil((ch - vb.height) * slot.frame.getBoundingClientRect().width / vb.width)}px` : '';
    return;
  }
  fs.marginBottom = '';
  // The viewBox is narrowed to what is drawn (with 6 px of air), and shifted
  // so the drawn part stands in the middle; the frame takes its new aspect.
  const { x0, x1, y0, y1, w, h } = slot.crop;
  const pad = 6 * w / Math.max(1, slot.frame.getBoundingClientRect().width);
  const top = Math.max(slot.crop.top, y0 - pad);
  const bottom = Math.min(slot.crop.top + h, y1 + pad);
  // centred on what is drawn, but never so far that a drawn edge leaves the box
  const x = Math.max(x1 - w, Math.min(x0, (x0 + x1 - w) / 2));
  const box = `${x.toFixed(2)} ${top.toFixed(2)} ${w} ${(bottom - top).toFixed(2)}`;
  if (svg.getAttribute('viewBox') !== box) svg.setAttribute('viewBox', box);
  const ar = w / (bottom - top);
  fs.setProperty('--aspect', ar.toFixed(4));
  // A still cut to its own step is lower than the frame it was sized for:
  // it is drawn again at the width that brings it to 92% of the window
  // height (mountAll; resizing a drawing in place makes fig.js redraw it uncut).
  if (seq) {
    const ck = `${slot.id}|${slot.state}|${slot.key.split('|')[0]}`;
    // (a drawing whose height follows its width is cut again at its new
    // size, at most twice, until the still keeps its shape)
    const was = cutAspect.get(ck);
    if (was === undefined || (Math.abs(was - ar) > 0.01 * ar && (slot.regrown || 0) < 2)) { cutAspect.set(ck, ar); slot.regrow = true; }
  }
}

// A figure pinned on top takes at most TOP_H of the window's height (the
// drawing as it is drawn and cut, not its frame), so at least 40% of the
// window stays for the passages under it. Within that height it is drawn as
// wide as the window allows, up to 560 px across or the width its lettering
// needs (fitWidth). A figure whose lettering cannot reach 11.5 px within that
// height is not pinned on this window: its scene reads as a sequence of
// stills (topFit returns null). Decided per scene and window size, in
// layoutAll (load, resize, a turn of the device); a figure is measured off
// screen once per width (ratios).
const TOP_H = 0.52;          // drawing and caption together; the passages keep the rest
// The height of a scene's caption set in the pinned box at a given width,
// measured off screen once per scene and width.
const capHeights = new Map();
function captionHeight(scene, w) {
  const cap = scene.stage.querySelector('figcaption');
  if (!cap) return 0;
  const key = `${scene.slot.id}|${Math.round(w)}`;
  if (capHeights.has(key)) return capHeights.get(key);
  // inside a .scene and a .scene-stage, so the caption takes the size its rules give it there
  const box = document.createElement('div');
  box.className = 'scene';
  box.style.cssText = `position:absolute;left:-12000px;top:0;width:${w}px;margin:0;padding:0;pointer-events:none`;
  box.setAttribute('aria-hidden', 'true');
  const stage = document.createElement('div');
  stage.className = 'scene-stage';
  stage.style.cssText = 'position:static;padding:0;border:0';
  const copy = cap.cloneNode(true);
  copy.style.display = 'block';
  stage.append(copy);
  box.append(stage);
  document.body.append(box);
  const cs = getComputedStyle(copy);
  const h = copy.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
  box.remove();
  capHeights.set(key, h);
  return h;
}
const TOP_H_PHONE = 0.66;   // under 640 px across: drawing and caption may take more, the passages keep a third
const ratios = new Map();    // 'id|width' -> drawn height per px of width, cut as applyCrop cuts it
function drawnRatio(slot, mod, w, layout = 'tall') {
  const key = `${slot.id}|${layout}|${w}`;
  if (ratios.has(key)) return ratios.get(key);
  const aspect = mod.aspect?.[layout] || (layout === 'tall' ? 0.8 : 1.6);
  let r = 1 / aspect;
  const box = document.createElement('div');
  // not visibility:hidden: drawnBounds leaves out what is hidden
  box.style.cssText = `position:absolute;left:-12000px;top:0;width:${w}px;pointer-events:none;contain:layout`;
  box.setAttribute('aria-hidden', 'true');
  document.body.append(box);
  try {
    const h = mod.default(box, { layout, print: false, reduced: true, data: datasets.get(slot.id), css: ctxCss, where: slot.where });
    const svg = box.querySelector('svg');
    const vb = svg?.viewBox?.baseVal;
    const rect = svg?.getBoundingClientRect();
    if (h && vb?.width && rect?.width) {
      const k = vb.width / rect.width;
      const acc = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
      for (let st = 0; st < Math.max(1, mod.steps || 1); st++) {
        try { h.set(st, 1); } catch { continue; }
        drawnBounds(svg, rect, k, acc);
      }
      const full = Math.max(vb.height, parseFloat(svg.dataset.contentH) || 0);
      const y0 = Math.max(0, acc.y0);
      const y1 = Math.min(full, acc.y1);
      // as applyCrop: what is drawn, with 6 px of air above and below
      r = y1 > y0 ? (y1 - y0) / vb.width : full / vb.width;
    }
    h?.destroy?.();
  } catch (err) { console.warn(`figure "${slot.id}" could not be measured:`, err); }
  box.remove();
  ratios.set(key, r);
  return r;
}
// The layout and width of a figure pinned on top, or null where it cannot be
// pinned: the stacked ('tall') drawing, or, where that cannot be read in the
// height (a tablet held upright), the 'wide' one if it can.
function topFit(scene, mod) {
  const slot = scene.slot;
  const vh = innerHeight;
  const rem = parseFloat(getComputedStyle(root).fontSize);
  const cs = getComputedStyle(scene.stage);
  const room = scene.el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  // the drawing's height: TOP_H of the window (TOP_H_PHONE on a phone), and
  // four lines of text below it
  const phone = room < 640;
  // The caption stands in the pinned box under the drawing (article.css 2d),
  // so its height comes out of the same share of the window.
  const capH = captionHeight(scene, room);
  const H = Math.min(vh * (phone ? TOP_H_PHONE : TOP_H) - capH, Math.max(180, vh - 4 * 1.62 * 1.06 * rem - 7 * rem - capH));
  if (!room) return null;
  const tryLayout = (layout, most) => {
    // on a phone the frame may be narrower than the width at which nothing
    // is lifted, as for a still: fig.js lifts the lettering back to 11.5 px
    // and drawnRatio measures the drawing as it then stands (18 November:
    // at 360 x 800 eight of ten scenes fell back to stills, nothing moved)
    const need = fitWidth(slot, mod, layout) * (phone ? SEQ_LETTER / LETTER_PX : 1);
    if (need > room + 0.5) return null;
    let w = Math.floor(Math.min(room, Math.max(most, need)));
    // a drawing may wrap or lift its lettering at another width: measured
    // again at the width it shrinks to
    for (let i = 0; i < 3; i++) {
      const r = drawnRatio(slot, mod, w, layout);
      if (w * r + 12 <= H + 0.5) return { layout, width: w, height: Math.round(w * r + 12) };
      w = Math.floor((H - 12) / r);
      if (w < need - 0.5) return null;
    }
    const r = drawnRatio(slot, mod, w, layout);
    return w * r + 12 <= H * 1.03 ? { layout, width: w, height: Math.round(w * r + 12) } : null;
  };
  // the wide drawing only where the room is a tablet's (from 640 px across)
  return tryLayout('tall', 560) || (room >= 640 ? tryLayout('wide', room) : null);
}
// Pinned or a sequence, for every scene on this window. Returns whether any
// scene changed (the page is then laid out again).
function decideScenes(only = null) {
  let changed = false;
  const top = !printMode && sceneMode() === 'top';
  for (const scene of scenes) {
    if (!scene.slot || (only && scene.slot.id !== only)) continue;
    const mod = top ? modules.get(scene.slot.id) : null;
    // a figure still loading (or missing) keeps its pinned place
    const fit = mod ? topFit(scene, mod) : null;
    const fallback = !!mod && !fit;
    scene.topWidth = fit?.width || 0;
    scene.topLayout = fit?.layout || 'tall';
    scene.topHeight = fit?.height || 0;
    if (fallback === !!scene.fallback) continue;
    changed = true;
    scene.fallback = fallback;
    scene.el.classList.toggle('is-seq', fallback);
    if (fallback) scene.el.dataset.mode = 'seq'; else delete scene.el.dataset.mode;   // read by the tools
    if (fallback) for (const p of scene.passages) p.classList.remove('is-active', 'is-current', 'is-read', 'is-under');
  }
  return changed;
}

// The one place where set() is called. Applies freeze, print and reduced
// motion, clamps the step, and skips calls that would repeat the last one.
function apply(slot, step, t) {
  if (!slot.handle) return;
  const pin = frozen[slot.id];
  const fixed = slot.role === 'still' || slot.role === 'seq';
  if (pin && !fixed) { step = pin.step; t = pin.t; }
  // A still of the margin scene on screen changes from the state before it
  // into its own as it enters the window; on paper it is complete.
  else if (fixed) { step = slot.state; t = slot.role === 'still' && !printMode && !reducedQuery.matches ? t : 1; }
  else if (printMode) { step = slot.role === 'margin' ? step : slot.steps - 1; t = 1; }
  else if (reducedQuery.matches) { if (slot.role === 'figure') step = slot.steps - 1; t = 1; }
  step = Math.min(slot.steps - 1, Math.max(0, Math.round(step)));
  t = Math.round(clamp01(t) * 1000) / 1000;
  const sig = `${step}:${t}`;
  if (sig === slot.last) return;
  slot.last = sig;
  slot.el.dataset.shown = sig;                        // read by tools/read.mjs
  try { slot.handle.set(step, t); } catch (err) { console.warn(`figure "${slot.id}" set(${step}, ${t}) failed:`, err); }
}

// ---------------------------------------------------------------------------
// Scroll decides which step, time decides how
// ---------------------------------------------------------------------------
// A step scrubbed by the scroll lasts as long as the reader's scrolling: a
// fraction of a second on one wheel tick ("bang, bang, jump scare"), half a
// minute at reading pace, with the figure changing while the passage before
// is still being read (17 November, tools/timing.mjs). So the scroll only
// says WHICH step the figure should show (its goal), and the figure plays
// from what it shows now to that goal over a set time:
//   - large (a pinned scene): 1.8 s a step, or what the figure exports as
//     durations.large[step] (1.2 to 3 s); back 0.6 s a step;
//   - medium (a figure in the text): 1.4 s once a quarter of it is in view, once;
//     again only after it has left the window entirely;
//   - small (the margin scene and its stills): 0.9 s at its marker.
// Several steps crossed at once play one after the other, quickly (the
// time divided between them, each at least 0.5 s); up to three behind, every
// one is played; more than three, the figure is set to the second-last and
// plays the last. A figure off screen, a jump (contents, address, resize),
// reduced motion and print are set at once. Every step is eased (soft():
// prompt start, gentle end).
// The players run on requestAnimationFrame only while one is moving.
const TRIGGER_AT = 0.65;    // beside a pinned figure: a step is due when its passage's top passes 65% of the window
const READ_AT = 0.5;        // the reading line beside a pinned figure (resize anchor, scene lead)
const TOP_LINE = 0.2;       // under a figure pinned on top: the reading line, as a share of the band of text below it
const TOP_TRIGGER = 0.4;    // … and a step is due this share of a pitch below that line
const DUR = { large: 1.8, medium: 1.4, small: 0.9 };
const RANGE = { large: [1.2, 3.0], medium: [1.0, 2.5], small: [0.6, 1.5] };
const BACK = 0.6;           // a step played backwards
const MIN_STEP = 0.5;       // no step is ever shorter, however many are played in a row
const MEDIUM_AT = 0.25;     // a figure in the text (or a still) plays once this share of it is in view
// The ease of a step played over time: it starts promptly (1.4 times the
// mean speed), so the drawing answers the trigger at once, and comes to
// rest gently (0.6 times the mean speed), never stopping dead. A half-speed
// start (the old in-out ease) doubled the still time at the start of steps
// whose own timeline begins with a pause (figure builder, 17 November).
const soft = (x) => x * (1.4 - 0.4 * x);

// A player walks a figure through a sequence of steps. Its position runs
// from 0 to the number of steps: k + u shows step seq[k] at t = soft(u), and
// a whole number k shows step seq[k - 1] complete.
function player(slot, size, seq, start = 0) {
  return { slot, size, seq, pos: start, goal: start, squeeze: 1 };
}
function stateAt(p) {
  if (p.pos <= 0) return [p.seq[0], 0];
  const i = Math.min(p.seq.length - 1, Math.ceil(p.pos) - 1);
  return [p.seq[i], soft(clamp01(p.pos - i))];
}
function render(p) { const [s, t] = stateAt(p); apply(p.slot, s, t); }
function stepTime(p, i) {
  const own = modules.get(p.slot.id)?.durations?.[p.size];
  const v = Array.isArray(own) ? own[p.seq[i]] : own;
  const [lo, hi] = RANGE[p.size];
  const d = Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : DUR[p.size];
  // never longer than reading the step's own passage at 230 words a minute
  // ("Google's network needed 24." is read in a second), but not under the
  // size's shortest step
  const w = p.words?.[i];
  return w ? Math.max(lo, Math.min(d, w * 60 / 230)) : d;
}

const moving = new Set();
let jumped = true;          // the next update sets every figure at once (start, contents, address, resize)
let lastNow = 0;
let ran = false;            // root[data-moving] as last written
const instant = (slot) => printMode || reducedQuery.matches || !!frozen[slot.id];

// Called while measuring: gives the player its goal. `on`: the figure can be
// seen now; a figure that cannot is set at once, so nothing plays unseen and
// a figure that comes back into view never replays what it skipped.
function aim(p, goal, on) {
  if (goal !== p.goal) {
    p.goal = goal;
    let n = Math.ceil(Math.abs(goal - p.pos) - 1e-6);
    // up to three steps behind, each is played in turn (a fast flick does
    // not jump); more than three: set to the second-last, play the last
    if (n > 3 && p.size === 'large') { p.pos = goal - Math.sign(goal - p.pos); n = 1; }
    p.squeeze = Math.max(1, n);
    later(() => { p.slot.el.dataset.goal = String(goal); });   // read by tools/timing.mjs
  }
  if (!on || jumped || instant(p.slot)) p.pos = p.goal;
  if (p.pos !== p.goal) { moving.add(p); schedule(); } else moving.delete(p);
  later(() => render(p));
}

// One frame of playback; writes only (set() through apply()).
function advance(now) {
  if (!moving.size) return false;
  const dt = lastNow ? Math.min(0.1, Math.max(0, (now - lastNow) / 1000)) : 1 / 60;
  lastNow = now;
  for (const p of moving) {
    const dir = Math.sign(p.goal - p.pos);
    const i = dir > 0 ? Math.floor(p.pos) : Math.ceil(p.pos) - 1;   // the step [i, i + 1] being played
    const dur = Math.max(MIN_STEP, (dir > 0 ? stepTime(p, i) : BACK) / p.squeeze);
    // never past the end of this step in one frame: the next one starts at its own beginning
    p.pos = dir > 0 ? Math.min(p.goal, i + 1, p.pos + dt / dur) : Math.max(p.goal, i, p.pos - dt / dur);
    if (p.pos === p.goal) { moving.delete(p); p.squeeze = 1; }
    render(p);
  }
  return moving.size > 0;
}

// For the review tools: finish every step now (tools/read.mjs checks the
// state each passage leads to); the players, to read their positions.
window.__engine = {
  players: [],
  duration: (p, i) => stepTime(p, i),
  finish() { for (const p of moving) { p.pos = p.goal; p.squeeze = 1; render(p); } moving.clear(); markMoving(false); },
};
function markMoving(on) {
  if (on === ran) return;
  ran = on;
  if (on) root.dataset.moving = '1'; else delete root.dataset.moving;   // tools wait for it to go
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------
const scenes = [...document.querySelectorAll('.scene')].map((el) => {
  const passages = [...el.querySelectorAll('.passage')];
  // passages that follow one another with the same step are one step
  const seq = [];
  const words = [];
  const groupOf = passages.map((p, i) => {
    if (i === 0 || p.dataset.step !== passages[i - 1].dataset.step) { seq.push(Number(p.dataset.step)); words.push(0); }
    words[words.length - 1] += (p.textContent.match(/[\p{L}\p{N}]+/gu) || []).length;
    return seq.length - 1;
  });
  const slot = slots.find((s) => s.el === el.querySelector('[data-fig]'));
  const scene = {
    el, passages, groupOf, slot,
    stage: el.querySelector('.scene-stage'),
    text: el.querySelector('.scene-text'),
    kickers: [...el.querySelectorAll('.passage .where')],
    play: slot ? player(slot, 'large', seq.length ? seq : [0]) : null,
  };
  if (scene.play) { scene.play.words = words; window.__engine.players.push(scene.play); }
  if (slot) slot.scene = scene;
  for (const s of slots) if (s.role === 'seq' && el.contains(s.el)) s.scene = scene;
  return scene;
});
const figureSlots = slots.filter((s) => s.role === 'figure');
const seqSlots = slots.filter((s) => s.role === 'seq');
const breakouts = [...document.querySelectorAll('.breakout')];
const hero = document.querySelector('.hero');
for (const s of figureSlots) { s.play = player(s, 'medium', [0]); window.__engine.players.push(s.play); }

// A scene is told by scrolling. The figure is pinned for the whole scene and
// the passages scroll past it in the normal flow, each about a third of a
// window below the one before or its own height (35% under a figure pinned
// on top; article.css 2d), so that two or three are on screen together.
// A passage's step is due when its top passes the trigger line, which is
// where the reader finishes the passage before it:
//   - beside a pinned figure, 65% of the window: the reading line is at 50%
//     and the passages are 40% apart, so the passage before has its last
//     lines at the reading line then;
//   - under a figure pinned on top, the reading line is a fifth of the band
//     of text below the figure, the passages a pitch (60% of the band) apart;
//     the trigger is 40% of a pitch below that line. On a 390×844 phone that
//     is about 200 px under the figure: the passage before has slid a third
//     under the figure and its last lines are at the reading line, as beside
//     a figure. Before the figure is pinned, the band starts at most at 80%
//     of the window, so the first step is due once the figure is nearly
//     whole in the window.
// That passage becomes the active one at the same moment: it is set in full
// ink, the passages of steps left behind step back in colour (0.25 s, CSS),
// and its place (@where) is written at the figure. The step plays over its
// time, so it is complete as the reader begins the passage about it.
function lineUnder(scene, vh, floor) {
  return floor + Math.min(scene.pitch || Infinity, (vh - floor) * TOP_LINE);
}
function triggerLine(scene, vh) {
  if (sceneMode() === 'side') return vh * TRIGGER_AT;
  const floor = Math.max(0, Math.min(vh * 0.8, scene.stage.getBoundingClientRect().bottom));
  return Math.min(vh - 24, lineUnder(scene, vh, floor) + TOP_TRIGGER * (scene.pitch || vh * 0.3));
}

function updateScene(scene, vh) {
  const mode = modeOf(scene);
  if (mode === 'seq') return;
  const slot = scene.slot;
  const line = triggerLine(scene, vh);
  const rects = scene.passages.map((el) => el.getBoundingClientRect());
  const last = rects.length - 1;
  let k = 0;
  let begun = rects[0].top <= line + 0.5;
  for (let i = 0; i <= last; i++) { if (rects[i].top <= line + 0.5) k = i; else break; }
  // A short passage can leave the window (go under a figure pinned on top)
  // before the next one reaches the line; the next one then takes over.
  const stageR = scene.stage.getBoundingClientRect();
  const edge = mode === 'top' ? stageR.bottom : 0;
  // The first step is also due once 40% of the figure is in view, as for a
  // figure in the text: it is drawn as it comes in, and a figure that fills
  // a short window never scrolls in as an empty frame.
  const seen = (Math.min(stageR.bottom, vh) - Math.max(stageR.top, 0)) / Math.max(1, Math.min(stageR.height, vh));
  if (seen >= 0.4) begun = true;
  while (k < last && scene.passages[k].lastElementChild.getBoundingClientRect().bottom < edge + 12) { k++; begun = true; }
  const active = scene.passages[k];
  // The passages that follow it in the same step belong to what the figure
  // shows now: they are in full ink too, not dimmed as if still to come.
  let same = k;
  while (same < last && scene.passages[same + 1].dataset.step === active.dataset.step) same++;
  // Only a passage whose step the figure has left steps back (in colour);
  // under a figure pinned on top, one that has slid under it is hidden.
  later(() => scene.passages.forEach((el, i) => {
    el.classList.toggle('is-active', i === k);
    el.classList.toggle('is-current', i > k && i <= same);
    el.classList.toggle('is-read', i < k && el.dataset.step !== active.dataset.step);
    el.classList.toggle('is-under', mode === 'top' && i < k && rects[i].top < edge);
  }));

  // The place beside the figure. It is not shown while the same place is
  // written in the text on screen (the kicker above a passage), or when the
  // figure's own title opens with it ("United States · …"), so that it
  // never stands twice.
  slot.where = active.dataset.where || '';
  const head = (s) => s.split('·')[0].trim().toLowerCase();
  const title = slot.frame.querySelector('[data-role="title"]')?.textContent.trim() || '';
  const twice = (title.includes('·') && head(title) === head(slot.where)) || scene.kickers.some((el) => {
    if (el.textContent.trim() !== slot.where) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > edge && r.top < vh;
  });

  // Two scenes in a row are not cross-faded: a figure stays in full ink as
  // long as any of it is on screen, and leaves with its caption under it,
  // as a figure on paper does; the next one rises after that caption. (A
  // fade there left the caption under an empty box, 17 November.)
  const where = slot.where;
  later(() => {
    if (slot.whereEl.textContent !== where) slot.whereEl.textContent = where;
    slot.whereEl.classList.toggle('is-hidden', twice || !where);
  });

  // The goal: every step whose first passage has passed the trigger line.
  // Before the first one (and before 40% of the figure is in view), the
  // figure shows its first step at t 0, so a scene does not open on a
  // finished picture.
  aim(scene.play, begun ? scene.groupOf[k] + 1 : 0, stageR.bottom > 0 && stageR.top < vh);
}

// Where the figure of a scene is pinned and how long the scene runs on after
// its last passage (side by side only). The figure is pinned in the middle
// of the window. The text column ends with as much room as it takes for the
// last passage to reach the reading line and rest there for a third of a
// window before the figure is let go.
function sizeScenes() {
  const vh = innerHeight;
  for (const scene of scenes) {
    const st = scene.el.style;
    st.removeProperty('--stage-top');
    st.removeProperty('--pitch');
    st.removeProperty('--stage-h');
    scene.text.style.paddingBottom = '';
    scene.text.style.paddingTop = '';
    scene.stage.style.marginBottom = '';
    scene.text.style.marginTop = '';
    scene.pitch = 0;
    if (printMode) continue;
    // Side by side the caption follows the passages inside the scene. The
    // pinned figure lets go before the caption reaches it: a pinned box
    // stays inside its scene by its margin, so a lower margin as tall as the
    // caption ends the pin where the passages end. (Pinned on top the
    // caption stands right under the figure and scrolls under it.)
    const cap = scene.el.querySelector('.scene-caption');
    const mode = modeOf(scene);
    const capH = cap && cap.getClientRects().length && mode === 'side'
      ? cap.getBoundingClientRect().height + parseFloat(getComputedStyle(cap).marginTop) + 4 : 0;
    if (capH) scene.stage.style.marginBottom = `${Math.round(capH)}px`;
    if (mode === 'top') {
      // Under a figure pinned on top the passages share the band of text
      // below it: 60% of that band from one to the next (65% left a short
      // passage alone once the figure took at most 45% of the window), at
      // most 38% of the window and at least 26% of it, so that the active
      // one stands right under the figure (a fifth of the band down,
      // TOP_LINE) with the next one in view below it, and each step is drawn
      // over that pitch of scroll.
      const band = vh - scene.stage.getBoundingClientRect().height;
      // (never more than 22rem: on a tablet held upright 38% of the window
      // left one short passage alone in a band of paper)
      const rem = parseFloat(getComputedStyle(root).fontSize);
      scene.pitch = Math.round(Math.min(vh * 0.38, 22 * rem, Math.max(170, vh * 0.26, band * 0.6)));
      st.setProperty('--pitch', `${scene.pitch}px`);
      // a link or mark brought into view stops below the pinned figure
      st.setProperty('--stage-h', `${Math.round(scene.stage.getBoundingClientRect().height)}px`);
      continue;
    }
    if (mode !== 'side') continue;
    const stageH = scene.stage.getBoundingClientRect().height;
    const top = Math.max(16, (vh - stageH) / 2);
    st.setProperty('--stage-top', `${Math.round(top)}px`);
    // The first passage reaches the reading line once the figure stands
    // whole in the window, half way between coming in whole and its pinned
    // place: the passages start that far below the top of the scene. (Waiting
    // for the pin itself left a third of a window empty above the first
    // passage.) A figure that fills a short window only has to be whole in
    // the window, so that the next passage is in view below the first.
    const whole = Math.max(top, vh - stageH - 8);
    const settled = vh < 560 ? whole : (top + whole) / 2;
    const lead = Math.round(Math.max(0, vh * READ_AT - settled));
    if (lead) scene.text.style.paddingTop = `${lead}px`;
    // The figure is let go when the end of the scene reaches its lower edge.
    const lastH = scene.passages[scene.passages.length - 1].getBoundingClientRect().height;
    const room = top + stageH + vh * 0.36 - vh * READ_AT - lastH;
    scene.text.style.paddingBottom = `${Math.round(Math.max(0, room))}px`;
  }
}

// A figure in the text plays once a quarter of it is in view (a quarter of
// the window, for one taller than the window), so the reader sees it drawn
// as it comes in: 1.4 s a step. (At 40%, a figure taller than a short
// window scrolled in as an empty frame for half a window, 17 November.) It is not played again on the way back up unless it has left the
// window entirely in between. (Near the end of the page it plays when the
// page is scrolled to the end.)
function inView(r, vh) {
  const on = r.bottom > 0 && r.top < vh && r.height > 0;
  const share = on ? (Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.max(1, Math.min(r.height, vh)) : 0;
  return { on, due: on && (share >= MEDIUM_AT || scrollY >= maxScroll - 1) };
}
function updateFigure(slot, vh) {
  const p = slot.play;
  if (p.seq.length !== slot.steps) { p.seq = Array.from({ length: slot.steps }, (_, i) => i); p.pos = p.goal = Math.min(p.goal, slot.steps); }
  const { on, due } = inView(slot.frame.getBoundingClientRect(), vh);
  // a figure the reader has just unfolded is shown whole at once
  if (slot.whole) return aim(p, slot.steps, false);
  aim(p, !on ? 0 : due ? slot.steps : p.goal, on);
}

// The margin scene, pinned in the margin column (article.css 2b). Its state
// follows the markers in the text: when a marker passes the trigger line
// (65% of the window, as beside a scene), the figure changes from the state
// before into the marker's state over 0.9 s; scrolling back plays it back.
// It fades out while anything that runs through the margin column (a scene,
// a wide figure, a table) is beside or near it, and comes back after; while
// gone it is set at once.
const marginSlot = slots.find((s) => s.role === 'margin');
const marginMarks = [...document.querySelectorAll('.margin-mark:not(.margin-end)')];
const marginEnd = document.querySelector('.margin-end');
const railPin = document.querySelector('.rail-pin');
const stillSlots = slots.filter((s) => s.role === 'still');
const flowEls = [...document.querySelectorAll('main.body > *')]
  .filter((el) => !el.matches('.rail, .margin-mark, .margin-still, .where'));
if (marginSlot) {
  // position 1 is the first marker's state, complete; k is marker k's
  marginSlot.play = player(marginSlot, 'small', marginMarks.length ? marginMarks.map((m) => Number(m.dataset.state)) : [0], 1);
  window.__engine.players.push(marginSlot.play);
}
for (const s of stillSlots) { s.play = player(s, 'small', [s.state]); window.__engine.players.push(s.play); }

function updateMargin(vh) {
  if (!marginSlot || !marginSlot.handle || !railPin) return;
  const line = vh * TRIGGER_AT;
  let k = 0;
  marginMarks.forEach((m, i) => { if (i === k + 1 && m.getBoundingClientRect().top <= line) k = i; });

  // The fade is tied to the scroll, not to a clock: the figure is fully
  // gone 16 px before anything that crosses the margin column reaches it,
  // and fades over the 120 px of scroll before that, however fast one
  // scrolls. Coming back works the same way in reverse.
  const pin = railPin.getBoundingClientRect();
  let gap = Infinity;
  if (!frozen[marginSlot.id]) {
    for (const el of flowEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom < pin.top - 400 || r.top > pin.bottom + 400) continue;
      // a table is measured by what it draws, not by its frame
      const inner = el.matches('.table-frame') ? el.querySelector('table')?.getBoundingClientRect() || r : r;
      if (inner.right <= pin.left - 8) continue;
      gap = Math.min(gap, Math.max(r.top - pin.bottom, pin.top - r.bottom));
    }
  }
  // The end of the figure's story (":::margin <id> end") counts as something
  // that reaches from that point to the end of the page: the figure fades as
  // the point comes up to it and stays away below it.
  if (marginEnd && !frozen[marginSlot.id]) gap = Math.min(gap, marginEnd.getBoundingClientRect().top - pin.bottom);
  // Below the opening (the pin not yet stuck, low in the window under the
  // contents) it waits until it stands fully on screen.
  if (!frozen[marginSlot.id]) gap = Math.min(gap, vh - pin.bottom + 16);
  // nothing near (gap is Infinity): fully shown; clamp01 would give 0
  const op = gap === Infinity ? 1 : clamp01((gap - 16) / 120);
  aim(marginSlot.play, k + 1, op > 0 && pin.height > 0);
  later(() => {
    const o = op === 1 ? '1' : op.toFixed(3);
    if (railPin.style.opacity !== o) railPin.style.opacity = o;
    railPin.classList.toggle('is-away', op === 0);
  });
}

// Without the margin column the states are stills in the text. Each one
// plays from the state before it into its own (0.9 s) once a quarter of it
// is in view, as a figure in the text does; the first state is shown complete.
function updateStill(slot, vh) {
  if (!displayed(slot)) return;
  const first = slot.state === Number(marginMarks[0]?.dataset.state || 0);
  const { on, due } = inView(slot.frame.getBoundingClientRect(), vh);
  aim(slot.play, first ? 1 : !on ? 0 : due ? 1 : slot.play.goal, on && !first);
}

// The states of the margin scene are small stills at their markers. On wide
// windows a still stands in the margin column beside the block that follows
// it (article.css 2b). Where a scene or a wide figure runs through the margin
// at that height, the still goes into the text column instead.
const marginQuery = matchMedia('(min-width: 900px)');
const railQuery = matchMedia('(min-width: 900px) and (min-height: 420px)');   // as .rail in article.css 2b
function placeStills() {
  const stills = slots.filter((s) => s.role === 'still');
  for (const s of stills) { s.el.classList.remove('in-flow', 'as-block'); s.el.style.marginTop = ''; }
  if (printMode || railQuery.matches) return;
  const settle = () => {
    // A floated still with too little text beside it pushes the scene or
    // figure after it down and leaves a hole; it then stands as a block.
    for (const s of stills) {
      if (getComputedStyle(s.el).float === 'none') continue;
      const r = s.el.getBoundingClientRect();
      const next = breakouts.map((b) => b.getBoundingClientRect()).filter((q) => q.top >= r.top).sort((a, b) => a.top - b.top)[0];
      if (next && next.top - r.bottom < 40) {
        let prev = s.el.nextElementSibling;
        let bottom = r.top;
        while (prev && !prev.classList.contains('breakout')) { bottom = Math.max(bottom, prev.getBoundingClientRect().bottom); prev = prev.nextElementSibling; }
        if (next.top - bottom > 56) s.el.classList.add('as-block');
      }
    }
  };
  if (!marginQuery.matches) { settle(); return; }
  const rem = parseFloat(getComputedStyle(root).fontSize);
  const hits = (r, pad = 24) => breakouts.some((b) => {
    const q = b.getBoundingClientRect();
    return q.top < r.bottom + pad && q.bottom > r.top - pad;
  });
  // One at a time, top to bottom: a still that goes into the flow moves
  // everything below it.
  let prevBottom = -Infinity;
  for (const s of stills) {
    const r = s.el.getBoundingClientRect();
    if (!r.height) continue;
    if (hits(r)) {
      // A scene or wide figure starts beside it. The still may stand up to
      // 16rem higher, beside the end of the section before; if that is not
      // enough, it floats in the text column.
      const below = breakouts.map((b) => b.getBoundingClientRect()).filter((q) => q.top > r.top).sort((a, b) => a.top - b.top)[0];
      const up = below ? r.bottom + 28 - below.top : Infinity;
      const moved = { top: r.top - up, bottom: r.bottom - up };
      if (up > 0 && up <= 16 * rem && !hits(moved) && moved.top > prevBottom + 16) {
        s.el.style.marginTop = `${-Math.ceil(up)}px`;
      } else {
        s.el.classList.add('in-flow');
      }
    }
    const now = s.el.getBoundingClientRect();
    if (!s.el.classList.contains('in-flow')) prevBottom = now.bottom;
  }
  settle();
}

// Where the browser can tie an animation to the scroll itself (article.css
// 2c), the drift runs there, in step with the scroll; this is the fallback.
const cssDrift = typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: scroll()');
let heroY = -1;
function updateHero() {
  if (!hero || printMode || reducedQuery.matches || cssDrift) return;
  const capped = Math.min(scrollY, innerHeight * 1.5);
  if (capped === heroY) return;
  heroY = capped;
  const y = capped;
  // The field drifts a little more slowly than the line drawing over it.
  hero.querySelector('.hero-field').style.transform = `translate3d(0, ${(y * 0.09).toFixed(1)}px, 0)`;
  hero.querySelector('.hero-line').style.transform = `translate3d(0, ${(y * 0.035).toFixed(1)}px, 0)`;
}

// The art files carry empty paper around the drawing. The page sizes the
// hero by the drawing itself, so its bounds are read once from the pixels
// and handed to the stylesheet as fractions of the image.
async function fitHero() {
  if (!hero || hero.style.getPropertyValue('--bw')) return;   // measured at build time
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

// update() first measures everything, then changes everything. A change
// between two measurements would make the browser lay out the page again
// in the middle of a frame, which costs frames while scrolling. Measuring
// only sets the players' goals; playing them is writing.
const writes = [];
const later = (fn) => { writes.push(fn); };
let maxScroll = 0;
function update() {
  const vh = innerHeight;
  maxScroll = document.documentElement.scrollHeight - vh;
  for (const scene of scenes) if (scene.slot?.handle) updateScene(scene, vh);
  for (const slot of figureSlots) if (slot.handle) updateFigure(slot, vh);
  for (const slot of seqSlots) if (slot.handle && slot.last !== `${slot.state}:1`) later(() => apply(slot, slot.state, 1));
  for (const slot of stillSlots) if (slot.handle) updateStill(slot, vh);
  updateMargin(vh);
  jumped = performance.now() < settleUntil;
  const on = moving.size > 0;
  later(() => markMoving(on));
  for (const fn of writes.splice(0)) fn();
  updateHero();
}

// Scroll and resize only ask for a frame; the work happens once per frame:
// first the update (if the page moved), then one frame of every player
// that is moving. Frames are asked for only while something moves.
let asked = false;
let dirty = false;
function schedule() {
  if (asked) return;
  asked = true;
  requestAnimationFrame(onFrame);
}
function requestUpdate() { dirty = true; schedule(); }
function onFrame(now) {
  asked = false;
  // while a resize settles nothing is measured (the update after it does)
  if (dirty && !resizing) { dirty = false; update(); }
  if (advance(now)) schedule();
  else { lastNow = 0; markMoving(false); }
}

function mountAll() {
  layoutAll();
  jumped = true;                           // a new layout is shown as it is, not played into
  update();
}
// The layout without the update: mounts, folds, stills, the scenes' room.
function layoutAll() {
  decideScenes();
  for (const slot of slots) mount(slot);
  setFolds();
  placeStills();
  for (const slot of slots) mount(slot);   // a still that changed place has a new width
  // a still of a sequence, once cut to its step, is drawn again at its own size
  for (let pass = 0; pass < 2; pass++) {
    for (const slot of seqSlots) if (slot.regrow) { slot.regrow = false; slot.regrown = (slot.regrown || 0) + 1; unmount(slot); slot.key = ''; mount(slot); }
  }
  for (const slot of seqSlots) slot.regrown = 0;
  sizeScenes();
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

const SPANNERS = '.scene:not(.scene-column):not(.scene-web) > .scene-stage, .fig-wide, .table-frame.table-wide, .appendix';

// The blocks of the text in reading order, wrappers opened up.
function flowBlocks() {
  const out = [];
  (function walk(parent, inSources) {
    for (const el of parent.children) {
      if (el.matches('.rail, .margin-mark, .scene-caption, .seq-still, .table-hint, .scene-web > .scene-stage')) continue;
      if (el.matches('.scene, .scene-text, .passage')) walk(el, inSources);
      else if (el.matches('.sources, .src-fold, .src-list')) walk(el, true);
      else if (el.matches(SPANNERS)) out.push({ el, span: true });
      else out.push({ el, head: el.matches('h2, h3, .where, summary'), fixed: inSources, solid: el.matches('figure, .table-frame, .scene-stage') });
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

// The list of sources folds on screen (article.css); paper shows it whole.
const srcFold = document.querySelector('.src-fold');
let foldOnScreen = null;   // whether it was open on screen before print mode
function foldForPrint(on) {
  for (const f of [...figFolds, ...textFolds]) {
    if (on) { if (f.screenOpen === undefined) f.screenOpen = f.el.open; f.el.open = true; }
    else if (f.screenOpen !== undefined) { f.el.open = f.screenOpen; delete f.screenOpen; }
  }
  if (!srcFold) return;
  if (on) { if (foldOnScreen === null) foldOnScreen = srcFold.open; srcFold.open = true; }
  else if (foldOnScreen !== null) { srcFold.open = foldOnScreen; foldOnScreen = null; }
}

// A figure marked "fold" (":::figure <id> wide fold …") is folded behind its
// switch on phones and wherever it is taller than the window; elsewhere it
// is open. Once the reader has used the switch, the page leaves it alone.
// ":::details" blocks: closed on screen, open on paper (foldForPrint).
const textFolds = [...document.querySelectorAll('.text-fold')].map((el) => ({ el }));
const figFolds = [...document.querySelectorAll('.fig-fold')].map((el) => ({
  el, slot: slots.find((s) => s.el === el.closest('[data-fig]')), user: false,
}));
const phoneQuery = matchMedia('(max-width: 699.98px)');
function setFolds() {
  if (printMode) return;
  for (const f of figFolds) {
    if (f.user || !f.slot) continue;
    let fold = phoneQuery.matches;
    if (!fold) {
      // measured open, at the size it would have
      if (!f.el.open) { f.el.open = true; mount(f.slot); }
      fold = f.slot.frame.getBoundingClientRect().height > innerHeight;
    }
    if (f.el.open === fold) { f.el.open = !fold; mount(f.slot); }
  }
}
for (const f of figFolds) {
  f.el.querySelector('summary')?.addEventListener('click', () => { f.user = true; });
  // drawn when opened, let go when closed; the page below moves, so the
  // scenes are measured again
  // (opened by the reader, it is shown whole at once, at the width of a wide
  // figure; the frame is sized again before it is drawn)
  f.el.addEventListener('toggle', () => {
    if (printMode || !f.slot) return;
    f.slot.whole = f.user && f.el.open;
    mount(f.slot); sizeScenes(); requestUpdate();
  });
}

// A link or address that points into the list (#sources, #src-12) opens it.
function openForHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!srcFold || !/^(sources|src-\d+)$/.test(id)) return;
  const target = document.getElementById(id);
  if (!target || !srcFold.contains(target) && id !== 'sources') return;
  if (!srcFold.open) {
    srcFold.open = true;
    requestAnimationFrame(() => target.scrollIntoView());
  }
}

function setPrintMode(on) {
  if (on === printMode) return;
  printMode = on;
  foldForPrint(on);
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
  popMark.removeAttribute('aria-controls');
  if (returnFocus) popMark.focus();
  pop = null; popMark = null;
}

function openPopover(mark) {
  closePopover();
  const nums = mark.dataset.nums.split(' ');
  pop = document.createElement('div');
  pop.className = 'src-pop';
  pop.id = 'src-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-labelledby', 'src-pop-head');
  pop.tabIndex = -1;
  // a label, not a heading: the popover is no section of the page
  const head = document.createElement('p');
  head.className = 'src-pop-head';
  head.id = 'src-pop-head';
  head.textContent = nums.length === 1 ? 'Source for this passage' : `${nums.length} sources for this passage`;
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
  // Right after its mark, so that the tab order runs from the mark into the
  // popover and on to the text after it.
  mark.after(pop);

  // Under the mark, kept inside the window; above it if there is no room
  // below. Placed in the window's coordinates, then made relative to the
  // box it is positioned in.
  const r = mark.getBoundingClientRect();
  const w = pop.offsetWidth;
  const h = pop.offsetHeight;
  const edge = 12;
  const docW = root.clientWidth;
  const left = Math.max(edge, Math.min(r.left - 14, docW - w - edge));
  const below = innerHeight - r.bottom;
  const top = below < h + 16 && r.top > h + 16 ? r.top - h - 8 : r.bottom + 8;
  const ref = pop.offsetParent && pop.offsetParent !== document.body ? pop.offsetParent.getBoundingClientRect() : { left: -scrollX, top: -scrollY };
  pop.style.left = `${left - ref.left}px`;
  pop.style.top = `${top - ref.top}px`;

  popMark = mark;
  mark.setAttribute('aria-expanded', 'true');
  mark.setAttribute('aria-controls', 'src-pop');
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
// A table is named by what stands right before it, a paragraph that opens
// with a bold lead ("**Over noise levels.**"), or else by its heading.
function tableName(frame) {
  for (let el = frame.previousElementSibling; el; el = el.previousElementSibling) {
    if (el.matches('h2, h3')) return `Table: ${(el.querySelector('.sec-title') || el).textContent.trim()}`;
    const lead = el === frame.previousElementSibling && el.matches('p') && el.firstElementChild?.matches('strong') && el.firstChild === el.firstElementChild ? el.firstElementChild : null;
    if (lead) return `Table: ${lead.textContent.trim().replace(/[.:]$/, '')}`;
    if (!el.matches('p, .where, .margin-mark, .margin-still')) break;
  }
  return 'Table';
}

function markTables() {
  for (const frame of document.querySelectorAll('.table-frame')) {
    const scrolls = !printMode && frame.scrollWidth > frame.clientWidth + 1;
    // The right edge fades while there is more of the table to the right, so
    // a column cut by the frame never looks like a broken number.
    const edge = () => frame.classList.toggle('at-end', frame.scrollLeft + frame.clientWidth >= frame.scrollWidth - 2);
    frame.classList.toggle('scrolls', scrolls);
    if (scrolls) edge();
    if (!frame.dataset.edge) { frame.dataset.edge = '1'; frame.addEventListener('scroll', edge, { passive: true }); }
    let hint = frame.nextElementSibling;
    if (!hint?.classList.contains('table-hint')) hint = null;
    if (scrolls && !hint) {
      hint = document.createElement('p');
      hint.className = 'table-hint';
      hint.textContent = 'The table scrolls sideways →';
      frame.after(hint);
      frame.tabIndex = 0;
      frame.setAttribute('role', 'region');
      frame.setAttribute('aria-label', `${tableName(frame)}, scrolls sideways`);
    } else if (!scrolls && hint) {
      hint.remove();
      frame.removeAttribute('tabindex');
      frame.removeAttribute('role');
      frame.removeAttribute('aria-label');
    }
  }
}

// Each source mark shows the numbers of its sources, as in the list at the
// end and in print ([3, 7]); the builder writes only how many there are.
function numberMarks() {
  for (const mark of document.querySelectorAll('.src-mark')) {
    const nums = (mark.dataset.nums || '').split(' ').filter(Boolean);
    const count = mark.querySelector('.src-count');
    if (!nums.length || !count) continue;
    count.textContent = nums.join(',');
    mark.setAttribute('aria-label', `${nums.length === 1 ? 'Source' : 'Sources'} ${nums.join(', ')}`);
  }
}

// What the reader is reading. In a scene told by scrolling it is the active
// passage, and where its top stands against the trigger line; elsewhere the
// block at the reading line (the middle of the window) and how far into it
// the line is. It is noted once the scroll rests, never while a resize is
// under way. After a resize or a turn of the device the page is brought
// back once, when the new layout has settled: an active passage becomes the
// active passage again under the new layout's trigger line (under a figure
// pinned on top that line is below the figure, not the middle of the
// window), any other block comes back to the reading line.
const ANCHORS = '.passage, main.body > :not(.scene, .rail, .margin-mark, .margin-still, .appendix, .sources), .appendix > *, .src-list > li';
let anchor = null;
let anchorTimer = 0;
let resizing = false;
let settleUntil = 0;        // until then every update sets the figures at once (the page's own correction)
const sceneOf = (el) => scenes.find((sc) => sc.el.contains(el));
// the line a passage's top must have passed to be the active one, in the current layout
function activeLine(scene, vh) { return modeOf(scene) === 'seq' ? vh * READ_AT : triggerLine(scene, vh); }
function noteAnchor() {
  if (printMode || resizing) return;
  const vh = innerHeight;
  const line = vh * READ_AT;
  anchor = null;
  for (const el of document.querySelectorAll(ANCHORS)) {
    const r = el.getBoundingClientRect();
    if (!r.height || r.bottom <= line) continue;
    anchor = { el, f: r.top <= line ? (line - r.top) / r.height : null, px: line - r.top };
    break;
  }
  // in a scene: the passage the figure is showing, not the one at the middle
  const scene = anchor && anchor.el.matches('.passage') ? sceneOf(anchor.el) : null;
  if (!scene) return;
  const act = modeOf(scene) === 'seq' ? anchor.el : scene.passages.find((q) => q.classList.contains('is-active')) || anchor.el;
  anchor = { el: act, scene, off: (activeLine(scene, vh) - act.getBoundingClientRect().top) / vh };
}
function keepAnchor() { clearTimeout(anchorTimer); anchorTimer = setTimeout(noteAnchor, 150); }
function anchorDelta() {
  const r = anchor.el.getBoundingClientRect();
  if (!r.height) return 0;
  const vh = innerHeight;
  if (!anchor.scene) {
    const line = vh * READ_AT;
    return Math.round(r.top - (anchor.f !== null ? line - anchor.f * r.height : line - anchor.px));
  }
  // the passage's top a little above the trigger line, as it was, but never
  // so far that the next passage passes the line too, nor so far that its
  // words go under a figure pinned on top
  const { scene } = anchor;
  const line = activeLine(scene, vh);
  const i = scene.passages.indexOf(anchor.el);
  const next = scene.passages[i + 1];
  const gap = next ? next.getBoundingClientRect().top - r.top : Infinity;
  let off = Math.max(8, anchor.off * vh);
  off = Math.min(off, gap - 12);
  if (modeOf(scene) === 'top') {
    const words = anchor.el.lastElementChild?.getBoundingClientRect().bottom ?? r.bottom;
    const floor = Math.max(0, scene.stage.getBoundingClientRect().height);
    // its last line at least 48 px below the figure
    off = Math.min(off, line + (words - r.top) - floor - 48);
  }
  if (modeOf(scene) === 'seq') off = Math.min(off, vh * 0.4);
  return Math.round(r.top - (line - Math.max(4, off)));
}
function restoreAnchor() {
  if (!anchor || printMode || !anchor.el.isConnected) return;
  // twice: a figure pinned on top sets its trigger line by where it stands,
  // which the first correction can change; both happen before the next frame
  for (let i = 0; i < 2; i++) {
    const dy = anchorDelta();
    if (!dy) break;
    scrollBy(0, dy);
  }
}

// Short hyphenated names ("T-Mobile", "J-curve": two parts of letters or
// digits, at most 14 characters) are not broken at their hyphen on screen
// (.nobr). Done here once the fonts are in, not in the built page: a word
// in its own element splits the paragraph's text, and every later piece
// counts as moved when the fonts arrive and the lines are set again.
// Not in links, code, figures or source marks, nor inside an address.
const NOBR = /(?<![\p{L}\p{N}\-/.:@_])([\p{L}\p{N}]+-[\p{L}\p{N}]+)(?![\p{L}\p{N}\-/_@]|\.[\p{L}\p{N}])/gu;
function holdHyphens() {
  const skip = 'a, code, pre, svg, script, style, button, .src, .nobr, .vh';
  for (const scope of document.querySelectorAll('.title-block, main.body')) {
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.data.includes('-') && !n.parentElement.closest(skip) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parts = [];
      let at = 0;
      for (const m of node.data.matchAll(NOBR)) {
        if (m[0].length > 14) continue;
        parts.push(node.data.slice(at, m.index));
        const span = document.createElement('span');
        span.className = 'nobr';
        span.textContent = m[0];
        parts.push(span);
        at = m.index + m[0].length;
      }
      if (!parts.length) continue;
      parts.push(node.data.slice(at));
      node.replaceWith(...parts.filter((p) => p !== ''));
    }
  }
}

async function start() {
  // On phones and short windows the section list starts folded, first of
  // all, so the page does not move once shown (.toc-fold in the CSS; the
  // same condition).
  const fold = document.querySelector('.toc-fold');
  if (fold && matchMedia('(max-width: 639.98px), (max-height: 499.98px)').matches) fold.open = false;
  numberMarks();
  // The list of sources starts folded on screen; addressed directly, it opens.
  if (srcFold && !PRINT_PREVIEW) srcFold.open = false;
  openForHash();
  addEventListener('hashchange', openForHash);
  // A jump (the contents, a link into the page, a new address) sets the
  // figures where it lands at once, without playing the steps skipped.
  const jump = () => { jumped = true; requestUpdate(); };
  addEventListener('hashchange', jump);
  document.addEventListener('click', (e) => { if (e.target.closest?.('a[href^="#"]:not(.src-mark)')) jump(); }, true);
  // Figures measure their lettering when they are drawn: the text and mono
  // faces are awaited first, but never for more than 300 ms.
  const fontsIn = document.fonts?.load
    ? Promise.race([
      Promise.all(['400 1em "Libre Franklin"', '500 1em "JetBrains Mono"', 'italic 400 1em "Newsreader"'].map((f) => document.fonts.load(f).catch(() => null))),
      new Promise((ok) => setTimeout(ok, 300)),
    ]) : null;
  // Every figure is requested at once, its module and data together, and
  // each is drawn as soon as it is in; the page does not wait for the slowest.
  let live = false;
  let settle = 0;
  const arrived = (id) => {
    if (!live) return;
    decideScenes(id);
    for (const slot of slots) if (slot.id === id) mount(slot);
    // the stills, the scenes' room and the margin are set once per frame for all that came in
    if (!settle) settle = requestAnimationFrame(() => { settle = 0; placeStills(); for (const s of slots) mount(s); sizeScenes(); update(); });
  };
  const loads = [...new Set(slots.map((s) => s.id))].map((id) => load(id).then(() => arrived(id)));
  await (fontsIn || null);
  if (PRINT_PREVIEW) { printMode = true; foldForPrint(true); applyMedia(true); }
  await fitHero();
  for (const scene of scenes) scene.el.classList.add('is-live');
  live = true;
  mountAll();
  await Promise.all(loads);
  if (settle) { cancelAnimationFrame(settle); settle = 0; }
  mountAll();
  if (printMode) document.fonts.ready.then(arrangeForPrint);

  markTables();

  addEventListener('scroll', () => { if (resizing) return; requestUpdate(); keepAnchor(); }, { passive: true });
  keepAnchor();
  let resizeTimer = 0;
  // A new size or orientation can mean another layout: frames are sized
  // again, and a figure whose layout changes is destroyed and mounted anew.
  // While the window is being resized nothing is measured or played: the
  // figures keep what they show. Once the resizes have stopped (180 ms) the
  // page is laid out, the figures redraw at their new width (fig.js, 120 ms
  // later), and then, once, the passage the reader was at is brought back
  // and every figure is set where it lands, at once. The scroll events of
  // that correction set the figures at once too: nothing replays or flips.
  const settled = () => {
    sizeScenes();
    restoreAnchor();
    resizing = false;
    settleUntil = performance.now() + 400;
    jumped = true;
    update();
    keepAnchor();
  };
  const relayout = () => {
    resizing = true;
    clearTimeout(anchorTimer);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      closePopover(); layoutAll(); markTables();
      resizeTimer = setTimeout(() => requestAnimationFrame(settled), 200);
    }, 180);
  };
  addEventListener('resize', relayout);
  addEventListener('orientationchange', relayout);
  screen.orientation?.addEventListener?.('change', relayout);
  reducedQuery.addEventListener('change', mountAll);
  document.fonts?.ready.then(holdHyphens);
  document.fonts?.ready.then(() => requestAnimationFrame(() => {
    // lettering measured before the fonts arrived may have had another width
    // (one frame later: fig.js redraws its own figures when the fonts arrive)
    crops.clear();
    ratios.clear();
    // a figure measured before then may now fit on top, or no longer
    if (decideScenes()) { layoutAll(); requestUpdate(); return; }
    for (const s of slots) if (s.handle && (s.role === 'scene' || s.role === 'seq')) { s.cropKey = ''; applyCrop(s); }
    sizeScenes(); requestUpdate();
  }));

  // Ctrl+P: switch to print mode before the browser lays out the pages.
  addEventListener('beforeprint', () => setPrintMode(true));
  addEventListener('afterprint', () => setPrintMode(PRINT_PREVIEW));

  // A frozen figure is what the reviewer wants to see: bring it into view.
  const first = slots.find((s) => frozen[s.id] && s.role !== 'still' && s.handle);
  if (first) first.frame.scrollIntoView({ block: 'center' });


  root.dataset.ready = '1';   // tools/shots.mjs waits for this
}

start();
