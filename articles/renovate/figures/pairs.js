// pairs: ten pairs of figures, and why none compares fully. A designed
// table, no chart: every value in mono, a filled dot before a reported value,
// an open dot before a target or a figure for a later year, a dashed gap
// where nothing is published. Row 6 lies on the one field.
import {
  mountFigure, svgRoot, colors, g, rect, line, circle, text, textSize, stage,
} from '../../../lib/fig.js';

export const steps = 1;
const SIZE = { wide: [880, 832], tall: [360, 1792] };
export const aspect = { wide: SIZE.wide[0] / SIZE.wide[1], tall: SIZE.tall[0] / SIZE.tall[1] };

function build(el, ctx) {
  const C = colors(ctx), d = ctx.data, tall = ctx.layout === 'tall';
  const [W, H] = SIZE[tall ? 'tall' : 'wide'];
  const svg = svgRoot(el, W, H, `${d.reading} ${d.note} `
    + d.rows.map((r) => `${r.n}. ${r.what}: United States ${r.us.show || r.us.absent}, Germany ${r.de.show || r.de.absent}; ${r.why}.`).join(' '));
  svg.style.color = C.ink;
  const st = stage();

  const S = tall
    ? { head: 12, what: 13, val: 13.5, desc: 12, why: 12.5, num: 12, lh: 15.5 }
    : { head: 12.5, what: 13.5, val: 14, desc: 13, why: 14, num: 13, lh: 16.5 };
  const mark = (parent, cx, cy, open) => circle(parent, cx, cy, 4, open
    ? { fill: C.paper, stroke: C.ink, 'stroke-width': 1.6 } : { fill: C.ink });

  // one value; returns the height it took
  function cell(parent, x, y, w, v) {
    const base = y + 13 + S.val * 0.36;
    if (v.value === null || (v.value === undefined && !v.range)) {
      line(parent, x, y + 13, x + 54, y + 13, { stroke: C.ink, 'stroke-width': 1.25, 'stroke-dasharray': '2 4', 'stroke-linecap': 'round' });
      text(parent, x + 62, y + 13 + 4.5, v.absent, { italic: true, size: S.why, fill: C.muted });
    } else {
      mark(parent, x + 4.5, y + 13, v.status !== 'reported');
      text(parent, x + 16, base, v.show, { family: 'mono', size: S.val, weight: 500 });
    }
    if (!v.text) return 26;
    const dsc = text(parent, x, y + 13 + 9 + S.desc, v.text, { family: 'sans', size: S.desc, width: w, lh: S.lh });
    return dsc.bottom - y + 2;
  }
  function key(parent, x, y) {
    const o = { family: 'sans', size: S.desc - 0.5, fill: C.muted };
    mark(parent, x + 4, y - 4, false);
    const a = text(parent, x + 13, y, d.key.reported, o);
    mark(parent, a.right + 18, y - 4, true);
    return text(parent, a.right + 27, y, d.key.open, o);
  }

  const rowsG = [];
  const pad = tall ? 12 : 14;
  // headline, the figure's own note and the key, above the table
  const hd0 = g(svg);
  text(hd0, pad, tall ? 14 : 18, d.headline, { family: 'sans', size: tall ? 12.5 : 14, weight: 600, width: W - 2 * pad, lh: 15.5 });
  let y = tall ? 46 : 40;
  text(hd0, pad, y, d.note, { italic: true, size: S.why + 0.5 });
  if (tall) { y += 19; key(hd0, pad, y); y += 17; text(hd0, pad, y, d.tag, { family: 'mono', size: 11.5, fill: C.muted }); } else {
    const k = key(hd0, 330, y);
    text(hd0, W - pad, y, d.tag, { family: 'mono', size: 12, fill: C.muted, anchor: 'end' });
    void k;
  }
  st.fade(hd0, 0, 0.08);
  y += tall ? 10 : 12;

  if (!tall) {
    const X = { n: 14, what: 42, us: 176, de: 428, why: 684 };
    const Wd = { what: 118, us: 236, de: 240, why: W - 684 - 12 };
    const hd = g(svg);
    line(hd, 0, y, W, y, { stroke: C.ink, 'stroke-width': 1.35 });
    ['what', 'us', 'de', 'why'].forEach((k, i) => text(hd, X[k], y + 19, d.columns[i], { family: 'sans', size: S.head, weight: 600 }));
    line(hd, 0, y + 29, W, y + 29, { stroke: C.hairline, 'stroke-width': 1 });
    st.fade(hd, 0.02, 0.1);
    y += 29;
    d.rows.forEach((r, i) => {
      const rg = g(svg), top = y;
      const fieldRect = r.partly ? rect(rg, 0, top + 0.5, W, 10, { fill: C.field, 'data-audit': 'skip' }) : null;
      const cy = top + 8;
      text(rg, X.n, cy + 13 + S.num * 0.36, String(r.n).padStart(2, '0'), { family: 'mono', size: S.num, fill: C.accent, weight: 500 });
      const wh = text(rg, X.what, cy + 13 + S.what * 0.36, r.what, { family: 'sans', size: S.what, weight: 500, width: Wd.what, lh: S.lh });
      const h1 = cell(rg, X.us, cy, Wd.us, r.us);
      const h2 = cell(rg, X.de, cy, Wd.de, r.de);
      const why = text(rg, X.why, cy + 13 + S.why * 0.34, r.why, { italic: true, size: S.why, width: Wd.why, lh: 17.5 });
      let hw = why.bottom - cy;
      if (r.partly) {
        const pc = text(rg, X.why, why.bottom + S.why + 3, r.partly, { italic: true, size: S.why, fill: C.accent, weight: 600 });
        hw = pc.bottom - cy;
      }
      const hgt = Math.max(h1, h2, hw, wh.bottom - cy) + 15;
      if (fieldRect) fieldRect.setAttribute('height', hgt - 1);
      y = top + hgt;
      line(rg, 0, y, W, y, i < d.rows.length - 1 ? { stroke: C.hairline, 'stroke-width': 1 } : { stroke: C.ink, 'stroke-width': 0.7 });
      rowsG.push(rg);
    });
    y += 6;
  } else {
    const X = { n: 12, body: 46 }, wBody = W - X.body - 12;
    const hd = g(svg);
    line(hd, 0, y, W, y, { stroke: C.ink, 'stroke-width': 1.35 });
    text(hd, X.n, y + 18, `[[${d.short.us}]]  ${d.columns[1]}     [[${d.short.de}]]  ${d.columns[2]}`, { family: 'sans', size: S.head, weight: 600 });
    line(hd, 0, y + 27, W, y + 27, { stroke: C.hairline, 'stroke-width': 1 });
    st.fade(hd, 0.02, 0.1);
    y += 27;
    d.rows.forEach((r, i) => {
      const rg = g(svg), top = y;
      const fieldRect = r.partly ? rect(rg, 0, top + 0.5, W, 10, { fill: C.field, 'data-audit': 'skip' }) : null;
      let cy = top + 22;
      text(rg, X.n, cy, String(r.n).padStart(2, '0'), { family: 'mono', size: S.num, fill: C.accent, weight: 500 });
      text(rg, X.body, cy, r.what, { family: 'sans', size: S.what, weight: 600 });
      cy += 8;
      for (const side of ['us', 'de']) {
        text(rg, X.n, cy + 13 + 4, d.short[side], { family: 'mono', size: 11.5, fill: C.muted });
        cy += cell(rg, X.body, cy, wBody, r[side]) + 5;
      }
      const why = text(rg, X.body, cy + S.why + 1, r.why, { italic: true, size: S.why, width: wBody, lh: 16 });
      line(rg, X.n + 1, why.y + 8, X.body - 9, why.y + 8, { stroke: C.muted, 'stroke-width': 0.8 });
      cy = why.bottom;
      if (r.partly) {
        const pc = text(rg, X.body, cy + S.why + 2, r.partly, { italic: true, size: S.why, fill: C.accent, weight: 600 });
        cy = pc.bottom;
      }
      y = cy + 12;
      if (fieldRect) fieldRect.setAttribute('height', y - top - 1);
      line(rg, 0, y, W, y, i < d.rows.length - 1 ? { stroke: C.hairline, 'stroke-width': 1 } : { stroke: C.ink, 'stroke-width': 0.7 });
      rowsG.push(rg);
    });
    y += 6;
  }
  svg.dataset.contentH = Math.round(y);
  void textSize;

  rowsG.forEach((rg, i) => { const a = 0.08 + i * 0.08; st.fade(rg, a, a + 0.12); });
  return { set: (s, t) => st.set(s, t) };
}

export default function mount(el, ctx) { return mountFigure(el, (root) => build(root, ctx)); }
