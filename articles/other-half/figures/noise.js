// noise: the long run at eight noise levels. Eight small panels, each with
// its own vertical scale from zero (the rates span a factor of almost a
// thousand). In a panel: plain matching (open), correlated matching (filled),
// the network (accent, pooled, with its five seeds as small dots), each with
// its 95% interval. The words under a panel are the verdicts in the data.
// Everything is from data/noise.json.
import {
  mountFigure, svgRoot, g, line, circle, penRing, stage, fmt,
} from '../../../lib/fig.js';
import { pal, dotPlate, text, floor } from './shared.js';

export const steps = 1;
// seconds the drawing plays once 40% of it is in view: eight panels, in order
export const durations = { medium: [2.0] };
const SIZE = { wide: [720, 452], tall: [360, 808] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

function verdict(r) {
  if (r.network_vs_correlated === 'level') return 'intervals overlap';
  if (r.network_vs_correlated === 'ahead') return 'ahead of both';
  if (r.network_vs_plain === 'ahead') return 'between the two';
  if (r.network_vs_plain === 'level') return 'intervals overlap';
  return 'behind both';
}
// a round number just above v, for the top of a panel's scale
function niceTop(v) {
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * e >= v * 1.2) return m * e;
  return 10 * e;
}
const pc = (v) => `${+(v * 100).toPrecision(3)}%`;

function build(el, ctx) {
  floor(ctx.layout === 'tall' ? 13.8 : 12.45);
  const C = pal(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const rows = d.rows, nSeeds = d.seeds.length;
  const runs = rows[0].network.pooled.shots;
  const svg = svgRoot(el, W, H,
    `Our own simulated runs at distance 5, network trained on ${Math.round(d.training_shots / 1e6)} million examples, ${nSeeds} seeds: share of runs in which each decoder was wrong at ${rows.length} noise levels. `
    + rows.map((r) => `At ${pc(r.p)} network versus matchers: ${verdict(r)} (network ${pc(r.network.pooled.rate)}, plain matching ${pc(r.plain.pooled.rate)}, correlated matching ${pc(r.correlated.pooled.rate)})`).join('. ')
    + '. At the lowest noise the separate network and correlated matching intervals overlap. As noise grows the network fails more often than correlated matching, and at the two highest levels it also fails more often than plain matching.');
  svg.style.color = C.ink;
  const st = stage();
  const mono = { family: 'mono', size: 11.5, fill: C.muted };
  const noteO = { italic: true, size: tall ? 12.5 : 13.5 };
  const x0 = tall ? 16 : 14, pw = tall ? 76 : 78, gap = tall ? 8 : 10, ph = tall ? 146 : 170, perRow = tall ? 4 : 8;

  const head = g(svg);
  text(head, x0, 16, tall ? 'share of runs the decoder got wrong ·' + String.fromCharCode(10) + 'lower is better' : 'share of runs the decoder got wrong · lower is better', { family: 'sans', size: 13, weight: 600, lh: 16 });
  const tg = text(head, x0, tall ? 52 : 35, `our runs · simulation · distance 5 · network trained on ${Math.round(d.training_shots / 1e6)} million examples · ${nSeeds} seeds, ${Math.round(runs / 1e6)} million runs per level`, { ...mono, width: W - x0 - 10, lh: 15 });
  // the three marks, named once and without a box
  let kx = x0;
  const ky = tg.bottom + 18;
  const key = (draw, label) => {
    draw(kx + 5, ky - 4);
    const t = text(head, kx + 15, ky, label, { family: 'sans', size: 12 });
    kx = t.right + (tall ? 12 : 22);
    if (tall && kx > 200) { kx = x0; }
  };
  key((x, y) => circle(head, x, y, 3.6, { fill: C.paper, stroke: C.ink, 'stroke-width': 1.4 }), 'plain matching');
  key((x, y) => circle(head, x, y, 4, { fill: C.ink }), 'correlated matching');
  const ky2 = tall ? ky + 18 : ky;
  if (tall) kx = x0;
  circle(head, kx + 5, ky2 - 4, 4, { fill: C.accent });
  const kt = text(head, kx + 15, ky2, 'network, all seeds together', { family: 'sans', size: 12 });
  circle(head, kt.right + (tall ? 12 : 22), ky2 - 4, 1.7, { fill: C.accent });
  text(head, kt.right + (tall ? 20 : 30), ky2, 'one seed', { family: 'sans', size: 12 });
  st.fade(head, 0, 0.12);

  if (pw < 82) text(head, x0, ky2 + 22, 'one panel per noise level', mono);
  const top0 = ky2 + (pw < 82 ? 56 : 36);
  const rowH = ph + (tall ? 78 : 0);
  const anchors = {};
  let hidden = false;
  rows.forEach((r, i) => {
    const col = i % perRow, rw = Math.floor(i / perRow);
    const px = x0 + col * (pw + gap), py = top0 + rw * rowH, grp = g(svg), mk = g(svg);
    const all = [r.plain.pooled.ci95[1], r.correlated.pooled.ci95[1], r.network.pooled.ci95[1], ...r.network.per_seed.map((s) => s.rate)];
    const top = niceTop(Math.max(...all));
    const y = (v) => py + ph * (1 - v / top);
    text(grp, px, py - 9, `${pw < 82 ? '' : 'noise '}${pc(r.p).replace(/^(\d)%$/, '$1.0%')}`, { family: 'mono', size: tall ? 12 : 13, weight: 500 });
    dotPlate(grp, px, py, pw, ph, tall ? 19 : 16, C, 0.8);
    line(grp, px, py + ph, px + pw, py + ph, { stroke: C.ink, 'stroke-width': 1.25 });
    line(grp, px, py, px, py + ph, { stroke: C.ink, 'stroke-width': 0.8 });
    line(grp, px - 3, py, px + 3, py, { stroke: C.ink, 'stroke-width': 0.8 });
    text(grp, px + 7, py + 14, pc(top), mono);
    text(grp, px + 6, py + ph - 5, '0', mono);
    // the hairline at correlated matching's value
    const yc = y(r.correlated.pooled.rate);
    line(grp, px, yc, px + pw, yc, { stroke: C.ink, 'stroke-width': 0.7, 'stroke-opacity': 0.55 });
    const X = [px + pw * 0.24, px + pw * 0.5, px + pw * 0.78];
    const whisk = (x, ci, col2) => {
      line(mk, x, y(ci[0]), x, y(ci[1]), { stroke: col2, 'stroke-width': 1 });
      for (const v of ci) line(mk, x - 3.5, y(v), x + 3.5, y(v), { stroke: col2, 'stroke-width': 1 });
      if (y(ci[0]) - y(ci[1]) < 9) hidden = true;
    };
    whisk(X[0], r.plain.pooled.ci95, C.ink);
    circle(mk, X[0], y(r.plain.pooled.rate), 3.6, { fill: C.paper, stroke: C.ink, 'stroke-width': 1.4 });
    whisk(X[1], r.correlated.pooled.ci95, C.ink);
    circle(mk, X[1], yc, 4, { fill: C.ink });
    r.network.per_seed.forEach((s, k) => circle(mk, X[2] + (k - (nSeeds - 1) / 2) * 4.2, y(s.rate), 1.7, { fill: C.accent, 'fill-opacity': 0.75 }));
    whisk(X[2], r.network.pooled.ci95, C.accent);
    circle(mk, X[2], y(r.network.pooled.rate), 4, { fill: C.accent, stroke: C.paper, 'stroke-width': 0.8 });
    const vt = text(grp, px, py + ph + 18, verdict(r), { ...noteO, width: tall ? pw - 8 : pw + 6, lh: 15 });
    anchors[i] = { x: px + pw / 2, bottom: vt.bottom, px, py, cx: (X[1] + X[2]) / 2, cy: (yc + y(r.network.pooled.rate)) / 2, rx: (X[2] - X[1]) / 2 + 17 };
    const a = 0.08 + i * 0.085;
    st.fade(grp, a, a + 0.12).fade(mk, a + 0.08, a + 0.2);
  });

  // the two notes that belong to single panels
  const ng = g(svg);
  const lowest = rows.findIndex((r) => !r.trained_at_this_level);
  const split = rows.findIndex((r) => r.seeds_ahead_of_plain > 0 && r.seeds_ahead_of_plain < nSeeds);
  const ny = top0 + (tall ? 2 * rowH : ph) + (tall ? 4 : 72);
  let bottom = ny;
  if (lowest >= 0) {
    const r = rows[lowest];
    const t = text(ng, x0, ny, `[[${pc(r.p)}]]: a noise level the network never saw in training. [[${fmt(r.network.pooled.errors)} against ${fmt(r.correlated.pooled.errors)}]] wrong in [[${Math.round(runs / 1e6)} million]] runs`, { ...noteO, width: tall ? W - 32 : 390, lh: 17 });
    bottom = t.bottom;
  }
  if (split >= 0) {
    const r = rows[split], a = anchors[split];
    const by = Math.round((1 - r.network_over_plain) * 100);
    const t = text(ng, tall ? x0 : a.px, tall ? bottom + 20 : ny, `[[${pc(r.p)}]]: [[${by}%]] fewer failures than plain matching; ${WORDS[r.seeds_ahead_of_plain]} of ${WORDS[nSeeds]} seeds ahead`, { ...noteO, width: tall ? W - 32 : W - a.px - 10, lh: 17 });
    bottom = Math.max(bottom, t.bottom);
  }
  const fy = bottom + (tall ? 24 : 30);
  const own = text(ng, x0, fy, `each panel has its own scale, from zero${hidden ? '; where no whisker shows, the 95% interval is smaller than the mark' : ''}`, { ...noteO, fill: C.muted, width: W - 32, lh: 16 });
  if (tall) text(ng, x0, own.bottom + 16, 'compared: 95% intervals of the pooled values', { ...mono, width: W - 28, lh: 15 });
  else text(ng, x0, own.bottom + 16, 'compared: 95% intervals of the pooled values', mono);
  st.fade(ng, 0.82, 0.98);
  if (lowest >= 0) {
    const a = anchors[lowest];
    const pr = penRing(svg, a.cx, a.cy, a.rx, 15, { seed: 12, stroke: C.ink, width: 1.4 });
    pr.paths.forEach((pp, k) => st.draw(pp, 0.86 + k * 0.03, 0.97 + k * 0.02));
  }

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
