# The opening drawing

`hero-line.png` and `hero-field.png` are the two layers of one drawing: the pen line, and the one colour field behind it. Both are 1536 × 1024 px with a transparent background. They are unchanged copies of `scenes/other-half/layers/whole-line.png` and `whole-field.png` in the Paper Studio (`PROJECTS/21-Paper-Studio`), copied on 16 November 2026.

| File | SHA-256 |
| --- | --- |
| `hero-line.png` | `c0dd67ed0e68880006f599dd849675aab26618784b1a77c3e4ee4f6db9c97f03` |
| `hero-field.png` | `854d2843295b252985cc514d054d08a70969c99ddf614fcb458db2951f95387f` |

## How it was made

The drawing was made by an image model (OpenAI image API, model `gpt-image-2.6-sunburst`, as recorded in the forge's `raw/whole/r2/draw.json`), not by hand. The model was given three references and a written board (`forge/boards/whole.json`): Alexander Rudaev's own line reference for the hand, and two photographs of real hardware for the objects. The approved image is candidate 2 of round 2 of the board `whole` (15 November 2026). It was then split by colour into the line layer and the field layer with `forge/split.mjs`. Nothing was redrawn or retouched.

No text, number or mark on the page comes from the model. The chip, the checks and every number are exact marks placed on top by the page.

## References, as recorded in the forge's `refs/SOURCES.md`

| Reference | What it is | Page | Author | Licence |
| --- | --- | --- | --- | --- |
| `hand.png` | The hand: a crop of Alexander's own LinkedIn banner | – | Alexander Rudaev | Own work, all rights reserved |
| `cryostat-ibm-q-ces.jpg` | "IBM Q at CES": the open dilution refrigerator of an IBM superconducting quantum computer, front view | https://commons.wikimedia.org/wiki/File:IBM_Q_at_CES_(39660636671).jpg | Lars Ploughman (via Flickr) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| `dell-poweredge.jpg` | "Dell PowerEdge Servers": two rack servers in a rack | https://commons.wikimedia.org/wiki/File:Dell_PowerEdge_Servers.jpg | Dsv | Public domain (released by the author) |

The photographs themselves are not in this repository and are not published.

## Credit

The forge's record asks for this credit when a drawing made from the cryostat photograph is published:

> after a photograph by Lars Ploughman, CC BY-SA 2.0

It stands in `text.md` in the line that starts with `Drawing:`.

## Open

The forge's record says: "Whether a loose pen drawing of a real machine counts as an adaptation under the share-alike clause is a legal question that has not been checked; decide it before the page goes public." That is still undecided. If the drawing counts as an adaptation, it would have to be offered under CC BY-SA as well.
