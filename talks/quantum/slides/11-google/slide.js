// Slide 11: Google's result, the article's suppression figure.
import { C, L, R, svgOf, T, frame, articleFigure, inkLayer, PEN } from '../../kit.js';
import * as fig from '../../../../articles/other-half/figures/suppression.js';

const STEPS = [0];
export default {
  id: 'google', n: 11, part: 'Content', builds: STEPS.length, speaker: 'B',
  title: 'On Google’s recordings the network made about one error in six fewer.',
  clicks: ['two decoders, one recording'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “suppression”. Measured: Google Quantum AI, Nature 638 (2025), Sec. II and Table S1. Both decoders read the recordings afterwards.' });
    const F = articleFigure(page, fig, STEPS[b], { x: 460, y: 230, w: 1000 }, data.suppression, { layout: 'wide', textPx: 30 });
    const ink = inkLayer(page);
  },
};
