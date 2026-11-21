// film: the checks as a film of rounds (section 4), drawn as a space-time
// chart: a row for every check, a column for every round, and the smallest
// grid beside it as the key to the rows. Eight rounds from a longer run; one
// flip lights two checks in one round (a pair across the chip), one wrong
// report lights one check in two rounds (a pair along time).
//
// Everything drawn comes from data/film.json, which tools/other-half-data.mjs
// computes from the error list and the check definitions. A filmstrip (A) and
// an oblique 3D drawing (B) were sketched and dropped after review
// (HELD-SCENE.md, reviews/held-sketch-*.md).
import { mountFigure, svgRoot, g, circle, line, path, stage } from '../../../lib/fig.js';
import { pal, grid, text, floor } from './shared.js';

export const steps = 5;
export const durations = { large: [1.4, 2.0, 1.4, 1.4, 1.6] };
const SIZE = { wide: [720, 450], tall: [360, 604] };
// without its own notes (ctx.notes === false: the page sets them as text)
// the drawing loses the note band and is that much shorter
const BAND = { wide: 40, tall: 50 };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };
export const aspectFor = (ctx = {}) => {
  const bare = ctx.notes === false && !ctx.print;
  return {
    wide: SIZE.wide[0] / (SIZE.wide[1] - (bare ? BAND.wide : 0)),
    tall: SIZE.tall[0] / (SIZE.tall[1] - (bare ? BAND.tall : 0)),
  };
};

const NOTES = (d) => {
  const f = d.flips[0], w = d.wrong_reports[0], p0 = d.pairs[0];
  return [
    `one round: ${d.checks.length} checks, one answer each`,
    `a round every 1.1 µs, the same ${d.checks.length} checks each time`,
    `round ${p0.round}: ${p0.checks.join(' and ')} fire – a flip on qubit ${f.qubit}`,
    `${w.check} fires in rounds ${w.round} and ${w.round + 1} – a wrong report, no storing qubit hit`,
    'the decoder pairs lights across rounds, not round by round – across the chip, along time, or to the edge',
  ];
};
// the notes as page text (the held and pinned lab pages): the same words the drawing uses
export const notes = NOTES;
const OUT = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
const DASH = (C) => ({ stroke: C.ink, 'stroke-width': 1.25, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round', fill: 'none' });
// The shell plays a step with t = soft(u), u its real time (a prompt start, a
// gentle end). The rounds must arrive at the clock's even pace, so their
// cadence is read in real time: u from t.
const realTime = (t) => (t >= 1 ? 1 : t <= 0 ? 0 : (1.4 - Math.sqrt(Math.max(0, 1.96 - 1.6 * t))) / 0.8);

function build(el, ctx) {
  const tall = ctx.layout === 'tall', print = !!ctx.print;
  floor(tall ? 11.5 : 11);
  const C = pal(ctx), d = ctx.data, R = d.rounds;
  const bare = ctx.notes === false && !print;
  const sh = bare ? BAND[tall ? 'tall' : 'wide'] : 0;
  const W = SIZE[tall ? 'tall' : 'wide'][0], H = SIZE[tall ? 'tall' : 'wide'][1] - sh;
  const notes = NOTES(d);
  const svg = svgRoot(el, W, H, `${R} rounds of the smallest grid from a longer run, one row for each check. ${notes.slice(2).join('. ')}. A constructed example.`);
  svg.style.color = C.ink;
  const st = stage();
  const flip = d.flips[0];
  const across = d.pairs.find((p) => p.round), along = d.pairs.find((p) => p.rounds);
  // the step at which each light appears: the pair across the chip, then the pair along time
  const stepOf = (l) => (l.round === across.round && across.checks.includes(l.check) ? 2 : 3);
  const mono = { family: 'mono', size: 11.5 };

  text(g(svg), 16, 18, 'the smallest grid, round after round', { family: 'sans', size: 13, weight: 600 });

  // ---- notes: one fact at a time on screen, all of them on paper ----------
  const noteO = { italic: true, size: tall ? 13 : 14.5, width: W - 32, lh: tall ? 17 : 19 };
  notes.forEach((s, i) => {
    const n = g(svg);
    if (print) text(n, 16, 42 + i * 18, `${i + 1}  ${s}`, { ...noteO, size: 12.5, width: W - 32 });
    // ctx.notes === false: the page sets the notes as text, and the band goes
    else if (!bare) { text(n, 16, tall ? 44 : 48, s, noteO); st.fade(n, i + 0.05, i + 0.3, i < notes.length - 1 ? [i + 1, i + 1.1] : null); }
  });

  // ---- layout ---------------------------------------------------------------
  // the wide key sits on the chart's flip-check rows (y0 + 2 rows)
  const L = print
    ? { kx: 110, ky: 264, kp: 46, x0: 300, y0: 160, cw: 46, ch: 26 }
    : tall
      ? { kx: W / 2, ky: 160 - sh, kp: 40, x0: 96, y0: 286 - sh, cw: 30, ch: 26 }
      : { kx: 120, ky: 112 - sh + 60, kp: 50, x0: 300, y0: 112 - sh, cw: 46, ch: 30 };
  const order = [...d.checks.filter((c) => c.asks_about === 'flips'), ...d.checks.filter((c) => c.asks_about !== 'flips')];
  const rowY = (i) => L.y0 + i * L.ch + L.ch / 2, colX = (r) => L.x0 + (r - 0.5) * L.cw;
  const bottom = L.y0 + order.length * L.ch;

  // ---- the key: the grid, each check named where it sits --------------------
  const keyG = g(svg);
  const K = grid(keyG, { checks: d.checks, d: d.distance, cx: L.kx, cy: L.ky, pitch: L.kp, C, helper: 0, qr: L.kp * 0.12 });
  for (const ch of d.checks) {
    const t = K.tiles[ch.id];
    let [x, y] = t.c;
    if (ch.shape === 'half') {
      // a half check's name stands outside its arc, clear of the line: the
      // arc's radius, 3 units of air, and half the name (wider than tall)
      const o = OUT[ch.edge], k = t.geom.r + 3 + (o[0] ? 9 : 6);
      [x, y] = [t.geom.edgeMid[0] + o[0] * k, t.geom.edgeMid[1] + o[1] * k];
    } else {
      // a square's name moves out from the middle of the grid, so the qubit
      // there has room for its number, its X and the joins
      [x, y] = [x + (x - L.kx) * 0.3, y + (y - L.ky) * 0.3];
    }
    text(keyG, x, y + 4, ch.id, { ...mono, anchor: 'middle', fill: C.ink });
  }
  // qubit 4: its number, up and to the left of its ring, where no line runs
  const q = K.pos(flip.qubit), qr = L.kp * 0.12;
  text(keyG, q[0] - L.kp * 0.38, q[1] - L.kp * 0.15 + 4, String(flip.qubit), { ...mono, anchor: 'middle', fill: C.ink });
  // the flip on the key: a dashed X whose four arms start outside the ring
  const keyX = g(svg);
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const a = (qr + L.kp * 0.05) / Math.SQRT2, b = (qr + L.kp * 0.18) / Math.SQRT2;
    line(keyX, q[0] + sx * a, q[1] + sy * a, q[0] + sx * b, q[1] + sy * b, { stroke: C.ink, 'stroke-width': 1.25, 'stroke-dasharray': '1.6 1.4', fill: 'none' });
  }
  // under the key at step 4: what it shows then
  const keyCap = g(svg);
  const kBottom = L.ky + L.kp + L.kp / 2 + 3 + 6 + 4;          // the baseline of the bottom half-check's name
  if (tall) text(keyCap, L.kx, kBottom + 20, `every check that fired, rounds 1–${R}`, { ...mono, anchor: 'middle', fill: C.muted });
  else text(keyCap, L.kx, kBottom + 20, `every check that fired,\nrounds 1–${R}`, { ...mono, anchor: 'middle', fill: C.muted, lh: 15 });

  // ---- the chart --------------------------------------------------------------
  const chart = g(svg);
  const groups = [['flip-checks', order.filter((c) => c.asks_about === 'flips').length], ['phase-checks', order.filter((c) => c.asks_about !== 'flips').length]];
  let gi = 0;
  for (const [name, n] of groups) {
    const ya = rowY(gi) - L.ch / 2, yb = rowY(gi + n - 1) + L.ch / 2;
    if (name === 'flip-checks') path(chart, `M${L.x0} ${ya} h${R * L.cw} v${yb - ya} h${-R * L.cw} Z`, { fill: C.ink, 'fill-opacity': 0.045, stroke: 'none' });
    const lx = L.x0 - 40, ly = (ya + yb) / 2;
    const tg = g(chart, { transform: `rotate(-90 ${lx} ${ly})` });
    text(tg, lx, ly + 4, name, { ...mono, anchor: 'middle', fill: C.muted });
    gi += n;
  }
  const cols = [];
  for (let r = 1; r <= R; r++) cols.push(g(chart));
  order.forEach((c, i) => {
    const y = rowY(i);
    text(chart, L.x0 - 8, y + 4, c.id, { ...mono, anchor: 'end', fill: C.ink });
    line(chart, L.x0, y, L.x0 + R * L.cw, y, { stroke: C.hairline, 'stroke-width': 0.75 });
    for (let r = 1; r <= R; r++) circle(cols[r - 1], colX(r), y, 1.7, { fill: C.ink });
  });
  // each round's number arrives with its column; the run goes on at both ends
  for (let r = 1; r <= R; r++) text(cols[r - 1], colX(r), L.y0 - 8, String(r), { ...mono, anchor: 'middle', fill: C.muted });
  text(cols[0], L.x0 - 6, L.y0 - 8, '…', { ...mono, anchor: 'end', fill: C.muted });
  text(cols[0], L.x0 - 22, L.y0 - 8, 'round', { ...mono, anchor: 'end', fill: C.muted });
  text(cols[R - 1], L.x0 + R * L.cw + 4, L.y0 - 8, '…', { ...mono, fill: C.muted });

  // the flip happens between two rounds: a dashed hairline in that gap
  const flipG = g(svg);
  const gx = L.x0 + (flip.between[1] - 1) * L.cw;
  line(flipG, gx, L.y0 - 2, gx, bottom + 2, DASH(C));
  text(flipG, gx, bottom + 18, `flip on qubit ${flip.qubit}`, { ...mono, anchor: 'middle', fill: C.muted });

  // the pairs in the chart: drawn under the lights, seen in the gap between them
  const joins = g(svg);
  const JOIN = { ...DASH(C), 'stroke-width': 1.5, 'stroke-dasharray': '2 2' };
  const ia = order.findIndex((c) => c.id === across.checks[0]), ib = order.findIndex((c) => c.id === across.checks[1]);
  line(joins, colX(across.round), rowY(ia), colX(across.round), rowY(ib), JOIN);
  const iw = order.findIndex((c) => c.id === along.check);
  line(joins, colX(along.rounds[0]), rowY(iw), colX(along.rounds[1]), rowY(iw), JOIN);
  // what each pair is, between the row lines, never on one
  text(joins, colX(across.round) + L.cw / 2 + 4, (rowY(ia) + rowY(ib)) / 2 + 4, 'across the chip', { ...mono, fill: C.muted });
  // (wide: right of the pair; tall, where the chart ends close after it: above the pair, clear of its boxes)
  if (tall) text(joins, (colX(along.rounds[0]) + colX(along.rounds[1])) / 2, rowY(iw) - 12, 'along time', { ...mono, anchor: 'middle', fill: C.muted });
  else text(joins, colX(along.rounds[1]) + L.cw / 2 + 4, rowY(iw) - L.ch / 2 + 4, 'along time', { ...mono, fill: C.muted });

  // the lights: the fired state of the lattice figure (field and solid dot), set;
  // inset 6 across, so the flip line before round 3 stays clear of them
  const iy = tall ? 4 : 3;
  const lights = d.lights.map((l) => {
    const i = order.findIndex((c) => c.id === l.check), x = colX(l.round), y = rowY(i);
    const lg = g(svg);
    path(lg, `M${x - L.cw / 2 + 6} ${y - L.ch / 2 + iy} h${L.cw - 12} v${L.ch - 2 * iy} h${-(L.cw - 12)} Z`, { fill: C.field, stroke: C.accent, 'stroke-width': 1 });
    circle(lg, x, y, L.ch * 0.16, { fill: C.accent });
    return { l, el: lg };
  });

  // the pair on the key: from each tile toward qubit 4, stopping short of its X
  const keyJoin = g(svg);
  for (const id of across.checks) {
    const c = K.tiles[id].c, dx = c[0] - q[0], dy = c[1] - q[1], len = Math.hypot(dx, dy);
    // from just inside the name's box (moved out to 0.65 of the pitch, about
    // 7 by 6 units each side of its centre) to 4 units past the X's arm
    const r0 = (L.kp * 0.65 - 6) * Math.SQRT2 - 3, r1 = qr + L.kp * 0.18 + 4;
    path(keyJoin, `M${q[0] + (dx / len) * r0} ${q[1] + (dy / len) * r0} L${q[0] + (dx / len) * r1} ${q[1] + (dy / len) * r1}`, { ...DASH(C), 'stroke-dasharray': '2 2.5' });
  }

  // the key lights only what fires in the step shown: the round-3 pair at
  // step 2, the wrong report at step 3, every light at step 4 (the field
  // only, so the name stays readable)
  const keyFire = (id, on) => { const t = K.tiles[id]; t.setFired(on); t.dot.style.display = 'none'; };
  const keyAcross = across.checks, keyAlong = [along.check];
  const lit = (gg) => {
    if (gg >= 4.1) return new Set([...keyAcross, ...keyAlong]);
    if (gg >= 3.1) return new Set(keyAlong);
    if (gg >= 2.1) return new Set(keyAcross);
    return new Set();
  };

  // ---- the foot: the legend of the lights, then what the figure is ----------
  const footY = H - (tall ? 27 : 12);
  const keyLine = g(svg);
  text(keyLine, 16, footY - (tall ? 18 : 16), 'lit: the answer changed since the round before', { ...mono, fill: C.muted });
  text(g(svg), 16, footY, tall ? `a constructed example
${R} rounds from a longer run` : `a constructed example · ${R} rounds from a longer run`, { ...mono, fill: C.muted, lh: 15 });

  if (print) {
    for (const id of lit(5)) keyFire(id, 1);
  } else {
    st.fade(keyG, 0, 0.5);
    // the rounds arrive at an even pace in real time, like the clock that drives them
    cols.forEach((c, k) => {
      st.on((gg) => {
        const on = k === 0 ? gg >= 0.2 : gg >= 2 || (gg >= 1 && realTime(gg - 1) >= 0.04 + (k - 1) * 0.12);
        c.style.display = on ? '' : 'none';
      });
    });
    st.on((gg) => { keyLine.style.display = gg >= 2.1 ? '' : 'none'; });
    st.on((gg) => { flipG.style.display = gg >= 2.05 ? '' : 'none'; });
    st.on((gg) => { keyX.style.display = (gg >= 2.05 && gg < 3.05) || gg >= 4.05 ? '' : 'none'; });
    for (const { l, el: lg } of lights) { const s = stepOf(l); st.on((gg) => { lg.style.display = gg >= s + 0.1 ? '' : 'none'; }); }
    for (const id of new Set([...keyAcross, ...keyAlong])) st.on((gg) => keyFire(id, lit(gg).has(id) ? 1 : 0));
    st.on((gg) => { const on = gg >= 4.1 ? '' : 'none'; joins.style.display = on; keyJoin.style.display = on; keyCap.style.display = on; });
  }
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
