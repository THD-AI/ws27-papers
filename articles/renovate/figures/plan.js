// plan: section 9, "The renovation, in order", as one path of eight numbered
// stations. Each station has its short name and, in small type, its
// measure. Step n (0 to 7) makes station n + 1 the current one: it is in the
// field at full ink, the stations before it stay in ink, the ones after it
// are muted. The path is drawn in ink up to the current station.
//   Step 8 is the overview: every station in ink, none singled out. The
//   text never scrolls to it; it is the still where scenes read as a
//   sequence (stills = [8]) and the print state (steps - 1), so neither
//   reads as "we are at step 8".
//   Why the order holds, where the text says so: stations 6 to 8 sit under
//   a thin bracket for account changes, which need step 5; station 6
//   hands its keys over in three stages (three notches on the path after
//   it, named in its label).
//   The staff: a separate note with a short band that stops at a marked
//   end, 31 Dec 2028, and its scope (about 60,000 staff; about 4,000 a year
//   leave by agreed routes). It is not drawn under the path: the path has
//   no dates, so the figure cannot say at which step the protection ends.
// No dates and no durations: they do not exist, so the stations are evenly
// spaced and the figure says "order only". No people, no icons.
// Wide: two rows of four, one path that turns at the right edge and goes
// on from the left, like a line of text. Tall (phones, pinned above the
// passages): a compact strip, about a quarter of a phone screen. One line
// of eight small numbered stations, "step 3 of 8" with the current
// station's name and measure under it.
import {
  mountFigure, svgRoot, colors, g, path, circle, text, bracket, stage, span, ease, clamp, lerp, pen,
} from '../../../lib/fig.js';

export const steps = 9;
// where scenes read as a sequence: one still, the overview (no station singled out)
export const stills = [8];
// seconds each step plays once triggered: the entry draws the whole path,
// a walk to the next station is short (one ring moving on), 1.2 s for the
// last; the overview is never scrolled to
export const durations = { large: [2.6, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.2, 1.2] };
const SIZE = { wide: [720, 448], tall: [360, 236] };
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
// a quarter turn of radius r from a to b (corner of the path)
const corner = (ax, ay, cx, cy, bx, by, n = 6) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, u = 1 - t;
  return [u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by];
});

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall' && !ctx.print;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  const N = d.steps.length;
  const S = tall
    ? { head: 13, note: 11.5, name: 15, meas: 13, num: 11.5, mono: 11.5, r: 10, staff: 12 }
    : { head: 15, note: 12.5, name: 15, meas: 13.5, num: 13.5, mono: 12.5, r: 13, staff: 13 };
  const toInk = mixer(C.muted, C.ink);
  const fillMix = mixer(C.paper, C.field);
  let seed = 31;
  const ink = (parent, pts, w = 1.35, stroke = C.ink, amp = 0.5) => path(parent, pen(pts, seed++, amp), {
    stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });

  // where the current station is, as a number that moves on at each step;
  // the overview (step 8, print) singles none out
  // (it plays inside step 8, so the end of step 7 still shows station 8)
  const ovP = (gg) => (ctx.print ? 1 : ease(span(gg, N + 0.02, N + 0.5)));
  const overview = (gg) => ovP(gg) >= 0.999;
  // half speed at both ends, never stopped in between: the pen keeps
  // walking over the whole step (a cubic ease spent half the step creeping)
  const soft = (x) => x * (0.5 + x * (1.5 - x));
  function cur(gg) {
    if (overview(gg)) return N - 1;
    const s = Math.floor(gg + 1e-9), f = gg - s;
    // the pen walks to the next station over the step; at step 0 it stays
    // at the first station, which `arrive` brings in
    return clamp(s - 1 + soft(span(f, 0.05, 0.7)), 0, N - 1);
  }
  // step 0, once the path and the stations are there: the ink runs to
  // station 1 (0.50 to 0.66), then station 1 takes the field (0.60 to 0.74)
  const inkTo1 = (gg) => (gg >= 1 ? 1 : soft(span(gg, 0.5, 0.66)));
  const arrive = (gg) => (gg >= 1 ? 1 : soft(span(gg, 0.6, 0.74)));
  // how much station i is the current one: in a walk the ring leaves its
  // station first (about 0.35 s), the pen walks, and the ring comes in at
  // the next as the pen arrives; never in one frame
  function focusOf(gg, i) {
    if (gg < 1) return i === 0 ? arrive(gg) : 0;
    const s = Math.min(N, Math.floor(gg + 1e-9)), f = gg - s;
    if (s >= N) return i === N - 1 ? 1 - ovP(gg) : 0;
    if (i === s - 1) return 1 - ease(span(f, 0.02, 0.38));
    if (i === s) return ease(span(f, 0.6, 0.95));
    return 0;
  }
  // tall: the current station's lettering, handed over in the middle of
  // the walk (the old leaves, then the new comes), so the strip is never
  // without a name for long
  function letterOf(gg, i) {
    if (gg < 1) return i === 0 ? clamp((arrive(gg) - 0.5) * 2) : 0;
    const s = Math.min(N, Math.floor(gg + 1e-9)), f = gg - s;
    if (s >= N) return i === N - 1 ? clamp(1 - ovP(gg) * 2) : 0;
    if (i === s - 1) return 1 - ease(span(f, 0.3, 0.46));
    if (i === s) return ease(span(f, 0.48, 0.66));
    return 0;
  }

  // --- title and the honesty note
  const head = text(svg, 14, tall ? 16 : 20, tall ? d.headShort : d.headline, { family: 'sans', size: S.head, weight: 600, width: tall ? 190 : W - 200 });
  const on = text(svg, W - 14, tall ? 16 : 20, d.orderNote, { family: 'mono', size: S.note, fill: C.muted, anchor: 'end' });
  st.fade(head.el, 0.02, 0.12).fade(on.el, 0.1, 0.2);

  // --- the staff: a short band that stops at a marked end, and its words
  const staff = (x, y, width) => {
    const sg = g(svg);
    const bw = tall ? 34 : 44, by = y - S.staff * 0.33;
    path(sg, `M${x} ${by}L${x + bw} ${by}`, { stroke: C.hairline, 'stroke-width': tall ? 7 : 8, 'stroke-linecap': 'butt', 'data-audit': 'skip' });
    path(sg, `M${x + bw} ${by - 7}L${x + bw} ${by + 7}`, { stroke: C.muted, 'stroke-width': 1.6, 'stroke-linecap': 'round' });
    const tx = x + bw + 9;
    const t1 = text(sg, tx, y, d.staff.label, { italic: true, size: S.staff, fill: C.ink, width: width - (tx - x) });
    const t2 = text(sg, tx, t1.bottom + S.staff + 1, d.staff.detail, { italic: true, size: S.staff, fill: C.muted, width: width - (tx - x) });
    st.fade(sg, 0.7, 0.88);
    return t2.bottom;
  };

  // --- one station's lettering: name, the stages (station 6), the measure,
  // and (tall, station 5) why everything after needs it
  const label = (parent, x, y, s, i, width) => {
    const lg = g(parent);
    const nm = text(lg, x, y, s.name, { family: 'sans', size: S.name, weight: 600, width, lh: S.name * 1.15 });
    let bottom = nm.bottom;
    if (s.stages) {
      const sg = text(lg, x, bottom + S.mono + 3, s.stages.join(' → '), { family: 'mono', size: S.mono, width });
      bottom = sg.bottom;
    }
    const ms = text(lg, x, bottom + S.meas + 3, `${d.measureWord} ${s.measure}`, { italic: true, size: S.meas, width, lh: S.meas * 1.18 });
    bottom = ms.bottom;
    if (tall && i === d.depends.on) {
      const dn = text(lg, x, bottom + S.meas + 2, d.depends.short, { italic: true, size: S.meas, width, fill: C.accent, weight: 600 });
      bottom = dn.bottom;
    }
    return { el: lg, bottom };
  };

  // --- the path as a list of points; the stations are points of it
  const pts = [], at = [];
  const push = (p) => { pts.push(p); };
  const mark = (x, y) => { at.push(pts.length); push([x, y]); };
  let pos = [];              // station centres
  let blocks = [];           // [x, y, width] of each station's lettering (wide)
  let info = null;           // tall: where the current station's lettering goes

  if (!tall) {
    const x0 = 48, sp = 168, lw = 150, r1 = head.bottom + 40;
    const xs = (i) => x0 + (i % 4) * sp;
    // row 1, then measure its lettering to place the turn and row 2
    const tmp = g(svg);
    let b1 = 0, b2 = 0;
    const nameY = (y) => y + S.r + S.name + 9;
    for (let i = 0; i < 4; i++) b1 = Math.max(b1, label(tmp, 0, nameY(r1), d.steps[i], i, lw).bottom);
    for (let i = 4; i < N; i++) b2 = Math.max(b2, label(tmp, 0, 0, d.steps[i], i, lw).bottom);
    tmp.remove();
    const ret = b1 + 22;                                    // the way back, under row 1
    const r2 = ret + 64;                                    // room for the bracket over 6 to 8
    const R = 12, xr = W - 14, xl = 14, end = xs(3) + 104;
    push([x0 - 30, r1]);
    for (let i = 0; i < 4; i++) mark(xs(i), r1);
    push([xr - R, r1]); corner(xr - R, r1, xr, r1, xr, r1 + R).slice(1).forEach(push);
    push([xr, ret - R]); corner(xr, ret - R, xr, ret, xr - R, ret).slice(1).forEach(push);
    push([xl + R, ret]); corner(xl + R, ret, xl, ret, xl, ret + R).slice(1).forEach(push);
    push([xl, r2 - R]); corner(xl, r2 - R, xl, r2, xl + R, r2).slice(1).forEach(push);
    for (let i = 4; i < N; i++) mark(xs(i), r2);
    push([end, r2]);
    pos = d.steps.map((_, i) => [xs(i), i < 4 ? r1 : r2]);
    blocks = pos.map(([x, y]) => [x - S.r, nameY(y), lw]);
    const sb = staff(14, nameY(r2) + b2 + 30, W - 28);
    const H2 = Math.ceil(sb + 10);
    if (H2 > H || H2 < H - 12) svg.dataset.contentH = H2;
  } else {
    // one line of eight stations; the current one's lettering under it
    const x0 = 26, x1 = W - 26, sp = (x1 - x0) / (N - 1);
    const sy = Math.max(head.bottom, on.bottom) + 40;     // room for the bracket over 6 to 8
    push([x0 - 14, sy]);
    for (let i = 0; i < N; i++) mark(x0 + i * sp, sy);
    push([x1 + 14, sy]);
    pos = d.steps.map((_, i) => [x0 + i * sp, sy]);
    info = { x: 14, y: sy + S.r + 22, width: W - 28 };
    // the tallest station's lettering decides where the staff note goes
    const tmp = g(svg);
    let hb = 0;
    d.steps.forEach((s, i) => { hb = Math.max(hb, label(tmp, info.x, info.y + S.mono + 4 + S.name, s, i, info.width).bottom); });
    tmp.remove();
    info.bottom = hb;
    const sb = staff(14, hb + 22, W - 28);
    const H2 = Math.ceil(sb + 8);
    if (H2 > H || H2 < H - 12) svg.dataset.contentH = H2;
  }
  const host = g(svg);

  // cumulative length to every point, for drawing the path up to a station
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const total = cum[cum.length - 1];
  const frac = at.map((k) => cum[k] / total);

  // --- the path: a muted line all the way, ink up to the current station
  const base = ink(host, pts, 1.25, C.muted, tall ? 0.35 : 0.5);
  base.setAttribute('opacity', 0.55);
  st.fade(base, 0.16, 0.32);
  const done = ink(host, pts, 1.6, C.ink, tall ? 0.35 : 0.5);
  done.setAttribute('pathLength', '1');
  done.setAttribute('stroke-dasharray', '1 1');
  {
    let last = '';
    st.on((gg) => {
      const c = cur(gg), i = Math.floor(c), f = c - i;
      const p = i >= N - 1 ? lerp(frac[N - 1], 1, ovP(gg)) : lerp(frac[i], frac[i + 1], f) * (i === 0 && f === 0 ? inkTo1(gg) : 1);
      const v = (1 - p).toFixed(4);
      if (v !== last) { done.setAttribute('stroke-dashoffset', v); last = v; }
    });
  }

  // --- the keys in stages: three notches on the path after station 6
  const kStation = d.steps.findIndex((s) => s.stages);
  const notches = g(host);
  if (kStation >= 0) {
    const [ax, ay] = pos[kStation];
    const n = d.steps[kStation].stages.length;
    const gap = tall ? 6 : 16, first = tall ? S.r + 6 : S.r + 18;
    for (let k = 0; k < n; k++) {
      const xx = ax + first + k * gap, hh = tall ? 5 : 6;
      path(notches, `M${xx} ${ay - hh}L${xx} ${ay + hh}`, { stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' });
    }
  }

  // --- the bracket over 6 to 8: they need step 5
  const dep = g(host);
  {
    const D = d.depends, [x5, y5] = pos[D.on];
    if (!tall) {
      // the bracket starts right after station 5 and runs over 6, 7 and 8
      const bx0 = x5 + S.r + 7, bx1 = blocks[D.to][0] + blocks[D.to][2] - 6, by = y5 - S.r - 10;
      bracket(dep, bx0, by, bx1, by, -6, { stroke: 'currentColor', 'stroke-width': 1 });
      const nt = text(dep, bx0, by - 8, D.note, { italic: true, size: S.meas, width: bx1 - bx0 });
      if (nt.lines > 1) svg.dataset.contentH = 'dependency note wraps';
    } else {
      const bx0 = pos[D.from][0] - S.r, bx1 = pos[D.to][0] + S.r, by = y5 - S.r - 7;
      bracket(dep, bx0, by, bx1, by, -5, { stroke: 'currentColor', 'stroke-width': 1 });
      text(dep, bx1, by - 7, D.tag, { italic: true, size: S.meas, anchor: 'end' });
    }
  }

  // --- the stations
  const st8 = d.steps.map((s, i) => {
    const [x, y] = pos[i];
    const sg = g(host);
    const field = circle(sg, x, y, S.r + 3, { fill: C.field, 'data-audit': 'skip' });
    const ring = circle(sg, x, y, S.r, { fill: C.paper, stroke: 'currentColor', 'stroke-width': 1.35 });
    const acc = circle(sg, x, y, S.r + 3, { fill: 'none', stroke: C.accent, 'stroke-width': 1.8, 'data-audit': 'skip' });
    const num = text(sg, x, y + S.num * 0.36, String(i + 1), { family: 'mono', size: S.num, weight: 600, anchor: 'middle' });
    num.el.setAttribute('data-audit', 'skip');   // the number sits in its own circle on purpose
    let lab;
    if (!tall) {
      const [bx, by, bw] = blocks[i];
      lab = label(sg, bx, by, s, i, bw);
    } else {
      // under the strip: "step 3 of 8", then the name and the measure
      lab = g(svg);
      text(lab, info.x, info.y, d.stepWord.replace('{n}', i + 1).replace('{N}', N), { family: 'mono', size: S.mono, fill: C.muted });
      label(lab, info.x, info.y + S.mono + 4 + S.name, s, i, info.width);
    }
    return { sg, field, ring, acc, lab };
  });
  // tall overview: what the strip is, where a station's lettering would be
  let ov = null;
  if (tall) {
    ov = g(svg);
    text(ov, info.x, info.y + S.mono + 4, d.overview, { italic: true, size: S.meas, width: info.width });
  }

  const fadeIn = (gg) => ease(span(gg, 0.24, 0.42));
  // the notches and the bracket arrive after the stations they belong to,
  // in reading order (notches on the path, then the bracket and its note)
  st.fade(notches, 0.34, 0.48).fade(dep, 0.4, 0.56);
  let lastKey = '';
  st.on((gg) => {
    const all = overview(gg), op = ovP(gg);
    const c = cur(gg), a = fadeIn(gg);
    const key = `${gg.toFixed(4)}|${a.toFixed(3)}`;
    if (key === lastKey) return;
    lastKey = key;
    st8.forEach((o, i) => {
      // reached: 0 for a later station, 1 once the path has come to it
      const reached = all ? 1 : clamp(c - i + 1);
      const focus = all ? 0 : focusOf(gg, i);
      o.sg.style.color = toInk(reached);
      o.sg.style.opacity = a >= 0.999 ? '' : a.toFixed(3);
      o.field.style.opacity = focus.toFixed(3);
      o.acc.style.opacity = focus.toFixed(3);
      const fl = fillMix(focus);
      if (o.ring.getAttribute('fill') !== fl) o.ring.setAttribute('fill', fl);
      if (tall) {
        // only the current station's lettering; neighbours cross over quickly
        const v = all ? 0 : a * letterOf(gg, i);
        o.lab.style.display = v <= 0.001 ? 'none' : '';
        o.lab.style.opacity = v >= 0.999 ? '' : v.toFixed(3);
      }
    });
    if (ov) {
      const v = a * clamp((op - 0.5) * 2);
      ov.style.display = v <= 0.001 ? 'none' : '';
      ov.style.opacity = v >= 0.999 ? '' : v.toFixed(3);
    }
    const k = kStation >= 0 ? clamp(c - kStation + 1) : 0;
    notches.style.color = toInk(all ? 1 : k);
    dep.style.color = toInk(all ? 1 : clamp(c - d.depends.on + 1));
  });

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
