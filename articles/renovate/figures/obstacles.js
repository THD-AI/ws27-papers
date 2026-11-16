// obstacles: why German firms decided against AI. Six rows of unit dots,
// one dot is 2 percentage points, counted from zero at the left.
import {
  mountFigure, svgRoot, colors, g, rect, line, text, cells, units, dots, plate,
  leader, edge, penRing, stage, fmt,
} from '../../../lib/fig.js';

export const steps = 1;
export const aspect = { wide: 580 / 422, tall: 360 / 472 };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const W = tall ? 360 : 580, H = tall ? 472 : 422;
  const svg = svgRoot(el, W, H, `${d.reading} Share of German firms naming each reason: `
    + d.rows.map((r) => `${r.label} ${r.value}%`).join(', ') + '.');
  svg.style.color = C.ink;
  const st = stage();
  const whole = (v) => { const n = Math.round(v / d.unit.percentPerDot); return { full: n, frac: 0, cells: n }; };
  const hdl = text(svg, tall ? 14 : 16, tall ? 14 : 18, d.headline, { family: 'sans', size: tall ? 12.5 : 14, weight: 600, width: W - 28, lh: 15.5 });
  st.fade(hdl.el, 0, 0.08);

  const S = tall
    ? { label: 12.5, num: 12.5, note: 12.5, axis: 11.5, pitch: 6.2, gap: 3.4, r: 2.35, x0: 14, top: 84, rowH: 59, dotDy: 14 }
    : { label: 13.5, num: 13.5, note: 14, axis: 12, pitch: 10, gap: 6, r: 3.75, x0: 16, top: 84, rowH: 50, dotDy: 15 };
  const per = d.unit.percentPerDot, n = d.unit.dotsPerRow;
  const slot = cells(n, n, { gx: S.pitch, gy: S.pitch, group: 10, groupGap: S.gap });
  const rowY = (i) => S.top + i * S.rowH;            // baseline of the row's label
  const dotY = (i) => rowY(i) + S.dotDy;

  // the one field: the two rows that are about the law
  const legal = d.rows.map((r, i) => (r.legal ? i : -1)).filter((i) => i >= 0);
  if (legal.length) {
    const y0 = rowY(legal[0]) - S.label - 5, y1 = dotY(legal[legal.length - 1]) + S.pitch + 5;
    const f = rect(svg, 0, y0, W, y1 - y0, { fill: C.field, 'data-audit': 'skip' });
    st.fade(f, 0.22, 0.42);
    const fl = text(svg, W - (tall ? 12 : 16), (y0 + y1) / 2 + 2, d.fieldLabel, { italic: true, size: S.note + 1, fill: C.accent, weight: 600, anchor: 'end' });
    st.fade(fl.el, 0.4, 0.52);
  }

  // plate: the 50 places of every row, and the scale under the last one
  const pl = g(svg);
  d.rows.forEach((r, i) => {
    // the places behind the row's number stay empty, so that nothing sits under lettering
    const from = whole(r.value).cells, skip = Math.ceil(((tall ? 7 : 9) + S.num * 0.62 * (String(r.value).length + 1) + 5) / S.pitch);
    const free = slot.filter((c) => c.i < from || c.i >= from + skip);
    plate(pl, free, tall ? 0.75 : 0.95, r.legal ? C.muted : C.hairline, S.x0, dotY(i)).setAttribute('opacity', r.legal ? 0.45 : 1);
  });
  const axY = dotY(d.rows.length - 1) + S.pitch + (tall ? 13 : 14);
  const ax = g(svg);
  line(ax, S.x0, axY, S.x0 + slot.width, axY, { stroke: C.ink, 'stroke-width': 1.25 });
  for (let k = 0; k <= n; k += 10) {
    const x = k === n ? S.x0 + slot.width : S.x0 + slot[k].x - S.pitch / 2 - (k ? S.gap / 2 : 0);
    line(ax, x, axY, x, axY + 5, { stroke: C.ink, 'stroke-width': 1.25 });
    text(ax, x, axY + 5 + S.axis, `${fmt(k * per)}${k === n ? '%' : ''}`, { family: 'mono', size: S.axis, fill: C.muted, anchor: k === 0 ? 'start' : k === n ? 'end' : 'middle' });
  }
  st.fade(pl, 0, 0.14).fade(ax, 0.02, 0.16);

  // rows
  let ringAt = null, firstRow = null;
  d.rows.forEach((r, i) => {
    const a = 0.1 + i * 0.105, b = a + 0.24;
    const lab = text(svg, S.x0, rowY(i), r.label, { family: 'sans', size: S.label, weight: 500 });
    st.fade(lab.el, a - 0.04, a + 0.06);
    const u = whole(r.value);
    const ds = dots(g(svg), slot, u, S.r, { fill: r.legal ? C.accent : C.ink }, S.x0, dotY(i));
    st.fill(ds, a, b);
    const last = slot[u.cells - 1];
    const vx = S.x0 + last.x + S.pitch / 2 + (tall ? 7 : 9);
    const val = text(svg, vx, dotY(i) + S.pitch / 2 + S.num * 0.34, `${fmt(r.value)}%`, { family: 'mono', size: S.num, weight: 500 });
    st.fade(val.el, b - 0.04, b + 0.05);
    if (i === 0) { ringAt = val; firstRow = { x: S.x0 + slot[Math.min(u.full - 1, 27)].x, y: dotY(i) + S.pitch / 2 }; }
  });

  // notes last
  const nt = g(svg);
  const nx = tall ? 150 : 300, ny = tall ? 50 : 48;
  const unitNote = text(nt, nx, ny, d.unit.note, { italic: true, size: S.note });
  const p0 = edge(unitNote, firstRow.x, firstRow.y);
  leader(nt, unitNote.x + 10, p0[1], firstRow.x + (tall ? 4 : 5), firstRow.y - S.r - 3, { stroke: C.muted });
  st.fade(nt, 0.8, 0.92);
  const foot = text(svg, W - S.x0 + (tall ? 0 : 2), H - (tall ? 12 : 12), d.note.text, { italic: true, size: S.note, anchor: 'end', fill: C.muted });
  st.fade(foot.el, 0.86, 0.96);

  // the pen ring on the one number that matters
  const ring = penRing(svg, ringAt.cx, ringAt.cy - 0.5, ringAt.w / 2 + (tall ? 7 : 8.5), S.num * 0.5 + (tall ? 5.5 : 6.5), { seed: 11, stroke: C.accent, width: tall ? 1.35 : 1.5 });
  ring.paths.forEach((p, k) => st.draw(p, 0.84 + k * 0.03, 0.98 + k * 0.02));

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
