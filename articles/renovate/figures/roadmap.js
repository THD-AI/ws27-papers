// roadmap: the renovation of an occupied building as a construction
// schedule. One phase per step, each a bar on the order-of-work axis:
//   0 survey (a tape)            1 foundations (14 footings, 3 kept)
//   2 materials (swappable)      3 wiring (three keys, handed out in order)
//   4 training the trades        5 fit-out with the residents at home
//   6 inspection, alongside the work from the foundations on; a dashed
//     box after the end marks where it does not go.
// A lane of residents, in the field from the start, runs under every phase.
// Bars are all one phase long: order of work, not time. Building words
// alone are drawn (the company meaning is in the article text). The last
// step at t = 1 is the whole schedule and reads alone in print.
import {
  mountFigure, svgRoot, colors, g, path, circle, rect, text, stage, span, ease, rng, spline, lerp,
} from '../../../lib/fig.js';

export const steps = 7;
export const aspect = { wide: 900 / 527, tall: 360 / 652 };

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
  const W = tall ? 360 : 900;
  const svg = svgRoot(el, W, tall ? 862 : 606, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  let seed = 11;
  const pline = (parent, pts, w = 1.25, stroke = C.ink, amp = 0.45) => path(parent, pen(pts, seed++, amp), {
    stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  const twice = (parent, pts, a, b, stroke = C.ink) => {     // a main stroke and a thin one beside it
    st.draw(pline(parent, pts, 1.3, stroke), a, b);
    const t = pline(parent, pts, 0.5, stroke, 0.8); t.setAttribute('opacity', 0.65); st.draw(t, a, b);
  };

  // --- geometry
  const L = tall
    ? { num: 16, tx: 34, tw: W - 50, sx0: 16, sx1: 290, gx0: 300, gx1: 344, bs: 14.5, cs: 13, barH: 15, below: 22, gap: 18, hs: 17 }
    : { num: 16, tx: 38, tw: 280, sx0: 334, sx1: 818, gx0: 832, gx1: 886, bs: 15.5, cs: 14, barH: 18, below: 22, gap: 22, hs: 20 };
  const cols = d.columns;
  const X = (u) => L.sx0 + ((L.sx1 - L.sx0) * u) / cols;
  const KEYNUM = 13, GHOST = 13.5;

  const gridG = g(svg, { 'data-audit': 'skip' });
  const fieldG = g(svg);
  const body = g(svg);

  // --- the one sentence the figure says
  const hl = text(body, L.num, L.hs, d.headline, { family: 'serif', size: L.hs, weight: 500, fill: C.ink, width: W - 32, lh: L.hs + 4 });
  st.fade(hl.el, 0, 0.06);

  // --- header: the order of work, left to right
  const hy = hl.bottom + 24;
  const head = text(body, L.sx0, hy, d.axis, { family: 'mono', size: 11.5, weight: 500, caps: true, spacing: 0.6, fill: C.muted });
  const arrow = g(body);
  path(arrow, `M${(head.right + 10).toFixed(1)} ${hy - 4}L${L.sx1} ${hy - 4}`, { stroke: C.muted, 'stroke-width': 1, 'stroke-linecap': 'round' });
  path(arrow, `M${L.sx1 - 6} ${hy - 7.5}L${L.sx1} ${hy - 4}L${L.sx1 - 6} ${hy - 0.5}`, { stroke: C.muted, 'stroke-width': 1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  st.fade(head.el, 0, 0.08).fade(arrow, 0.02, 0.12);
  const gridTop = hy + 10;

  // --- the rows
  let y = hy + 22;
  const strips = [];                    // [top, bottom] of each bar strip, for the grid in the tall layout
  d.phases.forEach((ph, k) => {
    const row = g(body);
    const lab = g(row);
    const base = y + L.bs * 0.8;
    text(lab, L.num, base, String(k + 1), { family: 'mono', size: L.bs - 1.5, weight: 500, fill: C.ink });
    const b = text(lab, L.tx, base, ph.building, { family: 'sans', size: L.bs, weight: 600, fill: C.ink, width: L.tw });
    const c = text(lab, b.right + 9, base, ph.phrase, { family: 'sans', size: L.cs, fill: C.muted });
    st.fade(lab, k + 0.02, k + 0.18);

    const barTop = tall ? b.bottom + 9 : y + L.bs * 0.42 - L.barH / 2;
    const x0 = X(ph.span[0]), x1 = X(ph.span[1]), yb = barTop + L.barH;
    let need = ph.detail === 'piles' || ph.detail === 'keys' ? L.below + (tall && ph.detail === 'keys' ? KEYNUM + 3 : 0)
      : ph.detail === 'stamps' ? GHOST + 6 : 4;
    if (!tall) need = Math.max(need, L.below);
    strips.push([barTop - 5, yb + Math.max(need, 8)]);
    void c;
    // the bar grows from left to right: two strokes, top edge and bottom edge
    twice(row, [[x0, yb], [x0, barTop], [x1, barTop]], k + 0.1, k + 0.55);
    twice(row, [[x0, yb], [x1, yb], [x1, barTop]], k + 0.1, k + 0.55);

    const det = g(row);
    if (ph.detail === 'tape') {
      // a measuring tape: ticks along the top edge, a long one every fifth
      const n8 = Math.floor((x1 - x0) / 8);
      let dd = '';
      for (let i = 1; i < n8; i++) {
        const xx = x0 + i * 8, len = i % 2 === 0 ? L.barH * 0.62 : L.barH * 0.36;
        dd += `M${xx.toFixed(1)} ${barTop + 1}L${xx.toFixed(1)} ${(barTop + 1 + len).toFixed(1)}`;
      }
      path(det, dd, { stroke: C.ink, 'stroke-width': 1.1, 'stroke-linecap': 'round' });
      st.fade(det, k + 0.5, k + 0.75);
    } else if (ph.detail === 'piles') {
      // footings under the slab: as many as there are ways today, then the few kept
      const nAll = ph.piles.from, nKeep = ph.piles.to;
      const pitch = (x1 - x0 - 6) / (nAll - 1);
      const keep = new Set(Array.from({ length: nKeep }, (_, i) => Math.round(((i + 0.5) * nAll) / nKeep - 0.5)));
      const piles = [];
      for (let i = 0; i < nAll; i++) {
        const xx = x0 + 3 + i * pitch;
        const p = path(det, `M${xx.toFixed(1)} ${yb + 1.5}L${xx.toFixed(1)} ${(yb + L.below - 6).toFixed(1)}`, { stroke: C.ink, 'stroke-width': 1, 'stroke-linecap': 'round' });
        piles.push({ p, kept: keep.has(i) });
      }
      st.fill(piles.map((q) => q.p), k + 0.35, k + 0.6);
      st.on((gg) => {
        const p = ease(span(gg, k + 0.68, k + 0.92));
        for (const q of piles) {
          if (q.kept) {
            const w = (1 + 1.4 * p).toFixed(2);
            if (q.p.getAttribute('stroke-width') !== w) q.p.setAttribute('stroke-width', w);
          } else {
            const o = p > 0.001 ? (1 - 0.72 * p).toFixed(3) : null;
            if (q.p.getAttribute('opacity') !== o) { if (o) q.p.setAttribute('opacity', o); else q.p.removeAttribute('opacity'); }
            const da = p > 0.5 ? '1.5 2' : null;
            if (q.p.getAttribute('stroke-dasharray') !== da) { if (da) q.p.setAttribute('stroke-dasharray', da); else q.p.removeAttribute('stroke-dasharray'); }
          }
        }
      });
    } else if (ph.detail === 'swap') {
      // a fitting that takes either part: two half-arrows, one each way
      const cx = (x0 + x1) / 2, cy = barTop + L.barH / 2, hw = Math.min(14, (x1 - x0) / 2 - 6);
      path(det, `M${cx - hw} ${cy - 2.5}L${cx + hw} ${cy - 2.5}L${cx + hw - 4} ${cy - 5.5}M${cx + hw} ${cy + 2.5}L${cx - hw} ${cy + 2.5}L${cx - hw + 4} ${cy + 5.5}`, {
        stroke: C.ink, 'stroke-width': 1.1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      });
      st.fade(det, k + 0.5, k + 0.75);
    } else if (ph.detail === 'keys') {
      // three keys hang under the bar, handed out one after another
      ph.keys.forEach((u, i) => {
        const kg = g(det);
        const kx = X(u), top = yb;
        path(kg, `M${kx} ${top}L${kx} ${top + 3}`, { stroke: C.muted, 'stroke-width': 0.8 });
        circle(kg, kx, top + 6, 2.8, { fill: 'none', stroke: C.ink, 'stroke-width': 1.1 });
        path(kg, `M${kx} ${top + 8.8}L${kx} ${top + L.below - 2}M${kx} ${top + L.below - 5}L${kx + 3} ${top + L.below - 5}M${kx} ${top + L.below - 2.5}L${kx + 3} ${top + L.below - 2.5}`, {
          stroke: C.ink, 'stroke-width': 1.1, 'stroke-linecap': 'round',
        });
        if (tall) text(kg, kx + 1.5, top + L.below + KEYNUM + 1, String(i + 1), { family: 'mono', size: KEYNUM, weight: 500, fill: C.ink, anchor: 'middle' });
        else text(kg, kx + 7, top + 13, String(i + 1), { family: 'mono', size: KEYNUM, weight: 500, fill: C.ink });
        st.fade(kg, k + 0.45 + i * 0.15, k + 0.58 + i * 0.15);
      });
    } else if (ph.detail === 'stamps') {
      // a stamp at the end of each building phase, inside the inspection bar
      const cy = barTop + L.barH / 2;
      const stamps = ph.stamps.map((u) => {
        const sx = Math.min(X(u), x1) - 6;
        const sg = g(det);
        circle(sg, sx, cy, 4.2, { fill: 'none', stroke: C.ink, 'stroke-width': 1.1 });
        circle(sg, sx, cy, 1.4, { fill: C.ink });
        return sg;
      });
      st.fill(stamps, k + 0.45, k + 0.8);
      // where it does not go: a dashed box after the end of the work
      const gh = g(row);
      rect(gh, L.gx0, barTop, L.gx1 - L.gx0, L.barH, { fill: 'none', stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '3 3' });
      text(gh, (L.gx0 + L.gx1) / 2, yb + GHOST + 2, ph.ghost, { italic: true, size: GHOST, fill: C.muted, anchor: 'middle' });
      st.fade(gh, k + 0.75, k + 0.95);
    }

    const bottom = Math.max(b.bottom, yb + need);
    y = bottom + L.gap;
  });

  // --- the residents' lane, under every phase from the start, in one state throughout
  const R = d.residents;
  const rl = g(body);
  let laneTop, resBottom = 0;
  if (tall) {
    const rb = text(rl, L.num, y + 4 + L.bs * 0.8, R.building, { family: 'sans', size: L.bs, weight: 600, fill: C.accent });
    text(rl, rb.right + 9, y + 4 + L.bs * 0.8, R.phrase, { family: 'sans', size: L.cs, fill: C.muted });
    laneTop = rb.bottom + 9;
  } else {
    laneTop = y - 4;
    const rb = text(rl, L.tx, laneTop + 13, R.building, { family: 'sans', size: L.bs, weight: 600, fill: C.accent, width: L.tw });
    resBottom = text(rl, L.tx, rb.bottom + L.cs * 1.05, R.phrase, { family: 'sans', size: L.cs, fill: C.muted, width: L.tw }).bottom;
  }
  st.fade(rl, 0.02, 0.14);
  const laneH = 32, laneBot = laneTop + laneH;
  const field = rect(fieldG, L.sx0, laneTop, L.sx1 - L.sx0, laneH, { fill: C.field, 'data-audit': 'skip' });
  st.fade(field, 0.02, 0.2);
  const edges = g(body);
  twice(edges, [[L.sx0, laneTop], [L.sx1, laneTop]], 0.02, 0.2, C.accent);
  twice(edges, [[L.sx0, laneBot], [L.sx1, laneBot]], 0.02, 0.2, C.accent);
  // the residents: a head and shoulders each, evenly along the lane
  const pitch = tall ? 20 : 24;
  const nPeople = Math.floor((L.sx1 - L.sx0 - 8) / pitch);
  const off = (L.sx1 - L.sx0 - (nPeople - 1) * pitch) / 2;
  const people = [];
  for (let i = 0; i < nPeople; i++) {
    const px = L.sx0 + off + i * pitch, pg = g(body);
    circle(pg, px, laneTop + 10.5, 3.6, { fill: 'none', stroke: C.ink, 'stroke-width': 1.15 });
    path(pg, `M${px - 6.5} ${laneBot - 3}C${px - 6.5} ${laneTop + 16} ${px + 6.5} ${laneTop + 16} ${px + 6.5} ${laneBot - 3}`, { stroke: C.ink, 'stroke-width': 1.15, 'stroke-linecap': 'round' });
    people.push(pg);
  }
  st.fill(people, 0.05, 0.3);

  // --- the schedule's column lines (behind everything)
  const gl = { stroke: C.hairline, 'stroke-width': 0.8 };
  let gd = '';
  for (let i = 0; i <= cols; i++) {
    const xx = X(i).toFixed(1);
    if (tall) for (const [a, b2] of strips) gd += `M${xx} ${a.toFixed(1)}L${xx} ${b2.toFixed(1)}`;
    else gd += `M${xx} ${gridTop}L${xx} ${laneTop - 6}`;
  }
  path(gridG, gd, gl);
  st.fade(gridG, 0, 0.1);

  const H = Math.ceil(Math.max(laneBot, resBottom) + 8);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.dataset.h = String(H);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
