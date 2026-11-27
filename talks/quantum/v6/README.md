# The talk, 18 pages: v6

The 15-minute group talk "The other half of a quantum computer", Quantum Computing seminar, TH Deggendorf, 9 January 2027. Eighteen pages, four of them built in steps, and nine backups for questions. v6 keeps v5's story and numbers and redraws every page so the talk can be followed from the back of the room.

## What changed from v5

- **Two colours, one meaning each.** Amber is what the chip says: a slip, a fired check, a frame of hints. Blue is what the reader decides: the decoder, its guess, its number. Everything else is ink or one grey. No pale tint carries meaning without a full-strength outline of its colour.
- **Two layouts.** A pair of equal halves around a gutter, or one full-width sequence. Comparisons, time and cause run left to right.
- **One code.** A frame is always a film frame. An error is a black disc with its letter; the decoder's guess is a blue ring with its letter. A fired check is an amber outline with a dot.
- **The spine.** Along the foot of every page from page 3 on: the chip, a short film of frames, the reader. The part the page is about is lit in its colour. Page 3 draws the spine large; page 17 shows it as the drawing.
- **Builds.** Pages 3, 4, 13 and 14 add one part per click, as the Renovate talk does (35 frames in all).
- **The ending returns to the beginning.** Page 18 brings back page 1's drawing with the question.

Each page was checked sharp and blurred (the back row, or no glasses). Independent reviewers then went through it: error hunts per page, a flow reading against the Renovate talk, a fact check and a panel of three. The previous version is still in `talks/quantum/v5/`.

## Files

```
index.html   the source: every page drawn in code at 1920 × 1080 from the article's
             own figure code and data; build steps are drawn by build()
pilot.html   the pilot: pages 1, 4, 8 and 14 in two colour systems (?v=A, ?v=B)
player.html  the player the build pours the pages into (the Renovate talk's player)
notes.md     what is said on each page, and the field's word for it, said once
heap.png     the drawing on pages 1, 10 and 18
read.png     the drawing on page 17 (new in v6: page 1's scene resolved)
raw/         read.png as the forge made it
```

## Look, present, publish

- **Look:** serve the repository root (`node tools/serve.mjs`) and open `talks/quantum/v6/index.html`.
- **Present:** `node tools/qtalk-site.mjs` writes `.shots/deck/quantum-v6/quantum-talk.html`, one file with everything embedded. Keys as in v5: Right, Space, a click or the wheel for the next step; Left back; G to a page number; N notes; F full screen; P presenter mode in two windows. Ctrl+P prints each page once, complete. Nothing but the slide shows on screen: the key hint that sat on the dark bars around it is gone (27 Nov).
- **Publish:** after `node lib/build.mjs`, `node tools/qtalk-site.mjs --site`, then `node tools/talk-card.mjs`, then deploy `dist/` as the main README says. `--deck v5` builds the earlier version.

## The drawings

`heap.png` is v5's, cleaned for 4K (see `talks/quantum/v5/README.md` for its sources and credits).

`read.png` is new: Paper Studio forge, board `talk-read2`, round 1, candidate 2. References: v5's `heap.png` as the forge made it (so the refrigerator and film are the same as on page 1); the companion deck's approved line; the article's film-and-cable drawing, for the computer. Cleaned with `python tools/clean-drawing.py raw/read.png read.png`. It replaces v5's page-17 drawing, whose refrigerator was cut off by the edge.

## Open ideas

- **How to show the keys.** The on-screen hint was removed; a clearer way to show a first-time presenter the keys is still to be found. Until then they are listed here only.
