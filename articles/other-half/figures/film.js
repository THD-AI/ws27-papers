// film: section 4's film on the real grid, after the glass strips. The
// bridging line, three small unlabelled frames of the smallest grid (one look
// each), the middle one with two flip-checks lit, and beside it, small, two of
// the stories that light exactly those checks: one flip in the centre, or two
// flips above and below it. The checks are the article's tiles between the
// qubit dots, and a lit check carries the same mark as a cracked strip.
//
// Everything drawn comes from data/film.json: the frames are computed there as
// the change between consecutive rounds, and the two stories are checked to
// light the same checks (tools/other-half-data.mjs).
import { mountFigure, svgRoot, g, line, path, circle, stage } from '../../../lib/fig.js';
import { pal, grid, text, floor } from './shared.js';

export const steps = 1;
export const durations = { medium: [2.2] };
const SIZE = { wide: [720, 306], tall: [360, 296] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

const BRIDGE = 'The real chip is a square, not a row. The dots are the hidden qubits; a lit square is a cracked strip, for flips; and it looks about a million times a second.';
const STORIES = 'two of the stories that fit';

function build(el, ctx) {
  const tall = ctx.layout === 'tall';
  floor(tall ? 13.8 : 12.45);
  const C = pal(ctx), d = ctx.data;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const lit2 = d.frames[1].lit;
  const svg = svgRoot(el, W, H,
    `${BRIDGE} Three looks in a row: nothing, then ${lit2.length} checks lit, then nothing again, although nothing was repaired. `
    + `${STORIES[0].toUpperCase()}${STORIES.slice(1)} the middle look: ${d.stories_that_fit.map((s) => (s.flips.length === 1 ? 'one flip in the centre' : `${s.flips.length} flips, above and below it`)).join(', or ')}.`);
  svg.style.color = C.ink;
  const st = stage();

  const L = tall
    ? { bridge: { x: 16, y: 22, w: 328, size: 14 }, pitch: 22, cy: 118, xs: [64, 180, 296], label: 190, sp: 19, scy: 246, sxs: [128, 232] }
    : { bridge: { x: 24, y: 28, w: 672, size: 15 }, pitch: 30, cy: 124, xs: [180, 360, 540], label: 210, sp: 22, scy: 256, sxs: [300, 420] };

  const bridge = g(svg);
  text(bridge, L.bridge.x, L.bridge.y, BRIDGE, { italic: true, size: L.bridge.size, width: L.bridge.w, lh: L.bridge.size + 5 });
  st.fade(bridge, 0, 0.12);

  // the three looks, left to right, with a short arrow between two looks
  const frames = d.frames.map((f, i) => {
    const grp = g(svg);
    const G = grid(grp, { checks: d.checks, d: d.distance, cx: L.xs[i], cy: L.cy, pitch: L.pitch, C, helper: 0 });
    const lit = f.lit;
    lit.forEach((id) => G.tiles[id].dot.setAttribute('r', (L.pitch * 0.15).toFixed(2)));
    st.fade(grp, 0.1 + i * 0.2, 0.24 + i * 0.2);
    st.on((gg) => lit.forEach((id) => G.tiles[id].setFired(Math.min(1, Math.max(0, (gg - (0.24 + i * 0.2)) / 0.08)))));
    return G;
  });
  const ext = L.pitch * 1.55;
  for (let i = 0; i < 2; i++) {
    const a = L.xs[i] + ext, b = L.xs[i + 1] - ext, y = L.cy;
    const ar = g(svg);
    line(ar, a, y, b, y, { stroke: C.muted, 'stroke-width': 1.1, 'stroke-linecap': 'round' });
    path(ar, `M${b - 5} ${y - 4}L${b} ${y}L${b - 5} ${y + 4}`, { stroke: C.muted, 'stroke-width': 1.1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    st.fade(ar, 0.2 + i * 0.2, 0.3 + i * 0.2);
  }

  // beside the middle look, small: two stories that light the same checks
  const below = g(svg);
  const top = L.cy + ext + 4;
  line(below, L.xs[1], top, L.xs[1], L.label - 18, { stroke: C.muted, 'stroke-width': 0.8, 'stroke-dasharray': '1.5 3', 'stroke-linecap': 'round' });
  text(below, L.xs[1], L.label, STORIES, { italic: true, size: tall ? 14 : 14.5, anchor: 'middle' });
  d.stories_that_fit.forEach((s, n) => {
    const G = grid(below, { checks: d.checks, d: d.distance, cx: L.sxs[n], cy: L.scy, pitch: L.sp, C, helper: 0 });
    s.lit_flip_checks.forEach((id) => { G.tiles[id].setFired(1); G.tiles[id].dot.setAttribute('r', (L.sp * 0.15).toFixed(2)); });
    s.flips.forEach((q) => { const [x, y] = G.pos(q); circle(G.gE, x, y, G.qr * 1.25, { fill: C.ink, 'data-audit': 'skip' }); });
  });
  text(below, (L.sxs[0] + L.sxs[1]) / 2, L.scy + 5, 'or', { italic: true, size: 14, anchor: 'middle', fill: C.muted });
  st.fade(below, 0.78, 0.98);

  void frames;
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
