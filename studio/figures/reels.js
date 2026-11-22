// reels (section 9, three result paragraphs and one rest): how much film our
// small reader was given, and how often it was then wrong.
//  1  distance 3: a reel of 66 million examples runs into our small reader; on
//     distance 3's own scale its eight seeds sit below both matchings (the win
//     over correlated matching is flagged: we don't count it)
//  2  distance 5, a reel of the same length: five seeds, above both
//  3  distance 5, a reel nearly four times longer (to scale): the seeds move
//     between the two (the earlier ones stay as ghosts)
// Each row: the reel (to scale, labelled as examples), then its own error
// scale, full width, "fewer wrong" to the left. Data: studio/data/reels.json,
// from data/learning.json (our runs, noise level 0.5%, 2 million test runs per seed).
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
    const C = { ink: css('--ink'), muted: css('--muted'), hair: css('--hairline'), accent: css('--accent'), paper: css('--paper') };
    const fs = 15;
    const font = (size = fs - 1) => ({ 'font-family': 'Libre Franklin, sans-serif', 'font-size': size });
    const mono = (size = fs - 1) => ({ 'font-family': 'JetBrains Mono, monospace', 'font-size': size });
    const x0 = wide ? 30 : 14, x1 = VW - x0;
    const top = { tall: [18, 206], mid: [12, 160], wide: [22, 226] }[lay];
    const rowH = { tall: 176, mid: 146, wide: 196 }[lay];
    const gw = wide ? 64 : 46, fw = wide ? 12 : 9;
    const reelMax = x1 - x0 - gw - 8;
    const lenOf = (n) => reelMax * n / P250.examples;

    const rows = [P3, P66].map((p, i) => {
      const y0 = top[i];
      const title = el('text', { x: x0, y: y0 + 14, fill: C.ink, ...font(fs) }, svg);
      title.textContent = `distance ${p.distance}`;
      const ry = y0 + (wide ? 46 : 40);
      const g = el('g', {}, svg);
      const R = gate(g, C, x1 - gw, ry - 44 * gw / 120, gw);
      // this distance's own scale, full width
      const ay = y0 + rowH - (wide ? 66 : 58);
      const lo = i === 0 ? 1.4 : 0.9, hi = i === 0 ? 1.8 : 2.3;
      const X = (r) => x0 + (x1 - x0) * (r * 100 - lo) / (hi - lo);
      const axis = el('path', { d: penPath([[x0, ay], [x1, ay]]), stroke: C.muted, 'stroke-width': 1.1, fill: 'none' }, svg);
      const lab = [
        [x0, `${lo}%`, 'start'], [(x0 + x1) / 2, '← fewer wrong', 'middle'], [x1, `${hi}%`, 'end'],
      ].map(([x, t, a]) => { const e = el('text', { x, y: ay + 46, 'text-anchor': a, fill: C.muted, ...mono(fs - 1) }, svg); e.textContent = t; return e; });
      // the two matchings: one name above the axis, one below; never stacked
      const lev = [['plain matching', p.plain, -1], ['correlated', p.correlated, 1]].map(([name, r, side]) => {
        const x = X(r);
        const tick = el('path', { d: penPath([[x, ay - 10], [x, ay + 10]]), stroke: C.ink, 'stroke-width': 1.8, fill: 'none' }, svg);
        const t = el('text', { x, y: side < 0 ? ay - 14 : ay + 24, 'text-anchor': 'middle', fill: C.ink, ...font() }, svg);
        t.textContent = name;
        return { tick, t };
      });
      const seedsG = (q) => {
        const sg = el('g', {}, svg);
        q.seeds.forEach((s, j) => {
          const yy = ay - 4 + (j % 3) * 4;
          el('path', { d: penPath([[X(s.ci95[0]), yy], [X(s.ci95[1]), yy]]), stroke: C.accent, 'stroke-width': 1.2, fill: 'none' }, sg);
          el('path', { d: penPath([[X(s.rate), yy - 4], [X(s.rate), yy + 4]]), stroke: C.accent, 'stroke-width': 2.4, 'stroke-linecap': 'round', fill: 'none' }, sg);
        });
        return sg;
      };
      return { y0, ry, ay, g, R, title, axis, lab, lev, X, seedsG };
    });
    const s3 = rows[0].seedsG(P3), s66 = rows[1].seedsG(P66), s250 = rows[1].seedsG(P250);
    const reel = (i, n) => strip(svg, C, [[rows[i].R.inAt[0] - lenOf(n), rows[i].ry], rows[i].R.inAt], fw, fw, (k) => (k % 5 === 2 ? [k % 8] : []));
    const r3 = reel(0, P3.examples), r66 = reel(1, P66.examples), r250 = reel(1, P250.examples);
    // the reel's caption: under the reel when there is room, else on the title line
    const cap = (i, n, txt) => { const t = wide ? el('text', { x: rows[i].R.inAt[0] - lenOf(n), y: rows[i].ry + fw + 16, fill: C.muted, ...font() }, svg) : el('text', { x: x0 + 86, y: rows[i].y0 + 14, fill: C.muted, ...font() }, svg); t.textContent = txt; return t; };
    const c3 = cap(0, P3.examples, '66 million examples'), c66 = cap(1, P66.examples, '66 million examples'), c250 = cap(1, P250.examples, 'about 250 million examples');
    const ours = el('text', { x: x1, y: rows[0].ry - 44 * gw / 120 - 6, 'text-anchor': 'end', fill: C.ink, ...font() }, svg);
    ours.textContent = 'our network';
    const flag = el('text', { x: x0, y: wide ? rows[0].ay - 32 : rows[0].ay + 24, fill: C.muted, ...font() }, svg);
    flag.textContent = wide ? 'below correlated: not counted (see below)' : '';   // on phones the paragraph says it: no room for a fourth line
    const tag = el('text', { x: VW - 6, y: VH - 6, 'text-anchor': 'end', fill: C.muted, ...mono(fs - 1) }, svg);
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
      draw(r.axis, axisU); r.lab.forEach((e) => label(e, axisU));
      r.lev.forEach((l) => { draw(l.tick, axisU); label(l.t, axisU); });
    };
    function render(pos) {
      rowShow(rows[0], at(pos, 1, 0), at(pos, 1, 2));
      runReel(r3, at(pos, 1, 1)); label(c3, at(pos, 1, 1)); label(ours, at(pos, 1, 0));
      settle(s3, at(pos, 1, 3)); label(flag, at(pos, 1, 4)); label(tag, at(pos, 1, 4));
      rowShow(rows[1], at(pos, 2, 0), at(pos, 2, 2));
      const grow = at(pos, 3, 0);
      runReel(r66, grow > 0 ? 0 : at(pos, 2, 1));
      label(c66, grow > 0 ? 0 : at(pos, 2, 1));
      runReel(r250, grow);
      label(c250, at(pos, 3, 1));
      s66.style.opacity = pos > 2 && at(pos, 3, 1) > 0 ? 0.35 : at(pos, 2, 3);
      settle(s250, at(pos, 3, 2));
    }
    const durs = P.map((p) => p.total);
    return {
      render,
      dur: (s) => durs[s - 1],
      alone: 3,
      desc: (s) => [
        'Distance 3: after 66 million examples our network is wrong less often than plain matching; below correlated matching too, a win we do not count.',
        'Distance 5, the same 66 million examples: it is wrong more often than both.',
        'Distance 5, about 250 million examples: it passes plain matching only at the end, still behind correlated matching.',
      ][s - 1],
    };
  },
};
