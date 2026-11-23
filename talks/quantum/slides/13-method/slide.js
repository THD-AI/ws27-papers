// Slide 13: what we ran. The pipeline is sketched by hand (Excalidraw
// strokes): simulator, fired checks, network, answer; the comparison and the
// stop rule follow as ruled rows in type.
import { C, L, R, svgOf, T, frame, ln, inkLayer, PEN } from '../../kit.js';

export default {
  id: 'method', n: 13, part: 'Content', builds: 2, speaker: 'B',
  title: 'We trained a small network in simulation and wrote down our stop rule first.',
  clicks: ['the pipeline', 'what it is compared with; the stop rule'],
  draw(page, b) {
    const svg = svgOf(page);
    frame(svg, { title: this.title, n: this.n, part: this.part, source: 'Our own runs (OWN-D3, OWN-D5, OWN-D5-250M): 8 seeds at distance 3, 5 at distance 5; every decoder reads the same 2 million fresh test runs per noise level; one kind of stored value. Stim (Gidney 2021), PyMatching 2.4.0.' });
    const ink = inkLayer(page);
    // the pipeline, sketched
    const y = 400, boxes = [[140, 'Stim', 'simulated runs'], [640, 'which checks', 'fired'], [1140, 'network', '3 × 256 units'], [1560, 'flipped', 'or not?']];
    boxes.forEach(([x, a, c], i) => {
      ink.rect(x, y - 70, i === 3 ? 230 : 330, 150, { seed: 50 + i, stroke: i === 2 ? PEN.blue : PEN.ink, fill: i === 2 ? '#d0ebff' : undefined, fillStyle: 'hachure', hachureGap: 14 });
      T(svg, x + (i === 3 ? 115 : 165), y - 4, a, { size: 36, weight: 600, anchor: 'middle' });
      T(svg, x + (i === 3 ? 115 : 165), y + 40, c, { size: 32, anchor: 'middle' });
      if (i < 3) ink.arrow([[x + 340, y], [boxes[i + 1][0] - 14, y]], { seed: 60 + i, head: 24 });
    });
    ink.note(140, y + 140, 'the same chance of error on every operation;', { size: 32 });
    ink.note(140, y + 182, 'trained at seven levels from 0.2% to 1%, tested at 0.5%', { size: 32 });
    ink.note(1140, y + 140, 'it never sees the', { size: 32, color: PEN.blue });
    ink.note(1140, y + 182, 'grid’s layout', { size: 32, color: PEN.blue });
    if (b < 1) return;
    const rows = [
      ['Compared with', 'plain and correlated matching, both given the exact error model'],
      ['Best possible', 'distance 3: a lookup table from 200 million runs, our estimate'],
      ['Stop rule', 'drop it if a laptop can’t train it, or if it loses on real recordings'],
    ];
    rows.forEach(([k, a], i) => {
      const yy = 680 + i * 96;
      ln(svg, L, yy, R, yy, { stroke: C.hair, 'stroke-width': 2 });
      T(svg, L, yy + 52, k, { size: 32, weight: 600 });
      T(svg, L + 290, yy + 52, a, { size: 32 });
    });
  },
};
