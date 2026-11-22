// reels (section 9, three result paragraphs and one rest): how much film our
// small reader was given, and how often it was then wrong.
//  1  distance 3: a reel of 66 million examples runs into our small reader; on
//     distance 3's own scale its eight seeds sit below both matchings (the win
//     over correlated matching is flagged: we don't count it)
//  2  distance 5, a reel of the same length: five seeds, above both
//  3  distance 5, a reel nearly four times longer (to scale): the seeds move
//     between the two (the earlier ones stay as ghosts)
// Reel lengths are the examples each run was given, to scale; no multiplier.
// Each distance has its own error scale. Data: studio/data/reels.json, from
// data/learning.json (our runs, noise level 0.5%, 2 million test runs per seed).
import { el, span, draw, settle, label, penPath, plan, DESIGN } from '../verbs.js';
import { gate, strip } from './parts.js';

const D = await (await fetch(new URL('../data/reels.json', import.meta.url))).json();
const P3 = D.panels.find((p) => p.id === 'd3'), P66 = D.panels.find((p) => p.id === 'd5-66m'), P250 = D.panels.find((p) => p.id === 'd5-250m');

export default {
  steps: [{}, {}, {}],
  mount(svg, ctx) {
    const lay = ctx.layout, wide = lay === 'wide';
    const [VW, VH] = DESIGN[lay];
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const C = { ink: css('--ink'), muted: css('--muted'), hair: css('--hairline'), accent: css('--accent'), field: css('--field'), paper: css('--paper') };
    const fs = wide ? 15 : 14;
    const font = (size = fs) => ({ 'font-family': 'Libre Franklin, sans-serif', 'font-size': size });
    const mono = (size = fs) => ({ 'font-family': 'JetBrains Mono, monospace', 'font-size': size });
    const G = {
      tall: { rows: [118, 300], end: 178, max: 160, gw: 52, ax: [210, 350], fw: 9, fh: 9 },
      mid: { rows: [92, 226], end: 196, max: 176, gw: 52, ax: [270, 392], fw: 9, fh: 9 },
      wide: { rows: [128, 300], end: 400, max: 340, gw: 72, ax: [500, 700], fw: 12, fh: 12 },
    }[lay];
    const lenOf = (n) => G.max * n / P250.examples;

    const rows = [P3, P66].map((p, i) => {
      const y = G.rows[i];
      const g = el('g', {}, svg);
      const R = gate(g, C, G.end, y - 40 * G.gw / 120, G.gw);
      const title = el('text', { x: G.end - G.max, y: y - (wide ? 40 : 34), fill: C.ink, ...font() }, svg);
      title.textContent = `distance ${p.distance}`;
      // this distance's own scale: share of runs wrong, %
      const lo = i === 0 ? 1.4 : 0.9, hi = i === 0 ? 1.8 : 2.3;
      const X = (r) => G.ax[0] + (G.ax[1] - G.ax[0]) * (r * 100 - lo) / (hi - lo);
      const axis = el('path', { d: penPath([[G.ax[0], y + 12], [G.ax[1], y + 12]]), stroke: C.muted, 'stroke-width': 1.1, fill: 'none' }, svg);
      const ends = [[G.ax[0], `${lo}%`, 'start'], [G.ax[1], `${hi}%`, 'end']].map(([x, t, a]) => { const e = el('text', { x, y: y + 30, 'text-anchor': a, fill: C.muted, ...mono(fs - 2) }, svg); e.textContent = t; return e; });
      // the two matchings as level marks; names above, staggered so close ones don't collide
      const lev = [['plain', p.plain, 0], ['correlated', p.correlated, 1]].map(([name, r, row]) => {
        const x = X(r);
        const tick = el('path', { d: penPath([[x, y - 14 - row * 14], [x, y + 18]]), stroke: C.ink, 'stroke-width': 1.6, fill: 'none' }, svg);
        const t = el('text', { x, y: y - 20 - row * 14, 'text-anchor': 'middle', fill: C.ink, ...font(fs - 1) }, svg);
        t.textContent = name;
        return { tick, t };
      });
      const seedsG = (q) => {
        const sg = el('g', {}, svg);
        q.seeds.forEach((s, j) => {
          const yy = y - 6 + (j % 4) * 4;
          el('path', { d: penPath([[X(s.ci95[0]), yy], [X(s.ci95[1]), yy]]), stroke: C.accent, 'stroke-width': 1, fill: 'none' }, sg);
          el('circle', { cx: X(s.rate), cy: yy, r: wide ? 3 : 2.6, fill: C.accent }, sg);
        });
        return sg;
      };
      if (wide) { const m = el('text', { x: (G.ax[0] + G.ax[1]) / 2, y: y + 30, 'text-anchor': 'middle', fill: C.muted, ...font(fs - 2) }, svg); m.textContent = 'share of runs wrong'; ends.push(m); }
      return { y, g, R, title, axis, ends, lev, X, seedsG };
    });
    const s3 = rows[0].seedsG(P3), s66 = rows[1].seedsG(P66), s250 = rows[1].seedsG(P250);
    const reel = (i, n) => strip(svg, C, [[rows[i].R.inAt[0] - lenOf(n), rows[i].y], rows[i].R.inAt], G.fw, G.fh, (k) => (k % 5 === 2 ? [k % 8] : []));
    const r3 = reel(0, P3.examples), r66 = reel(1, P66.examples), r250 = reel(1, P250.examples);
    const cap = (i, txt) => { const t = el('text', { x: rows[i].R.inAt[0], y: rows[i].y + (wide ? 30 : 26), 'text-anchor': 'end', fill: C.muted, ...font(fs - 1) }, svg); t.textContent = txt; return t; };
    const c3 = cap(0, '66 million examples'), c66 = cap(1, '66 million'), c250 = cap(1, 'about 250 million examples');
    const flag = el('text', { x: G.ax[0], y: rows[0].y + (wide ? 50 : 46), fill: C.muted, ...font(fs - 2) }, svg);
    flag.textContent = wide ? 'the win over correlated: not counted (see below)' : 'not counted (see below)';
    const ours = el('text', { x: G.end + G.gw / 2, y: rows[0].y - 40 * G.gw / 120 - 8, 'text-anchor': 'middle', fill: C.ink, ...font(fs - 1) }, svg);
    ours.textContent = 'our network';
    const tag = el('text', { x: VW - 6, y: VH - 6, 'text-anchor': 'end', fill: C.muted, ...mono(fs - 2) }, svg);
    tag.textContent = 'our runs · noise 0.5%';

    const runReel = (parts, u) => { for (const p of parts) { p.edges.forEach((e) => draw(e, u)); p.frames.forEach((f, i) => settle(f, span(u, i / p.frames.length, (i + 1) / p.frames.length))); } };
    const P = [
      plan([{ at: 0, dur: 0.45 }, { at: 0.3, dur: 0.6 }, { at: 0.8, dur: 0.3 }, { at: 1.0, dur: 0.3 }, { at: 1.25, dur: 0.25 }]),
      plan([{ at: 0, dur: 0.45 }, { at: 0.3, dur: 0.6 }, { at: 0.8, dur: 0.3 }, { at: 1.0, dur: 0.3 }]),
      plan([{ at: 0, dur: 1.0 }, { at: 0.9, dur: 0.3 }, { at: 1.1, dur: 0.3 }]),
    ];
    const at = (pos, s, i) => (pos >= s ? 1 : pos <= s - 1 ? 0 : span(pos - (s - 1), ...P[s - 1].w(i)));
    const rowShow = (r, d, axisU) => {
      r.R.strokes.forEach((s) => draw(s, d)); label(r.title, d);
      draw(r.axis, axisU); r.ends.forEach((e) => label(e, axisU));
      r.lev.forEach((l) => { draw(l.tick, axisU); label(l.t, axisU); });
    };

    function render(pos) {
      rowShow(rows[0], at(pos, 1, 0), at(pos, 1, 2));
      runReel(r3, at(pos, 1, 1)); label(c3, at(pos, 1, 1)); label(ours, at(pos, 1, 0));
      settle(s3, at(pos, 1, 3)); label(flag, at(pos, 1, 4)); label(tag, at(pos, 1, 4));
      rowShow(rows[1], at(pos, 2, 0), at(pos, 2, 2));
      const grow = at(pos, 3, 0);
      runReel(r66, at(pos, 2, 1) * (1 - (grow > 0 ? 1 : 0)));
      label(c66, at(pos, 2, 1) * (grow > 0 ? 1 - grow : 1));
      runReel(r250, grow > 0 ? grow : 0);
      label(c250, at(pos, 3, 1));
      const g66 = at(pos, 2, 3);
      s66.style.opacity = pos > 2 && at(pos, 3, 1) > 0 ? 0.35 : g66;
      settle(s250, at(pos, 3, 2));
    }
    const durs = P.map((p) => p.total);
    return {
      render,
      dur: (s) => durs[s - 1],
      alone: 3,
      desc: (s) => [
        'Distance 3: after 66 million examples our network is wrong less often than both matching programs.',
        'Distance 5, the same 66 million examples: it is wrong more often than both.',
        'Distance 5, about 250 million examples: it passes plain matching only at the end, still behind correlated matching.',
      ][s - 1],
    };
  },
};
