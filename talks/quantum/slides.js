// The slide list. Each slide is its own folder under slides/: slide.js (the
// drawing, one function of the build), notes.md (what is said; the bold line
// is the landing, said as the title appears), sources.md (where every number
// on the slide comes from) and export/ (one PNG per build, written by
// tools/qdeck.mjs). Order here is the order of the talk.
export const DIRS = [
  '01-recording', '02-threshold', '03-logical', '04-grid', '05-checks', '06-film', '07-matching', '08-silent',
  '09-patterns', '10-two-ways', '11-google', '12-clock', '13-method', '14-ours', '15-properties', '16-questions',
  'b1-uncompute', 'b2-cost', 'b3-noise-model', 'b4-correlated', 'b5-noise-table', 'b6-second-script', 'b7-preprint', 'b8-recordings',
];

const mods = await Promise.all(DIRS.map((d) => import(`./slides/${d}/slide.js`).then((m) => ({ ...m.default, dir: d })).catch(() => null)));
export const SLIDES = mods.filter(Boolean);
