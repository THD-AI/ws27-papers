// Grid lab: hand-drawn parts for the `lattice` variants. Pen lines from
// lib/fig.js (pen, penRing), a misregistered colour wash for what fires,
// written letters for errors, tallies for counted chances. Two grid
// renderers with the interface the scene needs:
//   gridA: the lattice as a few long pen strokes, washes for the checks
//   gridB: the chip itself, in pen: cross-shaped qubits (the Xmon shape of
//          real superconducting chips), the helpers between them, couplers
//          drawn from each helper to the storing qubits it asks
import { g, h, circle, path, pen, penRing, rng, lerp, spline, textFloor } from '../../../lib/fig.js';

let uid = 0;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// tile outlines as point lists (closed), centres, from data/lattice.json
// ---------------------------------------------------------------------------
const OUT = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
export function tilePts(ch, pos) {
  const p = ch.qubits.map(pos);
  if (ch.shape === 'square') {
    const [a, b, c, e] = p;
    return { pts: [a, b, e, c, a], c: [(a[0] + e[0]) / 2, (a[1] + e[1]) / 2] };
  }
  const [a, b] = p, out = OUT[ch.edge];
  const r = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const u = [(b[0] - a[0]) / (2 * r), (b[1] - a[1]) / (2 * r)];
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const th = (i / 14) * Math.PI;
    pts.push([mx - r * Math.cos(th) * u[0] + r * Math.sin(th) * out[0], my - r * Math.cos(th) * u[1] + r * Math.sin(th) * out[1]]);
  }
  pts.push(pts[0]);
  return { pts, c: [mx + out[0] * r * 0.46, my + out[1] * r * 0.46], arc: pts.slice(0, 15) };
}

// a pen stroke through points
export function stroke(parent, pts, seed, o = {}) {
  return path(parent, pen(pts, seed, o.amp ?? 0.55), {
    stroke: o.stroke || 'currentColor', 'stroke-width': o.w ?? 1.35,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: o.op ?? null,
    'stroke-dasharray': o.dash || null,
  });
}

// a quiet watercolour-like edge for the washes: one filter per mount
export function washFilter(svg) {
  const id = `glab-wash-${++uid}`;
  const defs = h('defs', null, svg);
  const f = h('filter', { id, x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
  h('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.045', numOctaves: '2', seed: String(uid), result: 'n' }, f);
  h('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '5', xChannelSelector: 'R', yChannelSelector: 'G' }, f);
  return `url(#${id})`;
}

// a wash: the shape with a wobbling edge, set a little off the line drawing,
// as the field layer of the opening drawing sits off its pen line
export function wash(parent, pts, seed, fill, o = {}) {
  const dx = o.dx ?? 0, dy = o.dy ?? 0;
  const moved = pts.map(([x, y]) => [x + dx, y + dy]);
  return path(parent, pen(moved, seed, o.amp ?? 1.6) + 'Z', { fill, stroke: 'none', 'fill-opacity': o.op ?? null, 'data-audit': 'skip' });
}

// a written letter, X, Z or Y, of height s, centred on (x, y)
const GLYPH = {
  X: [[[-0.36, -0.5], [0.38, 0.5]], [[0.36, -0.5], [-0.38, 0.48]]],
  Z: [[[-0.34, -0.48], [0.38, -0.5], [-0.38, 0.47], [0.4, 0.46]]],
  Y: [[[-0.38, -0.5], [0.01, 0.02]], [[0.4, -0.5], [-0.02, 0.04], [0.01, 0.5]]],
};
export function letter(parent, x, y, ch, s, seed, o = {}) {
  const r = rng(seed), tilt = (r() - 0.5) * 0.14;
  const grp = g(parent);
  GLYPH[ch].forEach((stk, i) => {
    const pts = stk.map(([u, v]) => {
      const ux = u * s * 0.92, vy = v * s;
      return [x + ux * Math.cos(tilt) - vy * Math.sin(tilt), y + ux * Math.sin(tilt) + vy * Math.cos(tilt)];
    });
    // short strokes: resample finely so the pen still wobbles a little
    const fine = [];
    for (let k = 0; k < pts.length - 1; k++) for (let j = 0; j < 4; j++) fine.push([lerp(pts[k][0], pts[k + 1][0], j / 4), lerp(pts[k][1], pts[k + 1][1], j / 4)]);
    fine.push(pts[pts.length - 1]);
    path(grp, pen(fine, seed * 7 + i, s * 0.025), {
      stroke: o.stroke || 'currentColor', 'stroke-width': o.w ?? Math.max(1.6, s * 0.13),
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    });
  });
  return grp;
}

// an error on a storing qubit: the qubit knocked out in paper, the letter
// written over it
export function errMark(parent, x, y, s, ch, C, seed) {
  const grp = g(parent, { 'data-audit': 'skip' });
  circle(grp, x, y, s * 0.62, { fill: C.paper });
  letter(grp, x, y, ch, s, seed, { stroke: C.ink });
  return grp;
}

// a hand leader: a slight curve, no dot
export function lead(parent, x1, y1, x2, y2, C, seed, bow = 0.16) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
  const mx = (x1 + x2) / 2 + nx * bow * len, my = (y1 + y2) / 2 + ny * bow * len;
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, u = 1 - t;
    pts.push([u * u * x1 + 2 * u * t * mx + t * t * x2, u * u * y1 + 2 * u * t * my + t * t * y2]);
  }
  const grp = g(parent, { class: 'fig-leader' });
  path(grp, pen(pts, seed, 0.35), { stroke: C.muted, 'stroke-width': 0.95, 'stroke-linecap': 'round' });
  return grp;
}

// counted units as a tally: `total` strokes in fives, the first n in ink and
// crossed, the rest faint. Returns the ink strokes in order (for st.fill)
// and the width.
export function tally(parent, x0, y, n, total, C, seed, o = {}) {
  const s = o.step ?? 3.5, gap = o.gap ?? 7.5, hgt = o.h ?? 13;
  const r = rng(seed);
  const ink = [], grp = g(parent, { 'data-audit': 'skip' });
  const faint = g(grp, { opacity: o.faint ?? 0.38 });
  let x = x0;
  for (let k = 0; k < total; k += 5) {
    const gx = x;
    for (let j = 0; j < 5 && k + j < total; j++) {
      const i = k + j, on = i < n;
      const parentG = on ? grp : faint;
      if (j < 4) {
        const xx = gx + j * s + (r() - 0.5) * 0.6, lean = (r() - 0.5) * 1.4;
        const el = path(parentG, `M${(xx + lean).toFixed(2)} ${(y - hgt / 2 + r() * 1.2).toFixed(2)}L${(xx - lean * 0.4).toFixed(2)} ${(y + hgt / 2 - r() * 1.2).toFixed(2)}`, {
          stroke: on ? C.ink : C.muted, 'stroke-width': on ? (o.w ?? 1.35) : 1, 'stroke-linecap': 'round',
        });
        if (on) ink.push(el);
      } else {
        const el = path(parentG, `M${(gx - 2.2).toFixed(2)} ${(y + hgt * 0.3 + r()).toFixed(2)}L${(gx + 3 * s + 2.4).toFixed(2)} ${(y - hgt * 0.32 - r()).toFixed(2)}`, {
          stroke: on ? C.ink : C.muted, 'stroke-width': on ? (o.w ? o.w * 0.92 : 1.25) : 1, 'stroke-linecap': 'round',
        });
        if (on) ink.push(el);
      }
    }
    x += 3 * s + gap + 2;
  }
  return { el: grp, faint, ink, w: x - gap - 2 - x0 };
}
export const tallyWidth = (total, o = {}) => Math.ceil(total / 5) * (3 * (o.step ?? 3.5) + (o.gap ?? 7.5) + 2) - (o.gap ?? 7.5) - 2;

// ---------------------------------------------------------------------------
// shared skeleton of both renderers
// ---------------------------------------------------------------------------
function frame(parent, o) {
  const { d, cx, cy, pitch } = o;
  const half = ((d - 1) / 2) * pitch;
  const pos = (q) => [cx - half + (q % d) * pitch, cy - half + Math.floor(q / d) * pitch];
  const root = g(parent);
  const L = { gW: g(root), gF: g(root), gT: g(root), gH: g(root), gQ: g(root), gE: g(root) };
  if (o.filter) { L.gW.setAttribute('filter', o.filter); L.gF.setAttribute('filter', o.filter); }
  return { root, pos, half, ...L };
}

function fireable(field, dot) {
  field.style.display = 'none'; dot.style.display = 'none';
  return (p) => {
    const on = p > 0.001;
    for (const e of [field, dot]) {
      e.style.display = on ? '' : 'none';
      if (on) e.style.opacity = p >= 0.999 ? '' : p.toFixed(3);
    }
  };
}

// a shape grown about its centre
export const grow = (pts, c, k) => pts.map(([x, y]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k]);

// pencil hatching inside a tile: diagonal pen strokes, clipped to the tile
export function hatch(parent, pts, pitch, C, seed) {
  const id = `glab-hatch-${++uid}`;
  const clip = h('clipPath', { id }, parent);
  path(clip, pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('') + 'Z', { fill: '#000' });
  const grp = g(parent, { 'clip-path': `url(#${id})`, 'data-audit': 'skip' });
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const gap = Math.max(4, pitch * 0.085), r = rng(seed);
  for (let k = x0 - (y1 - y0); k < x1; k += gap) {
    const j = (r() - 0.5) * gap * 0.3;
    path(grp, pen([[k + j, y1 + 2], [k + j + (y1 - y0) + 4, y0 - 2]], seed + k, 0.4), { stroke: C.muted, 'stroke-width': 0.7, opacity: 0.55, 'stroke-linecap': 'round' });
  }
  return grp;
}

// ---------------------------------------------------------------------------
// A: the lattice in a few long pen strokes
// ---------------------------------------------------------------------------
export function gridA(parent, o) {
  const { checks, d, pitch, C } = o;
  let seed = o.seed || 3;
  const F = frame(parent, o), { pos } = F;
  const qr = o.qr || pitch * 0.15;
  const parts = [];                    // { el, x, how } for drawing on
  const tiles = {};
  checks.forEach((ch) => {
    const t = tilePts(ch, pos), flips = ch.asks_about === 'flips';
    // flip-checks carry a pencil-grey wash, phase-checks none
    if (flips) parts.push({ el: hatch(F.gW, t.pts, pitch, C, seed++), x: t.c[0], how: 'fade' });
    const field = wash(F.gF, grow(t.pts, t.c, 1.06), seed++, C.field, { dx: pitch * 0.07, dy: pitch * 0.06, amp: pitch * 0.035 });
    const dot = circle(F.gH, t.c[0], t.c[1], Math.max(pitch * 0.075, 3.2), { fill: C.accent, 'data-audit': 'skip' });
    const helper = circle(F.gH, t.c[0], t.c[1], Math.max(pitch * 0.042, 1.9), { fill: C.ink });
    parts.push({ el: helper, x: t.c[0], how: 'fade', late: true });
    // the half tiles at the edges: one arc each
    if (ch.shape === 'half') {
      const a = stroke(F.gT, t.arc, seed++, { w: 1.25, amp: pitch * 0.01 });
      parts.push({ el: a, x: Math.min(...t.arc.map((p) => p[0])), how: 'draw' });
    }
    tiles[ch.id] = { check: ch, c: t.c, setFired: fireable(field, dot) };
  });
  // the inner lattice: d rows and d columns, each one stroke
  for (let i = 0; i < d; i++) {
    const a = pos(i * d), b = pos(i * d + d - 1);
    // each line overshoots its end qubits a little and is gone over twice,
    // the second pass thinner and a little beside the first
    const o1 = pitch * (0.12 + 0.06 * (i % 2)), o2 = pitch * (0.16 - 0.05 * (i % 2));
    const r = stroke(F.gT, [[a[0] - o1, a[1] + 0.8], [b[0] + o2, b[1] - 0.6]], seed++, { w: 1.3, amp: pitch * 0.012 });
    const r2 = stroke(F.gT, [[a[0] - o1 * 0.4, a[1] - 1.2], [b[0] + o2 * 0.7, b[1] + 0.9]], seed++, { w: 0.6, amp: pitch * 0.018, op: 0.7 });
    parts.push({ el: r, x: a[0] - o1, how: 'draw', len: 1 }, { el: r2, x: a[0], how: 'draw', len: 1 });
    const c = pos(i), e = pos((d - 1) * d + i);
    const v = stroke(F.gT, [[c[0] + 0.6, c[1] - o2], [e[0] - 0.8, e[1] + o1]], seed++, { w: 1.3, amp: pitch * 0.012 });
    const v2 = stroke(F.gT, [[c[0] - 1, c[1] - o2 * 0.5], [e[0] + 1.1, e[1] + o1 * 0.6]], seed++, { w: 0.6, amp: pitch * 0.018, op: 0.7 });
    parts.push({ el: v, x: c[0], how: 'draw' }, { el: v2, x: c[0] + 2, how: 'draw' });
  }
  const qubits = [];
  for (let q = 0; q < d * d; q++) {
    const [x, y] = pos(q);
    const grp = g(F.gQ);
    circle(grp, x, y, qr * 0.92, { fill: C.paper, 'data-audit': 'skip' });
    penRing(grp, x, y, qr, qr, { seed: 40 + q + (o.seed || 0), width: 1.3, stroke: C.ink, overlap: 0.35 });
    qubits.push({ q, x, y, el: grp });
  }
  return { ...F, tiles, qubits, qr, parts, pitch };
}

// ---------------------------------------------------------------------------
// B: the chip in pen
// ---------------------------------------------------------------------------
function crossPts(x, y, a, w) {
  return [[x - w, y - a], [x + w, y - a], [x + w, y - w], [x + a, y - w], [x + a, y + w], [x + w, y + w],
    [x + w, y + a], [x - w, y + a], [x - w, y + w], [x - a, y + w], [x - a, y - w], [x - w, y - w], [x - w, y - a]];
}
function cross(parent, x, y, a, w, seed, attrs) {
  return path(parent, pen(crossPts(x, y, a, w), seed, a * 0.03) + 'Z', { 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...attrs });
}

export function gridB(parent, o) {
  const { checks, d, pitch, C } = o;
  let seed = o.seed || 5;
  const F = frame(parent, o), { pos } = F;
  const qa = o.qr ? o.qr * 1.25 : pitch * 0.2, ha = pitch * 0.12;
  const parts = [], tiles = {};
  // the die: the edge of the chip and its bond pads, on the large grid only
  if (o.die) {
    const m = F.half + pitch * 0.6, [cx, cy] = [o.cx, o.cy];
    const die = stroke(F.gT, [[cx - m, cy - m + 6], [cx - m + 6, cy - m], [cx + m, cy - m - 1], [cx + m + 1, cy + m], [cx - m, cy + m + 1], [cx - m, cy - m + 6]], seed++, { w: 1.1, amp: pitch * 0.008 });
    parts.push({ el: die, x: cx - m, how: 'draw' });
    const pads = g(F.gT, { 'data-audit': 'skip' });
    const pw2 = pitch * 0.07, in1 = pitch * 0.16;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) for (const k of [0, 1]) {
      const pw = pw2, px = cx + sx * (m - in1 - k * pitch * 0.2), py = cy + sy * (m - in1);
      {
        path(pads, pen([[px - pw, py - pw], [px + pw, py - pw], [px + pw, py + pw], [px - pw, py + pw], [px - pw, py - pw]], seed++, 0.2), { stroke: C.muted, 'stroke-width': 0.85, fill: 'none' });
      }
    }
    parts.push({ el: pads, x: cx, how: 'fade' });
  }
  checks.forEach((ch) => {
    const t = tilePts(ch, pos), flips = ch.asks_about === 'flips';
    if (flips) parts.push({ el: wash(F.gW, t.pts, seed++, C.ink, { op: 0.06, amp: pitch * 0.012 }), x: t.c[0], how: 'fade' });
    const field = wash(F.gF, t.pts, seed++, C.field, { dx: pitch * 0.035, dy: pitch * 0.045, amp: pitch * 0.02 });
    // couplers: from the helper to each storing qubit it asks
    const cg = g(F.gT);
    ch.qubits.forEach((q) => {
      const p = pos(q), dx = p[0] - t.c[0], dy = p[1] - t.c[1], L = Math.hypot(dx, dy);
      const u = [dx / L, dy / L], s0 = ha * 1.05, s1 = L - qa * 0.75;
      stroke(cg, [[t.c[0] + u[0] * s0, t.c[1] + u[1] * s0], [t.c[0] + u[0] * s1, t.c[1] + u[1] * s1]], seed++, {
        w: flips ? 0.85 : 1.35, amp: pitch * 0.004, stroke: flips ? C.muted : C.ink, op: flips ? 0.9 : 0.8,
      });
    });
    parts.push({ el: cg, x: t.c[0], how: 'fade' });
    const helper = cross(F.gH, t.c[0], t.c[1], ha, ha * 0.34, seed++, { fill: C.paper, stroke: C.ink, 'stroke-width': 1 });
    const dot = cross(F.gH, t.c[0], t.c[1], ha * 1.08, ha * 0.4, seed++, { fill: C.accent, stroke: C.accent, 'stroke-width': 1, 'data-audit': 'skip' });
    parts.push({ el: helper, x: t.c[0], how: 'fade', late: true });
    tiles[ch.id] = { check: ch, c: t.c, setFired: fireable(field, dot) };
  });
  const qubits = [];
  for (let q = 0; q < d * d; q++) {
    const [x, y] = pos(q);
    const el = cross(F.gQ, x, y, qa, qa * 0.3, 90 + q + (o.seed || 0), { fill: C.paper, stroke: C.ink, 'stroke-width': 1.3 });
    qubits.push({ q, x, y, el });
  }
  return { ...F, tiles, qubits, qr: qa * 0.75, parts, pitch };
}

// ---------------------------------------------------------------------------
// Fills for the article (18 November 2026): plain vectors, no filters.
// ---------------------------------------------------------------------------
// drawing units per screen pixel of the frame being built (svgRoot has set
// the lettering floor for it: MIN_PX = 11.5 screen px)
export const unitsPerPx = () => (textFloor() > 0 ? textFloor() / 11.5 : 1);

// a smooth closed curve through points (Catmull-Rom as cubic Béziers)
function closedSpline(pts) {
  const n = pts.length, f = (v) => v.toFixed(2);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

// points every `step` units along a closed outline
function around(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.round(L / step));
    for (let k = 0; k < n; k++) out.push([lerp(ax, bx, k / n), lerp(ay, by, k / n)]);
  }
  return out;
}

// A marker wash: the shape as one smooth, slightly uneven closed curve, set a
// little off the lines; flat colour, and a faintly darker rim where the ink
// pools at the edge of a marker stroke. pts: closed outline (first = last).
export function markerWash(parent, pts, seed, fill, o = {}) {
  const r = rng(seed);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const size = Math.max(...pts.map((p) => Math.hypot(p[0] - cx, p[1] - cy)));
  const amp = o.amp ?? size * 0.035, dx = o.dx ?? 0, dy = o.dy ?? 0;
  const ph = [r() * 6.28, r() * 6.28], k1 = 2 + Math.floor(r() * 2);
  const bw = Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0])), bh = Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]));
  const ring = around(pts, Math.max(3, Math.min(bw, bh) / 4)).map(([x, y]) => {
    const a = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy) || 1;
    const e = amp * (0.7 * Math.sin(k1 * a + ph[0]) + 0.3 * Math.sin((k1 + 3) * a + ph[1]));
    return [x + dx + ((x - cx) / d) * e, y + dy + ((y - cy) / d) * e];
  });
  const d = closedSpline(ring);
  const grp = g(parent, { 'data-audit': 'skip' });
  path(grp, d, { fill, stroke: 'none', 'fill-opacity': o.op ?? null });
  if (o.rim !== false) path(grp, d, { fill: 'none', stroke: o.rimColor || fill, 'stroke-width': o.rimW ?? Math.max(1, size * 0.03), 'stroke-opacity': o.rimOp ?? 1, 'stroke-linejoin': 'round', style: 'mix-blend-mode:multiply' });
  return grp;
}

// Fine wavy hatching, clipped to a closed outline. Each line is one smooth
// curve (a gentle sine sampled and joined as cubic Béziers), the same wave
// on every line, so nothing breaks or jitters. Spacing, width and wave are
// in screen pixels (px = drawing units per pixel), so the tone stays the
// same at any size: a smaller drawing gets fewer lines, not denser ones.
export function smoothHatch(parent, pts, C, seed, o = {}) {
  const px = o.px || unitsPerPx();
  const gap = (o.gap ?? 5.6) * px, w = o.wUnits ?? (o.w ?? 0.75) * px, amp = (o.amp ?? 1.0) * px, lam = (o.lambda ?? 19) * px;
  const id = `lat-hatch-${++uid}`;
  const clip = h('clipPath', { id }, parent);
  path(clip, pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('') + 'Z', { fill: '#000' });
  const grp = g(parent, { 'clip-path': `url(#${id})`, 'data-audit': 'skip' });
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const r = rng(seed);
  // lines at 45 degrees, rising to the right: u runs along a line, v across
  const ux = Math.SQRT1_2, uy = -Math.SQRT1_2, vx = Math.SQRT1_2, vy = Math.SQRT1_2;
  const span = (x1 - x0) + (y1 - y0);
  const v0 = (x0 * vx + y0 * vy), v1 = (x1 * vx + y1 * vy);
  const off = r() * gap;
  let d = '';
  for (let v = v0 + off - gap; v <= v1 + gap; v += gap) {
    const phase = r() * 0.6;                       // a little per line, still one smooth curve
    const u0 = (x0 * ux + y1 * uy) - 4 * px, u1 = (x1 * ux + y0 * uy) + 4 * px;
    const n = Math.max(4, Math.ceil((u1 - u0) / (lam / 8)));
    const line = [];
    for (let i = 0; i <= n; i++) {
      const u = lerp(u0, u1, i / n), s = amp * (0.8 * Math.sin((u / lam) * Math.PI * 2 + phase * 6.28) + 0.35 * Math.sin((u / (lam * 2.7)) * Math.PI * 2 + phase * 11));
      line.push([u * ux + (v + s) * vx, u * uy + (v + s) * vy]);
    }
    d += spline(line);
  }
  if (span) path(grp, d, { stroke: o.stroke || C.muted, 'stroke-width': w.toFixed(3), opacity: o.op ?? 0.6, 'stroke-linecap': 'round', fill: 'none' });
  return grp;
}

// Pencil hatching, clipped to a closed outline: near-straight strokes at one
// angle, each a little different (angle within 3 degrees, spacing within 20%,
// some stopping short of the edge or starting a little in), each a thin
// filled shape that swells and thins along its length like pencil pressure,
// with a very slight bow. Seeded, so it is the same on every render. Spacing
// and width are in screen pixels (px = drawing units per pixel), so the tone
// is the same at every size. wPx: drawing units per pixel for the stroke
// width when it differs from px (a grid that will be shrunk later).
export function pencilHatch(parent, pts, C, seed, o = {}) {
  const px = o.px || unitsPerPx(), wpx = o.wPx || px;
  const gap = (o.gap ?? 4.6) * px, w0 = (o.w ?? 0.8) * wpx;
  const id = `lat-pencil-${++uid}`;
  const clip = h('clipPath', { id }, parent);
  path(clip, pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('') + 'Z', { fill: '#000' });
  const grp = g(parent, { 'clip-path': `url(#${id})`, 'data-audit': 'skip' });
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const r = rng(seed * 7919 + 13);
  // each tile its own angle (within 4 degrees) and its own spacing
  const base = -Math.PI / 4 + ((r() - 0.5) * 8 * Math.PI) / 180;
  const gapT = gap * (0.88 + 0.24 * r());
  // walk across the tile perpendicular to the strokes
  const nx = Math.SQRT1_2, ny = Math.SQRT1_2;
  const v0 = x0 * nx + y0 * ny, v1 = x1 * nx + y1 * ny;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, half = Math.hypot(x1 - x0, y1 - y0) / 2 + 2 * px;
  let d = '';
  for (let v = v0 - gapT * r(); v <= v1 + gapT; v += gapT * (0.72 + 0.56 * r())) {
    const a = base + ((r() - 0.5) * 6 * Math.PI) / 180;
    const ux = Math.cos(a), uy = Math.sin(a);
    // the stroke's middle on the line v, nearest the tile's centre
    const off = v - (cx * nx + cy * ny);
    const mx = cx + nx * off, my = cy + ny * off;
    let t0 = -half, t1 = half;
    if (r() < 0.35) t0 += half * (0.15 + 0.35 * r());     // starts a little in
    if (r() < 0.35) t1 -= half * (0.15 + 0.35 * r());     // stops short
    const bow = (r() - 0.5) * 1.6 * px;                     // a slight bow, not a wave
    const wA = w0 * (0.75 + 0.5 * r()), wB = w0 * (0.45 + 0.4 * r()), peak = 0.3 + 0.4 * r();
    const N = 10, left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, tt = t0 + (t1 - t0) * t;
      const b = bow * 4 * t * (1 - t);
      // pressure: heavier near 'peak', lighter at the ends
      const wv = (t < peak ? wA * (0.55 + 0.45 * (t / peak)) : wA + (wB - wA) * ((t - peak) / (1 - peak))) / 2;
      const px0 = mx + ux * tt - uy * b, py0 = my + uy * tt + ux * b;
      left.push([px0 - uy * wv, py0 + ux * wv]);
      right.push([px0 + uy * wv, py0 - ux * wv]);
    }
    const ring = [...left, ...right.reverse()];
    d += ring.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('') + 'Z';
  }
  path(grp, d, { fill: o.stroke || C.muted, stroke: 'none', opacity: o.op ?? 0.62 });
  return grp;
}

// One marker pass over a cell: flat colour, no rim, no filter. Edges inside
// the grid run straight along the tile's edge and a hair past it (under the
// drawn edge line), so two fired neighbours meet without a seam; edges on the
// rim of the grid sit a little in from it, with a gentle bow of their own;
// the corners are rounded where the stroke turns (they lie under the qubit
// circles). Each cell gets its own seed. inside(a, b): is the edge between
// storing qubits a and b shared with another tile.
export function cellWash(parent, check, pos, inside, seed, fill, o = {}) {
  const px = o.px || unitsPerPx(), r = rng(seed * 104729 + 7);
  const f = (v) => v.toFixed(2);
  const over = 0.45 * px, inset = (1.4 + 0.8 * r()) * px;
  let d;
  if (check.shape === 'square') {
    const q = [check.qubits[0], check.qubits[1], check.qubits[3], check.qubits[2]];
    const P = q.map(pos), cx = P.reduce((s, p) => s + p[0], 0) / 4, cy = P.reduce((s, p) => s + p[1], 0) / 4;
    // each edge moved along its outward normal: a hair out inside the grid, in on the rim
    const E = q.map((a, i) => {
      const b = q[(i + 1) % 4], A = P[i], B = P[(i + 1) % 4];
      const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
      let nx = dy / L, ny = -dx / L;
      if ((A[0] + B[0]) / 2 * nx + (A[1] + B[1]) / 2 * ny < cx * nx + cy * ny) { nx = -nx; ny = -ny; }
      const m = inside(a, b) ? over : -inset;
      return { A: [A[0] + nx * m, A[1] + ny * m], B: [B[0] + nx * m, B[1] + ny * m], nx, ny, rim: !inside(a, b), L };
    });
    // corners: where neighbouring moved edges meet
    const cross = (e1, e2) => {
      const [x1, y1] = e1.A, [x2, y2] = e1.B, [x3, y3] = e2.A, [x4, y4] = e2.B;
      const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
      return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
    };
    const K = E.map((e, i) => cross(E[(i + 3) % 4], e));     // K[i]: start of edge i
    const rc = E.map(() => (2 + 3 * r()) * px);              // rounding at each corner
    const at = (p, q2, dist) => { const L = Math.hypot(q2[0] - p[0], q2[1] - p[1]); return [p[0] + ((q2[0] - p[0]) * dist) / L, p[1] + ((q2[1] - p[1]) * dist) / L]; };
    d = '';
    for (let i = 0; i < 4; i++) {
      const s0 = K[i], s1 = K[(i + 1) % 4], e = E[i];
      const a = at(s0, s1, rc[i]), b = at(s1, s0, rc[(i + 1) % 4]);
      if (i === 0) d += `M${f(a[0])} ${f(a[1])}`;
      if (e.rim) {
        // a gentle bow inward, a little off centre: the long side of a marker stroke
        const bw = (0.4 + 0.9 * r()) * px, tpos = 0.35 + 0.3 * r();
        const c = [a[0] + (b[0] - a[0]) * tpos - e.nx * bw * 2, a[1] + (b[1] - a[1]) * tpos - e.ny * bw * 2];
        d += `Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
      } else d += `L${f(b[0])} ${f(b[1])}`;
      const n = K[(i + 1) % 4], nxt = at(n, K[(i + 2) % 4], rc[(i + 1) % 4]);
      d += `Q${f(n[0])} ${f(n[1])} ${f(nxt[0])} ${f(nxt[1])}`;
    }
    d += 'Z';
  } else {
    // a half tile: the chord is inside the grid, the arc is on the rim
    const [A, B] = check.qubits.map(pos);
    const OUT = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] }[check.edge];
    const R = Math.hypot(B[0] - A[0], B[1] - A[1]) / 2, mx = (A[0] + B[0]) / 2 - OUT[0] * over, my = (A[1] + B[1]) / 2 - OUT[1] * over;
    const u = [(B[0] - A[0]) / (2 * R), (B[1] - A[1]) / (2 * R)];
    const Ri = R - inset, ph = r() * 6.28, amp = (0.3 + 0.5 * r()) * px, N = 16, pts = [];
    for (let i = 0; i <= N; i++) {
      const th = 0.12 + (i / N) * (Math.PI - 0.24);
      const rr = Ri + amp * Math.sin(th * 2 + ph) * Math.sin(th);
      pts.push([mx - rr * Math.cos(th) * u[0] + rr * Math.sin(th) * OUT[0], my - rr * Math.cos(th) * u[1] + rr * Math.sin(th) * OUT[1]]);
    }
    // ends of the chord, a little in from the qubits (under their circles)
    const e0 = [mx - u[0] * (R - 2 * px), my - u[1] * (R - 2 * px)], e1 = [mx + u[0] * (R - 2 * px), my + u[1] * (R - 2 * px)];
    d = `M${f(e0[0])} ${f(e0[1])}Q${f(e0[0] + OUT[0] * Ri * 0.12)} ${f(e0[1] + OUT[1] * Ri * 0.12)} ${f(pts[0][0])} ${f(pts[0][1])}`;
    d += spline(pts).replace(/^M[^C]*/, '');
    d += `Q${f(e1[0] + OUT[0] * Ri * 0.12)} ${f(e1[1] + OUT[1] * Ri * 0.12)} ${f(e1[0])} ${f(e1[1])}Z`;
  }
  return path(parent, d, { fill, stroke: 'none', 'data-audit': 'skip' });
}

// Pencil hatching as a person does it: short strokes in small bundles of 4 to
// 7 that drift, each bundle its own angle and length, starting and stopping
// at different points, with small unhatched gaps between bundles. Clipped to
// the tile, seeded. Sizes in screen pixels (px = drawing units per pixel),
// so the tone stays the same at every size; o.cell: the spacing of bundles.
export function bundleHatch(parent, pts, C, seed, o = {}) {
  const px = o.px || unitsPerPx(), wpx = o.wPx || px;
  const cell = (o.cell ?? 21) * px, step = 2.7 * px, w = (o.w ?? 0.75) * wpx;
  const id = `lat-bundle-${++uid}`;
  const clip = h('clipPath', { id }, parent);
  path(clip, pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('') + 'Z', { fill: '#000' });
  const grp = g(parent, { 'clip-path': `url(#${id})`, 'data-audit': 'skip' });
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const r = rng(seed * 6151 + 29);
  const f = (v) => v.toFixed(2);
  let d = '';
  // bundles on a loose, staggered grid; a few places are left empty
  for (let row = 0, y = y0 - cell * 0.3; y < y1 + cell * 0.5; row++, y += cell * 0.82) {
    for (let x = x0 - cell * 0.4 + (row % 2) * cell * 0.5; x < x1 + cell * 0.5; x += cell) {
      if (r() < 0.18) continue;
      const bx = x + (r() - 0.5) * cell * 0.35, by = y + (r() - 0.5) * cell * 0.3;
      const a = -Math.PI / 4 + ((r() - 0.5) * 22 * Math.PI) / 180;
      const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
      const n = 4 + Math.floor(r() * 3), L = cell * (0.45 + 0.3 * r());
      const drift = (r() - 0.5) * 0.25;                       // the bundle leans as it goes
      for (let i = 0; i < n; i++) {
        const o2 = (i - (n - 1) / 2) * step * (0.85 + 0.3 * r());
        const s0 = -L / 2 + (r() - 0.3) * L * 0.25 + i * drift * step, s1 = L / 2 - (r() - 0.3) * L * 0.25 + i * drift * step;
        const cx = bx + nx * o2, cy = by + ny * o2;
        const bow = (r() - 0.5) * 0.8 * px;
        const A = [cx + ux * s0, cy + uy * s0], B = [cx + ux * s1, cy + uy * s1];
        const M = [(A[0] + B[0]) / 2 + nx * bow, (A[1] + B[1]) / 2 + ny * bow];
        d += `M${f(A[0])} ${f(A[1])}Q${f(M[0])} ${f(M[1])} ${f(B[0])} ${f(B[1])}`;
      }
    }
  }
  path(grp, d, { stroke: o.stroke || C.muted, 'stroke-width': f(w), 'stroke-linecap': 'round', fill: 'none', opacity: o.op ?? 0.55 });
  return grp;
}

// A marker pass over a cell: two or three broad parallel strokes with a
// visible direction, translucent so they are a little darker where they
// overlap, round at the ends, which stop a hair inside the cell. The sides
// along the strokes are clipped at the cell's edge (under its line), so no
// white gap opens beside it. Seeded per cell: direction, widths and lengths.
export function markerPass(parent, pts, seed, fill, o = {}) {
  const px = o.px || unitsPerPx(), r = rng(seed * 3571 + 11);
  const f = (v) => v.toFixed(2);
  const id = `lat-marker-${++uid}`;
  const clip = h('clipPath', { id }, parent);
  path(clip, pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('') + 'Z', { fill: '#000' });
  const grp = g(parent, { 'clip-path': `url(#${id})`, 'data-audit': 'skip' });
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  // strokes run roughly across the cell's longer side, tilted a little
  const horiz = (x1 - x0) >= (y1 - y0) ? r() < 0.75 : r() < 0.25;
  const a = (horiz ? 0 : Math.PI / 2) + ((r() - 0.5) * 10 * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  // the cell's extent along and across the strokes
  const along = pts.map((p) => (p[0] - cx) * ux + (p[1] - cy) * uy), across = pts.map((p) => (p[0] - cx) * nx + (p[1] - cy) * ny);
  const aMin = Math.min(...along), aMax = Math.max(...along), cMin = Math.min(...across), cMax = Math.max(...across);
  const n = 2 + (r() < 0.5 ? 1 : 0), span = cMax - cMin;
  const W = (span / n) * (1.22 + 0.12 * r());
  const end = 1.6 * px + W / 2;                              // round ends stop a hair inside
  let prev = cMin + W / 2 - 0.6 * px;
  for (let i = 0; i < n; i++) {
    const c = i === 0 ? prev : i === n - 1 ? cMax - W / 2 + 0.6 * px : prev + (span - W) / (n - 1) * (0.9 + 0.2 * r());
    prev = c;
    const s0 = aMin + end + r() * 2.5 * px, s1 = aMax - end - r() * 2.5 * px;
    const slant = (r() - 0.5) * 1.2 * px;                    // the hand drifts a little across
    const A = [cx + ux * s0 + nx * (c - slant), cy + uy * s0 + ny * (c - slant)];
    const B = [cx + ux * s1 + nx * (c + slant), cy + uy * s1 + ny * (c + slant)];
    path(grp, `M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}`, {
      stroke: fill, 'stroke-width': f(W * (0.95 + 0.1 * r())), 'stroke-linecap': 'round', fill: 'none', opacity: 0.78,
    });
  }
  return grp;
}
