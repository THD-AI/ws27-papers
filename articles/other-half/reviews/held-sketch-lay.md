# Held scene, film sketch – lay reader five-second test

Reader: curious non-specialist (business/history background), reads long explainers on phone and laptop, knows quantum computing from headlines only.

One caveat on method: each PNG is a contact sheet, so steps 0–3 sat in my peripheral view while I looked at step 4. I tried to look only at step 4, but I can't swear the earlier panels had no influence.

## 1. First impressions (step 4, about five seconds each, not revised)

**Film A, wide, step 4:** "Eight snapshots of the same little machine. Something happened just before snapshot 3 (the circled X), and two squares lit up there and are tied together. A bump on the right edge lit up in snapshots 5 and 6, and a curve ties those two together across time."

**Film C, wide, step 4:** "A table: named things (z0 to x3) down the side, rounds 1 to 8 across the top. In round 3 two neighbouring rows light up and are joined by a vertical tick, which goes with an X on the little map and the words 'flip on qubit 4'. Row z3 lights up in rounds 5 and 6, joined by a horizontal bar."

## 2. After reading sections 3 and 4 and all steps, wide and tall

The intended message, in five parts:

1. The output is a series of rounds.
2. In each round all 8 checks answer.
3. A flip lights neighbouring checks in one round.
4. A check that reports wrongly lights the same check in two rounds in a row.
5. The decoder pairs lights across rounds, not round by round.

| Part | Film A | Film C |
|---|---|---|
| 1. A series of rounds | Yes. The row of numbered grids reads as frames of a film, which fits the section title. | Yes, and faster. The column numbers and "round →" say it outright. |
| 2. All 8 checks answer each round | Only in theory. I can't count 8 answers in a tiny grid, and the dots don't read as "answers". | Yes. A full column of 8 cells is one round, and it's obvious every row has an entry. |
| 3. A flip lights neighbouring checks in one round | Half. Two squares light in round 3 and they touch, so "neighbouring" comes through. But the X sits *between* grids 2 and 3, so I read it as "an event in time", not "a hit on a qubit". Qubit 4 never appears. | Yes, if I look at the map. The X sits on a corner between z0 and z1 on the map, and the same two rows light in the table. The dashed line and "flip on qubit 4" tie it to round 3. |
| 4. A wrong report lights the same check twice in a row | Weak. I have to compare the same small half-circle across two little grids. The article's "fires twice in a row" only clicked when I read the caption. | Strong. Same row, two cells side by side. This is the clearest thing in either film. |
| 5. The decoder pairs across rounds, not round by round | Partly. The arc from 5 to 6 shows a link across time, but nothing says who draws the links, and the diagonal in round 3 looks like part of the picture rather than a pairing. | Mostly. A vertical link (same round) next to a horizontal link (across rounds) matches "across the chip and along time" exactly. The word "decoder" is missing, so I don't know these links are someone's guess. |

Overall, A gets me to "things light up over time and some are linked". C gets me to the actual message, minus who does the pairing.

## 3. What confused me

- **z0 / x3 labels (C):** meaningless to me at first. After section 3 I guessed z and x are the two kinds of check (flips and phase errors), but the figure never says so, and I'm not sure which is which. In the tall version some labels look tinted differently, and I can't tell whether that colour means anything.
- **The X:** in A it floats between two rounds, so I read it as time, not as a qubit. In C it sits on the map, which works better, but there's no "4" on the map, so "flip on qubit 4" is something I have to take on trust.
- **The dashed line (C):** after a moment I read it as "the flip happened here". It's fine, but it nearly blends into the grid.
- **The arc (A):** clear as a link, but it dips below the grids like a decoration, and in step 4 it's the only obviously drawn thing, so it takes more weight than the round-3 pair.
- **The dots:** every cell (C) and every square (A) has a small dot. I couldn't tell whether a dot means "answered, nothing wrong" or "here is a check". With no legend, the blue dot reads as "something happened" only because it's blue and bigger.
- **The "…":** after the footer line I took it as "more rounds before and after", and that's fine. In A step 0, the lone "…" at the bottom right of an otherwise empty panel looks like a stray mark.
- **The map and table aren't linked (C):** the map never lights z0, z1 or z3, so I keep looking back and forth to match names.
- **"Pairs" in step 4:** nothing in the picture says what pairing achieves or who does it.

## 4. On my phone

C. The tall table still reads as a table at phone width: rows and columns survive, and same row vs same column is easy to see. A's tall version is nine near-identical small drawings over three rows, the lit half-circle is a few pixels wide, and the 3-column wrap breaks the "film strip" feeling.

## 5. Scores ("I got it", 1–10)

- **Film A:** 5
- **Film C:** 8

## 6. One-line fixes

- C: say what the rows are – group them as "flip checks" and "phase checks" (or plain names), and put a "4" on the map's qubit.
- C: light the fired checks on the map as well (z0 and z1 in round 3, z3 in rounds 5–6), so map and table visibly connect.
- C step 4: name who draws the links and what each one means – for example, "the decoder pairs them: one flip, one wrong report".
- A, if it stays: put the X on the qubit inside the round-3 grid, not between rounds, and drop the stray "…" in step 0.
