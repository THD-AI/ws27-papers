// water (section 1): the pattern a qubit holds starts to smear almost at once.
// Step 1: a ripple is drawn, then smears along the real decay, e^(-t/85 µs),
//         while a time line runs to 85 millionths of a second (where 1/e is left).
// Step 2: a far longer line of basic operations (tens of nanoseconds each) runs
//         a bounded stretch; now and then a slip mark drops out (about one in a
//         thousand). The paragraph gives the scale. The smear is not repeated.
// Source: Google Quantum AI, Nature 638 (2025): median lifetime of the qubits in
// the distance-7 grid, 85 µs (decay and dephasing together; not T1).
import { el, span, draw, settle, label, penPath, plan, DESIGN } from '../verbs.js';

const TAU = 85;   // µs

export default {
  steps: [{}, {}],
  mount(svg, ctx) {
    const lay = ctx.layout, tall = lay !== 'wide';
    const [VW, VH] = DESIGN[lay];
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const C = { ink: css('--ink'), muted: css('--muted'), hair: css('--hairline'), accent: css('--accent'), paper: css('--paper') };
    const font = (size, fam = 'Libre Franklin, sans-serif') => ({ 'font-family': fam, 'font-size': size });

    // the ripple: rings on water, drawn in pen (wobbly, like his line)
    const cx = VW / 2, cy = lay === 'mid' ? 76 : tall ? 120 : 150, R = lay === 'mid' ? 150 : tall ? 120 : 190;
    const ripple = el('g', {}, svg);
    const rings = [0.28, 0.52, 0.76, 1].map((f, i) => {
      const pts = [];
      for (let a = 0; a <= 64; a++) {
        // each ring its own shape: its own lobes, phase and squash
        const th = a / 64 * 2 * Math.PI, wob = 1 + [0.03, 0.02, 0.035, 0.025][i] * Math.sin(th * [3, 4, 2, 5][i] + [0.4, 2.1, 1.3, 3.0][i]) + 0.012 * Math.sin(th * [7, 6, 9, 8][i] + i);
        pts.push([cx + R * f * wob * Math.cos(th), cy + R * f * 0.36 * wob * Math.sin(th)]);
      }
      return el('path', { d: penPath(pts), stroke: C.ink, 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, ripple);
    });

    // the time line: 0 to 85 µs
    const ty = lay === 'mid' ? 170 : tall ? 250 : 300, tx0 = tall ? 30 : 120, tx1 = tall ? VW - 30 : VW - 120;
    const axis = el('path', { d: penPath([[tx0, ty], [tx1, ty]]), stroke: C.muted, 'stroke-width': 1.2, fill: 'none' }, svg);
    const t0 = el('text', { x: tx0, y: ty + 22, fill: C.muted, ...font(tall ? 14 : 15, 'JetBrains Mono, monospace') }, svg);
    t0.textContent = '0';
    const t1 = el('text', { x: tx1, y: ty + 22, 'text-anchor': 'end', fill: C.muted, ...font(tall ? 14 : 15, 'JetBrains Mono, monospace') }, svg);
    t1.textContent = '85 µs';
    const runner = el('path', { d: penPath([[tx0, ty], [tx0, ty]]), stroke: C.accent, 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }, svg);
    const blink = el('text', { x: (tx0 + tx1) / 2, y: ty + 22, 'text-anchor': 'middle', fill: C.muted, ...font(tall ? 14 : 15) }, svg);
    blink.textContent = 'a thousandth of a blink';

    // step 2: the job's line of operations, with rare slips
    const jy = lay === 'mid' ? 240 : tall ? 318 : 360, jx0 = tx0, jx1 = tx1;
    const job = el('path', { d: penPath([[jx0, jy], [jx1, jy]]), stroke: C.ink, 'stroke-width': 1.4, fill: 'none' }, svg);
    const ticks = el('path', { d: '', stroke: 'none' }, svg);
    const slipsAt = [0.12, 0.41, 0.68, 0.95];
    const bx0 = jx0 + slipsAt[0] * (jx1 - jx0), bx1 = jx0 + slipsAt[1] * (jx1 - jx0);
    const brace = el('path', { d: `M${bx0},${jy + 14} v6 H${bx1} v-6`, stroke: C.muted, 'stroke-width': 1.1, fill: 'none' }, svg);
    const braceLab = el('text', { x: bx0, y: jy + 38, fill: C.muted, ...font(tall ? 14 : 15) }, svg);
    braceLab.textContent = 'about 1,000 operations';
    const slips = slipsAt.map((u) => el('path', { d: `M${jx0 + u * (jx1 - jx0)},${jy - 10} V${jy + 10}`, stroke: C.ink, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, svg));
    const jobLab = el('text', { x: jx0, y: jy - 18, fill: C.muted, ...font(tall ? 14 : 15) }, svg);
    jobLab.textContent = 'the job: billions of basic operations';
    const tag2 = el('text', { x: bx0, y: jy + 56, fill: C.muted, ...font(14, 'JetBrains Mono, monospace') }, svg);
    tag2.textContent = 'slip rate: Gidney & Ekerå, 2021';
    const tag = el('text', { x: VW - 6, y: tall ? 18 : VH - 8, 'text-anchor': 'end', fill: C.muted, ...font(14, 'JetBrains Mono, monospace') }, svg);
    tag.textContent = 'Google, 2024';

    const P1 = plan([
      ...rings.map((_, i) => ({ at: i * 0.06, dur: 0.6 })),   // draw the rings, 60 ms apart
      { at: 0.8, dur: 0.3 },                                  // the axis
      { at: 1.0, dur: 1.0 },                                  // smear + time line run (fixed 1.0 s)
      { at: 1.6, dur: 0.25 },                                 // words
    ]);
    const P2 = plan([
      { at: 0, dur: 0.6 },                                    // the job line draws
      { at: 0.3, dur: 1.0 },                                  // it runs; slips fire as it passes them
      { at: 1.0, dur: 0.25 },                                 // words
    ]);
    const at = (pos, k, [a, b]) => (pos >= k ? 1 : pos <= k - 1 ? 0 : span(pos - (k - 1), a, b));

    function render(pos) {
      let i = 0;
      for (const r of rings) draw(r, at(pos, 1, P1.w(i++)));
      draw(axis, at(pos, 1, P1.w(i++)));
      const u = at(pos, 1, P1.w(i++));                      // fraction of 85 µs elapsed
      const left = Math.exp(-u);                              // what is left of the pattern
      // the smear: the pen line loses its edge (breaks into ever shorter
      // pieces) and thins as the pattern decays; no blur filter
      if (u > 0) rings.forEach((r) => {
        r.style.strokeDasharray = `${(left * 0.06).toFixed(4)} ${((1 - left) * 0.02 + 0.0001).toFixed(4)}`;
        r.style.strokeDashoffset = '0';
        r.style.opacity = 0.35 + 0.65 * left;
        r.setAttribute('stroke-width', (1.6 * (0.6 + 0.4 * left)).toFixed(2));
      });
      runner.setAttribute('d', penPath([[tx0, ty], [tx0 + u * (tx1 - tx0), ty]]));
      runner.style.opacity = u > 0 ? 1 : 0;
      const w = at(pos, 1, P1.w(i++));
      label(t0, Math.max(w, at(pos, 1, P1.w(4)))); label(t1, w); label(blink, w); label(tag, w);
      let j = 0;
      const d = at(pos, 2, P2.w(j++));
      draw(job, d); settle(ticks, d);
      const run = at(pos, 2, P2.w(j++));
      slips.forEach((s, k) => { s.style.opacity = run >= slipsAt[k] ? 1 : 0; });   // fire: a cut
      settle(brace, run >= slipsAt[1] ? 1 : 0); label(braceLab, run >= slipsAt[1] ? 1 : 0);
      label(tag2, at(pos, 2, P2.w(2)));
      label(jobLab, at(pos, 2, P2.w(j++)));
    }
    return {
      render,
      dur: (k) => (k === 1 ? P1.total : P2.total),
      alone: 1,
      desc: (k) => (k === 1
        ? 'A ripple on water smears as a time line runs to 85 millionths of a second, about a thousandth of a blink.'
        : 'The job is a line of billions of basic operations; about one in every thousand slips.'),
    };
  },
};
