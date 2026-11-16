// walls: the same new cable put into three walls. Pen lines, thin and a
// little uneven, drawn on with the scroll. Side by side on wide frames,
// stacked on phones.
//   step 0: the three walls. Timber frame: a board, the studs behind it as
//           hidden (dashed) lines. Brick, twice: a plain plastered face,
//           the brick showing only where the plaster has broken away at a
//           lower corner.
//   step 1: the same new cable arrives above each wall.
//   step 2: the three jobs, all on one route in the installation zones of
//           DIN 18015-3: in at the top right, across in the upper zone,
//           down in the corner zone at the left, to a socket near the floor.
//           Timber: holes bored in the studs, the cable
//           pulled through behind the board to a socket; quick, nothing
//           shows. Brick, repainted: a plastic duct screwed onto the
//           surface and painted over; it works, but it sits on the wall.
//           Brick, renovated: a channel cut, the cable laid, plastered
//           over; the plaster stays as a scar (the one field).
// The final state reads alone: three walls with the cable in, done three ways.
import {
  mountFigure, svgRoot, colors, h, g, path, rect, circle, text, leader, stage, rng, spline, lerp, pen,
} from '../../../lib/fig.js';

export const steps = 3;
export const aspect = { wide: 928 / 392, tall: 360 / 734 };
let mounts = 0;

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
  // the route, the same in every wall, in the installation zones of DIN
  // 18015-3: in at the top near the right side, across in the upper zone just
  // under the top of the wall, down in the corner zone near the left side,
  // into a socket near the floor. In the timber frame both vertical legs lie
  // inside the end stud bays, and the run crosses the studs through holes.
  boxes.forEach((b) => {
    const w = b.x1 - b.x0, hh = b.floor - b.top;
    b.n = Math.round(w / 58);
    b.bay = (w - 10) / b.n;
    const side = tall ? 18 : 20;
    b.entry = b.x1 - side;
    b.drop = b.x0 + side;
    b.run = b.top + Math.max(13, Math.round(hh * 0.12));
    b.sz = tall ? 12 : 13;
    b.sockY = b.floor - Math.max(14, Math.round(hh * 0.12));
    b.sockTop = b.sockY - b.sz / 2;
    b.mid = Math.round(lerp(b.run, b.sockTop, 0.55));
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
    const sz = b.sz, cx = b.drop, cy = b.sockY;
    rect(s, cx - sz / 2, cy - sz / 2, sz, sz, { fill: C.paper, stroke: C.ink, 'stroke-width': 1.25, rx: 1.5 });
    circle(s, cx - 2.4, cy, 1.1, { fill: C.ink });
    circle(s, cx + 2.4, cy, 1.1, { fill: C.ink });
    return s;
  };
  // an offset band of half width e around the route (down, across, down)
  const band = (b, e, y0 = b.top, y1 = b.sockTop) => [
    [b.entry - e, y0], [b.entry + e, y0], [b.entry + e, b.run + e], [b.drop + e, b.run + e],
    [b.drop + e, y1], [b.drop - e, y1], [b.drop - e, b.run - e], [b.entry - e, b.run - e],
  ];
  // brick courses in running bond over the whole wall; the wall is
  // plastered, so they are only ever shown through an opening (a clip)
  const bricks = (parent, b, attrs) => {
    const grp = g(parent, { stroke: C.ink, 'stroke-width': 0.75, opacity: 0.6, fill: 'none', ...attrs });
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
  // plaster broken away at the lower right corner: a ragged edge, brick behind
  const patch = (parent, b, i) => {
    const r = rng(70 + i), rx = tall ? 66 : 84, ry = tall ? 40 : 56, n = 9;
    const edge = [];
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI / 2;
      const j = k === 0 || k === n ? 1 : 0.84 + 0.2 * r();
      edge.push([b.x1 - rx * Math.sin(a) * j, b.floor - ry * Math.cos(a) * j]);
    }
    const id = `${clipId}-patch-${i}`;
    const clip = h('clipPath', { id }, svg);
    path(clip, poly([...edge, [b.x1, b.floor]], true), { fill: '#000' });
    const grp = g(parent, { 'data-audit': 'skip' });
    bricks(grp, b, { 'clip-path': `url(#${id})` });
    pline(grp, edge, 1, C.ink, 0.45);
    return grp;
  };

  const marks = [];      // where each note's leader points
  d.panels.forEach((p, i) => {
    const b = boxes[i], P = g(svg);
    const hd = text(P, b.x0, b.hy, p.heading, { family: 'sans', size: S.head, weight: 600 });
    const sb = text(P, b.x0, b.sy, p.sub, { family: 'sans', size: S.sub, fill: C.muted });
    st.fade(hd.el, 0.02 + i * 0.04, 0.16 + i * 0.04).fade(sb.el, 0.12 + i * 0.04, 0.26 + i * 0.04);
    twice(P, [[b.x0 - 8, b.floor], [b.x1 + 8, b.floor]], 0.02 + i * 0.03, 0.14 + i * 0.03);

    const runPts = [[b.entry, b.top], [b.entry, b.run], [b.drop, b.run], [b.drop, b.sockTop]];
    const lx = b.x0 + (tall ? 36 : 42);           // where each leader leaves its note

    if (p.kind === 'timber') {
      const hidden = g(P, { stroke: C.ink, 'stroke-width': 0.9, 'stroke-dasharray': '5 3', opacity: 0.7, fill: 'none' });
      const plate = 6, sw = 5;
      const studs = [];
      for (let k = 0; k <= b.n; k++) studs.push(b.x0 + 5 + k * b.bay);
      [b.top + plate, b.floor - plate].forEach((y) => path(hidden, poly([[b.x0 + 2, y], [b.x1 - 2, y]])));
      studs.forEach((x) => [x - sw / 2, x + sw / 2].forEach((xx) => path(hidden, poly([[xx, b.top + plate], [xx, b.floor - plate]]))));
      st.fade(hidden, 0.3, 0.6);
      twice(P, [[b.x0, b.floor], [b.x0, b.top], [b.x1, b.top], [b.x1, b.floor]], 0.1, 0.42);
      // the job: bore the studs in the upper zone, pull through, close nothing
      const crossed = studs.filter((x) => x < b.entry - 4 && x > b.drop + 4);
      const holes = g(P, { stroke: C.ink, 'stroke-width': 1, fill: C.paper });
      crossed.forEach((x) => circle(holes, x, b.run, 3.2));
      st.fade(holes, 2.02, 2.1);
      const solid = path(P, poly(runPts), cab);
      st.draw(solid, 2.08, 2.3, [2.32, 2.42]);
      st.fade(path(P, poly(runPts), hiddenCab), 2.32, 2.42);
      st.fade(socket(P, b), 2.3, 2.38);
      // the leader rises in the first bay to the drop, not along a stud
      marks.push({ x: b.drop + 3, y: b.mid, lx, at: [2.36, 2.46] });
    } else {
      st.fade(patch(P, b, i), 0.3, 0.62);
      twice(P, [[b.x0, b.floor], [b.x0, b.top], [b.x1, b.top], [b.x1, b.floor]], 0.14, 0.46);
    }

    if (p.kind === 'surface') {
      // a plastic duct screwed onto the face of the wall, painted over
      const dw = tall ? 5 : 5.5;
      const duct = band(b, dw);
      // the cable laid on the face, then the duct's cover closes over it
      st.draw(path(P, poly(runPts), cab), 2.2, 2.34);
      const body = path(P, poly(duct, true), { fill: C.paper, stroke: 'none', 'data-audit': 'skip' });
      const edge = pline(P, [...duct, duct[0]], 1.25, C.ink, 0.25);
      const screws = g(P, { stroke: C.ink, 'stroke-width': 0.9, fill: C.paper, 'data-audit': 'skip' });
      const across = tall ? 5 : 4;
      for (let k = 1; k < across; k++) {
        const x = lerp(b.entry - dw, b.drop + dw, k / across);
        circle(screws, x, b.run, 1.9); path(screws, poly([[x, b.run - 1.3], [x, b.run + 1.3]]));
      }
      [0.3, 0.75].forEach((f) => {
        const y = lerp(b.run + dw, b.sockTop, f);
        circle(screws, b.drop, y, 1.9); path(screws, poly([[b.drop - 1.3, y], [b.drop + 1.3, y]]));
      });
      st.fade(body, 2.34, 2.42).draw(edge, 2.32, 2.44).fade(screws, 2.4, 2.46);
      st.fade(socket(P, b), 2.3, 2.36);
      // painted over: the duct takes the wall's colour, a muted second edge
      const paint = pline(P, [...duct, duct[0]], 0.6, C.muted, 0.8);
      st.draw(paint, 2.44, 2.54);
      marks.push({ x: b.drop + dw + 2.5, y: b.mid, lx, at: [2.5, 2.6] });
    }

    if (p.kind === 'chase') {
      const cw = 4.5, pw = cw + 3.5;
      const chan = band(b, cw);
      // the scar runs on past the socket: its box is chased in too
      const scarPts = band(b, pw, b.top + 0.6, b.sockY + b.sz / 2 + 2.5);
      scarPts.push(scarPts[0]);
      const plaster = path(P, pen(scarPts, 41 + i, 0.9) + 'Z', { fill: C.field, stroke: 'none', 'data-audit': 'skip' });
      // the cut: the plaster is opened and the brick itself shows
      const cut = g(P, { 'data-audit': 'skip' });
      const clip = h('clipPath', { id: clipId }, svg);
      path(clip, poly(chan, true), { fill: '#000' });
      path(cut, poly(chan, true), { fill: C.paper, stroke: 'none' });
      bricks(cut, b, { 'clip-path': `url(#${clipId})` });
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
      marks.push({ x: b.drop + pw + 1.5, y: b.mid, lx, at: [2.86, 2.96] });
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
