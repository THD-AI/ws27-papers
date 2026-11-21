# Section 4 – text changes for his decision

Every sentence below is new or changed in `text.md` on `feat/section4-visuals`. Nothing else in the article's text changed. Paragraphs 1 and 2 of section 4 are unchanged; paragraph 3 ("The fired checks say roughly where …") is unchanged and now stands as the passage for step 2 of the new scene, so on screen it sits beside the two guesses and on paper it reads where it did.

## Section 4: the scene `gauges` (new)

Passages marked "screen" show only on screen; on paper the caption carries them.

| Where | Text | Note |
|---|---|---|
| Step 0, screen | Picture three blocks in a row, with a glass strip where two blocks meet. | new |
| | The glass cracks if one block moves against the other, up or down. | new |
| | At each look, any cracked strip is noted and replaced. | new; the engineer's wording, needed so frame 3 of the film goes dark |
| Step 1, screen | Both strips have cracked. Which block moved? | new |
| | The move is far too small to see; only the glass shows it. | new |
| Step 2 | (paragraph 3 of section 4, unchanged) | moved into the scene, not reworded |
| Step 3, screen | If all three blocks move together, nothing cracks, so nobody can tell. | new |
| | That is the dangerous case: the level of the row was what was stored. | new |
| Caption (print and phones) | Three blocks in a row and a glass strip where two blocks meet; a strip cracks if one block moves against the other, up or down, and at each look a cracked strip is replaced. | new |
| | Both strips have cracked: the middle block moved, or both end blocks did. | new |
| | Either cracks the same two strips, so a program has to guess which it was, before the next look. | new; the ending the plan asks for |
| | If all three move together, nothing cracks, and the level of the row, the stored value, has changed unseen. | new |

## Section 4: the figure `film` (new)

| Where | Text | Note |
|---|---|---|
| In the drawing | The real chip is a square, not a row. The dots are the hidden qubits; a lit square is a cracked strip, for flips; and it looks about a million times a second. | the bridging line, exactly as plan 3.1 words it |
| In the drawing | two of the stories that fit · or | |
| Caption | Three looks at the smallest grid, one after another: nothing, then two flip-checks lit, then nothing again, although nothing was repaired, because a check lights when its answer changes. | new |
| | Two of the stories that fit the middle look: one flip in the centre, or two flips, above and below it. | new |
| | Others fit too. Constructed and checked by our script. | new |

## Words in the gauges drawing

"a glass strip where two blocks meet" · "it cracks if one block moves against the other, up or down" · "Both strips cracked since the last look. Which block moved?" · "The move is far too small to see; only the glass shows it." · "the middle one?" · "both ends?" · "either one cracks the same two strips" · "All three moved: nothing cracks, so nobody can tell, and the level of the row was what was stored." · "level before" · on paper also "all three moved".

None of "tell-tale", "elevation", "movement joint" or "joint" appears on the page.

## Credits

| Where | Before | After |
|---|---|---|
| Opening credit line ("Drawing: …") | … the cryostat after a photograph by Lars Ploughman, CC BY-SA 2.0. | … the cryostat after a photograph by Lars Ploughman, CC BY-SA 2.0; the glass strip in section 4 after photographs by Coyau, CC BY-SA 3.0. |
| "How this was made", list | – | new item: "Blocks and glass strip in section 4: the same image model, from our own line reference and photographs of a real glass strip on a wall; cracks, lit marks and words placed by code." |

Open: the credit line still starts "Drawing:" (singular) and describes the opening drawing first; "Drawings:" would be more exact. The share-alike question in `art/SOURCES.md` applies to the strip drawing too.

## Moved, no words changed

- The margin marker `:::margin qubits 4` (the rail's "the other half: the decoder") moved from the end of section 4 to after the first paragraph of section 5, where the decoder is named. Reason: section 4 now ends with a wide figure that crosses the margin column, so the rail was faded out when its marker passed and changed state unseen; `tools/motion.mjs` flagged that at 1536×864. After the move it passes.
