// lattice: the smallest grid (9 storing qubits, 8 checks), what fires for
// one flip and for a row of flips, and the example of three fired checks
// with its two explanations. Geometry, fired checks and chances are all
// from data/lattice.json; the strips count the chances in units of 1/30.
import {
  mountFigure, svgRoot, g, circle, line, path, text, leader, penRing, stage, lerp, ease, span,
} from '../../../lib/fig.js';
import { pal, grid, errMark, show } from './shared.js';

export const steps = 6;
const SIZE = { wide: [720, 450], tall: [360, 544] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

const STRIP = 30;
const KEY = '[[X]]  a flip\n[[Z]]  a phase error\n[[Y]]  both at once';

function build(el, ctx) {
  const C = pal(ctx), d = ctx.data, tall = ctx.layout === 'tall', print = !!ctx.print;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const ex = d.example, pm = ex.plain_matching, rt = ex.read_together;
  const nPm = Math.round(pm.chance_right * STRIP), nRt = Math.round(rt.chance_right * STRIP);
  const inN = Math.round(1 / pm.chance_right), in10 = Math.round(rt.chance_right * 10);
  const pctErr = `${Math.round(ex.conditions.error_per_storing_qubit * 100)}%`;
  const svg0 = svgRoot(el, W, H,
    `The smallest grid: ${d.storing_qubits} storing qubits and ${d.helpers} checks. Errors are never seen; only the checks next to them fire, and in a row of errors only the ends. `
    + `The same ${ex.fired.length} fired checks can be explained in two ways: plain matching picks the one that is right ${1} time in ${inN}; the other, read together, is right about ${in10} times in 10. `
    + `Counted by us with ${pctErr} error per storing qubit and checks that are never wrong.`);
  svg0.style.color = C.ink;
  text(svg0, 16, 18, `the smallest grid: ${d.storing_qubits} storing qubits and ${d.helpers} checks`, { family: 'sans', size: 13, weight: 600 });
  const svg = tall ? g(svg0, { transform: 'translate(0 24)' }) : svg0;
  const st = stage();
  const noteO = { italic: true, size: tall ? 13 : 14.5 };
  const monoS = tall ? 11.5 : 12.5;

  // ---- the small grids: the example and its two explanations --------------
  const S = print
    ? { pitch: 46, cy: 168, xs: [292, 452, 612], noteY: 280, w: 150, noteSize: 13.5 }
    : tall
      ? { pitch: 42, cy: 288, xs: [180, 92, 268], mainCy: 72, noteY: 380, w: 164, noteSize: 13 }
      : { pitch: 62, cy: 168, xs: [118, 360, 602], noteY: 310, w: 216, noteSize: 14.5 };
  const ext = S.pitch * 1.5;

  function strip(parent, cx, y, n) {
    const p = Math.min(7, (S.w - 4) / STRIP), r = p * 0.38, x0 = cx - (p * (STRIP - 1)) / 2;
    const els = [];
    for (let i = 0; i < STRIP; i++) {
      els.push(circle(parent, x0 + i * p, y, r, i < n ? { fill: C.ink } : { fill: 'none', stroke: C.ink, 'stroke-width': 0.8, 'stroke-opacity': 0.8 }));
    }
    return els;
  }

  function copy(cx, cy, answer, note, n, ring, label) {
    const grp = g(svg);
    text(grp, cx, cy - ext - (tall || print ? 37 : 32), tall || print ? label.replace(/ (picks|explanation)/, '\n$1') : label, { family: 'sans', size: tall ? 12 : 13, weight: 500, anchor: 'middle', lh: 15 });
    const G = grid(grp, { checks: d.checks, d: d.distance, cx, cy, pitch: S.pitch, C });
    ex.fired.forEach((id) => G.tiles[id].setFired(1));
    const marks = g(grp);
    for (const q in answer.errors) { const [x, y] = G.pos(+q); errMark(marks, x, y, G.qr * 1.22, answer.errors[q], C).setAttribute('data-audit', 'skip'); }
    const ng = g(svg);
    const nt = text(ng, cx, S.noteY, note, { italic: true, size: S.noteSize, anchor: 'middle', width: S.w });
    const sg = g(svg);
    const dotsEl = strip(sg, cx, nt.bottom + 16, n);
    const cnt = g(svg);
    text(cnt, cx, nt.bottom + 38, `${n} of ${STRIP}`, { family: 'mono', size: monoS, anchor: 'middle', fill: C.muted });
    let pr = null;
    if (ring) pr = penRing(svg, cx, cy, ext + (tall ? 12 : 17), ext + (tall ? 10 : 14), { seed: 11, stroke: C.accent, width: 1.6, start: -0.4 });
    return { grp, marks, ng, sg, dotsEl, cnt, pr, bottom: nt.bottom + 44 };
  }

  const notePm = `plain matching:
right [[1]] time in [[${inN}]]`;
  const noteRt = `read together: right
about [[${in10}]] times in [[10]]`;
  const rest = 'the rest: rarer explanations';
  const foot = tall
    ? `${pctErr} error per storing qubit ·\nchecks never wrong · our own count`
    : `${pctErr} error per storing qubit · checks never wrong · our own count`;
  const firedLabel = `${ex.fired.length} of ${d.helpers} checks fired`;

  // ---- print: the walk at its second step, then the example ---------------
  if (print) {
    const A = grid(svg, { checks: d.checks, d: d.distance, cx: 96, cy: S.cy, pitch: S.pitch, C });
    const w = d.walk[d.walk.length - 1];
    w.fired.forEach((id) => A.tiles[id].setFired(1));
    const qs = Object.keys(w.errors).map(Number), last = A.pos(qs[qs.length - 1]), first = A.pos(qs[0]);
    line(A.gE, first[0], first[1], last[0], last[1] + S.pitch * 0.62, { stroke: C.ink, 'stroke-width': 1.5 });
    qs.forEach((q) => { const [x, y] = A.pos(q); errMark(A.gE, x, y, A.qr * 1.22, w.errors[q], C).setAttribute('data-audit', 'skip'); });
    text(svg, 96, S.noteY, 'a row of flips: only its ends fire, and an end at the edge fires nothing', { italic: true, size: S.noteSize, anchor: 'middle', width: 168 });
    text(svg, 96, S.noteY + 74, KEY, { italic: true, size: S.noteSize, anchor: 'middle' });
    line(svg, 196, 78, 196, 390, { stroke: C.hairline, 'stroke-width': 1 });
    const M = grid(svg, { checks: d.checks, d: d.distance, cx: S.xs[0], cy: S.cy, pitch: S.pitch, C });
    ex.fired.forEach((id) => M.tiles[id].setFired(1));
    text(svg, S.xs[0], S.noteY, `[[${firedLabel}.]]
Which errors?`, { italic: true, size: S.noteSize, anchor: 'middle' });
    copy(S.xs[1], S.cy, pm, notePm, nPm, true, 'plain matching picks this one');
    copy(S.xs[2], S.cy, rt, noteRt, nRt, false, 'the more likely explanation');
    text(svg, (S.xs[1] + S.xs[2]) / 2, 374, rest, { italic: true, size: 13, anchor: 'middle', fill: C.muted });
    text(svg, (S.xs[0] + S.xs[2]) / 2, 418, foot, { family: 'mono', size: 12, anchor: 'middle', fill: C.muted });
    return { set() {} };
  }

  // ---- screen: the large grid ---------------------------------------------
  const B = tall ? { cx: 180, cy: 146, pitch: 72 } : { cx: 250, cy: 222, pitch: 96 };
  const gridG = g(svg);
  const M = grid(gridG, { checks: d.checks, d: d.distance, ...B, C });
  const p = B.pitch, pos = M.pos;

  // step 0: the grid is drawn from left to right
  const x0 = B.cx - 1.5 * p, xw = 3 * p;
  Object.values(M.tiles).forEach((t) => {
    const a = 0.04 + 0.5 * ((t.c[0] - x0) / xw);
    st.fade(t.base, a, a + 0.18);
    if (t.helper) st.fade(t.helper, a + 0.08, a + 0.22);
  });
  M.qubits.forEach((q) => { const a = 0.02 + 0.5 * ((q.x - x0) / xw); st.fade(q.el, a, a + 0.16); });

  // the row of flips of the walk, and what fires
  const w1 = d.walk[0], w2 = d.walk[1];
  const q1 = Object.keys(w1.errors).map(Number), q2 = Object.keys(w2.errors).map(Number).filter((q) => !q1.includes(q));
  const pA = pos(q1[0]), pB = pos(q2[0]);
  const row = line(M.gE, pA[0], pA[1], pB[0], pB[1] + p * 0.6, { stroke: C.ink, 'stroke-width': 1.5 });
  const edgeTick = line(M.gE, pB[0] - 9, pB[1] + p * 0.6, pB[0] + 9, pB[1] + p * 0.6, { stroke: C.ink, 'stroke-width': 1.5, 'stroke-linecap': 'round' });
  st.draw(row, 2.2, 2.5, [3, 3.2]).fade(edgeTick, 2.45, 2.55, [3, 3.2]);
  const e1 = errMark(M.gE, pA[0], pA[1], M.qr * 1.12, w1.errors[q1[0]], C);
  const e2 = errMark(M.gE, pB[0], pB[1], M.qr * 1.12, w2.errors[q2[0]], C);
  e1.setAttribute('data-audit', 'skip'); e2.setAttribute('data-audit', 'skip');
  st.fade(e1, 1.12, 1.32, [3, 3.2]).fade(e2, 2.12, 2.32, [3, 3.2]);

  // fired checks over the steps: [id, on from, on to, off from, off to]
  const fire = [];
  w1.fired.forEach((id) => {
    const stays = w2.fired.includes(id);
    fire.push([id, 1.32, 1.55, stays ? 3 : 2.32, stays ? 3.2 : 2.55]);
  });
  ex.fired.forEach((id, i) => fire.push([id, 3.28 + i * 0.07, 3.5 + i * 0.07, 99, 100]));
  st.on((gg) => {
    const lv = {};
    for (const [id, a, b, c, e] of fire) lv[id] = Math.max(lv[id] || 0, ease(span(gg, a, b)) * (1 - ease(span(gg, c, e))));
    for (const id in M.tiles) M.tiles[id].setFired(lv[id] || 0);
  });

  // step 3: the pairing puzzle, two thin dashed joins
  const joins = g(M.gE);
  const dash = { stroke: C.ink, 'stroke-width': 1.25, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' };
  const flipChecks = ex.fired.filter((id) => M.tiles[id].check.asks_about === 'flips');
  const phaseChecks = ex.fired.filter((id) => M.tiles[id].check.asks_about !== 'flips');
  if (phaseChecks.length === 2) {
    const a = M.tiles[phaseChecks[0]].c, b = M.tiles[phaseChecks[1]].c;
    line(joins, a[0], a[1], b[0], b[1], dash);
  }
  if (flipChecks.length === 1) {
    // through the corner qubit and out of the grid
    const a = M.tiles[flipChecks[0]].c, q = pos(Number(Object.keys(pm.errors).find((k) => pm.errors[k] === 'X')));
    const dx = q[0] - a[0], dy = q[1] - a[1], k = 0.62;
    const end = [q[0] + dx * k, q[1] + dy * k];
    line(joins, a[0], a[1], end[0], end[1], dash);
  }
  st.fade(joins, 3.62, 3.9, [4, 4.18]);
  gridG.querySelectorAll('path, circle, line').forEach((n) => n.setAttribute('vector-effect', 'non-scaling-stroke'));

  // steps 4 and 5: the grid moves aside and becomes the first of three
  const target = { cx: S.xs[0], cy: tall ? S.mainCy : S.cy, k: S.pitch / B.pitch };
  st.on((gg) => {
    const m = ease(span(gg, 4.02, 4.45));
    if (m <= 0) { gridG.removeAttribute('transform'); return; }
    const k = lerp(1, target.k, m), cx = lerp(B.cx, target.cx, m), cy = lerp(B.cy, target.cy, m);
    gridG.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${k.toFixed(4)}) translate(${-B.cx} ${-B.cy})`);
  });

  // ---- notes beside (wide) or under (tall) the large grid -----------------
  const N = tall
    ? { x: 22, y: 296, w: 316 }
    : { x: 458, y: 150, w: 236 };
  const s0 = g(svg);
  if (tall) {
    const a = text(s0, 22, 300, `[[${d.storing_qubits}]] storing qubits, never read directly`, { ...noteO, width: 140 });
    const q = M.qubits[6];
    leader(s0, a.x + 30, a.y - 4, q.x - 4, q.y + M.qr + 4, { stroke: C.muted });
    const b = text(s0, 196, 300, `[[${d.helpers}]] checks, each asks its neighbours one question`, { ...noteO, width: 150 });
    const t = M.tiles.z3;
    leader(s0, b.x + 84, b.y - 4, t.c[0] + 3, t.c[1] + 5, { stroke: C.muted });
    text(s0, W / 2, 392, `${d.storing_qubits} + ${d.helpers} = ${d.total}`, { family: 'mono', size: 15, weight: 500, anchor: 'middle' });
  } else {
    const q = M.qubits[2];
    const a = text(s0, N.x, q.y + 5, `[[${d.storing_qubits}]] storing qubits, never read directly`, { ...noteO, width: N.w });
    leader(s0, a.x - 6, q.y, q.x + M.qr + 4, q.y, { stroke: C.muted });
    const t = M.tiles.z3;
    const b = text(s0, N.x, t.c[1] + 5, `[[${d.helpers}]] checks, each asks its neighbours one question`, { ...noteO, width: N.w });
    leader(s0, b.x - 6, t.c[1], t.c[0] + 4, t.c[1], { stroke: C.muted });
    text(s0, N.x, 392, `${d.storing_qubits} + ${d.helpers} = ${d.total}`, { family: 'mono', size: 16, weight: 500 });
  }
  st.fade(s0, 0.55, 0.85, [1, 1.12]);

  const s1 = g(svg);
  const n1 = text(s1, N.x, N.y, 'one flip: the two checks beside it fire', { ...noteO, width: tall ? 190 : N.w });
  if (!tall) { const t = M.tiles[w1.fired[0]]; leader(s1, n1.x - 6, n1.y + 9, t.c[0] + p * 0.14, t.c[1] - 2, { stroke: C.muted, dot: false }); }
  st.fade(s1, 1.5, 1.75, [2, 2.12]);

  const key = g(svg);
  text(key, tall ? 236 : N.x, tall ? N.y : 236, KEY, { ...noteO, lh: tall ? 19 : 22 });
  st.fade(key, 1.7, 1.95, [3, 3.15]);

  const s2 = g(svg);
  if (tall) {
    text(s2, N.x, N.y, 'a row of errors: only its ends fire, and an end at the edge fires nothing', { ...noteO, width: 190 });
  } else {
    const a = text(s2, N.x, N.y, 'a row of errors: only its ends fire,', { ...noteO, width: N.w });
    const t = M.tiles[w2.fired[0]];
    leader(s2, a.x - 6, a.y + 9, t.c[0] + p * 0.14, t.c[1] - 2, { stroke: C.muted, dot: false });
    const b = text(s2, N.x, pB[1] + p * 0.6 + 5, 'and an end at the edge fires nothing', { ...noteO, width: N.w });
    leader(s2, b.x - 6, pB[1] + p * 0.6, pB[0] + 15, pB[1] + p * 0.6, { stroke: C.muted, dot: false });
  }
  st.fade(s2, 2.55, 2.85, [3, 3.12]);

  const s3 = g(svg);
  text(s3, tall ? W / 2 : N.x, tall ? 316 : N.y, `[[${firedLabel}.]]\nWhich errors?`, { ...noteO, size: tall ? 15 : 17, lh: tall ? 21 : 24, anchor: tall ? 'middle' : 'start' });
  st.fade(s3, 3.5, 3.75, [4, 4.15]);

  // ---- the two explanations -------------------------------------------------
  const lab = g(svg);
  if (tall) text(lab, S.xs[0], S.mainCy + ext + 24, firedLabel, { family: 'mono', size: monoS, anchor: 'middle', fill: C.muted });
  else text(lab, S.xs[0], S.noteY, `[[${firedLabel}.]]
Which errors?`, { italic: true, size: S.noteSize, anchor: 'middle' });
  st.fade(lab, 4.4, 4.6);

  const c1 = copy(S.xs[1], S.cy, pm, notePm, nPm, true, 'plain matching picks this one');
  st.fade(c1.grp, 4.38, 4.62).fade(c1.marks, 4.58, 4.76).fade(c1.ng, 4.66, 4.84).fill(c1.dotsEl, 4.72, 4.94).fade(c1.cnt, 4.86, 4.98);
  c1.pr.paths.forEach((pp, k) => st.draw(pp, 4.8 + k * 0.03, 0.97 + 4 + k * 0.02));
  const c2 = copy(S.xs[2], S.cy, rt, noteRt, nRt, false, 'the more likely explanation');
  st.fade(c2.grp, 5.08, 5.34).fade(c2.marks, 5.3, 5.5).fade(c2.ng, 5.42, 5.62).fill(c2.dotsEl, 5.5, 5.8).fade(c2.cnt, 5.72, 5.86);

  const tail = g(svg);
  const midX = tall ? W / 2 : (S.xs[1] + S.xs[2]) / 2;
  text(tail, midX, tall ? c2.bottom + 22 : 402, rest, { italic: true, size: tall ? 12.5 : 14, anchor: 'middle', fill: C.muted });
  text(tail, tall ? midX : W / 2, tall ? c2.bottom + 46 : 438, foot, { family: 'mono', size: tall ? 11.5 : 12.5, anchor: 'middle', fill: C.muted, lh: 15 });
  st.fade(tail, 5.8, 5.98);

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
