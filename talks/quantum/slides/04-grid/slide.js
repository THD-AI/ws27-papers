// Slide 4: the article's margin scene 'what one qubit takes', its states distance 3, 5 and 7, one per click.
import { C, L, R, svgOf, T, frame, articleFigure, inkLayer, PEN } from '../../kit.js';
import * as fig from '../../../../articles/other-half/figures/qubits.js';

const STEPS = [1, 2, 3];
export default {
  id: 'grid', n: 4, part: 'Preliminaries', builds: STEPS.length, speaker: 'A',
  title: 'Only about half of a logical qubit’s qubits store anything.',
  clicks: ['distance 3', 'distance 5', 'distance 7'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s margin figure “what one qubit takes”. Counted: d × d storing qubits and d × d − 1 helpers (the code’s own count).' });
    const F = articleFigure(page, fig, STEPS[b], { x: 560, y: 240, w: 800 }, data.qubits, { layout: 'tall', textPx: 30 });
    const ink = inkLayer(page);
  },
};
