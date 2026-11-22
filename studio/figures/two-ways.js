// two-ways (section 6): the standard program picks the single likeliest story;
// the other answer wins because it can happen in two ways (and because plain
// matching counts a Y as two errors).
//
//  1  the grid returns (set, not redrawn: it is the same character)
//  2  a flip in the middle lights the two squares beside it
//  3  a second flip below it: the check between them goes dark; a line lights only its ends
//  4  three lit checks (z2, x0, x1) and the pairing puzzle, dashed
//  5  camera: the grid becomes "the lights"; the standard program's answer above it, one road, 10 in 30
//  6  the other answer, two roads to the same lights, 19 in 30
// Data: data/lattice.json (5% error per storing qubit, checks never wrong, our own count):
// plain matching X0 + Z4, right 0.333 (10 of 30); read together Y0 + Z8, or Y0 + Z5 (the same
// up to the check {5, 8}), right 0.622 (19 of 30).
import { el, span, ease, draw, settle, label, penPath, plan, DESIGN } from '../verbs.js';
import { grid3, tally } from './parts.js';

export default {
  steps: [{}, {}, {}, {}, {}, {}],
  mount(svg, ctx) {
    const lay = ctx.layout, wide = lay === 'wide';
    const [VW, VH] = DESIGN[lay];
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const C = { ink: css('--ink'), muted: css('--muted'), hair: css('--hairline'), accent: css('--accent'), field: css('--field'), paper: css('--paper') };
    const fs = 15;
    const font = (size = fs) => ({ 'font-family': 'Libre Franklin, sans-serif', 'font-size': size });
    const mono = (size = fs) => ({ 'font-family': 'JetBrains Mono, monospace', 'font-size': size });

    const G0 = { tall: [180, 176, 84], mid: [200, 148, 64], wide: [360, 196, 92] }[lay];   // as in `grid`
    const lights = { tall: [150, 318, 0.42], mid: [170, 240, 0.42], wide: [360, 340, 0.45] }[lay];
    const mini = { tall: { y: 88, cell: 28, xs: [72, 218, 306] }, mid: { y: 66, cell: 22, xs: [80, 258, 338] }, wide: { y: 104, cell: 44, xs: [170, 450, 600] } }[lay];
    const tsz = wide ? 7 : 5, tw = 10 * (tsz + 3) - 3;
    const tTop = mini.y + 1.5 * mini.cell + (wide ? 16 : 12), tLab = tTop + 3 * (tsz + 3) + (wide ? 16 : 13);

    // the big grid (the character), which becomes "the lights"
    const Gw = el('g', {}, svg);
    const big = grid3(Gw, C, G0[0], G0[1], G0[2]);
    const letter = (g, q, txt, col, gr = big, size = fs) => { const [x, y] = gr.Q(q); const t = el('text', { x: x + (gr === big ? 13 : 6), y: y - (gr === big ? 13 : 6), fill: col, ...mono(size) }, g); t.textContent = txt; return t; };
    const x4 = letter(Gw, 4, 'X', C.ink), x7 = letter(Gw, 7, 'X', C.ink);
    const [lx, ly] = [big.checks.z2.mx, big.checks.z2.my];
    const pairs = [
      el('path', { d: penPath([[lx, ly], [G0[0] - 1.5 * G0[2] - 26, ly]]), stroke: C.accent, 'stroke-width': 1.6, 'stroke-dasharray': '4 5', fill: 'none' }, Gw),
      el('path', { d: penPath([[big.checks.x0.mx, big.checks.x0.my], [big.checks.x1.mx, big.checks.x1.my]]), stroke: C.accent, 'stroke-width': 1.6, 'stroke-dasharray': '4 5', fill: 'none' }, Gw),
    ];
    const camTo = (u) => {
      const s = 1 + (lights[2] - 1) * u;
      return `translate(${(lights[0] - G0[0] * lights[2]) * u + 0} ${(lights[1] - G0[1] * lights[2]) * u}) scale(${s})`;
    };
    const lightsLab = wide
      ? el('text', { x: lights[0], y: lights[1] + 1.9 * G0[2] * lights[2] + 14, 'text-anchor': 'middle', fill: C.muted, ...font() }, svg)
      : el('text', { x: lights[0] + 1.75 * G0[2] * lights[2], y: lights[1] - 2, fill: C.muted, ...font() }, svg);
    if (wide) lightsLab.textContent = 'the same three lights';
    else { for (const [i, w] of ['the same', 'three lights'].entries()) { const t = el('tspan', { x: lightsLab.getAttribute('x'), dy: i ? fs + 2 : 0 }, lightsLab); t.textContent = w; } }

    // the roads: mini grids with each explanation, arrows down to the lights
    const mk = (x, errs) => {
      const g = el('g', {}, svg);
      const m = grid3(g, C, x, mini.y, mini.cell, { qubits: true, lines: true });
      for (const c of Object.values(m.checks)) { c.outline.style.opacity = 0; c.mark.style.opacity = 0; }
      const ls = errs.map(([q, t]) => letter(g, q, t, C.accent, m, 14));
      const arrow = el('path', { d: penPath([[x, tLab + 8], [lights[0] + (x - lights[0]) * 0.3, lights[1] - 1.25 * G0[2] * lights[2] - 6]]), stroke: C.muted, 'stroke-width': 1.3, fill: 'none', 'stroke-linecap': 'round' }, svg);
      return { g, m, ls, arrow };
    };
    const A = mk(mini.xs[0], [[0, 'X'], [4, 'Z']]);
    const B1 = mk(mini.xs[1], [[0, 'Y'], [8, 'Z']]);
    const B2 = mk(mini.xs[2], [[0, 'Y'], [5, 'Z']]);
    const ty = mini.y - 1.5 * mini.cell - (wide ? 22 : 14);
    const labA = el('text', { x: mini.xs[0], y: ty, 'text-anchor': 'middle', fill: C.ink, ...font() }, svg);
    labA.textContent = 'plain matching';
    const labB = el('text', { x: (mini.xs[1] + mini.xs[2]) / 2, y: ty, 'text-anchor': 'middle', fill: C.ink, ...font() }, svg);
    labB.textContent = 'the other answer, two ways';
    const tA = el('g', {}, svg), tB = el('g', {}, svg);
    const bx = (mini.xs[1] + mini.xs[2]) / 2;
    // the payoff in type, at a size that reads: no waffle
    const tAl = el('text', { x: mini.xs[0], y: tLab - 6, 'text-anchor': 'middle', fill: C.accent, ...font(wide ? 24 : 20) }, svg);
    tAl.textContent = 'right 10 in 30';
    const tBl = el('text', { x: bx, y: tLab - 6, 'text-anchor': 'middle', fill: C.accent, ...font(wide ? 24 : 20) }, svg);
    tBl.textContent = 'right 19 in 30';
    // the key: what a square and a diamond are (shapes, never colour)
    const key = el('g', {}, svg);
    const kx = 8, ky = VH - (wide ? 34 : 30), km = wide ? 6 : 5;
    el('path', { d: `M${kx},${ky - km} h${2 * km} v${2 * km} h${-2 * km} Z`, fill: C.paper, stroke: C.ink, 'stroke-width': 1.3 }, key);
    const k1 = el('text', { x: kx + 2 * km + 6, y: ky + 5, fill: C.muted, 'font-family': 'Libre Franklin, sans-serif', 'font-size': 14 }, key); k1.textContent = 'asks about flips';
    el('path', { d: `M${kx + km},${ky + 18 - km * 1.3} l${km * 1.3},${km * 1.3} l${-km * 1.3},${km * 1.3} l${-km * 1.3},${-km * 1.3} Z`, fill: C.paper, stroke: C.ink, 'stroke-width': 1.3 }, key);
    const k2 = el('text', { x: kx + 2 * km + 6, y: ky + 23, fill: C.muted, 'font-family': 'Libre Franklin, sans-serif', 'font-size': 14 }, key); k2.textContent = 'asks about phase errors';
    const tag = el('text', { x: VW - 6, y: VH - 8, 'text-anchor': 'end', fill: C.muted, ...mono(fs - 1) }, svg);
    tag.textContent = '5% per qubit · our own count';

    const P = [
      plan([{ at: 0, dur: 0.9 }]),                                                  // 1 set in
      plan([{ at: 0, dur: 0.3 }, { at: 0.5, dur: 0.35 }, { at: 0.65, dur: 0.35 }]), // 2 X shows, ghosts; fire
      plan([{ at: 0, dur: 0.3 }, { at: 0.5, dur: 0.35 }, { at: 0.65, dur: 0.35 }]), // 3
      plan([{ at: 0, dur: 0.3 }, { at: 0.35, dur: 0.1 }, { at: 0.5, dur: 0.5 }]),   // 4 errors leave; three fire; pairings draw
      plan([{ at: 0, dur: 0.8 }, { at: 0.85, dur: 0.5 }, { at: 1.2, dur: 0.3 }, { at: 1.4, dur: 0.3 }]), // 5 camera; road A; tally; words
      plan([{ at: 0, dur: 0.5 }, { at: 0.15, dur: 0.5 }, { at: 0.6, dur: 0.3 }, { at: 0.8, dur: 0.3 }]), // 6 B1, B2; tally; words
    ];
    const at = (pos, k, i) => (pos >= k ? 1 : pos <= k - 1 ? 0 : span(pos - (k - 1), ...P[k - 1].w(i)));
    const ghostX = (t, show, gh, gone) => { t.style.opacity = show * (1 - gone) * (gh > 0 ? 1 - 0.6 * gh : 1); t.setAttribute('fill', gh > 0 ? C.muted : C.ink); };

    function render(pos) {
      Gw.style.opacity = at(pos, 1, 0);
      const gone4 = at(pos, 4, 0);
      ghostX(x4, at(pos, 2, 0), at(pos, 2, 1), gone4);
      ghostX(x7, at(pos, 3, 0), at(pos, 3, 1), gone4);
      let lit = [];
      if (pos > 1 && at(pos, 2, 2) > 0) lit = ['z0', 'z1'];
      if (pos > 2 && at(pos, 3, 2) > 0) lit = ['z0'];
      if (pos > 3 && at(pos, 4, 1) > 0) lit = ['z2', 'x0', 'x1'];
      big.setLit(lit);
      settle(key, pos > 0 && pos <= 4 ? 1 : 0);
      const cam = ease(at(pos, 5, 0));
      pairs.forEach((p) => { draw(p, at(pos, 4, 2)); p.style.opacity = at(pos, 4, 2) > 0 ? 1 - cam : 0; });
      Gw.setAttribute('transform', camTo(cam));
      big.qubitEls.forEach((q) => { q.style.opacity = 1 - 0.7 * cam; });
      big.lineEls.forEach((l) => { l.style.opacity = 1 - 0.7 * cam; });
      label(lightsLab, at(pos, 5, 3));
      const dA = at(pos, 5, 1);
      for (const l of [...A.m.lineEls, ...A.m.qubitEls]) draw(l, dA);
      A.ls.forEach((t) => settle(t, dA)); draw(A.arrow, dA);
      settle(tA, at(pos, 5, 2)); label(tAl, at(pos, 5, 2)); label(labA, at(pos, 5, 3));
      [B1, B2].forEach((B, i) => { const d = at(pos, 6, i); for (const l of [...B.m.lineEls, ...B.m.qubitEls]) draw(l, d); B.ls.forEach((t) => settle(t, d)); draw(B.arrow, d); });
      settle(tB, at(pos, 6, 2)); label(tBl, at(pos, 6, 2)); label(labB, at(pos, 6, 3)); label(tag, at(pos, 6, 3));
    }
    const durs = P.map((p) => p.total);
    return {
      render,
      dur: (k) => durs[k - 1],
      alone: 6,
      desc: (k) => [
        'The smallest grid again.',
        'A flip in the middle lights the two squares beside it.',
        'A second flip below it: the check between them goes dark; only the end of the line lights.',
        'Three checks lit; the standard program pairs them up, as briefly as it can.',
        'Its answer: a flip in the corner and a phase error in the centre, one way to these lights, right 10 times in 30.',
        'The other answer can happen in two ways, both giving the same three lights: right 19 times in 30.',
      ][k - 1],
    };
  },
};
