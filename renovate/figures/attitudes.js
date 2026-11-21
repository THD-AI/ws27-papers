// attitudes: the same question, asked in both countries. Three panels of
// dot strips, one dot is 2% (data: unit), one row of 50 per country at every
// width, so 100% always fits on one line; Germany above the United States,
// same left edge, the exact value at the end of each row. The
// third question was asked in the EU only and stands alone. In print one dot
// is 5% (data: unit.print), one row of 20 per country, so that the dots stay
// round and countable on paper and on a screen at 100 dpi.
//   step n (0, 1, 2): question n arrives in full ink; the questions before
//   it stay where they are and step back to the muted colour. The third,
//   monitoring of workers (EU only), is the one in the field, its 79% ringed.
// Print shows all three in full ink, as before.
import {
  mountFigure, svgRoot, colors, g, rect, line, text, textSize, cells, dots, plate, penRing, stage, fmt,
  ease, span,
} from '../fig.js';

export const steps = 3;
// where scenes read as a sequence (tablet portrait, phone landscape): one still, the final state
export const stills = [2];
// seconds each step plays once triggered: title and two rows; two rows;
// one row with its field, ring and note
export const durations = { large: [2.2, 2.0, 1.6] };
const SIZE = { wide: [580, 410], tall: [360, 390] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

// '#rrggbb' or 'rgb(r, g, b)' -> [r, g, b]
function rgbOf(c) {
  const s = String(c).trim();
  if (s[0] === '#') {
    const x = s.length === 4 ? s.slice(1).split('').map((ch) => ch + ch).join('') : s.slice(1, 7);
    return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
  }
  const m = s.match(/[\d.]+/g);
  return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}
function mixer(a, b) {
  const A = rgbOf(a), B = rgbOf(b);
  return (p) => (p <= 0 ? a : p >= 1 ? b : `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(',')})`);
}

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, `${d.reading} `
    + d.panels.map((p) => `"${p.question}": ${p.rows.map((r) => `${r.country} ${r.value}%`).join(', ')}`).join('. ') + '.');
  svg.style.color = C.ink;
  const st = stage();

  const S = tall
    ? { q: 12.5, tag: 11.5, label: 12, num: 12.5, note: 12.5, pitch: 4.0, gap: 1.6, r: 1.6, rows: 2, cols: 50, x0: 14, sx: 100, rowH: 21, panelGap: 18, top: 48 }
    : { q: 15, tag: 12.5, label: 14.5, num: 15, note: 14.5, pitch: 7.0, gap: 3, r: 2.9, rows: 2, cols: 50, x0: 16, sx: 112, rowH: 24, panelGap: 26, top: 50 };
  const U = ctx.print && d.unit.print ? { ...d.unit, ...d.unit.print } : d.unit;
  S.rows = U.rows || 1; S.cols = U.dotsPerStrip / S.rows;
  if (ctx.print) S.panelGap = tall ? 22 : 26;
  const grp = U.group || 10;
  const n = U.dotsPerStrip;
  // the strip takes what the country names and the numbers leave
  const names = [...new Set(d.panels.flatMap((p) => p.rows.map((r) => r.country)))];
  S.sx = S.x0 + Math.max(...names.map((c) => textSize(c, { family: 'sans', size: S.label }).w)) + 9;
  // the value stands clear of the strip by more than the pen ring reaches
  // out to its left, so the ring around 79% lies on no dot
  const ringX = tall ? 5.5 : 7, valGap = ringX + (tall ? 7 : 9);
  const numW = textSize('100%', { family: 'mono', size: S.num, weight: 500 }).w + valGap + ringX + 4;
  if (ctx.print) S.gap = tall ? 4 : 6;
  const maxPitch = ctx.print ? (tall ? 11 : 16) : tall ? 6 : 8.6;
  S.pitch = Math.min(maxPitch, (W - S.sx - S.x0 - numW - (S.cols / grp - 1) * S.gap) / S.cols);
  S.r = S.pitch * (ctx.print ? 0.43 : 0.41);
  const slot = cells(n, S.cols, { gx: S.pitch, gy: S.pitch + 0.6, group: grp, groupGap: S.gap });
  const stripH = S.rows * (S.pitch + 0.6);
  if (!tall) S.rowH = Math.max(stripH + 9, ctx.print ? 0 : 24);   // one thin row of dots: the names keep their line apart
  const valX = S.sx + slot.width + valGap;

  const hd = g(svg, { 'data-role': 'title' });
  const hl = text(hd, S.x0, tall ? 14 : 18, d.headline, { family: 'sans', size: tall ? 12.5 : 15, weight: 600, width: W - 2 * S.x0, lh: tall ? 15.5 : 18 });
  st.fade(hd, 0, 0.12);
  const ug = g(svg);
  const un = text(ug, S.x0, hl.bottom + S.note + 2, U.note, { italic: true, size: S.note });
  st.fade(ug, 0.08, 0.22);
  S.top = un.bottom + (tall ? 20 : 24);

  // The panel of step n is in full ink; once the next one arrives it steps
  // back to the muted colour (on screen; on paper all three stay in ink).
  const recede = mixer(C.ink, C.muted);
  let y = S.top, ring = null;
  d.panels.forEach((p, pi) => {
    // each step: the question, then its rows one after another, each row's
    // name, dots and value in reading order, spread over most of the step
    const a = pi + (pi ? 0.02 : 0.16);
    // after the entry each row takes longer (k) and the rows lie further
    // apart (P), so the step is drawn to its end, not done by two thirds
    const k = pi ? 1.3 : 1, P = pi ? 0.34 : 0.3;
    let bLast = a;
    const pg = g(svg);
    if (!ctx.print && pi < d.panels.length - 1) {
      let last = '';
      st.on((gg) => {
        const v = recede(ease(span(gg, pi + 1, pi + 1.3)));
        if (v !== last) { pg.style.color = v; last = v; }
      });
    }
    const head = g(pg);
    if (pi > 0) line(head, S.x0, y - S.panelGap / 2 - 5, W - S.x0, y - S.panelGap / 2 - 5, { stroke: C.hairline, 'stroke-width': 1 });
    const q = text(head, S.x0, y, `“${p.question}”`, { family: 'sans', size: S.q, weight: 500, width: W - 2 * S.x0 });
    // a question asked as a choice between two answers says what the other was
    const ch = p.choice ? text(head, S.x0, q.bottom + S.note + 1, p.choice, { italic: true, size: S.note, fill: C.muted, width: W - 2 * S.x0 }) : null;
    const tg = text(head, S.x0, (ch || q).bottom + S.tag + 1, p.survey, { family: 'mono', size: S.tag, fill: C.muted });
    st.fade(head, a, a + 0.16);
    let sy = tg.bottom + 10;
    p.rows.forEach((r, ri) => {
      const b = a + 0.18 + ri * P;
      bLast = b;
      const mid = sy + stripH / 2;
      if (p.standsOut) {
        const f = rect(pg, 0, mid - S.rowH / 2 - 2, W, S.rowH + 4, { fill: C.field, 'data-audit': 'skip' });
        st.fade(f, b - 0.04, b + 0.14 * k);
      }
      const count = Math.round(r.value / U.percentPerDot);
      const lab = text(pg, S.x0, mid + S.label * 0.34, r.country, { family: 'sans', size: S.label });
      st.fade(lab.el, b, b + 0.12 * k);
      const pl = plate(pg, slot.filter((c) => c.i >= count), ctx.print ? (tall ? 1.1 : 1.5) : tall ? 0.7 : 0.95, p.standsOut ? C.muted : C.hairline, S.sx, sy);
      pl.setAttribute('opacity', p.standsOut ? 0.5 : 1);
      st.fade(pl, b + 0.02 * k, b + 0.12 * k);
      const ds = dots(g(pg), slot, count, S.r, { fill: p.standsOut ? C.accent : 'currentColor' }, S.sx, sy);
      st.fill(ds, b + 0.04 * k, b + 0.24 * k);
      // the number stands in its own column, clear of the dots
      const val = text(pg, valX, mid + S.num * 0.34, `${fmt(r.value)}%`, { family: 'mono', size: S.num, weight: 500 });
      st.fade(val.el, b + 0.2 * k, b + 0.3 * k);
      if (p.standsOut) ring = { val, pg, at: b + 0.26 * k };
      sy += S.rowH;
    });
    if (p.note) {
      // where a second strip would be: the note says why there is none
      const nt = text(pg, S.sx, sy + S.note * 0.8 + 4, p.note, { italic: true, size: S.note, width: W - S.sx - S.x0 });
      // after the ring when the panel has one, else after its last row
      const na = ring && ring.pg === pg ? ring.at + 0.14 : bLast + 0.4;
      st.fade(nt.el, na, na + 0.2);
      sy = nt.bottom + 4;
    }
    y = sy + S.panelGap + S.q - 4;
  });
  svg.dataset.contentH = Math.round(y - S.panelGap - S.q + 10);

  if (ring) {
    const { val } = ring;
    const pr = penRing(ring.pg, val.cx, val.cy - 0.5, val.w / 2 + ringX, S.num * 0.5 + (tall ? 3.6 : 4.4), { seed: 23, stroke: C.accent, width: tall ? 1.3 : 1.5 });
    pr.paths.forEach((p, k) => st.draw(p, ring.at + k * 0.06, ring.at + 0.22 + k * 0.05));
  }
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
