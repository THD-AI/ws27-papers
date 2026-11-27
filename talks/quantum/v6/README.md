# The talk, 18 pages: v6

The 15-minute group talk "The other half of a quantum computer", Quantum Computing seminar, TH Deggendorf, 9 January 2027. Eighteen pages, four of them built in steps, and nine backups for questions. v6 keeps v5's story and numbers and redraws every page so the talk can be followed from the back of the room.

## What changed from v5

- **Two colours, one meaning each.** Amber is what the chip says: a slip, a fired check, a frame of hints. Blue is what the reader decides: the decoder, its guess, its number. Everything else is ink or one grey. No pale tint carries meaning without a full-strength outline of its colour.
- **Two layouts.** A pair of equal halves around a gutter, or one full-width sequence. Comparisons, time and cause run left to right.
- **One code.** A frame is always a film frame. An error is a black disc with its letter; the decoder's guess is a blue ring with its letter. A fired check is an amber outline with a dot.
- **The spine.** Along the foot of every page from page 3 on: the chip, a short film of frames, the reader. The part the page is about is lit in its colour. Page 3 draws the spine large; page 17 shows it as the drawing.
- **Builds.** Pages 3, 4, 5, 7, 8, 9, 11, 12, 13 and 14 add one part per click, as the Renovate talk does (43 frames in all).
- **The ending returns to the beginning.** Page 18 brings back page 1's drawing with the question.

Each page was checked sharp and blurred (the back row, or no glasses). Independent reviewers then went through it: error hunts per page, a flow reading against the Renovate talk, a fact check and a panel of three. The previous version, v5, is kept under the tag `archive/quantum-deck-v5`.

## Files

```
index.html   the source: every page drawn in code at 1920 × 1080 from the article's
             own figure code and data; build steps are drawn by build()
player.html  the player the build pours the pages into (the Renovate talk's player)
notes.md     what is said on each page, and the field's word for it, said once
heap.png     the drawing on pages 1, 10 and 18
read.png     the drawing on page 17 (new in v6: page 1's scene resolved)
raw/         heap.png and read.png as the forge made them
```

## Look, present, publish

- **Look:** serve the repository root (`node tools/serve.mjs`) and open `talks/quantum/v6/index.html`.
- **Present:** `node tools/qtalk-site.mjs` writes `.shots/deck/quantum-v6/quantum-talk.html`, one file with everything embedded. Keys: Right, Space, a click or the wheel for the next step; Left back; G to a page number; N notes; F full screen; P presenter mode in two windows. Ctrl+P prints each page once, complete. Nothing but the slide shows on screen: the key hint that sat on the dark bars around it is gone (27 Nov).
- **Publish:** after `node lib/build.mjs`, `node tools/qtalk-site.mjs --site`, then `node tools/talk-card.mjs`, then deploy `dist/` as the main README says. `--deck <folder>` builds another deck folder under `talks/quantum/` (v6 is the only one now).

## The drawings

`heap.png` (pages 1, 10 and 18) comes from v5: Paper Studio forge, board `talk-heap`, round 2, candidate 1. References: the author's own line drawing (the hand); the companion deck's approved line; "IBM Q at CES" by Lars Ploughman, CC BY-SA 2.0 (Wikimedia Commons), for the refrigerator's silhouette only. `raw/heap.png` is the drawing as the forge made it.

It was cleaned for the big screen the way the Renovate drawings were: `python tools/clean-drawing.py raw/heap.png heap.png`. The haze between the strokes is removed, every stroke is solid ink (`#2E2C27`, the deck's pencil), and the image is doubled to 3072 × 1728 so the edges hold at 4K. As the forge made it, the strokes were partly see-through and looked grey and soft on a 4K screen.

**Credit.** "Drawings after a photograph by Lars Ploughman, CC BY-SA 2.0". It is in the speaker notes of page 1 (`notes.md`), not on the slide. The first, sixteen-slide deck (tag `archive/quantum-deck-16`) printed it in its references panel, with the photographs behind that deck's own drawings: CEphoto, Uwe Aranas (the film reel, CC BY-SA 3.0), TheJosh (the desk computer, public domain) and Dsv (the rack servers, public domain, a reference for the article's opening drawing).

`read.png` is new: Paper Studio forge, board `talk-read2`, round 1, candidate 2. References: v5's `heap.png` as the forge made it, now `raw/heap.png` (so the refrigerator and film are the same as on page 1); the companion deck's approved line; the article's film-and-cable drawing, for the computer. Cleaned with `python tools/clean-drawing.py raw/read.png read.png`. It replaces v5's page-17 drawing, whose refrigerator was cut off by the edge.

## Open ideas

- **How to show the keys.** The on-screen hint was removed; a clearer way to show a first-time presenter the keys is still to be found. Until then they are listed here only.
