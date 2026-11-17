// numbers: what the 40% and the 55% are.
// Plate A (steps 0 to 2): 100 contacts as a 10 by 10 grid.
// Plate B (steps 3 and 4): contacts per account in a year, at the two dates
// that are public. Print: both plates side by side.
import {
  mountFigure, svgRoot, colors, g, line, circle, rect, text, cells, plate,
  leader, bracket, penRing, stage, fmt, span, ease, lerp, linear, textSize,
} from '../../../lib/fig.js';

export const steps = 5;
export const aspect = { wide: 800 / 500, tall: 360 / 440 };

const fill = (tpl, v, dec = 0) => tpl.replace('{v}', fmt(v, dec));

// ---------------------------------------------------------------------------
// Plate A. Coordinates are those of its own box: 800 x 500 or 360 x 392.
// `keep`: the plate stays as it is at the end of step 2 (print).
// ---------------------------------------------------------------------------
function plateA(svg, C, d, tall, st, keep, big) {
  const A = d.plateA;
  const L = tall
    ? { p: 20.5, gx: 14, gy: 152, rBase: 2, rUnit: 6.7, note: 12.5, top: [141, 130, 112, 83, 72], bottomY: 378, relX: 229, relNoteX: 241, relW: 108, restX: 256, restY: 116, restW: 96, tagX: 346, tagY: 44 }
    : { p: 32, gx: 150, gy: 162, rBase: 2.8, rUnit: 10.2, note: 14, top: [148, 136, 113, 83, 71], bottomY: 495, relX: 484, relNoteX: 500, relW: 230, restX: 492, restY: 110, restW: 240, tagX: 786, tagY: 17 };
  if (big) L.note = 13.5;
  if (tall) { L.restX = 244; L.restY = 292; L.restW = 108; }
  const root = g(svg), body = g(root, tall ? { transform: 'translate(0 40)' } : null), grid = g(body), notes = g(body);
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

  const gH = g(root);
  const hA = text(gH, tall ? 14 : 16, tall ? 13 : 17, d.headline.a, { family: 'sans', size: tall ? 12 : 13.5, weight: 600, width: tall ? 334 : 640, lh: 15 });
  nt(gH, 0, 0.1);
  // the plate's own note, under the grid
  const gT = g(notes);
  text(gT, L.gx + 2, L.bottomY, fill(A.total.note, A.total.value), o);
  nt(gT, 0.36, 0.5);
  const gTag = g(root);
  text(gTag, L.tagX, tall ? hA.bottom + 13 : L.tagY, d.tag, { family: 'mono', size: tall ? 11.5 : 12.5, fill: C.muted, anchor: 'end' });
  nt(gTag, 0.36, 0.5);

  // release: a bracket beside the four rows
  const y0 = L.gy + 3, y1 = L.gy + rowsTop * L.p - 3;
  const gR = g(notes);
  const br = bracket(gR, L.relX, y0, L.relX, y1, 5, { stroke: C.ink, 'stroke-width': 1 });
  const relTxt = g(gR);
  const rel = text(relTxt, L.relNoteX, 0, fill(A.release.note, A.release.value), { ...o, width: L.relW });
  // the 40 and the 32 come from two documents: the drawing nests one in the
  // other, the note under the release says that nobody published the overlap
  const ovG = g(relTxt);
  const ovTxt = A.overlap.note.replace('{a}', fmt(A.release.value)).replace('{b}', fmt(A.slide.value));
  const ov = text(ovG, L.relNoteX, rel.bottom + L.note * 0.78 + (tall ? 6 : 8), ovTxt, { ...o, width: L.relW, fill: C.muted });
  // centred on the bracket; on the narrow plate the block is taller than the
  // four rows and starts at the bracket's top instead
  const dy = tall ? y0 - 1 - rel.y : (y0 + y1) / 2 - (rel.y + ov.bottom) / 2;
  relTxt.setAttribute('transform', `translate(0 ${dy.toFixed(1)})`);
  if (keep) st.draw(br, 0.74, 0.88); else st.draw(br, 0.74, 0.88, hide);
  st.fade(rel.el, 0.84, 0.96);
  nt(relTxt, 0, 0.001);
  nt(ovG, 1.8, 1.94);

  // the slide: a bracket over the 32, its note above
  const bx0 = L.gx + 3, bx1 = L.gx + (A.slide.value / rowsTop) * L.p - 3;
  const gS = g(notes);
  const sb = bracket(gS, bx1, L.top[0], bx0, L.top[0], tall ? 4.5 : 6, { stroke: C.ink });
  if (keep) st.draw(sb, 1.46, 1.66); else st.draw(sb, 1.46, 1.66, hide);
  const gSn = g(notes);
  // the note, then the number on its own with clear space, ringed
  const [pre, post] = A.slide.note.split('[[{v}]]');
  const t1 = text(gSn, bx0, L.top[2], pre.trim(), o);
  // the number that matters, larger than the notes so it is found first
  const numSize = tall ? 16.5 : 18;
  const num = text(gSn, t1.right + (tall ? 12 : 14), L.top[2], fmt(A.slide.value), { family: 'mono', size: numSize, weight: 600 });
  text(gSn, num.right + (tall ? 12 : 14), L.top[2], post.trim(), o);
  {
    const pr = penRing(gSn, num.cx, num.cy - 0.5, num.w / 2 + (tall ? 6 : 7), numSize * 0.5 + (tall ? 3.6 : 4), { seed: 31, stroke: C.accent, width: tall ? 1.7 : 1.8 });
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
    // a short bracket over the two columns of the eight, beside the one
    // over the 32, so that the top edge reads as 32 | the rest
    const ex0 = L.gx + (A.slide.value / rowsTop) * L.p + 3, ex1 = L.gx + cols * L.p - 3;
    bracket(gN, ex1, L.top[0], ex0, L.top[0], 6, { stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '3 3' });
    leader(gN, rest.x + 10, rest.bottom + 3, (ex0 + ex1) / 2, L.top[0] - 2.5, { stroke: C.muted });
  }
  nt(gN, 1.8, 1.94);

  // step 2: what the 32 are, and what is not known about them
  const gA = g(notes);
  text(gA, bx0, L.top[1], A.start.note, o);
  nt(gA, 2.24, 2.42);
  const gF = g(notes);
  bracket(gF, bx1, L.top[3], bx0, L.top[3], tall ? 4.5 : 6, { stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '3 3.5' });
  {
    const fo = { ...o, width: tall ? 250 : 330, fill: C.muted }, ftxt = fill(A.finished.note, A.slide.value);
    const fs = textSize(ftxt, fo);
    text(gF, bx0, L.top[4] - (fs.lines - 1) * fs.lh, ftxt, fo);
  }
  nt(gF, 2.52, 2.74);

  return { root, grid, box: { x: L.gx, y: L.gy, s: L.p * cols } };
}

// ---------------------------------------------------------------------------
// Plate B. Everything arrives from g = 3.3 on.
// ---------------------------------------------------------------------------
function plateB(svg, C, d, tall, st, bare, big) {
  // Two rulers of the same length, one above the other. A ruler is one year
  // for one customer account, divided into its twelve months; a dot is one
  // contact, evenly spaced from the yearly value. Under them a slim time
  // line with the two measured points and the month the agents were
  // announced. Everything arrives from g = 3.3 on; the time line in step 4.
  const B = d.plateB, W = tall ? 360 : 800, H = tall ? 440 : 500;
  const S = tall ? { x0: 14, note: 12.5, mono: 12.5, small: 11.5, lab: 13.5, r: 4.2 } : { x0: 16, note: 14, mono: 14, small: 12, lab: 15, r: 5 };
  if (big) { S.note = 13.5; S.mono = 13; S.small = 12; }
  const root = g(svg);
  const ink = { stroke: C.ink, 'stroke-width': 1.25, 'stroke-linecap': 'round' };

  const hd = g(root);
  const h1 = text(hd, S.x0, tall ? 13 : 17, d.headline.b, { family: 'sans', size: tall ? 12 : 13.5, weight: 600, width: tall ? W - 2 * S.x0 : 620, lh: 15 });
  st.fade(hd, 3.3, 3.44);
  // what T-Mobile names besides the agents: one block under the headline
  const cg = g(root);
  const cs = text(cg, S.x0, h1.bottom + S.note + 2, B.causes.block, { italic: true, size: S.note, width: W - 2 * S.x0 });
  st.fade(cg, 4.5, 4.7);

  const rx0 = tall ? S.x0 + 4 : 96, rx1 = tall ? W - S.x0 - 4 : 540, len = rx1 - rx0;
  let y = cs.bottom + (tall ? 20 : 58);
  const rulerY = [];
  B.points.forEach((p, i) => {
    const a = 3.4 + i * 0.2;
    const tg = g(root), rg = g(root);
    const count = p.count.replace('{v}', fmt(p.value, p.decimals)), note = p.note.replace('{v}', fmt(p.value, p.decimals));
    let ry;
    if (tall) {
      const l1 = text(tg, S.x0, y, p.label, { family: 'mono', size: S.lab, weight: 500 });
      text(tg, l1.right + 14, y, count, { family: 'mono', size: S.mono, weight: 500 });
      const n1 = text(tg, S.x0, l1.bottom + S.note, note, { italic: true, size: S.note, width: W - 2 * S.x0 });
      ry = n1.bottom + 15;
    } else {
      ry = y + 6;
      text(tg, S.x0, ry + 5, p.label, { family: 'mono', size: S.lab, weight: 500 });
      const c1 = text(tg, rx1 + 24, ry - 6, count, { family: 'mono', size: S.mono, weight: 500 });
      text(tg, rx1 + 24, c1.bottom + S.note + 1, note, { italic: true, size: S.note, width: W - rx1 - 40 });
    }
    rulerY.push(ry);
    // the ruler: one year, twelve months
    line(rg, rx0, ry, rx1, ry, ink);
    const n = B.strip.months;
    for (let k = 0; k <= n; k++) {
      const x = rx0 + (k / n) * len;
      line(rg, x, ry, x, ry + (k === 0 || k === n ? 8 : 5), ink);
      if (k < n) text(rg, x + len / n / 2, ry + 8 + S.small, B.strip.letters[k], { family: 'mono', size: S.small, fill: C.muted, anchor: 'middle' });
    }
    st.fade(rg, a, a + 0.12);
    // contacts: whole dots, and a visibly smaller one for the part
    const full = Math.floor(p.value + 1e-9), part = p.value - full;
    const ds = [];
    for (let k = 0; k < full + (part > 1e-6 ? 1 : 0); k++) {
      const u = k < full ? (k + 0.5) / p.value : (full + part / 2) / p.value;
      const c = circle(root, rx0 + u * len, ry, k < full ? S.r : S.r * 0.45, { fill: C.ink });
      c.dataset.r = k < full ? S.r : S.r * 0.45;
      ds.push(c);
    }
    st.fill(ds, a + 0.1, a + 0.3);
    st.fade(tg, a + 0.04, a + 0.18);
    y = ry + 8 + S.small + (tall ? 26 : 44);
    if (i === 0) {
      const bg = g(root);
      const yrs = B.between.years;
      const bt = text(bg, tall ? S.x0 : rx0, y - (tall ? 6 : 8), B.between.note.replace('{a}', yrs[0]).replace('{b}', yrs[yrs.length - 1]), { italic: true, size: S.note, fill: C.muted });
      st.fade(bg, 3.8, 3.94);
      y = bt.bottom + (tall ? 22 : 40);
    }
  });

  // the fall from the first ruler to the second, as T-Mobile names it: an
  // arrow down in the December column, from the first ruler to the second
  {
    const fg = g(root);
    const ax = rx1 - len / (B.strip.months * 2);
    const ya = rulerY[0] + 8 + S.small + 8, yb = rulerY[1] - 11;
    const aw = { stroke: C.ink, 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' };
    line(fg, ax, ya, ax, yb, aw);
    line(fg, ax - 4, yb - 6, ax, yb, aw);
    line(fg, ax + 4, yb - 6, ax, yb, aw);
    const fs = tall ? 15 : 17;
    text(fg, ax - 9, (ya + yb) / 2 + fs * 0.36, B.fall.show.replace('{v}', fmt(B.fall.value)), { family: 'mono', size: fs, weight: 600, anchor: 'end' });
    st.fade(fg, 3.82, 3.96);
  }

  // step 4: the time line
  const tl = g(root);
  const t0 = B.points[0].year + 0.55, t1 = B.points[1].year + 0.75;
  const tx0 = rx0, tx1 = tall ? rx1 : 700;
  const X = linear(t0, t1, tx0, tx1);
  const ay = y + (tall ? 30 : 46);
  const axl = line(tl, tx0, ay, tx1, ay, ink);
  st.draw(axl, 4.05, 4.28);
  const yl = g(root);
  for (let yr = Math.ceil(t0); yr <= Math.floor(t1); yr++) {
    line(yl, X(yr), ay, X(yr), ay + 5, ink);
    text(yl, X(yr), ay + 6 + S.small, String(yr), { family: 'mono', size: S.small, anchor: 'middle', fill: C.muted });
  }
  B.points.forEach((p) => circle(yl, X(p.year + (p.quarter - 0.5) / 4), ay, tall ? 3.6 : 4.2, { fill: C.ink }));
  st.fade(yl, 4.2, 4.34);
  const evX = X(B.event.year + (B.event.month - 0.5) / 12);
  const eg = g(root);
  line(eg, evX, ay - 10, evX, ay + 10, { stroke: C.accent, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
  const eo = { italic: true, size: S.note, fill: C.accent, weight: 600 };
  text(eg, Math.min(tx1, Math.max(evX + 2, tx0 + textSize(B.event.note, eo).w + 2)), ay + 6 + S.small + S.note + 6, B.event.note, { ...eo, anchor: 'end' });
  st.fade(eg, 4.34, 4.5);
  const bg2 = g(root);
  const bx0 = X(B.points[0].year + 1);
  bracket(bg2, bx0, ay - 13, evX - 3, ay - 13, -5, { stroke: C.ink, 'stroke-width': 1 });
  text(bg2, bx0, ay - 21, B.event.before, { italic: true, size: S.note });
  st.fade(bg2, 4.56, 4.76);

  if (!bare) {
    // plate A is gone; one line keeps what it showed
    // at step 3 it stands where the time line will be, and gives way to it
    const rm = g(root);
    text(rm, tall ? S.x0 : rx0, ay + 4, B.reminder.replace('{a}', fmt(d.plateA.slide.value)).replace('{b}', fmt(d.plateA.total.value)), { family: 'mono', size: S.small, fill: C.muted });
    st.fade(rm, 3.4, 3.56, [4.0, 4.1]);
    const tg = g(root);
    text(tg, W - S.x0, tall ? H - 7 : 17, d.tag, { family: 'mono', size: S.small, fill: C.muted, anchor: 'end' });
    st.fade(tg, 3.4, 3.56);
  }
  return { root };
}

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const W = tall ? 360 : 800, H = tall ? 440 : 500;
  const svg = svgRoot(el, W, H, `${d.reading.a} ${d.reading.b}`);
  svg.style.color = C.ink;
  const st = stage();

  if (ctx.print) {
    // composite: plate A at the end of step 2 on the left, plate B at the
    // end of step 4 on the right, both in their narrow composition
    const s = 1.1;
    const a = g(svg, { transform: `translate(4 14) scale(${s})` });
    const b = g(svg, { transform: `translate(${W / 2 + 6} 14) scale(${s})` });
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
