// Slide 5: what a check reports. The article's own `lattice` figure (the
// version he approved), at its steps 0, 1 and 2, with hand strokes on top
// that point at what each click adds.
import { C, svgOf, T, frame, articleFigure } from '../../kit.js';
import * as lattice from '../../../../articles/other-half/figures/lattice.js';

export default {
  id: 'checks', n: 5, part: 'Preliminaries', builds: 3, speaker: 'A',
  title: 'A check fires when its answer changes.',
  clicks: ['the grid and its two kinds of check', 'one flip: two checks fire', 'a line of two: only its end fires'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “lattice”, steps 1 to 3. Distance 3, one round, checks assumed right. Constructed by us (lattice.json).' });
    articleFigure(page, lattice, b, { x: 150, y: 250, w: 1180 }, data.lattice, { textPx: 26 });
    const x = 1290;
    T(svg, x, 355, 'Check answer', { size: 42, weight: 600 });
    T(svg, x, 414, 'Parity of the neighbours.', { size: 34 });
    T(svg, x, 540, 'Detection event', { size: 42, weight: 600, fill: C.accent });
    T(svg, x, 599, 'A different answer from', { size: 34 });
    T(svg, x, 645, 'the previous round.', { size: 34 });
    if (b === 1) T(svg, x, 800, 'One flip. Two checks fire.', { size: 34, weight: 600 });
    if (b === 2) {
      T(svg, x, 800, 'Two flips. Just one check', { size: 34, weight: 600 });
      T(svg, x, 846, 'fires at the top end.', { size: 34, weight: 600 });
    }
  },
};
