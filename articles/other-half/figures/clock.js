// clock: accurate, or in time. One time line in millionths of a second.
// View A, the start of a run: the chip finishes a round of checks every
// 1.1 µs (one tick, one question); the 2024 network needs 24 µs for each
// answer, so the rounds that wait pile up. View B, the end of a run: the
// live matching decoder has kept up and answers 63 µs after the last round;
// the network is still busy; a preprint's claim is drawn dashed.
// The 24 (time per round) and the 63 (delay after the last round) are
// different kinds of number and are never drawn as two lengths of one kind.
// Every value is from data/clock.json.
import {
  mountFigure, svgRoot, g, line, rect, circle, path, text, bracket, leader, penRing, stage, fmt,
} from '../../../lib/fig.js';
import { pal, dotPlate } from './shared.js';

export const steps = 5;
const SIZE = { wide: [720, 472], tall: [360, 520] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

function build(el, ctx) {
  const C = pal(ctx), d = ctx.data, tall = ctx.layout === 'tall', print = !!ctx.print;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const T = d.round.value;
  const net = d.decoders.find((x) => x.id === 'network-2024');
  const live = d.decoders.find((x) => x.id === 'live-matching-2024');
  const claim = d.decoders.find((x) => x.id === 'network-2025-claim');
  const acc = d.accuracy_on_the_same_recording;
  const meanwhile = Math.round(d.derived[0].value);
  const perSecond = d.rounds_per_second.say.split(', ')[0];
  const us = (v) => `${v} µs`;
  // rounds that wait when the network finishes its k-th answer
  const endOf = (k) => T + k * net.value;
  const waiting = (k) => Math.floor(endOf(k) / T + 1e-9) - (k + 1);

  const svg = svgRoot(el, W, H,
    `One time line in millionths of a second. The chip finishes a round of checks every ${T}, ${perSecond} a second. `
    + `The neural network of 2024 needs ${net.value} for each round, so the rounds that wait pile up: ${[1, 2, 3].map(waiting).join(', then ')} after its first three answers, without end. `
    + `The matching decoder that ran live keeps pace: its answer arrives about ${live.value} (plus or minus ${live.plus_minus}) after the last round, however long the run. `
    + `On the same recording the network, afterwards, left ${acc.network_afterwards.per_100000_rounds} errors in 100,000 rounds and live matching ${acc.live_matching.per_100000_rounds}: accurate, or in time. `
    + `A preprint of December 2025 claims a network under ${claim.below} per round; it is drawn as a claim.`);
  svg.style.color = C.ink;
  const st = stage();
  const sans = { family: 'sans', size: 13, weight: 600 };
  const mono = { family: 'mono', size: 11.5, fill: C.muted };

  // ------------------------------------------------------------------ view A
  function viewA(B, o) {
    const root = g(svg), narrow = o.narrow, noteO = { italic: true, size: narrow ? 13 : 14 };
    const x = (t) => B.x + (t / o.maxT) * B.w;
    const nT = Math.floor(o.maxT / T - 0.3);
    // lane 1: the chip
    const h1 = g(root);
    const t1 = text(h1, B.x, 20, 'the chip asks: which checks fired?', sans);
    const n1g = g(root);
    const n1 = narrow
      ? text(n1g, B.x, 39, `one round of checks every [[${us(T)}]], ${perSecond} a second`, { ...noteO, width: B.w, lh: 16 })
      : text(n1g, B.x + B.w, 20, `one round of checks every [[${us(T)}]], ${perSecond} a second`, { ...noteO, anchor: 'end' });
    const L1 = (narrow ? n1.bottom : t1.bottom) + (narrow ? 58 : 84);
    const base = g(root);
    line(base, B.x, L1, B.x + B.w, L1, { stroke: C.ink, 'stroke-width': 1 });
    const ticks = [];
    for (let k = 1; k <= nT; k++) {
      const tg = g(root);
      line(tg, x(k * T), L1 - 8, x(k * T), L1, { stroke: C.ink, 'stroke-width': 1.1 });
      circle(tg, x(k * T), L1 - 14, narrow ? 2.1 : 2.3, { fill: C.ink });
      ticks.push(tg);
    }
    st.fade(h1, 0, 0.15).fade(base, 0, 0.15).fill(ticks, 0.1, 0.72).fade(n1g, 0.6, 0.8);
    // step 0: what one gap is
    const gp = g(root), ka = narrow ? 3 : 5;
    bracket(gp, x(ka * T), L1 + 7, x((ka + 1) * T), L1 + 7, 4, { stroke: C.ink, 'stroke-width': 1 });
    const gn = text(gp, x((ka + 1.5) * T) + 16, L1 + 38, `[[${T}]] millionths of a second`, { ...noteO, size: narrow ? 14 : 16 });
    leader(gp, gn.x - 5, gn.y + 6, x((ka + 0.5) * T), L1 + 10, { stroke: C.muted, dot: false });
    st.fade(gp, 0.78, 0.96, [1, 1.14]);

    // lane 2: the network of 2024
    const by = L1 + (narrow ? 66 : 96), bh = 26;
    const y2 = by + bh + 19;
    const h2 = g(root);
    const t2 = text(h2, B.x, y2, net.label, sans);
    const n2 = narrow
      ? text(h2, B.x, y2 + 18, `needs [[${us(net.value)}]] for one round`, noteO)
      : text(h2, t2.right + 14, y2, `needs [[${us(net.value)}]] for one round`, noteO);
    const q2 = narrow ? text(h2, B.x, n2.bottom + 13, 'quoted in the 2024 paper', mono) : text(h2, n2.right + 14, n2.y + n2.h - 3.5, 'quoted in the 2024 paper', mono);
    st.fade(h2, 1.08, 1.3);
    const py = (narrow ? q2.bottom - 30 : n2.bottom) + 16;
    const right = B.x + B.w;
    const blocks = [1, 2, 3].map((k) => {
      const a = x(endOf(k - 1)), b = x(endOf(k));
      if (a > right - 8) return null;
      const grp = g(root), open = b > right;
      const xe = open ? right - 18 : b;
      rect(grp, a, by, xe - a, bh, { fill: C.field, 'data-audit': 'skip' });
      if (open) for (const yy of [by, by + bh]) line(grp, xe, yy, right - 2, yy, { stroke: C.ink, 'stroke-width': 1.25, 'stroke-dasharray': '2 3' });
      path(grp, open ? `M${xe} ${by}L${a} ${by}L${a} ${by + bh}L${xe} ${by + bh}` : `M${a} ${by}L${b} ${by}L${b} ${by + bh}L${a} ${by + bh}Z`, { stroke: C.ink, 'stroke-width': 1.25, 'stroke-linejoin': 'round', 'data-audit': 'skip' });
      if (xe - a > 108) text(grp, a + 9, by + 17.5, `answer to round ${k}`, { family: 'sans', size: 12 });
      else if (xe - a > 52) text(grp, a + 7, by + 17.5, `round ${k}`, { family: 'sans', size: 12 });
      // which round it answers
      const lg = g(root, { class: 'fig-leader' });
      line(lg, a + 4, by - 3, x(k * T), L1 + 4, { stroke: C.ink, 'stroke-width': 0.8, 'stroke-opacity': 0.7 });
      circle(lg, x(k * T), L1 + 4, 1.5, { fill: C.ink });
      const t0 = k === 1 ? 1.2 : 2.02 + (k - 2) * 0.2;
      st.fade(grp, t0, t0 + 0.25).fade(lg, t0 + 0.2, t0 + 0.4);
      return { a, b, xe, open };
    });
    // step 1: the rounds that pass during the first answer
    const bk = g(root);
    bracket(bk, x(endOf(0)), L1 - 24, Math.min(right, x(endOf(1))), L1 - 24, -5, { stroke: C.ink, 'stroke-width': 1 });
    text(bk, (x(endOf(0)) + Math.min(right, x(endOf(1)))) / 2, L1 - 34, `about ${meanwhile} rounds meanwhile`, { family: 'mono', size: 12, weight: 500, anchor: 'middle' });
    st.fade(bk, 1.55, 1.8);
    // step 2: the rounds that wait, one dot each
    const pg = g(root), p = 5.2, cols = 7;
    let ringAt = null, pileBottom = py;
    [1, 2, 3].forEach((k) => {
      const b = blocks[k - 1];
      if (!b || b.open) return;
      const n = waiting(k), els = [];
      const grp = g(pg);
      for (let i = 0; i < n; i++) els.push(circle(grp, b.b - 3 - (i % cols) * p, py + Math.floor(i / cols) * p, 1.9, { fill: C.ink }));
      els.forEach((c) => { c.dataset.r = '1.9'; });
      const yb = py + Math.ceil(n / cols) * p;
      const cg = g(pg);
      const wt = text(cg, b.b, yb + 15, 'waiting', { family: 'mono', size: 12.5, anchor: 'end' });
      const ct = text(cg, wt.x - 15, yb + 15, String(n), { family: 'mono', size: 12.5, weight: 500, anchor: 'end' });
      const a = 2.42 + (k - 1) * 0.12;
      st.fill(els, a, a + 0.3).fade(cg, a + 0.24, a + 0.36);
      ringAt = ct; pileBottom = Math.max(pileBottom, ct.bottom + 4);
    });
    const bn = g(root);
    const last = waiting(3);
    if (narrow) {
      const t = text(bn, B.x, pileBottom + 22, 'the backlog grows without end:', noteO);
      const m2 = text(bn, B.x + 6, t.bottom + 17, String(waiting(2)), { family: 'mono', size: 12.5, weight: 500 });
      text(bn, B.x + 40, t.bottom + 17, 'waiting after the second answer', noteO);
      const m3 = text(bn, B.x + 6, m2.bottom + 22, String(last), { family: 'mono', size: 12.5, weight: 500 });
      text(bn, B.x + 40, m2.bottom + 22, 'waiting after the third', noteO);
      ringAt = m3; pileBottom = m3.bottom + 4;
    } else text(bn, B.x, py + 12, 'rounds that wait\nfor an answer:\nthe backlog\ngrows without end', { ...noteO, size: 14.5, lh: 18 });
    st.fade(bn, 2.78, 2.94);
    let pr = null;
    if (ringAt) {
      pr = penRing(root, ringAt.cx, ringAt.cy, ringAt.w / 2 + 6.5, 10.5, { seed: 6, stroke: C.accent, width: 1.5 });
      pr.paths.forEach((pp, k) => st.draw(pp, 2.86 + k * 0.03, 2.97 + k * 0.02));
    }
    // the axis
    const ay = pileBottom + (narrow ? 26 : 34), ax = g(root);
    line(ax, B.x, ay, right, ay, { stroke: C.ink, 'stroke-width': 1.25 });
    for (let t = 0; t <= o.maxT; t += 10) {
      line(ax, x(t), ay, x(t), ay + 5, { stroke: C.ink, 'stroke-width': 1 });
      text(ax, x(t), ay + 19, t === 0 ? '0' : String(t), { ...mono, anchor: t === 0 ? 'start' : 'middle' });
    }
    text(ax, B.x, ay + 38, 'the start of a run · time in millionths of a second (µs)', { ...mono, width: B.w, lh: 15 });
    st.fade(ax, 0, 0.15);
    return root;
  }

  // ------------------------------------------------------------------ view B
  function viewB(B, o) {
    const root = g(svg), narrow = o.narrow, noteO = { italic: true, size: narrow ? 13 : 14 };
    const right = B.x + B.w;
    const xLast = B.x + B.w * (narrow ? 0.24 : 0.3);
    const s = (right - xLast - 12) / (live.value + live.plus_minus);
    const x = (t) => xLast + t * s;                         // t: µs after the last round
    const base = g(root), l3 = g(root), n3 = g(root), l4 = g(root);
    const small = { family: 'sans', size: 12.5, weight: 600 };
    // the headline and the trade in two counted results
    text(base, B.x, 20, 'accurate, or in time', sans);
    const trade = text(base, B.x, 40,
      `network: [[${acc.network_afterwards.per_100000_rounds}]] errors per [[100,000]] rounds, answers late · live matching: [[${acc.live_matching.per_100000_rounds}]], answers in time`,
      { size: narrow ? 13 : 14, width: B.w, lh: 17 });
    // lane 1: the chip
    const y1 = trade.bottom + 22;
    text(base, B.x, y1, 'the chip: the end of a run', small);
    const L1 = y1 + 30;
    line(base, B.x, L1, right, L1, { stroke: C.ink, 'stroke-width': 1 });
    const nBack = Math.floor((xLast - B.x) / (T * s));
    for (let k = 0; k <= nBack; k++) {
      const xx = x(-k * T);
      line(base, xx, L1 - 8, xx, L1, { stroke: C.ink, 'stroke-width': k === 0 ? 1.6 : 1 });
      if (T * s > 5) circle(base, xx, L1 - 13, Math.min(2.1, T * s * 0.3), { fill: C.ink });
    }
    text(base, xLast + 8, L1 - 9, 'last round', { ...noteO, size: narrow ? 13 : 14.5 });
    // lane 2: still busy
    let y = L1 + 30;
    text(base, B.x, y, net.label, small);
    const bandY = y + 9, bh = 20;
    rect(base, B.x, bandY, B.w, bh, { fill: C.field, 'data-audit': 'skip' });
    line(base, B.x, bandY, right, bandY, { stroke: C.ink, 'stroke-width': 1.25, 'data-audit': 'skip' });
    line(base, B.x, bandY + bh, right, bandY + bh, { stroke: C.ink, 'stroke-width': 1.25, 'data-audit': 'skip' });
    text(base, B.x + 8, bandY + 14.5, 'still answering much earlier rounds', { family: 'sans', size: 12 });
    const nA = text(base, B.x, bandY + bh + 19, `after a run of a million rounds ([[${d.derived[1].value} seconds]]) the network would need [[${d.derived[2].value} seconds]]`, { ...noteO, width: B.w, lh: 16 });
    // lane 3: matching, live
    y = nA.bottom + 22;
    const t3 = text(l3, B.x, y, 'matching, live, 2024', small);
    const keeps = narrow
      ? text(n3, B.x, y + 17, 'runs beside the chip all along: it keeps pace', noteO)
      : text(n3, t3.right + 14, y, 'runs beside the chip all along: it keeps pace', noteO);
    const y3 = (narrow ? keeps.bottom : t3.bottom) + 24;
    const run = line(l3, B.x, y3, xLast, y3, { stroke: C.ink, 'stroke-width': 1.6, 'stroke-linecap': 'round' });
    line(l3, xLast, y3 - 6, xLast, y3 + 6, { stroke: C.ink, 'stroke-width': 1.6 });
    const after = g(l3);
    const wa = x(live.value - live.plus_minus), wb = x(live.value + live.plus_minus);
    line(after, xLast + 4, y3, wa - 4, y3, { stroke: C.ink, 'stroke-width': 0.9, 'stroke-dasharray': '1 4', 'stroke-linecap': 'round' });
    line(after, wa, y3, wb, y3, { stroke: C.accent, 'stroke-width': 1.1 });
    line(after, wa, y3 - 4.5, wa, y3 + 4.5, { stroke: C.accent, 'stroke-width': 1.1 });
    line(after, wb, y3 - 4.5, wb, y3 + 4.5, { stroke: C.accent, 'stroke-width': 1.1 });
    circle(after, x(live.value), y3, 5, { fill: C.accent });
    text(after, wb, y3 - 11, `± ${us(live.plus_minus)}`, { family: 'mono', size: 11.5, anchor: 'end', fill: C.accent });
    const bg = g(l3);
    bracket(bg, xLast, y3 + 14, x(live.value), y3 + 14, 5, { stroke: C.ink, 'stroke-width': 1 });
    const lab = text(bg, xLast, y3 + 35, `${live.label_on_page}:`, noteO);
    const big = narrow
      ? text(bg, xLast + 8, lab.bottom + 22, us(live.value), { family: 'mono', size: 15, weight: 500 })
      : text(bg, lab.right + 18, y3 + 35.5, us(live.value), { family: 'mono', size: 15, weight: 500 });
    const same = text(n3, narrow ? big.right + 22 : xLast, narrow ? big.y + big.h - 4 : big.bottom + 17, narrow ? 'for runs of up to\na million rounds' : 'the same for runs of up to a million rounds', { ...noteO, lh: 15, fill: C.muted });
    const pr = penRing(root, big.cx, big.cy, big.w / 2 + 8, 12, { seed: 8, stroke: C.accent, width: 1.5 });
    // lane 4: the claim
    y = Math.max(big.bottom, same.bottom) + 28;
    text(l4, B.x, y, claim.label, small);
    const y4 = y + 9, w4 = Math.max(2.5, claim.below * s * 0.8);
    for (let k = 0; k <= nBack; k++) {
      const xx = x(-k * T);
      path(l4, `M${(xx - w4).toFixed(1)} ${y4}L${xx.toFixed(1)} ${y4}L${xx.toFixed(1)} ${y4 + 9}L${(xx - w4).toFixed(1)} ${y4 + 9}`, { stroke: C.ink, 'stroke-width': 0.9, 'stroke-dasharray': '1.5 1.8' });
    }
    const on = text(l4, xLast + 10, y4 + 9, 'claimed, 2025 preprint, not yet reviewed', { ...noteO, size: narrow ? 12.5 : 13.5 });
    if (on.right + 8 < right) line(l4, on.right + 8, y4 + 4.5, right, y4 + 4.5, { stroke: C.ink, 'stroke-width': 0.9, 'stroke-dasharray': '2 5' });
    const tg = text(l4, B.x, y4 + 28, claim.tag_on_page, { ...mono, width: B.w, lh: 15 });
    // the axis: time after the last round
    const ay = tg.bottom + 14;
    line(base, xLast, ay, right, ay, { stroke: C.ink, 'stroke-width': 1.25 });
    for (let t = 0; t <= live.value + live.plus_minus; t += 20) {
      line(base, x(t), ay, x(t), ay + 5, { stroke: C.ink, 'stroke-width': 1 });
      text(base, x(t), ay + 18, t === 0 ? '0' : String(t), { ...mono, anchor: 'middle' });
    }
    if (narrow) text(base, B.x, ay + 18, 'µs after', mono);
    else text(base, xLast - 12, ay + 18, 'µs after the last round', { ...mono, anchor: 'end' });

    const a = o.at;
    st.fade(base, a, a + 0.22).draw(run, a + 0.2, a + 0.45).fade(l3, a + 0.2, a + 0.3).fade(after, a + 0.45, a + 0.6).fade(bg, a + 0.55, a + 0.72).fade(n3, a + 0.72, a + 0.9);
    pr.paths.forEach((pp, k) => st.draw(pp, a + 0.84 + k * 0.03, a + 0.96 + k * 0.02));
    st.fade(l4, 4.1, 4.6);
    return root;
  }

  if (print) {
    const A = viewA({ x: 20, w: 286 }, { maxT: 30, narrow: true });
    const Bv = viewB({ x: 348, w: 356 }, { narrow: true, at: 3 });
    line(svg, 327, 8, 327, H - 8, { stroke: C.hairline, 'stroke-width': 1 });
    void A; void Bv;
  } else {
    const box = tall ? { x: 14, w: 332 } : { x: 24, w: 672 };
    const A = viewA(box, { maxT: tall ? 30 : 76, narrow: tall });
    viewB(box, { narrow: tall, at: 3.14 });
    st.on((gg) => {
      const out = Math.min(1, Math.max(0, (gg - 3) / 0.18));
      A.style.opacity = out > 0 ? (1 - out).toFixed(3) : '';
      A.style.display = out >= 1 ? 'none' : '';
    });
  }
  void dotPlate; void fmt;
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
