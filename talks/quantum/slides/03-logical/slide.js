// Slide 3: redundancy without copies. Three qubits that are only ever all-0
// or all-1 together; drawn as the article's open qubit circles.
import { C, L, svgOf, T, frame, ln, pth, dot } from '../../kit.js';

export default {
  id: 'logical', n: 3, part: 'Preliminaries', builds: 1, speaker: 'A',
  title: 'A logical qubit keeps its value in how its qubits relate.',
  clicks: ['three qubits together; no copy'],
  draw(page, b) {
    const svg = svgOf(page);
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'The simplest code, for flips only; the surface code (next slides) protects against both kinds of error. Article, section 2.',
    });
    const cx0 = 300, pitch = 150, r = 52;
    T(svg, L, 380, 'three qubits, one stored value', { size: 32, weight: 600 });
    [['0', 520], ['1', 760]].forEach(([v, y]) => {
      for (let i = 0; i < 3; i++) {
        dot(svg, cx0 + i * pitch, y, r, { fill: C.paper, stroke: C.ink, 'stroke-width': 4 });
        T(svg, cx0 + i * pitch, y + 20, v, { size: 56, weight: 500, anchor: 'middle' });
      }
    });
    T(svg, cx0 + pitch, 652, 'or', { size: 36, anchor: 'middle', fill: C.muted });
    // the bracket: always all three together
    const bx = cx0 + 2 * pitch + r + 50;
    pth(svg, `M${bx} ${520 - r} q 30 0 30 30 L ${bx + 30} ${760 + r - 30} q 0 30 -30 30`);
    T(svg, bx + 60, 628, 'only ever all-0', { size: 36, weight: 600 });
    T(svg, bx + 60, 676, 'or all-1, together', { size: 36, weight: 600 });
    T(svg, bx + 60, 724, '(or both at once)', { size: 32, fill: C.muted });
    const nx = 1180;
    ln(svg, nx - 60, 420, nx - 60, 880, { stroke: C.hair, 'stroke-width': 2 });
    T(svg, nx, 470, 'No qubit is a copy.', { size: 40, weight: 600 });
    T(svg, nx, 518, 'A quantum state can’t be copied', { size: 32 });
    T(svg, nx, 558, '(no-cloning), and no copy exists here.', { size: 32 });
    T(svg, nx, 660, 'The surface code does the same', { size: 40, weight: 600 });
    T(svg, nx, 708, 'for flips and for phase errors.', { size: 32 });
    T(svg, nx, 810, 'Every qubit still decoheres:', { size: 40, weight: 600 });
    T(svg, nx, 858, 'errors keep arriving and must be found.', { size: 32 });
  },
};
