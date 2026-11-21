// walls: the same new cable put into three walls. Pen lines, thin and a
// little uneven, drawn on with the scroll. Side by side on wide frames,
// stacked on phones.
//   step 0: the three walls. Timber frame: a board, the studs behind it as
//           hidden (dashed) lines. Brick, twice: a plain plastered face,
//           the brick showing only where the plaster has broken away at a
//           lower corner.
//   step 1: the same new cable arrives above each wall.
//   step 2: the three jobs. Timber: in through the top plate from the
//           attic or ceiling space, straight down inside one stud bay
//           behind the board to a socket near the floor; pulled through,
//           quick, nothing shows. No run across the studs: behind finished
//           board that would mean opening it at every stud. The two brick
//           walls share one route in the installation zones of DIN
//           18015-3: in at the top right, down to the upper zone (drawn at
//           about 30 cm below the ceiling), across, down in the corner zone
//           at the left, to a socket near the floor. On the surface: a
//           plastic duct screwed onto the plaster and painted over. Cut in:
//           a channel cut, the cable laid, plastered over; the plaster
//           stays as a scar (the one field).
// The final state reads alone: three walls with the cable in, done three ways.
import {
  mountFigure, svgRoot, colors, h, g, path, rect, circle, text, textSize, leader, stage, rng, spline, lerp, pen,
} from '../fig.js';

export const steps = 3;
// where scenes read as a sequence (tablet portrait, phone landscape): one still, the final state
export const stills = [2];
// seconds each step plays once triggered: three walls drawn; the cable
// comes down to each; the three jobs done, each with its note
// (step 2: timber, then the duct, then the channel, one after another:
// about 0.7, 0.9 and 1.2 s, each with its note)
export const durations = { large: [2.8, 1.2, 2.9] };
// the engine plays t with a prompt start and a gentle end (article.js
// soft()); T(sec, D) is the t at which `sec` seconds of a D-second step
// have passed, so arrivals can be set in seconds
const soft = (x) => x * (1.4 - 0.4 * x);
const T = (sec, D) => soft(Math.min(1, Math.max(0, sec / D)));
// tall: three panels stacked, short enough that the title, the drawing and
// the caption share one phone screen
export const aspect = { wide: 928 / 392, tall: 360 / 528 };
let mounts = 0;

const poly = (pts, close) => pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('') + (close ? 'Z' : '');

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const W = tall ? 360 : 928, H = tall ? 528 : 392;
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  const S = tall
    ? { head: 13.5, sub: 11.5, where: 11.5, note: 13.5 }
    // wide: the smallest lettering is 13.5 of 928 units, so a frame of
    // 800 px still shows it at 11.6 px (the engine picks wide from there)
    : { head: 16, sub: 13.5, where: 13.5, note: 15.5 };
  const clipId = `walls-cut-${++mounts}`;

  // one box per panel: x0..x1 the wall, hy/wy/sy heading, where and sub
  // baselines, cy where the cable arrives, top..floor the wall, ny the note
  // baseline (the effort line follows it)
  const boxes = d.panels.map((p, i) => {
    if (tall) {
      const by = 2 + i * 182 - (i === 2 ? 18 : 0);   // the last panel shares the header above it
      return { x0: 16, x1: 344, gy: by + 12, hy: by + 33, sy: by + 48, cy: by + 59, top: by + 79, floor: by + 153, ny: by + 170 };
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
    const t = text(G, first.x0, first.gy, tall && gr.short ? gr.short : gr.label, { family: 'mono', size: S.where, fill: C.muted, caps: true, spacing: 0.3, width: tall ? first.x1 - first.x0 : last.x1 - first.x0 });
    if (tall) path(G, poly([[first.x0 - 9, first.gy - 9], [first.x0 - 9, last.floor]]), { stroke: C.hairline, 'stroke-width': 1, 'data-audit': 'skip' });
    else path(G, poly([[first.x0, first.gy + 9], [last.x1, first.gy + 9]]), { stroke: C.hairline, 'stroke-width': 1, 'data-audit': 'skip' });
    st.fade(G, 0.02 + k * 0.1, 0.18 + k * 0.1);
    return t;
  });
  // the brick route, in the installation zones of DIN 18015-3: in at the top
  // near the right side, down to the upper zone (15 to 45 cm below the
  // ceiling; drawn at about 30 cm of about 2.5 m, so some 16% of the wall
  // height under its top), across, down in the corner zone near the left
  // side, into a socket near the floor. The timber route is one straight
  // drop through the top plate inside one stud bay.
  boxes.forEach((b) => {
    const w = b.x1 - b.x0, hh = b.floor - b.top;
    b.n = Math.round(w / 58);
    b.bay = (w - 10) / b.n;
    const side = tall ? 18 : 20;
    b.entry = b.x1 - side;
    b.drop = b.x0 + side;
    b.run = b.top + Math.max(tall ? 10 : 15, Math.round(hh * 0.16));
    b.sz = tall ? 12 : 13;
    b.sockY = b.floor - Math.max(tall ? 12 : 20, Math.round(hh * 0.17));
    b.sockTop = b.sockY - b.sz / 2;
    b.mid = Math.round(lerp(b.run, b.sockTop, 0.55));
  });
  // the timber wall: entry and socket in the first stud bay, beside the corner
  d.panels.forEach((p, i) => {
    if (p.kind !== 'timber') return;
    // stacked: the cable tag stands on the left, so the entry is in the
    // first bay that leaves it room inside the viewBox (at least the third)
    const b = boxes[i];
    const tagW = tall ? textSize(d.cable.label, { italic: true, size: S.note }).w : 0;
    const k = tall ? Math.min(b.n - 1, Math.max(2, Math.ceil((tagW + 46 - b.x0 - 5) / b.bay - 0.5))) : 0;
    b.entry = b.drop = b.x0 + 5 + (k + 0.5) * b.bay;
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
    const r = rng(70 + i), rx = tall ? 66 : 84, ry = tall ? 32 : 56, n = 9;
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
  // step 2 in the passage's order: each wall has its own stretch of time,
  // its old timeline (o0..o1 in g) mapped into it
  const D2 = durations.large[2];
  const win = {
    timber: [2 + T(0, D2), 2 + T(0.7, D2), 2.02, 2.6],
    surface: [2 + T(0.7, D2), 2 + T(1.6, D2), 2.18, 2.82],
    chase: [2 + T(1.6, D2), 2 + T(2.85, D2), 2.06, 2.92],
  };
  d.panels.forEach((p, i) => {
    const b = boxes[i], P = g(svg);
    const [w0, w1, o0, o1] = win[p.kind] || [2, 3, 2, 3];
    const M = (x) => (x < 2 ? x : lerp(w0, w1, (x - o0) / (o1 - o0)));
    const Ms = (a) => a && a.map(M);
    const hd = text(P, b.x0, b.hy, p.heading, { family: 'sans', size: S.head, weight: 600 });
    const sb = text(P, b.x0, b.sy, p.sub, { family: 'sans', size: S.sub, fill: C.muted });
    // step 0, panel by panel in reading order: heading, sub, the floor, the
    // wall's outline, then what is behind its face
    const o = i * 0.1;
    st.fade(hd.el, 0.04 + o, 0.18 + o).fade(sb.el, 0.1 + o, 0.24 + o);
    twice(P, [[b.x0 - 8, b.floor], [b.x1 + 8, b.floor]], 0.14 + o, 0.3 + o);

    const runPts = p.kind === 'timber'
      ? [[b.entry, b.top], [b.drop, b.sockTop]]
      : [[b.entry, b.top], [b.entry, b.run], [b.drop, b.run], [b.drop, b.sockTop]];
    const lx = b.x0 + (tall ? 36 : 42);           // where each leader leaves its note

    if (p.kind === 'timber') {
      const hidden = g(P, { stroke: C.ink, 'stroke-width': 0.9, 'stroke-dasharray': '5 3', opacity: 0.7, fill: 'none' });
      const plate = 6, sw = 5;
      const studs = [];
      for (let k = 0; k <= b.n; k++) studs.push(b.x0 + 5 + k * b.bay);
      [b.top + plate, b.floor - plate].forEach((y) => path(hidden, poly([[b.x0 + 2, y], [b.x1 - 2, y]])));
      studs.forEach((x) => [x - sw / 2, x + sw / 2].forEach((xx) => path(hidden, poly([[xx, b.top + plate], [xx, b.floor - plate]]))));
      st.fade(hidden, 0.46 + o, 0.7 + o);
      twice(P, [[b.x0, b.floor], [b.x0, b.top], [b.x1, b.top], [b.x1, b.floor]], 0.2 + o, 0.5 + o);
      // the job: through the top plate, down one bay, close nothing
      const solid = path(P, poly(runPts), cab);
      st.draw(solid, M(2.08), M(2.34), Ms([2.38, 2.5]));
      st.fade(path(P, poly(runPts), hiddenCab), M(2.38), M(2.5));
      st.fade(socket(P, b), M(2.3), M(2.4));
      // the leader meets the drop inside its bay, not on a stud
      marks.push({ x: b.drop + 3, y: Math.round(lerp(b.top, b.sockTop, 0.72)), lx: b.drop + 3, at: Ms([2.44, 2.56]), vertical: true });
    } else {
      twice(P, [[b.x0, b.floor], [b.x0, b.top], [b.x1, b.top], [b.x1, b.floor]], 0.2 + o, 0.5 + o);
      st.fade(patch(P, b, i), 0.5 + o, 0.72 + o);
    }

    if (p.kind === 'surface') {
      // a plastic duct screwed onto the face of the wall, painted over
      const dw = tall ? 5 : 5.5;
      const duct = band(b, dw);
      // the cable laid on the face, then the duct's cover closes over it
      st.draw(path(P, poly(runPts), cab), M(2.24), M(2.4));
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
      st.fade(body, M(2.44), M(2.54)).draw(edge, M(2.4), M(2.56)).fade(screws, M(2.52), M(2.6));
      st.fade(socket(P, b), M(2.36), M(2.44));
      // painted over: the duct takes the wall's colour, a muted second edge
      const paint = pline(P, [...duct, duct[0]], 0.6, C.muted, 0.8);
      st.draw(paint, M(2.58), M(2.7));
      marks.push({ x: b.drop + dw + 2.5, y: b.mid, lx, at: Ms([2.66, 2.78]) });
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
      st.fade(cut, M(2.06), M(2.24), Ms([2.6, 2.74]));
      st.draw(cutEdge, M(2.06), M(2.32), Ms([2.6, 2.74]));
      st.fade(plaster, M(2.6), M(2.74));
      const scarEdge = path(P, pen(scarPts, 41 + i, 0.9), { stroke: C.muted, 'stroke-width': 1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'data-audit': 'skip' });
      st.draw(scarEdge, M(2.64), M(2.8));
      const solid = path(P, poly(runPts), cab);
      st.draw(solid, M(2.4), M(2.58), Ms([2.64, 2.76]));
      st.fade(path(P, poly(runPts), hiddenCab), M(2.68), M(2.78));
      st.fade(socket(P, b), M(2.74), M(2.82));
      marks.push({ x: b.drop + pw + 1.5, y: b.mid, lx, at: Ms([2.78, 2.88]) });
    }

    // the cable arrives (step 1) and goes in (step 2)
    const arrive = tall
      ? [[b.entry - 30, b.cy], [b.entry - 10, b.cy + 3], [b.entry, b.cy + 10], [b.entry, b.top - 8]]
      : [[b.entry - 30, b.cy], [b.entry - 10, b.cy + 4], [b.entry, b.cy + 16], [b.entry, b.top - 8]];
    // step 1: the cable comes down to each wall, left to right
    const ca = 1.02 + i * 0.14;
    st.draw(path(P, spline(arrive), cab), ca, ca + 0.36);
    const tip = g(P, { stroke: C.accent, 'stroke-width': 1.1, 'stroke-linecap': 'round' });
    path(tip, poly([[b.entry - 1.6, b.top - 8], [b.entry - 2.2, b.top - 3]]));
    path(tip, poly([[b.entry + 1.6, b.top - 8], [b.entry + 2.2, b.top - 3]]));
    const goIn = M(p.kind === 'timber' ? 2.02 : p.kind === 'surface' ? 2.18 : 2.34);
    st.fade(tip, ca + 0.34, ca + 0.46, [goIn - 0.02, goIn + 0.03]);
    st.draw(path(P, poly([[b.entry, b.top - 8], [b.entry, b.top]]), cab), goIn, goIn + 0.05);

    // the job, one note per wall
    const m = marks[i];
    // the timber note stands under its drop, so the leader runs straight up
    const nx = m.vertical ? Math.max(b.x0, Math.min(m.x - 30, b.x1 - textSize(p.note, { italic: true, size: S.note }).w)) : b.x0;
    const nt = text(P, nx, b.ny, p.note, { italic: true, size: S.note });
    const ld = g(P);
    leader(ld, m.lx ?? m.x, nt.y - 3, m.x, m.y, { stroke: C.muted });
    // stacked: the effort follows the note on its line, to keep the panel short
    const ef = tall
      ? text(P, nt.right + 12, b.ny, p.effort, { italic: true, size: S.note, fill: C.muted })
      : text(P, nx, b.ny + S.note * 1.25, p.effort, { italic: true, size: S.note, fill: C.muted });
    st.fade(ld, m.at[0], m.at[1]).fade(nt.el, m.at[0] + 0.02, m.at[1] + 0.02).fade(ef.el, m.at[0] + 0.04, m.at[1] + 0.04);
  });

  // the note: the same cable, to every wall
  const cg = g(svg), lead = g(svg);
  if (tall) {
    // stacked: each wall has its own tag
    boxes.forEach((b, i) => {
      // kept inside the viewBox: where the line does not fit left of the
      // cable's end, it wraps onto two lines (its last line stays at the cable)
      const cOpt = { italic: true, size: S.note, anchor: 'end' };
      const room = b.entry - 40 - 6;
      const one = textSize(d.cable.label, cOpt);
      const cs = one.w <= room ? one : textSize(d.cable.label, { ...cOpt, width: room });
      const cn = text(cg, b.entry - 40, b.cy + 5 - (cs.lines - 1) * cs.lh, d.cable.label, one.w <= room ? cOpt : { ...cOpt, width: room });
      leader(lead, cn.right + 4, b.cy + 5 - S.note * 0.27, b.entry - 31, b.cy + 0.5, { stroke: C.muted });
    });
  } else {
    const cn = text(cg, W / 2, 90, d.cable.label, { italic: true, size: S.note, anchor: 'middle' });
    boxes.forEach((b) => {
      const sx = Math.max(cn.x + 6, Math.min(cn.right - 6, b.entry - 30));
      leader(lead, sx, cn.bottom + 3, b.entry - 31, b.cy - 1, { stroke: C.muted });
    });
  }
  st.fade(cg, 1.5, 1.72).fade(lead, 1.66, 1.94);

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
