// System-test figure: three settled marks, for a fade handover and a second run.
import { el, span, settle, label, draw, penPath } from '../verbs.js';

export default {
  steps: [{}, {}, {}],
  mount(svg, ctx) {
    const tall = ctx.layout === 'tall';
    const VW = tall ? 360 : 720, VH = tall ? 420 : 440;
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const ink = css('--ink'), muted = css('--muted'), accent = css('--accent');
    const base = el('path', { d: penPath([[40, VH - 80], [VW - 40, VH - 80]]), stroke: ink, 'stroke-width': 1.4, fill: 'none' }, svg);
    const marks = [0.25, 0.5, 0.75].map((x, i) => {
      const g = el('g', { opacity: 0 }, svg);
      const h = [120, 220, 170][i];
      el('rect', { x: VW * x - 18, y: VH - 80 - h, width: 36, height: h, fill: i === 1 ? accent : ink }, g);
      const t = el('text', { x: VW * x, y: VH - 52, 'text-anchor': 'middle', 'font-family': 'Libre Franklin, sans-serif', 'font-size': 15, fill: muted }, g);
      t.textContent = ['lorem', 'ipsum', 'dolor'][i];
      return g;
    });
    const at = (pos, k, a, b) => (pos >= k ? 1 : pos <= k - 1 ? 0 : span(pos - (k - 1), a, b));
    return {
      render(pos) {
        draw(base, at(pos, 1, 0, 0.5));
        marks.forEach((m, i) => settle(m, at(pos, i + 1, i === 0 ? 0.5 : 0, i === 0 ? 0.9 : 0.4)));
      },
      dur: (k) => (k === 1 ? 1.1 : 0.9),
      alone: 3,
      desc: (k) => `Mark ${k} settles.`,
    };
  },
};
