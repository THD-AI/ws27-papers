// Slide 14: our runs (learning.json), at a noise level of 0.5%. Two panels,
// one per distance (their runs differ in length, so the rates are not set
// against each other). The seeds as a band from the lowest to the highest
// seed with the median in accent; plain matching ink, correlated dashed ink,
// the lookup table (distance 3 only) dotted. The distance-5 axis is fixed at
// 250 million from the second build, so the last build adds data only.
import { C, L, R, svgOf, T, frame, ln, pth, h } from '../../kit.js';

const pct = (v, dg = 2) => `${(v * 100).toFixed(dg)}%`;

export default {
  id: 'ours', n: 14, part: 'Content', builds: 3, speaker: 'C',
  title: 'Ours passed plain matching at distance 5 only after about 250 million examples.',
  clicks: ['distance 3', 'distance 5, 66 million', 'distance 5, about 250 million'],
  draw(page, b, data) {
    const svg = svgOf(page);
    const [p3, p66, p250] = data.learning.panels;
    frame(svg, {
      title: this.title, n: this.n, part: this.part,
      source: 'Simulated, our own runs at 0.5% per operation (OWN-D3, OWN-D5, OWN-D5-250M). Curve points on 1 million runs; the end values on 2 million. The falling learning rate in each run’s last fifth helps the end of every curve.',
    });
    const panel = (x0, x1, xmax, ylo, yhi, head) => {
      const y0 = 360, y1 = 830;
      const X = (n) => x0 + ((Math.log10(n) - Math.log10(4e5)) / (Math.log10(xmax) - Math.log10(4e5))) * (x1 - x0);
      const Y = (r) => y1 - ((r - ylo) / (yhi - ylo)) * (y1 - y0);
      ln(svg, x0, y0, x0, y1); ln(svg, x0, y1, x1, y1);
      T(svg, x0, y0 - 30, head, { size: 36, weight: 600 });
      const ticks = [1e6, 1e7, 1e8].filter((v) => v <= xmax);
      ticks.forEach((v) => { ln(svg, X(v), y1, X(v), y1 + 12); T(svg, X(v), y1 + 48, v === 1e6 ? '1 million' : v === 1e7 ? '10 million' : '100 million', { size: 32, anchor: 'middle', fill: C.muted }); });
      const yt = []; for (let r = Math.ceil(ylo * 1000) / 1000; r <= yhi + 1e-9; r += 0.004) yt.push(r);
      yt.forEach((r) => { ln(svg, x0 - 10, Y(r), x0, Y(r)); T(svg, x0 - 16, Y(r) + 10, pct(r, 1), { size: 32, anchor: 'end', fill: C.muted }); });
      const clipId = `c${x0}`;
      const cp = h('clipPath', { id: clipId }, svg); h('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, cp);
      const gc = h('g', { 'clip-path': `url(#${clipId})` }, svg);
      return { X, Y, gc, x0, x1, y0, y1 };
    };
    const level = (P, r, dash, col = C.ink) => ln(P.gc, P.x0, P.Y(r), P.x1, P.Y(r), { stroke: col, 'stroke-width': 4, 'stroke-dasharray': dash || null });
    const band = (P, panelData) => {
      const xs = panelData.curves[0].points.map((p) => p.training_shots);
      const at = (i) => panelData.curves.map((c) => c.points[i]?.rate).filter((v) => v != null).sort((a, z) => a - z);
      const lo = xs.map((x, i) => [P.X(x), P.Y(at(i)[0])]), hi = xs.map((x, i) => [P.X(x), P.Y(at(i)[at(i).length - 1])]);
      const med = xs.map((x, i) => { const v = at(i); return [P.X(x), P.Y(v[Math.floor(v.length / 2)])]; });
      pth(P.gc, `M${hi.map((q) => q.join(' ')).join('L')}L${lo.reverse().map((q) => q.join(' ')).join('L')}Z`, { fill: C.field, stroke: 'none' });
      pth(P.gc, `M${med.map((q) => q.join(' ')).join('L')}`, { stroke: C.accent, 'stroke-width': 5 });
    };
    // left: distance 3
    const A = panel(L + 110, 860, 7e7, 0.012, 0.024, 'Distance 3');
    level(A, p3.levels.plain.rate); level(A, p3.levels.correlated.rate, '18 12'); level(A, p3.levels.table.rate, '3 10');
    band(A, p3);
    T(svg, A.x0 + 20, A.Y(p3.levels.plain.rate) - 16, `plain ${pct(p3.levels.plain.rate)}`, { size: 32 });
    T(svg, A.x1, A.Y(p3.final_network.mean) + 52, `network ${pct(p3.final_network.mean)}`, { size: 44, weight: 600, fill: C.accent, anchor: 'end' });
    T(svg, L, 928, `dashed: correlated ${pct(p3.levels.correlated.rate)}, the lead over it not counted`, { size: 32 });
    T(svg, L, 966, `dotted: the lookup table ${pct(p3.levels.table.rate)}, our best-possible estimate`, { size: 32 });
    if (b < 1) return;
    // right: distance 5, axis fixed at 250 million
    const B = panel(1080, R, 2.6e8, 0.010, 0.026, 'Distance 5');
    const p5 = b >= 2 ? p250 : p66;
    level(B, p5.levels.plain.rate); level(B, p5.levels.correlated.rate, '18 12');
    band(B, p5);
    T(svg, B.x0 + 20, B.Y(p5.levels.plain.rate) - 16, `plain ${pct(p5.levels.plain.rate)}`, { size: 32 });
    T(svg, B.x0 + 20, B.Y(p5.levels.correlated.rate) - 16, `correlated ${pct(p5.levels.correlated.rate)}`, { size: 32 });
    if (b === 1) { T(svg, B.x0 + 20, 450, 'after 66 million:', { size: 36, weight: 600, fill: C.accent }); T(svg, B.x0 + 20, 494, 'behind in all five seeds', { size: 36, weight: 600, fill: C.accent }); }
    if (b >= 2) { T(svg, B.x0 + 20, 450, 'after about 250 million:', { size: 36, weight: 600, fill: C.accent }); T(svg, B.x0 + 20, 506, `network ${pct(p250.final_network.mean)}`, { size: 44, weight: 600, fill: C.accent }); }
  },
};
