import { svgOf, backup } from '../../kit.js';

// Backup 8: for the questions.
export default {
  id: 'recordings', n: 'B8', backup: true, builds: 1,
  title: "The third test, on Google’s public recordings, is still open.",
  clicks: ['backup'],
  draw(page, b, data) {
    const svg = svgOf(page);
    backup(svg, { title: this.title, n: this.n, source: "Public data: Google Quantum AI 2022 and 2024 recordings (GQA-DATA-2022, GQA-DATA-2024). Article, sections 9 and \"What we could not show\"." }, { rows: [["Asked", "Does a network trained in simulation still work on the recordings", "Google made public, before and after it has seen some of them?"], ["Done", "Not yet. Every run of ours is a simulation with the same noise", "everywhere, and matching was handed the exact error model."], ["Why it matters", "It is the second half of our stop rule: if the network", "loses on real recordings, it isn't worth its cost for a group like ours."]] });
  },
};
