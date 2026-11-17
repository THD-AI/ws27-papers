// numbers: what the 40% and the 55% are.
// Plate A (steps 0 to 2): 100 contacts as a 10 by 10 grid.
// Plate B (steps 3 and 4): contacts per account in a year, the two published
// values as large numbers on one date axis, nothing drawn between them.
// Print: both plates side by side.
import {
  mountFigure, svgRoot, colors, g, line, circle, rect, text, cells, plate,
  leader, bracket, penRing, stage, fmt, span, ease, lerp, linear, textSize,
} from '../../../lib/fig.js';

export const steps = 5;
// where the scene reads as a sequence: the end of plate A and of plate B
export const stills = [2, 4];
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
  // they are there as soon as the scene pins: one quick fade, not a count,
  // so the first pinned frame is never an empty band under the title
  const baseG = g(grid);
  for (let i = 0; i < n; i++) { const [x, y] = at(i); circle(baseG, x, y, L.rBase, { fill: C.ink }); }
  st.fade(baseG, 0, 0.1);
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
  st.fill(discs, 1.04, 1.42).fill(cores, 1.04, 1.42);
  dashed.forEach((el, k) => {
    const a = 0.32 + (k / dashed.length) * 0.32;
    if (k < A.slide.value) st.fade(el, a, a + 0.1, [1.04 + (k / A.slide.value) * 0.32, 1.12 + (k / A.slide.value) * 0.32]);
    else st.fade(el, a, a + 0.1);
  });

  const hide = keep ? undefined : [3.0, 3.08];
  const nt = (grp, a, b) => st.fade(grp, a, b, hide);
  const o = { italic: true, size: L.note };

  const gH = g(root, { 'data-role': 'title' });
  const hA = text(gH, tall ? 14 : 16, tall ? 13 : 17, d.headline.a, { family: 'sans', size: tall ? 12 : 13.5, weight: 600, width: tall ? 334 : 640, lh: 15 });
  nt(gH, 0, 0.12);
  // the plate's own note, under the grid
  const gT = g(notes);
  text(gT, L.gx + 2, L.bottomY, fill(A.total.note, A.total.value), o);
  nt(gT, 0.16, 0.3);
  const gTag = g(root);
  text(gTag, L.tagX, tall ? hA.bottom + 13 : L.tagY, d.tag, { family: 'mono', size: tall ? 11.5 : 12.5, fill: C.muted, anchor: 'end' });
  nt(gTag, 0.2, 0.34);

  // release: a bracket beside the four rows
  const y0 = L.gy + 3, y1 = L.gy + rowsTop * L.p - 3;
  const gR = g(notes);
  const br = bracket(gR, L.relX, y0, L.relX, y1, 5, { stroke: C.ink, 'stroke-width': 1 });
  const relTxt = g(gR);
  const rel = text(relTxt, L.relNoteX, 0, fill(A.release.note, A.release.value), { ...o, width: L.relW });
  // the 40 and the 32 come from two documents: the drawing nests one in the
  // other, the note under the release says that nobody published the overlap
  const ovG = g(relTxt);
  const ovTxt = A.overlap.note.replace('{t}', fmt(A.total.value)).replace('{a}', fmt(A.release.value)).replace('{b}', fmt(A.slide.value));
  const ov = text(ovG, L.relNoteX, rel.bottom + L.note * 0.78 + (tall ? 6 : 8), ovTxt, { ...o, width: L.relW, fill: C.muted });
  // centred on the bracket; on the narrow plate the block is taller than the
  // four rows and starts at the bracket's top instead
  const dy = tall ? y0 - 1 - rel.y : (y0 + y1) / 2 - (rel.y + ov.bottom) / 2;
  relTxt.setAttribute('transform', `translate(0 ${dy.toFixed(1)})`);
  if (keep) st.draw(br, 0.66, 0.8); else st.draw(br, 0.66, 0.8, hide);
  st.fade(rel.el, 0.76, 0.9);
  nt(relTxt, 0, 0.001);
  nt(ovG, 1.76, 1.9);

  // the slide: a bracket over the 32, its note above
  const bx0 = L.gx + 3, bx1 = L.gx + (A.slide.value / rowsTop) * L.p - 3;
  const gS = g(notes);
  const sb = bracket(gS, bx1, L.top[0], bx0, L.top[0], tall ? 4.5 : 6, { stroke: C.ink });
  if (keep) st.draw(sb, 1.44, 1.6); else st.draw(sb, 1.44, 1.6, hide);
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
    pr.paths.forEach((p, k) => st.draw(p, 1.62 + k * 0.05, 1.78 + k * 0.04));
  }
  nt(gSn, 1.54, 1.68);
  // at step 1 the slide's note sits on the bracket; at step 2 it makes room
  const drop = L.top[1] - L.top[2];
  st.on((gg) => gSn.setAttribute('transform', `translate(0 ${(drop * (1 - ease(span(gg, 2.04, 2.34)))).toFixed(2)})`));

  // the eight that are only in the release
  const gN = g(notes);
  // on the narrow plate it sits under the release's notes, clear of them
  const restY = tall ? Math.max(L.restY, ov.bottom + dy + L.note + 12) : L.restY;
  const rest = text(gN, L.restX, restY, A.rest.note, { ...o, width: L.restW });
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
  nt(gN, 1.7, 1.84);

  // step 2: what the 32 are, and what is not known about them
  const gA = g(notes);
  text(gA, bx0, L.top[1], A.start.note, o);
  nt(gA, 2.3, 2.5);
  const gF = g(notes);
  bracket(gF, bx1, L.top[3], bx0, L.top[3], tall ? 4.5 : 6, { stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '3 3.5' });
  {
    const fo = { ...o, width: tall ? 250 : 330, fill: C.muted }, ftxt = fill(A.finished.note, A.slide.value);
    const fs = textSize(ftxt, fo);
    text(gF, bx0, L.top[4] - (fs.lines - 1) * fs.lh, ftxt, fo);
  }
  nt(gF, 2.56, 2.8);

  // Until the notes over the grid arrive (step 1) the grid stands right
  // under the headline, with its own note under it, so step 0 reads complete
  // and no empty band strands the headline; it moves down to make room just
  // before the bracket over the 32 is drawn. Wide: until the release's
  // bracket arrives the grid also stands in the middle of the frame, and it
  // moves to its place beside the notes as they arrive.
  if (!keep) {
    const lift = tall ? 118 : 100, y0b = tall ? 40 : 0;
    const dx0 = tall ? 0 : 400 - (L.gx + (L.p * cols) / 2);
    st.on((gg) => {
      const dx = dx0 * (1 - ease(span(gg, 0.52, 0.74)));
      const dy = y0b - lift * (1 - ease(span(gg, 1.26, 1.44)));
      body.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
    });
  }

  return { root, grid, box: { x: L.gx, y: L.gy, s: L.p * cols } };
}

// ---------------------------------------------------------------------------
// Plate B. One date axis, 2021 to 2026, with the two published points as
// large numbers over their dates; nothing is drawn between them (no line,
// no arrow), because the path between is not published. It assembles in
// order while plate A leaves (XA): the axis draws from the left, the first
// number arrives, the note on the gap, the second number. Step 4 marks the
// month the agents were announced and what T-Mobile names besides them.
// ---------------------------------------------------------------------------
// plate A leaves over XA (quickly, so the grid never lies on the axis);
// plate B's headline takes over the same place, its drawing follows
const XA = [3.0, 3.14];

function plateB(svg, C, d, tall, st, bare, big) {
  const B = d.plateB, W = tall ? 360 : 800;
  const S = tall
    ? { x0: 14, note: 12.5, mono: 12.5, small: 11.5, tick: 12.5, big: 38, r: 4.6 }
    : { x0: 16, note: 14, mono: 14, small: 12, tick: 14, big: 54, r: 5.5 };
  if (big) { S.note = 13.5; S.mono = 13; S.small = 12; }
  const root = g(svg);
  const ink = { stroke: C.ink, 'stroke-width': 1.25, 'stroke-linecap': 'round' };

  const hd = g(root);
  const h1 = text(hd, S.x0, tall ? 13 : 17, d.headline.b, { family: 'sans', size: tall ? 12 : 13.5, weight: 600, width: tall ? W - 2 * S.x0 : 620, lh: 15 });
  st.fade(hd, XA[0], XA[1]);
  // what T-Mobile names besides the agents (step 4): one block under the headline
  const cg = g(root);
  const cs = text(cg, S.x0, h1.bottom + S.note + 2, B.causes.block, { italic: true, size: S.note, width: W - 2 * S.x0 });
  st.fade(cg, 4.5, 4.7);

  // the axis: whole years, from the start of the first to the end of the last
  const A = B.axis;
  const t0 = A.from.year, t1 = A.to.year + 1;
  const tx0 = tall ? 22 : 60, tx1 = tall ? W - 22 : W - 60;
  const X = linear(t0, t1, tx0, tx1);
  const at = (p) => X(p.year + (p.quarter - 0.5) / 4);

  // each point's lettering over its date: when, the number, its unit, a note
  const nTop = cs.bottom + (tall ? 34 : 50) + S.big * 0.78;   // baseline of the big numbers
  const blocks = B.points.map((p, i) => ({
    p, x: at(p),
    anchor: tall ? (i === 0 ? 'start' : 'end') : 'middle',
    ax: tall ? (i === 0 ? S.x0 : W - S.x0) : at(p),
    width: tall ? 150 : 230,
  }));
  const pg = blocks.map(() => g(root));
  let low = 0;
  blocks.forEach((b, i) => {
    const { p } = b, o = { anchor: b.anchor };
    text(pg[i], b.ax, nTop - S.big * 0.78 - 8, p.when, { family: 'mono', size: S.small, fill: C.muted, ...o });
    const nm = text(pg[i], b.ax, nTop, fmt(p.value, p.decimals), { family: 'mono', size: S.big, weight: 600, ...o });
    const un = text(pg[i], b.ax, nm.bottom + S.mono + 4, B.unitWord, { family: 'mono', size: S.mono, ...o, width: b.width });
    const nt = text(pg[i], b.ax, un.bottom + S.note + 3, p.note.replace('{v}', fmt(p.value, p.decimals)), { italic: true, size: S.note, ...o, width: b.width });
    b.bottom = nt.bottom;
    b.num = nm;
    low = Math.max(low, nt.bottom);
  });
  // under the lettering, room for the note on the gap and, under it, the
  // bracket's note (step 4), so the two never meet
  const evX = X(B.event.year + (B.event.month - 0.5) / 12);
  const bx0 = blocks[0].x + S.r + 4;
  const bo = { italic: true, size: S.note, width: evX - bx0 };
  const bs = textSize(B.event.before, bo);
  const yrs = B.between.years;
  const gapTxt = B.between.note.replace('{a}', yrs[0]).replace('{b}', yrs[yrs.length - 1]);
  const go = { italic: true, size: S.note, fill: C.muted, anchor: 'middle', width: tall ? 150 : 300 };
  const gs = textSize(gapTxt, go);
  const ay = low + 14 + gs.h + 12 + bs.h + 21;

  // the axis draws from the left
  const axl = line(root, tx0, ay, tx1, ay, ink);
  st.draw(axl, 3.12, 3.38);
  const yl = g(root);
  for (let yr = t0; yr < t1; yr++) {
    line(yl, X(yr), ay, X(yr), ay + 5, ink);
    text(yl, X(yr + 0.5), ay + 7 + S.tick, String(yr), { family: 'mono', size: S.tick, anchor: 'middle', fill: C.ink });
  }
  line(yl, X(t1), ay, X(t1), ay + 5, ink);
  st.fade(yl, 3.22, 3.38);

  // the two points: a dot on the axis and a thin leader up to its number
  blocks.forEach((b, i) => {
    // the first number, then the gap, then the second
    const a = i === 0 ? 3.36 : 3.62;
    circle(pg[i], b.x, ay, S.r, { fill: C.ink });
    leader(pg[i], b.x, b.bottom + 8, b.x, ay - S.r - 3, { stroke: C.muted, dot: false });
    st.fade(pg[i], a, a + 0.14);
  });

  // the gap: nothing drawn, said in words
  const gg0 = g(root);
  const gapX = (blocks[0].x + blocks[1].x) / 2;
  text(gg0, gapX, low + 14 + S.note * 0.78, gapTxt, go);
  st.fade(gg0, 3.5, 3.64);

  // the fall as T-Mobile reports it, beside the second number: a label, not a path
  const fgp = g(root);
  const fs = tall ? 15 : 18, n2 = blocks[1].num, fx = n2.x - (tall ? 12 : 18);
  text(fgp, fx, n2.y + S.big * 0.5, B.fall.show.replace('{v}', fmt(B.fall.value)), { family: 'mono', size: fs, weight: 600, anchor: 'end' });
  text(fgp, fx, n2.y + S.big * 0.5 + S.small + 4, B.fall.against, { italic: true, size: S.small, anchor: 'end', fill: C.muted });
  st.fade(fgp, 3.74, 3.88);

  // step 4: the month the agents were announced
  const eg = g(root);
  line(eg, evX, ay - 12, evX, ay + 4, { stroke: C.accent, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
  const eo = { italic: true, size: S.note, fill: C.accent, weight: 600 };
  const ew = textSize(B.event.note, eo).w;
  text(eg, Math.min(tx1, Math.max(evX + ew / 2, tx0 + ew)), ay + 7 + S.tick + S.note + 8, B.event.note, { ...eo, anchor: 'end' });
  st.fade(eg, 4.04, 4.22);
  const bg2 = g(root);
  bracket(bg2, bx0, ay - 13, evX - 4, ay - 13, -5, { stroke: C.ink, 'stroke-width': 1 });
  text(bg2, bx0, ay - 21 - (bs.lines - 1) * bs.lh, B.event.before, bo);
  st.fade(bg2, 4.26, 4.46);

  if (!bare) {
    const tg = g(root);
    text(tg, W - S.x0, tall ? ay + 7 + S.tick + S.note * 2 + 30 : 17, d.tag, { family: 'mono', size: S.small, fill: C.muted, anchor: 'end' });
    st.fade(tg, XA[0], XA[1]);
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
  // plate A leaves while plate B arrives over the same window (XA), so the
  // two opacities add up to one and no scroll position shows an empty frame
  st.on((gg) => {
    const p = 1 - ease(span(gg, XA[0], XA[1]));
    A.root.style.display = p <= 0.001 ? 'none' : '';
    A.root.style.opacity = p >= 0.999 ? '' : p.toFixed(3);
  });
  plateB(svg, C, d, tall, st);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
