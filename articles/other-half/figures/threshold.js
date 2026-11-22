// threshold: how much a bigger grid helps, from our own runs. At each noise
// level, plain matching's chance of a logical error per round at distance 3,
// divided by the same at distance 5. Above 1 the bigger grid wins; below 1 it
// loses; where the line crosses 1 is the threshold. Everything from
// data/threshold.json (tools/threshold-data.mjs).
import { mountFigure, svgRoot, g, line, circle, path, rect, stage } from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 1;
// seconds the drawing plays once 40% of it is in view: the level line, then the points left to right, then the crossing
export const durations = { medium: [2.0] };
const SIZE = { wide: [560, 384], tall: [360, 450] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

const pc = (v) => `${+(v * 100).toPrecision(2)}%`;

function build(el, ctx) {
  const tall = ctx.layout === 'tall';
  floor(tall ? 13.8 : 12.45);
  const C = pal(ctx), d = ctx.data, R = d.ratio, X = d.crossing_p;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H,
    'Our own simulated runs with plain matching: how many times fewer logical errors per round distance 5 makes than distance 3. '
    + R.map((r) => `At a noise level of ${pc(r.p)}: ${r.d3_over_d5.toFixed(2)} times`).join('; ')
    + (X ? `. The bigger grid wins below about ${pc(X)} and loses above it: that is the threshold here.` : '.'));
  svg.style.color = C.ink;
  const st = stage();
  const mono = { family: 'mono', size: tall ? 11.5 : 12, fill: C.muted };
  const sans = { family: 'sans', size: 13, weight: 600 };
  const P = tall ? { l: 44, r: 336, t: 146, b: 360 } : { l: 56, r: 530, t: 96, b: 300 };
  const lp = (p) => Math.log(p);
  const x = (p) => P.l + (lp(p) - lp(R[0].p)) / (lp(R.at(-1).p) - lp(R[0].p)) * (P.r - P.l);
  const yLo = 0.6, yHi = 12;
  const y = (v) => P.b - (Math.log(v) - Math.log(yLo)) / (Math.log(yHi) - Math.log(yLo)) * (P.b - P.t);

  const head = g(svg);
  if (tall) {
    text(head, 16, 18, 'below the threshold a bigger grid wins;', sans);
    text(head, 16, 35, 'above it, a bigger grid loses', sans);
  } else text(head, 16, 18, 'below the threshold a bigger grid wins; above it, a bigger grid loses', sans);
  text(head, 16, tall ? 56 : 40, 'our runs · plain matching · distance 5 against 3, errors per round', { ...mono, width: W - 30, lh: 15 });

  const axes = g(svg);
  // the side where the bigger grid loses, shaded
  rect(axes, P.l, y(1), P.r - P.l, P.b - y(1), { fill: C.ink, 'fill-opacity': 0.05 });
  for (const v of [1, 2, 5, 10]) {
    line(axes, P.l, y(v), P.r, y(v), { stroke: C.hairline, 'stroke-width': 1 });
    text(axes, P.l - 8, y(v) + 4, `${v}×`, { ...mono, anchor: 'end' });
  }
  const ticks = tall ? [0.001, 0.003, 0.01, 0.02] : [0.001, 0.002, 0.005, 0.01, 0.02];
  for (const p of ticks) if (p >= R[0].p && p <= R.at(-1).p * 1.001) text(axes, x(p), P.b + 18, pc(p), { ...mono, anchor: 'middle' });
  text(axes, (P.l + P.r) / 2, P.b + 38, 'noise level: the chance that any one operation goes wrong', { ...mono, anchor: 'middle', width: P.r - P.l });
  text(axes, P.l - 8, tall ? P.t - 32 : P.t - 16, 'how many times fewer errors the bigger grid makes', { ...mono, anchor: 'start', width: P.r - P.l + 8 });

  const lvl = g(svg);
  line(lvl, P.l, y(1), P.r, y(1), { stroke: C.ink, 'stroke-width': 1.4 });
  text(lvl, P.l + 6, y(1) - 8, 'no gain', { italic: true, size: 13 });
  text(lvl, P.l + 6, y(1) + 20, 'below: the bigger grid makes more errors', { italic: true, size: 13, fill: C.muted });

  const pts = g(svg);
  path(pts, `M${R.map((r) => `${x(r.p).toFixed(1)} ${y(r.d3_over_d5).toFixed(1)}`).join('L')}`, { stroke: C.ink, 'stroke-width': 2 });
  for (const r of R) circle(pts, x(r.p), y(r.d3_over_d5), 3.6, { fill: C.ink });
  const first = R[0];
  text(pts, x(first.p) + 10, y(first.d3_over_d5) - 8, `${first.d3_over_d5.toFixed(1)}×`, { family: 'mono', size: 13 });

  const cross = g(svg);
  if (X) {
    line(cross, x(X), P.t + 10, x(X), P.b, { stroke: C.accent, 'stroke-width': 1.4, 'stroke-dasharray': '4 3' });
    circle(cross, x(X), y(1), 5, { fill: 'none', stroke: C.accent, 'stroke-width': 1.6 });
    text(cross, x(X) - 8, P.t + 22, `the threshold here: about ${pc(X)}`, { size: 13, fill: C.accent, anchor: 'end' });
  }
  st.fade(head, -1, 0).fade(axes, -1, 0).fade(lvl, 0.05, 0.3).fade(pts, 0.25, 0.65).fade(cross, 0.7, 0.95);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
