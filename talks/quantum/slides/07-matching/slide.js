// Slide 7: matching as a pairing puzzle, on the example's three fired checks
// (lattice.json example): the flip-check paired to the left edge through
// qubit 0, the two phase-checks paired through qubit 4. Pairings in pen.
import { C, svgOf, T, frame, slideGrid, pth } from '../../kit.js';

export default {
  id: 'matching', n: 7, part: 'Preliminaries', builds: 1, speaker: 'B',
  title: 'The standard decoder, matching, pairs fired checks along the cheapest lines.',
  clicks: ['three fired checks, one pairing'],
  draw(page, b, data) {
    const svg = svgOf(page);
    const d = data.lattice, ex = d.example;
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Distance 3, one round shown; real decoders pair across rounds. Constructed by us (lattice.json). Fast exact methods: Higgott and Gidney, Sparse Blossom (2025).',
    });
    const pitch = 150, cx = 560, cy = 640;
    const G = slideGrid(svg, { checks: d.checks, d: d.distance, cx, cy, pitch, qr: 30 });
    ex.fired.forEach((id) => G.tiles[id].setFired(1));
    // pen pairings: z2 to the left edge across qubit 0; x0 to x1 across qubit 4
    const c = (id) => G.tiles[id].c;
    const [zx, zy] = c('z2');
    const [q0x, q0y] = G.pos(0);
    // through qubit 0 and on, a little past the grid's left edge
    const ux = q0x - zx, uy = q0y - zy, n = Math.hypot(ux, uy);
    const qx = q0x + (ux / n) * 70, qy = q0y + (uy / n) * 70;
    pth(svg, `M${zx} ${zy} Q ${(zx + qx) / 2 - 12} ${(zy + qy) / 2 + 10} ${qx} ${qy}`, { 'stroke-width': 5 });
    T(svg, qx - 10, qy - 24, 'edge', { size: 32, anchor: 'end', fill: C.muted });
    const [ax, ay] = c('x0'), [bx, by] = c('x1');
    pth(svg, `M${ax} ${ay} Q ${(ax + bx) / 2 + 30} ${(ay + by) / 2 - 30} ${bx} ${by}`, { 'stroke-width': 5 });
    const tx = 1060;
    T(svg, tx, 400, 'Join every fired check to another', { size: 36, weight: 600 });
    T(svg, tx, 444, 'fired check, or to the edge.', { size: 36, weight: 600 });
    T(svg, tx, 530, 'Each line stands for errors along it.', { size: 32 });
    T(svg, tx, 572, 'Pick the pairing with the cheapest lines:', { size: 32 });
    T(svg, tx, 614, 'a few errors are likelier than many.', { size: 32 });
    T(svg, tx, 700, 'A line’s cost comes from the error model.', { size: 32 });
    T(svg, tx, 786, 'Flip-checks and phase-checks are', { size: 32, fill: C.muted });
    T(svg, tx, 828, 'paired separately, in plain matching.', { size: 32, fill: C.muted });
  },
};
