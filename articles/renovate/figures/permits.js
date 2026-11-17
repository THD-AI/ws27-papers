// permits: two schedules for a new car on one time axis.
//   step 0: United States. design and build → on the road, with the
//           authority's tests and recalls afterwards (open diamonds inside
//           the road period): the maker certifies its own cars.
//   step 1: Germany / EU. Type approval first (the field, with the same
//           diamonds: the checks), then build, then on the road.
//   step 2: a "type approved" stamp lands on the German approval; it
//           shrinks to its short form and building moves forward. A dashed
//           ghost keeps the long approval's length: a car outside the
//           approved type needs its own approval.
// Words in the drawing are car words; the figure ends at the axis. The
// company terms are in the article text (data/permits.json keeps them under
// "notes", flagged "inFigure": false). Lengths are schematic.
import {
  mountFigure, svgRoot, colors, g, path, rect, line, text, textSize, stage, span, ease, lerp, clamp, pen,
} from '../../../lib/fig.js';

export const steps = 3;
const SIZE = { wide: [552, 288], tall: [360, 318] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };


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
  const diamond = (parent, x, y, r = 7) => path(parent, `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`, {
    stroke: C.accent, 'stroke-width': 1.8, 'stroke-linejoin': 'round', fill: C.paper,
  });
  // a small car, side view, in pen lines; (x, y) is the left end of its wheel
  // line. Drawn a third larger than its 26-unit sketch, so that it reads in print.
  const car = (parent, x, y) => {
    const c = g(parent), k = 1.35;
    const P = (pts) => pts.map(([a, b]) => [x + a * k, y + b * k]);
    ink(c, P([[3, 0], [0, 0], [0, -5.5], [5, -6.5], [8, -11.5], [17, -11.5], [21, -6.5], [26, -5.5], [26, 0], [23, 0]]), 1.5, C.ink, 0.4);
    ink(c, P([[10, 0], [16, 0]]), 1.5, C.ink, 0.3);
    const r = 2.8 * k;
    for (const wx of [x + 6.5 * k, x + 19.5 * k]) path(c, `M${wx - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`, { stroke: C.ink, 'stroke-width': 1.5, fill: 'none' });
    return c;
  };

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
  const buildFits = X(us.build[0]) + 1 + textSize(wd.build, { family: 'mono', size: 11.5 }).w < X(us.move[0]) - 4;
  const lb = mono(svg, X(us.build[0]) + 1, lab1, buildFits ? wd.build : wd.buildShort); st.fade(lb.el, 0.2, 0.3);
  twice(svg, [[X(us.build[0]), bar1], [X(us.build[1]), bar1], [X(us.build[1]), bar1 + BH], [X(us.build[0]), bar1 + BH], [X(us.build[0]), bar1]], 0.16, 0.38);
  const lm = mono(svg, X(us.move[0]) + 7, lab1, wd.move); st.fade(lm.el, 0.38, 0.48);
  twice(svg, [[X(us.move[0]) + 6, bar1], [X1, bar1]], 0.36, 0.56);
  twice(svg, [[X(us.move[0]) + 6, bar1], [X(us.move[0]) + 6, bar1 + BH], [X1, bar1 + BH]], 0.36, 0.56);
  // inspections: diamonds inside the occupied period
  const insp = g(svg);
  us.inspections.forEach((u) => diamond(insp, X(u), bar1 + BH / 2));
  st.fade(insp, 0.58, 0.72);
  const usCar = car(svg, X(us.move[0]) + 13, bar1 + BH - 9);
  st.fade(usCar, 0.44, 0.54);
  // the tests label above the bar if it fits beside "on the road", else under it
  const liW = textSize(wd.inspections, { family: 'mono', size: 11.5 }).w;
  let liX = X(us.inspections[0]) - 5, liAnchor = 'start', liY = lab1, below = false;
  if (liX + liW > X1) { liX = X1; liAnchor = 'end'; }
  if ((liAnchor === 'end' ? X1 - liW : liX) < lm.right + 12) { liX = X(us.inspections[0]) - 5; liAnchor = 'start'; below = true; liY = bar1 + BH + 17; if (liX + liW > X1) { liX = X1; liAnchor = 'end'; } }
  const li = mono(svg, liX, liY, wd.inspections, { fill: C.accent, anchor: liAnchor });
  st.fade(li.el, 0.62, 0.74);
  y = bar1 + BH + (below ? 44 : 30);

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
  const lb2 = mono(bld, X(de.build[0]) + 1, lab2, wd.buildDe); st.fade(lb2.el, 1.42, 1.52);
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
  const deCar = car(mvEdge, X(de.move[0]) + 13, bar2 + BH - 9);
  st.fade(deCar, 1.64, 1.74);
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
    family: 'mono', size: ctx.print ? 10.5 : 9.5, weight: 600, fill: C.accent, anchor: 'middle', lh: ctx.print ? 11.5 : 10.5, spacing: 0.3,
  });
  // centre the two lines on the stamp
  stT.el.setAttribute('transform', `translate(0 ${(-(stT.h) / 2 + stT.lh * 0.5 + 2.5).toFixed(1)})`);
  st.fade(stamp, 2.08, 2.24);

  // the old permit, in place: a faint dashed outline of the step-1 bar
  const ghost = rect(svg, X(de.permit[0]), bar2 - 3, X(de.permit[1]) - X(de.permit[0]), BH + 6, {
    fill: 'none', stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '4 3', opacity: 0.8, 'data-audit': 'skip',
  });
  st.fade(ghost, 2.58, 2.72);
  // one line if it fits, else two lines of about equal length
  const bOpt = { italic: true, size: 13, fill: C.ink };
  const bW = textSize(wd.beyond, bOpt).w;
  const dimL = text(svg, X(de.permit[0]), bar2 + BH + 21, wd.beyond, { ...bOpt, width: bW <= X1 - X0 ? X1 - X0 : Math.ceil(bW / 2) + 24 });
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

  // the figure ends at the axis; the company notes stay in the data

  return { set(step, t) { st.set(step, clamp(t)); }, destroy() {} };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
