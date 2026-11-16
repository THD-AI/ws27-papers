// house: the margin scene. A small house in section, in ink line; the part
// the text is about lies on the one field. Six states; set(state, t) fades
// from the state before into this one.
import {
  mountFigure, svgRoot, colors, g, line, circle, rect, path, text, leader, stage, span, ease,
} from '../../../lib/fig.js';

export const steps = 6;
export const aspect = { wide: 192 / 270, tall: 192 / 270 };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data;
  const W = 192, H = 270;
  const outer = svgRoot(el, W, H, `${d.reading} States: ${d.states.map((s) => s.label).join('; ')}.`);
  outer.style.color = C.ink;
  text(outer, 6, 13, d.kicker, { family: 'mono', size: 11.5, fill: C.muted, lh: 13.5 });
  const svg = g(outer, { transform: 'translate(0 26)' });
  const st = stage();
  const ink = { stroke: C.ink, 'stroke-width': 1.25, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  const thin = { stroke: C.ink, 'stroke-width': 0.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  const fieldStroke = (w) => ({ stroke: C.field, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-audit': 'skip' });

  // geometry
  const GY = 170, L = 52, R = 148, EV = 96, RX = 100, RY = 52, FL = 132;
  const shell = `M${L} ${GY}L${L} ${EV}L${L - 9} ${EV + 6}L${RX} ${RY}L${R + 9} ${EV + 6}L${R} ${EV}L${R} ${GY}`;
  const wire = `M59 152L59 102L78 102L78 107M78 102L124 102L124 107M59 138L78 138L78 143M78 138L124 138L124 143`;
  const pipe = `M6 181L44 181L59 181L59 158`;

  // a state is complete at g = k + 1 and gives way during the next step
  const on = (elm, k) => st.fade(elm, k + 0.15, k + 0.7, k < steps - 1 ? [k + 1.1, k + 1.6] : undefined);
  const fields = {};
  // fields first, so the ink lies on them
  fields.paint = path(svg, shell, fieldStroke(9));
  fields.foundations = rect(svg, 40, GY + 1, 120, 21, { fill: C.field, 'data-audit': 'skip' });
  fields.wiring = path(svg, wire, fieldStroke(7));
  fields.supply = path(svg, pipe, fieldStroke(9));
  fields.mark = circle(svg, 153, 156, 13, { fill: C.field, 'data-audit': 'skip' });
  fields.backdoor = rect(svg, 36, 137, 30, 35, { fill: C.field, 'data-audit': 'skip' });
  const used = {};
  d.states.forEach((s, k) => s.field.forEach((f) => { (used[f] = used[f] || []).push(k); }));
  Object.keys(fields).forEach((f) => {
    const ks = used[f] || [];
    st.on((gg) => {
      let p = 0;
      for (const k of ks) p = Math.max(p, ease(span(gg, k + 0.15, k + 0.7)) * (k < steps - 1 ? 1 - ease(span(gg, k + 1.1, k + 1.6)) : 1));
      fields[f].style.display = p <= 0.001 ? 'none' : '';
      fields[f].style.opacity = p >= 0.999 ? '' : p.toFixed(3);
    });
  });

  // the house
  const hs = g(svg);
  line(hs, 6, GY, 186, GY, ink);                                   // ground
  path(hs, shell, { ...ink, 'stroke-width': 1.5 });                 // walls and roof
  path(hs, `M${L + 4} ${GY}L${L + 4} ${EV + 2}M${R - 4} ${GY}L${R - 4} ${EV + 2}`, thin);   // inner wall faces
  line(hs, L + 4, EV + 2, R - 4, EV + 2, thin);                     // ceiling
  line(hs, L + 4, FL, R - 4, FL, ink); line(hs, L + 4, FL + 3, R - 4, FL + 3, thin);        // floor between storeys
  line(hs, 96, EV + 2, 96, FL, thin); line(hs, 106, FL + 3, 106, GY, thin);                // partitions
  path(hs, `M${RX - 26} ${EV + 2}L${RX} ${RY + 20}L${RX + 26} ${EV + 2}`, thin);            // roof truss
  // rooms: a desk and a chair, a table
  path(hs, 'M68 132L68 122L84 122L84 132M112 170L112 158L134 158L134 170M118 158L118 150', thin);
  // wiring with its lamps, and the meter
  path(hs, wire, { ...thin, 'stroke-width': 0.8 });
  [[78, 109], [124, 109], [78, 145], [124, 145]].forEach((p) => circle(hs, p[0], p[1], 2, { fill: C.paper, stroke: C.ink, 'stroke-width': 0.9 }));
  rect(hs, 56.5, 152, 5, 6, { fill: C.paper, stroke: C.ink, 'stroke-width': 0.9 });
  // supply line from the side, under the ground
  path(hs, pipe, { ...ink, 'stroke-width': 1.6 });
  [14, 24, 34].forEach((x) => line(hs, x, 178.5, x, 183.5, thin));
  // front door with the inspector's mark beside it
  path(hs, `M${R} 142L${R} ${GY}`, { stroke: C.paper, 'stroke-width': 3 });
  path(hs, `M${R - 4} 142L${R + 1} 142M${R} 142L${R + 13} 147L${R + 13} ${GY}`, thin);
  // the gate: a small barrier across the doorway
  path(hs, 'M141 156L165 156', { stroke: C.ink, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
  path(hs, 'M165 151L165 170M141 152L141 160', { ...ink, 'stroke-width': 1.4 });
  // back door: the opening in the left wall
  path(hs, `M${L} 142L${L} ${GY}`, { stroke: C.paper, 'stroke-width': 3 });
  line(hs, L - 1, 142, L + 4, 142, thin);
  st.fade(hs, 0, 0.12);

  // foundations: finished in the first states, unfinished from state 2 on
  const fd = 'M46 170L46 188L62 188L62 176L138 176L138 188L154 188L154 170';
  const solid = path(svg, fd, ink), dashed = path(svg, fd, { ...ink, 'stroke-dasharray': '3 3.4' });
  const hatch = g(svg);
  [[49, 186, 58, 173], [141, 186, 150, 173], [55, 186, 60, 179], [147, 186, 152, 179]].forEach((q) => line(hatch, q[0], q[1], q[2], q[3], thin));
  st.fade(solid, 0, 0.12, [2.15, 2.6]).fade(hatch, 0, 0.12, [2.15, 2.6]).fade(dashed, 2.3, 2.8);
  // back door leaf: open until the last state, then shut and barred
  const open = path(svg, `M${L} 142L${L - 12} 148L${L - 12} ${GY}`, thin);
  const shut = g(svg);
  rect(shut, L - 2.5, 142, 5, GY - 142, { fill: C.ink });
  line(shut, L - 13, 156, L + 13, 156, { stroke: C.accent, 'stroke-width': 3, 'stroke-linecap': 'round' });
  path(shut, `M${L - 13} 151L${L - 13} 161M${L + 13} 151L${L + 13} 161`, { stroke: C.accent, 'stroke-width': 1.4, 'stroke-linecap': 'round' });
  st.fade(open, 0, 0.12, [5.15, 5.5]).fade(shut, 5.3, 5.8);

  // labels: the part in mono with a thin leader, the state in italic below
  const mono = { family: 'mono', size: 11.5, fill: C.ink };
  const place = [
    () => { const lg = g(svg); const t = text(lg, 8, 22, d.parts.paint, mono); leader(lg, 40, t.bottom + 3, 70, 73, { stroke: C.muted }); return lg; },
    () => {
      const lg = g(svg);
      const t = text(lg, 4, 44, d.parts.wiring, { ...mono, width: 60, lh: 14 });
      leader(lg, 16, t.bottom + 3, 58, 124, { stroke: C.muted });
      const f = text(lg, 188, 18, d.parts.foundations, { ...mono, width: 100, lh: 14, anchor: 'end' });
      leader(lg, 180, f.bottom + 3, 158, 182, { stroke: C.muted });
      return lg;
    },
    () => { const lg = g(svg); const f = text(lg, 188, 18, d.parts.foundations, { ...mono, width: 100, lh: 14, anchor: 'end' }); leader(lg, 180, f.bottom + 3, 158, 182, { stroke: C.muted }); return lg; },
    () => { const lg = g(svg); const t = text(lg, 8, 207, d.parts.supply, mono); leader(lg, 22, t.y - 3, 22, 185, { stroke: C.muted }); return lg; },
    () => { const lg = g(svg); const t = text(lg, 184, 207, d.parts.mark, { ...mono, anchor: 'end' }); leader(lg, 170, t.y - 3, 160, 162, { stroke: C.muted }); return lg; },
    () => g(svg),
  ];
  d.states.forEach((s, k) => {
    const lg = place[k]();
    text(lg, 8, 234, s.label, { italic: true, size: 12.5 });
    on(lg, k);
  });
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
