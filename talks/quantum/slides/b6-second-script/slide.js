import { svgOf, backup } from '../../kit.js';

// Backup 6: for the questions.
export default {
  id: 'second-script', n: 'B6', backup: true, builds: 1,
  title: "A separately written script found the same order at distance 5.",
  clicks: ['backup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    backup(svg, { title: this.title, n: this.n, source: "Our check (OWN-REPL). The second script and network were written by an AI agent from a description of the claim only, and run on Kaggle." }, { rows: [["Distance 3", "Its networks also beat plain matching: 1.46% to 1.48%", "against 1.71% to 1.73%."], ["Distance 5", "After about 250 million: 1.15% and 1.16%, between the two", "matchers, closer to correlated (1.09%)."], ["But", "Its network was about twenty times larger (3.3 million numbers)", "and trained only at 0.5%. At our size it reached 1.51%."]] });
  },
};
