// rewire: section 3, "Timber and brick". One company rewired, the other
// not yet. Plain units and type, as in attitudes and exits; one pen line,
// as in walls.
//   step 0, United States · T-Mobile US: the rebuilt base (a pen line,
//           "one system holding what the company knows about each
//           customer"), and on it the share of chat conversations that never
//           reached a person: two separate strips of 50 dots (one dot is 2%),
//           mid-2024 about a quarter, mid-2026 78%, ringed. The two are never
//           joined by a line: nothing between them is published.
//   step 1, Germany and Europe · Deutsche Telekom: 14 ways customers prove
//           who they are (14 units in ink) and the planned 3 (a target,
//           drawn hollow and dashed), under the slide's principle "Simplify
//           before automating". T-Mobile's panel steps back to muted (screen
//           only; print keeps both in ink).
// Prints one column wide (the 'tall' layout); the final state shows both.
// Every number and word comes from data/rewire.json.
import {
  mountFigure, svgRoot, colors, g, path, circle, text, textSize, cells, dots, plate, penRing, stage, pen,
  ease, span, fmt, units,
} from '../fig.js';

export const steps = 2;
// where scenes read as a sequence: one still, the final state
export const stills = [1];
// seconds each step plays once triggered: T-Mobile's base and its two
// strips; Telekom's 14, the target 3 and the principle
export const durations = { large: [2.4, 2.2] };
const SIZE = { wide: [560, 420], tall: [360, 350] };   // tall: 380 px at 390 wide, 45% of 844
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

// '#rrggbb' or 'rgb(r, g, b)' -> [r, g, b]
function rgbOf(c) {
  const s = String(c).trim();
  if (s[0] === '#') {
    const x = s.length === 4 ? s.slice(1).split('').map((ch) => ch + ch).join('') : s.slice(1, 7);
    return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
  }
  const m = s.match(/[\d.]+/g);
  return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}
function mixer(a, b) {
  const A = rgbOf(a), B = rgbOf(b);
  return (p) => (p <= 0 ? a : p >= 1 ? b : `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(',')})`);
}

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  const S = tall
    ? { x0: 14, head: 13, kick: 11.5, meas: 12.5, note: 12, mono: 12, big: 15, gap: 14 }
    : { x0: 16, head: 15, kick: 12, meas: 14.5, note: 13.5, mono: 13, big: 17, gap: 20 };
  const X1 = W - S.x0, span0 = X1 - S.x0;
  const U = d.us, D = d.de;

  // --- the headline
  const hg = g(svg, { 'data-role': 'title' });
  const hd = text(hg, S.x0, tall ? 15 : 20, d.headline, { family: 'sans', size: S.head, weight: 600, width: span0 });
  st.fade(hg, 0, 0.1);
  let y = hd.bottom + (tall ? 18 : 24);

  // ===== United States · T-Mobile US ======================================
  const A = g(svg);
  const kA = text(A, S.x0, y, U.kicker, { family: 'mono', size: S.kick, caps: true, spacing: 0.4, fill: C.muted });
  const tag = text(A, X1, y, d.tag, { family: 'mono', size: S.kick, fill: C.muted, anchor: 'end' });
  st.fade(kA.el, 0.04, 0.16).fade(tag.el, 0.1, 0.2);
  const mA = text(A, S.x0, kA.bottom + S.meas + 4, U.measure, { family: 'sans', size: S.meas, weight: 500, width: span0 });
  st.fade(mA.el, 0.12, 0.24);
  const un = text(A, S.x0, mA.bottom + S.note + 2, U.unitNote, { italic: true, size: S.note, fill: C.muted });
  st.fade(un.el, 0.36, 0.46);
  y = un.bottom + (tall ? 12 : 22);

  // two strips of 50, each over its own line of words: when, and the value
  // 50 dots in two rows of 25, so each dot is large enough to count
  const n = Math.round(100 / U.unit), per = n / 2;
  const pitch = Math.min(span0 / per, tall ? 13.2 : 15), r = pitch * 0.34;
  const list = cells(n, per, { gx: pitch, gy: pitch });
  let ring = null;
  const rows = U.points.map((p, i) => {
    const R = g(A);
    const last = i === U.points.length - 1;
    const wt = text(R, S.x0, y, p.when, { family: 'mono', size: S.mono, fill: C.muted });
    const vo = last
      ? { family: 'mono', size: S.big, weight: 600 }
      : { italic: true, size: S.note + 0.5 };
    const vt = text(R, wt.right + (last ? 18 : 12), y, p.show, vo);
    const sy = y + (tall ? 11 : 14);
    plate(R, list, Math.max(1.1, r * 0.4), C.hairline, S.x0, sy - pitch / 2);
    const fg = g(R, { fill: last ? C.accent : C.ink });
    const ds = dots(fg, list, units(p.value, U.unit), r, {}, S.x0, sy - pitch / 2);
    // in reading order: the date, the strip filling, then its value
    const a = last ? 0.62 : 0.46;
    st.fade(wt.el, a, a + 0.06).fill(ds, a + 0.03, a + (last ? 0.2 : 0.1)).fade(vt.el, a + (last ? 0.16 : 0.08), a + (last ? 0.24 : 0.16));
    if (last) ring = { x: vt.cx, y: vt.cy, w: vt.w };
    y = sy - pitch / 2 + list.height + (tall ? 14 : 24);
    return R;
  });
  // the one number that matters: a loose ring around 78%
  const rg = penRing(A, ring.x, ring.y - 0.5, ring.w / 2 + 7, S.big * 0.5 + 4, { seed: 23, stroke: C.accent, width: tall ? 1.5 : 1.7 });
  rg.paths.forEach((pp, k) => st.draw(pp, 0.84 + k * 0.04, 0.95 + k * 0.03));

  // the rebuilt base under both strips: drawn first, its words with it
  const baseY = y - (tall ? 8 : 11);
  const bl = path(A, pen([[S.x0 - 4, baseY], [X1 + 4, baseY]], 17, 0.5), { stroke: C.ink, 'stroke-width': 1.5, 'stroke-linecap': 'round' });
  const bl2 = path(A, pen([[S.x0 - 4, baseY + 0.6], [X1 + 4, baseY + 0.6]], 18, 0.9), { stroke: C.ink, 'stroke-width': 0.55, 'stroke-linecap': 'round', opacity: 0.7 });
  st.draw(bl, 0.18, 0.36).draw(bl2, 0.18, 0.36);
  const bt = text(A, S.x0, baseY + S.note + 6, U.base.label, { italic: true, size: S.note, width: span0 });
  st.fade(bt.el, 0.28, 0.42);
  y = bt.bottom + (tall ? 10 : 20);

  // ===== Germany and Europe · Deutsche Telekom ============================
  const B = g(svg);
  const sep = path(B, `M${S.x0} ${y}L${X1} ${y}`, { stroke: C.hairline, 'stroke-width': 1, 'data-audit': 'skip' });
  st.fade(sep, 1.02, 1.1);
  y += tall ? 15 : 24;
  const kB = text(B, S.x0, y, D.kicker, { family: 'mono', size: S.kick, caps: true, spacing: 0.4, fill: C.muted, width: span0 });
  st.fade(kB.el, 1.04, 1.14);
  const mB = text(B, S.x0, kB.bottom + S.meas + 4, D.measure, { family: 'sans', size: S.meas, weight: 500, width: span0 });
  st.fade(mB.el, 1.1, 1.22);
  // the principle stands over the list, as on the slide; it is said last
  const qo = { italic: true, size: S.meas + (tall ? 1 : 1.5), weight: 600 };
  const q = text(B, S.x0, mB.bottom + qo.size + 8, `“${D.quote.text}”`, qo);
  const qb = text(B, q.right + 8, q.y + qo.size * 0.78, `– ${D.quote.by}`, { italic: true, size: S.note, fill: C.muted, width: X1 - q.right - 8 });
  st.fade(q.el, 1.76, 1.9).fade(qb.el, 1.84, 1.96);
  y = Math.max(q.bottom, qb.bottom) + (tall ? 10 : 18);

  // a row: the number, large, then its units, then its word
  const ur = tall ? 5.6 : 7, up = tall ? 14.5 : 18;
  const nw = Math.max(textSize(fmt(D.now.value), { family: 'mono', size: S.big, weight: 600 }).w, textSize(fmt(D.plan.value), { family: 'mono', size: S.big, weight: 600 }).w);
  const ux = S.x0 + nw + 14;
  const row = (val, label, hollow, a) => {
    const R = g(B);
    const cy = y + up / 2;
    const num = text(R, S.x0 + nw, cy + S.big * 0.36, fmt(val), { family: 'mono', size: S.big, weight: 600, anchor: 'end', fill: hollow ? C.accent : C.ink });
    const us = [];
    for (let k = 0; k < val; k++) {
      const cx = ux + up / 2 + k * up;
      us.push(hollow
        ? circle(R, cx, cy, ur, { fill: 'none', stroke: C.accent, 'stroke-width': 1.5, 'stroke-dasharray': '2.4 2.2' })
        : circle(R, cx, cy, ur, { fill: C.ink }));
      if (!hollow) us[k].dataset.r = ur;
    }
    const lx = ux + val * up + 8;
    const lb = text(R, lx, cy + S.note * 0.34, label, { italic: true, size: S.note, fill: hollow ? C.accent : C.ink, weight: hollow ? 600 : 400, width: X1 - lx });
    if (hollow) st.fade(num.el, a, a + 0.08).fill(us, a + 0.02, a + 0.14).fade(lb.el, a + 0.1, a + 0.2);
    else st.fade(num.el, a, a + 0.08).fill(us, a + 0.03, a + 0.3).fade(lb.el, a + 0.26, a + 0.34);
    y += up + (tall ? 8 : 14);
    return R;
  };
  row(D.now.value, D.now.label, false, 1.2);
  row(D.plan.value, D.plan.label, true, 1.56);
  const bottom = y - (tall ? 8 : 14) + 4;
  if (bottom > H + 0.5 || bottom < H - 24) svg.dataset.contentH = Math.ceil(bottom);

  // step 1: T-Mobile's panel steps back while Telekom's comes (not in print)
  if (!ctx.print) {
    const dim = mixer(C.ink, C.muted);
    let last = -1;
    st.on((gg) => {
      const p = ease(span(gg, 1.0, 1.3));
      if (Math.abs(p - last) < 0.002) return;
      last = p;
      A.style.opacity = p <= 0 ? '' : (1 - 0.45 * p).toFixed(3);
      A.style.color = dim(p);
    });
  }
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
