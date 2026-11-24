// Entry for the esbuild bundle (tools/v31-bundle.mjs): JSON inlined, no fetch.
import P from './pages.json';
import F from './facts.json';
import { start } from './main.js';

document.fonts.ready.then(() => start(P, F));
