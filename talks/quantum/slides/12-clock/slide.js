// Slide 12: one time line in millionths of a second (clock.json). The chip
// finishes a round every 1.1; the 2024 network needs 24 per round (quoted in
// Google's paper), so the backlog grows; live matching on a smaller chip, in
// its own lane with its own setup named, kept pace.
import { C, L, R, svgOf, T, frame, ln, rc, inkLayer, PEN } from '../../kit.js';

export default {
  id: 'clock', n: 12, part: 'Content', builds: 2, speaker: 'B',
  title: 'The network needed 24 millionths of a second for a round the chip finishes in 1.1.',
  clicks: ['the chip’s rounds and the network’s answers', 'live matching, another setup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    const ck = data.clock, round = ck.round.value;
    const net = ck.decoders.find((d) => d.id === 'network-2024').value;
    const live = ck.decoders.find((d) => d.id === 'live-matching-2024');
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Google Quantum AI, Nature 638 (2025), Sec. V: round time measured; the network’s 24 quoted there from earlier work (it read recorded data afterwards); live matching measured. Backlog: our arithmetic.',
    });
    const x0 = 520, x1 = R - 20, T80 = 80;
    const X = (t) => x0 + (t / T80) * (x1 - x0);
    const axisY = 900;
    ln(svg, x0, axisY, x1, axisY);
    [0, 20, 40, 60, 80].forEach((t) => { ln(svg, X(t), axisY, X(t), axisY + 12); T(svg, X(t), axisY + 50, String(t), { size: 32, anchor: 'middle', fill: C.ink }); });
    T(svg, L, axisY + 50, 'millionths of a second', { size: 32, fill: C.muted });
    // lane 1: the chip
    const y1 = 380;
    T(svg, L, y1 + 12, 'The chip', { size: 36, weight: 600 });
    T(svg, L, y1 + 52, `a round every ${round} µs`, { size: 32 });
    T(svg, x0, y1 - 40, 'one tick per round', { size: 32, fill: C.ink });
    for (let t = round; t <= T80; t += round) rc(svg, X(t) - 2, y1 - 24, 4, 48, { fill: C.ink, stroke: 'none' });
    {
      const y2 = 560;
      T(svg, L, y2 + 12, 'The 2024 network', { size: 36, weight: 600, fill: C.accent });
      T(svg, L, y2 + 52, `${net} µs per round, quoted`, { size: 32 });
      for (let k = 0; k < 3; k++) {
        const s = round + k * net, e = s + net;
        rc(svg, X(s) + 3, y2 - 30, X(e) - X(s) - 6, 60, { fill: C.field, stroke: C.accent, 'stroke-width': 3, rx: 6 });
        T(svg, (X(s) + X(e)) / 2, y2 + 12, `round ${k + 1}`, { size: 32, anchor: 'middle' });
      }
      const at = round + 3 * net, done = Math.floor(at / round);
      ln(svg, X(at), y1 - 40, X(at), y2 + 40, { 'stroke-dasharray': '10 10', 'stroke-width': 3 });
      // round 3 answered; round 4 being worked on; the rest wait
      T(svg, X(at) - 18, y2 + 100, `at about ${Math.round(at)}: round 3 answered, the chip at round ${done},`, { size: 32, weight: 600, anchor: 'end' });
      T(svg, X(at) - 18, y2 + 140, `${done - 4} rounds waiting`, { size: 32, weight: 600, anchor: 'end' });
      const ink = inkLayer(page);
      ink.note(X(at) - 18, y2 + 184, '…and the pile keeps growing', { size: 38, color: PEN.red, anchor: 'end' });
    }
    if (b >= 1) {
      const y3 = 790;
      T(svg, L, y3 - 8, 'Live matching,', { size: 36, weight: 600 });
      T(svg, L, y3 + 34, 'distance 5, 72-qubit chip', { size: 32, weight: 600 });
      // the delay itself, drawn on the same axis: 63 after the last round
      rc(svg, X(0), y3 - 24, X(live.value) - X(0), 30, { fill: C.hair, stroke: C.ink, 'stroke-width': 3, rx: 4 });
      T(svg, X(live.value) + 16, y3 + 2, String(live.value), { size: 36, weight: 600 });
      T(svg, X(0), y3 + 46, 'its answer, on average, after the last round of a run of up to a million rounds: it kept pace', { size: 32 });
    }
  },
};
