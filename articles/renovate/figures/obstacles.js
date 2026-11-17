// obstacles: why German firms decided against AI. Six rows of unit dots,
// one dot is 2 percentage points, counted from zero at the left. In print
// one dot is 4 points (data: unit.print), so that the dots stay round and
// countable on paper and on a screen at 100 dpi.
//   step 0: the six rows; missing knowledge (72%) in the field and the
//           accent, its value ringed, "first: know-how".
//   step 1: the two legal rows (62%, 60%) take the field and the accent,
//           with the bracket "the law: second and third"; missing knowledge
//           goes back to plain ink, its label stays, muted.
// Print draws the drawing as before: knowledge in the field, the law
// marked quietly by the bracket.
import {
  mountFigure, svgRoot, colors, g, rect, line, text, cells, dots, plate,
  leader, edge, penRing, stage, fmt, bracket, ease, span,
} from '../../../lib/fig.js';

export const steps = 2;
// where scenes read as a sequence (tablet portrait, phone landscape): one still, the final state
export const stills = [1];
export const aspect = { wide: 580 / 422, tall: 360 / 386 };

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
// sets an attribute from g on every frame, writing only when it changes
function bind(st, el, name, fn) {
  let last = null;
  st.on((gg) => { const v = fn(gg); if (v !== last) { el.setAttribute(name, v); last = v; } });
}

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const W = tall ? 360 : 580, H = tall ? 386 : 422;
  const svg = svgRoot(el, W, H, `${d.reading} Share of German firms naming each reason: `
    + d.rows.map((r) => `${r.label} ${r.value}%`).join(', ') + '.');
  svg.style.color = C.ink;
  const st = stage();
  // the unit: on paper fewer, larger dots
  const U = ctx.print && d.unit.print ? { ...d.unit, ...d.unit.print } : d.unit;
  const whole = (v) => { const n = Math.round(v / U.percentPerDot); return { full: n, frac: 0, cells: n }; };
  const head = g(svg, { 'data-role': 'title' });
  text(head, tall ? 14 : 16, tall ? 14 : 18, d.headline, { family: 'sans', size: tall ? 12.5 : 14, weight: 600, width: W - 28, lh: 15.5 });
  st.fade(head, 0, 0.12);

  // tall: short enough to stand pinned above the passages on a phone
  const S = tall
    ? { label: 12.5, num: 12.5, note: 12.5, axis: 11.5, pitch: 6.2, gap: 3.4, r: 2.35, x0: 14, top: 76, rowH: 46, dotDy: 14 }
    : { label: 13.5, num: 13.5, note: 14, axis: 12, pitch: 10, gap: 6, r: 3.75, x0: 16, top: 84, rowH: 50, dotDy: 15 };
  if (ctx.print) Object.assign(S, tall ? { pitch: 12, gap: 4, r: 4.3, dotDy: 12 } : { pitch: 19, gap: 6, r: 6.6, dotDy: 12 });
  const per = U.percentPerDot, n = U.dotsPerRow, grp = U.group || 10;
  const slot = cells(n, n, { gx: S.pitch, gy: S.pitch, group: grp, groupGap: S.gap });
  const rowY = (i) => S.top + i * S.rowH;            // baseline of the row's label
  const dotY = (i) => rowY(i) + S.dotDy;

  // Where the field is: step 0 on missing knowledge, step 1 on the two
  // legal rows. On paper the field stays on knowledge and the law rows keep
  // their quiet bracket, as the drawing was before it was told in steps.
  const swap = (gg) => (ctx.print ? 0 : ease(span(gg, 1.04, 1.4)));
  const first = d.rows.findIndex((r) => r.first);
  const legal = d.rows.map((r, i) => (r.legal ? i : -1)).filter((i) => i >= 0);
  // missing knowledge turns to the accent with its field, once all rows are there
  const weight = (i) => (i === first ? (gg) => Math.min(ease(span(gg, 0.62, 0.8)), 1 - swap(gg)) : legal.includes(i) ? swap : () => 0);
  const band = (i0, i1) => {
    const y0 = rowY(i0) - S.label - 5, y1 = dotY(i1) + S.pitch + 5;
    return rect(svg, 0, y0, W, y1 - y0, { fill: C.field, 'data-audit': 'skip' });
  };
  if (first >= 0) st.fade(band(first, first), 0.64, 0.8, ctx.print ? null : [1.04, 1.36]);
  if (legal.length && !ctx.print) st.fade(band(legal[0], legal[legal.length - 1]), 1.06, 1.4);
  if (first >= 0) {
    // at the right end of the band, on the line of the row's label; on the
    // narrow layout a little higher, clear of the ring on the value
    const fl = text(svg, W - (tall ? 12 : 16), rowY(first) - (tall ? 6 : 0), d.fieldLabel, { italic: true, size: S.note + 1, fill: C.accent, weight: 600, anchor: 'end' });
    st.fade(fl.el, 0.7, 0.84);
    // from step 1 it stays as a quiet note
    const tone = mixer(C.accent, C.muted);
    bind(st, fl.el.firstChild, 'fill', (gg) => tone(swap(gg)));
  }
  // the two rows about the law: a bracket at the right, from step 1
  if (legal.length) {
    const la = legal[0], lb = legal[legal.length - 1];
    const bx = W - (tall ? 10 : 14), y0 = rowY(la) - S.label + 2, y1 = dotY(lb) + S.pitch;
    const lg = g(svg);
    const br = bracket(lg, bx, y0, bx, y1, tall ? 5 : 6, { stroke: C.muted, 'stroke-width': 1 });
    // in the free band between the two rows, right-aligned against the bracket
    const ly = tall ? rowY(la) + S.dotDy + S.pitch + 14 : (y0 + y1) / 2 + 5;
    const law = text(lg, bx - (tall ? 9 : 12), ly, d.lawLabel, { italic: true, size: S.note, fill: C.muted, anchor: 'end' });
    st.fade(lg, 1.36, 1.56);
    const tone = mixer(C.muted, C.accent);
    bind(st, br, 'stroke', (gg) => tone(swap(gg)));
    bind(st, law.el.firstChild, 'fill', (gg) => tone(swap(gg)));
  }

  // plate: the 50 places of every row, and the scale under the last one
  const pl = g(svg);
  const onField = mixer(C.hairline, C.muted);
  d.rows.forEach((r, i) => {
    // the places behind the row's number stay empty, so that nothing sits under lettering
    const from = whole(r.value).cells, skip = Math.ceil(((tall ? 7 : 9) + S.num * 0.62 * (String(r.value).length + 1) + 5) / S.pitch);
    const free = slot.filter((c) => c.i < from || c.i >= from + skip);
    const p = plate(pl, free, ctx.print ? (tall ? 1.1 : 1.6) : tall ? 0.75 : 0.95, C.hairline, S.x0, dotY(i));
    // on the field the places are drawn darker, so that they still show
    const w = weight(i);
    bind(st, p, 'fill', (gg) => onField(w(gg)));
    bind(st, p, 'opacity', (gg) => (1 - 0.55 * w(gg)).toFixed(3));
  });
  const axY = dotY(d.rows.length - 1) + S.pitch + (tall ? 12 : 14);
  const ax = g(svg);
  line(ax, S.x0, axY, S.x0 + slot.width, axY, { stroke: C.ink, 'stroke-width': 1.25 });
  for (let k = 0; k <= n; k += grp) {
    const x = k === n ? S.x0 + slot.width : S.x0 + slot[k].x - S.pitch / 2 - (k ? S.gap / 2 : 0);
    line(ax, x, axY, x, axY + 5, { stroke: C.ink, 'stroke-width': 1.25 });
    text(ax, x, axY + 5 + S.axis, `${fmt(k * per)}${k === n ? '%' : ''}`, { family: 'mono', size: S.axis, fill: C.muted, anchor: k === 0 ? 'start' : k === n ? 'end' : 'middle' });
  }
  st.fade(pl, 0.06, 0.22).fade(ax, 0.08, 0.24);

  // rows: all six arrive in step 0
  let ringAt = null, firstRow = null;
  d.rows.forEach((r, i) => {
    // the rows one after another, top down: name, dots, value
    const a = 0.14 + i * 0.07, b = a + 0.22;
    const lab = text(svg, S.x0, rowY(i), r.label, { family: 'sans', size: S.label, weight: 500 });
    st.fade(lab.el, a - 0.02, a + 0.1);
    const u = whole(r.value);
    const dg = g(svg);
    const ds = dots(dg, slot, u, S.r, {}, S.x0, dotY(i));
    const tone = mixer(C.ink, C.accent), w = weight(i);
    bind(st, dg, 'fill', (gg) => tone(w(gg)));
    st.fill(ds, a, b);
    const last = slot[u.cells - 1];
    const vx = S.x0 + last.x + S.pitch / 2 + (tall ? 7 : 9);
    const val = text(svg, vx, dotY(i) + S.pitch / 2 + S.num * 0.34, `${fmt(r.value)}%`, { family: 'mono', size: S.num, weight: 500 });
    st.fade(val.el, b - 0.04, b + 0.06);
    if (i === first) { ringAt = val; firstRow = { x: S.x0 + slot[Math.min(u.full - 1, Math.round(n * 0.54))].x, y: dotY(i) + S.pitch / 2 }; }
  });

  // notes
  const nt = g(svg);
  const nx = tall ? 150 : 300, ny = tall ? 50 : 48;
  const unitNote = text(nt, nx, ny, U.note, { italic: true, size: S.note });
  const p0 = edge(unitNote, firstRow.x, firstRow.y);
  leader(nt, unitNote.x + 10, p0[1], firstRow.x + (tall ? 4 : 5), firstRow.y - S.r - 3, { stroke: C.muted });
  st.fade(nt, 0.4, 0.56);
  const foot = text(svg, W - S.x0 + (tall ? 0 : 2), H - (tall ? 9 : 12), d.note.text, { italic: true, size: S.note, anchor: 'end', fill: C.muted });
  st.fade(foot.el, 0.62, 0.76);

  // the pen ring on the number step 0 names, 72%; on screen it goes with the field
  const ring = penRing(svg, ringAt.cx, ringAt.cy - 0.5, ringAt.w / 2 + (tall ? 7 : 8.5), S.num * 0.5 + (tall ? 5.5 : 6.5), { seed: 11, stroke: C.accent, width: tall ? 1.35 : 1.5 });
  ring.paths.forEach((p, k) => st.draw(p, 0.72 + k * 0.05, 0.86 + k * 0.04, ctx.print ? null : [1.04, 1.3]));

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
