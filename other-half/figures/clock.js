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
  mountFigure, svgRoot, g, line, rect, circle, path, bracket, leader, penRing, stage, fmt, ease, span,
} from '../fig.js';
import { pal, dotPlate, text, floor } from './shared.js';

export const steps = 5;
// seconds each step plays once triggered: the rounds tick in; the first
// answer; the answers that follow and the rounds that wait; the second
// view assembles; the claim's lane arrives
export const durations = { large: [2.4, 2.0, 1.5, 2.4, 1.8] };
const SIZE = { wide: [720, 472], tall: [360, 458] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

function build(el, ctx) {
  floor(ctx.layout === 'tall' ? 13.8 : 12.45);
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
    const h1 = g(root, { 'data-role': 'title' });
    const t1 = text(h1, B.x, 20, 'the chip asks: which checks fired?', sans);
    const n1g = g(root);
    const n1 = narrow
      ? text(n1g, B.x, 39, `one round of checks every [[${us(T)}]], ${perSecond} a second`, { ...noteO, width: B.w, lh: 16 })
      : text(n1g, B.x + B.w, 20, `one round of checks every [[${us(T)}]], ${perSecond} a second`, { ...noteO, anchor: 'end' });
    const L1 = (narrow ? n1.bottom : t1.bottom) + (narrow ? 50 : 84);
    const base = g(root);
    line(base, B.x, L1, B.x + B.w, L1, { stroke: C.ink, 'stroke-width': 1 });
    const ticks = [];
    for (let k = 1; k <= nT; k++) {
      const tg = g(root);
      line(tg, x(k * T), L1 - 8, x(k * T), L1, { stroke: C.ink, 'stroke-width': 1.1 });
      circle(tg, x(k * T), L1 - 14, narrow ? 2.1 : 2.3, { fill: C.ink });
      ticks.push(tg);
    }
    // the opening state shows the frame of what is compared: the chip's
    // title and lane, the network's lane title, the axis. The rounds then
    // tick in from the left across the passage, and their pace is named last.
    st.fade(h1, -1, 0).fade(base, -1, 0).fill(ticks, 0.06, 0.66).fade(n1g, 0.56, 0.74);
    // step 0: what one gap is
    const gp = g(root), ka = narrow ? 3 : 5;
    bracket(gp, x(ka * T), L1 + 7, x((ka + 1) * T), L1 + 7, 4, { stroke: C.ink, 'stroke-width': 1 });
    const gn = text(gp, x((ka + 1.5) * T) + 16, L1 + 38, `[[${T}]] millionths of a second`, { ...noteO, size: narrow ? 14 : 16 });
    leader(gp, gn.x - 5, gn.y + 6, x((ka + 0.5) * T), L1 + 10, { stroke: C.muted, dot: false });
    st.fade(gp, 0.74, 0.92, [1, 1.14]);

    // lane 2: the network of 2024
    const by = L1 + (narrow ? 50 : 96), bh = narrow ? 24 : 26;
    const y2 = by + bh + 19;
    const h2 = g(root);
    const h2t = g(root);
    const t2 = text(h2t, B.x, y2, net.label, sans);
    const n2 = narrow
      ? text(h2, B.x, y2 + 18, `needs [[${us(net.value)}]] for one round`, noteO)
      : text(h2, t2.right + 14, y2, `needs [[${us(net.value)}]] for one round`, noteO);
    const q2 = narrow ? text(h2, B.x, n2.bottom + 13, 'quoted in the 2024 paper', mono) : text(h2, n2.right + 14, n2.y + n2.h - 3.5, 'quoted in the 2024 paper', mono);
    st.fade(h2t, -1, 0).fade(h2, 1.06, 1.28);
    // the lane the answers will run along: a faint hairline from the start
    const lane = line(root, B.x, by + bh, B.x + B.w, by + bh, { stroke: C.hairline, 'stroke-width': 1, 'data-audit': 'skip' });
    st.fade(lane, -1, 0);
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
      const t0 = k === 1 ? 1.22 : 2.14 + (k - 2) * 0.16;
      st.fade(grp, t0, t0 + 0.25).fade(lg, t0 + 0.2, t0 + 0.4);
      return { a, b, xe, open };
    });
    // step 1: the rounds that pass during the first answer
    // the bracket, then its words, to the end of the step
    const bk = g(root), bkt = g(bk);
    bracket(bk, x(endOf(0)), L1 - 24, Math.min(right, x(endOf(1))), L1 - 24, -5, { stroke: C.ink, 'stroke-width': 1 });
    text(bkt, (x(endOf(0)) + Math.min(right, x(endOf(1)))) / 2, L1 - 34, `about ${meanwhile} rounds meanwhile`, { family: 'mono', size: 12, weight: 500, anchor: 'middle' });
    st.fade(bk, 1.58, 1.76).fade(bkt, 1.7, 1.92);
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
      const a = 2.44 + (k - 1) * 0.1;
      st.fill(els, a, a + 0.26).fade(cg, a + 0.2, a + 0.32);
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
    st.fade(bn, 2.76, 2.9);
    let pr = null;
    if (ringAt) {
      pr = penRing(root, ringAt.cx, ringAt.cy, ringAt.w / 2 + 6.5, 10.5, { seed: 6, stroke: C.accent, width: 1.5 });
      pr.paths.forEach((pp, k) => st.draw(pp, 2.84 + k * 0.03, 2.95 + k * 0.02));
    }
    // the axis
    const ay = pileBottom + (narrow ? 18 : 34), ax = g(root);
    line(ax, B.x, ay, right, ay, { stroke: C.ink, 'stroke-width': 1.25 });
    for (let t = 0; t <= o.maxT; t += 10) {
      line(ax, x(t), ay, x(t), ay + 5, { stroke: C.ink, 'stroke-width': 1 });
      text(ax, x(t), ay + 19, t === 0 ? '0' : String(t), { ...mono, anchor: t === 0 ? 'start' : 'middle' });
    }
    text(ax, B.x, ay + (narrow ? 36 : 38), narrow ? 'the start of a run · millionths of a second (µs)' : 'the start of a run · time in millionths of a second (µs)', { ...mono, width: B.w, lh: 15 });
    st.fade(ax, -1, 0);
    // Until the rounds start to pile up (step 2) the axis sits just under the
    // network's lane, so no empty band opens between the lanes and the axis;
    // it moves down to make room as the first waiting rounds arrive.
    if (!print) {
      const early = (narrow ? q2.bottom : n2.bottom) + (narrow ? 22 : 30);
      const lift = Math.min(0, early - ay);
      st.on((gg) => {
        const m = ease(span(gg, 2.02, 2.3));
        const v = m >= 1 ? '' : `translate(0 ${(lift * (1 - m)).toFixed(2)})`;
        if ((ax.getAttribute('transform') || '') !== v) { if (v) ax.setAttribute('transform', v); else ax.removeAttribute('transform'); }
      });
    }
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
    const y1 = trade.bottom + (narrow ? 20 : 22);
    text(base, B.x, y1, narrow ? 'the chip' : 'the chip: the end of a run', small);
    const L1 = y1 + (narrow ? 24 : 30);
    line(base, B.x, L1, right, L1, { stroke: C.ink, 'stroke-width': 1 });
    const nBack = Math.floor((xLast - B.x) / (T * s));
    for (let k = 0; k <= nBack; k++) {
      const xx = x(-k * T);
      line(base, xx, L1 - 8, xx, L1, { stroke: C.ink, 'stroke-width': k === 0 ? 1.6 : 1 });
      if (T * s > 5) circle(base, xx, L1 - 13, Math.min(2.1, T * s * 0.3), { fill: C.ink });
    }
    text(base, xLast + 8, L1 - (narrow ? 11 : 9), narrow ? 'last round of a run' : 'last round', { ...noteO, size: narrow ? 13 : 14.5 });
    // lane 2: still busy
    let y = L1 + (narrow ? 24 : 30);
    text(base, B.x, y, net.label, small);
    const bandY = y + 9, bh = 20;
    rect(base, B.x, bandY, B.w, bh, { fill: C.field, 'data-audit': 'skip' });
    line(base, B.x, bandY, right, bandY, { stroke: C.ink, 'stroke-width': 1.25, 'data-audit': 'skip' });
    line(base, B.x, bandY + bh, right, bandY + bh, { stroke: C.ink, 'stroke-width': 1.25, 'data-audit': 'skip' });
    text(base, B.x + 8, bandY + 14.5, 'still answering much earlier rounds', { family: 'sans', size: 12 });
    const nA = text(base, B.x, bandY + bh + 19, `after a run of a million rounds ([[${d.derived[1].value} seconds]]) the network would need [[${d.derived[2].value} seconds]]`, { ...noteO, width: B.w, lh: 16 });
    // lane 3: matching, live
    y = nA.bottom + (narrow ? 19 : 22);
    const t3 = text(l3, B.x, y, 'matching, live, 2024', small);
    const keeps = narrow
      ? text(n3, B.x, y + 17, 'runs beside the chip all along: it keeps pace', noteO)
      : text(n3, t3.right + 14, y, 'runs beside the chip all along: it keeps pace', noteO);
    const y3 = (narrow ? keeps.bottom + 22 : t3.bottom + 24);
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
    y = Math.max(big.bottom, same.bottom) + (narrow ? 20 : 28);
    // in reading order (step 4): the lane and its blocks, the note on
    // them, then the tag
    const l4a = g(l4), l4b = g(l4), l4c = g(l4);
    text(l4a, B.x, y, claim.label, small);
    const y4 = y + 9, w4 = Math.max(2.5, claim.below * s * 0.8);
    for (let k = 0; k <= nBack; k++) {
      const xx = x(-k * T);
      path(l4a, `M${(xx - w4).toFixed(1)} ${y4}L${xx.toFixed(1)} ${y4}L${xx.toFixed(1)} ${y4 + 9}L${(xx - w4).toFixed(1)} ${y4 + 9}`, { stroke: C.ink, 'stroke-width': 0.9, 'stroke-dasharray': '1.5 1.8' });
    }
    const on = text(l4b, xLast + 10, y4 + 9, 'claimed, 2025 preprint, not yet reviewed', { ...noteO, size: narrow ? 12.5 : 13.5 });
    if (on.right + 8 < right) line(l4b, on.right + 8, y4 + 4.5, right, y4 + 4.5, { stroke: C.ink, 'stroke-width': 0.9, 'stroke-dasharray': '2 5' });
    const tg = text(l4c, B.x, y4 + 28, narrow ? claim.tag_on_page.split(' · ').slice(1, 3).join(' · ') : claim.tag_on_page, { ...mono, width: B.w, lh: 15 });
    // the axis: time after the last round. It belongs to the lowest lane
    // shown: until the claim's lane arrives (step 4) it sits just under
    // lane 3, then moves down with it, so it never floats below empty space.
    const ay = tg.bottom + (narrow ? 10 : 14), axg = g(root);
    line(axg, xLast, ay, right, ay, { stroke: C.ink, 'stroke-width': 1.25 });
    for (let t = 0; t <= live.value + live.plus_minus; t += 20) {
      line(axg, x(t), ay, x(t), ay + 5, { stroke: C.ink, 'stroke-width': 1 });
      text(axg, x(t), ay + 18, t === 0 ? '0' : String(t), { ...mono, anchor: 'middle' });
    }
    if (narrow) text(axg, B.x, ay + 18, 'µs after', mono);
    else text(axg, xLast - 12, ay + 18, 'µs after the last round', { ...mono, anchor: 'end' });

    const a = o.at;
    // step 3 draws across its passage: the frame, the live run, its answer
    // after the last round, the bracket and value, the note, the ring
    st.fade(base, a, a + 0.2).fade(axg, a, a + 0.2).draw(run, a + 0.16, a + 0.38).fade(l3, a + 0.16, a + 0.26).fade(after, a + 0.38, a + 0.52).fade(bg, a + 0.48, a + 0.62).fade(n3, a + 0.6, a + 0.72);
    pr.paths.forEach((pp, k) => st.draw(pp, a + 0.66 + k * 0.03, a + 0.76 + k * 0.02));
    st.fade(l4a, 4.08, 4.5).fade(l4b, 4.4, 4.72).fade(l4c, 4.64, 4.98);
    if (!o.final) {
      const lift = Math.min(0, Math.max(big.bottom, same.bottom) + (narrow ? 14 : 18) - ay);
      st.on((gg) => {
        const m = ease(span(gg, 4, 4.5));
        const v = m >= 1 ? '' : `translate(0 ${(lift * (1 - m)).toFixed(2)})`;
        if ((axg.getAttribute('transform') || '') !== v) { if (v) axg.setAttribute('transform', v); else axg.removeAttribute('transform'); }
      });
    }
    return root;
  }

  if (print) {
    const A = viewA({ x: 20, w: 286 }, { maxT: 30, narrow: true });
    const Bv = viewB({ x: 348, w: 356 }, { narrow: true, at: 3, final: true });
    line(svg, 327, 8, 327, H - 8, { stroke: C.hairline, 'stroke-width': 1 });
    void A; void Bv;
  } else {
    const box = tall ? { x: 14, w: 332 } : { x: 24, w: 672 };
    const A = viewA(box, { maxT: tall ? 30 : 76, narrow: tall });
    viewB(box, { narrow: tall, at: 3.12 });
    st.on((gg) => {
      const out = Math.min(1, Math.max(0, (gg - 3) / 0.14));
      A.style.opacity = out > 0 ? (1 - out).toFixed(3) : '';
      A.style.display = out >= 1 ? 'none' : '';
    });
  }
  void dotPlate; void fmt;
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
