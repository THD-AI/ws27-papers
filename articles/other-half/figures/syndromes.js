// syndromes: all 256 patterns of the eight checks at distance 3, one small
// square each. A filled square is a pattern where plain matching's answer is
// not the most likely one (103 of them). One pattern is shown enlarged, so
// that a square can be read as "which of the 8 checks fired". States, order
// and counts are from data/syndromes.json; nothing is sized or shaded by
// probability.
import {
  mountFigure, svgRoot, g, rect, path, circle, bracket, penRing, stage,
} from '../../../lib/fig.js';
import { pal, grid, text, floor } from './shared.js';

export const steps = 1;
// seconds the drawing plays once 40% of it is in view: 256 squares, then
// the one pattern enlarged
export const durations = { medium: [2.0] };
const SIZE = { wide: [720, 504], tall: [360, 760] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

// Where the eight checks sit, in the layout of data/lattice.json (the
// pattern strings list z0 z1 z2 z3 and x0 x1 x2 x3 in this order).
const CHECKS = [
  { id: 'z0', asks_about: 'flips', shape: 'square', qubits: [1, 2, 4, 5] },
  { id: 'z1', asks_about: 'flips', shape: 'square', qubits: [3, 4, 6, 7] },
  { id: 'z2', asks_about: 'flips', shape: 'half', edge: 'left', qubits: [0, 3] },
  { id: 'z3', asks_about: 'flips', shape: 'half', edge: 'right', qubits: [5, 8] },
  { id: 'x0', asks_about: 'phase errors', shape: 'square', qubits: [0, 1, 3, 4] },
  { id: 'x1', asks_about: 'phase errors', shape: 'square', qubits: [4, 5, 7, 8] },
  { id: 'x2', asks_about: 'phase errors', shape: 'half', edge: 'top', qubits: [1, 2] },
  { id: 'x3', asks_about: 'phase errors', shape: 'half', edge: 'bottom', qubits: [6, 7] },
];

function build(el, ctx) {
  floor(ctx.layout === 'tall' ? 13.8 : 12.45);
  const C = pal(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const n = d.grid.order.length, cnt = d.counts;
  const share = `${(d.share_of_all_cases_with_a_differing_pattern * 100).toFixed(1)}%`;
  const none = `${Math.round(d.share_of_all_cases_with_no_check_fired * 100)}%`;
  const dist = Math.round(Math.sqrt(Math.log2(cnt.patterns) + 1));   // d * d - 1 checks
  const err = `${Math.round(d.conditions.error_per_storing_qubit * 100)}%`;
  const svg = svgRoot(el, W, H,
    `The eight checks of the smallest grid can fire in ${cnt.patterns} patterns. In ${cnt.differs} of them plain matching's answer is not the most likely one. `
    + `They occur in about ${share} of cases; in ${none} of cases no check fires. Counted by us at distance ${dist} with ${err} error per storing qubit and checks that are never wrong.`);
  svg.style.color = C.ink;
  const st = stage();
  const noteO = { italic: true, size: tall ? 13 : 14.5 };
  const mono = { family: 'mono', size: tall ? 11.5 : 12, fill: C.muted };

  const hd = g(svg);
  text(hd, tall ? 14 : 20, 18, `every pattern in which the ${CHECKS.length} checks of the smallest grid can fire`, { family: 'sans', size: 13, weight: 600, width: W - 30, lh: 16 });
  st.fade(hd, 0, 0.1);

  const c = tall ? 19 : 22, sq = c - (tall ? 6 : 8);
  const fx = tall ? 44 : 92, fy = tall ? 112 : 98, fw = n * c;
  const rowsG = Array.from({ length: n }, () => g(svg));
  let ex = null;
  for (const cell of d.cells) {
    const x = fx + cell.col * c + (c - sq) / 2, y = fy + cell.row * c + (c - sq) / 2;
    const differs = cell.state === 'differs';
    rect(rowsG[cell.row], x, y, sq, sq, differs
      ? { fill: C.ink, 'fill-opacity': 0.78, 'data-audit': 'skip' }
      : { fill: 'none', stroke: C.muted, 'stroke-width': 0.8, 'stroke-opacity': 0.7, 'data-audit': 'skip' });
    if (cell.flip_checks === d.example.flip_checks && cell.phase_checks === d.example.phase_checks) ex = cell;
  }
  rowsG.forEach((rg, i) => st.fade(rg, 0.04 + i * 0.03, 0.16 + i * 0.03));

  // brackets over the groups: how many checks of that kind fired
  const groups = [];
  d.grid.order.forEach((pat, i) => {
    const k = [...pat].filter((ch) => ch === '1').length;
    if (!groups[k]) groups[k] = { k, a: i, b: i }; else groups[k].b = i;
  });
  const lab = g(svg), mid = { ...mono, anchor: 'middle' };
  const bk = { stroke: C.muted, 'stroke-width': 1 };
  for (const gr of groups) {
    const a = gr.a * c + 3, b = (gr.b + 1) * c - 3;
    bracket(lab, fx + a, fy - 7, fx + b, fy - 7, -4, bk);
    text(lab, fx + (a + b) / 2, fy - 15, String(gr.k), mid);
    bracket(lab, fx - 7, fy + a, fx - 7, fy + b, 4, bk);
    text(lab, fx - 19, fy + (a + b) / 2 + 4, String(gr.k), mid);
  }
  const lo = groups[0].k, hi = groups[groups.length - 1].k;
  const sans = { family: 'sans', size: 12, fill: C.muted };
  if (tall) {
    text(lab, fx, fy - 54, `across: phase errors, ${lo} … ${hi} checks fired`, sans);
    text(lab, fx, fy - 38, `down: flips, ${lo} … ${hi} checks fired`, sans);
  } else {
    text(lab, fx, fy - 38, `phase errors: ${lo} … ${hi} checks fired`, sans);
    // rotated, centred on the field, well clear of the drawing's left edge
    const rot = g(lab, { transform: `translate(${fx - 44} ${fy + fw / 2}) rotate(-90)`, 'data-audit': 'skip' });
    text(rot, 0, 0, `flips: ${lo} … ${hi} checks fired`, { ...sans, anchor: 'middle' });
  }
  st.fade(lab, 0, 0.12);

  // one pattern, enlarged, joined to its square
  const eg = g(svg);
  const pitch = 30;
  const ecx = tall ? 66 : fx + fw + 80, ecy = tall ? fy + fw + 76 : fy + (ex.row + 1) * c;
  const G = grid(eg, { checks: CHECKS, d: 3, cx: ecx, cy: ecy, pitch, C });
  CHECKS.forEach((ch, i) => { const on = (i < 4 ? ex.flip_checks[i] : ex.phase_checks[i - 4]) === '1'; if (on) G.tiles[ch.id].setFired(1); });
  const cx0 = fx + (ex.col + 1) * c, cy0 = fy + (ex.row + 1) * c;
  rect(eg, fx + ex.col * c + (c - sq) / 2 - 2.5, fy + ex.row * c + (c - sq) / 2 - 2.5, sq + 5, sq + 5, { fill: 'none', stroke: C.ink, 'stroke-width': 1.1, 'data-audit': 'skip' });
  const lead = tall
    ? `M${cx0} ${cy0}L${cx0} ${fy + fw + 10}L${ecx} ${fy + fw + 10}L${ecx} ${ecy - pitch * 1.5 - 8}`
    : `M${cx0} ${cy0}L${ecx - pitch * 1.5 - 8} ${cy0}`;
  path(eg, lead, { stroke: C.ink, 'stroke-width': 0.8, 'stroke-linejoin': 'round', 'data-audit': 'skip' });
  circle(eg, cx0, cy0, 1.6, { fill: C.ink });
  const nFired = [...ex.flip_checks, ...ex.phase_checks].filter((ch) => ch === '1').length;
  const et = text(eg, ecx + pitch * 1.5 + 16, ecy - (tall ? 20 : 12), `one pattern: which of the ${CHECKS.length} checks fired`, { ...noteO, width: tall ? 190 : 132 });
  text(eg, et.x, et.bottom + 15, `here ${nFired}; the example that follows`, { ...noteO, fill: C.muted, width: tall ? 190 : 132 });
  st.fade(eg, 0.6, 0.78);

  // the count, with the one pen ring around the number only
  const rg = g(svg);
  const rx0 = tall ? 26 : fx + fw + 38, ry0 = tall ? ecy + pitch * 1.5 + 62 : fy + fw - 140;
  const ct = text(rg, rx0 + 8, ry0, `${cnt.differs} of ${cnt.patterns}`, { family: 'mono', size: tall ? 20 : 23, weight: 500 });
  const w1 = text(rg, rx0, ct.bottom + 30, 'patterns: plain matching’s answer is not the most likely one', { size: tall ? 14 : 15, width: tall ? W - 40 : 226, lh: tall ? 18 : 20 });
  const w2 = text(rg, rx0, w1.bottom + 18, `they occur in about [[${share}]] of cases; in [[${none}]] of cases no check fires`, { size: tall ? 14 : 15, width: tall ? W - 40 : 226, lh: tall ? 18 : 20 });
  circle(rg, rx0 + 6, ct.bottom + 24.5 - 12, 0, { fill: C.accent });
  st.fade(rg, 0.74, 0.88);
  const pr = penRing(svg, ct.cx, ct.cy, ct.w / 2 + 15, tall ? 19 : 22, { seed: 3, stroke: C.accent, width: 1.6 });
  pr.paths.forEach((pp, k) => st.draw(pp, 0.86 + k * 0.03, 0.97 + k * 0.02));

  const foot = g(svg);
  text(foot, tall ? 14 : fx, tall ? w2.bottom + 22 : fy + fw + 30, tall
    ? `distance ${dist} · ${err} error per storing qubit · one round ·\nchecks never wrong · our own count`
    :`distance ${dist} · ${err} error per storing qubit · one round · checks never wrong · our own count`, { ...mono, lh: 15 });
  st.fade(foot, 0.8, 0.94);

  return { set: (s2, t) => st.set(s2, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
