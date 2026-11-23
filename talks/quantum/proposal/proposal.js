import { C, L, R, T, frame, img, ln, rc, svgOf } from '../kit.js';

const source = new URL('../../../articles/other-half/data/learning.json', import.meta.url);
const response = await fetch(source);
if (!response.ok) throw new Error(`Unable to load simulation results: ${response.status}`);
const results = await response.json();
const distanceFive = results.panels.find((panel) => panel.id === 'd5-250m');
const percent = (rate) => `${(rate * 100).toFixed(2)}%`;

await document.fonts.ready;

const question = svgOf(document.querySelector('#question'));
question.setAttribute('aria-label', 'A quantum recording passes through a reel to two different decoders.');
const art = new URL('../art/', import.meta.url);
for (const name of ['deck-reread-field.png', 'deck-reread-line.png']) {
  img(question, new URL(name, art).href, 150, 133, 1413, 942);
}
T(question, L, 132, 'Quantum Computing seminar · TH Deggendorf · 11 December 2026', { size: 32, fill: C.muted });
T(question, L, 229, 'The other half of a quantum computer', { family: 'serif', size: 82, weight: 500 });
T(question, L, 315, 'When is it worth training a decoder?', { size: 46, weight: 600 });
T(question, R, 526, 'matching', { size: 36, anchor: 'end' });
T(question, R, 779, 'neural network', { size: 36, anchor: 'end' });
frame(question, {
  n: 1, part: 'Proposal',
  source: 'Google Quantum AI, Nature 638 (2025). Drawing generated from Alexander Rudaev’s line reference and photos: reel by CEphoto, Uwe Aranas (CC BY-SA 3.0), tower by TheJosh (public domain).',
});

const comparison = svgOf(document.querySelector('#comparison'));
comparison.setAttribute('aria-label', 'At 0.5% simulated noise, the network ranks between plain matching and correlated matching.');
frame(comparison, {
  n: 2, part: 'Proposal',
  title: 'Training put our network between the two matchers',
  source: 'Source: our Stim distance-5 memory experiment, OWN-D5-250M. Five seeds; 2 million test runs per seed at the displayed noise level.',
});
T(comparison, L, 255, `Distance 5 · ${(results.noise_level * 100).toFixed(1)}% simulated noise · share of runs that ended wrong`, { size: 36, fill: C.muted });

const rows = [
  ['Correlated matching', distanceFive.levels.correlated.rate, C.ink],
  ['Neural network', distanceFive.final_network.mean, C.accent],
  ['Plain matching', distanceFive.levels.plain.rate, C.ink],
];
const x = 675;
const unit = 64_000;
ln(comparison, x, 327, x, 790, { stroke: C.muted });
rows.forEach(([label, rate, ink], index) => {
  const y = 394 + index * 163;
  T(comparison, L, y + 20, label, { size: 47, weight: 600, fill: ink });
  if (label === 'Neural network') {
    const millions = Math.round(distanceFive.curves[0].points.at(-1).training_shots / 1e6);
    T(comparison, L, y + 69, `about ${millions} million training examples`, { size: 30, fill: C.muted });
  }
  rc(comparison, x, y - 23, rate * unit, 48, { fill: ink, stroke: 'none' });
  T(comparison, x + rate * unit + 35, y + 19, percent(rate), { size: 50, weight: 600, fill: ink });
});
T(comparison, x, 835, '0%', { size: 28, fill: C.muted, anchor: 'middle' });
T(comparison, R, 913, 'Would it carry over to chip recordings?', { size: 38, weight: 600, anchor: 'end' });
