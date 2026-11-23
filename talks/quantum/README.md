# The talk deck: The other half of a quantum computer

Quantum Computing seminar, TH Deggendorf, group talk, Saturday 9 January 2027, 15 minutes. Sixteen slides (fifteen and the questions), eight backups for the questions. Every number comes from the article (`articles/other-half`) or its data files; every slide is drawn in code at 1920 × 1080 from the article's own figure code (`figures/shared.js`), with one new drawing on slide 1.

## Present

- **Live, from this folder:** serve the repository root (`node tools/serve.mjs` or `python -m http.server 8830`) and open `talks/quantum/index.html`. Right, Space or a click: next build. Left: back. N: speaker notes. G: go to a page. Home and End.
- **One slide alone:** `index.html?only=<slide id>` (for example `?only=clock`).
- **The talk's page, one file:** `node tools/qdeck-site.mjs` writes `.shots/deck/quantum/quantum-talk.html` (with `--site` also `dist/other-half/talk/index.html`): every slide as drawn, fonts and drawings embedded, a bar with the article, contents, references and thanks, speaker notes (N), full screen (F). **Ctrl+P prints every slide, one per page** (save as PDF). Present from this file.
- **PDF and pictures:** `node tools/qdeck.mjs` writes every build as a PNG into its slide's `export/` folder, the PDF and contact sheets into `.shots/deck/quantum/`, a projector pass (1024 × 768, lifted blacks) into `.shots/deck/quantum/projector/`, the gates into `gates.txt`, and the cue sheet `CUES.md` with the timing from the notes.

## The folders

```
slides/01-recording/   one folder per slide, in talk order
  slide.js             the drawing: draw(page, build, data). Change the slide here
  notes.md             what is said. The bold line is the landing, said as the slide's title
  sources.md           where every number on the slide comes from
  export/p1.png …      one picture per build (written by tools/qdeck.mjs; don't edit)
slides/b1-…/           backups, the same four parts
kit.js                 the shared page: colours, type, frame, the grid at slide size
slides.js              the order of the talk (rename a folder: change it here too)
art/                   the deck's own drawing and its licences
CUES.md                generated: page, slide, start time, what each click adds, the landing
```

## Speakers

`slide.js` names a speaker part for each slide: A (1–8), B (9–15). One speaker takes both. The cue sheet adds 8 seconds at the change of speaker.

## How the slides are made

- **The article's own figures** (`kit.js` `articleFigure`): the figure module from `articles/other-half/figures/` is mounted at a narrow width and scaled up, so the drawing is the article's and its lettering lands at 22–38 px. Slides 4–12 and B5.
- **Hand sketches** (`kit.js` `inkLayer`, rough.js, the library Excalidraw uses; Virgil, Excalidraw's face): where the article has no figure (slides 2, 3, 13) and as marks on a figure (an arrow, a ring, a short note), never a copy of a label.
- **Slide versions in the article's style** where an article figure is too dense for a projector (slide 14).

## The rules the deck keeps

- One meaning for blue per part: on the grid slides (3–10) a check that fired; on the results slides (1, 11–15) the network. The pale field never carries meaning alone.
- Every line that carries meaning is at least 3 px; text at least 32 px on main slides, 24 on backups and in the source line.
- Every slide's source line says what it shows: measured (by whom), simulated or counted (ours), or schematic.
- No QR codes; the talk's name links to the article in the HTML deck.
