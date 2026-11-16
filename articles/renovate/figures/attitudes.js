// attitudes: the same question, asked in both countries. Three panels of
// 100-dot strips, one dot is 1%: one row of 100 per country (two rows of 50
// on a phone), Germany above the United States, on the same left edge. The
// third question was asked in the EU only and stands alone.
import {
  mountFigure, svgRoot, colors, g, rect, line, text, textSize, cells, dots, plate, penRing, stage, fmt,
} from '../../../lib/fig.js';

export const steps = 1;
const SIZE = { wide: [580, 342], tall: [360, 376] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, `${d.reading} `
    + d.panels.map((p) => `"${p.question}": ${p.rows.map((r) => `${r.country} ${r.value}%`).join(', ')}`).join('. ') + '.');
  svg.style.color = C.ink;
  const st = stage();

  const S = tall
    ? { q: 12.5, tag: 11.5, label: 12, num: 12.5, note: 12.5, pitch: 4.0, gap: 1.6, r: 1.6, rows: 2, cols: 50, x0: 14, sx: 100, rowH: 21, panelGap: 22, top: 48 }
    : { q: 13.5, tag: 12, label: 13, num: 13.5, note: 14, pitch: 4.0, gap: 1.8, r: 1.65, rows: 1, cols: 100, x0: 16, sx: 112, rowH: 19, panelGap: 28, top: 50 };
  const n = d.unit.dotsPerStrip;
  // the strip takes what the country names and the numbers leave
  const names = [...new Set(d.panels.flatMap((p) => p.rows.map((r) => r.country)))];
  S.sx = S.x0 + Math.max(...names.map((c) => textSize(c, { family: 'sans', size: S.label }).w)) + 9;
  const numW = textSize('100%', { family: 'mono', size: S.num, weight: 500 }).w + (tall ? 14 : 18);
  S.pitch = Math.min(4.2, (W - S.sx - S.x0 - numW - 9 * S.gap * (S.cols / 100)) / S.cols);
  S.r = S.pitch * 0.41;
  if (tall) S.top = 64;
  const slot = cells(n, S.cols, { gx: S.pitch, gy: S.pitch + 0.6, group: 10, groupGap: S.gap });
  const stripH = S.rows * (S.pitch + 0.6);
  const valX = S.sx + slot.width + (tall ? 8 : 10);

  const hd = g(svg);
  text(hd, S.x0, tall ? 14 : 18, d.headline, { family: 'sans', size: tall ? 12.5 : 14, weight: 600 });
  if (tall) text(hd, S.x0, 32, d.unit.note, { italic: true, size: S.note });
  else text(hd, W - S.x0, 18, d.unit.note, { italic: true, size: S.note, anchor: 'end' });
  st.fade(hd, 0, 0.08);

  let y = S.top, ring = null;
  d.panels.forEach((p, pi) => {
    const a = 0.06 + pi * 0.27;
    const pg = g(svg);
    if (pi > 0) line(pg, S.x0, y - S.panelGap / 2 - 5, W - S.x0, y - S.panelGap / 2 - 5, { stroke: C.hairline, 'stroke-width': 1 });
    const q = text(pg, S.x0, y, `“${p.question}”`, { family: 'sans', size: S.q, weight: 500, width: W - 2 * S.x0 });
    const tg = text(pg, S.x0, q.bottom + S.tag + 1, p.survey, { family: 'mono', size: S.tag, fill: C.muted });
    st.fade(pg, a, a + 0.08);
    let sy = tg.bottom + 10;
    p.rows.forEach((r, ri) => {
      const b = a + 0.06 + ri * 0.08;
      const mid = sy + stripH / 2;
      if (p.standsOut) {
        const f = rect(svg, 0, mid - S.rowH / 2 - 2, W, S.rowH + 4, { fill: C.field, 'data-audit': 'skip' });
        st.fade(f, b, b + 0.1);
      }
      const count = Math.round(r.value / d.unit.percentPerDot);
      const lab = text(svg, S.x0, mid + S.label * 0.34, r.country, { family: 'sans', size: S.label });
      st.fade(lab.el, b, b + 0.06);
      const pl = plate(svg, slot.filter((c) => c.i >= count), 0.7, p.standsOut ? C.muted : C.hairline, S.sx, sy);
      pl.setAttribute('opacity', p.standsOut ? 0.5 : 1);
      st.fade(pl, b - 0.04, b + 0.04);
      const ds = dots(g(svg), slot, count, S.r, { fill: p.standsOut ? C.accent : C.ink }, S.sx, sy);
      st.fill(ds, b, b + 0.2);
      // the number stands in its own column, clear of the dots
      const val = text(svg, valX, mid + S.num * 0.34, `${fmt(r.value)}%`, { family: 'mono', size: S.num, weight: 500 });
      st.fade(val.el, b + 0.17, b + 0.24);
      if (p.standsOut) ring = val;
      sy += S.rowH;
    });
    if (p.note) {
      // where a second strip would be: the note says why there is none
      const nt = text(svg, S.sx, sy + S.note * 0.8 + 4, p.note, { italic: true, size: S.note, width: W - S.sx - S.x0 });
      st.fade(nt.el, a + 0.34, a + 0.42);
      sy = nt.bottom + 4;
    }
    y = sy + S.panelGap + S.q - 4;
  });
  svg.dataset.contentH = Math.round(y - S.panelGap - S.q + 10);

  if (ring) {
    const pr = penRing(svg, ring.cx, ring.cy - 0.5, ring.w / 2 + (tall ? 5.5 : 7), S.num * 0.5 + (tall ? 3.6 : 4.4), { seed: 23, stroke: C.accent, width: tall ? 1.3 : 1.5 });
    pr.paths.forEach((p, k) => st.draw(p, 0.88 + k * 0.03, 0.98 + k * 0.02));
  }
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
