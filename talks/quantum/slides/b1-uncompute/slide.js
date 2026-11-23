import { svgOf, backup } from '../../kit.js';

// Backup 1: for the questions.
export default {
  id: 'uncompute', n: 'B1', backup: true, builds: 1,
  title: "A helper learns only the parity, and is cleared for the next round.",
  clicks: ['backup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    backup(svg, { title: this.title, n: this.n, source: "Standard syndrome extraction (Fowler et al., Phys. Rev. A 86, 2012). For a phase-check the helper is turned (Hadamard) before and after." }, { rows: [["Start", "The helper starts at 0."], ["Compute", "Four controlled-NOTs add each neighbour's bit to it,", "so it holds only the parity of the four."], ["Measure", "One bit comes out: even or odd. No neighbour's own state", "is read, so the stored value is left alone."], ["Clear", "The helper is reset and asks again next round,", "like the extra qubit the course uncomputes after a Toffoli."]] });
  },
};
