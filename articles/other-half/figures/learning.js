// learning: our own learning curves. One measurement plate: examples seen
// (millions, log) against the share of runs the decoder got wrong (0 to
// 2.5%, linear, from zero). One thin line per seed with its 95% intervals,
// an open accent circle at each final test value, and the two matching
// decoders as level lines. Step 0: distance 3. Step 1: distance 5 after 66
// million examples. Step 2: distance 5 on the longer schedule. All values
// are from data/learning.json.
import {
  mountFigure, svgRoot, g, h, line, rect, circle, path, bracket, leader, penRing, stage, lerp, ease, span,
} from '../../../lib/fig.js';
import { pal, pct, dotPlate, show, text, floor } from './shared.js';

export const steps = 3;
// seconds each step plays once triggered: the plate, eight seeds and the
// level lines; then the plate changes and the distance 5 seeds are drawn
// (twice): the longest steps of the article, each a whole chart
export const durations = { large: [3.0, 2.8, 2.6] };
const SIZE = { wide: [720, 474], tall: [360, 530] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

const X0 = 1e6, X1 = 3e8, YTOP = 0.025;          // the plate's scales
const XT = [1e6, 1e7, 1e8, 2.5e8], YT = [0, 0.005, 0.01, 0.015, 0.02, 0.025];
const M = (v, dgt = 1) => (v / 1e6).toFixed(dgt);
let uid = 0;

function build(el, ctx) {
  floor(ctx.layout === 'tall' ? 13.8 : 12.45);
  const C = pal(ctx), d = ctx.data, tall = ctx.layout === 'tall', print = !!ctx.print;
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const P = Object.fromEntries(d.panels.map((p) => [p.id, p]));
  const d3 = P.d3, a5 = P['d5-66m'], b5 = P['d5-250m'];
  const r2 = (v) => (v * 100).toFixed(2);
  const res = {
    d3: `network ${pct(d3.final_network.mean)} · plain ${pct(d3.levels.plain.rate)} · correlated ${pct(d3.levels.correlated.rate)} · ${d3.seeds} seeds`,
    a5: `network ${r2(a5.final_network.min)} to ${pct(a5.final_network.max)} · plain ${pct(a5.levels.plain.rate)} · correlated ${pct(a5.levels.correlated.rate)}`,
    b5: `longer schedule: network ${r2(b5.final_network.min)} to ${pct(b5.final_network.max)} · ${b5.seeds} seeds`,
  };
  const svg = svgRoot(el, W, H,
    `Our own simulated runs at a noise level of ${pct(d.noise_level, 1)}: share of runs in which a decoder was wrong, against the examples the network had seen. `
    + `Distance ${d3.distance}: the network gets better with every million examples and ends below both versions of matching (${res.d3}). `
    + `Distance ${a5.distance} after ${M(a5.training_shots, 0)} million examples: still above both (${res.a5}). `
    + `Distance ${b5.distance} after ${M(b5.training_shots, 0)} million: below plain matching, above correlated matching (${res.b5}).`);
  svg.style.color = C.ink;
  const st = stage();
  const noteO = { italic: true, size: tall || print ? 12.5 : 14 };
  const mono = { family: 'mono', size: 11.5, fill: C.muted };
  const inside = tall || print;

  const NEEDS = 'matching needs no examples; it is given the simulator’s exact error model';
  // the distance-5 plate starts where its curves come into the plate
  const crossing = (cv) => {
    const p = cv.points;
    for (let i = 1; i < p.length; i++) if (p[i - 1].rate > YTOP && p[i].rate <= YTOP) {
      const f = (p[i - 1].rate - YTOP) / (p[i - 1].rate - p[i].rate);
      return 10 ** lerp(Math.log10(p[i - 1].training_shots), Math.log10(p[i].training_shots), f);
    }
    return X0;
  };
  const c5 = Math.min(...[...a5.curves, ...b5.curves].map(crossing)), e5 = 10 ** Math.floor(Math.log10(c5));
  const X5 = Math.floor(c5 / e5) * e5, XT5 = [5e7, 1e8, 2.5e8].filter((v) => v > X5);
  const HEAD = 'how often the decoder was wrong';
  const FOOT = 'ends and levels: 2 million test runs, intervals thinner than the lines · curves: 1 million fixed runs';
  const scales = (R, x0 = X0) => {
    const x = (v) => R.x + R.w * (Math.log10(v / x0) / Math.log10(X1 / x0));
    const y = (v) => R.y + R.h * (1 - v / YTOP);
    return { x, y };
  };

  function frame(parent, R, x0 = X0, xt = XT) {
    const { x, y } = scales(R, x0), grp = g(parent);
    dotPlate(grp, R.x, R.y, R.w, R.h, 20, C);
    line(grp, R.x, R.y + R.h, R.x + R.w, R.y + R.h, { stroke: C.ink, 'stroke-width': 1.25 });
    line(grp, R.x, R.y, R.x, R.y + R.h, { stroke: C.ink, 'stroke-width': 0.8 });
    for (const v of xt) {
      line(grp, x(v), R.y + R.h, x(v), R.y + R.h + 5, { stroke: C.ink, 'stroke-width': 1 });
      text(grp, x(v), R.y + R.h + 19, M(v, 0), { ...mono, anchor: 'middle' });
    }
    for (const v of YT) {
      line(grp, R.x - 4, y(v), R.x, y(v), { stroke: C.ink, 'stroke-width': 1 });
      text(grp, R.x - 8, y(v) + 4, v === 0 ? '0' : `${+(v * 100).toFixed(1)}%`, { ...mono, anchor: 'end' });
    }
    text(grp, R.x + R.w, R.y + R.h + 36, 'examples the network has seen, in millions', { family: 'sans', size: 12, fill: C.muted, anchor: 'end' });
    return grp;
  }

  // one panel's data on a plate
  function panel(parent, pn, R, o = {}) {
    const x0 = o.x0 || X0;
    const { x, y } = scales(R, x0), root = g(parent);
    const id = `lc${++uid}`;
    const cp = h('clipPath', { id }, root);
    rect(cp, R.x, R.y, R.w + 8, R.h);
    const levels = g(root), body = g(root, { 'clip-path': `url(#${id})` }), ends = g(root);
    const xr = R.x + R.w + (inside ? 0 : 4);
    const lv = pn.levels;
    for (const k of ['plain', 'correlated', 'table']) {
      if (!lv[k]) continue;
      const yy = y(lv[k].rate), hi = y(lv[k].ci95[1]), lo = y(lv[k].ci95[0]);
      rect(levels, R.x, hi, xr - R.x, Math.max(0.5, lo - hi), { fill: C.ink, opacity: 0.16, 'data-audit': 'skip' });
      line(levels, R.x, yy, xr, yy, { stroke: C.ink, 'stroke-width': 1, 'stroke-dasharray': k === 'table' ? '1 4' : null, 'stroke-linecap': 'round' });
    }
    const lines = pn.curves.map((cv) => {
      const pts = cv.points.map((q) => [x(q.training_shots), y(q.rate)]);
      const pth = path(body, pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join(''), { stroke: C.ink, 'stroke-width': 1.1, 'stroke-opacity': 0.85, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
      const wh = g(body);
      cv.points.forEach((q) => { if (q.rate <= YTOP) line(wh, x(q.training_shots), y(q.ci95[0]), x(q.training_shots), y(q.ci95[1]), { stroke: C.ink, 'stroke-width': 0.8 }); });
      return { pth, wh };
    });
    const xe = x(pn.training_shots);
    pn.final_network.per_seed.forEach((s) => {
      line(ends, xe, y(s.ci95[0]), xe, y(s.ci95[1]), { stroke: C.accent, 'stroke-width': 1 });
      circle(ends, xe, y(s.rate), 3.1, { fill: C.paper, stroke: C.accent, 'stroke-width': 1.5 });
    });
    // where the first line comes in at the top edge
    const c0 = pn.curves[0].points;
    let entry = R.x;
    for (let i = 1; i < c0.length; i++) {
      if (c0[i - 1].rate > YTOP && c0[i].rate <= YTOP) {
        const f = (c0[i - 1].rate - YTOP) / (c0[i - 1].rate - c0[i].rate);
        entry = lerp(x(c0[i - 1].training_shots), x(c0[i].training_shots), f);
      }
    }
    return { root, levels, body, ends, lines, x, y, xe, entry, R, pn, x0, first: Math.max(...pn.curves.map((cv) => cv.points[0].rate)) };
  }

  // labels of the level lines and the notes that belong to a panel
  function labels(parent, pl, o = {}) {
    const { R, pn, y } = pl, lv = pn.levels, grp = g(parent);
    const yp = y(lv.plain.rate), yc = y(lv.correlated.rate);
    const close = yc - yp < 16;
    const needs = NEEDS;
    if (!inside) {
      const lx = R.x + R.w + 9, lw = W - lx - 6;
      text(grp, lx, close ? yp - 4 : yp + 4.5, 'plain matching', noteO);
      const cl = text(grp, lx, close ? yc + 14 : yc + 4.5, 'correlated matching', noteO);
      let yy = cl.bottom;
      if (lv.table) yy = text(grp, lx, Math.max(y(lv.table.rate) + 14, yy + 14), `best possible at this size (lookup table): [[${pct(lv.table.rate)}]]`, { ...noteO, width: lw }).bottom;
      text(grp, lx, yy + 26, needs, { ...noteO, size: 13, fill: C.muted, width: lw });
    } else if (close && tall) {
      // phone plate: the curves cross the level lines on the left half, so the
      // labels stand higher on the right with a leader down to the lines, and
      // the lookup-table note goes under the end circles in two lines
      const xr = R.x + R.w - 4;
      const lt = text(grp, xr, yp - 44, 'plain matching and,\njust under it, correlated matching', { ...noteO, anchor: 'end', lh: 15 });
      leader(grp, xr - 8, lt.bottom + 3, xr - 8, yp - 2, { stroke: C.muted, dot: false });
      if (lv.table) text(grp, xr, y(lv.table.rate) + 19, `best possible at this size\n(lookup table): [[${pct(lv.table.rate)}]]`, { ...noteO, anchor: 'end', lh: 15 });
    } else if (close) {
      text(grp, R.x + R.w - 4, yp - 21, 'plain matching and,\njust under it, correlated matching', { ...noteO, anchor: 'end', lh: 15 });
      if (lv.table) text(grp, R.x + R.w - 4, y(lv.table.rate) + 15, `best possible at this size (lookup table): [[${pct(lv.table.rate)}]]`, { ...noteO, anchor: 'end' });
    } else {
      text(grp, R.x + 6, yp - 6, 'plain matching', noteO);
      text(grp, R.x + 6, yc - 6, 'correlated matching', noteO);
      if (print) text(grp, R.x + 6, yc + 17, needs, { ...noteO, fill: C.muted, width: Math.min(R.w * 0.62, 190) });
    }
    const fp = `first point ${(pl.first * 100).toFixed(pl.first < 0.2 ? 1 : 0)}%`;
    if (pl.x0 > X0) text(grp, R.x + R.w - 6, R.y + 15, inside ? fp + ',' + String.fromCharCode(10) + 'off the plate' : `${fp}, off the plate`, { ...mono, anchor: 'end', fill: C.ink, lh: 14 });
    else text(grp, pl.entry + 36, R.y + 15, fp, { ...mono, fill: C.ink });
    // the last fifth of the run
    const xa = pl.x(pn.training_shots * 0.8), xb = pl.xe, by = R.y + R.h - 9;
    bracket(grp, xa, by, xb, by, 4, { stroke: C.muted, 'stroke-width': 1 });
    if (o.fifth !== false) text(grp, xa - 7, by + 4 - (inside ? 15 : 0), 'the last fifth of each run lowers the learning rate', { ...noteO, anchor: 'end', fill: C.muted, width: inside ? 150 : 400, lh: 15 });
    return grp;
  }

  function dipNote(parent, pl) {
    const vals = [...new Set(pl.pn.curves.map((cv) => cv.first_point_below_plain).filter(Boolean))].sort((a, b) => a - b);
    if (!vals.length) return null;
    const grp = g(parent), yp = pl.y(pl.pn.levels.plain.rate);
    const xa = pl.x(vals[0]), xb = pl.x(vals[vals.length - 1]), xm = (xa + xb) / 2;
    const ny = pl.y(tall ? 0.0088 : 0.0098);
    const nt = text(grp, inside ? pl.R.x + 44 : xm - 60, ny, `the lines first dip below plain matching at [[${vals.map((v) => M(v)).join(']] or [[')}]] million examples`, { ...noteO, width: inside ? 170 : 250, lh: inside ? 15 : 18 });
    leader(grp, xm, nt.y - 4, xm, yp + (inside ? 50 : 32), { stroke: C.muted, dot: false });
    return grp;
  }

  const title = (parent, R, pn, extra) => text(parent, R.x, R.y - 10,
    `distance ${pn.distance}[[  ·  ${extra}]]`, { family: 'sans', size: 13.5, weight: 600, monoWeight: 400 });
  const rounds = (pn) => `runs of ${pn.rounds} rounds`;
  const tagStr = `our runs · simulation · noise level ${pct(d.noise_level, 1)}`;
  const probe = 'curves: 1 million fixed runs per seed · levels and end circles: 2 million fresh runs per seed';
  const notCmp = `d${a5.distance} runs are ${WORD(a5.rounds)} rounds, d${d3.distance} runs ${WORD(d3.rounds)}: not comparable across distances`;
  function WORD(n) { return ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'][n] || String(n); }

  // ---- print: two plates side by side --------------------------------------
  if (print) {
    const R1 = { x: 46, y: 62, w: 286, h: 250 }, R2 = { x: 408, y: 62, w: 286, h: 250 };
    text(svg, R1.x, 18, HEAD, { family: 'sans', size: 13, weight: 600 });
    text(svg, R2.x + R2.w, 18, tagStr, { ...mono, anchor: 'end' });
    frame(svg, R1); frame(svg, R2, X5, XT5);
    const p3 = panel(svg, d3, R1); labels(svg, p3); dipNote(svg, p3);
    title(svg, R1, d3, `${d3.seeds} seeds · ${rounds(d3)}`);
    const pa = panel(svg, a5, R2, { x0: X5 }); pa.body.setAttribute('opacity', 0.38); pa.ends.setAttribute('opacity', 0.5); pa.levels.style.display = 'none';
    const pb = panel(svg, b5, R2, { x0: X5 }); labels(svg, pb);
    title(svg, R2, b5, `${a5.seeds} + ${b5.seeds} seeds · ${rounds(b5)}`);
    text(svg, R2.x, 438, `not comparable with distance ${d3.distance}: ${rounds(d3)} there, ${rounds(b5)} here`, { ...mono, width: 300, lh: 15 });
    const ys = pb.pn.final_network.per_seed.map((s) => pb.y(s.rate));
    penRing(svg, pb.xe, (Math.min(...ys) + Math.max(...ys)) / 2, 8, (Math.max(...ys) - Math.min(...ys)) / 2 + 8, { seed: 4, stroke: C.accent, width: 1.4 });
    text(svg, R1.x, 372, res.d3, { ...mono, fill: C.ink, width: 300, lh: 15 });
    text(svg, R2.x, 372, `faint, ${M(a5.training_shots, 0)} million: ${res.a5}\n${res.b5}`, { ...mono, fill: C.ink, width: 300, lh: 15 });
    text(svg, R1.x, 418, FOOT, { ...mono, width: 300, lh: 15 });
    return { set() {} };
  }

  // ---- screen: one plate, three panels -------------------------------------
  const R = tall ? { x: 42, y: 76, w: 304, h: 250 } : { x: 62, y: 60, w: 496, h: 296 };
  const fr = frame(svg, R), fr5 = frame(svg, R, X5, XT5);
  const tg = g(svg);
  text(g(tg, { 'data-role': 'title' }), tall ? R.x : 16, 16, tall ? 'how often the decoder was wrong' : HEAD, { family: 'sans', size: 13, weight: 600 });
  if (tall) text(tg, 14, 33, tagStr, mono); else text(tg, W - 8, 16, tagStr, { ...mono, anchor: 'end' });
  if (!tall) {
    // rotated axis title, centred on the plate, its letters 10 units clear
    // of the drawing's left edge so that no frame crops it
    const rot = g(tg, { transform: `translate(21 ${R.y + R.h / 2}) rotate(-90)`, 'data-audit': 'skip' });
    text(rot, 0, 0, 'share of runs in which the decoder was wrong', { family: 'sans', size: 12, fill: C.muted, anchor: 'middle' });
  }
  st.fade(fr, 0, 0.12, [1.14, 1.2]).fade(fr5, 1.18, 1.26).fade(tg, 0, 0.12);

  const p3 = panel(svg, d3, R), pa = panel(svg, a5, R, { x0: X5 }), pb = panel(svg, b5, R, { x0: X5 });
  const l3 = labels(svg, p3), la = labels(svg, pa, { fifth: false }), lb = labels(svg, pb, { fifth: true });
  const dip = dipNote(svg, p3);
  const t3 = g(svg), ta = g(svg), tb = g(svg);
  title(t3, R, d3, tall ? `${d3.seeds} seeds` : `${d3.seeds} seeds, one line each · ${rounds(d3)}`);
  title(ta, R, a5, tall ? `${a5.seeds} seeds` : `${a5.seeds} seeds · ${rounds(a5)}, not comparable with distance ${d3.distance}`);
  title(tb, R, b5, tall ? `${a5.seeds} + ${b5.seeds} seeds` : `${a5.seeds} + ${b5.seeds} seeds · ${rounds(b5)}, not comparable with distance ${d3.distance}`);

  const drawPanel = (pl, a, b) => {
    st.fade(pl.levels, a, a + 0.15);
    pl.lines.forEach((ln, i) => { st.draw(ln.pth, a + 0.12 + i * 0.015, b - 0.12 + i * 0.015); st.fade(ln.wh, b - 0.14, b - 0.04); });
    st.fade(pl.ends, b - 0.1, b);
  };
  // step 0: distance 3
  drawPanel(p3, 0.08, 0.86);
  st.fade(t3, 0.05, 0.2, [1, 1.12]).fade(l3, 0.25, 0.42, [1, 1.12]);
  if (dip) st.fade(dip, 0.86, 0.98, [1, 1.12]);
  // step 1: distance 3 becomes a faint inset; distance 5 after 66 million
  // Strokes keep their width while the drawing shrinks. The attribute is
  // set only while it is shrunk: with it, Chrome ignores pathLength for
  // dashes, and the lines drawn on would appear in the wrong order.
  const p3rVE = [...p3.root.querySelectorAll('path, circle, line')];
  let p3rVe = false;
  const p3rKeep = (on) => { if (on === p3rVe) return; p3rVe = on; p3rVE.forEach((n) => (on ? n.setAttribute('vector-effect', 'non-scaling-stroke') : n.removeAttribute('vector-effect'))); };
  const I = tall ? { x: R.x + 12, y: R.y + R.h - 84, w: 104, h: 50 } : { x: R.x + 22, y: R.y + R.h - 98, w: 150, h: 62 };
  const ig = g(svg);
  rect(ig, I.x, I.y, I.w, I.h, { fill: 'none', stroke: C.hairline, 'stroke-width': 1 });
  text(ig, I.x, I.y - 6, tall ? `distance ${d3.distance}: ends below both` : `distance ${d3.distance}: the network ends below both`, mono);
  st.fade(ig, 1.3, 1.45);
  st.on((gg) => {
    const m = ease(span(gg, 1.02, 1.4));
    p3rKeep(m > 0);
    if (m <= 0) { p3.root.removeAttribute('transform'); p3.root.style.opacity = ''; return; }
    const kx = lerp(1, I.w / R.w, m), ky = lerp(1, I.h / R.h, m);
    const tx = lerp(R.x, I.x, m), ty = lerp(R.y, I.y, m);
    p3.root.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${kx.toFixed(4)} ${ky.toFixed(4)}) translate(${-R.x} ${-R.y})`);
    p3.root.style.opacity = lerp(1, 0.5, m).toFixed(3);
  });
  drawPanel(pa, 1.3, 1.9);
  st.fade(ta, 1.2, 1.34, [2.04, 2.14]).fade(la, 1.42, 1.6, [2.04, 2.14]);
  const na = g(svg);
  text(na, R.x + R.w * 0.42, R.y + (tall ? 50 : 62), 'same network, same number of examples: still above both', { ...noteO, size: tall ? 13 : 15, width: tall ? 160 : 240 });
  st.fade(na, 1.82, 1.98, [2.04, 2.14]);
  // step 2: the longer schedule; the 66-million lines stay, faint
  st.on((gg) => {
    const m = ease(span(gg, 2.06, 2.28));
    pa.body.style.opacity = gg < 1.3 ? '' : lerp(1, 0.38, m).toFixed(3);
    show(pa.levels, ease(span(gg, 1.3, 1.45)) * (1 - m));
    if (gg >= 1.9) pa.ends.style.opacity = lerp(1, 0.5, m).toFixed(3);
  });
  drawPanel(pb, 2.12, 2.82);
  st.fade(tb, 2.12, 2.28).fade(lb, 2.26, 2.42);
  const ys = b5.final_network.per_seed.map((s) => pb.y(s.rate));
  const ry = (Math.min(...ys) + Math.max(...ys)) / 2;
  const pr = penRing(svg, pb.xe, ry, 8, (Math.max(...ys) - Math.min(...ys)) / 2 + 8, { seed: 4, stroke: C.accent, width: 1.5 });
  pr.paths.forEach((pp, k) => st.draw(pp, 2.84 + k * 0.03, 2.97 + k * 0.02));
  const nb = g(svg);
  if (tall) {
    text(nb, R.x + R.w * 0.44, R.y + R.h - 62, 'below plain matching, above correlated matching', { ...noteO, size: 13, width: 168, lh: 15 });
  } else {
    const yl = (pb.y(b5.levels.plain.rate) + pb.y(b5.levels.correlated.rate)) / 2;
    const nt = text(nb, pb.xe - 44, yl + 5, 'below plain matching, above correlated matching', { ...noteO, size: 14.5, anchor: 'end' });
    leader(nb, nt.right + 5, yl, pb.xe - 13, ry + 5, { stroke: C.muted, dot: false });
  }
  st.fade(nb, 2.84, 2.98);

  // under the plate: the end values, then how they were scored
  const by = R.y + R.h + (tall ? 58 : 62);
  const lw = W - R.x - 8;
  const r3 = g(svg), ra = g(svg), rb = g(svg), foot = g(svg);
  const o = { ...mono, fill: C.ink, width: tall ? W - 28 : lw, lh: 15 };
  text(r3, tall ? 14 : R.x, by, res.d3, o);
  const t1 = text(ra, tall ? 14 : R.x, by, res.a5, o);
  text(rb, tall ? 14 : R.x, by, res.b5, o);
  text(foot, tall ? 14 : 16, t1.bottom + 20, tall ? `${FOOT}\n${notCmp}` : FOOT, { ...mono, width: tall ? W - 28 : W - 20, lh: 15 });
  st.fade(r3, 0.86, 0.98, [1, 1.12]).fade(ra, 1.84, 1.98, [2.04, 2.14]).fade(rb, 2.8, 2.94).fade(foot, 0.1, 0.25);

  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
