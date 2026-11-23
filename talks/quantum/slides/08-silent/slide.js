// Slide 8: the article's flip-check grid drawn at projector scale.
import { C, L, svgOf, T, frame, slideGrid, errMark, ln } from '../../kit.js';

export default {
  id: 'silent', n: 8, part: 'Preliminaries', builds: 1, speaker: 'A',
  title: 'One check fires. The wrong correction leaves a silent error.',
  clicks: ['the flips, the fired check, the silent error'],
  draw(page, _, { line }) {
    const svg = svgOf(page);
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Distance 5. Flip checks only. One round with perfect checks. Constructed and checked by our script (OWN-ARITH).',
    });
    const pitch = 76;
    const centers = [370, 960, 1550];
    const titles = ['What happened', 'What the chip reports', 'What the correction leaves'];
    const grids = centers.map((cx, i) => {
      T(svg, cx, 315, titles[i], { size: 40, weight: 600, anchor: 'middle' });
      return slideGrid(svg, { checks: line.flip_checks, d: line.distance, cx, cy: 535, pitch });
    });
    const [actual, observed, corrected] = grids;
    const marks = (grid, qubits, kind) => {
      for (const qubit of qubits) errMark(grid.gE, ...grid.pos(qubit), 25, 'X', kind);
    };
    marks(actual, line.real_errors, 'real');
    for (const id of line.fired_by_real_errors) observed.tiles[id].setFired(1);
    const [topX, topY] = corrected.pos(line.together[0]);
    const [bottomX, bottomY] = corrected.pos(line.together.at(-1));
    ln(corrected.gE, topX, topY - pitch * 0.55, bottomX, bottomY + pitch * 0.55, { 'stroke-width': 6 });
    marks(corrected, line.real_errors, 'real');
    marks(corrected, line.decoder_correction, 'added');
    const under = (i, text, color = C.ink) =>
      T(svg, centers[i], 798, text, { size: 38, weight: 600, anchor: 'middle', fill: color });
    under(0, `${line.real_errors.length} real flips`);
    under(1, `${line.fired_by_real_errors.length} check fires`, C.accent);
    under(2, `${line.fired_together.length} checks fire`);
    T(svg, centers[2], 846, 'The stored value changes', { size: 34, anchor: 'middle' });
    T(svg, L, 924, 'Filled X = real flip · Open X = flip added by the decoder', { size: 32 });
  },
};
