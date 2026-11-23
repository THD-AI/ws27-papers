// Slide 5: what a check reports. The article's own `lattice` figure (the
// version he approved), at its steps 0, 1 and 2, with hand strokes on top
// that point at what each click adds.
import { C, L, svgOf, T, frame, articleFigure, inkLayer, PEN } from '../../kit.js';
import * as lattice from '../../../../articles/other-half/figures/lattice.js';

export default {
  id: 'checks', n: 5, part: 'Preliminaries', builds: 3, speaker: 'A',
  title: 'A check reports whether the number of errors next to it is even or odd.',
  clicks: ['the grid and its two kinds of check', 'one flip: two checks fire', 'a line of two: only its end fires'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “lattice”, steps 1 to 3. Distance 3, one round, checks assumed right. Constructed by us (lattice.json).' });
    articleFigure(page, lattice, b, { x: 150, y: 250, w: 1180 }, data.lattice, { textPx: 26 });
    // one hand note, only on the first click: what the course calls this
    if (b === 0) inkLayer(page).note(1380, 860, 'a parity check: even or odd', { size: 36, color: PEN.blue });
  },
};
