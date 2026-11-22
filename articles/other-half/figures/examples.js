// examples: what passing plain matching cost in examples, at distance 3 and 5,
// on one linear scale so the difference is the picture. One thin bar per seed,
// from its last check above plain matching to its first check below: the
// crossing lies somewhere on the bar. A dashed mark where the learning rate
// starts to fall, and one at 66 million, where no distance-5 seed had passed.
// Everything from data/examples.json (tools/examples-data.mjs).
import { mountFigure, svgRoot, g, line, rect, stage } from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 1;
export const durations = { medium: [1.8] };
const SIZE = { wide: [560, 270], tall: [360, 330] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };
const M = (v) => (v >= 1e7 ? `${Math.round(v / 1e6)}` : `${+(v / 1e6).toFixed(1)}`);

function build(el, ctx) {
  const tall = ctx.layout === 'tall';
  floor(tall ? 13.8 : 12.45);
  const C = pal(ctx), d = ctx.data, [r3, r5] = d.rows;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const lo = Math.floor(d.ratio.min / 5) * 5, hi = Math.ceil(d.ratio.max / 5) * 5;
  const svg = svgRoot(el, W, H,
    `Examples our network had seen when it passed plain matching, as a range per seed between two checks: ${M(r3.lo)} to ${M(r3.hi)} million at distance 3, ${M(r5.lo)} to ${M(r5.hi)} million at distance 5, about ${lo} to ${hi} times as many. `
    + `At ${M(r5.not_by)} million no distance-5 seed had passed it; its learning rate starts to fall at ${M(r5.learning_rate_falls_from)} million.`);
  svg.style.color = C.ink;
  const st = stage();
  const mono = { family: 'mono', size: tall ? 11.5 : 12, fill: C.muted };
  const sans = { family: 'sans', size: 13, weight: 600 };
  if (tall) {
    text(svg, 16, 18, `one grid larger, about ${lo} to ${hi} times`, sans);
    text(svg, 16, 35, 'the examples to pass plain matching', sans);
  } else text(svg, 16, 18, `one grid larger, about ${lo} to ${hi} times the examples to pass plain matching`, sans);
  text(svg, 16, tall ? 56 : 39, 'our runs, with our training schedule · one bar per seed: between its last check above plain matching and its first below', { ...mono, width: W - 30, lh: 15 });

  const P = tall ? { l: 86, r: 336, y3: 132, y5: 208, ax: 272 } : { l: 100, r: 530, y3: 102, y5: 168, ax: 222 };
  const x = (v) => P.l + (v / 260e6) * (P.r - P.l);
  const axes = g(svg);
  line(axes, P.l, P.ax, P.r, P.ax, { stroke: C.ink, 'stroke-width': 1 });
  for (const v of [0, 100e6, 200e6, 250e6]) {
    line(axes, x(v), P.ax, x(v), P.ax + 5, { stroke: C.ink, 'stroke-width': 1 });
    text(axes, x(v), P.ax + 19, M(v), { ...mono, anchor: 'middle' });
  }
  text(axes, P.r, P.ax + 38, 'examples seen, in millions', { ...mono, anchor: 'end' });

  const row = (r, y) => {
    const grp = g(svg), n = r.seeds.length, gap = 3.2;
    text(grp, 16, y + 5, `distance ${r.distance}`, { size: 14 });
    r.seeds.forEach((w, i) => {
      const yy = y - ((n - 1) * gap) / 2 + i * gap;
      rect(grp, x(w.above), yy - 1.1, Math.max(2.5, x(w.below) - x(w.above)), 2.2, { fill: C.accent });
    });
    if (r.distance === 3) text(grp, x(r.hi) + 12, y + 5, `${M(r.lo)}–${M(r.hi)} million`, { family: 'mono', size: 13 });
    else text(grp, x(r.hi), y - (n * gap) / 2 - 10, `${M(r.lo)}–${M(r.hi)} million`, { family: 'mono', size: 13, anchor: 'end' });
    return grp;
  };
  const g3 = row(r3, P.y3), g5 = row(r5, P.y5);
  const marks = g(svg);
  line(marks, x(r5.not_by), P.y5 - 14, x(r5.not_by), P.y5 + 14, { stroke: C.ink, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' });
  text(marks, x(r5.not_by), P.y5 + 30, `${M(r5.not_by)} million: no seed yet`, { italic: true, size: 13, anchor: 'middle' });
  line(marks, x(r5.learning_rate_falls_from), P.y5 + 16, x(r5.learning_rate_falls_from), P.ax, { stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '1.5 3' });
  text(marks, x(r5.learning_rate_falls_from) - 6, P.ax - 8, tall ? 'learning rate falls' : 'from here the learning rate falls', { italic: true, size: 12.5, fill: C.muted, anchor: 'end' });
  st.fade(axes, -1, 0).fade(g3, 0.05, 0.3).fade(marks, 0.35, 0.55).fade(g5, 0.55, 0.85);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
