// ladder (section 7): on Google's chip each step to a bigger grid halved the
// errors; the network's errors halve a little faster.
//  1  the grid at distances 3, 5, 7 (the camera moves the character aside, the
//     bigger grids draw beside it), and under each a pile of its errors, halving
//  2  a faint distance-9 grid: 64 more qubits for one more halving
//  3  the network's piles beside the first; at distance 7, 171 against 143
//  4  rest (other labs)
// Data: data/suppression.json (Google Quantum AI, Nature 638 (2025), Table S1 and
// Sec. II): logical errors per 100,000 rounds, best matching 712, 349, 171;
// network 650, 303, 143. Qubits 17, 49, 97 (and 161 at distance 9, our arithmetic).
import { el, span, ease, draw, settle, label, penPath, plan, DESIGN } from '../verbs.js';

const MATCH = [712, 349, 171], NET = [650, 303, 143], QUBITS = [17, 49, 97, 161];

export default {
  steps: [{}, {}, {}],
  mount(svg, ctx) {
    const lay = ctx.layout, wide = lay === 'wide';
    const [VW, VH] = DESIGN[lay];
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const C = { ink: css('--ink'), muted: css('--muted'), hair: css('--hairline'), accent: css('--accent'), field: css('--field'), paper: css('--paper') };
    const fs = 15;
    const font = (size = fs) => ({ 'font-family': 'Libre Franklin, sans-serif', 'font-size': size });
    const mono = (size = fs) => ({ 'font-family': 'JetBrains Mono, monospace', 'font-size': size });

    const L = {
      tall: { xs: [46, 126, 216, 304], gy: 74, span: [40, 56, 70, 80], base: 352, hmax: 170, pw: 13 },
      mid: { xs: [56, 146, 246, 344], gy: 64, span: [36, 50, 62, 72], base: 276, hmax: 132, pw: 12 },
      wide: { xs: [120, 270, 440, 610], gy: 82, span: [56, 80, 100, 116], base: 396, hmax: 200, pw: 20 },
    }[lay];
    // a d x d grid: qubits on the corners of (d-1)^2 cells, centred at x, gy
    const gridD = (g, x, d, w) => {
      const c = w / (d - 1), x0 = x - w / 2, y0 = L.gy - w / 2, out = [];
      for (let i = 0; i < d; i++) {
        out.push(el('path', { d: penPath([[x0, y0 + i * c], [x0 + w, y0 + i * c]]), stroke: C.ink, 'stroke-width': 1.1, fill: 'none' }, g));
        out.push(el('path', { d: penPath([[x0 + i * c, y0], [x0 + i * c, y0 + w]]), stroke: C.ink, 'stroke-width': 1.1, fill: 'none' }, g));
      }
      const r = Math.max(1.8, c * 0.16);
      for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) out.push(el('circle', { cx: x0 + j * c, cy: y0 + i * c, r, fill: C.paper, stroke: C.ink, 'stroke-width': 1 }, g));
      return out;
    };
    const grids = [3, 5, 7, 9].map((d, i) => { const g = el('g', {}, svg); return { g, parts: gridD(g, L.xs[i], d, L.span[i]) }; });
    const qlab = QUBITS.map((n, i) => { const t = el('text', { x: L.xs[i], y: L.gy + L.span[i] / 2 + (wide ? 22 : 18), 'text-anchor': 'middle', fill: C.muted, ...mono(fs - 1) }, svg); t.textContent = `${n} qubits`; return t; });
    const dlab = [3, 5, 7, 9].map((d, i) => { const t = el('text', { x: L.xs[i], y: L.gy - L.span[i] / 2 - 10, 'text-anchor': 'middle', fill: C.ink, ...font(fs - 1) }, svg); t.textContent = `distance ${d}`; return t; });
    const more = el('text', { x: L.xs[3], y: L.gy + L.span[3] / 2 + (wide ? 42 : 36), 'text-anchor': 'middle', fill: C.muted, ...font(fs - 1) }, svg);
    more.textContent = '64 more';

    // piles: stacked frames, height in proportion; solid = best matching, open = the network
    const k = L.hmax / MATCH[0], slice = wide ? 9 : 7;
    const pile = (x, v, solid) => {
      // one plain pile, drawn as a pen outline (solid for matching, open for the network)
      const g = el('g', {}, svg), h = v * k;
      el('path', { d: penPath([[x, L.base], [x, L.base - h], [x + L.pw, L.base - h], [x + L.pw, L.base]]), fill: solid ? C.accent : 'none', stroke: C.accent, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);
      return g;
    };
    const pm = MATCH.map((v, i) => pile(L.xs[i] - L.pw - 2, v, true));
    const pn = NET.map((v, i) => pile(L.xs[i] + 2, v, false));
    const axis = el('path', { d: penPath([[L.xs[0] - 40, L.base + 1], [L.xs[2] + 40, L.base + 1]]), stroke: C.muted, 'stroke-width': 1, fill: 'none' }, svg);
    const vM = el('text', { x: L.xs[2] - L.pw - 6, y: L.base - MATCH[2] * k - 6, 'text-anchor': 'end', fill: C.ink, ...mono(fs - 1) }, svg); vM.textContent = wide ? 'matching 171' : '171';
    const vN = el('text', { x: L.xs[2] + L.pw + 6, y: L.base - NET[2] * k - 6, fill: C.ink, ...mono(fs - 1) }, svg); vN.textContent = wide ? '143 network' : '143';
    const legY = wide ? L.base - L.hmax * 0.95 : L.base - 2 * fs - 14;
    const legM = el('text', { x: L.xs[3] - (wide ? 60 : 44), y: legY, fill: C.ink, ...font(fs - 1) }, svg); legM.textContent = wide ? 'solid: best matching' : 'solid: matching';
    const legN = el('text', { x: L.xs[3] - (wide ? 60 : 44), y: legY + fs + 6, fill: C.ink, ...font(fs - 1) }, svg); legN.textContent = 'open: network';
    [legM, legN].forEach((t) => t.setAttribute('fill', C.accent));
    const unit = el('text', { x: L.xs[0] - 40, y: L.base + (wide ? 24 : 20), fill: C.muted, ...font(fs - 1) }, svg);
    unit.textContent = 'wrong answers per 100,000 rounds';
    const tag = el('text', { x: VW - 6, y: VH - 8, 'text-anchor': 'end', fill: C.muted, ...mono(fs - 1) }, svg);
    tag.textContent = 'Google, 2024';

    const P = [
      plan([{ at: 0, dur: 0.5 }, { at: 0.35, dur: 0.6 }, { at: 0.55, dur: 0.6 }, { at: 1.1, dur: 0.3 }, { at: 1.25, dur: 0.3 }, { at: 1.4, dur: 0.3 }, { at: 1.6, dur: 0.25 }]),
      plan([{ at: 0, dur: 0.7 }, { at: 0.65, dur: 0.3 }]),
      plan([{ at: 0, dur: 0.3 }, { at: 0.15, dur: 0.3 }, { at: 0.3, dur: 0.3 }, { at: 0.65, dur: 0.3 }]),
    ];
    const at = (pos, s, i) => (pos >= s ? 1 : pos <= s - 1 ? 0 : span(pos - (s - 1), ...P[s - 1].w(i)));

    function render(pos) {
      [0, 1, 2].forEach((i) => { const d = at(pos, 1, i); grids[i].parts.forEach((p) => (p.tagName === 'path' ? draw(p, d) : settle(p, d))); });
      [0, 1, 2].forEach((i) => settle(pm[i], at(pos, 1, 3 + i)));
      draw(axis, at(pos, 1, 3));
      const w1 = at(pos, 1, 6);
      [0, 1, 2].forEach((i) => { label(qlab[i], w1); label(dlab[i], w1); });
      label(unit, w1); label(tag, w1);
      const d9 = at(pos, 2, 0);
      grids[3].g.style.opacity = 0.45;
      grids[3].parts.forEach((p) => (p.tagName === 'path' ? draw(p, d9) : settle(p, d9)));
      label(qlab[3], at(pos, 2, 1)); label(dlab[3], at(pos, 2, 1)); label(more, at(pos, 2, 1));
      [0, 1, 2].forEach((i) => settle(pn[i], at(pos, 3, i)));
      const w3 = at(pos, 3, 3);
      label(vM, w3); label(vN, w3); label(legM, w3); label(legN, w3);
    }
    const durs = P.map((p) => p.total);
    return {
      render,
      dur: (s) => durs[s - 1],
      alone: 3,
      desc: (s) => [
        'Google\'s grids at distances 3, 5 and 7; under each, its errors, roughly halving with every step up.',
        'A distance-9 grid would need 64 more qubits for one more halving.',
        'The network\'s errors beside the matching decoder\'s: at distance 7, 143 against 171 per 100,000 rounds.',
      ][s - 1],
    };
  },
};
