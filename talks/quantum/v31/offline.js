// Entry for the esbuild bundle (tools/v31-bundle.mjs): JSON inlined, no fetch.
import P from './pages.json';
import F from './facts.json';
import N from './notes.json';
import { app } from './app.js';

document.fonts.ready
  .then(() => Promise.all(['500 44px "Libre Franklin"', '600 44px "Libre Franklin"', '400 30px "Libre Franklin"', '400 56px "Newsreader"'].map((f) => document.fonts.load(f))))
  .then(() => app(P, F, N));
