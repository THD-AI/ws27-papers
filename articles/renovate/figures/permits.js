// permits: two construction schedules on one time axis, like a site plan.
//   step 0: United States. build → move in → inspections afterwards
//           (the checks, open diamonds, stand inside the occupied period).
//   step 1: Germany. A permit first (the field, with the same diamonds:
//           the checks), then build, then move in.
//   step 2: a "standard design" stamp lands on the German permit; the
//           permit shrinks to its short form and the building work moves
//           forward. A dimension line keeps the long permit's length:
//           a building beyond the standard still needs a full permit.
// Words in the drawing are building words; the company terms are in the
// notes under the axis. Lengths are schematic (data/permits.json).
import {
  mountFigure, svgRoot, colors, g, path, rect, line, text, stage, span, ease, rng, spline, lerp, clamp,
} from '../../../lib/fig.js';

export const steps = 3;
const SIZE = { wide: [552, 434], tall: [360, 486] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

// a pen line: thin, a little uneven, seeded
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

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  const S = d.schedule, wd = d.words;
  const X0 = 16, X1 = W - 16;
  const X = (u) => X0 + (u / S.span) * (X1 - X0);
  const BH = 40;                          // bar height
  let seed = 11;
  const ink = (parent, pts, w = 1.35, stroke = C.ink, amp = 0.55) => path(parent, pen(pts, seed++, amp), {
    stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  const twice = (parent, pts, a, b, extra = {}) => {     // a main stroke and a thin one beside it
    const m = ink(parent, pts, 1.35); st.draw(m, a, b);
    const t = ink(parent, pts, 0.55, C.ink, 0.9); t.setAttribute('opacity', 0.7); st.draw(t, a, b);
    for (const k in extra) { m.setAttribute(k, extra[k]); t.setAttribute(k, extra[k]); }
    return [m, t];
  };
  const mono = (parent, x, y, s, o = {}) => text(parent, x, y, s, { family: 'mono', size: 11.5, fill: C.muted, ...o });
  // a check: an open diamond, as a milestone on a site schedule
  const diamond = (parent, x, y, r = 5.5) => path(parent, `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`, {
    stroke: C.accent, 'stroke-width': 1.6, 'stroke-linejoin': 'round', fill: C.paper,
  });

  // --- headline
  const head = text(svg, X0, 20, d.headline, { family: 'sans', size: 13.5, weight: 600, width: X1 - X0 });
  st.fade(head.el, 0, 0.08);
  let y = head.bottom + 22;

  // --- United States
  const usY = y;
  const usK = mono(svg, X0, usY, d.rows.us.label, { caps: true, spacing: 0.6, fill: C.ink, weight: 500 });
  st.fade(usK.el, 0.04, 0.14);
  const lab1 = usY + 22, bar1 = lab1 + 7;
  const us = S.us;
  const lb = mono(svg, X(us.build[0]) + 1, lab1, wd.build); st.fade(lb.el, 0.2, 0.3);
  twice(svg, [[X(us.build[0]), bar1], [X(us.build[1]), bar1], [X(us.build[1]), bar1 + BH], [X(us.build[0]), bar1 + BH], [X(us.build[0]), bar1]], 0.16, 0.38);
  const lm = mono(svg, X(us.move[0]) + 7, lab1, wd.move); st.fade(lm.el, 0.38, 0.48);
  twice(svg, [[X(us.move[0]) + 6, bar1], [X1, bar1]], 0.36, 0.56);
  twice(svg, [[X(us.move[0]) + 6, bar1], [X(us.move[0]) + 6, bar1 + BH], [X1, bar1 + BH]], 0.36, 0.56);
  // inspections: diamonds inside the occupied period
  const insp = g(svg);
  us.inspections.forEach((u) => diamond(insp, X(u), bar1 + BH / 2));
  st.fade(insp, 0.58, 0.72);
  const li = mono(svg, X(us.inspections[0]) - 5, lab1, wd.inspections, { fill: C.accent });
  st.fade(li.el, 0.62, 0.74);
  y = bar1 + BH + 30;

  // --- Germany
  const deY = y;
  const deK = mono(svg, X0, deY, d.rows.de.label, { caps: true, spacing: 0.6, fill: C.ink, weight: 500 });
  st.fade(deK.el, 1.02, 1.12);
  const lab2 = deY + 22, bar2 = lab2 + 7;
  const de = S.de, sd = de.standard;
  const shrink = (gg) => ease(span(gg, 2.18, 2.62));
  // the permit: field and outline in one group, scaled from its left edge
  const permit = g(svg);
  const pw = X(de.permit[1]) - X(de.permit[0]);
  const field = rect(permit, X(de.permit[0]), bar2, pw, BH, { fill: C.field, 'data-audit': 'skip' });
  st.fade(field, 1.12, 1.3);
  twice(permit, [[X(de.permit[0]), bar2], [X(de.permit[1]), bar2], [X(de.permit[1]), bar2 + BH], [X(de.permit[0]), bar2 + BH], [X(de.permit[0]), bar2]], 1.1, 1.32, { 'vector-effect': 'non-scaling-stroke' });
  const ratio = (X(sd.permit[1]) - X(sd.permit[0])) / pw;
  const px0 = X(de.permit[0]);
  let lastP = '';
  st.on((gg) => {
    const p = shrink(gg);
    const sx = lerp(1, ratio, p);
    const v = p <= 0.0005 ? '' : `translate(${px0} 0) scale(${sx.toFixed(4)} 1) translate(${-px0} 0)`;
    if (v !== lastP) { lastP = v; if (v) permit.setAttribute('transform', v); else permit.removeAttribute('transform'); }
  });
  const lp = mono(svg, X(de.permit[0]) + 1, lab2, wd.permit); st.fade(lp.el, 1.16, 1.26);
  // the checks inside the permit; they give way to the stamp
  const checks = g(svg);
  de.checks.forEach((u) => diamond(checks, X(u), bar2 + BH / 2));
  st.fade(checks, 1.26, 1.42, [2.06, 2.2]);

  // build and move in: drawn at their place in step 1, moved forward in step 2
  const shift = X(sd.build[0]) - X(de.build[0]);
  const bld = g(svg);
  twice(bld, [[X(de.build[0]), bar2], [X(de.build[1]), bar2], [X(de.build[1]), bar2 + BH], [X(de.build[0]), bar2 + BH], [X(de.build[0]), bar2]], 1.36, 1.58);
  const lb2 = mono(bld, X(de.build[0]) + 1, lab2, wd.build); st.fade(lb2.el, 1.42, 1.52);
  // move in: its left edge travels with the building, its long lines are
  // drawn at the final length and clipped from the left
  const cid = `permits-clip-${Math.random().toString(36).slice(2, 8)}`;
  const cp = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  cp.setAttribute('id', cid);
  const clipR = rect(cp, X(de.move[0]) + 5, bar2 - 4, X1 - X(de.move[0]) + 10, BH + 8);
  svg.appendChild(cp);
  const mvLines = g(svg, { 'clip-path': `url(#${cid})` });
  twice(mvLines, [[X(sd.move[0]) + 6, bar2], [X1, bar2]], 1.56, 1.76);
  twice(mvLines, [[X(sd.move[0]) + 6, bar2 + BH], [X1, bar2 + BH]], 1.56, 1.76);
  const mvEdge = g(svg);
  twice(mvEdge, [[X(de.move[0]) + 6, bar2], [X(de.move[0]) + 6, bar2 + BH]], 1.54, 1.62);
  const lm2 = mono(mvEdge, X(de.move[0]) + 7, lab2, wd.move); st.fade(lm2.el, 1.58, 1.68);
  let lastS = '';
  st.on((gg) => {
    const dx = shift * shrink(gg);
    const v = Math.abs(dx) < 0.05 ? '' : `translate(${dx.toFixed(2)} 0)`;
    if (v === lastS) return;
    lastS = v;
    for (const n of [bld, mvEdge]) { if (v) n.setAttribute('transform', v); else n.removeAttribute('transform'); }
    clipR.setAttribute('x', (X(de.move[0]) + 5 + dx).toFixed(2));
    clipR.setAttribute('width', (X1 + 5 - (X(de.move[0]) + 5 + dx)).toFixed(2));
  });

  // the stamp on the short permit
  const sw = X(sd.permit[1]) - X(sd.permit[0]);
  const stamp = g(svg, { transform: `rotate(-5 ${X(sd.permit[0]) + sw / 2} ${bar2 + BH / 2})` });
  const sFrame = g(stamp, { 'data-audit': 'skip' });
  const stW = Math.min(sw - 6, 76), stH = BH - 8;
  const sx0 = X(sd.permit[0]) + (sw - stW) / 2, sy0 = bar2 + 4;
  rect(sFrame, sx0, sy0, stW, stH, { fill: 'none', stroke: C.accent, 'stroke-width': 1.5, rx: 1.5 });
  rect(sFrame, sx0 + 2.2, sy0 + 2.2, stW - 4.4, stH - 4.4, { fill: 'none', stroke: C.accent, 'stroke-width': 0.6, rx: 1 });
  const stT = text(stamp, sx0 + stW / 2, sy0 + stH / 2 - 1.5, wd.stamp.join('\n'), {
    family: 'mono', size: 9.5, weight: 600, fill: C.accent, anchor: 'middle', lh: 10.5, spacing: 0.3,
  });
  // centre the two lines on the stamp
  stT.el.setAttribute('transform', `translate(0 ${(-(stT.h) / 2 + stT.lh * 0.5 + 2.5).toFixed(1)})`);
  st.fade(stamp, 2.08, 2.24);

  // the old permit, in place: a faint dashed outline of the step-1 bar
  const ghost = rect(svg, X(de.permit[0]), bar2 - 3, X(de.permit[1]) - X(de.permit[0]), BH + 6, {
    fill: 'none', stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '4 3', opacity: 0.8, 'data-audit': 'skip',
  });
  st.fade(ghost, 2.58, 2.72);
  const dimL = text(svg, X(de.permit[0]), bar2 + BH + 21, wd.beyond, { italic: true, size: 13, fill: C.ink, width: X1 - X0 });
  st.fade(dimL.el, 2.66, 2.8);
  y = dimL.bottom + 22;

  // --- the shared axis
  const axY = y;
  const axis = g(svg);
  twice(axis, [[X0, axY], [X1, axY]], 0.04, 0.2);
  twice(axis, [[X1 - 7, axY - 4], [X1, axY], [X1 - 7, axY + 4]], 0.18, 0.22);
  twice(axis, [[X0, axY - 5], [X0, axY + 5]], 0.04, 0.1);
  const tl = mono(svg, X1, axY + 17, d.axis.time, { anchor: 'end' }); st.fade(tl.el, 0.14, 0.24);
  const sl = mono(svg, X0, axY + 17, d.axis.start); st.fade(sl.el, 0.1, 0.2);
  // a faint common start through both rows
  const startLine = line(svg, X0, bar1 - 2, X0, axY, { stroke: C.hairline, 'stroke-width': 1, 'stroke-dasharray': '2 3', 'data-audit': 'skip' });
  st.fade(startLine, 0.1, 0.2);

  // --- notes, caption-like, with the company terms
  y = axY + 44;
  for (const n of d.notes) {
    const t = text(svg, X0, y, `${n.lead} ${n.text}`, { italic: true, size: 12.5, fill: C.muted, width: X1 - X0, lh: 16 });
    st.fade(t.el, n.step + 0.72, n.step + 0.86);
    y = t.bottom + 8 + 12.5 * 0.8;
  }
  if (y - 4 > H) svg.dataset.contentH = Math.round(y - 4);

  return { set(step, t) { st.set(step, clamp(t)); }, destroy() {} };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
