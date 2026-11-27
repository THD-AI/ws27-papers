# The talk, 18 pages

The 15-minute group talk "The other half of a quantum computer", Quantum Computing seminar, TH Deggendorf, 9 January 2027. Eighteen pages and nine backups for questions. It replaces the sixteen-slide deck in `talks/quantum/` (still there, still buildable) on the site.

## Files

```
player.html  the player the build pours the pages into
index.html   the source: every page drawn in code at 1920 × 1080 from the article's
             own figure code (lib/fig.js, articles/other-half/figures/) and data
notes.md     what is said on each page, and the field's word for it, said once
heap.png     the drawing on pages 1 and 10, cleaned (see below)
read.png     the drawing on page 17, cleaned
raw/         the two drawings as the forge made them
```

## Look, present, publish

- **Look at every page:** serve the repository root (`node tools/serve.mjs`) and open `talks/quantum/v5/index.html`. All pages are drawn one under the other.
- **Present:** `node tools/qtalk-site.mjs` writes `.shots/deck/quantum-v5/quantum-talk.html`: the player (`player.html`) with every page, the drawings and the fonts embedded, no network needed. It is the Renovate talk's player, with the same keys:
  - Right, Space, Enter, a click or the mouse wheel: next. Left or Backspace: back. Home and End. G: go to a page. N: notes. F: full screen (the notes hide).
  - The wheel matters for a remote: the Flipper's Slides page (duckwalk) scrolls the wheel; it sends no arrow keys. One notch is one page.
  - P: presenter mode. This window becomes the presenter's (the page now, the next one, a clock against 15:00, the notes, buttons) and a second window opens with the slide alone. Drag that one to the projector and press F there. Both windows move together, whichever one gets the key, click or scroll.
  - Ctrl+P: every page, one per sheet.
- **Publish:** after `node lib/build.mjs`, run `node tools/qtalk-site.mjs --site`. It writes the same file as `dist/other-half/talk/index.html`. Then deploy `dist/` to `gh-pages` as the main README says.

## The drawings

| File | Made from |
|---|---|
| `heap.png` | Paper Studio forge, board `talk-heap`, round 2, candidate 1. References: the author's own line drawing (the hand); the companion deck's approved line; "IBM Q at CES" by Lars Ploughman, CC BY-SA 2.0 (Wikimedia Commons), for the refrigerator's silhouette only |
| `read.png` | Paper Studio forge, board `talk-read`. References: the author's own line drawing; the companion deck's approved line; the article's film-and-cable drawing (`articles/other-half/art/`) |

Both were cleaned for the big screen the way the Renovate drawings were: `python tools/clean-drawing.py raw/heap.png heap.png` (and the same for `read.png`). The haze between the strokes is removed, every stroke is solid ink (`#2E2C27`, the deck's pencil), and the image is doubled to 3072 × 1728 so the edges hold at 4K. As the forge made them, the strokes were partly see-through and looked grey and soft on a 4K screen.

The talk page credits the photograph: "Drawings after a photograph by Lars Ploughman, CC BY-SA 2.0".
