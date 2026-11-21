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
export const durations = { large: [1.8, 2.4, 1.8, 1.8, 1.8] };
const SIZE = { wide: [720, 450], tall: [360, 580] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

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
const OUT = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
const DASH = (C) => ({ stroke: C.ink, 'stroke-width': 1.25, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round', fill: 'none' });

function build(el, ctx) {
  const tall = ctx.layout === 'tall', print = !!ctx.print;
  floor(tall ? 11.5 : 11);
  const C = pal(ctx), d = ctx.data, R = d.rounds;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const notes = NOTES(d);
  const svg = svgRoot(el, W, H, `${R} rounds of the smallest grid from a longer run, one row for each check. ${notes.slice(2).join('. ')}. A constructed example.`);
  svg.style.color = C.ink;
  const st = stage();
  const flip = d.flips[0], wrong = d.wrong_reports[0];
  const across = d.pairs.find((p) => p.round), along = d.pairs.find((p) => p.rounds);
  const litAt = (id, r) => d.lights.some((l) => l.check === id && l.round === r);
  // the step at which each light appears: the pair across the chip, then the pair along time
  const stepOf = (l) => (l.round === across.round && across.checks.includes(l.check) ? 2 : 3);

  text(g(svg), 16, 18, 'the smallest grid, round after round', { family: 'sans', size: 13, weight: 600 });

  // ---- notes: one fact at a time on screen, all of them on paper ----------
  const noteO = { italic: true, size: tall ? 13 : 14.5, width: tall ? W - 32 : W - 32, lh: tall ? 17 : 19 };
  notes.forEach((s, i) => {
    const n = g(svg);
    if (print) text(n, 16, 42 + i * 18, `${i + 1}  ${s}`, { ...noteO, size: 12.5, width: W - 32 });
    else { text(n, 16, tall ? 44 : 48, s, noteO); st.fade(n, i + 0.05, i + 0.3, i < notes.length - 1 ? [i + 1, i + 1.1] : null); }
  });

  // ---- layout ---------------------------------------------------------------
  const L = print
    ? { kx: 96, ky: 270, kp: 34, x0: 300, y0: 160, cw: 46, ch: 26 }
    : tall
      ? { kx: W / 2, ky: 150, kp: 30, x0: 96, y0: 262, cw: 30, ch: 26 }
      : { kx: 96, ky: 250, kp: 34, x0: 300, y0: 112, cw: 46, ch: 30 };
  const order = [...d.checks.filter((c) => c.asks_about === 'flips'), ...d.checks.filter((c) => c.asks_about !== 'flips')];
  const rowY = (i) => L.y0 + i * L.ch + L.ch / 2, colX = (r) => L.x0 + (r - 0.5) * L.cw;
  const bottom = L.y0 + order.length * L.ch;

  // ---- the key: the grid, each check named where it sits --------------------
  const keyG = g(svg);
  const K = grid(keyG, { checks: d.checks, d: d.distance, cx: L.kx, cy: L.ky, pitch: L.kp, C, helper: 0, qr: L.kp * 0.12 });
  for (const ch of d.checks) {
    const c = K.tiles[ch.id].c, o = ch.shape === 'half' ? OUT[ch.edge] : [0, 0];
    text(keyG, c[0] + o[0] * L.kp * 0.36, c[1] + o[1] * L.kp * 0.36 + 4, ch.id, { family: 'mono', size: 11.5, anchor: 'middle', fill: C.ink });
  }
  // the flip: two short dashed strokes on qubit 4, never seen by the chip
  const q = K.pos(flip.qubit), xr = L.kp * 0.2;
  const xMark = g(svg);
  line(xMark, q[0] - xr, q[1] - xr, q[0] + xr, q[1] + xr, { ...DASH(C), 'stroke-dasharray': '2 2.5' });
  line(xMark, q[0] - xr, q[1] + xr, q[0] + xr, q[1] - xr, { ...DASH(C), 'stroke-dasharray': '2 2.5' });

  // ---- the chart --------------------------------------------------------------
  const chart = g(svg);
  const groups = [['flip-checks', order.filter((c) => c.asks_about === 'flips').length], ['phase-checks', order.filter((c) => c.asks_about !== 'flips').length]];
  let gi = 0;
  for (const [name, n] of groups) {
    const ya = rowY(gi) - L.ch / 2, yb = rowY(gi + n - 1) + L.ch / 2;
    if (name === 'flip-checks') path(chart, `M${L.x0} ${ya} h${R * L.cw} v${yb - ya} h${-R * L.cw} Z`, { fill: C.ink, 'fill-opacity': 0.045, stroke: 'none' });
    const lx = L.x0 - 40, ly = (ya + yb) / 2;
    const tg = g(chart, { transform: `rotate(-90 ${lx} ${ly})` });
    text(tg, lx, ly + 4, name, { family: 'mono', size: 11.5, anchor: 'middle', fill: C.muted });
    gi += n;
  }
  const cols = [];
  for (let r = 1; r <= R; r++) cols.push(g(chart));
  order.forEach((c, i) => {
    const y = rowY(i);
    text(chart, L.x0 - 8, y + 4, c.id, { family: 'mono', size: 11.5, anchor: 'end', fill: C.ink });
    line(chart, L.x0, y, L.x0 + R * L.cw, y, { stroke: C.hairline, 'stroke-width': 0.75 });
    for (let r = 1; r <= R; r++) circle(cols[r - 1], colX(r), y, 1.7, { fill: C.ink });
  });
  // rounds along the top; the run goes on at both ends
  const roundsG = g(svg);
  for (let r = 1; r <= R; r++) text(r === 1 ? cols[0] : roundsG, colX(r), L.y0 - 8, String(r), { family: 'mono', size: 11.5, anchor: 'middle', fill: C.muted });
  text(roundsG, L.x0 - 6, L.y0 - 8, '…', { family: 'mono', size: 11.5, anchor: 'end', fill: C.muted });
  text(roundsG, L.x0 + R * L.cw + 4, L.y0 - 8, '…', { family: 'mono', size: 11.5, fill: C.muted });
  text(roundsG, L.x0 - 22, L.y0 - 8, 'round', { family: 'mono', size: 11.5, anchor: 'end', fill: C.muted });

  // the flip happens between two rounds: a dashed hairline in that gap
  const gx = L.x0 + (flip.between[1] - 1) * L.cw;
  line(xMark, gx, L.y0 - 2, gx, bottom + 2, DASH(C));
  text(xMark, gx, bottom + 18, `flip on qubit ${flip.qubit}`, { family: 'mono', size: 11.5, anchor: 'middle', fill: C.muted });

  // the lights: the fired state of the lattice figure (field and solid dot), set
  const lights = d.lights.map((l) => {
    const i = order.findIndex((c) => c.id === l.check), x = colX(l.round), y = rowY(i);
    const lg = g(svg);
    path(lg, `M${x - L.cw / 2 + 3} ${y - L.ch / 2 + 3} h${L.cw - 6} v${L.ch - 6} h${-(L.cw - 6)} Z`, { fill: C.field, stroke: C.accent, 'stroke-width': 1 });
    circle(lg, x, y, L.ch * 0.16, { fill: C.accent });
    return { l, el: lg };
  });
  // the same checks lit on the key, as they fire: the field only, so the name stays readable
  const keyFire = (id, on) => { const t = K.tiles[id]; t.setFired(on); t.dot.style.display = 'none'; };
  const keyLit = [...new Set(d.lights.map((l) => l.check))].map((id) => ({ id, step: Math.min(...d.lights.filter((l) => l.check === id).map(stepOf)) }));

  // the pairs: the lattice figure's pairing line, in the chart and on the key
  const joins = g(svg);
  const ia = order.findIndex((c) => c.id === across.checks[0]), ib = order.findIndex((c) => c.id === across.checks[1]);
  line(joins, colX(across.round), rowY(ia), colX(across.round), rowY(ib), DASH(C));
  const iw = order.findIndex((c) => c.id === along.check);
  line(joins, colX(along.rounds[0]), rowY(iw), colX(along.rounds[1]), rowY(iw), DASH(C));
  const ka = K.tiles[across.checks[0]].c, kb = K.tiles[across.checks[1]].c;
  path(joins, `M${ka[0]} ${ka[1]} L${q[0]} ${q[1]} L${kb[0]} ${kb[1]}`, DASH(C));

  const keyLine = g(svg);
  text(keyLine, tall ? 16 : L.x0, bottom + 36, 'lit: the answer changed since the round before', { family: 'mono', size: 11.5, fill: C.muted });
  text(g(svg), 16, H - (tall ? 27 : 12), tall ? `a constructed example
${R} rounds from a longer run` : `a constructed example · ${R} rounds from a longer run`, { family: 'mono', size: 11.5, fill: C.muted, lh: 15 });

  if (print) {
    for (const k of keyLit) keyFire(k.id, 1);
  } else {
    st.fade(keyG, 0, 0.5);
    // the rounds arrive at an even pace, like the clock that drives them
    cols.forEach((c, k) => {
      const at = k === 0 ? 0.2 : 1 + (k - 1) * 0.12;
      st.on((gg) => { c.style.display = gg >= at ? '' : 'none'; });
    });
    st.on((gg) => { roundsG.style.display = gg >= 1 ? '' : 'none'; keyLine.style.display = gg >= 1 ? '' : 'none'; });
    st.on((gg) => { xMark.style.display = gg >= 2.05 ? '' : 'none'; });
    for (const { l, el: lg } of lights) { const s = stepOf(l); st.on((gg) => { lg.style.display = gg >= s + 0.1 ? '' : 'none'; }); }
    for (const k of keyLit) st.on((gg) => keyFire(k.id, gg >= k.step + 0.1 ? 1 : 0));
    st.on((gg) => { joins.style.display = gg >= 4.1 ? '' : 'none'; });
  }
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
