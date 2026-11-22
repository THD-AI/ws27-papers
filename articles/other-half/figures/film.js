// film: what the decoder gets. Two rows in time on the smallest grid: above,
// the chip, with the errors that nobody reads directly; below, a dark strip of
// film, one frame per round, where a check lights only in the round its answer
// changes. The strip runs into the decoder. The last step lifts one frame out
// and shows two different stories behind the same lights. Everything from
// data/film.json (tools/film-data.mjs), the drawn lines included.
import { mountFigure, svgRoot, g, h, rect, circle, line, path, stage } from '../../../lib/fig.js';
import { pal, tile, errMark, text, floor } from './shared.js';

export const steps = 7;
// seconds each step plays once triggered: the setting; a flip; a dark frame;
// a phase error; a check that misreports (two frames, the strip moves on);
// only the film is left; one frame and its two stories
export const durations = { large: [2.2, 1.4, 1.2, 1.4, 1.8, 1.6, 2.4] };
const SIZE = { wide: [720, 470], tall: [360, 440] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

// when (in step units) each round's frames come in; the strip moves on by whole frames
const REVEAL = [0, 1.25, 2.25, 3.25, 4.2, 4.6];
const FILM = { strip: '#24211E', frame: '#2F2B27', edge: '#6A6258', dot: '#8A8178', flip: '#D4471A', phase: '#2E9C91' };

function build(el, ctx) {
  const tall = ctx.layout === 'tall';
  floor(tall ? 13.8 : 12.45);
  const C = pal(ctx), d = ctx.data, L = d.layout[tall ? 'tall' : 'wide'], P = d.pen[tall ? 'tall' : 'wide'];
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const lattice = d.lattice_checks;
  const svg = svgRoot(el, W, H,
    'The smallest grid over six rounds. Above, the chip: a flip in the middle in round 2, a phase error in the corner in round 4. '
    + 'Below, the film that comes out: the two checks beside the flip light in round 2 only; round 3 is dark although the flip is still there; '
    + 'one check lights for the phase error in round 4; one check misreports and lights in rounds 5 and 6 though nothing happened. '
    + 'The decoder gets only the film. The same two lights also fit two flips above and below the middle, which would leave the stored value the other way round.');
  svg.style.color = C.ink;
  const st = stage();
  const noteO = { italic: true, size: tall ? 13 : 14 };
  const mono = { family: 'mono', size: tall ? 11 : 12, fill: C.muted };
  const pen = (parent, dd) => path(parent, dd, { fill: C.ink, stroke: 'none', 'data-audit': 'skip' });
  const [wx0, wx1] = L.win, half = L.stripH / 2, s = L.pitch;

  // ---- titles and row labels ---------------------------------------------------
  const main = g(svg);
  if (tall) {
    text(main, 16, 18, 'the decoder never sees an error,', { family: 'sans', size: 13, weight: 600 });
    text(main, 16, 35, 'only the lights it leaves', { family: 'sans', size: 13, weight: 600 });
  } else text(main, 16, 18, 'the decoder never sees an error, only the lights it leaves', { family: 'sans', size: 13, weight: 600 });
  const bandTop = tall ? L.chipY - 52 : L.chipY - 58, bandH = tall ? 98 : 116;
  const labA = tall ? [16, bandTop - 8] : [16, L.chipY - 8], labB = tall ? [16, L.stripY - half - 8] : [16, L.stripY - 8];
  text(main, labA[0], labA[1], 'on the chip', { size: tall ? 14 : 15 });
  text(main, labA[0] + (tall ? 92 : 0), labA[1] + (tall ? 0 : 19), 'nobody reads it directly', { ...noteO, size: 13, fill: C.muted, width: tall ? 240 : 116 });
  text(main, labB[0], labB[1], 'what comes out', { size: tall ? 14 : 15 });
  text(main, labB[0] + (tall ? 112 : 0), labB[1] + (tall ? 0 : 19), 'a film of lights', { ...noteO, size: 13, fill: C.muted });

  // ---- the window both rows move in ---------------------------------------------
  const clipId = `film-clip-${tall ? 't' : 'w'}-${Math.round(Math.random() * 1e6)}`;
  const cp = h('clipPath', { id: clipId }, h('defs', null, svg));
  rect(cp, wx0 - 6, 0, wx1 - wx0 + 12, H);
  const chipBand = rect(main, wx0 - 6, bandTop, wx1 - wx0 + 12, bandH, { rx: 6, fill: C.ink, 'fill-opacity': 0.045 });
  const stripEnd = tall ? wx1 + 4 : L.box[0] + 6;
  rect(main, wx0 - 6, L.stripY - half, stripEnd - wx0 + 6, L.stripH, { fill: FILM.strip });
  const chipRow = g(main, { 'clip-path': `url(#${clipId})` });
  const filmRow = g(main, { 'clip-path': `url(#${clipId})` });
  // perforations: cut by a machine, so exact, but each a little different, as on real film
  for (let x = wx0 - 4, k = 0; x < stripEnd - 6; x += 14.5, k++) {
    const w = 6.6 + ((k * 7) % 5) * 0.12, hh = (tall ? 7.6 : 8.4) + ((k * 3) % 4) * 0.15;
    rect(main, x, L.stripY - half + 6, w, hh, { rx: 1.5, fill: C.paper, 'fill-opacity': 0.82 });
    rect(main, x + 0.2, L.stripY + half - 6 - hh, w, hh, { rx: 1.5, fill: C.paper, 'fill-opacity': 0.82 });
  }
  pen(main, P.stripTop); pen(main, P.stripBottom);

  // ---- one frame of the grid -----------------------------------------------------
  function frame(parent, cx, cy, sz, { lit = [], errors = [], dark }) {
    const grp = g(parent);
    const pos = (q) => [cx + ((q % 3) - 1) * sz, cy + (Math.floor(q / 3) - 1) * sz];
    for (const ch of lattice) {
      const t = tile(ch, pos), on = lit.includes(ch.id), flip = ch.id[0] === 'z';
      const col = flip ? FILM.flip : FILM.phase;
      path(grp, t.d, on
        ? { fill: col, stroke: col, 'stroke-width': 1, 'stroke-linejoin': 'round' }
        : { stroke: dark ? FILM.edge : C.muted, 'stroke-opacity': dark ? 1 : 0.55, 'stroke-width': 0.9, 'stroke-linejoin': 'round', fill: !dark && flip ? C.ink : 'none', 'fill-opacity': !dark && flip ? 0.06 : null });
    }
    for (let q = 0; q < 9; q++) {
      const [x, y] = pos(q), e = errors.find((er) => er.qubit === q);
      if (e) errMark(grp, x, y, sz * 0.37, e.kind, C, 'real');
      else circle(grp, x, y, sz * 0.09, dark ? { fill: FILM.dot } : { fill: C.paper, stroke: C.ink, 'stroke-width': 1 });
    }
    return grp;
  }

  // ---- the rounds ------------------------------------------------------------------
  const nVis = L.visible;
  const offAt = (gg) => { let n = 0; d.rounds.forEach((r, i) => { if (gg >= REVEAL[i] && i + 1 > nVis + n) n = i + 1 - nVis; }); return n; };
  const cols = d.rounds.map((r, i) => {
    const colA = g(chipRow), colB = g(filmRow);
    frame(colA, 0, L.chipY, s, { errors: r.errors_present });
    if (r.new_error) circle(colA, (r.new_error.qubit % 3 - 1) * s, L.chipY + (Math.floor(r.new_error.qubit / 3) - 1) * s, s * 0.5, { fill: 'none', stroke: C.ink, 'stroke-width': 1, 'stroke-dasharray': '2 2.5' });
    text(colA, 0, tall ? bandTop + 16 : L.chipY - 66, `round ${r.round}`, { ...mono, anchor: 'middle' });
    rect(colB, -L.fw / 2 + 6, L.stripY - half + (tall ? 19 : 22), L.fw - 12, L.stripH - (tall ? 38 : 44), { rx: 3, fill: FILM.frame });
    frame(colB, 0, L.stripY, s, { lit: r.lit, dark: true });
    if (r.new_error && !tall) line(colA, 0, L.chipY + s * 1.9, 0, L.stripY - half - 2, { stroke: C.muted, 'stroke-width': 1, 'stroke-dasharray': '1.5 4', 'data-audit': 'skip' });
    return { colA, colB, i };
  });
  st.on((gg) => {
    const off = offAt(gg);
    for (const c of cols) {
      const tr = `translate(${(wx0 + (c.i - off) * L.fw + L.fw / 2).toFixed(1)} 0)`;
      if (c.colA.getAttribute('transform') !== tr) { c.colA.setAttribute('transform', tr); c.colB.setAttribute('transform', tr); }
      const on = gg >= REVEAL[c.i] ? '' : 'none';
      if (c.colA.style.display !== on) { c.colA.style.display = on; c.colB.style.display = on; }
    }
  });

  // ---- the decoder ---------------------------------------------------------------
  const [bx0, by0, bx1, by1] = L.box, bcx = (bx0 + bx1) / 2, bcy = (by0 + by1) / 2;
  const box = g(main);
  for (const dd of P.box) pen(box, dd);
  if (P.arrow) for (const dd of P.arrow) pen(box, dd);
  const boxA = g(box), boxB = g(box);
  if (tall) {
    text(boxA, bcx, bcy + 5, 'decoder', { size: 16, anchor: 'middle' });
    text(boxB, bcx, bcy + 5, 'decoder: it gets only the film', { size: 15, anchor: 'middle' });
  } else {
    text(box, bcx, bcy - 26, 'decoder', { size: 17, anchor: 'middle' });
    text(boxA, bcx, bcy - 4, 'on an ordinary computer', { ...noteO, size: 12.5, fill: C.muted, anchor: 'middle', width: 104 });
    text(boxB, bcx, bcy - 4, 'gets only the film, and guesses the likeliest story', { ...noteO, size: 12.5, anchor: 'middle', width: 106 });
  }
  st.fade(boxA, -1, 0, [5, 5.2]).fade(boxB, 5.1, 5.35);

  // ---- notes on the frames ---------------------------------------------------------
  // the mark sits on its frame; on a phone the words go in one place, beside the arrow
  const xOf = (round, gg) => wx0 + (round - 1 - offAt(gg)) * L.fw + L.fw / 2;
  const nY = L.notesY, nX = (x) => (tall ? 56 : x), nA = tall ? 'start' : 'middle', nW = tall ? 288 : 210;
  const note = (lines, a, b, out, mark) => {
    const grp = g(main);
    if (mark) mark(grp);
    lines.forEach((ln, k) => text(grp, nX(ln.x), nY + k * 18, ln.t, { ...noteO, anchor: nA, width: nW, fill: ln.muted ? C.muted : undefined }));
    st.fade(grp, a, b, out);
  };
  note([{ x: xOf(2, 1.4), t: 'a flip: the two checks beside it light' }], 1.45, 1.7, [2.25, 2.4]);
  note([{ x: xOf(3, 2.5), t: 'no change, no light:' }, { x: xOf(3, 2.5), t: 'the flip is still there', muted: true }], 2.35, 2.6, [3.25, 3.4],
    (grp) => pen(g(grp, { transform: `translate(${xOf(3, 2.5)} ${L.stripY + half + (tall ? 15 : 20)})` }), P.tick));
  note([{ x: xOf(4, 3.4), t: 'a phase error: the other kind of check' }], 3.45, 3.7, [4.2, 4.3]);
  note(tall ? [{ x: 0, t: 'a check misreports: it lights twice, though nothing changed' }]
    : [{ x: (xOf(5, 4.7) + xOf(6, 4.7)) / 2, t: 'a check misreports: it lights twice,' }, { x: (xOf(5, 4.7) + xOf(6, 4.7)) / 2, t: 'though nothing on the chip changed' }],
  4.7, 4.95, [5, 5.15], (grp) => pen(g(grp, { transform: `translate(${(xOf(5, 4.7) + xOf(6, 4.7)) / 2} ${L.stripY + half + (tall ? 10 : 12)})` }), P.bracket));

  // ---- key -------------------------------------------------------------------------
  const key = g(main), ky = L.keyY;
  if (tall) {
    rect(key, 16, ky - 10, 11, 11, { fill: FILM.flip }); text(key, 33, ky, 'checks for flips', { size: 13 });
    rect(key, 168, ky - 10, 11, 11, { fill: FILM.phase }); text(key, 185, ky, 'for phase errors', { size: 13 });
  } else {
    rect(key, 16, ky - 10, 11, 11, { fill: FILM.flip }); text(key, 33, ky, 'a check that watches for flips changed its answer', { size: 13 });
    rect(key, 372, ky - 10, 11, 11, { fill: FILM.phase }); text(key, 389, ky, 'one that watches for phase errors', { size: 13 });
  }

  // ---- step 5: only the film is left ----------------------------------------------
  st.on((gg) => { const o = 1 - 0.82 * Math.min(1, Math.max(0, (gg - 5) / 0.35)); const v = o >= 0.999 ? '' : o.toFixed(3); for (const e of [chipRow, chipBand]) if (e.style.opacity !== v) e.style.opacity = v; });

  // ---- step 6: one frame, two stories ----------------------------------------------
  st.on((gg) => { const o = gg >= 6 ? 1 - 0.97 * Math.min(1, (gg - 6) / 0.3) : 1; const v = o >= 0.999 ? '' : o.toFixed(3); if (main.style.opacity !== v) main.style.opacity = v; });
  const six = g(svg);
  const S6 = tall
    ? { seen: [180, 92], sz: 22, both: 238, stories: [[95, 304], [265, 304]], ssz: 19, labY: 358, noteY: 392, w: 330 }
    : { seen: [175, 215], sz: 30, both: 86, stories: [[480, 215], [630, 215]], ssz: 24, labY: 300, noteY: 352, w: 470 };
  const fr = S6.sz * 2.4;
  rect(six, S6.seen[0] - fr, S6.seen[1] - fr * 0.95, fr * 2, fr * 1.9, { rx: 4, fill: FILM.frame });
  frame(six, S6.seen[0], S6.seen[1], S6.sz, { lit: d.stories.lights, dark: true });
  text(six, S6.seen[0], S6.seen[1] + fr * 0.95 + 20, 'round 2, as the decoder gets it', { ...noteO, anchor: 'middle' });
  pen(six, P.storyArrow); pen(six, P.storyArrowHead); pen(six, P.storyBracket);
  const mid = (S6.stories[0][0] + S6.stories[1][0]) / 2;
  text(six, mid, S6.both, 'both fit the same two lights', { ...noteO, anchor: 'middle' });
  const labs = tall ? ['one flip', 'or two flips'] : ['one flip, in the middle', 'or two flips, above and below'];
  [d.stories.one, d.stories.two].forEach((qs, k) => {
    const [x, y] = S6.stories[k];
    frame(six, x, y, S6.ssz, { lit: d.stories.lights, errors: qs.map((q) => ({ qubit: q, kind: 'X' })) });
    text(six, x, S6.labY, labs[k], { size: 14, anchor: 'middle', width: 140 });
  });
  const odds = d.stories.one_flip_against_two_at_p;
  const times = (Math.round(odds.times_likelier / 100) * 100).toLocaleString('en'), oneIn = Math.round(1 / odds.p).toLocaleString('en');
  text(six, tall ? 180 : mid, S6.noteY, tall
    ? `They leave the stored value opposite ways round. At one slip in ${oneIn}, one flip is about ${times} times likelier, so the decoder bets on it.`
    : `The two stories leave the stored value opposite ways round. At one slip in ${oneIn}, one flip is about ${times} times likelier than two, so the decoder bets on it, and is usually right.`,
  { ...noteO, anchor: 'middle', width: S6.w });
  st.fade(six, 6, 6.35);

  // ---- source line ------------------------------------------------------------------
  if (!tall) text(svg, W - 12, H - 8, 'an example run constructed by us · X a flip, Z a phase error', { ...mono, anchor: 'end' });

  return { set: (stp, t) => st.set(stp, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
