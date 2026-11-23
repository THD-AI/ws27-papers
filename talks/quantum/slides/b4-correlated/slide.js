import { svgOf, backup } from '../../kit.js';

// Backup 4: for the questions.
export default {
  id: 'correlated', n: 'B4', backup: true, builds: 1,
  title: "Correlated matching failed on 6 of 219 single errors in our setup.",
  clicks: ['backup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    backup(svg, { title: this.title, n: this.n, source: "Our check (OWN-CORR): PyMatching 2.4.0, called as its documentation says; distance 3, three rounds. Cause not traced." }, { rows: [["At 0.1% noise", "At 0.1% noise: plain matching failed in 0.075% of runs,", "correlated matching in 0.113%, on the same 4 million runs."], ["Single errors", "Each of the 219 single error mechanisms alone: plain matching", "corrects all; correlated matching gets 6 wrong."], ["How much", "Those six happen with 0.4 times the noise level: at 0.1%,", "0.04%, about the gap we measured (0.037%)."], ["A second script", "Written by an AI agent from a description only: the same six."], ["Pairs, distance 5", "Our script only, not repeated: 1,253 of 1,405,326 pairs fail."]] });
  },
};
