// film: what leaves a quantum computer, drawn as the opening drawing's cable.
// Two forge drawings in the hand of the hero, both split into layers:
//   art/film-line.png, art/film-field.png  board film-cable r2 c1: the lower
//     refrigerator and the two servers, whole, joined by a wide strip of film
//     with five frames;
//   art/film-frame.png  board film-frame r1 c1: one frame of that strip, alone.
// Code adds only data, in the article's one grid language (shared.js): in
// each drawn frame of the strip, the checks of one round whose answer changed
// since the round before, as small accent squares over a faint ghost of the
// 48 check places; above the drawing, one frame enlarged: the distance-7 grid
// itself, drawn by grid() as the margin scene draws it, with the same round
// lit (figures/film-rule.js).
//   step 0  the enlarged frame comes in; the strip's frames advance frame by
//           frame on a quickening beat
//   step 1  the colour field fades: the strip is all that leaves
//   step 2  the enlarged frame is outlined as one of the strip's frames; the
//           two kinds of fired check are named
// Frames: data/film.json (tools/film-sim.py, a seeded Stim simulation). The
// rounds shown are chosen by a rule, below, not by eye.
import { mountFigure, svgRoot, g, h, circle, rect, path, leader, penRing, rng, stage, clamp, ease, idle } from '../../../lib/fig.js';
import { pal, text, floor, surface, grid } from './shared.js';
import { filmRounds, toGrid, BEATS as BEATS_N } from './film-rule.js';

export const steps = 3;
export const durations = { large: [3.0, 1.4, 1.5] };
const SIZE = { wide: [720, 624], tall: [360, 378] };
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
  const bigS = tall ? 220 : 322;                     // the enlarged frame's drawn size: its grid about as large as the margin's
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
  const R = tall ? 1.1 : 1.3;   // the least radius of a fired dot on the strip
  // every lit check is drawn, none merged, in one colour (fired); every dot
  // keeps a readable size and neighbours may touch
  const dotsFor = (parent, round, cx, cy, w, hh, rr) => {
    const frame = run.frames[roundAt(round)];
    for (const id of frame) {
      const c = run.checks[id];
      const [px, py] = inCell(c, cx, cy, w, hh);
      // the grid's own fired dot: 0.137 of the frame's pitch (two units)
      circle(parent, px, py, Math.max(rr, 0.274 * unit(w, hh)), { fill: C.accent });
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

  // the two machines named once, small, by hand, in Virgil (Excalidraw's
  // hand font, OFL)
  const L = (str, x, y, anchor = 'start', o = {}) => { const lg = g(svg); text(lg, x, y, str, { family: 'sans', size: tall ? 13 : 14, anchor, ...o }); return lg; };
  h('style', {}, svg).textContent = `@font-face { font-family: 'Virgil'; src: url('${art('film-virgil.woff2')}') format('woff2'); font-display: swap; }`;
  const nameO = { size: tall ? 13 : 15, fill: C.ink };
  for (const lg of [L('a quantum computer', X(tall ? 40 : 24), Y(tall ? 300 : 286), 'start', nameO), L('an ordinary computer', X(1480), Y(318), 'end', nameO)]) {
    for (const t of lg.querySelectorAll('text, tspan')) t.setAttribute('font-family', "'Virgil', 'Libre Franklin', sans-serif");
  }

  // One frame, enlarged, in the band above the drawing from the start: the
  // distance-7 grid as the margin scene draws it, with the same round lit, so
  // the picture the reader has just seen beside section 3 is here, in the
  // strip's own pen. Step 2 shows which frame of the strip it is, and names
  // the two kinds of fired check.
  const bx = tall ? 4 : X(336), by = tall ? 2 : 4;   // wide: its grid under the margin's at 1440 px
  // the frame and its label take over the margin's picture: on wide screens
  // they fade in as the margin fades out, with the scroll (--rail-away, set
  // by the page; 1 where there is no pinned margin)
  const takeover = g(svg);
  takeover.style.opacity = 'var(--rail-away, 1)';
  const big = g(takeover);
  h('image', { href: art('film-frame.png'), x: bx, y: by, width: bigS, height: bigS }, big);
  const bk = bigS / BIG.img, bcx = bx + BIG.cx * bk, bcy = by + BIG.cy * bk;
  // 7 qubits a side, the half tiles' bulge, and a pitch's gap to the drawn cell
  const pitch = (Math.min(BIG.w, BIG.h) * bk) / 8.2;
  const held = grid(big, { checks: surface(7), d: 7, cx: bcx, cy: bcy, pitch, C });
  // the picture it takes over from the margin (lib/article.js lines the two up)
  held.root.setAttribute('data-takeover', '');
  const HELD = START + BEATS.length + (FR.length - 1 - FROM);   // the rule's frame: both kinds, never empty
  const on = run.frames[roundAt(HELD)].map((id) => toGrid(run.checks[id], 7));
  const firedT = Object.values(held.tiles).filter((t) => on.some((c) => c.row === t.check.row && c.col === t.check.col && c.asks_about === t.check.asks_about));
  firedT.forEach((t) => t.setFired(1));

  const noteO = { italic: true, size: tall ? 13 : 14.5 };
  const nx = bx + bigS + (tall ? 8 : 16);
  const n0 = g(takeover);
  text(n0, nx, by + (tall ? 16 : 24), 'one round, enlarged', noteO);
  // step 2: the two kinds, each pointed at a fired check of that kind
  const pick = (kind) => firedT.filter((t) => t.check.asks_about === kind).sort((u, v) => u.c[1] - v.c[1])[0];
  const n2 = g(svg);
  // each note level with its tile, so its leader runs straight across
  const kinds = [['flips', 'fired: a flip nearby, or a wrong report (darker tile)'], ['phase errors', 'fired: a phase error nearby, or a wrong report (lighter tile)']]
    .map(([kind, str]) => ({ t: pick(kind), str })).filter((o) => o.t).sort((u, v) => u.t.c[1] - v.t.c[1]);
  let floorY = by + (tall ? 36 : 46);
  for (const { t, str } of kinds) {
    const ty = Math.max(floorY, t.c[1] + 4);
    // on phones the note column is narrow: the words wrap at fixed places
    const lines = tall ? str.replace('fired: a phase error nearby, or a wrong report (lighter tile)', 'fired: a phase error\nnearby, or a wrong\nreport (lighter tile)').replace('fired: a flip nearby, or a wrong report (darker tile)', 'fired: a flip nearby,\nor a wrong report\n(darker tile)') : str.replace(', or', ',\nor').replace(' (', '\n(');
    text(n2, nx, ty, lines, { ...noteO, lh: 16 });
    // the leader ends on its tile's edge with a small dot, level with it
    leader(n2, nx - 5, ty - 4, t.c[0] + pitch * 0.5, t.c[1], { stroke: C.muted, dot: true, dotR: 1.6 });
    floorY = ty + 56;
  }
  // step 2: its frame in the strip, ringed by the pen (the article's one hand
  // mark), and a drawn line up to the enlarged frame; on phones it bends round
  // the machine's name
  const [sx, sy, sw0, sh0] = FR[FROM];
  const slot = g(svg);
  const ring = penRing(slot, X(sx), Y(sy), (sw0 * k) / 2 + 6, (sh0 * k) / 2 + 6, { seed: 11, stroke: C.ink, width: 1.5 });
  // it ends on the frame's drawn lower edge (about 0.86 of the drawing down)
  const x0 = X(sx), y0 = Y(sy) - (sh0 * k) / 2 - 8, x1 = bcx + (tall ? 30 : 0), y1 = by + bigS * 0.86;
  const cxq = tall ? 222 : (x0 + x1) / 2 + (x1 - x0) * 0.18, cyq = (y0 + y1) / 2;
  // in the pen's hand, as the ring: a seeded wobble, and a second thinner
  // pass beside the first over part of its length
  const rnd = rng(23), N = 26, ph = rnd() * 6.28;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N, u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cxq + t * t * x1, y = u * u * y0 + 2 * u * t * cyq + t * t * y1;
    const dx = 2 * u * (cxq - x0) + 2 * t * (x1 - cxq), dy = 2 * u * (cyq - y0) + 2 * t * (y1 - cyq), l = Math.hypot(dx, dy) || 1;
    const w = Math.sin(t * 9 + ph) * 0.7 + (rnd() - 0.5) * 0.5;
    return [x - (dy / l) * w, y + (dx / l) * w, -dy / l, dx / l];
  });
  const line2 = (a, b, off) => pts.slice(a, b).map(([x, y, nx, ny], i) => `${i ? 'L' : 'M'}${(x + nx * off).toFixed(1)} ${(y + ny * off).toFixed(1)}`).join('');
  const join = path(slot, line2(0, N + 1, 0), { stroke: C.ink, 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' });
  const join2 = path(slot, line2(Math.round(N * 0.2), Math.round(N * 0.75), 0.9), { stroke: C.ink, 'stroke-width': 0.8, 'stroke-linecap': 'round', fill: 'none', opacity: 0.8 });

  // While step 0 is complete and the next has not begun, the film keeps
  // running on screen, about eight frames a second (idle motion: it changes
  // which rounds are shown, never what is true).
  let atRest = false, extra = 0, since = null;
  const run0 = idle(svg, ctx, (secs) => {
    if (!atRest) { since = null; return; }
    if (since === null) since = secs - extra / 8;
    const e = Math.floor((secs - since) * 8);
    if (e !== extra) { extra = e; setBeat(BEATS.length + extra); }
  });
  st.on((gg) => {
    // the film keeps running through step 1 and stops at step 2, on the frame held up
    atRest = gg >= 1 && gg < 2;
    if (gg < 1) extra = 0;
    const n = gg >= 2 ? BEATS.length : gg >= 1 ? BEATS.length + extra : beatsAt(gg);
    setBeat(n);
    // step 1: the colour field fades; the line stays in full ink
    // the wash is the hero's world, kept light from the start so that the only
    // full-strength blue on screen is a fired check
    const p1 = ease(clamp(gg - 1)), fo = 0.4 - 0.2 * p1;
    field.style.opacity = fo.toFixed(3);
  });
  ring.paths.forEach((pp, i) => st.draw(pp, 2.0 + i * 0.04, 2.3 + i * 0.03));
  st.draw(join, 2.25, 2.5);
  st.draw(join2, 2.32, 2.52);
  st.fade(n2, 2.3, 2.75);

  return { set: (step, t) => st.set(step, t), destroy() { run0.stop(); } };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
