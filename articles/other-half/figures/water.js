// water: a qubit doesn't hold still. A pattern drawn on water at four moments,
// one lifetime apart: what is left of it follows exp(-t / 85 µs), the median
// qubit lifetime on Google's 2024 chip. Each panel fades and blurs the drawn
// pattern by that much. Everything from data/water.json (tools/water-data.mjs).
import { mountFigure, svgRoot, g, h, rect, path, stage } from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 1;
// seconds the drawing plays once 40% of it is in view: the four moments, left to right
export const durations = { medium: [2.4] };
const SIZE = { wide: [560, 270], tall: [360, 424] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };
const WATER = '#E3E9E7';

function build(el, ctx) {
  const tall = ctx.layout === 'tall';
  floor(tall ? 13.8 : 12.45);
  const C = pal(ctx), d = ctx.data, M = d.moments;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H,
    `A pattern drawn on water, at four moments ${d.lifetime_us} millionths of a second apart: `
    + M.map((m) => `after ${m.t} µs, ${Math.round(m.left * 100)}% of it is left`).join('; ')
    + `. ${d.lifetime_us} µs is the median qubit lifetime on Google's 2024 chip; it is a rate of fading, not a deadline.`);
  svg.style.color = C.ink;
  const st = stage();
  const mono = { family: 'mono', size: tall ? 11.5 : 12, fill: C.muted };
  const sans = { family: 'sans', size: 13, weight: 600 };
  if (tall) {
    text(svg, 16, 18, 'a qubit doesn\'t hold still:', sans);
    text(svg, 16, 35, 'a third is left after 85 millionths of a second', sans);
  } else text(svg, 16, 18, 'a qubit doesn\'t hold still: a third is left after 85 millionths of a second', sans);
  text(svg, 16, tall ? 56 : 39, 'Google Quantum AI, 2024, Section II: median qubit lifetime 85 µs · what is left: e^(−t / 85 µs)', { ...mono, width: W - 30, lh: 15 });

  const defs = h('defs', null, svg);
  const pw = tall ? 160 : 118, ph = tall ? 118 : 136;
  const pos = (k) => (tall ? [16 + (k % 2) * (pw + 12), 100 + Math.floor(k / 2) * (ph + 40)] : [16 + k * (pw + 18), 64]);
  M.forEach((m, k) => {
    const [x, y] = pos(k), cx = x + pw / 2, cy = y + ph / 2 - 4;
    const grp = g(svg);
    // the water: a soft vertical fall of tone, and the light on its surface as faint drawn lines
    const gid = `water-g-${tall ? 't' : 'w'}-${k}-${Math.round(Math.random() * 1e6)}`;
    const lg = h('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    h('stop', { offset: '0', 'stop-color': '#EEF2F1' }, lg); h('stop', { offset: '1', 'stop-color': '#D5DFDC' }, lg);
    rect(grp, x, y, pw, ph, { rx: 3, fill: `url(#${gid})` });
    // the water's surface, drawn
    const s = g(grp, { transform: `translate(${cx} ${y + ph - 18}) scale(${pw / 130} 1)` });
    for (const dd of d.pen.surface) path(s, dd, { fill: C.ink, 'fill-opacity': 0.22, stroke: 'none', 'data-audit': 'skip' });
    const s2 = g(grp, { transform: `translate(${cx} ${y + 20}) scale(${pw / 150} 0.8)` });
    for (const dd of d.pen.surface) path(s2, dd, { fill: C.paper, 'fill-opacity': 0.9, stroke: 'none', 'data-audit': 'skip' });
    // the pattern: as much as is left, blurred by as much as is gone
    const id = `water-blur-${tall ? 't' : 'w'}-${k}-${Math.round(Math.random() * 1e6)}`;
    const flt = h('filter', { id, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    h('feGaussianBlur', { stdDeviation: ((1 - m.left) * 1.6).toFixed(2) }, flt);
    // the pattern spreads as it fades, as rings on water do; what is left of it is its opacity
    const spread = (tall ? 1.15 : 1.05) * (1 + 0.45 * (1 - m.left));
    const pat = g(grp, { transform: `translate(${cx} ${cy}) scale(${spread.toFixed(3)})`, filter: m.left < 0.999 ? `url(#${id})` : null, opacity: m.left.toFixed(3) });
    for (const dd of d.pen.pattern) path(pat, dd, { fill: C.ink, stroke: 'none', 'data-audit': 'skip' });
    text(grp, x, y + ph + 18, `${m.t} µs`, { family: 'mono', size: 13 });
    text(grp, x + pw, y + ph + 18, `${Math.round(m.left * 100)}% left`, { ...mono, anchor: 'end' });
    st.fade(grp, 0.05 + k * 0.2, 0.25 + k * 0.2);
  });
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
