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
// Tablets held upright (700 to 999 px wide) read a scene as a sequence:
// pinned above the passages, a drawing there left an empty band and text
// showing through behind it; phones held upright keep the pinned figure.
const MODES = {
  side: matchMedia('(min-width: 1000px) and (min-height: 560px), (min-width: 640px) and (min-height: 450px) and (max-height: 559.98px)'),     // figure pinned beside the passages
  top: matchMedia('(max-width: 699.98px) and (min-height: 560px)'),    // figure pinned above them
};                                                                     // neither: a sequence of stills
const sceneMode = () => (MODES.side.matches ? 'side' : MODES.top.matches ? 'top' : 'seq');

// No lettering in a figure is shown under 11.5 px. A layout is only given a
// frame in which its smallest lettering, as the drawing sets it, reaches
// that size: the frame must be at least (drawing width × 11.5 / smallest
// font size) wide. Both are read once per figure and layout from a copy
// drawn off screen at a size where nothing is lifted by fig.js's own floor.
const LETTER_PX = 11.5;
const fits = new Map();      // 'id|layout' -> smallest frame width in px
const TALL_MAX = 432;        // a 'tall' drawing (about 360 units wide) is not blown up beyond this
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
  // A still of a scene read as a sequence: at most 85% of the window high.
  if (slot.role === 'seq') height = innerHeight * 0.85;
  // A figure in the text column may reach to the right of the column where
  // its lettering needs it: as far as the page, or up to the margin column.
  if (slot.role === 'figure' && !slot.wide) {
    const main = slot.el.parentElement;
    const cs = getComputedStyle(main);
    let room = main.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const rail = document.querySelector('.rail');
    if (rail?.getClientRects().length) room = Math.min(room, rail.getBoundingClientRect().left - slot.el.getBoundingClientRect().left - 8);
    width = Math.max(base, room);
  }
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
  if (slot.role === 'scene' && sceneMode() === 'top') {
    const fit = Math.min(width, height * aspect('tall'), innerHeight * 0.5 * aspect('tall'), 560);
    // but never so small that its lettering falls under 11.5 px
    return { layout: 'tall', width: Math.min(width, height * aspect('tall'), Math.max(fit, fitWidth(slot, mod, 'tall'))) };
  }
  // wide where its lettering can be read at the size the room allows (a
  // figure in the text column takes more than the column only if it must)
  const need = fitWidth(slot, mod, 'wide');
  let wide = Math.min(width, height * aspect('wide'));
  if (slot.role === 'figure' && !slot.wide) wide = Math.min(wide, Math.max(base, need));
  if (wide >= need) return { layout: 'wide', width: wide };
  // else tall; outside a pinned scene the lettering wins over the height
  // the figure is given (a still may then stand taller than 85% of the window)
  let tall = Math.min(base, height * aspect('tall'), TALL_MAX);
  if (slot.role !== 'scene') tall = Math.min(width, Math.max(tall, fitWidth(slot, mod, 'tall')));
  return { layout: 'tall', width: tall };
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
  const mod = modules.get(slot.id);
  const { layout, width } = sizeOf(slot, mod);
  // The width can change without a new mount; the layout cannot.
  slot.frame.style.width = width ? `${Math.floor(width)}px` : '';
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
const DRAWN = 'text, circle, ellipse, rect, line, path, polyline, polygon, image, use';
function seen(el, svg) {
  for (let a = el; a && a !== svg; a = a.parentElement) {
    const cs = getComputedStyle(a);
    if (cs.display === 'none' || parseFloat(cs.opacity) < 0.05) return false;
    if (a === el && (cs.visibility === 'hidden' || (cs.fill === 'none' && cs.stroke === 'none'))) return false;
  }
  return !el.closest('defs, clipPath, mask, marker, pattern, symbol');
}
function measureCrop(slot, only = null) {
  const svg = slot.frame.querySelector('svg');
  const vb = svg?.viewBox?.baseVal;
  if (!svg || !vb?.width || !slot.handle) return null;
  const box = svg.getBoundingClientRect();
  if (!box.width) return null;
  const k = vb.width / box.width;                     // drawing units per px
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let s = 0; s < slot.steps; s++) {
    if (only !== null && s !== only) continue;
    try { slot.handle.set(s, 1); } catch { continue; }
    for (const el of svg.querySelectorAll(DRAWN)) {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      if (!seen(el, svg)) continue;
      x0 = Math.min(x0, (r.left - box.left) * k); x1 = Math.max(x1, (r.right - box.left) * k);
      y0 = Math.min(y0, (r.top - box.top) * k); y1 = Math.max(y1, (r.bottom - box.top) * k);
    }
  }
  slot.last = '';                                     // the next update() puts the real state back
  if (!(x1 > x0 && y1 > y0)) return null;
  // in the viewBox's own coordinates; nothing outside it counts (below it,
  // what the figure declares as its content height does)
  const h = Math.max(vb.height, parseFloat(svg.dataset.contentH) || 0);
  return {
    x0: vb.x + Math.max(0, x0), x1: vb.x + Math.min(vb.width, x1),
    y0: vb.y + Math.max(0, y0), y1: vb.y + Math.min(h, y1),
    top: vb.y, w: vb.width, h,
  };
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
    // that room under its frame, so a caption or a pinned edge never lies on it.
    const vb = svg?.viewBox?.baseVal;
    const ch = parseFloat(svg?.dataset.contentH);
    fs.marginBottom = !printMode && vb?.height && ch > vb.height
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
  fs.setProperty('--aspect', (w / (bottom - top)).toFixed(4));
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
// line and 1 when it has travelled half the way to the next passage; then
// the figure rests until the next step begins. Scrolling back runs it
// backwards. Nothing here depends on time.
const READ_AT = 0.5;        // the reading line beside a pinned figure, as a share of the window height
function readingLine(scene, vh) {
  if (sceneMode() === 'side') return vh * READ_AT;
  // under a figure pinned on top: one pitch below the figure (at most 40% of
  // the band of text), so the active passage is the one right under it and
  // stays there for its whole step; the one before has slid under the figure
  const floor = Math.max(0, Math.min(vh * 0.8, scene.stage.getBoundingClientRect().bottom));
  return floor + Math.min(scene.pitch || Infinity, (vh - floor) * 0.4);
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
  // written in the text on screen (the kicker above a passage), so that it
  // never stands twice.
  slot.where = active.dataset.where || '';
  const floor = mode === 'top' ? scene.stage.getBoundingClientRect().bottom : 0;
  const twice = scene.kickers.some((el) => {
    if (el.textContent.trim() !== slot.where) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > floor && r.top < vh;
  });
  const where = slot.where;
  later(() => {
    if (slot.whereEl.textContent !== where) slot.whereEl.textContent = where;
    slot.whereEl.classList.toggle('is-hidden', twice || !where);
  });

  // The first passage arrives together with the figure: its step is complete
  // from the start. A passage that continues the step of the one before it
  // does not play that step a second time.
  const step = Number(active.dataset.step);
  const held = k === 0 || Number(scene.passages[k - 1].dataset.step) === step;
  const t = held ? 1 : (line - rects[k].top) / Math.max(1, pitch * 0.5);
  later(() => apply(slot, step, t));
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
    scene.stage.style.marginBottom = '';
    scene.text.style.marginTop = '';
    scene.pitch = 0;
    if (printMode) continue;
    // The caption follows the passages inside the scene. The pinned figure
    // lets go before the caption reaches it: a pinned box stays inside its
    // scene by its margin, so a lower margin as tall as the caption ends the
    // pin where the passages end. (Above the passages, the text column takes
    // the same margin back, so nothing moves.)
    const cap = scene.el.querySelector('.scene-caption');
    const capH = cap && cap.getClientRects().length && sceneMode() !== 'seq'
      ? cap.getBoundingClientRect().height + parseFloat(getComputedStyle(cap).marginTop) + 4 : 0;
    if (capH) {
      scene.stage.style.marginBottom = `${Math.round(capH)}px`;
      if (sceneMode() === 'top') scene.text.style.marginTop = `${-Math.round(capH)}px`;
    }
    if (sceneMode() === 'top') {
      // Under a figure pinned on top the passages share the band of text
      // below it: about a third of that band from one to the next, at most
      // 35% of the window, so that the active one stands right under the
      // figure and the next one or two are in view below it.
      const band = vh - scene.stage.getBoundingClientRect().height;
      scene.pitch = Math.round(Math.min(vh * 0.35, Math.max(150, band * 0.36)));
      st.setProperty('--pitch', `${scene.pitch}px`);
      // a link or mark brought into view stops below the pinned figure
      st.setProperty('--stage-h', `${Math.round(scene.stage.getBoundingClientRect().height)}px`);
      continue;
    }
    if (sceneMode() !== 'side') continue;
    const stageH = scene.stage.getBoundingClientRect().height;
    const top = Math.max(16, (vh - stageH) / 2);
    st.setProperty('--stage-top', `${Math.round(top)}px`);
    // The figure is let go when the end of the scene reaches its lower edge.
    const lastH = scene.passages[scene.passages.length - 1].getBoundingClientRect().height;
    const room = top + stageH + vh * 0.36 - vh * READ_AT - lastH;
    scene.text.style.paddingBottom = `${Math.round(Math.max(0, room))}px`;
  }
}

// A figure in the text assembles with the scroll before it is read: t is 0
// when its top is 1.3 window heights below the top of the window (a third
// of a window before it comes into view) and 1 when its bottom enters (a
// figure taller than the window: when its top is a quarter of the way
// down), so it is complete once it is on screen and never shows as an
// empty frame. A figure with several steps runs through them the same way.
function updateFigure(slot, vh) {
  const r = slot.frame.getBoundingClientRect();
  const from = vh * 1.3;
  const to = Math.max(vh - r.height, vh * 0.25);   // a figure taller than the window: when its top is a quarter down
  const p = clamp01((from - r.top) / Math.max(1, from - to));
  if (p >= 1) return later(() => apply(slot, slot.steps - 1, 1));
  const x = p * slot.steps;
  later(() => apply(slot, Math.floor(x), x - Math.floor(x)));
}

// The margin scene, pinned in the margin column (article.css 2b). Its state
// follows the markers in the text: when a marker passes the middle of the
// window, the figure changes from the state before into the marker's state
// over the next 30% of a window of scroll; scrolling back runs it backwards.
// It fades out while anything that runs through the margin column (a scene,
// a wide figure, a table) is beside or near it, and comes back after.
const marginSlot = slots.find((s) => s.role === 'margin');
const marginMarks = [...document.querySelectorAll('.margin-mark:not(.margin-end)')];
const marginEnd = document.querySelector('.margin-end');
const railPin = document.querySelector('.rail-pin');
const stillSlots = slots.filter((s) => s.role === 'still');
const flowEls = [...document.querySelectorAll('main.body > *')]
  .filter((el) => !el.matches('.rail, .margin-mark, .margin-still, .where'));

function updateMargin(vh) {
  if (!marginSlot || !marginSlot.handle || !railPin) return;
  const line = vh * 0.5;
  let active = null;
  for (const m of marginMarks) { if (m.getBoundingClientRect().top <= line) active = m; else break; }
  const state = !active || active === marginMarks[0] ? Number(marginMarks[0]?.dataset.state || 0) : Number(active.dataset.state);
  const t = !active || active === marginMarks[0] ? 1 : (line - active.getBoundingClientRect().top) / (vh * 0.3);

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
  // nothing near (gap is Infinity): fully shown; clamp01 would give 0
  const op = gap === Infinity ? 1 : clamp01((gap - 16) / 120);
  later(() => {
    apply(marginSlot, state, t);
    const o = op === 1 ? '' : op.toFixed(3);
    if (railPin.style.opacity !== o) railPin.style.opacity = o;
    railPin.classList.toggle('is-away', op === 0);
  });
}

// Without the margin column the states are stills in the text. Each one
// changes from the state before it into its own as it enters: t is 0 when
// its top comes into the window and 1 when it is at 70% of the window
// height, so a still in full view never shows a half-made state.
function updateStill(slot, vh) {
  if (!displayed(slot)) return;
  const first = slot.state === Number(marginMarks[0]?.dataset.state || 0);
  const r = slot.frame.getBoundingClientRect();
  const t = first ? 1 : clamp01((vh - r.top) / Math.max(1, vh * 0.3));
  later(() => apply(slot, slot.state, t));
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

// update() first measures everything, then changes everything. A change
// between two measurements would make the browser lay out the page again
// in the middle of a frame, which costs frames while scrolling.
const writes = [];
const later = (fn) => { writes.push(fn); };
function update() {
  const vh = innerHeight;
  for (const scene of scenes) if (scene.slot?.handle) updateScene(scene, vh);
  for (const slot of figureSlots) if (slot.handle) updateFigure(slot, vh);
  for (const slot of slots) if (slot.role === 'seq') apply(slot, slot.state, 1);
  for (const slot of stillSlots) if (slot.handle) updateStill(slot, vh);
  updateMargin(vh);
  for (const fn of writes.splice(0)) fn();
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
      else if (el.matches('.sources, .src-fold, .src-list')) walk(el, true);
      else if (el.matches(SPANNERS)) out.push({ el, span: true });
      else out.push({ el, head: el.matches('h2, h3, .where, summary'), fixed: inSources, solid: el.matches('figure, .table-frame') });
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
  if (!srcFold) return;
  if (on) { if (foldOnScreen === null) foldOnScreen = srcFold.open; srcFold.open = true; }
  else if (foldOnScreen !== null) { srcFold.open = foldOnScreen; foldOnScreen = null; }
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

async function start() {
  numberMarks();
  // The list of sources starts folded below 1000 px; addressed directly, it opens.
  if (srcFold && !PRINT_PREVIEW && matchMedia('(max-width: 999.98px)').matches) srcFold.open = false;
  openForHash();
  addEventListener('hashchange', openForHash);
  // Figures measure their lettering when they are drawn: the text and mono
  // faces are awaited first, but never for more than 300 ms.
  const fontsIn = document.fonts?.load
    ? Promise.race([
      Promise.all(['400 1em "Libre Franklin"', '500 1em "JetBrains Mono"', 'italic 400 1em "Newsreader"'].map((f) => document.fonts.load(f).catch(() => null))),
      new Promise((ok) => setTimeout(ok, 300)),
    ]) : null;
  await Promise.all([...new Set(slots.map((s) => s.id))].map(load).concat(fontsIn || []));
  if (PRINT_PREVIEW) { printMode = true; foldForPrint(true); applyMedia(true); }
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
  document.fonts?.ready.then(() => {
    // lettering measured before the fonts arrived may have had another width
    for (const scene of scenes) if (scene.slot) { scene.slot.cropKey = ''; applyCrop(scene.slot); }
    sizeScenes(); requestUpdate();
  });

  // Ctrl+P: switch to print mode before the browser lays out the pages.
  addEventListener('beforeprint', () => setPrintMode(true));
  addEventListener('afterprint', () => setPrintMode(PRINT_PREVIEW));

  // A frozen figure is what the reviewer wants to see: bring it into view.
  const first = slots.find((s) => frozen[s.id] && s.role !== 'still' && s.handle);
  if (first) first.frame.scrollIntoView({ block: 'center' });

  // On phones the section list starts folded (see .toc-fold in the CSS).
  const fold = document.querySelector('.toc-fold');
  if (fold && matchMedia('(max-width: 639.98px)').matches) fold.open = false;

  root.dataset.ready = '1';   // tools/shots.mjs waits for this
}

start();
