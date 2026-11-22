// film: what travels on the opening drawing's cable. One forge drawing (board
// film-cable r1 c1: the hero's own lower refrigerator and servers, drawn in
// the same hand, with the cable drawn as a strip of film), split into its line
// and its field (art/film-line.png, art/film-field.png). Code adds only data:
// in each drawn frame, the checks of one round that changed, lit in the accent.
//   step 0  the frames' contents flow along the strip, from the refrigerator
//           to the servers, faster and faster: about ninety thousand a blink
//   step 1  everything but the strip dims: it is all that leaves
//   step 2  one frame is lifted out and enlarged: where checks lit, which kind
// Frames: data/film.json (tools/film-sim.py, a seeded Stim simulation),
// consecutive rounds from the middle of the run; nothing is hand-picked.
import { mountFigure, svgRoot, g, h, circle, path, pen, stage, clamp, ease } from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 3;
export const durations = { large: [2.6, 1.6, 2.2] };
const SIZE = { wide: [720, 400], tall: [360, 330] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

const IMG = [1536, 672];
// the part of the drawing shown (its own pixels): x, y, w, h
const CROP = { wide: [120, 300, 1000, 372], tall: [170, 330, 740, 342] };
// the drawn frames, in order from the refrigerator to the servers (centres,
// read off the drawing's enclosed cells)
const FR = [[279, 534], [333, 530], [386, 511], [439, 487], [496, 555], [560, 541], [631, 522], [704, 520], [770, 520]];
const FW = 30, FH = 24;           // a frame's inner size along and across the strip

function build(el, ctx) {
  const print = !!ctx.print, tall = !print && ctx.layout === 'tall';
  floor(tall ? 13 : 0);
  const C = pal(ctx), d = ctx.data, run = d.runs[0];
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const [cx0, cy0, cw, ch] = CROP[tall ? 'tall' : 'wide'];
  const k = W / cw, oy = tall ? H - ch * k - 26 : 0;
  const X = (x) => (x - cx0) * k, Y = (y) => (y - cy0) * k + oy;
  const art = (n) => new URL(`../art/${n}`, import.meta.url).href;
  const svg = svgRoot(el, W, H,
    `A refrigerator of a quantum computer and two ordinary servers, joined by a strip of film. Each frame is one round of the chip's ${d.checks_d7.value} checks; the few that changed are lit. About ninety thousand frames pass in one blink. One frame, enlarged, shows where checks lit and of which kind; nothing in it says which qubits were hit.`);
  svg.style.color = C.ink;
  const st = stage();
  const uid = `f${Math.random().toString(36).slice(2, 7)}`;
  const defs = h('defs', {}, svg);

  // the drawing, clipped to its crop; a mask keeps the strip in full ink
  // while everything else dims in step 1
  const clip = h('clipPath', { id: `${uid}c` }, defs);
  h('rect', { x: 0, y: Y(cy0), width: W, height: ch * k }, clip);
  const strip = h('mask', { id: `${uid}s`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
  const notStrip = h('mask', { id: `${uid}n`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
  h('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }, notStrip);
  for (const [fx, fy] of FR) {
    h('circle', { cx: X(fx), cy: Y(fy), r: 34 * k, fill: '#fff' }, strip);
    h('circle', { cx: X(fx), cy: Y(fy), r: 34 * k, fill: '#000' }, notStrip);
  }
  const draw = g(svg, { 'clip-path': `url(#${uid}c)` });
  const field = h('image', { href: art('film-field.png'), x: X(0), y: Y(0), width: IMG[0] * k, height: IMG[1] * k }, draw);
  const rest = g(draw, { mask: `url(#${uid}n)` });
  h('image', { href: art('film-line.png'), x: X(0), y: Y(0), width: IMG[0] * k, height: IMG[1] * k }, rest);
  const film = g(draw, { mask: `url(#${uid}s)` });
  h('image', { href: art('film-line.png'), x: X(0), y: Y(0), width: IMG[0] * k, height: IMG[1] * k }, film);

  // a frame's direction along the strip, from its neighbours
  const ang = FR.map((_, i) => {
    const a = FR[Math.max(0, i - 1)], b = FR[Math.min(FR.length - 1, i + 1)];
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  });
  // a check's place inside a frame: Stim's x along the strip, y across it
  const xs = run.checks.map((c) => c.x), ys = run.checks.map((c) => c.y);
  const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
  const local = (c) => [((c.x - mnx) / (mxx - mnx) - 0.5) * FW, ((c.y - mny) / (mxy - mny) - 0.5) * FH];
  const at = (pos) => {   // a point along the strip, pos in frames (0 = the first)
    const i = clamp(Math.floor(pos), 0, FR.length - 2), f = clamp(pos - i, 0, 1);
    const [ax, ay] = FR[i], [bx, by] = FR[i + 1];
    let a0 = ang[i], a1 = ang[i + 1];
    if (a1 - a0 > Math.PI) a1 -= 2 * Math.PI; else if (a0 - a1 > Math.PI) a1 += 2 * Math.PI;
    return { x: ax + (bx - ax) * f, y: ay + (by - ay) * f, a: a0 + (a1 - a0) * f };
  };
  const mark = (parent, kind, x, y, r) => (kind === 'Z'
    ? circle(parent, x, y, r, { fill: C.accent })
    : circle(parent, x, y, r * 0.86, { fill: '#FBFBFC', stroke: C.accent, 'stroke-width': Math.max(1, r * 0.55) }));

  // the contents of the frames: the rounds flow along the strip
  const START = 10, FLOW = 14;           // rounds from the middle of the run; frames moved in step 0
  const lit = g(svg);
  const R = Math.max(1.6, 2.4 * k);
  let shown = null;
  const drawLit = (off) => {
    const key = off.toFixed(3);
    if (shown === key) return;
    shown = key;
    lit.replaceChildren();
    const whole = Math.floor(off), frac = off - whole;
    for (let j = -1; j < FR.length; j++) {
      const pos = j + frac;
      if (pos < 0 || pos > FR.length - 1) continue;
      const round = START + whole - j;
      const frame = run.frames[((round % run.frames.length) + run.frames.length) % run.frames.length];
      const p = at(pos), cos = Math.cos(p.a), sin = Math.sin(p.a);
      // entering at the refrigerator and leaving into the servers, a frame fades
      const edge = Math.min(1, pos * 2, (FR.length - 1 - pos) * 2);
      const grp = g(lit, edge < 1 ? { opacity: edge.toFixed(3) } : {});
      for (const id of frame) {
        const c = run.checks[id], [u, v] = local(c);
        mark(grp, c.kind, X(p.x + u * cos - v * sin), Y(p.y + u * sin + v * cos), R);
      }
    }
  };
  // step 0: slow, then faster and faster; ends on a whole frame
  const offAt = (t) => FLOW * Math.pow(clamp(t), 2.4);

  // the lettering: one line a step, Libre Franklin
  const L = (str, x, y, anchor = 'start') => { const lg = g(svg); text(lg, x, y, str, { family: 'sans', size: tall ? 13 : 14, anchor }); return lg; };
  const ly = H - (tall ? 8 : 10);
  const l0 = L('about ninety thousand frames in one blink', tall ? 12 : 14, ly);
  const l1 = L('all that leaves the quantum computer', tall ? 12 : W - 14, ly, tall ? 'start' : 'end');

  // step 2: one frame lifted out and enlarged, its border in the drawing's hand
  const FROM = 2;
  const big = tall ? { x: 14, y: 4, s: 132 } : { x: X(560), y: Y(cy0) + 10, s: 150 };
  const lift = g(svg);
  const bw = big.s, bh = big.s * (FH / FW) * 1.05;
  path(lift, pen([[big.x, big.y], [big.x + bw, big.y + 1], [big.x + bw - 1, big.y + bh], [big.x + 1, big.y + bh + 1], [big.x, big.y]], 7, 0.9), { stroke: '#2a2a2a', 'stroke-width': 1.5, fill: '#FBFBFC', 'stroke-linejoin': 'round' });
  const bigAt = (c) => { const [u, v] = local(c); return [big.x + bw / 2 + (u / FW) * bw * 0.82, big.y + bh / 2 + (v / FH) * bh * 0.8]; };
  for (const c of run.checks) { const [px, py] = bigAt(c); circle(lift, px, py, 1.6, { fill: C.muted, opacity: 0.5 }); }
  const round = START + FLOW - FROM;
  for (const id of run.frames[round % run.frames.length]) { const c = run.checks[id]; const [px, py] = bigAt(c); mark(lift, c.kind, px, py, tall ? 4.6 : 5); }
  const note = g(lift);
  text(note, big.x + bw + (tall ? 12 : 14), big.y + 22, 'one frame: the checks', { family: 'sans', size: tall ? 13 : 14 });
  text(note, big.x + bw + (tall ? 12 : 14), big.y + 40, 'that changed are lit', { family: 'sans', size: tall ? 13 : 14 });

  st.on((gg) => {
    drawLit(gg >= 1 ? FLOW : offAt(gg));
    // step 1: all but the strip dims
    const p1 = ease(clamp(gg - 1)), dim = 1 - 0.6 * p1;
    for (const e of [rest, field]) e.style.opacity = dim >= 0.999 ? '' : dim.toFixed(3);
    // step 2: the frame comes up out of the strip and grows
    const p2 = ease(clamp((gg - 2) / 0.75));
    lift.style.display = p2 <= 0.001 ? 'none' : '';
    const from = at(FROM), fx = X(from.x), fy = Y(from.y);
    const z = (FW * k + (bw - FW * k) * p2) / bw;
    const tx = fx + (big.x + bw / 2 - fx) * p2, ty = fy + (big.y + bh / 2 - fy) * p2;
    lift.setAttribute('transform', p2 >= 0.999 ? '' : `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${z.toFixed(4)}) translate(${(-(big.x + bw / 2)).toFixed(2)} ${(-(big.y + bh / 2)).toFixed(2)})`);
    note.style.opacity = String(clamp((gg - 2.75) / 0.25));
  });
  st.fade(l0, 0.12, 0.42, tall ? [1.05, 1.3] : undefined);
  st.fade(l1, 1.35, 1.75);

  return { set: (step, t) => st.set(step, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
