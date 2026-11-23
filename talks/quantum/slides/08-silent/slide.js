// Slide 8: the one mistake that matters, the article's line figure.
import { C, L, R, svgOf, T, frame, articleFigure, inkLayer, PEN } from '../../kit.js';
import * as fig from '../../../../articles/other-half/figures/line.js';

const STEPS = [0];
export default {
  id: 'silent', n: 8, part: 'Preliminaries', builds: STEPS.length, speaker: 'A',
  title: 'Errors plus a wrong correction can cross the grid without firing a single check.',
  clicks: ['what happened, what the chip reports, what the decoder adds'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “line”. Distance 5, flip-checks only, one round, checks assumed right. Constructed and checked by our script.' });
    const F = articleFigure(page, fig, STEPS[b], { x: 360, y: 230, w: 1200 }, data.line, { layout: 'wide', textPx: 30 });
    const ink = inkLayer(page);
  },
};
