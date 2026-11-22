// The water figure (section 1): a pattern drawn on water, at four moments.
//
//   node tools/water-data.mjs
//
// How much of the pattern is left follows exp(-t / T) with T the median qubit
// lifetime on Google's 2024 chip, 85 microseconds (GQA-2024, Section II: "median
// 85 ± 7 µs"). That lifetime is a decay constant, not a deadline: after one
// lifetime about a third is left, after three about a twentieth. The rings of
// the pattern and the water's edge are pen strokes, drawn here once with
// perfect-freehand (MIT); nothing is random. Writes data/water.json.
import { writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStroke } from 'perfect-freehand';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const T = 85;                                   // µs, median lifetime
const moments = [0, 85, 170, 255].map((t) => ({ t, left: Math.exp(-t / T) }));
const near = (a, b, e) => Math.abs(a - b) < e;
if (!near(moments[1].left, 0.368, 0.001) || !near(moments[3].left, 0.0498, 0.001)) throw new Error('decay check');

function cr(pts, n = 14) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts.at(-1));
  return out;
}
function pen(ctrl, size, { thin = 0.55, t0 = 3, t1 = 6 } = {}) {
  const pts = cr(ctrl).map((p, i, a) => {
    const u = a[Math.max(0, i - 1)], v = a[Math.min(a.length - 1, i + 1)];
    return [p[0], p[1], Math.max(0.25, Math.min(1, 1.2 - Math.hypot(v[0] - u[0], v[1] - u[1]) / 10))];
  });
  const s = getStroke(pts, { size, thinning: thin, smoothing: 0.55, streamline: 0.3, simulatePressure: false, start: { taper: size * t0, cap: true }, end: { taper: size * t1, cap: true } });
  const f = (v) => v.toFixed(1);
  let d = `M${f(s[0][0])} ${f(s[0][1])}Q`;
  for (let i = 0; i < s.length; i++) { const [x0, y0] = s[i], [x1, y1] = s[(i + 1) % s.length]; d += `${f(x0)} ${f(y0)} ${f((x0 + x1) / 2)} ${f((y0 + y1) / 2)} `; }
  return d.trim() + 'Z';
}
// the pattern, around (0, 0): three rings, each drawn as one stroke that starts and
// ends a little apart (a hand closing a circle), and a mark in the middle
const ring = (r, start, gap, ry = 0.42) => {
  const pts = [];
  for (let a = start; a <= start + Math.PI * 2 - gap; a += 0.32) pts.push([Math.cos(a) * r, Math.sin(a) * r * ry]);
  return pts;
};
const pattern = [
  pen(ring(12, 0.6, 0.5), 2.2, { thin: 0.5, t0: 1.5, t1: 3 }),
  pen(ring(26, 2.1, 0.35), 2.4, { thin: 0.6, t0: 2, t1: 4 }),
  pen(ring(41, 4.0, 0.42), 2.2, { thin: 0.65, t0: 3, t1: 5 }),
];
// the water's surface in each panel: two long low strokes, different each time
const surface = (w) => [
  pen([[-w / 2, -3], [-w / 6, -4.5], [w / 6, -2.6], [w / 2, -3.8]], 1.4, { thin: 0.4, t0: 4, t1: 8 }),
  pen([[-w / 2 + 6, 5], [-w / 8, 6.2], [w / 5, 4.6], [w / 2 - 4, 5.6]], 1.2, { thin: 0.4, t0: 6, t1: 6 }),
];
const out = {
  generated: new Date().toISOString().slice(0, 10),
  generated_by: 'tools/water-data.mjs',
  source: 'GQA-2024',
  what: 'How much of a qubit\'s state is left after t microseconds, exp(-t / 85), with 85 µs the median qubit lifetime on Google\'s 2024 chip; and the drawn lines of the figure.',
  lifetime_us: T,
  moments,
  pen: { pattern, surface: surface(130) },
};
writeFileSync(join(repo, 'articles', 'other-half', 'data', 'water.json'), JSON.stringify(out) + '\n', 'utf8');
console.log('wrote data/water.json:', moments.map((m) => `${m.t} µs: ${(m.left * 100).toFixed(0)}%`).join(', '));
