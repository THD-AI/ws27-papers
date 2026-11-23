// Backup 5: the long run at eight noise levels, the article's noise figure.
import { C, L, R, svgOf, T, frame, articleFigure, inkLayer, PEN } from '../../kit.js';
import * as fig from '../../../../articles/other-half/figures/noise.js';

const STEPS = [0];
export default {
  id: 'noise-table', n: 'B5', backup: true, part: 'Backup', builds: STEPS.length, speaker: 'B',
  title: 'Distance 5: the network against both matchers at eight noise levels.',
  clicks: ['backup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “noise”. Simulated, our own runs (OWN-D5-250M): five seeds pooled, 10 million runs per noise level, 95% intervals.' });
    const F = articleFigure(page, fig, STEPS[b], { x: 200, y: 220, w: 1520 }, data.noise, { layout: 'wide', textPx: 30 });
    const ink = inkLayer(page);
  },
};
