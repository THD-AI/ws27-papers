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

// Chip: flip-chip die on a ceramic carrier (sample-holder style), four coax connectors on
// the carrier edge, wire bonds from the die edge to pads, pad row on the front edge.
export function chip(o) {
  const P = pen('chip'), U = 560, V = 560;
  slab(P, o, U, V, 0, 40);
  slab(P, iso(o, 170, 170, 40), 220, 220, 0, 26);
  // die face: bump grid
  for (let a = 205; a < 380; a += 55) for (let c = 205; c < 380; c += 55) P.line(iso(o, a, c, 66), iso(o, a + 9, c, 66));
  // pad ring on the carrier around the die, with a bond wire to each die edge (never to a connector)
  for (let k = 200; k <= 360; k += 52) {
    for (const [pu, pv, du, dv] of [[k, 135, k, 172], [k, 425, k, 388], [135, k, 172, k], [425, k, 388, k]]) {
      P.line(iso(o, pu - 7, pv, 40), iso(o, pu + 7, pv, 40));
      P.line(iso(o, pu, pv, 40), iso(o, du, dv, 66));
    }
  }
  // connector feed lines: from each connector straight inward to the pad ring corner, ending short of it
  for (const [u, v, eu, ev] of [[60, 60, 120, 120], [U - 60, 60, U - 120, 120], [60, V - 60, 120, V - 120], [U - 60, V - 60, U - 120, V - 120]]) P.line(iso(o, u + Math.sign(eu - u) * 30, v + Math.sign(ev - v) * 30, 40), iso(o, eu, ev, 40));
  // edge pads on both visible carrier faces
  for (let u = 90; u < U - 60; u += 46) P.line(iso(o, u, 0, 10), iso(o, u, 0, 30));
  for (let v = 90; v < V - 60; v += 46) P.line(iso(o, 0, v, 10), iso(o, 0, v, 30));
  // coax connectors: iso cylinders with a collar
  for (const [u, v] of [[60, 60], [U - 60, 60], [60, V - 60], [U - 60, V - 60]]) {
    const bb = iso(o, u, v, 40), t = iso(o, u, v, 120), m = iso(o, u, v, 75);
    P.ellipse(t, 56, 32); P.line([bb[0] - 28, bb[1]], [t[0] - 28, t[1]]); P.line([bb[0] + 28, bb[1]], [t[0] + 28, t[1]]);
  }
  return P.out;
}

// Film: a strip lying on the ground along +30°, sprocket holes on both edges, frame dividers.
export function film(o) {
  const P = pen('film'), U = 1100, V = 200;
  P.poly([[0, 0], [U, 0], [U, V], [0, V]].map(([u, v]) => iso(o, u, v, 0)));
  P.line(iso(o, 0, 40, 0), iso(o, U, 40, 0)); P.line(iso(o, 0, V - 40, 0), iso(o, U, V - 40, 0));
  for (let u = 0; u < U; u += 180) P.line(iso(o, u, 40, 0), iso(o, u, V - 40, 0));
  for (let u = 0; u < U - 180; u += 180) for (let i = 0; i < 5; i++) { const uu = u + 30 + ((i * 53) % 120), vv = 60 + ((i * 37) % 80); P.line(iso(o, uu, vv, 0), iso(o, uu + 14, vv, 0)); }
  for (let u = 30; u < U - 20; u += 90) for (const v of [12, V - 28]) P.poly([[u, v], [u + 22, v], [u + 22, v + 16], [u, v + 16]].map(([a, b]) => iso(o, a, b, 0)));
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
    if (i % 2 === 0 || i % 3 === 0) for (let u = 50; u < 190; u += 32) P.line(F(u, z + 12), F(u, z + 30));
    P.line(F(U - 70, z + 16), F(U - 46, z + 16));
    P.line(F(U - 100, z + 10), F(U - 100, z + 32));
  }
  for (let u = 50; u < U - 50; u += 36) P.line(F(u, H - 90), F(u, H - 60));
  // side panel seams on the left face (u = 0)
  for (let v = 70; v < V; v += 70) P.line(iso(o, 0, v, 20), iso(o, 0, v, H - 20));
  for (let z = 140; z < H; z += 140) P.line(iso(o, 0, 20, z), iso(o, 0, V - 20, z));
  return P.out;
}

// ---- overview variants (beat 0): 20 strokes or fewer, same pen ----
export function chipOverview(o) { const P = pen('chip-ov'), U = 560, V = 560; slab(P, o, U, V, 0, 40); P.poly([[170, 170], [390, 170], [390, 390], [170, 390]].map(([u, v]) => iso(o, u, v, 66))); return P.out; }
export function filmOverview(o) { const P = pen('film-ov'), U = 1100, V = 200; P.poly([[0, 0], [U, 0], [U, V], [0, V]].map(([u, v]) => iso(o, u, v, 0))); for (let u = 180; u < U; u += 180) P.line(iso(o, u, 0, 0), iso(o, u, V, 0)); return P.out; }
export function readerOverview(o) { const P = pen('reader-ov'), U = 300, V = 380, H = 620; slab(P, o, U, V, 0, H); for (const z of [160, 320, 480]) P.line(iso(o, 24, 0, z), iso(o, U - 24, 0, z)); return P.out; }
export const countStrokes = (ds) => ds.reduce((a, d) => a + d.split(/(?=M)/).length, 0);
