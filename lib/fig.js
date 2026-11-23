// Drawing helpers shared by all figures. No dependency, SVG only.
//
// A figure module builds its drawing once and registers every element on a
// "stage" with the moment it arrives. The stage turns (step, t) into one
// number g = step + t, so set() is a pure function of its arguments and the
// end of one step is exactly the start of the next.

const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;

export const FONTS = {
  serif: "'Newsreader', Georgia, serif",
  sans: "'Libre Franklin', Arial, sans-serif",
  mono: "'JetBrains Mono', Consolas, monospace",
  hand: "'Excalifont', 'Virgil', 'Libre Franklin', Arial, sans-serif",
};

// His idea of 23 November, night: a figure's notes (set in italic serif) in a
// grey hand face instead, Excalidraw's Excalifont, easier to read than italic.
// On while <html data-notes="hand"> (or ?notes=hand); off otherwise.
const handNotes = () => typeof document !== 'undefined'
  && (document.documentElement.dataset.notes === 'hand' || /[?&]notes=hand\b/.test(location.search));

const FALLBACK = {
  '--ink': '#15171C', '--paper': '#FBFBFC', '--muted': '#5C6370',
  '--hairline': '#DADDE3', '--accent': '#1F7A54', '--field': '#CDE9D9',
};

export function colors(ctx) {
  const get = (name) => {
    let v = '';
    try { v = (ctx && ctx.css ? ctx.css(name) : '') || ''; } catch { v = ''; }
    return String(v).trim() || FALLBACK[name];
  };
  return {
    ink: get('--ink'), paper: get('--paper'), muted: get('--muted'),
    hairline: get('--hairline'), accent: get('--accent'), field: get('--field'),
  };
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const easeOut = (p) => 1 - Math.pow(1 - p, 3);
// Progress of g inside [a, b], clamped.
export const span = (g, a, b) => (b <= a ? (g >= b ? 1 : 0) : clamp((g - a) / (b - a)));

export function rng(seed = 1) {            // mulberry32
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function linear(d0, d1, r0, r1) {
  const f = (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  f.inv = (x) => d0 + ((x - r0) / (r1 - r0)) * (d1 - d0);
  return f;
}

export function fmt(n, decimals = 0) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ---------------------------------------------------------------------------
// Elements
// ---------------------------------------------------------------------------
export function h(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}

// Lettering never gets smaller than MIN_PX on screen (PRINT_PX on paper):
// svgRoot looks at the width of the frame it is mounted in and text() lifts
// every size that would fall under that floor. The drawing is built
// synchronously, so one module-level value is enough.
const MIN_PX = 11.5, PRINT_PX = 9;
let floorSize = 0;
export const textFloor = () => floorSize;

export function svgRoot(el, w, hgt, label) {
  let fw = 0;
  try { fw = el.clientWidth || el.getBoundingClientRect().width || 0; } catch { fw = 0; }
  const paper = typeof document !== 'undefined' && document.documentElement.classList.contains('is-print');
  floorSize = fw > 0 ? ((paper ? PRINT_PX : MIN_PX) * w) / fw : 0;
  const svg = h('svg', {
    viewBox: `0 0 ${w} ${hgt}`, width: '100%', role: 'img', 'aria-label': label,
    preserveAspectRatio: 'xMidYMid meet',
  });
  svg.style.display = 'block';
  svg.style.height = 'auto';
  svg.style.overflow = 'visible';
  el.appendChild(svg);
  return svg;
}

export const g = (parent, attrs) => h('g', attrs, parent);
export const line = (parent, x1, y1, x2, y2, attrs) => h('line', { x1, y1, x2, y2, ...attrs }, parent);
export const circle = (parent, cx, cy, r, attrs) => h('circle', { cx, cy, r, ...attrs }, parent);
export const rect = (parent, x, y, w, hh, attrs) => h('rect', { x, y, width: w, height: hh, ...attrs }, parent);
export const path = (parent, d, attrs) => h('path', { d, fill: 'none', ...attrs }, parent);

// Smooth open curve through points (Catmull-Rom as cubic Béziers).
export function spline(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

// ---------------------------------------------------------------------------
// Text: measuring, wrapping to a width, mono runs inside a note
// ---------------------------------------------------------------------------
let cv = null;
function fontCss(f) { return `${f.italic ? 'italic ' : ''}${f.weight || 400} ${f.size}px ${FONTS[f.family] || f.family}`; }
export function measure(str, f) {
  if (!cv) cv = document.createElement('canvas').getContext('2d');
  cv.font = fontCss(f);
  return cv.measureText(str).width + (f.spacing || 0) * str.length;
}

const MONO_IN_TEXT = 0.86;   // mono looks larger than serif at the same size

// "plain [[mono run]] plain" -> words with their own font.
function words(str, f) {
  const out = [];
  String(str).split(/(\[\[.*?\]\])/).forEach((part) => {
    if (!part) return;
    const mono = part.startsWith('[[');
    const txt = mono ? part.slice(2, -2) : part;
    const font = mono
      ? { family: 'mono', size: f.family === 'mono' ? f.size : Math.max(f.size * MONO_IN_TEXT, Math.min(f.size, floorSize)), weight: f.monoWeight || 500 }
      : f;
    const bits = txt.split(/( +|\n)/);
    for (const b of bits) {
      if (b === '') continue;
      if (b === '\n') out.push({ br: true });
      else if (/^ +$/.test(b)) out.push({ space: true, font });
      else out.push({ txt: b, font, mono, w: measure(b, font) });
    }
  });
  return out;
}

// Draws text. `y` is the baseline of the first line. Returns the box it
// takes: { x, y, w, h, lines, el, bottom, right }.
//   opts: family 'serif'|'sans'|'mono', size, italic, weight, fill,
//         anchor 'start'|'middle'|'end', width (wrap), lh (line height),
//         spacing (letter-spacing in px), caps
export function text(parent, x, y, str, opts = {}) {
  if (opts.italic && (opts.family || 'serif') === 'serif' && handNotes()) {
    // the hand face reads smaller than the serif at one size: 8% larger, grey
    opts = { ...opts, italic: false, family: 'hand', size: (opts.size || 14) * 1.08, fill: opts.fill && opts.fill !== 'currentColor' ? opts.fill : '#5C6370' };
  }
  const f = {
    family: opts.family || 'serif', size: Math.max(opts.size || 14, opts.free ? 0 : floorSize), italic: !!opts.italic,
    weight: opts.weight || 400, spacing: opts.spacing || 0, monoWeight: opts.monoWeight,
  };
  const lh = Math.max(opts.lh || 0, Math.round(f.size * (opts.lh ? 1.16 : 1.28) * 10) / 10);
  const maxW = opts.width || Infinity;
  if (opts.caps) str = String(str).toUpperCase();
  const lines = [[]];
  let lw = 0, pendingSpace = null;
  for (const w of words(str, f)) {
    if (w.br) { lines.push([]); lw = 0; pendingSpace = null; continue; }
    if (w.space) { if (lines[lines.length - 1].length) pendingSpace = w; continue; }
    const sw = pendingSpace ? measure(' ', pendingSpace.font) : 0;
    if (lw + sw + w.w > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; pendingSpace = null; }
    const cur = lines[lines.length - 1];
    if (pendingSpace && cur.length) { cur.push({ txt: ' ', font: pendingSpace.font, w: sw }); lw += sw; }
    cur.push(w); lw += w.w; pendingSpace = null;
  }
  const grp = g(parent, { class: 'fig-text' });
  const anchor = opts.anchor || 'start';
  let widest = 0;
  lines.forEach((ln, i) => {
    const w = ln.reduce((s, r) => s + r.w, 0);
    widest = Math.max(widest, w);
    if (!ln.length) return;
    const t = h('text', {
      x, y: y + i * lh, 'text-anchor': anchor, fill: opts.fill || 'currentColor',
      'font-family': FONTS[f.family], 'font-size': f.size, 'font-weight': f.weight,
      'font-style': f.italic ? 'italic' : null,
      'letter-spacing': f.spacing ? f.spacing : null,
    }, grp);
    t.style.whiteSpace = 'pre';
    if (f.family === 'mono') t.style.fontVariantNumeric = 'tabular-nums lining-nums';
    // Contiguous runs of one font become one tspan.
    let run = null;
    for (const r of ln) {
      if (!run || run.font !== r.font) {
        run = { font: r.font, el: h('tspan', r.font === f ? null : {
          'font-family': FONTS[r.font.family], 'font-size': r.font.size,
          'font-weight': r.font.weight, 'font-style': 'normal',
        }, t) };
        run.el.textContent = '';
      }
      run.el.textContent += r.txt;
    }
  });
  const left = anchor === 'start' ? x : anchor === 'end' ? x - widest : x - widest / 2;
  const top = y - f.size * 0.78;
  const hh = (lines.length - 1) * lh + f.size * 1.02;
  return {
    el: grp, x: left, y: top, w: widest, h: hh, lines: lines.length, lh,
    right: left + widest, bottom: top + hh, cx: left + widest / 2, cy: top + hh / 2,
    // x of the start and end of a word on a given line, for ringing a number
    find(needle) {
      for (let i = 0; i < lines.length; i++) {
        const w = lines[i].reduce((s, r) => s + r.w, 0);
        let cx = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
        for (const r of lines[i]) {
          if (r.txt === needle) return { x: cx, w: r.w, cx: cx + r.w / 2, cy: y + i * lh - r.font.size * 0.33 };
          cx += r.w;
        }
      }
      return null;
    },
  };
}

// How many lines / how wide a text would be, without drawing it.
export function textSize(str, opts = {}) {
  const tmp = h('g');
  const b = text(tmp, 0, 0, str, opts);
  return { w: b.w, h: b.h, lines: b.lines, lh: b.lh };
}

// ---------------------------------------------------------------------------
// Leaders, brackets, the pen ring
// ---------------------------------------------------------------------------
const hitRect = (x1, y1, x2, y2, r) => {
  // Liang-Barsky: does the segment touch the rectangle?
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy], q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; } else {
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return true;
};

// Point on the edge of a text box that faces a target.
export function edge(box, tx, ty, pad = 3) {
  const cx = clamp(tx, box.x + 4, box.x + box.w - 4), cy = clamp(ty, box.y + 3, box.y + box.h - 3);
  if (ty > box.y + box.h) return [cx, box.y + box.h + pad];
  if (ty < box.y) return [cx, box.y - pad];
  if (tx > box.x + box.w) return [box.x + box.w + pad + 1, cy];
  return [box.x - pad - 1, cy];
}

// A thin leader from (x1, y1) to the thing it names at (x2, y2). With
// `avoid` (a list of { x, y, w, h }) it tries the straight line first and
// then the two elbows, and takes the first that crosses nothing.
export function leader(parent, x1, y1, x2, y2, o = {}) {
  const routes = [
    [[x1, y1], [x2, y2]],
    [[x1, y1], [x2, y1], [x2, y2]],
    [[x1, y1], [x1, y2], [x2, y2]],
  ];
  let pick = routes[o.route === 'hv' ? 1 : o.route === 'vh' ? 2 : 0];
  if (o.avoid && !o.route) {
    pick = routes.find((r) => r.every((p, i) => i === 0
      || !o.avoid.some((b) => hitRect(r[i - 1][0], r[i - 1][1], p[0], p[1], b)))) || routes[0];
  }
  const grp = g(parent, { class: 'fig-leader' });
  const d = pick.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
  const ln = path(grp, d, { stroke: o.stroke || 'currentColor', 'stroke-width': o.width || 0.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  let dot = null;
  if (o.dot !== false) dot = circle(grp, x2, y2, o.dotR || 1.5, { fill: o.stroke || 'currentColor' });
  return { el: grp, line: ln, dot };
}

// A square bracket from (x1, y1) to (x2, y2); `depth` is the length of the
// end ticks, positive to the left of the direction of travel.
export function bracket(parent, x1, y1, x2, y2, depth = 6, attrs = {}) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const nx = (dy / len) * depth, ny = (-dx / len) * depth;
  const d = `M${(x1 + nx).toFixed(1)} ${(y1 + ny).toFixed(1)}L${x1} ${y1}L${x2} ${y2}L${(x2 + nx).toFixed(1)} ${(y2 + ny).toFixed(1)}`;
  return path(parent, d, { stroke: 'currentColor', 'stroke-width': 1.25, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...attrs });
}

// The pen ring: one loose turn that overlaps where it closes. A real path
// with seeded irregularity; a second, thinner pass lies partly beside the
// first, so the line looks heavier in some places than in others.
export function penRing(parent, cx, cy, rx, ry, o = {}) {
  const rnd = rng(o.seed || 7);
  const start = o.start ?? (-2.5 + rnd() * 0.7);
  const over = o.overlap ?? (0.5 + rnd() * 0.3);
  const drift = o.drift ?? (0.11 + rnd() * 0.05);
  const a1 = 0.03 + rnd() * 0.025, a2 = 0.015 + rnd() * 0.02;
  const p1 = rnd() * TAU, p2 = rnd() * TAU, p3 = rnd() * TAU;
  const tilt = (rnd() - 0.5) * 0.16;
  const N = 34;
  const make = (shift) => {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, a = start + u * (TAU + over);
      const k = 1 + a1 * Math.sin(2 * a + p1) + a2 * Math.sin(3 * a + p2) + drift * (u - 0.45);
      const d = shift * Math.sin(a * 1.3 + p3);
      const ex = (rx * k + d) * Math.cos(a), ey = (ry * k + d) * Math.sin(a);
      pts.push([cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)]);
    }
    return spline(pts);
  };
  const grp = g(parent, { class: 'fig-ring' });
  const w = o.width || 1.5, stroke = o.stroke || 'currentColor';
  const a = path(grp, make(0), { stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const b = path(grp, make(w * 0.62), { stroke, 'stroke-width': w * 0.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.85 });
  return { el: grp, paths: [a, b] };
}

// ---------------------------------------------------------------------------
// Unit dots
// ---------------------------------------------------------------------------
// value / per -> whole units and the part left over.
export function units(value, per = 1) {
  const q = value / per, full = Math.floor(q + 1e-9);
  const frac = q - full;
  return { full, frac: frac < 1e-6 ? 0 : frac, cells: full + (frac >= 1e-6 ? 1 : 0) };
}

// n cells in rows of `cols`, in reading order. Options: gx, gy (pitch),
// group / groupGap (a wider gap after every `group` columns), byColumn
// (fill down the columns first), up (rows grow upward from y = 0).
export function cells(n, cols, o = {}) {
  const gx = o.gx || o.pitch || 10, gy = o.gy || o.pitch || 10;
  const out = [];
  const rows = o.rows || Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const col = o.byColumn ? Math.floor(i / rows) : i % cols;
    const row = o.byColumn ? i % rows : Math.floor(i / cols);
    const extra = o.group ? Math.floor(col / o.group) * (o.groupGap || 0) : 0;
    out.push({ i, col, row, x: col * gx + extra + gx / 2, y: o.up ? -(row * gy + gy / 2) : row * gy + gy / 2 });
  }
  out.width = cols * gx + (o.group ? Math.floor((cols - 1) / o.group) * (o.groupGap || 0) : 0);
  out.height = rows * gy;
  return out;
}

// Draws `count.full` dots and, if there is a part left, one smaller dot whose
// area is that part of a unit. Returns the circles in order.
export function dots(parent, list, count, r, attrs = {}, ox = 0, oy = 0) {
  const out = [];
  const n = typeof count === 'number' ? { full: count, frac: 0 } : count;
  for (let i = 0; i < n.full + (n.frac ? 1 : 0) && i < list.length; i++) {
    const rr = i < n.full ? r : r * Math.sqrt(n.frac);
    const c = circle(parent, ox + list[i].x, oy + list[i].y, +rr.toFixed(2), attrs);
    c.dataset.r = rr.toFixed(2);
    out.push(c);
  }
  return out;
}

// The faint dot grid behind a measurement plate, on the same lattice.
export function plate(parent, list, r, fill, ox = 0, oy = 0) {
  const grp = g(parent, { class: 'fig-plate', fill });
  for (const c of list) circle(grp, ox + c.x, oy + c.y, r);
  return grp;
}

// ---------------------------------------------------------------------------
// The stage: what is visible at g = step + t
// ---------------------------------------------------------------------------
export function stage() {
  const items = [];
  let lastG = NaN;
  // A value is written only when it differs from what the element has now: a
  // figure is set on every scroll frame, and a write that changes nothing
  // still costs a style pass (hundreds of units in some figures). Reading
  // the inline value back is cheap and stays right when figure code writes
  // the same property itself.
  const put = (el, prop, v) => { if (el.style[prop] !== v) el.style[prop] = v; };
  const putAttr = (el, name, v) => { if (el.getAttribute(name) !== v) el.setAttribute(name, v); };
  const show = (el, p) => {
    if (p <= 0.001) { put(el, 'display', 'none'); return false; }
    put(el, 'display', '');
    put(el, 'opacity', p >= 0.999 ? '' : p.toFixed(3));
    return true;
  };
  const api = {
    // Fade in over [a, b]; with out = [c, d] fade away again.
    fade(el, a, b, out) {
      items.push((gg) => show(el, ease(span(gg, a, b)) * (out ? 1 - ease(span(gg, out[0], out[1])) : 1)));
      return api;
    },
    // Draw a solid stroke on from its start over [a, b].
    draw(el, a, b, out) {
      el.setAttribute('pathLength', '1');
      items.push((gg) => {
        const p = ease(span(gg, a, b));
        const vis = out ? 1 - ease(span(gg, out[0], out[1])) : 1;
        if (!show(el, p > 0.001 ? vis : 0)) return;
        if (p >= 0.999) {
          if (el.hasAttribute('stroke-dasharray')) { el.removeAttribute('stroke-dasharray'); el.removeAttribute('stroke-dashoffset'); }
        } else {
          putAttr(el, 'stroke-dasharray', '1 1');
          putAttr(el, 'stroke-dashoffset', (1 - p).toFixed(4));
        }
      });
      return api;
    },
    // Units arrive one after another, in the order given.
    fill(els, a, b, out) {
      const n = els.length, k = Math.max(1, n * 0.18);
      // Each unit remembers the state it was last given: with hundreds of
      // units, rewriting the ones that have not moved costs a long frame on
      // a slow phone.
      const last = new Float32Array(n).fill(-1);
      let lastVis = -1;
      items.push((gg) => {
        const P = span(gg, a, b) * (n + k);
        const vis = out ? 1 - ease(span(gg, out[0], out[1])) : 1;
        const visChanged = Math.abs(vis - lastVis) > 0.0005;
        lastVis = vis;
        for (let i = 0; i < n; i++) {
          const p = easeOut(clamp((P - i) / k));
          if (!visChanged && Math.abs(p - last[i]) < 0.004 && !(p === 0 && last[i] !== 0) && !(p === 1 && last[i] !== 1)) continue;
          last[i] = p;
          const el = els[i];
          if (!show(el, p > 0.001 ? vis : 0)) continue;
          if (el.dataset.r) putAttr(el, 'r', (el.dataset.r * (0.35 + 0.65 * p)).toFixed(2));
          if (p < 0.999 && vis >= 0.999) put(el, 'opacity', p.toFixed(3));
        }
      });
      return api;
    },
    // Anything else: fn(g).
    on(fn) { items.push(fn); return api; },
    set(step, t) {
      const gg = Math.max(0, step) + clamp(t);
      if (gg === lastG) return gg;   // nothing moved since the last frame
      lastG = gg;
      for (const it of items) it(gg);
      return gg;
    },
  };
  return api;
}

// ---------------------------------------------------------------------------
// Idle motion: breathes only while on screen, never in print or with
// reduced motion. fn(seconds) must not decide what is true; set() does.
// ---------------------------------------------------------------------------
export function idle(el, ctx, fn) {
  if (!ctx || ctx.reduced || ctx.print || typeof requestAnimationFrame !== 'function') return { stop() {} };
  let raf = 0, visible = false, stopped = false, t0 = 0, acc = 0;
  const tick = (now) => {
    raf = 0;
    if (stopped || !visible || document.hidden) { t0 = 0; return; }
    if (t0) acc += Math.min(0.1, (now - t0) / 1000);
    t0 = now;
    fn(acc);
    raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf && visible && !stopped && !document.hidden) raf = requestAnimationFrame(tick); };
  let io = null;
  if (typeof IntersectionObserver === 'function') {
    io = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); kick(); });
    io.observe(el);
  } else { visible = true; kick(); }
  const onVis = () => kick();
  document.addEventListener('visibilitychange', onVis);
  return {
    stop() {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}

// ---------------------------------------------------------------------------
// Mounting: builds the drawing, remembers the last state, and builds it
// again once the page's fonts are there (text is measured to be wrapped).
// build(el) -> { set(step, t), destroy?() }
// ---------------------------------------------------------------------------
const FACES = ['italic 14px "Newsreader"', 'italic 600 14px "Newsreader"', '14px "Libre Franklin"', '500 14px "Libre Franklin"', '600 14px "Libre Franklin"', '14px "JetBrains Mono"', '500 14px "JetBrains Mono"'];

export function mountFigure(el, build) {
  let inner = build(el), last = null, dead = false;
  const fonts = typeof document !== 'undefined' && document.fonts;
  if (fonts && fonts.load && !FACES.every((f) => { try { return fonts.check(f); } catch { return true; } })) {
    Promise.all(FACES.map((f) => fonts.load(f).catch(() => null))).then(() => {
      if (dead) return;
      try { inner.destroy && inner.destroy(); } catch { /* nothing to undo */ }
      el.replaceChildren();
      inner = build(el);
      if (last) inner.set(last[0], last[1]);
    });
  }
  // a frame that changes its width gets a drawing made for the new width
  let ro = null, w0 = el.clientWidth || 0, timer = 0;
  const rebuild = () => {
    if (dead) return;
    try { inner.destroy && inner.destroy(); } catch { /* nothing to undo */ }
    el.replaceChildren();
    inner = build(el);
    if (last) inner.set(last[0], last[1]);
  };
  if (typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(() => {
      const w = el.clientWidth || 0;
      if (!w || !w0 || Math.abs(w - w0) / w0 < 0.06) { if (!w0) w0 = w; return; }
      w0 = w;
      clearTimeout(timer);
      timer = setTimeout(rebuild, 120);
    });
    ro.observe(el);
  }
  return {
    set(step, t) { last = [step, t]; inner.set(step, t); },
    destroy() { dead = true; clearTimeout(timer); if (ro) ro.disconnect(); try { inner.destroy && inner.destroy(); } catch { /* same */ } el.replaceChildren(); },
  };
}

// A pen line: the points resampled every 5 units, nudged by two slow seeded
// waves, joined by a spline. Thin, a little uneven, stable for a given seed.
export function pen(points, seed, amp) {
  const r = rng(seed);
  const ph = [r(), r(), r(), r()].map((v) => v * Math.PI * 2);
  const out = [];
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i];
    if (i === 0) { out.push({ x: ax, y: ay, s: 0 }); continue; }
    const [px, py] = points[i - 1];
    const len = Math.hypot(ax - px, ay - py);
    const n = Math.max(1, Math.round(len / 5));
    for (let k = 1; k <= n; k++) out.push({ x: lerp(px, ax, k / n), y: lerp(py, ay, k / n), s: s + len * (k / n) });
    s += len;
  }
  return spline(out.map((p) => [
    p.x + amp * (0.65 * Math.sin(p.s * 0.031 + ph[0]) + 0.35 * Math.sin(p.s * 0.083 + ph[1])),
    p.y + amp * (0.65 * Math.sin(p.s * 0.027 + ph[2]) + 0.35 * Math.sin(p.s * 0.071 + ph[3])),
  ]));
}
