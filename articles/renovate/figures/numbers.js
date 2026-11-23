// numbers: a scoped start rate, then the two published contacts-per-account values.
import {
  mountFigure, svgRoot, colors, g, line, circle, text,
  leader, bracket, stage, fmt, span, ease, linear, textSize,
} from '../../../lib/fig.js';

export const steps = 5;
// where the scene reads as a sequence: the end of plate A and of plate B
export const stills = [2, 4];
// Plate A: the release stands on its own, then the contract-customer grid and
// what its start rate cannot tell us. Plate B retains its existing date axis.
export const durations = { large: [2.4, 1.4, 1.6, 2.4, 2.0] };
// t at which `sec` seconds of step `k` have passed (the engine's soft ease,
// article.js); returns g = k + t
const soft = (x) => x * (1.4 - 0.4 * x);
const G = (k, sec) => k + soft(Math.min(1, Math.max(0, sec / durations.large[k])));
export const aspect = { wide: 800 / 500, tall: 360 / 440 };

// Plate A uses the same local coordinates on screen and in the print composite.
function plateA(svg, C, d, tall, st, keep) {
  const A = d.plateA, root = g(svg);
  const left = tall ? 14 : 20, right = tall ? 346 : 780;
  const gridX = tall ? 20 : 441, gridY = tall ? 224 : 184;
  const pitch = tall ? 13.5 : 21;
  const note = { size: tall ? 13 : 16, family: 'sans', fill: C.ink };
  const muted = { ...note, fill: C.muted };
  const label = { ...note, weight: 600 };
  const headline = g(root);
  text(headline, left, 24, d.headline.a, { ...label, width: tall ? 332 : 610 });
  text(headline, right, tall ? 48 : 24, d.tag, { family: 'mono', size: tall ? 11.5 : 12.5, fill: C.muted, anchor: 'end' });
  st.fade(headline, 0, 0.14, keep ? undefined : TA);

  const release = g(root, { 'data-claim': 'release' });
  const releaseY = tall ? 76 : 109;
  text(release, left, releaseY, 'Deutsche Telekom press release', { ...label, width: tall ? 320 : 365 });
  st.fade(release, 0.1, 0.27);
  const claim = g(release);
  const number = text(claim, left, releaseY + (tall ? 57 : 74), fmt(A.release.value) + '%', { family: 'mono', size: tall ? 42 : 64, weight: 600, fill: C.ink });
  const description = text(claim, left, number.bottom + (tall ? 16 : 23), A.release.note, { ...note, width: tall ? 320 : 335 });
  st.fade(claim, 0.29, 0.63);
  const scope = text(release, left, description.bottom + (tall ? 15 : 23), A.release.scope, { ...muted, width: tall ? 320 : 335 });
  st.fade(scope.el, 0.66, 0.9);

  const group = g(root, { 'data-claim': 'contract-customer-starts' });
  line(group, tall ? left : 405, tall ? 192 : 88, tall ? right : 405, tall ? 192 : 426, { stroke: C.hairline, 'stroke-width': 1 });
  text(group, tall ? left : gridX, tall ? 213 : 109, 'T-Mobile investor slide', label);
  text(group, gridX, gridY + pitch * 10 + (tall ? 22 : 26), A.total.note, { ...muted, width: tall ? 324 : 329 });
  const cols = 10, fills = [];
  for (let i = 0; i < A.total.value; i += 1) {
    const x = gridX + (i % cols + 0.5) * pitch;
    const y = gridY + (Math.floor(i / cols) + 0.5) * pitch;
    circle(group, x, y, tall ? 2 : 2.7, { fill: C.ink });
    if (i < A.slide.value) fills.push(circle(group, x, y, tall ? 4.6 : 7, {
      fill: C.field, stroke: C.accent, 'stroke-width': tall ? 1.2 : 1.6,
    }));
  }
  st.fade(group, G(1, 0.02), G(1, 0.33));
  st.fill(fills, G(1, 0.24), G(1, 1.08));

  const result = g(group);
  const nx = tall ? 177 : gridX;
  const ny = tall ? 269 : 164;
  const n = text(result, nx, ny, fmt(A.slide.value) + '%', { family: 'mono', size: tall ? 32 : 35, weight: 600, fill: C.accent });
  text(result, tall ? nx : n.right + 15, tall ? n.bottom + 17 : ny, A.slide.note, { ...label, width: tall ? 162 : 240 });
  st.fade(result, G(1, 0.74), G(1, 1.35));

  const finished = text(group, tall ? left : gridX, tall ? 411 : 455, A.finished.note, { ...label, width: tall ? 330 : 330 });
  st.fade(finished.el, G(2, 0.12), G(2, 1.5));
  return root;
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
const XA = [3, G(3, 0.4)];
// plate B's title comes only once plate A's has gone
const TA = [3, G(3, 0.2)];
const XB = [G(3, 0.22), G(3, 0.42)];

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
  st.fade(hd, XB[0], XB[1]);
  // what T-Mobile names besides the agents (step 4): one block under the headline
  const cg = g(root);
  const cs = text(cg, S.x0, h1.bottom + S.note + 2, B.causes.block, { italic: true, size: S.note, width: W - 2 * S.x0 });
  st.fade(cg, 4.62, 4.9);

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
  st.draw(axl, G(3, 1.6), G(3, 2.2));
  const yl = g(root);
  for (let yr = t0; yr < t1; yr++) {
    line(yl, X(yr), ay, X(yr), ay + 5, ink);
    text(yl, X(yr + 0.5), ay + 7 + S.tick, String(yr), { family: 'mono', size: S.tick, anchor: 'middle', fill: C.ink });
  }
  line(yl, X(t1), ay, X(t1), ay + 5, ink);
  st.fade(yl, G(3, 1.8), G(3, 2.3));

  // the two points: a dot on the axis and a thin leader up to its number
  blocks.forEach((b, i) => {
    // the first number, then the gap, then the second
    const [a, b2] = i === 0 ? [G(3, 0.42), G(3, 1.0)] : [G(3, 1.0), G(3, 1.6)];
    circle(pg[i], b.x, ay, S.r, { fill: C.ink });
    leader(pg[i], b.x, b.bottom + 8, b.x, ay - S.r - 3, { stroke: C.muted, dot: false });
    st.fade(pg[i], a, b2);
  });

  // the gap: nothing drawn, said in words
  const gg0 = g(root);
  const gapX = (blocks[0].x + blocks[1].x) / 2;
  text(gg0, gapX, low + 14 + S.note * 0.78, gapTxt, go);
  st.fade(gg0, G(3, 1.95), G(3, 2.36));

  // the fall as T-Mobile reports it, beside the second number: a label, not a path
  const fgp = g(root);
  const fs = tall ? 15 : 18, n2 = blocks[1].num, fx = n2.x - (tall ? 12 : 18);
  text(fgp, fx, n2.y + S.big * 0.5, B.fall.show.replace('{v}', fmt(B.fall.value)), { family: 'mono', size: fs, weight: 600, anchor: 'end' });
  text(fgp, fx, n2.y + S.big * 0.5 + S.small + 4, B.fall.against, { italic: true, size: S.small, anchor: 'end', fill: C.muted });
  st.fade(fgp, G(3, 1.6), G(3, 2.0));

  // step 4: the month the agents were announced
  const eg = g(root), egl = g(eg);
  line(egl, evX, ay - 12, evX, ay + 4, { stroke: C.accent, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
  const eo = { italic: true, size: S.note, fill: C.accent, weight: 600 };
  const ew = textSize(B.event.note, eo).w;
  const egt = text(eg, Math.min(tx1, Math.max(evX + ew / 2, tx0 + ew)), ay + 7 + S.tick + S.note + 8, B.event.note, { ...eo, anchor: 'end' });
  // the mark, its words, the bracket, its words, then the other causes
  st.fade(egl, 4.02, 4.2).fade(egt.el, 4.14, 4.36);
  const bg2 = g(root);
  const br2 = bracket(bg2, bx0, ay - 13, evX - 4, ay - 13, -5, { stroke: C.ink, 'stroke-width': 1 });
  const bt2 = text(bg2, bx0, ay - 21 - (bs.lines - 1) * bs.lh, B.event.before, bo);
  st.fade(br2, 4.3, 4.5).fade(bt2.el, 4.44, 4.66);

  if (!bare) {
    const tg = g(root);
    text(tg, W - S.x0, tall ? ay + 7 + S.tick + S.note * 2 + 30 : 17, d.tag, { family: 'mono', size: S.small, fill: C.muted, anchor: 'end' });
    st.fade(tg, XB[0], XB[1]);
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
    A.style.display = p <= 0.001 ? 'none' : '';
    A.style.opacity = p >= 0.999 ? '' : p.toFixed(3);
  });
  plateB(svg, C, d, tall, st);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
