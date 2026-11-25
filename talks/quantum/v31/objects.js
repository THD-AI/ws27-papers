// v3.1 code objects: chip, film, reader (rack), in 30° iso, drawn with ONE shared
// hand pen that matches the forged cryostat's line (block 4c): rough.js single
// stroke with slight bowing on long edges, freehand ellipses at the same
// roughness, curved runs for cables and the film curl, and a per-stroke weight
// within the object token ± 15% (pressure-like variation). Map units.
// Each path is { d, w }: w is the stroke width in screen px (non-scaling).
import rough from '../../../lib/vendor/rough.esm.js';

const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
const gen = rough.generator();
const PX = 1 / 0.8; // map units per screen px at the reading cameras
export const TOKEN = 3, VAR = 0.05, DASH = 22;

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function pen(name) {
  const seed = [...name].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const r = rng(seed), out = [];
  const opt = (long) => ({ roughness: 0.35, bowing: long ? 0.5 : 0.2, disableMultiStroke: true, preserveVertices: false, seed: 1 + Math.floor(r() * 1e6), curveFitting: 0.9 });
  const w = () => +(TOKEN * (1 - VAR + 2 * VAR * r())).toFixed(2);
  const push = (dr) => out.push(...gen.toPaths(dr).map((p) => ({ d: p.d, w: w() })));
  return {
    out,
    line([x1, y1], [x2, y2]) {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      const o1 = r() * PX, o2 = r() * PX; // overshoot ≤ 1 px
      push(gen.line(x1 - ux * o1, y1 - uy * o1, x2 + ux * o2, y2 + uy * o2, opt(L > 200)));
    },
    poly(pts, close = true) { for (let i = 0; i < pts.length - (close ? 0 : 1); i++) this.line(pts[i], pts[(i + 1) % pts.length]); },
    ellipse([cx, cy], ew, eh) { push(gen.ellipse(cx, cy, ew, eh, { ...opt(false), roughness: 0.4 })); },
    curve(pts) { push(gen.curve(pts, opt(true))); },
    // one stroke through all points (hand jitter ≤ 0.5 px per vertex)
    path(pts, close = true) { const q = pts.map(([x, y]) => [x + (r() - 0.5) * PX, y + (r() - 0.5) * PX]); out.push({ d: 'M' + q.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L') + (close ? 'Z' : ''), w: w() }); },
  };
}

const iso = ([x, y], u, v, z) => [x + (u - v) * C30, y - (u + v) * S30 - z];

function slab(P, o, U, V, z0, H) {
  const b = [[0, 0], [U, 0], [U, V], [0, V]].map(([u, v]) => iso(o, u, v, z0));
  const t = [[0, 0], [U, 0], [U, V], [0, V]].map(([u, v]) => iso(o, u, v, z0 + H));
  P.line(b[3], b[0]); P.line(b[0], b[1]);
  P.line(b[3], t[3]); P.line(b[0], t[0]); P.line(b[1], t[1]);
  P.poly(t);
  return t;
}

// SMP-style connector: a hex-nut collar on the carrier, a slim body, a cable leaving outwards
function coax(P, o, u, v, z, dir) {
  const b = iso(o, u, v, z), n = iso(o, u, v, z + 10), t = iso(o, u, v, z + 26);
  P.ellipse(n, 52, 30); P.line([b[0] - 26, b[1]], [n[0] - 26, n[1]]); P.line([b[0] + 26, b[1]], [n[0] + 26, n[1]]);
  P.ellipse(t, 30, 17); P.line([n[0] - 15, n[1]], [t[0] - 15, t[1]]); P.line([n[0] + 15, n[1]], [t[0] + 15, t[1]]);
  P.curve([t, [t[0] + dir[0] * 30, t[1] + dir[1] * 50], [t[0] + dir[0] * 120, t[1] + dir[1] * 90], [t[0] + dir[0] * 250, t[1] + dir[1] * 100]]);
}

// Chip: flip-chip die on a carrier, pad ring with bond wires, four coax connectors with cables.
export function chip(o) {
  const P = pen('chip'), U = 560, V = 560;
  slab(P, o, U, V, 0, 40);
  slab(P, iso(o, 170, 170, 40), 220, 220, 0, 26);
  for (let a = 205; a < 380; a += 55) for (let c = 205; c < 380; c += 55) P.line(iso(o, a, c, 66), iso(o, a + DASH, c, 66));
  for (let k = 200; k <= 360; k += 52) for (const [pu, pv, du, dv] of [[k, 135, k, 172], [k, 425, k, 388], [135, k, 172, k], [425, k, 388, k]]) {
    P.line(iso(o, pu - 7, pv, 40), iso(o, pu + 7, pv, 40));
    P.line(iso(o, pu, pv, 40), iso(o, du, dv, 66));
  }
  for (let u = 90; u < U - 60; u += 60) P.line(iso(o, u, 0, 20), iso(o, u + DASH, 0, 20));
  coax(P, o, 60, 60, 40, [0.5, 1]); coax(P, o, U - 60, 60, 40, [1, -0.6]); coax(P, o, 60, V - 60, 40, [-1, -0.6]); coax(P, o, U - 60, V - 60, 40, [-0.5, -1]);
  // carrier markings: ground-via rows inside the edges
  for (let s = 70; s < U - 40; s += 48) for (const [a, b] of [[s, 30], [30, s], [s, V - 30], [U - 30, s]]) P.line(iso(o, a - DASH / 2, b, 40), iso(o, a + DASH / 2, b, 40));
  return P.out;
}

// Film: a strip along +30° with sprocket holes and frames; its newest end curls up.
export function film(o) {
  const P = pen('film'), U = 1000, V = 200;
  P.line(iso(o, 0, 0, 0), iso(o, U, 0, 0)); P.line(iso(o, 0, V, 0), iso(o, U, V, 0)); P.line(iso(o, 0, 0, 0), iso(o, 0, V, 0));
  P.line(iso(o, 0, 40, 0), iso(o, U, 40, 0)); P.line(iso(o, 0, V - 40, 0), iso(o, U, V - 40, 0));
  for (let u = 0; u <= U; u += 180) P.line(iso(o, u, 40, 0), iso(o, u, V - 40, 0));
  for (let u = 0; u < U - 180; u += 180) for (let i = 0; i < 4; i++) { const uu = u + 30 + ((i * 53) % 120), vv = 60 + ((i * 37) % 80); P.line(iso(o, uu, vv, 0), iso(o, uu + DASH, vv, 0)); }
  for (let u = 30; u < U - 20; u += 90) for (const v of [12, V - 28]) P.poly([[u, v], [u + 22, v], [u + 22, v + 16], [u, v + 16]].map(([a, b]) => iso(o, a, b, 0)));
  // curl: both edges rise in a quarter turn past the end
  for (const v of [0, V]) P.curve([iso(o, U, v, 0), iso(o, U + 90, v, 20), iso(o, U + 140, v, 100), iso(o, U + 120, v, 190), iso(o, U + 60, v, 220)]);
  P.line(iso(o, U + 60, 0, 220), iso(o, U + 60, V, 220));
  return P.out;
}

// Reader: an ordinary computer – a 19-inch rack with ears, unit rails, servers, vents and a cable run.
export function reader(o) {
  const P = pen('reader'), U = 300, V = 380, H = 620;
  slab(P, o, U, V, 0, H);
  const F = (u, z) => iso(o, u, 0, z);
  // unit rails and rack ears on the front face
  P.line(F(26, 24), F(26, H - 30)); P.line(F(U - 26, 24), F(U - 26, H - 30));
  for (let z = 60, i = 0; z < H - 70; z += i % 3 ? 45 : 70, i++) {
    P.line(F(26, z), F(U - 26, z));
    P.line(F(14, z + 6), F(14, z + 34)); P.line(F(U - 14, z + 6), F(U - 14, z + 34));
    if (i % 2 === 0) for (let u = 50; u < 170; u += 34) P.line(F(u, z + 22), F(u + DASH, z + 22));
    P.line(F(U - 70, z + 18), F(U - 46, z + 18));
  }
  // vents on the side face, near the top
  for (let v = 60; v < V - 60; v += 56) for (let z = 90; z < H - 60; z += 70) P.line(iso(o, 0, v, z), iso(o, 0, v + DASH, z));
  // top: inset lid and vent grille
  P.poly([[30, 30], [U - 30, 30], [U - 30, V - 30], [30, V - 30]].map(([u, v]) => iso(o, u, v, H)));
  // vent grille: parallel dash rows across the lid
  for (let v = 70; v < V - 50; v += 34) for (let u = 60; u < U - 60; u += 50) P.line(iso(o, u, v, H), iso(o, u + DASH, v, H));
  // cable run leaving the top towards the film
  // cable: leaves the rear of the lid sideways and drops to the floor beside the cabinet
  for (const d of [0, 22]) P.curve([iso(o, U - 40, V - 40 - d, H), iso(o, U + 40, V - 40 - d, H - 10), iso(o, U + 90, V - 50 - d, H - 120), iso(o, U + 100, V - 60 - d, 0)]);
  return P.out;
}

// ---- overview variants (beat 0): silhouette + 2–3 key lines, same pen ----
export function chipOverview(o) { const P = pen('chip-ov'), U = 560, V = 560; P.poly([[0, 0], [U, 0], [U, V], [0, V]].map(([u, v]) => iso(o, u, v, 40))); P.line(iso(o, 0, 0, 0), iso(o, U, 0, 0)); P.poly([[170, 170], [390, 170], [390, 390], [170, 390]].map(([u, v]) => iso(o, u, v, 66))); return P.out; }
export function filmOverview(o) { const P = pen('film-ov'), U = 1000, V = 200; P.poly([[0, 0], [U, 0], [U, V], [0, V]].map(([u, v]) => iso(o, u, v, 0))); for (const u of [360, 720]) P.line(iso(o, u, 0, 0), iso(o, u, V, 0)); return P.out; }
export function readerOverview(o) { const P = pen('reader-ov'), U = 300, V = 380, H = 620; slab(P, o, U, V, 0, H); P.line(iso(o, 26, 0, 300), iso(o, U - 26, 0, 300)); return P.out; }
// cryostat overview: silhouette (top plate and can) + the three lower plates, measured on the forged image (source px, 1024 × 1536)
export function cryoOverview() {
  const P = pen('cryo-ov');
  P.line([462, 190], [462, 330]); P.line([560, 190], [560, 330]);
  P.ellipse([512, 435], 642, 210); P.ellipse([506, 760], 595, 120); P.ellipse([507, 1080], 512, 100); P.ellipse([501, 1270], 317, 70);
  P.line([258, 540], [258, 700]); P.line([768, 540], [768, 700]);
  P.line([262, 820], [262, 1040]); P.line([749, 820], [749, 1040]);
  P.line([358, 1120], [358, 1240]); P.line([642, 1120], [642, 1240]);
  P.poly([[439, 1410], [507, 1390], [575, 1410], [507, 1440]]);
  return P.out;
}
export const countStrokes = (ds) => ds.reduce((a, d) => a + (d.d || d).split(/(?=M)/).length, 0);

// ---- block 5 kit: check tile, qubit, film piece, pile, prism, back plane, ruler ----

// Check tile (reference: surface-code layout figures): a square tile with a 3 × 3 dot grid
// of storing qubits and a diamond (the check) joining four of them.
export function checkTile(o, s = 180) {
  const P = pen('tile');
  P.poly([[0, 0], [s, 0], [s, s], [0, s]].map(([u, v]) => iso(o, u, v, 0)));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const c = iso(o, s * (i + 0.5) / 3, s * (j + 0.5) / 3, 0); P.ellipse(c, 14, 8); }
  const m = (i, j) => iso(o, s * (i + 0.5) / 3, s * (j + 0.5) / 3, 0);
  P.poly([m(1, 0), m(2, 1), m(1, 2), m(0, 1)]); // the check: a diamond on its four neighbours
  return P.out;
}

// Lifted tile for beat 4: the smallest grid, 3 × 3 storing qubits, its four inner checks;
// the fired checks carry an inner diamond (reference: the article's lattice.js puzzle).
export function liftedTile(o, s = 420, fired = [0, 1, 3]) {
  const P = pen('lifted');
  P.poly([[0, 0], [s, 0], [s, s], [0, s]].map(([u, v]) => iso(o, u, v, 0)));
  const m = (i, j) => iso(o, s * (i + 0.5) / 3, s * (j + 0.5) / 3, 0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) P.ellipse(m(i, j), 22, 13);
  [[0.5, 0.5], [1.5, 0.5], [0.5, 1.5], [1.5, 1.5]].forEach(([ci, cj], k) => {
    const d = (r) => [[ci - r, cj], [ci, cj - r], [ci + r, cj], [ci, cj + r]].map(([a, b]) => m(a, b));
    P.poly(d(0.42));
    if (fired.includes(k)) P.poly(d(0.22));
  });
  return P.out;
}

// Qubit with its smear: a dot and iso ripples (ratio 0.577), the water image of beat 1.
export function qubit(o, r = 70, rings = 3) {
  const P = pen('qubit');
  P.ellipse(o, 18, 10);
  for (let i = 1; i <= rings; i++) P.ellipse(o, 2 * r * i, 2 * r * i * 0.577);
  return P.out;
}

// One film frame, flat on the ground (the sprite of the pile and the film strip).
export function frame(o, U = 160, V = 120, name = 'frame') { // U, V: frame size along the strip
  const P = pen(name);
  P.poly([[0, 0], [U, 0], [U, V], [0, V]].map(([u, v]) => iso(o, u, v, 0)));
  P.line(iso(o, 20, V / 2, 0), iso(o, 20 + DASH, V / 2, 0));
  return P.out;
}

// Pile of unread frames: one frame per N unread, stacked; spacing in map units chosen so
// it is ≥ 8 px at the CD camera (0.6 px per unit → 14 units).
export function pile(o, count, gap = 21, grey = 4) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const j = ((i * 7919) % 5) - 2 + i * 1.6; // stable jitter plus a slight lean
    const P = pen('pile-' + i);
    const p = [o[0] + j, o[1] - i * gap];
    P.path([[0, 0], [160, 0], [160, 120], [0, 120]].map(([u, v]) => iso(p, u, v, 0))); // one stroke per frame
    out.push(...P.out.map((q) => (i < grey ? { ...q, cls: 'context' } : q)));
  }
  return out;
}

// Prism: one rate as an iso column on a zero baseline.
export function prism(o, h, s = 90, name = 'prism') {
  const P = pen(name);
  slab(P, o, s, s, 0, h);
  return P.out;
}

// Back plane for a prism row: vertical wall behind the row, zero baseline along the
// front, height ticks up the wall every 'step' units (the grid as the axis).
export function backPlane(o, len, top, step, name = 'plane') {
  const P = pen(name);
  const a = iso(o, 0, 0, 0), b = iso(o, len, 0, 0);
  P.line(a, b);                                         // zero baseline
  P.line(a, iso(o, 0, 0, top)); P.line(b, iso(o, len, 0, top)); P.line(iso(o, 0, 0, top), iso(o, len, 0, top));
  for (let z = step; z <= top; z += step) P.line(iso(o, 0, 0, z), iso(o, DASH * 1.4, 0, z)); // ticks
  return P.out;
}

// Back plane for a row standing on one screen baseline (x-axis): baseline, end posts,
// height ticks on the left post, and a faint top line at the tallest value.
export function backPlaneX(o, len, top, step, tallest, name = 'planex') {
  const P = pen(name);
  P.line(o, [o[0] + len, o[1]]);
  P.line(o, [o[0], o[1] - top]);
  for (let z = step; z <= top; z += step) P.line([o[0], o[1] - z], [o[0] + DASH * 1.2, o[1] - z]);
  const out = P.out, Q = pen(name + '-top');
  Q.line([o[0], o[1] - tallest], [o[0] + len, o[1] - tallest]);
  return [...out, ...Q.out.map((q) => ({ ...q, cls: 'context' }))];
}

// Ruler (beat 8): a straight line with end ticks and second ticks along it.
export function ruler(p, dir, len, every = 0, tick = 40) {
  const P = pen('ruler-' + Math.round(len));
  const q = [p[0] + dir[0] * len, p[1] + dir[1] * len], n = [-dir[1] * tick, dir[0] * tick];
  P.line(p, q); P.line([p[0] - n[0], p[1] - n[1]], [p[0] + n[0], p[1] + n[1]]); P.line([q[0] - n[0], q[1] - n[1]], [q[0] + n[0], q[1] + n[1]]);
  if (every) for (let s = every; s < len - 1; s += every) { const m = [p[0] + dir[0] * s, p[1] + dir[1] * s]; P.line(m, [m[0] + n[0] / 2, m[1] + n[1] / 2]); }
  return P.out;
}

// overview variants for the kit (≤ 20 strokes)
export function pileOverview(o, h) { h = h * 1.5; const P = pen('pile-ov'); P.poly([[0, 0], [160, 0], [160, 120], [0, 120]].map(([u, v]) => iso(o, u, v, 0))); P.line(iso(o, 0, 0, 0), iso(o, 0, 0, h)); P.line(iso(o, 160, 0, 0), iso(o, 160, 0, h)); P.poly([[0, 0], [160, 0], [160, 120], [0, 120]].map(([u, v]) => iso(o, u, v, h))); return P.out; }
export function qubitOverview(o) { return qubit(o, 70, 1); }
