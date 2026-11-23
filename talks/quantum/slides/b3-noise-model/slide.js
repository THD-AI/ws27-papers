import { svgOf, backup } from '../../kit.js';

// Backup 3: for the questions.
export default {
  id: 'noise-model', n: 'B3', backup: true, builds: 1,
  title: 'Four noise mechanisms share one probability.',
  clicks: ['backup'],
  draw(page) {
    const svg = svgOf(page);
    backup(svg, {
      title: this.title, n: this.n,
      source: 'The four parameters passed to Stim’s rotated surface-code circuit in our simulation (OWN-D3, OWN-D5, OWN-D5-250M).',
    }, {
      rows: [
        ['Random Pauli errors', 'Depolarization after Clifford gates and on storing qubits before each round.',
          'It includes phase errors (Z).'],
        ['Flips', 'Preparation flips after resets and readout flips before measurements.'],
        ['Noise levels', 'The same parameter p for all four settings.',
          'Trained at 0.2% to 1%. Main test at 0.5%.'],
        ['Limits', 'Real chips can leak into a third state and have different rates per operation.'],
      ],
    });
  },
};
