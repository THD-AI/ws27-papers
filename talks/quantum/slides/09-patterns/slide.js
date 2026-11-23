// Slide 9: all 256 patterns, the article's syndromes figure.
import { C, L, R, svgOf, T, frame, articleFigure, inkLayer, PEN } from '../../kit.js';
import * as fig from '../../../../articles/other-half/figures/syndromes.js';

const STEPS = [0];
export default {
  id: 'patterns', n: 9, part: 'Content', builds: STEPS.length, speaker: 'B',
  title: 'Matching gives the less likely answer on 24 of the 256 patterns we counted.',
  clicks: ['256 patterns, 24 filled'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “syndromes”. Counted by us in exact arithmetic: distance 3, one round, 5% error per storing qubit, checks never wrong.' });
    const F = articleFigure(page, fig, STEPS[b], { x: 330, y: 230, w: 1260 }, data.syndromes, { layout: 'wide', textPx: 30 });
    const ink = inkLayer(page);
  },
};
