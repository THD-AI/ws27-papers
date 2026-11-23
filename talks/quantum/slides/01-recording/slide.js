// Slide 1: one recording from Google's chip, read twice. The drawing is the
// forge element deck-reread (Paper Studio), split into its line and its field;
// the field is the article's blue. Names in Virgil beside the machines, the
// number in Libre Franklin under them; nothing is lettered into the drawing.
import { C, L, svgOf, T, img, frame, toArticle, DECK_ART } from '../../kit.js';

// The drawing is 1536 x 1024; its ink spans about x 0–1500, y 240–890.
const K = 0.98, OX = 150, OY = 84;
const at = (x, y) => [OX + x * K, OY + y * K];

export default {
  id: 'recording', n: 1, part: 'Motivation', builds: 2, speaker: 'A',
  title: 'One recording from Google’s chip gave two error rates.',
  clicks: ['the talk, the drawing', 'two readers, two rates'],
  draw(page, b, data) {
    const svg = svgOf(page);
    img(svg, DECK_ART + 'deck-reread-field.png', OX, OY, 1536 * K, 1024 * K);
    img(svg, DECK_ART + 'deck-reread-line.png', OX, OY, 1536 * K, 1024 * K);
    T(svg, L, 122, 'Quantum Computing seminar · TH Deggendorf · group talk, 9 January 2027', { size: 32, fill: C.muted });
    T(toArticle(svg), L, 218, 'The other half of a quantum computer', { family: 'serif', size: 84, weight: 500 });
    if (b >= 1) {
      const [m, n] = data.suppression.decoders.map((d) => d.points.find((p) => p.distance === 7).per_100000_rounds);
      const fewer = Math.round(m / (m - n));   // 171 / 28 ≈ 6: one error in six fewer
      T(svg, L, 298, this.title, { size: 48, weight: 600 });
      const [rx, ry] = at(1262, 410);
      T(svg, rx, ry, 'matching', { family: 'virgil', size: 44 });
      // below the strip, between the reel and the tower
      // ends just left of the tower it names
      const [tx, ty] = at(1170, 820);
      T(svg, tx, ty, 'a neural network', { family: 'virgil', size: 44, anchor: 'end' });
      T(svg, tx, ty + 50, 'read afterwards:', { size: 32, weight: 600, fill: C.accent, anchor: 'end' });
      T(svg, tx, ty + 92, `about one error in ${fewer === 6 ? 'six' : fewer} fewer`, { size: 32, weight: 600, fill: C.accent, anchor: 'end' });
    }
    frame(svg, {
      n: this.n, part: this.part,
      source: 'Measured: Google Quantum AI, Nature 638 (2025), distance 7. Drawing: made with an image model from Alexander Rudaev’s own line reference and photographs (film reel: CEphoto, Uwe Aranas, CC BY-SA 3.0; tower: TheJosh, public domain).',
    });
  },
};
