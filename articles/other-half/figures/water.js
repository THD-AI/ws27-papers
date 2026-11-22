// water: a qubit is like a pattern drawn on water, and it smears almost at
// once. One strip of still water in the hand of the opening drawing (forge
// board water r2 c3, split into its line and its flat field, art/water-*.png).
// On it, one closed loop drawn with the article's pen line, three times along
// the strip: just drawn, then loosened, then a ghost. The loosening is the
// same loop drawn again with a looser hand, drifting, spreading and fading;
// the ink each stage keeps is data/water.json `ink_left` (the decay of the
// median qubit). No raster filter, no holes punched in a line.
import {
  mountFigure, svgRoot, g, h, path, pen, stage, clamp, easeOut,
} from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 1;
export const playLine = 0.6;         // plays once its centre is at 60% of the window, where the eyes are
export const durations = { medium: [2.4] };
const SIZE = { wide: [520, 176], tall: [360, 168] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };
const STRIP = [1468, 230];
const art = (name) => new URL(`../art/${name}`, import.meta.url).href;

// The loop: one closed, uneven round shape drawn in one stroke, its end
// running a little past its start, as a hand closes a loop. Unit radius;
// two slow harmonics keep it from reading as a letter, a digit or a circle.
const LOOP = Array.from({ length: 73 }, (_, i) => {
  const a = -2.2 + (i / 72) * (Math.PI * 2 + 0.45);
  const r = 1 + 0.1 * Math.sin(2 * a + 0.8) + 0.06 * Math.sin(3 * a + 2.1);
  return [Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.33];
});
const CRISP = 1.3;                   // the pen weight of the crisp loop

function build(el, ctx) {
  const tall = ctx.layout === 'tall';
  floor(tall ? 13 : 0);
  const C = pal(ctx), d = ctx.data;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const S = d.stages;
  const svg = svgRoot(el, W, H, `A qubit is like a pattern drawn on water. One loop on a strip of still water, three times: ${S[0].say}; after ${S[1].say} (${S[1].mono}) loosened, with about a third of its ink left; after ${S[2].say} (${S[2].mono}) a faint ghost. ${d.lifetime_us.say}.`);
  svg.style.color = C.ink;
  const st = stage();

  // the strip, wider than the figure on a phone so the water has some height
  const sx = tall ? -46 : 0, sw = tall ? W + 92 : W, sh = sw * STRIP[1] / STRIP[0];
  const sy = tall ? 26 : 30;
  const water = g(svg);
  h('image', { href: art('water-field.png'), x: sx, y: sy, width: sw, height: sh }, water);
  h('image', { href: art('water-line.png'), x: sx, y: sy, width: sw, height: sh }, water);

  const cxs = [W / 6, W / 2, (5 * W) / 6];
  const cy = sy + sh * 0.48, size = tall ? 64 : 84;
  const loopPts = (cx, dx = 0, dy = 0) => LOOP.map(([u, v]) => [cx + dx + u * size, cy + dy + v * size]);
  const share = d.ink_left.value;
  // stage k: copies drawn with a looser hand, each drifting a little; their
  // opacity × width adds up to the share of ink the stage keeps
  const STAGES = [
    [{ amp: 0.7, dx: 0, dy: 0, w: CRISP, seed: 11 }],
    [{ amp: 2.4, dx: 1.5, dy: -1, w: 1.6, seed: 23 }, { amp: 3.2, dx: 4, dy: 1.5, w: 1.6, seed: 37 }],
    [{ amp: 4.5, dx: 3, dy: -2, w: 2.2, seed: 41 }, { amp: 6, dx: 9, dy: 2.5, w: 2.2, seed: 59 }],
  ];
  // every panel starts with the crisp loop; panels 2 and 3 loosen in place
  const crisp = [1, 2].map((k) => {
    const grp = g(svg);
    const c = STAGES[0][0];
    path(grp, pen(loopPts(cxs[k], c.dx, c.dy), c.seed, c.amp), { stroke: C.ink, 'stroke-width': c.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    return grp;
  });
  const loops = STAGES.map((copies, k) => {
    const grp = g(svg);
    const op = (share[k] * CRISP) / copies.reduce((a, c) => a + c.w, 0);
    copies.forEach((c) => path(grp, pen(loopPts(cxs[k], c.dx, c.dy), c.seed, c.amp), {
      stroke: C.ink, 'stroke-width': c.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: Math.min(1, op).toFixed(3),
    }));
    return grp;
  });

  const title = g(svg);
  text(title, cxs[0], tall ? 15 : 18, 'a qubit', { italic: true, size: tall ? 14 : 16, anchor: 'middle' });

  // the time line under the strip, in the pen's hand, with a tick per stage
  const ty = sy + sh + (tall ? 14 : 16);
  const seg = (a, b, seed) => path(svg, pen([[a, ty], [b, ty]], seed, 0.6), { stroke: C.ink, 'stroke-width': 1, 'stroke-linecap': 'round' });
  const line1 = seg(cxs[0], cxs[1], 3), line2 = seg(cxs[1], cxs[2], 7);
  const tick = (x) => path(svg, `M${x} ${ty - 3.5}L${x + 0.5} ${ty + 3.5}`, { stroke: C.ink, 'stroke-width': 1, 'stroke-linecap': 'round' });
  const ticks = cxs.map(tick);
  const monoY = ty + (tall ? 50 : 38);
  const label = (i) => {
    const lg = g(svg);
    const words = tall ? S[i].say.replace(/^(about a thousandth|two) /, '$1\n') : S[i].say;
    text(lg, cxs[i], ty + (tall ? 18 : 20), words, { italic: true, size: tall ? 13 : 14, anchor: 'middle', lh: 15 });
    if (S[i].mono) text(lg, cxs[i], monoY, S[i].mono, { family: 'mono', size: tall ? 11.5 : 12, fill: C.muted, anchor: 'middle' });
    return lg;
  };
  const labels = [0, 1, 2].map(label);

  // 2.4 s: the first loop and its words stand; the line draws to the first
  // mark; the loosened loop settles in, then its words; the line on; the
  // ghost; its words. One thing moves at a time.
  // the crisp loop of a panel gives way to its loosened copies, in place
  const loosen = (k, a, b) => {
    st.fade(crisp[k - 1], -1, -0.5, [a, b]);
    st.on((gg) => {
      const p = clamp((gg - a) / (b - a)), grp = loops[k];
      grp.style.display = p <= 0.001 ? 'none' : '';
      grp.style.opacity = p >= 0.999 ? '' : easeOut(p).toFixed(3);
    });
  };
  st.fade(ticks[0], 0, 0.04);
  st.draw(line1, 0, 0.36).fade(ticks[1], 0.34, 0.4);
  loosen(1, 0.33, 0.55);
  st.fade(labels[1], 0.48, 0.58);
  st.draw(line2, 0.55, 0.8).fade(ticks[2], 0.78, 0.84);
  loosen(2, 0.76, 0.96);
  st.fade(labels[2], 0.9, 1);
  void water; void loops[0]; void labels[0];

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
