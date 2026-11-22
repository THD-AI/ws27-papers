# Studio: scroll telling, v2

A workbench for the figures of "The other half of a quantum computer". Each figure is built and tested here on every device before it goes into the article.

    node tools/studio.mjs                 http://localhost:8823/ (device frames) and /run.html
    node tools/studio-test.mjs run.html   the system test on every device, checked by script

## Two modes

- **Progress (the default).** A figure belongs to a run of paragraphs. Each paragraph is one step: when it reaches the reading line, the figure plays that step once, for a time set by what it shows, and rests. Scrolling back plays it backwards. A paragraph with nothing new to draw is a rest.
- **Held.** One detailed paragraph pins while the scroll sets the figure's frames directly, one frame per stretch of scroll, by a cut. ±8% hysteresis at each boundary. It holds the last frame for one more stretch, then lets go. A held paragraph has at most 60 words and six frames.

## Motion

Order: one change per step; a camera move first and alone; labels last; nothing pops (no scaling from zero, no bounce, no slide-in). The verbs, each moving like the thing it shows:

| Verb | For | Motion |
|---|---|---|
| draw | pen lines, on their first appearance | along the stroke at pen speed, in figure units |
| fire | a check lighting or going dark | a cut |
| frame | held frames | a cut |
| smear | a qubit's pattern | the real decay, over a fixed second |
| tick | time running | linear, a bounded run, then rest |
| settle | numbers and marks | fade in place, 0.3 s |
| label | words | fade, 0.25 s |
| set | any change that isn't watched: chains, jumps, returns, reduced motion | a 0.3 s cross-fade between end states |

A step lasts the sum of its parts, 0.9–2.0 s; outside that the studio flags it. Nothing loops; nothing moves 2.5 s after the scroll stops.

## Stage and layout

One sticky stage per run of chapters; figures change inside it, strictly one after the other (fade out, then the next). Consecutive chapters with the same figure continue it (a camera move, nothing thrown away). A short text-only stretch inside a run keeps the last figure as a ghost. A run starts and ends by scrolling as a block.

Layout classes, as a cascade: **stills** if the window is under 500 px high (each step a still after its paragraph; held frames as a strip); **beside** if it is at least 900 wide (and wide enough for a 28 em column plus a 440 px stage), at least 560 high and wider than tall; **top** otherwise (the stage pinned above the text, 44% of the height on phones, 40% on tablets), unless that stage would be under 260 px high, which gives stills. Heights come from a stable `100svh` probe; only a change of width or class relays out, keeping the reader's paragraph at the reading line.

## Colour

The article's palette, one job per colour: ink for what really happens on the chip; the accent for what the decoder sees and says; muted for what nobody can see any more (ghosts); field only for a lit check; hairline for quiet structure.

## System test

`tools/studio-test.mjs` reads a page on 18 device sizes: a slow read with contact sheets (and a video with `--video`), a flick of three screens and back, a toolbar-sized height change, rotation, an anchor jump and reduced motion. It checks by script: never two figures on the stage, nothing moving 2.5 s after the scroll stops, step lengths inside the clamp, held frames only moving forward on a forward scroll, lettering never under 11.5 px, the reader's paragraph kept through rotation, no replay after a jump, no played steps under reduced motion. Chromium only: iOS toolbars, momentum and printing are checked on a real iPhone.
