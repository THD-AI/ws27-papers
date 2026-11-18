// Grid lab: the `lattice` scene for variant E (from D's _scene.js). Steps 4
// and 5 show two copies only, larger: the large grid itself moves and
// shrinks into the first copy, so no separate small reference grid.
// Grid lab: the `lattice` scene with a pluggable grid drawing. Same six
// steps, same data and the same timings as figures/lattice.js; the tall
// layout is 360 x 456 so that at 336 px across it is 426 px high and can be
// pinned on a 360 x 800 phone.
import { mountFigure, svgRoot, g, text, penRing, stage, lerp, ease, span } from '../../../lib/fig.js';
import { pal } from './shared.js';
import { stroke, errMark, letter, lead, tally, tallyWidth, washFilter, wash } from './_lattice-hand.js';

const STRIP = 30;
const SIZE = { wide: [720, 450], tall: [360, 456] };

export function makeScene(gridFn, V = {}) {
  const steps = 6;
  const durations = { large: [2.4, 1.2, 1.8, 1.8, 2.6, 2.4] };
  const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

  function build(el, ctx) {
    const C = pal(ctx), d = ctx.data, tall = ctx.layout === 'tall' && !ctx.print;
    const [W, H] = SIZE[tall ? 'tall' : 'wide'];
    const ex = d.example, pm = ex.plain_matching, rt = ex.read_together;
    const nPm = Math.round(pm.chance_right * STRIP), nRt = Math.round(rt.chance_right * STRIP);
    const inN = Math.round(1 / pm.chance_right), in10 = Math.round(rt.chance_right * 10);
    const pctErr = `${Math.round(ex.conditions.error_per_storing_qubit * 100)}%`;
    const svg = svgRoot(el, W, H,
      `The smallest grid: ${d.storing_qubits} storing qubits and ${d.helpers} checks. Errors are never seen; only the checks next to them fire, and in a line of errors only the ends. `
      + `The same ${ex.fired.length} fired checks can be explained in two ways: plain matching picks the one that is right 1 time in ${inN}; the other, read together, is right about ${in10} times in 10. `
      + `Counted by us with ${pctErr} error per storing qubit and checks that are never wrong.`);
    svg.style.color = C.ink;
    const filter = washFilter(svg);
    const st = stage();
    const T = tall
      ? { title: 13, note: 13.5, label: 12.5, big: 19, foot: 12.4, q: 16 }
      : { title: 13.5, note: 14.5, label: 13.5, big: 22, foot: 13, q: 17 };
    const it = (size, extra = {}) => (V.oneFace ? { family: 'sans', size: size - 0.5, ...extra } : { italic: true, size, ...extra });
    const grid = (parent, o) => gridFn(parent, { checks: d.checks, d: d.distance, C, filter, ...o });
    const LET = (pitch) => pitch * 0.36;      // height of a written error letter
    // an error: the letter written over its qubit (knocked out), or, with
    // V.onQubit, written inside the open circle, which stays
    const mark = (parent, x, y, pitch, qr, L, seed, k = 1) => (V.onQubit
      ? letter(g(parent, { 'data-audit': 'skip' }), x, y, L, qr * 1.3, seed, { stroke: C.ink, w: Math.max(2.1, qr * 0.19) })
      : errMark(parent, x, y, LET(pitch) * k, L, C, seed));
    const SL = V.sansLabels;
    // "3 of 8 checks fired." as a label, "Which errors?" as a note under it
    const firedQ = (parent, x, y, anchor, size, lh) => {
      const s = `${ex.fired.length} of ${d.helpers} checks fired.`;
      if (!SL) return text(parent, x, y, `${s}\nWhich errors?`, it(size, { lh, anchor }));
      text(parent, x, y, s, { family: 'sans', weight: 500, size: size - 0.5, anchor });
      return text(parent, x, y + lh, 'Which errors?', it(size, { anchor }));
    };

    text(svg, tall ? 12 : 16, 18, `the smallest grid: ${d.storing_qubits} storing qubits and ${d.helpers} checks`, { family: 'sans', size: T.title, weight: 600 });

    // ---- geometry ----------------------------------------------------------
    const B = tall ? { cx: 180, cy: 152, pitch: 76 } : { cx: 250, cy: 228, pitch: 108 };
    const S = tall
      ? { pitch: V.tallPitch || 52, cy: 192, xs: [90, 90, 270], noteY: 300, w: 176 }
      : { pitch: 70, cy: 196, xs: V.wideXs || [170, 170, 420], noteY: 340, w: 240 };
    const QR = tall ? 0.23 : 0.17;           // storing qubit radius / pitch, large grid and copies alike
    const ext = S.pitch * 1.5;

    // ---- the large grid ------------------------------------------------------
    const gridG = g(svg);
    const M = grid(gridG, { ...B, seed: 3, die: true, qr: B.pitch * QR });
    const p = B.pitch, pos = M.pos;
    const xs0 = M.parts.map((q) => q.x).concat(M.qubits.map((q) => q.x));
    const x0 = Math.min(...xs0), xw = Math.max(...xs0) - x0 || 1;
    M.parts.forEach((q) => {
      const a = 0.03 + 0.46 * ((q.x - x0) / xw) + (q.late ? 0.1 : 0);
      if (q.how === 'draw') st.draw(q.el, a, a + (q.len ? 0.34 : 0.2));
      else st.fade(q.el, a, a + 0.18);
    });
    M.qubits.forEach((q) => { const a = 0.06 + 0.46 * ((q.x - x0) / xw); st.fade(q.el, a, a + 0.16); });

    // the walk: one flip, then a row of two reaching the edge
    const w1 = d.walk[0], w2 = d.walk[1];
    const q1 = Object.keys(w1.errors).map(Number), q2 = Object.keys(w2.errors).map(Number).filter((q) => !q1.includes(q));
    const pA = pos(q1[0]), pB = pos(q2[0]);
    const edgeY = pB[1] + p * 0.62;
    // with letters inside open qubits the line runs between the circles, not through the letters
    const gap = V.onQubit ? M.qr + 3 : 0;
    const row = V.onQubit
      ? stroke(M.gE, [[pA[0] + 1, pA[1] + gap], [pB[0], pB[1] - gap]], 77, { w: 2, amp: 0.4 })
      : stroke(M.gE, [[pA[0] + 1, pA[1]], [pB[0], pB[1]], [pB[0] - 1, edgeY]], 77, { w: 2, amp: 0.4 });
    if (V.onQubit) {
      const row2 = stroke(M.gE, [[pB[0], pB[1] + gap], [pB[0] - 1, edgeY]], 79, { w: 2, amp: 0.4 });
      st.draw(row2, 2.4, 2.5, [3, 3.2]);
    }
    const tick = stroke(M.gE, [[pB[0] - p * 0.1, edgeY + 1], [pB[0] + p * 0.1, edgeY - 1]], 78, { w: 2, amp: 0.2 });
    st.draw(row, 2.2, 2.48, [3, 3.2]).fade(tick, 2.42, 2.56, [3, 3.2]);
    const e1 = mark(M.gE, pA[0], pA[1], p, M.qr, w1.errors[q1[0]], 21);
    const e2 = mark(M.gE, pB[0], pB[1], p, M.qr, w2.errors[q2[0]], 22);
    st.fade(e1, 1.08, 1.32, [3, 3.2]).fade(e2, 2.1, 2.3, [3, 3.2]);

    const fire = [];
    w1.fired.forEach((id) => { const stays = w2.fired.includes(id); fire.push([id, 1.28, 1.55, stays ? 3 : 2.3, stays ? 3.2 : 2.52]); });
    ex.fired.forEach((id, i) => fire.push([id, 3.2 + i * 0.08, 3.42 + i * 0.08, 99, 100]));
    st.on((gg) => {
      const lv = {};
      for (const [id, a, b, c, e] of fire) lv[id] = Math.max(lv[id] || 0, ease(span(gg, a, b)) * (1 - ease(span(gg, c, e))));
      for (const id in M.tiles) M.tiles[id].setFired(lv[id] || 0);
    });

    // step 3: the pairing puzzle, two dotted pen joins
    const joins = g(M.gE);
    const dot = { w: 1.4, dash: '0.1 5.5', amp: 0.5, stroke: C.ink };
    const flipC = ex.fired.filter((id) => M.tiles[id].check.asks_about === 'flips');
    const phaseC = ex.fired.filter((id) => M.tiles[id].check.asks_about !== 'flips');
    if (phaseC.length === 2) stroke(joins, [M.tiles[phaseC[0]].c, M.tiles[phaseC[1]].c], 81, dot);
    if (flipC.length === 1) {
      const a = M.tiles[flipC[0]].c, q = pos(Number(Object.keys(pm.errors).find((k) => pm.errors[k] === 'X')));
      stroke(joins, [a, [q[0] + (q[0] - a[0]) * 0.62, q[1] + (q[1] - a[1]) * 0.62]], 82, dot);
    }
    st.fade(joins, 3.62, 3.92, [4, 4.18]);
    if (V.hint) {
      const hg = g(M.gE, { 'data-audit': 'skip' });
      const cand = [...new Set([...Object.keys(pm.errors), ...Object.keys(rt.errors)])].map(Number);
      cand.forEach((q) => { const [x, y] = pos(q); text(hg, x, y + M.qr * 0.42, '?', { family: 'sans', size: M.qr * (tall && V.qSize ? V.qSize : 1.2), weight: tall && V.qSize ? 600 : 500, anchor: 'middle', fill: C.muted }); });
      st.fade(hg, 3.72, 3.98, [4, 4.15]);
    }

    // steps 4 and 5: the grid moves aside and becomes the first of three
    const gridVE = [...gridG.querySelectorAll('path, circle, line')];
    let ve = false;
    const keep = (on) => { if (on === ve) return; ve = on; gridVE.forEach((n) => (on ? n.setAttribute('vector-effect', 'non-scaling-stroke') : n.removeAttribute('vector-effect'))); };
    const target = { cx: S.xs[1], cy: S.cy, k: S.pitch / B.pitch };
    st.on((gg) => {
      const m = ease(span(gg, 4.02, 4.45));
      keep(m > 0);
      if (m <= 0) { gridG.removeAttribute('transform'); return; }
      const k = lerp(1, target.k, m), cx = lerp(B.cx, target.cx, m), cy = lerp(B.cy, target.cy, m);
      gridG.setAttribute('transform', `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${k.toFixed(4)}) translate(${-B.cx} ${-B.cy})`);
    });

    // ---- notes for steps 0 to 3 ---------------------------------------------
    const N = tall ? { x: 14, y: 300, w: 196 } : { x: 458, y: 150, w: 236 };
    const s0 = g(svg), s0a = g(s0), s0b = g(s0), s0c = g(s0);
    const sum = `${d.storing_qubits} + ${d.helpers} = ${d.total}`;
    if (tall) {
      const q = M.qubits[6];
      const a = text(s0a, 14, 300, `${d.storing_qubits} storing qubits, never read directly`, it(T.note, { width: 150 }));
      lead(s0a, a.x + 22, a.y - 4, q.x - M.qr * 0.7, q.y + M.qr + 3, C, 31, -0.2);
      const t = M.tiles.z3;
      const b = text(s0b, 194, 300, `${d.helpers} checks, each asks its neighbours one question`, it(T.note, { width: 152 }));
      lead(s0b, b.x + 104, b.y - 4, t.c[0] + 4, t.c[1] + 9, C, 32, 0.2);
      text(s0c, W / 2, V.checkKey ? 414 : 384, sum, SL ? { family: 'sans', weight: 500, size: 17, anchor: 'middle' } : { family: 'serif', size: T.big, anchor: 'middle' });
    } else {
      const q = M.qubits[2];
      const a = text(s0a, N.x, q.y + 5, `${d.storing_qubits} storing qubits, never read directly`, it(T.note, { width: N.w }));
      lead(s0a, a.x - 8, q.y + 2, q.x + M.qr + 6, q.y + 2, C, 31, 0.12);
      const t = M.tiles.z3;
      const b = text(s0b, N.x, t.c[1] + 5, `${d.helpers} checks, each asks its neighbours one question`, it(T.note, { width: N.w }));
      lead(s0b, b.x - 8, t.c[1] + 2, t.c[0] + 8, t.c[1] + 2, C, 32, -0.12);
      text(s0c, N.x, 420, sum, SL ? { family: 'sans', weight: 500, size: 18 } : { family: 'serif', size: T.big });
    }
    st.fade(s0, -1, 0, [1, 1.12]).fade(s0a, 0.5, 0.68).fade(s0b, 0.62, 0.8).fade(s0c, 0.74, 0.92);
    if (V.checkKey) {
      const kk = g(svg);
      const kx = tall ? 14 : N.x, ky = tall ? 362 : 328, lh = tall ? 20 : 22, sw = tall ? 12 : 13;
      [['flips', 'shaded: flip-checks, they catch flips'], ['phase errors', 'white: phase-checks, they catch phase errors']].forEach(([kind, words], i) => {
        const y = ky + i * lh, flips = kind === 'flips';
        // the swatch drawn as the cells are: a wash set off a pen square
        const sq = [[kx, y - sw + 2], [kx + sw, y - sw + 2], [kx + sw, y + 2], [kx, y + 2], [kx, y - sw + 2]];
        if (V.keySwatch) V.keySwatch(kk, sq, flips, C, i, filter);
        else {
          if (flips) { const wsh = wash(kk, sq, 300 + i, C.ink, { op: 0.09, amp: 0.5, dx: -0.8, dy: 1 }); wsh.setAttribute('filter', filter); }
          stroke(kk, sq, 310 + i, { w: 1.1, amp: 0.25, stroke: C.ink, op: 0.75 });
        }
        text(kk, kx + sw + 8, y, words, it(T.note, { width: (tall ? 336 : W - N.x - 4) - sw - 8 }));
      });
      st.fade(kk, 0.7, 0.9, [4, 4.15]);
    }

    const s1 = g(svg);
    const n1 = text(s1, N.x, N.y, V.checkKey ? 'one flip: the two flip-checks beside it fire; the phase-checks stay quiet' : 'one flip: the two checks beside it fire', it(T.note, { width: tall ? 196 : N.w }));
    if (!tall) { const t = M.tiles[w1.fired[0]]; lead(s1, n1.x - 8, n1.y + 9, t.c[0] + p * 0.18, t.c[1] - 6, C, 33, 0.18); }
    st.fade(s1, 1.46, 1.74, [2, 2.12]);

    // the key, with the letters written as on the grid
    const key = g(svg);
    const kx = tall ? 222 : N.x, ky = tall ? N.y : 236, klh = tall ? 20 : 23, ks = tall ? 12 : 13;
    [['X', 'a flip'], ['Z', 'a phase error'], ['Y', 'both at once']].forEach(([L, w], i) => {
      letter(key, kx + ks * 0.45, ky + i * klh - T.note * 0.33, L, ks, 60 + i, { stroke: C.ink, w: 1.6 });
      text(key, kx + ks + 9, ky + i * klh, w, it(T.note));
    });
    st.fade(key, 1.66, 1.94, [3, 3.15]);

    const s2 = g(svg);
    if (tall) text(s2, N.x, N.y, 'a line of errors: only its ends fire, and an end at the edge fires nothing', it(T.note, { width: 196 }));
    else {
      const a = text(s2, N.x, N.y, 'a line of errors: only its ends fire,', it(T.note, { width: N.w }));
      const t = M.tiles[w2.fired[0]];
      lead(s2, a.x - 8, a.y + 9, t.c[0] + p * 0.18, t.c[1] - 6, C, 34, 0.18);
      const b = text(s2, N.x, edgeY + 5, 'and an end at the edge fires nothing', it(T.note, { width: N.w }));
      lead(s2, b.x - 8, edgeY + 1, pB[0] + p * 0.16, edgeY, C, 35, 0.1);
    }
    st.fade(s2, 2.5, 2.9, [3, 3.12]);

    const s3 = g(svg);
    firedQ(s3, tall ? W / 2 : N.x, tall ? 318 : N.y, tall ? 'middle' : 'start', T.q, T.q * 1.4);
    st.fade(s3, 3.42, 3.7, tall ? [4, 4.15] : [5, 5.1]);

    // ---- the two explanations -------------------------------------------------
    const lab = g(svg);
    if (tall) {
      text(lab, W / 2, 46, `${ex.fired.length} of ${d.helpers} checks fired. Which errors?`, { family: 'sans', size: 13.5, weight: 500, anchor: 'middle' });
      st.fade(lab, 4.4, 4.6);
    }

    function copy(cx, cy, answer, note, n, ring, label, seed) {
      const grp = g(svg);
      const lines = tall ? label.replace(/ (picks|explanation)/, '\n$1') : label;
      text(grp, cx, cy - ext - (tall ? 32 : 30), lines, { family: 'sans', size: T.label, weight: 500, anchor: 'middle', lh: 15 });
      const G = grid(grp, { cx, cy, pitch: S.pitch, seed, qr: S.pitch * QR });
      ex.fired.forEach((id) => G.tiles[id].setFired(1));
      if (ring) G.root.remove();            // the large grid arrives here in step 4
      const marks = g(grp);
      Object.keys(answer.errors).forEach((q, i) => { const [x, y] = G.pos(+q); mark(marks, x, y, S.pitch, G.qr, answer.errors[q], seed + 10 + i, 1.2); });
      const ng = g(svg);
      const nt = text(ng, cx, S.noteY, note, it(tall ? 13 : T.note, { anchor: 'middle', width: S.w, lh: tall ? 16.5 : 19 }));
      const cnt = `${n} of ${STRIP}`;
      const TO = tall ? (V.tallyTall || { step: 3.4, gap: 6, h: 13, w: 1.9, faint: 0.55 }) : { step: 3.8, gap: 7.5, h: 14, w: 1.9, faint: 0.55 };
      const tw = tallyWidth(STRIP, TO), cw = tall ? 46 : 52;
      const tx = cx - (tw + 8 + cw) / 2;
      const tg = g(svg);
      const ty = nt.bottom + (tall ? 16 : 18);
      const tl = tally(tg, tx, ty, n, STRIP, C, seed + 5, TO);
      const cg = g(svg);
      text(cg, tx + tw + 8, ty + 4.5, cnt, it(tall ? 12.4 : 13, { fill: C.muted }));
      let pr = null;
      if (ring) pr = penRing(svg, cx, cy, ext + (tall ? (V.ringPad ?? 10) : 17), ext + (tall ? (V.ringPad ?? 10) - 1 : 14), { seed: 11, stroke: C.accent, width: 1.7, start: -0.4, overlap: 0.03, drift: 0 });
      if (pr && V.single) { pr.paths[1].remove(); pr.paths.length = 1; }
      return { grp, marks, ng, tg, tl, cg, pr, bottom: ty + 8 };
    }
    const notePm = `plain matching:\nright 1 time in ${inN}`;
    const noteRt = `read together: right\nabout ${in10} times in 10`;
    const c1 = copy(S.xs[1], S.cy, pm, notePm, nPm, true, 'plain matching picks this one', 101);
    st.fade(c1.grp, 4.38, 4.62).fade(c1.marks, 4.58, 4.76).fade(c1.ng, 4.66, 4.84).fade(c1.tl.faint, 4.7, 4.8).fill(c1.tl.ink, 4.72, 4.94).fade(c1.cg, 4.86, 4.98);
    c1.pr.paths.forEach((pp, k) => st.draw(pp, 4.8 + k * 0.03, 4.97 + k * 0.02));
    const c2 = copy(S.xs[2], S.cy, rt, noteRt, nRt, false, 'the more likely explanation', 201);
    st.fade(c2.grp, 5.02, 5.3).fade(c2.marks, 5.26, 5.48).fade(c2.ng, 5.42, 5.62).fade(c2.tl.faint, 5.46, 5.56).fill(c2.tl.ink, 5.5, 5.8).fade(c2.cg, 5.72, 5.86);

    const tail = g(svg);
    const foot = `${pctErr} error per storing qubit, checks never wrong,${tall ? '\n' : ' '}our own count`;
    // why the right-hand answer wins: a Y fires checks of both kinds (text.md,
    // section 6, step 3); plain matching solves the two kinds apart
    const why = g(svg);
    // what is left of the 30: from the data's rest, said as a count
    const restLine = V.restCount ? `about ${Math.max(1, Math.round(ex.rest * STRIP))} of ${STRIP}: rarer explanations` : 'the rest: rarer explanations';
    const WX = tall ? { x: S.xs[2], y: c2.bottom + 18, anchor: 'middle', w: S.w } : { x: V.whyX || 556, y: 150, anchor: 'start', w: V.whyW || 156 };
    const wy = text(why, WX.x, WX.y, 'A Y is one error that fires both kinds of check. Plain matching reads the two kinds apart, so to it a Y is two errors.', it(tall ? 12.6 : 14, { anchor: WX.anchor, width: WX.w, lh: tall ? 15 : 19 }));
    st.fade(why, 5.78, 5.94);
    if (tall) text(tail, S.xs[1], c1.bottom + 18, restLine, it(12.6, { anchor: 'middle', fill: C.muted, width: S.w - 24, lh: 15 }));
    else text(tail, WX.x, wy.bottom + 30, restLine, it(14, { fill: C.muted, width: WX.w }));
    text(tail, W / 2, tall ? Math.max(wy.bottom + 18, 424) : 440, foot, { family: 'sans', size: T.foot, anchor: 'middle', fill: C.muted, width: tall ? 336 : 700 });
    st.fade(tail, 5.84, 5.98);

    if (ctx.print) { st.set(5, 1); return { set() {} }; }
    return { set: (s, t) => st.set(s, t) };
  }

  return { steps, durations, aspect, mount: (el, ctx) => mountFigure(el, (root) => build(root, ctx)) };
}
