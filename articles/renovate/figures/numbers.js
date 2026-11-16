// numbers: what the 40% and the 55% are.
// Plate A (steps 0 to 2): 100 contacts as a 10 by 10 grid.
// Plate B (steps 3 and 4): contacts per account in a year, at the two dates
// that are public. Print: both plates side by side.
import {
  mountFigure, svgRoot, colors, g, line, circle, rect, text, cells, plate,
  leader, bracket, penRing, stage, fmt, span, ease, lerp, linear,
} from '../../../lib/fig.js';

export const steps = 5;
export const aspect = { wide: 800 / 500, tall: 360 / 392 };

const fill = (tpl, v, dec = 0) => tpl.replace('{v}', fmt(v, dec));

// ---------------------------------------------------------------------------
// Plate A. Coordinates are those of its own box: 800 x 500 or 360 x 392.
// `keep`: the plate stays as it is at the end of step 2 (print).
// ---------------------------------------------------------------------------
function plateA(svg, C, d, tall, st, keep, big) {
  const A = d.plateA;
  const L = tall
    ? { p: 20.5, gx: 14, gy: 152, rBase: 2, rUnit: 6.7, note: 12.5, top: [141, 130, 112, 88, 77], bottomY: 378, relX: 229, relNoteX: 241, relW: 108, restX: 256, restY: 116, restW: 96, tagX: 346, tagY: 44 }
    : { p: 32, gx: 150, gy: 162, rBase: 2.8, rUnit: 10.2, note: 14, top: [148, 136, 114, 88, 76], bottomY: 495, relX: 484, relNoteX: 500, relW: 230, restX: 492, restY: 110, restW: 240, tagX: 786, tagY: 17 };
  if (big) L.note = 13.5;
  if (tall) { L.restX = 244; L.restY = 270; L.restW = 108; }
  const root = g(svg), grid = g(root), notes = g(root);
  const n = A.total.value, cols = 10;
  const at = (i) => { const c = i % cols, r = Math.floor(i / cols); return [L.gx + L.p / 2 + c * L.p, L.gy + L.p / 2 + r * L.p]; };
  // order: the first four rows are counted column by column, so that the
  // 32 and the 8 are two clean blocks
  const rowsTop = Math.ceil(A.release.value / cols);
  const order = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rowsTop; r++) order.push(r * cols + c);
  for (let i = rowsTop * cols; i < n; i++) order.push(i);

  // every contact
  const base = [];
  for (let i = 0; i < n; i++) { const [x, y] = at(i); const c = circle(grid, x, y, L.rBase, { fill: C.ink }); c.dataset.r = L.rBase; base.push(c); }
  st.fill(base, 0.04, 0.42);
  // release: 40 carry a dashed outline; nothing is filled
  const dashed = [], discs = [];
  for (let k = 0; k < A.release.value; k++) {
    const [x, y] = at(order[k]);
    dashed.push(circle(grid, x, y, L.rUnit, { fill: 'none', stroke: C.ink, 'stroke-width': 1, 'stroke-dasharray': tall ? '2 2.2' : '2.6 2.8', 'vector-effect': 'non-scaling-stroke' }));
  }
  // the slide: 32 fill with the accent
  for (let k = 0; k < A.slide.value; k++) {
    const [x, y] = at(order[k]);
    const c = circle(grid, x, y, L.rUnit, { fill: C.field, stroke: C.accent, 'stroke-width': tall ? 1.4 : 1.6, 'vector-effect': 'non-scaling-stroke' });
    c.dataset.r = L.rUnit;
    discs.push(c);
    circle(grid, x, y, L.rBase, { fill: C.accent, 'data-audit': 'skip' }).dataset.k = k;
  }
  const cores = [...grid.querySelectorAll('circle[data-k]')];
  st.fill(discs, 1.05, 1.5).fill(cores, 1.05, 1.5);
  dashed.forEach((el, k) => {
    const a = 0.48 + (k / dashed.length) * 0.26;
    if (k < A.slide.value) st.fade(el, a, a + 0.08, [1.05 + (k / A.slide.value) * 0.4, 1.12 + (k / A.slide.value) * 0.4]);
    else st.fade(el, a, a + 0.08);
  });

  const hide = keep ? undefined : [3.0, 3.12];
  const nt = (grp, a, b) => st.fade(grp, a, b, hide);
  const o = { italic: true, size: L.note };

  const gH = g(notes);
  text(gH, tall ? 14 : 16, tall ? 13 : 17, d.headline.a, { family: 'sans', size: tall ? 12 : 13.5, weight: 600, width: tall ? 334 : 640, lh: 15 });
  nt(gH, 0, 0.1);
  // the plate's own note, under the grid
  const gT = g(notes);
  text(gT, L.gx + 2, L.bottomY, fill(A.total.note, A.total.value), o);
  nt(gT, 0.36, 0.5);
  const gTag = g(notes);
  text(gTag, L.tagX, L.tagY, d.tag, { family: 'mono', size: tall ? 11.5 : 12.5, fill: C.muted, anchor: 'end' });
  nt(gTag, 0.36, 0.5);

  // release: a bracket beside the four rows
  const y0 = L.gy + 3, y1 = L.gy + rowsTop * L.p - 3;
  const gR = g(notes);
  const br = bracket(gR, L.relX, y0, L.relX, y1, 5, { stroke: C.ink, 'stroke-width': 1 });
  const relTxt = g(gR);
  const rel = text(relTxt, L.relNoteX, 0, fill(A.release.note, A.release.value), { ...o, width: L.relW });
  relTxt.setAttribute('transform', `translate(0 ${((y0 + y1) / 2 - (rel.y + rel.h / 2)).toFixed(1)})`);
  if (keep) st.draw(br, 0.74, 0.88); else st.draw(br, 0.74, 0.88, hide);
  nt(relTxt, 0.84, 0.96);

  // the slide: a bracket over the 32, its note above
  const bx0 = L.gx + 3, bx1 = L.gx + (A.slide.value / rowsTop) * L.p - 3;
  const gS = g(notes);
  const sb = bracket(gS, bx1, L.top[0], bx0, L.top[0], tall ? 4.5 : 6, { stroke: C.ink });
  if (keep) st.draw(sb, 1.46, 1.66); else st.draw(sb, 1.46, 1.66, hide);
  const gSn = g(notes);
  // the note, then the number on its own with clear space, ringed
  const [pre, post] = A.slide.note.split('[[{v}]]');
  const t1 = text(gSn, bx0, L.top[2], pre.trim(), o);
  const num = text(gSn, t1.right + (tall ? 11 : 13), L.top[2], fmt(A.slide.value), { family: 'mono', size: L.note, weight: 500 });
  text(gSn, num.right + (tall ? 11 : 13), L.top[2], post.trim(), o);
  {
    const pr = penRing(gSn, num.cx, num.cy - 0.5, num.w / 2 + (tall ? 5.5 : 6.5), L.note * 0.5 + (tall ? 3.4 : 4), { seed: 31, stroke: C.accent, width: tall ? 1.3 : 1.5 });
    pr.paths.forEach((p, k) => st.draw(p, 1.74 + k * 0.03, 1.92 + k * 0.03));
  }
  nt(gSn, 1.6, 1.74);
  // at step 1 the slide's note sits on the bracket; at step 2 it makes room
  const drop = L.top[1] - L.top[2];
  st.on((gg) => gSn.setAttribute('transform', `translate(0 ${(drop * (1 - ease(span(gg, 2.04, 2.28)))).toFixed(2)})`));

  // the eight that are only in the release
  const gN = g(notes);
  const rest = text(gN, L.restX, L.restY, A.rest.note, { ...o, width: L.restW });
  if (tall) {
    const [qx, qy] = at(order[A.release.value - 1]);
    leader(gN, rest.x + 6, rest.y - 3, qx + 3, qy + L.rUnit + 3.5, { stroke: C.muted });
  } else {
    const [rx, ry] = at(order[A.slide.value + (tall ? 0 : rowsTop)]);
    leader(gN, rest.x + (tall ? 6 : 10), rest.bottom + 3, rx + (tall ? 3 : 2), ry - L.rUnit - 3.5, { stroke: C.muted });
  }
  nt(gN, 1.8, 1.94);

  // step 2: what the 32 are, and what is not known about them
  const gA = g(notes);
  text(gA, bx0, L.top[1], A.start.note, o);
  nt(gA, 2.24, 2.42);
  const gF = g(notes);
  bracket(gF, bx1, L.top[3], bx0, L.top[3], tall ? 4.5 : 6, { stroke: C.ink, 'stroke-width': 1, 'stroke-dasharray': '3 3.5' });
  text(gF, bx0, L.top[4], A.finished.note, o);
  nt(gF, 2.52, 2.74);

  return { root, grid, box: { x: L.gx, y: L.gy, s: L.p * cols } };
}

// ---------------------------------------------------------------------------
// Plate B. Everything arrives from g = 3.3 on.
// ---------------------------------------------------------------------------
function plateB(svg, C, d, tall, st, noTag, big) {
  const B = d.plateB;
  const L = tall
    ? { x0: 24, x1: 336, axY: 304, stripY: 208, len: 106, tick: 22, note: 12.5, mono: 11.5, head: 12, noteW: 90, emptyY: 272, emptyH: 15, evTop: 84, evW: 96, causeY: 46, tagX: 346, tagY: 386 }
    : { x0: 70, x1: 730, axY: 366, stripY: 232, len: 232, tick: 30, note: 14, mono: 12.5, head: 13.5, noteW: 236, emptyY: 326, emptyH: 20, evTop: 92, evW: 180, causeY: 40, tagX: 786, tagY: 17 };
  if (big) { L.note = 13.5; L.mono = 12.5; L.head = 13; L.noteW = 104; }
  const root = g(svg);
  const t0 = B.axis.from.year + (B.axis.from.quarter - 1) / 4, t1 = B.axis.to.year + B.axis.to.quarter / 4;
  const X = linear(t0, t1, L.x0, L.x1);
  const ink = { stroke: C.ink, 'stroke-width': 1.25, 'stroke-linecap': 'round' };

  // the time axis draws from left to right
  const ax = g(root);
  const axl = line(ax, L.x0, L.axY, L.x1, L.axY, ink);
  st.draw(axl, 3.3, 3.56);
  const yl = g(root);
  for (let yr = Math.ceil(t0); yr <= Math.floor(t1); yr++) {
    line(yl, X(yr), L.axY, X(yr), L.axY + 5, ink);
    text(yl, X(yr), L.axY + 6 + L.mono, String(yr), { family: 'mono', size: L.mono, anchor: 'middle', fill: C.muted });
  }
  st.fade(yl, 3.44, 3.58);

  // the years between: empty strips
  const eg = g(root);
  const evX = X(B.event.year + (B.event.month - 0.5) / 12);
  B.between.years.forEach((yr) => {
    const a = X(yr + 0.07), b = X(yr + 0.93);
    rect(eg, a, L.emptyY, b - a, L.emptyH, { fill: 'none', stroke: C.muted, 'stroke-width': 0.9, 'stroke-dasharray': '2.5 3' });
  });
  text(eg, X(B.between.years[0] + 0.07) + 2, L.emptyY - 7, B.between.note, { italic: true, size: L.note, fill: C.muted });
  st.fade(eg, 3.78, 3.94);

  // the two measured points: one year for one account, one tick per contact
  B.points.forEach((p, i) => {
    const a = 3.46 + i * 0.12;
    const q0 = p.year + (p.quarter - 1) / 4, q1 = q0 + 0.25;
    const sx = i === 0 ? L.x0 : L.x1 - L.len, sy = L.stripY;
    const sg = g(root);
    // plate: the months of the year
    const lat = cells(B.strip.months * 3, B.strip.months, { gx: L.len / B.strip.months, gy: L.tick / 3 });
    plate(sg, lat, tall ? 0.7 : 0.9, C.hairline, sx, sy - L.tick);
    line(sg, sx, sy, sx + L.len, sy, ink);
    line(sg, sx, sy, sx, sy + 5, ink); line(sg, sx + L.len, sy, sx + L.len, sy + 5, ink);
    st.fade(sg, a, a + 0.1);
    // on the axis: the quarter it was measured in, joined to its strip
    const qg = g(root);
    line(qg, X(q0), L.axY, X(q1), L.axY, { stroke: C.ink, 'stroke-width': 3.2 });
    const lx = X((q0 + q1) / 2);
    leader(qg, lx, sy + 8, lx, L.axY - 4, { stroke: C.muted, dot: false });
    st.fade(qg, a, a + 0.1);
    // ticks
    const full = Math.floor(p.value + 1e-9), part = p.value - full;
    const tk = [];
    for (let k = 0; k < full + (part > 1e-6 ? 1 : 0); k++) {
      const u = k < full ? (k + 0.5) / p.value : (full + part / 2) / p.value;
      const hgt = k < full ? L.tick - 3 : (L.tick - 3) * part;
      tk.push(line(root, sx + u * L.len, sy - 1.5, sx + u * L.len, sy - 1.5 - hgt, { stroke: C.ink, 'stroke-width': tall ? 2.4 : 2.6, 'stroke-linecap': 'butt' }));
    }
    tk.forEach((el, k) => st.fade(el, a + 0.1 + (k / tk.length) * 0.18, a + 0.14 + (k / tk.length) * 0.18));
    // header and note above
    const ng = g(root);
    const hd = text(ng, sx, 0, p.label, { family: 'mono', size: L.head, weight: 500 });
    const nt = text(ng, sx, hd.lh + 3, fill(p.note, p.value, p.decimals), { italic: true, size: L.note, width: L.noteW });
    ng.setAttribute('transform', `translate(0 ${(sy - L.tick - 12 - nt.bottom).toFixed(1)})`);
    st.fade(ng, a + 0.24, a + 0.36);
  });

  // step 4: the agents arrive late
  const hg = g(root);
  line(hg, evX, L.evTop + 6, evX, L.emptyY - 4, { stroke: C.accent, 'stroke-width': 1 });
  line(hg, evX, L.emptyY + L.emptyH + 4, evX, L.axY, { stroke: C.accent, 'stroke-width': 1 });
  circle(hg, evX, L.axY, 2.6, { fill: C.accent });
  st.fade(hg, 4.06, 4.24);
  const ev = g(root);
  const el = text(ev, evX - 7, L.evTop + L.mono, B.event.label, { family: 'mono', size: L.mono, weight: 500, anchor: 'end' });
  text(ev, evX - 7, el.bottom + L.note + 1, B.event.note, { italic: true, size: L.note, anchor: 'end', width: L.evW });
  st.fade(ev, 4.2, 4.36);
  // what T-Mobile names besides the agents: one block under the headline
  const cg = g(root);
  text(cg, tall ? 14 : 16, L.causeY + (big ? 2 : 0), B.causes.block, { italic: true, size: L.note, width: tall ? 334 : 640 });
  st.fade(cg, 4.46, 4.66);
  const hd2 = g(root);
  text(hd2, tall ? 14 : 16, tall ? 13 : 17, d.headline.b, { family: 'sans', size: tall ? 12 : 13.5, weight: 600, width: tall ? 334 : 640, lh: 15 });
  st.fade(hd2, 3.3, 3.46);
  if (!noTag) {
    // plate A is gone; one line keeps what it showed
    const rm = g(root);
    text(rm, tall ? 14 : 16, tall ? 370 : 488, B.reminder.replace('{a}', fmt(d.plateA.slide.value)).replace('{b}', fmt(d.plateA.total.value)), { family: 'mono', size: L.mono, fill: C.muted });
    st.fade(rm, 3.4, 3.56);
  }
  const tagG = g(root);
  if (!noTag) text(tagG, L.tagX, L.tagY, d.tag, { family: 'mono', size: tall ? 11.5 : 12.5, fill: C.muted, anchor: 'end' });
  st.fade(tagG, 3.4, 3.56);
  return { root };
}

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const W = tall ? 360 : 800, H = tall ? 392 : 500;
  const svg = svgRoot(el, W, H, `${d.reading.a} ${d.reading.b}`);
  svg.style.color = C.ink;
  const st = stage();

  if (ctx.print) {
    // composite: plate A at the end of step 2 on the left, plate B at the
    // end of step 4 on the right, both in their narrow composition
    const s = 1.1;
    const a = g(svg, { transform: `translate(4 34) scale(${s})` });
    const b = g(svg, { transform: `translate(${W / 2 + 6} 34) scale(${s})` });
    line(svg, W / 2 + 1, 26, W / 2 + 1, H - 26, { stroke: C.hairline, 'stroke-width': 1 });
    plateA(a, C, d, true, st, true, true);
    plateB(b, C, d, true, st, true, true);
    return { set: () => st.set(steps - 1, 1) };
  }

  const A = plateA(svg, C, d, tall, st, false);
  // plate A leaves; plate B keeps one line of it
  st.on((gg) => {
    const p = 1 - ease(span(gg, 3.04, 3.3));
    A.root.style.display = p <= 0.001 ? 'none' : '';
    A.root.style.opacity = p >= 0.999 ? '' : p.toFixed(3);
  });
  plateB(svg, C, d, tall, st);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
