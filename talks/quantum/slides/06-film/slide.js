// Slide 6: the film. The article's film drawing, and five of its frames
// enlarged below it: the same simulated rounds the article's strip shows
// (film-rule.js filmRounds), fired checks as accent dots over the faint
// positions of the 48 checks. A check lit in two frames running is ringed.
import { C, L, svgOf, T, frame, img, ART, dot, rc, penRing, pth } from '../../kit.js';
import { filmRounds, toGrid } from '../../../../articles/other-half/figures/film-rule.js';

export default {
  id: 'film', n: 6, part: 'Preliminaries', builds: 3, speaker: 'B',
  title: 'The chip puts out a film of fired checks, one frame per round.',
  clicks: ['the film and five of its frames', 'how fast', 'a wrong report fires twice'],
  draw(page, b, data) {
    const svg = svgOf(page);
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Simulated by us with Stim at distance 7, 0.5% error per operation (articles/other-half/data/film.json). Round time measured: Google Quantum AI, Nature 638 (2025).',
    });
    const k = 0.5;
    img(svg, ART + 'film-field.png', 40, 190, 1536 * k, 1024 * k);
    img(svg, ART + 'film-line.png', 40, 190, 1536 * k, 1024 * k);
    const run = data.film.runs[0], dd = 7;
    const { start } = filmRounds(run);
    const rounds = [0, 1, 2, 3, 4].map((i) => start + 8 + i);
    // a check lit in two frames running: a wrong report, or two errors nearby
    let twice = null;
    for (let i = 0; i < 4 && !twice; i++) {
      const both = run.frames[rounds[i]].filter((id) => run.frames[rounds[i + 1]].includes(id));
      if (both.length) twice = { i, id: both[0] };
    }
    const fw = 230, gap = 82, y0 = 740, pitch = 28;
    // a check's centre sits half a pitch off its qubits; rows and columns run -1..d-1
    const pos = (c) => { const g = toGrid(c, dd); return [17 + (g.col + 1) * pitch, 17 + (g.row + 1) * pitch]; };
    rounds.forEach((r, i) => {
      const x0 = L + 20 + i * (fw + gap);
      rc(svg, x0, y0, fw, fw, { rx: 10 });
      run.checks.forEach((c) => { const [px, py] = pos(c); dot(svg, x0 + px, y0 + py, 4, { fill: C.mid }); });
      run.frames[r].forEach((id) => { const [px, py] = pos(run.checks[id]); dot(svg, x0 + px, y0 + py, 11, { fill: C.accent }); });
      T(svg, x0 + fw / 2, y0 - 16, `round ${i + 1}`, { size: 32, anchor: 'middle', fill: C.muted });
      if (b >= 2 && twice && (i === twice.i || i === twice.i + 1)) {
        const [px, py] = pos(run.checks[twice.id]);
        penRing(svg, x0 + px, y0 + py, 26, 24, { width: 4, stroke: C.ink, seed: 11 + i });
      }
    });
    // the strip's frames, enlarged: an Excalidraw-like arrow from the drawn strip down to the row
    pth(svg, 'M 420 640 C 432 668, 436 690, 440 712', { 'stroke-width': 4 });
    pth(svg, 'M 424 694 L 440 714 L 452 692', { 'stroke-width': 4 });
    T(svg, 470, 676, 'five of its frames, enlarged', { size: 32, fill: C.muted });
    const tx = 880;
    if (b >= 1) {
      T(svg, tx, 340, 'A round every 1.1 millionths of a second,', { size: 36, weight: 600 });
      T(svg, tx, 384, 'about 900,000 rounds per second.', { size: 32 });
      T(svg, tx, 450, '48 checks at distance 7:', { size: 36, weight: 600 });
      T(svg, tx, 494, 'over 4 million results in the time of a blink.', { size: 32 });
    }
    if (b >= 2) {
      T(svg, tx, 570, 'A wrong report fires twice: once wrong, once right', { size: 32, weight: 600 });
      T(svg, tx, 612, 'again. So the rounds are read in sequence.', { size: 32, weight: 600 });
    }
  },
};
