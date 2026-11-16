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
  where: el.dataset.where || '',                       // the place the text is about here (@where)
  whereEl: el.querySelector('.fig-where'),             // its label beside a pinned figure
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
    if (sceneMode() === 'side') height = Math.min(vh * 0.78, vh - 9 * rem);
    else height = Math.max(180, vh - 4 * 1.62 * 1.06 * rem - 7 * rem);
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
  if (slot.whereEl) slot.whereEl.style.width = slot.frame.style.width;   // the label lines up with the drawing's left edge
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
    get where() { return slot.where; },
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
  slot.el.dataset.shown = sig;                        // read by tools/read.mjs
  try { slot.handle.set(step, t); } catch (err) { console.warn(`figure "${slot.id}" set(${step}, ${t}) failed:`, err); }
}

// ---------------------------------------------------------------------------
// Scroll -> (step, t)
// ---------------------------------------------------------------------------
const scenes = [...document.querySelectorAll('.scene')].map((el) => ({
  el,
  stage: el.querySelector('.scene-stage'),
  passages: [...el.querySelectorAll('.passage')],
  text: el.querySelector('.scene-text'),
  kickers: [...el.querySelectorAll('.passage .where')],
  slot: slots.find((s) => s.el === el.querySelector('[data-fig]')),
}));
const figureSlots = slots.filter((s) => s.role === 'figure');
const breakouts = [...document.querySelectorAll('.breakout')];
const hero = document.querySelector('.hero');

// A scene is told by scrolling. The figure is pinned for the whole scene and
// the passages scroll past it in the normal flow, each about 45% of a window
// below the one before (35% under a figure pinned on top; article.css 2d), so
// that two or three are on screen together. The passage whose top has last
// passed the reading line is the active one: it is set in full ink, its step
// is shown, and its place (@where) is written at the figure.
// The drawing follows the scroll: t is 0 when the passage's top reaches the
// line and 1 when it has travelled 65% of the way to the next passage; then
// the figure rests until the next step begins. Scrolling back runs it
// backwards. Nothing here depends on time.
const READ_AT = 0.4;        // the reading line beside a pinned figure, as a share of the window height
function readingLine(scene, vh) {
  if (sceneMode() === 'side') return vh * READ_AT;
  // under a figure pinned on top: 40% down the band of text below it
  const floor = Math.max(0, Math.min(vh * 0.8, scene.stage.getBoundingClientRect().bottom));
  return floor + (vh - floor) * 0.4;
}

function updateScene(scene, vh) {
  const mode = sceneMode();
  if (mode === 'seq') return;
  const slot = scene.slot;
  const line = readingLine(scene, vh);
  const rects = scene.passages.map((el) => el.getBoundingClientRect());
  const last = rects.length - 1;
  let k = 0;
  for (let i = 0; i <= last; i++) { if (rects[i].top <= line + 0.5) k = i; else break; }
  // A short passage can leave the window (go under a figure pinned on top)
  // before the next one reaches the line; the next one then takes over, and
  // its step begins when it reaches the line.
  const edge = mode === 'top' ? scene.stage.getBoundingClientRect().bottom : 0;
  while (k < last && scene.passages[k].lastElementChild.getBoundingClientRect().bottom < edge + 12) k++;
  const pitch = k < last ? rects[k + 1].top - rects[k].top : rects[k].height;
  const active = scene.passages[k];
  scene.passages.forEach((el, i) => el.classList.toggle('is-active', i === k));

  // The place beside the figure. It is not shown while the same place is
  // written in the text on screen (the kicker above a passage), so that it
  // never stands twice.
  slot.where = active.dataset.where || '';
  if (slot.whereEl.textContent !== slot.where) slot.whereEl.textContent = slot.where;
  const floor = mode === 'top' ? scene.stage.getBoundingClientRect().bottom : 0;
  const twice = scene.kickers.some((el) => {
    if (el.textContent.trim() !== slot.where) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > floor && r.top < vh;
  });
  slot.whereEl.classList.toggle('is-hidden', twice || !slot.where);

  // The first passage arrives together with the figure: its step is complete
  // from the start. A passage that continues the step of the one before it
  // does not play that step a second time.
  const step = Number(active.dataset.step);
  const held = k === 0 || Number(scene.passages[k - 1].dataset.step) === step;
  apply(slot, step, held ? 1 : (line - rects[k].top) / Math.max(1, pitch * 0.65));
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
    scene.text.style.paddingBottom = '';
    if (printMode) continue;
    if (sceneMode() === 'top') {
      // Under a figure pinned on top the passages share the band of text
      // below it: about half of that band from one to the next, at most 35% of the
      // window, so that two are in view.
      const band = vh - scene.stage.getBoundingClientRect().height;
      st.setProperty('--pitch', `${Math.round(Math.min(vh * 0.35, Math.max(150, band * 0.52)))}px`);
      continue;
    }
    if (sceneMode() !== 'side') continue;
    const stageH = scene.stage.getBoundingClientRect().height;
    const top = Math.max(16, (vh - stageH) / 2);
    st.setProperty('--stage-top', `${Math.round(top)}px`);
    // The figure is let go when the end of the scene reaches its lower edge.
    const lastH = scene.passages[scene.passages.length - 1].getBoundingClientRect().height;
    const room = top + stageH + vh / 3 - vh * READ_AT - lastH;
    scene.text.style.paddingBottom = `${Math.round(Math.max(0, room))}px`;
  }
}

// A figure in the text assembles with the scroll as it enters: t is 0 when
// its top is at 85% of the window height and 1 when it is at 45%; then it
// rests. A figure with several steps runs through them over the same way.
function updateFigure(slot, vh) {
  const top = slot.frame.getBoundingClientRect().top;
  const p = clamp01((vh * 0.85 - top) / (vh * 0.4));
  if (p >= 1) return apply(slot, slot.steps - 1, 1);
  const x = p * slot.steps;
  apply(slot, Math.floor(x), x - Math.floor(x));
}

// The states of the margin scene are small stills at their markers. On wide
// windows a still stands in the margin column beside the block that follows
// it (article.css 2b). Where a scene or a wide figure runs through the margin
// at that height, the still goes into the text column instead.
const marginQuery = matchMedia('(min-width: 1180px)');
function placeStills() {
  const stills = slots.filter((s) => s.role === 'still');
  for (const s of stills) { s.el.classList.remove('in-flow', 'as-block'); s.el.style.marginTop = ''; }
  if (printMode) return;
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
  placeStills();
  for (const slot of slots) mount(slot);   // a still that changed place has a new width
  sizeScenes();
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
      else out.push({ el, head: el.matches('h2, h3, .where'), fixed: inSources, solid: el.matches('figure, .table-frame') });
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
  document.fonts?.ready.then(() => { sizeScenes(); requestUpdate(); });

  // Ctrl+P: switch to print mode before the browser lays out the pages.
  addEventListener('beforeprint', () => setPrintMode(true));
  addEventListener('afterprint', () => setPrintMode(PRINT_PREVIEW));

  // A frozen figure is what the reviewer wants to see: bring it into view.
  const first = slots.find((s) => frozen[s.id] && s.role !== 'still' && s.handle);
  if (first) first.frame.scrollIntoView({ block: 'center' });

  root.dataset.ready = '1';   // tools/shots.mjs waits for this
}

start();
