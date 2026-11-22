// answered (section 9, last paragraph): the opening drawing returns, now with
// our own small reader and its reel, and two notes: what we can answer (the
// cost of learning to read, partly) and what is still open (real recordings).
// One step. The opening figure is set, not redrawn (it is the same drawing).
import { el, span, draw, settle, label, penPath, plan, DESIGN } from '../verbs.js';
import { gate, strip } from './parts.js';
import twoReaders from './two-readers.js';

export default {
  steps: [{}],
  mount(svg, ctx) {
    const lay = ctx.layout, wide = lay === 'wide';
    const [VW, VH] = DESIGN[lay];
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const C = { ink: css('--ink'), muted: css('--muted'), hair: css('--hairline'), accent: css('--accent'), field: css('--field'), paper: css('--paper') };
    const fs = 15;
    const font = (size = fs) => ({ 'font-family': 'Libre Franklin, sans-serif', 'font-size': size });

    // the opening drawing, smaller, top-left; set in at its last state
    const sub = { tall: [0, 0, 300, 210], mid: [0, 0, 250, 200], wide: [0, 0, 440, 300] }[lay];
    const inner = el('svg', { x: sub[0], y: sub[1], width: sub[2], height: sub[3] }, svg);
    const tr = twoReaders.mount(inner, { layout: lay === 'wide' ? 'wide' : 'mid', k: 1, reduced: true });
    tr.render(2);
    // recognised by its shape: the small copy keeps no words (they would fall under 11.5 px)
    for (const t of inner.querySelectorAll('text')) t.remove();

    // ours: a smaller reader with its long reel, under the two
    const oy = { tall: 262, mid: 214, wide: 340 }[lay];
    const gw = wide ? 84 : 60, gx = { tall: 180, mid: 220, wide: 380 }[lay];
    const g = el('g', {}, svg);
    const ours = gate(g, C, gx, oy - 40 * gw / 120, gw);
    const reel = strip(svg, C, [[gx - (wide ? 210 : 150), oy], ours.inAt], wide ? 12 : 9, wide ? 12 : 9, (k) => (k % 6 === 3 ? [1] : []));
    const lab = el('text', { x: gx + gw / 2, y: oy + gw * 0.36 + 18, 'text-anchor': 'middle', fill: C.ink, ...font(fs - 1) }, svg);
    lab.textContent = 'our network';

    // two short verdicts under our reader; the paragraph says the rest
    const vx = gx + gw / 2, vy = oy + gw * 0.36 + 18 + fs + 6;
    const v1 = el('text', { x: vx, y: vy, 'text-anchor': 'middle', fill: C.ink, ...font(fs - 1) }, svg);
    v1.textContent = 'examples: measured · laptop time: estimated';
    const v2 = el('text', { x: vx, y: vy + fs + 5, 'text-anchor': 'middle', fill: C.muted, ...font(fs - 1) }, svg);
    v2.textContent = 'real recordings: not yet';
    const notes = el('g', {}, svg); notes.appendChild(v1); notes.appendChild(v2);
    const P = plan([{ at: 0, dur: 0.3 }, { at: 0.2, dur: 0.7 }, { at: 0.5, dur: 0.4 }, { at: 0.9, dur: 0.3 }, { at: 1.1, dur: 0.3 }]);
    const at = (pos, i) => (pos >= 1 ? 1 : pos <= 0 ? 0 : span(pos, ...P.w(i)));
    return {
      render(pos) {
        inner.style.opacity = at(pos, 0);
        for (const p of reel) { p.edges.forEach((e) => draw(e, at(pos, 1))); p.frames.forEach((f, i) => settle(f, span(at(pos, 1), i / p.frames.length, (i + 1) / p.frames.length))); }
        ours.strokes.forEach((s) => draw(s, at(pos, 2)));
        label(lab, at(pos, 3));
        settle(notes, at(pos, 4));
      },
      dur: () => P.total,
      alone: 1,
      desc: () => 'The opening drawing returns with our own small reader: the examples are measured and the laptop time is our estimate; one grid bigger it passed plain matching only at the end of a run four times longer, still behind correlated matching. On real recordings it is not tested yet.',
    };
  },
};
