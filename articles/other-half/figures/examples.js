// examples: what passing plain matching cost in examples, at distance 3 and 5,
// on one linear scale so the difference is the picture. One dot per seed (its
// first probe below plain matching), the range between them as a bar. At
// distance 5 the 66-million run is marked: no seed had passed there.
// Everything from data/examples.json (tools/examples-data.mjs).
import { mountFigure, svgRoot, g, line, circle, rect, stage } from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 1;
export const durations = { medium: [1.8] };
const SIZE = { wide: [560, 250], tall: [360, 300] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };
const M = (v) => (v >= 1e7 ? `${Math.round(v / 1e6)}` : `${+(v / 1e6).toFixed(1)}`);

function build(el, ctx) {
  const tall = ctx.layout === 'tall';
  floor(tall ? 13.8 : 12.45);
  const C = pal(ctx), d = ctx.data, [r3, r5] = d.rows;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H,
    `Examples our network had seen when it first did better than plain matching: ${M(r3.min)} to ${M(r3.max)} million at distance 3, ${M(r5.min)} to ${M(r5.max)} million at distance 5. `
    + `At ${M(r5.not_by)} million no distance-5 seed had passed it yet.`);
  svg.style.color = C.ink;
  const st = stage();
  const mono = { family: 'mono', size: tall ? 11.5 : 12, fill: C.muted };
  const sans = { family: 'sans', size: 13, weight: 600 };
  if (tall) {
    text(svg, 16, 18, 'one grid larger, 20 to 40 times', sans);
    text(svg, 16, 35, 'the examples to pass plain matching', sans);
  } else text(svg, 16, 18, 'one grid larger, 20 to 40 times the examples to pass plain matching', sans);
  text(svg, 16, tall ? 56 : 39, `our runs · noise level ${+(d.noise_level * 100).toFixed(1)}% · one dot per seed: its first check below plain matching`, { ...mono, width: W - 30, lh: 15 });

  const P = tall ? { l: 80, r: 336, y3: 120, y5: 196, ax: 250 } : { l: 100, r: 530, y3: 96, y5: 150, ax: 200 };
  const x = (v) => P.l + (v / 260e6) * (P.r - P.l);
  const axes = g(svg);
  line(axes, P.l, P.ax, P.r, P.ax, { stroke: C.ink, 'stroke-width': 1 });
  for (const v of [0, 100e6, 200e6, 250e6]) {
    line(axes, x(v), P.ax, x(v), P.ax + 5, { stroke: C.ink, 'stroke-width': 1 });
    text(axes, x(v), P.ax + 19, M(v), { ...mono, anchor: 'middle' });
  }
  text(axes, P.r, P.ax + 38, 'examples seen, in millions', { ...mono, anchor: 'end' });

  const row = (r, y) => {
    const grp = g(svg);
    text(grp, 16, y + 5, `distance ${r.distance}`, { size: 14 });
    rect(grp, x(r.min), y - 7, Math.max(2, x(r.max) - x(r.min)), 14, { fill: C.accent, 'fill-opacity': 0.25 });
    for (const v of r.examples) circle(grp, x(v), y, 3.2, { fill: C.accent });
    const lab = r.distance === 3 ? `${M(r.min)}–${M(r.max)} million` : `${M(r.min)}–${M(r.max)} million`;
    if (r.distance === 3) text(grp, x(r.max) + 12, y + 5, lab, { family: 'mono', size: 13 }); else text(grp, x(r.max), y - 14, lab, { family: 'mono', size: 13, anchor: 'end' });
    return grp;
  };
  const g3 = row(r3, P.y3), g5 = row(r5, P.y5);
  // at distance 5, the shorter run: not there yet
  const not = g(svg);
  line(not, x(r5.not_by), P.y5 - 14, x(r5.not_by), P.y5 + 14, { stroke: C.ink, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' });
  text(not, x(r5.not_by), P.y5 + 30, `${M(r5.not_by)} million: no seed yet`, { italic: true, size: 13, anchor: 'middle' });
  st.fade(axes, -1, 0).fade(g3, 0.05, 0.3).fade(not, 0.35, 0.55).fade(g5, 0.55, 0.85);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
