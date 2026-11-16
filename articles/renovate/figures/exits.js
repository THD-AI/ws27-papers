// exits: the agreed routes out of Telekom in Germany, 2021 to 2025. One
// mark is 25 full-time positions. Each column is a stack of five groups;
// the groups stand on shared base lines, so a route can be followed across
// the years. Severance is the one field.
import {
  mountFigure, svgRoot, colors, g, rect, line, text, textSize, cells, units, dots,
  leader, bracket, penRing, stage, fmt,
} from '../../../lib/fig.js';

export const steps = 1;
export const aspect = { wide: 880 / 448, tall: 360 / 492 };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const W = tall ? 360 : 880, H = tall ? 492 : 448;
  const per = d.unit.positionsPerMark;
  const svg = svgRoot(el, W, H, `${d.reading} Totals by year: `
    + d.years.map((y, i) => `${y} ${fmt(d.totals.values[i])}`).join(', ')
    + `. Severance: ${d.routes.find((r) => r.accent).values.map((v, i) => `${d.years[i]} ${fmt(v)}`).join(', ')}.`);
  svg.style.color = C.ink;
  const st = stage();
  const hdl = text(svg, tall ? 14 : 16, tall ? 14 : 18, d.headline, { family: 'sans', size: tall ? 12.5 : 14, weight: 600, width: W - 28, lh: 15.5 });
  st.fade(hdl.el, 0, 0.08);

  const S = tall
    ? { cols: 8, p: 7.1, r: 2.7, x0: 19, colGap: 9, bandGap: 24, label: 12, num: 11.5, note: 12.5, year: 11.5, bottom: 80 }
    : { cols: 10, p: 11, r: 4.1, x0: 26, colGap: 26, bandGap: 15, label: 13.5, num: 13, note: 14, year: 13, bottom: 62 };
  const colW = S.cols * S.p;
  const colX = (i) => S.x0 + i * (colW + S.colGap);
  const right = colX(d.years.length - 1) + colW;

  // bands from the bottom; each as high as its fullest year
  let y = H - S.bottom;
  const bands = d.routes.map((r) => {
    // whole marks only: each group is rounded to the nearest mark
    const us = r.values.map((v) => { const n = Math.round(v / per); return { full: n, frac: 0, cells: n }; });
    const rows = Math.max(...us.map((u) => Math.ceil(u.cells / S.cols))) + (r.accent ? (tall ? 2 : 1) : 0);
    const b = { r, us, rows, base: y, top: y - rows * S.p };
    y = b.top - S.bandGap - (r.accent && tall ? 9 : 0);
    return b;
  });
  const topY = bands[bands.length - 1].top;

  // years under the columns
  const yg = g(svg);
  d.years.forEach((yr, i) => text(yg, colX(i) + colW / 2, H - S.bottom + S.year + 5, String(yr), { family: 'mono', size: S.year, anchor: 'middle', fill: C.muted }));
  void line;
  st.fade(yg, 0, 0.1);

  let ringBox = null, ringBand = null;
  bands.forEach((b, k) => {
    const a = 0.06 + k * 0.13, e = a + 0.26;
    if (b.r.accent) {
      const f = rect(svg, tall ? 0 : S.x0 - 12, b.top - 6, tall ? W : right - S.x0 + 24, b.rows * S.p + 12, { fill: C.field, 'data-audit': 'skip' });
      st.fade(f, a, a + 0.12);
      ringBand = b;
    }
    // marks: every column rises at the same time, row by row
    const all = [];
    b.us.forEach((u, i) => {
      const list = cells(u.cells, S.cols, { gx: S.p, gy: S.p, up: true });
      const ds = dots(g(svg), list, u, S.r, { fill: b.r.accent ? C.accent : C.ink }, colX(i), b.base);
      ds.forEach((c, j) => all.push({ c, key: list[j].row * 1000 + i * 20 + list[j].col }));
      if (b.r.accent && i === d.years.length - 1) {
        const rr = Math.ceil(u.cells / S.cols);
        ringBox = { cx: colX(i) + colW / 2, cy: b.base - (rr * S.p) / 2, w: colW, h: rr * S.p };
      }
    });
    all.sort((p, q) => p.key - q.key);
    st.fill(all.map((o) => o.c), a, e);

    // the route's name
    const lg = g(svg);
    if (tall) {
      text(lg, S.x0, b.top - 7 - (b.r.accent ? 6 : 0), b.r.label, { family: 'sans', size: S.label, weight: 500 });
    } else {
      const lx = right + 50, cy = (b.top + b.base) / 2;
      const o = { family: 'sans', size: S.label, weight: 500, width: W - lx - 8 };
      const size = textSize(b.r.label, o);
      const lab = text(lg, lx, cy + S.label * 0.34 - ((size.lines - 1) * size.lh) / 2, b.r.label, o);
      bracket(lg, right + 32, b.top + 1, right + 32, b.base - 1, 4, { stroke: C.muted, 'stroke-width': 1 });
      leader(lg, lab.x - 5, cy, right + 33, cy, { stroke: C.muted, dot: false });
    }
    st.fade(lg, a + 0.02, a + 0.12);
  });

  // totals above the columns
  const tg = g(svg);
  const ty = topY - (tall ? 26 : 16);
  d.years.forEach((yr, i) => text(tg, colX(i) + colW / 2, ty, fmt(d.totals.values[i]), { family: 'mono', size: S.num, weight: 500, anchor: 'middle' }));
  if (tall) text(tg, W - S.x0, ty - 17, d.totals.note, { italic: true, size: S.note, anchor: 'end', fill: C.muted });
  else text(tg, W - 8, 18, d.totals.note, { italic: true, size: S.note, fill: C.muted, anchor: 'end' });
  st.fade(tg, 0.74, 0.84);

  // unit note under the first column, joined to its last bottom-row mark
  const ug = g(svg);
  const ux = tall ? S.x0 + colW + 14 : colX(0) + colW + 24;
  const un = text(ug, ux, H - (tall ? 44 : 16), d.unit.note, { italic: true, size: S.note, width: tall ? 200 : 520 });
  leader(ug, un.x - 5, un.y + 7, colX(0) + colW - S.p / 2 + 2.5, bands[0].base - S.p / 2 + 3, { stroke: C.muted });
  const tagG = g(svg);
  if (tall) text(tagG, S.x0, ty - 17, d.tag, { family: 'mono', size: 11.5, fill: C.muted });
  else text(tagG, W - 8, H - 16, d.tag, { family: 'mono', size: 12, fill: C.muted, anchor: 'end' });
  st.fade(tagG, 0.8, 0.9);
  st.fade(ug, 0.8, 0.9);

  // severance: the note in the free rows of its band, and the pen ring
  const sev = ringBand.r.values, last = sev.length - 1;
  const ng = g(svg);
  const noteStr = `[[${fmt(sev[0])}]] in ${d.years[0]} → [[${fmt(sev[last])}]] in ${d.years[last]}`;
  const rx = ringBox.w * (tall ? 0.6 : 0.66), ry = ringBox.h * (tall ? 0.72 : 0.74);
  const nt = text(ng, tall ? S.x0 : colX(3) + colW - 4, ringBand.top + S.note * 0.72 - 1, noteStr, { italic: true, size: S.note, anchor: tall ? 'start' : 'end' });
  { // the leader ends on the ring itself
    const dy = (nt.cy - ringBox.cy) / ry, ex = ringBox.cx - rx * Math.sqrt(Math.max(0, 1 - dy * dy));
    leader(ng, nt.right + 5, nt.cy, ex - 2, nt.cy, { stroke: C.muted, dot: false });
  }
  st.fade(ng, 0.86, 0.94);
  const pr = penRing(svg, ringBox.cx, ringBox.cy, rx, ry, { seed: 5, stroke: C.accent, width: tall ? 1.4 : 1.7, start: -2.7 });
  pr.paths.forEach((p, k) => st.draw(p, 0.86 + k * 0.03, 0.98 + k * 0.02));

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
