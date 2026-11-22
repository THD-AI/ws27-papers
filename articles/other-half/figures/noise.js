// noise: the long run at eight noise levels, as one chart. Each decoder's
// share of failed runs is divided by plain matching's at the same noise level,
// so plain matching is the level line at 1 and the eight levels can be read
// side by side. The network: pooled over its five seeds (line and dots), with
// the range between its best and worst seed as a band. Correlated matching:
// a second line. Everything from data/noise.json.
import { mountFigure, svgRoot, g, line, circle, path, rect, stage } from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 1;
// seconds the drawing plays once 40% of it is in view: the level line, then the two decoders left to right
export const durations = { medium: [2.0] };
const SIZE = { wide: [720, 400], tall: [360, 470] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

const pc = (v) => `${+(v * 100).toPrecision(2)}%`;

function build(el, ctx) {
  const tall = ctx.layout === 'tall';
  floor(tall ? 13.8 : 12.45);
  const C = pal(ctx), d = ctx.data, rows = d.rows, nSeeds = d.seeds.length;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const rel = rows.map((r) => ({
    p: r.p, net: r.network.pooled.rate / r.plain.pooled.rate, lo: r.network.seed_range.min / r.plain.pooled.rate,
    hi: r.network.seed_range.max / r.plain.pooled.rate, cor: r.correlated.pooled.rate / r.plain.pooled.rate,
  }));
  const svg = svgRoot(el, W, H,
    `Our own simulated runs at distance 5, network trained on ${Math.round(d.training_shots / 1e6)} million examples, ${nSeeds} seeds. `
    + 'Failures of each decoder divided by plain matching\'s at the same noise level. '
    + rel.map((r) => `At ${pc(r.p)}: network ${r.net.toFixed(2)}, correlated matching ${r.cor.toFixed(2)}`).join('; ')
    + '. The network is ahead of plain matching up to a noise level of 0.6% and behind it from 0.8%; correlated matching is ahead of the network from 0.2%.');
  svg.style.color = C.ink;
  const st = stage();
  const mono = { family: 'mono', size: tall ? 11.5 : 12, fill: C.muted };
  const sans = { family: 'sans', size: 13, weight: 600 };

  // ---- frame: noise level on a log axis, the ratio on a linear one ---------------
  const P = tall ? { l: 46, r: 340, t: 128, b: 400 } : { l: 70, r: 560, t: 70, b: 330 };
  const lx = (p) => P.l + (Math.log(p) - Math.log(rows[0].p)) / (Math.log(rows.at(-1).p) - Math.log(rows[0].p)) * (P.r - P.l);
  const yMin = 0.6, yMax = 1.2;
  const ly = (v) => P.b - (v - yMin) / (yMax - yMin) * (P.b - P.t);
  const head = g(svg);
  if (tall) {
    text(head, 16, 18, 'ahead of plain matching up to 0.6%,', sans);
    text(head, 16, 35, 'behind correlated matching from 0.2%', sans);
  } else text(head, 16, 18, 'ahead of plain matching up to 0.6%, behind correlated matching from 0.2%', sans);
  text(head, 16, tall ? 56 : 40, `our runs · distance 5 · network trained on ${Math.round(d.training_shots / 1e6)} million examples · ${nSeeds} seeds`, { ...mono, width: W - 30, lh: 15 });

  const axes = g(svg);
  for (const v of [0.6, 0.8, 1.0, 1.2]) {
    line(axes, P.l, ly(v), P.r, ly(v), { stroke: C.hairline, 'stroke-width': 1 });
    text(axes, P.l - 8, ly(v) + 4, v.toFixed(1), { ...mono, anchor: 'end' });
  }
  for (const r of rows) if (!tall || [0.001, 0.002, 0.005, 0.01].includes(r.p)) text(axes, lx(r.p), P.b + 18, pc(r.p), { ...mono, anchor: 'middle', size: tall ? 11 : 12 });
  text(axes, (P.l + P.r) / 2, P.b + 38, 'noise level: the chance that any one operation goes wrong', { ...mono, anchor: 'middle', width: P.r - P.l });
  text(axes, P.l - 8, P.t - 12, tall ? 'failures ÷ plain' : 'failures, divided by plain matching\'s', { ...mono, anchor: 'start', size: tall ? 11 : 12 });

  // plain matching: the level line
  const plain = g(svg);
  line(plain, P.l, ly(1), P.r, ly(1), { stroke: C.ink, 'stroke-width': 1.4 });
  if (!tall) text(plain, P.r + 6, ly(1) + 4, 'plain matching', { size: 13 });
  // lower is better, and the side where a decoder beats plain matching
  text(plain, P.l + 6, ly(yMin) - 8, 'lower is better', { italic: true, size: 13, fill: C.muted });

  // the network: seed band, pooled line, dots
  const net = g(svg);
  const band = rel.map((r) => [lx(r.p), ly(r.hi)]).concat(rel.slice().reverse().map((r) => [lx(r.p), ly(r.lo)]));
  path(net, `M${band.map((q) => q.map((v) => v.toFixed(1)).join(' ')).join('L')}Z`, { fill: C.flip, 'fill-opacity': 0.16, stroke: 'none' });
  path(net, `M${rel.map((r) => `${lx(r.p).toFixed(1)} ${ly(r.net).toFixed(1)}`).join('L')}`, { stroke: C.flip, 'stroke-width': 2 });
  for (const r of rel) circle(net, lx(r.p), ly(r.net), 3.4, { fill: C.flip });
  const lastN = rel.at(-1);
  if (!tall) text(net, P.r + 6, ly(lastN.net) + 4, 'network (band: its seeds)', { size: 13, fill: C.flip });

  // correlated matching
  const cor = g(svg);
  path(cor, `M${rel.map((r) => `${lx(r.p).toFixed(1)} ${ly(r.cor).toFixed(1)}`).join('L')}`, { stroke: C.phase, 'stroke-width': 2, 'stroke-dasharray': '6 4' });
  for (const r of rel) circle(cor, lx(r.p), ly(r.cor), 3, { fill: C.paper, stroke: C.phase, 'stroke-width': 1.6 });
  if (!tall) text(cor, P.r + 6, ly(rel.at(-1).cor) + 4, 'correlated matching', { size: 13, fill: C.phase });
  if (tall) {
    // on a narrow screen the names stand in a key under the title
    const ky = 92, key = g(svg);
    line(key, 16, ky - 4, 34, ky - 4, { stroke: C.ink, 'stroke-width': 1.4 }); text(key, 40, ky, 'plain', { size: 13 });
    line(key, 96, ky - 4, 114, ky - 4, { stroke: C.flip, 'stroke-width': 2 }); text(key, 120, ky, 'network', { size: 13, fill: C.flip });
    line(key, 196, ky - 4, 214, ky - 4, { stroke: C.phase, 'stroke-width': 2, 'stroke-dasharray': '6 4' }); text(key, 220, ky, 'correlated', { size: 13, fill: C.phase });
  }

  st.fade(axes, -1, 0).fade(plain, 0.05, 0.25).fade(net, 0.3, 0.6).fade(cor, 0.55, 0.85);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
