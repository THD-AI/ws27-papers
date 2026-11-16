// house-d: the same AI agent in two houses; the only difference is what it
// stands on. Pen lines, thin and a little uneven, drawn on with the scroll.
//   step 0: the ground, two identical houses, the same AI agent in each and
//           a person at work beside it.
//   step 1: the left house gets its old, shallow footing; a heavy crack
//           runs from it up through the wall, the far half of the footing
//           sinks and the agent tilts. The person is cut off by the crack.
//   step 2: the right house gets renewed foundations, a footing that holds
//           "own data, own models"; the agent stands straight and the
//           person works with it, hand to hand.
// The last state holds both houses and reads on its own.
import {
  mountFigure, svgRoot, colors, g, path, rect, circle, text, stage, span, ease, rng, spline, lerp,
} from '../../../lib/fig.js';

export const steps = 3;
export const aspect = { wide: 552 / 244, tall: 360 / 184 };

// Geometry in the units of the wide drawing (552 across).
const GY = 166, E = GY - 81, PEAK = 28;
const OLD = { x0: 70, x1: 220, cx: 145, agent: 112, person: 176 };
const NEW = { x0: 330, x1: 480, cx: 405, agent: 380, person: 432 };
const FOOT_OLD = 14;
const CRACK = [[136, GY + FOOT_OLD], [141, GY + 6], [134, GY - 4], [144, GY - 18], [137, GY - 34], [147, GY - 50], [141, GY - 62], [148, GY - 70]];

function pen(points, seed, amp, map) {
  const r = rng(seed);
  const ph = [r(), r(), r(), r()].map((v) => v * Math.PI * 2);
  const out = [];
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i];
    if (i === 0) { out.push({ x: ax, y: ay, s: 0 }); continue; }
    const [px, py] = points[i - 1];
    const len = Math.hypot(ax - px, ay - py);
    const n = Math.max(1, Math.round(len / 5));
    for (let k = 1; k <= n; k++) out.push({ x: lerp(px, ax, k / n), y: lerp(py, ay, k / n), s: s + len * (k / n) });
    s += len;
  }
  return spline(out.map((p) => map(
    p.x + amp * (0.65 * Math.sin(p.s * 0.031 + ph[0]) + 0.35 * Math.sin(p.s * 0.083 + ph[1])),
    p.y + amp * (0.65 * Math.sin(p.s * 0.027 + ph[2]) + 0.35 * Math.sin(p.s * 0.071 + ph[3])),
  )));
}

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const W = tall ? 360 : 552, H = tall ? 184 : 244;
  const S = tall ? 0.64 : 1;
  const map = (x, y) => (tall ? [180 + (x - 276) * S, y * S - 1] : [x, y]);
  const X = (x) => map(x, 0)[0], Y = (y) => map(0, y)[1];
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  let seed = 3;
  const line = (parent, pts, w = 1.35, stroke = C.ink, amp = 0.8) => path(parent, pen(pts, seed++, amp, map), {
    stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  const twice = (parent, pts, a, b) => {      // a main stroke and a thin one beside it
    st.draw(line(parent, pts, 1.35), a, b);
    const t = line(parent, pts, 0.55, C.ink, 1.2); t.setAttribute('opacity', 0.7);
    st.draw(t, a, b);
  };

  const FOOT_NEW = tall ? 46 : 30;
  // the renewed footing's field, under the ink
  const fx0 = X(318), fx1 = X(492), fy0 = Y(GY), fy1 = Y(GY + FOOT_NEW);
  const field = rect(svg, fx0, fy0, fx1 - fx0, fy1 - fy0, { fill: C.field, 'data-audit': 'skip' });
  st.fade(field, 2.18, 2.32);

  // step 0: ground and the two houses
  twice(svg, [[14, GY], [538, GY]], 0.02, 0.24);
  for (const h of [OLD, NEW]) {
    twice(svg, [[h.x0, GY], [h.x0, E], [h.x0 - 12, E + 6], [h.cx, PEAK], [h.x1 + 12, E + 6], [h.x1, E], [h.x1, GY]], 0.14, 0.5);
  }

  // the AI agent: the same drawing in both houses
  const agent = (fx, cx, a, out) => {
    const grp = g(svg);
    const parts = [
      [[fx - 5, GY], [fx - 5, GY - 7]], [[fx + 5, GY], [fx + 5, GY - 7]],
      [[fx - 10, GY - 7], [fx + 10, GY - 7], [fx + 10, GY - 29], [fx - 10, GY - 29], [fx - 10, GY - 7]],
      [[fx - 7, GY - 31], [fx + 7, GY - 31], [fx + 7, GY - 44], [fx - 7, GY - 44], [fx - 7, GY - 31]],
      [[fx, GY - 44], [fx, GY - 50]],
      [[fx - 10, GY - 24], [fx - 16, GY - 13]],
    ];
    parts.forEach((p, i) => st.draw(line(grp, p, 1.35, C.ink, 0.35), a + i * 0.03, a + i * 0.03 + 0.12));
    const dots = g(grp);
    const [ax, ay] = map(fx, GY - 52.5);
    circle(dots, ax, ay, 2.2 * Math.max(S, 0.8), { fill: C.ink });
    for (const ex of [-3, 3]) { const [x, y] = map(fx + ex, GY - 38); circle(dots, x, y, 1.4 * Math.max(S, 0.8), { fill: C.ink }); }
    st.fade(dots, a + 0.16, a + 0.22);
    const arm = line(grp, [[fx + 10, GY - 24], [fx + 16, GY - 13]], 1.35, C.ink, 0.35);
    st.draw(arm, a + 0.18, a + 0.28, out);
    // the name sits in the roof, a thin leader down to the antenna
    const lg = g(svg);
    const lab = text(lg, X(cx), Y(76), d.agent, { family: 'mono', size: 11.5, weight: 500, fill: C.ink, anchor: 'middle' });
    const from = [Math.max(lab.x + 6, Math.min(lab.right - 6, ax)), lab.bottom + 3];
    const ld = path(lg, '', { stroke: C.muted, 'stroke-width': 0.8, 'stroke-linecap': 'round' });
    const tip = circle(lg, ax, ay - 2.2 * Math.max(S, 0.8) - 2, 1.4, { fill: C.muted });
    const aim = (x, y) => { ld.setAttribute('d', `M${from[0].toFixed(1)} ${from[1].toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}`); tip.setAttribute('cx', x.toFixed(1)); tip.setAttribute('cy', y.toFixed(1)); };
    aim(ax, ay - 2.2 * Math.max(S, 0.8) - 2);
    st.fade(lg, a + 0.24, a + 0.3);
    return { grp, arm, aim, tip: [ax, ay - 2.2 * Math.max(S, 0.8) - 2] };
  };
  const person = (px, a, out) => {
    const grp = g(svg);
    const [hx, hy] = map(px, GY - 37);
    const head = circle(grp, hx, hy, 5.5 * S, { fill: 'none', stroke: C.ink, 'stroke-width': 1.35 });
    st.draw(head, a, a + 0.08);
    st.draw(line(grp, [[px, GY - 31], [px, GY - 14]], 1.35, C.ink, 0.3), a + 0.05, a + 0.13);
    st.draw(line(grp, [[px - 6, GY], [px, GY - 14], [px + 6, GY]], 1.35, C.ink, 0.3), a + 0.1, a + 0.2);
    st.draw(line(grp, [[px, GY - 26], [px + 7, GY - 15]], 1.35, C.ink, 0.3), a + 0.14, a + 0.22);
    const arm = line(grp, [[px, GY - 26], [px - 7, GY - 15]], 1.35, C.ink, 0.3);
    st.draw(arm, a + 0.16, a + 0.24, out);
    return { grp, arm };
  };
  const oldAgent = agent(OLD.agent, OLD.cx, 0.46);
   agent(NEW.agent, NEW.cx, 0.46, [2.36, 2.42]);
  person(OLD.person, 0.6);
  person(NEW.person, 0.6, [2.36, 2.42]);

  // step 1: the old footing, the crack, the sinking half, the tilt
  const sink = g(svg);
  twice(svg, [[136, GY], [66, GY], [66, GY + FOOT_OLD], [136, GY + FOOT_OLD]], 1.0, 1.18);
  twice(sink, [[139, GY], [224, GY], [224, GY + FOOT_OLD], [139, GY + FOOT_OLD]], 1.04, 1.22);
  const crack = line(svg, CRACK, 3, C.ink, 0.25);
  crack.setAttribute('stroke-linejoin', 'miter');
  st.draw(crack, 1.2, 1.6);
  const branch = line(svg, [[141, GY + 6], [152, GY + 11], [158, GY + 9]], 1.6, C.ink, 0.2);
  st.draw(branch, 1.5, 1.62);
  const top = line(svg, [[147, GY - 50], [158, GY - 57]], 1.5, C.ink, 0.2);
  st.draw(top, 1.55, 1.66);
  const [px, py] = map(OLD.agent + 5, GY);
  st.on((gg) => {
    const p = ease(span(gg, 1.42, 1.8));
    sink.setAttribute('transform', p > 0.001 ? `translate(0 ${(3.5 * S * p).toFixed(2)})` : '');
    oldAgent.grp.setAttribute('transform', p > 0.001 ? `rotate(${(11 * p).toFixed(2)} ${px.toFixed(1)} ${py.toFixed(1)})` : '');
    const a = (11 * p * Math.PI) / 180, [tx, ty] = oldAgent.tip;
    oldAgent.aim(px + (tx - px) * Math.cos(a) - (ty - py) * Math.sin(a), py + (tx - px) * Math.sin(a) + (ty - py) * Math.cos(a));
  });

  // step 2: the renewed footing with its words, and the two working together
  twice(svg, [[318, GY], [318, GY + FOOT_NEW], [492, GY + FOOT_NEW], [492, GY]], 2.0, 2.24);
  const words = g(svg);
  const slab = tall ? d.renewed.slab.join('\n') : d.renewed.slab.join(' · ');
  text(words, X(405), tall ? Y(GY + 19) : Y(GY + 19.5), slab, { family: 'mono', size: 11.5, weight: 500, fill: C.accent, anchor: 'middle', lh: 13.5 });
  st.fade(words, 2.26, 2.32);
  const reachA = line(svg, [[NEW.agent + 10, GY - 23], [NEW.agent + 26, GY - 25]], 1.35, C.ink, 0.3);
  const reachP = line(svg, [[NEW.person, GY - 26], [NEW.person - 26, GY - 25]], 1.35, C.ink, 0.3);
  st.draw(reachA, 2.4, 2.6).draw(reachP, 2.4, 2.6);

  // the two headings, under the footings
  const hy = tall ? Y(GY + FOOT_NEW) + 22 : Y(GY + FOOT_NEW) + 24;
  const head = (cx, str, fill, a) => {
    const t = text(svg, X(cx), hy, str, { family: 'mono', size: tall ? 12 : 12.5, weight: 500, caps: true, spacing: tall ? 0.6 : 1.2, fill, anchor: 'middle' });
    st.fade(t.el, a, a + 0.06);
  };
  head(OLD.cx, d.old.label, C.ink, 1.6);
  head(NEW.cx, d.renewed.label, C.accent, 2.5);

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
