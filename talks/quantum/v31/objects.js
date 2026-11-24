// v3.1 code objects (block 4 minimum): chip, film, reader, in strict 30° iso,
// drawn with ONE shared imperfection model (VISUAL.md §5): rough.js at
// roughness 0.3, bowing 0, single stroke, a seeded wobble per object, endpoint
// overshoot 1–3 px and occasional open corners. Map units; px per unit ~0.8.
import rough from '../../../lib/vendor/rough.esm.js';

const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
const gen = rough.generator();
const PX = 1 / 0.8; // map units per screen px at the reading cameras

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// the pen: every object gets one, seeded by name
export function pen(name) {
  let seed = [...name].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const r = rng(seed), out = [];
  const opt = () => ({ roughness: 0.3, bowing: 0, disableMultiStroke: true, seed: 1 + Math.floor(r() * 1e6) });
  return {
    out,
    line([x1, y1], [x2, y2]) {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      const o1 = (r() < 0.08 ? -2 : 1 + r() * 2) * PX, o2 = (r() < 0.08 ? -2 : 1 + r() * 2) * PX; // overshoot, sometimes an open corner
      const d = gen.toPaths(gen.line(x1 - ux * o1, y1 - uy * o1, x2 + ux * o2, y2 + uy * o2, opt()));
      out.push(...d.map((p) => p.d));
    },
    poly(pts, close = true) { for (let i = 0; i < pts.length - (close ? 0 : 1); i++) this.line(pts[i], pts[(i + 1) % pts.length]); },
    ellipse([cx, cy], w, h) { out.push(...gen.toPaths(gen.ellipse(cx, cy, w, h, opt())).map((p) => p.d)); },
  };
}

// iso helpers: u along +30° (right-up), v along −30° (left-up... i.e. right-down mirrored), z up
const iso = ([x, y], u, v, z) => [x + (u - v) * C30, y - (u + v) * S30 - z];

function slab(P, o, U, V, z0, H) {
  const b = [[0, 0], [U, 0], [U, V], [0, V]].map(([u, v]) => iso(o, u, v, z0));
  const t = [[0, 0], [U, 0], [U, V], [0, V]].map(([u, v]) => iso(o, u, v, z0 + H));
  // visible: front edges of base (v=0 side and u=0 side face the viewer), verticals, top
  P.line(b[3], b[0]); P.line(b[0], b[1]);
  P.line(b[3], t[3]); P.line(b[0], t[0]); P.line(b[1], t[1]);
  P.poly(t);
  return t;
}

// Chip: flip-chip die on a ceramic carrier, four coax connectors on the carrier edge.
export function chip(o) {
  const P = pen('chip'), U = 560, V = 560;
  const c0 = [o[0] - 0, o[1] + 0];
  slab(P, c0, U, V, 0, 40);
  slab(P, iso(c0, 170, 170, 40).map((v, i) => v + [0, 0][i]), 220, 220, 0, 26);
  // die face: bump grid as short strokes; carrier: trace lines from die to connectors, edge pads
  for (let a = 190; a < 380; a += 30) for (let c = 190; c < 380; c += 30) P.line(iso(c0, a, c, 66), iso(c0, a + 10, c, 66));
  for (const [u, v] of [[60, 60], [U - 60, 60], [60, V - 60], [U - 60, V - 60]]) for (const d of [-14, 0, 14]) P.line(iso(c0, u + (u < U / 2 ? 40 : -40), v + d, 40), iso(c0, u < U / 2 ? 170 : 390, v < V / 2 ? 170 + d + 30 : 390 + d - 30, 40));
  for (let u = 100; u < U - 80; u += 40) P.line(iso(c0, u, 0, 10), iso(c0, u, 0, 30));
  // coax connectors: short iso cylinders standing on the carrier
  for (const [u, v] of [[60, 60], [U - 60, 60], [60, V - 60], [U - 60, V - 60]]) {
    const b = iso(c0, u, v, 40), t = iso(c0, u, v, 110);
    P.ellipse(t, 56, 32); P.line([b[0] - 28, b[1]], [t[0] - 28, t[1]]); P.line([b[0] + 28, b[1]], [t[0] + 28, t[1]]);
  }
  return P.out;
}

// Film: a strip lying on the ground along +30°, sprocket holes on both edges, frame dividers.
export function film(o) {
  const P = pen('film'), U = 1100, V = 200;
  P.poly([[0, 0], [U, 0], [U, V], [0, V]].map(([u, v]) => iso(o, u, v, 0)));
  P.line(iso(o, 0, 40, 0), iso(o, U, 40, 0)); P.line(iso(o, 0, V - 40, 0), iso(o, U, V - 40, 0));
  for (let u = 0; u < U; u += 180) P.line(iso(o, u, 40, 0), iso(o, u, V - 40, 0));
  for (let u = 30; u < U - 20; u += 60) for (const v of [12, V - 28]) P.poly([[u, v], [u + 22, v], [u + 22, v + 16], [u, v + 16]].map(([a, b]) => iso(o, a, b, 0)));
  return P.out;
}

// Reader: an ordinary computer – a rack cabinet with rack units, a vent and a door handle.
export function reader(o) {
  const P = pen('reader'), U = 300, V = 380, H = 620;
  slab(P, o, U, V, 0, H);
  // front face is the v = 0 plane (faces the viewer, lower left); rack units across it
  const F = (u, z) => iso(o, u, 0, z);
  P.poly([[24, 30], [U - 24, 30], [U - 24, H - 40], [24, H - 40]].map(([u, z]) => F(u, z)));
  for (let z = 60, i = 0; z < H - 70; z += i % 3 ? 45 : 70, i++) {
    P.line(F(24, z), F(U - 24, z));
    if (i % 2 === 0) for (let u = 50; u < 170; u += 24) P.line(F(u, z + 12), F(u, z + 30));
    P.line(F(U - 70, z + 16), F(U - 46, z + 16));
  }
  return P.out;
}
