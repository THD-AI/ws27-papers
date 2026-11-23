// Slide 2: why correction is needed, then the threshold. Both halves are
// sketches (Excalidraw strokes, rough.js): a schematic is drawn by hand so it
// can't be mistaken for data; the numbers stay in type.
import { C, L, svgOf, T, frame, inkLayer, PEN } from '../../kit.js';

export default {
  id: 'threshold', n: 2, part: 'Motivation', builds: 1, speaker: 'A',
  title: 'A bigger grid helps when each qubit is below the threshold.',
  clicks: ['slips against steps; the threshold, sketched'],
  draw(page) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'Published estimate: Gidney and Ekerå, Quantum 5, 433 (2021). Right: a sketch, no scale; the measured notes from Google Quantum AI, Nature 614 (2023) and Nature 638 (2025).' });
    const ink = inkLayer(page);
    // left: one log axis of counts, 1 to 10^10
    const x0 = 170, x1 = 940, y = 610, X = (e) => x0 + (e / 10) * (x1 - x0);
    T(svg, L, 350, 'How many steps, on a log scale', { size: 32, weight: 600 });
    ink.arrow([[x0 - 20, y], [x1 + 30, y]], { seed: 2, head: 22 });
    [[0, '1'], [3, '1,000'], [6, 'a million'], [9, 'a billion']].forEach(([e, s], i) => {
      ink.line(X(e), y - 14, X(e), y + 14, { seed: 10 + i });
      T(svg, X(e), y + 58, s, { size: 32, anchor: 'middle', fill: C.muted });
    });
    ink.ellipse(X(3), y, 30, 30, { fill: PEN.ink, fillStyle: 'solid', seed: 4 });
    T(svg, X(3), y - 100, 'one slip', { size: 36, weight: 600, anchor: 'middle' });
    T(svg, X(3), y - 56, 'in about 1,000 operations', { size: 32, anchor: 'middle' });
    ink.rect(X(9.3) - 4, y - 20, X(9.48) - X(9.3) + 8, 40, { fill: PEN.red, fillStyle: 'solid', stroke: PEN.red, seed: 5 });
    T(svg, X(9.4), y - 100, '2–3 billion', { size: 36, weight: 600, anchor: 'middle' });
    T(svg, X(9.4), y - 56, 'costly steps', { size: 32, anchor: 'middle' });
    ink.curve([[X(3) + 10, y + 112], [X(6), y + 156], [X(9.3), y + 112]], { stroke: PEN.red, seed: 6 });
    ink.note(X(3.4), y + 214, 'millions of slips where one is enough', { color: PEN.red, size: 36 });
    T(svg, x0 - 50, y + 300, 'Each step is built from many operations, and one', { size: 32 });
    T(svg, x0 - 50, y + 340, 'uncorrected slip can spoil the answer.', { size: 32 });

    // right: the threshold, a sketch with no scale
    const sx0 = 1110, sy0 = 360, sy1 = 760, sx1 = 1760;
    ink.arrow([[sx0, sy1], [sx0, sy0 - 20]], { seed: 21, head: 22 });
    ink.arrow([[sx0, sy1], [sx1, sy1]], { seed: 22, head: 22 });
    ink.note(sx0 + 20, sy0 - 26, 'logical error (a sketch, no scale)', { size: 32 });
    const D = [3, 5, 7], DX = (d) => sx0 + 90 + ((d - 3) / 4) * 360;
    D.forEach((d) => T(svg, DX(d), sy1 + 50, String(d), { size: 32, anchor: 'middle' }));
    T(svg, DX(5), sy1 + 92, 'distance (grid size)', { size: 32, anchor: 'middle', fill: C.muted });
    const y3 = 540;
    ink.curve(D.map((d, i) => [DX(d), y3 - i * 70]), { stroke: PEN.red, strokeLineDash: [14, 12], seed: 23 });
    ink.curve(D.map((d, i) => [DX(d), y3 + i * 90]), { stroke: PEN.blue, seed: 24 });
    ink.note(DX(7) + 20, y3 - 150, 'above the', { color: PEN.red, size: 34 });
    ink.note(DX(7) + 20, y3 - 110, 'threshold', { color: PEN.red, size: 34 });
    ink.note(DX(7) + 20, y3 + 196, 'below it', { color: PEN.blue, size: 34 });
    ink.note(DX(3) + 40, y3 + 150, '÷ Λ per step', { color: PEN.blue, size: 34 });
    T(svg, sx0, 910, 'Google, measured: in 2023 distance 5 just beat 3;', { size: 32 });
    T(svg, sx0, 954, 'in 2024 the error about halved at each step.', { size: 32 });
  },
};
