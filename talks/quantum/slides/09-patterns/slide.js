// Slide 9: all 256 patterns of the eight checks at distance 3
// (syndromes.json), ordered by how many checks fire. Filled: matching's answer
// is less likely than another (24). Grey: two answers exactly as likely (144).
// Open ring: matching's answer is the likeliest (88). The three
// counts are printed large; the marks show where.
import { C, L, svgOf, T, frame, dot } from '../../kit.js';

export default {
  id: 'patterns', n: 9, part: 'Content', builds: 1, speaker: 'B',
  title: 'Matching gives the less likely answer on 24 of the 256 patterns we counted.',
  clicks: ['256 patterns, 24 filled'],
  draw(page, b, data) {
    const svg = svgOf(page);
    const s = data.syndromes;
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Counted by us in exact arithmetic (syndromes.json): distance 3, one round, 5% error per storing qubit (a flip, a phase error or both, each a third of that), checks never wrong.',
    });
    const p = 38, x0 = L + 20, y0 = 320;
    s.cells.forEach((c) => {
      const x = x0 + c.col * p + p / 2, y = y0 + c.row * p + p / 2;
      if (c.state === 'differs') dot(svg, x, y, 14, { fill: C.ink });
      else if (c.state === 'tie-best') dot(svg, x, y, 13, { fill: C.mid });
      else dot(svg, x, y, 12, { fill: 'none', stroke: C.ink, 'stroke-width': 3 });
    });
    const kx = 900, cn = s.counts;
    const row = (y, n, mark, a, bb) => {
      mark(kx + 16, y - 18);
      T(svg, kx + 60, y, String(n), { size: 64, weight: 600 });
      T(svg, kx + 210, y - 26, a, { size: 32, weight: 600 });
      T(svg, kx + 210, y + 12, bb, { size: 32 });
    };
    row(420, cn.differs, (x, y) => dot(svg, x, y, 14, { fill: C.ink }), 'matching’s answer is less likely', 'than another one');
    row(590, cn.tie_best, (x, y) => dot(svg, x, y, 13, { fill: C.mid }), 'two answers exactly as likely:', 'no decoder can do better here');
    row(760, cn.same, (x, y) => dot(svg, x, y, 12, { fill: 'none', stroke: C.ink, 'stroke-width': 3 }), 'matching’s answer', 'is the likeliest');
    const share = s.share_of_all_cases_with_a_differing_pattern;
    T(svg, kx, 900, `The 24 are rare: together under 1 case in 100 (${(share * 100).toFixed(1)}%).`, { size: 32 });
  },
};
