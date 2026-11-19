# Sources of the opening drawing

The house drawing was generated with an image model from Alexander's own reference drawing. It was not drawn by hand.

## Files

| File | What it is |
| --- | --- |
| `house.png` | The flat drawing on white, 2048×1152: the two layers below laid over each other |
| `house-line.png` | The pen line only, transparent background, ink colour `#26241F` |
| `house-field.png` | The clay field only, one flat shape, colour `#E3C9B8`, transparent background |

## How it was made

- Date: 16 November 2026.
- Tool: the Paper Studio forge, `PROJECTS/21-Paper-Studio/forge`, board `boards/house.json`.
- Model: `gpt-image-2.6-sunburst` through the OpenAI image edits endpoint, `quality=xhigh`, `complexity=high`, `background=transparent`, size 2048×1152.
- Rounds: three rounds of four candidates, twelve images in total. Approved: round 3, candidate 1 (`forge/raw/house/r3/c1.png`, copied by the forge to `forge/out/house.png`; the entry is in `forge/out/manifest.json`). The approval is an agent's first pass; Alexander has not looked yet.
- Contact sheet of all rounds: `forge/raw/house/sheet.png`.

## References passed to the model

| File | Origin | Licence |
| --- | --- | --- |
| `forge/refs/hand.png` | A crop of Alexander's own LinkedIn banner, used as the reference for the line and the colour field | Own work, all rights reserved |

No other reference was passed. No photograph of a house or of a building site was used, so there is no third-party licence to credit.

## What was done after the model

- The approved image was split into line and field with `forge/split.mjs`.
- Line layer: faint haze away from any stroke was removed (pixels that are not within two pixels of solid ink), and the ink was set to `#26241F`.
- Field layer: the thin gaps that the line left in the field were closed, only the largest piece was kept, and the colour was set to `#E3C9B8`. The model's own field was darker (about `#D9BBAA`).
- `house.png` is these two cleaned layers on white. It is therefore a little cleaner than `forge/out/house.png`, which is the untouched approved candidate on a transparent background.
- All three files were rebuilt from raw pixels. They carry no prompt, key, EXIF, XMP or C2PA data; the PNG chunks are IHDR, pHYs, IDAT and IEND only.

## The deck's drawings (19 November 2026)

Made with the Paper Studio forge (`PROJECTS/21-Paper-Studio/forge`, boards `deck-key`, `deck-plug`, `deck-wall`, `deck-chase`, `deck-duct`), model `gpt-image-2.6-sunburst`, image edits with two references each: his own line drawing (`refs/hand.png`, own work) for the hand, and one real photograph from Wikimedia Commons for the object (origin, author and licence in the forge's `refs/sources.json`: BKS door key, CC BY-SA 4.0, Pittigrilli; CEE 7/7 plug, public domain, SomnusDe; brick wall, CC BY 4.0, PantheraLeo1359531; wall chase, CC0, Georg Pik; cable duct, CC0, Stündle). Round 1, three candidates each; the approved candidate is in the forge's `out/manifest.json`. No text or numbers are generated; everything exact on a slide is drawn by code.
