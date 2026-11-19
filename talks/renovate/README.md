# The talk deck: Renovate, don't repaint

Innovation Management for AI, TH Deggendorf, 12 December 2026. Sixteen slides, an end slide for the questions and six backups, drawn in code from the article's data (`articles/renovate/data`) with the hero drawing from `articles/renovate/art`.

- **Present:** serve the repository root (for example `python -m http.server 8830`) and open `talks/renovate/index.html`. Right, Space or a click: next build. Left: back. N: speaker notes. Home and End.
- **PDF, one page per build:** `node tools/deck.mjs` writes `.shots/deck/renovate/renovate-deck.pdf`, every page as PNG, review sheets, the gates (`gates.txt`: lettering floors, nothing off the page, no overlaps) and the cue sheet [CUES.md](CUES.md).
- **Offline, for the room:** `node tools/deck-offline.mjs` writes `.shots/deck/renovate/renovate-talk.html`: one file, every build pre-drawn, fonts and drawing embedded, no server or network. Double-click, F11, then Right/Left; N for notes, G to jump to a page (backups via the cue sheet). Rebuild it after any change to a slide.
- **Change a slide:** `slides.js`. Each slide is `draw(page, build, data, ctx)`; the title (the line said) arrives with the last build.
- **The plan behind it:** dotUni `docs/papers/talks/innovation/` (storyline, slides, rehearsal) and the reader reports in its `readers/deck-*`.
