// line: the one mistake that matters. A grid of distance 5 with the checks
// for flips only, three times: what happened (three flips), what the chip
// reports (one fired check), what the decoder adds (two more flips, and the
// line now crosses the grid). All of it from data/line.json.
import {
  mountFigure, svgRoot, g, line, stage,
} from '../fig.js';
import { pal, grid, errMark, text, floor } from './shared.js';

export const steps = 1;
// seconds the drawing plays once 40% of it is in view: the grid three times
// (what happened, what the chip reports, what the decoder adds), then the sum
export const durations = { medium: [2.0] };
const SIZE = { wide: [560, 400], tall: [360, 610] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

function build(el, ctx) {
  floor(ctx.layout === 'tall' ? 13.8 : 0);
  const C = pal(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const nReal = d.real_errors.length, nAdd = d.decoder_correction.length;
  const svg0 = svgRoot(el, W, H,
    `${nReal} real flips in one column of a grid of distance ${d.distance} fire ${d.fired_by_real_errors.length} check. `
    + `The decoder's shortest explanation adds ${nAdd} more flips below it. Errors and correction together cross the grid from the ${d.crosses_from} to the ${d.crosses_to}: the stored value has changed and no check fires.`);
  svg0.style.color = C.ink;
  text(svg0, tall ? 16 : 20, 18, tall ? 'the one mistake that matters' : `the one mistake that matters, on a grid of distance ${d.distance}`, { family: 'sans', size: 13, weight: 600 });
  text(svg0, tall ? 16 : 20, H - 14, 'a full line of flips fires no check: an error nobody sees', { size: tall ? 13.5 : 14.5 });
  const svg = g(svg0, { transform: 'translate(0 26)' });
  const st = stage();
  const pitch = tall ? 27 : 30, er = tall ? 9.8 : 8.3;
  const P = tall
    ? [0, 1, 2].map((i) => ({ cx: 84, cy: 100 + i * 180, tx: 172, ty: 46 + i * 180, tw: 178 }))
    : [0, 1, 2].map((i) => ({ cx: 95 + i * 185, cy: 132, tx: 95 + i * 185 - 75, ty: 30, tw: 170 }));
  const titles = ['what happened', 'what the chip reports', 'what the decoder adds'];
  const noteO = { italic: true, size: 13.5 };
  const monoO = { family: 'mono', size: 12, weight: 500 };
  const below = (p) => (tall ? p.ty + 24 : p.cy + pitch * 2 + 46);

  const plates = P.map((p, i) => {
    const grp = g(svg);
    const G = grid(grp, { checks: d.flip_checks, d: d.distance, cx: p.cx, cy: p.cy, pitch, C, qr: 4.6, helper: 1.5 });
    const head = g(svg);
    text(head, tall ? p.tx : p.cx, p.ty, titles[i], { family: 'sans', size: 13, weight: 600, anchor: tall ? 'start' : 'middle' });
    st.fade(grp, i * 0.26, i * 0.26 + 0.16).fade(head, i * 0.26, i * 0.26 + 0.16);
    return G;
  });
  const marks = (G, qs, kind, a) => qs.map((q, k) => {
    const [x, y] = G.pos(q);
    const m = errMark(G.gE, x, y, er, 'X', C, kind);
    m.setAttribute('data-audit', 'skip');
    st.fade(m, a + k * 0.03, a + k * 0.03 + 0.1);
    return m;
  });
  const anchor = tall ? 'start' : 'middle';
  const tx = (p) => (tall ? p.tx : p.cx);

  // 1: what happened
  marks(plates[0], d.real_errors, 'real', 0.1);
  const n1 = g(svg);
  text(n1, tx(P[0]), below(P[0]), `${nReal} real`, { ...monoO, anchor });
  text(n1, tall ? P[0].tx : P[0].cx, below(P[0]) + 26, 'only the checks for flips are drawn', { ...noteO, fill: C.muted, anchor, width: tall ? P[0].tw : 170 });
  st.fade(n1, 0.2, 0.3);

  // 2: what the chip reports
  const fired = d.fired_by_real_errors.map((id) => plates[1].tiles[id]);
  st.on((gg) => { const p = Math.min(1, Math.max(0, (gg - 0.42) / 0.14)); fired.forEach((t) => t.setFired(p)); });
  const n2 = g(svg);
  text(n2, tx(P[1]), below(P[1]) + 1, fired.length === 1 ? 'one check fired' : `${fired.length} checks fired`, { ...noteO, anchor });
  st.fade(n2, 0.5, 0.6);

  // 3: what the decoder adds, and the line across the grid
  const G3 = plates[2];
  const top = G3.pos(d.together[0]), bot = G3.pos(d.together[d.together.length - 1]);
  const reach = pitch * 0.62;
  const cross = line(G3.gE, top[0], top[1] - reach, bot[0], bot[1] + reach, { stroke: C.accent, 'stroke-width': 2.5, 'stroke-linecap': 'round' });
  marks(G3, d.real_errors, 'real', 0.62);
  marks(G3, d.decoder_correction, 'added', 0.74);
  st.draw(cross, 0.82, 0.97);
  const n3 = g(svg);
  const sum = nReal + nAdd;
  const cnt = text(n3, tall ? P[2].tx : P[2].cx, below(P[2]), `${nReal} real + ${nAdd} added = ${sum}${sum === d.distance ? '\n= the distance' : ''}`, { ...monoO, anchor, lh: 16 });
  text(n3, tall ? P[2].tx : P[2].cx - 86, cnt.bottom + 20, 'errors and correction cross the grid: the stored value has changed, no check fires', { ...noteO, width: tall ? P[2].tw : 182 });
  st.fade(n3, 0.88, 0.98);

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
