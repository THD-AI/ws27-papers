// Slide 15: the course's four properties for the neural decoder, as ruled
// rows with one number each; then the stop rule's outcome.
import { C, L, R, svgOf, T, frame, ln } from '../../kit.js';

export default {
  id: 'properties', n: 15, part: 'Close', builds: 2, speaker: 'C',
  title: 'A decoder gives no quantum speed-up, but its accuracy changes how big a useful machine must be.',
  clicks: ['four properties', 'what the stop rule decided'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Performance and availability: our runs at 0.5% (OWN-D5-250M). Relevance: Google Quantum AI, Nature 638 (2025); 97 to 161 qubits, our arithmetic. AlphaQubit 2: arXiv:2512.07737, not peer-reviewed.',
    });
    const p = data.learning.panels[2];
    const rows = [
      ['Performance', `ours at distance 5: ${(p.final_network.mean * 100).toFixed(2)}%`, `correlated matching ${(p.levels.correlated.rate * 100).toFixed(2)}%, plain ${(p.levels.plain.rate * 100).toFixed(2)}%`],
      ['Speed-up', 'none', 'it is classical software that serves the chip'],
      ['Relevance', 'Λ from 2.04 to 2.14, by the reader alone', 'at Λ near 2, one more halving costs 64 qubits (97 to 161)'],
      ['Availability', 'about 250 million examples to pass plain matching', 'correlated matching is free; live speed is only claimed so far'],
    ];
    const y0 = 340, hh = 128;
    rows.forEach(([k, a, c], i) => {
      const y = y0 + i * hh;
      ln(svg, L, y, R, y, { stroke: C.hair, 'stroke-width': 2 });
      T(svg, L, y + 54, k, { size: 36, weight: 600 });
      T(svg, L + 330, y + 54, a, { size: 40, weight: 600 });
      T(svg, L + 330, y + 98, c, { size: 32 });
    });
    ln(svg, L, y0 + 4 * hh, R, y0 + 4 * hh, { stroke: C.hair, 'stroke-width': 2 });
    if (b >= 1) {
      T(svg, L, 900, 'By our stop rule the idea survives: a laptop could train it, in under two hours per seed.', { size: 32, weight: 600 });
      T(svg, L, 944, 'The second test, Google’s real recordings, is still open.', { size: 32 });
    }
  },
};
