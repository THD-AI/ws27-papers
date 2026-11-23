// Slide 4: the surface code at distances 3, 5, 7, all at one pitch so the
// growth shows; storing qubits as open circles, helpers as dots on the tiles.
import { C, L, svgOf, T, frame, slideGrid, surface, dot } from '../../kit.js';

export default {
  id: 'grid', n: 4, part: 'Preliminaries', builds: 3, speaker: 'A',
  title: 'Only about half of a logical qubit’s qubits store anything.',
  clicks: ['distance 3', 'distance 5', 'distance 7'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Counted: d × d storing qubits and d × d − 1 helpers, 2d² − 1 in all (the code’s own count). Article, section 3.',
    });
    // legend, once
    dot(svg, L + 18, 330, 15, { fill: C.paper, stroke: C.ink, 'stroke-width': 3 });
    T(svg, L + 48, 342, 'storing qubit', { size: 32 });
    dot(svg, L + 330, 330, 7, { fill: C.ink });
    T(svg, L + 352, 342, 'helper, which asks a check', { size: 32 });
    const pitch = 62, cy = 610;
    const rows = data.qubits.rows.filter((r) => [3, 5, 7].includes(r.distance));
    [[3, 330], [5, 820], [7, 1450]].forEach(([d, cx], i) => {
      if (i > b) return;
      slideGrid(svg, { checks: surface(d), d, cx, cy, pitch, qr: 10 });
      const row = rows.find((r) => r.distance === d) || {};
      const total = row.total ?? 2 * d * d - 1;
      T(svg, cx, 900, String(total), { size: 64, weight: 600, anchor: 'middle' });
      T(svg, cx, 966, `distance ${d}: ${d * d} store, ${d * d - 1} help`, { size: 32, anchor: 'middle', fill: C.muted });
    });
  },
};
