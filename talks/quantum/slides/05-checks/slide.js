// Slide 5: what a check reports. The smallest grid (lattice.json) at slide
// size; one flip fires the two flip-checks beside it; a line of two fires only
// its upper end, the lower end meets the edge (lattice.json "walk").
import { C, svgOf, T, frame, slideGrid, errMark, rc, dot, h } from '../../kit.js';

export default {
  id: 'checks', n: 5, part: 'Preliminaries', builds: 3, speaker: 'A',
  title: 'A check reports whether the number of errors next to it is even or odd.',
  clicks: ['the grid and its two kinds of check', 'one flip: two checks fire', 'a line of two: only its end fires'],
  draw(page, b, data) {
    const svg = svgOf(page);
    const d = data.lattice;
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Distance 3, one round, checks assumed right. Constructed by us (articles/other-half/data/lattice.json).',
    });
    const pitch = 150, cx = 560, cy = 630;
    const G = slideGrid(svg, { checks: d.checks, d: d.distance, cx, cy, pitch, qr: 30 });
    const step = b === 0 ? null : d.walk[b - 1];
    if (step) {
      step.fired.forEach((id) => G.tiles[id].setFired(1));
      Object.entries(step.errors).forEach(([q, letter]) => { const [x, y] = G.pos(Number(q)); errMark(G.gE, x, y, 30, letter); });
    }
    // the key, once, to the right
    const kx = 1060;
    const sw = (y, flips) => h('rect', { x: kx, y: y - 34, width: 52, height: 52, fill: flips ? C.ink : 'none', 'fill-opacity': flips ? 0.16 : null, stroke: flips ? C.ink : C.muted, 'stroke-width': 3 }, svg);
    sw(360, true); T(svg, kx + 76, 360, 'tinted: asks about flips', { size: 32 });
    sw(440, false); T(svg, kx + 76, 440, 'open: asks about phase errors', { size: 32 });
    rc(svg, kx, 486, 52, 52, { fill: C.field, stroke: C.accent }); dot(svg, kx + 26, 512, 13, { fill: C.accent });
    T(svg, kx + 76, 520, 'fired (large blue dot): the answer changed', { size: 32, weight: 600, fill: C.accent });
    T(svg, kx, 610, 'X a flip, Z a phase error, Y both', { size: 32 });
    if (b === 1) {
      T(svg, kx, 720, 'One flip in the middle:', { size: 36, weight: 600 });
      T(svg, kx, 766, 'the two flip-checks beside it fire.', { size: 32 });
      T(svg, kx, 806, 'The flip itself is never seen.', { size: 32 });
    }
    if (b === 2) {
      T(svg, kx, 720, 'A line of two flips:', { size: 36, weight: 600 });
      T(svg, kx, 766, 'the check between them sees two, an even', { size: 32 });
      T(svg, kx, 806, 'number, and stays quiet. Only the upper', { size: 32 });
      T(svg, kx, 846, 'end fires; the lower end meets the edge.', { size: 32 });
    }
  },
};
