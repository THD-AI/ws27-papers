# WS27 papers

Two long-form articles by Alexander Rudaev, winter semester 2026/27, TH Deggendorf. Each is one web page that tells its argument while you scroll and prints as a two-column paper with Ctrl+P.

| Article | Course | Folder |
| --- | --- | --- |
| Renovate, don't repaint | Innovation Management for AI | `articles/renovate/` |
| The other half of a quantum computer | Quantum Computing seminar (group work) | `articles/other-half/` |

**State, 17 November 2026: drafts for review.** Every page carries "Draft for review" and stays out of search engines while its front matter is a draft. Everything else for search and sharing is in place: description, canonical link, Open Graph and Twitter cards with a preview image made from the article's own figure, structured data, a sitemap and icons. Set `draft: false` in an article's front matter, or drop "Draft" from its status line, to let search engines index it.

## How it is made and reviewed

The method is in [PLAYBOOK.md](PLAYBOOK.md). Each draft goes through the compound-engineering loop (brainstorm, plan, work, simplify, review, compound), and independent readers check it: twelve personas from the real audience plus fact, voice, web and performance auditors. Gates and a stop rule decide when a draft is ready.

## How it is put together

- `articles/<slug>/text.md` is the article. Each passage names its sources; scenes and figures are placed by short directives. The format is in [SPEC.md](SPEC.md).
- `articles/<slug>/sources.json` lists every source. A source id that is not in the list fails the build.
- `articles/<slug>/figures/*.js` draw the figures as SVG from `articles/<slug>/data/*.json`. No number is typed into drawing code. `FIGURES.md` in each folder says what a reader should take from each figure in five seconds.
- `articles/<slug>/art/` holds the opening drawing in two layers, with `SOURCES.md` on how it was made.
- `lib/` is the builder, the page styles and the scroll engine. `tools/` builds the source list, regenerates result data and takes review screenshots.

```
npm install
node lib/build.mjs            # writes dist/
node tools/serve.mjs          # http://localhost:8822/
node tools/shots.mjs renovate # screenshots and print PDF into .shots/
node tools/perf.mjs renovate  # scroll performance on phones, tablets and laptops
node tools/devices.mjs renovate  # read-through sheets for every device and orientation
node tools/cards.mjs          # social preview cards and site icons
```

## What was checked, and what was not

Checked: each text against its sources by an independent reviewer; the Quantum results recomputed from the raw result files and repeated by separately written code; every figure shown alone to a viewer who had not read the text; desktop, phone and print renderings looked at.

Not checked: no person other than the author has read either article. The drawings were made with an image model from the author's own line reference. The Quantum opening drawing used a photograph under CC BY-SA 2.0 as one reference; the credit is on the page, and whether share-alike applies is undecided. The Quantum article is group work and needs the group's agreement before it is made public for good.

## Publishing

The site is the `gh-pages` branch, built from `dist/`:

1. `node lib/build.mjs` builds both articles into `dist/`.
2. `node tools/deck-offline.mjs renovate --v2 --site` adds the talk as `dist/renovate/talk/` (one file, fonts and drawings embedded, not indexed). Run it after the build, which rewrites `dist/renovate/`.
3. Copy `dist/` into a fresh repository and force-push it to `gh-pages`.

The talk page: right or space for the next page, left for back, N for the speaker notes, F for full screen. In full screen (F, F11 or a window the size of the screen) the notes are hidden.

## How this was made

Research, code, drafts, figures and reviews were done with AI assistants under the author's direction. The questions, the choice of sources and every claim are the author's responsibility.
