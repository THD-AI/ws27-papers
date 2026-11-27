import { svgOf, backup } from '../../kit.js';

// Backup 2: for the questions.
export default {
  id: 'cost', n: 'B2', backup: true, builds: 1,
  title: "Why a network at all, and what it costs as the grid grows.",
  clicks: ['backup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    backup(svg, { title: this.title, n: this.n, source: "Our own runs at 0.5% (OWN-D3, OWN-D5, OWN-D5-250M, OWN-TIME). Timings rough: one laptop core, emulated." }, { rows: [["Lookup table", "Distance 3: 1.47% from 200 million runs per noise level.", "It needs a table entry per pattern of fired checks; beyond distance 3 we did not build one."], ["Training examples", "Distance 3: below plain matching after 6.6 to 9.3 million.", "Distance 5: after about 250 million (the curves first fell below between 210 and 250 million)."], ["Training time", "On a GPU: about 50 s per seed at distance 3,", "a little over six minutes for the 250 million at distance 5."], ["Decoding time", "The network: 14 to 27 millionths of a second per run on a laptop core;", "matching got faster as errors got rarer. Not set against the chip's clock."]] });
  },
};
