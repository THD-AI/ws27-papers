// permits: one decision, putting a new IT system to work, as two schedules
// on one time axis.
//   step 0: United States, T-Mobile. build -> launch (open-ended), with the
//           checks afterwards (accent diamonds inside the launch period):
//           lawsuits and state rules.
//   step 1: Germany, Telekom. The works council and privacy review first
//           (the field, with the same diamonds: the checks), then build, then
//           launch.
//   step 2: the German side as two rows. The row of step 1 is named
//           "outside the framework: its own agreement" (how long that takes
//           is not published, and the row says so), with the conciliation
//           board as a muted note under it. A second row arrives under it,
//           "inside the framework agreement (2021)": a short check, so build
//           and launch come visibly earlier.
// No analogy in the drawing; the car comparison stays in the article text
// (data/permits.json keeps its facts under "carsNote", "inFigure": false).
// Lengths are schematic.
import {
  mountFigure, svgRoot, colors, g, path, rect, line, text, textSize, stage, clamp, pen,
} from '../../../lib/fig.js';

export const steps = 3;
// where scenes read as a sequence (tablet portrait, phone landscape): one still, the final state
export const stills = [2];
// seconds each step plays once triggered: the American row; the German
// row with its review; the second German row inside the framework
export const durations = { large: [2.0, 2.2, 2.2] };
const SIZE = { wide: [552, 400], tall: [360, 462] };
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
  const BH = 50;                          // bar height: room for the stamp inside the short review
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
  st.fade(head.el, 0, 0.12);
  let y = head.bottom + 22;

  // --- United States, T-Mobile
  const usY = y;
  const usK = mono(svg, X0, usY, d.rows.us.label, { caps: true, spacing: 0.6, fill: C.ink, weight: 500 });
  st.fade(usK.el, 0.08, 0.2);
  const lab1 = usY + 22, bar1 = lab1 + 7;
  const us = S.us;
  const lb = mono(svg, X(us.build[0]) + 1, lab1, wd.build); st.fade(lb.el, 0.38, 0.5);
  box(svg, X(us.build[0]), X(us.build[1]), bar1, 0.3, 0.5);
  const lm = mono(svg, X(us.launch[0]) + 7, lab1, wd.launch); st.fade(lm.el, 0.56, 0.66);
  twice(svg, [[X(us.launch[0]) + 6, bar1], [X1, bar1]], 0.48, 0.7);
  twice(svg, [[X(us.launch[0]) + 6, bar1], [X(us.launch[0]) + 6, bar1 + BH], [X1, bar1 + BH]], 0.48, 0.7);
  // the checks afterwards: diamonds inside the launch period
  const after = g(svg);
  us.checks.forEach((u) => diamond(after, X(u), bar1 + BH / 2));
  st.fade(after, 0.68, 0.8);
  // their label above the bar if it fits beside "launch", else under it
  const liW = textSize(wd.afterwards, MONO).w;
  let liX = X(us.checks[0]) - 5, liAnchor = 'start', liY = lab1, below = false;
  if (liX + liW > X1) { liX = X1; liAnchor = 'end'; }
  if ((liAnchor === 'end' ? X1 - liW : liX) < lm.right + 12) {
    liX = X(us.checks[0]) - 5; liAnchor = 'start'; below = true; liY = bar1 + BH + 17;
    if (liX + liW > X1) { liX = X1; liAnchor = 'end'; }
  }
  const li = mono(svg, liX, liY, wd.afterwards, { fill: C.accent, anchor: liAnchor });
  st.fade(li.el, 0.74, 0.88);
  y = bar1 + BH + (below ? 44 : 30);

  // --- Germany, Telekom
  const deY = y;
  const deK = mono(svg, X0, deY, d.rows.de.label, { caps: true, spacing: 0.6, fill: C.ink, weight: 500 });
  st.fade(deK.el, 1.02, 1.16);
  const de = S.de, fw = de.framework;
  // step 2 names the row it stands on: "outside the framework" (the long
  // review of step 1). Its line is kept free from the start, so nothing
  // moves when it arrives.
  const oOpt = { italic: true, size: 13, fill: C.ink, width: X1 - X0 };
  // one line if it fits, else broken at its " · ", never mid-phrase
  const outS = textSize(wd.outside, oOpt).lines > 1 ? wd.outside.replace(' · ', ' ·\n') : wd.outside;
  const outT = text(svg, X0, deY + 21, outS, oOpt);
  st.fade(outT.el, 2.02, 2.2);
  // the review's label: on two lines over the review if they fit, else over the whole row
  // (two lines of about equal length)
  const rvW0 = Math.min(X(de.review[1]) - X(de.review[0]) - 8, Math.ceil(textSize(wd.review, MONO).w / 2) + 30);
  let rvW = rvW0, rv = textSize(wd.review, { ...MONO, width: rvW });
  if (rv.lines > 2) { rvW = X1 - X0; rv = textSize(wd.review, { ...MONO, width: rvW }); }
  const rvTop = outT.bottom + 4 + MONO.size;
  const lab2 = rvTop + (rv.lines - 1) * rv.lh, bar2 = lab2 + 7;
  const field = rect(svg, X(de.review[0]), bar2, X(de.review[1]) - X(de.review[0]), BH, { fill: C.field, 'data-audit': 'skip' });
  st.fade(field, 1.18, 1.4);
  box(svg, X(de.review[0]), X(de.review[1]), bar2, 1.1, 1.38);
  const lr = mono(svg, X(de.review[0]) + 1, rvTop, wd.review, { width: rvW });
  st.fade(lr.el, 1.24, 1.4);
  // the checks inside the review
  const checks = g(svg);
  de.checks.forEach((u) => diamond(checks, X(u), bar2 + BH / 2));
  st.fade(checks, 1.38, 1.54);
  box(svg, X(de.build[0]), X(de.build[1]), bar2, 1.5, 1.7);
  const lb2 = mono(svg, X(de.build[0]) + 1, lab2, wd.build); st.fade(lb2.el, 1.58, 1.72);
  twice(svg, [[X(de.launch[0]) + 6, bar2], [X1, bar2]], 1.68, 1.9);
  twice(svg, [[X(de.launch[0]) + 6, bar2], [X(de.launch[0]) + 6, bar2 + BH], [X1, bar2 + BH]], 1.66, 1.9);
  const lm2 = mono(svg, X(de.launch[0]) + 7, lab2, wd.launch); st.fade(lm2.el, 1.76, 1.92);
  // where real delays happen: no agreement, and the conciliation board decides
  const cOpt = { ...MONO, size: 11 };
  const cW = textSize(wd.conciliation, cOpt).w;
  const conc = mono(svg, X0, bar2 + BH + 16, wd.conciliation, { ...cOpt, width: cW <= X1 - X0 ? X1 - X0 : Math.ceil(cW / 2) + 30 });
  st.fade(conc.el, 2.15, 2.33);

  // step 2: the second row, inside the framework: a short check, then build
  // and launch. Its words stand inside its bars, so they cannot be read as
  // the other row's.
  const inT = text(svg, X0, conc.bottom + 24, wd.inside, oOpt);
  st.fade(inT.el, 2.31, 2.46);
  const BH2 = 30, bar3 = inT.bottom + 8;
  const fF = rect(svg, X(fw.review[0]), bar3, X(fw.review[1]) - X(fw.review[0]), BH2, { fill: C.field, 'data-audit': 'skip' });
  st.fade(fF, 2.46, 2.62);
  const box2 = (x0, x1, a, b) => twice(svg, [[x0, bar3], [x1, bar3], [x1, bar3 + BH2], [x0, bar3 + BH2], [x0, bar3]], a, b);
  box2(X(fw.review[0]), X(fw.review[1]), 2.42, 2.6);
  box2(X(fw.build[0]), X(fw.build[1]), 2.55, 2.73);
  twice(svg, [[X(fw.launch[0]) + 6, bar3], [X1, bar3]], 2.66, 2.86);
  twice(svg, [[X(fw.launch[0]) + 6, bar3], [X(fw.launch[0]) + 6, bar3 + BH2], [X1, bar3 + BH2]], 2.66, 2.86);
  // each word after its bar is drawn
  const inWord = (x0, x1, words, a) => {
    const s = words.find((w) => textSize(w, MONO).w <= x1 - x0 - 10) || words[words.length - 1];
    const t = mono(svg, x0 + 6, bar3 + BH2 / 2 + MONO.size * 0.34, s, { fill: C.ink });
    st.fade(t.el, a, a + 0.11);
  };
  inWord(X(fw.review[0]), X(fw.review[1]), wd.check, 2.55);
  inWord(X(fw.build[0]), X(fw.build[1]), [wd.build], 2.68);
  inWord(X(fw.launch[0]) + 6, X1, [wd.launch], 2.81);
  y = bar3 + BH2 + 26;

  // --- the shared axis
  const axY = y;
  const axis = g(svg);
  twice(axis, [[X0, axY], [X1, axY]], 0.1, 0.34);
  twice(axis, [[X1 - 7, axY - 4], [X1, axY], [X1 - 7, axY + 4]], 0.32, 0.38);
  twice(axis, [[X0, axY - 5], [X0, axY + 5]], 0.06, 0.14);
  const tl = mono(svg, X1, axY + 17, d.axis.time, { anchor: 'end' }); st.fade(tl.el, 0.3, 0.42);
  const sl = mono(svg, X0, axY + 17, d.axis.start); st.fade(sl.el, 0.16, 0.28);
  const sc = mono(svg, (X0 + X1) / 2, axY + 17, d.axis.scale, { size: 11, anchor: 'middle' }); st.fade(sc.el, 0.24, 0.36);
  // a faint common start through both rows
  const startLine = line(svg, X0, bar1 - 2, X0, axY, { stroke: C.hairline, 'stroke-width': 1, 'stroke-dasharray': '2 3', 'data-audit': 'skip' });
  st.fade(startLine, 0.16, 0.3);
  if (axY + 22 > H) svg.dataset.contentH = String(Math.ceil(axY + 22));

  return { set(step, t) { st.set(step, clamp(t)); }, destroy() {} };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
