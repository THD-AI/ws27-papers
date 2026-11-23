// Slide 8: the one mistake that matters (line.json): three real flips in one
// column fire one check; matching's cheapest explanation is two flips below;
// errors and correction together cross the grid and fire nothing.
import { C, svgOf, T, frame, slideGrid, errMark, pth } from '../../kit.js';

export default {
  id: 'silent', n: 8, part: 'Preliminaries', builds: 3, speaker: 'B',
  title: 'Errors plus a wrong correction can cross the grid without firing a single check.',
  clicks: ['three real flips, one check fires', 'matching adds two flips below', 'together: edge to edge, nothing fires'],
  draw(page, b, data) {
    const svg = svgOf(page);
    const d = data.line;
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Distance 5, flip-checks only, one round, checks assumed right. Constructed and checked by our script (line.json).',
    });
    const pitch = 112, cx = 520, cy = 650;
    const G = slideGrid(svg, { checks: d.flip_checks, d: d.distance, cx, cy, pitch, qr: 24 });
    if (b < 2) d.fired_by_real_errors.forEach((id) => G.tiles[id].setFired(1));
    d.real_errors.forEach((q) => { const [x, y] = G.pos(q); errMark(G.gE, x, y, 26, 'X'); });
    if (b >= 1) d.decoder_correction.forEach((q) => { const [x, y] = G.pos(q); errMark(G.gE, x, y, 26, 'X', 'added'); });
    if (b >= 2) {
      const [x, yTop] = G.pos(d.together[0]), [, yBot] = G.pos(d.together[d.together.length - 1]);
      // the crossing line runs through the column itself, under the marks
      pth(G.gH, `M${x + 4} ${yTop - 70} C ${x + 12} ${yTop + 80}, ${x - 8} ${yBot - 80}, ${x + 2} ${yBot + 70}`, { 'stroke-width': 6 });
    }
    const tx = 1000;
    T(svg, tx, 360, 'filled X: a real flip', { size: 32 });
    T(svg, tx, 404, 'open X: the decoder’s correction', { size: 32 });
    const say = [
      ['Three real flips in one column', 'fire a single check.'],
      ['Matching’s cheapest explanation', 'of that check: two flips below it.'],
      ['Together they cross the grid from', 'edge to edge. No check fires, and', 'the stored value has changed.'],
    ][b];
    say.forEach((s, i) => T(svg, tx, 520 + i * 46, s, { size: 36, weight: i === 0 ? 600 : 400 }));
    if (b >= 2) T(svg, tx, 720, 'On distance 5 a line needs five qubits:', { size: 32, fill: C.muted });
    if (b >= 2) T(svg, tx, 762, 'three real errors can be enough.', { size: 32, fill: C.muted });
  },
};
