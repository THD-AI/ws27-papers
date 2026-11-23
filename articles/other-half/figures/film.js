// film: what leaves a quantum computer, drawn as the opening drawing's cable.
// Two forge drawings in the hand of the hero, both split into layers:
//   art/film-line.png, art/film-field.png  board film-cable r2 c1: the lower
//     refrigerator and the two servers, whole, joined by a wide strip of film
//     with five frames;
//   art/film-frame.png  board film-frame r1 c1: one frame of that strip, alone.
// Code adds only data, in the article's one grid language (shared.js): in
// each drawn frame of the strip, the checks of one round whose answer changed
// since the round before, as accent points over a faint ghost of the 48 check
// places; the frame held up is the distance-7 grid itself, drawn by grid() as
// the margin scene draws it, with the same round lit (figures/film-rule.js).
//   step 0  the frames' contents advance frame by frame on a quickening beat
//   step 1  the colour field fades: the strip is all that leaves
//   step 2  one frame is held up, enlarged; its place in the strip goes empty
// Frames: data/film.json (tools/film-sim.py, a seeded Stim simulation). The
// rounds shown are chosen by a rule, below, not by eye.
import { mountFigure, svgRoot, g, h, circle, stage, clamp, ease, idle } from '../../../lib/fig.js';
import { pal, text, floor, surface, grid } from './shared.js';
import { filmRounds, toGrid, BEATS as BEATS_N } from './film-rule.js';

export const steps = 3;
export const durations = { large: [3.0, 1.4, 2.2] };
const SIZE = { wide: [720, 518], tall: [360, 304] };
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
  const bigS = tall ? 122 : 192;                     // the lifted frame's drawn size
  // the drawing starts below a band that holds the lifted frame and its key
  const top = bigS + (tall ? 12 : 14);
  const X = (x) => (x - CROP[0]) * k, Y = (y) => (y - CROP[1]) * k + top;
  const art = (n) => new URL(`../art/${n}`, import.meta.url).href;
  const svg = svgRoot(el, W, H,
    `A quantum computer's refrigerator and two ordinary servers, joined by a strip of film. Each frame is one round of the chip's ${d.checks_d7.value} checks, with the few whose answer changed lit. About ninety thousand frames pass in one blink. One frame, held up, shows where checks lit and of which kind; nothing in it says which qubits were hit.`);
  svg.style.color = C.ink;
  const st = stage();

  const field = h('image', { href: art('film-field.png'), x: X(0), y: Y(0), width: IMG[0] * k, height: IMG[1] * k }, svg);
  h('image', { href: art('film-line.png'), x: X(0), y: Y(0), width: IMG[0] * k, height: IMG[1] * k }, svg);

  // which rounds: by rule (figures/film-rule.js), shared with the margin
  // scene, which lights the same held-up round
  const NB = BEATS_N;
  const { start: START, from: FROM, last } = filmRounds(run, NB, FR.length);
  // rounds shown cycle through 1..last, never round 0 (half its checks can't fire)
  const roundAt = (r) => 1 + ((((r - 1) % last) + last) % last);
  // a check's place inside a frame: as on the article's grid (toGrid): Stim's
  // y down the frame, its x mirrored
  const xs = run.checks.map((c) => c.x), ys = run.checks.map((c) => c.y);
  const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
  // one scale for both axes, so the grid keeps its shape inside any cell
  const unit = (w, hh) => Math.min((w * 0.76) / (mxx - mnx), (hh * 0.76) / (mxy - mny));
  const inCell = (c, cx, cy, w, hh) => { const u = unit(w, hh); return [cx - (c.x - (mnx + mxx) / 2) * u, cy + (c.y - (mny + mxy) / 2) * u]; };
  const R = tall ? 2.6 : 3.2;
  // every lit check is drawn, none merged, in one colour (fired); every dot
  // keeps a readable size and neighbours may touch
  const dotsFor = (parent, round, cx, cy, w, hh, rr) => {
    const frame = run.frames[roundAt(round)];
    for (const id of frame) {
      const c = run.checks[id];
      const [px, py] = inCell(c, cx, cy, w, hh);
      circle(parent, px, py, rr, { fill: C.accent, stroke: '#FBFBFC', 'stroke-width': Math.max(0.6, rr * 0.28) });
    }
  };
  // the 48 places a check can light, very faint, in every frame of the strip
  FR.forEach(([fx, fy, fw, fh]) => {
    const gg = g(svg, { opacity: 0.4 });
    for (const c of run.checks) { const [px, py] = inCell(c, X(fx), Y(fy), fw * k, fh * k); circle(gg, px, py, tall ? 0.7 : 0.9, { fill: C.muted }); }
  });

  // the beat: frames advance by whole frames, slowly first, then quicker, at
  // most about six a second; nothing is ever drawn between two frames
  const BEATS = [];
  { let t = 0.36; for (let i = 0; i < NB; i++) { BEATS.push(t); t += 0.12 - (0.085 * i) / (NB - 1); } }
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
  // the two machines are named by hand, in Virgil (Excalidraw's hand font, OFL)
  h('style', {}, svg).textContent = `@font-face { font-family: 'Virgil'; src: url('${art('film-virgil.woff2')}') format('woff2'); font-display: swap; }`;
  const nameO = { size: tall ? 13 : 15, fill: C.ink };
  for (const lg of [L('a quantum computer', X(60), Y(312), 'start', nameO), L('an ordinary computer', X(1480), Y(318), 'end', nameO)]) {
    for (const t of lg.querySelectorAll('text, tspan')) t.setAttribute('font-family', "'Virgil', 'Libre Franklin', sans-serif");
  }
  const l0 = L('about ninety thousand frames in one blink', tall ? 10 : 14, ly);
  const l1 = L(tall ? 'all that leaves: each check’s answer, every\nround, drawn where it changed' : 'all that leaves: each check’s answer, every round, drawn where it changed', tall ? 10 : 14, tall ? ly - 15 : ly, 'start', tall ? { lh: 15 } : {});

  // step 2: one frame held up, enlarged, in the strip's own pen
  const bx = tall ? 8 : X(560), by = tall ? 2 : 4;
  const lift = g(svg);
  const pk = bigS / BIG.img;
  h('rect', { x: bx + (BIG.cx - BIG.w / 2) * pk, y: by + (BIG.cy - BIG.h / 2) * pk, width: BIG.w * pk, height: BIG.h * pk, fill: '#FBFBFC' }, lift);
  h('image', { href: art('film-frame.png'), x: bx, y: by, width: bigS, height: bigS }, lift);
  const bk = bigS / BIG.img, bcx = bx + BIG.cx * bk, bcy = by + BIG.cy * bk;
  // the distance-7 grid, as the margin scene draws it: 7 qubits a side plus
  // the half tiles' bulge, inside the drawn cell
  const pitch = (Math.min(BIG.w, BIG.h) * bk * 0.9) / 7;
  const held = grid(lift, { checks: surface(7), d: 7, cx: bcx, cy: bcy, pitch, C, helper: 0 });
  const note = g(svg);
  const nx = bx + bigS + (tall ? 8 : 14), ns = tall ? 11.5 : 13.5, ny = by + (tall ? 16 : 26);
  text(note, nx, ny, 'one frame, held up:', { family: 'sans', size: ns, weight: 600 });
  text(note, nx, ny + ns * 1.35, 'the grid of distance 7,', { family: 'sans', size: ns });
  text(note, nx, ny + ns * 2.7, 'one round', { family: 'sans', size: ns });
  // the key: the grid's own tiles, small
  const sw = ns * 0.95;
  const swatch = (y, kind) => {
    const k1 = grid(note, { checks: [{ asks_about: kind === 'fired' ? 'flips' : kind, shape: 'square', qubits: [0, 1, 2, 3] }], d: 2, cx: nx + sw / 2, cy: y - sw * 0.32, pitch: sw, C, helper: 0, qr: 0.01 });
    if (kind === 'fired') Object.values(k1.tiles)[0].setFired(1);
  };
  const kx = nx + sw + 7, k0 = ny + ns * 4.3;
  swatch(k0, 'fired'); text(note, kx, k0, 'fired this round', { family: 'sans', size: ns });
  swatch(k0 + ns * 1.5, 'flips'); text(note, kx, k0 + ns * 1.5, 'a check on flips', { family: 'sans', size: ns });
  swatch(k0 + ns * 3, 'phase errors'); text(note, kx, k0 + ns * 3, 'a check on phase errors', { family: 'sans', size: ns });

  // While step 0 is complete and the next has not begun, the film keeps
  // running on screen, about five frames a second (idle motion: it changes
  // which rounds are shown, never what is true).
  let atRest = false, extra = 0, since = null;
  const run0 = idle(svg, ctx, (secs) => {
    if (!atRest) { since = null; return; }
    if (since === null) since = secs - extra / 8;
    const e = Math.floor((secs - since) * 8);
    if (e !== extra) { extra = e; setBeat(BEATS.length + extra); }
  });
  let liftRound = -1;
  st.on((gg) => {
    // the film keeps running through step 1 and stops when a frame is held up
    atRest = gg >= 1 && gg < 2;
    if (gg < 1) extra = 0;
    const n = gg >= 2 ? BEATS.length : gg >= 1 ? BEATS.length + extra : beatsAt(gg);
    setBeat(n);
    // step 1: the colour field fades; the line stays in full ink
    const p1 = ease(clamp(gg - 1)), fo = 1 - 0.75 * p1;
    field.style.opacity = fo >= 0.999 ? '' : fo.toFixed(3);
    // step 2: the frame is held up; its place in the strip goes empty
    const p2 = ease(clamp((gg - 2) / 0.7));
    const round = START + BEATS.length + (FR.length - 1 - FROM);   // the rule's frame: both kinds, never empty
    if (round !== liftRound) {
      liftRound = round;
      const on = run.frames[roundAt(round)].map((id) => toGrid(run.checks[id], 7));
      for (const t of Object.values(held.tiles)) t.setFired(on.some((c) => c.row === t.check.row && c.col === t.check.col && c.asks_about === t.check.asks_about) ? 1 : 0);
    }
    // one object: the frame leaves its slot and grows into the band
    lift.style.display = p2 <= 0.001 ? 'none' : '';
    const [sx, sy, sw] = FR[FROM], z = (sw * k) / (BIG.w * bk) + (1 - (sw * k) / (BIG.w * bk)) * p2;
    const tx = X(sx) + (bcx - X(sx)) * p2, ty = Y(sy) + (bcy - Y(sy)) * p2;
    lift.setAttribute('transform', p2 >= 0.999 ? '' : `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${z.toFixed(4)}) translate(${(-bcx).toFixed(2)} ${(-bcy).toFixed(2)})`);
    cells[FROM].style.opacity = p2 > 0.001 ? '0' : '';
    note.style.opacity = String(clamp((gg - 2.7) / 0.3));
  });
  st.fade(l0, 0.12, 0.42, [1.05, 1.3]);
  st.fade(l1, 1.35, 1.75);

  return { set: (step, t) => st.set(step, t), destroy() { run0.stop(); } };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
