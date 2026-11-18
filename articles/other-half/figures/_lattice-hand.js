// Grid lab: hand-drawn parts for the `lattice` variants. Pen lines from
// lib/fig.js (pen, penRing), a misregistered colour wash for what fires,
// written letters for errors, tallies for counted chances. Two grid
// renderers with the interface the scene needs:
//   gridA: the lattice as a few long pen strokes, washes for the checks
//   gridB: the chip itself, in pen: cross-shaped qubits (the Xmon shape of
//          real superconducting chips), the helpers between them, couplers
//          drawn from each helper to the storing qubits it asks
import { g, h, circle, path, pen, penRing, rng, lerp } from '../../../lib/fig.js';

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
