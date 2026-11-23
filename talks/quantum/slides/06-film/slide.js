// Slide 6: the article's film, steps 0 to 2.
import { C, L, R, svgOf, T, frame, articleFigure, inkLayer, PEN } from '../../kit.js';
import * as fig from '../../../../articles/other-half/figures/film.js';

const STEPS = [0, 1, 2];
export default {
  id: 'film', n: 6, part: 'Preliminaries', builds: STEPS.length, speaker: 'A',
  title: 'The chip puts out a film of fired checks, one frame per round.',
  clicks: ['the film and its enlarged frame', 'what the film is', 'what a frame says'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “film”. Simulated by us with Stim at distance 7, 0.5% error per operation. Round time measured: Google Quantum AI, Nature 638 (2025).' });
    const F = articleFigure(page, fig, STEPS[b], { x: 560, y: 225, w: 800 }, data.film, { layout: 'tall', textPx: 30 });
    const ink = inkLayer(page);
  },
};
