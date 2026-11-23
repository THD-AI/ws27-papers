// Slide 7: matching as a pairing puzzle, the article's lattice at step 3.
import { C, L, R, svgOf, T, frame, articleFigure, inkLayer, PEN } from '../../kit.js';
import * as fig from '../../../../articles/other-half/figures/lattice.js';

const STEPS = [3];
export default {
  id: 'matching', n: 7, part: 'Preliminaries', builds: STEPS.length, speaker: 'A',
  title: 'The standard decoder, matching, pairs fired checks along the cheapest lines.',
  clicks: ['the pairing puzzle'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “lattice”, step 4. Distance 3, one round shown; real decoders pair across rounds. Fast exact methods: Higgott and Gidney, Sparse Blossom (2025).' });
    const F = articleFigure(page, fig, STEPS[b], { x: 200, y: 250, w: 1180 }, data.lattice, { layout: 'wide', textPx: 30 });
    const ink = inkLayer(page);
  },
};
