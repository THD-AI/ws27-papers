import { svgOf, backup } from '../../kit.js';

// Backup 4: for the questions.
export default {
  id: 'correlated', n: 'B4', backup: true, builds: 1,
  title: "Correlated matching failed on 6 of 219 single errors in our setup.",
  clicks: ['backup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    backup(svg, { title: this.title, n: this.n, source: "Our check (OWN-CORR): PyMatching 2.4.0, called as its documentation says; distance 3, three rounds. Cause not traced." }, { rows: [["The symptom", "At 0.1% noise: plain matching failed in 0.075% of runs,", "correlated matching in 0.113%, on the same 4 million runs."], ["The check", "Each of the 219 single error mechanisms alone: plain matching", "corrects all; correlated matching gets 6 wrong."], ["The size", "Those six happen with 0.4 times the noise level: at 0.1%,", "0.04%, about the gap we measured (0.037%)."], ["Checked twice", "A second script, written by an AI agent from a description only,", "found the same six. At distance 5, 1,253 of 1,405,326 pairs (not repeated)."]] });
  },
};
