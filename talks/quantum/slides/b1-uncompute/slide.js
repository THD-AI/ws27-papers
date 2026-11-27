import { svgOf, backup } from '../../kit.js';

// Backup 1: for the questions.
export default {
  id: 'uncompute', n: 'B1', backup: true, builds: 1,
  title: "A helper learns only the parity, and is reset for the next round.",
  clicks: ['backup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    backup(svg, { title: this.title, n: this.n, source: "Standard syndrome extraction (Fowler et al., Phys. Rev. A 86, 2012). For a phase-check the helper is turned (Hadamard) before and after." }, { rows: [["Start", "The helper starts at 0."], ["Collect", "A controlled-NOT from each of its two or four neighbours", "adds that neighbour's bit, so it holds only their parity."], ["Measure", "One bit comes out: even or odd. No neighbour's own state", "is read, so the stored value is left alone."], ["Reset", "The helper is set back to 0 and asks again next round.", "Like the course's extra Toffoli qubit, it carries nothing else away."]] });
  },
};
