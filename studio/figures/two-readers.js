// two-readers (section 0): one recording, two readers, two results.
// Step 1: the cryostat; a strip of film runs out of it and through one reader,
//         which puts out a bar of wrong answers.
// Step 2: the same strip runs on to a second reader, whose bar is shorter.
// (Paragraph 3 is a rest.) Alone frame: step 2.
// Source: Google Quantum AI, Nature 638 (2025), distance 7: 171 (Google's best
// matching) and 143 (the network) logical errors per 100,000 rounds. Bars are
// to scale; no numbers are shown yet (they appear in `ladder`).
import { el, span, draw, settle, label, penPath, plan, DESIGN } from '../verbs.js';
import { cryostat, gate, strip } from './parts.js';

const RATE = { standard: 171, network: 143 };

export default {
  steps: [{}, {}],
  mount(svg, ctx) {
    const lay = ctx.layout, tall = lay !== 'wide';
    const [VW, VH] = DESIGN[lay];
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const C = { ink: css('--ink'), muted: css('--muted'), hair: css('--hairline'), accent: css('--accent'), field: css('--field'), paper: css('--paper') };
    const font = (size, fam = 'Libre Franklin, sans-serif') => ({ 'font-family': fam, 'font-size': size });

    // geometry, per layout
    const L = {
      tall: { cry: [20, 14, 100], laneA: 214, laneB: 330, gateX: 124, gateW: 96, barX: 232, barMax: 118, fw: 26, fh: 22 },
      mid: { cry: [16, 8, 80], laneA: 166, laneB: 262, gateX: 120, gateW: 92, barX: 222, barMax: 160, fw: 24, fh: 20 },
      wide: { cry: [40, 26, 140], laneA: 268, laneB: 380, gateX: 300, gateW: 120, barX: 440, barMax: 230, fw: 34, fh: 28 },
    }[lay];
    const g1 = el('g', {}, svg), g2 = el('g', {}, svg);
    const c = cryostat(g1, C, ...L.cry);
    const [bx, by] = c.bottom;
    const lit = (i) => [[0, 1], [], [6], [], [2, 3], [5], [], [1]][i % 8];

    // the strip: down from the cryostat, then right to the first reader
    const A = gate(g1, C, L.gateX, L.laneA - 40 * L.gateW / 120, L.gateW);
    const sA = strip(g1, C, [[bx, by], [bx, L.laneA], [A.inAt[0], L.laneA]], L.fw, L.fh, lit);
    // step 2: the same strip runs on, down to the second reader
    const B = gate(g2, C, L.gateX, L.laneB - 40 * L.gateW / 120, L.gateW);
    const sB = strip(g2, C, [[bx, L.laneA + L.fh / 2], [bx, L.laneB], [B.inAt[0], L.laneB]], L.fw, L.fh, (i) => lit(i + 1));

    // what each reader puts out: a bar of wrong answers, to scale
    const k = L.barMax / RATE.standard;
    const barA = el('path', { d: penPath([[L.barX, L.laneA], [L.barX + RATE.standard * k, L.laneA]]), stroke: C.accent, 'stroke-width': tall ? 9 : 12, fill: 'none' }, svg);
    const barB = el('path', { d: penPath([[L.barX, L.laneB], [L.barX + RATE.network * k, L.laneB]]), stroke: C.accent, 'stroke-width': tall ? 9 : 12, fill: 'none' }, svg);
    const wrong = el('text', { x: L.barX, y: L.laneA - (tall ? 14 : 18), fill: C.muted, ...font(tall ? 14 : 15) }, svg);
    wrong.textContent = 'wrong answers';
    const labA = el('text', { x: L.gateX, y: L.laneA - 40 * L.gateW / 120 - 8, fill: C.ink, ...font(tall ? 14 : 15) }, svg);
    labA.textContent = "Google's best matching";
    const labB = el('text', { x: L.gateX, y: L.laneB + (tall ? 34 : 44), fill: C.ink, ...font(tall ? 14 : 15) }, svg);
    labB.textContent = 'a neural network';
    const same = el('text', { x: bx + L.fh / 2 + 8, y: (L.laneA + L.laneB) / 2 + 4, fill: C.muted, ...font(tall ? 14 : 15) }, svg);
    same.textContent = 'the same film';
    const tag = el('text', { x: VW - 6, y: VH - 8, 'text-anchor': 'end', fill: C.muted, ...font(14, 'JetBrains Mono, monospace') }, svg);
    tag.textContent = 'Google, 2024 · distance 7';

    // plans: parts on a seconds timeline; a step lasts their sum
    const s1 = [
      ...c.strokes.map((_, i) => ({ at: i * 0.04, dur: 0.3 })),     // the cryostat
      { at: 0.75, dur: 0.7 },                                        // the strip runs out
      ...A.strokes.map((_, i) => ({ at: 1.05 + i * 0.05, dur: 0.25 })),
      { at: 1.45, dur: 0.35 },                                       // bar A
      { at: 1.6, dur: 0.25 },                                        // words
    ];
    const s2 = [
      { at: 0, dur: 0.7 },                                           // the strip runs on
      ...B.strokes.map((_, i) => ({ at: 0.4 + i * 0.05, dur: 0.25 })),
      { at: 0.85, dur: 0.35 },                                       // bar B
      { at: 1.05, dur: 0.25 },                                       // words, tag
    ];
    const P1 = plan(s1), P2 = plan(s2);
    const at = (pos, k2, [a, b]) => (pos >= k2 ? 1 : pos <= k2 - 1 ? 0 : span(pos - (k2 - 1), a, b));
    const runStrip = (parts, u) => {
      const total = parts.reduce((t, p) => t + p.len, 0);
      let done = 0;
      for (const p of parts) {
        const v = span(u * total, done, done + p.len);
        p.edges.forEach((e) => draw(e, v));
        p.frames.forEach((f, i) => settle(f, span(v, i / p.frames.length, (i + 1) / p.frames.length)));
        done += p.len;
      }
    };

    function render(pos) {
      let i = 0;
      for (const s of c.strokes) draw(s, at(pos, 1, P1.w(i++)));
      runStrip(sA, at(pos, 1, P1.w(i++)));
      for (const s of A.strokes) draw(s, at(pos, 1, P1.w(i++)));
      draw(barA, at(pos, 1, P1.w(i++)));
      const w1 = at(pos, 1, P1.w(i++));
      label(labA, w1); label(wrong, w1);
      let j = 0;
      runStrip(sB, at(pos, 2, P2.w(j++)));
      for (const s of B.strokes) draw(s, at(pos, 2, P2.w(j++)));
      draw(barB, at(pos, 2, P2.w(j++)));
      const w2 = at(pos, 2, P2.w(j++));
      label(labB, w2); label(same, w2); label(tag, w2);
    }
    return {
      render,
      dur: (k2) => (k2 === 1 ? P1.total : P2.total),
      alone: 2,
      desc: (k2) => (k2 === 1
        ? "A cooled quantum chip sends out a strip of film. One reader, Google's best matching program, reads it and gets some answers wrong."
        : 'The same film goes to a second reader, a neural network, which gets fewer answers wrong.'),
    };
  },
};
