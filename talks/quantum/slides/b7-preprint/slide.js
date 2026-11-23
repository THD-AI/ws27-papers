import { svgOf, backup } from '../../kit.js';

// Backup 7: for the questions.
export default {
  id: 'preprint', n: 'B7', backup: true, builds: 1,
  title: 'AlphaQubit 2 reports the throughput needed for a superconducting chip.',
  clicks: ['backup'],
  draw(page) {
    const svg = svgOf(page);
    backup(svg, {
      title: this.title, n: this.n,
      source: 'AlphaQubit 2 preprint, arXiv:2512.07737v2, section 4 and Figure 4.',
    }, {
      rows: [
        ['Throughput', 'Under one millionth of a second per round on Trillium TPUs.'],
        ['Setup', 'Simulated surface-code data through distance 11.'],
        ['Open question', 'Can a live chip get each answer in time to use it?'],
      ],
    });
  },
};
