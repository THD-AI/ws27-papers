// Slide 11: Google's measured suppression (suppression.json): logical errors
// per 100,000 rounds at distances 3, 5, 7, read afterwards by two decoders.
// Ink: Google's best matching decoder; accent: the neural network.
import { C, L, svgOf, T, frame, ln, pth, dot } from '../../kit.js';

export default {
  id: 'google', n: 11, part: 'Content', builds: 2, speaker: 'C',
  title: 'On Google’s recordings the network made about one error in six fewer.',
  clicks: ['Google’s best matching decoder', 'the network'],
  draw(page, b, data) {
    const svg = svgOf(page);
    const [m, nn] = data.suppression.decoders;
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Measured: Google Quantum AI, Nature 638 (2025), Sec. II and Table S1. Both decoders read the recordings afterwards. Distances 3 and 5 average 9 and 4 smaller grids on the same chip.',
    });
    const x0 = L + 140, x1 = 1060, y0 = 330, y1 = 900;
    const lo = Math.log10(100), hi = Math.log10(1000);
    const Y = (v) => y1 - ((Math.log10(v) - lo) / (hi - lo)) * (y1 - y0);
    const X = (d) => x0 + 60 + ((d - 3) / 4) * (x1 - x0 - 160);
    ln(svg, x0, y0 - 10, x0, y1); ln(svg, x0, y1, x1, y1);
    [100, 200, 500, 1000].forEach((v) => { ln(svg, x0 - 12, Y(v), x0, Y(v)); T(svg, x0 - 22, Y(v) + 12, String(v), { size: 32, anchor: 'end', fill: C.ink }); });
    [3, 5, 7].forEach((d) => { ln(svg, X(d), y1, X(d), y1 + 12); T(svg, X(d), y1 + 50, `distance ${d}`, { size: 32, anchor: 'middle' }); });
    T(svg, L, y0 - 40, 'logical errors per 100,000 rounds (log scale)', { size: 32, weight: 600 });
    const draw = (dec, col) => {
      const pts = dec.points.map((p) => [X(p.distance), Y(p.per_100000_rounds)]);
      pth(svg, `M${pts.map((p) => p.join(' ')).join('L')}`, { stroke: col, 'stroke-width': 5 });
      pts.forEach(([px, py]) => dot(svg, px, py, 11, { fill: col }));
      const last = dec.points[2];
      // matching's value above its point, the network's below, so the two never meet
      const up = col === C.ink;
      T(svg, X(7) + 26, Y(last.per_100000_rounds) + (up ? -14 : 50), String(last.per_100000_rounds), { size: 56, weight: 600, fill: col });
    };
    draw(m, C.ink);
    const tx = 1260;
    T(svg, tx, 420, 'Google’s best matching decoder', { size: 36, weight: 600 });
    T(svg, tx, 462, 'it links the two kinds of check', { size: 32 });
    T(svg, tx, 502, 'in a limited way. Λ = ' + m.lambda.toFixed(2), { size: 32 });
    if (b >= 1) {
      draw(nn, C.accent);
      T(svg, tx, 620, 'a neural network', { size: 36, weight: 600, fill: C.accent });
      T(svg, tx, 662, 'trained on simulations, then', { size: 32 });
      T(svg, tx, 702, 'on the chip’s own data. Λ = ' + nn.lambda.toFixed(2), { size: 32 });
      T(svg, tx, 820, 'Same chip, same recordings:', { size: 32, weight: 600 });
      T(svg, tx, 860, 'only the reader changed.', { size: 32, weight: 600 });
    }
  },
};
