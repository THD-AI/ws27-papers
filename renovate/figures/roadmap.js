// roadmap: the order of the work as a staircase. Every step has the same
// width and sits one place to the right of the step before it, so position
// means order and nothing else ("one step after another; widths mean
// nothing", said once beside the axis). Each row has a plain label, the
// Telekom meaning (muted) and its measure (mono).
//   step 0: measure first; the works agreement (one step for the framework,
//           then a thin line on to the right edge); choose suppliers; train
//           staff; the band "staff stay throughout"; the axis with
//           Telekom's 2030 target at its end; the headline.
//   step 1: one customer record; permissions in stages, its three sub-steps
//           each behind a gate "test set passes"; the dependency arrows
//           (works agreement, trained staff and customer record into the
//           first gate).
//   step 2: acceptance; run it, open to the right, and the return arrow from
//           its end back to measuring; the works agreement's annexes, one
//           diamond at each permission sub-step.
// The last step at t = 1 holds everything and reads alone in print.
// Wide draws the dependencies as arrows into the first gate; tall stacks
// each row's text above its step, where long arrows would cross the text, so
// it names the rows the first gate needs ("needs 2, 4, 5") instead.
import {
  mountFigure, svgRoot, colors, g, path, rect, text, stage, clamp, pen,
} from '../fig.js';

export const steps = 3;
const SIZE = { wide: [928, 733], tall: [360, 1213] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  let seed = 23;

  // wide: label column on the left, the staircase beside it, each row's step
  // level with its label; tall: the text above each row's step, the
  // staircase full width. Both keep a gutter on the right for the return
  // arrow.
  const L = tall
    ? { num: 16, lx: 36, lw: 290, cx0: 16, cx1: 318, back: 338, head: 18, top: 92, sub: 21 }
    : { num: 16, lx: 40, lw: 396, cx0: 446, cx1: 876, back: 898, head: 21, top: 66, sub: 21 };
  // equal steps: N places, the last one ending at the right edge
  const N = d.positions, RATIO = 0.74;
  const S = (L.cx1 - L.cx0) / (N - 1 + RATIO), SW = S * RATIO;
  const X = (k) => L.cx0 + k * S;                 // left end of the step at place k
  const BH = 14;
  const ink = (parent, pts, w = 1.35, stroke = C.ink, amp = 0.5) => path(parent, pen(pts, seed++, amp), {
    stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  const twice = (parent, pts, a, b) => {           // a main stroke and a thin one beside it
    const m = ink(parent, pts, 1.35); st.draw(m, a, b);
    const t = ink(parent, pts, 0.55, C.ink, 0.85); t.setAttribute('opacity', 0.7); st.draw(t, a, b);
  };
  const box = (x0, x1, y, h = BH) => [[x0, y - h / 2], [x1, y - h / 2], [x1, y + h / 2], [x0, y + h / 2], [x0, y - h / 2 - 0.01]];
  const open = (x0, x1, y, h = BH) => [[x1, y - h / 2], [x0, y - h / 2], [x0, y + h / 2], [x1, y + h / 2]];
  // an annex: an open accent diamond on the works agreement's line
  const diamond = (parent, x, y, r = 5) => path(parent, `M${x.toFixed(1)} ${y - r}L${(x + r).toFixed(1)} ${y}L${x.toFixed(1)} ${y + r}L${(x - r).toFixed(1)} ${y}Z`, {
    stroke: C.accent, 'stroke-width': 1.6, 'stroke-linejoin': 'round', fill: C.paper,
  });
  // a gate: a closed accent square before a sub-step
  const gate = (parent, x, y, s = 8) => rect(parent, x - s / 2, y - s / 2, s, s, { fill: C.accent, 'data-audit': 'skip' });
  // an arrowhead at (x, y) pointing along (dx, dy)
  const head = (parent, x, y, dx, dy, s = 5.5) => {
    const n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
    return path(parent, `M${(x - ux * s - uy * s * 0.6).toFixed(1)} ${(y - uy * s + ux * s * 0.6).toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}L${(x - ux * s + uy * s * 0.6).toFixed(1)} ${(y - uy * s - ux * s * 0.6).toFixed(1)}`, {
      stroke: C.ink, 'stroke-width': 1.1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    });
  };
  const thin = (parent, dd, w = 1) => path(parent, dd, { stroke: C.ink, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

  // when each row arrives: [start of its label, start of its step, end]
  const when = [[0.06, 0.12, 0.28], [0.2, 0.26, 0.42], [0.38, 0.44, 0.58], [0.52, 0.58, 0.72],
    [1.02, 1.08, 1.26], [1.3, 1.4, 1.9], [2.02, 2.08, 2.24], [2.18, 2.24, 2.4]];

  // --- the headline: says the point from the first state on
  const hl = text(svg, 16, L.head + 6, d.headline, { family: 'serif', size: L.head, weight: 500, fill: C.ink, width: W - 32, lh: L.head + 4 });
  st.fade(hl.el, 0, 0.1);

  // --- the rows
  let y = tall ? Math.round(hl.bottom + 26) : L.top;
  const lab = (parent, k, row, a) => {
    if (k >= 0) { const num = text(parent, L.num, y + 15, String(k + 1), { family: 'mono', size: 12, weight: 500, fill: C.muted }); st.fade(num.el, a, a + 0.08); }
    const t1 = text(parent, L.lx, y + 15, row.label, { family: 'sans', size: 14, weight: 500, fill: C.ink, width: L.lw });
    const t2 = text(parent, L.lx, y + 31, row.company, { family: 'sans', size: 12, fill: C.muted, width: L.lw, lh: 15 });
    st.fade(t1.el, a, a + 0.12); st.fade(t2.el, a + 0.06, a + 0.18);
    let bottom = t2.bottom;
    if (row.measure) {
      const t3 = text(parent, L.lx, t2.bottom + 13.5, `measure: ${row.measure}`, { family: 'mono', size: 12, fill: C.ink, width: L.lw, lh: 15 });
      st.fade(t3.el, a + 0.1, a + 0.22);
      bottom = t3.bottom;
    }
    return bottom;
  };
  const sep = (yy) => path(svg, `M16 ${yy.toFixed(1)}L${W - 16} ${yy.toFixed(1)}`, { stroke: C.hairline, 'stroke-width': 1, 'data-audit': 'skip' });
  const at = [];                                   // per row: { by, x0, x1 } of its step
  const gx = [];                                   // x of each gate
  let agree = null;                                // the works agreement's thin line
  let gateLine = null;                             // permissions: where the gate label sits
  d.rows.forEach((row, k) => {
    const [a, b, c] = when[k];
    const R = g(svg);
    if (k > 0) st.fade(sep(y - 9), a, a + 0.06);
    const mb = lab(R, k, row, a);
    let by = tall ? mb + 17 : y + 10;
    let low;
    if (row.segments) {
      // the sub-steps: each one place further right and one line lower,
      // each behind a gate
      gateLine = by + (tall ? 0 : 5);
      by = gateLine + 18;
      const n = row.segments.length, sl = (c - b) / n;
      row.segments.forEach((s, i) => {
        const sy = by + i * L.sub, sa = b + i * sl;
        const x0 = X(s.at), x1 = x0 + SW, gxi = x0 - (S - SW) / 2;
        gx.push(gxi);
        st.fade(gate(R, gxi, sy), sa, sa + sl * 0.3);
        twice(R, box(x0, x1, sy), sa + sl * 0.15, sa + sl * 0.85);
        const t = text(R, gxi - 9, sy + 4, s.label, { family: 'mono', size: 12, fill: C.ink, anchor: 'end' });
        st.fade(t.el, sa + sl * 0.2, sa + sl * 0.7);
      });
      at.push({ by, x0: X(row.segments[0].at), x1: X(row.segments[n - 1].at) + SW });
      low = by + (n - 1) * L.sub + BH / 2;
    } else {
      const x0 = X(row.at), x1 = x0 + SW;
      if (row.open) twice(R, open(x0, x1, by), b, c);   // the open end: it keeps going
      else twice(R, box(x0, x1, by), b, c);
      at.push({ by, x0, x1 });
      if (row.alongside) {
        // the agreement goes on beside the rest, to the right edge
        agree = { by, x0: x1 };
        const p = ink(R, [[x1, by], [L.cx1, by]], 1, C.ink, 0.35);
        st.draw(p, c - 0.04, c + 0.24);
      }
      low = by + BH / 2;
    }
    if (!tall) low = Math.max(low, mb);
    else if (k === 0) low += 16;                   // room for "back to measuring" under the line
    y = low + (tall ? 26 : 19);
  });

  // --- the gate label, once, beside the first gate
  const rowP = d.rows.find((r) => r.gate);
  const iP = d.rows.indexOf(rowP);
  const gl = text(svg, gx[0] + 9, gateLine + 4, rowP.gate.label, { family: 'mono', size: 12, weight: 500, fill: C.accent });
  st.fade(gl.el, 1.42, 1.56);

  // --- what the first permission needs
  const dep = g(svg);
  const pP = at[iP], topP = pP.by - BH / 2 - 3;
  const T = gx[0];
  if (!tall) {
    // a trunk from the works agreement's line down into the first gate; the
    // trained staff and the customer record join it from the left
    const y0 = agree.by + 6;
    const trunk = ink(dep, [[T, y0], [T, topP]], 1, C.ink, 0.3);
    st.draw(trunk, 1.3, 1.48);
    st.fade(head(dep, T, topP, 0, 1), 1.46, 1.5);
    const Rr = 8;
    d.depends.from.filter((k) => k !== d.rows.findIndex((r) => r.alongside)).forEach((k, i) => {
      const r = at[k], sx = r.x1 + 4, yy = r.by;
      // a step that ends right beside the trunk joins it with a straight stub
      const dd = T - sx < 2 * Rr
        ? `M${(r.x1 + 1.5).toFixed(1)} ${yy}L${T} ${yy}`
        : `M${sx.toFixed(1)} ${yy}L${(T - Rr).toFixed(1)} ${yy}Q${T} ${yy} ${T} ${yy + Rr}`;
      st.draw(thin(dep, dd), 1.34 + i * 0.04, 1.46);
    });
  } else {
    // tall: the rows it needs, named, with one short arrow into the gate
    const nd = text(dep, T - 30, gateLine + 4, rowP.gate.needs, { family: 'mono', size: 12, fill: C.ink, anchor: 'end' });
    st.fade(nd.el, 1.36, 1.48);
    const sx = T - 25, sy = gateLine;
    const dd = `M${sx.toFixed(1)} ${sy}Q${T} ${sy} ${T} ${topP}`;
    st.draw(thin(dep, dd), 1.38, 1.48);
    st.fade(head(dep, T, topP, 0, 1), 1.46, 1.5);
  }

  // --- a new annex to the works agreement at each permission sub-step
  gx.forEach((x, i) => {
    const dm = diamond(svg, x, agree.by);
    const a = 2.44 + i * 0.1;
    st.fade(dm, a, a + 0.1);
  });

  // --- from running back to measuring
  const iRun = d.rows.findIndex((r) => r.back);
  const rR = at[iRun], r1 = at[0], Rb = 12;
  const backX = L.back, endX = r1.x1 + 7;
  const bd = `M${(rR.x1 + 2).toFixed(1)} ${rR.by}L${(backX - Rb).toFixed(1)} ${rR.by}Q${backX} ${rR.by} ${backX} ${rR.by - Rb}`
    + `L${backX} ${r1.by + Rb}Q${backX} ${r1.by} ${(backX - Rb).toFixed(1)} ${r1.by}L${endX.toFixed(1)} ${r1.by}`;
  const back = thin(svg, bd);
  st.draw(back, 2.36, 2.66);
  st.fade(head(svg, endX, r1.by, -1, 0), 2.64, 2.68);
  const bl = text(svg, L.cx1 - 6, r1.by + (tall ? 17 : -6), d.rows[iRun].back, { family: 'mono', size: 12, fill: C.ink, anchor: 'end' });
  st.fade(bl.el, 2.5, 2.66);

  // --- the staff: a quiet band under every row, the whole time
  const hm = d.home;
  st.fade(sep(y - 9), 0.74, 0.8);
  const HB = g(svg);
  const hb = lab(HB, -1, hm, 0.76);                       // the band has no number
  const bandY = tall ? hb + 17 : y + 10;
  const band = rect(HB, X(0), bandY - 8, L.cx1 - X(0), 16, { fill: C.field, 'data-audit': 'skip' });
  st.fade(band, 0.78, 0.96);

  // --- the axis: one place per step, ending at Telekom's own target year
  const axY = tall ? bandY + 26 : Math.max(bandY + 8, hb) + 20;
  const ax = g(svg);
  twice(ax, [[X(0), axY], [L.cx1, axY]], 0.0, 0.14);
  twice(ax, [[L.cx1 - 7, axY - 4], [L.cx1, axY], [L.cx1 - 7, axY + 4]], 0.12, 0.16);
  twice(ax, [[X(0), axY - 5], [X(0), axY + 5]], 0.0, 0.06);
  const s0 = text(svg, X(0), axY + 18, d.axis.start, { family: 'mono', size: 12, fill: C.muted });
  const s1 = text(svg, L.cx1, axY + 18, d.axis.target, { family: 'mono', size: 12, fill: C.ink, anchor: 'end' });
  st.fade(s0.el, 0.04, 0.14); st.fade(s1.el, 0.08, 0.18);
  // what position means, said once
  const nt = tall
    ? text(svg, X(0), axY + 36, d.axis.note, { family: 'mono', size: 12, fill: C.muted, width: W - X(0) - 8, lh: 15 })
    : text(svg, L.lx, axY + 4, d.axis.note, { family: 'mono', size: 12, fill: C.muted, width: L.lw });
  st.fade(nt.el, 0.1, 0.2);

  const used = Math.round(Math.max(axY + 26, nt.bottom + 8));
  if (Math.abs(used - H) > 1) svg.dataset.contentH = String(used);
  svg.dataset.h = String(H);
  return { set(step, t) { st.set(step, clamp(t)); }, destroy() {} };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
