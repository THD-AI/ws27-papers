// permits: a public-record boundary and the conditions that apply in Germany.
import { mountFigure, svgRoot, colors, g, line, text, stage } from '../../../lib/fig.js';

export const steps = 3;
export const stills = [2];
export const durations = { large: [1.35, 2.1, 1.65] };
const SIZE = { wide: [552, 400], tall: [360, 424] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, d.reading);
  svg.style.color = C.ink;
  const st = stage();
  const x = 16, width = W - 2 * x;
  const note = { family: 'sans', size: tall ? 13 : 14, width, fill: C.ink };
  const title = { ...note, weight: 600 };
  const stageLabel = { ...title, size: tall ? 13 : 14, fill: C.accent };

  const heading = text(svg, x, 23, d.headline, { ...title, size: tall ? 17 : 18 });
  st.fade(heading.el, 0.01, 0.18);
  let y = heading.bottom + 29;
  d.stages.forEach((group, i) => {
    const header = g(svg);
    line(header, x, y - 19, W - x, y - 19, { stroke: C.hairline, 'stroke-width': 1 });
    const label = text(header, x, y, group.label, stageLabel);
    st.fade(header, i + 0.08, i + 0.29);
    y = label.bottom + 18;
    group.items.forEach(([key, detail], j) => {
      const row = g(svg);
      if (i === 0) {
        text(row, x, y, key, note);
        text(row, x, y + 19, detail, title);
        y += 37;
      } else {
        const keyWidth = tall ? 147 : 168;
        const term = text(row, x, y, key, { ...title, width: keyWidth - 8 });
        const explanation = text(row, x + keyWidth, y, detail, { ...note, width: width - keyWidth });
        y = Math.max(term.bottom, explanation.bottom) + 17;
      }
      st.fade(row, i + 0.31 + j * 0.17, i + 0.5 + j * 0.17);
    });
    y += 11;
  });
  const boundary = text(svg, x, y + 1, d.boundary, { ...note, fill: C.muted });
  st.fade(boundary.el, 2.72, 2.92);
  if (boundary.bottom + 14 > H) svg.dataset.contentH = Math.ceil(boundary.bottom + 14);

  return { set: (step, t) => st.set(step, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
