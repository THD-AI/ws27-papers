// The questions slide: the article's opening drawing, the talk's name linked
// to the article (no QR code), its address as text.
import { C, L, svgOf, T, frame, img, ART, toArticle } from '../../kit.js';

export default {
  id: 'questions', n: '', end: true, part: '', builds: 1,
  title: 'Questions',
  clicks: ['questions'],
  draw(page) {
    const svg = svgOf(page);
    const k = 0.74;
    img(svg, ART + 'hero-field.png', 760, 190, 1536 * k, 1024 * k);
    img(svg, ART + 'hero-line.png', 760, 190, 1536 * k, 1024 * k);
    T(svg, L, 200, 'Questions', { size: 96, weight: 600 });
    const a = toArticle(svg);
    T(a, L, 310, 'The other half of', { family: 'serif', size: 56, weight: 500 });
    T(a, L, 372, 'a quantum computer', { family: 'serif', size: 56, weight: 500 });
    T(a, L, 440, 'thd-ai.github.io/ws27-papers/other-half', { size: 32, fill: C.accent });
    frame(svg, { source: 'Drawing: made with an image model from Alexander Rudaev’s own line reference and photographs; the cryostat after a photograph by Lars Ploughman, CC BY-SA 2.0.' });
  },
};
