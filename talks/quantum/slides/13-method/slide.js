// Slide 13: what we ran, as five ruled rows (no boxes, no arrows).
import { C, L, R, svgOf, T, frame, ln } from '../../kit.js';

export default {
  id: 'method', n: 13, part: 'Content', builds: 2, speaker: 'C',
  title: 'We trained a small network in simulation and wrote down our stop rule first.',
  clicks: ['data and network', 'the baselines, the table, the stop rule'],
  draw(page, b) {
    const svg = svgOf(page);
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Our own runs (OWN-D3, OWN-D5, OWN-D5-250M): 8 seeds at distance 3, 5 at distance 5; every decoder reads the same 2 million fresh test runs per noise level; one kind of stored value. Stim (Gidney 2021), PyMatching 2.4.0.',
    });
    const rows = [
      ['Data', 'Stim, a free simulator from Google: the same chance of error on every operation.', 'Trained at seven levels from 0.2% to 1%; tested at 0.5%.'],
      ['Network', 'Three layers of 256 units. It sees only which checks fired,', 'never the grid’s layout, and answers: was the value flipped?'],
      ['Baselines', 'Plain matching, and correlated matching: two passes, the first', 'informs the second. Both get the exact error model, which favours them.'],
      ['Best possible', 'At distance 3 a lookup table of the commoner answer for every', 'pattern, from 200 million runs: our estimate of the best possible.'],
      ['Stop rule', 'Written first: drop the idea if a laptop can’t train it at distance 5,', 'or if it loses on real recordings.'],
    ];
    const y0 = 330, h = 128, cx = L + 300;
    rows.forEach(([k, a, c], i) => {
      if (i >= 2 && b < 1) return;
      const y = y0 + i * h;
      ln(svg, L, y, R, y, { stroke: C.hair, 'stroke-width': 2 });
      T(svg, L, y + 52, k, { size: 36, weight: 600 });
      T(svg, cx, y + 52, a, { size: 32 });
      T(svg, cx, y + 94, c, { size: 32 });
    });
  },
};
