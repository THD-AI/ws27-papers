// film: what the decoder gets. Two rows in time on the smallest grid: above,
// the chip, with the errors that nobody reads directly; below, a dark strip of
// film, one frame per round, where a check lights only in the round its answer
// changes. The strip runs into the decoder. The last steps lift one frame out,
// show the different stories behind the same lights, and the bet the decoder
// makes. Everything from data/film.json (tools/film-data.mjs), the drawn lines
// included.
import { mountFigure, svgRoot, g, h, rect, circle, line, path, leader, stage } from '../../../lib/fig.js';
import { pal, tile, errMark, text, floor } from './shared.js';

export const steps = 8;
// seconds each step plays once triggered: the setting; a flip; a dark frame;
// a phase error; a check that misreports (two frames, the strip moves on);
// the chip hidden, only the film left; one frame and its stories; the bet
export const durations = { large: [2.2, 1.4, 1.2, 1.4, 1.8, 1.4, 2.0, 1.4] };
const SIZE = { wide: [720, 470], tall: [360, 456] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

// when (in step units) each round's frames come in; the strip moves on by whole frames
const REVEAL = [0, 1.25, 2.25, 3.25, 4.2, 4.6];
const FILM = { strip: '#24211E', frame: '#2F2B27', edge: '#6A6258', dot: '#8A8178' };

function build(el, ctx) {
  const print = !!ctx.print, tall = !print && ctx.layout === 'tall';
  floor(tall ? 13.8 : 12.45);
  const lay = print ? 'print' : tall ? 'tall' : 'wide';
  const C = pal(ctx), d = ctx.data, L = d.layout[lay], P = d.pen[lay];
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const lattice = d.lattice_checks;
  const bet = d.stories.one_flip_against_all_pairs, nPairs = d.stories.all_pairs.length;
  const svg = svgRoot(el, W, H,
    'The smallest grid over six rounds. Above, the chip: a flip in the middle in round 2, a phase error in the corner in round 4, and a check that gives one wrong answer in round 5. '
    + 'Below, the film that comes out: the two checks beside the flip light in round 2 only; round 3 is dark although the flip is still there; '
    + 'one check lights for the phase error in round 4; the misreporting check lights in rounds 5 and 6. '
    + `The decoder gets only the film. The same two lights of round 2 also fit ${nPairs} different pairs of flips, which would leave the stored value the other way round; `
    + `with independent errors at one in ${Math.round(1 / bet.p)}, the single flip is about ${bet.times_likelier} times likelier than all the pairs together.`);
  svg.style.color = C.ink;
  const st = stage();
  const noteO = { italic: true, size: tall ? 13 : 14 };
  const mono = { family: 'mono', size: tall ? 11 : 12, fill: C.muted };
  const pen = (parent, dd) => path(parent, dd, { fill: C.ink, stroke: 'none', 'data-audit': 'skip' });
  const [wx0, wx1] = L.win, half = L.stripH / 2, s = L.pitch;

  // ---- titles and row labels ---------------------------------------------------
  const main = g(svg);
  const head = tall ? g(svg) : main;
  if (tall) {
    text(head, 16, 18, 'the decoder never sees an error,', { family: 'sans', size: 13, weight: 600 });
    text(head, 16, 35, 'only the lights it leaves', { family: 'sans', size: 13, weight: 600 });
  } else text(svg, 16, 18, 'the decoder never sees an error, only the lights it leaves', { family: 'sans', size: 13, weight: 600 });
  const chipTop = L.chipY - (tall ? 52 : 58);
  const labA = tall ? [16, chipTop - 9] : [16, L.chipY - 8], labB = tall ? [16, L.stripY - half - 8] : [16, L.stripY - 8];
  if (print) text(main, 16, L.chipY - 66, 'round', { ...mono });
  text(main, labA[0], labA[1], 'on the chip', { size: tall ? 14 : 15 });
  text(main, labA[0] + (tall ? 92 : 0), labA[1] + (tall ? 0 : 19), 'nobody reads it directly', { size: 13, fill: C.muted, width: tall ? 240 : 112 });
  text(main, labB[0], labB[1], tall ? 'what comes out, a frame a round' : 'what comes out', { size: tall ? 14 : 15 });
  if (!tall) text(main, labB[0], labB[1] + 19, 'a frame a round', { size: 13, fill: C.muted });

  // ---- the window both rows move in ---------------------------------------------
  const clipId = `film-clip-${tall ? 't' : 'w'}-${Math.round(Math.random() * 1e6)}`;
  const cp = h('clipPath', { id: clipId }, h('defs', null, svg));
  rect(cp, wx0 - 6, 0, wx1 - wx0 + 12, H);
  const chipLine = g(main);
  path(chipLine, P.chip, { fill: C.ink, 'fill-opacity': 0.5, stroke: 'none', 'data-audit': 'skip' });
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
  function frame(parent, cx, cy, sz, { lit = [], errors = [], dark, suspect }) {
    const grp = g(parent);
    const pos = (q) => [cx + ((q % 3) - 1) * sz, cy + (Math.floor(q / 3) - 1) * sz];
    const tiles = {};
    for (const ch of lattice) {
      const t = tile(ch, pos), on = lit.includes(ch.id), flip = ch.id[0] === 'z';
      const col = flip ? C.flip : C.phase;
      tiles[ch.id] = t;
      path(grp, t.d, on
        ? { fill: col, stroke: col, 'stroke-width': 1, 'stroke-linejoin': 'round' }
        : { stroke: dark ? FILM.edge : C.muted, 'stroke-opacity': dark ? 1 : 0.55, 'stroke-width': 0.9, 'stroke-linejoin': 'round', fill: !dark && flip ? C.ink : 'none', 'fill-opacity': !dark && flip ? 0.06 : null });
    }
    // a check that gives a wrong answer this round: its outline, dashed
    if (suspect) path(grp, tiles[suspect].d, { stroke: C.ink, 'stroke-width': 1.5, 'stroke-dasharray': '2.4 2', 'stroke-linejoin': 'round' });
    for (let q = 0; q < 9; q++) {
      const [x, y] = pos(q), e = errors.find((er) => er.qubit === q);
      if (e) errMark(grp, x, y, sz * 0.37, e.kind, C, 'real');
      else circle(grp, x, y, sz * 0.09, dark ? { fill: FILM.dot } : { fill: C.paper, stroke: C.ink, 'stroke-width': 1 });
    }
    return { grp, pos, tiles };
  }

  // ---- the rounds ------------------------------------------------------------------
  const nVis = L.visible;
  const offAt = (gg) => { let n = 0; d.rounds.forEach((r, i) => { if (gg >= REVEAL[i] && i + 1 > nVis + n) n = i + 1 - nVis; }); return n; };
  const cols = d.rounds.map((r, i) => {
    const colA = g(chipRow), colB = g(filmRow);
    frame(colA, 0, L.chipY, s, { errors: r.errors_present, suspect: r.misreport });
    if (r.new_error) circle(colA, (r.new_error.qubit % 3 - 1) * s, L.chipY + (Math.floor(r.new_error.qubit / 3) - 1) * s, s * 0.52, { fill: 'none', stroke: C.ink, 'stroke-width': 1, 'stroke-dasharray': '2 2.5' });
    if (r.misreport) text(colA, 0, L.chipY + s * 1.5 + (tall ? 9 : 22), 'a wrong answer', { ...noteO, size: tall ? 12 : 13, anchor: 'middle' });
    text(colA, 0, tall ? chipTop + 16 : L.chipY - 66, print ? `${r.round}` : `round ${r.round}`, { ...mono, anchor: 'middle' });
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

  // ---- step 0: what is a qubit, what is a check (the empty frames beside round 1) ---
  const intro = g(main);
  { const cx = wx0 + L.fw / 2, pos = (q) => [cx + ((q % 3) - 1) * s, L.chipY + (Math.floor(q / 3) - 1) * s];
    const lx = cx + L.fw * 0.78;
    const q2 = pos(2), z3c = [cx + s * 1.25, L.chipY + s * 0.5];
    const a = text(intro, lx, L.chipY - s * 0.55, 'a qubit', { ...noteO, size: 13 });
    leader(intro, a.x - 5, a.y + 6, q2[0] + 5, q2[1] - 1, { stroke: C.muted });
    const b = text(intro, lx, L.chipY + s * 1.05, tall ? 'a check: one question to its neighbours' : 'a check: it asks its neighbours one question', { ...noteO, size: 13, width: tall ? 150 : 260 });
    leader(intro, b.x - 5, b.y + 6, z3c[0] + 3, z3c[1] + 1, { stroke: C.muted }); }
  st.fade(intro, 0.35, 0.65, [1.05, 1.2]);

  // ---- the decoder ---------------------------------------------------------------
  const [bx0, by0, bx1, by1] = L.box, bcx = (bx0 + bx1) / 2, bcy = (by0 + by1) / 2;
  const box = g(main);
  for (const dd of P.box) pen(box, dd);
  if (P.arrow) for (const dd of P.arrow) pen(box, dd);
  const boxA = g(box), boxB = g(box);
  if (tall) {
    text(boxA, bcx, bcy + 5, 'decoder', { size: 16, anchor: 'middle' });
    text(boxB, bcx, bcy + 5, 'decoder: it gets only the film', { size: 15, anchor: 'middle' });
  } else if (print) {
    text(box, bcx, bcy + 5, 'decoder', { size: 14, anchor: 'middle' });
  } else {
    text(box, bcx, bcy - 26, 'decoder', { size: 17, anchor: 'middle' });
    text(boxA, bcx, bcy - 4, 'on an ordinary computer', { ...noteO, size: 12.5, fill: C.muted, anchor: 'middle', width: 104 });
    text(boxB, bcx, bcy - 4, 'it gets only the film', { ...noteO, size: 12.5, anchor: 'middle', width: 106 });
  }
  st.fade(boxA, -1, 0, [5, 5.25]).fade(boxB, 5.3, 5.8);

  // ---- notes on the frames ---------------------------------------------------------
  // the mark sits on its frame; on a phone the words go in one place, beside the arrow
  const xOf = (round, gg) => wx0 + (round - 1 - offAt(gg)) * L.fw + L.fw / 2;
  const nY = L.notesY, nX = (x) => (tall ? 22 : x), nA = tall ? 'start' : 'middle', nW = tall ? 280 : 250;
  const notes = [];
  const note = (lines, a, b, out, mark, dy = 0) => {
    const grp = g(main);
    if (mark) mark(grp);
    lines.forEach((ln, k) => text(grp, nX(ln.x), nY + dy + k * 18, ln.t, { ...noteO, anchor: nA, width: print ? 200 : nW, size: print ? 12.5 : noteO.size, fill: ln.muted ? C.muted : undefined }));
    if (!print) st.fade(grp, a, b, out);
    notes.push(grp);
  };
  if (!print) note([{ x: xOf(2, 1.4), t: 'a flip: the two checks beside it light' }], 1.45, 1.7, [2.25, 2.4]);
  note([{ x: xOf(3, 2.5), t: 'no change, no light:' }, { x: xOf(3, 2.5), t: 'the flip is still there', muted: true }], 2.3, 2.85, [3.25, 3.4],
    (grp) => pen(g(grp, { transform: `translate(${xOf(3, 2.5)} ${L.stripY + half + (tall ? 15 : 18)})` }), P.tick));
  if (!print) note([{ x: xOf(4, 3.4), t: 'a phase error: the other kind of check' }], 3.45, 3.7, [4.2, 4.3]);
  note(tall ? [{ x: 0, t: 'one wrong answer lights its check twice: going wrong, and coming right again' }]
    : [{ x: print ? 372 : (xOf(5, 4.7) + xOf(6, 4.7)) / 2, t: 'one wrong answer, two lights:' }, { x: print ? 372 : (xOf(5, 4.7) + xOf(6, 4.7)) / 2, t: 'going wrong, and coming right again' }],
  4.7, 4.95, [5, 5.15], (grp) => pen(g(grp, { transform: `translate(${(xOf(5, 4.7) + xOf(6, 4.7)) / 2} ${L.stripY + half + (tall ? 10 : 12)})` }), P.bracket), print ? 40 : 0);

  // ---- key -------------------------------------------------------------------------
  const key = g(main), ky = L.keyY;
  if (tall) {
    rect(key, 16, ky - 10, 11, 11, { fill: C.flip }); text(key, 33, ky, 'checks for flips', { size: 13 });
    rect(key, 168, ky - 10, 11, 11, { fill: C.phase }); text(key, 185, ky, 'for phase errors', { size: 13 });
  } else {
    rect(key, 16, ky - 10, 11, 11, { fill: C.flip }); text(key, 33, ky, 'a check that watches for flips changed its answer', { size: 13 });
    rect(key, 372, ky - 10, 11, 11, { fill: C.phase }); text(key, 389, ky, 'one that watches for phase errors', { size: 13 });
  }

  // ---- step 5: the chip is hidden, only the film is left ---------------------------
  st.on((gg) => {
    const k = Math.min(1, Math.max(0, (gg - 5.02) / 0.6));
    for (const [e, o] of [[chipRow, 1 - 0.86 * k], [chipLine, 1 - 0.5 * k]]) { const v = o >= 0.999 ? '' : o.toFixed(3); if (e.style.opacity !== v) e.style.opacity = v; }
  });
  const hidden = g(main);
  const hw = tall ? 196 : 220;
  rect(hidden, (wx0 + wx1) / 2 - hw / 2, L.chipY - 15, hw, 30, { rx: 3, fill: C.paper });
  text(hidden, (wx0 + wx1) / 2, L.chipY + 6, 'hidden from the decoder', { size: tall ? 16 : 18, anchor: 'middle' });
  st.fade(hidden, 5.35, 5.85);

  // ---- steps 6 and 7: one frame, its stories, and the bet ---------------------------
  st.on((gg) => { const o = gg >= 6 ? 1 - Math.min(1, (gg - 6) / 0.3) : 1; const v = o >= 0.999 ? '' : o.toFixed(3); if (main.style.opacity !== v) main.style.opacity = v; });
  const six = g(svg), seven = g(svg);
  const S6 = print
    ? { seen: [632, 116], sz: 14, both: [636, 202], stories: [[590, 252], [682, 252]], ssz: 13, labY: 290, w: 160 }
    : tall
    ? { seen: [180, 92], sz: 22, both: [180, 238], stories: [[95, 304], [265, 304]], ssz: 19, labY: 358, bet: [180, 392], w: 330 }
    : { seen: [150, 215], sz: 30, both: [515, 128], stories: [[440, 230], [590, 230]], ssz: 24, labY: 312, bet: [360, 372], w: 600 };
  const fr = S6.sz * 2.4;
  rect(six, S6.seen[0] - fr, S6.seen[1] - fr * 0.95, fr * 2, fr * 1.9, { rx: 4, fill: FILM.frame });
  frame(six, S6.seen[0], S6.seen[1], S6.sz, { lit: d.stories.lights, dark: true });
  text(six, S6.seen[0], S6.seen[1] + fr * 0.95 + 20, 'round 2, as the decoder gets it', { ...noteO, anchor: 'middle' });
  pen(six, P.storyArrow); for (const dd of P.storyArrowHead) pen(six, dd); pen(six, P.storyBracket);
  text(six, S6.both[0], S6.both[1], 'both fit the same two lights', { ...noteO, anchor: 'middle' });
  const labs = tall ? ['one flip', 'or one of four pairs'] : ['one flip, in the middle', 'or one of four pairs'];
  [d.stories.one, d.stories.two].forEach((qs, k) => {
    const [x, y] = S6.stories[k];
    frame(six, x, y, S6.ssz, { lit: d.stories.lights, errors: qs.map((q) => ({ qubit: q, kind: 'X' })) });
    text(six, x, S6.labY, labs[k], { size: print ? 12.5 : 14, anchor: 'middle', width: print ? 96 : 150 });
  });
  st.fade(six, 6, 6.35);
  // the bet, counted: one dot for each time the single flip happens, against one for all four pairs together
  const n = bet.times_likelier;
  const B7 = print ? { lx: 556, gx: 562, gy: 336, cols: 25, p: 2.9, gap: 1.6, r: 1, row2: 424, tx: 664 } : tall ? { lx: 16, gx: 118, gy: 380, cols: 25, p: 4.6, gap: 3, r: 1.5, row2: 440, tx: 248 } : { lx: 290, gx: 302, gy: 352, cols: 50, p: 4.4, gap: 3.5, r: 1.5, row2: 406, tx: 562 };
  const lab = { size: tall ? 13 : 14, anchor: tall ? 'start' : 'end' };
  const dx = (i) => (i % B7.cols) * B7.p + Math.floor((i % B7.cols) / 5) * B7.gap, dy = (i) => Math.floor(i / B7.cols) * B7.p + Math.floor(Math.floor(i / B7.cols) / 5) * B7.gap;
  text(seven, B7.lx, B7.gy + (tall ? 22 : 14), 'the single flip', lab);
  const betDots = [];
  for (let i = 0; i < n; i++) { const c = circle(seven, B7.gx + dx(i), B7.gy + dy(i), B7.r, { fill: C.ink }); c.dataset.r = B7.r; betDots.push(c); }
  text(seven, B7.lx, B7.row2 + 4, 'all four pairs', lab);
  circle(seven, B7.gx, B7.row2, B7.r, { fill: C.ink });
  text(seven, B7.tx, B7.gy + (tall ? 22 : 14), `${n} : 1`, { family: 'mono', size: 13 });
  text(seven, tall ? B7.gx + 14 : print ? B7.gx + 12 : B7.tx, B7.row2 + 4, tall ? 'so the decoder bets on the flip' : 'so the decoder bets on the single flip', { ...noteO, width: tall ? 220 : 150 });
  st.fade(seven, 7, 7.2).fill(betDots, 7.1, 7.85);

  if (print) {
    st.set(4, 0.99);
    for (const n of notes) { n.style.display = ''; n.style.opacity = ''; }
    for (const e of [six, seven]) { e.style.display = ''; e.style.opacity = ''; }
    for (const c of betDots) { c.style.display = ''; c.style.opacity = ''; c.setAttribute('r', c.dataset.r); }
    main.style.opacity = '';
    line(svg, 512, 60, 512, 430, { stroke: C.hairline, 'stroke-width': 1 });
    return { set() {} };
  }
  return { set: (stp, t) => st.set(stp, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
