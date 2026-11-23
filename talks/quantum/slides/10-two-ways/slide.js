// Slide 10: one of the 24, the article's lattice at steps 4 and 5.
import { C, L, R, svgOf, T, frame, articleFigure, inkLayer, PEN } from '../../kit.js';
import * as fig from '../../../../articles/other-half/figures/lattice.js';

const STEPS = [4, 5];
export default {
  id: 'two-ways', n: 10, part: 'Content', builds: STEPS.length, speaker: 'B',
  title: 'The Y answer is right six times in ten because it can happen in two ways.',
  clicks: ['plain matching’s answer', 'the Y answer, two ways'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “lattice”, steps 5 and 6. Counted by us: distance 3, one round, 5% error per storing qubit, far above a real chip; checks never wrong.' });
    const F = articleFigure(page, fig, STEPS[b], { x: 200, y: 250, w: 1520 }, data.lattice, { layout: 'wide', textPx: 30 });
    const ink = inkLayer(page);
  },
};
