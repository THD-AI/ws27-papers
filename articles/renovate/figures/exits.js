// exits: the agreed routes out of Telekom in Germany, 2021 to 2025. One
// mark is 50 positions on every device, screen and print (data: unit), in
// marks that stay round on paper and on a screen at 100 dpi.
//   step 0: the five years as columns of marks, one stack each, the routes
//           not yet told apart; the yearly totals above, "about 4,000 a
//           year" beside them.
//   step 1: each column splits into the five routes. The groups move onto
//           shared base lines, so a route can be followed across the years,
//           and the route names arrive at the right (at the top of each
//           group on phones).
//   step 2: severance in the one field and the accent, "526 in 2021 → 1,016
//           in 2025" with the pen ring; the other routes step back.
// Print draws the last step with the other routes in full ink, as before.
import {
  mountFigure, svgRoot, colors, g, rect, text, textSize, cells, dots,
  leader, bracket, penRing, stage, fmt, measure, h, FONTS, ease, span,
} from '../../../lib/fig.js';

export const steps = 3;
// where scenes read as a sequence (tablet portrait, phone landscape): one still, the final state
export const stills = [2];
export const aspect = { wide: 880 / 462, tall: 360 / 384 };

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
  const W = tall ? 360 : 880, H = tall ? 384 : 462;
  const U = d.unit;
  const per = U.positionsPerMark;
  const svg = svgRoot(el, W, H, `${d.reading} Totals by year: `
    + d.years.map((y, i) => `${y} ${fmt(d.totals.values[i])}`).join(', ')
    + `, ${d.average.text}. Severance: ${d.routes.find((r) => r.accent).values.map((v, i) => `${d.years[i]} ${fmt(v)}`).join(', ')}.`);
  svg.style.color = C.ink;
  const st = stage();
  const head = g(svg, { 'data-role': 'title' });
  text(head, tall ? 14 : 16, tall ? 14 : 18, d.headline, { family: 'sans', size: tall ? 12.5 : 14, weight: 600, width: W - 28, lh: 15.5 });
  st.fade(head, 0, 0.06);
  // everything but the title and the note at the top right: at step 0 it is
  // lifted so the stacks open right under the title, and it settles on its
  // base line as the stacks split (no empty band between title and chart)
  const chart = g(svg);

  // wide lettering is at least 14 units, so the drawing is read at 11.5 px
  // from about 720 px across (a scene beside the text at 1366 x 768)
  const S = tall
    ? { cols: 7, p: 8.2, r: 3.15, x0: 19, colGap: 9, bandGap: 21, label: 12, num: 11.5, note: 12.5, year: 11.5, bottom: 54 }
    : { cols: 10, p: 11, r: 4.1, x0: 26, colGap: 26, bandGap: 15, label: 14, num: 14, note: 14, year: 14, bottom: 62 };
  if (!tall) Object.assign(S, U.marks || {});
  const colW = S.cols * S.p;
  const colX = (i) => S.x0 + i * (colW + S.colGap);
  const right = colX(d.years.length - 1) + colW;
  const base0 = H - S.bottom;

  // bands from the bottom; each as high as its fullest year
  let y = base0;
  const bands = d.routes.map((r) => {
    // whole marks only: each group is rounded to the nearest mark
    const us = r.values.map((v) => { const n = Math.round(v / per); return { full: n, frac: 0, cells: n }; });
    const rows = Math.max(...us.map((u) => Math.ceil(u.cells / S.cols))) + (r.accent ? (tall ? 2 : 1) : 0);
    const b = { r, us, rows, base: y, top: y - rows * S.p };
    y = b.top - S.bandGap - (r.accent && tall ? 7 : 0);
    return b;
  });
  const topY = bands[bands.length - 1].top;

  // step 0: one stack per year, the marks of all routes packed one after
  // another, so each column is one block with only its top row unfilled.
  const offset = d.years.map(() => 0);
  const compact = bands.map((b) => b.us.map((u, i) => { const at = offset[i]; offset[i] += u.cells; return at; }));
  const stackTop = offset.map((n) => base0 - Math.ceil(n / S.cols) * S.p);   // top of each year's stack
  const split = (gg) => ease(span(gg, 1.0, 1.22));

  // years under the columns
  const yg = g(chart);
  d.years.forEach((yr, i) => text(yg, colX(i) + colW / 2, base0 + S.year + 5, String(yr), { family: 'mono', size: S.year, anchor: 'middle', fill: C.muted }));
  st.fade(yg, 0, 0.08);

  // the colour of the marks: ink; at step 2 severance turns to the accent
  // and the others step back (not in print, which keeps them in ink)
  const back = mixer(C.ink, mixer(C.muted, C.paper)(0.35));
  const toAccent = mixer(C.ink, C.accent);
  const focus = (gg) => ease(span(gg, 2.0, 2.16));

  let ringBox = null, ringBand = null;
  const allMarks = [], moving = [];
  bands.forEach((b, k) => {
    if (b.r.accent) {
      const f = rect(chart, tall ? 0 : S.x0 - 12, b.top - 6, tall ? W : right - S.x0 + 24, b.rows * S.p + 12, { fill: C.field, 'data-audit': 'skip' });
      st.fade(f, 2.0, 2.12);
      ringBand = b;
    }
    const mg = g(chart, { fill: C.ink });
    b.us.forEach((u, i) => {
      const list = cells(u.cells, S.cols, { gx: S.p, gy: S.p, up: true });
      // each mark moves from its place in the packed stack to its band
      const ds = dots(mg, list, u, S.r, {}, colX(i), b.base);
      ds.forEach((c, j) => {
        const n = compact[k][i] + j, row = Math.floor(n / S.cols), col = n % S.cols;
        const dx = (col - list[j].col) * S.p;
        const dy = (base0 - (row + 0.5) * S.p) - (b.base + list[j].y);
        // step 0: the marks rise row by row through the whole stack
        allMarks.push({ c, key: row * 1000 + i * 20 + col });
        if (dx || dy) moving.push({ c, dx, dy });
      });
      if (b.r.accent && i === d.years.length - 1) {
        const rr = Math.ceil(u.cells / S.cols);
        ringBox = { cx: colX(i) + colW / 2, cy: b.base - (rr * S.p) / 2, w: colW, h: rr * S.p };
      }
    });
    {
      let last = '';
      const to = b.r.accent ? toAccent : ctx.print ? null : back;
      if (to) {
        st.on((gg) => {
          const v = to(focus(gg));
          if (v !== last) { mg.setAttribute('fill', v); last = v; }
        });
      }
    }

    // the route's name, from step 1
    const lg = g(chart);
    b.lg = lg;
    if (tall) {
      text(lg, S.x0, b.top - 6 - (b.r.accent ? 5 : 0), b.r.label, { family: 'sans', size: S.label, weight: 500 });
    }
    const la = 1.06 + k * 0.03;
    st.fade(lg, la, la + 0.08);
  });
  if (!tall) {
    // names at the right, joined to a bracket over their band. A name that
    // does not fit on one line breaks after its comma; names of thin bands
    // are moved apart (bottom up) so that none lies on another.
    const lx = right + 50;
    const o = { family: 'sans', size: S.label, weight: 500, width: W - lx - 8 };
    let floor = Infinity;
    bands.forEach((b) => {
      let str = b.r.label;
      if (textSize(str, o).lines > 1 && str.includes(', ')) str = str.replace(', ', ',\n');
      const size = textSize(str, o);
      const want = (b.top + b.base) / 2;
      const cy = Math.min(want, floor - 7 - size.h / 2);
      floor = cy - size.h / 2;
      const lab = text(b.lg, lx, cy + S.label * 0.34 - ((size.lines - 1) * size.lh) / 2, str, o);
      bracket(b.lg, right + 32, b.top + 1, right + 32, b.base - 1, 4, { stroke: C.muted, 'stroke-width': 1 });
      leader(b.lg, lab.x - 5, cy, right + 33, want, { stroke: C.muted, dot: false });
    });
  }
  {
    let lastS = -1;
    st.on((gg) => {
      const q = 1 - split(gg);
      if (Math.abs(q - lastS) < 0.0005) return;
      lastS = q;
      for (const m of moving) m.c.setAttribute('transform', q ? `translate(${(m.dx * q).toFixed(2)} ${(m.dy * q).toFixed(2)})` : '');
    });
  }
  allMarks.sort((p, q) => p.key - q.key);
  st.fill(allMarks.map((o) => o.c), 0.04, 0.2);

  // totals above the columns: above each stack at step 0, on one line from step 1
  const ty = topY - (tall ? 24 : 16);
  const tg = g(chart);
  const slide = (el, dy) => {
    let last = '';
    st.on((gg) => {
      const v = `translate(0 ${(dy * (1 - split(gg))).toFixed(2)})`;
      if (v !== last) { el.setAttribute('transform', v); last = v; }
    });
  };
  const lift = d.years.map((yr, i) => (stackTop[i] - (tall ? 9 : 12)) - ty);
  d.years.forEach((yr, i) => {
    const tt = g(tg);
    text(tt, colX(i) + colW / 2, ty, fmt(d.totals.values[i]), { family: 'mono', size: S.num, weight: 500, anchor: 'middle' });
    slide(tt, lift[i]);
  });
  st.fade(tg, 0.16, 0.22);
  // "about 4,000 a year" over the totals, at the left; it rides with them
  const ag = g(chart);
  text(ag, S.x0 + (tall ? 0 : -6), ty - (tall ? 17 : 26), d.average.text, { italic: true, size: S.note + (tall ? 0 : 1) });
  slide(ag, Math.min(...lift));
  st.fade(ag, 0.18, 0.26);
  // the whole drawing rises by as much as the tallest stack is short of the
  // split bands, so "about 4,000 a year" stays under the title
  slide(chart, -Math.min(...lift));
  const tn = g(svg);
  if (tall) text(tn, W - S.x0, ty - 17, d.totals.note, { italic: true, size: S.note, anchor: 'end', fill: C.muted });
  else text(tn, W - 8, 18, d.totals.note, { italic: true, size: S.note, fill: C.muted, anchor: 'end' });
  st.fade(tn, 0.18, 0.26);

  // unit note under the first column, joined to its last bottom-row mark
  const ug = g(chart);
  const ux = tall ? S.x0 : colX(0) + colW + 24;
  const uy = tall ? base0 + 34 : H - 16;
  const un = text(ug, ux, uy, U.note, { italic: true, size: S.note, width: tall ? 196 : 520, lh: tall ? 14.5 : 0 });
  const mx = colX(0) + colW - S.p / 2 + (tall ? 0 : 2.5), my = base0 - S.p / 2 + (tall ? S.r + 2 : 3);
  if (tall) leader(ug, mx + 4, un.y - 2, mx, my, { stroke: C.muted });
  else leader(ug, un.x - 5, un.y + 7, mx, my, { stroke: C.muted });
  const tagG = g(chart);
  if (tall) text(tagG, W - S.x0, un.y + un.h - 2, d.tag, { family: 'mono', size: 11.5, fill: C.muted, anchor: 'end' });
  else text(tagG, W - 8, H - 16, d.tag, { family: 'mono', size: S.note, fill: C.muted, anchor: 'end' });
  st.fade(tagG, 0.2, 0.28);
  st.fade(ug, 0.2, 0.28);

  // step 2, severance: the note in the free rows of its band, and the pen ring
  const sev = ringBand.r.values, last = sev.length - 1;
  const ng = g(chart);
  // Upright sans with tabular lining figures: the mono zero, small and
  // beside italics, was read as an 8 ("1,816").
  const rx = ringBox.w * (tall ? 0.6 : 0.66), ry = ringBox.h * (tall ? 0.72 : 0.74);
  const nSize = tall ? 14.5 : 16.5;
  const pieces = [
    { s: fmt(sev[0]), weight: 600 }, { s: ` in ${d.years[0]}  →  `, weight: 400 },
    { s: fmt(sev[last]), weight: 600 }, { s: ` in ${d.years[last]}`, weight: 400 },
  ].map((p) => ({ ...p, w: measure(p.s, { family: 'sans', size: nSize, weight: p.weight }) }));
  const total = pieces.reduce((s, p) => s + p.w, 0);
  const nBase = ringBand.top + nSize * 0.78 + (tall ? 1 : 0);
  // wide: over the first three years, whose severance is two rows of marks,
  // so the note lies on no mark (the later years reach into its row)
  const nx0 = S.x0;
  const te = h('text', { x: nx0.toFixed(1), y: nBase.toFixed(1), fill: C.ink, 'font-family': FONTS.sans, 'font-size': nSize }, ng);
  te.style.whiteSpace = 'pre';
  te.style.fontVariantNumeric = 'tabular-nums lining-nums';
  pieces.forEach((p) => { h('tspan', { 'font-weight': p.weight }, te).textContent = p.s; });
  const nt = { right: nx0 + total, cy: nBase - nSize * 0.36 };
  { // the leader ends on the ring itself
    const dy = (nt.cy - ringBox.cy) / ry, ex = ringBox.cx - rx * Math.sqrt(Math.max(0, 1 - dy * dy));
    leader(ng, nt.right + 5, nt.cy, ex - 2, nt.cy, { stroke: C.muted, dot: false });
  }
  st.fade(ng, 2.06, 2.16);
  const pr = penRing(chart, ringBox.cx, ringBox.cy, rx, ry, { seed: 5, stroke: C.accent, width: tall ? 1.4 : 1.7, start: -2.7 });
  pr.paths.forEach((p, k) => st.draw(p, 2.08 + k * 0.02, 2.24 + k * 0.02));

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
