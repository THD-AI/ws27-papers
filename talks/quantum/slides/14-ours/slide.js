// Slide 14: our runs. The article's own `learning` figure at its steps 0, 1
// and 2 (distance 3; distance 5 after 66 million; after about 250 million),
// with one hand stroke per click at the number that click is about.
import { C, svgOf, frame, articleFigure, inkLayer, PEN } from '../../kit.js';
import * as learning from '../../../../articles/other-half/figures/learning.js';

export default {
  id: 'ours', n: 14, part: 'Content', builds: 3, speaker: 'B',
  title: 'Ours passed plain matching at distance 5 only after about 250 million examples.',
  clicks: ['distance 3', 'distance 5 after 66 million', 'distance 5 after about 250 million'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'The article’s figure “learning”. Simulated, our own runs at 0.5% per operation (OWN-D3, OWN-D5, OWN-D5-250M): share of runs (3 rounds at distance 3, 5 at distance 5) that ended wrong.' });
    articleFigure(page, learning, b, { x: 330, y: 250, w: 1320 }, data.learning, { textPx: 26 });
    const ink = inkLayer(page);
    if (b === 2) ['only after', 'about 250', 'million'].forEach((s, i) => ink.note(120, 560 + i * 46, s, { color: PEN.red, size: 38 }));
  },
};
