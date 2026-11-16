// roadmap: the renovation as six everyday actions, in order, each with one
// pen drawing. One action arrives per step:
//   0 measure first (a tape measure)      1 fix the foundations (a footing)
//   2 parts you can swap (two plugs and a two-way arrow)
//   3 keys one at a time (three keys, numbered)
//   4 train the crew (an open toolbox, a hand passing a wrench)
//   5 finish the rooms with people at home (a window, a lamp, someone inside)
// The inspection is not a step of its own: a thin green line runs under
// steps 2 to 6, one piece arriving with each of them, labelled "inspected at
// every step". The company meaning of each action is in the article text,
// not drawn. The last step at t = 1 shows everything and reads alone in print.
import {
  mountFigure, svgRoot, colors, g, path, circle, text, stage, rng, spline, lerp,
} from '../../../lib/fig.js';

export const steps = 6;
export const aspect = { wide: 900 / 193, tall: 360 / 456 };

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
const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0 - 0.01]];

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const W = tall ? 360 : 900;
  const svg = svgRoot(el, W, tall ? 470 : 230, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  let seed = 5;

  // --- one icon, drawn in its own units (about 64 by 56, centred on 0, 0)
  function icon(parent, kind, cx, cy, s, a, b) {
    const grp = g(parent);
    const P = (pts) => pts.map(([x, y]) => [cx + x * s, cy + y * s]);
    const ln = (pts, w = 1.35, stroke = C.ink) => {
      const m = path(grp, pen(P(pts), seed++, 0.55), { stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      st.draw(m, a, b);
      if (w >= 1.3 && w < 2) {
        const t = path(grp, pen(P(pts), seed++, 0.9), { stroke, 'stroke-width': 0.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.65 });
        st.draw(t, a, b);
      }
      return m;
    };
    const ring = (x, y, r, w = 1.25, fill = 'none') => {
      const c = circle(grp, cx + x * s, cy + y * s, r * s, { fill, stroke: C.ink, 'stroke-width': w });
      st.fade(c, a, a + (b - a) * 0.5);
      return c;
    };
    const late = (el2) => st.fade(el2, a + (b - a) * 0.6, b);
    if (kind === 'tape') {
      // the case with its winding, the tape pulled out with marks, the hook
      ln(box(-30, -14, -4, 12));
      ring(-17, -1, 7.5);
      ln([[-4, 4], [30, 4], [30, 11], [-4, 11]]);
      ln([[30, 2], [30, 13]], 1.6);
      for (let x = 0; x < 30; x += 4) late(ln([[x, 4], [x, (x % 8 === 0) ? 8.5 : 6.5]], 0.9));
    } else if (kind === 'footing') {
      // a wall standing on a wide footing below the ground line
      ln([[-31, 0], [-9, 0]]); ln([[9, 0], [31, 0]]);
      for (const x of [-28, -21, -14, 14, 21, 28]) late(ln([[x, 0], [x - 4, 5]], 0.8));
      ln(box(-8, -24, 8, 10));
      ln(box(-22, 10, 22, 21), 1.8);
    } else if (kind === 'plugs') {
      // two plugs side by side, either one goes in: a two-way arrow under them
      for (const x of [-15, 15]) {
        ln([[x, -26], [x, -16]], 1.1);
        ln(box(x - 8, -16, x + 8, -1));
        ln([[x - 4, -1], [x - 4, 6]], 1.4); ln([[x + 4, -1], [x + 4, 6]], 1.4);
      }
      ln([[-20, 17], [20, 17]], 1.2);
      ln([[-15, 13], [-20, 17], [-15, 21]], 1.2); ln([[15, 13], [20, 17], [15, 21]], 1.2);
    } else if (kind === 'keys') {
      // three keys on a hook rail, numbered in the order they are handed over
      ln([[-26, -24], [26, -24]], 1.35);
      [-16, 0, 16].forEach((x, i) => {
        ln([[x, -24], [x, -20]], 0.9);
        ring(x, -15.5, 4.3);
        ln([[x, -11.2], [x, 8]], 1.3);
        ln([[x, 3], [x + 4.5, 3]], 1.1); ln([[x, 7], [x + 4.5, 7]], 1.1);
        const t = text(grp, cx + x * s, cy + 24 * s, String(i + 1), { family: 'mono', size: 13, weight: 500, fill: C.ink, anchor: 'middle' });
        late(t.el);
      });
    } else if (kind === 'toolbox') {
      // an open toolbox; a hand from the right passes a wrench in
      ln(box(-30, 4, 6, 22));
      ln([[-30, 4], [-35, -6], [1, -6], [6, 4]], 1.2);
      // the wrench: a shaft and an open jaw
      ln([[-12, -15], [16, -15]], 2.2);
      ln([[-11, -12], [-15, -11], [-18, -15], [-15, -19], [-11, -18]], 1.3);
      // the hand: a fist round the shaft, finger creases, thumb, sleeve
      ln([[30, -21], [19, -21], [15, -18], [15, -12], [18, -9], [30, -9]], 1.3);
      for (const x of [19.5, 23, 26.5]) ln([[x, -12.5], [x, -9]], 0.9);
      ln([[29, -21], [23, -24], [17, -22.5]], 1.1);
      ln(box(30, -23, 38, -7), 1.2);
    } else if (kind === 'window') {
      // a window at night: the frame, the sill, a lamp, someone at home
      ln(box(-20, -22, 20, 16));
      ln([[-25, 16], [25, 16], [25, 20], [-25, 20]], 1.2);
      ln([[-11, -22], [-11, -15]], 0.9);
      ln([[-15, -10], [-11, -15], [-7, -10], [-15, -10]], 1.1);
      for (const [x1, y1, x2, y2] of [[-15, -7, -17, -4], [-11, -7, -11, -3], [-7, -7, -5, -4]]) late(ln([[x1, y1], [x2, y2]], 0.8));
      ring(5, -4, 4.6);
      ln([[-5, 16], [-5, 8], [-1, 3], [11, 3], [15, 8], [15, 16]], 1.3);
    }
    return grp;
  }

  // --- the headline
  const hs = tall ? 17 : 20;
  const hl = text(svg, 16, hs + 2, d.headline, { family: 'serif', size: hs, weight: 500, fill: C.ink, width: W - 32, lh: hs + 4 });
  st.fade(hl.el, 0, 0.06);

  const A = d.actions, n = A.length, I = d.inspection, from = I.from;
  const LS = 14;
  const lineAttrs = { stroke: C.accent, 'stroke-width': 1.6, 'stroke-linecap': 'round' };
  // the inspection line grows one piece with each step from the second one,
  // starting once that step's drawing is complete
  const grow = (segEl, k) => st.draw(segEl, k + 0.5, k + 0.85);
  let H;

  if (!tall) {
    // six columns, left to right; the inspection line runs under 2 to 6
    const cw = (W - 32) / n, top = hl.bottom + 18;
    const iconY = top + 36, labY = iconY + 46;
    let labBottom = 0;
    const cxs = A.map((_, k) => 16 + cw * (k + 0.5));
    A.forEach((act, k) => {
      const row = g(svg);
      icon(row, act.icon, cxs[k], iconY, 1, k + 0.06, k + 0.5);
      const lab = text(row, cxs[k], labY, act.wide || act.label, { family: 'sans', size: LS, weight: 500, fill: C.ink, anchor: 'middle', width: cw - 8, lh: LS + 4 });
      st.fade(lab.el, k + 0.3, k + 0.52);
      labBottom = Math.max(labBottom, lab.bottom);
    });
    const ly = labBottom + 14;
    const along = g(svg);
    for (let k = from; k < n; k++) {
      const xa = k === from ? cxs[k] - cw / 2 + 12 : cxs[k] - cw / 2, xb = k === n - 1 ? cxs[k] + cw / 2 - 12 : cxs[k] + cw / 2;
      grow(path(along, pen([[xa, ly], [xb, ly]], 91 + k, 0.35), lineAttrs), k);
      st.fade(path(along, `M${cxs[k].toFixed(1)} ${ly - 5}L${cxs[k].toFixed(1)} ${ly}`, { ...lineAttrs, 'stroke-width': 1.2 }), k + 0.7, k + 0.85);
    }
    const note = text(along, cxs[from] - cw / 2 + 12, ly + 19, I.label, { family: 'sans', size: 13, fill: C.muted });
    st.fade(note.el, from + 0.7, from + 0.9);
    H = Math.ceil(note.bottom + 8);
  } else {
    // one column: number, drawing, the inspection line, the words
    const top = hl.bottom + 16, pitch = 62, ix = 64, lineX = 106, tx = 118;
    const mids = [];
    A.forEach((act, k) => {
      const mid = top + k * pitch + pitch / 2;
      mids.push(mid);
      const row = g(svg);
      const num = text(row, 16, mid + 4.5, String(k + 1), { family: 'mono', size: 13, weight: 500, fill: C.muted });
      st.fade(num.el, k + 0.02, k + 0.12);
      icon(row, act.icon, ix, mid - (act.icon === 'keys' ? 3 : 0), 0.82, k + 0.06, k + 0.5);
      const words = act.tall || act.label;
      const probe = text(g(null), 0, 0, words, { family: 'sans', size: LS, weight: 500, width: W - 16 - tx, lh: LS + 4 });
      const lab = text(row, tx, mid - ((probe.lines - 1) * (LS + 4)) / 2 + LS * 0.36, words, { family: 'sans', size: LS, weight: 500, fill: C.ink, width: W - 16 - tx, lh: LS + 4 });
      st.fade(lab.el, k + 0.3, k + 0.52);
    });
    const along = g(svg);
    for (let k = from; k < n; k++) {
      const ya = k === from ? mids[k] - pitch / 2 + 8 : mids[k] - pitch / 2, yb = k === n - 1 ? mids[k] + pitch / 2 - 8 : mids[k] + pitch / 2;
      grow(path(along, pen([[lineX, ya], [lineX, yb]], 91 + k, 0.35), lineAttrs), k);
      st.fade(path(along, `M${lineX - 5} ${mids[k].toFixed(1)}L${lineX} ${mids[k].toFixed(1)}`, { ...lineAttrs, 'stroke-width': 1.2 }), k + 0.7, k + 0.85);
    }
    const note = text(along, lineX - 4, mids[n - 1] + pitch / 2 + 12, I.label, { family: 'sans', size: 13, fill: C.muted });
    st.fade(note.el, from + 0.7, from + 0.9);
    H = Math.ceil(note.bottom + 8);
  }

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.dataset.h = String(H);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
