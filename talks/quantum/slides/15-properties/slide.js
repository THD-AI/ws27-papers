// Slide 15: the course's four properties for the neural decoder, as ruled
// rows with one number each; then the stop rule's outcome.
import { C, L, R, svgOf, T, frame, ln, inkLayer, PEN } from '../../kit.js';

export default {
  id: 'properties', n: 15, part: 'Close', builds: 2, speaker: 'B',
  title: 'A decoder gives no quantum speed-up, but its accuracy changes how big a useful machine must be.',
  clicks: ['four properties', 'what the stop rule decided'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Performance and availability: our runs at 0.5%, share of simulated runs of five rounds that ended wrong (OWN-D5-250M). Relevance: Google Quantum AI, Nature 638 (2025); 97 to 161 qubits, our arithmetic. AlphaQubit 2: arXiv:2512.07737, not peer-reviewed.',
    });
    const p = data.learning.panels[2];
    const rows = [
      ['Performance', `ours at distance 5: ${(p.final_network.mean * 100).toFixed(2)}% of runs wrong`, `correlated matching ${(p.levels.correlated.rate * 100).toFixed(2)}%, plain ${(p.levels.plain.rate * 100).toFixed(2)}%`],
      ['Speed-up', 'none', 'it is classical software that serves the chip'],
      ['Relevance', 'on Google’s data: Λ from 2.04 to 2.14, the reader alone', 'at Λ near 2, one more halving costs 64 qubits (97 to 161)'],
      ['Availability', 'about 250 million examples to pass plain matching', 'correlated matching is free; a network at live speed is only claimed'],
    ];
    const y0 = 330, hh = 118;
    const boxA = [], boxC = [];
    rows.forEach(([k, a, c], i) => {
      const y = y0 + i * hh;
      ln(svg, L, y, R, y, { stroke: C.hair, 'stroke-width': 2 });
      T(svg, L, y + 54, k, { size: 36, weight: 600 });
      boxA.push(T(svg, L + 330, y + 54, a, { size: 40, weight: 600 }));
      boxC.push(T(svg, L + 330, y + 98, c, { size: 32 }));
    });
    ln(svg, L, y0 + 4 * hh, R, y0 + 4 * hh, { stroke: C.hair, 'stroke-width': 2 });
    // hand marks, as on a marked-up table: a cross for no speed-up, a ring
    // round the number the reader moved, a wavy underline for what's open
    const ink = inkLayer(page);
    ink.line(L + 290, y0 + hh + 24, L + 316, y0 + hh + 58, { stroke: PEN.red, strokeWidth: 4, seed: 71 });
    ink.line(L + 316, y0 + hh + 24, L + 290, y0 + hh + 58, { stroke: PEN.red, strokeWidth: 4, seed: 72 });
    // ring round "2.04 to 2.14", measured from the drawn words
    const w1 = boxA[2].find('2.04'), w2 = boxA[2].find('2.14,');
    if (w1 && w2) ink.ellipse((w1.x + w2.x + w2.w) / 2, w1.cy, (w2.x + w2.w - w1.x) + 60, 70, { stroke: PEN.blue, seed: 73 });
    // a wavy underline under the availability line, inside its own row
    const a3 = boxA[3], yU = a3.bottom - 2;
    ink.curve([[a3.x, yU], [a3.x + a3.w * 0.35, yU + 6], [a3.x + a3.w * 0.7, yU - 3], [a3.x + a3.w, yU + 4]], { stroke: PEN.orange, seed: 74 });
    if (b >= 1) {
      T(svg, L, 872, 'Our stop rule’s first test is passed: by our timing a laptop would train it in under two hours per seed.', { size: 32, weight: 600 });
      T(svg, L, 916, 'Its second test, on Google’s real recordings, is still open; correlated matching stays ahead.', { size: 32 });
    }
  },
};
