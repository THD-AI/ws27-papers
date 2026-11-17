// plan: section 9, "The renovation, in order", as one path of eight numbered
// stations. Each station has its short name and, in small type, its
// measure. Step n makes station n + 1 the current one: it is in the field
// at full ink, the stations before it stay in ink, the ones after it are
// muted. The path is drawn in ink up to the current station.
//   Why the order holds, where the text says so: stations 6 to 8 sit under
//   a thin bracket, "they need step 5" (one customer record); station 6
//   hands its keys over in three stages (three notches on the path after
//   it, named in its label).
//   Under the whole path runs one quiet band: the staff stay throughout
//   (no dismissals for business reasons until 31 Dec 2028).
// No dates and no durations: they do not exist, so the stations are evenly
// spaced and the figure says "order only". No people, no icons.
// Wide: two rows of four, one path that turns at the right edge and goes
// on from the left, like a line of text. Tall (phones): the path runs down;
// a window shows the current station and its neighbours, and moves on with
// the steps. Print (screen-only scene, kept sane): the final state, every
// station in ink, nothing singled out.
import {
  mountFigure, svgRoot, colors, g, h, path, circle, text, textSize, leader, bracket, stage, span, ease, clamp, lerp, pen,
} from '../../../lib/fig.js';

export const steps = 8;
// where scenes read as a sequence: one still, the final state
export const stills = [7];
const SIZE = { wide: [720, 408], tall: [360, 380] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };
let mounts = 0;

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
    ? { head: 12.5, note: 11.5, name: 14, meas: 13, num: 12.5, mono: 12, r: 11.5, band: 16, staff: 12.5 }
    : { head: 15, note: 12.5, name: 15, meas: 13.5, num: 13.5, mono: 12.5, r: 13, band: 18, staff: 13.5 };
  const toInk = mixer(C.muted, C.ink);
  let seed = 31;
  const ink = (parent, pts, w = 1.35, stroke = C.ink, amp = 0.5) => path(parent, pen(pts, seed++, amp), {
    stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });

  // --- title and the honesty note
  const head = text(svg, 14, tall ? 15 : 20, d.headline, { family: 'sans', size: S.head, weight: 600, width: tall ? W - 28 : W - 200, lh: tall ? 15.5 : 0 });
  const on = tall
    ? text(svg, 14, head.bottom + S.note + 3, d.orderNote, { family: 'mono', size: S.note, fill: C.muted })
    : text(svg, W - 14, 20, d.orderNote, { family: 'mono', size: S.note, fill: C.muted, anchor: 'end' });
  st.fade(head.el, 0, 0.04).fade(on.el, 0, 0.04);

  // --- one station's lettering: name, the stages (station 6), the measure,
  // and (station 5, tall) why everything after needs it
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
  let blocks = [];           // [x, y, width] of each station's lettering
  let bandLabel;             // where "the staff stay throughout" goes
  const strip = g(svg);      // what moves in the tall window

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
    const ret = b1 + 22;                                   // the way back, under row 1
    const staffY = ret + S.band / 2 + S.staff + 4;          // its band's lettering, under it
    const r2 = staffY + 62;                                 // room for the bracket over 6 to 8
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
    bandLabel = { x: W / 2, y: staffY, anchor: 'middle', width: W - 60 };
    const H2 = Math.ceil(nameY(r2) + b2 + 10);
    if (H2 > H || H2 < H - 12) svg.dataset.contentH = H2;
  } else {
    // a column: the path at the left, the lettering beside it; the window
    // between the title and the band's lettering shows about three stations
    const px = 26, sp = 96, lx = px + S.r + 12, lw = W - lx - 12;
    const wy0 = on.bottom + 8, wy1 = H - 40;
    const y0 = wy0 + 22;
    push([px, y0 - 40]);
    for (let i = 0; i < N; i++) mark(px, y0 + i * sp);
    push([px, y0 + (N - 1) * sp + 90]);
    pos = d.steps.map((_, i) => [px, y0 + i * sp]);
    blocks = pos.map(([, y]) => [lx, y + S.name * 0.36, lw]);
    bandLabel = { x: 14, y: wy1 + S.staff + 6, anchor: 'start', width: W - 28 };
    const id = `plan-window-${++mounts}`;
    const cp = h('clipPath', { id }, svg);
    h('rect', { x: 0, y: wy0, width: W, height: wy1 - wy0 }, cp);
    strip.setAttribute('clip-path', `url(#${id})`);
    // the window moves on with the steps; first and last stay at the edges
    const inner = g(strip);
    strip.inner = inner;
    let last = '';
    st.on((gg) => {
      const c = clamp(cur(gg), 1, N - 2);
      const v = `translate(0 ${(-(c - 1) * sp).toFixed(2)})`;
      if (v !== last) { inner.setAttribute('transform', v); last = v; }
    });
  }
  const host = strip.inner || strip;
  // tall: the lines run on outside the window (clipped); the lab's check
  // cannot see the clip, so the moving lines are left out of it
  if (tall) host.setAttribute('data-audit', 'skip');

  // where the current station is, as a number that moves on at each step
  function cur(gg) {
    if (ctx.print) return N - 1;
    const s = Math.floor(gg + 1e-9), f = gg - s;
    return clamp(s - 1 + ease(span(f, 0, 0.22)), 0, N - 1);
  }

  // cumulative length to every point, for drawing the path up to a station
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const total = cum[cum.length - 1];
  const frac = at.map((k) => cum[k] / total);

  // --- the band: the staff stay throughout, under the whole path
  const band = path(host, pen(pts, 7, 0.4), {
    stroke: C.hairline, 'stroke-width': S.band, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.75, 'data-audit': 'skip',
  });
  st.fade(band, 0.02, 0.1);
  const bl = text(svg, bandLabel.x, bandLabel.y, `${d.staff.label} · ${d.staff.detail}`, {
    italic: true, size: S.staff, fill: C.muted, anchor: bandLabel.anchor, width: bandLabel.width,
  });
  if (tall) {
    // joined to the band where it leaves the window
    leader(svg, 26 + S.band / 2 + 4, bl.y - 3, 26 + S.band / 2 - 2, bl.y - 12, { stroke: C.muted, dot: false });
  }
  st.fade(bl.el, 0.04, 0.12);

  // --- the path: a muted line all the way, ink up to the current station
  const base = ink(host, pts, 1.25, C.muted, 0.5);
  base.setAttribute('opacity', 0.55);
  st.fade(base, 0.02, 0.1);
  const done = ink(host, pts, 1.6, C.ink, 0.5);
  done.setAttribute('pathLength', '1');
  done.setAttribute('stroke-dasharray', '1 1');
  {
    let last = '';
    st.on((gg) => {
      const c = cur(gg), i = Math.floor(c), f = c - i;
      const p = i >= N - 1 ? (ctx.print ? 1 : frac[N - 1]) : lerp(frac[i], frac[i + 1], f);
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
    for (let k = 0; k < n; k++) {
      if (tall) {
        const yy = ay + S.r + 12 + k * 13;
        path(notches, `M${ax - 5} ${yy}L${ax + 5} ${yy}`, { stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' });
      } else {
        const xx = ax + S.r + 18 + k * 16;
        path(notches, `M${xx} ${ay - 6}L${xx} ${ay + 6}`, { stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' });
      }
    }
  }

  // --- the bracket over 6 to 8: they need step 5 (wide)
  const dep = g(host);
  if (!tall) {
    const D = d.depends, [x5, y5] = pos[D.on];
    // the bracket starts right after station 5 and runs over 6, 7 and 8
    const bx0 = x5 + S.r + 7, bx1 = blocks[D.to][0] + blocks[D.to][2] - 6, by = y5 - S.r - 10;
    bracket(dep, bx0, by, bx1, by, -6, { stroke: 'currentColor', 'stroke-width': 1 });
    const nt = text(dep, bx0, by - 8, D.note, { italic: true, size: S.meas, width: bx1 - bx0 });
    if (nt.lines > 1) svg.dataset.contentH = 'dependency note wraps';
  } else {
    // a rail beside the path from station 5 down past 8, a tick at each
    const D = d.depends, rx = 8;
    const [, ya] = pos[D.on], [, yb] = pos[D.to];
    path(dep, `M${26 - S.r - 2} ${ya}L${rx} ${ya}L${rx} ${yb}`, { stroke: 'currentColor', 'stroke-width': 1, fill: 'none', 'stroke-linejoin': 'round' });
    for (let i = D.from; i <= D.to; i++) path(dep, `M${rx} ${pos[i][1]}L${26 - S.r - 3} ${pos[i][1]}`, { stroke: 'currentColor', 'stroke-width': 1 });
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
    const [bx, by, bw] = blocks[i];
    const lab = label(sg, bx, by, s, i, bw);
    return { sg, field, ring, acc, lab };
  });

  const fadeIn = (gg) => ease(span(gg, 0.02, 0.14));
  let lastKey = '';
  st.on((gg) => {
    const c = cur(gg), a = fadeIn(gg);
    const key = `${c.toFixed(4)}|${a.toFixed(3)}`;
    if (key === lastKey) return;
    lastKey = key;
    st8.forEach((o, i) => {
      // reached: 0 for a later station, 1 once the path has come to it
      const reached = ctx.print ? 1 : clamp(c - i + 1);
      const focus = ctx.print ? 0 : Math.max(0, 1 - Math.abs(c - i));
      o.sg.style.color = toInk(reached);
      o.sg.style.opacity = a >= 0.999 ? '' : a.toFixed(3);
      o.field.style.opacity = focus.toFixed(3);
      o.acc.style.opacity = focus.toFixed(3);
      o.ring.setAttribute('fill', focus > 0.5 ? C.field : C.paper);
      if (tall) {
        // the window: the current station and its neighbours; the rest fade out
        const dist = Math.abs(i - clamp(c, 1, N - 2));
        o.sg.style.opacity = (a * (1 - clamp((dist - 1) / 0.5))).toFixed(3);
      }
    });
    const k = kStation >= 0 ? clamp(c - kStation + 1) : 0;
    notches.style.color = toInk(ctx.print ? 1 : k);
    dep.style.color = toInk(ctx.print ? 1 : clamp(c - d.depends.on + 1));
    if (tall) {
      const dist = Math.abs(d.depends.from - clamp(c, 1, N - 2));
      dep.style.opacity = (1 - clamp((dist - 1.5) / 0.5)).toFixed(3);
    }
  });

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
