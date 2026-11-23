// Slide 2: why correction is needed (one slip per thousand against billions of
// steps), then the threshold as a schematic in its own strip, with Google's
// measured years as notes below it, off the strip.
import { C, L, R, svgOf, T, frame, ln, pth, dot } from '../../kit.js';

export default {
  id: 'threshold', n: 2, part: 'Motivation', builds: 2, speaker: 'A',
  title: 'A bigger grid helps when each qubit is below the threshold.',
  clicks: ['one slip per thousand, billions of steps', 'the threshold, schematic'],
  draw(page, b) {
    const svg = svgOf(page);
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: b === 0
        ? 'Published estimate: Gidney and Ekerå, Quantum 5 (2021), hardware slipping once in about 1,000 operations; 2–3 billion costly steps for RSA-2048.'
        : 'Schematic (no scale). Measured notes: Google Quantum AI, Nature 614 (2023) and Nature 638 (2025).',
    });

    // Left: one log axis of counts, 1 to 10^10.
    const x0 = L + 20, x1 = 960, y = 620;
    const X = (e) => x0 + (e / 10) * (x1 - x0);
    T(svg, L, 360, 'How many steps, on a log scale', { size: 32, weight: 600 });
    ln(svg, x0, y, x1, y);
    [[0, '1'], [3, '1,000'], [6, 'million'], [9, 'billion']].forEach(([e, s]) => {
      ln(svg, X(e), y - 12, X(e), y + 12);
      T(svg, X(e), y + 56, s, { size: 32, anchor: 'middle', fill: C.muted });
    });
    // one slip in about a thousand operations
    dot(svg, X(3), y, 12, { fill: C.ink });
    T(svg, X(3), y - 96, 'one slip', { size: 36, weight: 600, anchor: 'middle' });
    T(svg, X(3), y - 52, 'in about 1,000 operations', { size: 32, anchor: 'middle' });
    // 2–3 billion costly steps
    ln(svg, X(9 + Math.log10(2)), y, X(9 + Math.log10(3)), y, { 'stroke-width': 14, 'stroke-linecap': 'butt' });
    T(svg, X(9.4), y - 96, '2–3 billion', { size: 36, weight: 600, anchor: 'middle' });
    T(svg, X(9.4), y - 52, 'costly steps', { size: 32, anchor: 'middle' });
    T(svg, x0, y + 150, 'Each step is built from many operations,', { size: 32 });
    T(svg, x0, y + 192, 'and one uncorrected slip can spoil the answer:', { size: 32 });
    T(svg, x0, y + 250, 'millions of slips where one is enough.', { size: 36, weight: 600 });

    if (b < 1) return;
    // Right: the threshold, schematic, in its own strip without y ticks.
    const sx0 = 1080, sx1 = R, sy0 = 380, sy1 = 760;
    ln(svg, sx0, sy0, sx0, sy1); ln(svg, sx0, sy1, sx1, sy1);
    T(svg, sx0, sy0 - 26, 'logical error, schematic', { size: 32, weight: 600 });
    const D = [3, 5, 7], DX = (d) => sx0 + 80 + ((d - 3) / 4) * (sx1 - sx0 - 400);
    D.forEach((d) => { ln(svg, DX(d), sy1, DX(d), sy1 + 12); T(svg, DX(d), sy1 + 50, String(d), { size: 32, anchor: 'middle' }); });
    T(svg, DX(5), sy1 + 92, 'distance (grid size)', { size: 32, anchor: 'middle', fill: C.muted });
    // both start together at distance 3 and part: above the threshold each
    // step adds error, below it each step divides it by about Λ
    const y3 = 540;
    const above = D.map((d, i) => [DX(d), y3 - i * 60]), below = D.map((d, i) => [DX(d), y3 + i * 90]);
    pth(svg, `M${above.map((p) => p.join(' ')).join('L')}`, { 'stroke-dasharray': '22 14', 'stroke-width': 4 });
    pth(svg, `M${below.map((p) => p.join(' ')).join('L')}`, { 'stroke-width': 4 });
    T(svg, above[2][0] + 18, above[2][1] + 10, 'above the threshold', { size: 32 });
    T(svg, below[2][0] + 18, below[2][1] + 10, 'below the threshold', { size: 32 });
    // Λ: the factor from one step to the next, under the falling line
    const [ax, ay] = below[0], [bx, by] = below[1];
    ln(svg, bx, ay, bx, by, { 'stroke-width': 3 });
    ln(svg, bx - 12, ay, bx + 12, ay, { 'stroke-width': 3 }); ln(svg, ax, ay, bx - 12, ay, { 'stroke-width': 2, 'stroke-dasharray': '6 8' });
    T(svg, bx + 20, (ay + by) / 2 + 12, 'divided by Λ per step', { size: 32 });
    T(svg, sx0, 912, 'Google, measured: in 2023 distance 5 just beat 3;', { size: 32 });
    T(svg, sx0, 954, 'in 2024 the error about halved at each step.', { size: 32 });
  },
};
