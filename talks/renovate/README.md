# The talk deck: Renovate, don't repaint

Innovation Management for AI, TH Deggendorf, 12 December 2026. Sixteen slides, an end slide for the questions and five backups (46 pages, one per build), drawn in code from the article's data (`articles/renovate/data`) with the deck drawings from `articles/renovate/art` (`deck-*.png`). The first deck (v1) is kept under the tag `archive/renovate-deck-v1`.

- **Present:** serve the repository root (for example `python -m http.server 8830`) and open `talks/renovate/index.html`. Right, Space or a click: next build. Left: back. N: speaker notes. Home and End.
- **PDF, one page per build:** `node tools/deck.mjs` writes `.shots/deck/renovate-v2/renovate-deck.pdf`, every page as PNG, review sheets, the gates (`gates.txt`: lettering floors, nothing off the page, no overlaps) and the cue sheet [CUES-v2.md](CUES-v2.md).
- **Offline, for the room:** `node tools/deck-offline.mjs` writes `.shots/deck/renovate-v2/renovate-talk.html`: one file, every build pre-drawn, fonts and drawings embedded, no server or network. Double-click, F11, then Right/Left; N for notes, G to jump to a page (backups via the cue sheet). Rebuild it after any change to a slide.
- **Change a slide:** `slides2.js`. Each slide is `draw(page, build, data, ctx)`; the title (the line said) is on the page from the first build.
- **Old commands:** `--v2` (and `?v=2` in the address) are still accepted and change nothing.
- **The plan behind it:** [CONCEPT.md](CONCEPT.md) and [LESSONS.md](LESSONS.md); dotUni `docs/papers/talks/innovation/` (storyline, slides, rehearsal) and the reader reports in its `readers/deck-*`.
