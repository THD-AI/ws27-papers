// Slide 10: one of the 24 (lattice.json example). Three fired checks; plain
// matching's answer (a flip in one corner, a phase error in the centre) is
// right 1 time in 3; the answer read together (Y in that corner, a phase
// error on the right, which can sit in two places) is right about 6 in 10.
// Under each answer 30 dots: how often it is right, counted in thirtieths.
import { C, svgOf, T, frame, slideGrid, errMark, dot } from '../../kit.js';

export default {
  id: 'two-ways', n: 10, part: 'Content', builds: 2, speaker: 'B',
  title: 'The Y answer is right six times in ten because it can happen in two ways.',
  clicks: ['the pattern and plain matching', 'the Y answer, two ways'],
  draw(page, b, data) {
    const svg = svgOf(page);
    const d = data.lattice, ex = d.example;
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Counted by us (lattice.json): distance 3, one round, 5% error per storing qubit, far above a real chip; checks never wrong. The rest of the cases are rarer explanations.',
    });
    const pitch = 100, cy = 560;
    const grids = [[360, 'the checks that fired'], [960, 'plain matching'], [1560, 'read together']];
    grids.forEach(([cx, head], i) => {
      if (i === 2 && b < 1) return;
      const G = slideGrid(svg, { checks: d.checks, d: d.distance, cx, cy, pitch, qr: 20 });
      ex.fired.forEach((id) => G.tiles[id].setFired(1));
      T(svg, cx, 360, head, { size: 36, weight: 600, anchor: 'middle' });
      if (i === 0) return;
      const ans = i === 1 ? ex.plain_matching : ex.read_together;
      Object.entries(ans.errors).forEach(([q, l]) => { const [x, y] = G.pos(Number(q)); errMark(G.gE, x, y, 24, l); });
      if (i === 2) { const [x, y] = G.pos(5); errMark(G.gE, x, y, 24, 'Z', 'added'); T(svg, x + 30, y - 32, 'or here', { size: 32 }); }
      // 30 dots, 3 rows of 10: how often this answer is right
      const n = Math.round(ans.chance_right * 30);
      for (let k = 0; k < 30; k++) {
        const x = cx - 4.5 * 30 + (k % 10) * 30, y = 790 + Math.floor(k / 10) * 30;
        dot(svg, x, y, 10, k < n ? { fill: C.ink } : { fill: 'none', stroke: C.mid, 'stroke-width': 3 });
      }
      T(svg, cx, 920, i === 1 ? 'right 1 time in 3' : 'right about 6 times in 10', { size: 40, weight: 600, anchor: 'middle' });
    });
  },
};
