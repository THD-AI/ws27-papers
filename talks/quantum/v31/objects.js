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
export const TOKEN = 3, VAR = 0.15;

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function pen(name) {
  const seed = [...name].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const r = rng(seed), out = [];
  const opt = (long) => ({ roughness: 0.55, bowing: long ? 0.9 : 0.3, disableMultiStroke: true, preserveVertices: false, seed: 1 + Math.floor(r() * 1e6), curveFitting: 0.9 });
  const w = () => +(TOKEN * (1 - VAR + 2 * VAR * r())).toFixed(2);
  const push = (dr) => out.push(...gen.toPaths(dr).map((p) => ({ d: p.d, w: w() })));
  return {
    out,
    line([x1, y1], [x2, y2]) {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      const o1 = (r() < 0.08 ? -2 : 1 + r() * 2) * PX, o2 = (r() < 0.08 ? -2 : 1 + r() * 2) * PX;
      push(gen.line(x1 - ux * o1, y1 - uy * o1, x2 + ux * o2, y2 + uy * o2, opt(L > 200)));
    },
    poly(pts, close = true) { for (let i = 0; i < pts.length - (close ? 0 : 1); i++) this.line(pts[i], pts[(i + 1) % pts.length]); },
    ellipse([cx, cy], ew, eh) { push(gen.ellipse(cx, cy, ew, eh, { ...opt(false), roughness: 0.7 })); },
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

// coax connector: iso cylinder with a cable curving away from its top
function coax(P, o, u, v, z, dir) {
  const b = iso(o, u, v, z), t = iso(o, u, v, z + 70);
  P.ellipse(t, 56, 32); P.line([b[0] - 28, b[1]], [t[0] - 28, t[1]]); P.line([b[0] + 28, b[1]], [t[0] + 28, t[1]]);
  if (!dir) return;
  P.curve([t, [t[0] + dir[0] * 40, t[1] - 120], [t[0] + dir[0] * 160, t[1] - 170 + dir[1] * 40], [t[0] + dir[0] * 300, t[1] - 140 + dir[1] * 60]]);
}

// Chip: flip-chip die on a carrier, pad ring with bond wires, four coax connectors with cables.
export function chip(o) {
  const P = pen('chip'), U = 560, V = 560;
  slab(P, o, U, V, 0, 40);
  slab(P, iso(o, 170, 170, 40), 220, 220, 0, 26);
  for (let a = 205; a < 380; a += 55) for (let c = 205; c < 380; c += 55) P.line(iso(o, a, c, 66), iso(o, a + 9, c, 66));
  for (let k = 200; k <= 360; k += 52) for (const [pu, pv, du, dv] of [[k, 135, k, 172], [k, 425, k, 388], [135, k, 172, k], [425, k, 388, k]]) {
    P.line(iso(o, pu - 7, pv, 40), iso(o, pu + 7, pv, 40));
    P.line(iso(o, pu, pv, 40), iso(o, du, dv, 66));
  }
  for (let u = 90; u < U - 60; u += 60) P.line(iso(o, u, 0, 10), iso(o, u, 0, 30));
  coax(P, o, 60, 60, 40, null); coax(P, o, U - 60, 60, 40, [1, 1]); coax(P, o, 60, V - 60, 40, [-1, -1]); coax(P, o, U - 60, V - 60, 40, null);
  // carrier markings: ground-via rows inside the edges
  for (let s = 70; s < U - 40; s += 48) for (const [a, b] of [[s, 30], [30, s], [s, V - 30], [U - 30, s]]) P.line(iso(o, a - 5, b, 40), iso(o, a + 5, b, 40));
  return P.out;
}

// Film: a strip along +30° with sprocket holes and frames; its newest end curls up.
export function film(o) {
  const P = pen('film'), U = 1000, V = 200;
  P.line(iso(o, 0, 0, 0), iso(o, U, 0, 0)); P.line(iso(o, 0, V, 0), iso(o, U, V, 0)); P.line(iso(o, 0, 0, 0), iso(o, 0, V, 0));
  P.line(iso(o, 0, 40, 0), iso(o, U, 40, 0)); P.line(iso(o, 0, V - 40, 0), iso(o, U, V - 40, 0));
  for (let u = 0; u <= U; u += 180) P.line(iso(o, u, 40, 0), iso(o, u, V - 40, 0));
  for (let u = 0; u < U - 180; u += 180) for (let i = 0; i < 4; i++) { const uu = u + 30 + ((i * 53) % 120), vv = 60 + ((i * 37) % 80); P.line(iso(o, uu, vv, 0), iso(o, uu + 14, vv, 0)); }
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
    if (i % 2 === 0) for (let u = 50; u < 170; u += 34) P.line(F(u, z + 22), F(u + 20, z + 22));
    P.line(F(U - 70, z + 18), F(U - 46, z + 18));
  }
  // vents on the side face, near the top
  for (let v = 60; v < V - 60; v += 56) for (let z = 90; z < H - 60; z += 70) P.line(iso(o, 0, v, z), iso(o, 0, v + 26, z));
  // top: inset lid, fan grilles, cable gland
  P.poly([[30, 30], [U - 30, 30], [U - 30, V - 30], [30, V - 30]].map(([u, v]) => iso(o, u, v, H)));
  // one fan with blades and a dash grille
  { const c = iso(o, 110, 130, H); P.ellipse(c, 130, 75); for (const a of [0, 1.57, 3.14, 4.71]) P.curve([c, [c[0] + Math.cos(a) * 30, c[1] + Math.sin(a) * 25], [c[0] + Math.cos(a + 0.6) * 55, c[1] + Math.sin(a + 0.6) * 30]]); }
  for (let v = 230; v < V - 50; v += 30) for (let u = 60; u < U - 60; u += 50) P.line(iso(o, u, v, H), iso(o, u + 24, v, H));
  
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
  P.ellipse([512, 420], 640, 330); P.ellipse([505, 745], 590, 150); P.ellipse([505, 1075], 510, 130); P.ellipse([500, 1270], 300, 90);
  P.line([200, 440], [215, 745]); P.line([830, 440], [800, 745]); P.line([262, 790], [262, 1060]); P.line([752, 790], [752, 1060]);
  P.line([465, 195], [465, 320]); P.line([565, 195], [565, 320]); P.line([370, 1110], [370, 1260]); P.line([640, 1110], [640, 1260]);
  return P.out;
}
export const countStrokes = (ds) => ds.reduce((a, d) => a + (d.d || d).split(/(?=M)/).length, 0);
