// Slide 6: the article's film, steps 0 to 2.
import { C, L, svgOf, T, frame, articleFigure } from '../../kit.js';
import * as fig from '../../../../articles/other-half/figures/film.js';

const STEPS = [0, 1, 2];
export default {
  id: 'film', n: 6, part: 'Preliminaries', builds: STEPS.length, speaker: 'A',
  title: 'One film frame shows what changed in that round.',
  clicks: ['the film and its enlarged frame', 'what the film is', 'what a frame says'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “film”. Simulated by us with Stim at distance 7, 0.5% error per operation. Round time measured: Google Quantum AI, Nature 638 (2025).' });
    articleFigure(page, fig, STEPS[b], { x: 560, y: 225, w: 800 }, data.film, { layout: 'tall', textPx: 30 });
    if (b >= 1) {
      T(svg, L, 456, '1.1 μs', { size: 58, weight: 600 });
      T(svg, L, 518, 'per round of checks', { size: 34 });
    }
    if (b === 2) {
      T(svg, 1390, 430, 'A blue dot marks', { size: 34, weight: 600, fill: C.accent });
      T(svg, 1390, 476, 'a changed answer.', { size: 34 });
    }
  },
};
