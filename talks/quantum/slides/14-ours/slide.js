// Slide 14: our runs (learning.json), at a noise level of 0.5%. Two panels,
// one per distance (their runs differ in length, so the rates are not set
// against each other), each on a linear axis of examples in millions, so the
// crossings sit where the room can see them. The seeds as a band from the
// lowest to the highest seed with the median in accent; plain matching ink,
// correlated matching dashed ink, the lookup table (distance 3 only) dotted.
// Build 1: distance 3, and distance 5 after 66 million (axis already at 260
// million); build 2 adds the run to about 250 million.
import { C, L, R, svgOf, T, frame, ln, pth, h } from '../../kit.js';

const pct = (v, dg = 2) => `${(v * 100).toFixed(dg)}%`;

export default {
  id: 'ours', n: 14, part: 'Content', builds: 2, speaker: 'C',
  title: 'Ours passed plain matching at distance 5 only after about 250 million examples.',
  clicks: ['distance 3; distance 5 after 66 million', 'distance 5, about 250 million'],
  draw(page, b, data) {
    const svg = svgOf(page);
    const [p3, p66, p250] = data.learning.panels;
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Simulated, our own runs at 0.5% per operation (OWN-D3, OWN-D5, OWN-D5-250M): share of runs (3 rounds at distance 3, 5 at distance 5) that ended wrong. Curve points on 1 million runs, end values on 2 million.',
    });
    T(svg, L, 312, 'share of simulated runs (3 rounds at distance 3, 5 at distance 5) that ended wrong', { size: 32, weight: 600 });
    const panel = (x0, x1, xmax, step, ylo, yhi, head) => {
      const y0 = 420, y1 = 830;
      const X = (n) => x0 + (n / xmax) * (x1 - x0);
      const Y = (r) => y1 - ((r - ylo) / (yhi - ylo)) * (y1 - y0);
      ln(svg, x0, y0, x0, y1); ln(svg, x0, y1, x1, y1);
      T(svg, x0, y0 - 26, head, { size: 36, weight: 600 });
      for (let v = 0; v <= xmax + 1; v += step) { ln(svg, X(v), y1, X(v), y1 + 12); T(svg, X(v), y1 + 46, String(v / 1e6), { size: 32, anchor: 'middle', fill: C.ink }); }
      T(svg, x1, y1 + 88, 'examples seen, millions', { size: 32, anchor: 'end', fill: C.muted });
      for (let r = ylo; r <= yhi + 1e-9; r += (yhi - ylo > 0.01 ? 0.004 : 0.002)) { ln(svg, x0 - 10, Y(r), x0, Y(r)); T(svg, x0 - 16, Y(r) + 11, pct(r, 1), { size: 32, anchor: 'end', fill: C.muted }); }
      const clipId = `c${x0}`;
      const cp = h('clipPath', { id: clipId }, svg); h('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, cp);
      const gc = h('g', { 'clip-path': `url(#${clipId})` }, svg);
      return { X, Y, gc, x0, x1, y0, y1 };
    };
    const level = (P, r, dash) => ln(P.gc, P.x0, P.Y(r), P.x1, P.Y(r), { stroke: C.ink, 'stroke-width': 4, 'stroke-dasharray': dash || null });
    const band = (P, pd) => {
      const xs = pd.curves[0].points.map((p) => p.training_shots);
      const at = (i) => pd.curves.map((c) => c.points[i]?.rate).filter((v) => v != null).sort((a, z) => a - z);
      const lo = xs.map((x, i) => [P.X(x), P.Y(at(i)[0])]), hi = xs.map((x, i) => [P.X(x), P.Y(at(i)[at(i).length - 1])]);
      const med = xs.map((x, i) => { const v = at(i); return [P.X(x), P.Y(v[Math.floor(v.length / 2)])]; });
      pth(P.gc, `M${hi.map((q) => q.join(' ')).join('L')}L${lo.reverse().map((q) => q.join(' ')).join('L')}Z`, { fill: C.field, stroke: 'none' });
      pth(P.gc, `M${med.map((q) => q.join(' ')).join('L')}`, { stroke: C.accent, 'stroke-width': 5 });
      return med[med.length - 1];
    };
    // each line named at its right end, outside the plot, so no label crosses a curve
    const tag = (P, r, str, o = {}) => T(svg, P.x1 + 14, P.Y(r) + 11 + (o.dy || 0), str, { size: 32, ...o });
    // left: distance 3, 0 to 70 million
    const A = panel(L + 120, 660, 70e6, 10e6, 0.014, 0.020, 'Distance 3');
    level(A, p3.levels.plain.rate); level(A, p3.levels.correlated.rate, '18 12'); level(A, p3.levels.table.rate, '3 10');
    band(A, p3);
    tag(A, p3.levels.plain.rate, `plain ${pct(p3.levels.plain.rate)}`, { dy: -6 });
    tag(A, p3.levels.correlated.rate, `correlated ${pct(p3.levels.correlated.rate)}`, { dy: 8 });
    tag(A, p3.levels.correlated.rate, 'its lead not counted (B4)', { dy: 44, fill: C.muted });
    tag(A, p3.final_network.mean, `network ${pct(p3.final_network.mean)}`, { dy: -22, weight: 600, fill: C.accent });
    tag(A, p3.levels.table.rate, `lookup table ${pct(p3.levels.table.rate)}`, { dy: 20 });
    // right: distance 5, 0 to 260 million, fixed from the first build
    const B = panel(1180, 1540, 260e6, 50e6, 0.010, 0.028, 'Distance 5');
    level(B, p66.levels.plain.rate); level(B, p66.levels.correlated.rate, '18 12');
    tag(B, p66.levels.plain.rate, `plain ${pct(p66.levels.plain.rate)}`, { dy: -14 });
    tag(B, p66.levels.correlated.rate, `correlated ${pct(p66.levels.correlated.rate)}`, { dy: 14 });
    if (b === 0) {
      const [ex, ey] = band(B, p66);
      T(svg, ex + 24, ey - 40, 'after 66 million:', { size: 32, weight: 600, fill: C.accent });
      T(svg, ex + 24, ey, 'behind in all five seeds', { size: 32, weight: 600, fill: C.accent });
    } else {
      band(B, p250);
      tag(B, p250.final_network.mean, `network ${pct(p250.final_network.mean)}`, { dy: 18, weight: 600, fill: C.accent });
    }
  },
};
