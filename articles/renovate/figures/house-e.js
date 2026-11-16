// house-e: one house, renovated while the reader scrolls. Pen lines, thin
// and a little uneven, drawn on with the scroll.
//   step 0: the house on an old, shallow footing; a person at work at a desk.
//   step 1: repaint. An AI agent (a screen on a low cabinet at desk height)
//           is set in the house as it is; a heavy crack runs up from the old
//           footing through where it stands, and it tilts.
//   step 2: renovate. The old footing is taken out under the same house,
//           the renewed one is laid ("own data, own models"); the crack
//           closes to a stitched scar in the wall, and the old slab stays
//           as a faint dashed outline inside the new footing.
//   step 3: the same agent, straight on the new floor, hands the
//           person a finished ticket at the desk.
// The four notes stay (the earlier ones a little lighter), and the scar and
// the old slab's outline stay: the print still shows the before in the after.
import {
  mountFigure, svgRoot, colors, g, path, rect, circle, text, stage, span, ease, rng, spline, lerp,
} from '../../../lib/fig.js';

export const steps = 4;
export const aspect = { wide: 552 / 262, tall: 360 / 346 };

// The house, in its own units (centre x 180, the same in both layouts).
const GY = 200, E = GY - 110, PEAK = 30;
const X0 = 60, X1 = 300, CX = 180;
const FOOT_OLD = 14, FOOT_NEW = 40;
const AG = { x: 124, w: 42, top: GY - 74, bot: GY - 45, c0: 102, c1: 146 };   // the agent: a screen on a low cabinet at desk height
const CRACK = [[128, GY + FOOT_OLD], [134, GY + 7], [127, GY - 2], [137, GY - 14], [147, GY - 28], [141, GY - 44], [153, GY - 60], [147, GY - 76], [159, GY - 92], [154, GY - 104]];
const DESK = { x0: 186, x1: 254, y: GY - 36 };
const SEAT = { x: 272 };

function pen(points, seed, amp) {
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
  return spline(out.map((p) => [
    p.x + amp * (0.65 * Math.sin(p.s * 0.031 + ph[0]) + 0.35 * Math.sin(p.s * 0.083 + ph[1])),
    p.y + amp * (0.65 * Math.sin(p.s * 0.027 + ph[2]) + 0.35 * Math.sin(p.s * 0.071 + ph[3])),
  ]));
}
const poly = (pts) => pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('');

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const W = tall ? 360 : 552, H = tall ? 346 : 262;
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  const house = g(svg, tall ? { transform: 'translate(0 -10)' } : { transform: 'translate(0 -14)' });
  let seed = 3;
  const line = (parent, pts, w = 1.35, stroke = C.ink, amp = 0.7) => path(parent, pen(pts, seed++, amp), {
    stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  const twice = (parent, pts, a, b, out) => {     // a main stroke and a thin one beside it
    const m = line(parent, pts, 1.35); st.draw(m, a, b, out);
    const t = line(parent, pts, 0.55, C.ink, 1.1); t.setAttribute('opacity', 0.7); st.draw(t, a, b, out);
  };

  // --- the renewed footing's field, under the ink (step 2)
  const field = rect(house, X0 - 14, GY, X1 - X0 + 28, FOOT_NEW, { fill: C.field, 'data-audit': 'skip' });
  st.fade(field, 2.5, 2.64);

  // --- the old slab, kept as a faint dashed outline inside the new footing
  const ghost = rect(house, X0 - 8, GY + 1.5, X1 - X0 + 16, FOOT_OLD - 1.5, { fill: 'none', stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '4 3', 'data-audit': 'skip' });
  st.fade(ghost, 2.5, 2.66);

  // --- the scar the closed crack leaves in the wall: a thin line, stitched
  const scar = g(house, { 'data-audit': 'skip' });
  const wall = CRACK.filter((q) => q[1] <= DESK.y + 8);    // the wall above the cabinet
  path(scar, poly(wall), { stroke: C.ink, 'stroke-width': 1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  for (let i = 1; i < wall.length; i++) {
    const [ax, ay] = wall[i - 1], [bx, by] = wall[i];
    const mx = (ax + bx) / 2, my = (ay + by) / 2, len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = (-(by - ay) / len) * 4, ny = ((bx - ax) / len) * 4;
    path(scar, `M${(mx - nx).toFixed(1)} ${(my - ny).toFixed(1)}L${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)}`, { stroke: C.ink, 'stroke-width': 1.2, 'stroke-linecap': 'round' });
  }
  st.fade(scar, 2.62, 2.8);

  // --- step 0: ground, old footing, house, desk, chair, person
  twice(house, [[8, GY], [X0 - 8, GY]], 0.02, 0.1);
  twice(house, [[X1 + 8, GY], [W - 8 - (tall ? 0 : 180), GY]], 0.02, 0.1);
  const oldFoot = g(house);
  twice(oldFoot, [[X0 - 8, GY], [X0 - 8, GY + FOOT_OLD], [X1 + 8, GY + FOOT_OLD], [X1 + 8, GY], [X0 - 8, GY]], 0.06, 0.24);
  // taken out in step 2: it drops away and fades
  st.on((gg) => {
    const p = ease(span(gg, 2.02, 2.3));
    oldFoot.setAttribute('transform', p > 0.001 ? `translate(0 ${(16 * p).toFixed(1)})` : '');
    oldFoot.style.opacity = p > 0.001 ? (1 - p).toFixed(3) : '';
    oldFoot.style.display = p >= 0.999 ? 'none' : '';
  });
  twice(house, [[X0, GY], [X0, E], [X0 - 14, E + 7], [CX, PEAK], [X1 + 14, E + 7], [X1, E], [X1, GY]], 0.18, 0.5);
  // desk and chair
  twice(house, [[DESK.x0, GY], [DESK.x0 + 4, DESK.y], [DESK.x1 - 4, DESK.y], [DESK.x1, GY]], 0.52, 0.64);
  twice(house, [[SEAT.x + 12, GY - 58], [SEAT.x + 10, GY - 24], [SEAT.x - 10, GY - 24], [SEAT.x - 10, GY]], 0.56, 0.66);
  line(house, [[SEAT.x + 10, GY - 24], [SEAT.x + 10, GY]]);
  st.draw(house.lastChild, 0.6, 0.68);
  // the person, seated, facing the desk, one hand on it
  const head = circle(house, SEAT.x + 2, GY - 70, 7, { fill: 'none', stroke: C.ink, 'stroke-width': 1.35 });
  st.draw(head, 0.62, 0.7);
  st.draw(line(house, [[SEAT.x + 3, GY - 62], [SEAT.x + 5, GY - 28], [SEAT.x - 14, GY - 28], [SEAT.x - 16, GY]], 1.5, C.ink, 0.3), 0.64, 0.78);
  st.draw(line(house, [[SEAT.x + 3, GY - 54], [SEAT.x - 12, GY - 44], [DESK.x1 - 14, DESK.y - 3]], 1.5, C.ink, 0.3), 0.7, 0.8);

  // --- step 1: the crack (behind the agent), then the agent on top
  const crack = path(house, poly(CRACK), { stroke: C.ink, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'miter' });
  st.draw(crack, 1.24, 1.62, [2.55, 2.72]);
  const twig = path(house, poly([[141, GY - 44], [130, GY - 50]]), { stroke: C.ink, 'stroke-width': 1.6, 'stroke-linecap': 'round' });
  st.draw(twig, 1.5, 1.6, [2.55, 2.72]);
  const twig2 = path(house, poly([[134, GY + 7], [146, GY + 11]]), { stroke: C.ink, 'stroke-width': 1.6, 'stroke-linecap': 'round' });
  st.draw(twig2, 1.4, 1.5, [2.02, 2.2]);

  const agent = g(house);
  const ax0 = AG.x - AG.w / 2;
  // the low cabinet it stands on, at desk height
  line(agent, [[AG.c0, GY], [AG.c0, DESK.y], [AG.c1, DESK.y], [AG.c1, GY]], 1.35, C.ink, 0.4);
  line(agent, [[AG.c0 + 4, DESK.y + 12], [AG.c1 - 4, DESK.y + 12]], 0.9, C.ink, 0.3);
  // the screen, turned towards the desk
  rect(agent, ax0, AG.top, AG.w, AG.bot - AG.top, { rx: 2.5, fill: C.paper, stroke: C.ink, 'stroke-width': 1.6 });
  for (let i = 0; i < 3; i++) {
    const y = AG.top + 7 + i * 6;
    path(agent, `M${ax0 + 6} ${y}L${ax0 + AG.w - 6 - (i === 2 ? 10 : 0)} ${y}`, { stroke: C.muted, 'stroke-width': 1.2, 'stroke-linecap': 'round' });
  }
  path(agent, `M${AG.x} ${AG.bot}L${AG.x} ${DESK.y - 1.5}M${AG.x - 9} ${DESK.y - 1}L${AG.x + 9} ${DESK.y - 1}`, { stroke: C.ink, 'stroke-width': 1.8, 'stroke-linecap': 'round' });
  st.fade(agent, 1.02, 1.14);
  const name = text(house, AG.x - 12, AG.top - 10, d.agent, { family: 'mono', size: 12, weight: 500, fill: C.ink, anchor: 'middle' });
  st.fade(name.el, 1.08, 1.14);
  // it tilts and slips while the crack opens; it stands straight again as the crack closes
  st.on((gg) => {
    const p = ease(span(gg, 1.48, 1.78)) * (1 - ease(span(gg, 2.66, 2.9)));
    agent.setAttribute('transform', p > 0.001 ? `translate(0 ${(3 * p).toFixed(2)}) rotate(${(7 * p).toFixed(2)} ${AG.c0} ${GY})` : '');
  });

  // --- step 2: the renewed footing with its words
  twice(house, [[X0 - 14, GY], [X0 - 14, GY + FOOT_NEW], [X1 + 14, GY + FOOT_NEW], [X1 + 14, GY]], 2.28, 2.54);
  const words = text(house, CX, GY + FOOT_OLD + 17, d.slab.join(' · '), { family: 'mono', size: 12.5, weight: 500, fill: C.accent, anchor: 'middle' });
  st.fade(words.el, 2.58, 2.66);

  // --- step 3: the agent hands the person a finished ticket
  const from = [AG.x + AG.w / 2 + 3, AG.top + 10], to = [DESK.x1 - 12, DESK.y - 14];
  const mid = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 22];
  const arc = path(house, `M${from[0]} ${from[1]}Q${mid[0]} ${mid[1]} ${to[0]} ${to[1]}`, { stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '2.5 3', 'stroke-linecap': 'round' });
  st.draw(arc, 3.3, 3.7);
  const ticket = g(house);
  rect(ticket, -8, -10, 16, 20, { fill: C.paper, stroke: C.ink, 'stroke-width': 1.3 });
  path(ticket, 'M-4 -4L4 -4M-4 0L4 0M-4 4L1 4', { stroke: C.ink, 'stroke-width': 0.9, 'stroke-linecap': 'round' });
  st.fade(ticket, 3.24, 3.3);
  st.on((gg) => {
    const p = ease(span(gg, 3.3, 3.7));
    const u = 1 - p;
    const x = u * u * from[0] + 2 * u * p * mid[0] + p * p * to[0];
    const y = u * u * from[1] + 2 * u * p * mid[1] + p * p * to[1];
    ticket.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(-8 + 8 * p).toFixed(1)})`);
  });

  // --- the notes: one per step; they stay, the earlier ones muted
  const nb = tall
    ? { x: 16, y: GY + FOOT_NEW + 20, w: 300, size: 12.5, gap: 8 }
    : { x: 380, y: 42, w: 160, size: 13.5, gap: 12 };
  let y = nb.y;
  d.notes.forEach((str, k) => {
    const grp = g(svg);
    const num = text(grp, nb.x, y, String(k + 1), { family: 'mono', size: nb.size - 1, weight: 500, fill: 'currentColor' });
    const t = text(grp, nb.x + 18, y, str, { italic: true, size: nb.size, fill: 'currentColor', width: nb.w, lh: nb.size + 3 });
    y = t.bottom + nb.gap + nb.size * 0.78;
    st.fade(grp, k + (k ? 0 : 0.02), k + 0.08);
    st.on((gg) => {
      const later = k < d.notes.length - 1 && gg >= k + 1.02;
      const c = k === 3 ? C.accent : C.ink;
      if (grp.style.color !== c) grp.style.color = c;
      const o = later ? '0.74' : '';
      if (grp.getAttribute('opacity') !== o) { if (o) grp.setAttribute('opacity', o); else grp.removeAttribute('opacity'); }
    });
    void num;
  });

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
