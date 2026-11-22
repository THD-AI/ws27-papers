// film: what leaves a quantum computer, drawn as the opening drawing's cable.
// Two forge drawings in the hand of the hero, both split into layers:
//   art/film-line.png, art/film-field.png  board film-cable r2 c1: the lower
//     refrigerator and the two servers, whole, joined by a wide strip of film
//     with five frames;
//   art/film-frame.png  board film-frame r1 c1: one frame of that strip, alone.
// Code adds only data: in each drawn frame, the checks of one round whose
// answer changed since the round before, lit.
//   step 0  the frames' contents advance frame by frame on a quickening beat
//   step 1  the colour field fades: the strip is all that leaves
//   step 2  one frame is held up, enlarged; its place in the strip goes empty
// Frames: data/film.json (tools/film-sim.py, a seeded Stim simulation). The
// rounds shown are chosen by a rule, below, not by eye.
import { mountFigure, svgRoot, g, h, circle, stage, clamp, ease } from '../../../lib/fig.js';
import { pal, text, floor } from './shared.js';

export const steps = 3;
export const durations = { large: [2.6, 1.4, 2.2] };
const SIZE = { wide: [720, 488], tall: [360, 300] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

const IMG = [1536, 1024];
const CROP = [0, 230, 1536, 610];        // the drawing's part shown: x, y, w, h (its own pixels)
// the five drawn frames: centre and inner size, read off the drawing's enclosed cells
const FR = [[384, 690, 122, 77], [508, 676, 130, 97], [642, 658, 133, 91], [784, 650, 144, 79], [909, 655, 101, 71]];
const BIG = { img: 1024, cx: 505, cy: 521, w: 690, h: 616 };   // the lifted frame's inner cell

function build(el, ctx) {
  const print = !!ctx.print, tall = !print && ctx.layout === 'tall';
  floor(tall ? 13 : 0);
  const C = pal(ctx), d = ctx.data, run = d.runs[0];
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const k = W / CROP[2];
  const bigS = tall ? 118 : 160;                     // the lifted frame's drawn size
  const top = bigS + (tall ? 10 : 14);               // the drawing starts below it
  const X = (x) => (x - CROP[0]) * k, Y = (y) => (y - CROP[1]) * k + top;
  const art = (n) => new URL(`../art/${n}`, import.meta.url).href;
  const svg = svgRoot(el, W, H,
    `A quantum computer's refrigerator and two ordinary servers, joined by a strip of film. Each frame is one round of the chip's ${d.checks_d7.value} checks, with the few whose answer changed lit. About ninety thousand frames pass in one blink. One frame, held up, shows where checks lit and of which kind; nothing in it says which qubits were hit.`);
  svg.style.color = C.ink;
  const st = stage();

  const field = h('image', { href: art('film-field.png'), x: X(0), y: Y(0), width: IMG[0] * k, height: IMG[1] * k }, svg);
  h('image', { href: art('film-line.png'), x: X(0), y: Y(0), width: IMG[0] * k, height: IMG[1] * k }, svg);

  // which rounds: the first stretch (after round 0) whose frames light about
  // as many checks as the whole run does, so the strip shows a typical stretch
  const mean = run.lit_per_frame_mean, need = FR.length + 10;
  let START = 1;
  for (let s = 1; s + need < run.frames.length; s++) {
    const m = run.frames.slice(s, s + FR.length).reduce((a, f) => a + f.length, 0) / FR.length;
    if (Math.abs(m - mean) <= 0.1 * mean) { START = s; break; }
  }
  // a check's place inside a frame: Stim's x across the frame, y down it
  const xs = run.checks.map((c) => c.x), ys = run.checks.map((c) => c.y);
  const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
  const inCell = (c, cx, cy, w, hh) => [cx + ((c.x - mnx) / (mxx - mnx) - 0.5) * w * 0.74, cy + ((c.y - mny) / (mxy - mny) - 0.5) * hh * 0.7];
  const colour = (kind) => (kind === 'Z' ? C.accent : C.ink);
  const R = tall ? 2 : 3;
  const dotsFor = (parent, round, cx, cy, w, hh, r) => {
    const frame = run.frames[round % run.frames.length];
    const placed = [];
    for (const id of frame) {
      const c = run.checks[id];
      const [px, py] = inCell(c, cx, cy, w, hh);
      if (placed.some(([qx, qy]) => Math.hypot(qx - px, qy - py) < r * 1.6)) continue;   // never two dots in one blob
      placed.push([px, py]);
      circle(parent, px, py, r, { fill: colour(c.kind) });
    }
  };

  // the beat: frames advance by whole frames, slowly first, then quicker, at
  // most about six a second; nothing is ever drawn between two frames
  const BEATS = [];
  { let t = 0.06; for (let i = 0; i < 9; i++) { BEATS.push(t); t += 0.155 - (0.09 * i) / 8; } }
  const beatsAt = (t) => BEATS.filter((b) => b <= t).length;
  const cells = FR.map(() => g(svg));
  let shown = -1;
  const setBeat = (n) => {
    if (n === shown) return;
    shown = n;
    FR.forEach(([fx, fy, fw, fh], i) => {
      cells[i].replaceChildren();
      dotsFor(cells[i], START + n + (FR.length - 1 - i), X(fx), Y(fy), fw * k, fh * k, R);
    });
  };

  // the lettering: one line a step; the two machines named once, small
  const L = (str, x, y, anchor = 'start', o = {}) => { const lg = g(svg); text(lg, x, y, str, { family: 'sans', size: tall ? 13 : 14, anchor, ...o }); return lg; };
  const ly = H - (tall ? 6 : 8);
  const nameO = { size: tall ? 12 : 13, fill: C.muted };
  L('a quantum computer', X(60), Y(312), 'start', nameO);
  L('an ordinary computer', X(1480), Y(318), 'end', nameO);
  const l0 = L('about ninety thousand frames in one blink', tall ? 10 : 14, ly);
  const l1 = L('all that leaves: each check’s answer, every round', tall ? 10 : 14, ly);

  // step 2: one frame held up, enlarged, in the strip's own pen
  const FROM = 1;
  const bx = tall ? 10 : X(560), by = 2;
  const lift = g(svg);
  h('image', { href: art('film-frame.png'), x: bx, y: by, width: bigS, height: bigS }, lift);
  const bk = bigS / BIG.img, bcx = bx + BIG.cx * bk, bcy = by + BIG.cy * bk;
  const grid = g(lift);
  for (const c of run.checks) { const [px, py] = inCell(c, bcx, bcy, BIG.w * bk, BIG.h * bk); circle(grid, px, py, 1.3, { fill: C.muted, opacity: 0.35 }); }
  const liftDots = g(lift);
  const note = g(svg);
  const nx = bx + bigS + (tall ? 10 : 14), ns = tall ? 12.5 : 13.5;
  text(note, nx, by + 22, 'one frame: the checks whose', { family: 'sans', size: ns });
  text(note, nx, by + 22 + ns * 1.35, 'answer changed since', { family: 'sans', size: ns });
  text(note, nx, by + 22 + ns * 2.7, 'the round before', { family: 'sans', size: ns });
  circle(note, nx + 4, by + 22 + ns * 4.4 - 4, 3.6, { fill: C.accent });
  text(note, nx + 13, by + 22 + ns * 4.4, 'a check on flips', { family: 'sans', size: ns });
  circle(note, nx + 4, by + 22 + ns * 5.75 - 4, 3.6, { fill: C.ink });
  text(note, nx + 13, by + 22 + ns * 5.75, 'a check on phase errors', { family: 'sans', size: ns });

  let liftRound = -1;
  st.on((gg) => {
    const n = gg >= 1 ? BEATS.length : beatsAt(gg);
    setBeat(n);
    // step 1: the colour field fades; the line stays in full ink
    const p1 = ease(clamp(gg - 1)), fo = 1 - 0.75 * p1;
    field.style.opacity = fo >= 0.999 ? '' : fo.toFixed(3);
    // step 2: the frame is held up; its place in the strip goes empty
    const p2 = ease(clamp((gg - 2) / 0.7));
    const round = START + BEATS.length + (FR.length - 1 - FROM);
    if (round !== liftRound) { liftRound = round; liftDots.replaceChildren(); dotsFor(liftDots, round, bcx, bcy, BIG.w * bk, BIG.h * bk, tall ? 4 : 5); }
    lift.style.display = p2 <= 0.001 ? 'none' : '';
    lift.style.opacity = p2 >= 0.999 ? '' : p2.toFixed(3);
    lift.setAttribute('transform', p2 >= 0.999 ? '' : `translate(0 ${(10 * (1 - p2)).toFixed(2)})`);
    cells[FROM].style.opacity = p2 > 0.001 ? String(1 - p2) : '';
    note.style.opacity = String(clamp((gg - 2.7) / 0.3));
  });
  st.fade(l0, 0.12, 0.42, [1.05, 1.3]);
  st.fade(l1, 1.35, 1.75);

  return { set: (step, t) => st.set(step, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
