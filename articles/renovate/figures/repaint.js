// repaint: two companies took the saving from their staff before the
// software had shown it could carry the work, and took it back later. Two
// timelines on one shared month axis.
//   step 0: the axis, the two tracks and the cuts (ink markers, italic
//           notes above the track).
//   step 1: the reversals in the accent: a bracket from the cut to the
//           reversal, its length ("15 months", "weeks"), the reversal
//           marker and its note under the bracket.
// Every date, word and number comes from data/repaint.json.
import {
  mountFigure, svgRoot, colors, g, path, circle, text, textSize, stage, clamp, pen,
} from '../../../lib/fig.js';

export const steps = 2;
// where scenes read as a sequence (tablet portrait, phone landscape): one still, the final state
export const stills = [1];
// seconds each step plays once triggered: the axis, both cases and their
// cuts; then the way back, case by case
export const durations = { large: [2.4, 2.2] };
// wide: drawn narrower than its column (480 units in a 520 to 570 px frame),
// so that its smallest lettering renders at 13 px or more on desktops
const SIZE = { wide: [480, 420], tall: [360, 400] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

const monthIndex = (s) => { const [y, m] = String(s).split('-').map(Number); return y * 12 + (m - 1); };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  const X0 = 16, X1 = W - 16;
  const m0 = monthIndex(d.axis.from), m1 = monthIndex(d.axis.to);
  const nM = m1 - m0 + 1;
  const mw = (X1 - X0) / nM;
  const X = (month) => X0 + (monthIndex(month) - m0 + 0.5) * mw;   // middle of the month
  const XB = (k) => X0 + k * mw;                                     // boundary before month k
  const S = tall ? { head: 14, note: 13, mono: 11.5 } : { head: 15.5, note: 14, mono: 12 };
  let seed = 31;
  const ink = (parent, pts, w = 1.35, stroke = C.ink, amp = 0.5) => path(parent, pen(pts, seed++, amp), {
    stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  const twice = (parent, pts, a, b, stroke = C.ink, w = 1.35) => {
    const m = ink(parent, pts, w, stroke); st.draw(m, a, b);
    const t = ink(parent, pts, 0.55, stroke, 0.9); t.setAttribute('opacity', 0.7); st.draw(t, a, b);
  };
  const mono = (parent, x, y, s, o = {}) => text(parent, x, y, s, { family: 'mono', size: S.mono, fill: C.muted, ...o });
  const vleader = (parent, x, y1, y2, stroke) => {
    const grp = g(parent, { class: 'fig-leader' });
    path(grp, `M${x.toFixed(1)} ${y1.toFixed(1)}L${x.toFixed(1)} ${y2.toFixed(1)}`, { stroke, 'stroke-width': 0.8, 'stroke-linecap': 'round' });
    return grp;
  };
  // a note beside its marker: to the right if there is room, else ending at it
  const note = (parent, mx, y, e, fill) => {
    const str = `[[${e.date}]] ${e.text}`;
    const o = { italic: true, size: S.note, fill, lh: S.note * 1.22 };
    const avail = X1 - mx + 2;
    const one = textSize(str, o).w;
    const right = avail >= Math.min(one, 200);
    let width = right ? Math.min(avail, 310) : Math.min(mx - X0 + 2, 310);
    if (one > width) width = Math.min(width, Math.ceil(one / 2) + 30);   // two lines of about equal length
    return text(parent, right ? mx - 2 : mx + 2, y, str, { ...o, width, anchor: right ? 'start' : 'end' });
  };

  // --- headline and the small line under it
  const head = text(svg, X0, 22, d.headline, { family: 'sans', size: S.head, weight: 600, width: X1 - X0 });
  st.fade(head.el, 0, 0.12);
  const sub = mono(svg, X0, head.bottom + 15, d.sub);
  st.fade(sub.el, 0.06, 0.18);
  let y = sub.bottom + 30;

  // --- one row per case
  d.cases.forEach((c, i) => {
    const o = i * 0.2;                  // the second row follows the first a little later
    const ob = i * 0.42;
    const R = g(svg);
    const kick = mono(R, X0, y, c.label, { caps: true, spacing: 0.6, fill: C.ink, weight: 500, width: X1 - X0 });
    st.fade(kick.el, 0.14 + o, 0.26 + o);
    const xc = X(c.cut.month), xb = X(c.back.month);

    // the cut, above the track
    const cut = note(R, xc, kick.bottom + 12 + S.note * 0.78, c.cut, C.ink);
    st.fade(cut.el, 0.5 + o, 0.66 + o);
    const lineY = cut.bottom + 22;
    const l1 = vleader(R, xc, cut.bottom + 4, lineY - 6, C.ink);
    st.fade(l1, 0.46 + o, 0.56 + o);

    // the track
    const track = path(R, pen([[X0, lineY], [X1, lineY]], seed++, 0.4), { stroke: C.muted, 'stroke-width': 0.9, 'stroke-linecap': 'round' });
    st.draw(track, 0.2 + o, 0.44 + o);
    const mc = circle(R, xc, lineY, 3.6, { fill: C.ink });
    st.fade(mc, 0.4 + o, 0.5 + o);

    // the way back: bracket under the track, its length, the marker, the note
    const brY = lineY + 11;
    twice(R, [[xc, lineY + 5], [xc, brY], [xb, brY], [xb, lineY + 5]], 1.02 + ob, 1.3 + ob, C.accent, 1.5);
    const lw = textSize(c.gap.label, { family: 'mono', size: S.mono, weight: 500 }).w;
    const fits = xb - xc >= lw + 12;
    const gl = fits
      ? mono(R, (xc + xb) / 2, brY + 15, c.gap.label, { anchor: 'middle', fill: C.accent, weight: 500 })
      : mono(R, xc - 7, brY + 4, c.gap.label, { anchor: 'end', fill: C.accent, weight: 500 });
    st.fade(gl.el, 1.24 + ob, 1.4 + ob);
    const mb = g(R);
    circle(mb, xb, lineY, 5.4, { fill: C.paper, stroke: C.accent, 'stroke-width': 1.5 });
    circle(mb, xb, lineY, 2.4, { fill: C.accent });
    st.fade(mb, 1.26 + ob, 1.4 + ob);
    const backTop = Math.max(brY + 10, gl.bottom + 9);
    const back = note(R, xb, backTop + S.note * 0.78, c.back, C.accent);
    st.fade(back.el, 1.34 + ob, 1.54 + ob);
    const l2 = vleader(R, xb, brY + 2, back.y - 4, C.accent);
    st.fade(l2, 1.3 + ob, 1.44 + ob);

    y = back.bottom + 34;
  });

  // --- the shared month axis
  const axY = y - 8;
  const axis = g(svg);
  twice(axis, [[X0, axY], [X1, axY]], 0.06, 0.32);
  let ticks = '';
  for (let k = 0; k <= nM; k++) {
    const yearStart = (m0 + k) % 12 === 0 || k === 0 || k === nM;
    ticks += `M${XB(k).toFixed(1)} ${axY}V${(axY + (yearStart ? 7 : 3.5)).toFixed(1)}`;
  }
  const tk = path(axis, ticks, { stroke: C.ink, 'stroke-width': 0.9, 'data-audit': 'skip' });
  st.fade(tk, 0.2, 0.34);
  for (let yr = Math.floor(m0 / 12); yr <= Math.floor(m1 / 12); yr++) {
    const a = Math.max(yr * 12, m0) - m0, b = Math.min(yr * 12 + 11, m1) - m0 + 1;
    const yl = mono(svg, (XB(a) + XB(b)) / 2, axY + 18, String(yr), { anchor: 'middle' });
    st.fade(yl.el, 0.24, 0.38);
  }
  const bottom = axY + 22;
  if (bottom > H + 0.5) svg.dataset.contentH = Math.ceil(bottom);

  return { set(step, t) { st.set(step, clamp(t)); }, destroy() {} };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
