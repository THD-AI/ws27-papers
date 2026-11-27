// Slide 3: redundancy without copies, sketched: three hand-drawn qubits that
// are only ever all-0 or all-1 together, a brace, and a crossed-out copy.
import { C, L, svgOf, T, frame, inkLayer, PEN } from '../../kit.js';

export default {
  id: 'logical', n: 3, part: 'Preliminaries', builds: 1, speaker: 'A',
  title: 'A logical qubit keeps its value in how its qubits relate.',
  clicks: ['three qubits together; no copy'],
  draw(page) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The simplest code, for flips only; the surface code (next slides) protects against both kinds of error. Article, section 2.' });
    const ink = inkLayer(page);
    const cx0 = 300, pitch = 150;
    T(svg, L, 360, 'three qubits, one stored value', { size: 32, weight: 600 });
    [['0', 500], ['1', 740]].forEach(([v, y], r) => {
      for (let i = 0; i < 3; i++) {
        ink.ellipse(cx0 + i * pitch, y, 104, 104, { seed: 30 + r * 3 + i, strokeWidth: 3.5 });
        T(svg, cx0 + i * pitch, y + 20, v, { size: 56, weight: 500, anchor: 'middle' });
      }
    });
    ink.note(cx0 + pitch - 22, 632, 'or', { size: 40, color: C.muted });
    // a brace: all three, always together
    const bx = cx0 + 2 * pitch + 90;
    ink.curve([[bx, 448], [bx + 34, 470], [bx + 34, 600], [bx + 60, 620], [bx + 34, 640], [bx + 34, 770], [bx, 792]], { seed: 40 });
    ink.note(bx + 80, 600, 'only ever all-0', { size: 38 });
    ink.note(bx + 80, 648, 'or all-1, together', { size: 38 });
    ink.note(bx + 80, 696, '(or both at once)', { size: 32, color: C.muted });
    // the copy that can't exist
    const nx = 1240;
    ink.ellipse(nx + 60, 470, 90, 90, { seed: 41, stroke: C.muted, strokeLineDash: [10, 10] });
    T(svg, nx + 60, 488, '?', { size: 48, anchor: 'middle', fill: C.muted });
    ink.line(nx + 10, 420, nx + 110, 520, { stroke: PEN.red, strokeWidth: 4, seed: 42 });
    ink.line(nx + 110, 420, nx + 10, 520, { stroke: PEN.red, strokeWidth: 4, seed: 43 });
    T(svg, nx + 150, 462, 'No qubit is a copy:', { size: 36, weight: 600 });
    T(svg, nx + 150, 504, 'a state can’t be copied', { size: 32 });
    T(svg, nx + 150, 544, '(no-cloning).', { size: 32 });
    T(svg, nx, 640, 'The surface code does the same', { size: 36, weight: 600 });
    T(svg, nx, 682, 'for flips and for phase errors.', { size: 32 });
    T(svg, nx, 790, 'Every qubit still decoheres:', { size: 36, weight: 600 });
    T(svg, nx, 832, 'errors keep arriving and must be found.', { size: 32 });
  },
};
