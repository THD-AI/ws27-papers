// System-test figure (not an article figure). Exercises every verb on one
// grid: draw (several strokes together), fire (cuts), label, a held step of
// six frames, the 2 s closing line, and a camera move in a continued chapter.
import { el, span, ease, draw, fire, settle, label, penPath, penSeconds, plan } from '../verbs.js';

const STEPS = [{}, {}, {}, { held: 6 }, {}, {}];
const FRAMES = [[], ['z0', 'z1'], [], ['x1'], [], ['z2']];   // lit checks per held frame
const ROUNDS = [1, 2, 9, 37, 38, 81];

export default {
  steps: STEPS,
  mount(svg, ctx) {
    const tall = ctx.layout === 'tall';
    const VW = tall ? 360 : 720, VH = tall ? 420 : 440;
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const C = { ink: css('--ink'), muted: css('--muted'), hair: css('--hairline'), accent: css('--accent'), field: css('--field'), paper: css('--paper') };

    const cell = tall ? 92 : 104;
    const g0 = el('g', {}, svg);                         // the camera moves this group
    const ox = (VW - 2 * cell) / 2, oy = tall ? 70 : 90;
    const q = (r, c) => [ox + c * cell, oy + r * cell];

    // step 1: the grid, several strokes drawn together, 60 ms apart
    const lines = [];
    for (let r = 0; r < 3; r++) lines.push(el('path', { d: penPath([q(r, 0), q(r, 2)]), stroke: C.ink, 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, g0));
    for (let c = 0; c < 3; c++) lines.push(el('path', { d: penPath([q(0, c), q(2, c)]), stroke: C.ink, 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, g0));
    const dots = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const [x, y] = q(r, c);
      dots.push(el('path', { d: `M${x - 9},${y} a9,9 0 1,0 18,0 a9,9 0 1,0 -18,0`, stroke: C.ink, 'stroke-width': 1.6, fill: C.paper }, g0));
    }
    const s1 = [...lines, ...dots].map((p, i) => ({ at: i * 0.06, dur: penSeconds(2 * cell, VH) }));
    const P1 = plan(s1);

    // step 2: helpers, squares (flip-checks) and diamonds (phase-checks)
    const helpers = {};
    const centres = { z0: [0.5, 0.5], z1: [1.5, 1.5], z2: [0.5, 1.5], z3: [1.5, 0.5] };
    const hp = [];
    for (const [id, [cx, cy]] of Object.entries(centres)) {
      const [x, y] = [ox + cy * cell, oy + cx * cell];
      const tile = el('rect', { x: x - cell / 2 + 6, y: y - cell / 2 + 6, width: cell - 12, height: cell - 12, fill: C.field, opacity: 0 }, g0);
      const sq = el('path', { d: `M${x - 8},${y - 8} h16 v16 h-16 Z`, stroke: C.ink, 'stroke-width': 1.4, fill: C.paper }, g0);
      helpers[id] = { tile, mark: sq, x, y };
      hp.push(sq);
    }
    const dia = { x0: [ox + cell, oy - 26], x1: [ox + cell, oy + 2 * cell + 26] };
    for (const [id, [x, y]] of Object.entries(dia)) {
      const tile = el('circle', { cx: x, cy: y, r: 18, fill: C.field, opacity: 0 }, g0);
      const d = el('path', { d: `M${x},${y - 10} l10,10 l-10,10 l-10,-10 Z`, stroke: C.ink, 'stroke-width': 1.4, fill: C.paper }, g0);
      helpers[id] = { tile, mark: d, x, y };
      hp.push(d);
    }
    const P2 = plan(hp.map((_, i) => ({ at: i * 0.15, dur: penSeconds(64, VH) })));

    // step 3: a hit on the centre qubit: ink, then a ghost; two squares fire
    const [cx, cy] = q(1, 1);
    const hit = el('text', { x: cx + 14, y: cy - 12, 'font-family': 'JetBrains Mono, monospace', 'font-size': 16, fill: C.ink }, g0);
    hit.textContent = 'X';
    const lab3 = el('text', { x: VW / 2, y: VH - 24, 'text-anchor': 'middle', 'font-family': 'Libre Franklin, sans-serif', 'font-size': 15, fill: C.muted }, svg);
    lab3.textContent = 'two checks light; the hit itself is never seen';
    const P3 = plan([{ at: 0, dur: 0.3 }, { at: 0.5, dur: 0.3 }, { at: 0.5, dur: 0 }, { at: 0.75, dur: 0.25 }]);

    // step 4: held, six frames; round labels in mono
    const roundLab = el('text', { x: VW / 2, y: 28, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 14, fill: C.muted }, svg);

    // step 5: the closing line, 2 s, nothing else moving
    const close = el('path', { d: penPath([[ox + cell, oy - 50], [ox + cell, oy + 2 * cell + 50]]), stroke: C.accent, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g0);

    // step 6 (a continued chapter): camera, then a copy settles beside it
    const copy = el('g', { opacity: 0 }, svg);
    el('rect', { x: tall ? 40 : VW * 0.62, y: tall ? VH * 0.62 : oy, width: tall ? VW - 80 : VW * 0.3, height: tall ? 90 : 2 * cell, fill: 'none', stroke: C.ink, 'stroke-width': 1.4 }, copy);
    const copyLab = el('text', { x: tall ? VW / 2 : VW * 0.77, y: tall ? VH * 0.62 + 50 : oy + cell, 'text-anchor': 'middle', 'font-family': 'Libre Franklin, sans-serif', 'font-size': 15, fill: C.ink }, copy);
    copyLab.textContent = 'a second view';

    const at = (pos, k, a, b) => (pos >= k ? 1 : pos <= k - 1 ? 0 : span(pos - (k - 1), a, b));

    function render(pos) {
      // 1
      [...lines, ...dots].forEach((p, i) => { const [a, b] = P1.w(i); draw(p, at(pos, 1, a, b)); });
      // 2
      hp.forEach((p, i) => { const [a, b] = P2.w(i); draw(p, at(pos, 2, a, b)); });
      // 3
      const u3 = at(pos, 3, 0, 0.3);
      settle(hit, u3);
      hit.setAttribute('fill', at(pos, 3, 0.5, 0.8) >= 1 ? C.muted : C.ink);
      hit.style.opacity = at(pos, 3, 0.5, 0.8) >= 1 ? 0.4 : u3;
      const lit3 = pos > 2 + 0.5 && pos <= 3 + 1e-9 || (pos > 3 && pos <= 3);
      // 4: held frames (pos in (3, 4]): frame f = round(t * 6)
      let lit = new Set();
      if (pos > 2.5 && pos <= 3) lit = new Set(['z0', 'z1']);
      if (pos > 3 && pos <= 4) { const f = Math.max(1, Math.round((pos - 3) * 6)); lit = new Set(FRAMES[f - 1]); roundLab.textContent = `round ${ROUNDS[f - 1]} · ${(ROUNDS[f - 1] * 1.1).toFixed(1)} µs`; roundLab.style.opacity = 1; }
      else roundLab.style.opacity = 0;
      for (const [id, h] of Object.entries(helpers)) fire(h.tile, lit.has(id));
      label(lab3, pos > 2 && pos <= 3 ? at(pos, 3, 0.75, 1) : 0);
      // 5: the line across, the whole step
      draw(close, at(pos, 5, 0, 1));
      // 6: camera (0–0.8 s of 1.4 s), then the copy settles
      const cam = ease(at(pos, 6, 0, 0.57));
      g0.setAttribute('transform', tall ? `translate(0 ${-cam * 40}) scale(${1 - cam * 0.2})` : `translate(${-cam * VW * 0.2} 0)`);
      settle(copy, at(pos, 6, 0.6, 1));
      void lit3;
    }
    const durs = [P1.total, P2.total, 1.0, 0, 2.0, 1.4];
    return {
      render,
      dur: (k) => Math.max(durs[k - 1] || 1, 0),
      alone: 5,
      desc: (k) => ['The grid draws.', 'Helpers appear between the qubits.', 'A hit lights two checks.', 'Six rounds, one frame each.', 'A line closes across the grid.', 'A second view settles beside it.'][k - 1],
    };
  },
};
