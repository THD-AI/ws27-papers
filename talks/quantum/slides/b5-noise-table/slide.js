import { L, R, svgOf, backup } from '../../kit.js';

// Backup 5: distance 5, network trained on about 250 million examples, at
// eight noise levels (noise.json): the share of runs wrong, five seeds pooled.
const pc = (v) => `${(v * 100 + 1e-9).toFixed(v < 0.0005 ? 4 : 3)}%`;  // as the article rounds
export default {
  id: 'noise-table', n: 'B5', backup: true, builds: 1,
  title: 'Distance 5: the network against both matchers at eight noise levels.',
  clicks: ['backup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    const rows = data.noise.rows.map((r) => [`${(r.p * 100).toFixed(1)}%`, pc(r.network.pooled.rate), pc(r.plain.pooled ? r.plain.pooled.rate : r.plain.rate), pc(r.correlated.pooled ? r.correlated.pooled.rate : r.correlated.rate)]);
    backup(svg, { title: this.title, n: this.n, source: 'Simulated, our own runs (OWN-D5-250M): five seeds pooled, 10 million runs per noise level. Intervals in the article.' },
      { y0: 290, table: { head: ['noise level', 'network', 'plain matching', 'correlated matching'], rows, xs: [L, 760, 1220, R] } });
  },
};
