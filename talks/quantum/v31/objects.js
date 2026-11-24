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
  const b = iso(o, u, v, z), n = iso(o, u, v, z + 18), t = iso(o, u, v, z + 46);
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
  // top: inset lid, vent grille, cable run
  P.poly([[30, 30], [U - 30, 30], [U - 30, V - 30], [30, V - 30]].map(([u, v]) => iso(o, u, v, H)));
  // vent grille: parallel dash rows across the lid
  for (let v = 70; v < V - 50; v += 34) for (let u = 60; u < U - 60; u += 50) P.line(iso(o, u, v, H), iso(o, u + DASH, v, H));
  // cable run leaving the top towards the film
  P.curve([iso(o, 60, 200, H), iso(o, 40, 260, H + 80), iso(o, -60, 320, H + 120), iso(o, -200, 360, H + 100)]);
  P.curve([iso(o, 80, 210, H), iso(o, 62, 274, H + 72), iso(o, -40, 336, H + 108), iso(o, -190, 380, H + 86)]);
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
