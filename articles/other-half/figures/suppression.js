// suppression: Google's 2024 result, quoted. Two ladders, one per decoder;
// on each rung the logical errors in 100,000 rounds as counted dots (one dot
// is ten errors), the exact value in mono, and between rungs the factor
// Lambda. Everything is from data/suppression.json; nothing here is ours.
import {
  mountFigure, svgRoot, g, cells, dots, bracket, leader, penRing, stage, fmt,
} from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 1;
// seconds the drawing plays once 40% of it is in view: two ladders, rung by rung
export const durations = { medium: [1.8] };
const SIZE = { wide: [560, 536], tall: [360, 660] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

const PER = 10, COLS = 10, ROUNDS = 100000;      // one dot: ten errors; rows of ten
const WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

function build(el, ctx) {
  floor(ctx.layout === 'tall' ? 13.8 : 0);
  const C = pal(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const [m, nn] = d.decoders;
  const lastM = m.points[m.points.length - 1], lastN = nn.points[nn.points.length - 1];
  const fewer = Math.round(lastM.per_100000_rounds / (lastM.per_100000_rounds - lastN.per_100000_rounds));
  const svg = svgRoot(el, W, H,
    `Google's chip of 2024, quoted: logical errors in ${fmt(ROUNDS)} rounds at distances ${m.points.map((p) => p.distance).join(', ')}. `
    + d.decoders.map((dc) => `${dc.label}: ${dc.points.map((p) => p.per_100000_rounds).join(', ')}, each step divides the errors by ${dc.lambda}`).join('. ')
    + `. Every step to a bigger grid roughly halves the errors, and the network's ladder falls a little faster. Google's measurements, not ours.`);
  svg.style.color = C.ink;
  const st = stage();
  const p = tall ? 8.6 : 11, r = p * 0.37;
  const X = tall ? [16, 192] : [44, 314];
  const mono = { family: 'mono', size: tall ? 11.5 : 12 };
  const noteO = { italic: true, size: tall ? 13 : 14 };

  const tag = g(svg);
  const t0 = text(tag, X[0], 18, 'same data, a different reader: one in six fewer errors', { family: 'sans', size: 13, weight: 600, width: W - X[0] - 12, lh: 17 });
  const tg = text(tag, X[0], t0.bottom + 15, `Google Quantum AI, 2024 · logical errors in ${fmt(ROUNDS)} rounds · each recording read by two decoders, both run afterwards`, { ...mono, fill: C.muted, width: W - X[0] - 12, lh: 15 });
  st.fade(tag, 0, 0.1);

  const rows = m.points.map((pt, i) => Math.max(...d.decoders.map((dc) => Math.ceil(Math.round(dc.points[i].per_100000_rounds / PER) / COLS))));
  const top = tg.bottom + (tall ? 30 : 34);
  let ringAt = null, unitDot = null, yEnd = 0;
  d.decoders.forEach((dc, k) => {
    const x = X[k], hd = g(svg);
    text(hd, x, top, dc.label, { family: 'sans', size: tall ? 12.5 : 13.5, weight: 600, width: tall ? 160 : 230, lh: 15 });
    st.fade(hd, 0.04, 0.14);
    let y = top + (tall ? 38 : 30);
    dc.points.forEach((pt, i) => {
      const a = 0.1 + i * 0.24 + k * 0.05, rg = g(svg);
      text(rg, x, y, tall ? `distance ${pt.distance}\n${pt.qubits} qubits` : `distance ${pt.distance} · ${pt.qubits} qubits`, { ...mono, fill: C.muted, lh: 14 });
      if (tall) y += 17;
      const n = Math.round(pt.per_100000_rounds / PER);
      const list = cells(n, COLS, { gx: p, gy: p });
      const accent = k === 1 && i === dc.points.length - 1;
      const dg = g(svg);
      const ds = dots(dg, list, n, r, { fill: accent ? C.accent : C.ink }, x, y + 8);
      const yb = y + 8 + Math.ceil(n / COLS) * p;
      const vg = g(svg);
      const v = text(vg, x + COLS * p + 10, yb - p / 2 + 4.5, String(pt.per_100000_rounds), { family: 'mono', size: tall ? 13 : 14, weight: 500 });
      st.fade(rg, a, a + 0.08).fill(ds, a + 0.04, a + 0.2).fade(vg, a + 0.16, a + 0.24);
      if (accent) ringAt = v;
      if (k === 0 && i === dc.points.length - 1) unitDot = { x: x + list[n - 1].x, y: y + 8 + list[n - 1].y };
      y += 8 + rows[i] * p;
      if (i < dc.points.length - 1) {
        const bg = g(svg);
        bracket(bg, x + 4, y + 9, x + 4, y + 27, -4, { stroke: C.ink, 'stroke-width': 1 });
        text(bg, x + 13, y + 22.5, `÷ ${(pt.value / dc.points[i + 1].value).toFixed(2)}`, { family: 'mono', size: tall ? 12 : 12.5, weight: 500 });
        st.fade(bg, a + 0.2, a + 0.28);
        y += tall ? 50 : 54;
      }
      yEnd = Math.max(yEnd, y);
    });
  });

  // the unit, the one ring, the note on the recordings
  const ug = g(svg);
  const un = text(ug, X[0] + 14, yEnd + 34, `one dot is [[${PER}]] errors in [[${fmt(ROUNDS)}]] rounds`, { ...noteO, width: tall ? 150 : 230 });
  leader(ug, un.x + 8, un.y - 3, unitDot.x, unitDot.y + r + 2, { stroke: C.muted, dot: false });
  st.fade(ug, 0.8, 0.9);
  const ng = g(svg);
  text(ng, X[1], yEnd + 34, `[[${lastM.per_100000_rounds} → ${lastN.per_100000_rounds}]]: about ${WORDS[1]} in ${WORDS[fewer] || fewer} fewer, read from the same data`, { ...noteO, width: tall ? 156 : 220 });
  st.fade(ng, 0.84, 0.94);
  const pr = penRing(svg, ringAt.cx, ringAt.cy - 0.5, ringAt.w / 2 + 9, 12.5, { seed: 9, stroke: C.accent, width: 1.5 });
  pr.paths.forEach((pp, k) => st.draw(pp, 0.86 + k * 0.03, 0.97 + k * 0.02));
  const fg = g(svg);
  const fit = text(fg, X[0], yEnd + (tall ? 92 : 80), `fitted over all three: [[÷ ${nn.lambda.toFixed(2)}]] (network), [[÷ ${m.lambda.toFixed(2)}]] (matching)`, { size: tall ? 13 : 14, width: W - X[0] - 16 });
  const nine = d.note_recordings.match(/over (\d+) and (\d+)/);
  text(fg, X[0], fit.bottom + 18, `distances ${m.points[0].distance} and ${m.points[1].distance}: averages over ${nine ? nine[1] : 'several'} and ${nine ? nine[2] : 'several'} smaller grids on the same chip (supplementary table S1). Each distance is its own recording`, { ...noteO, size: tall ? 12.5 : 13.5, fill: C.muted, width: W - X[0] - 16 });
  st.fade(fg, 0.9, 1);

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
