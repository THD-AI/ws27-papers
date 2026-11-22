// water: a qubit is like a pattern drawn on water, and it smears almost at
// once. Two drawn layers, both from the forge with the author's line
// reference and the opening drawing as the hand to match:
//   art/water-field.png – the water, one flat field with a torn edge, in the
//     opening drawing's colour (board water r2 c3, its field only);
//   art/water-loops.png – the same loop drawn three times by one hand: just
//     drawn, smearing (broken, feathered, drifted), a ghost (board water-loops
//     r1 c1).
// Code adds only the time line, the words and when each moment appears.
import {
  mountFigure, svgRoot, g, h, path, pen, stage, clamp, easeOut,
} from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 1;
export const playLine = 0.6;         // plays once its centre is at 60% of the window, where the eyes are
export const durations = { medium: [2.4] };
const SIZE = { wide: [520, 226], tall: [360, 210] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };
// the loops image, 1536 × 512: the three loops' centres and their band
const IMG = [1536, 512], CX = [256, 759, 1268], BAND = [84, 424];

function build(el, ctx) {
  const tall = ctx.layout === 'tall';
  floor(tall ? 13 : 0);
  const C = pal(ctx), d = ctx.data;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const S = d.stages;
  const art = (name) => new URL(`../art/${name}`, import.meta.url).href;
  const svg = svgRoot(el, W, H, `A qubit is like a pattern drawn on water. The same loop on still water: ${S[0].say}; after ${S[1].say} (${S[1].mono}) it is breaking up and smearing; after ${S[2].say} (${S[2].mono}) only a ghost of it is left. ${d.lifetime_us.say}.`);
  svg.style.color = C.ink;
  const st = stage();
  const uid = `w${Math.random().toString(36).slice(2, 7)}`;
  const defs = h('defs', {}, svg);

  // the drawing, scaled to the figure's width (on a phone a little wider
  // than the screen column, its empty ends cut off)
  const over = tall ? 40 : 0;
  const k = (W + 2 * over) / IMG[0];
  const ox = -over, oy = tall ? 4 : 8;
  const X = (x) => ox + x * k, Y = (y) => oy + y * k;
  h('image', { href: art('water-field.png'), x: X(0), y: Y(BAND[0]), width: IMG[0] * k, height: (BAND[1] - BAND[0]) * k, preserveAspectRatio: 'none' }, svg);
  // each moment is its own third of the loops image
  const moments = [0, 1, 2].map((i) => {
    const cp = h('clipPath', { id: `${uid}c${i}` }, defs);
    h('rect', { x: X(i * 512), y: Y(0), width: 512 * k, height: IMG[1] * k }, cp);
    const grp = g(svg, { 'clip-path': `url(#${uid}c${i})` });
    h('image', { href: art('water-loops.png'), x: X(0), y: Y(0), width: IMG[0] * k, height: IMG[1] * k }, grp);
    return grp;
  });
  const cxs = CX.map(X);

  const title = g(svg);
  text(title, cxs[0], Y(BAND[0]) - (tall ? 8 : 10), 'a qubit', { italic: true, size: tall ? 14 : 16, anchor: 'middle' });

  // the time line under the water, in the pen's hand, a tick per moment
  const ty = Y(BAND[1]) + (tall ? 14 : 16);
  const seg = (a, b, seed) => path(svg, pen([[a, ty], [b, ty]], seed, 0.6), { stroke: C.ink, 'stroke-width': 1, 'stroke-linecap': 'round' });
  const line1 = seg(cxs[0], cxs[1], 3), line2 = seg(cxs[1], cxs[2], 7);
  const ticks = cxs.map((x) => path(svg, `M${x} ${ty - 3.5}L${x + 0.5} ${ty + 3.5}`, { stroke: C.ink, 'stroke-width': 1, 'stroke-linecap': 'round' }));
  const monoY = ty + (tall ? 50 : 38);
  const labels = [0, 1, 2].map((i) => {
    const lg = g(svg);
    const words = tall ? S[i].say.replace(/^(less than a thousandth|under two) /, '$1\n') : S[i].say;
    text(lg, cxs[i], ty + (tall ? 18 : 20), words, { italic: true, size: tall ? 13 : 13.5, anchor: 'middle', lh: 15 });
    if (S[i].mono) text(lg, cxs[i], monoY, S[i].mono, { family: 'mono', size: tall ? 11.5 : 12, fill: C.muted, anchor: 'middle' });
    return lg;
  });

  // 2.4 s. The water and the loop just drawn stand from the start. The line
  // draws to the first mark and the smearing loop comes up in its place;
  // then its words; the line on; the ghost; its words. One thing at a time.
  const appear = (grp, a, b) => st.on((gg) => {
    const p = clamp((gg - a) / (b - a));
    grp.style.display = p <= 0.001 ? 'none' : '';
    grp.style.opacity = p >= 0.999 ? '' : easeOut(p).toFixed(3);
  });
  st.fade(ticks[0], 0, 0.04);
  st.draw(line1, 0, 0.36).fade(ticks[1], 0.34, 0.4);
  appear(moments[1], 0.33, 0.55);
  st.fade(labels[1], 0.48, 0.58);
  st.draw(line2, 0.55, 0.8).fade(ticks[2], 0.78, 0.84);
  appear(moments[2], 0.76, 0.96);
  st.fade(labels[2], 0.9, 1);
  void moments[0]; void labels[0];

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
