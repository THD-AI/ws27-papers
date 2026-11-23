// Slide 9: the article's 256 check patterns, at projector scale.
import { C, L, svgOf, T, frame, h } from '../../kit.js';

export default {
  id: 'patterns', n: 9, part: 'Content', builds: 1, speaker: 'B',
  title: 'We counted patterns and how often they occur.',
  clicks: ['distinct patterns and their share of rounds'],
  draw(page, b, { syndromes }) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'Our enumeration (OWN-ENUM). Distance 3, one round, 5% error per storing qubit, perfect checks.' });
    const x = L, y = 310, step = 36, mark = 25;
    for (const cell of syndromes.cells) {
      const differs = cell.state === 'differs';
      h('rect', {
        x: x + cell.col * step,
        y: y + cell.row * step,
        width: mark,
        height: mark,
        fill: differs ? C.ink : 'none',
        stroke: differs ? 'none' : C.mid,
        'stroke-width': 2,
      }, svg);
    }
    T(svg, x, 279, 'One square per distinct pattern', { size: 34, weight: 600 });
    const tx = 855;
    h('rect', { x: tx - 46, y: 345, width: mark, height: mark, fill: C.ink }, svg);
    const { differs, patterns } = syndromes.counts;
    const share = (syndromes.share_of_all_cases_with_a_differing_pattern * 100).toFixed(1);
    T(svg, tx, 383, `${differs} of ${patterns}`, { size: 76, weight: 600 });
    T(svg, tx, 445, 'distinct patterns where plain matching', { size: 39 });
    T(svg, tx, 497, 'gives a less likely answer.', { size: 39 });
    T(svg, tx, 678, `About ${share}%`, { size: 76, weight: 600 });
    T(svg, tx, 740, 'of rounds show one of those patterns', { size: 39 });
    T(svg, tx, 792, 'under the toy noise model.', { size: 39 });
  },
};
