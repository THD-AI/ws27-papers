// roadmap: the renovation of an occupied house as a site schedule
// (Bauzeitenplan). Seven rows on one time axis, everyday words as the row
// label, the Telekom meaning as a muted second line. Lengths are schematic
// (data/roadmap.json); the order and the overlaps are what it says.
//   step 0: survey, plan and choose materials, approval (alongside the
//           planning), trades first (trained before the tools arrive).
//   step 1: the main supply, then the rooms one after the other, the keys
//           given in steps: read only, undoable actions, changes fraud
//           could use.
//   step 2: running it, from the first room on and without end; the band
//           "people at home throughout" under all rows (the one field); an
//           open accent diamond after every piece of work, "inspected at
//           every step"; the headline.
// The last step at t = 1 holds everything and reads alone in print.
import {
  mountFigure, svgRoot, colors, g, path, rect, text, stage, rng, spline, lerp, clamp,
} from '../../../lib/fig.js';

export const steps = 3;
const SIZE = { wide: [928, 591], tall: [360, 842] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

// a pen line: thin, a little uneven, seeded
function pen(points, seed, amp) {
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

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  let seed = 23;

  // geometry: wide has a label column on the left and the chart beside it,
  // each row's bars level with its label; tall puts the label above each
  // row's bars and the chart full width
  const L = tall
    ? { num: 16, lx: 36, lw: 308, cx0: 16, cx1: 344, head: 17, top: 70, sub: 18, after: 8 }
    : { num: 16, lx: 40, lw: 262, cx0: 324, cx1: 912, head: 20, top: 60, sub: 19, after: 6 };
  const X = (u) => L.cx0 + (u / d.span) * (L.cx1 - L.cx0);
  const BH = 14;
  const ink = (parent, pts, w = 1.35, stroke = C.ink, amp = 0.5) => path(parent, pen(pts, seed++, amp), {
    stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  const twice = (parent, pts, a, b) => {           // a main stroke and a thin one beside it
    const m = ink(parent, pts, 1.35); st.draw(m, a, b);
    const t = ink(parent, pts, 0.55, C.ink, 0.85); t.setAttribute('opacity', 0.7); st.draw(t, a, b);
  };
  const box = (x0, x1, y) => [[x0, y - BH / 2], [x1, y - BH / 2], [x1, y + BH / 2], [x0, y + BH / 2], [x0, y - BH / 2 - 0.01]];
  const open = (x0, x1, y) => [[x1, y - BH / 2], [x0, y - BH / 2], [x0, y + BH / 2], [x1, y + BH / 2]];
  // a check: an open diamond, as a milestone on a site schedule
  const checks = [];
  const diamond = (x, y, r = 5) => {
    const p = path(svg, `M${x.toFixed(1)} ${y - r}L${(x + r).toFixed(1)} ${y}L${x.toFixed(1)} ${y + r}L${(x - r).toFixed(1)} ${y}Z`, {
      stroke: C.accent, 'stroke-width': 1.6, 'stroke-linejoin': 'round', fill: C.paper,
    });
    checks.push(p);
    return p;
  };
  // when each row arrives: [start of its label, start of its bars, end]
  const when = [[0.06, 0.12, 0.34], [0.24, 0.3, 0.52], [0.42, 0.48, 0.7], [0.6, 0.66, 0.9],
    [1.02, 1.08, 1.3], [1.24, 1.3, 1.95], [2.02, 2.08, 2.3]];

  // --- the headline: says the point from the first state on
  const hl = text(svg, 16, L.head + 6, d.headline, { family: 'serif', size: L.head, weight: 500, fill: C.ink, width: W - 32, lh: L.head + 4 });
  st.fade(hl.el, 0, 0.1);

  // --- the rows
  let y = L.top;
  const lab = (parent, k, row, a) => {
    if (k >= 0) { const num = text(parent, L.num, y + 15, String(k + 1), { family: 'mono', size: 12, weight: 500, fill: C.muted }); st.fade(num.el, a, a + 0.08); }
    const t1 = text(parent, L.lx, y + 15, row.label, { family: 'sans', size: 14, weight: 500, fill: C.ink, width: L.lw });
    const t2 = text(parent, L.lx, y + 31, row.company, { family: 'sans', size: 12, fill: C.muted, width: L.lw, lh: 15 });
    st.fade(t1.el, a, a + 0.12); st.fade(t2.el, a + 0.06, a + 0.18);
    return t2.bottom;
  };
  const sep = (yy) => path(svg, `M16 ${yy.toFixed(1)}L${W - 16} ${yy.toFixed(1)}`, { stroke: C.hairline, 'stroke-width': 1, 'data-audit': 'skip' });
  let noteAt = null;
  d.rows.forEach((row, k) => {
    const [a, b, c] = when[k];
    const R = g(svg);
    if (k > 0) st.fade(sep(y - (tall ? 9 : 7)), a, a + 0.06);
    const mb = lab(R, k, row, a);
    const by = tall ? mb + 15 : y + 10;
    let low = Math.max(by + BH / 2, tall ? 0 : mb);
    if (row.segments) {
      // the rooms: one after the other, stepping down like keys handed over
      const n = row.segments.length, sl = (c - b) / n;
      row.segments.forEach((s, i) => {
        const sy = by + i * L.sub, sa = b + i * sl;
        twice(R, box(X(s.span[0]), X(s.span[1]), sy), sa, sa + sl * 0.8);
        const t = text(R, X(s.span[0]) - 7, sy + 4, s.label, { family: 'mono', size: 12, fill: C.ink, anchor: 'end' });
        st.fade(t.el, sa + sl * 0.2, sa + sl * 0.7);
        diamond(X(s.span[1]) + L.after, sy);
      });
      low = Math.max(low, by + (n - 1) * L.sub + BH / 2);
    } else {
      for (const [u0, u1] of row.bars) {
        if (row.open) {
          twice(R, open(X(u0), L.cx1, by), b, c);          // the open end: it keeps going
        } else {
          twice(R, box(X(u0), X(u1), by), b, c);
          diamond(X(u1) + L.after, by);
        }
        if (k === 0) noteAt = [X(u1) + L.after + 11, by + 4];
      }
      for (const u of row.checks || []) diamond(X(u), by);
    }
    y = low + (tall ? 22 : 15);
  });

  // --- the people at home: a quiet band under every row, the whole time
  const hm = d.home;
  st.fade(sep(y - (tall ? 9 : 7)), 2.14, 2.22);
  const HB = g(svg);
  const hb = lab(HB, -1, hm, 2.18);                       // the band has no number
  const bandY = tall ? hb + 17 : y + 10;
  const band = rect(HB, X(0), bandY - 8, L.cx1 - X(0), 16, { fill: C.field, 'data-audit': 'skip' });
  st.fade(band, 2.2, 2.4);
  const bl = g(HB, { 'data-audit': 'skip' });
  for (const yy of [bandY - 8, bandY + 8]) {
    const p = ink(bl, [[X(0), yy], [L.cx1, yy]], 1.1, C.accent, 0.35);
    st.draw(p, 2.2, 2.42);
  }
  // --- the time axis
  const axY = tall ? bandY + 24 : Math.max(bandY + 8, hb) + 18;
  const ax = g(svg);
  twice(ax, [[X(0), axY], [L.cx1, axY]], 0.0, 0.14);
  twice(ax, [[L.cx1 - 7, axY - 4], [L.cx1, axY], [L.cx1 - 7, axY + 4]], 0.12, 0.16);
  twice(ax, [[X(0), axY - 5], [X(0), axY + 5]], 0.0, 0.06);
  const s0 = text(svg, X(0), axY + 18, d.axis.start, { family: 'mono', size: 12, fill: C.muted });
  const s1 = text(svg, L.cx1, axY + 18, d.axis.time, { family: 'mono', size: 12, fill: C.muted, anchor: 'end' });
  st.fade(s0.el, 0.04, 0.14); st.fade(s1.el, 0.08, 0.18);

  // --- the inspections: one diamond after each piece of work
  checks.forEach((p, i) => st.fade(p, 2.36 + i * 0.03, 2.46 + i * 0.03));
  if (noteAt) {
    const nt = text(svg, noteAt[0], noteAt[1], d.inspection.label, { family: 'mono', size: 12, weight: 500, fill: C.accent });
    st.fade(nt.el, 2.4, 2.56);
  }

  const used = Math.round(axY + 26);
  if (Math.abs(used - H) > 1) svg.dataset.contentH = String(used);
  svg.dataset.h = String(H);
  return { set(step, t) { st.set(step, clamp(t)); }, destroy() {} };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
