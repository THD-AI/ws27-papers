// house-a: the same house twice, at the same size. Left, repaint: a cracked
// facade with an agent painted on, documents lying loose in the ground.
// Right, renovate: the house in section, renewed from the foundations up,
// one numbered layer per step. The loose documents of the left house come
// back filed in the right one's foundation; the person stays at work.
// Nothing leaves once it has arrived: the last step is the print still.
//   0 the old house             4 3 wiring
//   1 the agent painted on      5 4 the service room: agent and person
//   2 1 foundations             6 5 the walls
//   3 2 utilities               7 6 the inspection under the roof
import {
  mountFigure, svgRoot, colors, g, line, circle, rect, path, text, textSize, penRing, stage,
} from '../../../lib/fig.js';

export const steps = 8;
export const aspect = { wide: 552 / 344, tall: 360 / 374 };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const P = tall
    ? { W: 360, H: 374, fs: 11.5, note: 12, pitch: 0.95, t: 17, L: { x0: 4, x1: 170 }, R: { x0: 190, x1: 356 }, apex: 27, pad: 12 }
    : { W: 552, H: 344, fs: 12.5, note: 13.5, pitch: 0.7, t: 18, L: { x0: 16, x1: 262 }, R: { x0: 290, x1: 536 }, apex: 27, pad: 14 };
  const { W, H, L, R, t: T } = P;
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  const ink = { stroke: C.ink, 'stroke-width': 1.25, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  const thin = { ...ink, 'stroke-width': 0.9 };
  const ghost = { stroke: C.hairline, 'stroke-width': 1.25, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  const layer = Object.fromEntries(d.layers.map((l) => [l.key, l]));
  const lab = { family: 'sans', size: P.fs };
  const num = { family: 'mono', size: P.fs, weight: 500, fill: C.accent };
  const word = { family: 'sans', size: P.fs, weight: 600 };          // "AI agent", the same on both houses
  const noteF = { italic: true, size: P.note };

  // -------------------------------------------------------------------------
  // geometry of the right house, from the roof down, sized by its words
  // -------------------------------------------------------------------------
  const Hw = R.x1 - R.x0;                                // both houses have this width
  const eave = P.apex + (Hw / 2) * P.pitch;
  const ix0 = R.x0 + T, ix1 = R.x1 - T;                 // inside the walls
  const nx = ix0 + 6, tx = ix0 + (tall ? 19 : 21), tw = ix1 - 5 - tx;
  const hOf = (s, f, w) => textSize(s, { ...f, width: w }).h;
  const ringRy = tall ? 17 : 18;
  const noteH = hOf(layer.rooms.note, noteF, tw);
  const roomB = eave + P.pad + ringRy * 2 + 6 + noteH + P.pad;
  const wireB = roomB + hOf(layer.wiring.label, lab, tw) + P.pad * 1.6;
  const GY = wireB + hOf(layer.utilities.label, lab, tw) + P.pad * 1.6;
  const fLabH = hOf(layer.foundations.label, lab, tw);
  const fB = GY + P.pad * 0.8 + fLabH + 8 + 9 + P.pad * 0.8;

  // -------------------------------------------------------------------------
  // kickers and the ground
  // -------------------------------------------------------------------------
  const kick = { family: 'mono', size: P.fs, weight: 500, spacing: 1.2, caps: true };
  const k1 = g(svg); text(k1, L.x0, 14, d.kickers.repaint, { ...kick, fill: C.ink });
  const k2 = g(svg); text(k2, R.x0, 14, d.kickers.renovate, { ...kick, fill: C.accent });
  st.fade(k1, 0, 0.15).fade(k2, 2.0, 2.15);
  st.draw(line(svg, 0, GY, W, GY, ink), 0, 0.2);

  // a document: the same small sheet, loose on the left, filed on the right
  const sheet = (parent, x, y, a) => rect(parent, x - 5, y - 3.5, 10, 7, { fill: C.paper, ...thin, transform: a ? `rotate(${a} ${x} ${y})` : null });

  // -------------------------------------------------------------------------
  // left: the old house (step 0), the agent painted on (step 1)
  // -------------------------------------------------------------------------
  const lx = (f) => L.x0 + f * Hw, ly = (f) => eave + f * (GY - eave);
  st.draw(path(svg, `M${L.x0} ${GY}L${L.x0} ${eave}L${lx(0.5)} ${P.apex}L${L.x1} ${eave}L${L.x1} ${GY}`, ink), 0.05, 0.5);
  const lBits = g(svg);
  const win = Math.round(Hw * 0.13);
  rect(lBits, lx(0.16), ly(0.1), win, win * 0.9, { fill: 'none', ...thin });
  rect(lBits, lx(0.84) - win, ly(0.1), win, win * 0.9, { fill: 'none', ...thin });
  rect(lBits, lx(0.44), ly(0.8), Hw * 0.12, GY - ly(0.8), { fill: 'none', ...thin });
  st.fade(lBits, 0.3, 0.5);
  // loose documents in the ground, with what they are
  const papers = g(svg);
  [[0.1, 8, -14], [0.3, 13, 9], [0.5, 7, -6], [0.7, 12, 17], [0.88, 7, -22]].forEach(([f, dy, a]) => sheet(papers, lx(f), GY + dy, a));
  text(papers, L.x0 + 2, GY + 22 + P.note, d.repaint.papers, { ...noteF, width: Hw - 4 });
  st.fade(papers, 0.55, 0.85);

  // the paint, laid on the facade; the crack runs on through it
  const py = ly(0.36);
  const paint = g(svg, { 'data-audit': 'skip' });
  path(paint, `M${lx(0.12)} ${py + 1}C${lx(0.38)} ${py - 3} ${lx(0.62)} ${py + 4} ${lx(0.88)} ${py - 1}`, { stroke: C.hairline, 'stroke-width': tall ? 20 : 24, 'stroke-linecap': 'round' });
  path(paint, `M${lx(0.16)} ${py + 7}C${lx(0.42)} ${py + 9} ${lx(0.68)} ${py + 4} ${lx(0.84)} ${py + 8}`, { stroke: C.hairline, 'stroke-width': 9, 'stroke-linecap': 'round' });
  st.fade(paint, 1.05, 1.4);
  // cracks (step 0), drawn above the paint so they show through it
  const cr = (pts) => path(svg, 'M' + pts.map((p) => `${lx(p[0]).toFixed(1)} ${ly(p[1]).toFixed(1)}`).join('L'), { ...ink, 'stroke-width': 1 });
  st.draw(cr([[0.93, 0], [0.88, 0.12], [0.92, 0.24], [0.86, 0.36], [0.9, 0.47], [0.85, 0.6]]), 0.55, 0.85);
  st.draw(cr([[0.08, 1], [0.13, 0.9], [0.1, 0.82], [0.17, 0.72]]), 0.65, 0.95);
  const paintTxt = g(svg);
  text(paintTxt, lx(0.46), py + P.fs * 0.36, d.repaint.paint, { ...word, anchor: 'middle' });
  st.fade(paintTxt, 1.3, 1.5);
  const lNote = g(svg);
  text(lNote, lx(0.46), py + 22 + P.note * 0.5, d.repaint.note, { ...noteF, anchor: 'middle', width: Hw * 0.62 });
  st.fade(lNote, 1.5, 1.75);

  // -------------------------------------------------------------------------
  // right: the same house in section, renewed from the foundations up
  // -------------------------------------------------------------------------
  const rcx = R.x0 + Hw / 2;
  st.draw(path(svg, `M${R.x0} ${GY}L${R.x0} ${eave}L${rcx} ${P.apex}L${R.x1} ${eave}L${R.x1} ${GY}`, ghost), 2.02, 2.3);
  const label = (parent, l, top, bottom) => {
    const hh = hOf(l.label, lab, tw);
    const base = top + (bottom - top - hh) / 2 + P.fs * 0.8;
    text(parent, nx, base, String(l.n), num);
    text(parent, tx, base, l.label, { ...lab, width: tw });
  };
  // a floor runs wall to wall; once the walls are solid (step 6) it stops at their inner face
  const floor = (y, a) => {
    st.draw(line(svg, ix0, y, ix1, y, ink), a, a + 0.2);
    const ends = g(svg);
    line(ends, R.x0, y, ix0, y, ink); line(ends, ix1, y, R.x1, y, ink);
    st.fade(ends, a, a + 0.2, [6.0, 6.15]);
  };

  // 1 foundations: the one field; the documents come back, filed
  const fnd = g(svg);
  rect(fnd, R.x0 - 4, GY, Hw + 8, fB - GY, { fill: C.field, 'data-audit': 'skip' });
  path(fnd, `M${R.x0 - 4} ${GY}L${R.x0 - 4} ${fB}L${R.x1 + 4} ${fB}L${R.x1 + 4} ${GY}`, ink);
  st.fade(fnd, 2.3, 2.6);
  const fl = g(svg);
  const fBase = GY + P.pad * 0.8 + P.fs * 0.8;
  text(fl, nx, fBase, String(layer.foundations.n), num);
  text(fl, tx, fBase, layer.foundations.label, { ...lab, width: tw });
  const sy = GY + P.pad * 0.8 + fLabH + 8 + 4;
  for (let k = 0; k < 5; k++) sheet(fl, tx + 5 + k * 13, sy, 0);
  st.fade(fl, 2.55, 2.85);

  // 2 utilities, 3 wiring
  floor(wireB, 3.05);
  const ul = g(svg); label(ul, layer.utilities, wireB, GY); st.fade(ul, 3.2, 3.45);
  floor(roomB, 4.05);
  const wl = g(svg); label(wl, layer.wiring, roomB, wireB); st.fade(wl, 4.2, 4.45);

  // 4 the service room: the agent hands exceptions to a person who stays
  floor(eave, 5.02);
  const room = g(svg);
  const ry = eave + P.pad + ringRy;
  text(room, nx, ry + P.fs * 0.36, String(layer.rooms.n), num);
  const ag = text(room, tx, ry + P.fs * 0.36, layer.rooms.label, word);
  const ax0 = ag.right + 6, ax1 = ax0 + (tall ? 16 : 26);
  path(room, `M${ax0} ${ry}L${ax1} ${ry}M${ax1 - 4} ${ry - 3}L${ax1} ${ry}L${ax1 - 4} ${ry + 3}`, thin);
  const px = ax1 + (tall ? 19 : 22);
  circle(room, px, ry - 8, 4.5, { fill: 'none', ...ink });
  path(room, `M${px - 9} ${ry + 12}C${px - 9} ${ry + 2} ${px - 5} ${ry - 1} ${px} ${ry - 1}C${px + 5} ${ry - 1} ${px + 9} ${ry + 2} ${px + 9} ${ry + 12}`, ink);
  st.fade(room, 5.15, 5.4);
  const rn = g(svg);
  text(rn, tx, ry + ringRy + 6 + P.note * 0.85, layer.rooms.note, { ...noteF, width: tw });
  st.fade(rn, 5.4, 5.6);
  // the ring marks the claim written under it: the person stays
  const ring = penRing(svg, px, ry + 1.5, 14.5, ringRy - 1, { seed: 11, stroke: C.accent, width: 1.3 });
  ring.paths.forEach((p, k) => st.draw(p, 5.55 + k * 0.04, 5.85 + k * 0.04));

  // 5 walls: thick, with their name inside the right wall
  [R.x0, ix0, ix1, R.x1].forEach((x) => st.draw(path(svg, `M${x} ${GY}L${x} ${eave}`, ink), 6.02, 6.3));
  st.draw(path(svg, `M${R.x0} ${eave}L${ix0} ${eave}M${ix1} ${eave}L${R.x1} ${eave}`, ink), 6.2, 6.3);
  const wal = g(svg);
  const wg = g(wal, { transform: `translate(${(R.x1 + ix1) / 2 + P.fs * 0.3} ${GY - 8}) rotate(-90)` });
  const wn = text(wg, 0, 0, String(layer.walls.n), num);
  text(wg, wn.right + 7, 0, layer.walls.label, lab);
  st.fade(wal, 6.25, 6.5);

  // 6 the inspection, under a roof drawn again in ink
  st.draw(path(svg, `M${R.x0} ${eave}L${rcx} ${P.apex}L${R.x1} ${eave}`, { ...ink, 'stroke-width': 1.5 }), 7.05, 7.35);
  const insp = g(svg);
  const ins = layer.inspection;
  const gap = P.fs + 2.5;
  const y3 = eave - 6, y2 = y3 - gap, y1 = y2 - gap;
  const nw = textSize(String(ins.n), num).w + 7, head = textSize(ins.label, lab).w + nw;
  text(insp, rcx - head / 2, y1, String(ins.n), num);
  text(insp, rcx - head / 2 + nw, y1, ins.label, lab);
  text(insp, rcx, y2, ins.lines[0], { ...lab, anchor: 'middle' });
  text(insp, rcx, y3, ins.lines[1], { ...lab, anchor: 'middle' });
  st.fade(insp, 7.3, 7.55);

  svg.dataset.bottom = Math.max(fB, GY + 22 + P.note * 2.6).toFixed(0);
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
