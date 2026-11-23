// Slide 12: one time line, the article's clock at its steps.
import { C, L, R, svgOf, T, frame, articleFigure, inkLayer, PEN } from '../../kit.js';
import * as fig from '../../../../articles/other-half/figures/clock.js';

const STEPS = [2, 4];
export default {
  id: 'clock', n: 12, part: 'Content', builds: STEPS.length, speaker: 'B',
  title: 'The network needed 24 millionths of a second for a round the chip finishes in 1.1.',
  clicks: ['rounds pile up', 'the end of a run: live matching kept pace'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “clock”. Google Quantum AI, Nature 638 (2025), Sec. V: round time and live matching measured; the network’s 24 quoted from earlier work. Preprint: arXiv:2512.07737, not reviewed.' });
    const F = articleFigure(page, fig, STEPS[b], { x: 200, y: 240, w: 1520 }, data.clock, { layout: 'wide', textPx: 30 });
    const ink = inkLayer(page);
  },
};
