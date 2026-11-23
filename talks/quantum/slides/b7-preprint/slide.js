import { svgOf, backup } from '../../kit.js';

// Backup 7: for the questions.
export default {
  id: 'preprint', n: 'B7', backup: true, builds: 1,
  title: "AlphaQubit 2 claims a network that keeps pace. Nobody has reviewed it yet.",
  clicks: ['backup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    backup(svg, { title: this.title, n: this.n, source: "Claimed: arXiv:2512.07737 (December 2025), not peer-reviewed; read from its abstract." }, { rows: [["The claim", "Under one millionth of a second per round,", "on accelerator chips that can be bought."], ["The range", "Surface code grids up to distance 11, in simulation."], ["Our position", "We can't test it. Until others review it, it stays a claim."]] });
  },
};
