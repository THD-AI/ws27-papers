// Slide 10: one fired-check pattern, then the two lowest-weight ways to
// reach the more likely logical outcome. The article supplies the examples.
import { C, L, R, svgOf, T, frame, slideGrid, errMark, ln } from '../../kit.js';

const pct = (chance) => `${(chance * 100).toFixed(1)}%`;
export default {
  id: 'two-ways', n: 10, part: 'Content', builds: 2, speaker: 'B',
  title: 'Two likely error patterns point to the same logical outcome.',
  clicks: ['the three fired checks and plain matching’s choice', 'the two leading cases and their total'],
  draw(page, b, { lattice }) {
    const svg = svgOf(page);
    frame(svg, {
      title: b === 0 ? 'Three checks fire. Plain matching picks one explanation.' : this.title,
      n: this.n, part: this.part,
      source: 'Our enumeration (OWN-ENUM). All probabilities are conditional on the three fired checks. Distance 3, 5% error per storing qubit, one round, perfect checks.',
    });
    const { example, checks, distance } = lattice;
    const { fired, plain_matching: plain, read_together: combined } = example;
    const centerText = (x, y, text, options = {}) =>
      T(svg, x, y, text, { size: 34, anchor: 'middle', ...options });
    T(svg, L, 288, 'Chances given these three fired checks', { size: 34, fill: C.muted });
    const pitch = 96;
    const plate = (x, title, errors) => {
      centerText(x, 376, title, { size: 36, weight: 600 });
      const grid = slideGrid(svg, { checks, d: distance, cx: x, cy: 550, pitch });
      for (const id of fired) grid.tiles[id].setFired(1);
      for (const [qubit, letter] of Object.entries(errors)) {
        errMark(grid.gE, ...grid.pos(Number(qubit)), 25, letter, 'added');
      }
    };
    const observedX = 310, matchingX = 725;
    plate(observedX, 'What the chip reports', {});
    plate(matchingX, 'Plain matching', plain.errors);
    centerText(observedX, 739, `${fired.length} checks fire`, { weight: 600, fill: C.accent });
    centerText(matchingX, 739, `${pct(plain.chance_right)} chance of being right`, { size: 32, weight: 600 });
    T(svg, L, 946, 'X = flip · Z = phase error · Y = both', { size: 32 });
    T(svg, R, 946, 'Toy model · one round · perfect checks', { size: 32, anchor: 'end' });
    if (b === 0) {
      centerText(1370, 533, 'What else could fire', { size: 42, weight: 600 });
      centerText(1370, 586, 'the same three checks?', { size: 42, weight: 600 });
      return;
    }

    const xs = [1160, 1575];
    ln(svg, 952, 337, 952, 868, { stroke: C.hair, 'stroke-width': 2 });
    combined.minimum_weight_cases.forEach((errors, i) => {
      plate(xs[i], i === 0 ? 'Z in the corner' : 'Z one place up', errors);
      centerText(xs[i], 739, pct(combined.chance_per_minimum_weight_case), { weight: 600 });
    });
    ln(svg, 1010, 780, R, 780, { 'stroke-width': 3 });
    const mid = (1010 + R) / 2;
    centerText(mid, 834, `${pct(combined.chance_of_minimum_weight_cases)} for these two patterns`, { size: 38, weight: 600 });
    centerText(mid, 887, `${pct(combined.chance_right)} including rarer patterns`, { size: 34 });
  },
};
