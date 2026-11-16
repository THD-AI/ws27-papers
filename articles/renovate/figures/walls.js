// walls: the same new cable put into three walls. Pen lines, thin and a
// little uneven, drawn on with the scroll. Side by side on wide frames,
// stacked on phones.
//   step 0: the three walls. Timber frame: a board, the studs behind it as
//           hidden (dashed) lines. Brick, twice: courses in running bond.
//   step 1: the same new cable arrives above each wall.
//   step 2: the three jobs. Timber: holes drilled in the studs, the cable
//           pulled through behind the board to a socket; quick, nothing
//           shows. Brick, repainted: a plastic duct screwed onto the
//           surface and painted over; it works, but it sits on the wall.
//           Brick, renovated: a channel cut, the cable laid, plastered
//           over; the plaster stays as a scar (the one field).
// The final state reads alone: three walls with the cable in, done three ways.
import {
  mountFigure, svgRoot, colors, h, g, path, rect, circle, text, leader, stage, rng, spline, lerp,
} from '../../../lib/fig.js';

export const steps = 3;
export const aspect = { wide: 928 / 392, tall: 360 / 734 };
let mounts = 0;

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
const poly = (pts, close) => pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('') + (close ? 'Z' : '');

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const W = tall ? 360 : 928, H = tall ? 734 : 392;
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  const S = tall
    ? { head: 13.5, sub: 11.5, where: 11.5, note: 13.5 }
    : { head: 15, sub: 12.5, where: 11.5, note: 15 };
  const clipId = `walls-cut-${++mounts}`;

  // one box per panel: x0..x1 the wall, hy/wy/sy heading, where and sub
  // baselines, cy where the cable arrives, top..floor the wall, ny the note
  // baseline (the effort line follows it)
  const boxes = d.panels.map((p, i) => {
    if (tall) {
      const by = 4 + i * 252 - (i === 2 ? 26 : 0);   // the last panel shares the header above it
      return { x0: 16, x1: 344, gy: by + 14, hy: by + 40, sy: by + 57, cy: by + 72, top: by + 96, floor: by + 192, ny: by + 214 };
    }
    const w = 270, gap = (W - 40 - 3 * w) / 2, x0 = 20 + i * (w + gap);
    return { x0, x1: x0 + w, gy: 18, hy: 50, sy: 68, cy: 102, top: 130, floor: 318, ny: 354 };
  });

  // where each wall is common: one header over the timber frame, one shared
  // by the two brick walls (one wall, two ways), with a hairline under it
  // (beside it, running down, when the panels are stacked)
  d.groups.forEach((gr, k) => {
    const first = boxes[gr.panels[0]], last = boxes[gr.panels[gr.panels.length - 1]];
    const G = g(svg);
    const t = text(G, first.x0, first.gy, gr.label, { family: 'mono', size: S.where, fill: C.muted, caps: true, spacing: 0.3, width: tall ? first.x1 - first.x0 : last.x1 - first.x0 });
    if (tall) path(G, poly([[first.x0 - 9, first.gy - 9], [first.x0 - 9, last.floor]]), { stroke: C.hairline, 'stroke-width': 1, 'data-audit': 'skip' });
    else path(G, poly([[first.x0, first.gy + 9], [last.x1, first.gy + 9]]), { stroke: C.hairline, 'stroke-width': 1, 'data-audit': 'skip' });
    st.fade(G, 0.02 + k * 0.06, 0.16 + k * 0.06);
    return t;
  });
  // the stud bays of the timber frame; the cable enters every wall in the
  // middle of the last bay and ends in the first, so it never runs on a stud
  boxes.forEach((b) => {
    const w = b.x1 - b.x0;
    b.n = Math.round(w / 58);
    b.bay = (w - 10) / b.n;
    b.entry = Math.round(b.x0 + 5 + (b.n - 0.5) * b.bay);
    b.sock = Math.round(b.x0 + 5 + 0.5 * b.bay + 8);
    b.run = b.top + Math.round((b.floor - b.top) * 0.56);
  });

  let seed = 5;
  const pline = (parent, pts, w = 1.35, stroke = C.ink, amp = 0.6) => path(parent, pen(pts, seed++, amp), {
    stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  const twice = (parent, pts, a, b) => {
    st.draw(pline(parent, pts, 1.35), a, b);
    const t = pline(parent, pts, 0.55, C.ink, 1.0); t.setAttribute('opacity', 0.7); st.draw(t, a, b);
  };
  const cab = { stroke: C.accent, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' };
  const hiddenCab = { ...cab, 'stroke-dasharray': '5 3.5', 'stroke-linecap': 'butt' };

  const socket = (parent, b) => {
    const s = g(parent);
    const sz = tall ? 12 : 13, cx = b.sock - sz / 2 - 1;
    rect(s, cx - sz / 2, b.run - sz / 2, sz, sz, { fill: C.paper, stroke: C.ink, 'stroke-width': 1.25, rx: 1.5 });
    circle(s, cx - 2.4, b.run, 1.1, { fill: C.ink });
    circle(s, cx + 2.4, b.run, 1.1, { fill: C.ink });
    return s;
  };
  // the brick bond, faint: the wall is plastered, the bond seen through it
  const bricks = (parent, b, attrs) => {
    const grp = g(parent, { stroke: C.muted, 'stroke-width': 0.6, opacity: 0.32, fill: 'none', ...attrs });
    const courses = Math.round((b.floor - b.top) / 10.6);
    const ch = (b.floor - b.top) / courses, bl = ch * 3;
    let dd = '';
    for (let i = 1; i < courses; i++) dd += `M${b.x0} ${(b.top + i * ch).toFixed(1)}H${b.x1}`;
    for (let i = 0; i < courses; i++) {
      const y0 = b.top + i * ch, off = (i % 2) * bl / 2;
      for (let x = b.x0 + off + (i % 2 ? 0 : bl); x < b.x1 - 2; x += bl) dd += `M${x.toFixed(1)} ${y0.toFixed(1)}V${(y0 + ch).toFixed(1)}`;
    }
    path(grp, dd);
    return grp;
  };

  const marks = [];      // where each note's leader points
  d.panels.forEach((p, i) => {
    const b = boxes[i], P = g(svg);
    const hd = text(P, b.x0, b.hy, p.heading, { family: 'sans', size: S.head, weight: 600 });
    const sb = text(P, b.x0, b.sy, p.sub, { family: 'sans', size: S.sub, fill: C.muted });
    st.fade(hd.el, 0.02 + i * 0.04, 0.16 + i * 0.04).fade(sb.el, 0.12 + i * 0.04, 0.26 + i * 0.04);
    twice(P, [[b.x0 - 8, b.floor], [b.x1 + 8, b.floor]], 0.02 + i * 0.03, 0.14 + i * 0.03);

    const runPts = [[b.entry, b.top], [b.entry, b.run], [b.sock, b.run]];

    if (p.kind === 'timber') {
      const hidden = g(P, { stroke: C.ink, 'stroke-width': 0.9, 'stroke-dasharray': '5 3', opacity: 0.7, fill: 'none' });
      const plate = 6, sw = 5;
      const studs = [];
      for (let k = 0; k <= b.n; k++) studs.push(b.x0 + 5 + k * b.bay);
      [b.top + plate, b.floor - plate].forEach((y) => path(hidden, poly([[b.x0 + 2, y], [b.x1 - 2, y]])));
      studs.forEach((x) => [x - sw / 2, x + sw / 2].forEach((xx) => path(hidden, poly([[xx, b.top + plate], [xx, b.floor - plate]]))));
      st.fade(hidden, 0.3, 0.6);
      twice(P, [[b.x0, b.floor], [b.x0, b.top], [b.x1, b.top], [b.x1, b.floor]], 0.1, 0.42);
      // the job: drill, pull through, close nothing
      const crossed = studs.filter((x) => x < b.entry - 4 && x > b.sock + 4);
      const holes = g(P, { stroke: C.ink, 'stroke-width': 1, fill: C.paper });
      crossed.forEach((x) => circle(holes, x, b.run, 3.2));
      st.fade(holes, 2.02, 2.1);
      const solid = path(P, poly(runPts), cab);
      st.draw(solid, 2.08, 2.3, [2.32, 2.42]);
      st.fade(path(P, poly(runPts), hiddenCab), 2.32, 2.42);
      st.fade(socket(P, b), 2.3, 2.38);
      const hx = crossed[Math.floor((crossed.length - 1) / 2)];
      // the leader rises in the bay beside the stud, not along it
      marks.push({ x: hx - 3, y: b.run + 3.5, lx: hx - b.bay / 2, at: [2.36, 2.46] });
    } else {
      st.fade(bricks(P, b), 0.3, 0.62);
      twice(P, [[b.x0, b.floor], [b.x0, b.top], [b.x1, b.top], [b.x1, b.floor]], 0.14, 0.46);
    }

    if (p.kind === 'surface') {
      // a plastic duct screwed onto the face of the wall, painted over
      const dw = tall ? 5 : 5.5;
      const duct = [
        [b.entry - dw, b.top], [b.entry + dw, b.top], [b.entry + dw, b.run + dw], [b.sock, b.run + dw],
        [b.sock, b.run - dw], [b.entry - dw, b.run - dw],
      ];
      // the cable laid on the face, then the duct's cover closes over it
      st.draw(path(P, poly(runPts), cab), 2.2, 2.34);
      const body = path(P, poly(duct, true), { fill: C.paper, stroke: 'none', 'data-audit': 'skip' });
      const edge = pline(P, [...duct, duct[0]], 1.25, C.ink, 0.25);
      const screws = g(P, { stroke: C.ink, 'stroke-width': 0.9, fill: C.paper, 'data-audit': 'skip' });
      const vy = [lerp(b.top, b.run, 0.35), lerp(b.top, b.run, 0.78)];
      vy.forEach((y) => { circle(screws, b.entry, y, 1.9); path(screws, poly([[b.entry - 1.3, y], [b.entry + 1.3, y]])); });
      for (let k = 1; k <= 3; k++) {
        const x = lerp(b.entry, b.sock, k / 4);
        circle(screws, x, b.run, 1.9); path(screws, poly([[x, b.run - 1.3], [x, b.run + 1.3]]));
      }
      st.fade(body, 2.34, 2.42).draw(edge, 2.32, 2.44).fade(screws, 2.4, 2.46);
      st.fade(socket(P, b), 2.3, 2.36);
      // painted over: the duct takes the wall's colour, a muted second edge
      const paint = pline(P, [...duct, duct[0]], 0.6, C.muted, 0.8);
      st.draw(paint, 2.44, 2.54);
      const mx = lerp(b.entry, b.sock, 0.5);
      marks.push({ x: mx, y: b.run + dw + 3, at: [2.5, 2.6] });
    }

    if (p.kind === 'chase') {
      const cw = 4.5, pw = cw + 3.5;
      const chan = [
        [b.entry - cw, b.top], [b.entry + cw, b.top], [b.entry + cw, b.run + cw], [b.sock, b.run + cw],
        [b.sock, b.run - cw], [b.entry - cw, b.run - cw],
      ];
      const scarPts = [
        [b.entry - pw, b.top + 0.6], [b.entry + pw, b.top + 0.6], [b.entry + pw, b.run + pw], [b.sock - 8, b.run + pw],
        [b.sock - 8, b.run - pw], [b.entry - pw, b.run - pw], [b.entry - pw, b.top + 0.6],
      ];
      const plaster = path(P, pen(scarPts, 41 + i, 0.9) + 'Z', { fill: C.field, stroke: 'none', 'data-audit': 'skip' });
      // the cut: the plaster is opened and the brick itself shows
      const cut = g(P, { 'data-audit': 'skip' });
      const clip = h('clipPath', { id: clipId }, svg);
      path(clip, poly(chan, true), { fill: '#000' });
      path(cut, poly(chan, true), { fill: C.paper, stroke: 'none' });
      bricks(cut, b, { stroke: C.ink, 'stroke-width': 0.75, opacity: 0.6, 'clip-path': `url(#${clipId})` });
      const cutEdge = pline(P, [...chan, chan[0]], 1, C.ink, 0.35);
      st.fade(cut, 2.06, 2.24, [2.62, 2.76]);
      st.draw(cutEdge, 2.06, 2.32, [2.62, 2.76]);
      st.fade(plaster, 2.62, 2.78);
      const scarEdge = path(P, pen(scarPts, 41 + i, 0.9), { stroke: C.muted, 'stroke-width': 1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'data-audit': 'skip' });
      st.draw(scarEdge, 2.68, 2.86);
      const solid = path(P, poly(runPts), cab);
      st.draw(solid, 2.4, 2.6, [2.66, 2.78]);
      st.fade(path(P, poly(runPts), hiddenCab), 2.7, 2.8);
      st.fade(socket(P, b), 2.8, 2.88);
      marks.push({ x: lerp(b.entry, b.sock, 0.5), y: b.run + pw + 1.5, at: [2.86, 2.96] });
    }

    // the cable arrives (step 1) and goes in (step 2)
    const arrive = [[b.entry - 30, b.cy], [b.entry - 10, b.cy + 4], [b.entry, b.cy + 16], [b.entry, b.top - 8]];
    st.draw(path(P, spline(arrive), cab), 1.04, 1.5);
    const tip = g(P, { stroke: C.accent, 'stroke-width': 1.1, 'stroke-linecap': 'round' });
    path(tip, poly([[b.entry - 1.6, b.top - 8], [b.entry - 2.2, b.top - 3]]));
    path(tip, poly([[b.entry + 1.6, b.top - 8], [b.entry + 2.2, b.top - 3]]));
    st.fade(tip, 1.46, 1.54, [2.02, 2.08]);
    const goIn = p.kind === 'timber' ? 2.04 : p.kind === 'surface' ? 2.18 : 2.36;
    st.draw(path(P, poly([[b.entry, b.top - 8], [b.entry, b.top]]), cab), goIn, goIn + 0.04);

    // the job, one note per wall
    const m = marks[i];
    const nt = text(P, b.x0, b.ny, p.note, { italic: true, size: S.note });
    const ld = g(P);
    leader(ld, m.lx ?? m.x, nt.y - 3, m.x, m.y, { stroke: C.muted });
    const ef = text(P, b.x0, b.ny + S.note * 1.25, p.effort, { italic: true, size: S.note, fill: C.muted });
    st.fade(nt.el, m.at[0], m.at[1]).fade(ld, m.at[0] + 0.02, m.at[1] + 0.02).fade(ef.el, m.at[0] + 0.03, m.at[1] + 0.04);
  });

  // the note: the same cable, to every wall
  const cg = g(svg), lead = g(svg);
  if (tall) {
    // stacked: each wall has its own tag
    boxes.forEach((b, i) => {
      const cn = text(cg, b.entry - 40, b.cy + 6, d.cable.label, { italic: true, size: S.note, anchor: 'end' });
      leader(lead, cn.right + 4, cn.y + cn.h / 2, b.entry - 31, b.cy + 0.5, { stroke: C.muted });
    });
  } else {
    const cn = text(cg, W / 2, 90, d.cable.label, { italic: true, size: S.note, anchor: 'middle' });
    boxes.forEach((b) => {
      const sx = Math.max(cn.x + 6, Math.min(cn.right - 6, b.entry - 30));
      leader(lead, sx, cn.bottom + 3, b.entry - 31, b.cy - 1, { stroke: C.muted });
    });
  }
  st.fade(cg, 1.36, 1.56).fade(lead, 1.44, 1.6);

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
