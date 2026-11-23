# The talk deck: Renovate, don't repaint

Innovation Management for AI, TH Deggendorf, 12 December 2026. V2 has sixteen slides, a questions slide and five backups. The drawings use the article's data and art from `articles/renovate/`.

- **Offline, for the room.** Run `node tools/deck-offline.mjs renovate --v2` to write `.shots/deck/renovate-v2/renovate-talk.html` with all builds, fonts and drawings embedded. Open it in Edge and press F11. Right or Space advances. Left goes back. G jumps to a page and N shows notes in a window.
- **PDF and cues.** Run `node tools/deck.mjs renovate --v2` from the same revision. It writes `.shots/deck/renovate-v2/renovate-deck.pdf`, build PNGs, review sheets, `gates.txt` and [CUES-v2.md](CUES-v2.md). PDF pages and the offline viewer use the same build numbers.
- **Edit V2 in `slides2.js`.** Serve the repository root locally and open `talks/renovate/index.html?v=2` to preview. Each slide defines its drawing, notes and click cues.
- **The plan behind it:** dotUni `docs/papers/talks/innovation/` (storyline, slides, rehearsal) and the reader reports in its `readers/deck-*`.
