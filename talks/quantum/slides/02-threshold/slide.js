// Slide 2: why correction is needed. The marked scale is a sketch; the
// two numbers come from the published estimate.
import { C, L, svgOf, T, frame, inkLayer, PEN } from '../../kit.js';

export default {
  id: 'threshold', n: 2, part: 'Motivation', builds: 1, speaker: 'A',
  title: 'One uncorrected slip can spoil the answer.',
  clicks: ['the hardware error rate against the size of the job'],
  draw(page) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'Published estimate: Gidney and Ekerå, Quantum 5, 433 (2021). Right: the surface-code threshold, explained in article sections 2 and 7.' });
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

    const tx = 1120;
    T(svg, tx, 405, 'Correction takes more qubits.', { size: 42, weight: 600 });
    T(svg, tx, 502, 'If those qubits are reliable enough,', { size: 36 });
    T(svg, tx, 550, 'a bigger grid protects better.', { size: 36 });
    T(svg, tx, 670, 'That is the threshold.', { size: 36, weight: 600 });
  },
};
