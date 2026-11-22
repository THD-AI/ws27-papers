// film: what travels on the opening drawing's cable. The hero itself (its
// line and field layers, cropped around the cable) is the only drawing; the
// cable carries a row of small frames, drawn in code in the hero's ink, and
// each frame shows one round of the chip's checks: the few that lit up.
//   step 0  the frames tick along the cable, faster and faster: about ninety
//           thousand of them in one blink
//   step 1  everything else dims: the film is all that comes out
//   step 2  one frame lifts out and grows: where checks lit, and of which kind
// Frames are data/film.json (tools/film-sim.py, a seeded Stim simulation),
// consecutive rounds from the middle of the run; nothing is hand-picked.
import { mountFigure, svgRoot, g, h, rect, circle, stage, clamp, ease } from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 3;
export const durations = { large: [2.6, 1.6, 2.2] };
const SIZE = { wide: [720, 430], tall: [360, 350] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

// the part of the hero shown (in the hero's own pixels, 1536 × 1024)
const CROP = { wide: [150, 330, 1300, 694], tall: [300, 640, 640, 340] };   // x, y, w, h
const SPLIT = 560;      // the hero's x where the ordinary computer's half begins
// where the frames sit on the cable (hero pixels): its straighter stretches
const SLOTS = [[395, 888], [450, 876], [620, 880], [672, 868], [790, 908], [842, 902]];
const FRAME = 46;       // a frame's side, hero pixels
const INK = '#2a2a2a';  // the hero's line, measured: near-black, about 2.2 hero px

function build(el, ctx) {
  const print = !!ctx.print, tall = !print && ctx.layout === 'tall';
  floor(tall ? 13 : 0);
  const C = pal(ctx), d = ctx.data, run = d.runs[0];
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const [cx0, cy0, cw, ch] = CROP[tall ? 'tall' : 'wide'];
  const k = W / cw;
  const X = (x) => (x - cx0) * k, Y = (y) => (y - cy0) * k + (tall ? 128 : 6);
  const art = (n) => new URL(`../art/${n}`, import.meta.url).href;
  const svg = svgRoot(el, W, H,
    `The opening drawing's cable, from the quantum computer to an ordinary computer, carries a row of small frames. Each frame is one round of the chip's ${d.checks_d7.value} checks, with the few that changed lit. About ninety thousand frames pass in one blink. One frame, enlarged, shows where checks lit and of which kind; nothing in it says which qubits were hit.`);
  svg.style.color = C.ink;
  const st = stage();
  const uid = `f${Math.random().toString(36).slice(2, 7)}`;
  const defs = h('defs', {}, svg);

  // the hero, in two halves: the quantum computer's, and the ordinary computer's
  const half = (x0, x1, id) => {
    const cp = h('clipPath', { id: `${uid}${id}` }, defs);
    h('rect', { x: X(x0), y: 0, width: X(x1) - X(x0), height: H }, cp);
    const grp = g(svg, { 'clip-path': `url(#${uid}${id})` });
    for (const n of ['hero-field.png', 'hero-line.png']) h('image', { href: art(n), x: X(0), y: Y(0), width: 1536 * k, height: 1024 * k }, grp);
    return grp;
  };
  // the whole hero stands from the start; step 1 dims it, so only the film is left in full ink
  const hc = h('clipPath', { id: `${uid}h` }, defs);
  h('rect', { x: 0, y: Y(cy0), width: W, height: ch * k }, hc);
  const heroG = g(svg, { 'clip-path': `url(#${uid}h)` });
  for (const n of ['hero-field.png', 'hero-line.png']) h('image', { href: art(n), x: X(0), y: Y(0), width: 1536 * k, height: 1024 * k }, heroG);
  void half; void SPLIT;

  // the checks' positions inside a frame, from Stim's coordinates
  const xs = run.checks.map((c) => c.x), ys = run.checks.map((c) => c.y);
  const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
  const place = (c, x, y, s) => [x + 0.14 * s + ((c.x - mnx) / (mxx - mnx)) * 0.72 * s, y + 0.14 * s + ((c.y - mny) / (mxy - mny)) * 0.72 * s];
  const mark = (parent, kind, x, y, r) => (kind === 'Z'
    ? circle(parent, x, y, r, { fill: C.accent })
    : circle(parent, x, y, r * 0.86, { fill: 'none', stroke: C.accent, 'stroke-width': Math.max(1, r * 0.55) }));

  // the frames on the cable: fixed places, their contents tick along
  const START = 10;                         // the first round shown, from the middle of the run
  const s = FRAME * k;
  const slots = SLOTS.map(([hx, hy], i) => {
    const x = X(hx) - s / 2, y = Y(hy) - s / 2;
    const grp = g(svg);
    rect(grp, x, y, s, s, { fill: '#FBFBFC', stroke: INK, 'stroke-width': 1.1, rx: 1.5 });
    const dots = g(grp);
    return { grp, dots, x, y, shown: -1, onRight: hx >= SPLIT, i };
  });
  const fill = (slot, round) => {
    if (slot.shown === round) return;
    slot.shown = round;
    slot.dots.replaceChildren();
    const frame = run.frames[((round % run.frames.length) + run.frames.length) % run.frames.length];
    for (const id of frame) { const c = run.checks[id]; const [px, py] = place(c, slot.x, slot.y, s); mark(slot.dots, c.kind, px, py, Math.max(1.3, s * 0.07)); }
  };
  // how many ticks the film has moved at step 0's time t: slow, then faster
  // and faster (a film gate, not a glide), ending on the same frames as it
  // starts plus TICKS
  const TICKS = 24;
  const ticks = (t) => Math.floor(TICKS * Math.pow(clamp(t), 2.6) + 1e-9);

  // step 0's line, then step 1's, then the lifted frame with its line
  const L = (str, x, y, anchor = 'start') => { const lg = g(svg); text(lg, x, y, str, { family: 'sans', size: tall ? 13 : 14, anchor }); return lg; };
  const l0 = L('about ninety thousand frames in one blink', tall ? 12 : X(cx0) + 18, tall ? H - 10 : Y(1000) + 2);
  const l1 = L('all that comes out of it', tall ? 12 : X(1290), tall ? H - 10 : Y(1000) + 2, tall ? 'start' : 'end');

  // the lifted frame: the same frame as the one on the cable it comes from
  const from = slots[1];
  const big = tall ? { x: 16, y: 6, s: 118 } : { x: X(700), y: Y(345), s: 250 * k * 1.15 };
  const lift = g(svg);
  rect(lift, big.x, big.y, big.s, big.s, { fill: '#FBFBFC', stroke: INK, 'stroke-width': 1.3, rx: 2 });
  for (const c of run.checks) { const [px, py] = place(c, big.x, big.y, big.s); circle(lift, px, py, Math.max(1.3, big.s * 0.012), { fill: C.muted, opacity: 0.45 }); }
  const liftDots = g(lift);
  const keyX = tall ? big.x + big.s + 16 : big.x, keyY = tall ? big.y + 40 : big.y + big.s + 18;
  const key = g(lift);
  const lh = tall ? 17 : 19;
  mark(key, 'Z', keyX + 5, keyY - 4, 4.2);
  text(key, keyX + 14, keyY, 'a flip-check lit', { family: 'sans', size: tall ? 12.5 : 13 });
  mark(key, 'X', keyX + 5, keyY + lh - 4, 4.2);
  text(key, keyX + 14, keyY + lh, 'a phase-check lit', { family: 'sans', size: tall ? 12.5 : 13 });

  st.on((gg) => {
    // gg runs 0..3 across the steps
    const t0 = clamp(gg), n = ticks(t0);
    for (const slot of slots) fill(slot, START + n - slot.i);
    // step 1: the ordinary computer's half, and the frames on it
    const p1 = ease(clamp(gg - 1));
    const dim = 1 - 0.62 * p1;
    heroG.style.opacity = dim >= 0.999 ? '' : dim.toFixed(3);
    // step 2: the lifted frame grows out of the second frame on the cable
    const p2 = ease(clamp((gg - 2) / 0.7));
    const round = START + TICKS - from.i;
    if (lift.dataset.round !== String(round)) {
      lift.dataset.round = String(round);
      liftDots.replaceChildren();
      for (const id of run.frames[round % run.frames.length]) { const c = run.checks[id]; const [px, py] = place(c, big.x, big.y, big.s); mark(liftDots, c.kind, px, py, Math.max(2.6, big.s * 0.03)); }
    }
    lift.style.display = p2 <= 0.001 ? 'none' : '';
    from.dots.style.opacity = p2 > 0.001 ? '0' : '';      // its points have lifted out; the slot stays, empty
    const sc = (from.x + s / 2) + (big.x + big.s / 2 - from.x - s / 2) * p2, sy = (from.y + s / 2) + (big.y + big.s / 2 - from.y - s / 2) * p2;
    const z = (s + (big.s - s) * p2) / big.s;
    lift.setAttribute('transform', p2 >= 0.999 ? '' : `translate(${sc.toFixed(2)} ${sy.toFixed(2)}) scale(${z.toFixed(4)}) translate(${(-(big.x + big.s / 2)).toFixed(2)} ${(-(big.y + big.s / 2)).toFixed(2)})`);
    key.style.opacity = String(clamp((gg - 2.7) / 0.3));
  });
  st.fade(l0, 0.15, 0.45, tall ? [1.05, 1.3] : undefined);   // on a phone the two lines share one place
  st.fade(l1, 1.35, 1.75);

  return { set: (step, t) => st.set(step, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
