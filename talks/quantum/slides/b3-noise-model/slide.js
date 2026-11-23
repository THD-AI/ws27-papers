import { svgOf, backup } from '../../kit.js';

// Backup 3: for the questions.
export default {
  id: 'noise-model', n: 'B3', backup: true, builds: 1,
  title: "Our noise: the same chance of any error on every operation.",
  clicks: ['backup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    backup(svg, { title: this.title, n: this.n, source: "Stim (Gidney 2021), its standard circuit noise; article, section 9." }, { rows: [["The course", "The phase-flip channel: with chance p a qubit gets a phase error (Z).", "Our model contains it as one of its parts."], ["Ours", "Every operation in the simulated circuit goes wrong with the same", "chance p, with a flip, a phase error or both (X, Z or Y): depolarizing noise."], ["The levels", "Trained at seven levels from 0.2% to 1%; tested at 0.5%,", "five times the one slip per thousand of slide 2."], ["Not modelled", "Qubits leaving their two states (leakage), crosstalk, rates that differ", "from qubit to qubit or drift over time: a real chip has them."]] });
  },
};
