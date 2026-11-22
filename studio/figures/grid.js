// grid (sections 2–4): the article's main character, the distance-3 grid, and
// the film it turns into. One figure across three chapters (camera handovers).
//
//  1  §2  three qubits joined, only ever all 0 or all 1 together (flip-only warm-up)
//  2  §2  the grid of 9 storing qubits draws around them
//  3  §3  the helpers between them: squares ask about flips, diamonds about phase errors
//  4  §3  one helper asks its four neighbours; one bit comes back
//  5  §3  a flip on the centre qubit: it shows, becomes a ghost; the two squares beside it fire
//  6  §3  a phase error lights the diamonds instead (with the water's rhythm, shifted)
//  7  §3  a lie: the grid becomes one frame, a second frame draws beside it; one square lit in both
//  8  §4  the frames become a strip that runs, one frame per 1.1 µs (a bounded run)
//  9  §4  HELD, 6 picked rounds, cuts: nothing; a flip; nothing; a phase error; nothing; an edge flip
// 10  §4  round 2 returns with its five simplest explanations (one flip, or one of four pairs)
//
// Geometry and the example are from data/lattice.json (q = row * 3 + col):
// z0 {1,2,4,5}, z1 {3,4,6,7}, z2 {0,3} (left half), z3 {5,8} (right half);
// x0 {0,1,3,4}, x1 {4,5,7,8}, x2 {1,2} (top half), x3 {6,7} (bottom half).
// X on 4 lights z0, z1; so do X on [1,6], [1,7], [2,6], [2,7]. At one slip per
// thousand the single flip is about 1,000 times likelier than any one pair.
import { el, span, ease, draw, settle, label, fire, penPath, plan, DESIGN } from '../verbs.js';

const CHECKS = {
  x0: { kind: 'x', sq: [0, 0] }, x1: { kind: 'x', sq: [1, 1] }, x2: { kind: 'x', half: 'top', q: [1, 2] }, x3: { kind: 'x', half: 'bottom', q: [6, 7] },
  z0: { kind: 'z', sq: [0, 1] }, z1: { kind: 'z', sq: [1, 0] }, z2: { kind: 'z', half: 'left', q: [0, 3] }, z3: { kind: 'z', half: 'right', q: [5, 8] },
};
const HELD = [
  { round: 1, lit: [] },
  { round: 2, lit: ['z0', 'z1'] },        // a flip on the centre qubit
  { round: 19, lit: [] },
  { round: 37, lit: ['x0', 'x1'] },       // a phase error on the centre qubit
  { round: 58, lit: [] },
  { round: 81, lit: ['z1', 'z2'] },       // a flip on qubit 3, at the side edge: one full and one half check
];

export default {
  steps: [{}, {}, {}, {}, {}, {}, {}, {}, { held: 6 }, {}],
  mount(svg, ctx) {
    const lay = ctx.layout, wide = lay === 'wide';
    const [VW, VH] = DESIGN[lay];
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const C = { ink: css('--ink'), muted: css('--muted'), hair: css('--hairline'), accent: css('--accent'), field: css('--field'), paper: css('--paper') };
    const fs = 15;
    const font = (size = fs, fam = 'Libre Franklin, sans-serif') => ({ 'font-family': fam, 'font-size': size });
    const mono = { 'font-family': 'JetBrains Mono, monospace', 'font-size': fs };
    const pen = (g, d, w = 1.6, col = C.ink) => el('path', { d, stroke: col, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);

    const cell = { tall: 84, mid: 64, wide: 92 }[lay];
    const cx = VW / 2, cy = { tall: 176, mid: 148, wide: 196 }[lay];
    const Q = (q) => [cx + ((q % 3) - 1) * cell, cy + (Math.floor(q / 3) - 1) * cell];

    // the checks of one grid: tiles (hairline), marks (square or diamond), a lit field
    function checksLayer(g) {
      const out = {};
      for (const [id, c] of Object.entries(CHECKS)) {
        let tile, mx, my;
        if (c.sq) {
          const [r, co] = c.sq;
          const x = cx + (co - 1) * cell, y = cy + (r - 1) * cell;
          tile = `M${x},${y} h${cell} v${cell} h${-cell} Z`;
          mx = x + cell / 2; my = y + cell / 2;
        } else {
          const [a, b] = c.q.map(Q);
          const out2 = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] }[c.half];
          const r = cell / 2;
          const sweep = c.half === 'top' || c.half === 'right' ? 1 : 0;
          tile = `M${a[0]},${a[1]} A${r},${r} 0 0,${sweep} ${b[0]},${b[1]} Z`;
          mx = (a[0] + b[0]) / 2 + out2[0] * r * 0.5; my = (a[1] + b[1]) / 2 + out2[1] * r * 0.5;
        }
        const field = el('path', { d: tile, fill: C.field, stroke: 'none', opacity: 0 }, g);
        const outline = el('path', { d: tile, fill: 'none', stroke: C.hair, 'stroke-width': 1.2 }, g);
        const m = cell * 0.09;
        const markD = c.kind === 'z' ? `M${mx - m},${my - m} h${2 * m} v${2 * m} h${-2 * m} Z` : `M${mx},${my - m * 1.3} l${m * 1.3},${m * 1.3} l${-m * 1.3},${m * 1.3} l${-m * 1.3},${-m * 1.3} Z`;
        const mark = el('path', { d: markD, fill: C.paper, stroke: C.ink, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, g);
        out[id] = { field, outline, mark, mx, my };
      }
      return out;
    }
    const setLit = (layer, lit) => {
      for (const [id, c] of Object.entries(layer)) {
        const on = lit.includes(id);
        fire(c.field, on);
        c.mark.setAttribute('fill', on ? C.accent : C.paper);
        c.mark.setAttribute('stroke', on ? C.accent : C.ink);
      }
    };

    // ---- the main grid (it becomes frame 1)
    const G = el('g', {}, svg);
    const lines = el('g', {}, G);
    const checks = checksLayer(G);
    const rows = [0, 1, 2].map((r) => pen(lines, penPath([Q(r * 3), Q(r * 3 + 2)])));
    const cols = [0, 1, 2].map((c) => pen(lines, penPath([Q(c), Q(c + 6)])));
    const Qg = el('g', {}, G);
    const qubits = Array.from({ length: 9 }, (_, q) => { const [x, y] = Q(q); return pen(Qg, `M${x - 10},${y} a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0`); });
    for (const q of qubits) q.setAttribute('fill', C.paper);
    // step 1: the middle row alone, joined; its words
    const join = pen(G, penPath([Q(3), Q(5)]), 2);
    const warm = el('text', { x: cx, y: cy + 44, 'text-anchor': 'middle', fill: C.muted, ...font() }, G);
    warm.textContent = 'all 0 or all 1, always together';
    // step 4: one helper asks (z0), one bit back
    // short dotted spokes from the helper towards each neighbour (never a full cross, which would read as an X)
    const asks = [1, 2, 4, 5].map((q) => { const [x, y] = Q(q); const { mx, my } = checks.z0; return el('path', { d: penPath([[mx + (x - mx) * 0.3, my + (y - my) * 0.3], [mx + (x - mx) * 0.7, my + (y - my) * 0.7]]), stroke: C.ink, 'stroke-width': 1.4, 'stroke-dasharray': '2 4', 'stroke-linecap': 'round', fill: 'none' }, G); });
    const bit = el('text', { x: checks.z0.mx + cell * 0.16, y: checks.z0.my + cell * 0.32, fill: C.ink, ...mono }, G);
    bit.textContent = 'even';
    // step 5–6: errors on the centre qubit
    const [qx, qy] = Q(4);
    const errX = el('text', { x: qx + 13, y: qy - 13, fill: C.ink, ...mono }, G); errX.textContent = 'X';
    const errZ = el('text', { x: qx + 13, y: qy - 13, fill: C.ink, ...mono }, G); errZ.textContent = 'Z';
    const rhythm = pen(G, penPath(Array.from({ length: 13 }, (_, i) => [qx + 26 + i * 3, qy - 18 + Math.sin(i * 1.1 + 1.6) * 4])), 1.2);
    // step 10: the five simplest explanations of round 2
    const xs = [4, 1, 2, 6, 7].map((q, i) => {
      const [x, y] = Q(q);
      const t = el('text', { x: x + 13, y: y - 13, fill: i ? C.muted : C.ink, ...mono }, G); t.textContent = 'X';
      return t;
    });
    const pairNote = el('text', { x: cx, y: cy + 1.5 * cell + 34, 'text-anchor': 'middle', fill: C.muted, ...font() }, G);
    pairNote.textContent = 'one flip, or one above and one below';

    // ---- frames for steps 7–8 (checks only)
    const nF = { tall: 3, mid: 3, wide: 4 }[lay];
    const fsc = { tall: 0.4, mid: 0.42, wide: 0.55 }[lay];
    const fw = 2.9 * cell * fsc;
    const fx0 = (VW - (nF - 1) * fw) / 2, fy = cy - (wide ? 20 : 30);
    const frameAt = (k, u = 1) => `translate(${(fx0 + k * fw - cx * fsc) * u} ${(fy - cy * fsc) * u}) scale(${1 + (fsc - 1) * u})`;
    const frames = [];
    for (let k = 1; k < nF; k++) {
      const g = el('g', { transform: frameAt(k) }, svg);
      frames.push({ g, layer: checksLayer(g) });
    }
    const rounds = Array.from({ length: nF }, (_, k) => {
      const t = el('text', { x: fx0 + k * fw, y: fy + 1.6 * cell * fsc + 22, 'text-anchor': 'middle', fill: C.muted, ...mono }, svg);
      t.textContent = `round ${k + 1}`;
      return t;
    });
    const every = el('text', { x: VW / 2, y: fy - 1.6 * cell * fsc - 16, 'text-anchor': 'middle', fill: C.muted, ...font() }, svg);
    every.textContent = 'one frame every 1.1 millionths of a second';
    const heldLab = el('text', { x: VW / 2, y: wide ? 28 : 26, 'text-anchor': 'middle', fill: C.muted, ...mono }, svg);
    const tag = el('text', { x: VW - 6, y: VH - 8, 'text-anchor': 'end', fill: C.muted, ...font(fs - 1, 'JetBrains Mono, monospace') }, svg);
    tag.textContent = 'simplified: errors between rounds';

    // ---- plans (seconds; a step lasts the sum of its parts)
    const P = [
      plan([{ at: 0, dur: 0.3 }, { at: 0.1, dur: 0.3 }, { at: 0.2, dur: 0.3 }, { at: 0.45, dur: 0.4 }, { at: 0.8, dur: 0.25 }]), // 1
      plan([{ at: 0, dur: 0.25 }, { at: 0.2, dur: 0.6 }, { at: 0.35, dur: 0.65 }]),          // 2: the word fades, rows/cols, other qubits
      plan([{ at: 0, dur: 0.9 }]),                                                         // 3: helpers, drawn together
      plan([{ at: 0, dur: 0.5 }, { at: 0.65, dur: 0.25 }]),                                // 4: asks, the bit
      plan([{ at: 0, dur: 0.25 }, { at: 0.45, dur: 0.3 }, { at: 0.6, dur: 0 }, { at: 0.65, dur: 0.3 }]), // 5
      plan([{ at: 0, dur: 0.25 }, { at: 0.3, dur: 0.25 }, { at: 0.6, dur: 0.3 }, { at: 0.75, dur: 0 }, { at: 0.8, dur: 0.3 }]), // 6
      plan([{ at: 0, dur: 0.8 }, { at: 0.85, dur: 0.5 }, { at: 1.3, dur: 0.25 }]),         // 7: camera, frame 2, words
      plan([{ at: 0, dur: 1.0 }, { at: 0.9, dur: 0.25 }]),                                 // 8: the strip runs (tick)
      null,                                                                                // 9: held
      plan([{ at: 0, dur: 0.6 }, { at: 0.5, dur: 0.3 }, { at: 0.75, dur: 0.5 }, { at: 1.2, dur: 0.25 }]), // 10
    ];
    const at = (pos, k, i) => (pos >= k ? 1 : pos <= k - 1 ? 0 : span(pos - (k - 1), ...P[k - 1].w(i)));
    const stage = (pos) => Math.min(10, Math.max(0, pos));

    function render(pos0) {
      const pos = stage(pos0);
      // 1
      const mid = [3, 4, 5];
      mid.forEach((q, i) => draw(qubits[q], at(pos, 1, i)));
      draw(join, pos < 2 ? at(pos, 1, 3) : 1 - at(pos, 2, 0));
      label(warm, pos < 2 ? at(pos, 1, 4) : 1 - at(pos, 2, 0));
      // 2
      [...rows, ...cols].forEach((l) => draw(l, at(pos, 2, 1)));
      qubits.forEach((q, i) => { if (!mid.includes(i)) draw(q, at(pos, 2, 2)); });
      // 3
      for (const c of Object.values(checks)) { draw(c.outline, at(pos, 3, 0)); draw(c.mark, at(pos, 3, 0)); }
      // 4
      const a4 = at(pos, 4, 0), b4 = at(pos, 4, 1), gone4 = pos > 4 ? at(pos, 5, 0) : 0;
      asks.forEach((s) => settle(s, a4 * (1 - gone4)));
      label(bit, b4 * (1 - gone4));
      // 5: X shows, then ghosts; z0, z1 fire
      let lit = [];
      const x5 = at(pos, 5, 1), gone5 = pos > 5 ? at(pos, 6, 0) : 0;
      settle(errX, at(pos, 5, 0) * (1 - gone5));
      errX.setAttribute('fill', x5 > 0 ? C.muted : C.ink);
      if (x5 > 0) errX.style.opacity = (1 - 0.6 * x5) * (1 - gone5);
      if (pos > 4 && at(pos, 5, 2) >= 1 && pos <= 5) lit = ['z0', 'z1'];
      // 6: Z, its rhythm shifts; the diamonds fire
      const z6 = at(pos, 6, 1), zg = at(pos, 6, 2), gone6 = pos > 6 ? at(pos, 7, 0) : 0;
      settle(errZ, z6 * (1 - gone6));
      errZ.setAttribute('fill', zg > 0 ? C.muted : C.ink);
      if (zg > 0) errZ.style.opacity = (1 - 0.6 * zg) * (1 - gone6);
      draw(rhythm, zg * (1 - gone6));
      if (pos > 5 && at(pos, 6, 3) >= 1 && pos <= 6) lit = ['x0', 'x1'];
      // 7–8: the grid becomes frame 1 (camera, alone), the others draw beside it
      const cam = pos > 6 && pos <= 9 ? ease(pos >= 7 ? 1 : at(pos, 7, 0)) : 0;
            const frameMode = pos > 6 && pos <= 9;
      G.setAttribute('transform', frameAt(0, pos > 9 ? 0 : cam));
      const qOpacity = pos > 8 && pos <= 9 ? 0 : pos > 9 ? 0.4 * at(pos, 10, 1) : 1 - 0.75 * cam;
      lines.style.opacity = qOpacity; Qg.style.opacity = qOpacity;
      const f2 = pos > 6 && pos <= 8 ? at(pos, 7, 1) : 0;
      const run = pos > 7 && pos <= 8 ? at(pos, 8, 0) : pos > 8 ? 0 : 0;
      frames.forEach((f, k) => {
        const show = k === 0 ? f2 : run >= k / (nF - 1) ? 1 : 0;   // frame 2 by drawing; the rest by the strip running
        f.g.style.opacity = frameMode && pos <= 8 ? (k === 0 ? f2 : show) : 0;
        setLit(f.layer, k === 0 ? ['z1'] : k === 2 ? ['x3'] : []);
      });
      rounds.forEach((r, k) => label(r, pos > 6 && pos <= 8 ? (k < 2 ? at(pos, 7, 2) : run >= k / (nF - 1) ? 1 : 0) : 0));
      label(every, pos > 7 && pos <= 8 ? at(pos, 8, 1) : 0);
      if (pos > 6 && pos <= 8) lit = ['z1'];
      // 9: held frames, cuts
      if (pos > 8 && pos <= 9) {
        const f = Math.max(1, Math.round((pos - 8) * 6));
        lit = HELD[f - 1].lit;
        heldLab.textContent = `picked round ${HELD[f - 1].round} · ${(HELD[f - 1].round * 1.1).toFixed(1)} µs`;
        heldLab.style.opacity = 1;
        G.setAttribute('transform', '');
      } else heldLab.style.opacity = 0;
      // 10: round 2 again, with its explanations
      if (pos > 9) { lit = ['z0', 'z1']; G.setAttribute('transform', ''); }
      const e = pos > 9 ? at(pos, 10, 2) : 0;
      xs.forEach((t, i) => settle(t, i === 0 ? e : e * (i ? 0.55 : 1)));
      label(pairNote, pos > 9 ? at(pos, 10, 3) : 0);
      label(tag, pos > 9 ? at(pos, 10, 3) : 0);
      setLit(checks, lit);
    }
    const durs = P.map((p) => (p ? p.total : 0));
    return {
      render,
      dur: (k) => durs[k - 1],
      alone: 5,
      desc: (k) => [
        'Three qubits joined: only ever all 0 or all 1, together.',
        'The smallest grid: nine storing qubits.',
        'Helpers sit between them: squares ask about flips, diamonds about phase errors.',
        'One helper asks its four neighbours a question; one bit comes back.',
        'A flip hits the centre qubit. The chip never sees it, only the two squares beside it light up.',
        'A phase error lights the diamonds instead.',
        'The grid becomes one frame of a film; in the next frame the same square is lit again: a check that lied.',
        'The frames run, one every 1.1 millionths of a second.',
        'Six picked rounds: nothing, a flip, nothing, a phase error, nothing, a flip at the edge.',
        'Round 2 again: one flip in the centre explains it, or one flip above and one below.',
      ][k - 1],
    };
  },
};
