// permits: one decision, putting a new IT system to work, as two schedules
// on one time axis.
//   step 0: United States ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· T-Mobile. build ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ launch (open-ended), with the
//           checks afterwards (accent diamonds inside the launch period):
//           lawsuits and state rules.
//   step 1: Germany ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Telekom. The works council and privacy review first
//           (the field, with the same diamonds: the checks), then build, then
//           launch.
//   step 2: a "framework agreement 2021" stamp lands on the German review; it
//           shrinks to its short form and building moves forward. A dashed
//           ghost keeps the long review's length: a system outside the
//           framework needs its own agreement. Under it, muted: if there is
//           no agreement, the conciliation board decides.
// No analogy in the drawing; the car comparison stays in the article text
// (data/permits.json keeps its facts under "carsNote", "inFigure": false).
// Lengths are schematic.
import {
  mountFigure, svgRoot, colors, g, path, rect, line, text, textSize, stage, span, ease, lerp, clamp, pen,
} from '../../../lib/fig.js';

export const steps = 3;
const SIZE = { wide: [552, 318], tall: [360, 378] };
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
  const MONO = { family: 'mono', size: 11.5 };
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
  const box = (parent, x0, x1, y0, a, b, extra) => twice(parent, [[x0, y0], [x1, y0], [x1, y0 + BH], [x0, y0 + BH], [x0, y0]], a, b, extra);
  const mono = (parent, x, y, s, o = {}) => text(parent, x, y, s, { ...MONO, fill: C.muted, ...o });
  // a check: an open diamond, as a milestone on a site schedule
  const diamond = (parent, x, y, r = 7) => path(parent, `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`, {
    stroke: C.accent, 'stroke-width': 1.8, 'stroke-linejoin': 'round', fill: C.paper,
  });

  // --- headline
  const head = text(svg, X0, 20, d.headline, { family: 'sans', size: 13.5, weight: 600, width: X1 - X0 });
  st.fade(head.el, 0, 0.08);
  let y = head.bottom + 22;

  // --- United States ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· T-Mobile
  const usY = y;
  const usK = mono(svg, X0, usY, d.rows.us.label, { caps: true, spacing: 0.6, fill: C.ink, weight: 500 });
  st.fade(usK.el, 0.04, 0.14);
  const lab1 = usY + 22, bar1 = lab1 + 7;
  const us = S.us;
  const lb = mono(svg, X(us.build[0]) + 1, lab1, wd.build); st.fade(lb.el, 0.2, 0.3);
  box(svg, X(us.build[0]), X(us.build[1]), bar1, 0.16, 0.38);
  const lm = mono(svg, X(us.launch[0]) + 7, lab1, wd.launch); st.fade(lm.el, 0.38, 0.48);
  twice(svg, [[X(us.launch[0]) + 6, bar1], [X1, bar1]], 0.36, 0.56);
  twice(svg, [[X(us.launch[0]) + 6, bar1], [X(us.launch[0]) + 6, bar1 + BH], [X1, bar1 + BH]], 0.36, 0.56);
  // the checks afterwards: diamonds inside the launch period
  const after = g(svg);
  us.checks.forEach((u) => diamond(after, X(u), bar1 + BH / 2));
  st.fade(after, 0.58, 0.72);
  // their label above the bar if it fits beside "launch", else under it
  const liW = textSize(wd.afterwards, MONO).w;
  let liX = X(us.checks[0]) - 5, liAnchor = 'start', liY = lab1, below = false;
  if (liX + liW > X1) { liX = X1; liAnchor = 'end'; }
  if ((liAnchor === 'end' ? X1 - liW : liX) < lm.right + 12) {
    liX = X(us.checks[0]) - 5; liAnchor = 'start'; below = true; liY = bar1 + BH + 17;
    if (liX + liW > X1) { liX = X1; liAnchor = 'end'; }
  }
  const li = mono(svg, liX, liY, wd.afterwards, { fill: C.accent, anchor: liAnchor });
  st.fade(li.el, 0.62, 0.74);
  y = bar1 + BH + (below ? 44 : 30);

  // --- Germany ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Telekom
  const deY = y;
  const deK = mono(svg, X0, deY, d.rows.de.label, { caps: true, spacing: 0.6, fill: C.ink, weight: 500 });
  st.fade(deK.el, 1.02, 1.12);
  const de = S.de, fw = de.framework;
  // the review's label: wrapped to the short review, so that it never meets
  // "build" once building moves forward; if that takes more than two lines,
  // it wraps to the long review and sits one line higher, above "build"
  const shortW = X(fw.review[1]) - X(fw.review[0]) - 8;
  let rvW = shortW, rv = textSize(wd.review, { ...MONO, width: rvW }), lift = 0;
  if (rv.lines > 2) { rvW = X(de.review[1]) - X(de.review[0]) - 8; rv = textSize(wd.review, { ...MONO, width: rvW }); lift = rv.lh; }
  const lab2 = deY + 22 + (rv.lines - 1) * rv.lh + lift, bar2 = lab2 + 7;
  const shrink = (gg) => ease(span(gg, 2.18, 2.62));
  // the review: field and outline in one group, scaled from its left edge
  const review = g(svg);
  const pw = X(de.review[1]) - X(de.review[0]);
  const field = rect(review, X(de.review[0]), bar2, pw, BH, { fill: C.field, 'data-audit': 'skip' });
  st.fade(field, 1.12, 1.3);
  box(review, X(de.review[0]), X(de.review[1]), bar2, 1.1, 1.32, { 'vector-effect': 'non-scaling-stroke' });
  const ratio = (X(fw.review[1]) - X(fw.review[0])) / pw;
  const px0 = X(de.review[0]);
  let lastP = '';
  st.on((gg) => {
    const p = shrink(gg);
    const sx = lerp(1, ratio, p);
    const v = p <= 0.0005 ? '' : `translate(${px0} 0) scale(${sx.toFixed(4)} 1) translate(${-px0} 0)`;
    if (v !== lastP) { lastP = v; if (v) review.setAttribute('transform', v); else review.removeAttribute('transform'); }
  });
  const lr = mono(svg, X(de.review[0]) + 1, lab2 - (rv.lines - 1) * rv.lh - lift, wd.review, { width: rvW });
  st.fade(lr.el, 1.16, 1.26);
  // the checks inside the review; they give way to the stamp
  const checks = g(svg);
  de.checks.forEach((u) => diamond(checks, X(u), bar2 + BH / 2));
  st.fade(checks, 1.26, 1.42, [2.06, 2.2]);

  // build and launch: drawn at their place in step 1, moved forward in step 2
  const shift = X(fw.build[0]) - X(de.build[0]);
  const bld = g(svg);
  box(bld, X(de.build[0]), X(de.build[1]), bar2, 1.36, 1.58);
  const lb2 = mono(bld, X(de.build[0]) + 1, lab2, wd.build); st.fade(lb2.el, 1.42, 1.52);
  // launch: its left edge travels with the building, its long lines are
  // drawn at the final length and clipped from the left
  const cid = `permits-clip-${Math.random().toString(36).slice(2, 8)}`;
  const cp = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  cp.setAttribute('id', cid);
  const clipR = rect(cp, X(de.launch[0]) + 5, bar2 - 4, X1 - X(de.launch[0]) + 10, BH + 8);
  svg.appendChild(cp);
  const lnLines = g(svg, { 'clip-path': `url(#${cid})` });
  twice(lnLines, [[X(fw.launch[0]) + 6, bar2], [X1, bar2]], 1.56, 1.76);
  twice(lnLines, [[X(fw.launch[0]) + 6, bar2 + BH], [X1, bar2 + BH]], 1.56, 1.76);
  const lnEdge = g(svg);
  twice(lnEdge, [[X(de.launch[0]) + 6, bar2], [X(de.launch[0]) + 6, bar2 + BH]], 1.54, 1.62);
  const lm2 = mono(lnEdge, X(de.launch[0]) + 7, lab2, wd.launch); st.fade(lm2.el, 1.58, 1.68);
  let lastS = '';
  st.on((gg) => {
    const dx = shift * shrink(gg);
    const v = Math.abs(dx) < 0.05 ? '' : `translate(${dx.toFixed(2)} 0)`;
    if (v === lastS) return;
    lastS = v;
    for (const n of [bld, lnEdge]) { if (v) n.setAttribute('transform', v); else n.removeAttribute('transform'); }
    clipR.setAttribute('x', (X(de.launch[0]) + 5 + dx).toFixed(2));
    clipR.setAttribute('width', (X1 + 5 - (X(de.launch[0]) + 5 + dx)).toFixed(2));
  });

  // the stamp on the short review: three lines, a little taller than the bar
  const sw = X(fw.review[1]) - X(fw.review[0]);
  const sDrop = lift ? 0 : 3;               // a little low when the label sits right above it
  const stamp = g(svg, { transform: `rotate(-4 ${X(fw.review[0]) + sw / 2} ${bar2 + BH / 2 + sDrop})` });
  const sFrame = g(stamp, { 'data-audit': 'skip' });
  const sOpt = { family: 'mono', size: ctx.print ? 10.5 : 9.5, weight: 600, fill: C.accent, anchor: 'middle', lh: ctx.print ? 11 : 10.2, spacing: 0.3 };
  const sTxt = textSize(wd.stamp.join('\n'), sOpt);
  const stW = Math.min(sw - 6, Math.ceil(sTxt.w) + 16), stH = sTxt.lines * sTxt.lh + 6;
  const sx0 = X(fw.review[0]) + (sw - stW) / 2, sy0 = bar2 + BH / 2 + sDrop - stH / 2;
  rect(sFrame, sx0, sy0, stW, stH, { fill: C.paper, stroke: C.accent, 'stroke-width': 1.5, rx: 1.5 });
  rect(sFrame, sx0 + 2.2, sy0 + 2.2, stW - 4.4, stH - 4.4, { fill: 'none', stroke: C.accent, 'stroke-width': 0.6, rx: 1 });
  // first baseline so that the block sits in the middle of the stamp
  const base0 = sy0 + stH / 2 - (sTxt.lines - 1) * sTxt.lh / 2 + sOpt.size * 0.36;
  text(stamp, sx0 + stW / 2, base0, wd.stamp.join('\n'), sOpt);
  st.fade(stamp, 2.08, 2.24);

  // the old review, in place: a faint dashed outline of the step-1 bar
  const ghost = rect(svg, X(de.review[0]), bar2 - 3, X(de.review[1]) - X(de.review[0]), BH + 6, {
    fill: 'none', stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '4 3', opacity: 0.8, 'data-audit': 'skip',
  });
  st.fade(ghost, 2.58, 2.72);
  // one line if it fits, else two lines of about equal length
  const bOpt = { italic: true, size: 13, fill: C.ink };
  const bW = textSize(wd.beyond, bOpt).w;
  const dimL = text(svg, X(de.review[0]), bar2 + BH + 21, wd.beyond, { ...bOpt, width: bW <= X1 - X0 ? X1 - X0 : Math.ceil(bW / 2) + 24 });
  st.fade(dimL.el, 2.66, 2.8);
  // where real delays happen: no agreement, and the conciliation board decides
  const cOpt = { ...MONO, size: 11 };
  const cW = textSize(wd.conciliation, cOpt).w;
  const conc = mono(svg, X(de.review[0]), dimL.bottom + 15, wd.conciliation, { ...cOpt, width: cW <= X1 - X0 ? X1 - X0 : Math.ceil(cW / 2) + 30 });
  st.fade(conc.el, 2.74, 2.88);
  y = conc.bottom + 22;

  // --- the shared axis
  const axY = y;
  const axis = g(svg);
  twice(axis, [[X0, axY], [X1, axY]], 0.04, 0.2);
  twice(axis, [[X1 - 7, axY - 4], [X1, axY], [X1 - 7, axY + 4]], 0.18, 0.22);
  twice(axis, [[X0, axY - 5], [X0, axY + 5]], 0.04, 0.1);
  const tl = mono(svg, X1, axY + 17, d.axis.time, { anchor: 'end' }); st.fade(tl.el, 0.14, 0.24);
  const sl = mono(svg, X0, axY + 17, d.axis.start); st.fade(sl.el, 0.1, 0.2);
  const sc = mono(svg, (X0 + X1) / 2, axY + 17, d.axis.scale, { size: 11, anchor: 'middle' }); st.fade(sc.el, 0.14, 0.24);
  // a faint common start through both rows
  const startLine = line(svg, X0, bar1 - 2, X0, axY, { stroke: C.hairline, 'stroke-width': 1, 'stroke-dasharray': '2 3', 'data-audit': 'skip' });
  st.fade(startLine, 0.1, 0.2);
  if (axY + 22 > H) svg.dataset.contentH = String(Math.ceil(axY + 22));

  return { set(step, t) { st.set(step, clamp(t)); }, destroy() {} };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
