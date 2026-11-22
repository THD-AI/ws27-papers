// water: a qubit is like a pattern drawn on water, and it smears almost at
// once. One patch of water (a forge drawing from the author's line reference,
// art/water.png) three times in a row, with the hero's own cable loop on it
// (art/water-loop.png, cut from the hero). The loop is broken and faded in
// code with hand-cut masks: nothing is redrawn and nothing is filtered.
// The time line and its lettering come from data/water.json.
import {
  mountFigure, svgRoot, g, h, path, rng, pen, stage, clamp, easeOut,
} from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 1;
export const playAt = 0.75;          // play where the reader is looking
export const durations = { medium: [2.4] };
const SIZE = { wide: [600, 184], tall: [360, 150] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };
const WATER = [1091, 424], LOOP = [370, 120];
const art = (name) => new URL(`../art/${name}`, import.meta.url).href;

// An irregular, hand-cut blob: a closed polygon with seeded wobble.
function blob(r, cx, cy, rx, ry) {
  const n = 9, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 0.7 + r() * 0.55;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return `M${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L')}Z`;
}

function build(el, ctx) {
  const tall = ctx.layout === 'tall';
  floor(tall ? 13 : 0);
  const C = pal(ctx), d = ctx.data;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, `A qubit is like a pattern drawn on water. The same drawn loop on a patch of water three times: just drawn, then broken and faint after ${d.stages[1].say} (${d.stages[1].mono}), then almost gone after ${d.stages[2].say} (${d.stages[2].mono}). ${d.lifetime_us.say}.`);
  svg.style.color = C.ink;
  const st = stage();
  const uid = `w${Math.random().toString(36).slice(2, 7)}`;
  const defs = h('defs', {}, svg);
  // The hero's line is drawn for 1536 px; at this size it would be a hair.
  // A small dilation keeps its weight (geometry only, no noise, no blur).
  const thick = h('filter', { id: `${uid}k`, x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
  h('feMorphology', { operator: 'dilate', radius: tall ? 0.55 : 1.1 }, thick);

  const gap = tall ? 12 : 30, pad = tall ? 16 : 8;
  const pw = (W - 2 * pad - 2 * gap) / 3;
  const ph = pw * WATER[1] / WATER[0];
  const top = tall ? 28 : 36;
  const lw = pw * 0.62, lh = lw * LOOP[1] / LOOP[0];

  // How much of the loop each stage keeps: whole, broken, a few fragments.
  const r = rng(85);
  const keep = [null,
    { cut: Array.from({ length: 7 }, () => [r(), r(), 0.07 + r() * 0.06]), alpha: 0.8 },
    { islands: Array.from({ length: 6 }, () => [r(), r(), 0.05 + r() * 0.05]), alpha: 0.55 }];

  const panels = [0, 1, 2].map((i) => {
    const x = pad + i * (pw + gap);
    const grp = g(svg);
    h('image', { href: art('water.png'), x, y: top, width: pw, height: ph, preserveAspectRatio: 'xMidYMid meet' }, grp);
    const lx = x + (pw - lw) / 2, ly = top + ph * 0.46 - lh / 2;
    const loop = h('image', { href: art('water-loop.png'), x: lx, y: ly, width: lw, height: lh, preserveAspectRatio: 'none', filter: `url(#${uid}k)` }, grp);
    const k = keep[i];
    if (k) {
      const m = h('mask', { id: `${uid}m${i}`, maskUnits: 'userSpaceOnUse', x: lx - 4, y: ly - 4, width: lw + 8, height: lh + 8 }, defs);
      if (k.cut) {
        h('rect', { x: lx - 4, y: ly - 4, width: lw + 8, height: lh + 8, fill: '#fff' }, m);
        k.cut.forEach(([u, v, s]) => h('path', { d: blob(r, lx + u * lw, ly + v * lh, s * lw, s * lw * 0.8), fill: '#000' }, m));
      } else {
        k.islands.forEach(([u, v, s]) => h('path', { d: blob(r, lx + u * lw, ly + v * lh, s * lw * 1.6, s * lw), fill: '#fff' }, m));
      }
      loop.setAttribute('mask', `url(#${uid}m${i})`);
      loop.setAttribute('opacity', String(k.alpha));
    }
    return { grp, x, cx: x + pw / 2 };
  });

  // "a qubit" over the first panel
  const title = g(svg);
  text(title, panels[0].cx, tall ? 16 : 22, 'a qubit', { italic: true, size: tall ? 14 : 16, anchor: 'middle' });

  // the time line, in a hand weight, from the first panel to the third
  const ty = top + ph + (tall ? 16 : 22);
  const seg = (a, b, seed) => path(svg, pen([[a, ty], [b, ty]], seed, 0.8), { stroke: C.ink, 'stroke-width': 1.3, 'stroke-linecap': 'round' });
  const line1 = seg(panels[0].cx, panels[1].cx, 3), line2 = seg(panels[1].cx, panels[2].cx, 7);
  const tick = (x) => path(svg, `M${x} ${ty - 4}L${x + 0.6} ${ty + 4}`, { stroke: C.ink, 'stroke-width': 1.3, 'stroke-linecap': 'round' });
  const t0 = tick(panels[0].cx), t1 = tick(panels[1].cx), t2 = tick(panels[2].cx);
  const label = (i) => {
    const lg = g(svg);
    // on a phone the words go on two lines, so the two labels never meet
    const words = tall ? d.stages[i].say.replace(/^(a thousandth|two thousandths) /, '$1\n') : d.stages[i].say;
    const w = text(lg, panels[i].cx, ty + (tall ? 19 : 22), words, { italic: true, size: tall ? 13 : 14.5, anchor: 'middle', lh: 15 });
    text(lg, panels[i].cx, (w.bottom || ty + 22) + (tall ? 15 : 18), d.stages[i].mono, { family: 'mono', size: tall ? 11.5 : 12, fill: C.muted, anchor: 'middle' });
    return lg;
  };
  const l1 = label(1), l2 = label(2);

  // Timeline (2.4 s): the first panel stands; the line draws to the first
  // mark; panel 2 settles in; its label; the line on; panel 3; its label.
  const settle = (grp, a, b) => st.on((gg) => {
    const p = clamp((gg - a) / (b - a));
    grp.style.display = p <= 0.001 ? 'none' : '';
    grp.style.opacity = p >= 0.999 ? '' : easeOut(p).toFixed(3);
    grp.setAttribute('transform', p >= 0.999 ? '' : `translate(0 ${(3 * (1 - easeOut(p))).toFixed(2)})`);
  });
  st.fade(t0, 0, 0.05);
  st.draw(line1, 0, 0.36).fade(t1, 0.34, 0.4);
  settle(panels[1].grp, 0.33, 0.48);
  st.fade(l1, 0.46, 0.56);
  st.draw(line2, 0.5, 0.79).fade(t2, 0.77, 0.83);
  settle(panels[2].grp, 0.75, 0.9);
  st.fade(l2, 0.92, 1);

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
