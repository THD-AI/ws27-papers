// film: the checks as a film of rounds (section 4). Eight rounds of the
// distance-3 grid from a longer run; one flip lights two checks in one round
// (a pair across the grid), one wrong report lights one check in two rounds
// (a pair along time). Everything drawn comes from data/film.json, which
// tools/other-half-data.mjs computes from the error list and the checks.
//
// Two forms, for his choice (HELD-SCENE.md, section 4):
//   A  filmstrip: the rounds side by side, flat
//   C  space-time chart: a row for every check, a column for every round,
//      the small grid beside it as the key (the oblique form B was drawn and
//      dropped: eight parallel check lines crowd at any angle)
// The form comes from ctx.form, or ?form=A|C on the lab page.
import { mountFigure, svgRoot, g, circle, line, path, stage } from '../../../lib/fig.js';
import { pal, grid, errMark, text, floor } from './shared.js';

export const steps = 5;
export const durations = { large: [1.8, 2.4, 1.8, 1.8, 1.8] };
const SIZE = { wide: [720, 450], tall: [360, 560] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

const NOTES = (d) => {
  const f = d.flips[0], w = d.wrong_reports[0], p0 = d.pairs[0];
  return [
    `one round: ${d.checks.length} checks, one answer each`,
    'a round every 1.1 µs, the same 8 checks each time',
    `round ${p0.round}: ${p0.checks.join(' and ')} fire – a flip on qubit ${f.qubit}`,
    `${w.check} fires in rounds ${w.round} and ${w.round + 1} – a wrong report, no qubit hit`,
    'pairs run across the chip and along time',
  ];
};

function formOf(ctx) {
  let f = ctx.form;
  if (!f && typeof location !== 'undefined') f = new URLSearchParams(location.search).get('form');
  return f === 'C' ? 'C' : 'A';
}

function build(el, ctx) {
  const tall = ctx.layout === 'tall', print = !!ctx.print, form = formOf(ctx);
  floor(tall ? 11.5 : 11);
  const C = pal(ctx), d = ctx.data, R = d.rounds;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const notes = NOTES(d);
  const svg = svgRoot(el, W, H, `${R} rounds of the smallest grid from a longer run. ${notes.slice(2).join('. ')}. A constructed example.`);
  svg.style.color = C.ink;
  const st = stage();
  const lit = (c, r) => d.lights.some((l) => l.check === c && l.round === r);
  const flip = d.flips[0], wrong = d.wrong_reports[0], pAcross = d.pairs[0];

  text(g(svg), 16, 18, 'the smallest grid, round after round', { family: 'sans', size: 13, weight: 600 });
  const foot = text(g(svg), tall ? W / 2 : 16, H - 12, `a constructed example · ${R} rounds from a longer run`, { family: 'mono', size: 11.5, fill: C.muted, anchor: tall ? 'middle' : 'start' });
  void foot;

  // ---- the note: one fact at a time (all of them on paper) ----------------
  const noteO = { italic: true, size: tall ? 13 : 14.5, width: tall ? W - 32 : 300 };
  const noteEls = notes.map((s, i) => {
    const n = g(svg);
    if (print) text(n, 16, 44 + i * 19, `${i + 1}  ${s}`, { ...noteO, size: 12.5, width: W - 32 });
    else text(n, tall ? 16 : 16, tall ? 46 : 50, s, noteO);
    return n;
  });
  if (!print) noteEls.forEach((n, i) => st.fade(n, i + 0.05, i + 0.3, i < notes.length - 1 ? [i + 1, i + 1.1] : null));

  const across = { round: pAcross.round, checks: pAcross.checks };
  const marks = { lights: [], x: null, joinA: null, joinT: null };

  if (form === 'A') {
    // ---- A: the filmstrip --------------------------------------------------
    const cols = tall ? 3 : 4;
    const top = print ? 150 : tall ? 110 : 108;
    const cellW = (W - 32) / cols, pitch = tall ? 26 : 36;
    const cellH = pitch * 3.4 + 22;
    const centre = (r) => { const i = r - 1; return [16 + cellW * ((i % cols) + 0.5), top + pitch * 1.6 + Math.floor(i / cols) * (cellH + 18)]; };
    const frames = [];
    for (let r = 1; r <= R; r++) {
      const [cx, cy] = centre(r);
      const fr = g(svg);
      const G = grid(fr, { checks: d.checks, d: d.distance, cx, cy, pitch, C, qr: pitch * 0.15 });
      for (const ch of d.checks) if (lit(ch.id, r)) { G.tiles[ch.id].setFired(1); marks.lights.push({ el: G.tiles[ch.id], r, id: ch.id }); }
      text(fr, cx, cy + pitch * 1.5 + 22, String(r), { family: 'mono', size: 11.5, anchor: 'middle', fill: C.muted });
      frames.push({ fr, G, cx, cy });
    }
    // ellipses: the run goes on before and after
    const [x1, y1] = centre(1), [x8, y8] = centre(R);
    text(svg, x1 - cellW * 0.5 + 2, y1 + pitch * 1.5 + 22, '…', { family: 'mono', size: 11.5, fill: C.muted });
    text(svg, x8 + cellW * 0.5 - 10, y8 + pitch * 1.5 + 22, '…', { family: 'mono', size: 11.5, fill: C.muted });
    // the flip, between rounds 2 and 3: a dashed X in the gap, at qubit 4's height
    const [qx, qy] = frames[flip.between[1] - 1].G.pos(flip.qubit);
    const gapX = tall && (flip.between[0] % cols === 0) ? qx - cellW * 0.5 : qx - cellW * 0.5;
    marks.x = g(svg); errMark(marks.x, gapX, qy, pitch * 0.26, flip.kind, C, 'added');
    // joins
    const F = frames[across.round - 1];
    const [a, b] = across.checks.map((id) => F.G.tiles[id].c);
    marks.joinA = line(svg, a[0], a[1], b[0], b[1], { stroke: C.accent, 'stroke-width': 1.6, 'stroke-dasharray': '4 3' });
    const T1 = frames[wrong.round - 1].G.tiles[wrong.check].c, T2 = frames[wrong.round].G.tiles[wrong.check].c;
    // along time: an arc under the frames, so it never crosses round 6's grid
    const dip = Math.max(T1[1], T2[1]) + pitch * 1.75;
    marks.joinT = path(svg, `M${T1[0]} ${T1[1]} C ${T1[0] + pitch * 0.6} ${dip}, ${T2[0] + pitch * 0.6} ${dip}, ${T2[0]} ${T2[1]}`, { fill: 'none', stroke: C.accent, 'stroke-width': 1.6, 'stroke-dasharray': '4 3' });
    // timeline
    if (!print) {
      st.fade(frames[0].fr, 0, 0.5);
      for (let r = 2; r <= R; r++) st.fade(frames[r - 1].fr, 1 + (r - 2) * 0.11, 1 + (r - 2) * 0.11 + 0.08);
    }
    lightsOn(st, marks, frames.map((f) => f.G), print);
  } else {
    // ---- C: the space-time chart: a row for every check, a column for every
    // round; the small grid beside it is the key to the rows --------------
    const order = [...d.checks.filter((c) => c.asks_about === 'flips'), ...d.checks.filter((c) => c.asks_about !== 'flips')];
    const kp = tall ? 30 : 34;                              // key grid pitch
    const kx = tall ? W / 2 : 96, ky = tall ? 150 : 250;
    const K = grid(svg, { checks: d.checks, d: d.distance, cx: kx, cy: ky, pitch: kp, C, helper: 0 });
    for (const ch of d.checks) { const c = K.tiles[ch.id].c; text(svg, c[0], c[1] + 4, ch.id, { family: 'mono', size: 11.5, anchor: 'middle', fill: C.ink }); }
    const cw = tall ? 32 : 46, ch0 = tall ? 26 : 30;          // cell width and height
    const x0 = tall ? 66 : 300, y0 = (tall ? 270 : 128) + (print ? 42 : 0);
    const rowY = (i) => y0 + i * ch0, colX = (r) => x0 + (r - 1) * cw;
    const chart = g(svg), cellEls = [];
    order.forEach((c, i) => {
      text(chart, x0 - 10, rowY(i) + ch0 / 2 + 4, c.id, { family: 'mono', size: 11.5, anchor: 'end', fill: c.asks_about === 'flips' ? C.ink : C.muted });
      for (let r = 1; r <= R; r++) {
        const on = lit(c.id, r), cx = colX(r) + cw / 2, cy = rowY(i) + ch0 / 2;
        const cell = g(chart);
        path(cell, `M${colX(r) + 2} ${rowY(i) + 2} h${cw - 4} v${ch0 - 4} h${-(cw - 4)} Z`, { fill: c.asks_about === 'flips' ? C.ink : 'none', 'fill-opacity': c.asks_about === 'flips' ? 0.05 : null, stroke: C.muted, 'stroke-width': 0.6, 'stroke-opacity': 0.6 });
        circle(cell, cx, cy, 1.6, { fill: C.muted });
        cellEls.push({ cell, r });
        if (on) {
          const lt = g(chart);
          path(lt, `M${colX(r) + 2} ${rowY(i) + 2} h${cw - 4} v${ch0 - 4} h${-(cw - 4)} Z`, { fill: C.field, stroke: C.accent, 'stroke-width': 1 });
          circle(lt, cx, cy, ch0 * 0.17, { fill: C.accent });
          marks.lights.push({ pt: lt, r, id: c.id });
        }
      }
    });
    // rounds along the top, with the run going on at both ends
    const rx = g(svg);
    for (let r = 1; r <= R; r++) text(rx, colX(r) + cw / 2, y0 - 10, String(r), { family: 'mono', size: 11.5, anchor: 'middle', fill: C.muted });
    text(rx, x0 - 2, y0 - 10, '…', { family: 'mono', size: 11.5, anchor: 'end', fill: C.muted });
    text(rx, colX(R) + cw + 4, y0 - 10, '…', { family: 'mono', size: 11.5, fill: C.muted });
    text(rx, colX(R) + cw, y0 + order.length * ch0 + 18, 'round →', { family: 'mono', size: 11.5, anchor: 'end', fill: C.muted });
    // the flip between rounds 2 and 3: on the key grid at qubit 4, and a tick between columns 2 and 3
    const q = K.pos(flip.qubit);
    marks.x = g(svg);
    errMark(marks.x, q[0], q[1], kp * 0.24, flip.kind, C, 'added');
    const gx = colX(flip.between[1]);
    line(marks.x, gx, y0 - 4, gx, y0 + order.length * ch0 + 4, { stroke: C.accent, 'stroke-width': 1, 'stroke-dasharray': '2 3' });
    text(marks.x, gx, y0 + order.length * ch0 + 18, `flip on qubit ${flip.qubit}`, { family: 'mono', size: 11.5, anchor: 'middle', fill: C.accent });
    // joins: down a column (across the grid), along a row (along time)
    const ia = order.findIndex((c) => c.id === across.checks[0]), ib = order.findIndex((c) => c.id === across.checks[1]);
    const xa = colX(across.round) + cw / 2;
    marks.joinA = line(svg, xa, rowY(ia) + ch0 / 2, xa, rowY(ib) + ch0 / 2, { stroke: C.accent, 'stroke-width': 1.6, 'stroke-dasharray': '3 3' });
    const iw = order.findIndex((c) => c.id === wrong.check), yw = rowY(iw) + ch0 / 2;
    marks.joinT = line(svg, colX(wrong.round) + cw / 2, yw, colX(wrong.round + 1) + cw / 2, yw, { stroke: C.accent, 'stroke-width': 1.6, 'stroke-dasharray': '3 3' });
    if (!print) {
      st.fade(K.root, 0, 0.5);
      for (const { cell, r } of cellEls) if (r === 1) st.fade(cell, 0.2, 0.6); else st.fade(cell, 1 + (r - 2) * 0.11, 1 + (r - 2) * 0.11 + 0.08);
      st.fade(rx, 1, 1.3);
    }
    lightsOn(st, marks, null, print);
  }
  return { set: (s, t) => st.set(s, t) };
}

// steps 2 to 4: the lights, the X, the joins (set, not pulsed)
function lightsOn(st, marks, grids, print) {
  if (print) return;
  for (const m of marks.lights) {
    const a = m.r === 3 ? 2.1 : 3.1;
    if (m.el) { const tile = m.el; tile.setFired(0); st.on((gg) => tile.setFired(gg >= a ? 1 : 0)); }
    else st.on((gg) => { m.pt.style.display = gg >= a ? '' : 'none'; });
  }
  st.fade(marks.x, 2.05, 2.3);
  st.draw(marks.joinA, 4.1, 4.5).draw(marks.joinT, 4.5, 4.9);
  void grids;
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
